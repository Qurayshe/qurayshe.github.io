<div align="center">

# qurayshe.github.io!!!

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Deploy-222222.svg?logo=githubpages&logoColor=white)](https://qurayshe.github.io)[![Three.js](https://img.shields.io/badge/Three.js-r128-000000.svg?logo=three.js&logoColor=white)](https://threejs.org/)
[![Anime.js](https://img.shields.io/badge/Anime.js-3.2.1-FF4B4B.svg?logo=javascript&logoColor=white)](https://animejs.com/)[![Marked](https://img.shields.io/badge/Marked.js-v12+-FF8800.svg?logo=markdown&logoColor=white)](https://marked.js.org/)[![Prism.js](https://img.shields.io/badge/Prism.js-1.29.0-2D7DD2.svg?logo=javascript&logoColor=white)](https://prismjs.com/)[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022+-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)[![Rust](https://img.shields.io/badge/Rust-1.75+-DEA584.svg?logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8.svg?logo=go&logoColor=white)](https://go.dev/)[![C++](https://img.shields.io/badge/C++-C++20-00599C.svg?logo=c%2B%2B&logoColor=white)](https://isocpp.org/)[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

<br/></div>

---

## overview!!!

static site on github pages containing code examples and interactive demos

- **cprog1**: 33x systems c99->c11->cpp20->cpp26 (basicish sys arch, CPL/C-style vs Google vs ISO '26)
- **graphicslab**: 11x computer graphics (CPU framebuffers, rasterization, Z-buffer, raytracer, Vulkan/WebGPU, PBR, Visibility Buffers, Nsight/RenderDoc profiling)
- **qutest2**: 11x threejs animations (frontendslop)
- **rustserver**: 6x rust+golang servers (backend stuff)
- **ailab**: 16x machine learning & ai fundamentals (math -> perceptrons -> transformers -> sota)

runs in browser w/o build

---

## projects!!!

### 1. c+systems. c99+c11+cpp20+cpp26 (`cprog1`)

| focus | key topics | source files |
| :--- | :--- | :--- |
| **1. c foundations** | compilation pipeline pointers stack struct alignment arena allocators vtables binary io | `01_types_and_bits.c`<br/>`02_pointer_basics.c`<br/>`04_struct_alignment.c`<br/>`05_simple_arena.c` |
| **2. advanced systems** | atomics memory barriers cache locality simd avx2 syscalls pool allocators mmap bytecode vm | `09_atomics_and_spinlocks.c`<br/>`10b_avx2_vectorization.c`<br/>`12_pool_allocator.c`<br/>`16_stack_vm.c` |
| **3. modern c++** | raii rule of 5/0 c-style vs google vs iso'26 smart pointers move semantics constexpr pmr lock free | `17_raii_demo.cpp`<br/>`17c_paradigms_comparison.cpp`<br/>`18_smart_pointers.cpp`<br/>`24_spsc_ring_buffer.cpp` |
| **4. runtime internals** | garbage collection nan boxing event loop epoll b-tree wal http parser jit codegen | `25_mark_and_sweep_gc.c`<br/>`26b_nan_boxing_engine.c`<br/>`27b_epoll_reactor_pattern.c`<br/>`31_mini_jit_compiler.c` |

### 2. graphics programming (`graphicslab`)

| topic | focus | source files |
| :--- | :--- | :--- |
| **1. software framebuffer** | linear RAM, RGBA stride, Porter-Duff alpha blending, binary Netpbm PPM | `01_software_framebuffer.c` |
| **2. bresenham & wireframes** | integer-only line algorithm, 3D wireframe cube projection | `02_bresenham_wireframe.c` |
| **3. triangle rasterization** | bounding box scanline, Pineda edge functions, barycentric color interpolation | `03_triangle_rasterizer.cpp` |
| **4. z-buffer & depth testing** | hidden surface removal, perspective-correct 1/z depth interpolation | `04_zbuffer_rasterizer.cpp` |
| **5. 3d math (mvp)** | homogeneous 4D coordinates, LookAt camera view matrix, perspective frustum | `05_mvp_transform_math.cpp` |
| **6. software raytracer** | ray-sphere algebra, Lambertian diffuse, Blinn-Phong specular, shadow & reflection rays | `06_software_raytracer.cpp` |
| **7. gpu architecture & passes** | SIMT warps, complete hardware pipeline (IA to ROP), clipping/blending math, multi-pass engine architecture (G-Buffer MRT, Shadows, SSAO, Clustered Shading, Frame Graphs) | `07_multipass_deferred_shaders.glsl`<br/>`07_pipeline_shaders.glsl`<br/>`07_simt_pipeline_emulator.cpp` |
| **8. modern api comparison** | Vulkan 1.3 explicit PSOs & queues vs OpenGL 4.5+ state machine vs WebGPU WGSL | `08_vulkan_triangle.cpp`<br/>`08_opengl_triangle.cpp`<br/>`08_webgpu_triangle.js` |
| **9. pbr, diffuse & brdf** | Full Radiometry, Rendering Equation, Lambert vs Oren-Nayar rough diffuse, Classical Phong vs Blinn-Phong specular, Cook-Torrance GGX microfacet BRDF & IBL in GLSL & WGSL | `09_shading_comparison_models.glsl`<br/>`09_pbr_shader.glsl`<br/>`09_pbr_shader.wgsl` |
| **10. visibility buffers & modern pipelines** | 64-bit Visibility Buffer (InstanceID + PrimitiveID), software attribute pulling, Reverse-Z depth precision, partial alpha-tested pre-pass, motion vectors | `10_visibility_buffer_shader.glsl` |
| **11. gpu debugging & profiling** | 2x2 quad overdraw heatmaps, helper lane waste, NVIDIA Nsight Graphics SOL & GPU trace, RenderDoc G-buffer inspection, AMD RGP wavefront occupancy | `11_quad_overdraw_simulator.cpp` |

### 3. 3d web motion & graphics (`qutest2`)

| module | tech | concepts |
| :--- | :--- | :--- |
| **1.1 procedural geometries** | three.js | vertex displacement sine wave ripples |
| **1.2 lighting & pbr** | three.js | pbr materials pointlights soft shadows |
| **1.3 particle galaxy** | three.js | 100k points spiral buffer geometry |
| **2.1 kinetic typography** | anime.js | svg path dashoffset draw text reveals |
| **2.2 timeline choreography** | anime.js | keyframe timelines playback scrubber |
| **2.3 matrix stagger** | anime.js | grid stagger radial ripple physics |
| **3.1 camera director** | hybrid | camera stations dolly zoom fov transitions |
| **3.2 exploding mesh** | hybrid | 125 part voxel explosion spring return |
| **3.3 glitch shader** | hybrid | glsl shader fresnel scanlines uniforms |
| **3.4 3d card deck** | hybrid | raycaster mouse tracking card tilt |
| **3.5 audio equalizer** | hybrid | 64 band soundwave reactive bars |

### 4. server architecture (`rustserver` & `golang`)

| topic | rust | go |
| :--- | :--- | :--- |
| **1. raw tcp & http** | `std::net::TcpListener` manual read write | `net/http` standard library |
| **2. concurrency** | threadpool `Arc<Mutex<Receiver>>` `mpsc` | goroutines channels `sync.WaitGroup` |
| **3. async & routing** | tokio runtime `async`/`await` | go 1.22+ `http.NewServeMux` middleware |
| **4. json api** | axum router state extractors `serde_json` | `encoding/json` struct tags |
| **5. persistence** | async sqlite with sqlx | sqlite with `database/sql` pool |
| **6. telemetry** | `tracing-subscriber` signal handlers | `log/slog` `signal.NotifyContext` |

### 5. machine learning & ai fundamentals (`ailab`)

| phase | key topics | implementation files |
| :--- | :--- | :--- |
| **1. math foundations** | vector spaces, SVD low-rank compression, multivariable autodiff, Shannon entropy, MLE | `01_vector_matrix_svd.py`<br/>`02_scalar_autodiff_engine.py`<br/>`03_mle_and_entropy.py` |
| **2. classical ml & perceptron** | 1958 Rosenblatt perceptron, XOR catastrophe, logistic regression, Adam optimizer, RBF SVM | `04_perceptron_from_scratch.py`<br/>`05_logistic_regression_adam.py`<br/>`06_svm_kernel_smo.py` |
| **3. deep neural nets** | universal approximation, GELU activations, matrix backprop, LayerNorm, inverted dropout | `07_modular_mlp_framework.py`<br/>`08_layernorm_dropout_schedule.py` |
| **4. vision & sequence models** | 2D convolutions, ResNet gradient highways, unrolled LSTM gating & memory cells | `09_conv2d_and_resnet_block.py`<br/>`10_lstm_character_lm.py` |
| **5. transformers & llms** | scaled dot-product attention, multi-head projections, RoPE embeddings, KV-caching decoder | `11_multihead_attention_rope.py`<br/>`12_minigpt_and_kv_cache.py` |
| **6. sota frontier** | LoRA weight merging, Direct Preference Optimization (DPO), DDPM diffusion, MCTS & speculative decoding | `13_lora_linear_layer.py`<br/>`14_dpo_loss_engine.py`<br/>`15_ddpm_diffusion_sampler.py`<br/>`16_mcts_reasoning_speculative.py` |

---

## shortcuts!!!

| key | action |
| :--- | :--- |
| `ctrl+k` / `cmd+k` | open search |
| `/` | quick search |
| `up` / `down` | navigate results |
| `enter` | select item |
| `esc` | close modal |

---

## local run!!!

serve directory over http (for cors reasons)

```bash
python -m http.server 8000
```

open `http://localhost:8000`

---

## deploy!!!

```bash
git add .
git commit -m "update"
git push origin main
```

live at `https://qurayshe.github.io`

---

## license

mit
