# Project Zenith: Celestial Eye
> Real-Time Space Intelligence & Astronomy Telemetry Dashboard

Project Zenith (Celestial Eye) is a premium, real-time space intelligence tracker and astronomy simulation dashboard. Built with a sleek dark-mode glassmorphic interface, it combines Three.js WebGL rendering with local astronomical engines and satellite propagation.

---

## 1. Website Functionality and Unique Features

* **Geocoded Search & Coordinate Autocomplete**: Enables instant search for any city, country, or raw coordinate entry (e.g. `17.40, 78.37`). It queries OpenStreetMap's Nominatim API dynamically, autocompleting suggestions and flying the 3D globe camera to targets instantly.
* **Cache-First Location Locking**: Uses optimistic caching to load the last observation point in under 10ms on subsequent sessions, maintaining offline and private-mode stability.
* **3D Interactive Globe**: Visualizes a high-fidelity earth with dynamic day/night light shadow cycles, active coordinate select telemetry pulses, and live orbit traces.
* **SGP4 TLE Satellite Propagation**: Performs live local orbital calculations using NORAD Two-Line Element (TLE) datasets, displaying real-time positions and horizon altitudes.
* **3D Solar System View Portal**: Interactive WebGL solar canvas displaying exact planetary orbit lines, Saturn rings, and asteroid belts, with a responsive fullscreen portal zoom.
* **Dynamic AI Space Guide**: A reactive sky guide generating natural language summary observations based on current coordinates, cloud cover, and planet visibility heights.
* **Cosmic Event Predictor**: Dynamic countdown clock tracking eclipses, planetary alignments, and meteor shower peaks matching the active coordinate meridian.

---

## 2. Installation and Setup Instructions

### Prerequisites
* Node.js (version 18.0 or later)
* npm (package manager)

### Local Development Setup
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/harshith7002/Project-Zenith.git
   cd Project-Zenith
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build and Start Production Server**:
   ```bash
   npm run build
   npm run start
   ```

---

## 3. Core Project Dependencies

| Dependency Layer | Libraries / Tools Used | Purpose |
| :--- | :--- | :--- |
| **Application Core** | React 19, Next.js 15, TypeScript | Reactive state management, Next.js hydration, type-safe structures. |
| **3D Rendering** | Three.js, `@react-three/fiber`, `@react-three/drei` | WebGL canvas rendering, orbits, mesh loading, OrbitControls. |
| **Interactive Globe** | `react-globe.gl`, `three-globe` | Day/night lights Earth rendering, markers, and orbit paths. |
| **Orbit Calculations** | `satellite.js`, `astronomy-engine` | SGP4 satellite propagation math and local horizontal coordinates. |
| **Styles & Motion** | TailwindCSS, Vanilla CSS, `framer-motion` | Glassmorphic cards styling, telemetry indicators, card transitions. |
