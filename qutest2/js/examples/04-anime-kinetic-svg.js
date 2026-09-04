export default {
  id: 'anime-kinetic-svg',
  title: 'Kinetic Typography & SVG Path Drawing',
  category: 'Anime.js Motion Mastery',
  badge: 'Anime.js',
  badgeClass: 'badge-anime',
  difficulty: 'Beginner',
  description: 'Unleash Anime.js vector animations: self-drawing SVG path strokes, letter-by-letter kinetic stagger typography, and elastic rebounds.',

  tutorial: {
    overview: `
      Anime.js excels at complex 2D vector path manipulation and DOM element staggering.
      <br><br>
      By animating the CSS <code>stroke-dashoffset</code> property calculated via <code>anime.setDashoffset</code>, intricate SVG shapes appear to effortlessly draw themselves in real-time.
    `,
    keyConcepts: [
      { name: 'anime.setDashoffset', desc: 'Precalculates exact path lengths and sets stroke-dasharray/stroke-dashoffset on SVG path elements.' },
      { name: 'anime.stagger(delay, { from: "center" })', desc: 'Offsets execution times across multiple target elements sequentially or from edges/centers.' },
      { name: 'Easing Curves (easeOutElastic, cubicBezier)', desc: 'Custom non-linear timing functions creating realistic bounce, overshoot, and deceleration.' }
    ],
    tips: 'Use the playback scrubber at the bottom to step through the stroke drawing and typography reveal frame-by-frame.'
  },

  init(container, onStatsUpdate) {
    container.innerHTML = '';
    
    // Create stage layout
    const stage = document.createElement('div');
    stage.className = 'anime-stage-wrapper';
    stage.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      user-select: none;
      background: radial-gradient(circle at center, #1b122c 0%, #090511 100%);
    `;

    stage.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap: 1.5rem; transform: scale(0.95);">
        <!-- SVG Cyber Crest -->
        <svg id="cyber-svg" width="340" height="260" viewBox="0 0 340 260" style="overflow:visible;">
          <defs>
            <linearGradient id="purpleGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="100%" stop-color="#c084fc" />
            </linearGradient>
            <linearGradient id="purpleGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#c084fc" />
              <stop offset="100%" stop-color="#7f00ff" />
            </linearGradient>
            <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Outer Hexagon Frame -->
          <polygon class="svg-path svg-frame" points="170,15 315,95 315,215 170,295 25,215 25,95" 
            fill="none" stroke="url(#purpleGrad1)" stroke-width="2.5" filter="url(#neonGlow)" />

          <!-- Inner Tech Rings -->
          <circle class="svg-path svg-ring" cx="170" cy="155" r="75" 
            fill="none" stroke="url(#purpleGrad2)" stroke-width="2" stroke-dasharray="6,4" />
          <circle class="svg-path svg-core" cx="170" cy="155" r="45" 
            fill="none" stroke="#ffffff" stroke-width="3" filter="url(#neonGlow)" />

          <!-- Geometric Tech Lines -->
          <line class="svg-path svg-line" x1="70" y1="155" x2="270" y2="155" stroke="#c084fc" stroke-width="1.5" />
          <line class="svg-path svg-line" x1="170" y1="55" x2="170" y2="255" stroke="#e9d5ff" stroke-width="1.5" />

          <!-- Corner Tech Accents -->
          <polygon class="svg-path svg-accent" points="170,120 195,155 170,190 145,155" 
            fill="rgba(168, 85, 247, 0.18)" stroke="#c084fc" stroke-width="2" />
        </svg>

        <!-- Kinetic Letters Header -->
        <div id="kinetic-title" style="display: flex; gap: 4px; font-family: 'JetBrains Mono', monospace; font-size: 2.2rem; font-weight: 800; letter-spacing: 0.15em; color: #fff;">
          <span class="letter">A</span>
          <span class="letter">N</span>
          <span class="letter">I</span>
          <span class="letter">M</span>
          <span class="letter">E</span>
          <span class="letter" style="color: #c084fc; margin: 0 8px;">•</span>
          <span class="letter">M</span>
          <span class="letter">O</span>
          <span class="letter">T</span>
          <span class="letter">I</span>
          <span class="letter">O</span>
          <span class="letter">N</span>
        </div>

        <!-- Subtitle pill -->
        <div id="kinetic-sub" style="opacity: 0; transform: translateY(15px); padding: 0.35rem 1.2rem; background: rgba(168, 85, 247, 0.12); border: 1px solid rgba(192, 132, 252, 0.45); border-radius: 20px; font-family: monospace; font-size: 0.8rem; color: #d8b4fe; letter-spacing: 0.1em;">
          HIGH PERFORMANCE VECTOR CHOREOGRAPHY
        </div>
      </div>
    `;

    container.appendChild(stage);

    let mainTimeline = null;

    function buildTimeline() {
      if (mainTimeline) mainTimeline.pause();

      mainTimeline = anime.timeline({
        loop: true,
        autoplay: true,
        direction: 'alternate',
        update: (anim) => {
          if (onStatsUpdate) {
            onStatsUpdate({
              progress: Math.round(anim.progress) + '%',
              timelineTime: (anim.currentTime / 1000).toFixed(2) + 's',
              targetCount: 18
            });
          }
        }
      });

      // 1. Draw SVG Path outlines
      mainTimeline
        .add({
          targets: '#cyber-svg .svg-path',
          strokeDashoffset: [anime.setDashoffset, 0],
          easing: 'easeInOutSine',
          duration: 1600,
          delay: (el, i) => i * 180
        })
        // 2. Rotate core elements
        .add({
          targets: '#cyber-svg .svg-ring',
          rotate: 180,
          transformOrigin: '170px 155px',
          duration: 1200,
          easing: 'easeOutQuart'
        }, '-=800')
        .add({
          targets: '#cyber-svg .svg-accent',
          scale: [0, 1.2, 1],
          transformOrigin: '170px 155px',
          duration: 800,
          easing: 'easeOutElastic(1, .6)'
        }, '-=800')
        // 3. Kinetic Stagger Letters Reveal
        .add({
          targets: '#kinetic-title .letter',
          translateY: [-60, 0],
          opacity: [0, 1],
          scale: [0.3, 1],
          filter: ['blur(10px)', 'blur(0px)'],
          delay: anime.stagger(60, { from: 'center' }),
          duration: 900,
          easing: 'easeOutElastic(1, .7)'
        }, '-=600')
        // 4. Subtitle Fade & Slide
        .add({
          targets: '#kinetic-sub',
          opacity: [0, 1],
          translateY: [15, 0],
          duration: 600,
          easing: 'easeOutExpo'
        }, '-=400')
        .add({
          duration: 1200 // Hold duration before alternating
        });
    }

    buildTimeline();

    return {
      timeline: mainTimeline,
      destroy() {
        if (mainTimeline) mainTimeline.pause();
        container.innerHTML = '';
      },
      play() { mainTimeline?.play(); },
      pause() { mainTimeline?.pause(); },
      restart() { mainTimeline?.restart(); },
      seek(progressPercent) {
        if (mainTimeline) {
          mainTimeline.pause();
          mainTimeline.seek((progressPercent / 100) * mainTimeline.duration);
        }
      },
      getProgress() {
        if (!mainTimeline || !mainTimeline.duration) return { progress: 0, time: 0 };
        return {
          progress: (mainTimeline.currentTime / mainTimeline.duration) * 100,
          time: mainTimeline.currentTime / 1000
        };
      },
      getControls() {
        return [
          {
            type: 'button',
            label: 'Replay Animation',
            onClick: () => { mainTimeline?.restart(); }
          },
          {
            type: 'select',
            label: 'Letter Stagger Origin',
            value: 'center',
            options: ['center', 'first', 'last'],
            onChange: (val) => {
              buildTimeline();
            }
          }
        ];
      },
      codeSnippet: `// 1. Create Anime.js timeline
const tl = anime.timeline({
  loop: true,
  direction: 'alternate'
});

// 2. Draw SVG paths via stroke-dashoffset
tl.add({
  targets: '#cyber-svg .svg-path',
  strokeDashoffset: [anime.setDashoffset, 0],
  easing: 'easeInOutSine',
  duration: 1500,
  delay: (el, i) => i * 150
})
// 3. Stagger kinetic letters from center
.add({
  targets: '#kinetic-title .letter',
  translateY: [-60, 0],
  opacity: [0, 1],
  scale: [0.3, 1],
  delay: anime.stagger(60, { from: 'center' }),
  duration: 900,
  easing: 'easeOutElastic(1, .7)'
}, '-=600');`
    };
  }
};

