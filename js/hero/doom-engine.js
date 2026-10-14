/**
 * DoomEngine - Minimal WebAssembly 1997 DOOM runner
 * Bridges Cornelius Diekmann's linuxdoom-1.10 wasm build directly to an offscreen canvas
 * Designed to render into the 3D retro CRT workstation canvas (computer-scene.js)
 */

export class DoomEngine {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 640;
    this.canvas.height = 400;
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;

    // Fill initial black screen with retro text
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, 640, 400);

    this.loaded = false;
    this.loading = false;
    this.loadProgress = 0;
    this.loadError = null;
    this.instance = null;
    this.memory = null;
    this.running = false;
    this.framesDrawn = 0;
    this.soundEnabled = false;

    this.onLoadComplete = null;
  }

  async load(wasmUrl = 'assets/doom/doom.wasm') {
    if (this.loaded || this.loading) return;
    this.loading = true;
    this.loadProgress = 0.05;
    this.loadError = null;

    try {
      this.memory = new WebAssembly.Memory({ initial: 108 });

      const importObject = {
        js: {
          js_console_log: () => {},
          js_stdout: () => {},
          js_stderr: () => {},
          js_milliseconds_since_start: () => performance.now(),
          js_draw_screen: (ptr) => {
            const screenBytes = new Uint8ClampedArray(this.memory.buffer, ptr, 640 * 400 * 4);
            const imgData = new ImageData(screenBytes, 640, 400);
            this.ctx.putImageData(imgData, 0, 0);
            this.framesDrawn++;
          }
        },
        env: {
          memory: this.memory
        }
      };

      const response = await fetch(wasmUrl);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const contentLength = +response.headers.get('Content-Length') || 6843809;
      let loadedBytes = 0;

      let wasmBytes;
      if (response.body && response.body.getReader) {
        const reader = response.body.getReader();
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          loadedBytes += value.length;
          this.loadProgress = Math.min(0.95, loadedBytes / contentLength);
        }
        wasmBytes = new Uint8Array(loadedBytes);
        let offset = 0;
        for (const chunk of chunks) {
          wasmBytes.set(chunk, offset);
          offset += chunk.length;
        }
      } else {
        const buf = await response.arrayBuffer();
        wasmBytes = new Uint8Array(buf);
      }

      this.loadProgress = 0.98;

      const results = await WebAssembly.instantiate(wasmBytes, importObject);
      this.instance = results.instance;

      // Start Doom main entry
      this.instance.exports.main();
      this.loaded = true;
      this.loading = false;
      this.running = true;
      this.loadProgress = 1.0;

      if (this.onLoadComplete) {
        this.onLoadComplete();
      }
    } catch (err) {
      console.error('Failed to load Doom WebAssembly engine:', err);
      this.loading = false;
      this.loadError = err.message || 'Error loading WASM';
    }
  }

  step() {
    if (!this.loaded || !this.instance || !this.running) return;
    try {
      this.instance.exports.doom_loop_step();
    } catch (e) {
      console.warn('Doom loop step warning:', e);
    }
  }

  mapKeyCode(e) {
    const code = e.code;
    const keyCode = e.keyCode;

    // Movement (WASD + Arrow Keys)
    if (code === 'KeyW' || code === 'ArrowUp') return 0xad; // KEY_UPARROW
    if (code === 'KeyS' || code === 'ArrowDown') return 0xaf; // KEY_DOWNARROW
    if (code === 'KeyA' || code === 'ArrowLeft') return 0xac; // KEY_LEFTARROW
    if (code === 'KeyD' || code === 'ArrowRight') return 0xae; // KEY_RIGHTARROW

    // Action & Weapons
    if (code === 'Space') return 32; // Open doors / switch
    if (code === 'ControlLeft' || code === 'ControlRight' || code === 'KeyE') return (0x80 + 0x1d); // Fire (RCTRL)
    if (code === 'Enter' || code === 'NumpadEnter') return 13; // Select / start
    if (code === 'Escape') return 27; // Menu
    if (code === 'Tab') return 9; // Automap
    if (code === 'Backspace') return 127;
    if (code === 'AltLeft' || code === 'AltRight') return (0x80 + 0x38); // Strafe
    if (code === 'ShiftLeft' || code === 'ShiftRight') return (0x80 + 0x36); // Run

    // Weapon select 1-7
    if (keyCode >= 49 && keyCode <= 55) return keyCode;

    // Menu confirmations (Y/N)
    if (code === 'KeyY') return 121;
    if (code === 'KeyN') return 110;

    // Default ASCII
    if (keyCode >= 65 && keyCode <= 90) return keyCode + 32;
    if (keyCode >= 112 && keyCode <= 123) return keyCode + 75; // F1 - F12

    return keyCode;
  }

  sendKey(type, doomCode) {
    if (!this.loaded || !this.instance) return;
    try {
      this.instance.exports.add_browser_event(type, doomCode);
    } catch (e) {}
  }

  handleKeyDown(e) {
    const mapped = this.mapKeyCode(e);
    this.sendKey(0 /* KeyDown */, mapped);
  }

  handleKeyUp(e) {
    const mapped = this.mapKeyCode(e);
    this.sendKey(1 /* KeyUp */, mapped);
  }

  simulateFire() {
    // Fire weapon (RCTRL down then up)
    this.sendKey(0, 0x80 + 0x1d);
    setTimeout(() => {
      this.sendKey(1, 0x80 + 0x1d);
    }, 120);
  }

  simulateEnter() {
    this.sendKey(0, 13);
    setTimeout(() => {
      this.sendKey(1, 13);
    }, 120);
  }
}

