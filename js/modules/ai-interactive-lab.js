/**
 * Interactive 2D Vector & Linear Algebra Lab for AI Fundamentals
 * Provides interactive 2D graphics, vector manipulation, matrix transformations,
 * linear systems, continuous ODE phase portraits, and SVD/PCA visualizations.
 */

export class AIInteractiveLab {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.currentModuleId = null;
    this.animId = null;

    // Viewport transform (origin at center)
    this.width = 640;
    this.height = 420;
    this.scale = 40; // pixels per unit
    this.origin = { x: 320, y: 210 };

    // State for Vector Explorer (00a, 01)
    this.vState = {
      u: { x: 3.0, y: 1.0 },
      v: { x: 1.0, y: 2.0 },
      c1: 1.0,
      c2: 1.0,
      showProj: true,
      showSum: true,
      showLinearComb: false,
      activeDrag: null // 'u' or 'v' or 'x'
    };

    // State for Matrix Transformation (00a, 00b)
    this.mState = {
      a: 1.0,
      b: 0.0,
      c: 0.0,
      d: 1.0,
      testVec: { x: 1.5, y: 1.0 },
      gridDensity: 6,
      subMode: 'transform' // 'transform' or 'linear_system'
    };

    // State for Linear Systems Ax = b (00b)
    this.sysState = {
      mode: 'row', // 'row' or 'col'
      a11: 2.0,
      a12: 1.0,
      a21: 1.0,
      a22: 3.0,
      b1: 5.0,
      b2: 10.0
    };

    // State for ODE Dynamics (00c)
    this.odeState = {
      preset: 'sink', // 'sink', 'spiral', 'saddle', 'gradflow', 'oscillator'
      solver: 'rk4',  // 'euler' or 'rk4'
      h: 0.1,
      particles: [],
      traceLength: 80,
      autoSpawn: true
    };

    // State for SVD & PCA (01)
    this.svdState = {
      rankK: 2, // 1 or 2
      compressionRatio: 0.0, // 0 to 1 blend
      queryVec: { x: 2.5, y: 1.8 },
      points: [
        { x: -3.2, y: -2.1 },
        { x: -2.5, y: -1.7 },
        { x: -1.8, y: -0.9 },
        { x: -1.0, y: -0.8 },
        { x: -0.4, y: -0.1 },
        { x: 0.5, y: 0.4 },
        { x: 1.2, y: 0.9 },
        { x: 1.8, y: 1.4 },
        { x: 2.4, y: 1.9 },
        { x: 3.1, y: 2.3 }
      ]
    };

    // State for 2D Gradient Descent & Transcendental Functions (02)
    this.gradState = {
      mode: 'landscape', // 'landscape' or 'transcendental'
      surface: 'bowl', // 'bowl' or 'saddle'
      w: { x: 2.8, y: 2.2 },
      lr: 0.15,
      history: [],
      activation: 'sigmoid', // 'sigmoid', 'tanh', 'softplus', 'exp'
      inputX: 1.0
    };

    // State for Bivariate Gaussian (03)
    this.probState = {
      sigmaX: 1.5,
      sigmaY: 1.0,
      rho: 0.6
    };
  }

  mount(moduleId) {
    this.currentModuleId = moduleId;
    this.renderUI();
    this.initCanvas();
    this.bindEvents();
    this.startLoop();
  }

  destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  renderUI() {
    const mod = this.currentModuleId;
    let controlsHtml = '';

    if (mod === '00a_vector_spaces_and_transforms') {
      controlsHtml = this.get00aControlsHtml();
    } else if (mod === '00b_linear_systems_and_determinants') {
      controlsHtml = this.get00bControlsHtml();
    } else if (mod === '00c_differential_equations_and_dynamics') {
      controlsHtml = this.get00cControlsHtml();
    } else if (mod === '01_linear_algebra') {
      controlsHtml = this.get01ControlsHtml();
    } else if (mod === '02_calculus_and_autodiff') {
      controlsHtml = this.get02ControlsHtml();
    } else if (mod === '03_probability_and_information_theory') {
      controlsHtml = this.get03ControlsHtml();
    } else {
      // Default to general 2D Vector Playground
      controlsHtml = this.get00aControlsHtml();
    }

    this.container.innerHTML = `
      <div class="ai-interactive-wrap">
        <div class="ai-lab-header-bar">
          <div class="ai-lab-title-group">
            <span class="ai-lab-pill">Interactive 2D Lab</span>
            <span class="ai-lab-topic" id="ai-lab-topic-title">${this.getTopicTitle(mod)}</span>
          </div>
          <div class="ai-lab-hint">Tip: Drag vector arrowheads directly on the canvas or use the controls below</div>
        </div>

        <div class="ai-lab-canvas-card">
          <div class="ai-canvas-wrapper" id="ai-canvas-wrapper">
            <canvas id="ai-vector-canvas"></canvas>
            <div class="ai-canvas-overlay-stats" id="ai-canvas-stats"></div>
          </div>
        </div>

        <div class="ai-lab-controls-panel">
          ${controlsHtml}
        </div>
      </div>
    `;
  }

  getTopicTitle(mod) {
    switch (mod) {
      case '00a_vector_spaces_and_transforms':
        return '2D Vector Operations, Dot Products & Linear Transformations';
      case '00b_linear_systems_and_determinants':
        return 'Linear Systems (Row vs Column) & Determinant Area Squash';
      case '00c_differential_equations_and_dynamics':
        return 'Vector Fields, Phase Portraits & Numerical Solvers (Euler vs RK4)';
      case '01_linear_algebra':
        return '2D SVD, Eigenvectors & Low-Rank Compression';
      case '02_calculus_and_autodiff':
        return '2D Loss Landscape, Gradient Descent & Curvature';
      case '03_probability_and_information_theory':
        return 'Bivariate Gaussian Distribution & Information Entropy';
      default:
        return 'Interactive 2D Vector Sandbox';
    }
  }

  initCanvas() {
    this.canvas = document.getElementById('ai-vector-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    const wrapper = document.getElementById('ai-canvas-wrapper');
    const rect = wrapper ? wrapper.getBoundingClientRect() : { width: 640, height: 420 };
    this.width = Math.max(320, Math.floor(rect.width));
    this.height = Math.max(340, Math.min(500, Math.floor(window.innerHeight * 0.5)));

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
    this.origin = { x: this.width / 2, y: this.height / 2 };
    this.scale = Math.min(this.width, this.height) / 10;
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      if (this.canvas) this.initCanvas();
    });

    if (!this.canvas) return;

    // Mouse & Touch Interaction for Vector Dragging
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      return {
        x: (px - this.origin.x) / this.scale,
        y: -(py - this.origin.y) / this.scale
      };
    };

    const onStart = (e) => {
      const p = getPos(e);
      const mod = this.currentModuleId;

      if (mod === '00a_vector_spaces_and_transforms') {
        const dU = Math.hypot(p.x - this.vState.u.x, p.y - this.vState.u.y);
        const dV = Math.hypot(p.x - this.vState.v.x, p.y - this.vState.v.y);
        if (dU < 0.6) this.vState.activeDrag = 'u';
        else if (dV < 0.6) this.vState.activeDrag = 'v';
      } else if (mod === '00b_linear_systems_and_determinants') {
        // Drag target b or columns
        const dB = Math.hypot(p.x - (this.sysState.b1 / 2), p.y - (this.sysState.b2 / 2));
        if (dB < 0.8) this.vState.activeDrag = 'b';
      } else if (mod === '00c_differential_equations_and_dynamics') {
        // Drop trajectory particle
        this.addOdeParticle(p.x, p.y);
      } else if (mod === '01_linear_algebra') {
        const dQ = Math.hypot(p.x - this.svdState.queryVec.x, p.y - this.svdState.queryVec.y);
        if (dQ < 0.6) this.vState.activeDrag = 'query';
      } else if (mod === '02_calculus_and_autodiff') {
        if (this.gradState.mode === 'transcendental') {
          this.vState.activeDrag = 'transX';
          this.gradState.inputX = parseFloat(Math.max(-4, Math.min(4, p.x)).toFixed(1));
          this.syncSlider('slider-act-x', this.gradState.inputX);
        } else {
          this.gradState.w = { x: p.x, y: p.y };
          this.gradState.history = [{ x: p.x, y: p.y }];
          this.updateStats();
        }
      }
    };

    const onMove = (e) => {
      if (!this.vState.activeDrag) return;
      const p = getPos(e);
      const clampedX = Math.max(-6, Math.min(6, p.x));
      const clampedY = Math.max(-6, Math.min(6, p.y));

      if (this.vState.activeDrag === 'u') {
        this.vState.u.x = parseFloat(clampedX.toFixed(2));
        this.vState.u.y = parseFloat(clampedY.toFixed(2));
        this.syncSlider('slider-ux', this.vState.u.x);
        this.syncSlider('slider-uy', this.vState.u.y);
      } else if (this.vState.activeDrag === 'v') {
        this.vState.v.x = parseFloat(clampedX.toFixed(2));
        this.vState.v.y = parseFloat(clampedY.toFixed(2));
        this.syncSlider('slider-vx', this.vState.v.x);
        this.syncSlider('slider-vy', this.vState.v.y);
      } else if (this.vState.activeDrag === 'query') {
        this.svdState.queryVec.x = parseFloat(clampedX.toFixed(2));
        this.svdState.queryVec.y = parseFloat(clampedY.toFixed(2));
      } else if (this.vState.activeDrag === 'transX') {
        this.gradState.inputX = parseFloat(Math.max(-4, Math.min(4, clampedX)).toFixed(1));
        this.syncSlider('slider-act-x', this.gradState.inputX);
      }
      this.updateStats();
    };

    const onEnd = () => {
      this.vState.activeDrag = null;
    };

    this.canvas.addEventListener('mousedown', onStart);
    this.canvas.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    this.canvas.addEventListener('touchstart', onStart, { passive: true });
    this.canvas.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    // Bind DOM controls
    this.bindControlInputs();
  }

  syncSlider(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
    const label = document.getElementById(`${id}-val`);
    if (label) label.innerText = val.toFixed(1);
  }

  startLoop() {
    const loop = () => {
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Background & Coordinate Grid
    this.drawGrid();

    // 2. Render Module-Specific Visuals
    const mod = this.currentModuleId;
    if (mod === '00a_vector_spaces_and_transforms') {
      this.render00a();
    } else if (mod === '00b_linear_systems_and_determinants') {
      this.render00b();
    } else if (mod === '00c_differential_equations_and_dynamics') {
      this.render00c();
    } else if (mod === '01_linear_algebra') {
      this.render01();
    } else if (mod === '02_calculus_and_autodiff') {
      this.render02();
    } else if (mod === '03_probability_and_information_theory') {
      this.render03();
    } else {
      this.render00a();
    }
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Sub-grid lines
    const step = this.scale;
    const startX = this.origin.x % step;
    const startY = this.origin.y % step;

    for (let x = startX; x < this.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (let y = startY; y < this.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Main Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;

    // X axis
    ctx.beginPath();
    ctx.moveTo(0, this.origin.y);
    ctx.lineTo(this.width, this.origin.y);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(this.origin.x, 0);
    ctx.lineTo(this.origin.x, this.height);
    ctx.stroke();

    // Origin dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(this.origin.x, this.origin.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  toCanvas(x, y) {
    return {
      x: this.origin.x + x * this.scale,
      y: this.origin.y - y * this.scale
    };
  }

  drawArrow(fromX, fromY, toX, toY, color = '#38bdf8', lineWidth = 2.5, label = '') {
    const ctx = this.ctx;
    const p1 = this.toCanvas(fromX, fromY);
    const p2 = this.toCanvas(toX, toY);

    const headLen = 10;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;

    // Shaft
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Label
    if (label) {
      ctx.font = '600 12px "JetBrains Mono", monospace';
      ctx.fillStyle = color;
      ctx.fillText(label, p2.x + 8, p2.y - 8);
    }
    ctx.restore();
  }

  // ==========================================================================
  // MODULE 00A: Vector Spaces, Dot Products & Matrix Transforms
  // ==========================================================================
  get00aControlsHtml() {
    return `
      <div class="ai-controls-grid">
        <div class="ai-control-group">
          <div class="ai-control-title">Vector u (Cyan)</div>
          <div class="ai-slider-row">
            <span>u_x:</span>
            <input type="range" id="slider-ux" min="-5" max="5" step="0.1" value="${this.vState.u.x}" />
            <span class="val-badge" id="slider-ux-val">${this.vState.u.x}</span>
          </div>
          <div class="ai-slider-row">
            <span>u_y:</span>
            <input type="range" id="slider-uy" min="-5" max="5" step="0.1" value="${this.vState.u.y}" />
            <span class="val-badge" id="slider-uy-val">${this.vState.u.y}</span>
          </div>
        </div>

        <div class="ai-control-group">
          <div class="ai-control-title">Vector v (Rose)</div>
          <div class="ai-slider-row">
            <span>v_x:</span>
            <input type="range" id="slider-vx" min="-5" max="5" step="0.1" value="${this.vState.v.x}" />
            <span class="val-badge" id="slider-vx-val">${this.vState.v.x}</span>
          </div>
          <div class="ai-slider-row">
            <span>v_y:</span>
            <input type="range" id="slider-vy" min="-5" max="5" step="0.1" value="${this.vState.v.y}" />
            <span class="val-badge" id="slider-vy-val">${this.vState.v.y}</span>
          </div>
        </div>

        <div class="ai-control-group">
          <div class="ai-control-title">Visual Overlays</div>
          <div class="ai-chips-row">
            <button class="ai-chip ${this.vState.showProj ? 'active' : ''}" id="chip-toggle-proj">Orthogonal Proj</button>
            <button class="ai-chip ${this.vState.showSum ? 'active' : ''}" id="chip-toggle-sum">Parallelogram (u + v)</button>
            <button class="ai-chip" id="chip-preset-ortho">Make Orthogonal (90°)</button>
            <button class="ai-chip" id="chip-preset-collinear">Make Collinear</button>
          </div>
        </div>
      </div>
    `;
  }

  render00a() {
    const u = this.vState.u;
    const v = this.vState.v;

    // 1. Vector addition parallelogram
    if (this.vState.showSum) {
      const p0 = this.toCanvas(0, 0);
      const pU = this.toCanvas(u.x, u.y);
      const pV = this.toCanvas(v.x, v.y);
      const pSum = this.toCanvas(u.x + v.x, u.y + v.y);

      this.ctx.save();
      this.ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      this.ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(p0.x, p0.y);
      this.ctx.lineTo(pU.x, pU.y);
      this.ctx.lineTo(pSum.x, pSum.y);
      this.ctx.lineTo(pV.x, pV.y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Sum Vector u + v
      this.drawArrow(0, 0, u.x + v.x, u.y + v.y, '#c084fc', 2.0, 'u + v');
      this.ctx.restore();
    }

    // 2. Orthogonal Projection of u onto v
    const vLenSq = v.x * v.x + v.y * v.y;
    const dot = u.x * v.x + u.y * v.y;
    if (this.vState.showProj && vLenSq > 0.0001) {
      const projScale = dot / vLenSq;
      const projX = projScale * v.x;
      const projY = projScale * v.y;

      // Dashed line from tip of u to proj
      const pU = this.toCanvas(u.x, u.y);
      const pProj = this.toCanvas(projX, projY);

      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([3, 3]);
      this.ctx.beginPath();
      this.ctx.moveTo(pU.x, pU.y);
      this.ctx.lineTo(pProj.x, pProj.y);
      this.ctx.stroke();

      // Draw shadow projection vector
      this.drawArrow(0, 0, projX, projY, '#f43f5e', 3.5, 'proj_v(u)');
      this.ctx.restore();
    }

    // 3. Draw Main Vectors u and v
    this.drawArrow(0, 0, u.x, u.y, '#38bdf8', 3.0, `u (${u.x}, ${u.y})`);
    this.drawArrow(0, 0, v.x, v.y, '#fb7185', 3.0, `v (${v.x}, ${v.y})`);

    // 4. Update Stats Box
    const uMag = Math.hypot(u.x, u.y);
    const vMag = Math.hypot(v.x, v.y);
    let cosTheta = 0;
    let angleDeg = 0;
    if (uMag > 0.001 && vMag > 0.001) {
      cosTheta = Math.max(-1, Math.min(1, dot / (uMag * vMag)));
      angleDeg = (Math.acos(cosTheta) * 180 / Math.PI).toFixed(1);
    }

    const det = u.x * v.y - u.y * v.x;
    const isIndep = Math.abs(det) > 0.01;

    const statsEl = document.getElementById('ai-canvas-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-pill"><span class="k">Dot Product:</span> <span class="v">${dot.toFixed(2)}</span></div>
        <div class="stat-pill"><span class="k">Angle θ:</span> <span class="v">${angleDeg}°</span></div>
        <div class="stat-pill"><span class="k">Cosine Sim:</span> <span class="v">${cosTheta.toFixed(3)}</span></div>
        <div class="stat-pill"><span class="k">||u||:</span> <span class="v">${uMag.toFixed(2)}</span> &nbsp;|&nbsp; <span class="k">||v||:</span> <span class="v">${vMag.toFixed(2)}</span></div>
        <div class="stat-pill ${isIndep ? 'success' : 'warn'}"><span class="k">Span:</span> ${isIndep ? 'Linearly Independent (Spans ℝ²)' : 'Linearly Dependent (Collinear, Span is a line)'}</div>
      `;
    }
  }

  // ==========================================================================
  // MODULE 00B: Linear Systems Ax = b (Row vs Column) & Determinants
  // ==========================================================================
  get00bControlsHtml() {
    return `
      <div class="ai-controls-grid">
        <div class="ai-control-group">
          <div class="ai-control-title">System View Mode & Determinants</div>
          <div class="ai-chips-row">
            <button class="ai-chip ${this.sysState.mode === 'row' ? 'active' : ''}" id="chip-mode-row">Row Picture (Hyperplanes)</button>
            <button class="ai-chip ${this.sysState.mode === 'col' ? 'active' : ''}" id="chip-mode-col">Column Picture (Vectors)</button>
            <button class="ai-chip ${this.sysState.mode === 'cramer' ? 'active' : ''}" id="chip-mode-cramer">Cramer's Rule &amp; Trace</button>
            <button class="ai-chip" id="chip-preset-singular">Singular (det = 0)</button>
            <button class="ai-chip" id="chip-preset-invertible">Invertible System</button>
          </div>
        </div>

        <div class="ai-control-group">
          <div class="ai-control-title">Matrix A Entries</div>
          <div class="ai-slider-row">
            <span>a11:</span>
            <input type="range" id="slider-a11" min="-4" max="4" step="0.5" value="${this.sysState.a11}" />
            <span class="val-badge" id="slider-a11-val">${this.sysState.a11}</span>
            <span>a12:</span>
            <input type="range" id="slider-a12" min="-4" max="4" step="0.5" value="${this.sysState.a12}" />
            <span class="val-badge" id="slider-a12-val">${this.sysState.a12}</span>
          </div>
          <div class="ai-slider-row">
            <span>a21:</span>
            <input type="range" id="slider-a21" min="-4" max="4" step="0.5" value="${this.sysState.a21}" />
            <span class="val-badge" id="slider-a21-val">${this.sysState.a21}</span>
            <span>a22:</span>
            <input type="range" id="slider-a22" min="-4" max="4" step="0.5" value="${this.sysState.a22}" />
            <span class="val-badge" id="slider-a22-val">${this.sysState.a22}</span>
          </div>
        </div>

        <div class="ai-control-group">
          <div class="ai-control-title">Target Vector b</div>
          <div class="ai-slider-row">
            <span>b1:</span>
            <input type="range" id="slider-b1" min="-6" max="6" step="0.5" value="${this.sysState.b1}" />
            <span class="val-badge" id="slider-b1-val">${this.sysState.b1}</span>
            <span>b2:</span>
            <input type="range" id="slider-b2" min="-6" max="6" step="0.5" value="${this.sysState.b2}" />
            <span class="val-badge" id="slider-b2-val">${this.sysState.b2}</span>
          </div>
        </div>
      </div>
    `;
  }

  render00b() {
    const s = this.sysState;
    const det = s.a11 * s.a22 - s.a12 * s.a21;
    const isSingular = Math.abs(det) < 0.001;

    let x1 = 0, x2 = 0;
    if (!isSingular) {
      x1 = (s.b1 * s.a22 - s.a12 * s.b2) / det;
      x2 = (s.a11 * s.b2 - s.b1 * s.a21) / det;
    }

    if (s.mode === 'row') {
      // Draw Line 1: a11 * x + a12 * y = b1
      this.drawLineEquation(s.a11, s.a12, s.b1, '#38bdf8', 'Line 1: a11 x1 + a12 x2 = b1');
      // Draw Line 2: a21 * x + a22 * y = b2
      this.drawLineEquation(s.a21, s.a22, s.b2, '#fb7185', 'Line 2: a21 x1 + a22 x2 = b2');

      // Highlight intersection point if invertible
      if (!isSingular && Math.abs(x1) < 10 && Math.abs(x2) < 10) {
        const pInt = this.toCanvas(x1, x2);
        this.ctx.save();
        this.ctx.fillStyle = '#10b981';
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(pInt.x, pInt.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = '700 12px "JetBrains Mono", monospace';
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillText(`x* = (${x1.toFixed(2)}, ${x2.toFixed(2)})`, pInt.x + 10, pInt.y - 10);
        this.ctx.restore();
      }

      const statsEl = document.getElementById('ai-canvas-stats');
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="stat-pill"><span class="k">Determinant det(A):</span> <span class="v">${det.toFixed(2)}</span></div>
          <div class="stat-pill ${isSingular ? 'warn' : 'success'}"><span class="k">Status:</span> ${isSingular ? 'Singular / Parallel Hyperplanes (No Unique Intersection)' : 'Invertible (Unique Intersection Point)'}</div>
          ${!isSingular ? `<div class="stat-pill"><span class="k">Solution x*:</span> <span class="v">[${x1.toFixed(2)}, ${x2.toFixed(2)}]^T</span></div>` : ''}
        `;
      }
    } else if (s.mode === 'col') {
      // Column Picture: x1 * [a11, a21] + x2 * [a12, a22] = [b1, b2]
      this.drawArrow(0, 0, s.a11, s.a21, '#38bdf8', 2.5, 'col 1');
      this.drawArrow(0, 0, s.a12, s.a22, '#fb7185', 2.5, 'col 2');
      this.drawArrow(0, 0, s.b1, s.b2, '#10b981', 3.5, 'target b');

      // Parallelogram spanned by col1 and col2
      const p0 = this.toCanvas(0, 0);
      const pC1 = this.toCanvas(s.a11, s.a21);
      const pC2 = this.toCanvas(s.a12, s.a22);
      const pSum = this.toCanvas(s.a11 + s.a12, s.a21 + s.a22);

      this.ctx.save();
      this.ctx.fillStyle = isSingular ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.12)';
      this.ctx.strokeStyle = isSingular ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.4)';
      this.ctx.beginPath();
      this.ctx.moveTo(p0.x, p0.y);
      this.ctx.lineTo(pC1.x, pC1.y);
      this.ctx.lineTo(pSum.x, pSum.y);
      this.ctx.lineTo(pC2.x, pC2.y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();

      const statsEl = document.getElementById('ai-canvas-stats');
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="stat-pill"><span class="k">Determinant det(A):</span> <span class="v">${det.toFixed(2)}</span> (Column Parallelogram Area)</div>
          <div class="stat-pill ${isSingular ? 'warn' : 'success'}"><span class="k">Status:</span> ${isSingular ? 'Singular / Area = 0 (Collinear Columns)' : 'Invertible (Area > 0, Basis Spans ℝ²)'}</div>
          ${!isSingular ? `<div class="stat-pill"><span class="k">Combination Weights:</span> <span class="v">${x1.toFixed(2)}·a₁ + ${x2.toFixed(2)}·a₂ = b</span></div>` : ''}
        `;
      }
    } else if (s.mode === 'cramer') {
      const a1 = { x: s.a11, y: s.a21 };
      const a2 = { x: s.a12, y: s.a22 };
      const b = { x: s.b1, y: s.b2 };

      const detA1 = b.x * a2.y - a2.x * b.y;
      const detA2 = a1.x * b.y - b.x * a1.y;

      const p0 = this.toCanvas(0, 0);
      const pA1 = this.toCanvas(a1.x, a1.y);
      const pA2 = this.toCanvas(a2.x, a2.y);
      const pSumA = this.toCanvas(a1.x + a2.x, a1.y + a2.y);

      // Base Parallelogram A
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(p0.x, p0.y);
      this.ctx.lineTo(pA1.x, pA1.y);
      this.ctx.lineTo(pSumA.x, pSumA.y);
      this.ctx.lineTo(pA2.x, pA2.y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      // Substituted Parallelogram A1 = [b, a2]
      const pB = this.toCanvas(b.x, b.y);
      const pSumA1 = this.toCanvas(b.x + a2.x, b.y + a2.y);

      this.ctx.fillStyle = 'rgba(244, 63, 94, 0.14)';
      this.ctx.strokeStyle = '#fb7185';
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(p0.x, p0.y);
      this.ctx.lineTo(pB.x, pB.y);
      this.ctx.lineTo(pSumA1.x, pSumA1.y);
      this.ctx.lineTo(pA2.x, pA2.y);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();

      // Draw Vectors
      this.drawArrow(0, 0, a1.x, a1.y, '#38bdf8', 2.5, `col 1 a₁ (${a1.x}, ${a1.y})`);
      this.drawArrow(0, 0, a2.x, a2.y, '#a855f7', 2.5, `col 2 a₂ (${a2.x}, ${a2.y})`);
      this.drawArrow(0, 0, b.x, b.y, '#10b981', 3.0, `target b (${b.x}, ${b.y})`);

      // Trace & Characteristic polynomial
      const trace = s.a11 + s.a22;
      const disc = trace * trace - 4 * det;
      let eigenStr = '';
      if (disc >= 0) {
        const l1 = ((trace + Math.sqrt(disc)) / 2).toFixed(2);
        const l2 = ((trace - Math.sqrt(disc)) / 2).toFixed(2);
        eigenStr = `λ₁ = ${l1}, λ₂ = ${l2}`;
      } else {
        const re = (trace / 2).toFixed(2);
        const im = (Math.sqrt(-disc) / 2).toFixed(2);
        eigenStr = `${re} ± ${im}i`;
      }

      const statsEl = document.getElementById('ai-canvas-stats');
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="stat-pill"><span class="k">det(A):</span> <span class="v">${det.toFixed(2)}</span> &nbsp;|&nbsp; <span class="k">det(A₁):</span> <span class="v">${detA1.toFixed(2)}</span> &nbsp;|&nbsp; <span class="k">det(A₂):</span> <span class="v">${detA2.toFixed(2)}</span></div>
          <div class="stat-pill ${isSingular ? 'warn' : 'success'}"><span class="k">Cramer's Solution:</span> ${isSingular ? 'Singular (det=0, no unique solve)' : `x₁ = det(A₁)/det(A) = <strong>${x1.toFixed(2)}</strong>, &nbsp; x₂ = det(A₂)/det(A) = <strong>${x2.toFixed(2)}</strong>`}</div>
          <div class="stat-pill"><span class="k">Matrix Trace Tr(A):</span> <span class="v">${trace.toFixed(2)}</span> &nbsp;|&nbsp; <span class="k">Char Poly:</span> λ² - (${trace.toFixed(1)})λ + (${det.toFixed(1)}) = 0</div>
          <div class="stat-pill info"><span class="k">Eigenvalues:</span> ${eigenStr} &nbsp;(Sum = Tr(A), Product = det(A))</div>
        `;
      }
    }
  }

  drawLineEquation(a, b, c, color, label) {
    // a * x + b * y = c
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const pts = [];
    // Evaluate across x bounds [-10, 10]
    if (Math.abs(b) > 0.001) {
      const y1 = (c - a * -10) / b;
      const y2 = (c - a * 10) / b;
      pts.push(this.toCanvas(-10, y1), this.toCanvas(10, y2));
    } else if (Math.abs(a) > 0.001) {
      const x = c / a;
      pts.push(this.toCanvas(x, -10), this.toCanvas(x, 10));
    }

    if (pts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==========================================================================
  // MODULE 00C: Differential Equations, Vector Fields & RK4 vs Euler
  // ==========================================================================
  get00cControlsHtml() {
    return `
      <div class="ai-controls-grid">
        <div class="ai-control-group">
          <div class="ai-control-title">Dynamical System Vector Field</div>
          <div class="ai-chips-row">
            <button class="ai-chip ${this.odeState.preset === 'sink' ? 'active' : ''}" id="chip-ode-sink">Stable Attractor</button>
            <button class="ai-chip ${this.odeState.preset === 'spiral' ? 'active' : ''}" id="chip-ode-spiral">Spiral Sink</button>
            <button class="ai-chip ${this.odeState.preset === 'saddle' ? 'active' : ''}" id="chip-ode-saddle">Saddle Point</button>
            <button class="ai-chip ${this.odeState.preset === 'gradflow' ? 'active' : ''}" id="chip-ode-gradflow">Continuous Gradient Flow</button>
          </div>
        </div>

        <div class="ai-control-group">
          <div class="ai-control-title">Numerical Solver & Step Size h</div>
          <div class="ai-chips-row">
            <button class="ai-chip ${this.odeState.solver === 'euler' ? 'active' : ''}" id="chip-ode-euler">Forward Euler</button>
            <button class="ai-chip ${this.odeState.solver === 'rk4' ? 'active' : ''}" id="chip-ode-rk4">Runge-Kutta 4 (RK4)</button>
            <button class="ai-chip" id="chip-ode-clear">Clear Trajectories</button>
          </div>
          <div class="ai-slider-row" style="margin-top:0.5rem;">
            <span>Step h:</span>
            <input type="range" id="slider-ode-h" min="0.02" max="0.8" step="0.02" value="${this.odeState.h}" />
            <span class="val-badge" id="slider-ode-h-val">${this.odeState.h}</span>
          </div>
        </div>
      </div>
    `;
  }

  getOdeDerivative(x, y) {
    switch (this.odeState.preset) {
      case 'sink':
        return { dx: -x, dy: -y };
      case 'spiral':
        return { dx: -x - 2 * y, dy: 2 * x - y };
      case 'saddle':
        return { dx: x, dy: -y };
      case 'gradflow':
        // Loss: 0.5 * (x^2 + 4 * y^2) -> grad = [x, 4y]
        return { dx: -x, dy: -3 * y };
      default:
        return { dx: -x, dy: -y };
    }
  }

  addOdeParticle(x, y) {
    this.odeState.particles.push({
      x,
      y,
      path: [{ x, y }],
      alive: 120
    });
  }

  render00c() {
    // 1. Draw Vector Field Grid of Arrows
    const ctx = this.ctx;
    ctx.save();
    for (let gx = -5; gx <= 5; gx += 1) {
      for (let gy = -4; gy <= 4; gy += 1) {
        const d = this.getOdeDerivative(gx, gy);
        const mag = Math.hypot(d.dx, d.dy);
        if (mag > 0.001) {
          const arrowLen = 0.35;
          const uX = (d.dx / mag) * arrowLen;
          const uY = (d.dy / mag) * arrowLen;
          this.drawArrow(gx, gy, gx + uX, gy + uY, 'rgba(255, 255, 255, 0.18)', 1.0);
        }
      }
    }
    ctx.restore();

    // Auto spawn sample particles if empty
    if (this.odeState.particles.length === 0) {
      this.addOdeParticle(3.0, 2.5);
      this.addOdeParticle(-3.0, -2.0);
      this.addOdeParticle(-2.5, 3.0);
      this.addOdeParticle(2.5, -3.0);
    }

    // 2. Advance and render particle trajectories
    const h = this.odeState.h;
    const isRK4 = this.odeState.solver === 'rk4';

    this.odeState.particles.forEach((p) => {
      if (p.path.length < this.odeState.traceLength) {
        let nextX = p.x;
        let nextY = p.y;

        if (!isRK4) {
          // Forward Euler
          const d = this.getOdeDerivative(p.x, p.y);
          nextX = p.x + h * d.dx;
          nextY = p.y + h * d.dy;
        } else {
          // RK4
          const k1 = this.getOdeDerivative(p.x, p.y);
          const k2 = this.getOdeDerivative(p.x + 0.5 * h * k1.dx, p.y + 0.5 * h * k1.dy);
          const k3 = this.getOdeDerivative(p.x + 0.5 * h * k2.dx, p.y + 0.5 * h * k2.dy);
          const k4 = this.getOdeDerivative(p.x + h * k3.dx, p.y + h * k3.dy);

          nextX = p.x + (h / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
          nextY = p.y + (h / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
        }

        p.x = nextX;
        p.y = nextY;
        p.path.push({ x: nextX, y: nextY });
      }

      // Draw Trajectory Ribbon
      if (p.path.length > 1) {
        ctx.save();
        ctx.strokeStyle = isRK4 ? '#38bdf8' : '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const pStart = this.toCanvas(p.path[0].x, p.path[0].y);
        ctx.moveTo(pStart.x, pStart.y);
        for (let i = 1; i < p.path.length; i++) {
          const pt = this.toCanvas(p.path[i].x, p.path[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Tip dot
        const pEnd = this.toCanvas(p.x, p.y);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(pEnd.x, pEnd.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    const statsEl = document.getElementById('ai-canvas-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-pill"><span class="k">Solver:</span> <span class="v">${isRK4 ? 'RK4 (4th-Order Accuracy, O(h⁴))' : 'Euler (1st-Order Accuracy, O(h))'}</span></div>
        <div class="stat-pill"><span class="k">Step Size h:</span> <span class="v">${h.toFixed(2)}</span></div>
        <div class="stat-pill"><span class="k">Phase Portrait:</span> <span class="v">${this.odeState.preset.toUpperCase()}</span></div>
        <div class="stat-pill info">Click anywhere on the grid to drop a new trajectory!</div>
      `;
    }
  }

  // ==========================================================================
  // MODULE 01: SVD, Eigenvalues & PCA Low-Rank Compression
  // ==========================================================================
  get01ControlsHtml() {
    return `
      <div class="ai-controls-grid">
        <div class="ai-control-group">
          <div class="ai-control-title">SVD Low-Rank Compression Slider</div>
          <div class="ai-slider-row">
            <span>Project (Rank 2 → Rank 1):</span>
            <input type="range" id="slider-svd-compress" min="0" max="1" step="0.02" value="${this.svdState.compressionRatio}" />
            <span class="val-badge" id="slider-svd-compress-val">${Math.round(this.svdState.compressionRatio * 100)}%</span>
          </div>
          <div class="ai-chips-row" style="margin-top:0.4rem;">
            <button class="ai-chip" id="chip-svd-full">Rank 2 (Original)</button>
            <button class="ai-chip" id="chip-svd-rank1">Rank 1 (Collapsed to u1)</button>
          </div>
        </div>

        <div class="ai-control-group">
          <div class="ai-control-title">Semantic Query Embedding</div>
          <div class="ai-slider-row">
            <span>Query x:</span>
            <input type="range" id="slider-query-x" min="-4" max="4" step="0.2" value="${this.svdState.queryVec.x}" />
            <span class="val-badge" id="slider-query-x-val">${this.svdState.queryVec.x}</span>
            <span>Query y:</span>
            <input type="range" id="slider-query-y" min="-4" max="4" step="0.2" value="${this.svdState.queryVec.y}" />
            <span class="val-badge" id="slider-query-y-val">${this.svdState.queryVec.y}</span>
          </div>
        </div>
      </div>
    `;
  }

  render01() {
    const ctx = this.ctx;
    const blend = this.svdState.compressionRatio; // 0 = 2D, 1 = projected onto 1st principal component

    // Principal component direction u1 ≈ [0.8, 0.6], u2 ≈ [-0.6, 0.8]
    const u1 = { x: 0.832, y: 0.555 };
    const u2 = { x: -0.555, y: 0.832 };

    // 1. Draw Principal Axes (Eigenvectors / Singular Vectors)
    this.drawArrow(0, 0, u1.x * 3.5, u1.y * 3.5, '#38bdf8', 2.5, 'u1 (σ1 = 3.8)');
    this.drawArrow(0, 0, u2.x * 1.5, u2.y * 1.5, '#fb7185', 2.0, 'u2 (σ2 = 0.8)');

    // 2. Draw Data Points (interpolating between full 2D position and rank-1 projection)
    ctx.save();
    this.svdState.points.forEach((pt) => {
      // Dot product with u1
      const projCoord = pt.x * u1.x + pt.y * u1.y;
      const projX = projCoord * u1.x;
      const projY = projCoord * u1.y;

      const curX = pt.x * (1 - blend) + projX * blend;
      const curY = pt.y * (1 - blend) + projY * blend;

      const pScreen = this.toCanvas(curX, curY);

      // Point dot
      ctx.fillStyle = '#a855f7';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pScreen.x, pScreen.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Drop dashed line if blending
      if (blend > 0.05 && blend < 0.95) {
        const pOrig = this.toCanvas(pt.x, pt.y);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(pOrig.x, pOrig.y);
        ctx.lineTo(pScreen.x, pScreen.y);
        ctx.stroke();
      }
    });
    ctx.restore();

    // 3. Draw Query Vector & Nearest Match
    const q = this.svdState.queryVec;
    this.drawArrow(0, 0, q.x, q.y, '#10b981', 3.0, 'Query q');

    // Find closest embedding by Cosine Similarity
    let bestSim = -2;
    let bestPt = null;
    const qMag = Math.hypot(q.x, q.y);

    this.svdState.points.forEach((pt) => {
      const ptMag = Math.hypot(pt.x, pt.y);
      if (qMag > 0.01 && ptMag > 0.01) {
        const sim = (q.x * pt.x + q.y * pt.y) / (qMag * ptMag);
        if (sim > bestSim) {
          bestSim = sim;
          bestPt = pt;
        }
      }
    });

    if (bestPt) {
      const pBest = this.toCanvas(bestPt.x, bestPt.y);
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      const pQ = this.toCanvas(q.x, q.y);
      ctx.beginPath();
      ctx.moveTo(pQ.x, pQ.y);
      ctx.lineTo(pBest.x, pBest.y);
      ctx.stroke();
      ctx.restore();
    }

    const statsEl = document.getElementById('ai-canvas-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-pill"><span class="k">SVD Representation:</span> <span class="v">${blend > 0.9 ? 'Rank-1 Truncated (Compressed)' : blend < 0.1 ? 'Rank-2 (Full Dimensionality)' : `Blending: ${(blend * 100).toFixed(0)}%`}</span></div>
        <div class="stat-pill"><span class="k">Top Cosine Sim:</span> <span class="v">${bestSim.toFixed(3)} (Nearest Embedding)</span></div>
        <div class="stat-pill success"><span class="k">LoRA Analogy:</span> Preserving top singular direction captures ~90% variance!</div>
      `;
    }
  }

  // ==========================================================================
  // MODULE 02: 2D Loss Landscape & Gradient Descent
  // ==========================================================================
  get02ControlsHtml() {
    return `
      <div class="ai-controls-grid">
        <div class="ai-control-group">
          <div class="ai-control-title">Calculus Visualizer Mode</div>
          <div class="ai-chips-row">
            <button class="ai-chip ${this.gradState.mode === 'landscape' ? 'active' : ''}" id="chip-calc-landscape">2D Loss Surface &amp; Gradient</button>
            <button class="ai-chip ${this.gradState.mode === 'transcendental' ? 'active' : ''}" id="chip-calc-trans">Transcendental Activations &amp; Tangents</button>
          </div>
        </div>

        <div class="ai-control-group" id="group-calc-landscape" style="${this.gradState.mode === 'landscape' ? '' : 'display:none;'}">
          <div class="ai-control-title">Loss Surface Geometry</div>
          <div class="ai-chips-row">
            <button class="ai-chip ${this.gradState.surface === 'bowl' ? 'active' : ''}" id="chip-loss-bowl">Quadratic Bowl (Minimum)</button>
            <button class="ai-chip ${this.gradState.surface === 'saddle' ? 'active' : ''}" id="chip-loss-saddle">Hyperbolic Saddle Point</button>
            <button class="ai-chip" id="chip-loss-step">Take 1 Gradient Step</button>
            <button class="ai-chip" id="chip-loss-reset">Reset Start</button>
          </div>
          <div class="ai-slider-row" style="margin-top:0.5rem;">
            <span>Learning Rate η:</span>
            <input type="range" id="slider-loss-lr" min="0.02" max="0.5" step="0.02" value="${this.gradState.lr}" />
            <span class="val-badge" id="slider-loss-lr-val">${this.gradState.lr}</span>
          </div>
        </div>

        <div class="ai-control-group" id="group-calc-trans" style="${this.gradState.mode === 'transcendental' ? '' : 'display:none;'}">
          <div class="ai-control-title">Transcendental Activation f(x) &amp; Derivative Tangent</div>
          <div class="ai-chips-row">
            <button class="ai-chip ${this.gradState.activation === 'sigmoid' ? 'active' : ''}" id="chip-act-sigmoid">Sigmoid σ(x)</button>
            <button class="ai-chip ${this.gradState.activation === 'tanh' ? 'active' : ''}" id="chip-act-tanh">Tanh tanh(x)</button>
            <button class="ai-chip ${this.gradState.activation === 'softplus' ? 'active' : ''}" id="chip-act-softplus">Softplus ln(1+eˣ)</button>
            <button class="ai-chip ${this.gradState.activation === 'exp' ? 'active' : ''}" id="chip-act-exp">Exponential eˣ</button>
          </div>
          <div class="ai-slider-row" style="margin-top:0.5rem;">
            <span>Input point x:</span>
            <input type="range" id="slider-act-x" min="-4" max="4" step="0.1" value="${this.gradState.inputX}" />
            <span class="val-badge" id="slider-act-x-val">${this.gradState.inputX}</span>
          </div>
        </div>
      </div>
    `;
  }

  render02() {
    const ctx = this.ctx;

    if (this.gradState.mode === 'transcendental') {
      const act = this.gradState.activation;
      const x0 = this.gradState.inputX;

      const evalFn = (x) => {
        if (act === 'sigmoid') return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, x))));
        if (act === 'tanh') return Math.tanh(x);
        if (act === 'softplus') return Math.log(1 + Math.exp(Math.max(-15, Math.min(15, x))));
        if (act === 'exp') return Math.exp(Math.max(-10, Math.min(2.5, x)));
        return x;
      };

      const evalDeriv = (x) => {
        if (act === 'sigmoid') {
          const s = evalFn(x);
          return s * (1 - s);
        }
        if (act === 'tanh') {
          const t = Math.tanh(x);
          return 1 - t * t;
        }
        if (act === 'softplus') {
          return 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, x)))); // Derivative of softplus is sigmoid!
        }
        if (act === 'exp') {
          return evalFn(x);
        }
        return 1;
      };

      // 1. Draw Activation Curve f(x) (Cyan)
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let first = true;
      for (let x = -6; x <= 6; x += 0.05) {
        const y = evalFn(x);
        const p = this.toCanvas(x, y);
        if (first) { ctx.moveTo(p.x, p.y); first = false; }
        else { ctx.lineTo(p.x, p.y); }
      }
      ctx.stroke();

      // 2. Draw Derivative Curve f'(x) (Dashed Rose)
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      first = true;
      for (let x = -6; x <= 6; x += 0.05) {
        const dy = evalDeriv(x);
        const p = this.toCanvas(x, dy);
        if (first) { ctx.moveTo(p.x, p.y); first = false; }
        else { ctx.lineTo(p.x, p.y); }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Tangent Line at x0: y = f(x0) + f'(x0) * (x - x0) (Emerald)
      const y0 = evalFn(x0);
      const dy0 = evalDeriv(x0);

      const span = 2.5;
      const pT1 = this.toCanvas(x0 - span, y0 - dy0 * span);
      const pT2 = this.toCanvas(x0 + span, y0 + dy0 * span);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(pT1.x, pT1.y);
      ctx.lineTo(pT2.x, pT2.y);
      ctx.stroke();

      // 4. Dot at (x0, f(x0))
      const p0 = this.toCanvas(x0, y0);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Label at dot
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.fillText(`(x₀, f(x₀)) = (${x0.toFixed(1)}, ${y0.toFixed(2)})`, p0.x + 10, p0.y - 10);
      ctx.restore();

      // 5. Stats Panel
      const isVanishing = Math.abs(dy0) < 0.05 && (act === 'sigmoid' || act === 'tanh');
      const statsEl = document.getElementById('ai-canvas-stats');
      if (statsEl) {
        statsEl.innerHTML = `
          <div class="stat-pill"><span class="k">f(x₀):</span> <span class="v">${y0.toFixed(4)}</span> &nbsp;|&nbsp; <span class="k">Derivative f'(x₀) [Slope]:</span> <span class="v">${dy0.toFixed(4)}</span></div>
          <div class="stat-pill"><span class="k">1st-Order Taylor Tangent:</span> y ≈ ${y0.toFixed(2)} + ${dy0.toFixed(2)}(x - ${x0.toFixed(1)})</div>
          <div class="stat-pill ${isVanishing ? 'warn' : 'success'}">${isVanishing ? '⚠️ Vanishing Gradient Alert: Slope ≈ 0 halts backpropagation weight updates!' : 'Active Gradient: Signal propagates backward effectively.'}</div>
          <div class="stat-pill info"><span class="k">Curves:</span> Blue = f(x), Dashed Rose = f'(x), Green = Tangent at x₀ (drag x₀ along curve)</div>
        `;
      }
      return;
    }

    const isBowl = this.gradState.surface === 'bowl';

    // 1. Draw contour ellipses of loss
    ctx.save();
    for (let r = 0.8; r <= 4.5; r += 0.8) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const pC = this.toCanvas(0, 0);
      if (isBowl) {
        ctx.ellipse(pC.x, pC.y, r * this.scale, (r / 1.7) * this.scale, 0, 0, Math.PI * 2);
      } else {
        // Hyperbolic contours
        ctx.arc(pC.x, pC.y, r * this.scale, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Current Point & Gradient Vector
    const w = this.gradState.w;
    const grad = isBowl ? { dx: 2 * w.x, dy: 6 * w.y } : { dx: 2 * w.x, dy: -2 * w.y };

    // Gradient Arrow (Steepest Ascent in Rose)
    this.drawArrow(w.x, w.y, w.x + grad.dx * 0.15, w.y + grad.dy * 0.15, '#fb7185', 2.0, '+∇L (Ascent)');
    // Negative Gradient Step (Steepest Descent in Emerald)
    this.drawArrow(w.x, w.y, w.x - this.gradState.lr * grad.dx, w.y - this.gradState.lr * grad.dy, '#10b981', 3.0, '-η∇L');

    // Trajectory path
    if (this.gradState.history.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const p0 = this.toCanvas(this.gradState.history[0].x, this.gradState.history[0].y);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < this.gradState.history.length; i++) {
        const pt = this.toCanvas(this.gradState.history[i].x, this.gradState.history[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Weight point
    const pw = this.toCanvas(w.x, w.y);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(pw.x, pw.y, 6, 0, Math.PI * 2);
    ctx.fill();

    const lossVal = isBowl ? (w.x * w.x + 3 * w.y * w.y) : (w.x * w.x - w.y * w.y);

    const statsEl = document.getElementById('ai-canvas-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-pill"><span class="k">Loss L(w):</span> <span class="v">${lossVal.toFixed(3)}</span></div>
        <div class="stat-pill"><span class="k">Gradient ||∇L||:</span> <span class="v">${Math.hypot(grad.dx, grad.dy).toFixed(2)}</span></div>
        <div class="stat-pill"><span class="k">Current Weight w:</span> <span class="v">(${w.x.toFixed(2)}, ${w.y.toFixed(2)})</span></div>
        <div class="stat-pill info">Click anywhere on landscape to reposition starting parameters!</div>
      `;
    }
  }

  // ==========================================================================
  // MODULE 03: Bivariate Gaussian & Entropy
  // ==========================================================================
  get03ControlsHtml() {
    return `
      <div class="ai-controls-grid">
        <div class="ai-control-group">
          <div class="ai-control-title">Bivariate Gaussian Parameters</div>
          <div class="ai-slider-row">
            <span>σ_x:</span>
            <input type="range" id="slider-prob-sx" min="0.5" max="3" step="0.1" value="${this.probState.sigmaX}" />
            <span class="val-badge" id="slider-prob-sx-val">${this.probState.sigmaX}</span>
            <span>σ_y:</span>
            <input type="range" id="slider-prob-sy" min="0.5" max="3" step="0.1" value="${this.probState.sigmaY}" />
            <span class="val-badge" id="slider-prob-sy-val">${this.probState.sigmaY}</span>
          </div>
          <div class="ai-slider-row">
            <span>Correlation ρ:</span>
            <input type="range" id="slider-prob-rho" min="-0.9" max="0.9" step="0.05" value="${this.probState.rho}" />
            <span class="val-badge" id="slider-prob-rho-val">${this.probState.rho}</span>
          </div>
        </div>
      </div>
    `;
  }

  render03() {
    const ctx = this.ctx;
    const sx = this.probState.sigmaX;
    const sy = this.probState.sigmaY;
    const rho = this.probState.rho;

    // Covariance matrix det: sx^2 * sy^2 * (1 - rho^2)
    const covDet = sx * sx * sy * sy * (1 - rho * rho);
    // Differential Entropy: 0.5 * ln( (2*pi*e)^2 * det(Sigma) )
    const entropy = 0.5 * Math.log(Math.pow(2 * Math.PI * Math.E, 2) * Math.max(0.001, covDet));

    // Tilt angle of principal covariance axis
    const angle = 0.5 * Math.atan2(2 * rho * sx * sy, (sx * sx - sy * sy));

    ctx.save();
    const p0 = this.toCanvas(0, 0);

    // 1-sigma, 2-sigma, 3-sigma ellipses
    [1, 2, 3].forEach((k) => {
      ctx.strokeStyle = k === 1 ? '#38bdf8' : k === 2 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = k === 1 ? 2 : 1;
      ctx.beginPath();
      ctx.ellipse(p0.x, p0.y, k * sx * this.scale, k * sy * (1 - Math.abs(rho) * 0.4) * this.scale, -angle, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();

    const statsEl = document.getElementById('ai-canvas-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="stat-pill"><span class="k">Covariance Det |Σ|:</span> <span class="v">${covDet.toFixed(3)}</span></div>
        <div class="stat-pill"><span class="k">Differential Entropy H(X,Y):</span> <span class="v">${entropy.toFixed(3)} nats</span></div>
        <div class="stat-pill"><span class="k">Correlation ρ:</span> <span class="v">${rho.toFixed(2)}</span></div>
      `;
    }
  }

  // ==========================================================================
  // Control Bindings
  // ==========================================================================
  bindControlInputs() {
    const onInput = (id, cb) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', (e) => cb(parseFloat(e.target.value)));
    };

    const onClick = (id, cb) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', cb);
    };

    // 00a Controls
    onInput('slider-ux', (v) => { this.vState.u.x = v; document.getElementById('slider-ux-val').innerText = v; });
    onInput('slider-uy', (v) => { this.vState.u.y = v; document.getElementById('slider-uy-val').innerText = v; });
    onInput('slider-vx', (v) => { this.vState.v.x = v; document.getElementById('slider-vx-val').innerText = v; });
    onInput('slider-vy', (v) => { this.vState.v.y = v; document.getElementById('slider-vy-val').innerText = v; });

    onClick('chip-toggle-proj', () => {
      this.vState.showProj = !this.vState.showProj;
      const el = document.getElementById('chip-toggle-proj');
      if (el) el.classList.toggle('active', this.vState.showProj);
    });

    onClick('chip-toggle-sum', () => {
      this.vState.showSum = !this.vState.showSum;
      const el = document.getElementById('chip-toggle-sum');
      if (el) el.classList.toggle('active', this.vState.showSum);
    });

    onClick('chip-preset-ortho', () => {
      this.vState.u = { x: 3.0, y: 0.0 };
      this.vState.v = { x: 0.0, y: 2.5 };
      this.syncSlider('slider-ux', 3.0);
      this.syncSlider('slider-uy', 0.0);
      this.syncSlider('slider-vx', 0.0);
      this.syncSlider('slider-vy', 2.5);
    });

    onClick('chip-preset-collinear', () => {
      this.vState.u = { x: 2.0, y: 1.0 };
      this.vState.v = { x: 4.0, y: 2.0 };
      this.syncSlider('slider-ux', 2.0);
      this.syncSlider('slider-uy', 1.0);
      this.syncSlider('slider-vx', 4.0);
      this.syncSlider('slider-vy', 2.0);
    });

    // 00b Controls
    onInput('slider-a11', (v) => { this.sysState.a11 = v; document.getElementById('slider-a11-val').innerText = v; });
    onInput('slider-a12', (v) => { this.sysState.a12 = v; document.getElementById('slider-a12-val').innerText = v; });
    onInput('slider-a21', (v) => { this.sysState.a21 = v; document.getElementById('slider-a21-val').innerText = v; });
    onInput('slider-a22', (v) => { this.sysState.a22 = v; document.getElementById('slider-a22-val').innerText = v; });
    onInput('slider-b1', (v) => { this.sysState.b1 = v; document.getElementById('slider-b1-val').innerText = v; });
    onInput('slider-b2', (v) => { this.sysState.b2 = v; document.getElementById('slider-b2-val').innerText = v; });

    onClick('chip-mode-row', () => {
      this.sysState.mode = 'row';
      document.getElementById('chip-mode-row')?.classList.add('active');
      document.getElementById('chip-mode-col')?.classList.remove('active');
      document.getElementById('chip-mode-cramer')?.classList.remove('active');
    });

    onClick('chip-mode-col', () => {
      this.sysState.mode = 'col';
      document.getElementById('chip-mode-col')?.classList.add('active');
      document.getElementById('chip-mode-row')?.classList.remove('active');
      document.getElementById('chip-mode-cramer')?.classList.remove('active');
    });

    onClick('chip-mode-cramer', () => {
      this.sysState.mode = 'cramer';
      document.getElementById('chip-mode-cramer')?.classList.add('active');
      document.getElementById('chip-mode-row')?.classList.remove('active');
      document.getElementById('chip-mode-col')?.classList.remove('active');
    });

    onClick('chip-preset-singular', () => {
      this.sysState.a11 = 2; this.sysState.a12 = 4;
      this.sysState.a21 = 1; this.sysState.a22 = 2;
      this.syncSlider('slider-a11', 2); this.syncSlider('slider-a12', 4);
      this.syncSlider('slider-a21', 1); this.syncSlider('slider-a22', 2);
    });

    onClick('chip-preset-invertible', () => {
      this.sysState.a11 = 2; this.sysState.a12 = 1;
      this.sysState.a21 = 1; this.sysState.a22 = 3;
      this.syncSlider('slider-a11', 2); this.syncSlider('slider-a12', 1);
      this.syncSlider('slider-a21', 1); this.syncSlider('slider-a22', 3);
    });

    // 00c Controls
    ['sink', 'spiral', 'saddle', 'gradflow'].forEach((name) => {
      onClick(`chip-ode-${name}`, () => {
        this.odeState.preset = name;
        this.odeState.particles = [];
        ['sink', 'spiral', 'saddle', 'gradflow'].forEach((n) => {
          const el = document.getElementById(`chip-ode-${n}`);
          if (el) el.classList.toggle('active', n === name);
        });
      });
    });

    onClick('chip-ode-euler', () => {
      this.odeState.solver = 'euler';
      this.odeState.particles = [];
      document.getElementById('chip-ode-euler').classList.add('active');
      document.getElementById('chip-ode-rk4').classList.remove('active');
    });

    onClick('chip-ode-rk4', () => {
      this.odeState.solver = 'rk4';
      this.odeState.particles = [];
      document.getElementById('chip-ode-rk4').classList.add('active');
      document.getElementById('chip-ode-euler').classList.remove('active');
    });

    onClick('chip-ode-clear', () => {
      this.odeState.particles = [];
    });

    onInput('slider-ode-h', (v) => {
      this.odeState.h = v;
      document.getElementById('slider-ode-h-val').innerText = v;
      this.odeState.particles = [];
    });

    // 01 Controls
    onInput('slider-svd-compress', (v) => {
      this.svdState.compressionRatio = v;
      document.getElementById('slider-svd-compress-val').innerText = `${Math.round(v * 100)}%`;
    });
    onClick('chip-svd-full', () => {
      this.svdState.compressionRatio = 0.0;
      this.syncSlider('slider-svd-compress', 0);
      document.getElementById('slider-svd-compress-val').innerText = '0%';
    });
    onClick('chip-svd-rank1', () => {
      this.svdState.compressionRatio = 1.0;
      this.syncSlider('slider-svd-compress', 1);
      document.getElementById('slider-svd-compress-val').innerText = '100%';
    });
    onInput('slider-query-x', (v) => { this.svdState.queryVec.x = v; document.getElementById('slider-query-x-val').innerText = v; });
    onInput('slider-query-y', (v) => { this.svdState.queryVec.y = v; document.getElementById('slider-query-y-val').innerText = v; });

    // 02 Controls
    onClick('chip-calc-landscape', () => {
      this.gradState.mode = 'landscape';
      document.getElementById('chip-calc-landscape')?.classList.add('active');
      document.getElementById('chip-calc-trans')?.classList.remove('active');
      const gL = document.getElementById('group-calc-landscape');
      const gT = document.getElementById('group-calc-trans');
      if (gL) gL.style.display = '';
      if (gT) gT.style.display = 'none';
    });

    onClick('chip-calc-trans', () => {
      this.gradState.mode = 'transcendental';
      document.getElementById('chip-calc-trans')?.classList.add('active');
      document.getElementById('chip-calc-landscape')?.classList.remove('active');
      const gL = document.getElementById('group-calc-landscape');
      const gT = document.getElementById('group-calc-trans');
      if (gL) gL.style.display = 'none';
      if (gT) gT.style.display = '';
    });

    ['sigmoid', 'tanh', 'softplus', 'exp'].forEach((act) => {
      onClick(`chip-act-${act}`, () => {
        this.gradState.activation = act;
        ['sigmoid', 'tanh', 'softplus', 'exp'].forEach((a) => {
          const el = document.getElementById(`chip-act-${a}`);
          if (el) el.classList.toggle('active', a === act);
        });
      });
    });

    onInput('slider-act-x', (v) => {
      this.gradState.inputX = v;
      document.getElementById('slider-act-x-val').innerText = v;
    });

    onClick('chip-loss-bowl', () => {
      this.gradState.surface = 'bowl';
      this.gradState.w = { x: 2.8, y: 2.2 };
      this.gradState.history = [{ x: 2.8, y: 2.2 }];
      document.getElementById('chip-loss-bowl').classList.add('active');
      document.getElementById('chip-loss-saddle').classList.remove('active');
    });
    onClick('chip-loss-saddle', () => {
      this.gradState.surface = 'saddle';
      this.gradState.w = { x: 2.5, y: 0.3 };
      this.gradState.history = [{ x: 2.5, y: 0.3 }];
      document.getElementById('chip-loss-saddle').classList.add('active');
      document.getElementById('chip-loss-bowl').classList.remove('active');
    });
    onClick('chip-loss-step', () => {
      const isBowl = this.gradState.surface === 'bowl';
      const w = this.gradState.w;
      const grad = isBowl ? { dx: 2 * w.x, dy: 6 * w.y } : { dx: 2 * w.x, dy: -2 * w.y };
      this.gradState.w = {
        x: w.x - this.gradState.lr * grad.dx,
        y: w.y - this.gradState.lr * grad.dy
      };
      this.gradState.history.push({ ...this.gradState.w });
    });
    onClick('chip-loss-reset', () => {
      this.gradState.w = { x: 2.8, y: 2.2 };
      this.gradState.history = [{ x: 2.8, y: 2.2 }];
    });
    onInput('slider-loss-lr', (v) => {
      this.gradState.lr = v;
      document.getElementById('slider-loss-lr-val').innerText = v;
    });

    // 03 Controls
    onInput('slider-prob-sx', (v) => { this.probState.sigmaX = v; document.getElementById('slider-prob-sx-val').innerText = v; });
    onInput('slider-prob-sy', (v) => { this.probState.sigmaY = v; document.getElementById('slider-prob-sy-val').innerText = v; });
    onInput('slider-prob-rho', (v) => { this.probState.rho = v; document.getElementById('slider-prob-rho-val').innerText = v; });
  }

  updateStats() {
    // Stats are updated in render() loop
  }
}

