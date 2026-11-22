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
import { MUSIC_TRACKS } from '../data/music-tracks.js';
import { GALLERY_3D_ITEMS } from '../data/gallery-3d.js';
import { attachSmooth3DTilt } from '../utils/helpers.js';

export class ResumeViewer {
  constructor(container) {
    this.container = container;
    this.activeFilter = 'all';
    this.audioAnimId = null;
    this.audioCtx = null;
    this.analyser = null;
    this.mediaSource = null;
    this.freqData = null;
    this.peakCaps = null;
    this.currentTrackIdx = 0;
    this.currentGalleryIdx = 0;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) {
      this.playEntranceAnimation();
      return;
    }

    this.renderLayout();
    this.renderPrintSheet();
    this.bindEvents();
    this.init3DGallery();
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
                    <stop offset="0%" stop-color="#ff70a6" />
                    <stop offset="50%" stop-color="#45c8ff" />
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
                  fill="rgba(255, 112, 166, 0.06)" stroke="url(#crestGrad)" stroke-width="2.5" filter="url(#neonPulse)" />
                <!-- Inner Geometric Circuit Rings -->
                <circle class="svg-anim-path crest-ring" cx="80" cy="80" r="46"
                  fill="none" stroke="#45c8ff" stroke-width="1.8" stroke-dasharray="6,4" />
                <circle class="svg-anim-path crest-core" cx="80" cy="80" r="26"
                  fill="rgba(69, 200, 255, 0.12)" stroke="#ff70a6" stroke-width="2" />
                <text x="80" y="87" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="800" fill="#ffffff">◆</text>
              </svg>
            </div>

            <div class="resume-header-copy">
              <div class="resume-badge-row">
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

              <!-- Mini 3DCG & Music Preview Dock -->
              <div class="terminal-mini-media-row">
                <div class="mini-media-card" id="mini-3d-card">
                  <img class="mini-media-thumb" id="mini-3d-thumb" src="${GALLERY_3D_ITEMS[0].src}" alt="${GALLERY_3D_ITEMS[0].filename}" />
                  <div class="mini-media-info">
                    <div class="mini-media-kicker">3DCG &bull; <span id="mini-3d-counter">01/${String(GALLERY_3D_ITEMS.length).padStart(2, '0')}</span></div>
                    <div class="mini-media-name" id="mini-3d-name">${GALLERY_3D_ITEMS[0].filename}</div>
                    <div class="mini-media-btns">
                      <button type="button" class="mini-ctrl-btn" id="btn-mini-3d-prev" title="Previous Render" aria-label="Previous Render">◀</button>
                      <button type="button" class="mini-ctrl-btn" id="btn-mini-3d-next" title="Next Render" aria-label="Next Render">▶</button>
                    </div>
                  </div>
                  <button type="button" class="mini-jump-btn" id="btn-mini-jump-3d" title="Jump to full 3DCG Showcase">↗ Full</button>
                </div>

                <div class="mini-media-card" id="mini-music-card">
                  <img class="mini-media-thumb" id="mini-music-thumb" src="${MUSIC_TRACKS[0].thumb}" alt="${MUSIC_TRACKS[0].title}" />
                  <div class="mini-media-info">
                    <div class="mini-media-kicker">AUDIO &bull; <span id="mini-music-time">0:00</span></div>
                    <div class="mini-media-name" id="mini-music-name">${MUSIC_TRACKS[0].title}</div>
                    <div class="mini-media-btns">
                      <button type="button" class="mini-ctrl-btn" id="btn-mini-music-prev" title="Previous Track" aria-label="Previous Track">⏮</button>
                      <button type="button" class="mini-ctrl-btn mini-ctrl-play" id="btn-mini-music-play" title="Play / Pause" aria-label="Play / Pause">▶</button>
                      <button type="button" class="mini-ctrl-btn" id="btn-mini-music-next" title="Next Track" aria-label="Next Track">⏭</button>
                    </div>
                  </div>
                  <button type="button" class="mini-jump-btn" id="btn-mini-jump-music" title="Jump to full Music Player">↗ Full</button>
                </div>
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
                  const is3DCG = skill.category.toLowerCase().includes('3dcg');
                  return `
                  <div class="resume-card creative-card ${isMusic ? 'creative-music-card' : ''} ${is3DCG ? 'creative-3d-card' : ''}" data-index="${cIdx}">
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
                      is3DCG
                        ? `
                      <!-- Neat 3DCG Renders Showcase Viewer -->
                      <div class="gallery-3d-widget" id="resume-3d-viewer">
                        <div class="gallery-3d-top">
                          <div class="gallery-3d-label">
                            <span>3DCG SHOWCASE &bull;</span>
                            <strong id="resume-3d-file">${GALLERY_3D_ITEMS[0].filename}</strong>
                          </div>
                          <div class="gallery-3d-nav">
                            <button type="button" class="btn-3d-nav" id="btn-3d-prev" title="Previous Render" aria-label="Previous Render">◀</button>
                            <span class="gallery-3d-counter" id="resume-3d-counter">01 / ${String(GALLERY_3D_ITEMS.length).padStart(2, '0')}</span>
                            <button type="button" class="btn-3d-nav" id="btn-3d-next" title="Next Render" aria-label="Next Render">▶</button>
                          </div>
                        </div>

                        <div class="gallery-3d-stage" id="resume-3d-stage" title="Click to view next render">
                          <img id="resume-3d-img" class="gallery-3d-img" src="${GALLERY_3D_ITEMS[0].src}" alt="${GALLERY_3D_ITEMS[0].filename}" />
                        </div>

                        <div class="gallery-3d-thumbs" id="resume-3d-thumbs">
                          ${GALLERY_3D_ITEMS.map(
                            (item, gIdx) => `
                            <button type="button" class="gallery-3d-thumb-btn ${gIdx === 0 ? 'active' : ''}" data-gallery-idx="${gIdx}" title="${item.filename}">
                              <img src="${item.src}" alt="${item.filename}" loading="lazy" />
                            </button>
                          `
                          ).join('')}
                        </div>
                      </div>
                    `
                        : ''
                    }

                    ${
                      isMusic
                        ? `
                      <!-- Real-Time Web Audio Spectrum Visualizer & Music Video Player -->
                      <div class="kinetic-audio-widget" id="resume-music-player">
                        <div class="audio-widget-top">
                          <div class="audio-now-playing">
                            <span id="resume-audio-title">NOW PLAYING &bull; ${MUSIC_TRACKS[0].title}</span>
                          </div>
                        </div>

                        <div class="audio-player-grid">
                          <div class="audio-video-stage">
                            <video
                              id="resume-music-video"
                              class="resume-music-video"
                              src="${MUSIC_TRACKS[0].src}"
                              ${MUSIC_TRACKS[0].poster ? `poster="${MUSIC_TRACKS[0].poster}"` : ''}
                              playsinline
                              preload="auto"
                            ></video>
                            <div class="audio-seek-row">
                              <span class="audio-time" id="resume-audio-cur">0:00</span>
                              <input type="range" class="audio-seek-slider" id="resume-audio-seek" min="0" max="100" step="0.1" value="0" aria-label="Seek" />
                              <span class="audio-time" id="resume-audio-dur">0:00</span>
                            </div>
                          </div>

                          <div class="audio-track-list" id="resume-track-list" role="listbox" aria-label="Music Video Tracks">
                            ${MUSIC_TRACKS.map(
                              (track, tIdx) => `
                              <button type="button" class="audio-track-btn ${tIdx === 0 ? 'active' : ''}" data-track-idx="${tIdx}">
                                <span class="audio-track-num">${String(tIdx + 1).padStart(2, '0')}</span>
                                <img class="audio-track-thumb" src="${track.thumb}" alt="" loading="lazy" />
                                <span class="audio-track-meta">
                                  <span class="audio-track-name">${track.title}</span>
                                  <span class="audio-track-tag">${track.tag}</span>
                                </span>
                              </button>
                            `
                            ).join('')}
                          </div>
                        </div>

                        <!-- Centered Playback Controls Dock Directly Above Audio Graph -->
                        <div class="audio-controls-dock">
                          <div class="audio-transport-controls">
                            <button type="button" class="btn-audio-ctrl" id="btn-audio-prev" title="Previous Track" aria-label="Previous Track">⏮</button>
                            <button type="button" class="btn-audio-ctrl btn-audio-play" id="btn-audio-play" title="Play / Pause">▶ Play</button>
                            <button type="button" class="btn-audio-ctrl" id="btn-audio-next" title="Next Track" aria-label="Next Track">⏭</button>
                            <div class="audio-vol-group">
                              <span class="audio-vol-icon" aria-hidden="true">🔊</span>
                              <input type="range" class="audio-vol-slider" id="resume-audio-vol" min="0" max="1" step="0.05" value="0.8" title="Volume" aria-label="Volume" />
                            </div>
                          </div>
                        </div>

                        <div class="audio-spectrum-wrap">
                          <canvas id="resume-spectrum-canvas" class="audio-spectrum-canvas-el" width="640" height="84"></canvas>
                          <div class="audio-spectrum-hint" id="resume-spectrum-hint">LIVE WEB AUDIO FFT SPECTRUM (PRESS PLAY)</div>
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
      document.body.classList.remove('is-printing-resume');
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
  }

  prepareForPrint() {
    const resumeSection = document.getElementById('section-resume');
    const isResumeActive = !resumeSection || resumeSection.classList.contains('active') || resumeSection.style.display !== 'none';
    if (isResumeActive) {
      this.renderPrintSheet();
      document.body.classList.add('is-printing-resume');
    }

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

  renderPrintSheet() {
    const { profile, summary, education, experience, skills, awards } = RESUME_DATA;
    let sheet = document.getElementById('resume-print-sheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'resume-print-sheet';
      sheet.className = 'resume-print-sheet';
      sheet.setAttribute('aria-hidden', 'true');
      document.body.appendChild(sheet);
    }

    const githubDisplay = profile.github ? profile.github.replace(/^https?:\/\//, '') : 'github.com/qurayshe';

    sheet.innerHTML = `
      <div class="rps-accent-bar"></div>

      <header class="rps-header">
        <div class="rps-header-left">
          <div class="rps-crest" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="38" height="38">
              <defs>
                <linearGradient id="rpsCrestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#0ea5e9" />
                  <stop offset="50%" stop-color="#6366f1" />
                  <stop offset="100%" stop-color="#ec4899" />
                </linearGradient>
              </defs>
              <polygon points="24,2 41,9 46,24 41,39 24,46 7,39 2,24 7,9"
                fill="#f8fafc" stroke="url(#rpsCrestGrad)" stroke-width="2.2" />
              <circle cx="24" cy="24" r="14" fill="none" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,2" />
              <text x="24" y="29" text-anchor="middle" font-family="Inter, sans-serif" font-size="14" font-weight="800" fill="#0f172a">◆</text>
            </svg>
          </div>
          <div class="rps-title-wrap">
            <div class="rps-name-row">
              <h1 class="rps-name">${profile.handle}</h1>
              <span class="rps-doc-tag">CURRICULUM VITAE</span>
            </div>
            <div class="rps-role-line">
              <span class="rps-role-primary">${profile.title}</span>
              <span class="rps-role-sep">&bull;</span>
              <span class="rps-role-sub">${profile.subtitle}</span>
            </div>
          </div>
        </div>

        <div class="rps-header-right">
          <div class="rps-meta-badge">${profile.badge}</div>
          <div class="rps-meta-line">${profile.location}</div>
          <div class="rps-meta-line rps-meta-link">${githubDisplay}</div>
        </div>
      </header>

      <!-- Stylized Terminal Summary Block -->
      <section class="rps-terminal">
        <div class="rps-terminal-bar">
          <div class="rps-term-dots">
            <span class="rps-dot rps-dot-red"></span>
            <span class="rps-dot rps-dot-yellow"></span>
            <span class="rps-dot rps-dot-green"></span>
          </div>
          <div class="rps-term-title">~/qurayshe/executive_summary.sys</div>
          <div class="rps-term-status">SYS: OK</div>
        </div>
        <div class="rps-terminal-body">
          <div class="rps-objective-row">
            <span class="rps-prompt">&gt;</span>
            <span class="rps-keyword">OBJECTIVE:</span>
            <span class="rps-objective-text">${profile.objective}</span>
          </div>
          <p class="rps-overview-text">${summary.overview}</p>

          <div class="rps-highlights-grid">
            ${summary.highlights
              .map(
                (h) => `
              <div class="rps-highlight-cell">
                <div class="rps-highlight-title"><span class="rps-diamond">&diams;</span> ${h.title}</div>
                <p class="rps-highlight-desc">${h.desc}</p>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="rps-languages-row">
            <span class="rps-lang-label">NATURAL LANGUAGES:</span>
            <div class="rps-lang-list">
              ${summary.languages
                .map((l) => `<span class="rps-lang-pill"><strong>${l.name}:</strong> ${l.level}</span>`)
                .join('')}
            </div>
          </div>
        </div>
      </section>

      <!-- 01: Work Experience -->
      <section class="rps-section">
        <div class="rps-section-head">
          <span class="rps-sec-num">01</span>
          <h2 class="rps-sec-title">Work Experience &amp; Engineering Research</h2>
          <div class="rps-sec-rule"></div>
        </div>
        <div class="rps-exp-list">
          ${experience
            .map(
              (exp) => `
            <article class="rps-exp-item">
              <div class="rps-exp-top">
                <div class="rps-exp-left">
                  <h3 class="rps-exp-company">${exp.company}</h3>
                  <div class="rps-exp-role">${exp.role}</div>
                </div>
                <span class="rps-period-pill">${exp.period}</span>
              </div>
              <p class="rps-exp-summary">${exp.summary}</p>
              <ul class="rps-exp-bullets">
                ${exp.bullets.map((b) => `<li>${b}</li>`).join('')}
              </ul>
              <div class="rps-tags-row">
                ${exp.tags.map((t) => `<span class="rps-tag">${t}</span>`).join('')}
              </div>
            </article>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- 02: Technical Skills -->
      <section class="rps-section">
        <div class="rps-section-head">
          <span class="rps-sec-num">02</span>
          <h2 class="rps-sec-title">Technical Skills Matrix</h2>
          <div class="rps-sec-rule"></div>
        </div>
        <div class="rps-grid-2">
          ${skills.tech
            .map(
              (cat) => `
            <div class="rps-skill-card">
              <div class="rps-skill-head">
                <h3 class="rps-skill-title">${cat.category}</h3>
                <span class="rps-skill-level">${cat.level}</span>
              </div>
              <p class="rps-skill-desc">${cat.desc}</p>
              <div class="rps-tags-row">
                ${cat.tools.map((t) => `<span class="rps-tag">${t}</span>`).join('')}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- 03: Creative Lab & Audio -->
      <section class="rps-section">
        <div class="rps-section-head">
          <span class="rps-sec-num">03</span>
          <h2 class="rps-sec-title">Creative Lab, 3DCG &amp; Audio Engineering</h2>
          <div class="rps-sec-rule"></div>
        </div>
        <div class="rps-grid-2">
          ${skills.creativity
            .map(
              (cat) => `
            <div class="rps-skill-card">
              <div class="rps-skill-head">
                <h3 class="rps-skill-title">${cat.category}</h3>
                <span class="rps-skill-level">${cat.level}</span>
              </div>
              <p class="rps-skill-desc">${cat.desc}</p>
              <div class="rps-tags-row">
                ${cat.tools.map((t) => `<span class="rps-tag">${t}</span>`).join('')}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- 04: Education -->
      <section class="rps-section">
        <div class="rps-section-head">
          <span class="rps-sec-num">04</span>
          <h2 class="rps-sec-title">Education &amp; Certifications</h2>
          <div class="rps-sec-rule"></div>
        </div>
        <div class="rps-edu-grid">
          ${education
            .map(
              (edu) => `
            <article class="rps-edu-card">
              <div class="rps-edu-top">
                <div>
                  <h3 class="rps-edu-inst">${edu.institution}</h3>
                  <div class="rps-edu-degree">${edu.degree}</div>
                </div>
                <div class="rps-edu-meta">
                  <span class="rps-period-pill">${edu.year}</span>
                  <span class="rps-edu-loc">${edu.location}</span>
                </div>
              </div>
              <ul class="rps-edu-bullets">
                ${edu.highlights.map((h) => `<li>${h}</li>`).join('')}
              </ul>
            </article>
          `
            )
            .join('')}
        </div>
      </section>

      <!-- 05: Honors & Awards -->
      <section class="rps-section">
        <div class="rps-section-head">
          <span class="rps-sec-num">05</span>
          <h2 class="rps-sec-title">Honors &amp; Awards</h2>
          <div class="rps-sec-rule"></div>
        </div>
        <div class="rps-awards-grid">
          ${awards
            .map(
              (aw) => `
            <article class="rps-award-card">
              <div class="rps-award-top">
                <h3 class="rps-award-title">${aw.title}</h3>
                <span class="rps-period-pill">${aw.year}</span>
              </div>
              <div class="rps-award-org">${aw.organization}</div>
              <p class="rps-award-desc">${aw.desc}</p>
            </article>
          `
            )
            .join('')}
        </div>
      </section>
    `;
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
        { value: '#ff70a6', duration: 150 },
        { value: 'rgba(255, 112, 166, 0.25)', duration: 450 }
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
    attachSmooth3DTilt(this.container.querySelectorAll('.resume-card'), {
      perspective: 1000,
      maxTilt: 6,
      lift: -4
    });
  }

  /* --------------------------------------------------------------------------
     3DCG Renders Showcase Viewer (Synced with Mini Executive Summary Widget)
     -------------------------------------------------------------------------- */
  init3DGallery() {
    const imgEl = this.container.querySelector('#resume-3d-img');
    const fileEl = this.container.querySelector('#resume-3d-file');
    const counterEl = this.container.querySelector('#resume-3d-counter');
    const btnPrev = this.container.querySelector('#btn-3d-prev');
    const btnNext = this.container.querySelector('#btn-3d-next');
    const stageEl = this.container.querySelector('#resume-3d-stage');
    const thumbBtns = this.container.querySelectorAll('.gallery-3d-thumb-btn');

    const miniThumb = this.container.querySelector('#mini-3d-thumb');
    const miniName = this.container.querySelector('#mini-3d-name');
    const miniCounter = this.container.querySelector('#mini-3d-counter');
    const miniPrev = this.container.querySelector('#btn-mini-3d-prev');
    const miniNext = this.container.querySelector('#btn-mini-3d-next');
    const miniJump = this.container.querySelector('#btn-mini-jump-3d');

    if (!imgEl) return;

    const selectItem = (idx) => {
      this.currentGalleryIdx = (idx + GALLERY_3D_ITEMS.length) % GALLERY_3D_ITEMS.length;
      const item = GALLERY_3D_ITEMS[this.currentGalleryIdx];
      const numStr = String(this.currentGalleryIdx + 1).padStart(2, '0');
      const totStr = String(GALLERY_3D_ITEMS.length).padStart(2, '0');

      imgEl.src = item.src;
      imgEl.alt = item.filename;
      if (fileEl) fileEl.textContent = item.filename;
      if (counterEl) counterEl.textContent = `${numStr} / ${totStr}`;
      thumbBtns.forEach((b, i) => b.classList.toggle('active', i === this.currentGalleryIdx));

      if (miniThumb) {
        miniThumb.src = item.src;
        miniThumb.alt = item.filename;
      }
      if (miniName) miniName.textContent = item.filename;
      if (miniCounter) miniCounter.textContent = `${numStr}/${totStr}`;
    };

    if (btnPrev) btnPrev.addEventListener('click', () => selectItem(this.currentGalleryIdx - 1));
    if (btnNext) btnNext.addEventListener('click', () => selectItem(this.currentGalleryIdx + 1));
    if (stageEl) stageEl.addEventListener('click', () => selectItem(this.currentGalleryIdx + 1));
    if (miniPrev) miniPrev.addEventListener('click', () => selectItem(this.currentGalleryIdx - 1));
    if (miniNext) miniNext.addEventListener('click', () => selectItem(this.currentGalleryIdx + 1));
    if (miniJump) miniJump.addEventListener('click', () => this.jumpToWidget('#resume-3d-viewer'));

    thumbBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.galleryIdx, 10);
        selectItem(idx);
      });
    });
  }

  jumpToWidget(selector) {
    const creativityBlock = this.container.querySelector('#block-creativity');
    if (creativityBlock && creativityBlock.style.display === 'none') {
      const allBtn = this.container.querySelector('.resume-filter-btn[data-filter="all"]');
      this.container.querySelectorAll('.resume-filter-btn').forEach((b) => b.classList.remove('active'));
      if (allBtn) allBtn.classList.add('active');
      this.applyFilter('all', false);
    }
    const target = this.container.querySelector(selector);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.remove('widget-jump-flash');
      void target.offsetWidth;
      target.classList.add('widget-jump-flash');
    }
  }

  /* --------------------------------------------------------------------------
     Real-Time Web Audio FFT Spectrum Visualizer & Music Video Player
     -------------------------------------------------------------------------- */
  formatMediaTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  ensureAudioGraph(videoEl) {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.audioCtx = new AudioCtx();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 1024; // 512 bins for fine bass/mid resolution across log scale
    this.analyser.smoothingTimeConstant = 0.78;
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.peakCaps = new Float32Array(64);

    try {
      this.mediaSource = this.audioCtx.createMediaElementSource(videoEl);
      this.mediaSource.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    } catch (err) {
      console.warn('ResumeViewer Web Audio graph init failed:', err);
    }
  }

  initAudioVisualizer() {
    const videoEl = this.container.querySelector('#resume-music-video');
    const canvas = this.container.querySelector('#resume-spectrum-canvas');
    const btnPlay = this.container.querySelector('#btn-audio-play');
    const btnPrev = this.container.querySelector('#btn-audio-prev');
    const btnNext = this.container.querySelector('#btn-audio-next');
    const volSlider = this.container.querySelector('#resume-audio-vol');
    const seekSlider = this.container.querySelector('#resume-audio-seek');
    const curLabel = this.container.querySelector('#resume-audio-cur');
    const durLabel = this.container.querySelector('#resume-audio-dur');
    const titleEl = this.container.querySelector('#resume-audio-title');
    const hintEl = this.container.querySelector('#resume-spectrum-hint');
    const trackBtns = this.container.querySelectorAll('.audio-track-btn');

    const miniMusicThumb = this.container.querySelector('#mini-music-thumb');
    const miniMusicName = this.container.querySelector('#mini-music-name');
    const miniMusicTime = this.container.querySelector('#mini-music-time');
    const miniMusicPlay = this.container.querySelector('#btn-mini-music-play');
    const miniMusicPrev = this.container.querySelector('#btn-mini-music-prev');
    const miniMusicNext = this.container.querySelector('#btn-mini-music-next');
    const miniMusicJump = this.container.querySelector('#btn-mini-jump-music');

    if (!videoEl || !canvas) return;
    videoEl.volume = volSlider ? parseFloat(volSlider.value) : 0.8;

    const updatePlayUI = () => {
      const playing = !videoEl.paused && !videoEl.ended;
      if (btnPlay) btnPlay.textContent = playing ? '⏸ Pause' : '▶ Play';
      if (miniMusicPlay) miniMusicPlay.textContent = playing ? '⏸' : '▶';
      if (hintEl) hintEl.style.opacity = playing ? '0' : '1';
    };

    const loadTrack = (idx, autoPlay = true) => {
      this.currentTrackIdx = (idx + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
      const track = MUSIC_TRACKS[this.currentTrackIdx];
      videoEl.src = track.src;
      if (track.poster) {
        videoEl.setAttribute('poster', track.poster);
      } else {
        videoEl.removeAttribute('poster');
      }
      if (titleEl) titleEl.textContent = `NOW PLAYING • ${track.title}`;
      if (miniMusicName) miniMusicName.textContent = track.title;
      if (miniMusicThumb && track.thumb) {
        miniMusicThumb.src = track.thumb;
        miniMusicThumb.alt = track.title;
      }
      if (miniMusicTime) miniMusicTime.textContent = '0:00';
      trackBtns.forEach((btn, i) => btn.classList.toggle('active', i === this.currentTrackIdx));
      if (seekSlider) seekSlider.value = '0';
      if (curLabel) curLabel.textContent = '0:00';
      if (durLabel) durLabel.textContent = '0:00';

      if (autoPlay) {
        this.ensureAudioGraph(videoEl);
        videoEl.play().catch(() => {});
      }
      updatePlayUI();
    };

    const togglePlay = () => {
      this.ensureAudioGraph(videoEl);
      if (videoEl.paused || videoEl.ended) {
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    };

    if (btnPlay) btnPlay.addEventListener('click', togglePlay);
    if (miniMusicPlay) miniMusicPlay.addEventListener('click', togglePlay);
    videoEl.addEventListener('click', togglePlay);
    if (btnPrev) btnPrev.addEventListener('click', () => loadTrack(this.currentTrackIdx - 1, true));
    if (btnNext) btnNext.addEventListener('click', () => loadTrack(this.currentTrackIdx + 1, true));
    if (miniMusicPrev) miniMusicPrev.addEventListener('click', () => loadTrack(this.currentTrackIdx - 1, true));
    if (miniMusicNext) miniMusicNext.addEventListener('click', () => loadTrack(this.currentTrackIdx + 1, true));
    if (miniMusicJump) miniMusicJump.addEventListener('click', () => this.jumpToWidget('#resume-music-player'));

    trackBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.trackIdx, 10);
        if (idx === this.currentTrackIdx && !videoEl.paused) {
          videoEl.pause();
        } else {
          loadTrack(idx, true);
        }
      });
    });

    if (volSlider) {
      volSlider.addEventListener('input', () => {
        videoEl.volume = parseFloat(volSlider.value);
      });
    }

    if (seekSlider) {
      let isSeeking = false;
      let pendingSeekRatio = null;

      const applySeek = () => {
        const ratio = Math.max(0, Math.min(1, parseFloat(seekSlider.value) / 100));
        if (videoEl.readyState >= 1 && Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
          videoEl.currentTime = ratio * videoEl.duration;
          pendingSeekRatio = null;
        } else {
          pendingSeekRatio = ratio;
        }
      };

      seekSlider.addEventListener('pointerdown', () => { isSeeking = true; });
      window.addEventListener('pointerup', () => { isSeeking = false; });
      seekSlider.addEventListener('input', applySeek);
      seekSlider.addEventListener('change', () => {
        applySeek();
        isSeeking = false;
      });

      videoEl.addEventListener('loadedmetadata', () => {
        if (durLabel) durLabel.textContent = this.formatMediaTime(videoEl.duration);
        if (pendingSeekRatio !== null && Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
          videoEl.currentTime = pendingSeekRatio * videoEl.duration;
          pendingSeekRatio = null;
        }
      });

      videoEl.addEventListener('timeupdate', () => {
        const formatted = this.formatMediaTime(videoEl.currentTime);
        if (curLabel) curLabel.textContent = formatted;
        if (miniMusicTime) miniMusicTime.textContent = formatted;
        if (!isSeeking && seekSlider && Number.isFinite(videoEl.duration) && videoEl.duration > 0) {
          seekSlider.value = String((videoEl.currentTime / videoEl.duration) * 100);
        }
      });
    } else {
      videoEl.addEventListener('loadedmetadata', () => {
        if (durLabel) durLabel.textContent = this.formatMediaTime(videoEl.duration);
      });

      videoEl.addEventListener('timeupdate', () => {
        if (curLabel) curLabel.textContent = this.formatMediaTime(videoEl.currentTime);
      });
    }

    videoEl.addEventListener('play', updatePlayUI);
    videoEl.addEventListener('pause', updatePlayUI);
    videoEl.addEventListener('ended', () => loadTrack(this.currentTrackIdx + 1, true));

    // Automatically cycle to track 2 and back to track 1 on initial load so timeline seeking is primed
    if (MUSIC_TRACKS.length > 1) {
      loadTrack(1, false);
      loadTrack(0, false);
    }

    updatePlayUI();
    this.startAudioLoop(canvas, videoEl);
  }

  startAudioLoop(canvas, videoEl) {
    if (this.audioAnimId) cancelAnimationFrame(this.audioAnimId);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 48;
    const renderSpectrum = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Subtle horizontal grid lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, Math.floor(h * 0.33), w, 1);
      ctx.fillRect(0, Math.floor(h * 0.66), w, 1);

      const isPlaying = videoEl && !videoEl.paused && !videoEl.ended;
      if (this.analyser && this.freqData && isPlaying) {
        this.analyser.getByteFrequencyData(this.freqData);
      }

      const gap = 3;
      const barW = Math.max(3, (w - gap * (barCount - 1)) / barCount);

      // Map bars logarithmically from ~45 Hz (bin 1) to ~11 kHz (~bin 260 of 512)
      const minBin = 1;
      const maxBin = this.freqData ? Math.min(this.freqData.length - 1, 260) : 260;

      for (let i = 0; i < barCount; i++) {
        let norm = 0.04;
        if (this.analyser && this.freqData && isPlaying) {
          const t0 = i / barCount;
          const t1 = (i + 1) / barCount;
          const bStart = Math.floor(minBin * Math.pow(maxBin / minBin, t0));
          const bEnd = Math.max(bStart + 1, Math.floor(minBin * Math.pow(maxBin / minBin, t1)));

          let sum = 0;
          let count = 0;
          for (let b = bStart; b < bEnd && b < this.freqData.length; b++) {
            sum += this.freqData[b];
            count++;
          }
          const avg = count > 0 ? sum / count / 255 : 0;
          // Gentle perceptual tilt so mids & highs fill out the full spectrum naturally
          const tilt = 1 + t0 * 0.75;
          norm = Math.max(0.04, Math.min(1, Math.pow(avg * tilt, 0.92)));
        }

        if (!this.peakCaps || this.peakCaps.length < barCount) {
          this.peakCaps = new Float32Array(barCount);
        }
        if (norm >= this.peakCaps[i]) {
          this.peakCaps[i] = norm;
        } else {
          this.peakCaps[i] = Math.max(0.04, this.peakCaps[i] - 0.015);
        }

        const x = i * (barW + gap);
        const barH = Math.max(3, norm * (h - 8));
        const y = h - barH;

        const pct = i / barCount;
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        if (pct < 0.45) {
          grad.addColorStop(0, '#ff5d8f');
          grad.addColorStop(1, '#ff9ec4');
        } else if (pct < 0.75) {
          grad.addColorStop(0, '#a855f7');
          grad.addColorStop(1, '#38bdf8');
        } else {
          grad.addColorStop(0, '#0ea5e9');
          grad.addColorStop(1, '#67e8f9');
        }

        ctx.fillStyle = isPlaying ? grad : 'rgba(148, 163, 184, 0.25)';
        ctx.fillRect(x, y, barW, barH);

        // Peak cap
        if (isPlaying && this.peakCaps[i] > 0.06) {
          const capY = h - Math.max(4, this.peakCaps[i] * (h - 8)) - 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, Math.max(0, capY), barW, 2);
        }
      }

      this.audioAnimId = requestAnimationFrame(renderSpectrum);
    };

    renderSpectrum();
  }

  pauseMedia() {
    const videoEl = this.container?.querySelector('#resume-music-video');
    if (videoEl && !videoEl.paused) {
      videoEl.pause();
    }
  }

  destroy() {
    if (this.audioAnimId) {
      cancelAnimationFrame(this.audioAnimId);
      this.audioAnimId = null;
    }
    this.pauseMedia();
  }
}

