export default {
  id: 'anime-stagger-grid',
  title: 'Elastic Matrix Staggering & Ripple Physics',
  category: 'Anime.js Motion Mastery',
  badge: 'Anime.js',
  badgeClass: 'badge-anime',
  difficulty: 'Intermediate',
  description: 'Experience 2D matrix staggering with interactive cursor-driven radial ripple waves, spring dynamics, and directional staggering.',

  tutorial: {
    overview: `
      Anime.js features a dedicated grid stagger engine. By passing <code>grid: [rows, columns]</code> and a <code>from: index</code> coordinate, Anime.js automatically calculates Euclidian distances from any origin node and propagates ripple animations across the 2D matrix.
    `,
    keyConcepts: [
      { name: 'anime.stagger(val, { grid, from })', desc: 'Calculates distance-based delay offsets from center, edges, or specific clicked grid coordinates.' },
      { name: 'Spring Easing Curves', desc: 'Anime.js physics springs: spring(mass, stiffness, damping, velocity).' },
      { name: 'Matrix Transformations', desc: 'Simultaneous coordinated transforms (scale, rotate, translate, background colors).' }
    ],
    tips: 'Click anywhere on the glowing matrix below to trigger a dynamic radial shockwave from that exact cell!'
  },

  init(container, onStatsUpdate) {
    container.innerHTML = '';

    const cols = 14;
    const rows = 10;
    const totalCells = cols * rows;

    const stage = document.createElement('div');
    stage.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, #1c112d 0%, #080311 100%);
      user-select: none;
    `;

    const gridContainer = document.createElement('div');
    gridContainer.id = 'stagger-matrix';
    gridContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${cols}, 1fr);
      gap: 8px;
      padding: 1.5rem;
      background: rgba(22, 14, 35, 0.7);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 16px;
      box-shadow: 0 15px 40px rgba(0,0,0,0.5);
    `;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.index = i;
      cell.style.cssText = `
        width: 32px;
        height: 32px;
        background: rgba(168, 85, 247, 0.15);
        border: 1px solid rgba(168, 85, 247, 0.35);
        border-radius: 6px;
        cursor: pointer;
        transition: border-color 0.2s;
      `;
      cell.addEventListener('mouseenter', () => {
        cell.style.borderColor = '#c084fc';
      });
      cell.addEventListener('mouseleave', () => {
        cell.style.borderColor = 'rgba(168, 85, 247, 0.35)';
      });
      gridContainer.appendChild(cell);
    }

    stage.appendChild(gridContainer);
    container.appendChild(stage);

    let activeAnim = null;
    let selectedMode = 'ripple';

    function triggerWave(fromIndex = 'center') {
      if (activeAnim) activeAnim.pause();

      if (selectedMode === 'ripple') {
        activeAnim = anime({
          targets: '#stagger-matrix .grid-cell',
          scale: [
            { value: 0.2, easing: 'easeOutSine', duration: 300 },
            { value: 1.2, easing: 'easeInOutQuad', duration: 400 },
            { value: 1.0, easing: 'easeOutElastic(1, .5)', duration: 600 }
          ],
          rotate: [
            { value: 90, easing: 'easeInOutQuad', duration: 500 },
            { value: 0, easing: 'easeOutElastic(1, .6)', duration: 600 }
          ],
          backgroundColor: [
            { value: '#ffffff', duration: 200 },
            { value: '#a855f7', duration: 400 },
            { value: 'rgba(168, 85, 247, 0.15)', duration: 600 }
          ],
          delay: anime.stagger(30, {
            grid: [cols, rows],
            from: fromIndex
          }),
          complete: () => {
            if (onStatsUpdate) {
              onStatsUpdate({
                status: 'Idle (Click any cell)',
                lastTriggerIndex: fromIndex.toString()
              });
            }
          }
        });
      } else if (selectedMode === 'spiral') {
        activeAnim = anime({
          targets: '#stagger-matrix .grid-cell',
          translateY: [
            { value: -30, duration: 400, easing: 'easeOutCubic' },
            { value: 0, duration: 600, easing: 'easeOutBounce' }
          ],
          rotateZ: [
            { value: 180, duration: 600, easing: 'easeInOutQuad' },
            { value: 0, duration: 500, easing: 'easeOutElastic(1, .8)' }
          ],
          backgroundColor: ['#c084fc', 'rgba(168, 85, 247, 0.15)'],
          delay: anime.stagger(25, {
            grid: [cols, rows],
            from: fromIndex,
            axis: 'x'
          })
        });
      }

      if (onStatsUpdate) {
        onStatsUpdate({
          gridSize: `${cols} x ${rows} (${totalCells} nodes)`,
          origin: fromIndex.toString(),
          mode: selectedMode
        });
      }
    }

    gridContainer.addEventListener('click', (e) => {
      const cell = e.target.closest('.grid-cell');
      if (cell) {
        const idx = parseInt(cell.dataset.index, 10);
        triggerWave(idx);
      }
    });

    // Auto trigger initial wave from center
    triggerWave('center');

    return {
      destroy() {
        if (activeAnim) activeAnim.pause();
        container.innerHTML = '';
      },
      play() { activeAnim?.play(); },
      pause() { activeAnim?.pause(); },
      restart() { triggerWave('center'); },
      seek(progressPercent) {
        if (activeAnim && activeAnim.duration) {
          activeAnim.pause();
          activeAnim.seek((progressPercent / 100) * activeAnim.duration);
        }
      },
      getProgress() {
        if (!activeAnim || !activeAnim.duration) return { progress: 0, time: 0 };
        return {
          progress: (activeAnim.currentTime / activeAnim.duration) * 100,
          time: activeAnim.currentTime / 1000
        };
      },
      getControls() {
        return [
          {
            type: 'select',
            label: 'Wave Motion Type',
            value: selectedMode,
            options: ['ripple', 'spiral'],
            onChange: (val) => {
              selectedMode = val;
              triggerWave('center');
            }
          },
          {
            type: 'button',
            label: 'Pulse from Center',
            onClick: () => triggerWave('center')
          },
          {
            type: 'button',
            label: 'Pulse from Top-Left',
            onClick: () => triggerWave(0)
          },
          {
            type: 'button',
            label: 'Pulse from Bottom-Right',
            onClick: () => triggerWave(totalCells - 1)
          }
        ];
      },
      codeSnippet: `// 1. Setup 2D Grid Stagger animation
anime({
  targets: '#stagger-matrix .grid-cell',
  scale: [
    { value: 0.2, easing: 'easeOutSine', duration: 300 },
    { value: 1.2, easing: 'easeInOutQuad', duration: 400 },
    { value: 1.0, easing: 'easeOutElastic(1, .5)', duration: 600 }
  ],
  backgroundColor: [
    { value: '#00f2fe', duration: 200 },
    { value: '#e100ff', duration: 400 },
    { value: 'rgba(0, 242, 254, 0.15)', duration: 600 }
  ],
  // 2. Anime.js calculates 2D Euclidean distance from origin
  delay: anime.stagger(30, {
    grid: [14, 10],     // [columns, rows]
    from: clickedIndex  // 'center', 'first', 'last' or exact index
  })
});`
    };
  }
};

