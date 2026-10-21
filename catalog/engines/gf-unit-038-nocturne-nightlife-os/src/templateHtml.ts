import { VenueContent } from "./types";

export function generateTemplateHtml(content: VenueContent, themeClass: "theme-neon-velvet" | "theme-gold-noir" | "theme-emerald-dark"): string {
  // Map theme colors to literal CSS variables to be embedded in the vanilla HTML file
  const themeStyles = {
    "theme-neon-velvet": {
      bgMain: "#0a050d",
      bgCard: "#120919",
      bgMuted: "#1c0e27",
      textLead: "#ffffff",
      textBody: "#d8cde3",
      textDim: "#998aa6",
      brand: "#ff2a7a",
      brandRgb: "255, 42, 122",
      brandSecondary: "#a855f7",
      glow: "rgba(255, 42, 122, 0.35)",
      border: "rgba(255, 42, 122, 0.15)",
      borderStrong: "rgba(255, 42, 122, 0.35)",
      radiusBtn: "9999px"
    },
    "theme-gold-noir": {
      bgMain: "#0a0a0a",
      bgCard: "#141414",
      bgMuted: "#1e1e1e",
      textLead: "#fdfbf7",
      textBody: "#e4e0d5",
      textDim: "#a39e93",
      brand: "#e7c169",
      brandRgb: "231, 193, 105",
      brandSecondary: "#c5a24c",
      glow: "rgba(231, 193, 105, 0.25)",
      border: "rgba(231, 193, 105, 0.12)",
      borderStrong: "rgba(231, 193, 105, 0.3)",
      radiusBtn: "0px"
    },
    "theme-emerald-dark": {
      bgMain: "#050b07",
      bgCard: "#0b1510",
      bgMuted: "#112219",
      textLead: "#f4faf6",
      textBody: "#cfded5",
      textDim: "#8fa89b",
      brand: "#10b981",
      brandRgb: "16, 185, 129",
      brandSecondary: "#059669",
      glow: "rgba(16, 185, 129, 0.3)",
      border: "rgba(16, 185, 129, 0.15)",
      borderStrong: "rgba(16, 185, 129, 0.35)",
      radiusBtn: "8px"
    }
  }[themeClass];

  // Helper to generate menu items based on category for HTML output
  const generateMenuItemsHtml = (category: string) => {
    return content.menuItems
      .filter((item) => item.category === category)
      .map((item) => {
        const badgeHtml = item.badge
          ? `<span class="badge">${item.badge}</span>`
          : "";
        return `
        <!-- ITEM: ${item.name} -->
        <div class="menu-item bg-card" data-category="${item.category}">
          <div class="menu-item-header">
            <h4 class="menu-item-name font-serif text-lead h4-style">${item.name} ${badgeHtml}</h4>
            <span class="menu-item-price font-display text-brand">${item.price}</span>
          </div>
          <p class="menu-item-desc text-body">${item.description}</p>
        </div>`;
      })
      .join("\n        ");
  };

  // Helper to generate event items for HTML output
  const generateEventsHtml = () => {
    return content.events
      .map((event) => {
        const badgeHtml = event.badge
          ? `<span class="event-badge">${event.badge}</span>`
          : "";
        return `
        <!-- LIVE EVENT: ${event.day} - ${event.title} -->
        <div class="event-card bg-card">
          <div class="event-date font-display">
            <span class="event-day text-brand">${event.day}</span>
            <span class="event-time">${event.time}</span>
          </div>
          <div class="event-info">
            <div class="event-header">
              <h4 class="event-title font-serif text-lead h4-style">${event.title}</h4>
              ${badgeHtml}
            </div>
            <p class="event-desc text-body">${event.description}</p>
            <span class="event-genre font-mono text-dim text-xs">${event.genre}</span>
          </div>
          <div class="event-action">
            <a href="#reservations" class="btn btn-secondary btn-sm font-display">Reserve Spot</a>
          </div>
        </div>`;
      })
      .join("\n      ");
  };

  // Helper to generate testimonials
  const generateTestimonialsHtml = () => {
    return content.testimonials
      .map((praise, index) => {
        return `
        <!-- TESTIMONIAL ${index + 1} -->
        <blockquote class="testimonial bg-card">
          <div class="quote-mark text-brand font-serif">“</div>
          <p class="quote-text font-serif text-lead">${praise.quote}</p>
          <cite class="quote-author">
            <span class="author-name font-display text-lead">${praise.author}</span>
            <span class="author-role font-sans text-dim">${praise.role} • ${praise.source}</span>
          </cite>
        </blockquote>`;
      })
      .join("\n      ");
  };

  // Dynamic feature cards with SVG icons based on iconName
  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case "Music":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
      case "Flame":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
      case "GlassWater":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M15.2 22H8.8a2 2 0 0 1-2-1.79L5 3h14l-1.81 17.21A2 2 0 0 1 15.2 22Z"/><path d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0"/></svg>`;
      case "Crown":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18v2H3z"/></svg>`;
      case "Compass":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
      case "Waves":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M2 6c.6.5 1.2 1 2.5 1C6 7 7 6 8 6c1.3 0 2 1 3.5 1 1.5 0 2-1 3.5-1 1.5 0 2 1 3.5 1 1.3 0 1.9-.5 2.5-1"/><path d="M2 12c.6.5 1.2 1 2.5 1 1.5 0 2.5-1 3.5-1 1.3 0 2 1 3.5 1 1.5 0 2-1 3.5-1 1.5 0 2 1 3.5 1 1.3 0 1.9-.5 2.5-1"/><path d="M2 18c.6.5 1.2 1 2.5 1 1.5 0 2.5-1 3.5-1 1.3 0 2 1 3.5 1 1.5 0 2-1 3.5-1 1.5 0 2 1 3.5 1 1.3 0 1.9-.5 2.5-1"/></svg>`;
      case "ShieldCheck":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 11 2 2 4-4"/></svg>`;
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><circle cx="12" cy="12" r="10"/></svg>`;
    }
  };

  const generateFeaturesHtml = () => {
    return content.features
      .map((f) => {
        return `
        <!-- FEATURE CARD: ${f.title} -->
        <div class="val-card bg-card">
          <div class="val-icon text-brand">
            ${getFeatureIcon(f.iconName)}
          </div>
          <h3 class="val-card-title font-display text-lead h3-style">${f.title}</h3>
          <p class="val-card-desc text-body">${f.description}</p>
        </div>`;
      })
      .join("\n      ");
  };

  const generateHoursListHtml = () => {
    return content.hours
      .map((h) => {
        return `
            <div class="hours-row">
              <span class="hours-days font-display text-lead text-sm">${h.days}</span>
              <div class="hours-line border-theme border-dotted"></div>
              <span class="hours-time font-mono text-brand text-sm">${h.time}</span>
            </div>`;
      })
      .join("\n");
  };

  // Render complete HTML template
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <!-- 
    ========================================================================
    PRODUCT TEMPLATE VERSION: 1.0.0
    DESIGN SYSTEM: LATE-NIGHT LUXURY (NEON SOUL / VELVET DESIGN ARCHITECTURE)
    LICENSED FOR COMMERCIAL REDISTRIBUTION AND RESALE ON GUMROAD
    
    INSTRUCTIONS FOR BUYERS:
    - Custom variables are clearly declared inside the :root style section below.
    - Match standard sections by searching for the "EDIT" comments.
    ========================================================================
  -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.brandName} — ${content.conceptName}</title>
  
  <!-- SEO & DISCOVERY METADATA -->
  <meta name="description" content="${content.heroSub}">
  <meta name="robots" content="index, follow">
  
  <!-- OPEN GRAPH (FACEBOOK, LINKEDIN, SLACK) -->
  <meta property="og:title" content="${content.brandName} — Live Experiences">
  <meta property="og:description" content="${content.heroSub}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80">
  
  <!-- TWITTER CARD -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${content.brandName} — Special Nightlife Lounge">
  <meta name="twitter:description" content="${content.heroSub}">
  
  <!-- SCHEMA.ORG STRUCTURED DATA DATA (JSON-LD) FOR SENSORY DISCOVERABILITY -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    "name": "${content.brandName}",
    "image": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80",
    "description": "${content.heroSub}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "${content.address}",
      "addressLocality": "${content.cityState.split(",")[0].trim()}",
      "addressRegion": "${content.cityState.split(",")[1].trim().split(" ")[0]}",
      "postalCode": "${content.cityState.match(/\\d+/)?.[0] || ""}",
      "addressCountry": "US"
    },
    "telephone": "${content.phone}",
    "priceRange": "$$$",
    "servesCuisine": "Southern Fusion, Small Plates, Craft Bitters",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "17:00",
        "closes": "02:00"
      }
    ]
  }
  </script>

  <!-- LATE-NIGHT LUXURY FONTS IMPORT -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Space+Grotesk:wght@400;500;650;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <style>
    /* =========================================================================
       1. CUSTOMIZABLE DESIGN SYSTEM VARIABLES (EDIT COLORS HERE)
       ========================================================================= */
    :root {
      /* Theme Presets:
         Copy the values of your favorite theme preset color variables here. */
         
      --color-bg-main: ${themeStyles.bgMain};        /* Deep Midnight Background */
      --color-bg-card: ${themeStyles.bgCard};        /* Elevated Section/Card Surfaces */
      --color-bg-muted: ${themeStyles.bgMuted};       /* Dropdown / Tag backgrounds */
      
      --color-text-lead: ${themeStyles.textLead};      /* Pure Off-White Headings & High Contrast Text */
      --color-text-body: ${themeStyles.textBody};      /* Desaturated, Readable Body Text */
      --color-text-dim: ${themeStyles.textDim};       /* Subtitles, Dates, Footers */
      
      --color-brand: ${themeStyles.brand};          /* Central Accent / Neon Flare Accent (Rose/Gold/Emerald) */
      --color-brand-rgb: ${themeStyles.brandRgb};
      --color-brand-secondary: ${themeStyles.brandSecondary};
      
      --color-glow: ${themeStyles.glow};  /* Soft ambient lighting diffusion behind cards */
      --color-border: ${themeStyles.border};     /* Ultra subtle borders separating dark cards */
      --color-border-strong: ${themeStyles.borderStrong}; /* Focus grids active borders */
      
      --radius-btn: ${themeStyles.radiusBtn};           /* Border Radius for buttons (Pill, Round, or Flat Sharp) */
      --radius-card: 12px;
      
      /* Typography System */
      --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
      --font-serif: 'Playfair Display', Georgia, serif;
      --font-display: 'Space Grotesk', system-ui, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    /* =========================================================================
       2. REUSABLE RESET & GLOBAL DEFAULTS (DO NOT EDIT UNLESS NEEDED)
       ========================================================================= */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
      background-color: var(--color-bg-main);
      color: var(--color-text-body);
      font-family: var(--font-sans);
      font-size: 16px;
      line-height: 1.6;
    }

    body {
      overflow-x: hidden;
    }

    a {
      color: inherit;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    img {
      max-width: 100%;
      height: auto;
      object-fit: cover;
      display: block;
    }

    /* Helper Layout Classes */
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    .section-pad {
      padding: 6rem 0;
    }

    /* Typography Utilities */
    .h1-style {
      font-family: var(--font-serif);
      font-size: clamp(2.5rem, 5vw, 4.5rem);
      font-weight: 500;
      line-height: 1.1;
      color: var(--color-text-lead);
      letter-spacing: -0.02em;
    }

    .h2-style {
      font-family: var(--font-serif);
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 500;
      line-height: 1.2;
      color: var(--color-text-lead);
      letter-spacing: -0.01em;
    }

    .h3-style {
      font-family: var(--font-serif);
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--color-text-lead);
    }

    .h4-style {
      font-family: var(--font-serif);
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--color-text-lead);
    }

    .text-sm { font-size: 0.875rem; }
    .text-xs { font-size: 0.75rem; }
    .font-sans { font-family: var(--font-sans); }
    .font-serif { font-family: var(--font-serif); }
    .font-display { font-family: var(--font-display); letter-spacing: 0.05em; text-transform: uppercase; }
    .font-mono { font-family: var(--font-mono); }
    
    .text-brand { color: var(--color-brand); }
    .text-lead { color: var(--color-text-lead); }
    .text-body { color: var(--color-text-body); }
    .text-dim { color: var(--color-text-dim); }
    
    .bg-main { background-color: var(--color-bg-main); }
    .bg-card { background-color: var(--color-bg-card); }
    .bg-muted { background-color: var(--color-bg-muted); }
    
    .border-theme { border: 1px solid var(--color-border); }
    .border-theme-strong { border: 1px solid var(--color-border-strong); }

    /* Button Tokens */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      font-family: var(--font-display);
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      border-radius: var(--radius-btn);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid transparent;
    }

    .btn-primary {
      background-color: var(--color-brand);
      color: var(--color-bg-main);
      box-shadow: 0 4px 20px rgba(var(--color-brand-rgb), 0.25);
    }

    .btn-primary:hover {
      background-color: var(--color-text-lead);
      color: var(--color-bg-main);
      box-shadow: 0 4px 30px rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .btn-secondary {
      background-color: transparent;
      border-color: var(--color-border-strong);
      color: var(--color-text-lead);
    }

    .btn-secondary:hover {
      border-color: var(--color-brand);
      box-shadow: 0 0 15px var(--color-glow);
      transform: translateY(-2px);
    }

    .btn-sm {
      padding: 0.6rem 1.2rem;
      font-size: 0.75rem;
    }

    /* Glow Elements */
    .glow-overlay {
      position: absolute;
      width: 40vw;
      height: 40vw;
      border-radius: 50%;
      background: radial-gradient(circle, var(--color-glow) 0%, transparent 70%);
      filter: blur(100px);
      pointer-events: none;
      z-index: 0;
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: var(--color-bg-main);
    }
    ::-webkit-scrollbar-thumb {
      background: var(--color-bg-muted);
      border: 2px solid var(--color-bg-main);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--color-brand);
    }

    /* =========================================================================
       3. KEY COMPONENT STYLES
       ========================================================================= */
       
    /* Floating Header & Announcement Strip */
    .announcement-strip {
      background-color: var(--color-brand);
      color: var(--color-bg-main);
      font-family: var(--font-display);
      font-size: 0.75rem;
      font-weight: 700;
      text-align: center;
      padding: 0.4rem 1rem;
      letter-spacing: 0.1em;
      position: relative;
      z-index: 1010;
    }

    .header-nav {
      position: sticky;
      top: 0;
      background-color: rgba(var(--color-bg-main-rgb, 10, 5, 13), 0.85); /* fallback custom backup */
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--color-border);
      z-index: 1000;
      transition: background-color 0.3s;
    }

    .header-nav.scrolled {
      background-color: var(--color-bg-main);
    }

    .nav-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 80px;
      padding: 0 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .logo-container .brand-name {
      font-family: var(--font-display);
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--color-text-lead);
      letter-spacing: 0.15em;
    }

    .logo-container .brand-name span {
      color: var(--color-brand);
    }

    .nav-links {
      display: flex;
      gap: 2.22rem;
      list-style: none;
    }

    .nav-link {
      font-family: var(--font-display);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--color-text-dim);
    }

    .nav-link:hover, .nav-link.active {
      color: var(--color-brand);
    }

    /* Hamburger menu for small screens */
    .mobile-menu-toggle {
      display: none;
      background: none;
      border: none;
      color: var(--color-text-lead);
      cursor: pointer;
    }

    .mobile-drawer {
      position: fixed;
      top: 110px; /* height of header + alert height */
      right: -100%;
      width: 100%;
      height: calc(100vh - 110px);
      background-color: var(--color-bg-card);
      border-left: 1px solid var(--color-border);
      z-index: 999;
      padding: 3rem 2rem;
      transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      gap: 2rem;
      list-style: none;
    }

    .mobile-drawer.open {
      right: 0;
    }

    .mobile-drawer .nav-link {
      font-size: 1.5rem;
    }

    /* Section Header Details */
    .section-header {
      margin-bottom: 4rem;
      max-width: 700px;
    }

    .section-tag {
      font-family: var(--font-display);
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-brand);
      letter-spacing: 0.2em;
      text-transform: uppercase;
      display: block;
      margin-bottom: 0.75rem;
    }

    /* Hero Section */
    .hero-sec {
      position: relative;
      min-height: calc(90vh - 80px);
      display: flex;
      align-items: center;
      padding: 4rem 0;
      overflow: hidden;
    }

    .hero-content {
      position: relative;
      z-index: 2;
    }

    .hero-sec .hero-tagline {
      font-family: var(--font-display);
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-brand);
      letter-spacing: 0.25em;
      margin-bottom: 1.5rem;
      display: block;
    }

    .hero-sec p.hero-subhead {
      font-size: clamp(1rem, 2vw, 1.2rem);
      margin: 1.5rem 0 2.5rem 0;
      max-width: 600px;
      color: var(--color-text-body);
    }

    .hero-sec .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
    }

    /* Asymmetric Hero Image Overlay positioning */
    .hero-visual {
      position: absolute;
      top: 5%;
      right: -10%;
      width: 55%;
      height: 90%;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--color-border);
      box-shadow: 0 20px 80px rgba(0, 0, 0, 0.7);
      opacity: 0.75;
      display: none; /* Block on desktop media query */
    }

    .hero-visual::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, var(--color-bg-main) 0%, transparent 60%),
                  linear-gradient(0deg, var(--color-bg-main) 0%, transparent 30%);
    }

    /* Venue Features / Rituals */
    .rituals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .val-card {
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      padding: 2.5rem 2rem;
      border-radius: var(--radius-card);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .val-card:hover {
      border-color: var(--color-brand);
      box-shadow: 0 10px 30px var(--color-glow);
      transform: translateY(-4px);
    }

    .val-icon {
      margin-bottom: 1.5rem;
    }

    .lucide-icon {
      width: 38px;
      height: 38px;
      stroke-width: 1.5px;
    }

    .val-card-title {
      margin-bottom: 1rem;
    }

    .val-card-desc {
      color: var(--color-text-dim);
      font-size: 0.925rem;
    }

    /* Menu & Offerings Section */
    .menu-filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 3.5rem;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 1rem;
    }

    .filter-btn {
      background: none;
      border: none;
      font-family: var(--font-display);
      font-weight: 600;
      font-size: 0.8rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      padding: 0.5rem 1rem;
      color: var(--color-text-dim);
      cursor: pointer;
      position: relative;
    }

    .filter-btn:hover {
      color: var(--color-text-lead);
    }

    .filter-btn.active {
      color: var(--color-brand);
    }

    .filter-btn.active::after {
      content: '';
      position: absolute;
      bottom: -1.1rem;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: var(--color-brand);
    }

    .menu-cards-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      .menu-cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .menu-item {
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      padding: 2rem;
      border-radius: var(--radius-card);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: block;
    }

    .menu-item:hover {
      transform: scale(1.01);
      border-color: var(--color-border-strong);
    }

    .menu-item-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 0.75rem;
    }

    .menu-item-name {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .menu-item-price {
      font-weight: 600;
    }

    .badge {
      display: inline-block;
      font-family: var(--font-display);
      font-size: 0.65rem;
      font-weight: 700;
      background-color: var(--color-bg-muted);
      color: var(--color-brand);
      padding: 0.2rem 0.6rem;
      border: 1px solid var(--color-border-strong);
      letter-spacing: 0.05em;
    }

    .menu-item-desc {
      color: var(--color-text-dim);
      font-size: 0.9rem;
    }

    /* Asymmetric Narrative Section */
    .atmosphere-split {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3.5rem;
      align-items: center;
    }

    @media (min-width: 992px) {
      .atmosphere-split {
        grid-template-columns: repeat(12, 1fr);
      }
      .atmos-text {
        grid-column: span 6;
      }
      .atmos-visual-stack {
        grid-column: span 6;
      }
    }

    .atmos-text {
      text-align: left;
    }

    .atmos-text h3 {
      font-size: 1.7rem;
      margin-bottom: 2rem;
      color: var(--color-text-lead);
    }

    .atmos-text p {
      margin-bottom: 1.5rem;
      color: var(--color-text-body);
      font-size: 1.05rem;
    }

    .signature-block {
      margin-top: 3rem;
      border-left: 2px solid var(--color-brand);
      padding-left: 1.5rem;
    }

    .signature-author {
      font-size: 1.15rem;
      color: var(--color-text-lead);
      display: block;
      margin-bottom: 0.25rem;
    }

    .signature-label {
      font-size: 0.8rem;
      color: var(--color-text-dim);
    }

    .atmos-pic-wrapper {
      position: relative;
      border-radius: var(--radius-card);
      overflow: hidden;
      border: 1px solid var(--color-border);
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.6);
    }

    .atmos-pic-wrapper::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, rgba(var(--color-brand-rgb), 0.15), transparent 60%);
      pointer-events: none;
    }

    .atmos-img {
      width: 100%;
      height: 480px;
      filter: saturate(0.85) contrast(1.1);
    }

    /* Events Section */
    .events-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .event-card {
      display: flex;
      flex-direction: column;
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      padding: 2rem;
      border-radius: var(--radius-card);
      gap: 1.5rem;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @media (min-width: 768px) {
      .event-card {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .event-card:hover {
      border-color: var(--color-brand);
      box-shadow: 0 5px 25px var(--color-glow);
    }

    .event-date {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 160px;
    }

    .event-day {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .event-time {
      font-size: 0.8rem;
      color: var(--color-text-dim);
    }

    .event-info {
      flex: 1;
    }

    .event-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .event-badge {
      font-family: var(--font-display);
      font-size: 0.65rem;
      font-weight: 700;
      background-color: var(--color-brand);
      color: var(--color-bg-main);
      padding: 0.15rem 0.5rem;
      letter-spacing: 0.05em;
    }

    .event-desc {
      color: var(--color-text-dim);
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
      max-width: 580px;
    }

    /* Testimonials Carousel Or Grid */
    .testimonials-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 992px) {
      .testimonials-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .testimonial {
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      padding: 3rem 2.5rem;
      border-radius: var(--radius-card);
      position: relative;
    }

    .quote-mark {
      font-size: 4rem;
      line-height: .1;
      opacity: 0.45;
      margin-bottom: 1.5rem;
    }

    .quote-text {
      font-size: 1.15rem;
      font-style: italic;
      color: var(--color-text-lead);
      margin-bottom: 2rem;
    }

    .quote-author {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-style: normal;
    }

    .author-name {
      font-weight: 600;
    }

    .author-role {
      font-size: 0.8rem;
    }

    /* Bookings & Reservations System (Split Section) */
    .booking-split {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4rem;
    }

    @media (min-width: 992px) {
      .booking-split {
        grid-template-columns: repeat(12, 1fr);
      }
      .booking-form-wrap {
        grid-column: span 7;
      }
      .private-events-promo {
        grid-column: span 5;
      }
    }

    .booking-form-wrap {
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      padding: 3rem 2.5rem;
      border-radius: var(--radius-card);
      position: relative;
    }

    .reservation-form {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-top: 2rem;
    }

    @media (min-width: 600px) {
      .form-row {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-group label {
      font-family: var(--font-display);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-lead);
      letter-spacing: 0.05em;
    }

    .form-control {
      background-color: var(--color-bg-muted);
      border: 1px solid var(--color-border);
      color: var(--color-text-lead);
      padding: 1rem;
      border-radius: 6px;
      font-family: var(--font-sans);
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .form-control:focus {
      border-color: var(--color-brand);
      outline: none;
      box-shadow: 0 0 10px rgba(var(--color-brand-rgb), 0.2);
    }

    .form-status {
      display: none;
      padding: 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .form-status.success {
      display: block;
      background-color: rgba(16, 185, 129, 0.15);
      border: 1px solid #10b981;
      color: #34d399;
    }

    /* Private events sell board */
    .private-events-promo {
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-bg-card) 0%, rgba(var(--color-brand-rgb), 0.05) 100%);
      border: 1px solid var(--color-border);
      padding: 3rem 2.5rem;
      border-radius: var(--radius-card);
    }

    .promo-highlight-box {
      border-top: 1px solid var(--color-border);
      margin: 2rem 0;
      padding-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .promo-highlight-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
      color: var(--color-text-lead);
    }

    .promo-bullet {
      width: 6px;
      height: 6px;
      background-color: var(--color-brand);
      border-radius: 50%;
    }

    /* Location, hours and contact info */
    .contact-split {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3.5rem;
    }

    @media (min-width: 992px) {
      .contact-split {
        grid-template-columns: repeat(12, 1fr);
      }
      .contact-details {
        grid-column: span 5;
      }
      .contact-map-frame {
        grid-column: span 7;
      }
    }

    .contact-card-sub {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      margin-top: 2rem;
    }

    .detail-item {
      display: flex;
      gap: 1rem;
    }

    .detail-icon {
      color: var(--color-brand);
      flex-shrink: 0;
    }

    .hours-block {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--color-border);
    }

    .hours-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
    }

    .hours-line {
      flex: 1;
      height: 1px;
    }

    /* Stand-in Styled Map Grid */
    .contact-map-frame {
      min-height: 380px;
      background-color: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-card);
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .map-grid-standin {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(var(--color-bg-muted) 1px, transparent 1px);
      background-size: 20px 20px;
      opacity: 0.55;
    }

    .map-inner-card {
      position: relative;
      z-index: 2;
      background-color: var(--color-bg-main);
      border: 1px solid var(--color-brand);
      padding: 2.22rem;
      max-width: 380px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px var(--color-glow);
    }

    /* Premium Footer */
    .premium-footer {
      background-color: var(--color-bg-card);
      border-top: 1px solid var(--color-border);
      padding: 5rem 0 3rem 0;
      font-size: 0.9rem;
    }

    .footer-columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 3rem;
      margin-bottom: 4rem;
    }

    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .footer-brand {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--color-text-lead);
    }

    .footer-col h5 {
      font-family: var(--font-display);
      font-size: 0.8rem;
      font-weight: 750;
      color: var(--color-text-lead);
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }

    .footer-links {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      list-style: none;
    }

    .footer-links a {
      color: var(--color-text-dim);
    }

    .footer-links a:hover {
      color: var(--color-brand);
      padding-left: 4px;
    }

    .newsletter-form {
      display:flex;
      gap: 0.5rem;
    }

    .footer-bottom {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--color-border);
      padding-top: 2.5rem;
    }

    @media (min-width: 768px) {
      .footer-bottom {
        flex-direction: row;
      }
    }

    .back-to-top {
      background: none;
      border: 1px solid var(--color-border-strong);
      color: var(--color-text-dim);
      border-radius: var(--radius-btn);
      padding: 0.5rem 1rem;
      font-family: var(--font-display);
      font-size: 0.75rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .back-to-top:hover {
      border-color: var(--color-brand);
      color: var(--color-text-lead);
      box-shadow: 0 0 10px var(--color-glow);
    }

    /* Responsive adjustments */
    @media (min-width: 992px) {
      .hero-visual {
        display: block;
      }
      .mobile-menu-toggle {
        display: none;
      }
    }

    @media (max-width: 991px) {
      .mobile-menu-toggle {
        display: block;
      }
      .nav-links {
        display: none;
      }
    }

  </style>
</head>
<body class="${themeClass}">

  <!-- =========================================================================
       1. ANNOUNCEMENT / STATUS STRIP (EDIT ANNOUNCEMENT HERE)
       ========================================================================= -->
  <div class="announcement-strip">
    ${content.announcement}
  </div>

  <!-- =========================================================================
       2. STICKY NAVIGATION (EDIT DECORATIVE LOGO OR BRANDING HERE)
       ========================================================================= -->
  <header class="header-nav" id="headerNav">
    <div class="nav-container">
      <div class="logo-container">
        <a href="#" class="brand-name font-display">
          ${content.brandName.split(" ")[0]}<span>${content.brandName.split(" ").slice(1).join(" ") ? " " + content.brandName.split(" ").slice(1).join(" ") : ""}</span>
        </a>
      </div>
      
      <nav>
        <ul class="nav-links">
          <li><a href="#about" class="nav-link">Our Story</a></li>
          <li><a href="#rituals" class="nav-link">The Room</a></li>
          <li><a href="#menu" class="nav-link">Our Menu</a></li>
          <li><a href="#events" class="nav-link">Events</a></li>
          <li><a href="#reservations" class="nav-link">Reservations</a></li>
        </ul>
      </nav>

      <div style="display: flex; align-items: center; gap: 1rem;">
        <a href="#reservations" class="btn btn-primary btn-sm font-display">${content.ctaPrimaryText.split(" ")[0] + " " + (content.ctaPrimaryText.split(" ")[1] || "Table")}</a>
        <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 28px; height: 28px;"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  </header>

  <!-- MOBILE MENU DRAWER -->
  <ul class="mobile-drawer" id="mobileDrawer">
    <li><a href="#about" class="nav-link">Our Story</a></li>
    <li><a href="#rituals" class="nav-link">The Room</a></li>
    <li><a href="#menu" class="nav-link">Our Menu</a></li>
    <li><a href="#events" class="nav-link">Events</a></li>
    <li><a href="#reservations" class="nav-link">Reservations</a></li>
  </ul>

  <!-- =========================================================================
       3. HERO / SPOTLIGHT (EDIT TITLE, COPY AND LINK CTAs HERE)
       ========================================================================= -->
  <section class="hero-sec" id="hero">
    <div class="glow-overlay" style="top: -10%; left: -5%;"></div>
    
    <div class="container" style="position: relative; z-index: 10;">
      <div class="hero-content">
        <span class="hero-tagline font-display">${content.tagline}</span>
        <h1 class="h1-style font-serif">${content.heroTitle}</h1>
        <p class="hero-subhead text-body text-lead">${content.heroSub}</p>
        
        <div class="hero-actions">
          <a href="#reservations" class="btn btn-primary font-display">${content.ctaPrimaryText}</a>
          <a href="#events" class="btn btn-secondary font-display">${content.ctaSecondaryText}</a>
        </div>
      </div>
    </div>

    <!-- Asymmetrical Visual Frame -->
    <div class="hero-visual">
      <img src="${content.id === "neon-soul" ? "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80" : "https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80"}" alt="Atmosphere" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
  </section>

  <!-- =========================================================================
       4. SIGNATURE FEATURES / UNIQUE VALUE CARDS (EDIT FEATURE CARDS HERE)
       ========================================================================= -->
  <section class="section-pad bg-main border-theme" id="rituals" style="border-left: none; border-right: none; position: relative;">
    <div class="glow-overlay" style="bottom: -10%; right: -5%;"></div>
    <div class="container">
      <div class="section-header">
        <span class="section-tag">${content.featuresSub}</span>
        <h2 class="h2-style">${content.featuresTitle}</h2>
      </div>
      
      <div class="rituals-grid">
        ${generateFeaturesHtml()}
      </div>
    </div>
  </section>

  <!-- =========================================================================
       6. STORY / STORY ABOUT ATMOSPHERE (EDIT STORY COPY HERE)
       ========================================================================= -->
  <section class="section-pad" id="about">
    <div class="container">
      <div class="atmosphere-split">
        <div class="atmos-text">
          <span class="section-tag">Historical Soundscape</span>
          <h2 class="h2-style" style="margin-bottom: 1.5rem;">${content.storyTitle}</h2>
          <h3>${content.storyLead}</h3>
          <p>${content.storyParagraph1}</p>
          <p>${content.storyParagraph2}</p>
          
          <div class="signature-block">
            <span class="signature-author font-serif">${content.storySignatureAuthor}</span>
            <span class="signature-label font-display">${content.storySignatureLabel}</span>
          </div>
        </div>
        
        <div class="atmos-visual-stack">
          <div class="atmos-pic-wrapper">
            <img class="atmos-img" src="${content.id === "neon-soul" ? "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80" : "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80"}" alt="Live Experience Room Atmosphere">
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- =========================================================================
       5. MENU OFFERINGS SECTION (EDIT MENU SELECTIONS AND PRICES HERE)
       ========================================================================= -->
  <section class="section-pad bg-main border-theme" id="menu" style="border-left: none; border-right: none;">
    <div class="container">
      <div class="section-header">
        <span class="section-tag">${content.menuSub}</span>
        <h2 class="h2-style">${content.menuTitle}</h2>
      </div>

      <!-- Live Category Nav Filter -->
      <div class="menu-filter-row" id="menuFilterRow">
        <button class="filter-btn active" data-target="all">All Cellar Offerings</button>
        <button class="filter-btn" data-target="cocktails">Crafted Cocktails</button>
        <button class="filter-btn" data-target="bites">Raw & Smoked Bites</button>
        <button class="filter-btn" data-target="plates">Supper Cast-Iron Plates</button>
        <button class="filter-btn" data-target="wine-spirits">Reserve Whiskey & Wines</button>
      </div>

      <!-- Menu Items Grid Blocks -->
      <div class="menu-cards-grid" id="menuCardsGrid">
        ${generateMenuItemsHtml("cocktails")}
        ${generateMenuItemsHtml("bites")}
        ${generateMenuItemsHtml("plates")}
        ${generateMenuItemsHtml("wine-spirits")}
      </div>
    </div>
  </section>

  <!-- =========================================================================
       7. EVENTS / WEEKLY PROGRAMMING SECTION (EDIT WEEKLY SCHEDULE HERE)
       ========================================================================= -->
  <section class="section-pad" id="events">
    <div class="container">
      <div class="section-header">
        <span class="section-tag">${content.eventsSub}</span>
        <h2 class="h2-style">${content.eventsTitle}</h2>
      </div>

      <div class="events-list">
        ${generateEventsHtml()}
      </div>
    </div>
  </section>

  <!-- =========================================================================
       8. TESTIMONIALS / PRAISE (EDIT REVIEWS AND FAMOUS TESTIMONIALS HERE)
       ========================================================================= -->
  <section class="section-pad bg-card border-theme" id="praise" style="border-left: none; border-right: none;">
    <div class="container">
      <div class="section-header" style="margin-left: auto; margin-right: auto; text-align: center;">
        <span class="section-tag">${content.testimonialsSub}</span>
        <h2 class="h2-style">${content.testimonialsTitle}</h2>
      </div>

      <div class="testimonials-grid">
        ${generateTestimonialsHtml()}
      </div>
    </div>
  </section>

  <!-- =========================================================================
       9 & 10. RESERVATIONS & PRIVATE BOOKINGS COMBINED SPLIT SECTION
       ========================================================================= -->
  <section class="section-pad" id="reservations">
    <div class="container">
      <div class="booking-split">
        
        <!-- Live Form Input Wrapper -->
        <div class="booking-form-wrap">
          <span class="section-tag">${content.reservationSub}</span>
          <h2 class="h2-style" style="font-size: 2rem;">${content.reservationTitle}</h2>
          
          <form class="reservation-form" id="resForm" onsubmit="handleFormSubmit(event)">
            <div class="form-row">
              <div class="form-group">
                <label for="fullName">Your Full Name</label>
                <input type="text" id="fullName" class="form-control" placeholder="E.g. Gabriel Vance" required>
              </div>
              <div class="form-group">
                <label for="emailAddress">Email Address</label>
                <input type="email" id="emailAddress" class="form-control" placeholder="E.g. gvance@gmail.com" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="partySize">Party Size</label>
                <select id="partySize" class="form-control" required style="appearance: none;">
                  <option value="2">2 Guests (Table Seating)</option>
                  <option value="4">4 Guests (Dining Booth)</option>
                  <option value="6">6 Guests (VIP Lounge Booth)</option>
                  <option value="1">1 Guest (Bar Seat)</option>
                </select>
              </div>
              <div class="form-group">
                <label for="resDate">Preferred Night</label>
                <input type="date" id="resDate" class="form-control" required>
              </div>
            </div>

            <div class="form-group">
              <label for="specialRequests">Special Requests</label>
              <textarea id="specialRequests" rows="3" class="form-control" placeholder="Add any special requests..."></textarea>
            </div>

            <!-- Submit trigger -->
            <button type="submit" class="btn btn-primary font-display" style="width: 100%; margin-top: 1rem;">
              Submit Reservation Request
            </button>
            
            <div class="form-status success" id="formStatus">
              ✓ RESERVATION REQUEST TRANSMITTED. We will email you to confirm availability.
            </div>
          </form>
        </div>

        <!-- Group Bookings Pitch Card -->
        <div class="private-events-promo">
          <span class="section-tag">${content.privateEventsSub}</span>
          <h3 class="h2-style" style="font-size: 2.22rem; margin-bottom: 1.5rem;">${content.privateEventsTitle}</h3>
          <p class="text-body">${content.privateEventsCopy}</p>
          
          <div class="promo-highlight-box">
            <div class="promo-highlight-item">
              <div class="promo-bullet"></div>
              <span>${content.privateEventsHighlight1}</span>
            </div>
            <div class="promo-highlight-item">
              <div class="promo-bullet"></div>
              <span>${content.privateEventsHighlight2}</span>
            </div>
          </div>

          <a href="mailto:${content.email}?subject=Private%20Event%20Inquiry%20-${content.brandName}" class="btn btn-secondary font-display" style="width: 100%;">
            Retrieve Event Deck (PDF)
          </a>
        </div>

      </div>
    </div>
  </section>

  <!-- =========================================================================
       11. LOCATION, HOURS & CONTACT BLOCK (EDIT PHYSICAL COORDS HERE)
       ========================================================================= -->
  <section class="section-pad bg-main border-theme" id="contact" style="border-left: none; border-right: none;">
    <div class="container">
      <div class="contact-split">
        
        <!-- Details Card -->
        <div class="contact-details">
          <span class="section-tag">Location & Hours</span>
          <h2 class="h2-style">${content.contactTitle}</h2>
          
          <div class="contact-card-sub">
            <div class="detail-item">
              <div class="detail-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div>
                <p class="text-lead font-display text-sm">Address</p>
                <p class="text-body">${content.address}</p>
                <p class="text-dim">${content.cityState}</p>
              </div>
            </div>

            <div class="detail-item">
              <div class="detail-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <p class="text-lead font-display text-sm">Telephone</p>
                <p class="text-body">${content.phone}</p>
              </div>
            </div>

            <div class="detail-item">
              <div class="detail-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                <p class="text-lead font-display text-sm">Inquiries</p>
                <p class="text-body">${content.email}</p>
              </div>
            </div>
          </div>

          <!-- Working Hours block -->
          <div class="hours-block">
            <h4 class="font-display text-lead text-xs">Hours of Operation</h4>
            ${generateHoursListHtml()}
          </div>
        </div>

        <!-- Standin high design Map box -->
        <div class="contact-map-frame">
          <div class="map-grid-standin"></div>
          
          <div class="map-inner-card">
            <span class="section-tag" style="font-size: 0.65rem;">ARRIVAL GUIDE</span>
            <h4 class="font-serif text-lead h4-style" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">Directions & Entry</h4>
            <p class="text-dim text-sm" style="margin-bottom: 1.5rem;">
              \${content.id === 'neon-soul' 
                ? 'Located on Decatur Street near the corner entrance. Look for the bronze sign above the door. Valet parking is available Friday and Saturday evenings.'
                : 'Located on Prince Street, down the lower-level stairs. Look for the bronze sign above the door. Valet parking is available Friday and Saturday.'}
            </p>
            <a href="https://maps.google.com/?q=\${encodeURIComponent(content.address + " " + content.cityState)}" target="_blank" class="btn btn-secondary btn-sm font-display">Get Directions</a>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- =========================================================================
       12. PREMIUM FOOTER SECTION
       ========================================================================= -->
  <footer class="premium-footer">
    <div class="container">
      <div class="footer-columns">
        
        <!-- Col 1 -->
        <div class="footer-col" style="flex-grow: 1.5;">
          <h4 class="footer-brand">${content.brandName}</h4>
          <p class="text-dim" style="max-width: 280px; font-size: 0.85rem;">${content.tagline}</p>
          <p class="text-xs text-dim">© 2026 ${content.brandName} LLC. Protected Sensory Arts.</p>
        </div>

        <!-- Col 2 -->
        <div class="footer-col">
          <h5>Navigate</h5>
          <ul class="footer-links font-display text-xs">
            <li><a href="#about">Our Story</a></li>
            <li><a href="#rituals">The Room</a></li>
            <li><a href="#menu">Our Menu</a></li>
            <li><a href="#events">Upcoming Events</a></li>
            <li><a href="#reservations">Reserve a Table</a></li>
          </ul>
        </div>

        <!-- Col 3 -->
        <div class="footer-col">
          <h5>Hospitality Group</h5>
          <ul class="footer-links text-xs" style="font-family: var(--font-sans)">
            <li><a href="#hero" style="font-style: italic;">Neon Soul Jazz Club (New Orleans)</a></li>
            <li><a href="#hero" style="font-style: italic;">The Velvet Room (SoHo)</a></li>
            <li><a href="#hero" style="font-style: italic;">The Cellar Reserve (Manhattan)</a></li>
          </ul>
        </div>

        <!-- Col 4 -->
        <div class="footer-col" style="flex-grow: 1.2;">
          <h5>The Weekly Dispatch</h5>
          <p class="text-dim text-xs">Subscribe to receive exclusive invitations, seasonal menu specials, and upcoming performance details.</p>
          <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Subscribed successfully!');">
            <input type="email" class="form-control text-base min-h-[44px]" placeholder="Enter your email address" required style="flex:1; padding: 0.6rem 1rem;">
            <button type="submit" class="btn btn-primary btn-sm font-display" style="padding: 0 1rem;">Join</button>
          </form>
        </div>

      </div>

      <!-- Legal bottom -->
      <div class="footer-bottom">
        <p class="text-xs text-dim">Live music and classic dining daily. Table reservations are recommended for weekend music sets. Smart casual dress code.</p>
        <button class="back-to-top" onclick="window.scrollTo({top:0, behavior:'smooth'})">
          <span>Back to Top</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon" style="width:14px; height: 14px;"><path d="m18 15-6-6-6 6"/></svg>
        </button>
      </div>

    </div>
  </footer>

  <!-- =========================================================================
       13. VANILLA JAVASCRIPT SYSTEM ENGINE (EDIT INTERACTIVE LOOPS HERE)
       ========================================================================= -->
  <script>
    // Navigation Scroll Response
    window.addEventListener('scroll', function() {
      const header = document.getElementById('headerNav');
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });

    // Navigation Active Link Sync
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    window.addEventListener('scroll', function() {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 120)) {
          current = section.getAttribute('id');
        }
      });
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
          link.classList.add('active');
        }
      });
    });

    // Mobile Hamburger Menu Reveal
    const mobileMenuBtn = document.getElementById('mobileMenuToggle');
    const mobileDrawer = document.getElementById('mobileDrawer');
    mobileMenuBtn.addEventListener('click', function() {
      mobileDrawer.classList.toggle('open');
    });
    // Close mobile menu on link navigation clicks
    document.querySelectorAll('.mobile-drawer .nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
      });
    });

    // Interactive Menu category filtering loop
    const filterRow = document.getElementById('menuFilterRow');
    if (filterRow) {
      const filterButtons = filterRow.querySelectorAll('.filter-btn');
      const menuItems = document.querySelectorAll('.menu-item');

      filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          // Sync button active style class
          filterButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const target = btn.getAttribute('data-target');
          
          menuItems.forEach(item => {
            if (target === 'all') {
              item.style.display = 'block';
            } else {
              const itemCategory = item.getAttribute('data-category');
              if (itemCategory === target) {
                item.style.display = 'block';
              } else {
                item.style.display = 'none';
              }
            }
          });
        });
      });
    }

    // Interactive simulated submit event
    function handleFormSubmit(event) {
      event.preventDefault();
      
      const btn = event.target.querySelector('button[type="submit"]');
      const originalText = btn.innerText;
      btn.disabled = true;
      btn.innerText = "Submitting Reservation Request...";

      setTimeout(() => {
        btn.innerText = "Request Submitted ✓";
        const successBox = document.getElementById('formStatus');
        successBox.style.display = 'block';
        event.target.reset();
        
        setTimeout(() => {
          btn.disabled = false;
          btn.innerText = originalText;
        }, 4000);
      }, 1500);
    }
  </script>
</body>
</html>
`;
}
