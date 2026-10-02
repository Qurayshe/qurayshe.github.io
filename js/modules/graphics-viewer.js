/**
 * Graphics Programming Curriculum & Interactive Lab Viewer (graphicslab)
 * Built with the exact same robust layout and styling as the C Systems Lab (cprog1)
 * and AI Lab (ailab).
 * 
 * Features:
 *  - 9-module curriculum: from scratch in C/C++ to Vulkan, OpenGL, WebGPU & PBR
 *  - High-performance Markdown rendering with KaTeX math
 *  - Multi-file source code inspection with Prism.js syntax highlighting
 *  - Live Interactive CPU Software Rasterizer & Z-Buffer Visualizer on HTML5 Canvas
 *  - Interactive GPU API Feature Matrix (Vulkan vs OpenGL vs WebGPU vs Metal vs DirectX 12)
 *  - Previous/Next pagination and full-text filter search
 */

import { GRAPHICS_CURRICULUM } from '../data/manifest.js';
import { fetchFile, renderMarkdown, renderMath, highlightCode, copyToClipboard, escapeHtml } from '../utils/helpers.js';

export class GraphicsViewer {
  constructor(container) {
    this.container = container;
    this.currentModule = null;
    this.activeTab = 'lesson'; // 'lesson', 'code', 'sandbox'
    this.searchQuery = '';
    this.selectedCodeFileIndex = 0;
    this.rasterizerAnimId = null;

    // Flatten all modules for pagination & lookup
    this.allModules = [];
    GRAPHICS_CURRICULUM.forEach((part) => {
      part.modules.forEach((mod) => {
        this.allModules.push({
          ...mod,
          partNumber: part.part,
          partTitle: part.partTitle,
          badge: part.badge
        });
      });
    });
  }

  init(initialModuleId = null) {
    this.renderLayout();
    this.bindEvents();

    const target = this.allModules.find((m) => m.id === initialModuleId) || this.allModules[0];
    this.loadModule(target);
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="lab-layout graphics-lab-layout">
        <!-- Sidebar Navigation -->
        <aside class="lab-sidebar" id="graphics-sidebar">
          <div class="lab-sidebar-header">
            <div class="lab-sidebar-title">
              <span>Graphics Lab</span>
            </div>
            <div class="lab-sidebar-sub">9 Modules &middot; Scratch to Vulkan</div>
          </div>

          <div class="lab-search-wrap">
            <input type="text" id="graphics-search-input" class="lab-search-input" placeholder="Filter rasterizer, Z-buffer, Vulkan, PBR..." />
          </div>

          <div class="lab-curriculum-tree" id="graphics-curriculum-tree">
            <!-- Rendered by renderSidebar() -->
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="lab-content" id="graphics-content-area">
          <div class="lab-content-header" id="graphics-header">
            <div class="lab-title-row">
              <button class="mobile-sidebar-toggle" id="graphics-sidebar-toggle" aria-label="Toggle Syllabus">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span>Modules</span>
              </button>
              <div>
                <div class="lab-breadcrumbs" id="graphics-breadcrumbs">Part 1 &bull; CPU Software Engine</div>
                <h1 class="lab-main-title" id="graphics-title">01. The Software Framebuffer &amp; PPM</h1>
              </div>
            </div>

            <!-- View Tabs -->
            <div class="lab-tabs">
              <button class="lab-tab active" data-tab="lesson">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                <span>Lesson Guide</span>
              </button>
              <button class="lab-tab" data-tab="code">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                <span>Source Code &amp; Shaders</span>
              </button>
              <button class="lab-tab" data-tab="sandbox">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                <span>Interactive Sandbox &amp; Rasterizer</span>
              </button>
            </div>
          </div>

          <!-- Tab Content Views -->
          <div class="lab-tab-body">
            <!-- Tab 1: Lesson Guide (Markdown with KaTeX) -->
            <div class="lab-pane active" id="pane-graphics-lesson">
              <div class="markdown-body" id="graphics-markdown-view">
                <div class="loading-spinner">Loading graphics lesson documentation...</div>
              </div>
            </div>

            <!-- Tab 2: Code Inspector -->
            <div class="lab-pane" id="pane-graphics-code">
              <div class="code-viewer-container">
                <div class="code-viewer-header">
                  <div class="code-file-tabs" id="graphics-code-file-tabs"></div>
                  <button class="btn-copy-code" id="btn-copy-graphics-code" title="Copy code">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span>Copy</span>
                  </button>
                </div>
                <div class="code-editor-viewport">
                  <pre class="line-numbers"><code id="graphics-code-view" class="language-c">// Source code will appear here</code></pre>
                </div>
              </div>
            </div>

            <!-- Tab 3: Interactive Sandbox & Software Rasterizer -->
            <div class="lab-pane" id="pane-graphics-sandbox">
              <div class="graphics-sandbox-layout">
                <div class="sandbox-viewport-card">
                  <div class="sandbox-toolbar">
                    <div class="sandbox-mode-chips">
                      <span class="toolbar-label">Render Mode:</span>
                      <button class="mode-chip active" data-render-mode="phong">Phong Shading</button>
                      <button class="mode-chip" data-render-mode="flat">Flat Shaded</button>
                      <button class="mode-chip" data-render-mode="wireframe">Wireframe</button>
                      <button class="mode-chip" data-render-mode="zbuffer">Z-Buffer Depth</button>
                    </div>
                    <div class="sandbox-stats">
                      <span id="rasterizer-stats-fps">60 FPS</span>
                      <span class="stat-divider">&bull;</span>
                      <span id="rasterizer-stats-tris">12 Triangles (CPU)</span>
                    </div>
                  </div>

                  <div class="sandbox-canvas-wrapper">
                    <canvas id="software-rasterizer-canvas" width="320" height="320"></canvas>
                  </div>

                  <div class="sandbox-controls-row">
                    <label class="control-label">
                      <span>Rotation Speed:</span>
                      <input type="range" id="ctrl-rotation-speed" min="0" max="4" step="0.2" value="1.2" />
                    </label>
                    <label class="control-label">
                      <span>Internal Canvas Scale:</span>
                      <select id="ctrl-resolution-select" class="sandbox-select">
                        <option value="64">64 &times; 64 (Retro CPU)</option>
                        <option value="128">128 &times; 128 (Fast)</option>
                        <option value="256" selected>256 &times; 256 (Balanced)</option>
                        <option value="320">320 &times; 320 (Smooth)</option>
                      </select>
                    </label>
                    <button class="btn-action-accent" id="btn-toggle-pause">Pause / Play</button>
                  </div>
                </div>

                <!-- API Comparison Matrix Card -->
                <div class="api-matrix-card">
                  <h3 class="card-inner-title">Modern GPU Graphics API Matrix</h3>
                  <p class="card-inner-sub">Direct comparison of industry graphics APIs across architecture, overhead, and platform targets.</p>
                  
                  <div class="api-table-wrapper">
                    <table class="api-compare-table">
                      <thead>
                        <tr>
                          <th>API</th>
                          <th>Paradigm</th>
                          <th>Memory Control</th>
                          <th>Pipeline State</th>
                          <th>Primary Shaders</th>
                          <th>Best Use Case</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="highlight-row">
                          <td><strong style="color: #e03131;">Vulkan 1.3</strong></td>
                          <td>Explicit HW queues</td>
                          <td>Manual VRAM allocation</td>
                          <td>Immutable PSO</td>
                          <td>SPIR-V bytecode</td>
                          <td>AAA Games, High-Performance Sim</td>
                        </tr>
                        <tr>
                          <td><strong style="color: #1098ad;">OpenGL 4.5+</strong></td>
                          <td>State Machine</td>
                          <td>Implicit driver memory</td>
                          <td>Mutable context</td>
                          <td>GLSL runtime compile</td>
                          <td>Quick tools, Education, Legacy</td>
                        </tr>
                        <tr class="highlight-row">
                          <td><strong style="color: #0ca678;">WebGPU</strong></td>
                          <td>Modern explicit</td>
                          <td>Safe buffers &amp; queues</td>
                          <td>Immutable Pipeline</td>
                          <td>WGSL</td>
                          <td>Next-gen 3D Web &amp; Rust native</td>
                        </tr>
                        <tr>
                          <td><strong style="color: #3b5bdb;">DirectX 12</strong></td>
                          <td>Explicit command lists</td>
                          <td>Committed resources</td>
                          <td>Immutable PSO</td>
                          <td>HLSL / DXIL</td>
                          <td>Windows &amp; Xbox console engines</td>
                        </tr>
                        <tr>
                          <td><strong style="color: #f76707;">Metal 3</strong></td>
                          <td>Ergonomic low-overhead</td>
                          <td>Unified memory</td>
                          <td>Render Pipeline State</td>
                          <td>MSL (Metal Shading)</td>
                          <td>Apple silicon (macOS, iOS, Vision)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Bottom Navigation Pagination (Matching Systems Lab & AI Lab) -->
          <div class="lab-pagination">
            <button class="pagination-btn" id="btn-graphics-prev">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              <span>Previous Module</span>
            </button>
            <div class="pagination-indicator" id="graphics-progress-label">Module 1 of 9</div>
            <button class="pagination-btn" id="btn-graphics-next">
              <span>Next Module</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderSidebar();
    this.initSoftwareRasterizer();
  }

  renderSidebar() {
    const treeEl = document.getElementById('graphics-curriculum-tree');
    if (!treeEl) return;

    treeEl.innerHTML = '';

    GRAPHICS_CURRICULUM.forEach((part) => {
      const filteredMods = part.modules.filter((m) => {
        if (!this.searchQuery) return true;
        const q = this.searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.desc.toLowerCase().includes(q) ||
          m.tags.some((t) => t.toLowerCase().includes(q))
        );
      });

      if (filteredMods.length === 0) return;

      const partGroup = document.createElement('div');
      partGroup.className = 'curriculum-part-group';

      const partHeader = document.createElement('div');
      partHeader.className = 'curriculum-part-header';
      partHeader.innerHTML = `
        <span class="part-badge">Part ${part.part}</span>
        <span class="part-name">${part.badge}</span>
      `;
      partGroup.appendChild(partHeader);

      const list = document.createElement('ul');
      list.className = 'curriculum-list';

      filteredMods.forEach((mod) => {
        const li = document.createElement('li');
        li.className = `curriculum-item ${this.currentModule && this.currentModule.id === mod.id ? 'active' : ''}`;
        li.dataset.id = mod.id;

        li.innerHTML = `
          <span class="curriculum-item-num">${mod.num}</span>
          <div class="curriculum-item-info">
            <div class="curriculum-item-title">${mod.title}</div>
            <div class="curriculum-item-desc">${mod.desc}</div>
          </div>
        `;

        li.addEventListener('click', () => {
          this.loadModule(mod);
          const sidebar = document.getElementById('graphics-sidebar');
          if (sidebar) sidebar.classList.remove('open');
        });

        list.appendChild(li);
      });

      partGroup.appendChild(list);
      treeEl.appendChild(partGroup);
    });
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('graphics-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderSidebar();
      });
    }

    // Tabs switching
    const tabBtns = this.container.querySelectorAll('.lab-tab');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('graphics-sidebar-toggle');
    const sidebar = document.getElementById('graphics-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Copy Code button
    const copyBtn = document.getElementById('btn-copy-graphics-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const codeElem = document.getElementById('graphics-code-view');
        if (codeElem) {
          copyToClipboard(codeElem.innerText, copyBtn);
        }
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    this.container.querySelectorAll('.lab-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    this.container.querySelectorAll('.lab-pane').forEach((pane) => {
      pane.classList.toggle('active', pane.id === `pane-graphics-${tabName}`);
    });
  }

  async loadModule(mod) {
    this.currentModule = mod;
    this.selectedCodeFileIndex = 0;
    window.location.hash = `graphics/${mod.id}`;

    // Update Header
    const bcrumb = document.getElementById('graphics-breadcrumbs');
    if (bcrumb) bcrumb.innerText = `Part ${mod.partNumber} • ${mod.badge}`;

    const title = document.getElementById('graphics-title');
    if (title) title.innerText = `${mod.num}. ${mod.title}`;

    // Update pagination controls
    const currentIndex = this.allModules.findIndex((m) => m.id === mod.id);
    const prevBtn = document.getElementById('btn-graphics-prev');
    const nextBtn = document.getElementById('btn-graphics-next');
    const progressLabel = document.getElementById('graphics-progress-label');

    if (progressLabel) {
      progressLabel.innerText = `Module ${currentIndex + 1} of ${this.allModules.length}`;
    }

    if (prevBtn) {
      prevBtn.disabled = currentIndex === 0;
      prevBtn.onclick = () => {
        if (currentIndex > 0) this.loadModule(this.allModules[currentIndex - 1]);
      };
    }

    if (nextBtn) {
      nextBtn.disabled = currentIndex === this.allModules.length - 1;
      nextBtn.onclick = () => {
        if (currentIndex < this.allModules.length - 1) this.loadModule(this.allModules[currentIndex + 1]);
      };
    }

    // Highlight active item in sidebar
    document.querySelectorAll('#graphics-curriculum-tree .curriculum-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.id === mod.id);
    });

    // 1. Fetch & render markdown
    const mdView = document.getElementById('graphics-markdown-view');
    if (mdView) {
      mdView.innerHTML = `<div class="loading-spinner">Loading ${escapeHtml(mod.title)}...</div>`;
      try {
        const markdown = await fetchFile(mod.mdPath);
        mdView.innerHTML = renderMarkdown(markdown);
        renderMath(mdView);
        if (window.Prism) Prism.highlightAllUnder(mdView);
      } catch (err) {
        mdView.innerHTML = `<div class="error-notice">Failed to load documentation for ${escapeHtml(mod.title)}. (${escapeHtml(err.message)})</div>`;
      }
    }

    // 2. Render code file tabs and fetch code file
    this.renderCodeFiles();
  }

  renderCodeFiles() {
    const tabsContainer = document.getElementById('graphics-code-file-tabs');
    if (!tabsContainer || !this.currentModule.codeFiles) return;

    tabsContainer.innerHTML = '';
    this.currentModule.codeFiles.forEach((file, idx) => {
      const btn = document.createElement('button');
      btn.className = `code-file-tab ${idx === this.selectedCodeFileIndex ? 'active' : ''}`;
      btn.innerHTML = `<span>${file.name}</span>`;
      btn.addEventListener('click', () => {
        this.selectedCodeFileIndex = idx;
        this.renderCodeFiles();
      });
      tabsContainer.appendChild(btn);
    });

    const activeFile = this.currentModule.codeFiles[this.selectedCodeFileIndex];
    if (activeFile) {
      this.loadCodeFile(activeFile);
    }
  }

  async loadCodeFile(file) {
    const codeView = document.getElementById('graphics-code-view');
    if (!codeView) return;

    codeView.textContent = `// Loading ${file.name}...`;
    try {
      const code = await fetchFile(file.path);
      codeView.className = `language-${file.lang || 'c'}`;
      codeView.textContent = code;
      highlightCode(codeView, file.lang || 'c');
    } catch (err) {
      codeView.textContent = `// Failed to load source file: ${file.path}`;
    }
  }

  // ==========================================================================
  // LIVE INTERACTIVE CPU SOFTWARE RASTERIZER
  // Executes pure CPU-based 3D vertex transform, rasterization, and z-buffering!
  // ==========================================================================
  initSoftwareRasterizer() {
    const canvas = document.getElementById('software-rasterizer-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let renderMode = 'phong'; // 'phong', 'flat', 'wireframe', 'zbuffer'
    let isPaused = false;
    let rotationSpeed = 1.2;
    let internalRes = 256;
    let angleX = 0.5, angleY = 0.8;

    // Off-screen CPU memory buffers
    let width = internalRes, height = internalRes;
    let imgData = ctx.createImageData(width, height);
    let zBuffer = new Float32Array(width * height);

    const updateBuffers = (res) => {
      internalRes = res;
      width = res;
      height = res;
      imgData = ctx.createImageData(width, height);
      zBuffer = new Float32Array(width * height);
    };

    // Mode chips
    const modeChips = this.container.querySelectorAll('.mode-chip');
    modeChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        modeChips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        renderMode = chip.getAttribute('data-render-mode');
      });
    });

    // Speed slider
    const speedSlider = document.getElementById('ctrl-rotation-speed');
    if (speedSlider) {
      speedSlider.addEventListener('input', (e) => {
        rotationSpeed = parseFloat(e.target.value);
      });
    }

    // Resolution dropdown
    const resSelect = document.getElementById('ctrl-resolution-select');
    if (resSelect) {
      resSelect.addEventListener('change', (e) => {
        updateBuffers(parseInt(e.target.value, 10));
      });
    }

    // Pause/Play
    const pauseBtn = document.getElementById('btn-toggle-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        pauseBtn.innerText = isPaused ? 'Resume' : 'Pause / Play';
      });
    }

    // 3D Cube Geometry: 8 Vertices
    const rawVertices = [
      [-1, -1, -1], [ 1, -1, -1], [ 1,  1, -1], [-1,  1, -1],
      [-1, -1,  1], [ 1, -1,  1], [ 1,  1,  1], [-1,  1,  1]
    ];

    // 12 Triangles (indices & normals)
    const triangles = [
      // Front face (+Z)
      { v: [4, 5, 6], n: [0, 0, 1], col: [0, 240, 255] },
      { v: [4, 6, 7], n: [0, 0, 1], col: [0, 240, 255] },
      // Back face (-Z)
      { v: [1, 0, 3], n: [0, 0, -1], col: [255, 180, 0] },
      { v: [1, 3, 2], n: [0, 0, -1], col: [255, 180, 0] },
      // Top face (+Y)
      { v: [3, 2, 6], n: [0, 1, 0], col: [180, 50, 255] },
      { v: [3, 6, 7], n: [0, 1, 0], col: [180, 50, 255] },
      // Bottom face (-Y)
      { v: [0, 1, 5], n: [0, -1, 0], col: [255, 60, 120] },
      { v: [0, 5, 4], n: [0, -1, 0], col: [255, 60, 120] },
      // Right face (+X)
      { v: [1, 2, 6], n: [1, 0, 0], col: [60, 230, 120] },
      { v: [1, 6, 5], n: [1, 0, 0], col: [60, 230, 120] },
      // Left face (-X)
      { v: [0, 4, 7], n: [-1, 0, 0], col: [255, 100, 50] },
      { v: [0, 7, 3], n: [-1, 0, 0], col: [255, 100, 50] }
    ];

    // Wireframe edges
    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];

    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    const renderLoop = (time) => {
      this.rasterizerAnimId = requestAnimationFrame(renderLoop);

      const dt = (time - lastTime) / 1000;
      lastTime = time;

      fpsTimer += dt;
      frameCount++;
      if (fpsTimer >= 0.5) {
        const fpsElem = document.getElementById('rasterizer-stats-fps');
        if (fpsElem) fpsElem.innerText = `${Math.round(frameCount / fpsTimer)} FPS`;
        frameCount = 0;
        fpsTimer = 0;
      }

      if (!isPaused) {
        angleX += 0.8 * dt * rotationSpeed;
        angleY += 1.2 * dt * rotationSpeed;
      }

      // 1. Clear CPU Buffers
      const buf32 = new Uint32Array(imgData.data.buffer);
      buf32.fill(0xFF100C08); // Background: #080c10 (ABGR little-endian)
      zBuffer.fill(1e9);

      // 2. Rotate & Project Vertices
      const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY), sinY = Math.sin(angleY);

      const projected = [];
      const worldPos = [];
      const fovScale = width * 0.85;
      const camDist = 3.2;

      for (let i = 0; i < rawVertices.length; ++i) {
        const [vx, vy, vz] = rawVertices[i];
        // Rotate Y
        const x1 = vx * cosY + vz * sinY;
        const z1 = -vx * sinY + vz * cosY;
        // Rotate X
        const y2 = vy * cosX - z1 * sinX;
        const z2 = vy * sinX + z1 * cosX;

        worldPos.push([x1, y2, z2]);

        const zCam = z2 + camDist;
        const sx = width * 0.5 + (x1 * fovScale) / zCam;
        const sy = height * 0.5 - (y2 * fovScale) / zCam;
        projected.push({ x: sx, y: sy, z: zCam });
      }

      // Edge function helper
      const edge = (ax, ay, bx, by, px, py) => (px - ax) * (by - ay) - (py - ay) * (bx - ax);

      if (renderMode === 'wireframe') {
        // Wireframe: draw edges with integer Bresenham
        const drawLine = (x0, y0, x1, y1, colorU32) => {
          x0 = Math.round(x0); y0 = Math.round(y0);
          x1 = Math.round(x1); y1 = Math.round(y1);
          const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
          const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
          let err = dx + dy;
          while (true) {
            if (x0 >= 0 && x0 < width && y0 >= 0 && y0 < height) {
              buf32[y0 * width + x0] = colorU32;
            }
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
          }
        };

        for (let i = 0; i < edges.length; ++i) {
          const p0 = projected[edges[i][0]];
          const p1 = projected[edges[i][1]];
          drawLine(p0.x, p0.y, p1.x, p1.y, 0xFFFFF000); // Cyan #00f0ff
        }

      } else {
        // Rasterize triangles using Barycentric math + Z-buffer
        const lightDir = [0.577, 0.577, -0.577];

        for (let i = 0; i < triangles.length; ++i) {
          const tri = triangles[i];
          const v0 = projected[tri.v[0]];
          const v1 = projected[tri.v[1]];
          const v2 = projected[tri.v[2]];

          // Rotate normal for lighting
          const [nx, ny, nz] = tri.n;
          const rnx = nx * cosY + nz * sinY;
          const rnz = -nx * sinY + nz * cosY;
          const rny = ny * cosX - rnz * sinX;
          const rnz2 = ny * sinX + rnz * cosX;

          // Backface culling: discard triangles facing away from camera
          const crossZ = (v1.x - v0.x) * (v2.y - v0.y) - (v1.y - v0.y) * (v2.x - v0.x);
          if (crossZ >= 0) continue;

          // Lighting calculations
          const diffuse = Math.max(0, rnx * lightDir[0] + rny * lightDir[1] + rnz2 * lightDir[2]);
          const ambient = 0.15;
          const intensity = Math.min(1.0, ambient + diffuse * 0.85);

          const r = tri.col[0] * intensity;
          const g = tri.col[1] * intensity;
          const b = tri.col[2] * intensity;
          const baseColor = (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);

          // AABB Bounding Box
          const minX = Math.max(0, Math.floor(Math.min(v0.x, v1.x, v2.x)));
          const maxX = Math.min(width - 1, Math.ceil(Math.max(v0.x, v1.x, v2.x)));
          const minY = Math.max(0, Math.floor(Math.min(v0.y, v1.y, v2.y)));
          const maxY = Math.min(height - 1, Math.ceil(Math.max(v0.y, v1.y, v2.y)));

          const totalArea = edge(v0.x, v0.y, v1.x, v1.y, v2.x, v2.y);
          if (Math.abs(totalArea) < 1e-4) continue;
          const invArea = 1.0 / totalArea;

          const invZ0 = 1.0 / v0.z;
          const invZ1 = 1.0 / v1.z;
          const invZ2 = 1.0 / v2.z;

          for (let y = minY; y <= maxY; ++y) {
            for (let x = minX; x <= maxX; ++x) {
              const px = x + 0.5, py = y + 0.5;
              const w0 = edge(v1.x, v1.y, v2.x, v2.y, px, py);
              const w1 = edge(v2.x, v2.y, v0.x, v0.y, px, py);
              const w2 = edge(v0.x, v0.y, v1.x, v1.y, px, py);

              if (w0 <= 0 && w1 <= 0 && w2 <= 0) {
                const b0 = w0 * invArea;
                const b1 = w1 * invArea;
                const b2 = w2 * invArea;

                const invZ = b0 * invZ0 + b1 * invZ1 + b2 * invZ2;
                const z = 1.0 / invZ;

                const idx = y * width + x;
                if (z < zBuffer[idx]) {
                  zBuffer[idx] = z;

                  if (renderMode === 'zbuffer') {
                    // Visualize raw depth buffer in greyscale (near = white, far = black)
                    const normZ = Math.max(0, Math.min(1, (z - 2.0) / 2.5));
                    const val = Math.floor((1.0 - normZ) * 255);
                    buf32[idx] = (255 << 24) | (val << 16) | (val << 8) | val;
                  } else {
                    buf32[idx] = baseColor;
                  }
                }
              }
            }
          }
        }
      }

      // 3. Blit CPU Image Buffer to HTML5 Canvas (with nearest-neighbor upscaling)
      ctx.imageSmoothingEnabled = false;
      ctx.putImageData(imgData, 0, 0);
      if (width !== 320) {
        ctx.drawImage(canvas, 0, 0, width, height, 0, 0, 320, 320);
      }
    };

    this.rasterizerAnimId = requestAnimationFrame(renderLoop);
  }

  destroy() {
    if (this.rasterizerAnimId) {
      cancelAnimationFrame(this.rasterizerAnimId);
    }
  }
}
