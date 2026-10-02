/**
 * Master Application Entrypoint
 * Coordinates:
 *  - 3D Hero Scene with 4 modes & shockwave
 *  - Systems Lab (C/C++), Server Lab (Rust/Go), 3D Motion Lab (Three.js/Anime.js)
 *  - Universal Command Palette Search Modal
 *  - Client-Side Hash Router
 *  - Anime.js kinetic typography (Lesson 04), timeline choreography (Lesson 05), elastic matrix ripples (Lesson 06)
 *  - Dynamic 3D tilt & radial cursor glow follower (inspired by 3sss.tech)
 */

import { HeroScene } from './hero/hero-scene.js';
import { Router } from './modules/router.js';
import { SystemsViewer } from './modules/systems-viewer.js';
import { GraphicsViewer } from './modules/graphics-viewer.js';
import { ServerViewer } from './modules/server-viewer.js';
import { AIViewer } from './modules/ai-viewer.js';
import { MotionLab } from './modules/motion-lab.js';
import { ResumeViewer } from './modules/resume-viewer.js';
import { SearchModal } from './modules/search-modal.js';
import { SYSTEMS_CURRICULUM, GRAPHICS_CURRICULUM, SERVER_STAGES, AI_CURRICULUM, MOTION_LAB_EXAMPLES } from './data/manifest.js';

class App {
  constructor() {
    this.heroScene = null;
    this.systemsViewer = null;
    this.graphicsViewer = null;
    this.serverViewer = null;
    this.aiViewer = null;
    this.motionLab = null;
    this.resumeViewer = null;
    this.searchModal = null;
    this.router = null;

    this.init();
  }

  init() {
    // 1. Initialize Hero 3D Scene
    this.heroScene = new HeroScene('hero-3d-viewport');

    // 2. Initialize Lab Viewers
    const systemsContainer = document.getElementById('systems-container');
    if (systemsContainer) {
      this.systemsViewer = new SystemsViewer(systemsContainer);
    }

    const graphicsContainer = document.getElementById('graphics-container');
    if (graphicsContainer) {
      this.graphicsViewer = new GraphicsViewer(graphicsContainer);
    }

    const serverContainer = document.getElementById('server-container');
    if (serverContainer) {
      this.serverViewer = new ServerViewer(serverContainer);
    }

    const aiContainer = document.getElementById('ai-container');
    if (aiContainer) {
      this.aiViewer = new AIViewer(aiContainer);
    }

    const motionContainer = document.getElementById('motion-container');
    if (motionContainer) {
      this.motionLab = new MotionLab(motionContainer);
    }

    const resumeContainer = document.getElementById('resume-container');
    if (resumeContainer) {
      this.resumeViewer = new ResumeViewer(resumeContainer);
    }

    // 3. Initialize Router
    this.router = new Router({
      home: () => this.onHomeActive(),
      systems: (moduleId) => this.onSystemsActive(moduleId),
      graphics: (moduleId) => this.onGraphicsActive(moduleId),
      servers: (stageId) => this.onServersActive(stageId),
      ai: (moduleId) => this.onAIActive(moduleId),
      motion: (demoId) => this.onMotionActive(demoId),
      resume: (filter) => this.onResumeActive(filter),
      misc: (toolId) => this.onMiscActive(toolId),
      about: () => this.router.navigate('#home')
    });

    // 4. Initialize Command Palette Search
    this.searchModal = new SearchModal(this.router);

    // 5. Bind Global Controls & Interactive Dynamics
    this.bindNavbarInteractions();
    this.bindHomeInteractions();
    this.bindCardHoverEffects();
    this.bindMagneticElements();
    this.animateHeroChoreography();

    // 6. Start Routing
    this.router.init();
  }

  onHomeActive() {
    if (this.heroScene && !this.heroScene.animationFrameId) {
      this.heroScene.animate();
    }
  }

  onSystemsActive(moduleId) {
    if (this.systemsViewer) {
      if (!this.systemsViewer.currentModule) {
        this.systemsViewer.init(moduleId);
      } else if (moduleId && this.systemsViewer.currentModule.id !== moduleId) {
        const found = this.systemsViewer.allModules.find((m) => m.id === moduleId);
        if (found) this.systemsViewer.loadModule(found);
      }
    }
  }

  onGraphicsActive(moduleId) {
    if (this.graphicsViewer) {
      if (!this.graphicsViewer.currentModule) {
        this.graphicsViewer.init(moduleId);
      } else if (moduleId && this.graphicsViewer.currentModule.id !== moduleId) {
        const found = this.graphicsViewer.allModules.find((m) => m.id === moduleId);
        if (found) this.graphicsViewer.loadModule(found);
      }
    }
  }

  onServersActive(stageId) {
    if (this.serverViewer) {
      if (!this.serverViewer.currentStage) {
        this.serverViewer.init(stageId);
      } else if (stageId && this.serverViewer.currentStage.id !== stageId) {
        const found = SERVER_STAGES.find((s) => s.id === stageId);
        if (found) this.serverViewer.loadStage(found);
      }
    }
  }

  onAIActive(moduleId) {
    if (this.aiViewer) {
      if (!this.aiViewer.currentModule) {
        this.aiViewer.init(moduleId);
      } else if (moduleId && this.aiViewer.currentModule.id !== moduleId) {
        const found = this.aiViewer.allModules.find((m) => m.id === moduleId);
        if (found) this.aiViewer.loadModule(found);
      }
    }
  }

  onMotionActive(demoId) {
    if (this.motionLab) {
      if (!this.motionLab.currentExample) {
        this.motionLab.init(demoId);
      } else if (demoId && this.motionLab.currentExample.id !== demoId) {
        const found = MOTION_LAB_EXAMPLES.find((e) => e.id === demoId);
        if (found) this.motionLab.loadExample(found);
      }
    }
  }

  onResumeActive(filter) {
    if (this.resumeViewer) {
      this.resumeViewer.init();
      if (filter) {
        this.resumeViewer.applyFilter(filter);
      }
    }
  }

  onMiscActive(toolId) {
    // Misc tools are standalone single-page apps embedded via iframe.
    // Dynamically point the embed frame at the requested tool (default: blorbo).
    const frame = document.getElementById('misc-embed-frame');
    if (frame) {
      const toolPath = toolId ? `./misc/${toolId}/index.html` : './misc/blorbo/index.html';
      if (frame.getAttribute('src') !== toolPath) {
        frame.setAttribute('src', toolPath);
      }
    }
  }

  /* --------------------------------------------------------------------------
     Navbar Dropdown, Mobile Menu & Fullscreen Actions
     -------------------------------------------------------------------------- */
  bindNavbarInteractions() {
    // Generic open/close binding for every nav dropdown (Labs & Curriculum, Misc, ...)
    const navDropdowns = document.querySelectorAll('.nav-dropdown');

    navDropdowns.forEach((dropdown) => {
      const dropdownBtn = dropdown.querySelector('.nav-dropdown-btn');
      if (!dropdownBtn) return;

      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('open');
        dropdownBtn.setAttribute('aria-expanded', String(isOpen));
      });

      dropdown.querySelectorAll('.dropdown-item').forEach((item) => {
        item.addEventListener('click', () => {
          dropdown.classList.remove('open');
          dropdownBtn.setAttribute('aria-expanded', 'false');
          const mobileNav = document.getElementById('nav-links-wrap');
          if (mobileNav) mobileNav.classList.remove('open');
        });
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
          dropdownBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Fullscreen Toggle Button
    const fsBtn = document.getElementById('btn-nav-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          fsBtn.classList.add('active');
        } else {
          document.exitFullscreen().catch(() => {});
          fsBtn.classList.remove('active');
        }
      });

      document.addEventListener('fullscreenchange', () => {
        fsBtn.classList.toggle('active', !!document.fullscreenElement);
      });
    }

    // Mobile Hamburger Menu Toggle
    const mobileBtn = document.getElementById('btn-nav-mobile');
    const navLinks = document.getElementById('nav-links-wrap');
    if (mobileBtn && navLinks) {
      mobileBtn.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        mobileBtn.classList.toggle('active', isOpen);
      });
    }
  }

  /* --------------------------------------------------------------------------
     Dynamic 3D Tilt & Cursor Glow Follower (inspired by 3sss.tech)
     -------------------------------------------------------------------------- */
  bindCardHoverEffects() {
    const cards = document.querySelectorAll('.portal-card, .about-card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Update glow origin variables for CSS radial gradient
        card.style.setProperty('--glow-x', `${x}px`);
        card.style.setProperty('--glow-y', `${y}px`);

        // 3D Perspective Tilt
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -7.5;
        const rotateY = ((x - centerX) / centerX) * 7.5;

        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  /* --------------------------------------------------------------------------
     Magnetic Element Pull (Buttons, Mode Switchers, Badges)
     -------------------------------------------------------------------------- */
  bindMagneticElements() {
    const elements = document.querySelectorAll('.btn, .hero-mode-btn, .btn-search-trigger, .resume-filter-btn');
    elements.forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.22}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* --------------------------------------------------------------------------
     Homepage Interactions & Elastic Stagger Ripple (Lesson 06)
     -------------------------------------------------------------------------- */
  bindHomeInteractions() {
    // 3D Hero Mode Switcher Buttons
    const modeBtns = document.querySelectorAll('.hero-mode-btn[data-mode]');
    modeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        modeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mode;
        if (this.heroScene) {
          this.heroScene.setVisualMode(mode);
        }
      });
    });

    // ASCII Filter Mode Toggle Button
    const asciiBtn = document.getElementById('btn-hero-ascii');
    const asciiStatus = document.getElementById('hero-ascii-status');
    if (asciiBtn) {
      asciiBtn.addEventListener('click', () => {
        if (this.heroScene) {
          const isEnabled = this.heroScene.toggleAscii();
          asciiBtn.classList.toggle('active', isEnabled);
          if (asciiStatus) {
            asciiStatus.textContent = isEnabled ? 'ASCII: ON' : 'ASCII: OFF';
          }
        }
      });
    }

    // Hero 3D Canvas Click Trigger (Triggers Shockwave & Card Elastic Ripple)
    const heroViewport = document.getElementById('hero-3d-viewport');
    if (heroViewport) {
      heroViewport.addEventListener('pointerdown', () => {
        if (this.heroScene) {
          this.heroScene.triggerShockwave();
        }
        this.triggerCardElasticRipple();
      });
    }

    // Dynamic Current Year in Footer
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.innerText = new Date().getFullYear();
    }
  }

  /* --------------------------------------------------------------------------
     Elastic Matrix Stagger Ripple on Lesson Cards (Lesson 06)
     -------------------------------------------------------------------------- */
  triggerCardElasticRipple() {
    if (typeof anime === 'undefined') return;

    anime({
      targets: '.portal-card',
      scale: [
        { value: 0.96, duration: 150, easing: 'easeOutQuad' },
        { value: 1.03, duration: 300, easing: 'easeOutQuad' },
        { value: 1.0, duration: 550, easing: 'easeOutElastic(1.3, 0.4)' }
      ],
      translateY: [
        { value: 6, duration: 150, easing: 'easeOutQuad' },
        { value: -8, duration: 300, easing: 'easeOutQuad' },
        { value: 0, duration: 550, easing: 'easeOutElastic(1.3, 0.4)' }
      ],
      delay: anime.stagger(100, { from: 'first' })
    });
  }

  /* --------------------------------------------------------------------------
     Timeline Choreography (Lesson 05) & Kinetic Reveal (Lesson 04)
     -------------------------------------------------------------------------- */
  animateHeroChoreography() {
    if (typeof anime === 'undefined') return;

    const tl = anime.timeline({
      easing: 'easeOutExpo',
      duration: 1000
    });

    tl.add({
      targets: '.hero-badge-pill',
      opacity: [0, 1],
      translateY: [20, 0],
      scale: [0.9, 1],
      duration: 700
    })
    .add({
      targets: '.hero-title-main',
      opacity: [0, 1],
      translateY: [35, 0],
      duration: 900
    }, '-=500')
    .add({
      targets: '.hero-lead-text',
      opacity: [0, 1],
      translateY: [25, 0],
      duration: 800
    }, '-=600')
    .add({
      targets: '.hero-cta-group .btn',
      opacity: [0, 1],
      translateY: [20, 0],
      delay: anime.stagger(90),
      duration: 700
    }, '-=500')
    .add({
      targets: '.hero-mode-bar',
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 600
    }, '-=400')
    .add({
      targets: '.hero-3d-col',
      opacity: [0, 1],
      scale: [0.94, 1],
      duration: 1000
    }, '-=800');
  }
}

// Bootstrap Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
