# Module 08: Modern Graphics APIs Compared: Vulkan vs. OpenGL vs. WebGPU (and DirectX 12 & Metal)

> *"OpenGL hides everything behind a global state machine. Vulkan exposes the bare metal silicon. WebGPU bridges the gap for the modern web."*

When choosing a graphics API for modern systems development, you are deciding between three generations of API design philosophies:
1. **Legacy High-Level (OpenGL, Direct3D 11)**: Implicit driver state machine, heavy background heuristics, single-threaded context.
2. **Explicit Low-Overhead (Vulkan, Direct3D 12, Apple Metal)**: Explicit control over CPU multi-threading, memory allocation, execution queues, and pipeline state objects (PSO).
3. **Next-Generation Portable Web & Native Standard (WebGPU)**: The modern W3C standard based on the Vulkan/Metal/D3D12 model, replacing WebGL in browsers and cross-platform native engines (via Rust `wgpu` or Google Dawn).

---

## 1. The Definitive Architectural Comparison

| Dimension | OpenGL (Core 4.5+) | Vulkan (1.3+) | WebGPU (W3C Standard) | Direct3D 12 | Apple Metal |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API Abstraction** | High-level global State Machine | Ultra low-level explicit HW control | Modern ergonomic explicit pipeline | Low-level explicit HW control | Ergonomic low-level Objective-C/C++ |
| **Lines to Draw Triangle** | ~50–80 lines | ~800–1,200 lines | ~120–160 lines | ~700–1,000 lines | ~250–350 lines |
| **Multi-Threading** | Broken; single OpenGL context per thread | First-class; record command buffers on N threads | Multi-threaded command encoders (Workers) | First-class multi-threaded bundles | First-class multi-threaded encoders |
| **Memory Allocation** | Implicit (`glBufferData` driver-managed) | Explicit (`vkAllocateMemory` with custom suballocators) | Explicit buffer creation (`createBuffer`) | Explicit (`CreateCommittedResource`) | Explicit (`newBufferWithLength`) |
| **Pipeline State** | Mutable (`glEnable`, `glBlendFunc`) | Immutable Pipeline State Objects (PSO) | Immutable `GPURenderPipeline` | Immutable PSO | Immutable `MTLRenderPipelineState` |
| **Synchronization** | Implicit (driver guesses barriers) | Explicit (`VkSemaphore`, `VkFence`, pipeline barriers) | Safe command queues & timeline passes | Explicit Resource Barriers & Fences | Explicit Hazard Tracking / Fences |
| **Shader Languages** | GLSL (compiled by driver at runtime) | SPIR-V (pre-compiled binary bytecode) | WGSL (WebGPU Shading Language) | HLSL (compiled to DXIL) | MSL (Metal Shading Language) |
| **Cross-Platform** | Windows, Linux, Android, macOS (deprecated) | Windows, Linux, Android, iOS/macOS (via MoltenVK) | Chrome, Firefox, Safari, Edge, Native (`wgpu`) | Windows, Xbox only | macOS, iOS, visionOS only |

---

## 2. Why Did the Industry Shift from OpenGL to Vulkan?

### 1. The Driver "Black Box" Problem
In OpenGL, your application talks to a massive GPU vendor driver (NVIDIA/AMD/Intel). The driver runs continuous background heuristics, compiles GLSL shaders on the UI thread, and guesses when to flush commands. A driver update could silently break your frame rates.
In Vulkan, **the driver does virtually nothing**: it is a thin layer that converts your explicit command buffers directly into GPU microcode. What you write is exactly what runs on the silicon.

### 2. Multi-Core CPU Utilization
Under OpenGL, all draw commands (`glDrawArrays`, `glUniform`) must funnel through a **single thread** holding the OpenGL context. On modern 16-core or 32-core CPUs, 15 cores sit idle while 1 core is pinned at 100% trying to feed the GPU.
In Vulkan and WebGPU:
- Worker Thread 1 records shadow map command buffers.
- Worker Thread 2 records geometry pass command buffers.
- Worker Thread 3 records post-processing UI command buffers.
- The Main Thread instantly submits all three recorded buffers to the GPU hardware queue in a single atomic syscall!

### 3. Pipeline State Objects (PSO) vs. Pipeline Stutters
In OpenGL, you could change a blend mode or depth test at any moment (`glEnable(GL_BLEND)`). When you called `glDrawArrays`, the driver was often forced to pause the game and recompile the entire hardware pipeline to handle that specific state combination.
In Vulkan and WebGPU, **Pipelines are 100% immutable**. All shaders, vertex layouts, blending states, and rasterizer configurations are compiled and baked into a `VkPipeline` or `GPURenderPipeline` up front during loading screens. **Zero runtime pipeline compilation stutter!**

---

## 3. Side-by-Side Code Comparison: Drawing a Triangle

### A. OpenGL Core (Minimal Boilerplate)
```cpp
// 1. Compile Shaders
GLuint program = create_shader_program(vert_src, frag_src);
// 2. Upload vertex data into VBO & VAO
GLuint vao, vbo;
glGenVertexArrays(1, &vao);
glBindVertexArray(vao);
glGenBuffers(1, &vbo);
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

// Render loop:
glClear(GL_COLOR_BUFFER_BIT);
glUseProgram(program);
glBindVertexArray(vao);
glDrawArrays(GL_TRIANGLES, 0, 3);
```

### B. Vulkan 1.3 (Explicit Control Architecture)
Drawing that exact same triangle in Vulkan requires:
1. `vkCreateInstance()`: Initialize Vulkan runtime and validation layers.
2. `vkPickPhysicalDevice()`: Enumerate GPUs and query queue families (Graphics, Compute, Transfer).
3. `vkCreateDevice()`: Logical device creation with enabled features.
4. `vkCreateSwapchainKHR()`: Double or triple buffering image swapchain with presentation engine.
5. `vkCreateRenderPass()`: Define color/depth attachments, load/store operations, and subpass dependencies.
6. `vkCreateGraphicsPipeline()`: Compile SPIR-V shaders, configure rasterizer, MSAA, blend, and viewport.
7. `vkCreateCommandPool()` & `vkAllocateCommandBuffers()`: Allocate reusable command recording buffers.
8. `vkAllocateMemory()` & `vkBindBufferMemory()`: Explicitly allocate physical VRAM for vertex buffers.
9. `vkCmdBeginRenderPass()`, `vkCmdBindPipeline()`, `vkCmdBindVertexBuffers()`, `vkCmdDraw()`.
10. `vkQueueSubmit()` with `VkSemaphore` image synchronization and `vkQueuePresentKHR()`.

### C. WebGPU (Modern Ergonomic Next-Gen Standard)
WebGPU provides the clean, explicit pipeline architecture of Vulkan without requiring 1,000 lines of low-level device configuration:
```javascript
// WebGPU: Modern explicit pipeline in ~30 lines
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
const context = canvas.getContext('webgpu');
context.configure({ device, format: navigator.gpu.getPreferredCanvasFormat() });

const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: { module: device.createShaderModule({ code: wgslSource }), entryPoint: 'vs_main' },
  fragment: { module: device.createShaderModule({ code: wgslSource }), entryPoint: 'fs_main',
              targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }] },
  primitive: { topology: 'triangle-list' }
});

// Render loop:
const commandEncoder = device.createCommandEncoder();
const pass = commandEncoder.beginRenderPass({
  colorAttachments: [{ view: context.getCurrentTexture().createView(), loadOp: 'clear', storeOp: 'store' }]
});
pass.setPipeline(pipeline);
pass.draw(3);
pass.end();
device.queue.submit([commandEncoder.finish()]);
```

---

## 4. Source Files Inspection

Check out the implementation files in this directory:
- [`08_opengl_triangle.cpp`](#graphics/08_vulkan_opengl_webgpu_comparison): Complete modern Core Profile OpenGL triangle setup.
- [`08_vulkan_triangle.cpp`](#graphics/08_vulkan_opengl_webgpu_comparison): Structured, fully annotated Vulkan 1.3 pipeline architecture.
- [`08_webgpu_triangle.js`](#graphics/08_vulkan_opengl_webgpu_comparison): Next-generation WebGPU pipeline using WGSL shaders.
