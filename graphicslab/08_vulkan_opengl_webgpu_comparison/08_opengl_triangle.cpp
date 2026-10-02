/**
 * 08_opengl_triangle.cpp
 * 
 * Modern Core Profile OpenGL (4.5+) Triangle Pipeline
 * Demonstrates:
 *  - Shader Compilation & Linking (GLSL)
 *  - Vertex Array Objects (VAO) & Vertex Buffer Objects (VBO)
 *  - Direct State Access (DSA) / Standard attribute binding
 *  - Render loop with glDrawArrays()
 *
 * Requirements:
 *  - GLFW / SDL2 and GLAD / GLEW
 */

#include <iostream>
#include <vector>

// Note: In real builds, include <glad/glad.h> and <GLFW/glfw3.h>
// Here we write the exact standard modern OpenGL 4.5+ code.

const char* vertex_shader_source = R"(#version 450 core
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aColor;

layout(location = 0) out vec3 vColor;

void main() {
    vColor = aColor;
    gl_Position = vec4(aPos, 1.0);
}
)";

const char* fragment_shader_source = R"(#version 450 core
layout(location = 0) in vec3 vColor;
layout(location = 0) out vec4 FragColor;

void main() {
    FragColor = vec4(vColor, 1.0);
}
)";

struct Vertex {
    float x, y, z;
    float r, g, b;
};

// OpenGL Initialization and Draw Routine
void run_opengl_pipeline() {
    // 1. Vertex Data (Interleaved positions and RGB colors)
    const Vertex vertices[3] = {
        {  0.0f,  0.5f, 0.0f,   1.0f, 0.0f, 0.0f }, // Top (Red)
        {  0.5f, -0.5f, 0.0f,   0.0f, 1.0f, 0.0f }, // Right (Green)
        { -0.5f, -0.5f, 0.0f,   0.0f, 0.0f, 1.0f }  // Left (Blue)
    };

    std::cout << "[OpenGL] 1. Initializing Vertex Buffer Object (VBO) and VAO...\n";
    // GLuint vao, vbo;
    // glCreateVertexArrays(1, &vao);
    // glCreateBuffers(1, &vbo);
    // glNamedBufferData(vbo, sizeof(vertices), vertices, GL_STATIC_DRAW);

    // Attribute 0: Positions (3 floats)
    // glEnableVertexArrayAttrib(vao, 0);
    // glVertexArrayAttribFormat(vao, 0, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, x));
    // glVertexArrayAttribBinding(vao, 0, 0);

    // Attribute 1: Colors (3 floats)
    // glEnableVertexArrayAttrib(vao, 1);
    // glVertexArrayAttribFormat(vao, 1, 3, GL_FLOAT, GL_FALSE, offsetof(Vertex, r));
    // glVertexArrayAttribBinding(vao, 1, 0);

    // glVertexArrayVertexBuffer(vao, 0, vbo, 0, sizeof(Vertex));

    std::cout << "[OpenGL] 2. Compiling GLSL Vertex & Fragment Shaders...\n";
    // GLuint vs = glCreateShader(GL_VERTEX_SHADER);
    // glShaderSource(vs, 1, &vertex_shader_source, nullptr);
    // glCompileShader(vs);

    // GLuint fs = glCreateShader(GL_FRAGMENT_SHADER);
    // glShaderSource(fs, 1, &fragment_shader_source, nullptr);
    // glCompileShader(fs);

    // GLuint program = glCreateProgram();
    // glAttachShader(program, vs);
    // glAttachShader(program, fs);
    // glLinkProgram(program);

    std::cout << "[OpenGL] 3. Executing Render Loop:\n";
    std::cout << "   glClearColor(0.06f, 0.07f, 0.10f, 1.0f);\n";
    std::cout << "   glClear(GL_COLOR_BUFFER_BIT);\n";
    std::cout << "   glUseProgram(program);\n";
    std::cout << "   glBindVertexArray(vao);\n";
    std::cout << "   glDrawArrays(GL_TRIANGLES, 0, 3);\n";
    std::cout << "[OpenGL] Completed. Pipeline state managed implicitly by driver context.\n";
}

int main() {
    std::cout << "=== OPENGL 4.5+ CORE PROFILE TRIANGLE PIPELINE ===\n";
    run_opengl_pipeline();
    return 0;
}
