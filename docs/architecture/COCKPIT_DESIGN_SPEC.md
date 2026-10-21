# COCKPIT DESIGN SPECIFICATION — GAMIFIED ADHD-FRIENDLY F1 PIT WALL STANDARD

**Document Reference:** `GF-ARCH-COCKPIT-2026-V1`  
**Classification:** Master Frontend UI/UX Architectural Specification  
**Authority Hierarchy:** Executive Dealership Principal × Lead Systems Engineer & UI/UX Design Architect  
**Effective Date:** 2026-10-20  
**Revision:** 1.0.0-PROD-LOCKED  

---

## 1. DESIGN PHILOSOPHY: THE F1 PIT WALL & CYBERPUNK ARCADE SIM

Every cockpit in the **GhostFactoryOS** and **Aura & Grid** ecosystem is engineered for an operator who thinks like a **smart 13-year-old gamer with ADHD**:
- **Zero Walls of Text:** Humans don't read essays during a 200 mph corner. Everything is visual, tactile, punchy, and animated.
- **Immediate Sensory Feedback:** Every click triggers a sound cue, color shift, or state transition. Buttons clack, switches flip, and telemetry pulses.
- **Micro-Dopamine Rewards:** Gamified combo streaks, gear ratios, nitro multipliers, and points tickers transform dry backend telemetry into high-octane sim-racing.
- **Industrial Precision:** Underneath the arcade neon is SCADA-grade mathematical determinism.

```
+----------------------------------------------------------------------------------------------------+
|                                    COCKPIT COLOR & TYPOGRAPHY SYSTEM                               |
|                                                                                                    |
|   BASE OBSIDIAN CANVAS:        #05070B  (Deep carbon black, zero glare, high contrast)            |
|   CYBER AMBER ACCENT:          #FF9F0A  (F1 caution, ignition triggers, primary interactive alert) |
|   NEON CYAN FLUX:              #00F0FF  (Telemetry streams, active sensors, digital scanlines)     |
|   EMERALD DYNO SEAL:           #10B981  (100% pass verification, healthy systems, nominal state)   |
|   CRIMSON FAULT LINE:          #EF4444  (Chaos injection, thermal runaway, critical warnings)      |
|   TYPOGRAPHY SYSTEM:           JetBrains Mono (Metrics / Logs) × Inter Tight (Command Headings)    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. THE 8 INVARIANT COCKPIT PILLARS

Every cockpit component, prototype, and template must strictly satisfy all 8 architectural invariants:

### Pillar 01: Aesthetic & Dark Carbon Foundation
- Deep carbon `#05070B` background with subtle `#111724` bento-card backing (`bg-[#111724]/85 border border-white/10 backdrop-blur-xl`).
- High-visibility typography: Numbers and metrics rendered strictly in `font-mono` (`JetBrains Mono`), headings in bold sans (`Inter Tight`).
- Micro-glow shadows (`shadow-[0_0_15px_-3px_rgba(0,240,255,0.3)]`) that guide the eye without causing visual fatigue.

### Pillar 02: Strict Above-The-Fold Rule (Zero Window Scrollbars)
- **Viewport Lock:** The root container MUST use `h-screen flex flex-col overflow-hidden` (or `h-full max-h-screen flex flex-col overflow-hidden` inside modal windows).
- **Zero Outer Scrollbars:** Exactly zero vertical or horizontal window scrollbars are permitted. All controls, charts, indicators, and logs must be simultaneously visible on standard 1080p viewports (1920×1080) and 1440p displays.

### Pillar 03: Top Command Deck (Single-Line Header)
- Compact single-line navigation bar containing:
  1. **Chassis Asset ID:** Monospace badge (e.g., `GF-T3-138` or `GF-T2-087`).
  2. **Powertrain Badge:** Cyan glowing pill (e.g., `TRACK 3 // F1 SKUNKWORKS SERVICE ENGINE`).
  3. **Live Dyno Seal:** Emerald pulsing beacon (`[DYNO SEALED 4/4 GATES]`).
  4. **Tactile Header Buttons:** Real-time clock (`00:00:00.000`), FPS / Hz refresh gauge, and Viewport Fullscreen toggle.

### Pillar 04: 4-Card HUD Ribbon
Positioned immediately below the Command Deck, four high-density metric cards provide instant situational awareness:
1. **Speedup Nitro:** Multiplier ticker (`1.0x` baseline up to `5.0x NITRO OVERDRIVE`).
2. **Combo Streak 🔥:** Consecutive stable tick cycles without state faults (e.g., `124x STREAK 🔥`).
3. **Shift Gear K=X:** Dynamic gear ratio / state transition bracket (`GEAR K=1` to `GEAR K=6 OVERDRIVE`).
4. **Token Score PTS:** Cumulative processed telemetry frames or state events (`84,200 PTS`).

### Pillar 05: Interactive Center Bay
- Split bento-grid layout (typically 2 to 3 interactive panels):
  - **Left Bay (Primary Kinematics / SCADA Visualizer):** Reactive SVG / Canvas telemetry gauge, animated waveform, or 3D coordinate rig.
  - **Right Bay (Tactile Calibration Sliders & Toggles):** Micro-sliders with bounded numeric clamps, segmented toggle bars, and diagnostic status matrices.
- Zero blocks of descriptive text or paragraphs. All information is formatted as labels, values, units, and status indicators.

### Pillar 06: Launch Control Dock (4 Arcade Switches)
A permanent bottom control dock featuring four distinct tactile arcade action buttons with high-contrast alert borders:
1. **`[INJECT CHAOS]` (Crimson Alert):** Injects synthetic sensor noise, network packet drop, or thermal spikes into the state bus.
2. **`[NITRO OVERDRIVE]` (Cyber Amber):** Toggles simulation clock multiplier from 1x to 5x for high-velocity burn testing.
3. **`[STEP ENGINE]` (Neon Cyan):** Advances the deterministic state machine by exactly one single clock frame (`dt = 10ms`).
4. **`[PIT STOP RESET]` (Slate / White):** Flushes chaos perturbations, re-zeros fault counters, and restores nominal baseline state.

### Pillar 07: Pit-Wall Radio Comms Log (Bounded Terminal)
- Bounded terminal strip (`h-14` to `h-16`, strictly max 3 lines visible with auto-scroll lock).
- Rendered in crisp monospace with timestamped callsigns:
  - `🟢 CREW CHIEF:` Operational directives and calibration changes.
  - `🔴 TELEMETRY:` Warning thresholds, G-force anomalies, and sensor limits.
  - `⚡ PIT WALL:` Sector splits, telemetry frame syncs, and system health pulses.

### Pillar 08: The Zero-Dollar Gate
- **Strict Non-Negotiable Law:** Exactly `$0` and zero currency symbols (`$`, `USD`, `EUR`, `buyout`) may appear anywhere in the cockpit UI, code, telemetry logs, or state models.
- **Allowed Units Only:** Pure dimensionless numbers, SI physical units (`km/h`, `mph`, `kN`, `kPa`, `bar`, `deg`, `K`, `G`), computational rates (`ms`, `μs`, `kHz`, `GB/s`, `fps`), percentages (`%`), points (`pts`), and tokens (`tokens`).
- Commercial pricing is strictly isolated to the Showroom Lot and Executive Term Sheet tabs.

---

## 3. COCKPIT COMPONENT ANATOMY DIAGRAM

```
+----------------------------------------------------------------------------------------------------+
| [GF-T3-138]  TRACK 3 // SKUNKWORKS ENGINE  ● [DYNO SEALED 4/4 GATES]        120 Hz  [FULLSCREEN] | <- TOP COMMAND DECK
+----------------------------------------------------------------------------------------------------+
| [ 2.4x NITRO ACTIVE ]   | [ 142x STREAK 🔥 ]   | [ GEAR K=4 CRUISE ]    | [ 128,400 TOKENS PTS ]   | <- 4-CARD HUD RIBBON
+----------------------------------------------------------------------------------------------------+
|                                                  |                                                 |
|          PRIMARY VISUALIZER / SCADA HUD          |           TACTILE CALIBRATION DECK              |
|                                                  |                                                 |
|  - Real-time kinematic telemetry curves          |  - Segmented power/frequency toggles            |
|  - Multi-axis G-Force & vector bubble            |  - Bounded slew-rate & angle sliders            |
|  - Live sensor frequency response                |  - Zero-trust GridSync sanitization feed        |
|                                                  |                                                 |
+----------------------------------------------------------------------------------------------------+
| [ INJECT CHAOS ]   |   [ NITRO OVERDRIVE ]   |   [ STEP ENGINE ]   |   [ PIT STOP RESET ]          | <- LAUNCH CONTROL DOCK
+----------------------------------------------------------------------------------------------------+
| 🟢 [04:20:12.104] CREW CHIEF: Aerodynamic vector locked at Mach 3.4. Nominal shockwave boundary.   | <- PIT-WALL RADIO LOG
| ⚡ [04:20:12.450] PIT WALL: Frame seq #84,201 verified. GridSync sanitization: 0 anomalies.       | (Bounded h-14 to h-16)
+----------------------------------------------------------------------------------------------------+
```

---

## 4. KEYBOARD SHORTCUTS & ARCADE SIM HOTKEYS

All cockpits support native keyboard hotkey bindings for rapid operator interaction:
- **`Spacebar`:** `[STEP ENGINE]` — Trigger single deterministic clock step.
- **`Key N`:** `[NITRO OVERDRIVE]` — Toggle 1x / 5x execution multiplier.
- **`Key C`:** `[INJECT CHAOS]` — Perturb sensors with synthetic anomaly.
- **`Key R`:** `[PIT STOP RESET]` — Re-zero state and clear telemetry faults.
- **`Key F`:** `[FULLSCREEN]` — Toggle full-screen cockpit viewport.

---

## 5. DEVELOPER COMPLIANCE CHECKLIST

Before any prototype or service cockpit is merged into the catalog:
- [ ] Viewport uses `h-screen overflow-hidden` with zero outer window scrollbars.
- [ ] Top Command Deck renders Asset ID, Powertrain tier, and live Dyno Seal.
- [ ] 4-Card HUD displays Nitro multiplier, Combo Streak 🔥, Shift Gear K=X, and Points.
- [ ] Launch Control Dock mounts all 4 arcade buttons (`CHAOS`, `NITRO`, `STEP`, `RESET`).
- [ ] Pit-Wall Radio Log displays timestamped callsigns (`CREW CHIEF`, `TELEMETRY`, `PIT WALL`).
- [ ] Zero dollar signs (`$`) exist anywhere in the code or UI strings.

*GhostFactoryOS Master Architecture — Lead Systems Engineer & UI/UX Design Architect*
