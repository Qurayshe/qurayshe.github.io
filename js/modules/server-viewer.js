/**
 * Server Architecture Lab (Rust & Go Server Progression)
 * Manages 6-stage server comparison, side-by-side code inspection, and architectural analysis.
 */

import { SERVER_STAGES } from '../data/manifest.js';
import { fetchFile, renderMarkdown, highlightCode, copyToClipboard } from '../utils/helpers.js';

export class ServerViewer {
  constructor(container) {
    this.container = container;
    this.currentStage = null;
    this.activeLang = 'rust'; // 'rust', 'go', 'split'
    this.selectedRustFileIndex = 0;
    this.selectedGoFileIndex = 0;
  }

  init(initialStageId = null) {
    this.renderLayout();
    this.bindEvents();

    const target = SERVER_STAGES.find((s) => s.id === initialStageId) || SERVER_STAGES[0];
    this.loadStage(target);
  }

  renderLayout() {
    this.container.innerHTML = `
      <div class="lab-layout server-lab-layout">
        <!-- Sidebar Stages List -->
        <aside class="lab-sidebar" id="server-sidebar">
          <div class="lab-sidebar-header">
            <div class="lab-sidebar-title">
              <span>Server Architecture</span>
            </div>
            <div class="lab-sidebar-sub">Rust &times; Go (6 Stages)</div>
          </div>

          <!-- Step Progression Cards -->
          <div class="server-stages-list" id="server-stages-list">
            ${SERVER_STAGES.map(
              (st) => `
              <div class="server-stage-card" data-id="${st.id}">
                <div class="stage-step-num">STAGE ${st.step}</div>
                <div class="stage-card-title">${st.title}</div>
                <div class="stage-card-summary">${st.summary}</div>
                <div class="stage-badges">
                  <span class="lang-tag lang-rust">Rust</span>
                  <span class="lang-tag lang-go">Go</span>
                </div>
              </div>
            `
            ).join('')}
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="lab-content" id="server-content-area">
          <header class="lab-content-header">
            <div class="lab-title-row">
              <button class="mobile-sidebar-toggle" id="server-sidebar-toggle" aria-label="Toggle Stages">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span>Stages</span>
              </button>
              <div>
                <div class="lab-breadcrumbs" id="server-breadcrumbs">Stage 01 / 06</div>
                <h1 class="lab-main-title" id="server-title">The Basics: Raw TCP & HTTP</h1>
              </div>
            </div>

            <!-- Language Switcher & Split View Controls -->
            <div class="lang-toggle-group">
              <button class="lang-btn active" data-lang="rust">
                <span class="lang-dot rust-dot"></span>
                <span>Rust</span>
              </button>
              <button class="lang-btn" data-lang="go">
                <span class="lang-dot go-dot"></span>
                <span>Go</span>
              </button>
              <button class="lang-btn" data-lang="split">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
                <span>Side-by-Side</span>
              </button>
            </div>
          </header>

          <div class="server-body-content">
            <!-- Architectural Overview Card -->
            <div class="stage-overview-card" id="stage-overview-card">
              <!-- Injected dynamically -->
            </div>

            <!-- Single Language View Mode -->
            <div class="single-lang-view" id="single-lang-view">
              <div class="code-viewer-container">
                <div class="code-viewer-header">
                  <div class="code-file-tabs" id="server-code-file-tabs"></div>
                  <button class="btn-copy" id="btn-server-copy-code">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span>Copy Code</span>
                  </button>
                </div>
                <pre class="code-block line-numbers"><code id="server-code-content" class="language-rust">// Loading code...</code></pre>
              </div>

              <!-- Stage Lesson Markdown Readme -->
              <div class="stage-readme-wrap">
                <div class="readme-title">Notes &amp; Architecture</div>
                <div class="markdown-body" id="server-readme-content">Loading lesson documentation...</div>
              </div>
            </div>

            <!-- Split View Mode (Rust vs Go Side-by-Side) -->
            <div class="split-code-view" id="split-code-view" style="display: none;">
              <div class="split-col">
                <div class="split-header">
                  <span class="lang-tag lang-rust">Rust</span>
                  <div class="code-file-tabs" id="split-rust-tabs"></div>
                </div>
                <pre class="code-block line-numbers"><code id="split-rust-code" class="language-rust">// Rust Code</code></pre>
              </div>

              <div class="split-col">
                <div class="split-header">
                  <span class="lang-tag lang-go">Go</span>
                  <div class="code-file-tabs" id="split-go-tabs"></div>
                </div>
                <pre class="code-block line-numbers"><code id="split-go-code" class="language-go">// Go Code</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadStage(stage) {
    this.currentStage = stage;
    this.selectedRustFileIndex = 0;
    this.selectedGoFileIndex = 0;
    window.location.hash = `servers/${stage.id}`;

    // Update Header
    const breadcrumbs = document.getElementById('server-breadcrumbs');
    const title = document.getElementById('server-title');

    if (breadcrumbs) breadcrumbs.innerText = `Stage ${stage.step} of 06 • Architecture Progression`;
    if (title) title.innerText = `${stage.step}. ${stage.title}`;

    // Update active highlight in stages list
    document.querySelectorAll('.server-stage-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.id === stage.id);
    });

    // Render Stage Concept Summary
    const overviewCard = document.getElementById('stage-overview-card');
    if (overviewCard) {
      overviewCard.innerHTML = `
        <div class="overview-grid">
          <div class="overview-side rust-side">
            <div class="side-title"><span class="lang-tag lang-rust">Rust</span> ${stage.rust.title}</div>
            <p class="side-desc">${stage.rust.desc}</p>
            <div class="key-concepts-list">
              ${stage.rust.keyConcepts.map((k) => `<code>${k}</code>`).join(' ')}
            </div>
          </div>
          <div class="overview-divider"></div>
          <div class="overview-side go-side">
            <div class="side-title"><span class="lang-tag lang-go">Go</span> ${stage.go.title}</div>
            <p class="side-desc">${stage.go.desc}</p>
            <div class="key-concepts-list">
              ${stage.go.keyConcepts.map((k) => `<code>${k}</code>`).join(' ')}
            </div>
          </div>
        </div>
      `;
    }

    // Refresh view according to active language mode
    this.updateActiveView();

    // Scroll to top
    const contentArea = document.getElementById('server-content-area');
    if (contentArea) contentArea.scrollTop = 0;
  }

  async updateActiveView() {
    if (!this.currentStage) return;

    const singleView = document.getElementById('single-lang-view');
    const splitView = document.getElementById('split-code-view');

    if (this.activeLang === 'split') {
      if (singleView) singleView.style.display = 'none';
      if (splitView) splitView.style.display = 'grid';
      this.renderSplitView();
    } else {
      if (singleView) singleView.style.display = 'block';
      if (splitView) splitView.style.display = 'none';
      this.renderSingleView();
    }
  }

  async renderSingleView() {
    const langData = this.activeLang === 'rust' ? this.currentStage.rust : this.currentStage.go;
    const fileTabsContainer = document.getElementById('server-code-file-tabs');
    const codeContent = document.getElementById('server-code-content');
    const readmeContent = document.getElementById('server-readme-content');

    // 1. Render File Tabs
    if (fileTabsContainer) {
      fileTabsContainer.innerHTML = '';
      const selectedIndex = this.activeLang === 'rust' ? this.selectedRustFileIndex : this.selectedGoFileIndex;

      langData.files.forEach((file, index) => {
        const btn = document.createElement('button');
        btn.className = `code-file-tab ${index === selectedIndex ? 'active' : ''}`;
        btn.innerText = file.name;
        btn.addEventListener('click', () => {
          if (this.activeLang === 'rust') this.selectedRustFileIndex = index;
          else this.selectedGoFileIndex = index;
          this.renderSingleView();
        });
        fileTabsContainer.appendChild(btn);
      });

      // Load active file code
      const currentFile = langData.files[selectedIndex] || langData.files[0];
      if (currentFile && codeContent) {
        codeContent.className = `language-${currentFile.lang || 'rust'}`;
        codeContent.textContent = 'Loading source code...';
        const source = await fetchFile(currentFile.path);
        codeContent.textContent = source || '// Could not fetch file.';
        if (typeof Prism !== 'undefined') {
          Prism.highlightElement(codeContent);
        }
      }
    }

    // 2. Fetch & Render Readme Notes
    if (readmeContent) {
      readmeContent.innerHTML = '<div class="loading-spinner">Loading architectural guide...</div>';
      const md = await fetchFile(langData.mdPath);
      if (md) {
        readmeContent.innerHTML = renderMarkdown(md);
        highlightCode(readmeContent);
      } else {
        readmeContent.innerHTML = `<p class="text-muted">Documentation available for ${langData.title}.</p>`;
      }
    }
  }

  async renderSplitView() {
    const rustTabs = document.getElementById('split-rust-tabs');
    const goTabs = document.getElementById('split-go-tabs');
    const rustCode = document.getElementById('split-rust-code');
    const goCode = document.getElementById('split-go-code');

    // Rust side
    if (rustTabs) {
      rustTabs.innerHTML = '';
      this.currentStage.rust.files.forEach((file, idx) => {
        const btn = document.createElement('button');
        btn.className = `code-file-tab ${idx === this.selectedRustFileIndex ? 'active' : ''}`;
        btn.innerText = file.name;
        btn.addEventListener('click', () => {
          this.selectedRustFileIndex = idx;
          this.renderSplitView();
        });
        rustTabs.appendChild(btn);
      });
    }

    // Go side
    if (goTabs) {
      goTabs.innerHTML = '';
      this.currentStage.go.files.forEach((file, idx) => {
        const btn = document.createElement('button');
        btn.className = `code-file-tab ${idx === this.selectedGoFileIndex ? 'active' : ''}`;
        btn.innerText = file.name;
        btn.addEventListener('click', () => {
          this.selectedGoFileIndex = idx;
          this.renderSplitView();
        });
        goTabs.appendChild(btn);
      });
    }

    // Load Rust File
    const rustFile = this.currentStage.rust.files[this.selectedRustFileIndex] || this.currentStage.rust.files[0];
    if (rustFile && rustCode) {
      rustCode.className = `language-${rustFile.lang || 'rust'}`;
      const src = await fetchFile(rustFile.path);
      rustCode.textContent = src || '// Unable to load file';
      if (typeof Prism !== 'undefined') Prism.highlightElement(rustCode);
    }

    // Load Go File
    const goFile = this.currentStage.go.files[this.selectedGoFileIndex] || this.currentStage.go.files[0];
    if (goFile && goCode) {
      goCode.className = `language-${goFile.lang || 'go'}`;
      const src = await fetchFile(goFile.path);
      goCode.textContent = src || '// Unable to load file';
      if (typeof Prism !== 'undefined') Prism.highlightElement(goCode);
    }
  }

  bindEvents() {
    // Stage card click
    document.querySelectorAll('.server-stage-card').forEach((card) => {
      card.addEventListener('click', () => {
        const stage = SERVER_STAGES.find((s) => s.id === card.dataset.id);
        if (stage) {
          this.loadStage(stage);
          // Auto close mobile drawer
          const sidebar = document.getElementById('server-sidebar');
          if (sidebar) sidebar.classList.remove('open');
        }
      });
    });

    // Mobile sidebar toggle
    const toggle = document.getElementById('server-sidebar-toggle');
    const sidebar = document.getElementById('server-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Language switcher buttons
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        langBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeLang = btn.dataset.lang;
        this.updateActiveView();
      });
    });

    // Copy Code Button
    const copyBtn = document.getElementById('btn-server-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const codeContent = document.getElementById('server-code-content');
        if (codeContent) {
          copyToClipboard(codeContent.textContent, copyBtn);
        }
      });
    }
  }
}

