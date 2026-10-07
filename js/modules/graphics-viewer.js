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
  // MODULE 07: GPU HARDWARE PIPELINE, MULTI-PASS ARCHITECTURE & LIVE 5-PASS RENDERER
  // ==========================================================================
  initPipelinePreview(container) {
    container.innerHTML = `
      <div class="preview-toolbar">
        <div class="preview-chips-row" style="margin-bottom:0.35rem;">
          <span class="toolbar-label">Pass View:</span>
          <button class="mode-chip active" id="mp-view-final">Final (5 Passes)</button>
          <button class="mode-chip" id="mp-view-depth">1. Depth Pre-Pass</button>
          <button class="mode-chip" id="mp-view-shadow">2. Perspective Shadow</button>
          <button class="mode-chip" id="mp-view-normals">3. G-Buffer Normals</button>
          <button class="mode-chip" id="mp-view-stencil">4. Stencil Volume</button>
        </div>
      </div>

      <div class="preview-canvas-box">
        <canvas id="pipeline-live-canvas" width="180" height="180" style="width:320px;height:320px;image-rendering:pixelated;"></canvas>
      </div>

      <div class="preview-controls-grid">
        <div class="preview-control-row">
          <span>Spotlight Orbit Angle:</span>
          <input type="range" id="mp-slider-lightangle" min="-3.14" max="3.14" step="0.08" value="0.7" />
        </div>
        <div class="preview-control-row">
          <span>Light Volume Radius (Stencil):</span>
          <input type="range" id="mp-slider-radius" min="1.5" max="4.0" step="0.1" value="2.8" />
        </div>
        <div class="preview-control-row" style="justify-content:flex-start;gap:1.5rem;">
          <label style="display:flex;align-items:center;gap:0.4rem;cursor:pointer;">
            <input type="checkbox" id="mp-chk-msaa" checked style="accent-color:#10b981;cursor:pointer;" />
            <span style="font-weight:600;color:#34d399;">5. 4x MSAA Resolve</span>
          </label>
          <span id="mp-fps-counter" style="color:#94a3b8;font-family:monospace;font-size:0.75rem;">60 FPS &middot; 5 Passes</span>
        </div>
      </div>

      <div class="preview-info-box" id="pipeline-stage-desc">
        <!-- Explains active pass -->
      </div>

      <div class="preview-toolbar" style="margin-top:1rem;margin-bottom:0.4rem;">
        <div class="preview-chips-row">
          <span class="toolbar-label">Inspector:</span>
          <button class="mode-chip active" id="pipe-tab-stages">Hardware Stages (IA → ROP)</button>
          <button class="mode-chip" id="pipe-tab-passes">Frame Graph Passes</button>
        </div>
      </div>

      <div class="pipeline-diagram" id="pipeline-stages-container">
        <!-- Injected dynamically -->
      </div>
    `;

    // ------------------------------------------------------------------------
    // Real-Time 5-Pass Software Renderer Execution Loop
    // ------------------------------------------------------------------------
    const canvas = document.getElementById('pipeline-live-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 180, H = 180;
    const imgData = ctx.createImageData(W, H);
    const buf32 = new Uint32Array(imgData.data.buffer);

    let passMode = 'final';
    let lightAngle = 0.7;
    let lightRadius = 2.8;
    let msaaEnabled = true;
    let cubeRot = 0.0;

    // Buffer allocations for our 5 passes
    const depthPrepass = new Float32Array(W * H);
    const shadowMapRes = 64;
    const shadowMap = new Float32Array(shadowMapRes * shadowMapRes);
    const gNormalX = new Float32Array(W * H);
    const gNormalY = new Float32Array(W * H);
    const gNormalZ = new Float32Array(W * H);
    const gAlbedoR = new Uint8Array(W * H);
    const gAlbedoG = new Uint8Array(W * H);
    const gAlbedoB = new Uint8Array(W * H);
    const gDepth = new Float32Array(W * H);
    const gWorldX = new Float32Array(W * H);
    const gWorldY = new Float32Array(W * H);
    const gWorldZ = new Float32Array(W * H);
    const stencilMask = new Uint8Array(W * H);
    const hdrR = new Float32Array(W * H);
    const hdrG = new Float32Array(W * H);
    const hdrB = new Float32Array(W * H);

    const descBox = document.getElementById('pipeline-stage-desc');
    const passDescriptions = {
      final: '<strong>Final Composited Output (5 Passes):</strong><br/>1. Depth Pre-Pass discards occlusions &rarr; 2. Perspective Spotlight Shadow Map evaluated &rarr; 3. G-Buffer MRT &rarr; 4. Stencil Volume restricts lighting to sphere bounds &rarr; 5. 4x MSAA Resolve reconstructs smooth edges.',
      depth: '<strong>Pass 1: Depth Pre-Pass (Early-Z Population):</strong><br/>Scene geometry is rendered with color writes completely disabled. Depth values populate on-chip Z-buffer, allowing subsequent deferred passes to execute with 0% fragment overdraw.',
      shadow: '<strong>Pass 2: Perspective Shadow Map:</strong><br/>Rendered from the spotlight\'s viewpoint using a true 60&deg; perspective frustum projection matrix. Darker pixels represent geometry closer to the light source.',
      normals: '<strong>Pass 3: Deferred Base Pass (G-Buffer Normals):</strong><br/>MRT normal attachment encoding world-space normal vectors (Nx, Ny, Nz) mapped to RGB [0, 1]. Early-Z test rejects any occluded fragments.',
      stencil: '<strong>Pass 4: Stencil Volume Mask:</strong><br/>Green fragments indicate pixels bounded inside the spotlight\'s spherical light volume (stencil=1). Fragments outside the volume are skipped at ZERO lighting cost!'
    };

    if (descBox) descBox.innerHTML = passDescriptions[passMode];

    const render = () => {
      cubeRot += 0.015;

      // Spotlight position in 3D world
      const lx = Math.sin(lightAngle) * 1.6;
      const ly = 2.1;
      const lz = 1.8 + Math.cos(lightAngle) * 1.3;

      // Spotlight direction & perspective frustum projection
      const spotDirX = -lx, spotDirY = -ly, spotDirZ = 1.8 - lz;
      const spotDirLen = Math.sqrt(spotDirX * spotDirX + spotDirY * spotDirY + spotDirZ * spotDirZ);
      const sDirX = spotDirX / spotDirLen, sDirY = spotDirY / spotDirLen, sDirZ = spotDirZ / spotDirLen;

      // ----------------------------------------------------------------------
      // PASS 1: DEPTH PRE-PASS
      // ----------------------------------------------------------------------
      depthPrepass.fill(1e9);

      // Ray-geometry setup for camera at (0, 0.9, -1.0) looking toward (0, -0.1, 1.8)
      const camEyeY = 0.9;
      const sphereX = -0.55, sphereY = -0.25, sphereZ = 1.5, sphereR = 0.45;
      const cubeX = 0.45, cubeY = -0.2, cubeZ = 1.8, cubeHalf = 0.32;

      // Cube rotation matrix components
      const cosC = Math.cos(cubeRot), sinC = Math.sin(cubeRot);

      for (let y = 0; y < H; ++y) {
        const vy = -(y - H / 2) / (H * 0.75);
        for (let x = 0; x < W; ++x) {
          const vx = (x - W / 2) / (W * 0.75);
          const dirLen = Math.sqrt(vx * vx + vy * vy + 1.0);
          const dx = vx / dirLen, dy = vy / dirLen, dz = 1.0 / dirLen;
          const idx = y * W + x;

          let nearestT = 1e9;

          // 1. Sphere intersection
          const ocx = -sphereX, ocy = camEyeY - sphereY, ocz = -1.0 - sphereZ;
          const b = 2.0 * (dx * ocx + dy * ocy + dz * ocz);
          const c = (ocx * ocx + ocy * ocy + ocz * ocz) - sphereR * sphereR;
          const disc = b * b - 4.0 * c;
          if (disc > 0) {
            const t = (-b - Math.sqrt(disc)) * 0.5;
            if (t > 0 && t < nearestT) nearestT = t;
          }

          // 2. Rotating Cube (Slab ray-box intersection in local space)
          const roX = -cubeX, roY = camEyeY - cubeY, roZ = -1.0 - cubeZ;
          // Rotate ray into cube local frame
          const ldx = dx * cosC - dz * sinC;
          const ldy = dy;
          const ldz = dx * sinC + dz * cosC;
          const lox = roX * cosC - roZ * sinC;
          const loy = roY;
          const loz = roX * sinC + roZ * cosC;

          const invDx = 1.0 / (ldx || 1e-6);
          const invDy = 1.0 / (ldy || 1e-6);
          const invDz = 1.0 / (ldz || 1e-6);

          const t1x = (-cubeHalf - lox) * invDx, t2x = (cubeHalf - lox) * invDx;
          const t1y = (-cubeHalf - loy) * invDy, t2y = (cubeHalf - loy) * invDy;
          const t1z = (-cubeHalf - loz) * invDz, t2z = (cubeHalf - loz) * invDz;

          const tMin = Math.max(Math.max(Math.min(t1x, t2x), Math.min(t1y, t2y)), Math.min(t1z, t2z));
          const tMax = Math.min(Math.min(Math.max(t1x, t2x), Math.max(t1y, t2y)), Math.max(t1z, t2z));

          if (tMax >= Math.max(0.0, tMin) && tMin < nearestT) {
            nearestT = tMin;
          }

          // 3. Ground plane at y = -0.7
          if (dy < -0.01) {
            const floorT = (-0.7 - camEyeY) / dy;
            if (floorT > 0 && floorT < nearestT) nearestT = floorT;
          }

          // 4. Back wall at z = 3.2
          if (dz > 0.01) {
            const wallT = (3.2 - (-1.0)) / dz;
            if (wallT > 0 && wallT < nearestT) nearestT = wallT;
          }

          depthPrepass[idx] = nearestT;
        }
      }

      // ----------------------------------------------------------------------
      // PASS 2: PERSPECTIVE SHADOW MAP (Rendered from light position)
      // ----------------------------------------------------------------------
      shadowMap.fill(1e9);

      for (let sy = 0; sy < shadowMapRes; ++sy) {
        const lvy = -(sy - shadowMapRes / 2) / (shadowMapRes * 0.5);
        for (let sx = 0; sx < shadowMapRes; ++sx) {
          const lvx = (sx - shadowMapRes / 2) / (shadowMapRes * 0.5);

          // Rotate light ray to align with spotlight forward vector (sDir)
          const rightX = -sDirZ, rightZ = sDirX;
          const rLen = Math.sqrt(rightX * rightX + rightZ * rightZ) || 1;
          const rx = rightX / rLen, rz = rightZ / rLen;
          const upX = sDirY * rz, upY = sDirZ * rx - sDirX * rz, upZ = -sDirY * rx;

          const rdx = sDirX + lvx * rx + lvy * upX;
          const rdy = sDirY + lvy * upY;
          const rdz = sDirZ + lvx * rz + lvy * upZ;
          const rLenTotal = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
          const ldx = rdx / rLenTotal, ldy = rdy / rLenTotal, ldz = rdz / rLenTotal;

          const sIdx = sy * shadowMapRes + sx;
          let nearestT = 1e9;

          // Sphere intersection in light space
          const ocx = lx - sphereX, ocy = ly - sphereY, ocz = lz - sphereZ;
          const b = 2.0 * (ldx * ocx + ldy * ocy + ldz * ocz);
          const c = (ocx * ocx + ocy * ocy + ocz * ocz) - sphereR * sphereR;
          const disc = b * b - 4.0 * c;
          if (disc > 0) {
            const t = (-b - Math.sqrt(disc)) * 0.5;
            if (t > 0 && t < nearestT) nearestT = t;
          }

          // Cube intersection in light space
          const roX = lx - cubeX, roY = ly - cubeY, roZ = lz - cubeZ;
          const cldx = ldx * cosC - ldz * sinC;
          const cldy = ldy;
          const cldz = ldx * sinC + ldz * cosC;
          const clox = roX * cosC - roZ * sinC;
          const cloy = roY;
          const cloz = roX * sinC + roZ * cosC;

          const invDx = 1.0 / (cldx || 1e-6);
          const invDy = 1.0 / (cldy || 1e-6);
          const invDz = 1.0 / (cldz || 1e-6);

          const t1x = (-cubeHalf - clox) * invDx, t2x = (cubeHalf - clox) * invDx;
          const t1y = (-cubeHalf - cloy) * invDy, t2y = (cubeHalf - cloy) * invDy;
          const t1z = (-cubeHalf - cloz) * invDz, t2z = (cubeHalf - cloz) * invDz;

          const tMin = Math.max(Math.max(Math.min(t1x, t2x), Math.min(t1y, t2y)), Math.min(t1z, t2z));
          const tMax = Math.min(Math.min(Math.max(t1x, t2x), Math.max(t1y, t2y)), Math.max(t1z, t2z));

          if (tMax >= Math.max(0.0, tMin) && tMin < nearestT) {
            nearestT = tMin;
          }

          // Floor intersection
          if (ldy < -0.01) {
            const floorT = (-0.7 - ly) / ldy;
            if (floorT > 0 && floorT < nearestT) nearestT = floorT;
          }

          shadowMap[sIdx] = nearestT;
        }
      }

      // ----------------------------------------------------------------------
      // PASS 3: DEFERRED BASE PASS (G-Buffer Generation MRT)
      // ----------------------------------------------------------------------
      gDepth.fill(1e9);
      stencilMask.fill(0);
      hdrR.fill(0.02); hdrG.fill(0.04); hdrB.fill(0.08);

      for (let y = 0; y < H; ++y) {
        const vy = -(y - H / 2) / (H * 0.75);
        for (let x = 0; x < W; ++x) {
          const vx = (x - W / 2) / (W * 0.75);
          const dirLen = Math.sqrt(vx * vx + vy * vy + 1.0);
          const dx = vx / dirLen, dy = vy / dirLen, dz = 1.0 / dirLen;
          const idx = y * W + x;

          const t = depthPrepass[idx];
          if (t >= 1e8) continue; // Sky void

          // Early-Z accepted: Compute world coordinates & surface normals
          const hx = dx * t, hy = camEyeY + dy * t, hz = -1.0 + dz * t;
          gWorldX[idx] = hx; gWorldY[idx] = hy; gWorldZ[idx] = hz;
          gDepth[idx] = t;

          let nx = 0, ny = 1, nz = 0;
          let albR = 180, albG = 180, albB = 180;

          // Sphere normal & color
          const distToSphere = Math.sqrt((hx - sphereX)**2 + (hy - sphereY)**2 + (hz - sphereZ)**2);
          if (Math.abs(distToSphere - sphereR) < 0.05) {
            nx = (hx - sphereX) / sphereR;
            ny = (hy - sphereY) / sphereR;
            nz = (hz - sphereZ) / sphereR;
            albR = 52; albG = 211; albB = 153; // Emerald
          } else if (Math.abs(hy - (-0.7)) < 0.03) {
            // Floor plane
            nx = 0; ny = 1; nz = 0;
            const check = ((Math.floor(hx * 2.5) ^ Math.floor(hz * 2.5)) & 1);
            albR = albG = albB = check ? 220 : 130;
          } else if (Math.abs(hz - 3.2) < 0.05) {
            // Back wall
            nx = 0; ny = 0; nz = -1;
            albR = 71; albG = 85; albB = 105;
          } else {
            // Cube normal (transformed back from local cube frame)
            const roX = hx - cubeX, roY = hy - cubeY, roZ = hz - cubeZ;
            const lox = roX * cosC - roZ * sinC;
            const loy = roY;
            const loz = roX * sinC + roZ * cosC;

            let lnx = 0, lny = 0, lnz = 0;
            const ax = Math.abs(lox), ay = Math.abs(loy), az = Math.abs(loz);
            if (ax > ay && ax > az) lnx = lox > 0 ? 1 : -1;
            else if (ay > ax && ay > az) lny = loy > 0 ? 1 : -1;
            else lnz = loz > 0 ? 1 : -1;

            nx = lnx * cosC + lnz * sinC;
            ny = lny;
            nz = -lnx * sinC + lnz * cosC;

            albR = 245; albG = 158; albB = 11; // Amber Gold
          }

          gNormalX[idx] = nx; gNormalY[idx] = ny; gNormalZ[idx] = nz;
          gAlbedoR[idx] = albR; gAlbedoG[idx] = albG; gAlbedoB[idx] = albB;

          // ------------------------------------------------------------------
          // PASS 4: STENCIL VOLUME LIGHTING & SHADOW EVALUATION
          // ------------------------------------------------------------------
          const toLx = lx - hx, toLy = ly - hy, toLz = lz - hz;
          const distLight = Math.sqrt(toLx * toLx + toLy * toLy + toLz * toLz);

          // Stencil volume test: Is fragment inside the light's bounding radius?
          if (distLight <= lightRadius) {
            stencilMask[idx] = 1; // Passes stencil test!

            const lnx = toLx / distLight, lny = toLy / distLight, lnz = toLz / distLight;

            // Perspective Shadow Map depth test
            // Re-project world point into spotlight perspective coordinates
            const dotSpot = -(lnx * sDirX + lny * sDirY + lnz * sDirZ);
            let shadow = 1.0;

            if (dotSpot > 0.45) { // Inside spotlight cone angle
              // Sample shadow map
              const rightX = -sDirZ, rightZ = sDirX;
              const rLen = Math.sqrt(rightX * rightX + rightZ * rightZ) || 1;
              const rx = rightX / rLen, rz = rightZ / rLen;
              const upX = sDirY * rz, upY = sDirZ * rx - sDirX * rz, upZ = -sDirY * rx;

              const relX = -toLx, relY = -toLy, relZ = -toLz;
              const projZ = relX * sDirX + relY * sDirY + relZ * sDirZ;
              const projX = relX * rx + relY * 0 + relZ * rz;
              const projY = relX * upX + relY * upY + relZ * upZ;

              if (projZ > 0.1) {
                const su = (projX / projZ) * (shadowMapRes * 0.5) + (shadowMapRes / 2);
                const sv = -(projY / projZ) * (shadowMapRes * 0.5) + (shadowMapRes / 2);
                const isx = Math.floor(su), isy = Math.floor(sv);

                if (isx >= 0 && isx < shadowMapRes && isy >= 0 && isy < shadowMapRes) {
                  const sDepth = shadowMap[isy * shadowMapRes + isx];
                  if (distLight - 0.08 > sDepth) {
                    shadow = 0.18; // In perspective shadow!
                  }
                }
              }
            } else {
              shadow = 0.18; // Outside cone
            }

            // Blinn-Phong Specular & Lambert Diffuse
            const nDotL = Math.max(0, nx * lnx + ny * lny + nz * lnz);
            const vx = -dx, vy = -dy, vz = -dz;
            const hxDir = lnx + vx, hyDir = lny + vy, hzDir = lnz + vz;
            const hLen = Math.sqrt(hxDir * hxDir + hyDir * hyDir + hzDir * hzDir);
            const nDotH = Math.max(0, (nx * hxDir + ny * hyDir + nz * hzDir) / (hLen || 1));
            const spec = Math.pow(nDotH, 32) * 0.5;

            const atten = 1.0 / (distLight * distLight * 0.35 + 1.0);
            const diff = (nDotL * 0.85 + 0.15) * shadow * atten;

            hdrR[idx] = (albR / 255) * diff + spec * shadow;
            hdrG[idx] = (albG / 255) * diff + spec * shadow;
            hdrB[idx] = (albB / 255) * diff + spec * shadow;
          } else {
            // Outside stencil volume: Ambient baseline only
            hdrR[idx] = (albR / 255) * 0.08;
            hdrG[idx] = (albG / 255) * 0.08;
            hdrB[idx] = (albB / 255) * 0.08;
          }
        }
      }

      // ----------------------------------------------------------------------
      // PASS 5: MSAA RESOLVE & VIEWPORT DISPLAY
      // ----------------------------------------------------------------------
      for (let y = 0; y < H; ++y) {
        for (let x = 0; x < W; ++x) {
          const idx = y * W + x;

          if (passMode === 'depth') {
            // Visualizing Pass 1: Depth Pre-Pass Heatmap
            const d = depthPrepass[idx];
            if (d < 1e8) {
              const val = Math.min(255, Math.floor((1.0 - (d - 1.0) / 4.0) * 255));
              buf32[idx] = (255 << 24) | (val << 16) | (val << 8) | val;
            } else {
              buf32[idx] = 0xff000000;
            }
          } else if (passMode === 'shadow') {
            // Visualizing Pass 2: Perspective Shadow Map as seen by spotlight
            const sx = Math.floor((x / W) * shadowMapRes);
            const sy = Math.floor((y / H) * shadowMapRes);
            const sIdx = sy * shadowMapRes + sx;
            const sd = shadowMap[sIdx];
            const sVal = sd < 1e8 ? Math.min(255, Math.floor((1.0 - (sd - 0.5) / 4.5) * 255)) : 0;
            buf32[idx] = (255 << 24) | (sVal << 16) | (Math.floor(sVal * 0.8) << 8) | Math.floor(sVal * 0.5);
          } else if (passMode === 'normals') {
            // Visualizing Pass 3: G-Buffer Normals
            if (gDepth[idx] < 1e8) {
              const nr = Math.floor((gNormalX[idx] * 0.5 + 0.5) * 255);
              const ng = Math.floor((gNormalY[idx] * 0.5 + 0.5) * 255);
              const nb = Math.floor((gNormalZ[idx] * 0.5 + 0.5) * 255);
              buf32[idx] = (255 << 24) | (nb << 16) | (ng << 8) | nr;
            } else {
              buf32[idx] = 0xff050810;
            }
          } else if (passMode === 'stencil') {
            // Visualizing Pass 4: Stencil Volume Mask
            if (gDepth[idx] < 1e8) {
              if (stencilMask[idx] === 1) {
                // Inside volume: Bright green overlay
                buf32[idx] = (255 << 24) | (50 << 16) | (220 << 8) | 50;
              } else {
                // Outside volume: Dark blue
                buf32[idx] = (255 << 24) | (120 << 16) | (40 << 8) | 20;
              }
            } else {
              buf32[idx] = 0xff020408;
            }
          } else {
            // Final Composited Beauty Pass with 4x MSAA Resolve
            let r = hdrR[idx], g = hdrG[idx], b = hdrB[idx];

            if (msaaEnabled && x > 0 && x < W - 1 && y > 0 && y < H - 1) {
              // 4x sub-pixel cross box resolve filtering
              const iL = idx - 1, iR = idx + 1, iU = idx - W, iD = idx + W;
              r = (r * 2.0 + hdrR[iL] + hdrR[iR] + hdrR[iU] + hdrR[iD]) / 6.0;
              g = (g * 2.0 + hdrG[iL] + hdrG[iR] + hdrG[iU] + hdrG[iD]) / 6.0;
              b = (b * 2.0 + hdrB[iL] + hdrB[iR] + hdrB[iU] + hdrB[iD]) / 6.0;
            }

            // Reinhard Tone Mapping & Gamma 2.2
            const fr = Math.min(255, Math.floor(Math.pow(r / (r + 1.0), 1.0 / 2.2) * 255));
            const fg = Math.min(255, Math.floor(Math.pow(g / (g + 1.0), 1.0 / 2.2) * 255));
            const fb = Math.min(255, Math.floor(Math.pow(b / (b + 1.0), 1.0 / 2.2) * 255));

            buf32[idx] = (255 << 24) | (fb << 16) | (fg << 8) | fr;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      this.previewAnimId = requestAnimationFrame(render);
    };

    this.previewAnimId = requestAnimationFrame(render);

    // Pass Mode Selector Buttons
    const setPassView = (mode) => {
      passMode = mode;
      ['final', 'depth', 'shadow', 'normals', 'stencil'].forEach((m) => {
        document.getElementById(`mp-view-${m}`)?.classList.toggle('active', m === mode);
      });
      if (descBox) descBox.innerHTML = passDescriptions[mode] || '';
    };

    document.getElementById('mp-view-final')?.addEventListener('click', () => setPassView('final'));
    document.getElementById('mp-view-depth')?.addEventListener('click', () => setPassView('depth'));
    document.getElementById('mp-view-shadow')?.addEventListener('click', () => setPassView('shadow'));
    document.getElementById('mp-view-normals')?.addEventListener('click', () => setPassView('normals'));
    document.getElementById('mp-view-stencil')?.addEventListener('click', () => setPassView('stencil'));

    document.getElementById('mp-slider-lightangle')?.addEventListener('input', (e) => {
      lightAngle = parseFloat(e.target.value);
    });

    document.getElementById('mp-slider-radius')?.addEventListener('input', (e) => {
      lightRadius = parseFloat(e.target.value);
    });

    document.getElementById('mp-chk-msaa')?.addEventListener('change', (e) => {
      msaaEnabled = e.target.checked;
    });

    // ------------------------------------------------------------------------
    // Inspector Tabs: Hardware Stages vs Frame Graph Passes
    // ------------------------------------------------------------------------
    let currentInspectorMode = 'stages';
    const stagesContainer = document.getElementById('pipeline-stages-container');

    const hardwareStages = [
      { id: 'ia', label: '1. Input Assembler (IA)', sub: 'VBO / IBO / Strides', col: '#94a3b8',
        desc: '<strong>1. Input Assembler (Fixed Function):</strong> Fetches raw vertex indices and attribute streams from VRAM over high-bandwidth buses.' },
      { id: 'vs', label: '2. Vertex Shader (SIMT)', sub: 'MVP Matrix & TBN Frame', col: '#10b981',
        desc: '<strong>2. Vertex Shader Stage (Programmable):</strong> Multiplies local coordinates by MVP matrix into 4D Clip Space and computes orthonormal TBN tangent frames.' },
      { id: 'clip', label: '3. 4D Frustum Clipping', sub: 'Sutherland-Hodgman', col: '#fbbf24',
        desc: '<strong>3. Primitive Clipping & Perspective Divide:</strong> Clips primitives in 4D space before perspective divide to prevent division-by-zero singularities.' },
      { id: 'ras', label: '4. Hardware Rasterizer', sub: 'Pineda Edge Equations', col: '#38bdf8',
        desc: '<strong>4. Hardware Rasterizer (Fixed Function):</strong> Evaluates 2D Pineda oriented edge functions across bounding boxes and calculates barycentric coordinates.' },
      { id: 'hiz', label: '5. Early-Z / Hi-Z', sub: 'Zero-Cost Depth Rejection', col: '#34d399',
        desc: '<strong>5. Early-Z & Hi-Z Culling:</strong> Compares triangle depths against on-chip Hi-Z cache before running fragment shaders, eliminating overdraw.' },
      { id: 'fs', label: '6. Fragment Shader', sub: 'PBR Shading & Derivatives', col: '#f43f5e',
        desc: '<strong>6. Fragment Shader Stage:</strong> Evaluates BRDFs and textures in lockstep 2x2 quads with dFdx/dFdy derivatives for mipmapping.' },
      { id: 'rop', label: '7. ROP & Blending', sub: 'Porter-Duff Blend Equations', col: '#e879f9',
        desc: '<strong>7. ROP & Output Merger:</strong> Applies late depth/stencil tests and universal Porter-Duff alpha blending equations.' }
    ];

    const renderPasses = [
      { id: 'pass-z', label: 'Pass 1: Depth Pre-Pass', sub: 'Color Writes = 0', col: '#34d399',
        desc: '<strong>Pass 1: Depth Pre-Pass:</strong> Pre-populates depth buffer with color writes disabled so that subsequent passes execute with 0% overdraw.' },
      { id: 'pass-shadow', label: 'Pass 2: Perspective Shadow Map', sub: 'Spotlight Frustum Depth', col: '#fbbf24',
        desc: '<strong>Pass 2: Perspective Shadow Mapping:</strong> Generates light-space perspective depth map from spotlight perspective.' },
      { id: 'pass-gbuffer', label: 'Pass 3: Deferred Base Pass (MRT)', sub: 'Normals, Albedo, Depth', col: '#38bdf8',
        desc: '<strong>Pass 3: Deferred Base Pass:</strong> Multiple Render Targets (MRT) write normal, base color, and position buffers simultaneously.' },
      { id: 'pass-stencil', label: 'Pass 4: Stencil Volume Lighting', sub: 'Bounded Light Evaluation', col: '#a78bfa',
        desc: '<strong>Pass 4: Stencil Volume Lighting:</strong> Masks out all fragments outside light radius sphere; evaluates only marked pixels.' },
      { id: 'pass-msaa', label: 'Pass 5: 4x MSAA Resolve', sub: 'Sub-Pixel Jitter Filter', col: '#e879f9',
        desc: '<strong>Pass 5: 4x MSAA Resolve:</strong> Resolves subpixel samples to eliminate harsh polygon silhouette aliasing.' }
    ];

    const renderInspectorItems = () => {
      const items = currentInspectorMode === 'stages' ? hardwareStages : renderPasses;
      if (!stagesContainer) return;
      stagesContainer.innerHTML = items.map((item, idx) => `
        <button class="pipeline-stage-btn ${idx === 0 ? 'active' : ''}" data-stage="${item.id}">
          <span>${item.label}</span>
          <span style="color:${item.col};">${item.sub}</span>
        </button>
      `).join('');

      stagesContainer.querySelectorAll('.pipeline-stage-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          stagesContainer.querySelectorAll('.pipeline-stage-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const found = items.find((it) => it.id === btn.dataset.stage);
          if (found && descBox) descBox.innerHTML = found.desc;
        });
      });
    };

    renderInspectorItems();

    document.getElementById('pipe-tab-stages')?.addEventListener('click', () => {
      currentInspectorMode = 'stages';
      document.getElementById('pipe-tab-stages')?.classList.add('active');
      document.getElementById('pipe-tab-passes')?.classList.remove('active');
      renderInspectorItems();
    });

    document.getElementById('pipe-tab-passes')?.addEventListener('click', () => {
      currentInspectorMode = 'passes';
      document.getElementById('pipe-tab-passes')?.classList.add('active');
      document.getElementById('pipe-tab-stages')?.classList.remove('active');
      renderInspectorItems();
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
  // ==========================================================================
  // MODULE 09: SHADING MODELS COMPARISON & PHYSICALLY BASED RENDERING (PBR)
  // ==========================================================================
  initPbrPreview(container) {
    container.innerHTML = `
      <div class="preview-toolbar">
        <div class="preview-chips-row" style="margin-bottom:0.4rem;">
          <button class="mode-chip active" id="sm-chip-pbr">Cook-Torrance PBR</button>
          <button class="mode-chip" id="sm-chip-blinn">Blinn-Phong</button>
          <button class="mode-chip" id="sm-chip-phong">Classical Phong</button>
          <button class="mode-chip" id="sm-chip-lambert">Lambert Diffuse</button>
          <button class="mode-chip" id="sm-chip-orennayar">Oren-Nayar</button>
        </div>
        <div class="color-chips-row">
          <span class="toolbar-label">Preset:</span>
          <div class="pbr-color-chip active" style="background:#eab308;" data-r="234" data-g="179" data-b="8" data-rough="0.18" data-metal="0.95" title="Gold"></div>
          <div class="pbr-color-chip" style="background:#f97316;" data-r="249" data-g="115" data-b="22" data-rough="0.25" data-metal="0.9" title="Copper"></div>
          <div class="pbr-color-chip" style="background:#10b981;" data-r="16" data-g="185" data-b="129" data-rough="0.3" data-metal="0.0" title="Emerald Plastic"></div>
          <div class="pbr-color-chip" style="background:#e2e8f0;" data-r="226" data-g="232" data-b="240" data-rough="0.1" data-metal="1.0" title="Titanium"></div>
          <div class="pbr-color-chip" style="background:#cbd5e1;" data-r="200" data-g="200" data-b="200" data-rough="0.8" data-metal="0.0" title="Rough Chalk / Plaster"></div>
        </div>
      </div>

      <div class="preview-canvas-box">
        <canvas id="pbr-preview-canvas" width="200" height="200" style="width:320px;height:320px;"></canvas>
      </div>

      <div class="preview-controls-grid">
        <div class="preview-control-row" id="row-slider-rough">
          <span>Roughness (&alpha;):</span>
          <input type="range" id="pbr-slider-rough" min="0.05" max="1.0" step="0.02" value="0.18" />
        </div>
        <div class="preview-control-row" id="row-slider-metal">
          <span>Metallic (m):</span>
          <input type="range" id="pbr-slider-metal" min="0.0" max="1.0" step="0.02" value="0.95" />
        </div>
        <div class="preview-control-row" id="row-slider-shininess" style="display:none;">
          <span>Shininess Exponent (s):</span>
          <input type="range" id="pbr-slider-shininess" min="4" max="256" step="4" value="64" />
        </div>
        <div class="preview-control-row">
          <span>Light Direction X:</span>
          <input type="range" id="pbr-slider-lightx" min="-1.5" max="1.5" step="0.1" value="0.6" />
        </div>
      </div>

      <div class="preview-info-box" id="pbr-info-box">
        <strong>Cook-Torrance Specular BRDF:</strong><br/>
        f<sub>spec</sub> = (D<sub>GGX</sub> &times; F<sub>Schlick</sub> &times; G<sub>Smith</sub>) / (4(n&middot;l)(n&middot;v)) + (1 - F)(1 - m) &times; (albedo / &pi;)
      </div>
    `;

    const canvas = document.getElementById('pbr-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 200, height = 200;
    const imgData = ctx.createImageData(width, height);
    const buf32 = new Uint32Array(imgData.data.buffer);

    let activeModel = 'pbr';
    let roughness = 0.18;
    let metallic = 0.95;
    let shininess = 64;
    let lightX = 0.6;
    let baseColor = [234, 179, 8]; // Gold

    const infoBox = document.getElementById('pbr-info-box');
    const modelDescriptions = {
      pbr: '<strong>Cook-Torrance Microfacet PBR:</strong><br/>f<sub>spec</sub> = (D<sub>GGX</sub> &times; F<sub>Schlick</sub> &times; G<sub>Smith</sub>) / (4(n&middot;l)(n&middot;v))<br/>Conserves energy: k<sub>d</sub> = (1 - F)(1 - m). Metals have zero diffuse reflection!',
      blinn: '<strong>Blinn-Phong Specular (Jim Blinn, 1977):</strong><br/>Halfway vector H = normalize(L + V). I<sub>spec</sub> = ((s + 8) / 8&pi;) &times; (n&middot;H)<sup>s</sup><br/>Computationally superior to Phong: H is constant for directional light!',
      phong: '<strong>Classical Phong Reflection (1975):</strong><br/>Reflection vector R = 2(n&middot;l)n - l. I<sub>spec</sub> = ((n + 2) / 2&pi;) &times; (R&middot;V)<sup>n</sup><br/>Empirical plastic highlight; produces harsh cut-offs when R&middot;V &le; 0.',
      lambert: '<strong>Lambertian Diffuse (Johann Lambert, 1760):</strong><br/>f<sub>diffuse</sub> = albedo / &pi;. Radiates with equal brightness in all viewing directions.<br/>Division by &pi; is derived from integrating cos(&theta;) over the hemisphere.',
      orennayar: '<strong>Oren-Nayar Rough Diffuse (1994):</strong><br/>f<sub>r</sub> = (albedo / &pi;)[A + B max(0, cos(&Delta;&phi;)) sin&alpha; tan&beta;]<br/>Models V-cavity micro-roughness: generates retro-reflection on clay, moon dust, and stone.'
    };

    const render = () => {
      const radius = 80;
      // Normalized directional light
      const lLen = Math.sqrt(lightX * lightX + 0.6 * 0.6 + 0.8 * 0.8);
      const lx = lightX / lLen, ly = 0.6 / lLen, lz = 0.8 / lLen;

      const PI = Math.PI;

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
            const nDotV = Math.max(0.001, nz);

            let outR = 0, outG = 0, outB = 0;
            const albR = baseColor[0] / 255;
            const albG = baseColor[1] / 255;
            const albB = baseColor[2] / 255;

            if (activeModel === 'pbr') {
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
              const D = a2 / (PI * denomD * denomD);

              // 2. Fresnel F (Schlick)
              const f0R = (1.0 - metallic) * 0.04 + metallic * albR;
              const f0G = (1.0 - metallic) * 0.04 + metallic * albG;
              const f0B = (1.0 - metallic) * 0.04 + metallic * albB;

              const fresnelFactor = Math.pow(1.0 - vDotH, 5.0);
              const FR = f0R + (1.0 - f0R) * fresnelFactor;
              const FG = f0G + (1.0 - f0G) * fresnelFactor;
              const FB = f0B + (1.0 - f0B) * fresnelFactor;

              // 3. Geometry G (Smith GGX)
              const k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
              const g1L = nDotL / (nDotL * (1.0 - k) + k);
              const g1V = nDotV / (nDotV * (1.0 - k) + k);
              const G = g1L * g1V;

              // Cook-Torrance Specular
              const specDenom = Math.max(0.001, 4.0 * nDotL * nDotV);
              const specR = (D * FR * G) / specDenom;
              const specG = (D * FG * G) / specDenom;
              const specB = (D * FB * G) / specDenom;

              // Diffuse component (Lambert)
              const kd = (1.0 - metallic) * (1.0 - (FR + FG + FB) / 3.0);
              const diffR = kd * albR / PI;
              const diffG = kd * albG / PI;
              const diffB = kd * albB / PI;

              outR = (diffR + specR) * nDotL * 3.14 + albR * 0.03;
              outG = (diffG + specG) * nDotL * 3.14 + albG * 0.03;
              outB = (diffB + specB) * nDotL * 3.14 + albB * 0.03;

            } else if (activeModel === 'blinn') {
              // Blinn-Phong Specular with Halfway Vector H
              const hx = lx, hy = ly, hz = lz + 1.0;
              const hLen = Math.sqrt(hx * hx + hy * hy + hz * hz);
              const nDotH = Math.max(0, (nx * hx + ny * hy + nz * hz) / hLen);

              const normSpec = (shininess + 8.0) / (8.0 * PI);
              const spec = normSpec * Math.pow(nDotH, shininess);
              const diff = (albR * nDotL) / PI;

              outR = diff * 3.14 + spec * 0.8 + albR * 0.05;
              outG = (albG * nDotL) + spec * 0.8 + albG * 0.05;
              outB = (albB * nDotL) + spec * 0.8 + albB * 0.05;

            } else if (activeModel === 'phong') {
              // Classical Phong Reflection Vector R = 2(N.L)N - L
              const rx = 2.0 * (nx * lx + ny * ly + nz * lz) * nx - lx;
              const ry = 2.0 * (nx * lx + ny * ly + nz * lz) * ny - ly;
              const rz = 2.0 * (nx * lx + ny * ly + nz * lz) * nz - lz;

              // View Vector V = (0, 0, 1) -> R.V = rz
              const rDotV = Math.max(0, rz);
              const pShin = Math.max(2, shininess / 4);
              const normSpec = (pShin + 2.0) / (2.0 * PI);
              const spec = normSpec * Math.pow(rDotV, pShin);

              outR = albR * nDotL + spec * 0.8 + albR * 0.05;
              outG = albG * nDotL + spec * 0.8 + albG * 0.05;
              outB = albB * nDotL + spec * 0.8 + albB * 0.05;

            } else if (activeModel === 'lambert') {
              // Pure Lambertian Diffuse (No Specular)
              outR = albR * (nDotL / PI) * 3.14 + albR * 0.05;
              outG = albG * (nDotL / PI) * 3.14 + albG * 0.05;
              outB = albB * (nDotL / PI) * 3.14 + albB * 0.05;

            } else if (activeModel === 'orennayar') {
              // Oren-Nayar Rough Diffuse
              const sigma = roughness;
              const sigma2 = sigma * sigma;
              const A = 1.0 - 0.5 * (sigma2 / (sigma2 + 0.33));
              const B = 0.45 * (sigma2 / (sigma2 + 0.09));

              const thetaI = Math.acos(Math.min(1.0, Math.max(-1.0, nDotL)));
              const thetaR = Math.acos(Math.min(1.0, Math.max(-1.0, nDotV)));
              const alpha = Math.max(thetaI, thetaR);
              const beta  = Math.min(thetaI, thetaR);

              // Projected vectors for azimuthal difference
              const projLx = lx - nx * nDotL;
              const projLy = ly - ny * nDotL;
              const pLLen = Math.sqrt(projLx * projLx + projLy * projLy) || 1;
              const projVx = -nx * nDotV;
              const projVy = -ny * nDotV;
              const pVLen = Math.sqrt(projVx * projVx + projVy * projVy) || 1;
              const cosPhiDiff = Math.max(0, (projLx * projVx + projLy * projVy) / (pLLen * pVLen));

              const orenFactor = A + (B * cosPhiDiff * Math.sin(alpha) * Math.tan(beta));
              const diff = (orenFactor * nDotL) / PI;

              outR = albR * diff * 3.14 + albR * 0.05;
              outG = albG * diff * 3.14 + albG * 0.05;
              outB = albB * diff * 3.14 + albB * 0.05;
            }

            // Reinhard Tone Mapping + sRGB Gamma (2.2)
            const finalR = Math.min(255, Math.floor(Math.pow(outR / (outR + 1.0), 1.0 / 2.2) * 255));
            const finalG = Math.min(255, Math.floor(Math.pow(outG / (outG + 1.0), 1.0 / 2.2) * 255));
            const finalB = Math.min(255, Math.floor(Math.pow(outB / (outB + 1.0), 1.0 / 2.2) * 255));

            buf32[idx] = (255 << 24) | (finalB << 16) | (finalG << 8) | finalR;
          } else {
            buf32[idx] = 0xff080c10;
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };

    render();

    // Event listeners
    const setModel = (model) => {
      activeModel = model;
      ['pbr', 'blinn', 'phong', 'lambert', 'orennayar'].forEach((m) => {
        document.getElementById(`sm-chip-${m}`)?.classList.toggle('active', m === model);
      });

      const roughRow = document.getElementById('row-slider-rough');
      const metalRow = document.getElementById('row-slider-metal');
      const shinRow = document.getElementById('row-slider-shininess');

      if (model === 'pbr') {
        if (roughRow) roughRow.style.display = 'flex';
        if (metalRow) metalRow.style.display = 'flex';
        if (shinRow) shinRow.style.display = 'none';
      } else if (model === 'blinn' || model === 'phong') {
        if (roughRow) roughRow.style.display = 'none';
        if (metalRow) metalRow.style.display = 'none';
        if (shinRow) shinRow.style.display = 'flex';
      } else if (model === 'orennayar') {
        if (roughRow) roughRow.style.display = 'flex';
        if (metalRow) metalRow.style.display = 'none';
        if (shinRow) shinRow.style.display = 'none';
      } else {
        if (roughRow) roughRow.style.display = 'none';
        if (metalRow) metalRow.style.display = 'none';
        if (shinRow) shinRow.style.display = 'none';
      }

      if (infoBox) infoBox.innerHTML = modelDescriptions[model];
      render();
    };

    document.getElementById('sm-chip-pbr')?.addEventListener('click', () => setModel('pbr'));
    document.getElementById('sm-chip-blinn')?.addEventListener('click', () => setModel('blinn'));
    document.getElementById('sm-chip-phong')?.addEventListener('click', () => setModel('phong'));
    document.getElementById('sm-chip-lambert')?.addEventListener('click', () => setModel('lambert'));
    document.getElementById('sm-chip-orennayar')?.addEventListener('click', () => setModel('orennayar'));

    document.getElementById('pbr-slider-rough')?.addEventListener('input', (e) => {
      roughness = parseFloat(e.target.value);
      render();
    });

    document.getElementById('pbr-slider-metal')?.addEventListener('input', (e) => {
      metallic = parseFloat(e.target.value);
      render();
    });

    document.getElementById('pbr-slider-shininess')?.addEventListener('input', (e) => {
      shininess = parseFloat(e.target.value);
      render();
    });

    document.getElementById('pbr-slider-lightx')?.addEventListener('input', (e) => {
      lightX = parseFloat(e.target.value);
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
