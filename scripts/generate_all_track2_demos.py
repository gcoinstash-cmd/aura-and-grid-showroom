#!/usr/bin/env python3
"""
generate_all_track2_demos.py
GhostFactoryOS Fleet Track 2 — Authentic Domain Web Applications Generator.
Purges generic waveform boilerplate and deploys bespoke domain cockpits across Slots #086 to #137.
"""

import os
import json
import shutil
import re

# Load inventory.json
INVENTORY_PATH = "tools/ghost-factory-console/src/data/inventory.json"
with open(INVENTORY_PATH, "r", encoding="utf-8") as f:
    INVENTORY = json.load(f)

INV_MAP = {u["id"]: u for u in INVENTORY}

# Domain Profiles for all 52 units (86 to 137)
DOMAIN_PROFILES = {
    86: {
        "engine_type": "RADAR_TACTICAL",
        "theme_color": "emerald",
        "accent_hex": "#10b981",
        "secondary_hex": "#06b6d4",
        "canvas_title": "360° Tactical Air-Defense Radar & Perimeter Sweep",
        "metrics": [
            ("Airborne Interceptors", "18 Units", "Active Combat Patrol", "emerald"),
            ("Perimeter Threat Level", "DEFCON 3", "Elevated Readiness", "amber"),
            ("RF Jammer Spectrum", "2.4 / 5.8 GHz", "Omni-Directional Active", "cyan"),
            ("Mesh Link SNR", "+44.2 dBm", "Low Latency P2P Sync", "purple"),
        ],
        "sub_channels": [
            ("Tracked Bogeys", "2 Contacts", "amber"),
            ("Interceptors Ready", "18 Air / 6 Docked", "emerald"),
            ("Target Lock SNR", "+44.2 dBm", "cyan"),
        ],
        "actuators": [
            ("Scramble Interceptors", "scrambleInterceptors()", "bg-emerald-600 hover:bg-emerald-500 text-black font-bold"),
            ("Deploy RF Jamming Field", "engageJamming()", "bg-cyan-600 hover:bg-cyan-500 text-black font-bold"),
            ("Authorize Kinetic Net", "launchKineticNet()", "bg-amber-600 hover:bg-amber-500 text-black font-bold"),
            ("Emergency RTB Recall", "emergencyRecall()", "bg-rose-700 hover:bg-rose-600 text-white font-bold"),
        ],
        "default_logs": [
            ("[SYS] Autonomous Drone Swarm Perimeter Defense C2 kernel online.", "text-slate-400"),
            ("[RADAR] Perimeter radar sweep scanning 360-degree sector Alpha to Delta.", "text-cyan-400"),
            ("[SWARM] 18 interceptors airborne; telemetry sync at 200 Hz nominal.", "text-emerald-400"),
            ("[TARGET] 2 unknown bogeys detected outside perimeter line (Bearing 042, 4.8 km).", "text-amber-400"),
        ]
    },
    87: {
        "engine_type": "OPEN_PIT_MINING",
        "theme_color": "amber",
        "accent_hex": "#f59e0b",
        "secondary_hex": "#d97706",
        "canvas_title": "Open-Pit Mining Contour Benches & Haulage Dispatch Map",
        "metrics": [
            ("Active Haul Trucks", "14 / 16 Units", "CAT 797F & Komatsu 930E", "amber"),
            ("Crusher Infeed Rate", "4,850 TPH", "Primary Gyratory Crusher", "emerald"),
            ("Avg Pit Cycle Time", "24.6 Min", "Bench 12 to Surface Dump", "cyan"),
            ("Autonomous Fleet Uptime", "99.4%", "Zero Lost-Time Incidents", "purple"),
        ],
        "sub_channels": [
            ("Crusher Queue", "2 Trucks Waiting", "amber"),
            ("Infeed Rate", "4,850 TPH", "emerald"),
            ("Fleet GPS Precision", "±2.4 cm RTK", "cyan"),
        ],
        "actuators": [
            ("Dispatch Next Truck", "dispatchNextTruck()", "bg-amber-500 hover:bg-amber-400 text-black font-bold"),
            ("Reroute Infeed to Stockpile B", "rerouteInfeed()", "bg-orange-600 hover:bg-orange-500 text-white font-bold"),
            ("Engage Pit Speed Restrictor", "toggleSpeedRestrictor()", "bg-yellow-600 hover:bg-yellow-500 text-black font-bold"),
            ("Emergency Pit Halt", "emergencyPitHalt()", "bg-rose-700 hover:bg-rose-600 text-white font-bold"),
        ],
        "default_logs": [
            ("[DISPATCH] Autonomous Mining Haulage Fleet Dispatch OS initialized.", "text-slate-400"),
            ("[BENCH] Excavation Face Bench 12 loading Shovel SH-04 active.", "text-amber-400"),
            ("[HAUL] Haul Truck HT-402 payload confirmed at 382.4 metric tons.", "text-emerald-400"),
            ("[CRUSHER] Primary infeed hopper level at 78% capacity; queue nominal.", "text-cyan-400"),
        ]
    },
    88: {
        "engine_type": "BENTHIC_SUBSEA_SONAR",
        "theme_color": "cyan",
        "accent_hex": "#06b6d4",
        "secondary_hex": "#0284c7",
        "canvas_title": "Benthic Seabed Topography & Bathymetric Sonar Waterfall",
        "metrics": [
            ("Current Bathymetric Depth", "4,218 Meters", "Clarion-Clipperton Zone", "cyan"),
            ("Nodule Extraction Rate", "185 kg/s", "High-Volume Vacuum Lift", "emerald"),
            ("Hydraulic Line Pressure", "318 Bar", "Compensated Deep-Sea Loop", "amber"),
            ("Seafloor Traction Slip", "3.4%", "Tracked Benthic Bogies", "purple"),
        ],
        "sub_channels": [
            ("Hydrostatic Pressure", "42.2 MPa", "cyan"),
            ("Slurry Density", "1.38 kg/L", "emerald"),
            ("USBL Beacon Slant", "4,280 m", "purple"),
        ],
        "actuators": [
            ("Engage Slurry Suction", "engageSuction()", "bg-cyan-500 hover:bg-cyan-400 text-black font-bold"),
            ("Purge Hydraulic Manifold", "purgeHydraulics()", "bg-blue-600 hover:bg-blue-500 text-white font-bold"),
            ("Sonar Acoustic Ping", "triggerSonarPing()", "bg-emerald-600 hover:bg-emerald-500 text-black font-bold"),
            ("Umbilical Emergency Release", "umbilicalRelease()", "bg-rose-700 hover:bg-rose-600 text-white font-bold"),
        ],
        "default_logs": [
            ("[BENTHIC] Subsea Crawler BC-09 telemetry uplink established via fiber umbilical.", "text-slate-400"),
            ("[DEPTH] Ambient hydrostatic pressure at 42.2 MPa; cold seawater at 1.8 C.", "text-cyan-400"),
            ("[HARVEST] Manganese nodule slurry flow stable at 185 kg/s.", "text-emerald-400"),
            ("[SONAR] Bathymetric obstacle scan reveals rocky outcrop at 45m ahead.", "text-amber-400"),
        ]
    },
    89: {
        "engine_type": "AVIATION_RAMP",
        "theme_color": "sky",
        "accent_hex": "#38bdf8",
        "secondary_hex": "#0284c7",
        "canvas_title": "Airport Tarmac & Private Jet Ramp Parking Matrix",
        "metrics": [
            ("Ramp Aircraft Active", "12 Jets", "Gulfstream, Global, Citation", "sky"),
            ("Jet-A Fuel Uplifted", "18,450 Gal", "Today Dispensed", "emerald"),
            ("Hangar Bay Capacity", "88%", "Bays A-D Occupied", "amber"),
            ("Ground Service SLA", "99.8%", "15-Min Turnaround Standard", "purple"),
        ],
        "sub_channels": [
            ("Apron Stands", "6 Occupied / 2 Open", "sky"),
            ("Fuel Bowsers", "3 Active / 1 Refill", "emerald"),
            ("ATC Clearance", "100% Release", "purple"),
        ],
        "actuators": [
            ("Dispatch Fuel Bowsers", "dispatchFuel()", "bg-sky-500 hover:bg-sky-400 text-black font-bold"),
            ("Assign Apron Stand", "assignStand()", "bg-emerald-600 hover:bg-emerald-500 text-black font-bold"),
            ("Request De-Ice Unit", "requestDeice()", "bg-cyan-600 hover:bg-cyan-500 text-black font-bold"),
            ("Emergency Ramp Hold", "rampEmergencyHold()", "bg-rose-700 hover:bg-rose-600 text-white font-bold"),
        ],
        "default_logs": [
            ("[RAMP] FBO Flight Ops terminal connected to FAA SWIM data feed.", "text-slate-400"),
            ("[ARRIVAL] G650ER tail N888AF touched down runway 25R; taxiing to Stand 4.", "text-sky-400"),
            ("[FUEL] Bowser Truck 3 dispatched with 2,400 gal Jet-A for Global 7500.", "text-emerald-400"),
            ("[CONCIERGE] VIP ground transit staging completed on apron perimeter.", "text-purple-400"),
        ]
    },
    90: {
        "engine_type": "WINERY_FERMENTATION",
        "theme_color": "rose",
        "accent_hex": "#f43f5e",
        "secondary_hex": "#be123c",
        "canvas_title": "Winery Fermentation Vats & Cellar Climate Matrix",
        "metrics": [
            ("Active Fermentation Vats", "24 Vats", "Stainless Conical Tanks", "rose"),
            ("Must Sugar Brix Level", "24.8° Brix", "Cabernet Sauvignon Lot 4", "amber"),
            ("Cellar Temp & Humidity", "14.2°C / 78%", "French Oak Barrel Vault", "emerald"),
            ("Vintage Lot Traceability", "100%", "Grape to Bottle Ledger", "purple"),
        ],
        "sub_channels": [
            ("Average Brix", "24.8°", "amber"),
            ("Cooling Jacket Temp", "14.2°C", "emerald"),
            ("Tank Headspace N2", "99.8%", "cyan"),
        ],
        "actuators": [
            ("Initiate Tank Pumpover", "startPumpover()", "bg-rose-600 hover:bg-rose-500 text-white font-bold"),
            ("Chill Glycol Jacket", "chillGlycol()", "bg-cyan-600 hover:bg-cyan-500 text-black font-bold"),
            ("Log Hydrometer Reading", "logHydrometer()", "bg-amber-600 hover:bg-amber-500 text-black font-bold"),
            ("Purge Nitrogen Headspace", "purgeNitrogen()", "bg-slate-700 hover:bg-slate-600 text-white font-bold"),
        ],
        "default_logs": [
            ("[WINERY] Cellar SCADA climate controller synchronized.", "text-slate-400"),
            ("[FERMENT] Vat 12 (Block B Reserve) cap temperature reached 28.4 C; cooling valve open.", "text-rose-400"),
            ("[BRIX] Brix drawdown velocity steady at 1.4 degrees per 24 hours.", "text-amber-400"),
            ("[AGING] Barrel Room 2 humidity verified at 78% RH with zero mold spores.", "text-emerald-400"),
        ]
    },
    91: {
        "engine_type": "CLINICAL_TRIAL_COHORT",
        "theme_color": "teal",
        "accent_hex": "#14b8a6",
        "secondary_hex": "#0f766e",
        "canvas_title": "Multi-Center Patient Cohort Flow & Retention Curves",
        "metrics": [
            ("Enrolled Patients", "840 Subjects", "Phase III Global Cohort", "teal"),
            ("Double-Blind Integrity", "100.0%", "Unblinded Safeties Zero", "emerald"),
            ("Protocol Deviations", "0 Critical", "FDA 21 CFR Part 11 Audit", "amber"),
            ("Adverse Event Velocity", "Nominal", "Independent DSMB Cleared", "purple"),
        ],
        "sub_channels": [
            ("Arm A Active", "420 Patients", "teal"),
            ("Arm B Control", "420 Patients", "emerald"),
            ("Data Lock Hash", "SHA-256 Sealed", "purple"),
        ],
        "actuators": [
            ("Randomize Patient", "randomizePatient()", "bg-teal-600 hover:bg-teal-500 text-white font-bold"),
            ("Lock eCRF Dataset", "lockDataset()", "bg-emerald-600 hover:bg-emerald-500 text-black font-bold"),
            ("Trigger DSMB Audit Packet", "triggerDsmb()", "bg-cyan-600 hover:bg-cyan-500 text-black font-bold"),
            ("Flag Safety Deviation", "flagSafetyDev()", "bg-rose-700 hover:bg-rose-600 text-white font-bold"),
        ],
        "default_logs": [
            ("[EDC] Multi-Center Clinical Trial Electronic Data Capture node online.", "text-slate-400"),
            ("[COHORT] Site 104 (Mayo Clinic) enrolled subject #841 into Arm B.", "text-teal-400"),
            ("[LABS] Pharmacokinetic assay batch #440 synced via encrypted SFTP.", "text-emerald-400"),
            ("[AUDIT] 21 CFR Part 11 SHA-256 tamper-evident database hash verified.", "text-purple-400"),
        ]
    },
    92: {
        "engine_type": "COLD_CHAIN_REEFER",
        "theme_color": "blue",
        "accent_hex": "#3b82f6",
        "secondary_hex": "#1d4ed8",
        "canvas_title": "Cold Storage Multi-Zone Temperature Heatmap & Compressor Loop",
        "metrics": [
            ("Ultra-Low Freezer Zone", "-78.4°C", "mRNA Biologics Vault", "blue"),
            ("Standard Reefer Temp", "-22.1°C", "Frozen Food Distribution", "cyan"),
            ("Ammonia Compressors", "4 / 4 Active", "Redundant VFD Drives", "emerald"),
            ("GDP Cold-Chain Audit", "100.0%", "Zero Thermal Excursions", "purple"),
        ],
        "sub_channels": [
            ("Vault A Temp", "-78.4°C", "blue"),
            ("Reefer Gate 4", "-22.1°C", "cyan"),
            ("Compressor Load", "74% VFD", "emerald"),
        ],
        "actuators": [
            ("Trigger Hot-Gas Defrost", "triggerDefrost()", "bg-blue-600 hover:bg-blue-500 text-white font-bold"),
            ("Boost Ammonia Chiller", "boostChiller()", "bg-cyan-600 hover:bg-cyan-500 text-black font-bold"),
            ("Seal Loading Dock 7", "sealDock()", "bg-emerald-600 hover:bg-emerald-500 text-black font-bold"),
            ("Thermal Excursion Alarm", "alarmThermalExcursion()", "bg-rose-700 hover:bg-rose-600 text-white font-bold"),
        ],
        "default_logs": [
            ("[COLD] Central Ammonia Refrigeration Plant telemetry connected.", "text-slate-400"),
            ("[VAULT] Ultra-Cold Storage Vault A verified at -78.4 C (Limit: -70.0 C).", "text-blue-400"),
            ("[REEFER] Trailer TR-902 docked at Gate 4; continuous temperature logger paired.", "text-cyan-400"),
            ("[ENERGY] Off-peak power arbitrage active; thermal storage ice bank loaded.", "text-emerald-400"),
        ]
    },
    93: {
        "engine_type": "SUPERSONIC_SCHLIEREN",
        "theme_color": "orange",
        "accent_hex": "#f97316",
        "secondary_hex": "#c2410c",
        "canvas_title": "Inverted Aerospike Supersonic Expansion Schlieren Field",
        "metrics": [
            ("Mach Cruise Number", "Mach 2.38", "Stratospheric Incline", "orange"),
            ("Aerospike Chamber Press", "14.8 MPa", "Combustion Core", "rose"),
            ("Base Pressure Thrust Recovery", "94.2%", "Atmospheric Self-Adapting", "emerald"),
            ("Turboramjet Transition", "LOCKED", "Scramjet Auxiliary Ready", "purple"),
        ],
        "sub_channels": [
            ("Nozzle Shock Angle", "28.4°", "orange"),
            ("Regen CH4 Cooling", "42 kg/s", "cyan"),
            ("Base Pressure Ratio", "0.94 P_atm", "emerald"),
        ],
        "actuators": [
            ("Throttle Aerospike Core", "throttleAerospike()", "bg-orange-600 hover:bg-orange-500 text-white font-bold"),
            ("Adjust Cowl Expansion Ratio", "adjustCowl()", "bg-amber-600 hover:bg-amber-500 text-black font-bold"),
            ("Ignite Ramjet Bypass", "igniteRamjet()", "bg-red-600 hover:bg-red-500 text-white font-bold"),
            ("Propellant Dump Valve", "dumpPropellant()", "bg-rose-800 hover:bg-rose-700 text-white font-bold"),
        ],
        "default_logs": [
            ("[PROPULSION] Inverted Aerospike Dual-Combustion telemetry streaming.", "text-slate-400"),
            ("[MACH] Vehicle airspeed Mach 2.38 at 58,000 ft; total temperature 410 K.", "text-orange-400"),
            ("[NOZZLE] Linear aerospike base pressure ratio maintaining 94.2% expansion efficiency.", "text-emerald-400"),
            ("[COOLING] Regenerative methane cooling loop flow verified at 42 kg/s.", "text-cyan-400"),
        ]
    },
    94: {
        "engine_type": "TOKAMAK_PLASMA_FUSION",
        "theme_color": "violet",
        "accent_hex": "#8b5cf6",
        "secondary_hex": "#6d28d9",
        "canvas_title": "Tokamak Poloidal Magnetic Flux Surfaces & Burning Plasma Core",
        "metrics": [
            ("Toroidal Magnetic Field", "12.8 Tesla", "HTS REBCO Magnets", "violet"),
            ("Plasma Core Temperature", "148 MK", "12.7 keV Electron Temp", "rose"),
            ("Fusion Gain Factor (Q)", "Q = 2.42", "Net Energy Breakeven Exceeded", "emerald"),
            ("Plasma Current (Ip)", "15.4 MA", "Steady-State Confinement", "cyan"),
        ],
        "sub_channels": [
            ("Divertor Heat Flux", "8.4 MW/m²", "emerald"),
            ("Electron Density", "1.2e20 m⁻³", "cyan"),
            ("Neutron Rate", "2.1e18 n/s", "rose"),
        ],
        "actuators": [
            ("Inject Deuterium Pellet", "injectPellet()", "bg-violet-600 hover:bg-violet-500 text-white font-bold"),
            ("Pulse ICRF Heating 20MW", "pulseIcrf()", "bg-rose-600 hover:bg-rose-500 text-white font-bold"),
            ("Engage Divertor Sweeping", "engageDivertor()", "bg-cyan-600 hover:bg-cyan-500 text-black font-bold"),
            ("Emergency Plasma Quench", "emergencyQuench()", "bg-red-800 hover:bg-red-700 text-white font-bold"),
        ],
        "default_logs": [
            ("[FUSION] Tokamak SCADA pulse sequencer armed; magnetic coils energized.", "text-slate-400"),
            ("[PLASMA] Magnetic equilibrium reconstructed; elongation kappa = 1.84.", "text-violet-400"),
            ("[CORE] Central electron temperature reached 148 Million K; neutron yield 2.1e18 n/s.", "text-rose-400"),
            ("[DIVERTOR] Peak heat flux on tungsten monoblocks stable at 8.4 MW/m2.", "text-emerald-400"),
        ]
    },
    95: {
        "engine_type": "BENTHIC_SUBSEA_SONAR",
        "theme_color": "cyan",
        "accent_hex": "#06b6d4",
        "secondary_hex": "#0e7490",
        "canvas_title": "ROV Trenching Sonar Bathymetry & Cable Burial Depth",
        "metrics": [
            ("Burial Depth of Cover", "2.85 Meters", "Sub-Seafloor Target Met", "cyan"),
            ("High-Pressure Jetting", "45 Bar", "Seabed Liquefaction Nozzles", "blue"),
            ("Cable Tension Load", "12.4 kN", "Optical Fiber Residual Strain", "emerald"),
            ("ROV Trenching Speed", "340 m/hr", "Continuous Cable Lay", "purple"),
        ],
        "sub_channels": [
            ("Sword Depth", "2.85 m", "cyan"),
            ("Jetting Pressure", "45 Bar", "blue"),
            ("Cable Strain", "0.02%", "emerald"),
        ],
        "actuators": [
            ("Engage Water Jetters", "engageJetters()", "bg-cyan-600 hover:bg-cyan-500 text-black font-bold"),
            ("Deploy Depressor Sword", "deploySword()", "bg-blue-600 hover:bg-blue-500 text-white font-bold"),
            ("Ping Cable Sonar Tracker", "pingCableTracker()", "bg-emerald-600 hover:bg-emerald-500 text-black font-bold"),
            ("ROV Surface Abort", "surfaceAbort()", "bg-rose-700 hover:bg-rose-600 text-white font-bold"),
        ],
        "default_logs": [
            ("[ROV] Deep-Sea Jet-Trencher vehicle 'Poseidon-IV' on seafloor at 1,840m.", "text-slate-400"),
            ("[TRENCH] Subsea liquefaction jets operating at 45 bar; trenching depth 2.85m.", "text-cyan-400"),
            ("[CABLE] Transoceanic telecom fiber residual tension nominal at 12.4 kN.", "text-emerald-400"),
            ("[SONAR] Dual-frequency multibeam confirms complete post-lay cable burial.", "text-purple-400"),
        ]
    },
    96: {
        "engine_type": "GEOTHERMAL_SEISMIC",
        "theme_color": "amber",
        "accent_hex": "#f59e0b",
        "secondary_hex": "#b45309",
        "canvas_title": "Subsurface Igneous Reservoir & Microseismic Fracture Network",
        "metrics": [
            ("Wellhead Steam Enthalpy", "3,120 kJ/kg", "448°C Supercritical Fluid", "amber"),
            ("Borehole Bottom Pressure", "28.4 MPa", "Depth 4,800m Igneous Core", "rose"),
            ("Binary Cycle Generation", "45.2 MWe", "Zero Carbon Base Load", "emerald"),
            ("Induced Seismicity Index", "< M 0.4", "Microseismic Cloud Stable", "cyan"),
        ],
        "sub_channels": [
            ("Steam Enthalpy", "3,120 kJ/kg", "amber"),
            ("Turbine Output", "45.2 MWe", "emerald"),
            ("Max Magnitude", "M 0.22", "cyan"),
        ],
        "actuators": [
            ("Regulate Turbine Bypass", "regulateBypass()", "bg-amber-600 hover:bg-amber-500 text-black font-bold"),
            ("Adjust Reinjection Flow", "adjustReinjection()", "bg-blue-600 hover:bg-blue-500 text-white font-bold"),
            ("Run Microseismic Array Scan", "runSeismicScan()", "bg-purple-600 hover:bg-purple-500 text-white font-bold"),
            ("Emergency Wellhead Blowout Cut", "emergencyBlowoutCut()", "bg-red-800 hover:bg-red-700 text-white font-bold"),
        ],
        "default_logs": [
            ("[GEOTHERMAL] Supercritical Wellhead WH-01 telemetry online.", "text-slate-400"),
            ("[PRESSURE] Wellhead production casing pressure steady at 28.4 MPa.", "text-amber-400"),
            ("[ENERGY] ORC binary turbine #2 generator output 45.2 Megawatts into the grid.", "text-emerald-400"),
            ("[SEISMIC] 64-channel borehole geophone array confirms zero seismic anomalies.", "text-cyan-400"),
        ]
    },
    97: {
        "engine_type": "HFT_MICROWAVE_RELAY",
        "theme_color": "emerald",
        "accent_hex": "#10b981",
        "secondary_hex": "#047857",
        "canvas_title": "Aurora-to-Secaucus Microwave Relay & FPGA Latency Histogram",
        "metrics": [
            ("Chicago-NJ Relay Latency", "3.985 ms", "Direct Microwave Path", "emerald"),
            ("Tick-to-Trade FPGA P99", "380 ns", "Zero Kernel Bypass", "cyan"),
            ("Packet Drop Counter", "0 Packets", "Zero Tolerance Redundancy", "purple"),
            ("PTP IEEE 1588 Clock Jitter", "±14 ps", "Atomic Cesium Reference", "amber"),
        ],
        "sub_channels": [
            ("Microwave Flight Time", "3.985 ms", "emerald"),
            ("FPGA P99 Tick", "380 ns", "cyan"),
            ("Clock Jitter", "±14 ps", "purple"),
        ],
        "actuators": [
            ("Switch to Laser Backup Hop", "switchLaserHop()", "bg-emerald-600 hover:bg-emerald-500 text-black font-bold"),
            ("Flush FPGA Order Queue", "flushFpgaQueue()", "bg-cyan-600 hover:bg-cyan-500 text-black font-bold"),
            ("Calibrate PTP Atomic Clock", "calibratePtp()", "bg-purple-600 hover:bg-purple-500 text-white font-bold"),
            ("Emergency Hard Kill Switch", "emergencyKillSwitch()", "bg-rose-700 hover:bg-rose-600 text-white font-bold"),
        ],
        "default_logs": [
            ("[HFT] CME Aurora to Equinix Secaucus microwave link telemetry synchronized.", "text-slate-400"),
            ("[LATENCY] One-way wireless flight time measured at 3.985 ms across 18 tower hops.", "text-emerald-400"),
            ("[FPGA] Xilinx UltraScale+ execution core processing L3 order book updates.", "text-cyan-400"),
            ("[CLOCK] GPS-disciplined Rubidium oscillator time offset < 14 picoseconds.", "text-purple-400"),
        ]
    },
    98: {
        "engine_type": "SUPERSONIC_SCHLIEREN",
        "theme_color": "rose",
        "accent_hex": "#f43f5e",
        "secondary_hex": "#be123c",
        "canvas_title": "Hypersonic Wind Tunnel Schlieren Optical Density Visualization",
        "metrics": [
            ("Free-Stream Airspeed", "Mach 6.8", "Arc-Heated Hypersonic Flow", "rose"),
            ("Stagnation Enthalpy", "8.4 MJ/kg", "Total Temp 2,450 K", "amber"),
            ("6-DOF Balance Lift/Drag", "L/D = 4.12", "Waverider Geometry", "emerald"),
            ("Schlieren Shock Stability", "LOCKED", "Bow Shock Detachment 1.8mm", "cyan"),
        ],
        "sub_channels": [
            ("Mach Number", "Mach 6.8", "rose"),
            ("Shock Detachment", "1.8 mm", "amber"),
            ("6-DOF Balance L/D", "4.12", "emerald"),
        ],
        "actuators": [
            ("Fire Arc Heater Plume", "fireArcHeater()", "bg-rose-600 hover:bg-rose-500 text-white font-bold"),
            ("Actuate Balance Pitch/Yaw", "actuatePitch()", "bg-amber-600 hover:bg-amber-500 text-black font-bold"),
            ("Capture Schlieren Frame", "captureSchlieren()", "bg-cyan-600 hover:bg-cyan-500 text-black font-bold"),
            ("Tunnel Scram Exhaust", "tunnelScram()", "bg-red-800 hover:bg-red-700 text-white font-bold"),
        ],
        "default_logs": [
            ("[TUNNEL] Mach 7 Hypersonic Blowdown Tunnel control deck ready.", "text-slate-400"),
            ("[TEST] Test run #104 initiated: 12-second blowdown cycle commencing.", "text-rose-400"),
            ("[SCHLIEREN] High-speed laser Schlieren imaging capturing boundary layer transition.", "text-cyan-400"),
            ("[FORCES] 6-component internal strain gauge balance streaming force vectors.", "text-emerald-400"),
        ]
    },
    99: {
        "engine_type": "LUXURY_CARRIER_FLEET",
        "theme_color": "amber",
        "accent_hex": "#f59e0b",
        "secondary_hex": "#78350f",
        "canvas_title": "Hypercar Transporter Route Vectors & Vault Staging Bay",
        "metrics": [
            ("Vault Vehicles Secured", "48 Hypercars", "Ferrari, Bugatti, Koenigsegg", "amber"),
            ("Vault Climate & Humidity", "20.5°C / 45%", "Nitrogen Enriched Purge", "emerald"),
            ("Enclosed Transports En Route", "6 Carriers", "Air-Ride Air-Conditioned", "cyan"),
            ("Battery Conditioning Status", "100% Float", "Micro-Pulse Float Arrays", "purple"),
        ],
        "sub_channels": [
            ("Vault Bays", "48 / 50 Filled", "amber"),
            ("Carriers Active", "6 Trucks", "cyan"),
            ("Air Purity Index", "ISO 6 Clean", "emerald"),
        ],
        "actuators": [
            ("Dispatch Enclosed Carrier", "dispatchCarrier()", "bg-amber-600 hover:bg-amber-500 text-black font-bold"),
            ("Run Battery Float Diagnostic", "runBatteryDiag()", "bg-emerald-600 hover:bg-emerald-500 text-black font-bold"),
            ("Seal Vault Air Barrier", "sealAirBarrier()", "bg-slate-700 hover:bg-slate-600 text-white font-bold"),
            ("Trigger Vault Security Lockdown", "vaultLockdown()", "bg-rose-700 hover:bg-rose-600 text-white font-bold"),
        ],
        "default_logs": [
            ("[CONCIERGE] Luxury Auto Concierge Master Vault telemetry active.", "text-slate-400"),
            ("[SECURITY] Biometric iris scanner cleared technician into Vault Tier-1.", "text-amber-400"),
            ("[FLEET] Enclosed transporter T-04 arriving at Pebble Beach Concours staging.", "text-cyan-400"),
            ("[CLIMATE] Particulate HEPA filtration level at ISO Class 6 standard.", "text-emerald-400"),
        ]
    },
    100: {
        "engine_type": "MARITIME_CARGO_TRACK",
        "theme_color": "sky",
        "accent_hex": "#38bdf8",
        "secondary_hex": "#0369a1",
        "canvas_title": "Global Ocean Shipping Corridors & AIS Hull Positioning",
        "metrics": [
            ("Vessels Under Charter", "34 Ships", "Capesize, Panamax, Supramax", "sky"),
            ("Baltic Dry Index Spot", "1,845 Pts", "+42 Pts Today", "emerald"),
            ("Bunker Fuel Consumption", "38.2 MT/day", "VLSFO Dual-Fuel Nominal", "cyan"),
            ("Demurrage Risk Exposure", "Zero Days", "All Laytime Balanced", "purple"),
        ],
        "sub_channels": [
            ("Tracked Hulls", "34 Vessels", "sky"),
            ("Average Speed", "14.2 Knots", "cyan"),
            ("Laytime Margin", "+4.2 Days", "emerald"),
        ],
        "actuators": [
            ("Fix Charter Party", "fixCharter()", "bg-sky-600 hover:bg-sky-500 text-white font-bold"),
            ("Optimize Weather Route", "optimizeRoute()", "bg-emerald-600 hover:bg-emerald-500 text-black font-bold"),
            ("Hedge Bunker Fuel Swap", "hedgeBunker()", "bg-amber-600 hover:bg-amber-500 text-black font-bold"),
            ("Issue Notice of Readiness", "issueNor()", "bg-purple-600 hover:bg-purple-500 text-white font-bold"),
        ],
        "default_logs": [
            ("[MARITIME] Global AIS vessel tracking feed connected to 34 chartered hulls.", "text-slate-400"),
            ("[VOYAGE] M/V Pacific Pioneer (Capesize, 180k DWT) rounded Cape of Good Hope.", "text-sky-400"),
            ("[CHARTER] Fixture signed for iron ore cargo Port Hedland to Qingdao.", "text-emerald-400"),
            ("[BUNKER] Singapore bunker price fixed at competitive spot rate.", "text-cyan-400"),
        ]
    }
}

# Fill defaults for remaining units (101 to 137) from inventory
for slot in range(101, 138):
    if slot in DOMAIN_PROFILES:
        continue
    item = INV_MAP.get(slot, {})
    name = item.get("name", "Deep Tech Console")
    cat = item.get("category", "SCADA Console")
    
    n_lower = name.lower()
    if "laser" in n_lower or "isl" in n_lower or "satellite" in n_lower or "orbit" in n_lower or "elevator" in n_lower or "catapult" in n_lower or "mass driver" in n_lower or "space" in n_lower:
        engine_type = "ORBITAL_LASER_CONSTELLATION"
        theme = "cyan"
        accent = "#06b6d4"
        sec = "#0891b2"
        canvas_title = f"{name} — Orbital Trajectory & Laser Cross-Link Mesh"
    elif "tokamak" in n_lower or "fusion" in n_lower or "plasma" in n_lower:
        engine_type = "TOKAMAK_PLASMA_FUSION"
        theme = "violet"
        accent = "#8b5cf6"
        sec = "#6d28d9"
        canvas_title = f"{name} — Poloidal Magnetic Confinement & Plasma Core"
    elif "hypersonic" in n_lower or "aerospike" in n_lower or "scramjet" in n_lower or "mach" in n_lower or "suction" in n_lower or "morph" in n_lower or "aero" in n_lower:
        engine_type = "SUPERSONIC_SCHLIEREN"
        theme = "rose"
        accent = "#f43f5e"
        sec = "#be123c"
        canvas_title = f"{name} — Aerodynamic Shockwave & Schlieren Flow Field"
    elif "subsea" in n_lower or "crawler" in n_lower or "sonar" in n_lower or "trench" in n_lower:
        engine_type = "BENTHIC_SUBSEA_SONAR"
        theme = "cyan"
        accent = "#06b6d4"
        sec = "#0284c7"
        canvas_title = f"{name} — Bathymetric Sonar Topography & Benthic HUD"
    elif "drone" in n_lower or "swarm" in n_lower or "tactical" in n_lower:
        engine_type = "RADAR_TACTICAL"
        theme = "emerald"
        accent = "#10b981"
        sec = "#059669"
        canvas_title = f"{name} — Tactical Radar Perimeter & Airspace Geofence"
    elif "cleanroom" in n_lower or "fab" in n_lower or "semiconductor" in n_lower:
        engine_type = "SEMICONDUCTOR_CLEANROOM"
        theme = "cyan"
        accent = "#06b6d4"
        sec = "#0891b2"
        canvas_title = f"{name} — Class 1 Cleanroom Bay Laminar Airflow Matrix"
    elif "cryostat" in n_lower or "quantum" in n_lower:
        engine_type = "QUANTUM_CRYOSTAT"
        theme = "purple"
        accent = "#a855f7"
        sec = "#7e22ce"
        canvas_title = f"{name} — Dilution Refrigerator Multi-Stage Cryostat"
    elif "microgrid" in n_lower or "solar" in n_lower or "bess" in n_lower:
        engine_type = "MICROGRID_EMS"
        theme = "emerald"
        accent = "#10b981"
        sec = "#059669"
        canvas_title = f"{name} — Microgrid Generation Curve & BESS Storage Flow"
    elif "sentiment" in n_lower or "vibepulse" in n_lower or "radar" in n_lower:
        engine_type = "VIBEPULSE_NLP_RADAR"
        theme = "rose"
        accent = "#f43f5e"
        sec = "#e11d48"
        canvas_title = f"{name} — Audience Sentiment NLP Vector Topology"
    elif "credit" in n_lower or "syndication" in n_lower or "finance" in n_lower:
        engine_type = "FINANCIAL_CREDIT_WATERFALL"
        theme = "emerald"
        accent = "#10b981"
        sec = "#065f46"
        canvas_title = f"{name} — Loan Tranche Capitalization & Cashflow Waterfall"
    elif "geothermal" in n_lower or "seismic" in n_lower or "egs" in n_lower:
        engine_type = "GEOTHERMAL_SEISMIC"
        theme = "amber"
        accent = "#f59e0b"
        sec = "#b45309"
        canvas_title = f"{name} — Supercritical Reservoir Enthalpy & Fracture Map"
    elif "fleet" in n_lower or "hypercar" in n_lower or "chassis" in n_lower or "endurance" in n_lower or "concierge" in n_lower:
        engine_type = "LUXURY_CARRIER_FLEET"
        theme = "amber"
        accent = "#f59e0b"
        sec = "#b45309"
        canvas_title = f"{name} — Vehicle Telemetry & Active Chassis Actuation"
    else:
        engine_type = "ORBITAL_LASER_CONSTELLATION"
        theme = "cyan"
        accent = "#06b6d4"
        sec = "#0891b2"
        canvas_title = f"{name} — Telemetry Operations Matrix"

    DOMAIN_PROFILES[slot] = {
        "engine_type": engine_type,
        "theme_color": theme,
        "accent_hex": accent,
        "secondary_hex": sec,
        "canvas_title": canvas_title,
        "metrics": [
            ("Operational Status", "NOMINAL_PEAK", "Deterministic Control Loop", theme),
            ("Primary Telemetry", "99.8% Calibrated", "Subsystem Interlocks Green", "emerald"),
            ("Sampling Frequency", "1,000 Hz", "Sub-Millisecond Path", "cyan"),
            ("Database Engine", "PostgreSQL 16", "Supabase RLS Ledger", "purple"),
        ],
        "sub_channels": [
            ("Core Telemetry α", "0.942 Active", theme),
            ("Auxiliary Subsystem β", "18.4 Units", "emerald"),
            ("Tamper Proof Hash", "SHA-256 Verified", "purple"),
        ],
        "actuators": [
            ("Trigger Primary Actuator", "triggerActuator1()", f"bg-{theme}-600 hover:bg-{theme}-500 text-white font-bold"),
            ("Calibrate Domain Sensor", "calibrateDomainSensor()", "bg-cyan-600 hover:bg-cyan-500 text-black font-bold"),
            ("Execute Subsystem Diagnostic", "executeDiagnostic()", "bg-emerald-600 hover:bg-emerald-500 text-black font-bold"),
            ("Safe Mode State Override", "emergencyOverride()", "bg-rose-700 hover:bg-rose-600 text-white font-bold"),
        ],
        "default_logs": [
            (f"[SYS] {name} operations console initialized.", "text-slate-400"),
            ("[SYNC] Subsystem telemetry channel synchronized with zero packet loss.", "text-emerald-400"),
            ("[INTEGRITY] Enterprise architecture clearance verified; NIST SP 800-218 compliant.", "text-cyan-400"),
            ("[MONITOR] Deterministic state machine holding nominal operational parameters.", "text-purple-400"),
        ]
    }

print(f"Total profiles configured: {len(DOMAIN_PROFILES)}")


def generate_table_rows(table_name, unit_id):
    """Generates realistic sample rows for each domain table."""
    rows = []
    t_lower = table_name.lower()
    
    if "drone" in t_lower or "swarm" in t_lower or "interceptor" in t_lower:
        rows = [
            {"ID": f"DRN-{unit_id[-3:]}-01", "Callsign": "RAPTOR-ALPHA", "Status": "AIRBORNE // PATROL", "Alt (m)": "148", "Battery": "88%", "Payload": "EO/IR + RF Jammer"},
            {"ID": f"DRN-{unit_id[-3:]}-02", "Callsign": "RAPTOR-BRAVO", "Status": "INTERCEPT VECTOR", "Alt (m)": "185", "Battery": "74%", "Payload": "Kinetic Net Dispenser"},
            {"ID": f"DRN-{unit_id[-3:]}-03", "Callsign": "VIPER-01", "Status": "AIRBORNE // PATROL", "Alt (m)": "160", "Battery": "92%", "Payload": "LIDAR Recon 3D"},
            {"ID": f"DRN-{unit_id[-3:]}-04", "Callsign": "VIPER-02", "Status": "STATIONARY HOVER", "Alt (m)": "120", "Battery": "81%", "Payload": "EW Jamming Active"},
        ]
    elif "truck" in t_lower or "haul" in t_lower:
        rows = [
            {"ID": "HT-401", "Model": "CAT 797F (400t)", "Route": "Pit Bench 12 -> Crusher A", "Payload": "384.2 MT", "Status": "HAULING", "Speed": "28 km/h"},
            {"ID": "HT-402", "Model": "Komatsu 930E", "Route": "Face North -> Waste Dump 3", "Payload": "298.5 MT", "Status": "DUMPING", "Speed": "0 km/h"},
            {"ID": "HT-403", "Model": "CAT 797F (400t)", "Route": "Crusher A -> Pit Bench 12", "Payload": "0.0 MT (Empty)", "Status": "RETURNING", "Speed": "38 km/h"},
            {"ID": "HT-404", "Model": "Komatsu 930E", "Route": "Face South -> Crusher B", "Payload": "312.0 MT", "Status": "QUEUED", "Speed": "5 km/h"},
        ]
    elif "crawler" in t_lower or "rov" in t_lower or "trench" in t_lower or "subsea" in t_lower:
        rows = [
            {"ID": f"CRAWLER-{unit_id[-3:]}", "Depth": "4,218 m", "Heading": "048° NE", "Traction": "97.2%", "Slurry Rate": "185 kg/s", "Status": "HARVESTING"},
            {"ID": "UMBILICAL-01", "Length": "4,500 m", "Tension": "38.4 kN", "Power": "3.3 kV / 400 Hz", "Fiber": "10 Gbps Locked", "Status": "NOMINAL"},
            {"ID": "DREDGE-HEAD-A", "Suction": "318 Bar", "RPM": "1,450", "Slurry Density": "1.38 kg/L", "Temp": "1.8°C", "Status": "ACTIVE"},
            {"ID": "USBL-BEACON-4", "Frequency": "24.5 kHz", "Slant Range": "4,280 m", "SNR": "+28 dB", "Accuracy": "±0.4 m", "Status": "TRACKING"},
        ]
    elif "satellite" in t_lower or "orbit" in t_lower or "laser" in t_lower or "isl" in t_lower:
        rows = [
            {"Node": "LEO-SAT-104", "Orbit Alt": "550 km", "Target Node": "LEO-SAT-105", "Link Bitrate": "100 Gbps", "Tracking Error": "0.8 µrad", "Status": "LASER LOCKED"},
            {"Node": "LEO-SAT-105", "Orbit Alt": "550 km", "Target Node": "LEO-SAT-106", "Link Bitrate": "100 Gbps", "Tracking Error": "1.1 µrad", "Status": "LASER LOCKED"},
            {"Node": "LEO-SAT-106", "Orbit Alt": "550 km", "Target Node": "LEO-SAT-107", "Link Bitrate": "100 Gbps", "Tracking Error": "0.9 µrad", "Status": "LASER LOCKED"},
            {"Node": "LEO-SAT-107", "Orbit Alt": "550 km", "Target Node": "GROUND-GATEWAY-1", "Link Bitrate": "40 Gbps", "Tracking Error": "1.4 µrad", "Status": "DOWNLINK ACTIVE"},
        ]
    elif "fusion" in t_lower or "tokamak" in t_lower or "plasma" in t_lower:
        rows = [
            {"Component": "Toroidal Field Coil A", "Field": "12.8 Tesla", "Current": "64.2 kA", "Cryo Temp": "18.4 K", "Status": "SUPERCONDUCTING"},
            {"Component": "Central Solenoid", "Flux Swing": "48 Wb", "Rate": "1.2 Wb/s", "Cryo Temp": "16.8 K", "Status": "RAMPING"},
            {"Component": "Neutral Beam Injector 1", "Power": "15.0 MW", "Energy": "1.0 MeV", "Species": "Deuterium", "Status": "INJECTING"},
            {"Component": "Lower Divertor Monoblock", "Heat Flux": "8.4 MW/m²", "Surface Temp": "840°C", "Coolant": "Pressurized H2O", "Status": "NOMINAL"},
        ]
    elif "cryo" in t_lower or "qubit" in t_lower or "quantum" in t_lower:
        rows = [
            {"Stage": "50K Radiation Shield", "Temp": "48.2 K", "Sensor": "PT-100 Platinum", "Cooling Method": "Pulse Tube 1st Stage", "Status": "STABILIZED"},
            {"Stage": "4K Cold Plate", "Temp": "3.84 K", "Sensor": "Cernox CX-1050", "Cooling Method": "Pulse Tube 2nd Stage", "Status": "STABILIZED"},
            {"Stage": "Still Stage (He-3)", "Temp": "780 mK", "Sensor": "Ruthenium Oxide", "Cooling Method": "Helium-3 Evaporation", "Status": "CIRCULATING"},
            {"Stage": "Mixing Chamber Base", "Temp": "11.8 mK", "Sensor": "CMN Paramagnetic", "Cooling Method": "He-3 / He-4 Dilution", "Status": "BASE NOMINAL"},
        ]
    elif "aerospike" in t_lower or "hypersonic" in t_lower or "mach" in t_lower:
        rows = [
            {"Sensor": "Inlet Stagnation Pitot", "Reading": "Mach 6.8", "Pressure": "14.2 MPa", "Temp": "2,450 K", "Status": "STREAMING"},
            {"Sensor": "Nozzle Throat Thermocouple", "Reading": "1,840 K", "Heat Flux": "18.4 MW/m²", "Coolant": "Regenerative CH4", "Status": "LOCKED"},
            {"Sensor": "Base Aerospike Pressure P_b", "Reading": "0.94 P_atm", "Expansion Ratio": "96.2%", "Thrust Rec": "94.2%", "Status": "OPTIMAL"},
            {"Sensor": "6-DOF Aerodynamic Balance", "Lift": "84.2 kN", "Drag": "20.4 kN", "L/D Ratio": "4.12", "Status": "STREAMING"},
        ]
    elif "vessel" in t_lower or "yacht" in t_lower or "freight" in t_lower:
        rows = [
            {"Vessel": f"M/V ATLANTIC-{unit_id[-3:]}", "Type": "Capesize Bulk (180k DWT)", "Voyage": "Port Hedland -> Qingdao", "Speed": "14.2 kts", "Bunker": "38.4 MT/d", "Status": "UNDERWAY"},
            {"Vessel": f"M/V PACIFIC-{unit_id[-3:]}", "Type": "Panamax Container", "Voyage": "Singapore -> Rotterdam", "Speed": "18.5 kts", "Bunker": "48.2 MT/d", "Status": "UNDERWAY"},
            {"Vessel": "M/Y AURELIA-II", "Type": "65m Mega-Yacht", "Voyage": "Monaco -> Saint-Tropez", "Speed": "12.0 kts", "Bunker": "380 L/h", "Status": "ANCHORED"},
            {"Vessel": "TUG-OCEAN-STAR", "Type": "DP2 Anchor Handler", "Voyage": "North Sea Field Alpha", "Speed": "10.8 kts", "Bunker": "18.0 MT/d", "Status": "ON STATION"},
        ]
    elif "wellhead" in t_lower or "geothermal" in t_lower or "seismic" in t_lower:
        rows = [
            {"Wellhead": "WH-CASCADE-01", "Depth": "4,850 m", "Fluid": "Supercritical Steam", "Enthalpy": "3,120 kJ/kg", "Pressure": "28.4 MPa", "Status": "PRODUCING"},
            {"Wellhead": "WH-CASCADE-02", "Depth": "4,920 m", "Fluid": "Supercritical Steam", "Enthalpy": "3,250 kJ/kg", "Pressure": "29.1 MPa", "Status": "PRODUCING"},
            {"Wellhead": "INJ-REINJECT-A", "Depth": "3,600 m", "Fluid": "Chilled Brine Return", "Flow": "240 kg/s", "Pressure": "14.8 MPa", "Status": "INJECTING"},
            {"Wellhead": "SEISMIC-ARRAY-4", "Depth": "1,200 m", "Sensors": "3-Component Geophone", "Trigger Threshold": "M 0.2", "Noise": "< 2 µm/s", "Status": "MONITORING"},
        ]
    elif "cleanroom" in t_lower or "fab" in t_lower:
        rows = [
            {"Chamber": "Bay 1 — EUV Photolithography", "Class": "ISO 1 (0.1µm)", "Particles/cu ft": "0.02", "Laminar Flow": "0.45 m/s", "Status": "OPTIMAL"},
            {"Chamber": "Bay 2 — High-k Dielectric ALD", "Class": "ISO 2 (0.2µm)", "Particles/cu ft": "0.08", "Laminar Flow": "0.42 m/s", "Status": "OPTIMAL"},
            {"Chamber": "Bay 3 — Plasma Etch & Strip", "Class": "ISO 3 (0.3µm)", "Particles/cu ft": "0.14", "Laminar Flow": "0.44 m/s", "Status": "OPTIMAL"},
            {"Chamber": "Bay 4 — Copper Chemical Polish", "Class": "ISO 4 (0.5µm)", "Particles/cu ft": "0.28", "Laminar Flow": "0.48 m/s", "Status": "OPTIMAL"},
        ]
    elif "credit" in t_lower or "tranche" in t_lower:
        rows = [
            {"Facility": "Senior Secured Term Loan A", "Commitment": "650M Principal", "Spread": "SOFR + 475 bps", "DSCR": "2.65x", "Maturity": "2029-Q4", "Status": "PERFORMING"},
            {"Facility": "First-Lien Revolving Credit", "Commitment": "125M Undrawn", "Spread": "SOFR + 425 bps", "DSCR": "2.40x", "Maturity": "2028-Q2", "Status": "STANDBY"},
            {"Facility": "Second-Lien Mezzanine Note", "Commitment": "225M Principal", "Spread": "SOFR + 750 bps", "DSCR": "1.95x", "Maturity": "2030-Q1", "Status": "PERFORMING"},
            {"Facility": "HoldCo Payment-in-Kind (PIK)", "Commitment": "85M Principal", "Spread": "11.50% Fixed", "DSCR": "1.80x", "Maturity": "2031-Q2", "Status": "CURRENT"},
        ]
    elif "solar" in t_lower or "bess" in t_lower or "grid" in t_lower or "microgrid" in t_lower:
        rows = [
            {"Asset": "Solar Photovoltaic Array A", "Capacity": "12.5 MWp", "Output": "11.8 MWe", "Inverter Eff": "98.8%", "Irradiance": "980 W/m²", "Status": "GENERATING"},
            {"Asset": "Solar Photovoltaic Array B", "Capacity": "8.0 MWp", "Output": "7.6 MWe", "Inverter Eff": "98.5%", "Irradiance": "980 W/m²", "Status": "GENERATING"},
            {"Asset": "BESS Battery Pack 1 (LFP)", "Capacity": "20 MWh", "SoC": "88.4%", "Power": "+6.2 MW (Charge)", "Temp": "24.2°C", "Status": "CHARGING"},
            {"Asset": "Substation Feeder Intertie", "Voltage": "34.5 kV", "Freq": "60.002 Hz", "Power Factor": "0.998", "Power Export": "14.2 MW", "Status": "GRID SYNC"},
        ]
    elif "patient" in t_lower or "trial" in t_lower or "clinical" in t_lower:
        rows = [
            {"Cohort": "Arm A — Active Investigational", "Subjects": "420 Enrolled", "Retention": "98.8%", "Primary Endpoint": "PFS @ 12 Mo", "Status": "ACTIVE BLINDED"},
            {"Cohort": "Arm B — Standard of Care Control", "Subjects": "420 Enrolled", "Retention": "97.6%", "Primary Endpoint": "PFS @ 12 Mo", "Status": "ACTIVE BLINDED"},
            {"Cohort": "Pharmacokinetic Sub-Study", "Subjects": "84 Subjects", "Retention": "100.0%", "Assay Assay": "C_max / AUC_24", "Status": "COMPLETED"},
            {"Cohort": "Long-Term Safety Extension", "Subjects": "312 Subjects", "Retention": "99.2%", "Adverse Events": "0 Serious (SAE)", "Status": "MONITORING"},
        ]
    elif "vat" in t_lower or "wine" in t_lower or "ferment" in t_lower:
        rows = [
            {"Vat": "Tank 01 — Cabernet Sauvignon Lot 4", "Capacity": "10,000 L", "Brix": "24.8°", "Temp": "26.4°C", "Cap Density": "Heavy", "Status": "ACTIVE FERMENT"},
            {"Vat": "Tank 02 — Reserve Merlot Lot 2", "Capacity": "8,500 L", "Brix": "18.2°", "Temp": "24.8°C", "Cap Density": "Medium", "Status": "PUMP-OVER ACTIVE"},
            {"Vat": "Tank 03 — Cabernet Franc Clone 332", "Capacity": "6,000 L", "Brix": "8.4°", "Temp": "22.0°C", "Cap Density": "Light", "Status": "FINISHING"},
            {"Vat": "Tank 04 — Malbec Press Fractions", "Capacity": "5,000 L", "Brix": "2.1°", "Temp": "20.5°C", "Cap Density": "Settled", "Status": "PRE-PRESSING"},
        ]
    elif "reefer" in t_lower or "cold" in t_lower or "storage" in t_lower:
        rows = [
            {"Zone": "Vault A — mRNA Biologics Ultralow", "Target Temp": "-80.0°C", "Actual Temp": "-78.4°C", "Sensor": "PT100 Calibrated", "Alarm State": "GREEN / NOMINAL"},
            {"Zone": "Vault B — Pharmaceutical Plasma", "Target Temp": "-30.0°C", "Actual Temp": "-28.6°C", "Sensor": "Dual RTD Redundant", "Alarm State": "GREEN / NOMINAL"},
            {"Zone": "Vault C — Frozen Food Pallet Hub", "Target Temp": "-22.0°C", "Actual Temp": "-21.8°C", "Sensor": "Wireless LoRaWAN", "Alarm State": "GREEN / NOMINAL"},
            {"Zone": "Bay 4 — Active Refrigerated Dock", "Target Temp": "+2.0°C", "Actual Temp": "+2.4°C", "Sensor": "Infrasound Curtain", "Alarm State": "GREEN / NOMINAL"},
        ]
    elif "hypercar" in t_lower or "motor" in t_lower or "aero" in t_lower or "chassis" in t_lower:
        rows = [
            {"Subsystem": "Front Left Axial-Flux Motor", "Torque": "550 N·m", "Inverter Temp": "48.2°C", "RPM": "14,200", "Status": "VECTORING NOMINAL"},
            {"Subsystem": "Front Right Axial-Flux Motor", "Torque": "550 N·m", "Inverter Temp": "49.0°C", "RPM": "14,200", "Status": "VECTORING NOMINAL"},
            {"Subsystem": "Rear Dual-Stator Core Motor", "Torque": "1,100 N·m", "Inverter Temp": "54.5°C", "RPM": "14,200", "Status": "TRACTION BALANCED"},
            {"Subsystem": "Shape-Memory Wing Flap Left", "Angle": "+4.5°", "Load": "420 kg", "Actuator Health": "100%", "Status": "MORPH LOCKED"},
        ]
    else:
        rows = [
            {"Identifier": f"NODE-{unit_id[-3:]}-01", "Channel": "Telemetry Channel α", "Status": "ACTIVE // ONLINE", "Sampling Rate": "500 Hz", "State": "NOMINAL"},
            {"Identifier": f"NODE-{unit_id[-3:]}-02", "Channel": "Subsystem Channel β", "Status": "ACTIVE // ONLINE", "Sampling Rate": "200 Hz", "State": "NOMINAL"},
            {"Identifier": f"NODE-{unit_id[-3:]}-03", "Channel": "Actuator Channel γ", "Status": "STANDBY // READY", "Sampling Rate": "100 Hz", "State": "NOMINAL"},
            {"Identifier": f"NODE-{unit_id[-3:]}-04", "Channel": "Enterprise Ledger Node", "Status": "VERIFIED // SEALED", "Sampling Rate": "1,000 Hz", "State": "SEALED"},
        ]
    return rows


def generate_table_section(tables, unit_id):
    """Generates the interactive table tabs and views."""
    if not tables:
        tables = ["telemetry_stream", "system_events", "actuator_ledger"]
    
    tabs_html = []
    contents_html = []
    
    for i, t in enumerate(tables):
        active_btn = "bg-slate-800 text-white border-zinc-700" if i == 0 else "bg-slate-950 text-slate-400 border-zinc-800 hover:text-white"
        active_content = "" if i == 0 else "hidden"
        tabs_html.append(f'''<button onclick="switchTableTab({i})" id="tab-btn-{i}" class="px-3 py-1.5 rounded-lg border font-mono text-xs font-semibold transition-all {active_btn}">{t}</button>''')
        
        rows = generate_table_rows(t, unit_id)
        cols = []
        for r in rows:
            for k in r.keys():
                if k not in cols:
                    cols.append(k)
        
        headers_html = "".join([f'''<th class="px-4 py-2 text-left font-mono text-xs font-semibold text-slate-300 border-b border-zinc-800">{c}</th>''' for c in cols])
        
        body_rows_html = []
        for r in rows:
            tds = "".join([f'''<td class="px-4 py-2 font-mono text-xs text-slate-300 border-b border-zinc-900/80 whitespace-nowrap">{r.get(c, "—")}</td>''' for c in cols])
            body_rows_html.append(f'''<tr class="hover:bg-slate-800/40 transition-colors">{tds}</tr>''')
        tbody_html = "".join(body_rows_html)
        
        contents_html.append(f'''
        <div id="tab-content-{i}" class="space-y-2 {active_content}">
          <div class="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
            <span>Relational Schema: <strong class="text-slate-200">{t}</strong></span>
            <span>RLS Policy: <span class="text-emerald-400">Authenticated Read</span></span>
          </div>
          <div class="overflow-x-auto rounded-xl border border-zinc-800 bg-slate-950/80">
            <table class="w-full text-left border-collapse">
              <thead><tr class="bg-slate-900/80">{headers_html}</tr></thead>
              <tbody>{tbody_html}</tbody>
            </table>
          </div>
        </div>
        ''')
        
    all_tabs = "\n".join(tabs_html)
    all_contents = "\n".join(contents_html)
    
    return f'''
    <!-- DOMAIN RELATIONAL SCHEMAS -->
    <div class="bg-slate-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <h2 class="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">Domain Telemetry Schemas</h2>
        </div>
        <div class="flex flex-wrap gap-2">
          {all_tabs}
        </div>
      </div>
      <div>
        {all_contents}
      </div>
    </div>
    '''


def generate_canvas_script(engine_type, accent_hex, secondary_hex):
    """Generates the animation script for the canvas depending on engine type."""
    if engine_type == "RADAR_TACTICAL":
        return f'''
        const canvas = document.getElementById('domainCanvas');
        const ctx = canvas.getContext('2d');
        let angle = 0;
        let targets = [
          {{ r: 85, theta: 0.8, color: '#f59e0b', label: 'BOGEY-01' }},
          {{ r: 140, theta: 2.4, color: '#ef4444', label: 'BOGEY-02' }},
          {{ r: 60, theta: 4.1, color: '{accent_hex}', label: 'RAPTOR-01' }},
          {{ r: 110, theta: 5.2, color: '{accent_hex}', label: 'VIPER-02' }}
        ];

        function resize() {{
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = 256;
        }}
        resize();
        window.addEventListener('resize', resize);

        function drawRadar() {{
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const maxR = Math.min(cx, cy) - 16;

          // Range rings
          ctx.lineWidth = 1;
          for (let i = 1; i <= 4; i++) {{
            ctx.strokeStyle = '{accent_hex}33';
            ctx.beginPath();
            ctx.arc(cx, cy, (maxR / 4) * i, 0, Math.PI * 2);
            ctx.stroke();
          }}

          // Crosshairs
          ctx.strokeStyle = '{accent_hex}44';
          ctx.beginPath();
          ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy);
          ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR);
          ctx.stroke();

          // Sweep beam
          angle += 0.035;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, maxR, angle - 0.4, angle);
          ctx.closePath();
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
          grad.addColorStop(0, '{accent_hex}00');
          grad.addColorStop(1, '{accent_hex}44');
          ctx.fillStyle = grad;
          ctx.fill();

          // Sweep edge
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
          ctx.strokeStyle = '{accent_hex}';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw targets
          targets.forEach(t => {{
            const tx = cx + Math.cos(t.theta) * (t.r / 160 * maxR);
            const ty = cy + Math.sin(t.theta) * (t.r / 160 * maxR);

            ctx.fillStyle = t.color;
            ctx.beginPath();
            ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.fillText(t.label, tx + 6, ty - 4);
          }});

          requestAnimationFrame(drawRadar);
        }}
        requestAnimationFrame(drawRadar);
        '''
    elif engine_type == "OPEN_PIT_MINING":
        return f'''
        const canvas = document.getElementById('domainCanvas');
        const ctx = canvas.getContext('2d');
        let t = 0;

        function resize() {{
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = 256;
        }}
        resize();
        window.addEventListener('resize', resize);

        function drawMining() {{
          ctx.fillStyle = '#060910';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const w = canvas.width;
          const h = canvas.height;

          // Open-pit contour benches
          for (let i = 1; i <= 6; i++) {{
            ctx.strokeStyle = '{accent_hex}' + (20 + i * 10).toString(16);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(w * 0.45, h * 0.52, (w * 0.35) * (i / 6), (h * 0.40) * (i / 6), 0, 0, Math.PI * 2);
            ctx.stroke();
          }}

          // Haul route spine
          ctx.strokeStyle = '{secondary_hex}88';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(w * 0.2, h * 0.8);
          ctx.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.85, h * 0.45);
          ctx.stroke();
          ctx.setLineDash([]);

          // Animated haul trucks along route
          t += 0.008;
          const trucks = [
            {{ frac: (t % 1), id: 'HT-401 (382t)' }},
            {{ frac: ((t + 0.35) % 1), id: 'HT-402 (312t)' }},
            {{ frac: ((t + 0.7) % 1), id: 'HT-404 (Empty)' }}
          ];

          trucks.forEach(tr => {{
            const p = tr.frac;
            const x = (1 - p)*(1 - p)*(w * 0.2) + 2*(1 - p)*p*(w * 0.5) + p*p*(w * 0.85);
            const y = (1 - p)*(1 - p)*(h * 0.8) + 2*(1 - p)*p*(w * 0.2) + p*p*(h * 0.45);

            ctx.fillStyle = '{accent_hex}';
            ctx.fillRect(x - 5, y - 4, 10, 8);

            ctx.fillStyle = '#f1f5f9';
            ctx.font = '10px monospace';
            ctx.fillText(tr.id, x + 8, y + 3);
          }});

          // Primary Crusher Station
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(w * 0.85 - 12, h * 0.45 - 12, 24, 24);
          ctx.fillStyle = '#f87171';
          ctx.font = '10px monospace';
          ctx.fillText('CRUSHER INFEED', w * 0.85 - 45, h * 0.45 + 24);

          requestAnimationFrame(drawMining);
        }}
        requestAnimationFrame(drawMining);
        '''
    elif engine_type == "BENTHIC_SUBSEA_SONAR":
        return f'''
        const canvas = document.getElementById('domainCanvas');
        const ctx = canvas.getContext('2d');
        let pingR = 0;

        function resize() {{
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = 256;
        }}
        resize();
        window.addEventListener('resize', resize);

        function drawSonar() {{
          const w = canvas.width;
          const h = canvas.height;

          // Ocean depth gradient
          const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
          oceanGrad.addColorStop(0, '#021024');
          oceanGrad.addColorStop(0.7, '#010814');
          oceanGrad.addColorStop(1, '#00040a');
          ctx.fillStyle = oceanGrad;
          ctx.fillRect(0, 0, w, h);

          // Grid lines & depth markers
          ctx.strokeStyle = '{accent_hex}22';
          ctx.lineWidth = 1;
          for (let y = 30; y < h - 40; y += 40) {{
            ctx.beginPath();
            ctx.moveTo(30, y);
            ctx.lineTo(w - 20, y);
            ctx.stroke();

            ctx.fillStyle = '{accent_hex}77';
            ctx.font = '10px monospace';
            const depth = Math.round(3800 + (y / h) * 600);
            ctx.fillText(depth + ' m', 5, y + 3);
          }}

          // Rugged seabed contour
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 20) {{
            const y = h - 35 + Math.sin(x * 0.04) * 8 + Math.cos(x * 0.08) * 4;
            ctx.lineTo(x, y);
          }}
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fillStyle = '#061727';
          ctx.fill();
          ctx.strokeStyle = '{accent_hex}';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Subsea Crawler location
          const cx = w * 0.52;
          const cy = h - 38;
          ctx.fillStyle = '{accent_hex}';
          ctx.fillRect(cx - 10, cy - 6, 20, 12);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '10px monospace';
          ctx.fillText('CRAWLER BC-09', cx - 35, cy - 12);

          // Umbilical cable to surface
          ctx.strokeStyle = '{secondary_hex}66';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, cy - 6);
          ctx.quadraticCurveTo(cx - 30, h * 0.4, cx - 15, 0);
          ctx.stroke();

          // Acoustic sonar ping ring
          pingR = (pingR + 1.2) % 120;
          ctx.beginPath();
          ctx.arc(cx, cy, pingR, Math.PI, 0);
          ctx.strokeStyle = '{accent_hex}' + Math.round(255 * (1 - pingR / 120)).toString(16).padStart(2, '0');
          ctx.stroke();

          requestAnimationFrame(drawSonar);
        }}
        requestAnimationFrame(drawSonar);
        '''
    elif engine_type == "TOKAMAK_PLASMA_FUSION":
        return f'''
        const canvas = document.getElementById('domainCanvas');
        const ctx = canvas.getContext('2d');
        let t = 0;

        function resize() {{
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = 256;
        }}
        resize();
        window.addEventListener('resize', resize);

        function drawPlasma() {{
          const w = canvas.width;
          const h = canvas.height;
          ctx.fillStyle = '#05030a';
          ctx.fillRect(0, 0, w, h);

          const cx = w / 2;
          const cy = h / 2;

          // D-shaped vacuum vessel outline
          ctx.strokeStyle = '{secondary_hex}55';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let a = 0; a <= Math.PI * 2; a += 0.05) {{
            const r = 90 * (1 - 0.25 * Math.sin(a));
            const x = cx + r * Math.cos(a) * 1.3;
            const y = cy + r * Math.sin(a) * 1.05;
            if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }}
          ctx.closePath();
          ctx.stroke();

          // Magnetic flux surfaces
          t += 0.03;
          for (let i = 1; i <= 5; i++) {{
            ctx.strokeStyle = '{accent_hex}' + (20 + i * 15).toString(16);
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let a = 0; a <= Math.PI * 2; a += 0.08) {{
              const r = (i * 14) * (1 - 0.2 * Math.sin(a));
              const x = cx + r * Math.cos(a) * 1.2;
              const y = cy + r * Math.sin(a) * 1.0;
              if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }}
            ctx.closePath();
            ctx.stroke();
          }}

          // Burning plasma core glow
          const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 45);
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.3, '{accent_hex}');
          coreGrad.addColorStop(1, '{accent_hex}00');
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, 45, 0, Math.PI * 2);
          ctx.fill();

          requestAnimationFrame(drawPlasma);
        }}
        requestAnimationFrame(drawPlasma);
        '''
    elif engine_type == "SUPERSONIC_SCHLIEREN":
        return f'''
        const canvas = document.getElementById('domainCanvas');
        const ctx = canvas.getContext('2d');
        let t = 0;

        function resize() {{
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = 256;
        }}
        resize();
        window.addEventListener('resize', resize);

        function drawSchlieren() {{
          const w = canvas.width;
          const h = canvas.height;
          ctx.fillStyle = '#08080f';
          ctx.fillRect(0, 0, w, h);

          const cx = w * 0.45;
          const cy = h / 2;

          // Supersonic test model wedge
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(cx - 30, cy);
          ctx.lineTo(cx + 60, cy - 25);
          ctx.lineTo(cx + 60, cy + 25);
          ctx.closePath();
          ctx.fill();

          // Oblique shockwaves
          t += 0.05;
          ctx.strokeStyle = '{accent_hex}';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx - 30, cy);
          ctx.lineTo(cx + 120, cy - 90);
          ctx.moveTo(cx - 30, cy);
          ctx.lineTo(cx + 120, cy + 90);
          ctx.stroke();

          // Expansion fan lines
          ctx.strokeStyle = '{secondary_hex}66';
          ctx.lineWidth = 1;
          for (let i = 0; i < 6; i++) {{
            ctx.beginPath();
            ctx.moveTo(cx + 60, cy - 25);
            ctx.lineTo(w, cy - 25 - i * 14);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx + 60, cy + 25);
            ctx.lineTo(w, cy + 25 + i * 14);
            ctx.stroke();
          }}

          // Schlieren flow streamers
          for (let j = 0; j < 8; j++) {{
            const y = 30 + j * 26;
            const offset = (t * 8 + j * 20) % 40;
            ctx.strokeStyle = '{accent_hex}22';
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
          }}

          requestAnimationFrame(drawSchlieren);
        }}
        requestAnimationFrame(drawSchlieren);
        '''
    else:
        # Default high-density orbital/constellation or network canvas
        return f'''
        const canvas = document.getElementById('domainCanvas');
        const ctx = canvas.getContext('2d');
        let t = 0;

        function resize() {{
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = 256;
        }}
        resize();
        window.addEventListener('resize', resize);

        function drawConstellation() {{
          const w = canvas.width;
          const h = canvas.height;
          ctx.fillStyle = '#060910';
          ctx.fillRect(0, 0, w, h);

          // Grid coordinates
          ctx.strokeStyle = '{accent_hex}15';
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 40) {{
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
          }}
          for (let y = 0; y < h; y += 40) {{
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
          }}

          t += 0.02;
          const nodes = [
            {{ x: w * 0.2, y: h * 0.35 + Math.sin(t) * 12, id: 'NODE-01' }},
            {{ x: w * 0.45, y: h * 0.65 + Math.cos(t) * 10, id: 'NODE-02' }},
            {{ x: w * 0.7, y: h * 0.30 + Math.sin(t + 1) * 14, id: 'NODE-03' }},
            {{ x: w * 0.85, y: h * 0.70 + Math.cos(t + 2) * 8, id: 'NODE-04' }},
          ];

          // Laser cross links
          ctx.strokeStyle = '{accent_hex}';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(nodes[0].x, nodes[0].y);
          ctx.lineTo(nodes[1].x, nodes[1].y);
          ctx.lineTo(nodes[2].x, nodes[2].y);
          ctx.lineTo(nodes[3].x, nodes[3].y);
          ctx.stroke();

          // Nodes
          nodes.forEach(n => {{
            ctx.fillStyle = '{accent_hex}';
            ctx.beginPath();
            ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e2e8f0';
            ctx.font = '10px monospace';
            ctx.fillText(n.id, n.x + 8, n.y - 4);
          }});

          requestAnimationFrame(drawConstellation);
        }}
        requestAnimationFrame(drawConstellation);
        '''


def build_app_html(slot, unit_id, name, cat, profile, tables):
    """Constructs the complete, pristine domain application."""
    metrics = profile["metrics"]
    actuators = profile["actuators"]
    default_logs = profile["default_logs"]
    sub_channels = profile["sub_channels"]
    canvas_title = profile["canvas_title"]
    accent_hex = profile["accent_hex"]
    secondary_hex = profile["secondary_hex"]
    theme = profile["theme_color"]
    engine_type = profile["engine_type"]

    # 4 metrics cards
    metrics_cards_html = []
    for label, val, subtext, color in metrics:
        metrics_cards_html.append(f'''
        <div class="bg-slate-900/60 border border-zinc-800 rounded-xl p-4 space-y-1">
          <span class="text-xs text-slate-400 block font-mono">{label}</span>
          <strong class="text-2xl font-bold text-{color}-400 font-mono tracking-tight">{val}</strong>
          <span class="text-[11px] text-slate-500 block font-mono">{subtext}</span>
        </div>
        ''')
    metrics_grid_html = "\n".join(metrics_cards_html)

    # Sub channels below canvas
    channels_html = []
    for ch_title, ch_val, ch_col in sub_channels:
        channels_html.append(f'''
        <div class="bg-slate-950 p-2.5 rounded-lg border border-zinc-800">
          <span class="text-slate-400 block">{ch_title}</span>
          <strong class="text-{ch_col}-400 text-sm font-bold">{ch_val}</strong>
        </div>
        ''')
    sub_channels_grid = "\n".join(channels_html)

    # Actuator buttons
    actuator_btns_html = []
    for btn_title, fn_call, btn_class in actuators:
        actuator_btns_html.append(f'''
        <button onclick="{fn_call}" class="w-full py-2.5 px-4 rounded-xl {btn_class} border border-white/10 font-mono text-xs transition-all cursor-pointer shadow-md active:scale-95 text-center">
          {btn_title}
        </button>
        ''')
    actuators_panel_html = "\n".join(actuator_btns_html)

    # Initial logs
    logs_html = []
    for log_msg, log_col in default_logs:
        logs_html.append(f'''<div class="{log_col}">{log_msg}</div>''')
    initial_logs_html = "\n".join(logs_html)

    # Tables section
    table_section_html = generate_table_section(tables, unit_id)

    # Canvas script
    canvas_js = generate_canvas_script(engine_type, accent_hex, secondary_hex)

    return f'''<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{unit_id} | {name} — Track 2 Flagship Console</title>
  <meta name="description" content="{name} — {cat}. Ghost FactoryOS Track 2 Flagship Telemetry Core." />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: "Plus Jakarta Sans", sans-serif; background-color: #060910; color: #f1f5f9; }}
    .font-mono {{ font-family: "JetBrains Mono", monospace; }}
  </style>
</head>
<body class="min-h-screen flex flex-col bg-[#060910] text-slate-100 selection:bg-emerald-500 selection:text-black">
  <!-- TOP TELEMETRY STRIP -->
  <header class="border-b border-zinc-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      <div class="flex items-center gap-3">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span class="text-zinc-400">NODE:</span>
        <span class="text-cyan-300 font-bold tracking-wider">{unit_id}</span>
        <span class="text-zinc-600">|</span>
        <span class="px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-500/30 font-semibold">
          TRACK 2 // FLAGSHIP TIER-1
        </span>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-zinc-400 hidden sm:inline">STATE: <strong class="text-emerald-400 font-bold">NOMINAL_PEAK</strong></span>
        <span class="text-zinc-400 hidden sm:inline">FREQ: <strong class="text-cyan-300 font-bold">1,000 Hz</strong></span>
        <button onclick="openExportModal()" class="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer">
          <span>Export Enterprise Spec</span> &rarr;
        </button>
      </div>
    </div>
  </header>

  <!-- MAIN SCADA HUD VIEWPORT -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
    <!-- HERO TITLE CARD -->
    <div class="bg-gradient-to-r from-zinc-950 via-slate-900 to-black border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-mono text-xs font-bold">
              {unit_id} // {cat}
            </span>
            <span class="px-2.5 py-1 rounded-full bg-amber-400 text-black font-mono text-xs font-black uppercase">
              [SIMULATED DATA PROTOTYPE]
            </span>
          </div>
          <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">{name}</h1>
          <p class="text-slate-400 text-sm max-w-2xl">{cat} — Ghost FactoryOS High-Integrity Production Reference Architecture.</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <button onclick="logEvent('[DIAG] Deep-system health diagnostic executed.', 'text-cyan-400')" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition-all border border-zinc-700">
            Run Subsystem Audit
          </button>
        </div>
      </div>
    </div>

    <!-- 4-METRIC TELEMETRY GRID -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
      {metrics_grid_html}
    </div>

    <!-- INTERACTIVE DOMAIN COCKPIT & ACTUATOR MATRIX -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Visual Display (2 cols) -->
      <div class="lg:col-span-2 bg-slate-900/70 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <h2 class="text-base font-bold text-slate-200 font-mono">{canvas_title}</h2>
          </div>
          <span class="text-xs font-mono text-slate-400">Viewport: Real-Time Render</span>
        </div>
        <canvas id="domainCanvas" class="w-full h-64 rounded-xl bg-slate-950 border border-zinc-800/80"></canvas>
        <div class="grid grid-cols-3 gap-3 text-center text-xs font-mono pt-2">
          {sub_channels_grid}
        </div>
      </div>

      <!-- Actuator Control Toggles & Stream Log (1 col) -->
      <div class="bg-slate-900/70 border border-zinc-800 rounded-2xl p-6 space-y-4 flex flex-col">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 class="text-base font-bold text-slate-200 font-mono">Subsystem Operations Log</h2>
          <span class="text-xs text-emerald-400 font-mono">ACTIVE_STREAM</span>
        </div>
        <div id="logTerminal" class="flex-1 bg-slate-950 rounded-xl p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1.5 border border-zinc-800/80 max-h-56">
          {initial_logs_html}
        </div>
        <div class="space-y-2 pt-2 border-t border-zinc-800/80">
          <span class="text-xs font-mono text-slate-400 block font-semibold">Specialized Domain Actuators</span>
          <div class="grid grid-cols-1 gap-2">
            {actuators_panel_html}
          </div>
        </div>
      </div>
    </div>

    {table_section_html}

    <!-- ARCHITECTURAL CLEARANCE FOOTER -->
    <div class="bg-slate-900/40 border border-zinc-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
      <div>
        <strong>Jurisdiction:</strong> Enterprise Architecture Clearance · <strong>NIST SP 800-218:</strong> Aligned
      </div>
      <div>
        GhostFactoryOS Fleet Track 2 · Prototype Simulation
      </div>
    </div>
  </main>

  <!-- EXPORT MODAL -->
  <div id="exportModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center hidden p-4">
    <div class="bg-slate-900 border border-zinc-700 rounded-2xl max-w-xl w-full p-6 space-y-4 font-mono text-xs">
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <strong class="text-sm text-white">ENTERPRISE ASSET SPECIFICATION — {unit_id}</strong>
        <button onclick="closeExportModal()" class="text-slate-400 hover:text-white">&times;</button>
      </div>
      <div class="bg-slate-950 p-4 rounded-xl border border-zinc-800 overflow-y-auto max-h-64 text-slate-300 space-y-1">
        <div>"unit_id": "{unit_id}",</div>
        <div>"name": "{name}",</div>
        <div>"category": "{cat}",</div>
        <div>"track": "Track 2 Flagship Tier-1",</div>
        <div>"jurisdiction": "Enterprise Architecture Clearance",</div>
        <div>"compliance": "NIST SP 800-218 SSDF v1.1",</div>
        <div>"status": "Clickable Interactive Prototype // Simulated Data Only"</div>
      </div>
      <div class="flex justify-end gap-3 pt-2">
        <button onclick="closeExportModal()" class="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700">Close</button>
      </div>
    </div>
  </div>

  <script>
    function logEvent(msg, colorClass = 'text-slate-300') {{
      const term = document.getElementById('logTerminal');
      const div = document.createElement('div');
      div.className = colorClass;
      div.textContent = msg;
      term.appendChild(div);
      term.scrollTop = term.scrollHeight;
    }}

    function switchTableTab(idx) {{
      const totalTabs = {len(tables) if tables else 3};
      for (let i = 0; i < totalTabs; i++) {{
        const btn = document.getElementById('tab-btn-' + i);
        const content = document.getElementById('tab-content-' + i);
        if (btn && content) {{
          if (i === idx) {{
            btn.className = 'px-3 py-1.5 rounded-lg border font-mono text-xs font-semibold transition-all bg-slate-800 text-white border-zinc-700';
            content.classList.remove('hidden');
          }} else {{
            btn.className = 'px-3 py-1.5 rounded-lg border font-mono text-xs font-semibold transition-all bg-slate-950 text-slate-400 border-zinc-800 hover:text-white';
            content.classList.add('hidden');
          }}
        }}
      }}
    }}

    function openExportModal() {{
      document.getElementById('exportModal').classList.remove('hidden');
    }}

    function closeExportModal() {{
      document.getElementById('exportModal').classList.add('hidden');
    }}

    // Actuator function handlers
    function scrambleInterceptors() {{ logEvent('[ACTUATOR] Air interceptor squad scrambled into perimeter vector.', 'text-emerald-400'); }}
    function engageJamming() {{ logEvent('[ACTUATOR] High-power RF directional jamming engaged on 2.4/5.8 GHz.', 'text-cyan-400'); }}
    function launchKineticNet() {{ logEvent('[ACTUATOR] Kinetic capture net authorized. Deploying countermeasures.', 'text-amber-400'); }}
    function emergencyRecall() {{ logEvent('[ACTUATOR] Emergency RTB recall beacon active. Interceptors returning to hub.', 'text-rose-400'); }}
    
    function dispatchNextTruck() {{ logEvent('[DISPATCH] Haul Truck HT-405 dispatched to Shovel Face North.', 'text-amber-400'); }}
    function rerouteInfeed() {{ logEvent('[DISPATCH] Infeed route diverted to Secondary Crushing Surge Bin B.', 'text-cyan-400'); }}
    function toggleSpeedRestrictor() {{ logEvent('[DISPATCH] Pit haulage ramp speed restrictor toggled: 25 km/h enforced.', 'text-purple-400'); }}
    function emergencyPitHalt() {{ logEvent('[ALERT] Emergency Pit Halt triggered. All autonomous haul units holding brakes.', 'text-rose-400'); }}
    
    function engageSuction() {{ logEvent('[ACTUATOR] Slurry suction dredge head pump active at 318 bar.', 'text-cyan-400'); }}
    function purgeHydraulics() {{ logEvent('[ACTUATOR] Benthic hydraulic line purge executed with zero pressure drop.', 'text-blue-400'); }}
    function triggerSonarPing() {{ logEvent('[ACTUATOR] Multibeam high-frequency sonar ping transmitted across seabed.', 'text-emerald-400'); }}
    function umbilicalRelease() {{ logEvent('[SAFETY] Umbilical emergency quick-disconnect sequence armed.', 'text-rose-400'); }}

    function dispatchFuel() {{ logEvent('[RAMP] Fuel bowser truck #3 dispatched with 2,400 gal Jet-A.', 'text-sky-400'); }}
    function assignStand() {{ logEvent('[RAMP] Apron Stand 5 assigned to inbound Global 7500.', 'text-emerald-400'); }}
    function requestDeice() {{ logEvent('[RAMP] Mobile de-icing boom unit staged on north taxiway.', 'text-cyan-400'); }}
    function rampEmergencyHold() {{ logEvent('[RAMP] Ground movement emergency hold active.', 'text-rose-400'); }}

    function startPumpover() {{ logEvent('[WINERY] Fermentation pumpover cycle started on Tank 01 (30 min).', 'text-rose-400'); }}
    function chillGlycol() {{ logEvent('[WINERY] Glycol jacket valve opened; chilling tank to 18 C.', 'text-cyan-400'); }}
    function logHydrometer() {{ logEvent('[WINERY] Hydrometer specific gravity logged at 1.092 (Brix 24.2).', 'text-amber-400'); }}
    function purgeNitrogen() {{ logEvent('[WINERY] Tank ullage headspace purged with 99.9% food-grade nitrogen.', 'text-slate-300'); }}

    function randomizePatient() {{ logEvent('[EDC] Subject #842 randomized into Clinical Trial Arm A.', 'text-teal-400'); }}
    function lockDataset() {{ logEvent('[EDC] Cohort database lock milestone signed via cryptographic token.', 'text-emerald-400'); }}
    function triggerDsmb() {{ logEvent('[EDC] Data Safety Monitoring Board telemetry export generated.', 'text-cyan-400'); }}
    function flagSafetyDev() {{ logEvent('[SAFETY] Minor protocol deviation logged and routed to principal investigator.', 'text-rose-400'); }}

    function triggerDefrost() {{ logEvent('[COLD] Ultra-low temperature vault hot-gas defrost cycle scheduled.', 'text-blue-400'); }}
    function boostChiller() {{ logEvent('[COLD] Ammonia refrigeration compressor output boosted to 85% capacity.', 'text-cyan-400'); }}
    function sealDock() {{ logEvent('[COLD] Loading Dock Gate 7 inflatable thermal seal verified.', 'text-emerald-400'); }}
    function alarmThermalExcursion() {{ logEvent('[ALARM] Diagnostic thermal alarm simulated; all backup chillers verified.', 'text-rose-400'); }}

    function throttleAerospike() {{ logEvent('[PROPULSION] Linear aerospike throttle adjusted to 95% chamber pressure.', 'text-orange-400'); }}
    function adjustCowl() {{ logEvent('[PROPULSION] Variable expansion cowl ratio trimmed for Mach 2.4 cruising.', 'text-amber-400'); }}
    function igniteRamjet() {{ logEvent('[PROPULSION] Supersonic turboramjet transition sequence completed.', 'text-rose-400'); }}
    function dumpPropellant() {{ logEvent('[PROPULSION] Emergency propellant dump lines tested and pressurized.', 'text-red-400'); }}

    function injectPellet() {{ logEvent('[FUSION] Cryogenic deuterium-tritium pellet injected into plasma core.', 'text-violet-400'); }}
    function pulseIcrf() {{ logEvent('[FUSION] 20 MW Ion Cyclotron Radio Frequency heating pulse fired.', 'text-rose-400'); }}
    function engageDivertor() {{ logEvent('[FUSION] Poloidal magnetic divertor sweeping pattern activated.', 'text-cyan-400'); }}
    function emergencyQuench() {{ logEvent('[SAFETY] Superconducting magnet quench protection system verified.', 'text-red-400'); }}

    function engageJetters() {{ logEvent('[ROV] High-pressure subsea jet trenching nozzles active at 45 bar.', 'text-cyan-400'); }}
    function deploySword() {{ logEvent('[ROV] Depressor sword lowered to 2.85 meters depth of cover.', 'text-blue-400'); }}
    function pingCableTracker() {{ logEvent('[ROV] Tone generator acoustic pulse localized fiber cable axis.', 'text-emerald-400'); }}
    function surfaceAbort() {{ logEvent('[ROV] Trenching aborted; thrusters holding ROV altitude 5m off seafloor.', 'text-rose-400'); }}

    function regulateBypass() {{ logEvent('[GEOTHERMAL] Wellhead steam bypass valve trimmed to maintain 28.4 MPa.', 'text-amber-400'); }}
    function adjustReinjection() {{ logEvent('[GEOTHERMAL] Subsurface reinjection pump rate increased to 240 kg/s.', 'text-blue-400'); }}
    function runSeismicScan() {{ logEvent('[GEOTHERMAL] Borehole geophone array scan completed with zero micro-seismic events.', 'text-purple-400'); }}
    function emergencyBlowoutCut() {{ logEvent('[SAFETY] Hydraulic annular blowout preventer ram interlocks verified.', 'text-red-400'); }}

    function switchLaserHop() {{ logEvent('[HFT] Microwave relay diverted to backup optical laser hop at Tower 08.', 'text-emerald-400'); }}
    function flushFpgaQueue() {{ logEvent('[HFT] FPGA hardware execution FIFO queue flushed in 12 nanoseconds.', 'text-cyan-400'); }}
    function calibratePtp() {{ logEvent('[HFT] IEEE 1588 Precision Time Protocol clock synchronized with atomic standard.', 'text-purple-400'); }}
    function emergencyKillSwitch() {{ logEvent('[RISK] Automated trading kill switch engaged. All open orders cancelled.', 'text-rose-400'); }}

    function fireArcHeater() {{ logEvent('[TUNNEL] Arc heater chamber ignited; nitrogen stagnation temp 2,450 K.', 'text-rose-400'); }}
    function actuatePitch() {{ logEvent('[TUNNEL] 6-DOF balance actuated to +4.5 deg angle of attack.', 'text-amber-400'); }}
    function captureSchlieren() {{ logEvent('[TUNNEL] High-speed laser Schlieren imaging frame captured at 200,000 fps.', 'text-cyan-400'); }}
    function tunnelScram() {{ logEvent('[SAFETY] Wind tunnel emergency scram valve fired; vacuum chamber isolated.', 'text-red-400'); }}

    function dispatchCarrier() {{ logEvent('[CONCIERGE] Enclosed climate transporter T-05 dispatched for hypercar delivery.', 'text-amber-400'); }}
    function runBatteryDiag() {{ logEvent('[CONCIERGE] 48 vehicle battery float conditioners reporting 100% nominal state.', 'text-emerald-400'); }}
    function sealAirBarrier() {{ logEvent('[CONCIERGE] High-pressure air curtain active at Vault Tier-1 entryway.', 'text-slate-300'); }}
    function vaultLockdown() {{ logEvent('[SECURITY] Vault biometric perimeter placed into high-alert lockdown.', 'text-rose-400'); }}

    function fixCharter() {{ logEvent('[CHARTER] Fixture terms locked for 180k DWT Capesize hull voyage.', 'text-sky-400'); }}
    function optimizeRoute() {{ logEvent('[CHARTER] Weather routing updated: avoiding North Pacific storm system.', 'text-emerald-400'); }}
    function hedgeBunker() {{ logEvent('[CHARTER] VLSFO bunker fuel swap contract executed for Q4 voyages.', 'text-amber-400'); }}
    function issueNor() {{ logEvent('[CHARTER] Notice of Readiness tendered at arrival port anchorage.', 'text-purple-400'); }}

    // Fallback general triggers
    function triggerActuator1() {{ logEvent('[ACTUATOR] Primary operational actuator engaged with zero error.', 'text-emerald-400'); }}
    function calibrateDomainSensor() {{ logEvent('[SENSOR] Precision calibration pulse completed across domain instrumentation.', 'text-cyan-400'); }}
    function executeDiagnostic() {{ logEvent('[DIAG] Subsystem health verification cycle returned 100% pass.', 'text-purple-400'); }}
    function emergencyOverride() {{ logEvent('[SAFETY] Operational interlock holding safe state.', 'text-rose-400'); }}

    {canvas_js}
  </script>
</body>
</html>
'''


# MAIN GENERATION LOOP ACROSS SLOTS 86 TO 137
def run():
    print("Beginning generation across all Track 2 units (Slots #086 to #137)...")
    
    DEST_DIRS = [
        "tools/ghost-factory-console/public/demos",
        "catalog/track-2",
        "public/demos"
    ]
    
    processed_count = 0
    
    for slot in range(86, 138):
        unit_id = f"gf-t2-{slot:03d}"
        inv_item = INV_MAP.get(slot, {})
        name = inv_item.get("name", f"Track 2 Unit {slot}")
        cat = inv_item.get("category", "Enterprise SCADA Console")
        tables = inv_item.get("tables", [])
        profile = DOMAIN_PROFILES.get(slot, DOMAIN_PROFILES[86])
        
        # Build pristine HTML
        html_content = build_app_html(slot, unit_id.upper(), name, cat, profile, tables)
        
        # Verify ZERO banned strings
        for banned in ["Real-Time State Telemetry Waveform", "Inject State Calibration Event", "Connect to Live Render Node"]:
            if banned in html_content:
                raise ValueError(f"CRITICAL ERROR: Banned string '{banned}' detected in {unit_id}!")
                
        # Verify ZERO dollar signs
        if "$" in html_content:
            raise ValueError(f"CRITICAL ERROR: Dollar sign '$' detected in {unit_id}!")
            
        # Write to all 3 destination directories
        for base_dir in DEST_DIRS:
            out_dir = os.path.join(base_dir, unit_id)
            os.makedirs(out_dir, exist_ok=True)
            out_file = os.path.join(out_dir, "index.html")
            with open(out_file, "w", encoding="utf-8") as fp:
                fp.write(html_content)
                
        processed_count += 1
        print(f"[{processed_count:02d}/52] Successfully deployed authentic app: {unit_id.upper()} — {name} ({profile['engine_type']})")

    # Special handling for Slot 089: Copy authentic compiled dist assets if present
    fbo_dist_assets = "catalog/engines/gf-unit-089-aviation-fbo-dispatch-os/dist/assets"
    if os.path.exists(fbo_dist_assets):
        print("Copying compiled static assets for gf-t2-089...")
        for base_dir in DEST_DIRS:
            dest_assets = os.path.join(base_dir, "gf-t2-089", "assets")
            os.makedirs(dest_assets, exist_ok=True)
            for item in os.listdir(fbo_dist_assets):
                s = os.path.join(fbo_dist_assets, item)
                d = os.path.join(dest_assets, item)
                if os.path.isfile(s):
                    shutil.copy2(s, d)
        print("gf-t2-089 compiled assets synced.")

    print(f"COMPLETE! Successfully built and deployed all {processed_count} authentic Track 2 applications.")

if __name__ == "__main__":
    run()
