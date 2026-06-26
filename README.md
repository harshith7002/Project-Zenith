<div align="center">

# 🌍 PROJECT ZENITH
### *The Celestial Eye — Real-Time Space Intelligence Dashboard*

[![Next.js](https://img.shields.io/badge/Next.js-15.5.19-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-0.184-049EF4?style=for-the-badge&logo=three.js)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.x-FF0055?style=for-the-badge&logo=framer)](https://www.framer.com/motion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> A cinematic, real-time cosmic radar that tracks satellites, celestial bodies, and space events —  
> built with custom WebGL shaders, React Three Fiber, and live space APIs.

</div>

---

## 📖 Table of Contents

1. [What It Does (Functionality)](#-what-it-does-functionality)
2. [Setup Instructions](#-setup-instructions)
3. [API Keys Required](#-api-keys-required)
4. [Dependencies](#-dependencies)
5. [Project Structure](#-project-structure)
6. [Scripts Reference](#-scripts-reference)
7. [Troubleshooting](#-troubleshooting)

---

## 🚀 What It Does (Functionality)

Project Zenith is a full-page, interactive space intelligence web app split into six sections:

### 1. 🌐 Hero — Cinematic 3D Earth (WebGL)
The entire background is a live-rendered 3D Earth built from scratch with custom GLSL shaders:

| Feature | Detail |
|---|---|
| **Earth Surface** | Custom fragment shader blending day/night textures based on sun angle |
| **Day/Night Terminator** | Smooth `smoothstep(-0.25, 0.25, cosTheta)` blend with soft twilight zone |
| **City Lights** | Golden sodium-lamp glow on the night side, masked by cloud coverage |
| **Ocean Specular** | Per-pixel specular highlight on water using a specular map |
| **Cloud Layer** | Separate animated cloud mesh with sunset orange tint at the terminator |
| **Atmosphere** | Fresnel rim glow using a custom `BackSide` sphere shader; razor-thin on sun-lit limb |
| **Starfield** | 1,000 custom-shader circular stars across two depth layers; 15% twinkle organically |
| **Lens Flare** | Anamorphic streak + soft halo; ray-sphere occlusion-tested so it fades behind Earth |
| **Moon** | Orbits Earth with real moon texture; self-rotates |
| **Satellites** | ISS + 2 satellites with blinking telemetry lights in low-earth-orbit paths |
| **Cosmic Dust** | 120-particle bokeh foreground layer drifting toward the camera |
| **Nebula Clouds** | 5 radial-gradient quads at varying depths (≤10% opacity) for deep space color |
| **Distant Galaxy** | 3-quad layered galaxy sprite (cyan spiral arms + purple core) far behind Earth |
| **Scroll Composition** | On scroll: Earth translates right→left, camera zoom eases in (Lenis smooth scroll) |
| **Mouse Parallax** | Camera drifts with mouse position for a live IMAX-rig feel |
| **Bloom** | Post-processing bloom (`luminanceThreshold: 0.18`, `intensity: 0.5`) |

### 2. 📡 Command Center — Telemetry Dashboard
Six glassmorphism data panels:

| Panel | What it shows |
|---|---|
| **ISS Tracker** | Live ISS lat/lng, altitude (km), and velocity (km/s) — refreshed every 5 s |
| **Sky Quality Score** | Interactive sliders (cloud cover, humidity, Bortle class, moon brightness) → astronomy score |
| **Visible Objects** | List of currently visible planets, constellations, and satellites with altitude |
| **Satellite Radar** | Animated SVG radar sweep with color-coded blips for ISS, GPS, Weather, Starlink, Nav |
| **AI Space Guide** | Chat assistant that answers astronomy questions with context-aware responses |
| **Cosmic Event Predictor** | Live countdown timers to next ISS pass, meteor shower, planetary alignment, lunar eclipse |

### 3. 🌍 Interactive Globe
- Full 3D globe via `react-globe.gl` using the Earth night texture
- Live ISS position marker updated every 5 seconds
- City markers: New Delhi, New York, London, Tokyo, Sydney, Nairobi
- Click any marker → info panel with lat/lng and "Set as Observation Point"

### 4. 🪐 Solar System Explorer
- All 8 planets orbiting the Sun in real-time 3D with correct relative speeds
- Saturn procedural ring system shader (multi-frequency sine stripes + Cassini Division gap)
- Sun with animated pulsing corona (additive blended `BackSide` sphere)
- 800-particle asteroid belt between Mars and Jupiter
- Click a planet → camera smoothly zooms in and reveals its *Cosmic Story* modal
- Bloom post-processing for glowing highlights

### 5. 📊 Stats HUD
Four animated counter cards: tracked satellites, ISS altitude, observable stars, next event.

### 6. 🗂 Flight Timeline
Mission event axis with scroll-triggered reveal animations showing key project milestones.

---

## ⚙️ Setup Instructions

### Prerequisites

| Requirement | Version |
|---|---|
| [Node.js](https://nodejs.org) | 18.x or higher |
| npm | 9.x or higher (bundled with Node.js) |
| Internet connection | Required for CDN Earth textures and live ISS API |

### Step-by-Step

**1. Clone the repository**
```bash
git clone https://github.com/harshith7002/Project-Zenith.git
cd Project-Zenith
```

**2. Install all dependencies**
```bash
npm install
```

**3. Start the development server**
```bash
npm run dev
```

**4. Open in browser**
```
http://localhost:3000
```

The page will hot-reload automatically whenever you save a file.

### Production Build

```bash
# Compile and optimise for production
npm run build

# Start the production server
npm start
```

> **Texture loading note:** Earth textures (day map, night map, clouds, specular, topology, moon) are fetched from public CDNs at runtime — no download or local storage needed. A wireframe holographic Earth renders as a fallback if the CDN is unreachable.

---

## 🔑 API Keys Required

**Project Zenith requires NO API keys.** All external data sources used are public, unauthenticated REST endpoints:

| API | Endpoint | Used For | Auth Required |
|---|---|---|---|
| **Where The ISS At** | `https://api.wheretheiss.at/v1/satellites/25544` | Live ISS position (lat, lng, altitude, velocity) | ❌ None |
| **three-globe CDN** | `https://unpkg.com/three-globe@2.38.0/example/img/` | Earth day, night, topology textures | ❌ None |
| **Three.js GitHub CDN** | `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/` | Earth specular map, cloud overlay, Moon texture | ❌ None |

> These endpoints are free, rate-limit-free for typical single-user web traffic, and require no registration or `.env` file.

**There is no `.env` file required to run this project.**

---

## 📦 Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | `15.5.19` | React framework — App Router, SSR, Turbopack bundler |
| `react` | `19.1.0` | UI component library |
| `react-dom` | `19.1.0` | React DOM renderer |
| `three` | `^0.184.0` | Core WebGL/3D engine — geometry, shaders, textures, lighting |
| `@react-three/fiber` | `^9.6.1` | React renderer for Three.js scenes |
| `@react-three/drei` | `^10.7.7` | Three.js helpers — `Stars`, `OrbitControls`, etc. |
| `@react-three/postprocessing` | `^3.0.4` | Post-processing effects — `Bloom`, `EffectComposer` |
| `@types/three` | `^0.184.1` | TypeScript type definitions for Three.js |
| `framer-motion` | `^12.40.0` | Declarative animations — scroll-triggered reveals, page transitions |
| `lenis` | `^1.3.23` | Smooth inertial scrolling (cinematic scroll feel) |
| `@studio-freight/lenis` | `^1.0.42` | Legacy Lenis package (kept for compatibility) |
| `react-globe.gl` | `^2.38.0` | Interactive 3D globe for the Globe Section |
| `lucide-react` | `^0.470.0` | Icon set — Globe, ArrowDown, ChevronRight, Activity |
| `gsap` | `^3.15.0` | Animation engine (available for advanced sequences) |
| `zustand` | `^5.0.14` | Lightweight global state management (available for extensions) |

### Development Dependencies

| Package | Version | Purpose |
|---|---|---|
| `typescript` | `^5` | Static type checking |
| `@types/node` | `^20` | Node.js TypeScript types |
| `@types/react` | `^19` | React TypeScript types |
| `@types/react-dom` | `^19` | React DOM TypeScript types |
| `eslint` | `^9` | JavaScript/TypeScript linter |
| `eslint-config-next` | `15.5.19` | Next.js ESLint rules |
| `@eslint/eslintrc` | `^3` | ESLint config helper |
| `tailwindcss` | `^4` | Utility-first CSS framework |
| `@tailwindcss/postcss` | `^4` | PostCSS plugin for Tailwind CSS v4 |

### Installing a Specific Package

```bash
# Example: re-install three.js separately
npm install three@^0.184.0

# Example: check for outdated packages
npm outdated
```

---

## 📁 Project Structure

```
Project-Zenith/
├── public/                          # Static assets served at /
│   ├── file.svg
│   ├── globe.svg
│   └── ...
│
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css              # ★ Design system — all CSS tokens, layout, components
│   │   ├── layout.tsx               # Root HTML shell + font imports + metadata
│   │   └── page.tsx                 # ★ Main page — assembles all sections, Lenis scroll init
│   │
│   ├── components/
│   │   ├── hero/
│   │   │   └── Earth3D.tsx          # ★ Full WebGL scene — Earth, Moon, Stars, Atmosphere, Flare
│   │   │
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx        # Celestial Radar — 6 telemetry panels + ISS live fetch
│   │   │
│   │   ├── globe/
│   │   │   └── GlobeSection.tsx     # react-globe.gl interactive globe + ISS live marker
│   │   │
│   │   ├── solar-system/
│   │   │   └── SolarSystem.tsx      # 3D Solar System — planets, Saturn rings, asteroid belt
│   │   │
│   │   ├── stats/
│   │   │   └── StatsSection.tsx     # HUD stat cards with animated counters
│   │   │
│   │   ├── timeline/
│   │   │   └── Timeline.tsx         # Mission flight plan timeline axis
│   │   │
│   │   └── footer/
│   │       └── Footer.tsx           # Footer
│   │
│   └── lib/
│       └── constants.ts             # Planet data — name, radius, distance, speed, color
│
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── next.config.ts                   # Next.js configuration
├── postcss.config.mjs               # PostCSS + Tailwind config
└── eslint.config.mjs                # ESLint rules
```

---

## 📜 Scripts Reference

| Command | What it does |
|---|---|
| `npm run dev` | Start development server at `localhost:3000` with Turbopack HMR |
| `npm run build` | Compile production bundle with full lint + type checking |
| `npm start` | Serve the compiled production build |
| `npm run lint` | Run ESLint on all source files |

---

## 🛠 Troubleshooting

### Earth not rendering / blank black screen
The Earth textures load from CDN on first render. On a slow connection this can take 3–8 seconds. A cyan wireframe sphere renders in the meantime. Check your browser's Network tab for failed texture requests.

### WebGL shader compile errors in console
Make sure you are running the latest code from this repository. An earlier version had a `cameraPosition` uniform redefinition bug in the GLSL shaders which caused:
```
ERROR: 0:64: 'cameraPosition' : redefinition
```
This was fixed in commit `d4a8108`. Run `git pull origin main` to get the fix.

### Port 3000 already in use
```bash
# Find and kill the process using port 3000
npx kill-port 3000
npm run dev
```

### `node_modules` missing or corrupted
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build fails with `EPERM: operation not permitted`
This happens when the dev server (`npm run dev`) is still running while you run `npm run build`. Stop the dev server first, then build.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Built with ☕, Three.js shaders, and a deep love for space.

**[harshith7002](https://github.com/harshith7002)** · Project Zenith · 2026

</div>
