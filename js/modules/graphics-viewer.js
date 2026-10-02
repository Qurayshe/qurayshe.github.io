/**
 * Graphics Programming Curriculum & Integrated Workstation (graphicslab)
 * 
 * Features:
 *  - 9-Module Full Curriculum: From scratch in C/C++ to Vulkan, OpenGL, WebGPU & PBR
 *  - Side-by-Side Unified Workstation: Lesson Guide on the left, Live Engine Preview + Source Code on the right
 *  - Dedicated Interactive Engine Preview for EVERY single lesson (Modules 01 - 09)
 *  - Multi-file source code inspection with Prism.js syntax highlighting & styled clipboard copy
 *  - KaTeX mathematical formulations
 *  - Previous/Next pagination & instant filter search
 */

import { GRAPHICS_CURRICULUM } from '../data/manifest.js';
import { fetchFile, renderMarkdown, renderMath, highlightCode, copyToClipboard, escapeHtml } from '../utils/helpers.js';

export class GraphicsViewer {
  constructor(container) {
    this.container = container;
    this.currentModule = null;
    this.searchQuery = '';
    this.selectedCodeFileIndex = 0;
    this.previewAnimId = null;

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
          </div>

          <!-- Main Side-by-Side Workstation Layout -->
          <div class="graphics-workstation">
            <!-- Left Column: Lesson Guide & Theoretical Formulations -->
            <div class="graphics-lesson-col">
              <div class="markdown-body" id="graphics-markdown-view">
                <div class="loading-spinner">Loading graphics lesson documentation...</div>
              </div>
            </div>

            <!-- Right Column: Interactive Visual Engine Preview + Source Code Inspector -->
            <div class="graphics-stage-col">
              <!-- Live Lesson Preview Card -->
              <div class="graphics-preview-card" id="graphics-preview-card">
                <div class="graphics-preview-header">
                  <div class="preview-badge-row">
                    <span class="preview-tech-pill" id="graphics-preview-tech">CPU Rasterizer</span>
                  </div>
                  <div class="preview-title" id="graphics-preview-title">Visual Example</div>
                </div>
                <div class="graphics-preview-viewport" id="graphics-preview-container">
                  <!-- Injected dynamically per module -->
                </div>
              </div>

              <!-- Source Code & Shaders Inspector -->
              <div class="code-viewer-container graphics-code-container">
                <div class="code-viewer-header">
                  <div class="code-file-tabs" id="graphics-code-file-tabs"></div>
                  <button class="btn-copy" id="btn-graphics-copy-code" title="Copy code to clipboard">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span>Copy Code</span>
                  </button>
                </div>
                <pre class="code-block line-numbers"><code id="graphics-code-content" class="language-c">// Source code will appear here</code></pre>
              </div>
            </div>
          </div>

          <!-- Bottom Navigation Pagination -->
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

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('graphics-sidebar-toggle');
    const sidebar = document.getElementById('graphics-sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Copy Code button
    const copyBtn = document.getElementById('btn-graphics-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const codeContent = document.getElementById('graphics-code-content');
        if (codeContent) {
          copyToClipboard(codeContent.textContent, copyBtn);
        }
      });
    }
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

    // 2. Render code file tabs and fetch active code file
    this.renderCodeFiles();

    // 3. Initialize Dedicated Lesson Visual Preview Engine
    this.initLessonPreview(mod.id);
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

  selectCodeFileByName(filename) {
    if (!this.currentModule || !this.currentModule.codeFiles) return;
    const cleanTarget = filename.replace(/^[`'"]+|[`'"]+$/g, '').trim().toLowerCase();
    const idx = this.currentModule.codeFiles.findIndex((f) => {
      const fn = f.name.toLowerCase();
      return fn === cleanTarget || fn.includes(cleanTarget) || cleanTarget.includes(fn);
    });
    if (idx !== -1 && idx !== this.selectedCodeFileIndex) {
      this.selectedCodeFileIndex = idx;
      this.renderCodeFiles();
    }
  }

  highlightCodeViewer() {
    const codeContainer = document.querySelector('.graphics-code-container') || document.getElementById('graphics-code-content');
    if (!codeContainer) return;
    const rect = codeContainer.getBoundingClientRect();
    const isFullyVisible = (rect.top >= 70 && rect.bottom <= window.innerHeight);
    if (!isFullyVisible) {
      codeContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    codeContainer.classList.remove('code-viewer-highlight-pulse');
    void codeContainer.offsetWidth;
    codeContainer.classList.add('code-viewer-highlight-pulse');
    setTimeout(() => {
      codeContainer.classList.remove('code-viewer-highlight-pulse');
    }, 1600);
  }

  async loadCodeFile(file) {
    const codeView = document.getElementById('graphics-code-content');
    if (!codeView) return;

    codeView.textContent = `// Loading ${file.name}...`;
    try {
      const code = await fetchFile(file.path);
      const inferredLang = file.lang || (file.name.endsWith('.cpp') ? 'cpp' : file.name.endsWith('.c') ? 'c' : file.name.endsWith('.js') ? 'javascript' : 'c');
      codeView.className = `language-${inferredLang}`;
      const pre = codeView.closest('pre');
      if (pre) {
        pre.className = `code-block line-numbers language-${inferredLang}`;
      }
      codeView.textContent = code;
      if (typeof Prism !== 'undefined') {
        Prism.highlightElement(codeView);
      }
    } catch (err) {
      codeView.textContent = `// Failed to load source file: ${file.path}`;
    }
  }

  // ==========================================================================
  // LESSON PREVIEW DISPATCHER
  // Launches a tailored interactive visual engine for each specific lesson
  // ==========================================================================
  initLessonPreview(moduleId) {
    if (this.previewAnimId) {
      cancelAnimationFrame(this.previewAnimId);
      this.previewAnimId = null;
    }

    const container = document.getElementById('graphics-preview-container');
    const techPill = document.getElementById('graphics-preview-tech');
    const titlePill = document.getElementById('graphics-preview-title');
    if (!container) return;

    switch (moduleId) {
      case '01_software_framebuffer':
        if (techPill) techPill.textContent = 'CPU Framebuffer & RAM';
        if (titlePill) titlePill.textContent = 'Linear Memory & Alpha Blending';
        this.initFramebufferPreview(container);
        break;

      case '02_bresenham_wireframe':
        if (techPill) techPill.textContent = 'Integer Rasterizer';
        if (titlePill) titlePill.textContent = 'Bresenham Line & 3D Wireframe';
        this.initBresenhamPreview(container);
        break;

      case '03_triangle_rasterization':
        if (techPill) techPill.textContent = 'Barycentric Math';
        if (titlePill) titlePill.textContent = 'Pineda Triangle Rasterizer';
        this.initTrianglePreview(container);
        break;

      case '04_zbuffer_and_depth':
        if (techPill) techPill.textContent = 'Hidden Surface Removal';
        if (titlePill) titlePill.textContent = 'Z-Buffering & Depth Heatmap';
        this.initZBufferPreview(container);
        break;

      case '05_3d_math_and_transformations':
        if (techPill) techPill.textContent = 'Homogeneous Matrices';
        if (titlePill) titlePill.textContent = 'Model-View-Projection (MVP)';
        this.initMVPPreview(container);
        break;

      case '06_software_raytracer':
        if (techPill) techPill.textContent = 'CPU Raytracer';
        if (titlePill) titlePill.textContent = 'Ray-Sphere & Shadow Casting';
        this.initRaytracerPreview(container);
        break;

      case '07_gpu_architecture_and_pipeline':
        if (techPill) techPill.textContent = 'SIMT Hardware Pipeline';
        if (titlePill) titlePill.textContent = 'Programmable GPU Stages & Warps';
        this.initPipelinePreview(container);
        break;

      case '08_vulkan_opengl_webgpu_comparison':
        if (techPill) techPill.textContent = 'API Architecture Matrix';
        if (titlePill) titlePill.textContent = 'Vulkan vs OpenGL vs WebGPU';
        this.initApiComparePreview(container);
        break;

      case '09_shaders_and_pbr':
        if (techPill) techPill.textContent = 'Cook-Torrance BRDF';
        if (titlePill) titlePill.textContent = 'Physically Based Material Shading';
        this.initPbrPreview(container);
        break;

      default:
        this.initFramebufferPreview(container);
    }
  }

  // ==========================================================================
  // MODULE 01: CPU FRAMEBUFFER, RGBA STRIDE & PPM EXPORT PREVIEW
  // ==========================================================================
  initFramebufferPreview(container) {
    container.innerHTML = `
      <div class="preview-toolbar">
        <div class="preview-chips-row">
          <span class="toolbar-label">Blend Mode:</span>
          <button class="mode-chip active" id="fb-blend-norm">Source-Over</button>
          <button class="mode-chip" id="fb-blend-add">Additive</button>
          <button class="mode-chip" id="fb-blend-mul">Multiply</button>
        </div>
        <button class="mode-chip" id="btn-export-ppm" title="Download as binary Netpbm image">Download .PPM</button>
      </div>

      <div class="preview-canvas-box">
        <canvas id="fb-preview-canvas" width="320" height="320"></canvas>
      </div>

      <div class="preview-controls-grid">
        <div class="preview-control-row">
          <span>Disc Alpha Opacity:</span>
          <input type="range" id="fb-alpha-slider" min="0" max="1" step="0.02" value="0.75" />
          <span id="fb-alpha-val" style="font-family: var(--font-mono); width: 35px;">0.75</span>
        </div>
      </div>

      <div class="preview-info-box" id="fb-pixel-inspector">
        Hover over canvas to inspect linear RAM address: offset = (Y &times; 320 + X) &times; 4
      </div>
    `;

    const canvas = document.getElementById('fb-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 320, height = 320;
    const imgData = ctx.createImageData(width, height);
    const buf = imgData.data;

    let alphaVal = 0.75;
    let blendMode = 'normal'; // 'normal', 'add', 'mul'

    const render = () => {
      // 1. Fill base dark checkerboard pattern into linear RAM
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const check = ((x >> 4) ^ (y >> 4)) & 1;
          const base = check ? 32 : 18;
          buf[idx] = base;
          buf[idx + 1] = base + 5;
          buf[idx + 2] = base + 15;
          buf[idx + 3] = 255;
        }
      }

      // 2. Draw procedural overlapping shapes with Porter-Duff source-over blending
      const circles = [
        { cx: 120, cy: 130, r: 75, col: [239, 68, 68] },   // Red
        { cx: 200, cy: 130, r: 75, col: [16, 185, 129] },  // Emerald
        { cx: 160, cy: 200, r: 75, col: [59, 130, 246] }   // Blue
      ];

      circles.forEach((c) => {
        const r2 = c.r * c.r;
        const minX = Math.max(0, Math.floor(c.cx - c.r));
        const maxX = Math.min(width - 1, Math.ceil(c.cx + c.r));
        const minY = Math.max(0, Math.floor(c.cy - c.r));
        const maxY = Math.min(height - 1, Math.ceil(c.cy + c.r));

        for (let py = minY; py <= maxY; py++) {
          const dy = py - c.cy;
          for (let px = minX; px <= maxX; px++) {
            const dx = px - c.cx;
            const dist2 = dx * dx + dy * dy;
            if (dist2 <= r2) {
              const idx = (py * width + px) * 4;
              const a = alphaVal;
              const invA = 1.0 - a;

              if (blendMode === 'add') {
                buf[idx] = Math.min(255, buf[idx] + Math.floor(c.col[0] * a));
                buf[idx + 1] = Math.min(255, buf[idx + 1] + Math.floor(c.col[1] * a));
                buf[idx + 2] = Math.min(255, buf[idx + 2] + Math.floor(c.col[2] * a));
              } else if (blendMode === 'mul') {
                buf[idx] = Math.floor((buf[idx] * c.col[0]) / 255);
                buf[idx + 1] = Math.floor((buf[idx + 1] * c.col[1]) / 255);
                buf[idx + 2] = Math.floor((buf[idx + 2] * c.col[2]) / 255);
              } else {
                // Standard Porter-Duff Source-Over
                buf[idx] = Math.floor(c.col[0] * a + buf[idx] * invA);
                buf[idx + 1] = Math.floor(c.col[1] * a + buf[idx + 1] * invA);
                buf[idx + 2] = Math.floor(c.col[2] * a + buf[idx + 2] * invA);
              }
            }
          }
        }
      });

      ctx.putImageData(imgData, 0, 0);
    };

    render();

    // Controls
    const slider = document.getElementById('fb-alpha-slider');
    const alphaLabel = document.getElementById('fb-alpha-val');
    if (slider) {
      slider.addEventListener('input', (e) => {
        alphaVal = parseFloat(e.target.value);
        if (alphaLabel) alphaLabel.textContent = alphaVal.toFixed(2);
        render();
      });
    }

    const blendBtns = [
      { id: 'fb-blend-norm', mode: 'normal' },
      { id: 'fb-blend-add', mode: 'add' },
      { id: 'fb-blend-mul', mode: 'mul' }
    ];
    blendBtns.forEach(({ id, mode }) => {
      const b = document.getElementById(id);
      if (b) {
        b.addEventListener('click', () => {
          blendBtns.forEach((item) => document.getElementById(item.id)?.classList.remove('active'));
          b.classList.add('active');
          blendMode = mode;
          render();
        });
      }
    });

    // Pixel Inspector
    const inspector = document.getElementById('fb-pixel-inspector');
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const x = Math.min(width - 1, Math.max(0, Math.floor((e.clientX - rect.left) * scaleX)));
      const y = Math.min(height - 1, Math.max(0, Math.floor((e.clientY - rect.top) * scaleY)));
      const idx = (y * width + x) * 4;
      const r = buf[idx], g = buf[idx + 1], b = buf[idx + 2], a = buf[idx + 3];

      if (inspector) {
        inspector.innerHTML = `<strong>Coord:</strong> (${x}, ${y}) &bull; <strong>Offset:</strong> [${idx}] &bull; <strong>RGBA:</strong> (${r}, ${g}, ${b}, ${a})`;
      }
    });

    // PPM Export
    const exportBtn = document.getElementById('btn-export-ppm');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        let ppmHeader = `P6\n${width} ${height}\n255\n`;
        const rgbBuffer = new Uint8Array(width * height * 3);
        let rgbIdx = 0;
        for (let i = 0; i < buf.length; i += 4) {
          rgbBuffer[rgbIdx++] = buf[i];
          rgbBuffer[rgbIdx++] = buf[i + 1];
          rgbBuffer[rgbIdx++] = buf[i + 2];
        }
        const blob = new Blob([ppmHeader, rgbBuffer], { type: 'image/x-portable-pixmap' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'framebuffer_export.ppm';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  // ==========================================================================
  // MODULE 02: BRESENHAM LINES & 3D WIREFRAME PREVIEW
  // ==========================================================================
  initBresenhamPreview(container) {
    container.innerHTML = `
      <div class="preview-toolbar">
        <div class="preview-chips-row">
          <span class="toolbar-label">Mode:</span>
          <button class="mode-chip active" id="bres-mode-3d">3D Wireframe Mesh</button>
          <button class="mode-chip" id="bres-mode-grid">24x24 Pixel Stepper</button>
        </div>
      </div>

      <div class="preview-canvas-box">
        <canvas id="bres-preview-canvas" width="320" height="320"></canvas>
      </div>

      <div class="preview-controls-grid" id="bres-controls-area">
        <div class="preview-control-row">
          <span>Rotation Speed:</span>
          <input type="range" id="bres-rot-slider" min="0" max="3" step="0.2" value="1.0" />
        </div>
      </div>

      <div class="preview-info-box" id="bres-info-box">
        Bresenham accumulator: D = 2&Delta;y - &Delta;x &bull; Integer step logic without float division!
      </div>
    `;

    const canvas = document.getElementById('bres-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 320, height = 320;

    let mode = '3d';
    let rotSpeed = 1.0;
    let angle = 0;

    // Integer Bresenham line algorithm
    const drawBresenhamLine = (x0, y0, x1, y1, color = '#34d399') => {
      x0 = Math.round(x0); y0 = Math.round(y0);
      x1 = Math.round(x1); y1 = Math.round(y1);

      ctx.fillStyle = color;
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = (x0 < x1) ? 1 : -1;
      const sy = (y0 < y1) ? 1 : -1;
      let err = dx - dy;

      while (true) {
        ctx.fillRect(x0, y0, 1, 1);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    };

    // 3D Cube Vertices & Edges
    const vertices = [
      [-1, -1, -1], [ 1, -1, -1], [ 1,  1, -1], [-1,  1, -1],
      [-1, -1,  1], [ 1, -1,  1], [ 1,  1,  1], [-1,  1,  1]
    ];
    const edges = [
      [0,1],[1,2],[2,3],[3,0], [4,5],[5,6],[6,7],[7,4], [0,4],[1,5],[2,6],[3,7]
    ];

    const loop = () => {
      ctx.fillStyle = '#080c10';
      ctx.fillRect(0, 0, width, height);

      if (mode === '3d') {
        angle += 0.015 * rotSpeed;
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const cosB = Math.cos(angle * 0.7), sinB = Math.sin(angle * 0.7);

        const projected = vertices.map(([x, y, z]) => {
          // Rotate Y and X
          const x1 = x * cosA + z * sinA;
          const z1 = -x * sinA + z * cosA;
          const y2 = y * cosB - z1 * sinB;
          const z2 = y * sinB + z1 * cosB + 3.2;

          return {
            x: width / 2 + (x1 * 220) / z2,
            y: height / 2 - (y2 * 220) / z2
          };
        });

        edges.forEach(([i, j]) => {
          drawBresenhamLine(projected[i].x, projected[i].y, projected[j].x, projected[j].y, '#10b981');
        });
      } else {
        // 24x24 Discrete Pixel Stepper Grid
        const grid = 20;
        const cellSize = width / grid;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        for (let i = 0; i <= grid; i++) {
          ctx.beginPath();
          ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, height);
          ctx.moveTo(0, i * cellSize); ctx.lineTo(width, i * cellSize);
          ctx.stroke();
        }

        const p0 = { x: 2, y: 3 };
        const p1 = { x: 17, y: 14 };

        // Draw discrete rasterized pixels
        let x0 = p0.x, y0 = p0.y, x1 = p1.x, y1 = p1.y;
        const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1, sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.75)';
          ctx.fillRect(x0 * cellSize + 1, y0 * cellSize + 1, cellSize - 2, cellSize - 2);
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; x0 += sx; }
          if (e2 < dx) { err += dx; y0 += sy; }
        }

        // Draw ideal vector line overlay
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p0.x * cellSize + cellSize / 2, p0.y * cellSize + cellSize / 2);
        ctx.lineTo(p1.x * cellSize + cellSize / 2, p1.y * cellSize + cellSize / 2);
        ctx.stroke();
      }

      this.previewAnimId = requestAnimationFrame(loop);
    };

    this.previewAnimId = requestAnimationFrame(loop);

    // Event binding
    const rotSlider = document.getElementById('bres-rot-slider');
    if (rotSlider) {
      rotSlider.addEventListener('input', (e) => {
        rotSpeed = parseFloat(e.target.value);
      });
    }

    const btn3d = document.getElementById('bres-mode-3d');
    const btnGrid = document.getElementById('bres-mode-grid');
    const infoBox = document.getElementById('bres-info-box');

    if (btn3d && btnGrid) {
      btn3d.addEventListener('click', () => {
        btn3d.classList.add('active');
        btnGrid.classList.remove('active');
        mode = '3d';
        if (infoBox) infoBox.textContent = '3D Rotating Wireframe Cube rendered with Bresenham Line Rasterizer!';
      });
      btnGrid.addEventListener('click', () => {
        btnGrid.classList.add('active');
        btn3d.classList.remove('active');
        mode = 'grid';
        if (infoBox) infoBox.textContent = 'Pixel Stepper: Green cells represent exact integer decision error evaluations!';
      });
    }
  }

  // ==========================================================================
  // MODULE 03: TRIANGLE RASTERIZATION & BARYCENTRIC MATH PREVIEW
  // ==========================================================================
  initTrianglePreview(container) {
    container.innerHTML = `
      <div class="preview-toolbar">
        <div class="preview-chips-row">
          <button class="mode-chip active" id="tri-show-aabb">Show AABB Box</button>
          <button class="mode-chip" id="tri-wire-toggle">Wireframe</button>
        </div>
      </div>

      <div class="preview-canvas-box">
        <canvas id="tri-preview-canvas" width="320" height="320"></canvas>
      </div>

      <div class="preview-info-box" id="tri-bary-info">
        Move cursor over triangle to evaluate Barycentric weights: (&lambda;0, &lambda;1, &lambda;2)
      </div>
    `;

    const canvas = document.getElementById('tri-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 320, height = 320;

    let showAABB = true;
    let showWire = false;

    let t = 0;
    const v0 = { x: 60, y: 250, col: [244, 63, 94] };   // Rose/Red
    const v1 = { x: 260, y: 230, col: [16, 185, 129] };  // Emerald/Green
    const v2 = { x: 160, y: 50, col: [56, 189, 248] };   // Sky/Blue

    // Pineda Edge function
    const edge = (ax, ay, bx, by, px, py) => (px - ax) * (by - ay) - (py - ay) * (bx - ax);

    const render = () => {
      t += 0.02;
      // Gentle animated float
      const curV2 = { x: 160 + Math.sin(t) * 45, y: 50 + Math.cos(t * 1.5) * 15, col: v2.col };

      ctx.fillStyle = '#080c10';
      ctx.fillRect(0, 0, width, height);

      // 1. Calculate AABB Bounding Box
      const minX = Math.max(0, Math.floor(Math.min(v0.x, v1.x, curV2.x)));
      const maxX = Math.min(width - 1, Math.ceil(Math.max(v0.x, v1.x, curV2.x)));
      const minY = Math.max(0, Math.floor(Math.min(v0.y, v1.y, curV2.y)));
      const maxY = Math.min(height - 1, Math.ceil(Math.max(v0.y, v1.y, curV2.y)));

      // 2. Rasterize via Barycentric Coordinates
      const area = edge(v0.x, v0.y, v1.x, v1.y, curV2.x, curV2.y);
      const invArea = 1.0 / area;

      const imgData = ctx.getImageData(0, 0, width, height);
      const buf = imgData.data;

      if (!showWire) {
        for (let py = minY; py <= maxY; py++) {
          for (let px = minX; px <= maxX; px++) {
            const w0 = edge(v1.x, v1.y, curV2.x, curV2.y, px, py);
            const w1 = edge(curV2.x, curV2.y, v0.x, v0.y, px, py);
            const w2 = edge(v0.x, v0.y, v1.x, v1.y, px, py);

            if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) {
              const b0 = Math.abs(w0 * invArea);
              const b1 = Math.abs(w1 * invArea);
              const b2 = Math.abs(w2 * invArea);

              const r = Math.min(255, Math.floor(b0 * v0.col[0] + b1 * v1.col[0] + b2 * curV2.col[0]));
              const g = Math.min(255, Math.floor(b0 * v0.col[1] + b1 * v1.col[1] + b2 * curV2.col[1]));
              const b = Math.min(255, Math.floor(b0 * v0.col[2] + b1 * v1.col[2] + b2 * curV2.col[2]));

              const idx = (py * width + px) * 4;
              buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b; buf[idx + 3] = 255;
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      // Draw wireframe overlay
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(v0.x, v0.y); ctx.lineTo(v1.x, v1.y); ctx.lineTo(curV2.x, curV2.y); ctx.closePath();
      ctx.stroke();

      // Draw AABB Bounding Box
      if (showAABB) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.setLineDash([]);
      }

      this.previewAnimId = requestAnimationFrame(render);
    };

    this.previewAnimId = requestAnimationFrame(render);

    document.getElementById('tri-show-aabb')?.addEventListener('click', (e) => {
      showAABB = !showAABB;
      e.target.classList.toggle('active', showAABB);
    });

    document.getElementById('tri-wire-toggle')?.addEventListener('click', (e) => {
      showWire = !showWire;
      e.target.classList.toggle('active', showWire);
    });
  }

  // ==========================================================================
  // MODULE 04: Z-BUFFER & DEPTH BUFFER PREVIEW
  // ==========================================================================
  initZBufferPreview(container) {
    container.innerHTML = `
      <div class="preview-toolbar">
        <div class="preview-chips-row">
          <button class="mode-chip active" id="zb-mode-color">Color</button>
          <button class="mode-chip" id="zb-mode-depth">Z-Depth Heatmap</button>
          <button class="mode-chip" id="zb-mode-split">Split 50/50</button>
        </div>
        <button class="mode-chip active" id="zb-toggle-depth">Depth Test: ON</button>
      </div>

      <div class="preview-canvas-box">
        <canvas id="zb-preview-canvas" width="320" height="320"></canvas>
      </div>

      <div class="preview-info-box" id="zb-info-box">
        Z-Buffer allocates 32-bit float per pixel: fragment discarded if z &ge; zBuffer[pixel]!
      </div>
    `;

    const canvas = document.getElementById('zb-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 320, height = 320;

    let viewMode = 'color'; // 'color', 'depth', 'split'
    let depthTestEnabled = true;
    let angle = 0;

    const zBuffer = new Float32Array(width * height);
    const imgData = ctx.createImageData(width, height);
    const buf32 = new Uint32Array(imgData.data.buffer);

    // 3 Intersecting Triangles in Cyclic Overlap
    const tris = [
      { v: [[-0.8, -0.6, -0.4], [0.8, -0.6,  0.4], [0.0,  0.8,  0.0]], col: (255<<24) | (80<<16)  | (70<<8)  | 240 }, // Red
      { v: [[ 0.6, -0.8,  0.4], [0.6,  0.8, -0.4], [-0.8, 0.0,  0.0]], col: (255<<24) | (70<<16)  | (200<<8) | 40  }, // Green
      { v: [[-0.6,  0.8,  0.2], [0.6,  0.6, -0.2], [ 0.0, -0.8,  0.4]], col: (255<<24) | (240<<16) | (140<<8) | 40  }  // Blue
    ];

    const render = () => {
      angle += 0.015;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);

      // Clear color and depth buffers
      buf32.fill(0xff080c10);
      zBuffer.fill(100.0); // Clear to far depth

      tris.forEach((tri) => {
        // Rotate vertices
        const proj = tri.v.map(([x, y, z]) => {
          const rx = x * cosA + z * sinA;
          const rz = -x * sinA + z * cosA + 2.4;
          return {
            x: width / 2 + (rx * 200) / rz,
            y: height / 2 - (y * 200) / rz,
            z: rz
          };
        });

        // Simple rasterization
        const minX = Math.max(0, Math.floor(Math.min(proj[0].x, proj[1].x, proj[2].x)));
        const maxX = Math.min(width - 1, Math.ceil(Math.max(proj[0].x, proj[1].x, proj[2].x)));
        const minY = Math.max(0, Math.floor(Math.min(proj[0].y, proj[1].y, proj[2].y)));
        const maxY = Math.min(height - 1, Math.ceil(Math.max(proj[0].y, proj[1].y, proj[2].y)));

        const area = (proj[1].x - proj[0].x) * (proj[2].y - proj[0].y) - (proj[1].y - proj[0].y) * (proj[2].x - proj[0].x);
        if (Math.abs(area) < 0.001) return;
        const invArea = 1.0 / area;

        for (let py = minY; py <= maxY; py++) {
          for (let px = minX; px <= maxX; px++) {
            const w0 = (proj[2].x - proj[1].x) * (py - proj[1].y) - (proj[2].y - proj[1].y) * (px - proj[1].x);
            const w1 = (proj[0].x - proj[2].x) * (py - proj[2].y) - (proj[0].y - proj[2].y) * (px - proj[2].x);
            const w2 = (proj[1].x - proj[0].x) * (py - proj[0].y) - (proj[1].y - proj[0].y) * (px - proj[0].x);

            if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) {
              const b0 = Math.abs(w0 * invArea);
              const b1 = Math.abs(w1 * invArea);
              const b2 = Math.abs(w2 * invArea);
              const z = b0 * proj[0].z + b1 * proj[1].z + b2 * proj[2].z;
              const idx = py * width + px;

              if (!depthTestEnabled || z < zBuffer[idx]) {
                zBuffer[idx] = z;

                const isDepthHalf = (viewMode === 'depth') || (viewMode === 'split' && px > width / 2);
                if (isDepthHalf) {
                  const normZ = Math.max(0, Math.min(1, (z - 1.6) / 1.6));
                  const depthByte = Math.floor((1.0 - normZ) * 255);
                  buf32[idx] = (255 << 24) | (depthByte << 16) | (depthByte << 8) | depthByte;
                } else {
                  buf32[idx] = tri.col;
                }
              }
            }
          }
        }
      });

      ctx.putImageData(imgData, 0, 0);
      this.previewAnimId = requestAnimationFrame(render);
    };

    this.previewAnimId = requestAnimationFrame(render);

    const btnDepthToggle = document.getElementById('zb-toggle-depth');
    if (btnDepthToggle) {
      btnDepthToggle.addEventListener('click', () => {
        depthTestEnabled = !depthTestEnabled;
        btnDepthToggle.classList.toggle('active', depthTestEnabled);
        btnDepthToggle.textContent = depthTestEnabled ? 'Depth Test: ON' : 'Depth Test: OFF (Painter Error!)';
      });
    }

    const setMode = (m) => {
      viewMode = m;
      ['zb-mode-color', 'zb-mode-depth', 'zb-mode-split'].forEach((id) => {
        document.getElementById(id)?.classList.toggle('active', id === `zb-mode-${m}`);
      });
    };

    document.getElementById('zb-mode-color')?.addEventListener('click', () => setMode('color'));
    document.getElementById('zb-mode-depth')?.addEventListener('click', () => setMode('depth'));
    document.getElementById('zb-mode-split')?.addEventListener('click', () => setMode('split'));
  }

  // ==========================================================================
  // MODULE 05: 3D MATH & MODEL-VIEW-PROJECTION (MVP) MATRIX PREVIEW
  // ==========================================================================
  initMVPPreview(container) {
    container.innerHTML = `
      <div class="preview-canvas-box">
        <canvas id="mvp-preview-canvas" width="320" height="320"></canvas>
      </div>

      <div class="preview-controls-grid">
        <div class="preview-control-row">
          <span>Rotate Y (&theta;):</span>
          <input type="range" id="mvp-slider-roty" min="-3.14" max="3.14" step="0.05" value="0.5" />
        </div>
        <div class="preview-control-row">
          <span>Camera FOV:</span>
          <input type="range" id="mvp-slider-fov" min="30" max="90" step="1" value="60" />
        </div>
      </div>

      <div class="matrix-grid-display" id="mvp-matrix-cells">
        <!-- Rendered dynamically -->
      </div>
    `;

    const canvas = document.getElementById('mvp-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 320, height = 320;

    let rotY = 0.5;
    let fov = 60;

    const vertices = [
      [-1, -1, -1], [ 1, -1, -1], [ 1,  1, -1], [-1,  1, -1],
      [-1, -1,  1], [ 1, -1,  1], [ 1,  1,  1], [-1,  1,  1]
    ];
    const edges = [
      [0,1],[1,2],[2,3],[3,0], [4,5],[5,6],[6,7],[7,4], [0,4],[1,5],[2,6],[3,7]
    ];

    const render = () => {
      ctx.fillStyle = '#080c10';
      ctx.fillRect(0, 0, width, height);

      const radFOV = (fov * Math.PI) / 180;
      const f = 1.0 / Math.tan(radFOV / 2);
      const aspect = 1.0;

      // 4x4 MVP elements
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      // Model-View-Projection product matrix
      const m00 = f * cosY, m02 = f * sinY;
      const m11 = f;
      const m32 = 1.0, m33 = 2.5;

      // Update matrix display
      const matrixBox = document.getElementById('mvp-matrix-cells');
      if (matrixBox) {
        matrixBox.innerHTML = `
          <div class="matrix-cell">${m00.toFixed(2)}</div><div class="matrix-cell">0.00</div><div class="matrix-cell">${m02.toFixed(2)}</div><div class="matrix-cell">0.00</div>
          <div class="matrix-cell">0.00</div><div class="matrix-cell">${m11.toFixed(2)}</div><div class="matrix-cell">0.00</div><div class="matrix-cell">0.00</div>
          <div class="matrix-cell">0.00</div><div class="matrix-cell">0.00</div><div class="matrix-cell">-1.02</div><div class="matrix-cell">-0.20</div>
          <div class="matrix-cell">0.00</div><div class="matrix-cell">0.00</div><div class="matrix-cell">${m32.toFixed(2)}</div><div class="matrix-cell">${m33.toFixed(2)}</div>
        `;
      }

      // Draw coordinate gimbal axes
      const origin = { x: width / 2, y: height / 2 };
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ef4444'; // X Red
      ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(origin.x + cosY * 50, origin.y); ctx.stroke();
      ctx.strokeStyle = '#10b981'; // Y Green
      ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(origin.x, origin.y - 50); ctx.stroke();
      ctx.strokeStyle = '#3b82f6'; // Z Blue
      ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(origin.x - sinY * 50, origin.y + 20); ctx.stroke();

      // Transform cube vertices by MVP
      const projected = vertices.map(([x, y, z]) => {
        const xRot = x * cosY + z * sinY;
        const zRot = -x * sinY + z * cosY + 3.0;
        const clipW = zRot;
        const ndcX = (xRot * f) / clipW;
        const ndcY = (y * f) / clipW;
        return {
          x: width / 2 + ndcX * 100,
          y: height / 2 - ndcY * 100
        };
      });

      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1.5;
      edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projected[i].x, projected[i].y);
        ctx.lineTo(projected[j].x, projected[j].y);
        ctx.stroke();
      });

      this.previewAnimId = requestAnimationFrame(render);
    };

    this.previewAnimId = requestAnimationFrame(render);

    document.getElementById('mvp-slider-roty')?.addEventListener('input', (e) => {
      rotY = parseFloat(e.target.value);
    });
    document.getElementById('mvp-slider-fov')?.addEventListener('input', (e) => {
      fov = parseFloat(e.target.value);
    });
  }

  // ==========================================================================
  // MODULE 06: SOFTWARE RAYTRACER PREVIEW
  // ==========================================================================
  initRaytracerPreview(container) {
    container.innerHTML = `
      <div class="preview-toolbar">
        <div class="preview-chips-row">
          <button class="mode-chip active" id="rt-mode-full">Full Raytrace</button>
          <button class="mode-chip" id="rt-mode-norm">Normals</button>
          <button class="mode-chip" id="rt-mode-spec">Specular</button>
        </div>
      </div>

      <div class="preview-canvas-box">
        <canvas id="rt-preview-canvas" width="160" height="160" style="width:320px;height:320px;"></canvas>
      </div>

      <div class="preview-controls-grid">
        <div class="preview-control-row">
          <span>Point Light X Position:</span>
          <input type="range" id="rt-light-x" min="-4" max="4" step="0.2" value="1.5" />
        </div>
      </div>

      <div class="preview-info-box" id="rt-info-box">
        Backward ray tracing: Primary rays solve quadratic equation at<sup>2</sup> + bt + c = 0!
      </div>
    `;

    const canvas = document.getElementById('rt-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 160, height = 160;
    const imgData = ctx.createImageData(width, height);
    const buf32 = new Uint32Array(imgData.data.buffer);

    let lightX = 1.5;
    let mode = 'full';

    const spheres = [
      { cx: -0.7, cy: 0.1, cz: 2.8, r: 0.5, col: [239, 68, 68], spec: 32 },  // Red
      { cx:  0.7, cy: 0.2, cz: 3.2, r: 0.6, col: [16, 185, 129], spec: 64 }, // Green
      { cx:  0.0, cy: -0.2, cz: 2.0, r: 0.35, col: [59, 130, 246], spec: 128 } // Blue
    ];

    const render = () => {
      const lx = lightX, ly = 2.5, lz = 1.0;

      for (let y = 0; y < height; y++) {
        const vy = -(y - height / 2) / (height / 2);
        for (let x = 0; x < width; x++) {
          const vx = (x - width / 2) / (width / 2);
          const dirLen = Math.sqrt(vx * vx + vy * vy + 1.0);
          const dx = vx / dirLen, dy = vy / dirLen, dz = 1.0 / dirLen;

          let nearestT = 1e9;
          let hitSphere = null;

          // Ray-sphere intersection
          for (let s of spheres) {
            const ocx = -s.cx, ocy = -s.cy, ocz = -s.cz;
            const b = 2.0 * (dx * ocx + dy * ocy + dz * ocz);
            const c = (ocx * ocx + ocy * ocy + ocz * ocz) - s.r * s.r;
            const disc = b * b - 4.0 * c;
            if (disc > 0) {
              const t = (-b - Math.sqrt(disc)) * 0.5;
              if (t > 0 && t < nearestT) {
                nearestT = t;
                hitSphere = s;
              }
            }
          }

          const idx = y * width + x;
          if (hitSphere) {
            const hx = dx * nearestT, hy = dy * nearestT, hz = dz * nearestT;
            const nx = (hx - hitSphere.cx) / hitSphere.r;
            const ny = (hy - hitSphere.cy) / hitSphere.r;
            const nz = (hz - hitSphere.cz) / hitSphere.r;

            if (mode === 'norm') {
              const nr = Math.floor((nx * 0.5 + 0.5) * 255);
              const ng = Math.floor((ny * 0.5 + 0.5) * 255);
              const nb = Math.floor((nz * 0.5 + 0.5) * 255);
              buf32[idx] = (255 << 24) | (nb << 16) | (ng << 8) | nr;
            } else {
              // Light direction & Lambertian Diffuse
              const toLx = lx - hx, toLy = ly - hy, toLz = lz - hz;
              const distL = Math.sqrt(toLx * toLx + toLy * toLy + toLz * toLz);
              const normLx = toLx / distL, normLy = toLy / distL, normLz = toLz / distL;

              const diff = Math.max(0, nx * normLx + ny * normLy + nz * normLz);

              // Specular Blinn-Phong
              const hHalfX = normLx - dx, hHalfY = normLy - dy, hHalfZ = normLz - dz;
              const hLen = Math.sqrt(hHalfX * hHalfX + hHalfY * hHalfY + hHalfZ * hHalfZ);
              const specAngle = Math.max(0, (nx * hHalfX + ny * hHalfY + nz * hHalfZ) / hLen);
              const spec = Math.pow(specAngle, hitSphere.spec);

              let r = 0, g = 0, b = 0;
              if (mode === 'spec') {
                r = g = b = Math.min(255, Math.floor(spec * 255));
              } else {
                r = Math.min(255, Math.floor(hitSphere.col[0] * (0.15 + diff * 0.75) + spec * 180));
                g = Math.min(255, Math.floor(hitSphere.col[1] * (0.15 + diff * 0.75) + spec * 180));
                b = Math.min(255, Math.floor(hitSphere.col[2] * (0.15 + diff * 0.75) + spec * 180));
              }
              buf32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
            }
          } else {
            // Checkered floor plane at y = -0.7
            if (dy < -0.05) {
              const floorT = (-0.7) / dy;
              const fx = dx * floorT, fz = dz * floorT;
              const check = ((Math.floor(fx * 2) ^ Math.floor(fz * 2)) & 1);
              const c = check ? 45 : 20;
              buf32[idx] = (255 << 24) | (c << 16) | (c << 8) | c;
            } else {
              buf32[idx] = 0xff080c10; // Background void
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      this.previewAnimId = requestAnimationFrame(render);
    };

    this.previewAnimId = requestAnimationFrame(render);

    document.getElementById('rt-light-x')?.addEventListener('input', (e) => {
      lightX = parseFloat(e.target.value);
    });

    const setMode = (m) => {
      mode = m;
      ['rt-mode-full', 'rt-mode-norm', 'rt-mode-spec'].forEach((id) => {
        document.getElementById(id)?.classList.toggle('active', id === `rt-mode-${m}`);
      });
    };

    document.getElementById('rt-mode-full')?.addEventListener('click', () => setMode('full'));
    document.getElementById('rt-mode-norm')?.addEventListener('click', () => setMode('norm'));
    document.getElementById('rt-mode-spec')?.addEventListener('click', () => setMode('spec'));
  }

  // ==========================================================================
  // MODULE 07: GPU HARDWARE PIPELINE & SIMT WARP PREVIEW
  // ==========================================================================
  initPipelinePreview(container) {
    container.innerHTML = `
      <div class="pipeline-diagram">
        <button class="pipeline-stage-btn active" data-stage="vs">
          <span>1. Vertex Shader (SIMT Warp)</span>
          <span style="color:#10b981;">32 Threads / Lane</span>
        </button>
        <button class="pipeline-stage-btn" data-stage="pa">
          <span>2. Primitive Assembly &amp; Clip</span>
          <span style="color:#fbbf24;">Triangle Setup</span>
        </button>
        <button class="pipeline-stage-btn" data-stage="ras">
          <span>3. Hardware Rasterizer</span>
          <span style="color:#38bdf8;">Fragment Generation</span>
        </button>
        <button class="pipeline-stage-btn" data-stage="fs">
          <span>4. Fragment Shader (Pixel Warp)</span>
          <span style="color:#f43f5e;">PBR &amp; Texture Filter</span>
        </button>
        <button class="pipeline-stage-btn" data-stage="rop">
          <span>5. ROP &amp; Blending to VRAM</span>
          <span style="color:#a855f7;">FrameBuffer Output</span>
        </button>
      </div>

      <div class="preview-info-box" id="pipeline-stage-desc">
        <strong>Stage 1: Vertex Shader</strong><br/>
        Executes per-vertex in 32-wide SIMT warps. Evaluates MVP transformation matrix and outputs Homogeneous clip coordinates.
      </div>
    `;

    const descBox = document.getElementById('pipeline-stage-desc');
    const descriptions = {
      vs: '<strong>Stage 1: Vertex Shader (SIMT)</strong><br/>Executes per-vertex in lockstep 32-wide warps. Evaluates MVP transform and normal vectors without branch divergence.',
      pa: '<strong>Stage 2: Primitive Assembly</strong><br/>Groups incoming transformed vertices into triangles, performs view-frustum clipping, and executes backface culling.',
      ras: '<strong>Stage 3: Hardware Rasterizer</strong><br/>Interpolates vertex attributes across screen space using fixed-function hardware barycentric units. Emits pixel fragment packets.',
      fs: '<strong>Stage 4: Fragment Shader</strong><br/>Executes per-fragment shading (PBR lighting, textures, normal maps). Evaluates derivative instructions (dFdx/dFdy) for mipmapping.',
      rop: '<strong>Stage 5: Raster Operations (ROP)</strong><br/>Performs Z-depth testing, stencil masking, and Porter-Duff alpha blending directly before writing to high-speed VRAM.'
    };

    container.querySelectorAll('.pipeline-stage-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.pipeline-stage-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const stage = btn.dataset.stage;
        if (descBox) descBox.innerHTML = descriptions[stage] || '';
      });
    });
  }

  // ==========================================================================
  // MODULE 08: MODERN API COMPARISON (VULKAN vs OPENGL vs WEBGPU)
  // ==========================================================================
  initApiComparePreview(container) {
    container.innerHTML = `
      <div class="preview-toolbar">
        <div class="preview-chips-row">
          <button class="mode-chip active" id="api-btn-vk">Vulkan 1.3</button>
          <button class="mode-chip" id="api-btn-gl">OpenGL 4.5+</button>
          <button class="mode-chip" id="api-btn-wg">WebGPU (WGSL)</button>
        </div>
      </div>

      <div class="preview-canvas-box">
        <canvas id="api-preview-canvas" width="320" height="320"></canvas>
      </div>

      <div class="preview-info-box" id="api-code-snippet">
        <strong>Vulkan 1.3 Command Stream:</strong><br/>
        <code>vkBeginCommandBuffer(cmd);<br/>vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, pso);<br/>vkCmdDraw(cmd, 3, 1, 0, 0);<br/>vkQueueSubmit(queue, 1, &submitInfo, fence);</code>
      </div>
    `;

    const canvas = document.getElementById('api-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 320, height = 320;
    let angle = 0;

    const render = () => {
      angle += 0.02;
      ctx.fillStyle = '#080c10';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(angle);

      // Draw stylized modern API triangle
      const r = 90;
      const grad = ctx.createLinearGradient(-r, -r, r, r);
      grad.addColorStop(0, '#e03131');
      grad.addColorStop(0.5, '#10b981');
      grad.addColorStop(1, '#3b82f6');

      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.866, r * 0.5);
      ctx.lineTo(-r * 0.866, r * 0.5);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
      this.previewAnimId = requestAnimationFrame(render);
    };

    this.previewAnimId = requestAnimationFrame(render);

    const snippetBox = document.getElementById('api-code-snippet');
    const snippets = {
      vk: '<strong>Vulkan 1.3 Command Stream (Explicit PSO):</strong><br/><code>vkBeginCommandBuffer(cmd);<br/>vkCmdBindPipeline(cmd, VK_PIPELINE_BIND_POINT_GRAPHICS, pso);<br/>vkCmdDraw(cmd, 3, 1, 0, 0);<br/>vkQueueSubmit(queue, 1, &submitInfo, fence);</code>',
      gl: '<strong>OpenGL 4.5+ Global State Machine:</strong><br/><code>glUseProgram(shaderProgram);<br/>glBindVertexArray(vao);<br/>glDrawArrays(GL_TRIANGLES, 0, 3);</code>',
      wg: '<strong>WebGPU Modern Async Pipelines (WGSL):</strong><br/><code>const pass = encoder.beginRenderPass(descriptor);<br/>pass.setPipeline(renderPipeline);<br/>pass.draw(3);<br/>device.queue.submit([encoder.finish()]);</code>'
    };

    const setApi = (key) => {
      ['api-btn-vk', 'api-btn-gl', 'api-btn-wg'].forEach((id) => {
        document.getElementById(id)?.classList.toggle('active', id === `api-btn-${key}`);
      });
      if (snippetBox) snippetBox.innerHTML = snippets[key];
    };

    document.getElementById('api-btn-vk')?.addEventListener('click', () => setApi('vk'));
    document.getElementById('api-btn-gl')?.addEventListener('click', () => setApi('gl'));
    document.getElementById('api-btn-wg')?.addEventListener('click', () => setApi('wg'));
  }

  // ==========================================================================
  // MODULE 09: PHYSICALLY BASED RENDERING (PBR) & COOK-TORRANCE BRDF PREVIEW
  // ==========================================================================
  initPbrPreview(container) {
    container.innerHTML = `
      <div class="preview-toolbar">
        <div class="color-chips-row">
          <span class="toolbar-label">Preset:</span>
          <div class="pbr-color-chip active" style="background:#eab308;" data-r="234" data-g="179" data-b="8" data-rough="0.18" data-metal="0.95" title="Gold"></div>
          <div class="pbr-color-chip" style="background:#f97316;" data-r="249" data-g="115" data-b="22" data-rough="0.25" data-metal="0.9" title="Copper"></div>
          <div class="pbr-color-chip" style="background:#10b981;" data-r="16" data-g="185" data-b="129" data-rough="0.3" data-metal="0.0" title="Emerald Plastic"></div>
          <div class="pbr-color-chip" style="background:#e2e8f0;" data-r="226" data-g="232" data-b="240" data-rough="0.1" data-metal="1.0" title="Titanium"></div>
        </div>
      </div>

      <div class="preview-canvas-box">
        <canvas id="pbr-preview-canvas" width="200" height="200" style="width:320px;height:320px;"></canvas>
      </div>

      <div class="preview-controls-grid">
        <div class="preview-control-row">
          <span>Roughness (&alpha;):</span>
          <input type="range" id="pbr-slider-rough" min="0.05" max="1.0" step="0.02" value="0.18" />
        </div>
        <div class="preview-control-row">
          <span>Metallic (m):</span>
          <input type="range" id="pbr-slider-metal" min="0.0" max="1.0" step="0.02" value="0.95" />
        </div>
      </div>

      <div class="preview-info-box" id="pbr-info-box">
        Cook-Torrance Specular BRDF: f<sub>r</sub> = (D &times; F &times; G) / (4 &times; (n&middot;l)(n&middot;v))
      </div>
    `;

    const canvas = document.getElementById('pbr-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 200, height = 200;
    const imgData = ctx.createImageData(width, height);
    const buf32 = new Uint32Array(imgData.data.buffer);

    let roughness = 0.18;
    let metallic = 0.95;
    let baseColor = [234, 179, 8]; // Gold

    const render = () => {
      const radius = 80;
      const lx = 0.577, ly = 0.577, lz = 0.577; // Normalized directional light

      for (let y = 0; y < height; y++) {
        const py = (height / 2 - y);
        for (let x = 0; x < width; x++) {
          const px = (x - width / 2);
          const dist2 = px * px + py * py;
          const idx = y * width + x;

          if (dist2 <= radius * radius) {
            const pz = Math.sqrt(radius * radius - dist2);
            const nx = px / radius, ny = py / radius, nz = pz / radius;

            // View direction V = (0, 0, 1)
            const nDotL = Math.max(0, nx * lx + ny * ly + nz * lz);
            const nDotV = nz; // since V = (0, 0, 1)

            // Halfway vector H
            const hx = lx, hy = ly, hz = lz + 1.0;
            const hLen = Math.sqrt(hx * hx + hy * hy + hz * hz);
            const nhx = hx / hLen, nhy = hy / hLen, nhz = hz / hLen;

            const nDotH = Math.max(0, nx * nhx + ny * nhy + nz * nhz);
            const vDotH = Math.max(0, nhz);

            // 1. Normal Distribution D (GGX)
            const a = roughness * roughness;
            const a2 = a * a;
            const denomD = (nDotH * nDotH * (a2 - 1.0) + 1.0);
            const D = a2 / (Math.PI * denomD * denomD);

            // 2. Fresnel F (Schlick)
            // Dielectric F0 = 0.04, Metallic F0 = baseColor
            const f0R = (1.0 - metallic) * 0.04 + metallic * (baseColor[0] / 255);
            const f0G = (1.0 - metallic) * 0.04 + metallic * (baseColor[1] / 255);
            const f0B = (1.0 - metallic) * 0.04 + metallic * (baseColor[2] / 255);

            const fresnelFactor = Math.pow(1.0 - vDotH, 5.0);
            const FR = f0R + (1.0 - f0R) * fresnelFactor;
            const FG = f0G + (1.0 - f0G) * fresnelFactor;
            const FB = f0B + (1.0 - f0B) * fresnelFactor;

            // 3. Geometry G (Smith GGX)
            const k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
            const g1L = nDotL / (nDotL * (1.0 - k) + k);
            const g1V = nDotV / (nDotV * (1.0 - k) + k);
            const G = g1L * g1V;

            // Specular Cook-Torrance
            const specDenom = Math.max(0.001, 4.0 * nDotL * nDotV);
            const specR = (D * FR * G) / specDenom;
            const specG = (D * FG * G) / specDenom;
            const specB = (D * FB * G) / specDenom;

            // Diffuse component (Lambert)
            const kd = (1.0 - metallic) * (1.0 - (FR + FG + FB) / 3.0);
            const diffR = kd * (baseColor[0] / 255) / Math.PI;
            const diffG = kd * (baseColor[1] / 255) / Math.PI;
            const diffB = kd * (baseColor[2] / 255) / Math.PI;

            const finalR = Math.min(255, Math.floor((diffR + specR) * nDotL * 255 * 3.14 + 10));
            const finalG = Math.min(255, Math.floor((diffG + specG) * nDotL * 255 * 3.14 + 10));
            const finalB = Math.min(255, Math.floor((diffB + specB) * nDotL * 255 * 3.14 + 10));

            buf32[idx] = (255 << 24) | (finalB << 16) | (finalG << 8) | finalR;
          } else {
            buf32[idx] = 0xff080c10;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };

    render();

    document.getElementById('pbr-slider-rough')?.addEventListener('input', (e) => {
      roughness = parseFloat(e.target.value);
      render();
    });

    document.getElementById('pbr-slider-metal')?.addEventListener('input', (e) => {
      metallic = parseFloat(e.target.value);
      render();
    });

    container.querySelectorAll('.pbr-color-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.pbr-color-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        baseColor = [
          parseInt(chip.dataset.r, 10),
          parseInt(chip.dataset.g, 10),
          parseInt(chip.dataset.b, 10)
        ];
        if (chip.dataset.rough) {
          roughness = parseFloat(chip.dataset.rough);
          const rSlider = document.getElementById('pbr-slider-rough');
          if (rSlider) rSlider.value = roughness;
        }
        if (chip.dataset.metal) {
          metallic = parseFloat(chip.dataset.metal);
          const mSlider = document.getElementById('pbr-slider-metal');
          if (mSlider) mSlider.value = metallic;
        }
        render();
      });
    });
  }
}
