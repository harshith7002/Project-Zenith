export const COLORS = {
  background: '#050816',
  primary: '#7C3AED',
  accent: '#06B6D4',
  secondary: '#1E293B',
  glow: '#A78BFA',
  gold: '#FFD700',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.6)',
} as const;

export const PLANET_DATA = [
  {
    name: 'Mercury',
    radius: 0.4,
    distance: 8,
    speed: 4.74,
    color: '#B5B5B5',
    textureUrl: null,
  },
  {
    name: 'Venus',
    radius: 0.7,
    distance: 12,
    speed: 3.5,
    color: '#E8C87A',
    textureUrl: null,
  },
  {
    name: 'Earth',
    radius: 0.8,
    distance: 17,
    speed: 2.98,
    color: '#4B9CE8',
    textureUrl: null,
  },
  {
    name: 'Mars',
    radius: 0.5,
    distance: 22,
    speed: 2.41,
    color: '#C1440E',
    textureUrl: null,
  },
  {
    name: 'Jupiter',
    radius: 1.8,
    distance: 30,
    speed: 1.31,
    color: '#C88B3A',
    textureUrl: null,
  },
  {
    name: 'Saturn',
    radius: 1.5,
    distance: 40,
    speed: 0.97,
    color: '#E4D191',
    textureUrl: null,
    hasRings: true,
  },
  {
    name: 'Uranus',
    radius: 1.1,
    distance: 50,
    speed: 0.68,
    color: '#7DE8E8',
    textureUrl: null,
  },
  {
    name: 'Neptune',
    radius: 1.0,
    distance: 58,
    speed: 0.54,
    color: '#3F54BA',
    textureUrl: null,
  },
] as const;

export const FEATURES = [
  {
    icon: '🛸',
    title: 'Live ISS Tracking',
    description: 'Watch the International Space Station orbit Earth in real time with position, altitude, speed, and upcoming pass predictions.',
    color: '#7C3AED',
  },
  {
    icon: '🛰️',
    title: 'Satellite Monitoring',
    description: 'Track 8,000+ active satellites across all orbital shells. Filter by category: GPS, weather, communication, spy sats.',
    color: '#06B6D4',
  },
  {
    icon: '🪐',
    title: 'Planet Positions',
    description: 'See exactly which planets are visible above your location tonight, their altitude, azimuth, and brightness magnitude.',
    color: '#F59E0B',
  },
  {
    icon: '🌤️',
    title: 'Weather Conditions',
    description: 'Real-time sky quality index: cloud cover, atmospheric transparency, humidity, and Bortle dark-sky scale rating.',
    color: '#10B981',
  },
  {
    icon: '📚',
    title: 'Educational Facts',
    description: 'Every celestial object reveals rich educational cards: mythology, discovery history, physics, and observation tips.',
    color: '#EF4444',
  },
  {
    icon: '⚡',
    title: 'Real-Time Updates',
    description: 'WebSocket-powered live feeds ensure you always see the most current orbital data — updated every 5 seconds.',
    color: '#8B5CF6',
  },
] as const;

export const TIMELINE_STEPS = [
  {
    step: '01',
    title: 'Choose Location',
    description: 'Select any city or coordinates on Earth using our interactive globe or automatic geolocation detection.',
    icon: '📍',
  },
  {
    step: '02',
    title: 'Fetch Coordinates',
    description: 'Precise latitude, longitude, and elevation resolved via Nominatim geocoding with sub-metre accuracy.',
    icon: '🎯',
  },
  {
    step: '03',
    title: 'Retrieve Space Data',
    description: 'Backend fan-out simultaneously queries NASA, CelesTrak, Open Notify, and OpenWeather APIs in parallel.',
    icon: '📡',
  },
  {
    step: '04',
    title: 'Generate Visualization',
    description: 'Astronomy Engine computes the live celestial sphere for your location. CesiumJS renders it in stunning 3D.',
    icon: '🎨',
  },
  {
    step: '05',
    title: 'Explore Objects',
    description: 'Click any object in the sky — ISS, satellites, planets, constellations — to reveal rich educational panels.',
    icon: '🔭',
  },
] as const;

export const STATS = [
  { value: 27000, suffix: '+', label: 'Tracked Satellites', icon: '🛰️' },
  { value: 8, suffix: '', label: 'Planets Monitored', icon: '🪐' },
  { value: 88, suffix: '', label: 'Constellations', icon: '⭐' },
  { value: 120000, suffix: '+', label: 'Stars Catalogued', icon: '✨' },
] as const;
