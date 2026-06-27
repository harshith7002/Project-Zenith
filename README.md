                          # 🌍 PROJECT ZENITH
### *The Celestial Eye — Real-Time Space Intelligence Dashboard*

[![Next.js](https://img.shields.io/badge/Next.js-15.5.19-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-0.184-049EF4?style=for-the-badge&logo=three.js)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.x-FF0055?style=for-the-badge&logo=framer)](https://www.framer.com/motion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> A cinematic, real-time cosmic radar that tracks satellites, celestial bodies, and space events — built with custom WebGL shaders, React Three Fiber, and live space APIs.

---

## ⚙️ Installation and Setup Instructions

Clearly explained instructions to clone, install dependencies, and run the project locally on your machine.

### Prerequisites

To build and run this application locally, you need the following utilities installed:

| Requirement | Version | Link |
|---|---|---|
| **Node.js** | `18.x` or higher | [https://nodejs.org](https://nodejs.org) |
| **npm** | `9.x` or higher | *(Bundled with Node.js)* |
| **Active Internet Connection** | Required | *(For CDNs & live ISS REST API telemetry)* |

### Step-by-Step Local Deployment

**1. Clone the project repository**
Open your terminal and clone the source code:
```bash
git clone https://github.com/harshith7002/Project-Zenith.git
cd Project-Zenith
```

**2. Install runtime and development dependencies**
```bash
npm install
```

**3. Run the development server**
Launch Next.js in development mode with HMR (Hot Module Replacement) enabled:
```bash
npm run dev
```

**4. View the application**
Open your web browser and navigate to:
```
http://localhost:3000
```
The page will hot-reload automatically when you save code changes.

### Production Compiling & Optimization

To test the application under local production conditions:
```bash
# Compile and optimize for production (ESLint and type safety checks will run)
npm run build

# Start the production server
npm start
```

---

## 🎨 Website Functionality and Unique Features

Project Zenith is built with custom WebGL, canvas rendering, and real-time computations to ensure the UI feels alive, responsive, and astronomically accurate.

### 1. 🌐 Cinematic 3D Earth (WebGL & Custom Shaders)
The entire background is a live-rendered 3D Earth built from scratch using custom GLSL shaders:
* **Day/Night Terminator**: A custom fragment shader blends day and night textures dynamically based on the Sun's coordinate vector using `smoothstep(-0.25, 0.25, cosTheta)`, creating a realistic glowing sunset twilight zone.
* **Golden City Lights**: Rendered on the night hemisphere of the globe and masked dynamically by cloud layers.
* **Ocean Specular Reflections**: Real-time specular sun-reflection reflections computed using per-pixel specular mapping.
* **Razor-Thin Atmospheric Corona**: A custom `BackSide` atmospheric glow shader renders a thin, bright blue rim on the sunlit limb, fading smoothly into the darkness of space at the terminator.
* **Organically Twinkling Starfield**: 1,000 circular stars rendered across two depth layers using a custom vertex-shader phase formula to slowly twinkle a subset of stars, eliminating visual noise.
* **Anamorphic Lens Flare**: Ray-occlusion tested so that the solar flare fades out naturally when the Sun is eclipsed by the Earth's geometry.
* **Drift & Mouse Parallax**: Slower, high-inertia camera parallax linked to mouse coordinates to create a dramatic, cinematic IMAX camera feel.

### 2. 📡 Celestial Radar & Mission Control Dashboard
Six integrated telemetry panels display live calculations:
* **ISS Tracker**: Fetches the physical altitude, orbital velocity, latitude, and longitude of the ISS directly from unauthenticated REST endpoints, updating every 5 seconds.
* **Calculated Sky Quality Score**: An interactive suitability calculator that evaluates live cloud cover, relative humidity (fetched from the **Open-Meteo API**), Moon phase, and Bortle light pollution index to score the sky out of 100.
* **Visible Sky Objects**: Replaces hardcoded placeholders with real Alt/Az calculations via the `astronomy-engine` library. Only displays planets, stars, and constellations that are physically above the horizon ($> 0^\circ$ altitude) relative to the observer's coordinates.
* **Blinking Satellite Radar**: Projects 13 real satellites (Starlink, GPS constellations, NOAA weather satellites) onto a 2D polar projection SVG radar grid with pulsing radial sweeps.
* **Context-Aware AI Space Guide**: A rule-based chat assistant that automatically analyzes the observer's location, current weather profile, visible planets, and next ISS pass time to generate a live "Current Sky Summary" welcome message and answer astronomy questions.
* **Cosmic Event Predictor**: Real-time relative countdown timers to the next visible ISS flyover, upcoming meteor shower, planetary alignment, and lunar eclipse.
* **Live Telemetry Badge**: Displays a "Last Updated" timestamp in the status bar that refreshes every 4 seconds, complete with citations mapping out the unauthenticated REST APIs.

### 3. 🌍 Interactive 3D Globe
* Powered by `react-globe.gl` using high-resolution textures.
* Plots the live tracking path of the ISS in real-time.
* Interactive city markers that allow the user to select locations or click "Set as Observation Point" to dynamically recalculate all coordinates, radar blips, and AI summaries in the dashboard.

### 4. 🪐 Solar System Orbit Simulator
* Renders all 8 planets orbiting the Sun in real-time 3D with correct relative orbital speeds.
* **Procedural Saturn Rings**: Fragment shader modeling multi-frequency sine wave concentric bands and the Cassini Division gap.
* **Dynamic Modals**: Clicking any planet pauses its orbit, smoothly transition-focuses the camera, and opens an educational "Cosmic Story" file.

---

## 📦 Dependencies

External libraries, frameworks, and tools used to build Project Zenith:

### Core Frameworks & UI Engines
* **Next.js** (`15.5.19`): React framework driving the SSR (Server-Side Rendering), App Router routing, and bundler.
* **React** & **React DOM** (`19.1.0`): Declarative component state and rendering structure.

### 3D WebGL Visualization
* **three** (`^0.184.0`): Core WebGL/3D library for handling geometries, Custom ShaderMaterial compilations, lighting, and textures.
* **@react-three/fiber** (`^9.6.1`): React wrapper for rendering Three.js scenes declaratively.
* **@react-three/drei** (`^10.7.7`): Helper hooks and components for Three.js (controls, textures, points).
* **@react-three/postprocessing** (`^3.0.4`): Post-processing pipeline enabling glowing WebGL Bloom overlays.
* **react-globe.gl** (`^2.38.0`): Specialized wrapper for compiling the interactive coordinate mapping globe.

### Physics, Astronomy, & Mathematics
* **astronomy-engine** (`^2.1.19`): Calculates real-time planetary orbits, Alt/Az coordinates, and moon illumination phases.
* **satellite.js** (`^7.0.1`): Implements SGP4 orbit propagation to calculate satellite coordinates from Two-Line Element (TLE) datasets.

### Animations & Inertial Motion
* **framer-motion** (`^12.40.0`): Declarative animation engine driving the scroll-linked timeline fills, card reveals, and UI fades.
* **lenis** & **@studio-freight/lenis** (`^1.3.23`): Cinematic smooth-scrolling integration.
* **gsap** (`^3.15.0`): Timeline sequencing engine.

### Icons & Styling
* **lucide-react** (`^0.470.0`): Clean SVGs for UI telemetry indicators.
* **tailwindcss** (`^4.x`): CSS utility styling framework.
