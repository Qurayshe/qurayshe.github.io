import ex01 from './examples/01-three-geometries.js';
import ex02 from './examples/02-three-lighting-pbr.js';
import ex03 from './examples/03-three-particle-galaxy.js';
import ex04 from './examples/04-anime-kinetic-svg.js';
import ex05 from './examples/05-anime-timelines.js';
import ex06 from './examples/06-anime-stagger-grid.js';
import ex07 from './examples/07-combo-camera-director.js';
import ex08 from './examples/08-combo-exploding-mesh.js';
import ex09 from './examples/09-combo-hologram-pulse.js';
import ex10 from './examples/10-combo-3d-cards.js';
import ex11 from './examples/11-combo-kinetic-audio.js';

const EXAMPLES = [ex01, ex02, ex03, ex04, ex05, ex06, ex07, ex08, ex09, ex10, ex11];

class App {
  constructor() {
    this.currentExample = null;
    this.currentInstance = null;
    this.filterCategory = 'all';
    this.searchQuery = '';
    this.fps = 60;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;

    this.initDOM();
    this.renderSidebar();
    this.bindEvents();
    this.startFPSMonitor();

    // Check URL hash for direct routing or default to first
    const initialHash = window.location.hash.replace('#', '');
    const found = EXAMPLES.find((e) => e.id === initialHash);
    this.loadExample(found || EXAMPLES[0]);
  }

  initDOM() {
    this.sidebar = document.getElementById('sidebar');
    this.navList = document.getElementById('example-nav');
    this.canvasContainer = document.getElementById('canvas-container');
    this.stageTitle = document.getElementById('stage-title');
    this.stageTags = document.getElementById('stage-tags');
    this.fpsValueEl = document.getElementById('fps-value');
    this.statsDetailsEl = document.getElementById('stats-details');

    // Inspector Drawer
    this.inspectorDrawer = document.getElementById('inspector-drawer');
    this.tabButtons = document.querySelectorAll('.inspector-tab');
    this.tabPanes = document.querySelectorAll('.tab-pane');
    this.tutorialPane = document.getElementById('pane-tutorial');
    this.controlsPane = document.getElementById('pane-controls');
    this.codePane = document.getElementById('pane-code');
    this.codeContent = document.getElementById('code-content');
    this.btnCopyCode = document.getElementById('btn-copy-code');

    // Playback HUD
    this.btnPlayPause = document.getElementById('btn-play-pause');
    this.btnRestart = document.getElementById('btn-restart');
    this.hudScrubber = document.getElementById('hud-scrubber');
    this.hudTime = document.getElementById('hud-time');
    this.btnToggleInspector = document.getElementById('btn-toggle-inspector');
    this.menuToggle = document.getElementById('menu-toggle');
  }

  renderSidebar() {
    this.navList.innerHTML = '';

    const categories = [
      { name: 'Three.js Fundamentals', filter: 'three' },
      { name: 'Anime.js Motion Mastery', filter: 'anime' },
      { name: 'Three.js + Anime.js Synergy', filter: 'combo' }
    ];

    categories.forEach((cat) => {
      const filtered = EXAMPLES.filter((ex) => {
        const matchesCategory = ex.category === cat.name;
        const matchesSearch =
          ex.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          ex.description.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesTag = this.filterCategory === 'all' || ex.badge.toLowerCase().includes(this.filterCategory);

        return matchesCategory && matchesSearch && matchesTag;
      });

      if (filtered.length === 0) return;

      const groupWrap = document.createElement('div');
      groupWrap.className = 'nav-category-group';

      const title = document.createElement('div');
      title.className = 'nav-category-title';
      title.innerText = cat.name;
      groupWrap.appendChild(title);

      const ul = document.createElement('ul');
      ul.className = 'nav-list';

      filtered.forEach((ex) => {
        const globalIndex = EXAMPLES.indexOf(ex) + 1;
        const padIndex = globalIndex < 10 ? `0${globalIndex}` : `${globalIndex}`;

        const li = document.createElement('li');
        li.className = `nav-item ${this.currentExample && this.currentExample.id === ex.id ? 'active' : ''}`;
        li.dataset.id = ex.id;

        li.innerHTML = `
          <span class="nav-item-num">${padIndex}</span>
          <div class="nav-item-info">
            <div class="nav-item-title">${ex.title}</div>
            <div class="nav-item-desc">${ex.description}</div>
          </div>
          <span class="nav-item-badge ${ex.badgeClass}">${ex.badge}</span>
        `;

        li.addEventListener('click', () => {
          this.loadExample(ex);
          // Auto close mobile drawer if open
          if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('open');
          }
        });

        ul.appendChild(li);
      });

      groupWrap.appendChild(ul);
      this.navList.appendChild(groupWrap);
    });
  }

  loadExample(example) {
    if (this.currentInstance && typeof this.currentInstance.destroy === 'function') {
      try {
        this.currentInstance.destroy();
      } catch (err) {
        console.warn('Error during previous scene cleanup:', err);
      }
    }

    this.currentExample = example;
    window.location.hash = example.id;

    // Update Header
    this.stageTitle.innerText = example.title;
    this.stageTags.innerHTML = `
      <span class="nav-item-badge ${example.badgeClass}">${example.badge}</span>
      <span class="nav-item-badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">${example.difficulty}</span>
    `;

    // Highlight active nav item
    document.querySelectorAll('.nav-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.id === example.id);
    });

    // Reset container
    this.canvasContainer.innerHTML = '';

    // Initialize Example
    this.currentInstance = example.init(this.canvasContainer, (stats) => {
      this.updateStatsDetails(stats);
    });

    // Populate Inspector
    this.renderTutorialPane(example.tutorial);
    this.renderControlsPane();
    this.renderCodePane(example);

    // Reset scrubber
    this.hudScrubber.value = 0;
    this.hudTime.innerText = '00:00';
  }

  updateStatsDetails(stats) {
    if (!this.statsDetailsEl || !stats) return;
    const entries = Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join(' | ');
    this.statsDetailsEl.innerText = entries;
  }

  renderTutorialPane(tutorial) {
    if (!tutorial) {
      this.tutorialPane.innerHTML = `<div class="tutorial-card"><div class="tutorial-text">No tutorial guide available for this example.</div></div>`;
      return;
    }

    let conceptsHtml = '';
    if (tutorial.keyConcepts && tutorial.keyConcepts.length > 0) {
      conceptsHtml = `
        <div class="tutorial-card">
          <div class="tutorial-card-title">⚙️ Key APIs & Methods</div>
          <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.5rem;">
            ${tutorial.keyConcepts
              .map(
                (c) => `
              <div>
                <strong style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.78rem;">${c.name}</strong>
                <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 2px;">${c.desc}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }

    this.tutorialPane.innerHTML = `
      <div class="tutorial-card">
        <div class="tutorial-card-title">💡 Concept Overview</div>
        <div class="tutorial-text">${tutorial.overview}</div>
      </div>
      ${conceptsHtml}
      ${
        tutorial.tips
          ? `
        <div class="tutorial-card" style="border-color: rgba(0, 245, 160, 0.3); background: rgba(0, 245, 160, 0.05);">
          <div class="tutorial-card-title" style="color: var(--accent-green);">✨ Pro Tip & Experiments</div>
          <div class="tutorial-text">${tutorial.tips}</div>
        </div>
      `
          : ''
      }
    `;
  }

  renderControlsPane() {
    this.controlsPane.innerHTML = '';

    if (!this.currentInstance || !this.currentInstance.getControls) {
      this.controlsPane.innerHTML = `<div class="tutorial-card"><div class="tutorial-text">No adjustable live controls for this example. Use mouse to orbit/drag!</div></div>`;
      return;
    }

    const controls = this.currentInstance.getControls();
    if (!controls || controls.length === 0) {
      this.controlsPane.innerHTML = `<div class="tutorial-card"><div class="tutorial-text">No adjustable live controls for this example.</div></div>`;
      return;
    }

    const group = document.createElement('div');
    group.className = 'control-group';

    const title = document.createElement('div');
    title.className = 'control-group-title';
    title.innerText = 'Interactive Parameters';
    group.appendChild(title);

    controls.forEach((ctrl) => {
      const item = document.createElement('div');
      item.className = 'control-item';

      if (ctrl.type === 'slider') {
        item.innerHTML = `
          <div class="control-header">
            <span class="control-label">${ctrl.label}</span>
            <span class="control-val" id="val-${ctrl.label.replace(/\s+/g, '')}">${ctrl.value}</span>
          </div>
          <input type="range" class="control-slider" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${ctrl.value}" />
        `;
        const slider = item.querySelector('input');
        const valDisplay = item.querySelector('.control-val');
        slider.addEventListener('input', (e) => {
          valDisplay.innerText = e.target.value;
          if (ctrl.onChange) ctrl.onChange(e.target.value);
        });
      } else if (ctrl.type === 'select') {
        item.innerHTML = `
          <div class="control-header">
            <span class="control-label">${ctrl.label}</span>
          </div>
          <select class="control-select">
            ${ctrl.options.map((opt) => `<option value="${opt}" ${opt === ctrl.value ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        `;
        const select = item.querySelector('select');
        select.addEventListener('change', (e) => {
          if (ctrl.onChange) ctrl.onChange(e.target.value);
        });
      } else if (ctrl.type === 'button') {
        item.innerHTML = `
          <button class="preset-btn" style="width: 100%; padding: 0.6rem; font-weight: 600;">${ctrl.label}</button>
        `;
        const btn = item.querySelector('button');
        btn.addEventListener('click', () => {
          if (ctrl.onClick) ctrl.onClick();
        });
      } else if (ctrl.type === 'color') {
        item.innerHTML = `
          <div class="control-header">
            <span class="control-label">${ctrl.label}</span>
          </div>
          <input type="color" value="${ctrl.value}" style="width: 100%; height: 36px; border: 1px solid var(--border-color); border-radius: 6px; background: transparent; cursor: pointer;" />
        `;
        const colorInput = item.querySelector('input');
        colorInput.addEventListener('input', (e) => {
          if (ctrl.onChange) ctrl.onChange(e.target.value);
        });
      } else if (ctrl.type === 'toggle') {
        item.innerHTML = `
          <label style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
            <span class="control-label">${ctrl.label}</span>
            <input type="checkbox" ${ctrl.value ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;" />
          </label>
        `;
        const toggle = item.querySelector('input');
        toggle.addEventListener('change', (e) => {
          if (ctrl.onChange) ctrl.onChange(e.target.checked);
        });
      }

      group.appendChild(item);
    });

    this.controlsPane.appendChild(group);
  }

  renderCodePane(example) {
    const code = (this.currentInstance && this.currentInstance.codeSnippet) || example.codeSnippet || '// Source code snippet unavailable';
    this.codeContent.textContent = code;
    if (window.Prism) {
      Prism.highlightElement(this.codeContent);
    }
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderSidebar();
    });

    // Category filter pills
    const filterTags = document.querySelectorAll('.filter-tag');
    filterTags.forEach((tag) => {
      tag.addEventListener('click', () => {
        filterTags.forEach((t) => t.classList.remove('active'));
        tag.classList.add('active');
        this.filterCategory = tag.dataset.category;
        this.renderSidebar();
      });
    });

    // Inspector Tab switching
    this.tabButtons.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.tabButtons.forEach((t) => t.classList.remove('active'));
        this.tabPanes.forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = document.getElementById(`pane-${tab.dataset.tab}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Toggle Inspector Drawer
    this.btnToggleInspector.addEventListener('click', () => {
      this.inspectorDrawer.classList.toggle('collapsed');
      this.btnToggleInspector.classList.toggle('active');
    });

    // Mobile Menu Toggle
    this.menuToggle.addEventListener('click', () => {
      this.sidebar.classList.toggle('open');
    });

    // Copy Code Button
    this.btnCopyCode.addEventListener('click', () => {
      if (this.currentExample && this.currentExample.codeSnippet) {
        navigator.clipboard.writeText(this.currentExample.codeSnippet).then(() => {
          this.btnCopyCode.innerText = 'Copied!';
          setTimeout(() => {
            this.btnCopyCode.innerText = 'Copy Code';
          }, 2000);
        });
      }
    });

    // HUD Play / Pause
    let isPlaying = true;
    this.btnPlayPause.addEventListener('click', () => {
      isPlaying = !isPlaying;
      this.btnPlayPause.innerHTML = isPlaying
        ? `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`;

      if (this.currentInstance) {
        if (isPlaying && this.currentInstance.play) this.currentInstance.play();
        if (!isPlaying && this.currentInstance.pause) this.currentInstance.pause();
      }
    });

    // HUD Restart
    this.btnRestart.addEventListener('click', () => {
      if (this.currentInstance && this.currentInstance.restart) {
        this.currentInstance.restart();
      }
    });

    // HUD Scrubber
    this.hudScrubber.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (this.currentInstance && this.currentInstance.seek) {
        this.currentInstance.seek(val);
      }
    });

    // Global Hash Change
    window.addEventListener('hashchange', () => {
      const id = window.location.hash.replace('#', '');
      if (this.currentExample && this.currentExample.id === id) return;
      const found = EXAMPLES.find((e) => e.id === id);
      if (found) this.loadExample(found);
    });
  }

  startFPSMonitor() {
    const updateFPS = () => {
      const now = performance.now();
      this.frameCount++;

      if (now >= this.lastFrameTime + 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        this.fpsValueEl.innerText = `${this.fps} FPS`;
        this.frameCount = 0;
        this.lastFrameTime = now;
      }

      requestAnimationFrame(updateFPS);
    };
    requestAnimationFrame(updateFPS);
  }
}

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

