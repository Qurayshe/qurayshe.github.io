/**
 * Machine Learning & AI Fundamentals Lab Viewer (ailab)
 * Built with the exact same robust layout and styling as the C Systems Lab (cprog1).
 * Features:
 *  - 16 module curriculum with concise titles and badges
 *  - High-performance LaTeX math rendering via KaTeX
 *  - Python source code inspection with Prism.js
 *  - Previous/Next pagination and full-text filter search
 */

import { AI_CURRICULUM } from '../data/manifest.js';
import { AI_SIMPLIFIED_MATH } from '../data/ai-math-explainers.js';
import { fetchFile, renderMarkdown, renderMath, highlightCode, copyToClipboard, escapeHtml } from '../utils/helpers.js';

export class AIViewer {
  constructor(container) {
    this.container = container;
    this.currentModule = null;
    this.activeTab = 'lesson'; // 'lesson', 'code', 'concepts'
    this.searchQuery = '';
    this.selectedCodeFileIndex = 0;

    // Flatten all modules for sequential pagination and quick lookup
    this.allModules = [];
    AI_CURRICULUM.forEach((part) => {
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
      <div class="lab-layout">
        <!-- Sidebar Navigation -->
        <aside class="lab-sidebar" id="ai-sidebar">
          <div class="lab-sidebar-header">
            <div class="lab-sidebar-title">
              <span>AI &amp; ML Lab</span>
            </div>
            <div class="lab-sidebar-sub">16 Modules &middot; Math to SOTA</div>
          </div>

          <div class="lab-search-wrap">
            <input type="text" id="ai-search-input" class="lab-search-input" placeholder="Filter math, perceptron, attention, SOTA..." />
          </div>

          <div class="lab-curriculum-tree" id="ai-curriculum-tree">
            <!-- Rendered by renderSidebar() -->
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="lab-content" id="ai-content-area">
          <div class="lab-content-header" id="ai-header">
            <div class="lab-title-row">
              <button class="mobile-sidebar-toggle" id="ai-sidebar-toggle" aria-label="Toggle Syllabus">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span>Modules</span>
              </button>
              <div>
                <div class="lab-breadcrumbs" id="ai-breadcrumbs">Part 1 &bull; Math</div>
                <h1 class="lab-main-title" id="ai-title">01. Linear Algebra &amp; Tensors</h1>
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
                <span>Python Implementation</span>
              </button>
              <button class="lab-tab" data-tab="concepts">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span>Key Concepts &amp; Math</span>
              </button>
            </div>
          </div>

          <!-- Tab Content Views -->
          <div class="lab-tab-body">
            <!-- Tab 1: Lesson Guide (Markdown with KaTeX) -->
            <div class="lab-pane active" id="pane-ai-lesson">
              <div class="markdown-body" id="ai-markdown-view">
                <div class="loading-spinner">Loading lesson documentation...</div>
              </div>
            </div>

            <!-- Tab 2: Code Inspector -->
            <div class="lab-pane" id="pane-ai-code">
              <div class="code-viewer-container">
                <div class="code-viewer-header">
                  <div class="code-file-tabs" id="ai-code-file-tabs"></div>
                  <button class="btn-copy" id="btn-ai-copy-code" title="Copy code to clipboard">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span>Copy Code</span>
                  </button>
                </div>
                <pre class="code-block line-numbers"><code id="ai-code-content" class="language-python"># Loading source code...</code></pre>
              </div>
            </div>

            <!-- Tab 3: Key Concepts & Math Formulations -->
            <div class="lab-pane" id="pane-ai-concepts">
              <div class="concepts-view" id="ai-concepts-view">
                <!-- Injected dynamically -->
              </div>
            </div>
          </div>

          <!-- Bottom Navigation Pagination -->
          <div class="lab-pagination">
            <button class="pagination-btn" id="btn-ai-prev">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              <span>Previous Module</span>
            </button>
            <div class="pagination-indicator" id="ai-progress-label">Module 1 of ${this.allModules.length}</div>
            <button class="pagination-btn" id="btn-ai-next">
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
    const treeEl = document.getElementById('ai-curriculum-tree');
    if (!treeEl) return;

    treeEl.innerHTML = '';

    AI_CURRICULUM.forEach((part) => {
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
          const sidebar = document.getElementById('ai-sidebar');
          if (sidebar) sidebar.classList.remove('open');
        });

        list.appendChild(li);
      });

      partGroup.appendChild(list);
      treeEl.appendChild(partGroup);
    });

    if (treeEl.children.length === 0) {
      treeEl.innerHTML = `<div style="padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem; text-align: center;">No topics matching "${escapeHtml(this.searchQuery)}"</div>`;
    }
  }

  async loadModule(module) {
    if (!module) return;
    this.currentModule = module;
    this.selectedCodeFileIndex = 0;
    window.location.hash = `ai/${module.id}`;

    // Update Header
    const breadcrumbs = document.getElementById('ai-breadcrumbs');
    const title = document.getElementById('ai-title');
    const progressLabel = document.getElementById('ai-progress-label');

    if (breadcrumbs) breadcrumbs.innerText = `Part ${module.partNumber || 1} • ${module.badge || 'AI Lab'}`;
    if (title) title.innerText = `${module.num}. ${module.title}`;

    const currentIndex = this.allModules.findIndex((m) => m.id === module.id);
    if (progressLabel) progressLabel.innerText = `Module ${currentIndex + 1} of ${this.allModules.length}`;

    // Update Pagination Buttons State
    const prevBtn = document.getElementById('btn-ai-prev');
    const nextBtn = document.getElementById('btn-ai-next');
    if (prevBtn) {
      prevBtn.disabled = currentIndex <= 0;
      if (currentIndex > 0) {
        prevBtn.onclick = () => this.loadModule(this.allModules[currentIndex - 1]);
      }
    }
    if (nextBtn) {
      nextBtn.disabled = currentIndex >= this.allModules.length - 1;
      if (currentIndex < this.allModules.length - 1) {
        nextBtn.onclick = () => this.loadModule(this.allModules[currentIndex + 1]);
      }
    }

    // Highlight Active Item in Sidebar
    document.querySelectorAll('#ai-curriculum-tree .curriculum-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.id === module.id);
    });

    // Close mobile sidebar if open
    const sidebar = document.getElementById('ai-sidebar');
    if (sidebar) sidebar.classList.remove('open');

    // 1. Load Markdown Lesson & Render KaTeX
    const mdView = document.getElementById('ai-markdown-view');
    if (mdView) {
      mdView.innerHTML = '<div class="loading-spinner">Loading lesson documentation...</div>';
      const rawMd = await fetchFile(module.mdPath);
      if (rawMd) {
        mdView.innerHTML = renderMarkdown(rawMd);
        renderMath(mdView);
        highlightCode(mdView);
      } else {
        mdView.innerHTML = `<div class="error-msg">Failed to load documentation at <code>${escapeHtml(module.mdPath)}</code>.</div>`;
      }
    }

    // 2. Render Code Files Tabs
    this.renderCodeFiles(module);

    // 3. Render Key Concepts
    this.renderConceptsPane(module);

    // Scroll main viewport smoothly to top
    const contentArea = document.getElementById('ai-content-area');
    if (contentArea) contentArea.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async renderCodeFiles(module) {
    const tabsContainer = document.getElementById('ai-code-file-tabs');
    const codeContent = document.getElementById('ai-code-content');
    if (!tabsContainer || !codeContent) return;

    const files = module.codeFiles || [];
    if (files.length === 0) {
      tabsContainer.innerHTML = '';
      codeContent.textContent = '# No code files associated with this module.';
      return;
    }

    tabsContainer.innerHTML = files.map((f, idx) => `
      <button class="code-tab ${idx === this.selectedCodeFileIndex ? 'active' : ''}" data-index="${idx}">
        <span>${escapeHtml(f.name)}</span>
      </button>
    `).join('');

    tabsContainer.querySelectorAll('.code-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.selectedCodeFileIndex = parseInt(tab.dataset.index, 10);
        this.loadCodeFile(files[this.selectedCodeFileIndex]);
        tabsContainer.querySelectorAll('.code-tab').forEach((t, i) => {
          t.classList.toggle('active', i === this.selectedCodeFileIndex);
        });
      });
    });

    this.loadCodeFile(files[this.selectedCodeFileIndex]);
  }

  async loadCodeFile(file) {
    const codeContent = document.getElementById('ai-code-content');
    if (!codeContent) return;

    codeContent.className = `language-${file.lang || 'python'}`;
    codeContent.textContent = '# Loading source code...';

    const source = await fetchFile(file.path);
    if (source) {
      codeContent.textContent = source;
      if (typeof Prism !== 'undefined') {
        Prism.highlightElement(codeContent);
      }
    } else {
      codeContent.textContent = `# Source file at "${file.path}" could not be loaded.`;
    }
  }

  renderConceptsPane(module) {
    const pane = document.getElementById('ai-concepts-view');
    if (!pane) return;

    const math = AI_SIMPLIFIED_MATH[module.id];
    const tagsHtml = (module.tags || [])
      .map((t) => `<span class="concept-tag">${escapeHtml(t)}</span>`)
      .join(' ');

    let mathCardHtml = '';
    if (math) {
      mathCardHtml = `
        <div class="concept-card math-explainer-card">
          <div class="math-explainer-header">
            <h3 class="concept-title">${escapeHtml(math.title)}</h3>
          </div>

          <div class="math-formula-box">
            <div class="math-formula-label">Core Mathematical Expression</div>
            <div class="math-formula-render">${math.coreFormula}</div>
          </div>

          <div class="math-explanation-section">
            <div class="math-section-title">
              <span>simplified</span>
            </div>
            <p class="concept-desc">${escapeHtml(math.simpleExplanation)}</p>
          </div>

          <div class="math-explanation-section">
            <div class="math-section-title analogy">
              <span>analogy</span>
            </div>
            <p class="concept-desc">${escapeHtml(math.realWorldAnalogy)}</p>
          </div>

          <div class="math-explanation-section">
            <div class="math-section-title sota">
              <span>relevance</span>
            </div>
            <p class="concept-desc">${escapeHtml(math.svdInsight)}</p>
          </div>
        </div>
      `;
    }

    pane.innerHTML = `
      ${mathCardHtml}

      <div class="concept-card">
        <h3 class="concept-title">Module Objective</h3>
        <p class="concept-desc">${escapeHtml(module.desc)}</p>
        <div class="concept-tags-wrap" style="margin-top: 1rem;">
          ${tagsHtml}
        </div>
      </div>

      <div class="concept-card">
        <h3 class="concept-title">Implementation Highlights</h3>
        <ul class="concept-checklist">
          <li><strong>First Principles:</strong> Implemented from scratch without opaque framework abstractions to expose raw matrix mechanics.</li>
          <li><strong>Vectorized Operations:</strong> Matrix operations leverage BLAS/SIMD tensor layouts for optimal memory and cache utilization.</li>
          <li><strong>SOTA Continuity:</strong> Directly bridges into modern frontier architectures (Transformers, Diffusion, LoRA, and Test-Time Compute).</li>
        </ul>
      </div>
    `;

    renderMath(pane);
  }

  bindEvents() {
    // 1. Search Filter Input
    const searchInput = document.getElementById('ai-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderSidebar();
      });
    }

    // 2. Mobile Sidebar Toggle
    const toggle = document.getElementById('ai-sidebar-toggle');
    const sidebar = document.getElementById('ai-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // 3. Tab Switching
    const tabButtons = this.container.querySelectorAll('.lab-tab');
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // 4. Copy Code Button
    const copyBtn = document.getElementById('btn-ai-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const codeContent = document.getElementById('ai-code-content');
        if (codeContent) {
          copyToClipboard(codeContent.textContent, copyBtn);
        }
      });
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update Tab Buttons
    this.container.querySelectorAll('.lab-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update Panes
    const lessonPane = document.getElementById('pane-ai-lesson');
    const codePane = document.getElementById('pane-ai-code');
    const conceptsPane = document.getElementById('pane-ai-concepts');

    if (lessonPane) lessonPane.classList.toggle('active', tabName === 'lesson');
    if (codePane) codePane.classList.toggle('active', tabName === 'code');
    if (conceptsPane) conceptsPane.classList.toggle('active', tabName === 'concepts');
  }
}
