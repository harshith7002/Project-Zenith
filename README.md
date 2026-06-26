<div align="center">

# 🌍 PROJECT ZENITH

### *The Celestial Eye — Real-Time Space Intelligence Dashboard*

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-049EF4?style=for-the-badge&logo=three.js)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-Animated-FF0055?style=for-the-badge&logo=framer)](https://www.framer.com/motion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

> A cinematic, real-time cosmic radar that tracks satellites, celestial bodies, and space events — built with WebGL, custom GLSL shaders, and modern React.

</div>

---

## ✨ Overview

**Project Zenith** is a premium space intelligence web experience that functions as a real-time cosmic radar. It calculates and displays the exact paths of space assets and celestial bodies currently intersecting your meridian, rendered inside a full-page, physically accurate 3D Earth scene inspired by *Interstellar*, Apple Vision Pro, and NASA space photography.

The experience is built for **visual impact first** — featuring a cinematic hero with a custom WebGL Earth, parallax starfields, twinkling stars, atmospheric scattering shaders, and smooth scroll animations — all running at 60 FPS.

---

## 🎬 Features

### 🌐 Hero — Cinematic 3D Earth
- **Custom GLSL shaders** for physically-based Earth rendering — day/night terminator, city lights, ocean specular reflections, and cloud layer
- **Atmospheric scattering** — razor-thin Fresnel rim glow on the sun-facing limb with terminator sunset orange transition
- **Earth composition** — Earth starts offset to the right, giving the headline clean negative space. Smoothly slides left on scroll
- **Scroll parallax** — Earth system translates and zooms on scroll, creating depth
- **Custom twinkling starfield** — GLSL shader with 15% organic slow-twinkling stars and circular point shaping
- **Restrained lens flare** — Angle-dependent, ray-sphere occlusion tested, fades when Earth blocks the sun path
- **Moon & satellites** — Orbiting Moon with live texture, ISS-like satellite with blinking telemetry lights
- **Cosmic dust** — 120-particle bokeh foreground layer
- **Layered nebulae** — 5 radial gradient quads at varying depths for volumetric space background
- **Lenis smooth scroll** — Cinematic inertial scrolling (duration 1.5s)

### 📡 Command Center Dashboard
- **ISS Tracker** — Live ISS position, altitude, velocity, and lat/lng via `wheretheiss.at` API (refreshes every 5s)
- **Sky Quality Score** — Interactive sliders for cloud cover, humidity, light pollution (Bortle class), and moon brightness with live score calculation
- **Visible Objects** — Current sky visibility list with altitude readings for planets, constellations, and satellites
- **Satellite Radar** — Animated SVG radar sweep with color-coded satellite blips
- **AI Space Guide** — Astronomy chat assistant with contextual pre-set prompts
- **Cosmic Event Predictor** — Live countdown timers to the next ISS pass, meteor shower peak, planetary alignment, and lunar eclipse

### 🌍 Interactive Globe
- Full globe rendered with `react-globe.gl` using Earth night texture
- Live ISS position marker updated every 5 seconds
- City markers for 6 major global locations (New Delhi, New York, London, Tokyo, Sydney, Nairobi)
- Click any point to inspect its latitude/longitude
- "Set as Observation Point" for custom sky calculations

### 🪐 Solar System Explorer
- All 8 planets orbiting the Sun in real-time 3D (Three.js + React Three Fiber)
- **Saturn ring system** — Procedural shader with multi-frequency sine stripes and Cassini Division gap simulation
- **Sun corona** — Animated pulsing corona with additive blending
- **Asteroid belt** — 800-particle band between Mars and Jupiter
- Click any planet to zoom in and read its *Cosmic Story*
- **Auto-rotate** overview + orbit controls (drag, scroll, pinch)
- Bloom post-processing for glowing star and planet highlights

### 📊 Stats HUD
- 4 live stat cards: tracked satellites, ISS altitude, observable stars, next event countdown

### 🎨 UI/UX Polish
- **Custom cursor** — Dot + ring cursor with magnetic snap on interactive elements
- **Liquid Glass nav** — Glassmorphism navbar with animated backdrop blur
- **Flight timeline** — Mission event axis with scroll-triggered reveal animations
- **Responsive** — Works from 375px mobile to 4K desktop
- Deep space `#02040A` background with custom dark scrollbar

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org) (App Router, Turbopack) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org) |
| **3D / WebGL** | [Three.js](https://threejs.org) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) |
| **3D Helpers** | [@react-three/drei](https://github.com/pmndrs/drei), [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) |
| **Animations** | [Framer Motion](https://www.framer.com/motion) |
| **Smooth Scroll** | [Lenis](https://github.com/darkroomengineering/lenis) |
| **Globe** | [react-globe.gl](https://github.com/vasturiano/react-globe.gl) |
| **Styling** | Vanilla CSS + Tailwind CSS utility classes |
| **Live APIs** | [wheretheiss.at](https://wheretheiss.at) (ISS), [three-globe](https://unpkg.com/three-globe) textures |
| **Icons** | [Lucide React](https://lucide.dev) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/harshith7002/Project-Zenith.git
cd Project-Zenith

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

> **Note:** The Earth textures are loaded from CDN at runtime (`unpkg.com`, `raw.githubusercontent.com`). An internet connection is required for the full visual experience. A wireframe holographic fallback renders offline.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css          # Design system — tokens, layout, component styles
│   ├── layout.tsx           # Root layout + metadata
│   └── page.tsx             # Main page — all sections assembled here
├── components/
│   ├── hero/
│   │   └── Earth3D.tsx      # ★ Main WebGL scene — Earth, Moon, Stars, Atmosphere
│   ├── dashboard/
│   │   └── Dashboard.tsx    # Celestial Radar Dashboard — 6 telemetry panels
│   ├── globe/
│   │   └── GlobeSection.tsx # Interactive react-globe.gl + ISS live tracker
│   ├── solar-system/
│   │   └── SolarSystem.tsx  # 3D Solar System with Saturn rings + planet stories
│   ├── stats/
│   │   └── StatsSection.tsx # HUD stat cards with animated counters
│   ├── timeline/
│   │   └── Timeline.tsx     # Mission flight plan timeline axis
│   └── footer/
│       └── Footer.tsx       # Footer with links
└── lib/
    └── constants.ts         # Planet data, orbital parameters
```

---

## 🎨 Design Philosophy

Project Zenith is built around three visual principles:

1. **Depth over flatness** — Multiple Z-layers of stars, nebulae, cosmic dust, and the 3D Earth create a sense of infinite space rather than a flat illustration.

2. **Restraint over excess** — Glow effects are subtle (nebula opacity ≤10%), the sun flare only appears at the correct viewing angle, and the atmospheric rim is physically razor-thin rather than a bright cartoon halo.

3. **Motion as storytelling** — Every animation has a cinematic purpose: Earth slides from right to left as you scroll into the briefing section, the camera drifts like an IMAX rig, and telemetry values interpolate smoothly rather than jumping.

---

## 🌐 Live APIs Used

| API | Data |
|---|---|
| `api.wheretheiss.at/v1/satellites/25544` | ISS real-time position (lat, lng, altitude, velocity) |
| `unpkg.com/three-globe` | Earth day, night, topology, and clouds textures |
| `raw.githubusercontent.com/mrdoob/three.js` | Earth specular map, cloud overlay, Moon texture |

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with ☕ and a love of space exploration.

**[harshith7002](https://github.com/harshith7002)** · Project Zenith · 2026

</div>
