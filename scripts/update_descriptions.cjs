const fs = require('fs');

const envContent = fs.readFileSync('/Users/gmane/Documents/ZoMae Media LLC/Aura & Grid/.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2 && !line.startsWith('#')) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
  }
});

const token = env.GUMROAD_ACCESS_TOKEN;

const DESCRIPTIONS = {
  // 1. STRIDE MB
  'stride-mb': `<h3>👟 STRIDE MB — Luxury Sneaker Boutique &amp; E-Commerce Operating System</h3>
<p><strong>The premier turn-key e-commerce operating system and client portal engineered specifically for boutique sneaker stores, luxury streetwear labels, and private collector vaults.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>Editorial Showroom &amp; Footwear Archive</strong>: High-fashion product showcase with instant multi-category filters, sorting controls, and 5-angle editorial viewer.</li>
  <li><strong>Live Drop Radar &amp; Bot-Proof Raffles</strong>: Interactive drop calendar and verification intake for high-heat sneaker releases and exclusive allocation countdowns.</li>
  <li><strong>VIP Fitting Suite Intake &amp; Concierge</strong>: Frictionless private client booking system with instant reservation scheduling and size pre-selection.</li>
  <li><strong>Slide-Out Cart &amp; Dynamic Bag Drawer</strong>: Seamless fly-out bag drawer with real-time subtotal math, free shipping meter, and ⌘K quick-search command palette.</li>
  <li><strong>Boutique Command Room (Admin OS)</strong>: 1-tap passcode access (<code>stridemb2026</code>) to draw raffle winners live, manage VIP appointments, and export customer CSV logs.</li>
  <li><strong>Dual-Engine Architecture</strong>: Works instantly out-of-the-box via high-speed LocalStorage or seamlessly connects to Supabase in under 3 minutes with pre-baked PostgreSQL schemas and Row-Level Security policies.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://stride-manhattan-beach.onrender.com" target="_blank">https://stride-manhattan-beach.onrender.com</a></li>
  <li><strong>Footwear Archive</strong>: <a href="https://stride-manhattan-beach.onrender.com/shop" target="_blank">https://stride-manhattan-beach.onrender.com/shop</a></li>
  <li><strong>Boutique Command Room</strong>: <a href="https://stride-manhattan-beach.onrender.com/admin" target="_blank">https://stride-manhattan-beach.onrender.com/admin</a> (Cheat Code: <code>stridemb2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete 8-screen responsive frontend codebase, dark obsidian streetwear styling, filterable catalog, and mock storage.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, admin telemetry, and real-time database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, domain DNS setup, brand styling customization, and VIP concierge onboarding.</li>
</ul>`,

  // 2. THE VAULT
  'the-vault': `<h3>🖋️ THE VAULT — Luxury Tattoo Atelier &amp; Piercing Operating System</h3>
<p><strong>The premier boutique studio operating system, intake desk, and digital waiver engine engineered specifically for bespoke tattoo parlors, resident artist ateliers, and luxury piercing guilds.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>Atelier Privé &amp; Flash Art Wall</strong>: Dynamic resident guild showcase and interactive one-of-one flash gallery with instant piece reservations.</li>
  <li><strong>4-Step Client Consultation Desk</strong>: Frictionless appointment intake with automated $100 lock-in deposit calculator and direct artist chamber routing.</li>
  <li><strong>Digital Consent &amp; Legal Waiver Pad</strong>: Native HTML5 finger/stylus canvas signature pad, HIPAA medical disclosures, photo ID verification, and downloadable release certificates.</li>
  <li><strong>Chamber Status &amp; Sterilization Credentials</strong>: Public-facing sterile safety accreditation, medical autoclave badges, and residency schedules.</li>
  <li><strong>Studio Command Room (Admin OS)</strong>: 1-tap passcode access (<code>vault2026</code>) to monitor studio escrow balances, view signed waivers, and export intake CSV logs.</li>
  <li><strong>Dual-Engine Architecture</strong>: Works instantly out-of-the-box via high-speed LocalStorage or seamlessly connects to Supabase in under 3 minutes with pre-baked PostgreSQL schemas and Row-Level Security policies.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://the-vault-studio.onrender.com" target="_blank">https://the-vault-studio.onrender.com</a></li>
  <li><strong>Digital Flash Gallery</strong>: <a href="https://the-vault-studio.onrender.com/flash" target="_blank">https://the-vault-studio.onrender.com/flash</a></li>
  <li><strong>Studio Command Room</strong>: <a href="https://the-vault-studio.onrender.com/admin" target="_blank">https://the-vault-studio.onrender.com/admin</a> (Cheat Code: <code>vault2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete 6-screen responsive frontend codebase, obsidian and gold atelier styling, digital waiver pad, and mock storage.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, admin telemetry, and real-time database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, domain DNS setup, brand styling customization, and VIP concierge onboarding.</li>
</ul>`,

  // 3. VELOCITY
  'velocity-os': `<h3>🏎️ VELOCITY — Exotic Fleet Concierge &amp; Car Rental Operating System</h3>
<p><strong>The premier luxury mobility booking engine, fleet management HUD, and high-roller rental terminal engineered for private supercar rental companies, VIP chauffeur fleets, and exotic car clubs.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>Obsidian Fleet Showroom &amp; Dynamic Spec Sheet</strong>: High-impact vehicle showcase featuring 0-60 sprint telemetry, horsepower metrics, and interactive rental duration toggles.</li>
  <li><strong>4-Step Precision Booking Engine</strong>: Frictionless dispatch intake with automated security deposit math, delivery coordinates, and dynamic add-on recalculations.</li>
  <li><strong>VIP Track Day &amp; Canyon Run Experiences</strong>: Dedicated curated packages for The Thermal Club, Willow Springs, and Malibu Canyon excursions.</li>
  <li><strong>High-Roller Insurance &amp; License Portal</strong>: Automated KYC verification screen for clean DMV records and insurance binder uploads.</li>
  <li><strong>Fleet Command Tower (Admin Room)</strong>: 1-tap passcode access (<code>velocity2026</code>) to manage garage units, dispatch fleet drivers, and monitor daily revenue without complex setup.</li>
  <li><strong>Dual-Engine Architecture</strong>: Works instantly out-of-the-box via high-speed LocalStorage or seamlessly connects to Supabase in under 3 minutes with pre-baked PostgreSQL schemas and Row-Level Security policies.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://velocity-exotic-fleet.onrender.com" target="_blank">https://velocity-exotic-fleet.onrender.com</a></li>
  <li><strong>Fleet Showroom</strong>: <a href="https://velocity-exotic-fleet.onrender.com/fleet" target="_blank">https://velocity-exotic-fleet.onrender.com/fleet</a></li>
  <li><strong>Admin Command Tower</strong>: <a href="https://velocity-exotic-fleet.onrender.com/admin" target="_blank">https://velocity-exotic-fleet.onrender.com/admin</a> (Cheat Code: <code>velocity2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete responsive frontend codebase, obsidian theme, filterable fleet cards, booking calculator, and mock storage.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, admin telemetry, and real-time database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, domain DNS setup, brand styling customization, and VIP concierge onboarding.</li>
</ul>`,

  // 4. APEX CLUB
  'apex-club-os': `<h3>🥊 APEX CLUB — Boutique Fight Club &amp; Private Gym Operating System</h3>
<p><strong>The premier private boxing guild, closed-door sparring facility, and combat sports reservation engine designed for luxury fitness sanctuaries, titleholder fight gyms, and private martial arts clubs.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>Championship Fighter Roster &amp; Master Coaches</strong>: Dedicated trainer cards highlighting combat disciplines, pro records, private hourly rates, and specialist accolades.</li>
  <li><strong>Fight Night &amp; Closed-Door Bout Radar</strong>: Exclusive ticketing and VIP ringside table reservation system for underground sparring showcases and club events.</li>
  <li><strong>Tiered Membership Guild Portal</strong>: 3-tier membership architecture (Contender, Champion, Undisputed) with automated guest pass counters and recovery perks.</li>
  <li><strong>Interactive Private Session Scheduler</strong>: Multi-coach booking engine with custom time slots, sparring ring selection, and focus mitt equipment intake.</li>
  <li><strong>Gym Command Tower (Admin Room)</strong>: 1-tap passcode access (<code>apex2026</code>) to manage member rosters, schedule sanctioned sparring cards, and monitor gym telemetry.</li>
  <li><strong>Dual-Engine Architecture</strong>: Works instantly out-of-the-box via high-speed LocalStorage or seamlessly connects to Supabase in under 3 minutes with pre-baked PostgreSQL schemas and Row-Level Security policies.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://apex-fight-club.onrender.com" target="_blank">https://apex-fight-club.onrender.com</a></li>
  <li><strong>Fighter Roster</strong>: <a href="https://apex-fight-club.onrender.com/trainers" target="_blank">https://apex-fight-club.onrender.com/trainers</a></li>
  <li><strong>Gym Command Tower</strong>: <a href="https://apex-fight-club.onrender.com/admin" target="_blank">https://apex-fight-club.onrender.com/admin</a> (Cheat Code: <code>apex2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete responsive frontend codebase, high-contrast dark fight club styling, trainer scheduler, and mock storage.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, admin telemetry, and real-time database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, domain DNS setup, brand styling customization, and VIP concierge onboarding.</li>
</ul>`,

  // 5. ELEVATE CAPITAL
  'elevate-capital-os': `<h3>💼 ELEVATE CAPITAL — Private Equity &amp; Family Office Investor Portal OS</h3>
<p><strong>The premier institutional deal pipeline, virtual data room (VDR), and fund analytics operating system engineered for venture capital firms, private equity syndicates, and angel networks.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>Institutional Deal Flow Radar</strong>: Dynamic multi-stage allocation Kanban (Lead → Pitch Deck → Due Diligence → Term Sheet → Closed) with instant commitment tracking.</li>
  <li><strong>Runway &amp; Burn Rate Analytics Terminal</strong>: Automated cash-on-hand calculators, monthly burn telemetry, and probabilistic allocation forecasting (Conservative, Base, Aggressive).</li>
  <li><strong>Virtual Data Room (VDR) &amp; Compliance Vault</strong>: Military-grade document repository with categorization filters (Financials, Legal, Corporate, Product) and 1-tap verification audit flags.</li>
  <li><strong>Executive Command Tower (Admin Gate)</strong>: 1-tap passcode access (<code>elevate2026</code>) to manage general partner credentials, audit ledger changes, and export deal CSV rosters.</li>
  <li><strong>Interactive Real-Time Market Clocks</strong>: Multi-sector global financial clocks synchronized to UTC-7 and market closing windows.</li>
  <li><strong>Dual-Engine Architecture</strong>: Works instantly out-of-the-box via high-speed LocalStorage or seamlessly connects to Supabase in under 3 minutes with pre-baked PostgreSQL schemas and Row-Level Security policies.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://elevate-capital-os.onrender.com" target="_blank">https://elevate-capital-os.onrender.com</a></li>
  <li><strong>Deal Flow Radar</strong>: <a href="https://elevate-capital-os.onrender.com" target="_blank">https://elevate-capital-os.onrender.com</a></li>
  <li><strong>Executive Command Gate</strong>: <a href="https://elevate-capital-os.onrender.com" target="_blank">https://elevate-capital-os.onrender.com</a> (Click "ADMIN PASS", Cheat Code: <code>elevate2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete React 19 + TypeScript + Tailwind frontend codebase, dark obsidian institutional theme, Kanban pipeline, and mock storage.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, admin telemetry, and real-time database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, domain DNS setup, brand styling customization, and VIP concierge onboarding.</li>
</ul>`,

  // 6. OBSIDIAN LAB
  'obsidian-lab-os': `<h3>☕ OBSIDIAN LAB — Artisanal Coffee Slow Bar &amp; Micro-Roastery OS</h3>
<p><strong>The premier minimalist slow bar operating system, single-origin bean reserve, and omakase tasting reservation engine designed for luxury micro-roasteries, specialty coffee labs, and high-end gastronomy ateliers.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>Editorial Single-Origin Reserve &amp; Micro-Lot Archive</strong>: Rare harvest showcase featuring harvest elevation (MASL), botanical processing methods (Anaerobic Honey, Carbonic Maceration), and terroir descriptors.</li>
  <li><strong>Slow-Bar Omakase &amp; Masterclass Reservation Engine</strong>: Interactive seat booking calendar for intimate 5-pour sensory tasting flights and extraction chemistry clinics.</li>
  <li><strong>Roasters Alliance VIP Subscription Portal</strong>: Recurring member allocation tiers (The Minimalist, The Connoisseur, The Obsidian Reserve) with dynamic loyalty point multipliers.</li>
  <li><strong>Slide-Out Bag Drawer &amp; Real-Time Order Radar</strong>: Frictionless bag flyout with grind specification selector (Whole Bean, Chemex, Espresso) and live delivery timeline radar.</li>
  <li><strong>Roastery Command Tower (Admin Room)</strong>: 1-tap passcode access (<code>obsidian2026</code>) to monitor member loyalty telemetry, update micro-lot inventory allocations, and audit reservations.</li>
  <li><strong>Dual-Engine Architecture</strong>: Works instantly out-of-the-box via high-speed LocalStorage or seamlessly connects to Supabase in under 3 minutes with pre-baked PostgreSQL schemas and Row-Level Security policies.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://obsidian-slow-bar.onrender.com" target="_blank">https://obsidian-slow-bar.onrender.com</a></li>
  <li><strong>Single-Origin Reserve</strong>: <a href="https://obsidian-slow-bar.onrender.com" target="_blank">https://obsidian-slow-bar.onrender.com</a></li>
  <li><strong>Roastery Command Tower</strong>: <a href="https://obsidian-slow-bar.onrender.com" target="_blank">https://obsidian-slow-bar.onrender.com</a> (Click "ADMIN PASS", Cheat Code: <code>obsidian2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete React 19 + TypeScript + Tailwind frontend codebase, dark obsidian slow-bar aesthetic, micro-lot reserve cards, and mock storage.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, admin telemetry, and real-time database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, domain DNS setup, brand styling customization, and VIP concierge onboarding.</li>
</ul>`,

  // 7. THE ENCLAVE
  'the-enclave-os': `<h3>🏛️ THE ENCLAVE — Ultra-Luxury Architectural Real Estate &amp; Villa Portfolio OS</h3>
<p><strong>The premier dark obsidian operating system and client sanctuary engineered specifically for high-net-worth real estate brokerages, architectural pavilions, and boutique private villa asset managers.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>Monolithic Clifftop Showcase &amp; Architectural Galleries</strong>: Brutalist estates, concrete pavilions, and bespoke floorplans showcased with editorial typography and responsive high-res viewports.</li>
  <li><strong>Private Inbound Lead CRM</strong>: High-touch buyer inquiry capture pipeline with lead qualification, escrow stages, and private VIP client telemetry.</li>
  <li><strong>Client Sanctuary Portal &amp; Document Vault</strong>: Confidential tenant and buyer access room for private deed documents, maintenance requests, and title verification.</li>
  <li><strong>Dedicated Showing Scheduler</strong>: Private booking engine for confidential villa walk-throughs and helicopter helipad coordinates.</li>
  <li><strong>Villa Command Room (Admin OS)</strong>: 1-tap passcode access (<code>enclave2026</code>) to manage active villas, buyer CRM leads, and repair tickets.</li>
  <li><strong>Dual-Engine Architecture</strong>: Works instantly out-of-the-box via high-speed LocalStorage or seamlessly connects to Supabase in under 3 minutes with pre-baked PostgreSQL schemas and Row-Level Security policies.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://the-enclave-villas.onrender.com" target="_blank">https://the-enclave-villas.onrender.com</a></li>
  <li><strong>Architectural Villa Catalog</strong>: <a href="https://the-enclave-villas.onrender.com" target="_blank">https://the-enclave-villas.onrender.com</a></li>
  <li><strong>Villa Command Room</strong>: <a href="https://the-enclave-villas.onrender.com/admin" target="_blank">https://the-enclave-villas.onrender.com/admin</a> (Cheat Code: <code>enclave2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete Obsidian React 19 + Tailwind CSS frontend codebase with pre-loaded mock architectural portfolio and scheduler.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, admin telemetry, and real-time database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, domain DNS setup, brand styling customization, and VIP concierge onboarding.</li>
</ul>`,

  // 8. AURA MEDSPA
  'aura-medspa-os': `<h3>💆 AURA MEDSPA — Boutique Aesthetics Clinic &amp; VIP Treatment Booking OS</h3>
<p><strong>The premier turn-key clinic operating system, treatment menu, and VIP intake desk engineered specifically for luxury medical spas, aesthetic injectors, laser skin clinics, and cellular longevity practices.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>High-Converting Clinical Treatment Matrix</strong>: Dynamic clinical catalog for Botox neuromodulators, dermal fillers, Sciton BBL HERO photofacials, and NAD+ longevity drips.</li>
  <li><strong>VIP Patient Intake &amp; Booking Engine</strong>: Multi-step reservation flow with clinician selection, date/time scheduling, and contraindication notes.</li>
  <li><strong>Clinical Director Control Room (Admin OS)</strong>: Live management HUD tracking monthly gross revenue, active patient queues, and treatment catalog editing.</li>
  <li><strong>Sovereign Patient Portal</strong>: Confidential client room displaying upcoming booking coordinates, provider notes, and post-care treatment covenants.</li>
  <li><strong>Interactive Recovery Sanctuary</strong>: Post-treatment guided breathing and nervous system calming dwell station.</li>
  <li><strong>Dual-Engine Architecture</strong>: Works instantly out-of-the-box via high-speed LocalStorage or seamlessly connects to Supabase in under 3 minutes with pre-baked PostgreSQL schemas and Row-Level Security policies.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://aura-medspa-os.onrender.com" target="_blank">https://aura-medspa-os.onrender.com</a></li>
  <li><strong>Clinical Treatment Curriculum</strong>: <a href="https://aura-medspa-os.onrender.com/#rituals" target="_blank">https://aura-medspa-os.onrender.com/#rituals</a></li>
  <li><strong>Clinical Director Door</strong>: <a href="https://aura-medspa-os.onrender.com/admin" target="_blank">https://aura-medspa-os.onrender.com/admin</a> (Cheat Code: <code>medspa2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete Obsidian React 19 + Tailwind CSS frontend codebase with pre-loaded mock clinical data and booking flow.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, admin telemetry, and real-time database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, domain DNS setup, brand styling customization, and VIP concierge onboarding.</li>
</ul>`,

  // 9. ROYAL APEX
  'royal-apex-os': `<h3>💈 ROYAL APEX — Luxury Men's Grooming Atelier &amp; VIP Barber OS</h3>
<p><strong>The premier obsidian-editorial salon operating system, multi-specialist chair booking desk, and style lookbook engineered for luxury barbershops, men's grooming lounges, and bespoke styling ateliers.</strong></p>

<hr>

<h4>✨ What Inside the Box</h4>
<ul>
  <li><strong>Editorial Master Barber OS UI</strong>: Editorial warm alabaster and obsidian aesthetic, razor-sharp typography, and responsive luxury grooming layout.</li>
  <li><strong>4-Pillar Atelier Service Engine</strong>: Barbering, Braids, Loc Tech, and Bespoke Scalp Treatments with interactive rate cards and duration calculators.</li>
  <li><strong>Interactive Chair Booking Engine</strong>: 3-step appointment flow with service selection, preferred barber routing, and booking confirmation.</li>
  <li><strong>High-Resolution Style Lookbook</strong>: Click-to-zoom interactive hairstyle gallery with direct 'Request Style' chair booking integration.</li>
  <li><strong>Master Barber Control Room (Admin OS)</strong>: 1-tap passcode access (<code>royal2026</code>) to manage chair schedules, triage appointment statuses, and update live rate menus.</li>
  <li><strong>Dual-Engine Architecture</strong>: Works instantly out-of-the-box via high-speed LocalStorage or seamlessly connects to Supabase in under 3 minutes with pre-baked PostgreSQL schemas and Row-Level Security policies.</li>
</ul>

<hr>

<h4>🕹️ Test Drive the Live Rig</h4>
<ul>
  <li><strong>Live Interactive Showcase</strong>: <a href="https://royal-apex-atelier.onrender.com" target="_blank">https://royal-apex-atelier.onrender.com</a></li>
  <li><strong>Lookbook &amp; Services</strong>: <a href="https://royal-apex-atelier.onrender.com/#services" target="_blank">https://royal-apex-atelier.onrender.com/#services</a></li>
  <li><strong>Master Barber Control Room</strong>: <a href="https://royal-apex-atelier.onrender.com/admin" target="_blank">https://royal-apex-atelier.onrender.com/admin</a> (Cheat Code: <code>royal2026</code>)</li>
</ul>

<hr>

<h4>📦 Choose Your Rig Tier</h4>
<ul>
  <li><strong>Tier 1: Starter UI Rig ($4,500)</strong> — Complete responsive frontend codebase, lookbook zoom engine, mock chair booking flow, and responsive components.</li>
  <li><strong>Tier 2: Full-Stack Working Rig ($4,500)</strong> — Everything in Tier 1 + full Supabase PostgreSQL schemas, seed data, SQL migration scripts, admin telemetry, and real-time database hooks.</li>
  <li><strong>Tier 3: White-Glove VIP Deployment ($3,500)</strong> — Complete custom server provisioning, domain DNS setup, brand styling customization, and VIP concierge onboarding.</li>
</ul>`
};

async function updateAll() {
  const res = await fetch('https://api.gumroad.com/v2/products', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const json = await res.json();

  for (const [permalink, desc] of Object.entries(DESCRIPTIONS)) {
    const prod = json.products.find(p => p.custom_permalink === permalink);
    if (!prod) {
      console.log('Product not found for permalink:', permalink);
      continue;
    }

    const params = new URLSearchParams();
    params.append('description', desc);

    const updateRes = await fetch(`https://api.gumroad.com/v2/products/${prod.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const updateJson = await updateRes.json();
    console.log(`Updated ${permalink} (${prod.name}): ${updateJson.success ? 'SUCCESS ✓' : 'FAILED ✗'}`);
  }
}

updateAll().catch(console.error);
