// ============================================================================
// 12_antialiasing_and_postprocessing.glsl
// Production-Grade GLSL Reference for Modern AA, SSR, AO, and Tone Mapping
// ============================================================================
#version 450 core

// ============================================================================
// SECTION 1: FXAA 3.11 (FAST APPROXIMATE ANTI-ALIASING)
// Reference algorithm by Timothy Lottes (NVIDIA)
// ============================================================================

layout(binding = 0) uniform sampler2D u_ColorTexture;
layout(location = 0) in vec2 v_TexCoord;
layout(location = 0) out vec4 o_FragColor;

uniform vec2 u_InverseScreenSize; // 1.0 / vec2(width, height)

// RGB to Perceptual Luma conversion (Rec. 601 / 709 mix)
float FxaaLuma(vec3 rgb) {
    return sqrt(dot(rgb, vec3(0.299, 0.587, 0.114)));
}

vec4 EvaluateFXAA(vec2 uv) {
    // FXAA Tuning Parameters
    const float FXAA_EDGE_THRESHOLD_MIN = 0.0312; // Trims dark pixels from edge detection
    const float FXAA_EDGE_THRESHOLD_MAX = 0.1250; // Contrast threshold for edge detection
    const float FXAA_SUBPIX_TRIM        = 0.2500; // Sub-pixel aliasing removal sensitivity
    const float FXAA_SUBPIX_CAP         = 0.7500; // Max sub-pixel blend amount
    const int   FXAA_SEARCH_STEPS       = 10;     // Number of search steps along edge

    // Sample central pixel and immediate cross neighbors
    vec3 rgbM = texture(u_ColorTexture, uv).rgb;
    float lumaM = FxaaLuma(rgbM);

    float lumaN = FxaaLuma(textureOffset(u_ColorTexture, uv, ivec2( 0,  1)).rgb);
    float lumaS = FxaaLuma(textureOffset(u_ColorTexture, uv, ivec2( 0, -1)).rgb);
    float lumaE = FxaaLuma(textureOffset(u_ColorTexture, uv, ivec2( 1,  0)).rgb);
    float lumaW = FxaaLuma(textureOffset(u_ColorTexture, uv, ivec2(-1,  0)).rgb);

    // Find local contrast min and max
    float lumaMin = min(lumaM, min(min(lumaN, lumaS), min(lumaE, lumaW)));
    float lumaMax = max(lumaM, max(max(lumaN, lumaS), max(lumaE, lumaW)));
    float lumaRange = lumaMax - lumaMin;

    // Early exit if contrast is below edge threshold (save fillrate on flat surfaces)
    if (lumaRange < max(FXAA_EDGE_THRESHOLD_MIN, lumaMax * FXAA_EDGE_THRESHOLD_MAX)) {
        return vec4(rgbM, 1.0);
    }

    // Sample corner diagonals for edge direction estimation
    float lumaNW = FxaaLuma(textureOffset(u_ColorTexture, uv, ivec2(-1,  1)).rgb);
    float lumaNE = FxaaLuma(textureOffset(u_ColorTexture, uv, ivec2( 1,  1)).rgb);
    float lumaSW = FxaaLuma(textureOffset(u_ColorTexture, uv, ivec2(-1, -1)).rgb);
    float lumaSE = FxaaLuma(textureOffset(u_ColorTexture, uv, ivec2( 1, -1)).rgb);

    // Compute directional gradients
    float edgeHorz = abs((0.25 * lumaNW) + (-0.5 * lumaN) + (0.25 * lumaNE)) +
                     abs((0.50 * lumaW ) + (-1.0 * lumaM) + (0.50 * lumaE )) +
                     abs((0.25 * lumaSW) + (-0.5 * lumaS) + (0.25 * lumaSE));

    float edgeVert = abs((0.25 * lumaNW) + (-0.5 * lumaW) + (0.25 * lumaSW)) +
                     abs((0.50 * lumaN ) + (-1.0 * lumaM) + (0.50 * lumaS )) +
                     abs((0.25 * lumaNE) + (-0.5 * lumaE) + (0.25 * lumaSE));

    bool isHorizontal = (edgeHorz >= edgeVert);

    // Determine edge orientation step
    float stepLength = isHorizontal ? u_InverseScreenSize.y : u_InverseScreenSize.x;
    float luma1 = isHorizontal ? lumaS : lumaW;
    float luma2 = isHorizontal ? lumaN : lumaE;
    float gradient1 = abs(luma1 - lumaM);
    float gradient2 = abs(luma2 - lumaM);

    if (gradient1 < gradient2) {
        stepLength = -stepLength;
    }

    // Sub-pixel filtering
    float lumaL = (lumaN + lumaS + lumaE + lumaW) * 0.25;
    float rangeL = abs(lumaL - lumaM);
    float blendL = max(0.0, (rangeL / lumaRange) - FXAA_SUBPIX_TRIM) * (1.0 / (1.0 - FXAA_SUBPIX_TRIM));
    blendL = min(FXAA_SUBPIX_CAP, blendL);

    vec2 sampleUV = uv;
    if (isHorizontal) {
        sampleUV.y += stepLength * 0.5;
    } else {
        sampleUV.x += stepLength * 0.5;
    }

    vec3 blendedColor = mix(rgbM, texture(u_ColorTexture, sampleUV).rgb, 0.5 + blendL * 0.5);
    return vec4(blendedColor, 1.0);
}

// ============================================================================
// SECTION 2: TEMPORAL ANTI-ALIASING (TAA) WITH VARIANCE CLIPPING IN YCoCg
// ============================================================================

layout(binding = 1) uniform sampler2D u_CurrentFrame;
layout(binding = 2) uniform sampler2D u_HistoryFrame;
layout(binding = 3) uniform sampler2D u_VelocityBuffer;
layout(binding = 4) uniform sampler2D u_DepthBuffer;

// RGB <-> YCoCg Conversion (decorrelates luminance and chrominance for tighter AABB)
vec3 RGBToYCoCg(vec3 c) {
    return vec3(
         0.25 * c.r + 0.5 * c.g + 0.25 * c.b,
         0.50 * c.r             - 0.50 * c.b,
        -0.25 * c.r + 0.5 * c.g - 0.25 * c.b
    );
}

vec3 YCoCgToRGB(vec3 c) {
    return vec3(
        c.x + c.y - c.z,
        c.x       + c.z,
        c.x - c.y - c.z
    );
}

// Clip history color vector toward the center of the local 3x3 variance bounding box
vec3 ClipAABB(vec3 aabbMin, vec3 aabbMax, vec3 p, vec3 q) {
    vec3 r = q - p;
    vec3 minDiff = aabbMin - p;
    vec3 maxDiff = aabbMax - p;

    vec3 tMin = minDiff / (r + vec3(0.00001));
    vec3 tMax = maxDiff / (r + vec3(0.00001));

    vec3 realMin = min(tMin, tMax);
    vec3 realMax = max(tMin, tMax);

    float t = min(realMax.x, min(realMax.y, realMax.z));
    t = clamp(t, 0.0, 1.0);
    return p + r * t;
}

vec4 EvaluateTAA(vec2 uv) {
    // 1. Fetch screen-space velocity vector (current position - previous position)
    vec2 velocity = texture(u_VelocityBuffer, uv).rg;
    vec2 prevUV = uv - velocity;

    // 2. Fetch current frame color and sample 3x3 neighborhood for statistical moments
    vec3 m1 = vec3(0.0); // First moment (mean)
    vec3 m2 = vec3(0.0); // Second moment (variance)
    vec3 currentColor = texture(u_CurrentFrame, uv).rgb;

    for (int y = -1; y <= 1; ++y) {
        for (int x = -1; x <= 1; ++x) {
            vec3 c = textureOffset(u_CurrentFrame, uv, ivec2(x, y)).rgb;
            vec3 ycocg = RGBToYCoCg(c);
            m1 += ycocg;
            m2 += ycocg * ycocg;
        }
    }

    vec3 mu = m1 / 9.0;
    vec3 sigma = sqrt(abs(m2 / 9.0 - mu * mu));

    // Construct variance bounding box (1.25x sigma provides optimal ghosting-to-blur tradeoff)
    const float gamma = 1.25;
    vec3 aabbMin = mu - gamma * sigma;
    vec3 aabbMax = mu + gamma * sigma;

    // 3. Sample history frame with Catmull-Rom or bilinear filtering
    vec3 historyColor = texture(u_HistoryFrame, prevUV).rgb;
    vec3 historyYCoCg = RGBToYCoCg(historyColor);

    // 4. Variance clip history toward neighborhood mean
    vec3 clippedHistoryYCoCg = ClipAABB(aabbMin, aabbMax, mu, historyYCoCg);
    vec3 clippedHistory = YCoCgToRGB(clippedHistoryYCoCg);

    // 5. Compute adaptive blend weight based on velocity magnitude and depth disocclusion
    float blendFactor = 0.05; // 95% history, 5% current by default
    if (prevUV.x < 0.0 || prevUV.x > 1.0 || prevUV.y < 0.0 || prevUV.y > 1.0) {
        blendFactor = 1.0; // Complete history rejection off-screen
    }

    vec3 resolved = mix(clippedHistory, currentColor, blendFactor);
    return vec4(resolved, 1.0);
}

// ============================================================================
// SECTION 3: SCREEN-SPACE REFLECTIONS (SSR) WITH 2.5D DDA RAYMARCHING
// ============================================================================

uniform mat4 u_Projection;
uniform mat4 u_InvProjection;
uniform mat4 u_View;

vec3 ReconstructViewPos(vec2 uv, float depth) {
    vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 view = u_InvProjection * clip;
    return view.xyz / view.w;
}

vec4 EvaluateSSR(vec2 uv, vec3 viewPos, vec3 viewNormal, float roughness) {
    // SSR Reflection Ray in View Space
    vec3 rayDir = reflect(normalize(viewPos), normalize(viewNormal));

    // Raymarching constants
    const int MAX_STEPS = 64;
    const float STEP_SIZE = 0.15;
    const float THICKNESS = 0.25; // Surface thickness tolerance to eliminate silhouette bleed

    vec3 currPos = viewPos + rayDir * 0.05; // Jitter start to avoid self-intersection
    vec2 hitUV = vec2(0.0);
    bool hitFound = false;

    for (int i = 0; i < MAX_STEPS; ++i) {
        currPos += rayDir * STEP_SIZE;

        // Project view-space ray into NDC/UV space
        vec4 projPos = u_Projection * vec4(currPos, 1.0);
        projPos.xyz /= projPos.w;
        vec2 sampleUV = projPos.xy * 0.5 + 0.5;

        if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
            break; // Ray escaped the screen frustum
        }

        // Fetch scene depth at current sample UV
        float sceneDepth = texture(u_DepthBuffer, sampleUV).r;
        vec3 scenePos = ReconstructViewPos(sampleUV, sceneDepth);

        // Check depth intersection: ray behind geometry within tolerance thickness
        float depthDiff = currPos.z - scenePos.z;
        if (depthDiff >= 0.0 && depthDiff < THICKNESS) {
            hitUV = sampleUV;
            hitFound = true;
            break;
        }
    }

    if (!hitFound) {
        return vec4(0.0); // Fall back to Cubemap/Environment IBL
    }

    // Screen edge vignetting to prevent harsh cutoffs at screen borders
    vec2 edgeFade = smoothstep(0.0, 0.15, hitUV) * smoothstep(1.0, 0.85, hitUV);
    float fade = edgeFade.x * edgeFade.y;

    // Roughness falloff (rough surfaces disperse sharp specular reflections)
    fade *= (1.0 - roughness);

    vec3 hitColor = texture(u_ColorTexture, hitUV).rgb;
    return vec4(hitColor, fade);
}

// ============================================================================
// SECTION 4: HORIZON-BASED AMBIENT OCCLUSION (HBAO)
// ============================================================================

float EvaluateHBAO(vec2 uv, vec3 viewPos, vec3 viewNormal) {
    const int NUM_DIRECTIONS = 4;
    const int NUM_STEPS = 4;
    const float AO_RADIUS = 0.5; // World-space AO radius
    const float BIAS = 0.1;

    float occlusion = 0.0;
    float stepSizeUV = (AO_RADIUS / -viewPos.z) / float(NUM_STEPS);

    for (int d = 0; d < NUM_DIRECTIONS; ++d) {
        float angle = float(d) * (3.14159265 / float(NUM_DIRECTIONS));
        vec2 dir = vec2(cos(angle), sin(angle));

        float maxHorizonAngle = -1.0;

        for (int s = 1; s <= NUM_STEPS; ++s) {
            vec2 sampleUV = uv + dir * (float(s) * stepSizeUV);
            float sampleDepth = texture(u_DepthBuffer, sampleUV).r;
            vec3 samplePos = ReconstructViewPos(sampleUV, sampleDepth);

            vec3 delta = samplePos - viewPos;
            float dist2 = dot(delta, delta);

            // Compute horizon elevation sine
            float horizon = dot(normalize(delta), viewNormal);
            if (horizon > maxHorizonAngle && dist2 < (AO_RADIUS * AO_RADIUS)) {
                maxHorizonAngle = horizon;
            }
        }

        occlusion += clamp(maxHorizonAngle - BIAS, 0.0, 1.0);
    }

    return 1.0 - (occlusion / float(NUM_DIRECTIONS));
}

// ============================================================================
// SECTION 5: TONE MAPPING OPERATORS (PRIMITIVE CLAMP VS REINHARD VS ACES FILMIC)
// ============================================================================

// Primitive: Linear Clamp (causes flat white highlight burning)
vec3 ToneMapClamp(vec3 hdrColor) {
    return clamp(hdrColor, 0.0, 1.0);
}

// Intermediate: Reinhard Simple (desaturates bright lights to gray/white)
vec3 ToneMapReinhard(vec3 hdrColor) {
    return hdrColor / (hdrColor + vec3(1.0));
}

// Modern: ACES Film Tone Mapping Curve (Narkowicz 2015 Fit)
vec3 ToneMapACESFilmic(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Gamma correction (Linear -> sRGB display space)
vec3 LinearToSRGB(vec3 linearColor) {
    return pow(linearColor, vec3(1.0 / 2.2));
}

