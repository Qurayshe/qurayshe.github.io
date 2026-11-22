/**
 * Terminal Boot Loader
 * Displays a retro BIOS/UNIX terminal boot sequence on initial visit to prevent
 * font pop-in (FOUT) and layout shifts while Three.js canvases, shaders, and web fonts load.
 *
 * Features:
 * - Full-screen terminal window with animated ASCII Braille throbber
 * - Rapid left-to-right typewriter console logging
 * - Sequenced ASCII art showcase inside the terminal after console logs:
 *   - Landscape/Desktop: unified inline scanline typewriter across Kirby, Yuuka, and Miyabi
 *   - Vertical/Portrait: stacked one at a time with smooth terminal auto-scrolling
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

    const asciiShelf = screen.querySelector('.terminal-ascii-shelf');
    const kirbyPre = screen.querySelector('.ascii-kirby');
    const yuukaPre = screen.querySelector('.ascii-yuuka');
    const miyabiPre = screen.querySelector('.ascii-miyabi');

    let dismissed = false;
    let throbberTimer = null;
    let currentThrobberChar = TerminalLoader.THROBBER_FRAMES[0];

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, dismissed ? 0 : ms));
    const scrollToBottom = () => {
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    };

    // Save pristine text for instant clean skip/restore
    const originalKirbyText = kirbyPre ? kirbyPre.textContent : '';
    const originalYuukaText = yuukaPre ? yuukaPre.textContent : '';
    const originalMiyabiText = miyabiPre ? miyabiPre.textContent : '';

    const restorePre = (pre, text) => {
      if (!pre) return;
      pre.style.display = '';
      pre.style.width = '';
      pre.style.height = '';
      pre.textContent = text;
    };

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

      if (asciiShelf) {
        asciiShelf.classList.remove('is-pending');
      }
      restorePre(kirbyPre, originalKirbyText);
      restorePre(yuukaPre, originalYuukaText);
      restorePre(miyabiPre, originalMiyabiText);

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
      screen.querySelectorAll('.terminal-throbber').forEach((th) => {
        th.textContent = currentThrobberChar;
      });
    }, 70);

    const kirbyLines = originalKirbyText.replace(/\r/g, '').split('\n');
    const yuukaLines = originalYuukaText.replace(/\r/g, '').split('\n');
    const miyabiLines = originalMiyabiText.replace(/\r/g, '').split('\n');

    // Shared quick left-to-right line sweep helper
    const typeAsciiLine = async (span, line, stepDelayMs = 2) => {
      const len = line.length;
      span.innerHTML = line.slice(0, Math.floor(len * 0.45)) + '<span class="ascii-cursor">█</span>';
      await sleep(stepDelayMs);
      if (dismissed) return;
      span.innerHTML = line.slice(0, Math.floor(len * 0.82)) + '<span class="ascii-cursor">█</span>';
      await sleep(stepDelayMs);
      if (dismissed) return;
      span.textContent = line;
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
        text: 'guest@qurayshe authorized. Rendering terminal banner...',
        status: 'OK',
        statusClass: 't-ok',
        delay: 90
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
          if (asciiShelf && asciiShelf.parentNode === logContainer) {
            logContainer.insertBefore(line, asciiShelf);
          } else {
            logContainer.appendChild(line);
          }
          scrollToBottom();
        }

        const msgEl = line.querySelector('.t-msg');
        const cursorEl = line.querySelector('.terminal-type-cursor');
        const statusEl = line.querySelector('.t-status');

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

    const runAsciiArtTypewriter = async () => {
      if (!asciiShelf || !kirbyPre || !yuukaPre || !miyabiPre) return;

      asciiShelf.classList.remove('is-pending');
      if (logContainer) {
        logContainer.appendChild(asciiShelf);
      }

      const isVertical = window.matchMedia('(max-width: 860px), (orientation: portrait)').matches;

      if (isVertical) {
        // Portrait / mobile: stack & print one figure at a time while auto-scrolling
        const figures = [
          { pre: kirbyPre, lines: kirbyLines },
          { pre: yuukaPre, lines: yuukaLines },
          { pre: miyabiPre, lines: miyabiLines }
        ];

        for (const fig of figures) {
          fig.pre.innerHTML = '';
          fig.pre.style.display = 'none';
        }

        for (const fig of figures) {
          if (dismissed) return;
          fig.pre.style.display = '';

          for (const line of fig.lines) {
            if (dismissed) return;
            const span = document.createElement('span');
            span.className = 'ascii-line';
            fig.pre.appendChild(span);
            scrollToBottom();
            await typeAsciiLine(span, line, 2);
            if (dismissed) return;
            scrollToBottom();
            await sleep(2);
          }

          await sleep(60);
        }
        return;
      }

      // Landscape / desktop: inline scanline typewriter across all three side-by-side
      const figures = [
        { pre: kirbyPre, lines: kirbyLines },
        { pre: yuukaPre, lines: yuukaLines },
        { pre: miyabiPre, lines: miyabiLines }
      ];

      for (const fig of figures) {
        const rect = fig.pre.getBoundingClientRect();
        if (rect.width && rect.height) {
          fig.pre.style.width = `${rect.width}px`;
          fig.pre.style.height = `${rect.height}px`;
        }
        fig.pre.innerHTML = '';
        fig.spans = fig.lines.map(() => {
          const span = document.createElement('span');
          span.className = 'ascii-line';
          fig.pre.appendChild(span);
          return span;
        });
      }

      scrollToBottom();

      const maxLines = Math.max(kirbyLines.length, yuukaLines.length, miyabiLines.length);
      for (let i = 0; i < maxLines; i++) {
        if (dismissed) return;

        for (const fig of figures) {
          if (i < fig.lines.length) {
            await typeAsciiLine(fig.spans[i], fig.lines[i], 2);
            if (dismissed) return;
          }
        }

        scrollToBottom();
        await sleep(4);
      }

      if (!dismissed) {
        for (const fig of figures) {
          fig.pre.style.width = '';
          fig.pre.style.height = '';
        }
      }
    };

    // 1. Type console boot logs first
    await runBootSteps();
    if (dismissed) return;

    // 2. Render ASCII art inside the terminal below the console logs
    await runAsciiArtTypewriter();
    if (dismissed) return;

    // Terminal ready state
    if (headerThrobber) {
      headerThrobber.textContent = '◆';
    }
    if (promptTarget) {
      promptTarget.innerHTML = '<span class="terminal-cursor">█</span>';
    }

    // Brief beat so the user can admire the completed terminal banner before fading out
    await sleep(480);
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
