/**
 * 08_webgpu_triangle.js
 * 
 * Next-Generation WebGPU Standard (W3C)
 * 
 * Bridges modern explicit low-level architectures (Vulkan/Metal/D3D12)
 * into a clean, safe, cross-platform standard for the browser and native engines (Rust wgpu).
 * 
 * Uses WGSL (WebGPU Shading Language).
 */

const wgslShader = `
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec3f,
};

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var pos = array<vec2f, 3>(
        vec2f( 0.0,  0.6),  // Top
        vec2f(-0.6, -0.6),  // Bottom Left
        vec2f( 0.6, -0.6)   // Bottom Right
    );

    var colors = array<vec3f, 3>(
        vec3f(1.0, 0.0, 0.3),  // Rose
        vec3f(0.0, 0.9, 1.0),  // Cyan
        vec3f(1.0, 0.7, 0.0)   // Amber
    );

    var output: VertexOutput;
    output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
    output.color = colors[vertexIndex];
    return output;
}

@fragment
fn fs_main(@location(0) color: vec3f) -> @location(0) vec4f {
    return vec4f(color, 1.0);
}
`;

export async function initWebGpuPipeline(canvas) {
    if (!navigator.gpu) {
        throw new Error("WebGPU is not supported on this browser/hardware.");
    }

    // 1. Request physical adapter & logical device
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) throw new Error("No appropriate GPU adapter found.");
    const device = await adapter.requestDevice();

    // 2. Configure canvas context
    const context = canvas.getContext("webgpu");
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: presentationFormat,
        alphaMode: "premultiplied"
    });

    // 3. Compile WGSL Shader Module
    const shaderModule = device.createShaderModule({
        label: "Rainbow Triangle Shaders",
        code: wgslShader
    });

    // 4. Create Immutable Pipeline State Object (GPURenderPipeline)
    const pipeline = device.createRenderPipeline({
        label: "Triangle Render Pipeline",
        layout: "auto",
        vertex: {
            module: shaderModule,
            entryPoint: "vs_main"
        },
        fragment: {
            module: shaderModule,
            entryPoint: "fs_main",
            targets: [{ format: presentationFormat }]
        },
        primitive: {
            topology: "triangle-list",
            cullMode: "none"
        }
    });

    // 5. Frame Render Callback
    function renderFrame() {
        const commandEncoder = device.createCommandEncoder({ label: "Frame Command Encoder" });
        const textureView = context.getCurrentTexture().createView();

        const renderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.06, g: 0.07, b: 0.10, a: 1.0 },
                loadOp: "clear",
                storeOp: "store"
            }]
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.draw(3); // Draw 3 vertices
        passEncoder.end();

        // Submit command buffers to the GPU hardware queue
        device.queue.submit([commandEncoder.finish()]);
    }

    renderFrame();
    return { device, renderFrame };
}
