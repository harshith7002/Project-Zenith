import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

def generate_pdf():
    pdf_path = os.path.join(os.getcwd(), "Project_Zenith_Celestial_Eye_README.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=letter,
                            rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    
    story = []
    styles = getSampleStyleSheet()
    
    # Custom styles matching a clean, professional, and premium template
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#000000'),
        alignment=TA_LEFT,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#374151'),
        alignment=TA_LEFT,
        spaceAfter=15
    )
    
    h1_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#000000'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SubSectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#374151'),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#374151'),
        spaceAfter=6
    )
    
    code_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#000000'),
        backColor=colors.HexColor('#F3F4F6'),
        borderPadding=6,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    # Document header
    story.append(Paragraph("PROJECT ZENITH — CELESTIAL EYE README", title_style))
    story.append(Paragraph("The Celestial Eye — Real-Time Space Intelligence Dashboard", subtitle_style))
    story.append(Paragraph("Project Zenith is a cinematic, real-time cosmic radar that tracks satellites, celestial bodies, and space events — built with custom WebGL shaders, React Three Fiber, and live space APIs.", body_style))
    story.append(Spacer(1, 10))
    
    # Section 1: Installation and Setup
    story.append(Paragraph("⚙️ Installation and Setup Instructions", h1_style))
    story.append(Paragraph("Clearly explained instructions to clone, install dependencies, and run the project locally on your machine.", body_style))
    story.append(Paragraph("<b>Prerequisites</b>: To build and run this application locally, you need the following utilities installed:", body_style))
    
    # Prerequisites Table
    prereq_data = [
        [Paragraph("<b>Requirement</b>", body_style), Paragraph("<b>Version</b>", body_style), Paragraph("<b>Link</b>", body_style)],
        [Paragraph("Node.js", body_style), Paragraph("18.x or higher", body_style), Paragraph("https://nodejs.org", body_style)],
        [Paragraph("npm", body_style), Paragraph("9.x or higher", body_style), Paragraph("(Bundled with Node.js)", body_style)],
        [Paragraph("Active Internet Connection", body_style), Paragraph("Required", body_style), Paragraph("(For CDNs, geocoding & live telemetry)", body_style)]
    ]
    prereq_table = Table(prereq_data, colWidths=[150, 100, 250])
    prereq_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F3F4F6')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D5DB')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    story.append(prereq_table)
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("<b>Step-by-Step Local Deployment</b>", h2_style))
    story.append(Paragraph("1. Clone the project repository. Open your terminal and clone the source code:", body_style))
    story.append(Paragraph("git clone https://github.com/harshith7002/Project-Zenith.git<br/>cd Project-Zenith", code_style))
    
    story.append(Paragraph("2. Install runtime and development dependencies:", body_style))
    story.append(Paragraph("npm install", code_style))
    
    story.append(Paragraph("3. Run the development server:", body_style))
    story.append(Paragraph("npm run dev", code_style))
    
    story.append(Paragraph("4. View the application:", body_style))
    story.append(Paragraph("Open your browser and navigate to <b>http://localhost:3000</b>. The page will auto-reload when you save changes.", body_style))
    
    story.append(Paragraph("<b>Production Compiling & Optimization</b>", h2_style))
    story.append(Paragraph("To test the application under local production conditions (runs ESLint and type safety checks):", body_style))
    story.append(Paragraph("npm run build<br/>npm start", code_style))
    story.append(Spacer(1, 10))
    
    # Section 2: Website Functionality
    story.append(Paragraph("🎨 Website Functionality and Unique Features", h1_style))
    story.append(Paragraph("Project Zenith is built with custom WebGL, canvas rendering, and real-time computations to ensure the UI feels alive, responsive, and astronomically accurate.", body_style))
    
    story.append(Paragraph("1. Cinematic 3D Earth (WebGL & Custom Shaders)", h2_style))
    story.append(Paragraph("• <b>Day/Night Terminator</b>: A custom fragment shader blends day and night textures dynamically based on the Sun's coordinate vector using smoothstep(-0.25, 0.25, cosTheta), creating a realistic glowing sunset twilight zone.", bullet_style))
    story.append(Paragraph("• <b>Golden City Lights</b>: Rendered on the night hemisphere of the globe and masked dynamically by cloud layers.", bullet_style))
    story.append(Paragraph("• <b>Ocean Specular Reflections</b>: Real-time specular sun-reflection reflections computed using per-pixel specular mapping.", bullet_style))
    story.append(Paragraph("• <b>Razor-Thin Atmospheric Corona</b>: A custom BackSide atmospheric glow shader renders a thin, bright blue rim on the sunlit limb, fading smoothly into the darkness of space at the terminator.", bullet_style))
    story.append(Paragraph("• <b>Organically Twinkling Starfield</b>: 1,000 circular stars rendered across two depth layers using a custom vertex-shader phase formula to slowly twinkle a subset of stars, eliminating visual noise.", bullet_style))
    story.append(Paragraph("• <b>Anamorphic Lens Flare</b>: Ray-occlusion tested so that the solar flare fades out naturally when the Sun is eclipsed by the Earth's geometry.", bullet_style))
    story.append(Paragraph("• <b>Drift & Mouse Parallax</b>: Slower, high-inertia camera parallax linked to mouse coordinates to create a dramatic, cinematic IMAX camera feel.", bullet_style))
    
    story.append(Paragraph("2. Geocoded Search & Autocomplete Navigation", h2_style))
    story.append(Paragraph("• <b>Autocomplete Search Bar</b>: Allows users to search for any city or country. Queries OpenStreetMap's Nominatim API in the background to suggest matching locations dynamically.", bullet_style))
    story.append(Paragraph("• <b>Raw Coordinate Input</b>: Directly parses coordinates (e.g. <i>17.40, 78.37</i>) typed into the search bar, immediately triggering updates and flying the globe.", bullet_style))
    story.append(Paragraph("• <b>Cache-First GPS Option</b>: Keeps geolocation as a secondary button beside search, caching coordinates in local storage and querying with maximumAge Infinity for &lt;10ms response locks.", bullet_style))
    
    story.append(Paragraph("3. Celestial Radar & Mission Control Dashboard", h2_style))
    story.append(Paragraph("• <b>ISS Tracker</b>: Fetches altitude, velocity, and coordinates of the ISS directly from unauthenticated REST endpoints, updating every 5 seconds.", bullet_style))
    story.append(Paragraph("• <b>Calculated Sky Quality Score</b>: Evaluates live cloud cover, humidity (from Open-Meteo API), Moon phase, and Bortle index. Utilizes pulsing skeleton loading during coordinate transitions.", bullet_style))
    story.append(Paragraph("• <b>Visible Sky Objects</b>: Performs Alt/Az horizon filters using astronomy-engine. Only displays objects physically above the horizon.", bullet_style))
    story.append(Paragraph("• <b>Pulsing Satellite Radar</b>: Projects orbits of Starlink, GPS, and weather constellations onto a 2D polar projection SVG radar grid.", bullet_style))
    story.append(Paragraph("• <b>Context-Aware AI Space Guide</b>: Explains night-sky details and generates natural language summary greet texts based on current coordinates.", bullet_style))
    story.append(Paragraph("• <b>Cosmic Event Predictor</b>: Live timers relative to the active coordinate meridian tracking eclipses, alignments, and meteor shower peaks.", bullet_style))
    
    story.append(Paragraph("4. Interactive 3D Globe", h2_style))
    story.append(Paragraph("• Plots the live tracking path of the ISS in real-time.", bullet_style))
    story.append(Paragraph("• Clicking any coordinate dispatches coordinates instantly to update the dashboard and dispatches camera movements without requiring manual confirmations.", bullet_style))
    
    story.append(Paragraph("5. Solar System Simulator", h2_style))
    story.append(Paragraph("• Renders all 8 planets orbiting the Sun in real-time 3D with Cassini Division Saturn rings and educational planet click modals.", bullet_style))
    story.append(Spacer(1, 10))
    
    # Section 3: Dependencies
    story.append(Paragraph("📦 Dependencies", h1_style))
    story.append(Paragraph("External libraries, frameworks, and tools used to build Project Zenith:", body_style))
    
    story.append(Paragraph("• <b>Next.js</b> (15.5.19): React framework driving the SSR (Server-Side Rendering), App Router routing, and bundler.", bullet_style))
    story.append(Paragraph("• <b>React & React DOM</b> (19.1.0): Declarative component state and rendering structure.", bullet_style))
    story.append(Paragraph("• <b>three</b> (^0.184.0): Core WebGL/3D library for geometries, Custom ShaderMaterial compilations, lighting, and textures.", bullet_style))
    story.append(Paragraph("• <b>@react-three/fiber</b> (^9.6.1): React wrapper for rendering Three.js scenes declaratively.", bullet_style))
    story.append(Paragraph("• <b>@react-three/drei</b> (^10.7.7): Helper hooks and components for Three.js (controls, textures, points).", bullet_style))
    story.append(Paragraph("• <b>@react-three/postprocessing</b> (^3.0.4): Post-processing pipeline enabling glowing WebGL Bloom overlays.", bullet_style))
    story.append(Paragraph("• <b>react-globe.gl</b> (^2.38.0): Specialized wrapper for compiling the interactive coordinate mapping globe.", bullet_style))
    story.append(Paragraph("• <b>astronomy-engine</b> (^2.1.19): Calculates real-time planetary orbits, Alt/Az coordinates, and moon illumination phases.", bullet_style))
    story.append(Paragraph("• <b>satellite.js</b> (^7.0.1): Implements SGP4 orbit propagation to calculate satellite coordinates from Two-Line Element (TLE) datasets.", bullet_style))
    story.append(Paragraph("• <b>framer-motion</b> (^12.40.0): Declarative animation engine driving transitions and fades.", bullet_style))
    story.append(Paragraph("• <b>lenis & gsap</b>: Smooth scrolling integrations and timeline animations.", bullet_style))
    story.append(Paragraph("• <b>tailwindcss</b> (^4.x): Utility styling framework.", bullet_style))
    
    doc.build(story)
    print(f"Successfully generated final submission PDF at {pdf_path}")

if __name__ == "__main__":
    generate_pdf()
