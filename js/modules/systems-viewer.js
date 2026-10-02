/**
 * C & Systems Programming Curriculum Viewer (cprog1)
 * Manages lesson navigation, markdown fetching/rendering, and source code inspection.
 */

import { SYSTEMS_CURRICULUM } from '../data/manifest.js';
import { fetchFile, renderMarkdown, highlightCode, copyToClipboard, escapeHtml } from '../utils/helpers.js';

export class SystemsViewer {
  constructor(container) {
    this.container = container;
    this.currentModule = null;
    this.activeTab = 'lesson'; // 'lesson', 'code', 'concepts'
    this.searchQuery = '';
    this.selectedCodeFileIndex = 0;

    // Flatten all modules for easy index lookup
    this.allModules = [];
    SYSTEMS_CURRICULUM.forEach((part) => {
      part.modules.forEach((mod) => {
        this.allModules.push({ ...mod, partNumber: part.part, partTitle: part.partTitle });
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
        <aside class="lab-sidebar" id="systems-sidebar">
          <div class="lab-sidebar-header">
            <div class="lab-sidebar-title">
              <span>Systems & C Lab</span>
            </div>
            <div class="lab-sidebar-sub">32 Modules</div>
          </div>

          <div class="lab-search-wrap">
            <input type="text" id="systems-search-input" class="lab-search-input" placeholder="Filter C topics, pointers, SIMD, VM..." />
          </div>

          <div class="lab-curriculum-tree" id="systems-curriculum-tree">
            <!-- Rendered by renderSidebar() -->
          </div>
        </aside>

        <!-- Main Content Area -->
        <div class="lab-content" id="systems-content-area">
          <div class="lab-content-header" id="systems-header">
            <div class="lab-title-row">
              <button class="mobile-sidebar-toggle" id="systems-sidebar-toggle" aria-label="Toggle Syllabus">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <span>Modules</span>
              </button>
              <div>
                <div class="lab-breadcrumbs" id="systems-breadcrumbs">Part 1 / Module 01</div>
                <h1 class="lab-main-title" id="systems-title">Compilation & Data Types</h1>
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
                <span>C/C++ Source Code</span>
              </button>
              <button class="lab-tab" data-tab="concepts">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span>Key Concepts & Memory</span>
              </button>
            </div>
          </div>

          <!-- Tab Content Views -->
          <div class="lab-tab-body">
            <!-- Tab 1: Lesson Guide (Markdown) -->
            <div class="lab-pane active" id="pane-systems-lesson">
              <div class="markdown-body" id="systems-markdown-view">
                <div class="loading-spinner">Loading lesson documentation...</div>
              </div>
            </div>

            <!-- Tab 2: Code Inspector -->
            <div class="lab-pane" id="pane-systems-code">
              <div class="code-viewer-container">
                <div class="code-viewer-header">
                  <div class="code-file-tabs" id="systems-code-file-tabs">
                    <!-- Dynamic File Tabs -->
                  </div>
                  <button class="btn-copy" id="btn-systems-copy-code">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    <span>Copy Code</span>
                  </button>
                </div>
                <pre class="code-block line-numbers"><code id="systems-code-content" class="language-c">// Loading code...</code></pre>
              </div>
            </div>

            <!-- Tab 3: Key Concepts & Mental Models -->
            <div class="lab-pane" id="pane-systems-concepts">
              <div class="concepts-view" id="systems-concepts-view">
                <!-- Injected dynamically -->
              </div>
            </div>
          </div>

          <!-- Bottom Navigation Pagination -->
          <div class="lab-pagination">
            <button class="pagination-btn" id="btn-systems-prev">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              <span>Previous Module</span>
            </button>
            <div class="pagination-indicator" id="systems-progress-label">Module 1 of 32</div>
            <button class="pagination-btn" id="btn-systems-next">
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
    const treeEl = document.getElementById('systems-curriculum-tree');
    if (!treeEl) return;

    treeEl.innerHTML = '';

    SYSTEMS_CURRICULUM.forEach((part) => {
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
          // Auto close mobile drawer
          const sidebar = document.getElementById('systems-sidebar');
          if (sidebar) sidebar.classList.remove('open');
        });

        list.appendChild(li);
      });

      partGroup.appendChild(list);
      treeEl.appendChild(partGroup);
    });
  }

  async loadModule(module) {
    this.currentModule = module;
    this.selectedCodeFileIndex = 0;
    window.location.hash = `systems/${module.id}`;

    // Update Header
    const breadcrumbs = document.getElementById('systems-breadcrumbs');
    const title = document.getElementById('systems-title');
    const progressLabel = document.getElementById('systems-progress-label');

    if (breadcrumbs) breadcrumbs.innerText = `Part ${module.partNumber || 1} • ${module.badge || 'C & Systems'}`;
    if (title) title.innerText = `${module.num}. ${module.title}`;

    const currentIndex = this.allModules.findIndex((m) => m.id === module.id);
    if (progressLabel) progressLabel.innerText = `Module ${currentIndex + 1} of ${this.allModules.length}`;

    // Update Pagination Buttons State
    const prevBtn = document.getElementById('btn-systems-prev');
    const nextBtn = document.getElementById('btn-systems-next');
    if (prevBtn) {
      prevBtn.disabled = currentIndex <= 0;
      if (currentIndex > 0) {
        prevBtn.title = `Go to ${this.allModules[currentIndex - 1].title}`;
      } else {
        prevBtn.removeAttribute('title');
      }
    }
    if (nextBtn) {
      nextBtn.disabled = currentIndex >= this.allModules.length - 1;
      if (currentIndex < this.allModules.length - 1) {
        nextBtn.title = `Go to ${this.allModules[currentIndex + 1].title}`;
      } else {
        nextBtn.removeAttribute('title');
      }
    }

    // Update active highlight in sidebar
    document.querySelectorAll('#systems-curriculum-tree .curriculum-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.id === module.id);
    });

    // 1. Fetch & Render Markdown Lesson
    const markdownView = document.getElementById('systems-markdown-view');
    if (markdownView) {
      markdownView.innerHTML = `<div class="loading-spinner">Loading ${module.title}...</div>`;
      const mdContent = await fetchFile(module.mdPath);
      if (mdContent) {
        markdownView.innerHTML = renderMarkdown(mdContent);
        highlightCode(markdownView);
      } else {
        markdownView.innerHTML = `
          <div class="error-notice">
            <h3>Lesson Guide Available</h3>
            <p>You are viewing <strong>${module.title}</strong>.</p>
            <p class="text-muted">${module.desc}</p>
          </div>
        `;
      }
    }

    // 2. Render Code Files Tabs & Fetch Active Code File
    this.renderCodeFileTabs(module);

    // 3. Render Concepts Tab
    this.renderConceptsPane(module);

    // Scroll content to top
    const contentArea = document.getElementById('systems-content-area');
    if (contentArea) contentArea.scrollTop = 0;
  }

  async renderCodeFileTabs(module) {
    const tabsContainer = document.getElementById('systems-code-file-tabs');
    const codeContent = document.getElementById('systems-code-content');
    if (!tabsContainer || !codeContent) return;

    tabsContainer.innerHTML = '';

    if (!module.codeFiles || module.codeFiles.length === 0) {
      codeContent.textContent = '// No code sample attached to this module.';
      return;
    }

    module.codeFiles.forEach((file, index) => {
      const btn = document.createElement('button');
      btn.className = `code-file-tab ${index === this.selectedCodeFileIndex ? 'active' : ''}`;
      btn.innerText = file.name;
      btn.addEventListener('click', () => {
        this.selectedCodeFileIndex = index;
        document.querySelectorAll('.code-file-tab').forEach((t, idx) => {
          t.classList.toggle('active', idx === index);
        });
        this.loadCodeFile(file);
      });
      tabsContainer.appendChild(btn);
    });

    this.loadCodeFile(module.codeFiles[this.selectedCodeFileIndex]);
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
      document.querySelectorAll('#systems-code-file-tabs .code-file-tab').forEach((t, i) => {
        t.classList.toggle('active', i === idx);
      });
      this.loadCodeFile(this.currentModule.codeFiles[idx]);
    }
  }

  highlightCodeViewer() {
    const codeContainer = document.querySelector('#systems-code-content')?.closest('.code-viewer-container') || document.getElementById('systems-code-content');
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
    const codeContent = document.getElementById('systems-code-content');
    if (!codeContent) return;

    codeContent.className = `language-${file.lang || 'c'}`;
    codeContent.textContent = 'Loading source code...';

    const source = await fetchFile(file.path);
    if (source) {
      codeContent.textContent = source;
      if (typeof Prism !== 'undefined') {
        Prism.highlightElement(codeContent);
      }
    } else {
      codeContent.textContent = `// Source file at "${file.path}" could not be loaded via static fetch.`;
    }
  }

  renderConceptsPane(module) {
    const pane = document.getElementById('systems-concepts-view');
    if (!pane) return;

    const tagsHtml = module.tags
      .map((t) => `<span class="concept-tag">${escapeHtml(t)}</span>`)
      .join(' ');

    pane.innerHTML = `
      <div class="concept-card">
        <h3 class="concept-title">Module Objective</h3>
        <p class="concept-desc">${module.desc}</p>
        <div class="concept-tags-wrap" style="margin-top: 1rem;">
          ${tagsHtml}
        </div>
      </div>

      <div class="concept-card memory-model-card">
        <h3 class="concept-title">Memory Layout Model</h3>
        <div class="memory-layout-diagram">
          <div class="mem-tier mem-kernel">Kernel Space (0xFFFFFFFF... OS Reserved)</div>
          <div class="mem-tier mem-stack">Stack (Grows Downward &bull; Fast LIFO &bull; Local Variables &bull; Frame Pointers)</div>
          <div class="mem-arrow">&darr; &uarr;</div>
          <div class="mem-tier mem-heap">Heap (Grows Upward &bull; Dynamic Allocation &bull; Arenas &bull; Free Lists)</div>
          <div class="mem-tier mem-bss">.bss / .data (Global / Static Variables)</div>
          <div class="mem-tier mem-text">.text / .rodata (Executable Machine Instructions & String Literals)</div>
        </div>
      </div>

      <div class="concept-card">
        <h3 class="concept-title">Key Takeaways</h3>
        <ul class="concept-checklist">
          <li>Low-level hardware word alignment avoids unaligned memory penalty cycles.</li>
          <li>Pointer arithmetic scales directly by <code>sizeof(*ptr)</code> in bytes.</li>
          <li>Zero-cost abstractions in modern C++ compile directly down to bare metal machine assembly.</li>
        </ul>
      </div>
    `;
  }

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('systems-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderSidebar();
      });
    }

    // Mobile sidebar toggle
    const toggle = document.getElementById('systems-sidebar-toggle');
    const sidebar = document.getElementById('systems-sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    // Tab switching
    const tabs = document.querySelectorAll('.lab-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.lab-pane').forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        const targetPane = document.getElementById(`pane-systems-${tab.dataset.tab}`);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Copy Code Button
    const copyBtn = document.getElementById('btn-systems-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const codeContent = document.getElementById('systems-code-content');
        if (codeContent) {
          copyToClipboard(codeContent.textContent, copyBtn);
        }
      });
    }

    // Pagination (Prev / Next)
    const prevBtn = document.getElementById('btn-systems-prev');
    const nextBtn = document.getElementById('btn-systems-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (!this.currentModule) return;
        const idx = this.allModules.findIndex((m) => m.id === this.currentModule.id);
        if (idx > 0) {
          this.loadModule(this.allModules[idx - 1]);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (!this.currentModule) return;
        const idx = this.allModules.findIndex((m) => m.id === this.currentModule.id);
        if (idx < this.allModules.length - 1) {
          this.loadModule(this.allModules[idx + 1]);
        }
      });
    }
  }
}

