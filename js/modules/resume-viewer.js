/**
 * Interactive Resume Module
 * Incorporates kinematics & motion techniques from lab lessons:
 *  - Lesson 04: Kinetic typography & self-drawing SVG path drawing
 *  - Lesson 05: Multi-stage timeline choreography & keyframe staging
 *  - Lesson 06: Elastic matrix staggering & distance-based ripple waves
 *  - Lesson 10: 3D perspective tilt & radial glow follower
 *  - Lesson 11: Kinetic audio spectrum equalizer & procedural beat visualizer
 */

import { RESUME_DATA } from '../data/resume-data.js';

export class ResumeViewer {
  constructor(container) {
    this.container = container;
    this.activeFilter = 'all';
    this.audioAnimId = null;
    this.equalizerBars = [];
    this.audioTime = 0;
    this.isAudioPlaying = true;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) {
      this.playEntranceAnimation();
      return;
    }

    this.renderLayout();
    this.bindEvents();
    this.initAudioVisualizer();
    this.playEntranceAnimation();
    this.isInitialized = true;
  }

  renderLayout() {
    const { profile, summary, education, experience, skills, awards } = RESUME_DATA;

    this.container.innerHTML = `
      <div class="resume-viewport">
        <!-- Ambient Background Glow Accents -->
        <div class="resume-ambient-glow" aria-hidden="true"></div>

        <div class="resume-container">
          <!-- ================================================================
               HEADER & KINETIC TYPOGRAPHY + SVG FRAME (Lesson 04 & 05)
               ================================================================ -->
          <header class="resume-header">
            <div class="resume-hero-crest">
              <svg class="resume-svg-frame" viewBox="0 0 160 160" width="110" height="110">
                <defs>
                  <linearGradient id="crestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" />
                    <stop offset="50%" stop-color="#38bdf8" />
                    <stop offset="100%" stop-color="#ec4899" />
                  </linearGradient>
                  <filter id="neonPulse" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <!-- Octagonal Outer Frame -->
                <polygon class="svg-anim-path crest-outer" points="80,8 135,30 152,80 135,130 80,152 25,130 8,80 25,30"
                  fill="rgba(168, 85, 247, 0.06)" stroke="url(#crestGrad)" stroke-width="2.5" filter="url(#neonPulse)" />
                <!-- Inner Geometric Circuit Rings -->
                <circle class="svg-anim-path crest-ring" cx="80" cy="80" r="46"
                  fill="none" stroke="#38bdf8" stroke-width="1.8" stroke-dasharray="6,4" />
                <circle class="svg-anim-path crest-core" cx="80" cy="80" r="26"
                  fill="rgba(56, 189, 248, 0.12)" stroke="#a855f7" stroke-width="2" />
                <text x="80" y="87" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="800" fill="#ffffff">◆</text>
              </svg>
            </div>

            <div class="resume-header-copy">
              <div class="resume-badge-row">
                <span class="resume-status-pill">
                  <span class="pulse-indicator"></span>
                  <span>${profile.badge}</span>
                </span>
                <span class="resume-loc-pill">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <span>${profile.location}</span>
                </span>
              </div>

              <!-- Kinetic Stagger Typography Title -->
              <h1 class="resume-kinetic-title" id="resume-kinetic-title" aria-label="${profile.handle} // Developer Resume">
                ${this.renderKineticText(profile.handle.toUpperCase())}
                <span class="letter-separator">&bull;</span>
                ${this.renderKineticText('RESUME')}
              </h1>

              <div class="resume-role-line">
                <span class="role-primary">${profile.title}</span>
                <span class="role-pipe">|</span>
                <span class="role-secondary">${profile.subtitle}</span>
              </div>
            </div>

            <!-- Global Action Controls -->
            <div class="resume-actions-dock">
              <button class="btn btn-primary btn-resume-print" id="btn-resume-print" title="Print / Export Clean PDF">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                <span>Print / PDF</span>
              </button>
            </div>
          </header>

          <!-- ================================================================
               FILTER BAR
               ================================================================ -->
          <nav class="resume-filter-bar" aria-label="Resume Section Filters">
            <span class="filter-label">// VIEW:</span>
            <button class="resume-filter-btn active" data-filter="all">All Sections</button>
            <button class="resume-filter-btn" data-filter="experience">Experience</button>
            <button class="resume-filter-btn" data-filter="skills">Skills Matrix</button>
            <button class="resume-filter-btn" data-filter="creativity">Creative Lab & Audio</button>
            <button class="resume-filter-btn" data-filter="education">Education</button>
            <button class="resume-filter-btn" data-filter="awards">Awards</button>
          </nav>

          <!-- ================================================================
               OBJECTIVE & SYSTEM TERMINAL
               ================================================================ -->
          <section class="resume-section-block resume-card resume-terminal-card" data-section="all,objective">
            <div class="terminal-bar">
              <div class="terminal-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <div class="terminal-title">~/qurayshe/executive_summary.sys</div>
              <div class="terminal-badge">SYS: OK</div>
            </div>
            <div class="terminal-body">
              <div class="terminal-lead-line">
                <span class="prompt-arrow">&gt;</span>
                <strong class="terminal-keyword">OBJECTIVE:</strong>
                <span class="terminal-text">${profile.objective}</span>
              </div>
              <p class="terminal-overview">${summary.overview}</p>

              <!-- Competencies Grid -->
              <div class="terminal-highlights-grid">
                ${summary.highlights
                  .map(
                    (h) => `
                  <div class="highlight-item">
                    <div class="highlight-header">
                      <span class="highlight-diamond">&diams;</span>
                      <strong class="highlight-title">${h.title}</strong>
                    </div>
                    <p class="highlight-desc">${h.desc}</p>
                  </div>
                `
                  )
                  .join('')}
              </div>

              <!-- Languages & Dialects -->
              <div class="terminal-footer-row">
                <span class="footer-label">NATURAL LANGUAGES:</span>
                <div class="languages-pills">
                  ${summary.languages
                    .map(
                      (lang) => `
                    <span class="language-pill">
                      <strong>${lang.name}</strong> (${lang.level})
                    </span>
                  `
                    )
                    .join('')}
                </div>
              </div>
            </div>
          </section>

          <!-- ================================================================
               WORK & RESEARCH EXPERIENCE (3D Tilt Cards, Lesson 10)
               ================================================================ -->
          <section class="resume-section-block" id="block-experience" data-section="all,experience">
            <div class="section-headline">
              <span class="section-num">01 //</span>
              <h2 class="section-heading">Work Experience &amp; Engineering Research</h2>
              <div class="section-line"></div>
            </div>

            <div class="experience-deck">
              ${experience
                .map(
                  (exp, idx) => `
                <article class="resume-card experience-card" data-index="${idx}">
                  <div class="exp-card-header">
                    <div class="exp-logo-col">
                      <div class="logo-frame">
                        <img 
                          src="${exp.logo}" 
                          alt="${exp.company} Logo" 
                          class="resume-logo"
                          onerror="this.onerror=null; this.src='${exp.logoFallback}';" 
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div class="exp-meta-col">
                      <div class="exp-company-row">
                        <h3 class="exp-company">${exp.company}</h3>
                        <span class="exp-period-pill">${exp.period}</span>
                      </div>
                      <div class="exp-role">${exp.role}</div>
                    </div>
                  </div>

                  <p class="exp-summary">${exp.summary}</p>

                  <ul class="exp-bullet-list">
                    ${exp.bullets
                      .map(
                        (bullet) => `
                      <li class="exp-bullet">
                        <span class="bullet-caret">&rsaquo;</span>
                        <span>${bullet}</span>
                      </li>
                    `
                      )
                      .join('')}
                  </ul>

                  <div class="exp-tags-row">
                    ${exp.tags
                      .map(
                        (tag) => `
                      <span class="skill-node skill-node-compact">${tag}</span>
                    `
                      )
                      .join('')}
                  </div>
                </article>
              `
                )
                .join('')}
            </div>
          </section>

          <!-- ================================================================
               INTERACTIVE SKILLS MATRIX (Elastic Stagger Ripple, Lesson 06)
               ================================================================ -->
          <section class="resume-section-block" id="block-skills" data-section="all,skills">
            <div class="section-headline">
              <span class="section-num">02 //</span>
              <h2 class="section-heading">Technical &amp; Systems Matrix</h2>
              <div class="section-line"></div>
            </div>

            <div class="skills-matrix-grid" id="skills-matrix-grid">
              ${skills.tech
                .map(
                  (skill, catIdx) => `
                <div class="resume-card skill-cat-card" data-cat-index="${catIdx}">
                  <div class="skill-cat-header">
                    <h3 class="skill-cat-title">${skill.category}</h3>
                    <span class="skill-cat-level">${skill.level}</span>
                  </div>
                  <p class="skill-cat-desc">${skill.desc}</p>
                  <div class="skill-nodes-wrap">
                    ${skill.tools
                      .map(
                        (tool) => `
                      <button class="skill-node ripple-trigger" data-tool="${tool}">
                        <span class="node-bullet">&bull;</span>
                        <span>${tool}</span>
                      </button>
                    `
                      )
                      .join('')}
                  </div>
                </div>
              `
                )
                .join('')}
            </div>
          </section>

          <!-- ================================================================
               CREATIVITY & KINETIC AUDIO LAB (Lessons 04, 06 & 11)
               ================================================================ -->
          <section class="resume-section-block" id="block-creativity" data-section="all,creativity,skills">
            <div class="section-headline">
              <span class="section-num">03 //</span>
              <h2 class="section-heading">Creativity, 3DCG &amp; Audio Lab</h2>
              <div class="section-line"></div>
            </div>

            <div class="creativity-grid">
              ${skills.creativity
                .map((skill, cIdx) => {
                  const isMusic = skill.category.toLowerCase().includes('music');
                  return `
                  <div class="resume-card creative-card ${isMusic ? 'creative-music-card' : ''}" data-index="${cIdx}">
                    <div class="skill-cat-header">
                      <h3 class="skill-cat-title">${skill.category}</h3>
                      <span class="skill-cat-level">${skill.level}</span>
                    </div>
                    <p class="skill-cat-desc">${skill.desc}</p>
                    <div class="skill-nodes-wrap">
                      ${skill.tools
                        .map(
                          (tool) => `
                        <button class="skill-node ripple-trigger" data-tool="${tool}">
                          <span class="node-bullet">&bull;</span>
                          <span>${tool}</span>
                        </button>
                      `
                        )
                        .join('')}
                    </div>

                    ${
                      isMusic
                        ? `
                      <!-- Kinetic Soundwave Equalizer (Lesson 11) -->
                      <div class="kinetic-audio-widget">
                        <div class="audio-widget-top">
                          <div class="audio-now-playing">
                            <span class="audio-indicator"></span>
                            <span>KINETIC AUDIO SYNTHESIZER &bull; 64 BINS</span>
                          </div>
                          <button class="btn-audio-drop" id="btn-audio-drop" title="Trigger Bass Drop Shockwave">
                            <span>⚡ Bass Drop</span>
                          </button>
                        </div>
                        <div class="audio-spectrum-canvas" id="audio-spectrum-bars">
                          <!-- 32 Animated Frequency Bars rendered dynamically -->
                        </div>
                      </div>
                    `
                        : ''
                    }
                  </div>
                `;
                })
                .join('')}
            </div>
          </section>

          <!-- ================================================================
               EDUCATION & CREDENTIALS
               ================================================================ -->
          <section class="resume-section-block" id="block-education" data-section="all,education">
            <div class="section-headline">
              <span class="section-num">04 //</span>
              <h2 class="section-heading">Education &amp; Classical Training</h2>
              <div class="section-line"></div>
            </div>

            <div class="education-deck">
              ${education
                .map(
                  (edu, idx) => `
                <article class="resume-card education-card" data-index="${idx}">
                  <div class="edu-card-header">
                    <div class="edu-logo-col">
                      <div class="logo-frame">
                        <img 
                          src="${edu.logo}" 
                          alt="${edu.institution} Logo" 
                          class="resume-logo"
                          onerror="this.onerror=null; this.src='${edu.logoFallback}';" 
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div class="edu-meta-col">
                      <div class="edu-inst-row">
                        <h3 class="edu-institution">${edu.institution}</h3>
                        <span class="edu-year-pill">${edu.year}</span>
                      </div>
                      <div class="edu-degree">${edu.degree}</div>
                      <div class="edu-location">${edu.location}</div>
                    </div>
                  </div>

                  <ul class="exp-bullet-list edu-bullet-list">
                    ${edu.highlights
                      .map(
                        (h) => `
                      <li class="exp-bullet">
                        <span class="bullet-caret">&rsaquo;</span>
                        <span>${h}</span>
                      </li>
                    `
                      )
                      .join('')}
                  </ul>
                </article>
              `
                )
                .join('')}
            </div>
          </section>

          <!-- ================================================================
               AWARDS & HONORS
               ================================================================ -->
          <section class="resume-section-block" id="block-awards" data-section="all,awards">
            <div class="section-headline">
              <span class="section-num">05 //</span>
              <h2 class="section-heading">Honors &amp; Recognitions</h2>
              <div class="section-line"></div>
            </div>

            <div class="awards-deck">
              ${awards
                .map(
                  (award, idx) => `
                <article class="resume-card award-card" data-index="${idx}">
                  <div class="award-card-header">
                    <div class="award-logo-col">
                      <div class="logo-frame">
                        <img 
                          src="${award.logo}" 
                          alt="${award.organization} Logo" 
                          class="resume-logo"
                          onerror="this.onerror=null; this.src='${award.logoFallback}';" 
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div class="award-meta-col">
                      <div class="award-top-row">
                        <div class="award-title-group">
                          <span class="award-trophy-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                              <circle cx="12" cy="8" r="7"></circle>
                              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                            </svg>
                          </span>
                          <h3 class="award-title">${award.title}</h3>
                        </div>
                        <span class="award-year-pill">${award.year}</span>
                      </div>
                      <div class="award-org">${award.organization}</div>
                    </div>
                  </div>

                  <p class="award-desc">${award.desc}</p>
                </article>
              `
                )
                .join('')}
            </div>
          </section>

          <!-- ================================================================
               FOOTER CREDITS & GITHUB ACCESS
               ================================================================ -->
          <footer class="resume-footer-block">
            <div class="footer-badge">VERIFIED BUILD // PURE STATIC</div>
            <p class="footer-sub">
              Crafted with low-level systems precision, WebGL shaders &amp; Anime.js kinematics.
            </p>
            <div class="footer-links">
              <a href="https://github.com/qurayshe" target="_blank" rel="noopener" class="btn btn-outline">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                <span>GitHub: @qurayshe</span>
              </a>
              <a href="#home" class="btn btn-outline">
                <span>&larr; Return to Portals</span>
              </a>
            </div>
          </footer>
        </div>
      </div>
    `;
  }

  renderKineticText(text) {
    return text
      .split('')
      .map((char) => `<span class="letter">${char}</span>`)
      .join('');
  }

  bindEvents() {
    // 1. Filter Switchers
    const filterBtns = this.container.querySelectorAll('.resume-filter-btn');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.dataset.filter;
        this.applyFilter(this.activeFilter);
      });
    });

    // 2. Print / PDF Button
    const btnPrint = this.container.querySelector('#btn-resume-print');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        const prevFilter = this.activeFilter;
        this.prepareForPrint();
        window.print();
        if (prevFilter && prevFilter !== 'all') {
          this.applyFilter(prevFilter, false);
        }
      });
    }

    // Standard print hotkeys (Ctrl+P / Cmd+P) listener
    window.addEventListener('beforeprint', () => {
      this._printPrevFilter = this.activeFilter;
      this.prepareForPrint();
    });

    window.addEventListener('afterprint', () => {
      if (this._printPrevFilter && this._printPrevFilter !== 'all') {
        this.applyFilter(this._printPrevFilter, false);
      }
    });

    // 4. Interactive Skill Tag Radial Ripple (Lesson 06)
    const skillNodes = this.container.querySelectorAll('.ripple-trigger');
    skillNodes.forEach((node, idx) => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        this.triggerSkillRipple(idx, node);
      });
    });

    // 5. 3D Perspective Card Tilt (Lesson 10)
    this.bind3DTilt();

    // 6. Bass Drop Shockwave Trigger
    const btnDrop = this.container.querySelector('#btn-audio-drop');
    if (btnDrop) {
      btnDrop.addEventListener('click', () => {
        this.triggerBassDrop();
      });
    }
  }

  prepareForPrint() {
    // 1. Cancel running anime animations across all elements in container
    if (typeof anime !== 'undefined') {
      anime.remove(this.container.querySelectorAll('*'));
    }
    // 2. Show all blocks and restore full opacity
    const blocks = this.container.querySelectorAll('.resume-section-block');
    blocks.forEach((block) => {
      block.style.display = '';
      block.style.opacity = '1';
      block.style.transform = 'none';
    });
    // 3. Reset any inline opacity or transform on cards or children
    const animatedChildren = this.container.querySelectorAll(
      '.resume-card, .letter, .skill-node, .experience-card, .skill-cat-card, .creative-card, .education-card, .award-card, [style*="opacity"]'
    );
    animatedChildren.forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  applyFilter(filter, animate = true) {
    this.activeFilter = filter;
    const blocks = this.container.querySelectorAll('.resume-section-block');
    if (typeof anime !== 'undefined') {
      anime.remove(blocks);
    }
    blocks.forEach((block) => {
      const allowed = block.dataset.section ? block.dataset.section.split(',') : ['all'];
      const isMatch = filter === 'all' || allowed.includes(filter);

      if (isMatch) {
        block.style.display = '';
        block.style.opacity = '1';
        block.style.transform = 'none';
        if (animate && typeof anime !== 'undefined') {
          anime({
            targets: block,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 350,
            easing: 'easeOutQuad'
          });
        }
      } else {
        block.style.display = 'none';
      }
    });
  }

  /* --------------------------------------------------------------------------
     Entrance Choreography Timeline (Lessons 04 & 05)
     -------------------------------------------------------------------------- */
  playEntranceAnimation() {
    if (typeof anime === 'undefined') return;

    // 1. Self-drawing SVG Paths (Lesson 04)
    const svgPaths = this.container.querySelectorAll('.svg-anim-path');
    svgPaths.forEach((path) => {
      path.style.strokeDashoffset = anime.setDashoffset(path);
    });

    anime({
      targets: svgPaths,
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'easeInOutSine',
      duration: 1600,
      delay: anime.stagger(150)
    });

    // 2. Coordinated Entrance Timeline (Lesson 05)
    const tl = anime.timeline({
      easing: 'easeOutExpo',
      duration: 900
    });

    tl.add({
      targets: '#resume-kinetic-title .letter',
      opacity: [0, 1],
      translateY: [40, 0],
      rotateZ: [10, 0],
      scale: [0.7, 1],
      delay: anime.stagger(30),
      duration: 800,
      easing: 'easeOutElastic(1.2, 0.5)'
    })
      .add(
        {
          targets: '.resume-status-pill, .resume-loc-pill',
          opacity: [0, 1],
          translateY: [15, 0],
          delay: anime.stagger(80),
          duration: 600
        },
        '-=600'
      )
      .add(
        {
          targets: '.resume-role-line',
          opacity: [0, 1],
          translateY: [20, 0],
          duration: 700
        },
        '-=500'
      )
      .add(
        {
          targets: '.resume-terminal-card',
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 800
        },
        '-=500'
      )
      .add(
        {
          targets: '.experience-card',
          opacity: [0, 1],
          translateY: [35, 0],
          delay: anime.stagger(100),
          duration: 700
        },
        '-=600'
      )
      .add(
        {
          targets: '.skill-cat-card, .creative-card',
          opacity: [0, 1],
          scale: [0.95, 1],
          delay: anime.stagger(60),
          duration: 600
        },
        '-=600'
      )
      .add(
        {
          targets: '.education-card, .award-card',
          opacity: [0, 1],
          translateY: [25, 0],
          delay: anime.stagger(80),
          duration: 600
        },
        '-=500'
      );
  }

  /* --------------------------------------------------------------------------
     Elastic Radial Stagger Ripple (Lesson 06)
     -------------------------------------------------------------------------- */
  triggerSkillRipple(clickedIndex, clickedEl) {
    if (typeof anime === 'undefined') return;

    // Button pulse
    anime({
      targets: clickedEl,
      scale: [1, 1.25, 1],
      duration: 400,
      easing: 'easeOutElastic(1, 0.4)'
    });

    // Ripple across all visible skill nodes in the section
    const parentSection = clickedEl.closest('.resume-section-block') || this.container;
    const allNodes = parentSection.querySelectorAll('.skill-node');

    anime({
      targets: allNodes,
      translateY: [
        { value: -8, duration: 180, easing: 'easeOutQuad' },
        { value: 0, duration: 450, easing: 'easeOutElastic(1.3, 0.45)' }
      ],
      scale: [
        { value: 1.12, duration: 180, easing: 'easeOutQuad' },
        { value: 1.0, duration: 450, easing: 'easeOutElastic(1.3, 0.45)' }
      ],
      borderColor: [
        { value: '#a855f7', duration: 150 },
        { value: 'rgba(168, 85, 247, 0.25)', duration: 450 }
      ],
      delay: anime.stagger(30, { from: clickedIndex % allNodes.length })
    });
  }

  triggerGlobalWave() {
    if (typeof anime === 'undefined') return;

    anime({
      targets: '.resume-card',
      scale: [
        { value: 0.97, duration: 150, easing: 'easeOutQuad' },
        { value: 1.02, duration: 300, easing: 'easeOutQuad' },
        { value: 1.0, duration: 550, easing: 'easeOutElastic(1.2, 0.45)' }
      ],
      translateY: [
        { value: 6, duration: 150, easing: 'easeOutQuad' },
        { value: -6, duration: 300, easing: 'easeOutQuad' },
        { value: 0, duration: 550, easing: 'easeOutElastic(1.2, 0.45)' }
      ],
      delay: anime.stagger(70, { from: 'first' })
    });
  }

  /* --------------------------------------------------------------------------
     3D Perspective Tilt & Radial Glow Follower (Lesson 10)
     -------------------------------------------------------------------------- */
  bind3DTilt() {
    const cards = this.container.querySelectorAll('.resume-card');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--glow-x', `${x}px`);
        card.style.setProperty('--glow-y', `${y}px`);

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  /* --------------------------------------------------------------------------
     Kinetic Audio Frequency Visualizer (Lesson 11)
     -------------------------------------------------------------------------- */
  initAudioVisualizer() {
    const spectrumContainer = this.container.querySelector('#audio-spectrum-bars');
    if (!spectrumContainer) return;

    spectrumContainer.innerHTML = '';
    const barCount = 32;
    this.equalizerBars = [];

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'equalizer-bar';
      bar.style.height = '14px';
      spectrumContainer.appendChild(bar);
      this.equalizerBars.push({ el: bar, phase: (i / barCount) * Math.PI * 2, baseHeight: 12 });
    }

    this.startAudioLoop();
  }

  startAudioLoop() {
    if (this.audioAnimId) cancelAnimationFrame(this.audioAnimId);

    const updateAudio = () => {
      this.audioTime += 0.045;

      this.equalizerBars.forEach((barObj, i) => {
        // Procedural frequency modulation using sine waveforms
        const harmonic1 = Math.sin(this.audioTime * 2 + barObj.phase * 2);
        const harmonic2 = Math.cos(this.audioTime * 3.5 - barObj.phase * 3);
        const harmonic3 = Math.sin(this.audioTime * 0.8 + i * 0.3);

        const amp = (harmonic1 * 0.4 + harmonic2 * 0.35 + harmonic3 * 0.25 + 1) / 2; // 0..1
        const heightPx = Math.max(6, Math.floor(amp * 48) + 6);

        barObj.el.style.height = `${heightPx}px`;

        // Modulate color from purple to cyan
        const pct = i / this.equalizerBars.length;
        if (amp > 0.75) {
          barObj.el.style.background = '#38bdf8';
          barObj.el.style.boxShadow = '0 0 8px rgba(56, 189, 248, 0.8)';
        } else if (pct < 0.5) {
          barObj.el.style.background = '#a855f7';
          barObj.el.style.boxShadow = '0 0 6px rgba(168, 85, 247, 0.5)';
        } else {
          barObj.el.style.background = '#c084fc';
          barObj.el.style.boxShadow = 'none';
        }
      });

      this.audioAnimId = requestAnimationFrame(updateAudio);
    };

    updateAudio();
  }

  triggerBassDrop() {
    if (typeof anime === 'undefined') return;

    const bars = this.container.querySelectorAll('.equalizer-bar');
    anime({
      targets: bars,
      height: [
        { value: '55px', duration: 150, easing: 'easeOutQuad' },
        { value: '4px', duration: 120, easing: 'easeInQuad' },
        { value: '46px', duration: 250, easing: 'easeOutElastic(1.4, 0.4)' },
        { value: '18px', duration: 300, easing: 'easeInOutQuad' }
      ],
      backgroundColor: [
        { value: '#ffffff', duration: 150 },
        { value: '#ec4899', duration: 250 },
        { value: '#a855f7', duration: 300 }
      ],
      delay: anime.stagger(15, { from: 'center' })
    });
  }

  destroy() {
    if (this.audioAnimId) {
      cancelAnimationFrame(this.audioAnimId);
      this.audioAnimId = null;
    }
  }
}

