/**
 * Terminal Boot Loader
 * Displays a retro BIOS/UNIX terminal boot sequence on initial visit to prevent
 * font pop-in (FOUT) and layout shifts while Three.js canvases, shaders, and web fonts load.
 * 
 * Features:
 * - Animated ASCII Braille throbber in header, active task status, and prompt
 * - Rapid left-to-right typewriter console logging
 * - Coordinated scanline typewriter across all three bottom ASCII art figures (Kirby, Yuuka, Miyabi)
 *   printed inline row-by-row, left-to-right, top-to-bottom as a unified terminal canvas
 */

export class TerminalLoader {
  static STORAGE_KEY = 'qurayshe_booted';
  static THROBBER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  static isBooted() {
    try {
      return sessionStorage.getItem(TerminalLoader.STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  static async init() {
    const screen = document.getElementById('terminal-boot-screen');
    if (!screen) return;

    // Skip immediately if the user has already booted this session
    if (TerminalLoader.isBooted()) {
      screen.remove();
      return;
    }

    const logContainer = document.getElementById('terminal-boot-log');
    const skipBtn = document.getElementById('terminal-boot-skip');
    const headerThrobber = document.getElementById('terminal-header-throbber');
    const promptTarget = document.getElementById('terminal-prompt-target');

    const kirbyPre = screen.querySelector('.ascii-kirby');
    const yuukaPre = screen.querySelector('.ascii-yuuka');
    const miyabiPre = screen.querySelector('.ascii-miyabi');

    let dismissed = false;
    let throbberTimer = null;
    let currentThrobberChar = TerminalLoader.THROBBER_FRAMES[0];

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, dismissed ? 0 : ms));

    // Save pristine text for instant clean skip/restore
    const originalKirbyText = kirbyPre ? kirbyPre.textContent : '';
    const originalYuukaText = yuukaPre ? yuukaPre.textContent : '';
    const originalMiyabiText = miyabiPre ? miyabiPre.textContent : '';

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;

      if (throbberTimer) {
        clearInterval(throbberTimer);
        throbberTimer = null;
      }

      try {
        sessionStorage.setItem(TerminalLoader.STORAGE_KEY, 'true');
      } catch {
        // Silently handle private mode or quota limits
      }

      document.removeEventListener('keydown', onKeyDown);
      screen.removeEventListener('click', onClick);

      // Restore full text and release layout locks immediately
      if (kirbyPre) {
        kirbyPre.style.width = '';
        kirbyPre.style.height = '';
        kirbyPre.textContent = originalKirbyText;
      }
      if (yuukaPre) {
        yuukaPre.style.width = '';
        yuukaPre.style.height = '';
        yuukaPre.textContent = originalYuukaText;
      }
      if (miyabiPre) {
        miyabiPre.style.width = '';
        miyabiPre.style.height = '';
        miyabiPre.textContent = originalMiyabiText;
      }

      screen.classList.add('terminal-fade-out');
      setTimeout(() => {
        try {
          screen.remove();
        } catch {
          screen.style.display = 'none';
        }
      }, 450);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        dismiss();
      }
    };

    const onClick = () => {
      dismiss();
    };

    document.addEventListener('keydown', onKeyDown);
    screen.addEventListener('click', onClick);

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss();
      });
    }

    // Central ASCII Throbber Interval (cycles synchronized frames)
    let throbberIdx = 0;
    throbberTimer = setInterval(() => {
      if (dismissed) return;
      throbberIdx = (throbberIdx + 1) % TerminalLoader.THROBBER_FRAMES.length;
      currentThrobberChar = TerminalLoader.THROBBER_FRAMES[throbberIdx];
      const throbbers = screen.querySelectorAll('.terminal-throbber');
      throbbers.forEach((th) => {
        th.textContent = currentThrobberChar;
      });
    }, 70);

    // Prepare ASCII Art lines and pre-allocate fixed line slots
    const kirbyLines = originalKirbyText.replace(/\r/g, '').split('\n');
    const yuukaLines = originalYuukaText.replace(/\r/g, '').split('\n');
    const miyabiLines = originalMiyabiText.replace(/\r/g, '').split('\n');

    let kirbySpans = [];
    let yuukaSpans = [];
    let miyabiSpans = [];

    if (kirbyPre && yuukaPre && miyabiPre) {
      const kRect = kirbyPre.getBoundingClientRect();
      const yRect = yuukaPre.getBoundingClientRect();
      const mRect = miyabiPre.getBoundingClientRect();

      if (kRect.width && kRect.height) {
        kirbyPre.style.width = `${kRect.width}px`;
        kirbyPre.style.height = `${kRect.height}px`;
      }
      if (yRect.width && yRect.height) {
        yuukaPre.style.width = `${yRect.width}px`;
        yuukaPre.style.height = `${yRect.height}px`;
      }
      if (mRect.width && mRect.height) {
        miyabiPre.style.width = `${mRect.width}px`;
        miyabiPre.style.height = `${mRect.height}px`;
      }

      kirbyPre.innerHTML = '';
      yuukaPre.innerHTML = '';
      miyabiPre.innerHTML = '';

      kirbySpans = kirbyLines.map(() => {
        const span = document.createElement('span');
        span.className = 'ascii-line';
        kirbyPre.appendChild(span);
        return span;
      });

      yuukaSpans = yuukaLines.map(() => {
        const span = document.createElement('span');
        span.className = 'ascii-line';
        yuukaPre.appendChild(span);
        return span;
      });

      miyabiSpans = miyabiLines.map(() => {
        const span = document.createElement('span');
        span.className = 'ascii-line';
        miyabiPre.appendChild(span);
        return span;
      });
    }

    // Coordinated scanline typewriter across all three ASCII figures
    const runAsciiArtTypewriter = async () => {
      const maxLines = Math.max(kirbyLines.length, yuukaLines.length, miyabiLines.length);

      for (let i = 0; i < maxLines; i++) {
        if (dismissed) return;

        // 1. Kirby (Left)
        if (i < kirbyLines.length) {
          const line = kirbyLines[i];
          const span = kirbySpans[i];
          const len = line.length;
          span.innerHTML = line.slice(0, Math.floor(len * 0.45)) + '<span class="ascii-cursor">█</span>';
          await sleep(2);
          if (dismissed) return;
          span.innerHTML = line.slice(0, Math.floor(len * 0.82)) + '<span class="ascii-cursor">█</span>';
          await sleep(2);
          if (dismissed) return;
          span.textContent = line;
        }

        // 2. Yuuka (Center)
        if (i < yuukaLines.length) {
          const line = yuukaLines[i];
          const span = yuukaSpans[i];
          const len = line.length;
          span.innerHTML = line.slice(0, Math.floor(len * 0.45)) + '<span class="ascii-cursor">█</span>';
          await sleep(2);
          if (dismissed) return;
          span.innerHTML = line.slice(0, Math.floor(len * 0.82)) + '<span class="ascii-cursor">█</span>';
          await sleep(2);
          if (dismissed) return;
          span.textContent = line;
        }

        // 3. Miyabi (Right)
        if (i < miyabiLines.length) {
          const line = miyabiLines[i];
          const span = miyabiSpans[i];
          const len = line.length;
          span.innerHTML = line.slice(0, Math.floor(len * 0.45)) + '<span class="ascii-cursor">█</span>';
          await sleep(2);
          if (dismissed) return;
          span.innerHTML = line.slice(0, Math.floor(len * 0.82)) + '<span class="ascii-cursor">█</span>';
          await sleep(2);
          if (dismissed) return;
          span.textContent = line;
        }

        // Brief scanline carriage return delay
        await sleep(3);
      }

      if (!dismissed) {
        if (kirbyPre) { kirbyPre.style.width = ''; kirbyPre.style.height = ''; }
        if (yuukaPre) { yuukaPre.style.width = ''; yuukaPre.style.height = ''; }
        if (miyabiPre) { miyabiPre.style.width = ''; miyabiPre.style.height = ''; }
      }
    };

    // Terminal console boot steps
    const bootSteps = [
      {
        tag: 'SYS',
        text: 'Architecture probe: x86_64-wasm / SIMD-128 / WebGL 2.0',
        status: 'OK',
        statusClass: 't-ok',
        delay: 50
      },
      {
        tag: 'MEM',
        text: 'Allocating virtual page tables & arena heap buffers',
        status: 'OK',
        statusClass: 't-ok',
        delay: 50
      },
      {
        tag: 'VFS',
        text: 'Mounting /quniversity [systems, graphics, servers, ai]',
        status: 'OK',
        statusClass: 't-ok',
        delay: 50
      },
      {
        tag: 'GPU',
        text: 'Compiling Three.js shader pipelines & WebGL 3D context',
        status: 'OK',
        statusClass: 't-ok',
        delay: 60
      },
      {
        tag: 'FONT',
        text: 'Hydrating glyph caches (JetBrains Mono, Inter, DynaPuff)',
        status: 'WAIT',
        statusClass: 't-wait',
        delay: 50,
        awaitFonts: true
      },
      {
        tag: 'AUTH',
        text: 'guest@qurayshe authorized. Spawning interactive desktop session',
        status: 'READY',
        statusClass: 't-ok',
        delay: 80
      }
    ];

    const runBootSteps = async () => {
      for (const step of bootSteps) {
        if (dismissed) return;

        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `
          <span class="t-tag">[${step.tag}]</span>
          <span class="t-msg"></span><span class="terminal-type-cursor">▏</span>
          <span class="t-status"></span>
        `;

        if (logContainer) {
          logContainer.appendChild(line);
          logContainer.scrollTop = logContainer.scrollHeight;
        }

        const msgEl = line.querySelector('.t-msg');
        const cursorEl = line.querySelector('.terminal-type-cursor');
        const statusEl = line.querySelector('.t-status');

        // Snappy typewriter effect for line message
        const text = step.text;
        const chunk = 4;
        for (let c = 0; c <= text.length; c += chunk) {
          if (dismissed) return;
          msgEl.textContent = text.slice(0, Math.min(c, text.length));
          await sleep(6);
        }
        msgEl.textContent = text;
        if (cursorEl) cursorEl.remove();

        if (step.awaitFonts) {
          statusEl.className = 't-status t-wait';
          statusEl.innerHTML = `<span class="terminal-throbber">${currentThrobberChar}</span> WAIT`;

          const fontPromise = (document.fonts && document.fonts.ready)
            ? document.fonts.ready
            : Promise.resolve();

          await Promise.race([
            fontPromise,
            new Promise((resolve) => setTimeout(resolve, 1200))
          ]);

          if (dismissed) return;
          statusEl.className = 't-status t-ok';
          statusEl.textContent = 'OK';
        } else {
          statusEl.className = `t-status ${step.statusClass}`;
          statusEl.textContent = step.status;
        }

        await sleep(step.delay);
      }
    };

    // Run both typewriter streams in synchronized concert
    await Promise.all([runAsciiArtTypewriter(), runBootSteps()]);

    if (dismissed) return;

    // Terminal ready state
    if (headerThrobber) {
      headerThrobber.textContent = '◆';
    }
    if (promptTarget) {
      promptTarget.innerHTML = '<span class="terminal-cursor">█</span>';
    }

    // Brief victory beat before smooth transition
    await sleep(340);
    dismiss();
  }

  /**
   * Optional manual trigger (e.g. from command palette or easter egg)
   */
  static replay() {
    try {
      sessionStorage.removeItem(TerminalLoader.STORAGE_KEY);
    } catch {}
    window.location.reload();
  }
}
