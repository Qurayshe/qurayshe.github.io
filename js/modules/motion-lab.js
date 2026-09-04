/**
 * Integrated 3D Motion & WebGL Lab (Three.js & Anime.js Workbench)
 * Hosts all 11 interactive experiments with real-time controls, FPS monitor, and inspector drawer.
 */

import ex01 from '../../qutest2/js/examples/01-three-geometries.js';
import ex02 from '../../qutest2/js/examples/02-three-lighting-pbr.js';
import ex03 from '../../qutest2/js/examples/03-three-particle-galaxy.js';
import ex04 from '../../qutest2/js/examples/04-anime-kinetic-svg.js';
import ex05 from '../../qutest2/js/examples/05-anime-timelines.js';
import ex06 from '../../qutest2/js/examples/06-anime-stagger-grid.js';
import ex07 from '../../qutest2/js/examples/07-combo-camera-director.js';
import ex08 from '../../qutest2/js/examples/08-combo-exploding-mesh.js';
import ex09 from '../../qutest2/js/examples/09-combo-hologram-pulse.js';
import ex10 from '../../qutest2/js/examples/10-combo-3d-cards.js';
import ex11 from '../../qutest2/js/examples/11-combo-kinetic-audio.js';

import { copyToClipboard } from '../utils/helpers.js';

const EXAMPLES = [ex01, ex02, ex03, ex04, ex05, ex06, ex07, ex08, ex09, ex10, ex11];

export class MotionLab {
  constructor(container) {
    this.container = container;
    this.currentExample = null;
    this.currentInstance = null;
    this.filterCategory = 'all';
    this.searchQuery = '';
    this.fps = 60;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fpsAnimationId = null;
    this.playbackAnimationId = null;
    this.isPlaying = true;
    this.isScrubbing = false;
    this.currentParams = {};
    this.controlMetadata = [];
    this.rawSnippetTemplate = '';
  }

  init(initialExampleId = null) {
    this.renderLayout();
    this.bindEvents();
    this.startFPSMonitor();
    this.startPlaybackHUDMonitor();

    const target = EXAMPLES.find((e) => e.id === initialExampleId) || EXAMPLES[0];
    this.loadExample(target);
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="motion-lab-app">
        <!-- Sidebar Navigation -->
        <aside class="motion-sidebar" id="motion-sidebar">
          <div class="motion-brand">
            <div class="motion-logo-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
                <line x1="12" y1="22" x2="12" y2="15.5" />
                <polyline points="22 8.5 12 15.5 2 8.5" />
              </svg>
            </div>
            <div>
              <div class="motion-brand-title">3D MOTION LAB</div>
              <div class="motion-brand-sub">Three.js &times; Anime.js Suite</div>
            </div>
          </div>

          <div class="motion-search-wrap">
            <input type="text" id="motion-search-input" class="lab-search-input" placeholder="Search 3D demos, shaders..." />
            <div class="motion-filter-pills">
              <button class="motion-pill active" data-category="all">All (11)</button>
              <button class="motion-pill" data-category="three">Three.js</button>
              <button class="motion-pill" data-category="anime">Anime.js</button>
              <button class="motion-pill" data-category="hybrid">Hybrid</button>
            </div>
          </div>

          <nav class="motion-nav-tree" id="motion-nav-tree">
            <!-- Rendered by renderSidebar() -->
          </nav>
        </aside>

        <!-- Main Viewport Stage -->
        <main class="motion-stage-wrap">
          <header class="motion-stage-header">
            <div class="motion-title-group">
              <button class="mobile-sidebar-toggle" id="motion-sidebar-toggle" aria-label="Toggle Demos">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span>Demos</span>
              </button>
              <h1 class="motion-stage-title" id="motion-stage-title">Loading...</h1>
              <div class="motion-stage-tags" id="motion-stage-tags"></div>
            </div>

            <div class="motion-stage-actions">
              <button class="btn-action active" id="btn-toggle-motion-inspector" title="Toggle Inspector Drawer">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                <span>Inspector & Controls</span>
              </button>
            </div>
          </header>

          <!-- 3D Canvas Viewport -->
          <div class="motion-canvas-viewport" id="motion-canvas-viewport">
            <!-- Active 3D canvas is injected here -->
          </div>

          <!-- Live FPS & Rendering Stats Badge -->
          <div class="motion-stats-badge">
            <div class="stats-live-dot"></div>
            <span id="motion-fps-val">60 FPS</span>
            <span class="stats-sep">|</span>
            <span id="motion-stats-details">WebGL Ready</span>
          </div>

          <!-- Floating Playback & Scrubber HUD -->
          <div class="motion-playback-hud">
            <button class="hud-btn hud-btn-primary" id="btn-motion-play-pause" title="Play / Pause">
              <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button class="hud-btn" id="btn-motion-restart" title="Restart Animation">
              <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
            </button>

            <div class="hud-scrubber-box">
              <input type="range" class="hud-scrubber" id="motion-hud-scrubber" min="0" max="100" value="0" step="0.1" />
              <span class="hud-time-display" id="motion-hud-time">00:00</span>
            </div>
          </div>
        </main>

        <!-- Right Inspector Drawer (Tutorial, Live Controls & Code) -->
        <aside class="motion-inspector-drawer" id="motion-inspector-drawer">
          <div class="inspector-tab-headers">
            <button class="inspector-tab-btn active" data-tab="tutorial">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Tutorial</span>
            </button>
            <button class="inspector-tab-btn" data-tab="controls">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
              <span>Controls</span>
            </button>
            <button class="inspector-tab-btn" data-tab="code">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              <span>Code</span>
            </button>
          </div>

          <div class="inspector-tab-content">
            <!-- Pane 1: Tutorial Guide -->
            <div class="inspector-pane active" id="pane-motion-tutorial"></div>

            <!-- Pane 2: Live Controls -->
            <div class="inspector-pane" id="pane-motion-controls"></div>

            <!-- Pane 3: Source Code Inspector -->
            <div class="inspector-pane" id="pane-motion-code">
              <div class="code-viewer-container" style="border: none; border-radius: 0;">
                <div class="code-viewer-header" style="background: rgba(255,255,255,0.02);">
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span class="live-pulse-dot"></span>
                    <span class="code-filename" id="motion-code-filename">example.js</span>
                  </div>
                  <button class="btn-copy" id="btn-motion-copy-code">
                    <span>Copy Code</span>
                  </button>
                </div>
                <div class="code-live-sync-bar" id="motion-code-live-vars" style="display: none;"></div>
                <pre class="code-block line-numbers"><code id="motion-code-content" class="language-javascript">// Code snippet</code></pre>
              </div>
            </div>
          </div>
        </aside>
      </div>
    `;

    this.renderSidebar();
  }

  renderSidebar() {
    const navTree = document.getElementById('motion-nav-tree');
    if (!navTree) return;

    navTree.innerHTML = '';

    const categories = [
      { name: 'Three.js Fundamentals', filter: 'three' },
      { name: 'Anime.js Motion Mastery', filter: 'anime' },
      { name: 'Three.js + Anime.js Synergy', filter: 'combo' }
    ];

    categories.forEach((cat) => {
      const filtered = EXAMPLES.filter((ex) => {
        const matchesCat = ex.category === cat.name;
        const matchesSearch =
          ex.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          ex.description.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesTag = this.filterCategory === 'all' || ex.badge.toLowerCase().includes(this.filterCategory);

        return matchesCat && matchesSearch && matchesTag;
      });

      if (filtered.length === 0) return;

      const groupWrap = document.createElement('div');
      groupWrap.className = 'motion-nav-group';

      const title = document.createElement('div');
      title.className = 'motion-group-title';
      title.innerText = cat.name;
      groupWrap.appendChild(title);

      const ul = document.createElement('ul');
      ul.className = 'curriculum-list';

      filtered.forEach((ex) => {
        const globalIdx = EXAMPLES.indexOf(ex) + 1;
        const padIdx = globalIdx < 10 ? `0${globalIdx}` : `${globalIdx}`;

        const li = document.createElement('li');
        li.className = `curriculum-item ${this.currentExample && this.currentExample.id === ex.id ? 'active' : ''}`;
        li.dataset.id = ex.id;

        li.innerHTML = `
          <span class="curriculum-item-num">${padIdx}</span>
          <div class="curriculum-item-info">
            <div class="curriculum-item-title">${ex.title}</div>
            <div class="curriculum-item-desc">${ex.description}</div>
          </div>
          <span class="stage-tag ${ex.badgeClass || 'badge-three'}">${ex.badge}</span>
        `;

        li.addEventListener('click', () => {
          this.loadExample(ex);
          // Auto close mobile drawer
          const sidebar = document.getElementById('motion-sidebar');
          if (sidebar) sidebar.classList.remove('open');
        });

        ul.appendChild(li);
      });

      groupWrap.appendChild(ul);
      navTree.appendChild(groupWrap);
    });
  }

  loadExample(example) {
    if (this.currentInstance && typeof this.currentInstance.destroy === 'function') {
      try {
        this.currentInstance.destroy();
      } catch (err) {
        console.warn('Error during previous scene disposal:', err);
      }
    }

    this.currentExample = example;
    this.currentParams = {};
    this.controlMetadata = [];
    this.rawSnippetTemplate = '';
    window.location.hash = `motion/${example.id}`;

    // Update Header
    const stageTitle = document.getElementById('motion-stage-title');
    const stageTags = document.getElementById('motion-stage-tags');
    if (stageTitle) stageTitle.innerText = example.title;
    if (stageTags) {
      stageTags.innerHTML = `
        <span class="stage-tag ${example.badgeClass}">${example.badge}</span>
        <span class="stage-tag badge-difficulty">${example.difficulty}</span>
      `;
    }

    // Highlight active in sidebar
    document.querySelectorAll('#motion-nav-tree .curriculum-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.id === example.id);
    });

    // Reset container and init example
    const container = document.getElementById('motion-canvas-viewport');
    if (container) {
      container.innerHTML = '';
      this.currentInstance = example.init(container, (stats) => {
        this.updateStatsDetails(stats);
      });
    }

    // Render Inspector Panes
    this.renderTutorialPane(example.tutorial);
    this.renderControlsPane();
    this.renderCodePane(example);

    // Reset Playback HUD
    this.isPlaying = true;
    this.isScrubbing = false;
    const playPauseBtn = document.getElementById('btn-motion-play-pause');
    if (playPauseBtn) {
      playPauseBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    }
    const scrubber = document.getElementById('motion-hud-scrubber');
    const hudTime = document.getElementById('motion-hud-time');
    if (scrubber) scrubber.value = 0;
    if (hudTime) hudTime.innerText = '00:00';
  }

  updateStatsDetails(stats) {
    const el = document.getElementById('motion-stats-details');
    if (!el || !stats) return;
    const entries = Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join(' | ');
    el.innerText = entries;
  }

  renderTutorialPane(tutorial) {
    const pane = document.getElementById('pane-motion-tutorial');
    if (!pane) return;

    if (!tutorial) {
      pane.innerHTML = `<div class="tutorial-card"><div class="tutorial-text">No guide notes available.</div></div>`;
      return;
    }

    let conceptsHtml = '';
    if (tutorial.keyConcepts && tutorial.keyConcepts.length > 0) {
      conceptsHtml = `
        <div class="tutorial-card">
          <div class="tutorial-card-title">Key APIs &amp; Methods</div>
          <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.5rem;">
            ${tutorial.keyConcepts
              .map(
                (c) => `
              <div>
                <strong style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.8rem;">${c.name}</strong>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">${c.desc}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    pane.innerHTML = `
      <div class="tutorial-card">
        <div class="tutorial-card-title">Overview</div>
        <div class="tutorial-text">${tutorial.overview}</div>
      </div>
      ${conceptsHtml}
      ${
        tutorial.tips
          ? `
        <div class="tutorial-card tip-card">
          <div class="tutorial-card-title" style="color: var(--accent-green);">Tips &amp; Controls</div>
          <div class="tutorial-text">${tutorial.tips}</div>
        </div>
      `
          : ''
      }
    `;
  }

  getControlMeta(ctrl, index) {
    const CONTROL_COLORS = [
      '#c084fc', // Neon Violet
      '#a855f7', // Electric Purple
      '#ffffff', // Pure White
      '#e9d5ff', // Lilac White
      '#d8b4fe', // Light Lavender
      '#9333ea', // Vivid Violet
      '#7f00ff', // Deep Purple
      '#b026ff'  // Cyber Magenta-Purple
    ];
    const color = ctrl.color || CONTROL_COLORS[index % CONTROL_COLORS.length];
    let varName = ctrl.varName;
    if (!varName) {
      const labelLower = (ctrl.label || '').toLowerCase().trim();
      if (labelLower.includes('shape') || labelLower.includes('geometry')) varName = 'shape';
      else if (labelLower.includes('amplitude') || labelLower.includes('wave amp')) varName = 'waveAmp';
      else if (labelLower.includes('frequency') || labelLower.includes('wave freq')) varName = 'waveFreq';
      else if (labelLower.includes('roughness')) varName = 'roughness';
      else if (labelLower.includes('metalness')) varName = 'metalness';
      else if (labelLower.includes('arm tip')) varName = 'tipColor';
      else if (labelLower.includes('core color') || labelLower.includes('base color') || labelLower.includes('glow color')) varName = 'color';
      else if (labelLower.includes('wireframe')) varName = 'wireframe';
      else if (labelLower.includes('spotlight')) varName = 'spotIntensity';
      else if (labelLower.includes('point light')) varName = 'pointIntensity';
      else if (labelLower.includes('orbit speed') || labelLower.includes('rotation speed')) varName = 'orbitSpeed';
      else if (labelLower.includes('particle count')) varName = 'particleCount';
      else if (labelLower.includes('particle size')) varName = 'particleSize';
      else if (labelLower.includes('spiral branches') || labelLower.includes('branches')) varName = 'branches';
      else if (labelLower.includes('vortex spin') || labelLower.includes('spin')) varName = 'spin';
      else if (labelLower.includes('stagger origin')) varName = 'staggerFrom';
      else if (labelLower.includes('motion type')) varName = 'motionType';
      else if (labelLower.includes('explode distance')) varName = 'explodeDist';
      else if (labelLower.includes('scanline')) varName = 'scanlines';
      else if (labelLower.includes('glitch')) varName = 'glitchOffset';
      else if (labelLower.includes('fresnel')) varName = 'fresnelPower';
      else if (labelLower.includes('glow intensity')) varName = 'glowIntensity';
      else if (labelLower.includes('tilt')) varName = 'tiltSens';
      else if (labelLower.includes('height')) varName = 'barHeight';
      else if (labelLower.includes('speed')) varName = 'speed';
      else if (ctrl.type === 'button') {
        varName = ctrl.label.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) + '()';
      } else {
        varName = labelLower.replace(/[^a-z0-9]/g, '_').slice(0, 10) || `param_${index}`;
      }
    }
    return { varName, color };
  }

  renderControlsPane() {
    const pane = document.getElementById('pane-motion-controls');
    if (!pane) return;

    pane.innerHTML = '';
    this.controlMetadata = [];

    if (!this.currentInstance || !this.currentInstance.getControls) {
      pane.innerHTML = `
        <div class="tutorial-card">
          <div class="tutorial-card-title">Interactive Viewport</div>
          <div class="tutorial-text">No adjustable live parameters for this demo. Click and drag in the 3D canvas to interact!</div>
        </div>
      `;
      return;
    }

    const controls = this.currentInstance.getControls();
    if (!controls || controls.length === 0) {
      pane.innerHTML = `
        <div class="tutorial-card">
          <div class="tutorial-card-title">Direct Viewport Controls</div>
          <div class="tutorial-text">Interact directly using orbit controls, mouse hover, and click events in the main stage.</div>
        </div>
      `;
      return;
    }

    const group = document.createElement('div');
    group.className = 'control-group';
    group.innerHTML = '';

    controls.forEach((ctrl, idx) => {
      const { varName, color } = this.getControlMeta(ctrl, idx);
      this.currentParams[varName] = ctrl.value;
      this.controlMetadata.push({ ctrl, varName, color, idx });

      const item = document.createElement('div');

      if (ctrl.type === 'slider') {
        item.innerHTML = `
          <div class="cyber-control-card" style="--ctrl-color: ${color};" data-var="${varName}">
            <div class="cyber-ctrl-header">
              <div class="cyber-ctrl-title-wrap">
                <span class="cyber-ctrl-dot" style="background: ${color}; box-shadow: 0 0 8px ${color};"></span>
                <span class="cyber-ctrl-label">${ctrl.label}</span>
              </div>
              <div class="cyber-ctrl-meta">
                <span class="cyber-var-tag" style="color: ${color}; border-color: ${color}55; background: ${color}15;">var: ${varName}</span>
                <span class="cyber-ctrl-val" id="ctrl-val-${idx}" style="color: ${color};">${ctrl.value}</span>
              </div>
            </div>
            <div class="cyber-slider-track-wrap">
              <input type="range" class="cyber-slider" id="ctrl-input-${idx}" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${ctrl.value}" style="--accent: ${color};" />
            </div>
            <div class="cyber-slider-bounds">
              <span>min: ${ctrl.min}</span>
              <span>max: ${ctrl.max}</span>
            </div>
          </div>
        `;
        const slider = item.querySelector('input');
        const valDisplay = item.querySelector(`#ctrl-val-${idx}`);
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          valDisplay.innerText = e.target.value;
          valDisplay.classList.remove('val-pulsing');
          void valDisplay.offsetWidth;
          valDisplay.classList.add('val-pulsing');

          if (ctrl.onChange) ctrl.onChange(val);
          this.updateParam(varName, val, color);
        });
      } else if (ctrl.type === 'select') {
        item.innerHTML = `
          <div class="cyber-control-card" style="--ctrl-color: ${color};" data-var="${varName}">
            <div class="cyber-ctrl-header">
              <div class="cyber-ctrl-title-wrap">
                <span class="cyber-ctrl-dot" style="background: ${color}; box-shadow: 0 0 8px ${color};"></span>
                <span class="cyber-ctrl-label">${ctrl.label}</span>
              </div>
              <span class="cyber-var-tag" style="color: ${color}; border-color: ${color}55; background: ${color}15;">var: ${varName}</span>
            </div>
            <div class="cyber-select-wrap">
              <select class="cyber-select" id="ctrl-input-${idx}" style="--accent: ${color};">
                ${ctrl.options.map((opt) => `<option value="${opt}" ${opt === ctrl.value ? 'selected' : ''}>${opt}</option>`).join('')}
              </select>
              <div class="cyber-select-arrow" style="color: ${color};">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          </div>
        `;
        const select = item.querySelector('select');
        select.addEventListener('change', (e) => {
          if (ctrl.onChange) ctrl.onChange(e.target.value);
          this.updateParam(varName, e.target.value, color);
        });
      } else if (ctrl.type === 'toggle') {
        item.innerHTML = `
          <div class="cyber-control-card" style="--ctrl-color: ${color};" data-var="${varName}">
            <div class="cyber-ctrl-header">
              <div class="cyber-ctrl-title-wrap">
                <span class="cyber-ctrl-dot" style="background: ${color}; box-shadow: 0 0 8px ${color};"></span>
                <span class="cyber-ctrl-label">${ctrl.label}</span>
              </div>
              <span class="cyber-var-tag" style="color: ${color}; border-color: ${color}55; background: ${color}15;">var: ${varName}</span>
            </div>
            <div class="cyber-toggle-row">
              <label class="cyber-switch">
                <input type="checkbox" id="ctrl-input-${idx}" ${ctrl.value ? 'checked' : ''} />
                <span class="cyber-switch-slider" style="--accent: ${color};">
                  <span class="cyber-switch-thumb"></span>
                </span>
              </label>
              <span class="cyber-toggle-status" id="ctrl-status-${idx}" style="color: ${color};">${ctrl.value ? 'ENABLED' : 'DISABLED'}</span>
            </div>
          </div>
        `;
        const toggle = item.querySelector('input');
        const statusText = item.querySelector(`#ctrl-status-${idx}`);
        toggle.addEventListener('change', (e) => {
          statusText.innerText = e.target.checked ? 'ENABLED' : 'DISABLED';
          if (ctrl.onChange) ctrl.onChange(e.target.checked);
          this.updateParam(varName, e.target.checked, color);
        });
      } else if (ctrl.type === 'color') {
        item.innerHTML = `
          <div class="cyber-control-card" style="--ctrl-color: ${color};" data-var="${varName}">
            <div class="cyber-ctrl-header">
              <div class="cyber-ctrl-title-wrap">
                <span class="cyber-ctrl-dot" style="background: ${color}; box-shadow: 0 0 8px ${color};"></span>
                <span class="cyber-ctrl-label">${ctrl.label}</span>
              </div>
              <span class="cyber-var-tag" style="color: ${color}; border-color: ${color}55; background: ${color}15;">var: ${varName}</span>
            </div>
            <div class="cyber-color-row">
              <label class="cyber-color-swatch" id="ctrl-swatch-${idx}" style="background-color: ${ctrl.value}; border-color: ${color}; box-shadow: 0 0 10px ${ctrl.value}66;">
                <input type="color" value="${ctrl.value}" class="cyber-color-input" id="ctrl-input-${idx}" />
              </label>
              <span class="cyber-color-hex" id="ctrl-val-${idx}" style="color: ${color};">${ctrl.value}</span>
              <span class="cyber-color-hint">Click swatch to pick</span>
            </div>
          </div>
        `;
        const colorInput = item.querySelector('input');
        const swatch = item.querySelector(`#ctrl-swatch-${idx}`);
        const hexDisplay = item.querySelector(`#ctrl-val-${idx}`);
        colorInput.addEventListener('input', (e) => {
          swatch.style.backgroundColor = e.target.value;
          swatch.style.boxShadow = `0 0 10px ${e.target.value}66`;
          hexDisplay.innerText = e.target.value;
          if (ctrl.onChange) ctrl.onChange(e.target.value);
          this.updateParam(varName, e.target.value, color);
        });
      } else if (ctrl.type === 'button') {
        item.innerHTML = `
          <div class="cyber-control-card cyber-control-btn-card" style="--ctrl-color: ${color};" data-var="${varName}">
            <button class="cyber-action-btn" id="ctrl-btn-${idx}" style="--btn-accent: ${color};">
              <span class="btn-spark" style="background: ${color}; box-shadow: 0 0 8px ${color};"></span>
              <span class="btn-text">${ctrl.label}</span>
              <span class="cyber-var-tag" style="color: ${color}; border-color: ${color}55; background: ${color}15;">${varName}</span>
            </button>
          </div>
        `;
        const btn = item.querySelector('button');
        btn.addEventListener('click', () => {
          if (typeof anime !== 'undefined') {
            anime({
              targets: btn,
              scale: [1, 0.96, 1.02, 1],
              duration: 300,
              easing: 'easeOutElastic(1, 0.5)'
            });
          }
          if (ctrl.onClick) ctrl.onClick();
        });
      }

      group.appendChild(item);
    });

    pane.appendChild(group);
  }

  renderCodePane(example) {
    const filename = document.getElementById('motion-code-filename');
    const liveVarsBar = document.getElementById('motion-code-live-vars');
    if (filename) filename.innerText = `${example.id}.js`;

    // 1. Render Neatly Integrated Interactive Controls Inside Code Tab
    if (liveVarsBar) {
      if (this.controlMetadata && this.controlMetadata.length > 0) {
        liveVarsBar.style.display = 'flex';
        liveVarsBar.className = 'code-integrated-controls';
        liveVarsBar.innerHTML = `
          <div class="code-ctrl-grid" id="code-interactive-controls-grid"></div>
        `;

        const grid = liveVarsBar.querySelector('#code-interactive-controls-grid');

        this.controlMetadata.forEach(({ ctrl, varName, color, idx }) => {
          const item = document.createElement('div');
          item.className = 'code-ctrl-item';
          item.style.setProperty('--item-color', color);
          item.dataset.var = varName;

          const currentVal = this.currentParams[varName] !== undefined ? this.currentParams[varName] : ctrl.value;

          if (ctrl.type === 'slider') {
            item.innerHTML = `
              <div class="code-ctrl-top">
                <span class="code-ctrl-tag" style="color: ${color};">var: ${varName}</span>
                <span class="code-ctrl-val" id="code-ctrl-val-${idx}">${currentVal}</span>
              </div>
              <div class="code-ctrl-slider-wrap">
                <input type="range" class="code-ctrl-slider" id="code-slider-${idx}" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${currentVal}" style="--accent: ${color};" />
              </div>
            `;
            const slider = item.querySelector('input');
            const valDisplay = item.querySelector(`#code-ctrl-val-${idx}`);

            slider.addEventListener('input', (e) => {
              const val = parseFloat(e.target.value);
              valDisplay.innerText = e.target.value;
              if (ctrl.onChange) ctrl.onChange(val);

              // Sync to Controls tab slider & readout
              const mainSlider = document.getElementById(`ctrl-input-${idx}`);
              const mainVal = document.getElementById(`ctrl-val-${idx}`);
              if (mainSlider) mainSlider.value = val;
              if (mainVal) mainVal.innerText = val;

              this.updateParam(varName, val, color, false);
            });
          } else if (ctrl.type === 'select') {
            item.innerHTML = `
              <div class="code-ctrl-top">
                <span class="code-ctrl-tag" style="color: ${color};">var: ${varName}</span>
              </div>
              <select class="code-ctrl-select" id="code-select-${idx}" style="--accent: ${color}; border-color: ${color}55;">
                ${ctrl.options.map((opt) => `<option value="${opt}" ${opt === currentVal ? 'selected' : ''}>${opt}</option>`).join('')}
              </select>
            `;
            const select = item.querySelector('select');
            select.addEventListener('change', (e) => {
              const val = e.target.value;
              if (ctrl.onChange) ctrl.onChange(val);

              // Sync to Controls tab select
              const mainSelect = document.getElementById(`ctrl-input-${idx}`);
              if (mainSelect) mainSelect.value = val;

              this.updateParam(varName, val, color, false);
            });
          } else if (ctrl.type === 'toggle') {
            const isChecked = !!currentVal;
            item.innerHTML = `
              <div class="code-ctrl-top">
                <span class="code-ctrl-tag" style="color: ${color};">var: ${varName}</span>
              </div>
              <button class="code-ctrl-toggle ${isChecked ? 'active' : ''}" id="code-toggle-${idx}" style="--accent: ${color};">
                ${isChecked ? 'TRUE' : 'FALSE'}
              </button>
            `;
            const toggleBtn = item.querySelector('button');
            toggleBtn.addEventListener('click', () => {
              const nextVal = !(this.currentParams[varName] !== undefined ? this.currentParams[varName] : ctrl.value);
              toggleBtn.classList.toggle('active', nextVal);
              toggleBtn.innerText = nextVal ? 'TRUE' : 'FALSE';
              if (ctrl.onChange) ctrl.onChange(nextVal);

              // Sync to Controls tab checkbox
              const mainCheckbox = document.getElementById(`ctrl-input-${idx}`);
              const mainStatus = document.getElementById(`ctrl-status-${idx}`);
              if (mainCheckbox) mainCheckbox.checked = nextVal;
              if (mainStatus) {
                mainStatus.innerText = nextVal ? 'ENABLED' : 'DISABLED';
                mainStatus.style.color = nextVal ? color : 'var(--text-muted)';
              }

              this.updateParam(varName, nextVal, color, false);
            });
          } else if (ctrl.type === 'color') {
            item.innerHTML = `
              <div class="code-ctrl-top">
                <span class="code-ctrl-tag" style="color: ${color};">var: ${varName}</span>
                <span class="code-ctrl-val" id="code-ctrl-hex-${idx}" style="color: ${color};">${currentVal}</span>
              </div>
              <label class="code-ctrl-swatch" id="code-swatch-${idx}" style="background-color: ${currentVal}; border-color: ${color};">
                <input type="color" value="${currentVal}" class="code-ctrl-color-input" id="code-color-${idx}" />
              </label>
            `;
            const colorInput = item.querySelector('input');
            const swatch = item.querySelector('.code-ctrl-swatch');
            const hexDisplay = item.querySelector(`#code-ctrl-hex-${idx}`);

            colorInput.addEventListener('input', (e) => {
              const val = e.target.value;
              swatch.style.backgroundColor = val;
              hexDisplay.innerText = val;
              if (ctrl.onChange) ctrl.onChange(val);

              // Sync to Controls tab swatch & hex
              const mainSwatch = document.getElementById(`ctrl-swatch-${idx}`);
              const mainHex = document.getElementById(`ctrl-hex-${idx}`);
              const mainInput = document.getElementById(`ctrl-input-${idx}`);
              if (mainSwatch) mainSwatch.style.backgroundColor = val;
              if (mainHex) mainHex.innerText = val;
              if (mainInput) mainInput.value = val;

              this.updateParam(varName, val, color, false);
            });
          } else if (ctrl.type === 'button') {
            item.innerHTML = `
              <button class="code-ctrl-action-btn" id="code-btn-${idx}" style="--accent: ${color};">
                <span>▶ ${ctrl.label}</span>
              </button>
            `;
            const btn = item.querySelector('button');
            btn.addEventListener('click', () => {
              if (ctrl.onClick) ctrl.onClick();
            });
          }

          grid.appendChild(item);
        });
      } else {
        liveVarsBar.style.display = 'none';
      }
    }

    // 2. Resolve Code Snippet
    const rawSnippet = (this.currentInstance && this.currentInstance.codeSnippet) || example.codeSnippet;
    this.rawSnippetTemplate = rawSnippet || this.getFallbackSnippet(example);

    this.renderActiveCodeSnippet();
  }

  renderActiveCodeSnippet(activeVar = null) {
    const codeContent = document.getElementById('motion-code-content');
    if (!codeContent || !this.rawSnippetTemplate) return;

    // Dynamically interpolate live parameter values into the snippet
    const dynamicCode = this.generateDynamicSnippetText(
      this.rawSnippetTemplate,
      this.currentParams,
      this.currentExample ? this.currentExample.id : ''
    );

    codeContent.textContent = dynamicCode;
    if (typeof Prism !== 'undefined') {
      Prism.highlightElement(codeContent);
    }

    // Convert delimiters into rich glowing interactive tokens with pulse animation
    let html = codeContent.innerHTML;
    html = html.replace(
      /<span class="token comment">\/\*\[VAR:([a-zA-Z0-9_]+)\]\*\/<\/span>([\s\S]*?)<span class="token comment">\/\*\[\/VAR:\1\]\*\/<\/span>/g,
      (match, vName, innerCode) => {
        const meta = this.controlMetadata.find((m) => m.varName === vName);
        const color = meta ? meta.color : '#c084fc';
        const isChanging = activeVar === vName;
        return `<mark class="code-param-token ${isChanging ? 'code-token-flash' : ''}" data-var="${vName}" style="--param-color: ${color};" title="Click to view/adjust ${vName}"><span class="code-param-tag">${vName}</span><span class="code-param-val">${innerCode}</span></mark>`;
      }
    );
    codeContent.innerHTML = html;

    // Add click listeners on code tokens to focus/reveal control in controls pane
    codeContent.querySelectorAll('.code-param-token').forEach((token) => {
      token.addEventListener('click', () => {
        const targetVar = token.dataset.var;
        const targetCtrl = document.querySelector(`.cyber-control-card[data-var="${targetVar}"]`);
        if (targetCtrl) {
          // Switch to Controls tab
          const controlsTabBtn = document.querySelector('.inspector-tab-btn[data-tab="controls"]');
          if (controlsTabBtn) controlsTabBtn.click();
          targetCtrl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCtrl.classList.remove('val-pulsing');
          void targetCtrl.offsetWidth;
          targetCtrl.classList.add('val-pulsing');
        }
      });
    });

    // Scroll changing element into view inside code view if applicable
    if (activeVar) {
      const activeEl = codeContent.querySelector(`.code-param-token.code-token-flash[data-var="${activeVar}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  updateParam(varName, value, color, syncToCodeControls = true) {
    this.currentParams[varName] = value;

    // If change originated from Controls tab, sync to Code tab mini-controls
    if (syncToCodeControls && this.controlMetadata) {
      const meta = this.controlMetadata.find((m) => m.varName === varName);
      if (meta) {
        const idx = meta.idx;
        const codeSlider = document.getElementById(`code-slider-${idx}`);
        const codeVal = document.getElementById(`code-ctrl-val-${idx}`);
        if (codeSlider) codeSlider.value = value;
        if (codeVal) codeVal.innerText = value;

        const codeSelect = document.getElementById(`code-select-${idx}`);
        if (codeSelect) codeSelect.value = value;

        const codeToggle = document.getElementById(`code-toggle-${idx}`);
        if (codeToggle) {
          codeToggle.classList.toggle('active', !!value);
          codeToggle.innerText = value ? 'TRUE' : 'FALSE';
        }

        const codeSwatch = document.getElementById(`code-swatch-${idx}`);
        const codeHex = document.getElementById(`code-ctrl-hex-${idx}`);
        const codeColor = document.getElementById(`code-color-${idx}`);
        if (codeSwatch) codeSwatch.style.backgroundColor = value;
        if (codeHex) codeHex.innerText = value;
        if (codeColor) codeColor.value = value;
      }
    }

    // Re-render Dynamic Code with updated variable values and trigger glowing pulse on updated token
    this.renderActiveCodeSnippet(varName);
  }

  generateDynamicSnippetText(baseCode, params, exampleId) {
    let code = baseCode;

    if (exampleId === 'three-geometries') {
      if (params.shape) {
        code = code.replace(/new THREE\.\w+Geometry/, `/*[VAR:shape]*/new THREE.${params.shape}Geometry/*[/VAR:shape]*/`);
      }
      if (params.waveAmp !== undefined) {
        code = code.replace(/(offset\s*=\s*Math\.sin\([^)]+\)\s*\*\s*)[\d\.]+;/, `$1/*[VAR:waveAmp]*/${params.waveAmp}/*[/VAR:waveAmp]*/;`);
      }
      if (params.waveFreq !== undefined) {
        code = code.replace(/(dist\s*\*\s*)[\d\.]+/, `$1/*[VAR:waveFreq]*/${params.waveFreq}/*[/VAR:waveFreq]*/`);
      }
      if (params.color !== undefined) {
        code = code.replace(/color:\s*(0x[0-9a-fA-F]+|'[^']+'|"[^"]+")/, `color: /*[VAR:color]*/'${params.color}'/*[/VAR:color]*/`);
      }
      if (params.roughness !== undefined) {
        code = code.replace(/roughness:\s*[\d\.]+/, `roughness: /*[VAR:roughness]*/${params.roughness}/*[/VAR:roughness]*/`);
      }
      if (params.metalness !== undefined) {
        code = code.replace(/metalness:\s*[\d\.]+/, `metalness: /*[VAR:metalness]*/${params.metalness}/*[/VAR:metalness]*/`);
      }
      if (params.wireframe !== undefined) {
        if (code.includes('wireframe:')) {
          code = code.replace(/wireframe:\s*(true|false)/, `wireframe: /*[VAR:wireframe]*/${params.wireframe}/*[/VAR:wireframe]*/`);
        } else {
          code = code.replace(/clearcoat:\s*0\.5/, `clearcoat: 0.5,\n  wireframe: /*[VAR:wireframe]*/${params.wireframe}/*[/VAR:wireframe]*/`);
        }
      }
    } else if (exampleId === 'three-lighting-pbr') {
      if (params.spotIntensity !== undefined) {
        code = code.replace(/SpotLight\(0xffffff,\s*[\d\.]+\)/, `SpotLight(0xffffff, /*[VAR:spotIntensity]*/${params.spotIntensity}/*[/VAR:spotIntensity]*/)`);
      }
      if (params.pointIntensity !== undefined) {
        code = code.replace(/PointLight\((0x[0-9a-fA-F]+),\s*[\d\.]+/g, `PointLight($1, /*[VAR:pointIntensity]*/${params.pointIntensity}/*[/VAR:pointIntensity]*/`);
      }
      if (params.roughness !== undefined) {
        code = code.replace(/roughness:\s*[\d\.]+/, `roughness: /*[VAR:roughness]*/${params.roughness}/*[/VAR:roughness]*/`);
      }
      if (params.metalness !== undefined) {
        code = code.replace(/metalness:\s*[\d\.]+/, `metalness: /*[VAR:metalness]*/${params.metalness}/*[/VAR:metalness]*/`);
      }
      if (params.orbitSpeed !== undefined) {
        code = code.replace(/(getElapsedTime\(\)\s*\*\s*)[\d\.]+/, `$1/*[VAR:orbitSpeed]*/${params.orbitSpeed}/*[/VAR:orbitSpeed]*/`);
      }
    } else if (exampleId === 'three-particle-galaxy') {
      if (params.particleCount !== undefined) {
        code = code.replace(/const count = \d+;/, `const count = /*[VAR:particleCount]*/${params.particleCount}/*[/VAR:particleCount]*/;`);
      }
      if (params.branches !== undefined) {
        code = code.replace(/branches\s*=\s*\d+;/, `branches = /*[VAR:branches]*/${params.branches}/*[/VAR:branches]*/;`);
      }
      if (params.spin !== undefined) {
        code = code.replace(/spin\s*=\s*[\d\.]+;/, `spin = /*[VAR:spin]*/${params.spin}/*[/VAR:spin]*/;`);
      }
      if (params.particleSize !== undefined) {
        code = code.replace(/size:\s*[\d\.]+/, `size: /*[VAR:particleSize]*/${params.particleSize}/*[/VAR:particleSize]*/`);
      }
      if (params.coreColor !== undefined) {
        code = code.replace(/colorInside\s*=\s*new THREE\.Color\(['"][^'"]+['"]\)/, `colorInside = new THREE.Color(/*[VAR:coreColor]*/'${params.coreColor}'/*[/VAR:coreColor]*/)`);
      }
      if (params.tipColor !== undefined) {
        code = code.replace(/colorOutside\s*=\s*new THREE\.Color\(['"][^'"]+['"]\)/, `colorOutside = new THREE.Color(/*[VAR:tipColor]*/'${params.tipColor}'/*[/VAR:tipColor]*/)`);
      }
    } else if (exampleId === 'anime-kinetic-svg') {
      if (params.staggerFrom !== undefined) {
        code = code.replace(/from:\s*['"][^'"]+['"]/, `from: /*[VAR:staggerFrom]*/'${params.staggerFrom}'/*[/VAR:staggerFrom]*/`);
      }
    } else if (exampleId === 'anime-stagger-grid') {
      if (params.motionType !== undefined) {
        code = code.replace(/axis:\s*['"][^'"]+['"]/, `axis: /*[VAR:motionType]*/'${params.motionType === 'rain' ? 'y' : 'all'}'/*[/VAR:motionType]*/`);
      }
    } else if (exampleId === 'combo-exploding-mesh') {
      if (params.explodeDist !== undefined) {
        code = code.replace(/(\*\s*)2\.5/g, `$1/*[VAR:explodeDist]*/${params.explodeDist}/*[/VAR:explodeDist]*/`);
      }
    } else if (exampleId === 'combo-hologram-pulse') {
      if (params.glowIntensity !== undefined) {
        code = code.replace(/uGlowIntensity:\s*\{\s*value:\s*[\d\.]+\s*\}/, `uGlowIntensity: { value: /*[VAR:glowIntensity]*/${params.glowIntensity}/*[/VAR:glowIntensity]*/ }`);
      }
      if (params.scanlines !== undefined) {
        code = code.replace(/uScanlines:\s*\{\s*value:\s*[\d\.]+\s*\}/, `uScanlines: { value: /*[VAR:scanlines]*/${params.scanlines}/*[/VAR:scanlines]*/ }`);
      }
      if (params.fresnelPower !== undefined) {
        code = code.replace(/uFresnelPower:\s*\{\s*value:\s*[\d\.]+\s*\}/, `uFresnelPower: { value: /*[VAR:fresnelPower]*/${params.fresnelPower}/*[/VAR:fresnelPower]*/ }`);
      }
    } else if (exampleId === 'combo-3d-cards') {
      if (params.tiltSens !== undefined) {
        code = code.replace(/0\.3/g, `/*[VAR:tiltSens]*/${params.tiltSens}/*[/VAR:tiltSens]*/`);
      }
    } else if (exampleId === 'combo-kinetic-audio') {
      if (params.barHeight !== undefined) {
        code = code.replace(/4\.5/g, `/*[VAR:barHeight]*/${params.barHeight}/*[/VAR:barHeight]*/`);
      }
    }

    const entries = Object.entries(params);
    if (entries.length > 0) {
      const syncHeader = [
        '// ========================================================',
        '// [LIVE DYNAMIC PARAMETERS SYNCHRONIZED IN REAL TIME]:',
        ...entries.map(([k, v]) => `//  - /*[VAR:${k}]*/${k}: ${typeof v === 'string' ? `'${v}'` : v}/*[/VAR:${k}]*/`),
        '// ========================================================\n'
      ].join('\n');
      return syncHeader + code;
    }

    return code;
  }

  getFallbackSnippet(example) {
    return `// ${example.title}
// Category: ${example.category}
console.log('Interactive Motion Lab module initialized:', '${example.id}');`;
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('motion-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderSidebar();
      });
    }

    // Category pills
    const pills = document.querySelectorAll('.motion-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.filterCategory = pill.dataset.category;
        this.renderSidebar();
      });
    });

    // Inspector Tab Switching
    const tabs = document.querySelectorAll('.inspector-tab-btn');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.inspector-pane').forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = document.getElementById(`pane-motion-${tab.dataset.tab}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Toggle Inspector Drawer
    const btnToggleInspector = document.getElementById('btn-toggle-motion-inspector');
    const drawer = document.getElementById('motion-inspector-drawer');
    if (btnToggleInspector && drawer) {
      btnToggleInspector.addEventListener('click', () => {
        drawer.classList.toggle('collapsed');
        btnToggleInspector.classList.toggle('active');
      });
    }

    // Mobile sidebar toggle
    const toggle = document.getElementById('motion-sidebar-toggle');
    const sidebar = document.getElementById('motion-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Copy Code Button
    const copyBtn = document.getElementById('btn-motion-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const codeContent = document.getElementById('motion-code-content');
        if (codeContent) {
          copyToClipboard(codeContent.textContent, copyBtn);
        }
      });
    }

    // Play / Pause HUD Button
    const playPauseBtn = document.getElementById('btn-motion-play-pause');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        this.isPlaying = !this.isPlaying;
        playPauseBtn.innerHTML = this.isPlaying
          ? `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
          : `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`;

        if (this.currentInstance) {
          if (this.isPlaying && typeof this.currentInstance.play === 'function') {
            this.currentInstance.play();
          } else if (!this.isPlaying && typeof this.currentInstance.pause === 'function') {
            this.currentInstance.pause();
          }
        }
      });
    }

    // Restart HUD Button
    const restartBtn = document.getElementById('btn-motion-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.isPlaying = true;
        if (playPauseBtn) {
          playPauseBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        }
        const scrubber = document.getElementById('motion-hud-scrubber');
        const hudTime = document.getElementById('motion-hud-time');
        if (scrubber) scrubber.value = 0;
        if (hudTime) hudTime.innerText = '00:00';

        if (this.currentInstance && typeof this.currentInstance.restart === 'function') {
          this.currentInstance.restart();
        }
      });
    }

    // Scrubber HUD
    const scrubber = document.getElementById('motion-hud-scrubber');
    if (scrubber) {
      scrubber.addEventListener('pointerdown', () => {
        this.isScrubbing = true;
      });
      scrubber.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (this.currentInstance && typeof this.currentInstance.seek === 'function') {
          this.currentInstance.seek(val);
        }
        const hudTime = document.getElementById('motion-hud-time');
        if (hudTime && this.currentInstance && typeof this.currentInstance.getProgress === 'function') {
          const { time } = this.currentInstance.getProgress();
          if (typeof time === 'number' && !isNaN(time)) {
            const mins = Math.floor(time / 60);
            const secs = Math.floor(time % 60);
            const pad = (n) => (n < 10 ? '0' + n : n);
            hudTime.innerText = `${pad(mins)}:${pad(secs)}`;
          }
        }
      });
      const endScrub = () => {
        this.isScrubbing = false;
      };
      scrubber.addEventListener('pointerup', endScrub);
      scrubber.addEventListener('change', endScrub);
    }
  }

  startPlaybackHUDMonitor() {
    const updateHUD = () => {
      if (this.currentInstance && !this.isScrubbing) {
        if (typeof this.currentInstance.getProgress === 'function') {
          const { progress, time } = this.currentInstance.getProgress();
          const scrubber = document.getElementById('motion-hud-scrubber');
          const timeEl = document.getElementById('motion-hud-time');
          if (scrubber && typeof progress === 'number' && !isNaN(progress)) {
            scrubber.value = Math.max(0, Math.min(100, progress)).toFixed(1);
          }
          if (timeEl && typeof time === 'number' && !isNaN(time)) {
            const mins = Math.floor(time / 60);
            const secs = Math.floor(time % 60);
            const pad = (n) => (n < 10 ? '0' + n : n);
            timeEl.innerText = `${pad(mins)}:${pad(secs)}`;
          }
        }
      }
      this.playbackAnimationId = requestAnimationFrame(updateHUD);
    };
    this.playbackAnimationId = requestAnimationFrame(updateHUD);
  }

  startFPSMonitor() {
    const updateFPS = () => {
      const now = performance.now();
      this.frameCount++;

      if (now >= this.lastFrameTime + 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        const fpsEl = document.getElementById('motion-fps-val');
        if (fpsEl) fpsEl.innerText = `${this.fps} FPS`;
        this.frameCount = 0;
        this.lastFrameTime = now;
      }

      this.fpsAnimationId = requestAnimationFrame(updateFPS);
    };
    this.fpsAnimationId = requestAnimationFrame(updateFPS);
  }

  destroy() {
    if (this.fpsAnimationId) {
      cancelAnimationFrame(this.fpsAnimationId);
    }
    if (this.playbackAnimationId) {
      cancelAnimationFrame(this.playbackAnimationId);
    }
    if (this.currentInstance && typeof this.currentInstance.destroy === 'function') {
      try {
        this.currentInstance.destroy();
      } catch (err) {
        console.warn('Error destroying motion instance:', err);
      }
    }
  }
}

