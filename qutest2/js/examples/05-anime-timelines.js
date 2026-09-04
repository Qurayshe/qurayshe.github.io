export default {
  id: 'anime-timelines',
  title: 'Multi-Stage Timeline Choreography & Keyframes',
  category: 'Anime.js Motion Mastery',
  badge: 'Anime.js',
  badgeClass: 'badge-anime',
  difficulty: 'Intermediate',
  description: 'Master complex timeline choreography using relative time offsets (-=300), property keyframe arrays, and interactive scrubbers.',

  tutorial: {
    overview: `
      An <strong>Anime.js Timeline</strong> lets you synchronize and orchestrate dozens of individual animations into a single cohesive sequence.
      <br><br>
      Using relative timeline offsets (e.g. <code>'-=500'</code>) allows downstream animations to start before preceding animations finish, creating fluid overlapping choreography.
    `,
    keyConcepts: [
      { name: 'timeline.add(params, offset)', desc: 'Appends an animation step at an absolute ms position or relative timestamp like "-=400" or "+=200".' },
      { name: 'Property Keyframes', desc: 'Pass an array of keyframe objects to animate a property through multiple sequential stages.' },
      { name: 'timeline.seek(time)', desc: 'Directly scrubs playback head to any exact point in time across all nested animations.' }
    ],
    tips: 'Use the timeline scrubber slider in the HUD below or click Reverse to test bidirectional keyframing.'
  },

  init(container, onStatsUpdate) {
    container.innerHTML = '';

    const stage = document.createElement('div');
    stage.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #1b102b 0%, #080310 100%);
      font-family: 'JetBrains Mono', monospace;
    `;

    stage.innerHTML = `
      <div id="hud-panel" style="width: 520px; background: rgba(22, 14, 35, 0.9); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 16px; padding: 2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.6); backdrop-filter: blur(12px); display: flex; flex-direction: column; gap: 1.5rem; position: relative; overflow: hidden;">
        
        <!-- Glowing scanline -->
        <div id="hud-scanline" style="position: absolute; top:0; left:0; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #c084fc, transparent); opacity: 0;"></div>

        <!-- Top Header -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div id="reactor-status-dot" style="width: 10px; height: 10px; border-radius: 50%; background: #6b21a8;"></div>
            <span style="font-size: 0.85rem; font-weight: 700; color: #f1f5f9; letter-spacing: 0.05em;">QUANTUM CORE REACTOR</span>
          </div>
          <span id="reactor-pct" style="font-size: 1.1rem; font-weight: 800; color: #c084fc;">0%</span>
        </div>

        <!-- Central Gauge & Visual Rings -->
        <div style="display: flex; justify-content: center; align-items: center; height: 160px; position: relative;">
          <!-- SVG Circles -->
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="60" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="6" />
            <circle id="gauge-circle" cx="75" cy="75" r="60" fill="none" stroke="#c084fc" stroke-width="6" 
              stroke-dasharray="377" stroke-dashoffset="377" stroke-linecap="round" transform="rotate(-90 75 75)" />
          </svg>
          <!-- Inner Core Cube -->
          <div id="core-cube" style="position: absolute; width: 50px; height: 50px; background: linear-gradient(135deg, #7f00ff, #ffffff); border-radius: 10px; box-shadow: 0 0 22px rgba(192, 132, 252, 0.5); transform: scale(0) rotate(0deg);"></div>
        </div>

        <!-- Staggered Progress Bars -->
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div class="hud-channel" style="display: flex; flex-direction: column; gap: 0.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #94a3b8;">
              <span>POWER FLUX AMPLIFIER</span>
              <span class="bar-val">0 MW</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
              <div class="hud-bar-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #a855f7, #ffffff); border-radius: 3px;"></div>
            </div>
          </div>

          <div class="hud-channel" style="display: flex; flex-direction: column; gap: 0.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #94a3b8;">
              <span>MAGNETIC CONTAINMENT</span>
              <span class="bar-val">0 T</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
              <div class="hud-bar-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #7f00ff, #c084fc); border-radius: 3px;"></div>
            </div>
          </div>

          <div class="hud-channel" style="display: flex; flex-direction: column; gap: 0.25rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: #94a3b8;">
              <span>IONIC STABILIZER</span>
              <span class="bar-val">0 GHz</span>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
              <div class="hud-bar-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #c084fc, #e9d5ff); border-radius: 3px;"></div>
            </div>
          </div>
        </div>

        <!-- Footer Data Stream -->
        <div id="hud-footer-tags" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <span class="footer-chip" style="padding: 0.2rem 0.6rem; font-size: 0.68rem; background: rgba(255,255,255,0.05); border-radius: 4px; color: #94a3b8; opacity: 0;">STAGE 1: SYNC</span>
          <span class="footer-chip" style="padding: 0.2rem 0.6rem; font-size: 0.68rem; background: rgba(255,255,255,0.05); border-radius: 4px; color: #94a3b8; opacity: 0;">STAGE 2: CHARGE</span>
          <span class="footer-chip" style="padding: 0.2rem 0.6rem; font-size: 0.68rem; background: rgba(255,255,255,0.05); border-radius: 4px; color: #94a3b8; opacity: 0;">STAGE 3: CRITICAL</span>
        </div>
      </div>
    `;

    container.appendChild(stage);

    let tl = null;

    function buildTimeline() {
      if (tl) tl.pause();

      const pctEl = stage.querySelector('#reactor-pct');
      const pctObj = { val: 0 };

      tl = anime.timeline({
        loop: true,
        autoplay: true,
        direction: 'alternate',
        update: (anim) => {
          if (onStatsUpdate) {
            onStatsUpdate({
              reactorState: Math.round(anim.progress) > 85 ? 'CRITICAL MAXIMUM' : 'OPERATIONAL',
              fluxOutput: (anim.progress * 4.2).toFixed(1) + ' GW',
              timelineProgress: Math.round(anim.progress) + '%'
            });
          }
        }
      });

      // 1. Scanline sweep
      tl.add({
        targets: '#hud-scanline',
        top: ['0%', '100%'],
        opacity: [0, 1, 0],
        duration: 1000,
        easing: 'easeInOutQuad'
      })
      // 2. Status Dot Pulse
      .add({
        targets: '#reactor-status-dot',
        backgroundColor: ['#6b21a8', '#c084fc', '#ffffff'],
        boxShadow: '0 0 14px #c084fc',
        scale: [1, 1.4, 1],
        duration: 800,
        easing: 'easeInOutSine'
      }, '-=600')
      // 3. Counter & Gauge Circle fill
      .add({
        targets: pctObj,
        val: 100,
        round: 1,
        duration: 1600,
        easing: 'easeInOutCubic',
        update: () => {
          if (pctEl) pctEl.innerText = pctObj.val + '%';
        }
      }, '-=400')
      .add({
        targets: '#gauge-circle',
        strokeDashoffset: [377, 0],
        duration: 1600,
        easing: 'easeInOutCubic'
      }, '-=1600')
      // 4. Core Cube Pop & Spin Keyframes
      .add({
        targets: '#core-cube',
        keyframes: [
          { scale: 1, rotate: 90, duration: 800, easing: 'easeOutBack' },
          { rotate: 225, borderRadius: '50%', duration: 600, easing: 'easeInOutQuad' },
          { scale: 1.15, rotate: 360, borderRadius: '10px', duration: 600, easing: 'easeOutElastic(1, .8)' }
        ]
      }, '-=1400')
      // 5. Staggered Bar Fills
      .add({
        targets: '.hud-bar-fill',
        width: ['0%', '100%'],
        duration: 1000,
        delay: anime.stagger(150),
        easing: 'easeOutExpo'
      }, '-=800')
      // 6. Footer Chips Reveal
      .add({
        targets: '.footer-chip',
        opacity: [0, 1],
        translateY: [10, 0],
        delay: anime.stagger(120),
        duration: 500,
        easing: 'easeOutQuart'
      }, '-=500')
      .add({
        duration: 1500 // Hold before reverse
      });
    }

    buildTimeline();

    return {
      timeline: tl,
      destroy() {
        if (tl) tl.pause();
        container.innerHTML = '';
      },
      play() { tl?.play(); },
      pause() { tl?.pause(); },
      restart() { tl?.restart(); },
      seek(progressPercent) {
        if (tl) {
          tl.pause();
          tl.seek((progressPercent / 100) * tl.duration);
        }
      },
      getProgress() {
        if (!tl || !tl.duration) return { progress: 0, time: 0 };
        return {
          progress: (tl.currentTime / tl.duration) * 100,
          time: tl.currentTime / 1000
        };
      },
      getControls() {
        return [
          {
            type: 'button',
            label: 'Restart Sequence',
            onClick: () => { tl?.restart(); }
          },
          {
            type: 'button',
            label: 'Reverse Direction',
            onClick: () => { tl?.reverse(); tl?.play(); }
          }
        ];
      },
      codeSnippet: `// 1. Initialize master Anime.js timeline
const tl = anime.timeline({
  loop: true,
  direction: 'alternate'
});

// 2. Add steps with relative offsets & keyframe arrays
tl.add({
  targets: '#hud-scanline',
  top: ['0%', '100%'],
  opacity: [0, 1, 0],
  duration: 1000
})
.add({
  targets: '#gauge-circle',
  strokeDashoffset: [377, 0],
  duration: 1600,
  easing: 'easeInOutCubic'
}, '-=600') // Overlap start by 600ms
.add({
  targets: '#core-cube',
  keyframes: [
    { scale: 1, rotate: 90, duration: 800, easing: 'easeOutBack' },
    { rotate: 225, borderRadius: '50%', duration: 600 },
    { scale: 1.15, rotate: 360, borderRadius: '10px', duration: 600 }
  ]
}, '-=1400')
.add({
  targets: '.hud-bar-fill',
  width: ['0%', '100%'],
  delay: anime.stagger(150),
  duration: 1000,
  easing: 'easeOutExpo'
}, '-=800');`
    };
  }
};

