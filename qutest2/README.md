# 🌌 3D Motion Lab: Three.js & Anime.js Interactive Test & Tutorial Suite

An interactive, high-performance, and educational test & tutorial laboratory showcasing various features of **Three.js** (WebGL 3D graphics), **Anime.js** (motion design engine), and their combined hybrid synergy.

Designed as a **100% pure static web application** — zero build tools or bundling steps required. Fully compatible with GitHub Pages, local static servers, or direct browser loading.

---

## 🚀 Live Demos & Tutorial Progression

The laboratory contains **11 modular interactive examples** organized into 3 core learning tracks:

### Track 1: Three.js Fundamentals
1. **01. Procedural Geometries & Vertex Morphing** (`01-three-geometries.js`)
   - Direct manipulation of `Float32Array` vertex buffer positions in real-time.
   - Sine wave displacement, normal recalculations, wireframes, and PBR surface materials.
2. **02. Studio Lighting, Shadows & PBR Materials** (`02-three-lighting-pbr.js`)
   - Physically Based Rendering (PBR) with `MeshStandardMaterial` & `MeshPhysicalMaterial`.
   - Multi-colored orbiting `PointLight` sources with visual bulbs, PCF Soft Shadow mapping, and reflective floors.
3. **03. Particle Vortex Galaxy (100,000+ Points)** (`03-three-particle-galaxy.js`)
   - High-performance GPU particle rendering in a single draw call via `THREE.Points` and `BufferGeometry`.
   - Logarithmic spiral arm math, additive color blending, and rotational vortex dynamics.

### Track 2: Anime.js Motion Mastery
4. **04. Kinetic Typography & SVG Path Drawing** (`04-anime-kinetic-svg.js`)
   - SVG vector path self-drawing using `strokeDashoffset` and `anime.setDashoffset`.
   - Letter-by-letter kinetic text stagger and elastic bounce timings.
5. **05. Multi-Stage Timeline Choreography & Keyframes** (`05-anime-timelines.js`)
   - Quantum reactor HUD assembly using relative timeline offsets (`'-=600'`) and keyframe arrays.
   - Forward/reverse playback control, speed scaling, and live scrubbing.
6. **06. Elastic Matrix Staggering & Ripple Physics** (`06-anime-stagger-grid.js`)
   - Interactive 2D/3D matrix stagger calculations with `grid: [columns, rows]`.
   - Dynamic cursor-click radial ripples and physics spring oscillations.

### Track 3: Three.js + Anime.js Synergy
7. **07. Cinematic 3D Camera Choreography & Dolly Zoom** (`07-combo-camera-director.js`)
   - Smooth Bezier camera transitions between 3D stations with automated target tracking.
   - The classic Hollywood **Dolly Zoom (Vertigo effect)** combining FOV expansion with camera tracking.
8. **08. 3D Mechanical Assembly & Exploding Stagger** (`08-combo-exploding-mesh.js`)
   - 125+ modular voxel parts exploding radially along outward normal vectors with staggered physics delays.
   - Magnetic spring snap reassembly.
9. **09. Holographic Shader Uniforms & Glitch Pulse** (`09-combo-hologram-pulse.js`)
   - Custom GLSL `ShaderMaterial` with Fresnel edge glow and moving scanline bands.
   - Anime.js dynamically driving shader uniform variables (`uGlitchOffset`, `uGlowIntensity`).
10. **10. Raycasted 3D Interactive Card Deck** (`10-combo-3d-cards.js`)
    - `THREE.Raycaster` mouse coordinate detection paired with Anime.js 3D physics tilt and hover elevation.
    - Click-to-flip 180° card rotation with spring bounce and procedural canvas textures.
11. **11. Kinetic 3D Soundwave Equalizer & Procedural Beats** (`11-combo-kinetic-audio.js`)
    - 64 kinetic frequency bars arranged in a 3D circle reacting to simulated synthesizer beats.
    - Sonic shockwave floor rings and spring damping.

---

## 🛠️ Project Structure

```
qutest2/
├── index.html                 # Responsive single-page workbench & 3D canvas
├── css/
│   └── style.css              # Cyber dark theme, glassmorphism, responsive drawers
├── js/
│   ├── app.js                 # Central manager, router, code inspector & controls binder
│   ├── utils/
│   │   └── common.js          # Three.js lifecycle, memory disposal & studio helpers
│   └── examples/              # Standalone, well-documented tutorial modules (01 to 11)
└── README.md                  # Documentation and deployment guide
```

---

## ⚡ How to Run Locally

Because this project uses standard browser ES modules (`import`/`export`), it should be served via any local HTTP server:

### Option A: Using Python (built into macOS / Linux / Windows)
```bash
python -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000) in your browser.

### Option B: Using Node.js (npx serve or live-server)
```bash
npx serve .
```

### Option C: Using VS Code
Install the **Live Server** extension and click **"Go Live"** at the bottom right of VS Code.

---

## 🌐 Deploy to GitHub Pages (1-Click Static Deployment)

1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Three.js & Anime.js Tutorial Suite"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** → **Pages**
   - Under **Build and deployment > Source**, select **Deploy from a branch**
   - Set **Branch** to `main` and folder to `/ (root)`
   - Click **Save**
3. Your interactive tutorial laboratory will be live at `https://<your-username>.github.io/<your-repo-name>/`!

---

## 💡 Key Architectural Highlights

- **Leak-Free WebGL Lifecycle**: Each tutorial module implements a complete `destroy()` cleanup hook that disposes of geometries, materials, shader programs, textures, and cancels active `requestAnimationFrame` loops when switching scenes.
- **Deep Inspector Drawer**: Includes 3 live panes for each example:
  1. *Tutorial*: Mathematical and architectural explanation with key API tags.
  2. *Controls*: Real-time sliders, color pickers, and action triggers.
  3. *Code*: Formatted code snippets with one-click copy.
- **URL Hash Routing**: Direct links like `#combo-camera-director` or `#three-particle-galaxy` immediately open specific tutorials.

