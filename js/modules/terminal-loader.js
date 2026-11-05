/**
 * Terminal Boot Loader
 * Displays a retro BIOS/UNIX terminal boot sequence on initial visit to prevent
 * font pop-in (FOUT) and layout shifts while Three.js canvases, shaders, and web fonts load.
 */

export class TerminalLoader {
  static STORAGE_KEY = 'qurayshe_booted';

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

    let dismissed = false;

    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;

      try {
        sessionStorage.setItem(TerminalLoader.STORAGE_KEY, 'true');
      } catch {
        // Silently handle storage limits / private mode
      }

      document.removeEventListener('keydown', onKeyDown);
      screen.removeEventListener('click', onClick);

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

    const bootSteps = [
      {
        tag: 'SYS',
        text: 'Architecture probe: x86_64-wasm / SIMD-128 / WebGL 2.0',
        status: 'OK',
        statusClass: 't-ok',
        delay: 80
      },
      {
        tag: 'MEM',
        text: 'Allocating virtual page tables & arena heap buffers',
        status: 'OK',
        statusClass: 't-ok',
        delay: 90
      },
      {
        tag: 'VFS',
        text: 'Mounting /quniversity [systems, graphics, servers, ai]',
        status: 'OK',
        statusClass: 't-ok',
        delay: 100
      },
      {
        tag: 'GPU',
        text: 'Compiling Three.js shader pipelines & WebGL 3D context',
        status: 'OK',
        statusClass: 't-ok',
        delay: 120
      },
      {
        tag: 'FONT',
        text: 'Hydrating glyph caches (JetBrains Mono, Inter, DynaPuff)',
        status: 'WAIT',
        statusClass: 't-wait',
        delay: 90,
        awaitFonts: true
      },
      {
        tag: 'AUTH',
        text: 'guest@qurayshe authorized. Spawning interactive desktop session',
        status: 'READY',
        statusClass: 't-ok',
        delay: 140
      }
    ];

    // Progressive line output
    for (const step of bootSteps) {
      if (dismissed) return;

      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.innerHTML = `
        <span class="t-tag">[${step.tag}]</span>
        <span class="t-msg">${step.text}</span>
        <span class="t-status ${step.statusClass}">${step.status}</span>
      `;
      if (logContainer) {
        logContainer.appendChild(line);
        logContainer.scrollTop = logContainer.scrollHeight;
      }

      if (step.awaitFonts) {
        const fontPromise = (document.fonts && document.fonts.ready)
          ? document.fonts.ready
          : Promise.resolve();

        // Race between native font loading and a safety fallback timeout (max 1400ms)
        await Promise.race([
          fontPromise,
          new Promise((resolve) => setTimeout(resolve, 1400))
        ]);

        const statusEl = line.querySelector('.t-status');
        if (statusEl) {
          statusEl.textContent = 'OK';
          statusEl.className = 't-status t-ok';
        }
      }

      await new Promise((resolve) => setTimeout(resolve, step.delay));
    }

    if (dismissed) return;

    // Brief beat before fading out
    await new Promise((resolve) => setTimeout(resolve, 320));
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

