/**
 * Universal Command Palette & Search Modal (Ctrl+K / Cmd+K)
 * Real-time instant indexing and navigation across all 50+ modules, servers, and 3D demos.
 */

import { SYSTEMS_CURRICULUM, GRAPHICS_CURRICULUM, SERVER_STAGES, AI_CURRICULUM, MOTION_LAB_EXAMPLES } from '../data/manifest.js';
import { RESUME_DATA } from '../data/resume-data.js';
import { escapeHtml } from '../utils/helpers.js';

export class SearchModal {
  constructor(router) {
    this.router = router;
    this.isOpen = false;
    this.items = [];
    this.selectedIndex = 0;

    this.buildSearchIndex();
    this.renderModal();
    this.bindEvents();
  }

  buildSearchIndex() {
    this.items = [];

    // 1. Index Systems & C Modules
    SYSTEMS_CURRICULUM.forEach((part) => {
      part.modules.forEach((mod) => {
        this.items.push({
          type: 'systems',
          category: `Systems Lab • Part ${part.part}`,
          icon: '◆',
          badge: 'C / Systems',
          badgeClass: 'badge-three',
          id: mod.id,
          title: `${mod.num}. ${mod.title}`,
          desc: mod.desc,
          keywords: mod.tags.join(' '),
          route: `#systems/${mod.id}`
        });
      });
    });

    // 1b. Index Graphics Lab Modules
    GRAPHICS_CURRICULUM.forEach((part) => {
      part.modules.forEach((mod) => {
        this.items.push({
          type: 'graphics',
          category: `Graphics Lab • Part ${part.part}`,
          icon: '◆',
          badge: 'Graphics',
          badgeClass: 'badge-graphics',
          id: mod.id,
          title: `${mod.num}. ${mod.title}`,
          desc: mod.desc,
          keywords: `graphics rasterizer zbuffer vulkan opengl webgpu math 3d ${mod.tags.join(' ')}`,
          route: `#graphics/${mod.id}`
        });
      });
    });

    // 2. Index Server Stages
    SERVER_STAGES.forEach((stage) => {
      this.items.push({
        type: 'servers',
        category: 'Server Architecture',
        icon: '◆',
        badge: 'Rust & Go',
        badgeClass: 'badge-hybrid',
        id: stage.id,
        title: `Stage ${stage.step}: ${stage.title}`,
        desc: `${stage.summary} — ${stage.rust.keyConcepts.join(', ')}`,
        keywords: `rust go server http axum tokio sqlite sqlx ${stage.rust.keyConcepts.join(' ')}`,
        route: `#servers/${stage.id}`
      });
    });

    // 3. Index AI & ML Modules
    AI_CURRICULUM.forEach((part) => {
      part.modules.forEach((mod) => {
        this.items.push({
          type: 'ai',
          category: `AI Lab • Part ${part.part}`,
          icon: '◆',
          badge: 'AI / ML',
          badgeClass: 'badge-ai',
          id: mod.id,
          title: `${mod.num}. ${mod.title}`,
          desc: mod.desc,
          keywords: `ai ml deep learning math python ${mod.tags.join(' ')}`,
          route: `#ai/${mod.id}`
        });
      });
    });

    // 3. Index 3D Motion Demos
    MOTION_LAB_EXAMPLES.forEach((demo) => {
      this.items.push({
        type: 'motion',
        category: '3D Motion Lab',
        icon: '◆',
        badge: demo.badge,
        badgeClass: demo.badgeClass || 'badge-anime',
        id: demo.id,
        title: `${demo.num}. ${demo.title}`,
        desc: demo.desc,
        keywords: `three.js anime.js webgl 3d animation shader particle ${demo.category}`,
        route: `#motion/${demo.id}`
      });
    });

    // 4. Index Resume & Portfolio Items
    if (typeof RESUME_DATA !== 'undefined') {
      // Main Resume
      this.items.push({
        type: 'resume',
        category: 'Interactive Resume',
        icon: '◆',
        badge: 'Resume',
        badgeClass: 'badge-three',
        id: 'resume-main',
        title: 'Developer // Designer Resume',
        desc: RESUME_DATA.profile.objective,
        keywords: 'resume cv experience education skills awards objective summary developer designer computer engineer',
        route: '#resume'
      });

      // Experience Items
      RESUME_DATA.experience.forEach((exp) => {
        this.items.push({
          type: 'resume',
          category: 'Resume • Experience',
          icon: '◆',
          badge: 'Experience',
          badgeClass: 'badge-hybrid',
          id: exp.id,
          title: `${exp.company} — ${exp.role}`,
          desc: exp.summary,
          keywords: `experience ${exp.company} ${exp.role} ${exp.tags.join(' ')} ${exp.period}`,
          route: '#resume/experience'
        });
      });

      // Tech Skills
      RESUME_DATA.skills.tech.forEach((skill, idx) => {
        this.items.push({
          type: 'resume',
          category: 'Resume • Tech Skills',
          icon: '◆',
          badge: 'Skills',
          badgeClass: 'badge-three',
          id: `tech-skill-${idx}`,
          title: `${skill.category} (${skill.level})`,
          desc: `${skill.tools.join(', ')} — ${skill.desc}`,
          keywords: `skills tech ${skill.category} ${skill.tools.join(' ')}`,
          route: '#resume/skills'
        });
      });

      // Creative Skills
      RESUME_DATA.skills.creativity.forEach((skill, idx) => {
        this.items.push({
          type: 'resume',
          category: 'Resume • Creative Skills',
          icon: '◆',
          badge: 'Creative',
          badgeClass: 'badge-anime',
          id: `creative-skill-${idx}`,
          title: `${skill.category} (${skill.level})`,
          desc: `${skill.tools.join(', ')} — ${skill.desc}`,
          keywords: `creativity music 3d animation audio fl studio ${skill.category} ${skill.tools.join(' ')}`,
          route: '#resume/creativity'
        });
      });

      // Education
      RESUME_DATA.education.forEach((edu) => {
        this.items.push({
          type: 'resume',
          category: 'Resume • Education',
          icon: '◆',
          badge: 'Education',
          badgeClass: 'badge-three',
          id: edu.id,
          title: `${edu.institution} — ${edu.degree}`,
          desc: `${edu.location} (${edu.year}) — ${edu.highlights[0]}`,
          keywords: `education degree ${edu.institution} ${edu.degree} ${edu.year} ${edu.location}`,
          route: '#resume/education'
        });
      });

      // Awards
      RESUME_DATA.awards.forEach((award) => {
        this.items.push({
          type: 'resume',
          category: 'Resume • Awards',
          icon: '◆',
          badge: 'Award',
          badgeClass: 'badge-hybrid',
          id: award.id,
          title: `${award.title} (${award.year})`,
          desc: `${award.organization} — ${award.desc}`,
          keywords: `award honor ${award.title} ${award.organization} ${award.year}`,
          route: '#resume/awards'
        });
      });
    }
  }

  renderModal() {
    const modalHtml = `
      <div class="search-modal-backdrop" id="search-modal-backdrop" style="display: none;">
        <div class="search-modal-container" id="search-modal-container">
          <div class="search-modal-input-row">
            <svg class="search-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="modal-search-input" class="modal-search-input" placeholder="Search 50+ systems lessons, servers, 3D demos (e.g. malloc, axum, galaxy, atomics)..." autocomplete="off" />
            <kbd class="search-modal-kbd">ESC</kbd>
          </div>

          <div class="search-modal-results" id="search-modal-results">
            <!-- Results injected dynamically -->
          </div>

          <div class="search-modal-footer">
            <div class="search-footer-hint"><kbd>↑</kbd> <kbd>↓</kbd> Navigate</div>
            <div class="search-footer-hint"><kbd>ENTER</kbd> Select</div>
            <div class="search-footer-hint"><kbd>ESC</kbd> Close</div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  bindEvents() {
    // Global Keyboard Shortcut: Ctrl+K, Cmd+K, or /
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        this.open();
      } else if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Search button in nav
    const navSearchBtn = document.getElementById('btn-nav-search');
    if (navSearchBtn) {
      navSearchBtn.addEventListener('click', () => this.open());
    }

    const backdrop = document.getElementById('search-modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    const input = document.getElementById('modal-search-input');
    if (input) {
      input.addEventListener('input', (e) => {
        this.query = e.target.value;
        this.selectedIndex = 0;
        this.renderResults();
      });

      input.addEventListener('keydown', (e) => {
        const results = this.getFilteredResults();
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex + 1) % Math.max(1, results.length);
          this.highlightSelectedItem();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectedIndex = (this.selectedIndex - 1 + results.length) % Math.max(1, results.length);
          this.highlightSelectedItem();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (results[this.selectedIndex]) {
            this.selectItem(results[this.selectedIndex]);
          }
        }
      });
    }
  }

  open() {
    this.isOpen = true;
    const backdrop = document.getElementById('search-modal-backdrop');
    const input = document.getElementById('modal-search-input');
    if (backdrop) backdrop.style.display = 'flex';
    if (input) {
      input.value = '';
      this.query = '';
      this.selectedIndex = 0;
      this.renderResults();
      setTimeout(() => input.focus(), 50);
    }
  }

  close() {
    this.isOpen = false;
    const backdrop = document.getElementById('search-modal-backdrop');
    if (backdrop) backdrop.style.display = 'none';
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  getFilteredResults() {
    if (!this.query || !this.query.trim()) {
      return this.items.slice(0, 10);
    }

    const q = this.query.toLowerCase().trim();
    return this.items.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
      );
    });
  }

  renderResults() {
    const container = document.getElementById('search-modal-results');
    if (!container) return;

    const results = this.getFilteredResults();

    if (results.length === 0) {
      container.innerHTML = `
        <div class="search-empty-state">
          <div>No matching modules found for "<strong>${escapeHtml(this.query)}</strong>"</div>
        </div>
      `;
      return;
    }

    container.innerHTML = results
      .map((item, index) => {
        const isSelected = index === this.selectedIndex;
        return `
          <div class="search-result-item ${isSelected ? 'selected' : ''}" data-index="${index}">
            <div class="result-icon-wrap">${item.icon}</div>
            <div class="result-info">
              <div class="result-title-row">
                <span class="result-title">${escapeHtml(item.title)}</span>
                <span class="result-category">${escapeHtml(item.category)}</span>
              </div>
              <div class="result-desc">${escapeHtml(item.desc)}</div>
            </div>
            <span class="stage-tag ${item.badgeClass}">${item.badge}</span>
          </div>
        `;
      })
      .join('');

    container.querySelectorAll('.search-result-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index, 10);
        if (results[idx]) this.selectItem(results[idx]);
      });
    });
  }

  highlightSelectedItem() {
    const container = document.getElementById('search-modal-results');
    if (!container) return;

    const items = container.querySelectorAll('.search-result-item');
    items.forEach((el, idx) => {
      const isSelected = idx === this.selectedIndex;
      el.classList.toggle('selected', isSelected);
      if (isSelected) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  selectItem(item) {
    this.close();
    window.location.hash = item.route.replace('#', '');
  }
}

