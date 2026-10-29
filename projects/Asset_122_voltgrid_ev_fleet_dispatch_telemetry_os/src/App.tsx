/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Battery,
  BatteryCharging,
  BatteryWarning,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  ExternalLink,
  Eye,
  FastForward,
  Flame,
  Gauge,
  Info,
  Layers,
  Lock,
  MapPin,
  Maximize2,
  Navigation,
  Pause,
  Play,
  Power,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Server,
  ShieldAlert,
  Sparkles,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Truck,
  Unplug,
  Wrench,
  X,
  Zap,
  ZapOff,
  Sliders,
  ChevronRight,
  Download,
  Copy,
  FileText,
  Check
} from 'lucide-react';

// Type Definitions
export type VehicleStatus = 'in_transit' | 'charging' | 'idle' | 'warning' | 'rerouted';
export type BayStatus = 'charging' | 'standby' | 'maintenance' | 'offline';

export interface Waypoint {
  id: string;
  name: string;
  address: string;
  parcels: number;
  completed: boolean;
  eta: string;
}

export interface Vehicle {
  id: string;
  vin: string;
  callsign: string;
  model: string;
  driver: string;
  driverCallsign: string;
  status: VehicleStatus;
  corridor: string;
  soc: number; // 0 - 100%
  batteryKwh: number;
  rangeMi: number;
  speedMph: number;
  routeProgress: number; // 0 - 100%
  parcelCapacityPct: number;
  parcelsTotal: number;
  parcelsRemaining: number;
  lat: number;
  lng: number;
  headingDeg: number;
  tempMotorC: number;
  tempPackC: number;
  cellVoltages: number[]; // 16 cells (e.g. 4.12 to 4.18V)
  tirePsi: [number, number, number, number]; // FL, FR, RL, RR
  waypoints: Waypoint[];
  alertMessage?: string;
}

export interface ChargingBay {
  id: string;
  bayNumber: string;
  bayName: string;
  status: BayStatus;
  maxOutputKw: number;
  currentKw: number;
  vehicleVin: string | null;
  vehicleCallsign: string | null;
  soc: number;
  targetSoc: number;
  thermalsC: number;
  timeToFullMin: number;
  isBoosted: boolean;
  isSurgeThrottled: boolean;
}

// Initial Mock Data
const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'V-101',
    vin: '1FTFW1ED4NFC92011',
    callsign: 'CYBERHAUL-01',
    model: 'FreightVolt TransMax 400',
    driver: 'Jaxson Chen',
    driverCallsign: 'VORTEX-1',
    status: 'in_transit',
    corridor: 'I-880 Freight Corridor',
    soc: 68,
    batteryKwh: 120,
    rangeMi: 148,
    speedMph: 54,
    routeProgress: 42,
    parcelCapacityPct: 84,
    parcelsTotal: 62,
    parcelsRemaining: 36,
    lat: 37.7612,
    lng: -122.2134,
    headingDeg: 142,
    tempMotorC: 62,
    tempPackC: 29.4,
    cellVoltages: [4.14, 4.15, 4.14, 4.13, 4.15, 4.16, 4.14, 4.15, 4.14, 4.13, 4.14, 4.15, 4.15, 4.14, 4.13, 4.15],
    tirePsi: [42, 42, 45, 45],
    waypoints: [
      { id: 'WP-1', name: 'Oakland Intermodal Depot', address: '1490 7th St', parcels: 20, completed: true, eta: 'Done' },
      { id: 'WP-2', name: 'San Leandro Micro-Hub', address: '2200 Marina Blvd', parcels: 16, completed: false, eta: '12m' },
      { id: 'WP-3', name: 'Hayward Logistics Park', address: '28000 Industrial Pkwy', parcels: 26, completed: false, eta: '38m' }
    ]
  },
  {
    id: 'V-102',
    vin: '1FTFW1ED7NFC83204',
    callsign: 'URBANVAN-02',
    model: 'VoltCourier CityLite 250',
    driver: 'Elena Rostova',
    driverCallsign: 'PHANTOM-2',
    status: 'in_transit',
    corridor: 'Downtown Central Loop',
    soc: 31,
    batteryKwh: 85,
    rangeMi: 65,
    speedMph: 28,
    routeProgress: 78,
    parcelCapacityPct: 92,
    parcelsTotal: 88,
    parcelsRemaining: 18,
    lat: 37.7845,
    lng: -122.4089,
    headingDeg: 310,
    tempMotorC: 58,
    tempPackC: 31.2,
    cellVoltages: [3.82, 3.84, 3.83, 3.82, 3.83, 3.84, 3.82, 3.83, 3.81, 3.82, 3.83, 3.82, 3.84, 3.83, 3.82, 3.83],
    tirePsi: [39, 39, 41, 41],
    waypoints: [
      { id: 'WP-1', name: 'Financial District Parcel Hub', address: '450 California St', parcels: 35, completed: true, eta: 'Done' },
      { id: 'WP-2', name: 'Civic Center Dispatch Locker', address: '100 Van Ness Ave', parcels: 35, completed: true, eta: 'Done' },
      { id: 'WP-3', name: 'SOMA Tech Campus Box', address: '650 Townsend St', parcels: 18, completed: false, eta: '8m' }
    ]
  },
  {
    id: 'V-103',
    vin: '1FTFW1ED9NFC19042',
    callsign: 'APEXCARGO-03',
    model: 'HeavyGrid Class 7 Hauler',
    driver: 'Marcus Kane',
    driverCallsign: 'IRONCLAD-3',
    status: 'in_transit',
    corridor: 'Port Terminals Alpha',
    soc: 82,
    batteryKwh: 220,
    rangeMi: 188,
    speedMph: 42,
    routeProgress: 24,
    parcelCapacityPct: 45,
    parcelsTotal: 34,
    parcelsRemaining: 26,
    lat: 37.7981,
    lng: -122.2891,
    headingDeg: 215,
    tempMotorC: 54,
    tempPackC: 28.1,
    cellVoltages: [4.21, 4.22, 4.21, 4.20, 4.21, 4.22, 4.21, 4.21, 4.22, 4.21, 4.20, 4.21, 4.22, 4.21, 4.21, 4.22],
    tirePsi: [105, 105, 110, 110],
    waypoints: [
      { id: 'WP-1', name: 'Pier 52 Container Staging', address: 'Port Way Slip 4', parcels: 8, completed: true, eta: 'Done' },
      { id: 'WP-2', name: 'Alameda Gateway Warehousing', address: '2150 Mariner Sq', parcels: 12, completed: false, eta: '18m' },
      { id: 'WP-3', name: 'Middle Harbor Terminal', address: '1199 Middle Harbor Rd', parcels: 14, completed: false, eta: '45m' }
    ]
  },
  {
    id: 'V-104',
    vin: '1FTFW1ED1NFC67412',
    callsign: 'VOLTHAUL-04',
    model: 'VoltCourier CityLite 250',
    driver: 'Tariq Al-Mansoor',
    driverCallsign: 'ATLAS-4',
    status: 'warning',
    corridor: 'North Industrial Belt',
    soc: 11, // Low battery trigger target
    batteryKwh: 85,
    rangeMi: 24,
    speedMph: 47,
    routeProgress: 88,
    parcelCapacityPct: 76,
    parcelsTotal: 54,
    parcelsRemaining: 8,
    lat: 37.8341,
    lng: -122.2912,
    headingDeg: 45,
    tempMotorC: 69,
    tempPackC: 35.8,
    cellVoltages: [3.48, 3.49, 3.46, 3.48, 3.47, 3.48, 3.45, 3.49, 3.46, 3.47, 3.48, 3.47, 3.46, 3.48, 3.47, 3.48],
    tirePsi: [38, 38, 40, 40],
    alertMessage: 'CRITICAL BATTERY: 11% SoC remaining. Immediate reroute advised.',
    waypoints: [
      { id: 'WP-1', name: 'Emeryville Biotech Campus', address: '5858 Horton St', parcels: 22, completed: true, eta: 'Done' },
      { id: 'WP-2', name: 'Berkeley West Distribution', address: '1000 Heinz Ave', parcels: 24, completed: true, eta: 'Done' },
      { id: 'WP-3', name: 'Albany Commercial Bay', address: '1250 San Pablo Ave', parcels: 8, completed: false, eta: '14m' }
    ]
  },
  {
    id: 'V-105',
    vin: '1FTFW1ED6NFC55198',
    callsign: 'COURIERE-05',
    model: 'FreightVolt TransMax 400',
    driver: 'Sarah Lindqvist',
    driverCallsign: 'FALCON-5',
    status: 'in_transit',
    corridor: 'Silicon Express West',
    soc: 59,
    batteryKwh: 120,
    rangeMi: 124,
    speedMph: 62,
    routeProgress: 52,
    parcelCapacityPct: 88,
    parcelsTotal: 70,
    parcelsRemaining: 32,
    lat: 37.6432,
    lng: -122.4111,
    headingDeg: 165,
    tempMotorC: 64,
    tempPackC: 30.1,
    cellVoltages: [4.02, 4.03, 4.02, 4.01, 4.02, 4.03, 4.02, 4.02, 4.03, 4.01, 4.02, 4.03, 4.02, 4.02, 4.01, 4.02],
    tirePsi: [41, 41, 44, 44],
    waypoints: [
      { id: 'WP-1', name: 'SFO Air Freight Gate 4', address: 'Cargo Rd Bldg 600', parcels: 38, completed: true, eta: 'Done' },
      { id: 'WP-2', name: 'Burlingame Tech Park', address: '1600 Rollins Rd', parcels: 14, completed: false, eta: '10m' },
      { id: 'WP-3', name: 'San Mateo Commercial Hub', address: '3000 Campus Dr', parcels: 18, completed: false, eta: '32m' }
    ]
  },
  {
    id: 'V-106',
    vin: '1FTFW1ED3NFC77103',
    callsign: 'TITANFREIGHT-06',
    model: 'HeavyGrid Class 7 Hauler',
    driver: 'Devon Vance',
    driverCallsign: 'TITAN-6',
    status: 'in_transit',
    corridor: 'Bay Bridge Arterial',
    soc: 47,
    batteryKwh: 220,
    rangeMi: 95,
    speedMph: 38,
    routeProgress: 64,
    parcelCapacityPct: 60,
    parcelsTotal: 40,
    parcelsRemaining: 16,
    lat: 37.8012,
    lng: -122.3688,
    headingDeg: 260,
    tempMotorC: 67,
    tempPackC: 32.5,
    cellVoltages: [3.94, 3.95, 3.93, 3.94, 3.95, 3.94, 3.93, 3.95, 3.94, 3.93, 3.94, 3.95, 3.94, 3.93, 3.95, 3.94],
    tirePsi: [108, 108, 112, 112],
    waypoints: [
      { id: 'WP-1', name: 'Treasure Island Logistics Staging', address: 'Ave of the Palms', parcels: 10, completed: true, eta: 'Done' },
      { id: 'WP-2', name: 'SF Pier 27 Freight Terminal', address: 'The Embarcadero', parcels: 14, completed: true, eta: 'Done' },
      { id: 'WP-3', name: 'Rincon Hill Micro-Distribution', address: '333 Fremont St', parcels: 16, completed: false, eta: '15m' }
    ]
  },
  {
    id: 'V-107',
    vin: '1FTFW1ED8NFC22091',
    callsign: 'METROVAN-07',
    model: 'VoltCourier CityLite 250',
    driver: 'Chloe Nguyen',
    driverCallsign: 'SPECTER-7',
    status: 'in_transit',
    corridor: 'South Metro Ring',
    soc: 74,
    batteryKwh: 85,
    rangeMi: 160,
    speedMph: 46,
    routeProgress: 35,
    parcelCapacityPct: 95,
    parcelsTotal: 96,
    parcelsRemaining: 60,
    lat: 37.7121,
    lng: -122.4502,
    headingDeg: 195,
    tempMotorC: 56,
    tempPackC: 27.8,
    cellVoltages: [4.16, 4.17, 4.16, 4.15, 4.16, 4.17, 4.16, 4.16, 4.17, 4.15, 4.16, 4.17, 4.16, 4.16, 4.15, 4.16],
    tirePsi: [40, 40, 42, 42],
    waypoints: [
      { id: 'WP-1', name: 'Daly City Transit Center', address: '500 John Daly Blvd', parcels: 36, completed: true, eta: 'Done' },
      { id: 'WP-2', name: 'Pacifica Coastal Drop', address: '1200 Oceana Blvd', parcels: 24, completed: false, eta: '20m' },
      { id: 'WP-3', name: 'San Bruno Freight Locker', address: '1150 El Camino Real', parcels: 36, completed: false, eta: '48m' }
    ]
  },
  {
    id: 'V-108',
    vin: '1FTFW1ED2NFC44980',
    callsign: 'CARGOMAX-08',
    model: 'FreightVolt TransMax 400',
    driver: 'Roland Bishop',
    driverCallsign: 'VIPER-8',
    status: 'in_transit',
    corridor: 'Airport Cargo Way',
    soc: 52,
    batteryKwh: 120,
    rangeMi: 112,
    speedMph: 58,
    routeProgress: 60,
    parcelCapacityPct: 34,
    parcelsTotal: 44,
    parcelsRemaining: 18,
    lat: 37.6214,
    lng: -122.3789,
    headingDeg: 110,
    tempMotorC: 61,
    tempPackC: 29.8,
    cellVoltages: [3.98, 3.99, 3.98, 3.97, 3.98, 3.99, 3.98, 3.98, 3.99, 3.97, 3.98, 3.99, 3.98, 3.98, 3.97, 3.98],
    tirePsi: [42, 42, 45, 45],
    waypoints: [
      { id: 'WP-1', name: 'North Cargo Facility Hangar 3', address: 'SFO Cargo Rd', parcels: 26, completed: true, eta: 'Done' },
      { id: 'WP-2', name: 'Millbrae Logistics Staging', address: '200 Rollins Rd', parcels: 18, completed: false, eta: '12m' }
    ]
  }
];

const INITIAL_BAYS: ChargingBay[] = [
  {
    id: 'BAY-01',
    bayNumber: '01',
    bayName: 'DCFC-ALPHA-150',
    status: 'charging',
    maxOutputKw: 150,
    currentKw: 142,
    vehicleVin: '1FTFW1ED5NFC99112',
    vehicleCallsign: 'THUNDERVAN-09',
    soc: 74,
    targetSoc: 95,
    thermalsC: 38.4,
    timeToFullMin: 18,
    isBoosted: false,
    isSurgeThrottled: false
  },
  {
    id: 'BAY-02',
    bayNumber: '02',
    bayName: 'DCFC-ULTRA-350',
    status: 'charging',
    maxOutputKw: 350,
    currentKw: 344,
    vehicleVin: '1FTFW1ED0NFC33120',
    vehicleCallsign: 'AEROHAUL-10',
    soc: 83,
    targetSoc: 90,
    thermalsC: 44.1,
    timeToFullMin: 9,
    isBoosted: true,
    isSurgeThrottled: false
  },
  {
    id: 'BAY-03',
    bayNumber: '03',
    bayName: 'DCFC-RAPID-150',
    status: 'standby',
    maxOutputKw: 150,
    currentKw: 0,
    vehicleVin: null,
    vehicleCallsign: null,
    soc: 0,
    targetSoc: 90,
    thermalsC: 22.0,
    timeToFullMin: 0,
    isBoosted: false,
    isSurgeThrottled: false
  },
  {
    id: 'BAY-04',
    bayNumber: '04',
    bayName: 'DCFC-HYPER-350',
    status: 'charging',
    maxOutputKw: 350,
    currentKw: 150,
    vehicleVin: '1FTFW1ED8NFC88401',
    vehicleCallsign: 'FREIGHT-E-11',
    soc: 61,
    targetSoc: 85,
    thermalsC: 36.5,
    timeToFullMin: 24,
    isBoosted: false,
    isSurgeThrottled: false
  },
  {
    id: 'BAY-05',
    bayNumber: '05',
    bayName: 'DCFC-MEGABAY-350',
    status: 'maintenance',
    maxOutputKw: 350,
    currentKw: 0,
    vehicleVin: null,
    vehicleCallsign: null,
    soc: 0,
    targetSoc: 90,
    thermalsC: 19.8,
    timeToFullMin: 0,
    isBoosted: false,
    isSurgeThrottled: false
  },
  {
    id: 'BAY-06',
    bayNumber: '06',
    bayName: 'DCFC-FLEX-150',
    status: 'standby',
    maxOutputKw: 150,
    currentKw: 0,
    vehicleVin: null,
    vehicleCallsign: null,
    soc: 0,
    targetSoc: 90,
    thermalsC: 21.5,
    timeToFullMin: 0,
    isBoosted: false,
    isSurgeThrottled: false
  }
];

// Helper: Compute deterministic SVG map coordinates (viewBox 0 0 900 520) for NorCal Metro Corridors
export function getVehicleMapCoordinates(veh: Vehicle): { x: number; y: number } {
  const p = (veh.routeProgress % 100) / 100;
  switch (veh.id) {
    case 'V-101': { // I-880 Freight Corridor (Oakland -> San Leandro -> Hayward -> Fremont)
      const t = p;
      const x = (1 - t) ** 2 * 450 + 2 * (1 - t) * t * 555 + t ** 2 * 665;
      const y = (1 - t) ** 2 * 205 + 2 * (1 - t) * t * 315 + t ** 2 * 440;
      return { x: Math.round(x), y: Math.round(y) };
    }
    case 'V-102': { // Downtown Central Loop (SF Financial & Civic Center)
      const angle = p * 2 * Math.PI;
      const x = 180 + Math.cos(angle) * 54;
      const y = 195 + Math.sin(angle) * 45;
      return { x: Math.round(x), y: Math.round(y) };
    }
    case 'V-103': { // Port Terminals Alpha (Oakland Harbor / Middle Harbor)
      const t = p;
      const x = (1 - t) ** 2 * 450 + 2 * (1 - t) * t * 330 + t ** 2 * 390;
      const y = (1 - t) ** 2 * 205 + 2 * (1 - t) * t * 260 + t ** 2 * 225;
      return { x: Math.round(x), y: Math.round(y) };
    }
    case 'V-104': { // North Industrial Belt (Emeryville -> Berkeley -> Richmond)
      const t = p;
      const x = 450 - t * 30;
      const y = 205 - t * 160;
      return { x: Math.round(x), y: Math.round(y) };
    }
    case 'V-105': { // Silicon Express West (Peninsula 101 corridor southward)
      const t = p;
      const x = (1 - t) ** 2 * 215 + 2 * (1 - t) * t * 340 + t ** 2 * 490;
      const y = (1 - t) ** 2 * 360 + 2 * (1 - t) * t * 420 + t ** 2 * 460;
      return { x: Math.round(x), y: Math.round(y) };
    }
    case 'V-106': { // Bay Bridge Arterial (SF Embarcadero -> Treasure Island -> Depot HQ)
      const t = p;
      const x = (1 - t) ** 2 * 180 + 2 * (1 - t) * t * 305 + t ** 2 * 450;
      const y = (1 - t) ** 2 * 195 + 2 * (1 - t) * t * 180 + t ** 2 * 205;
      return { x: Math.round(x), y: Math.round(y) };
    }
    case 'V-107': { // South Metro Ring (SF -> Daly City -> Pacifica coastal ring)
      const t = p;
      const x = (1 - t) ** 2 * 170 + 2 * (1 - t) * t * 240 + t ** 2 * 335;
      const y = (1 - t) ** 2 * 230 + 2 * (1 - t) * t * 315 + t ** 2 * 325;
      return { x: Math.round(x), y: Math.round(y) };
    }
    case 'V-108': { // Airport Cargo Way (SF -> SFO International Cargo Center)
      const t = p;
      const x = (1 - t) ** 2 * 180 + 2 * (1 - t) * t * 195 + t ** 2 * 215;
      const y = (1 - t) ** 2 * 195 + 2 * (1 - t) * t * 280 + t ** 2 * 360;
      return { x: Math.round(x), y: Math.round(y) };
    }
    default:
      return { x: 450, y: 205 };
  }
}

export default function EVFleetDashboard() {
  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [bays, setBays] = useState<ChargingBay[]>(INITIAL_BAYS);
  const [currentTimeUtc, setCurrentTimeUtc] = useState<string>('');
  
  // Tactical HUD Controls
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<1 | 2>(1);
  const [fastChargeThrottleActive, setFastChargeThrottleActive] = useState<boolean>(false);
  const [peakGridSurgeActive, setPeakGridSurgeActive] = useState<boolean>(false);
  const [surgeDepartureDelayMin, setSurgeDepartureDelayMin] = useState<number>(0);
  const [vectorViewMode, setVectorViewMode] = useState<'map' | 'cards'>('map');
  const [mapRadarScan, setMapRadarScan] = useState<boolean>(true);
  
  // Filtering & Selection
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_transit' | 'warning' | 'rerouted'>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('V-101');
  
  // Modals & Drawers
  const [inspectVehicle, setInspectVehicle] = useState<Vehicle | null>(null);
  const [rerouteVehicle, setRerouteVehicle] = useState<Vehicle | null>(null);
  const [showStorefrontModal, setShowStorefrontModal] = useState<boolean>(false);
  const [showLowBatteryAlertBanner, setShowLowBatteryAlertBanner] = useState<boolean>(true);
  const [notificationToast, setNotificationToast] = useState<{ title: string; desc: string; type: 'info' | 'warn' | 'success' } | null>(null);
  const [copiedCodeSnippet, setCopiedCodeSnippet] = useState<boolean>(false);

  // UTC Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeUtc(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Toast auto-clear
  useEffect(() => {
    if (notificationToast) {
      const timer = setTimeout(() => setNotificationToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notificationToast]);

  // Main Simulation State Loop
  useEffect(() => {
    if (!isSimRunning) return;

    const intervalMs = simSpeed === 1 ? 1500 : 750;
    const interval = setInterval(() => {
      // 1. Update Transit Vehicles
      setVehicles(prevVehicles =>
        prevVehicles.map(veh => {
          if (veh.status === 'in_transit' || veh.status === 'warning' || veh.status === 'rerouted') {
            // Drain SoC slowly
            const drainRate = 0.08 * (veh.speedMph / 45);
            const newSoc = Math.max(2, +(veh.soc - drainRate).toFixed(2));
            const newRange = Math.max(4, Math.round(newSoc * 2.2));
            
            // Advance route progress
            let nextProgress = +(veh.routeProgress + 0.35 * (veh.speedMph / 40)).toFixed(1);
            if (nextProgress > 100) nextProgress = 5; // loop

            // Fluctuate speed slightly
            const speedDelta = Math.floor(Math.random() * 5) - 2;
            const newSpeed = Math.min(68, Math.max(22, veh.speedMph + speedDelta));

            // GPS jitter along corridor vector
            const latDelta = (Math.random() - 0.5) * 0.0006;
            const lngDelta = (Math.random() - 0.5) * 0.0006;

            // Inverter / Motor temp dynamic
            const tempMotorDelta = (Math.random() - 0.48) * 0.5;
            const newMotorTemp = +(veh.tempMotorC + tempMotorDelta).toFixed(1);

            // Warning state if SoC drops below 15%
            const isWarning = newSoc <= 14;

            return {
              ...veh,
              soc: newSoc,
              rangeMi: newRange,
              speedMph: newSpeed,
              routeProgress: nextProgress,
              lat: +(veh.lat + latDelta).toFixed(6),
              lng: +(veh.lng + lngDelta).toFixed(6),
              tempMotorC: newMotorTemp,
              status: isWarning ? 'warning' : veh.status === 'warning' ? 'in_transit' : veh.status,
              alertMessage: isWarning ? `BATTERY CRITICAL: ${newSoc}% SoC. Auto-reroute requested.` : veh.alertMessage
            };
          }
          return veh;
        })
      );

      // 2. Update Charging Bays
      setBays(prevBays =>
        prevBays.map(bay => {
          if (bay.status === 'charging') {
            // Factor throttle and peak surge into currentKw
            let targetPower = bay.isBoosted ? 345 : 145;
            if (fastChargeThrottleActive) targetPower *= 0.5; // Depot throttle cuts by 50%
            if (peakGridSurgeActive) targetPower *= 0.6; // Peak surge cuts by 40%
            
            const currentKw = Math.round(targetPower + (Math.random() * 6 - 3));
            
            // Charge SoC
            const socGain = (currentKw / 350) * 0.45;
            const newSoc = Math.min(bay.targetSoc, +(bay.soc + socGain).toFixed(2));
            
            // Decrement time to full
            const newTimeToFull = Math.max(1, Math.round((bay.targetSoc - newSoc) * (350 / currentKw) * 0.7));

            // Thermals respond to power
            const thermalTarget = bay.isBoosted ? 43 : 36;
            const thermalDrift = (thermalTarget - bay.thermalsC) * 0.05 + (Math.random() * 0.4 - 0.2);
            const newThermals = +(bay.thermalsC + thermalDrift).toFixed(1);

            return {
              ...bay,
              currentKw,
              soc: newSoc,
              timeToFullMin: newTimeToFull,
              thermalsC: newThermals,
              isSurgeThrottled: peakGridSurgeActive
            };
          }
          return {
            ...bay,
            isSurgeThrottled: peakGridSurgeActive
          };
        })
      );
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isSimRunning, simSpeed, fastChargeThrottleActive, peakGridSurgeActive]);

  // Aggregate HUD Computations
  const totalGridPowerKw = useMemo(() => {
    const bayTotal = bays.reduce((acc, b) => acc + (b.status === 'charging' ? b.currentKw : 0), 0);
    const depotBaseloadKw = 48; // Building HVAC, telemetry uplinks, cooling chillers
    return bayTotal + depotBaseloadKw;
  }, [bays]);

  const fleetReadinessPct = useMemo(() => {
    const totalVehicles = vehicles.length;
    const readyCount = vehicles.filter(v => v.soc >= 25).length;
    return Math.round((readyCount / totalVehicles) * 100);
  }, [vehicles]);

  const activeChargingCount = useMemo(() => {
    return bays.filter(b => b.status === 'charging').length;
  }, [bays]);

  // Handler: Simulate Peak Grid Surge
  const handleTogglePeakSurge = useCallback(() => {
    setPeakGridSurgeActive(prev => {
      const next = !prev;
      if (next) {
        setSurgeDepartureDelayMin(22);
        setNotificationToast({
          title: 'GRID SURGE DETECTED: 40% Curtailment Enacted',
          desc: 'Regional ISO triggered demand-response event. Depot fast-charge throughput throttled; vehicle departures delayed by ~22 mins.',
          type: 'warn'
        });
      } else {
        setSurgeDepartureDelayMin(0);
        setNotificationToast({
          title: 'Grid Surge Normalcy Restored',
          desc: 'High-voltage grid connection stabilized. Full charging throughput unlocked across all active bays.',
          type: 'success'
        });
      }
      return next;
    });
  }, []);

  // Handler: Low Battery Trigger
  const handleTriggerLowBattery = useCallback(() => {
    // Pick a transit vehicle that isn't already critically low
    const eligible = vehicles.filter(v => v.soc > 20);
    if (eligible.length === 0) return;
    const target = eligible[Math.floor(Math.random() * eligible.length)];

    setVehicles(prev =>
      prev.map(v =>
        v.id === target.id
          ? {
              ...v,
              soc: 9.4,
              rangeMi: 18,
              status: 'warning',
              alertMessage: `AUTOMATED SOS: Cell group 04 dropped to 9.4% SoC under heavy grade load. Immediate divert requested.`
            }
          : v
      )
    );
    setSelectedVehicleId(target.id);
    setShowLowBatteryAlertBanner(true);
    setNotificationToast({
      title: `EMERGENCY ALERT: ${target.callsign} at 9.4% SoC`,
      desc: `Critical depletion detected on corridor ${target.corridor}. Reroute prompt generated.`,
      type: 'warn'
    });
  }, [vehicles]);

  // Handler: Boost Bay to 350kW
  const handleBoostBay = useCallback((bayId: string) => {
    setBays(prev =>
      prev.map(b => {
        if (b.id === bayId && b.status === 'charging') {
          const nextBoost = !b.isBoosted;
          return {
            ...b,
            isBoosted: nextBoost,
            maxOutputKw: 350,
            currentKw: nextBoost ? 348 : 145,
            thermalsC: nextBoost ? +(b.thermalsC + 3.2).toFixed(1) : +(b.thermalsC - 2.5).toFixed(1),
            timeToFullMin: nextBoost ? Math.max(3, Math.round(b.timeToFullMin * 0.55)) : b.timeToFullMin * 2
          };
        }
        return b;
      })
    );
    setNotificationToast({
      title: 'Bay Output Boost Adjusted',
      desc: 'Liquid-cooled charging cables engaged. Dynamic thermals and wattage profile ramped.',
      type: 'info'
    });
  }, []);

  // Handler: Release Cable
  const handleReleaseCable = useCallback((bayId: string) => {
    setBays(prev =>
      prev.map(b => {
        if (b.id === bayId) {
          return {
            ...b,
            status: 'standby',
            currentKw: 0,
            vehicleVin: null,
            vehicleCallsign: null,
            soc: 0,
            timeToFullMin: 0,
            isBoosted: false
          };
        }
        return b;
      })
    );
    setNotificationToast({
      title: 'Bay Cable Disengaged Safely',
      desc: 'Locking pin released. Station shifted to Standby readiness with active cable cooling.',
      type: 'success'
    });
  }, []);

  // Handler: Confirm Reroute
  const handleConfirmReroute = useCallback((targetBayNumber: string) => {
    if (!rerouteVehicle) return;

    setVehicles(prev =>
      prev.map(v =>
        v.id === rerouteVehicle.id
          ? {
              ...v,
              status: 'rerouted',
              corridor: `Diverting to VoltGrid Depot Bay ${targetBayNumber}`,
              alertMessage: `REROUTE IN PROGRESS: Dispatch cleared for priority docking at Bay ${targetBayNumber}. ETA: 8m.`
            }
          : v
      )
    );

    setNotificationToast({
      title: `Reroute Transmitted to ${rerouteVehicle.callsign}`,
      desc: `In-cab telemetry updated. Fleet telematics cleared route with 8 min ETA to Bay ${targetBayNumber}.`,
      type: 'success'
    });

    setRerouteVehicle(null);
  }, [rerouteVehicle]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesSearch =
        v.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.driverCallsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.corridor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vin.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'in_transit') return v.status === 'in_transit';
      if (statusFilter === 'warning') return v.status === 'warning';
      if (statusFilter === 'rerouted') return v.status === 'rerouted';
      return true;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const currentSelectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  const criticalVehicle = useMemo(() => {
    return vehicles.find(v => v.status === 'warning' || v.soc < 15);
  }, [vehicles]);

  return (
    <>
      <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 antialiased overflow-x-hidden flex flex-col justify-between">
        {/* Subtle Ambient Scanline Grid Glow */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.06),rgba(255,255,255,0))] z-0" />

        {/* ========================================================================= */}
        {/* TOP HUD BANNER (Pane 1) */}
        {/* ========================================================================= */}
        <header className="relative z-10 border-b border-slate-800/80 bg-[#0F172A]/90 backdrop-blur-md px-4 py-2.5 lg:px-6">
          <div className="max-w-[1920px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* Brand / Hub Identifier */}
            <div className="flex items-center gap-3.5 w-full lg:w-auto justify-between lg:justify-start">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-11 h-11 rounded-lg border border-emerald-500/40 bg-emerald-950/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                  <Zap className="w-6 h-6 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B0F17]" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-black tracking-wider uppercase text-white font-mono flex items-center gap-2.5">
                      VoltGrid Fleet HQ
                      <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40">
                        METRO WEST
                      </span>
                    </h1>
                  </div>
                  <p className="text-xs text-slate-400 font-mono tracking-tight flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                    TACTICAL AUTONOMOUS LOGISTICS &amp; CHARGING HUB
                  </p>
                </div>
              </div>

              {/* Mobile Time Badge */}
              <div className="lg:hidden text-sm font-mono font-bold text-cyan-400 bg-slate-900/90 px-3 py-1.5 rounded border border-slate-800">
                {currentTimeUtc.slice(11, 19)}
              </div>
            </div>

            {/* Center Operational Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
              {/* UTC Master Clock */}
              <div className="hidden sm:flex flex-col px-4 py-2.5 rounded-lg bg-[#111827] border border-slate-800/90 shadow-sm">
                <span className="text-sm text-slate-400 font-mono flex items-center gap-1.5 uppercase tracking-wider font-bold">
                  <Clock className="w-4 h-4 text-cyan-400" /> UTC Synced
                </span>
                <span className="text-base font-mono font-bold text-cyan-300 mt-1">
                  {currentTimeUtc ? currentTimeUtc.slice(11, 19) : '--:--:--'}
                </span>
              </div>

              {/* Fleet Readiness */}
              <div className="flex flex-col px-4 py-2.5 rounded-lg bg-[#111827] border border-slate-800/90 shadow-sm">
                <span className="text-sm text-slate-400 font-mono flex items-center gap-1.5 uppercase tracking-wider font-bold">
                  <Gauge className="w-4 h-4 text-emerald-400" /> Fleet Readiness
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono font-extrabold text-emerald-300">
                    {fleetReadinessPct}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-semibold">
                    ({vehicles.filter(v => v.soc >= 25).length}/8 Ready)
                  </span>
                </div>
              </div>

              {/* Grid Power Draw */}
              <div className="flex flex-col px-4 py-2.5 rounded-lg bg-[#111827] border border-slate-800/90 shadow-sm">
                <span className="text-sm text-slate-400 font-mono flex items-center gap-1.5 uppercase tracking-wider font-bold">
                  <Cpu className="w-4 h-4 text-amber-400" /> Grid Load
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-2xl font-mono font-extrabold ${totalGridPowerKw > 800 ? 'text-amber-300' : 'text-cyan-300'}`}>
                    {totalGridPowerKw} kW
                  </span>
                  <span className="text-xs text-slate-400 font-mono font-semibold">
                    /{fastChargeThrottleActive ? '600' : '1,200'} kW
                  </span>
                </div>
              </div>

              {/* Depot Active Bays */}
              <div className="flex flex-col px-4 py-2.5 rounded-lg bg-[#111827] border border-slate-800/90 shadow-sm">
                <span className="text-sm text-slate-400 font-mono flex items-center gap-1.5 uppercase tracking-wider font-bold">
                  <BatteryCharging className="w-4 h-4 text-emerald-400" /> Active Chargers
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-mono font-extrabold text-white">
                    {activeChargingCount}/6 Bays
                  </span>
                  {peakGridSurgeActive && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-950/90 text-amber-400 border border-amber-500/50 rounded">
                      SURGE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Unified Command Switchboard */}
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0B0F17]/90 border border-slate-800/90 shadow-[inset_0_1px_4px_rgba(0,0,0,0.7)] flex-wrap w-full lg:w-auto justify-end">
              <div className="px-2.5 py-1 text-xs font-mono uppercase tracking-wider text-slate-400 font-bold border-r border-slate-800/80 hidden xl:flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>COMMAND SWITCHBOARD</span>
              </div>

              {/* Emergency Depot Fast-Charge Throttle Switch */}
              <button
                onClick={() => {
                  setFastChargeThrottleActive(prev => !prev);
                  setNotificationToast({
                    title: !fastChargeThrottleActive ? 'Depot Throttle ENGAGED' : 'Depot Throttle DISENGAGED',
                    desc: !fastChargeThrottleActive
                      ? 'Depot total power capped at 50% max output to protect local substation.'
                      : 'Depot fast charging power restored to full 100% rated headroom.',
                    type: !fastChargeThrottleActive ? 'warn' : 'info'
                  });
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-mono font-bold transition-all border ${
                  fastChargeThrottleActive
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/70 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-amber-500/50 hover:text-amber-200'
                }`}
                title="Depot Fast-Charge Throttle: Enforces strict load-shedding limit on DC fast chargers"
              >
                <span className={`w-2 h-2 rounded-full ${fastChargeThrottleActive ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
                {fastChargeThrottleActive ? <ZapOff className="w-4 h-4 text-amber-400" /> : <Power className="w-4 h-4 text-slate-400" />}
                <span>THROTTLE: {fastChargeThrottleActive ? 'CLAMP 50%' : 'OFF'}</span>
              </button>

              {/* Simulate Peak Grid Surge Button */}
              <button
                onClick={handleTogglePeakSurge}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-mono font-bold transition-all border ${
                  peakGridSurgeActive
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/70 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-rose-500/50 hover:text-rose-200'
                }`}
                title="Simulate Peak Grid Surge: Curtails depot speeds by 40% and triggers amber warning badges on bays"
              >
                <span className={`w-2 h-2 rounded-full ${peakGridSurgeActive ? 'bg-rose-400 animate-ping' : 'bg-slate-600'}`} />
                <Flame className={`w-4 h-4 ${peakGridSurgeActive ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
                <span>{peakGridSurgeActive ? 'SURGE ACTIVE (-40%)' : 'PEAK SURGE SIM'}</span>
              </button>

              {/* Low Battery Alert Button */}
              <button
                onClick={handleTriggerLowBattery}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm font-mono font-bold bg-slate-900/90 text-slate-300 border border-slate-800 hover:border-amber-500 hover:text-amber-300 transition-all"
                title="Low Battery Alert: Drops random vehicle below 12% SoC to test emergency rerouting"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                <BatteryWarning className="w-4 h-4 text-amber-400" />
                <span>LOW BATT SIM</span>
              </button>

              {/* Sim Play/Pause & Speed */}
              <div className="flex items-center rounded border border-slate-800 bg-slate-950 overflow-hidden">
                <button
                  onClick={() => setIsSimRunning(prev => !prev)}
                  className="px-2.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  title={isSimRunning ? 'Pause State Loop' : 'Resume State Loop'}
                >
                  {isSimRunning ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <button
                  onClick={() => setSimSpeed(prev => (prev === 1 ? 2 : 1))}
                  className="px-2.5 py-2 text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition border-l border-slate-800"
                  title="Toggle Simulation Speed (1x / 2x)"
                >
                  {simSpeed}X
                </button>
              </div>

              {/* Aura & Grid Blueprint Storefront Documentation Button */}
              <button
                onClick={() => setShowStorefrontModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm font-mono font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 transition shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">STOREFRONT SPEC</span>
                <span className="sm:hidden">DOCS</span>
              </button>
            </div>
          </div>

          {/* Emergency Alert Bar (Low Battery / Surge Notice) */}
          {showLowBatteryAlertBanner && criticalVehicle && (
            <div className="max-w-[1920px] mx-auto mt-2.5 p-3 rounded-lg bg-amber-950/60 border border-amber-500/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-mono text-amber-200">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
                <span className="text-sm font-semibold">
                  <strong className="text-amber-300 font-bold">TELEMETRY WARNING:</strong> {criticalVehicle.callsign} ({criticalVehicle.driver}) reports {criticalVehicle.soc}% SoC along {criticalVehicle.corridor}.
                </span>
                {peakGridSurgeActive && (
                  <span className="text-rose-300 font-bold ml-2">
                    [GRID SURGE: All bay departures delayed +{surgeDepartureDelayMin}m]
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setRerouteVehicle(criticalVehicle)}
                  className="px-3 py-2 rounded bg-amber-500 text-black font-bold hover:bg-amber-400 transition flex items-center gap-1.5 text-sm"
                >
                  <Navigation className="w-4 h-4" /> Auto Reroute
                </button>
                <button
                  onClick={() => setInspectVehicle(criticalVehicle)}
                  className="px-3 py-2 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition text-sm font-bold"
                >
                  Inspect Cells
                </button>
                <button
                  onClick={() => setShowLowBatteryAlertBanner(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </header>

        {/* ========================================================================= */}
        {/* MAIN 4-PANE OPERATIONAL WORKSPACE */}
        {/* ========================================================================= */}
        <main className="relative z-10 flex-1 max-w-[1920px] w-full mx-auto p-3 lg:p-5 flex flex-col gap-4">
          {/* TOP SPLIT: Center-Left Telemetry Map / Grid & Center-Right Depot Charging Matrix */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1">
            {/* --------------------------------------------------------------------- */}
            {/* PANE 2: Center-Left Telemetry Map / Vector Grid (7 cols) */}
            {/* --------------------------------------------------------------------- */}
            <section className="xl:col-span-7 flex flex-col rounded-lg border border-slate-800/80 bg-[#0F172A]/70 backdrop-blur-sm overflow-hidden shadow-xl">
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/70">
                <div className="flex items-center gap-2.5">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-slate-200">
                    Live Telemetry Vector Grid (8 Active Commercial Assets)
                  </h2>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Legend */}
                  <div className="hidden md:flex items-center gap-3.5 text-xs font-mono text-slate-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> &gt;50%
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 20-50%
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> &lt;20%
                    </span>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded border border-slate-800 bg-slate-950 p-1 text-xs font-mono">
                    <button
                      onClick={() => setVectorViewMode('map')}
                      className={`px-3 py-1.5 rounded transition font-bold uppercase ${
                        vectorViewMode === 'map'
                          ? 'bg-cyan-500 text-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Vector Radar Map
                    </button>
                    <button
                      onClick={() => setVectorViewMode('cards')}
                      className={`px-3 py-1.5 rounded transition font-bold uppercase ${
                        vectorViewMode === 'cards'
                          ? 'bg-cyan-500 text-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Asset Cards
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-header Metadata Bar (No Collisions) */}
              <div className="bg-[#080D15] border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2.5 text-sm font-mono tracking-wider text-slate-200">
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                  <span className="text-white font-bold">ZONE: NORCAL_SUB_01</span>
                  <span className="text-slate-600 font-bold">•</span>
                  <span className="text-cyan-300 font-semibold">LAT 37.761°N</span>
                  <span className="text-slate-600 font-bold">•</span>
                  <span className="text-cyan-300 font-semibold">LON -122.213°W</span>
                  <span className="text-slate-600 font-bold">•</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
                    UPLINK: 5G SA CAN-BUS (99.8% RX)
                  </span>
                  <span className="text-slate-600 font-bold">•</span>
                  <span className="text-slate-300">ELEV: 14M</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMapRadarScan(prev => !prev)}
                    className={`px-3 py-1 rounded text-sm font-bold font-mono transition border ${
                      mapRadarScan
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    RADAR SWEEP: {mapRadarScan ? 'ACTIVE' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Vector Grid Visual Canvas */}
              <div className="relative flex-1 min-h-[440px] bg-[#070B11] p-3 flex flex-col justify-between overflow-hidden">
                {/* Tactical HUD Coordinate Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)] pointer-events-none" />

                {/* VIEW 1: INTERACTIVE 2D SVG VECTOR MAP */}
                {vectorViewMode === 'map' ? (
                  <div className="relative z-10 flex-1 flex flex-col justify-between">
                    <div className="relative w-full h-[360px] sm:h-[400px] lg:h-[430px] rounded border border-slate-800/80 bg-[#05080E] overflow-hidden">
                      <svg
                        viewBox="0 0 900 500"
                        className="w-full h-full select-none"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <defs>
                          {/* Radial Glows */}
                          <radialGradient id="depotPulseGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient id="vehicleFocusGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                          </radialGradient>
                          <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Latitude & Longitude Tactical Reference Guides */}
                        <g stroke="#1E293B" strokeWidth="0.75" strokeDasharray="3 4" opacity="0.6">
                          <line x1="80" y1="100" x2="820" y2="100" />
                          <line x1="80" y1="205" x2="820" y2="205" />
                          <line x1="80" y1="310" x2="820" y2="310" />
                          <line x1="80" y1="420" x2="820" y2="420" />
                          <line x1="180" y1="40" x2="180" y2="460" />
                          <line x1="330" y1="40" x2="330" y2="460" />
                          <line x1="450" y1="40" x2="450" y2="460" />
                          <line x1="600" y1="40" x2="600" y2="460" />
                          <line x1="750" y1="40" x2="750" y2="460" />
                        </g>

                        {/* San Francisco Bay Body of Water (Tactical Coastal Contours) */}
                        <path
                          d="M 60 500 L 120 280 Q 150 140 280 60 L 400 40 L 415 150 Q 375 200 290 220 Q 230 250 260 350 Q 300 430 350 500 Z"
                          fill="#061220"
                          stroke="#0e2a44"
                          strokeWidth="1.5"
                          opacity="0.85"
                        />
                        <text x="270" y="270" fill="#1e3a5f" fontSize="13" fontFamily="monospace" fontWeight="bold" letterSpacing="3">
                          SAN FRANCISCO BAY
                        </text>

                        {/* Pacific Coastline Label */}
                        <text x="60" y="220" fill="#1e293b" fontSize="10" fontFamily="monospace" letterSpacing="2">
                          PACIFIC OCEAN (OFFSHORE)
                        </text>

                        {/* Radar Sweep Line Animation */}
                        {mapRadarScan && (
                          <g transform="translate(450, 205)">
                            <circle r="220" fill="none" stroke="#10b981" strokeWidth="0.75" strokeDasharray="4 6" opacity="0.2" />
                            <circle r="140" fill="none" stroke="#10b981" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.25" />
                            <line x1="0" y1="0" x2="220" y2="0" stroke="#10b981" strokeWidth="1.5" opacity="0.4">
                              <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from="0"
                                to="360"
                                dur="6s"
                                repeatCount="indefinite"
                              />
                            </line>
                          </g>
                        )}

                        {/* ======================================================= */}
                        {/* URBAN CORRIDORS VECTOR TRACKS */}
                        {/* ======================================================= */}
                        {/* 1. Bay Bridge Arterial (SF Embarcadero -> Depot HQ) */}
                        <path
                          d="M 180 195 Q 305 175 450 205"
                          stroke="#38BDF8"
                          strokeWidth="3.5"
                          strokeDasharray="6 3"
                          fill="none"
                          opacity="0.85"
                        />
                        <text x="245" y="168" fill="#38BDF8" fontSize="12" fontFamily="monospace" fontWeight="bold">
                          BAY BRIDGE ARTERIAL (I-80)
                        </text>

                        {/* 2. I-880 Freight Corridor */}
                        <path
                          d="M 450 205 Q 555 315 665 440"
                          stroke="#06B6D4"
                          strokeWidth="4"
                          fill="none"
                          opacity="0.9"
                        />
                        <text x="560" y="360" fill="#06B6D4" fontSize="12" fontFamily="monospace" fontWeight="bold">
                          I-880 COMMERCE SPINE
                        </text>

                        {/* 3. Downtown Central Loop */}
                        <ellipse
                          cx="180"
                          cy="195"
                          rx="54"
                          ry="45"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                          fill="none"
                          opacity="0.8"
                        />
                        <text x="120" y="138" fill="#10B981" fontSize="12" fontFamily="monospace" fontWeight="bold">
                          DOWNTOWN SF LOOP
                        </text>

                        {/* 4. Airport Cargo Way */}
                        <path
                          d="M 180 195 Q 195 280 215 360"
                          stroke="#F59E0B"
                          strokeWidth="3"
                          fill="none"
                          opacity="0.8"
                        />
                        <text x="115" y="320" fill="#F59E0B" fontSize="12" fontFamily="monospace" fontWeight="bold">
                          AIRPORT CARGO WAY
                        </text>

                        {/* 5. Silicon Express West */}
                        <path
                          d="M 215 360 Q 340 420 490 460"
                          stroke="#818CF8"
                          strokeWidth="3"
                          fill="none"
                          opacity="0.8"
                        />
                        <text x="320" y="445" fill="#818CF8" fontSize="12" fontFamily="monospace" fontWeight="bold">
                          SILICON EXPRESS 101
                        </text>

                        {/* 6. North Industrial Belt */}
                        <path
                          d="M 450 205 Q 438 120 420 45"
                          stroke="#34D399"
                          strokeWidth="3"
                          fill="none"
                          opacity="0.8"
                        />
                        <text x="445" y="100" fill="#34D399" fontSize="12" fontFamily="monospace" fontWeight="bold">
                          NORTH INDUSTRIAL BELT
                        </text>

                        {/* 7. Port Terminals Alpha */}
                        <path
                          d="M 450 205 Q 330 260 390 225"
                          stroke="#EC4899"
                          strokeWidth="3"
                          fill="none"
                          opacity="0.8"
                        />
                        <text x="300" y="275" fill="#EC4899" fontSize="12" fontFamily="monospace" fontWeight="bold">
                          PORT TERMINALS ALPHA
                        </text>

                        {/* 8. South Metro Ring */}
                        <path
                          d="M 170 230 Q 240 315 335 325"
                          stroke="#14B8A6"
                          strokeWidth="2.5"
                          strokeDasharray="5 3"
                          fill="none"
                          opacity="0.75"
                        />
                        <text x="200" y="300" fill="#14B8A6" fontSize="12" fontFamily="monospace" fontWeight="bold">
                          SOUTH METRO RING
                        </text>

                        {/* Regional Logistics Hub Waypoint Nodes */}
                        <g>
                          {/* SFO International Cargo */}
                          <circle cx="215" cy="360" r="5" fill="#F59E0B" />
                          <circle cx="215" cy="360" r="10" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="2 2" />
                          <text x="228" y="365" fill="#FDE68A" fontSize="12" fontFamily="monospace" fontWeight="bold">
                            SFO AIR CARGO
                          </text>

                          {/* SF SOMA Hub */}
                          <circle cx="180" cy="195" r="5" fill="#38BDF8" />
                          <text x="105" y="212" fill="#BAE6FD" fontSize="12" fontFamily="monospace" fontWeight="bold">
                            SF SOMA HUB
                          </text>

                          {/* Port of Oakland */}
                          <circle cx="370" cy="235" r="4.5" fill="#EC4899" />
                          <text x="310" y="220" fill="#FBCFE8" fontSize="12" fontFamily="monospace" fontWeight="bold">
                            PORT SLIP 4
                          </text>

                          {/* Fremont Mega Distribution */}
                          <circle cx="665" cy="440" r="5" fill="#06B6D4" />
                          <text x="680" y="445" fill="#CFFAFE" fontSize="12" fontFamily="monospace" fontWeight="bold">
                            FREMONT DC
                          </text>
                        </g>

                        {/* Central Hub: VoltGrid Fleet HQ - Metro West */}
                        <g transform="translate(450, 205)">
                          {/* Concentric Pulsing Radar Rings */}
                          <circle r="42" fill="url(#depotPulseGlow)" />
                          <circle r="26" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.8" />
                          <circle r="14" fill="#064E3B" stroke="#10B981" strokeWidth="2" />
                          <circle r="5" fill="#34D399" />
                          
                          {/* Depot HUD Badge */}
                          <rect x="-95" y="-38" width="190" height="24" rx="4" fill="#0B0F17" stroke="#10B981" strokeWidth="1.5" />
                          <text x="0" y="-22" textAnchor="middle" fill="#A7F3D0" fontSize="12" fontFamily="monospace" fontWeight="bold">
                            ⚡ DEPOT HQ // BAYS 01-06
                          </text>
                        </g>

                        {/* Dynamic Line-of-Sight Vector to Selected Vehicle */}
                        {(() => {
                          const coords = getVehicleMapCoordinates(currentSelectedVehicle);
                          return (
                            <g stroke="#06B6D4" opacity="0.6">
                              <line
                                x1="450"
                                y1="205"
                                x2={coords.x}
                                y2={coords.y}
                                strokeWidth="1.5"
                                strokeDasharray="3 3"
                              />
                            </g>
                          );
                        })()}

                        {/* ======================================================= */}
                        {/* 8 COMMERCIAL DELIVERY ASSET VECTOR BLIPS */}
                        {/* ======================================================= */}
                        {vehicles.map((veh) => {
                          const coords = getVehicleMapCoordinates(veh);
                          const isSelected = veh.id === selectedVehicleId;
                          const isLow = veh.soc <= 14;
                          const isMedium = veh.soc > 14 && veh.soc <= 50;

                          // Blip Color
                          const blipColor = isLow ? '#EF4444' : isMedium ? '#F59E0B' : '#10B981';
                          const haloColor = isLow ? 'rgba(239,68,68,0.4)' : isMedium ? 'rgba(245,158,11,0.35)' : 'rgba(16,185,129,0.35)';

                          return (
                            <g
                              key={veh.id}
                              transform={`translate(${coords.x}, ${coords.y})`}
                              className="cursor-pointer transition-all duration-300"
                              onClick={() => setSelectedVehicleId(veh.id)}
                            >
                              {/* Pulsing Radar Ring */}
                              <circle
                                r={isSelected ? "18" : "12"}
                                fill={haloColor}
                                className={isLow ? "animate-ping" : ""}
                              />

                              {/* Selected Highlight Aura */}
                              {isSelected && (
                                <circle
                                  r="24"
                                  fill="none"
                                  stroke="#06B6D4"
                                  strokeWidth="1.5"
                                  strokeDasharray="4 2"
                                />
                              )}

                              {/* Vector Blip Core */}
                              <circle
                                r={isSelected ? "7" : "5.5"}
                                fill={blipColor}
                                stroke="#FFFFFF"
                                strokeWidth={isSelected ? "2" : "1.5"}
                              />

                              {/* Direction Indicator Notch */}
                              <polygon
                                points="0,-10 3,-5 -3,-5"
                                fill={blipColor}
                                transform={`rotate(${veh.headingDeg})`}
                              />

                              {/* Interactive Callout Tag (Clickable) */}
                              <g transform="translate(10, -20)">
                                <rect
                                  x="-2"
                                  y="-14"
                                  width={isSelected ? "134" : "120"}
                                  height="28"
                                  rx="4"
                                  fill="#090D14"
                                  stroke={isSelected ? "#06B6D4" : isLow ? "#EF4444" : "#1E293B"}
                                  strokeWidth={isSelected ? "1.5" : "1"}
                                  opacity="0.95"
                                />
                                <text
                                  x="4"
                                  y="0"
                                  fill="#FFFFFF"
                                  fontSize="12"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                >
                                  {veh.callsign.split('-')[0]}-{veh.id.replace('V-', '')}
                                </text>
                                <text
                                  x={isSelected ? "86" : "76"}
                                  y="0"
                                  fill={blipColor}
                                  fontSize="12"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                >
                                  {veh.soc}%
                                </text>
                                <text
                                  x="4"
                                  y="10"
                                  fill="#94A3B8"
                                  fontSize="10"
                                  fontFamily="monospace"
                                  fontWeight="bold"
                                >
                                  {veh.speedMph} mph
                                </text>
                              </g>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    {/* Quick Asset Selector Strip (High Readability) */}
                    <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="text-xs font-mono uppercase font-bold text-slate-400 shrink-0 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-cyan-400" />
                        SELECT ASSET:
                      </span>
                      {vehicles.map((v) => {
                        const isSelected = v.id === selectedVehicleId;
                        const isLow = v.soc <= 14;
                        return (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVehicleId(v.id)}
                            className={`px-2.5 py-1.5 rounded text-xs font-mono font-bold shrink-0 transition flex items-center gap-1.5 border ${
                              isSelected
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                                : isLow
                                ? 'bg-amber-950/40 text-amber-300 border-amber-500/50 hover:border-amber-400'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isLow ? 'bg-rose-500 animate-pulse' : v.soc > 50 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            <span>{v.callsign}</span>
                            <span className="text-xs text-slate-400">({v.soc}%)</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* VIEW 2: ASSET TELEMETRY CARDS (UPGRADED TYPOGRAPHY) */
                  <div className="relative z-10 w-full h-full flex flex-col justify-between py-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {vehicles.map((veh) => {
                        const isSelected = veh.id === selectedVehicleId;
                        const isLow = veh.soc <= 14;

                        return (
                          <div
                            key={veh.id}
                            onClick={() => setSelectedVehicleId(veh.id)}
                            className={`group cursor-pointer p-3 rounded-lg border transition-all relative ${
                              isSelected
                                ? 'bg-slate-900/90 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                : isLow
                                ? 'bg-amber-950/30 border-amber-500/60 hover:border-amber-400'
                                : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70'
                            }`}
                          >
                            {/* Card Top: Callsign, Corridor & Status */}
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-bold text-white flex items-center gap-1.5">
                                  <Truck className={`w-4 h-4 ${isLow ? 'text-amber-400' : isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                                  {veh.callsign}
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                  #{veh.id}
                                </span>
                              </div>

                              <span
                                className={`text-xs font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isLow
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40 animate-pulse'
                                    : veh.status === 'rerouted'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {veh.status === 'warning' ? 'CRITICAL SOC' : veh.status.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Corridor & Driver Tag */}
                            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                              <span className="truncate max-w-[200px] text-slate-300 font-semibold">{veh.corridor}</span>
                              <span className="text-xs text-cyan-400">{veh.driverCallsign}</span>
                            </div>

                            {/* Route Progress Bar */}
                            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 mb-2">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  isLow ? 'bg-amber-500' : isSelected ? 'bg-cyan-400' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${veh.routeProgress}%` }}
                              />
                            </div>

                            {/* Telemetry Metrics Row (Speed, SoC, Range, Inverter Temp) */}
                            <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800/60">
                                <span className="text-xs text-slate-400 block font-semibold">SPEED</span>
                                <span className="text-sm font-bold text-white">{veh.speedMph} <span className="text-xs text-slate-400 font-normal">mph</span></span>
                              </div>
                              <div className={`p-1.5 rounded border ${isLow ? 'bg-amber-950/60 border-amber-500/40 text-amber-300' : 'bg-slate-950/80 border-slate-800/60 text-emerald-400'}`}>
                                <span className="text-xs text-slate-400 block font-semibold">SoC</span>
                                <span className="text-sm font-bold">{veh.soc}%</span>
                              </div>
                              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800/60">
                                <span className="text-xs text-slate-400 block font-semibold">RANGE</span>
                                <span className="text-sm font-bold text-cyan-300">{veh.rangeMi} <span className="text-xs text-slate-400 font-normal">mi</span></span>
                              </div>
                              <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800/60">
                                <span className="text-xs text-slate-400 block font-semibold">INV-T</span>
                                <span className="text-sm font-bold text-slate-200">{veh.tempMotorC}°C</span>
                              </div>
                            </div>

                            {/* Quick Inspect & Reroute Buttons */}
                            <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs font-mono">
                              <span className="text-slate-400 flex items-center gap-1 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {veh.lat.toFixed(3)}, {veh.lng.toFixed(3)}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectVehicle(veh);
                                  }}
                                  className="px-2 py-1 rounded bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 flex items-center gap-1 font-semibold"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Inspect
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRerouteVehicle(veh);
                                  }}
                                  className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/60 flex items-center gap-1 font-semibold"
                                >
                                  <Navigation className="w-3.5 h-3.5" /> Reroute
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Selected Asset Telemetry HUD Detail Strip */}
                {currentSelectedVehicle && (
                  <div className="mt-3.5 p-4 rounded-lg border border-cyan-500/50 bg-slate-900/95 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-sm font-mono shadow-lg">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
                        <Radio className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="text-white text-base font-bold flex items-center gap-2.5 flex-wrap">
                          <span>FOCUS: {currentSelectedVehicle.callsign} ({currentSelectedVehicle.model})</span>
                          <span className="text-xs text-cyan-400 font-bold">VIN: {currentSelectedVehicle.vin}</span>
                        </div>
                        <div className="text-sm text-slate-300 mt-1 font-medium">
                          Driver: <span className="text-white font-bold">{currentSelectedVehicle.driver}</span> // Next Stop: {currentSelectedVehicle.waypoints.find(w => !w.completed)?.name || 'Depot Return'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-bold">PARCEL LOAD</span>
                        <span className="text-emerald-400 font-bold text-base">{currentSelectedVehicle.parcelsRemaining} / {currentSelectedVehicle.parcelsTotal} Left ({currentSelectedVehicle.parcelCapacityPct}%)</span>
                      </div>
                      <button
                        onClick={() => setInspectVehicle(currentSelectedVehicle)}
                        className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition flex items-center gap-2 text-sm shadow-md"
                      >
                        <Cpu className="w-4 h-4" /> Full CAN Diagnostics
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* --------------------------------------------------------------------- */}
            {/* PANE 3: Center-Right Depot Charging Matrix (5 cols) */}
            {/* --------------------------------------------------------------------- */}
            <section className="xl:col-span-5 flex flex-col rounded-lg border border-slate-800/80 bg-[#0F172A]/70 backdrop-blur-sm overflow-hidden shadow-xl">
              {/* Header */}
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <BatteryCharging className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-slate-200">
                    Depot Fast-Charger Matrix (Bays 01 - 06)
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {fastChargeThrottleActive && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/50">
                      THROTTLE CLAMP
                    </span>
                  )}
                  {peakGridSurgeActive && (
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/50 animate-pulse">
                      -40% SURGE
                    </span>
                  )}
                </div>
              </div>

              {/* 6 Charging Bays Grid */}
              <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1 overflow-y-auto">
                {bays.map((bay) => {
                  const isCharging = bay.status === 'charging';
                  const isStandby = bay.status === 'standby';
                  const isMaint = bay.status === 'maintenance';

                  return (
                    <div
                      key={bay.id}
                      className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
                        isCharging
                          ? bay.isBoosted
                            ? 'bg-cyan-950/30 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                            : 'bg-slate-900/80 border-emerald-500/50'
                          : isMaint
                          ? 'bg-amber-950/20 border-amber-600/40 text-slate-400'
                          : 'bg-slate-900/40 border-slate-800/80'
                      }`}
                    >
                      {/* Bay Header */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-base bg-slate-800 text-white border border-slate-700 shadow-sm">
                            {bay.bayNumber}
                          </span>
                          <div>
                            <span className="text-base font-mono font-bold text-slate-200 block">
                              {bay.bayName}
                            </span>
                            <span className="text-xs font-mono font-semibold text-slate-400">
                              CAPACITY: {bay.maxOutputKw} kW DC
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded uppercase tracking-wider ${
                            isCharging
                              ? bay.isBoosted
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                              : isStandby
                              ? 'bg-slate-800 text-slate-300 border border-slate-700'
                              : 'bg-amber-950 text-amber-300 border border-amber-600/50'
                          }`}
                        >
                          {bay.status}
                        </span>
                      </div>

                      {/* Middle: Vehicle or Idle telemetry */}
                      {isCharging ? (
                        <div className="space-y-2 mb-2.5">
                          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                            <div className="flex items-center justify-between text-xs font-mono text-white mb-2">
                              <span className="text-base font-bold text-emerald-300">{bay.vehicleCallsign}</span>
                              <span className="text-sm text-slate-200 font-bold">{bay.soc}% → {bay.targetSoc}%</span>
                            </div>

                            {/* Charge Bar */}
                            <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 mb-2.5">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  bay.isBoosted ? 'bg-cyan-400' : 'bg-emerald-400'
                                }`}
                                style={{ width: `${bay.soc}%` }}
                              />
                            </div>

                            {/* Wattage & Thermals */}
                            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                              <span className="flex items-center gap-1.5 font-bold text-amber-300 text-base">
                                <Zap className="w-4 h-4 text-amber-400" />
                                {bay.currentKw} kW
                              </span>
                              <span className="flex items-center gap-1.5 text-slate-200 font-bold text-base">
                                <Thermometer className="w-4 h-4 text-rose-400" />
                                {bay.thermalsC}°C
                              </span>
                              <span className="flex items-center gap-1.5 text-cyan-300 font-bold text-base">
                                <Clock className="w-4 h-4 text-cyan-400" />
                                ~{bay.timeToFullMin}m
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : isStandby ? (
                        <div className="p-4 my-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-center font-mono">
                          <CheckCircle2 className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                          <span className="text-sm text-slate-300 block font-bold">READY FOR DISPATCH</span>
                          <span className="text-xs text-slate-400 font-medium">Plug detected: None. Pilot line idle.</span>
                        </div>
                      ) : (
                        <div className="p-4 my-2 rounded-lg bg-amber-950/20 border border-amber-900/40 text-center font-mono">
                          <Wrench className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
                          <span className="text-sm text-amber-300 block font-bold">STATION MAINTENANCE</span>
                          <span className="text-xs text-slate-400 font-medium">Coolant manifold filter servicing scheduled.</span>
                        </div>
                      )}

                      {/* Bottom Quick-Action Triggers */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-sm font-mono">
                        {isCharging ? (
                          <>
                            {/* Boost to 350kW Button */}
                            <button
                              onClick={() => handleBoostBay(bay.id)}
                              className={`px-3 py-2 rounded-lg border transition font-bold flex items-center gap-1.5 text-sm ${
                                bay.isBoosted
                                  ? 'bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400'
                                  : 'bg-slate-800 text-cyan-300 border-cyan-600/40 hover:bg-slate-700'
                              }`}
                              title="Engage 350kW High-Speed Boost"
                            >
                              <Zap className="w-4 h-4" />
                              {bay.isBoosted ? 'BOOST (350kW)' : 'BOOST 350kW'}
                            </button>

                            {/* Release Cable Button */}
                            <button
                              onClick={() => handleReleaseCable(bay.id)}
                              className="px-3 py-2 rounded-lg bg-slate-800 text-rose-300 border border-rose-600/30 hover:bg-rose-950/60 hover:text-rose-200 transition flex items-center gap-1.5 font-bold text-sm"
                              title="Safely unlatch and shift bay to standby"
                            >
                              <Unplug className="w-4 h-4" /> Release
                            </button>
                          </>
                        ) : isStandby ? (
                          <button
                            onClick={() => {
                              // Plug vehicle in
                              setBays(prev =>
                                prev.map(b =>
                                  b.id === bay.id
                                    ? {
                                        ...b,
                                        status: 'charging',
                                        currentKw: 145,
                                        vehicleVin: '1FTFW1ED9NFC41209',
                                        vehicleCallsign: 'RESERVE-VAN-12',
                                        soc: 44,
                                        targetSoc: 90,
                                        thermalsC: 32.1,
                                        timeToFullMin: 32,
                                        isBoosted: false
                                      }
                                    : b
                                )
                              );
                              setNotificationToast({
                                title: `Bay ${bay.bayNumber} Plugged In`,
                                desc: 'Reserve fleet vehicle docked. Handshake confirmed; charging started.',
                                type: 'success'
                              });
                            }}
                            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 transition flex items-center justify-center gap-2 text-sm"
                          >
                            <Zap className="w-4 h-4 text-emerald-400" /> Dock Inbound Asset
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setBays(prev =>
                                prev.map(b =>
                                  b.id === bay.id
                                    ? { ...b, status: 'standby', currentKw: 0 }
                                    : b
                                )
                              );
                              setNotificationToast({
                                title: `Bay ${bay.bayNumber} Cleared for Service`,
                                desc: 'Maintenance inspection passed. Returned to active standby.',
                                type: 'success'
                              });
                            }}
                            className="w-full py-2 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-600/40 hover:bg-amber-900 transition flex items-center justify-center gap-2 font-bold text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-amber-400" /> Complete Maintenance
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* PANE 4: Bottom Bar / Fleet Manifest (Filterable Table) */}
          {/* --------------------------------------------------------------------- */}
          <section className="rounded-lg border border-slate-800/80 bg-[#0F172A]/70 backdrop-blur-sm overflow-hidden shadow-xl">
            {/* Table Control Bar */}
            <div className="p-3.5 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/60">
              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <Truck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200">
                  Fleet Telemetry Manifest &amp; Corridor Dispatch
                </h3>
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  ({filteredVehicles.length} of {vehicles.length} Active Runs)
                </span>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
                {/* Search Input */}
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Callsign, Driver, Corridor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center rounded border border-slate-800 bg-[#111827] overflow-hidden text-xs font-mono">
                  {(['all', 'in_transit', 'warning', 'rerouted'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`px-3 py-1.5 uppercase transition font-bold ${
                        statusFilter === f
                          ? 'bg-slate-800 text-cyan-300'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      {f.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filterable Table */}
            <div className="w-full overflow-x-auto rounded-lg border border-slate-800/80 bg-zinc-950/60 max-h-[380px] overflow-y-auto">
              <table className="w-full text-left font-mono min-w-[980px]">
                <thead className="sticky top-0 bg-[#0B0F17] z-10 border-b border-slate-800 shadow-sm">
                  <tr className="text-slate-200 text-sm uppercase tracking-wider font-bold">
                    <th className="py-3 px-4 whitespace-nowrap">Vehicle / VIN</th>
                    <th className="py-3 px-4 whitespace-nowrap">Driver / Callsign</th>
                    <th className="py-3 px-4 whitespace-nowrap">Corridor Run</th>
                    <th className="py-3 px-4 whitespace-nowrap">Battery SoC</th>
                    <th className="py-3 px-4 whitespace-nowrap">Speed</th>
                    <th className="py-3 px-4 whitespace-nowrap">Remaining Range</th>
                    <th className="py-3 px-4 whitespace-nowrap">Parcel Load</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Quick Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200 text-sm">
                  {filteredVehicles.map((veh) => {
                    const isLow = veh.soc <= 14;
                    const isSelected = veh.id === selectedVehicleId;

                    return (
                      <tr
                        key={veh.id}
                        onClick={() => setSelectedVehicleId(veh.id)}
                        className={`hover:bg-slate-900/70 transition cursor-pointer ${
                          isSelected ? 'bg-cyan-950/25' : ''
                        }`}
                      >
                        {/* Vehicle / VIN */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-white text-sm flex items-center gap-2 whitespace-nowrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                            <span className="whitespace-nowrap">{veh.callsign}</span>
                          </div>
                          <div className="text-sm font-mono text-slate-400 mt-0.5 whitespace-nowrap">{veh.vin}</div>
                        </td>

                        {/* Driver */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-200 text-sm font-semibold whitespace-nowrap">{veh.driver}</div>
                          <div className="text-sm text-cyan-400 font-bold whitespace-nowrap">{veh.driverCallsign}</div>
                        </td>

                        {/* Corridor */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-200 text-sm font-medium whitespace-nowrap">{veh.corridor}</div>
                          <div className="text-sm text-slate-400 whitespace-nowrap">Progress: {veh.routeProgress}%</div>
                        </td>

                        {/* Battery SoC */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5 whitespace-nowrap">
                            <div className="w-20 bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 shrink-0">
                              <div
                                className={`h-full ${isLow ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: `${veh.soc}%` }}
                              />
                            </div>
                            <span className={`text-sm font-bold ${isLow ? 'text-amber-400' : 'text-emerald-300'}`}>
                              {veh.soc}%
                            </span>
                          </div>
                        </td>

                        {/* Speed */}
                        <td className="py-3 px-4 font-bold text-white text-sm whitespace-nowrap">
                          {veh.speedMph} <span className="text-xs text-slate-400 font-normal">mph</span>
                        </td>

                        {/* Remaining Range */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${veh.rangeMi < 30 ? 'text-amber-400' : 'text-cyan-300'}`}>
                            {veh.rangeMi} mi
                          </span>
                        </td>

                        {/* Parcel Capacity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-200 text-sm font-medium whitespace-nowrap">
                            {veh.parcelsRemaining} / {veh.parcelsTotal} ({veh.parcelCapacityPct}%)
                          </div>
                          <div className="w-20 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 mt-1">
                            <div
                              className="h-full bg-slate-400"
                              style={{ width: `${veh.parcelCapacityPct}%` }}
                            />
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-xs font-mono font-bold px-2.5 py-1 rounded uppercase tracking-wider whitespace-nowrap ${
                              isLow
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/50 animate-pulse'
                                : veh.status === 'rerouted'
                                ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            }`}
                          >
                            {veh.status === 'warning' ? 'CRITICAL SOC' : veh.status.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRerouteVehicle(veh);
                              }}
                              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500 transition text-sm font-bold flex items-center gap-1.5 whitespace-nowrap"
                              title="Reroute vehicle to nearest charging bay"
                            >
                              <Navigation className="w-4 h-4" /> Reroute
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectVehicle(veh);
                              }}
                              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition text-sm font-bold flex items-center gap-1.5 whitespace-nowrap"
                              title="Inspect CAN-bus telemetry, cell balance, inverter temps"
                            >
                              <Eye className="w-4 h-4" /> Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* ========================================================================= */}
        {/* MODAL 1: TELEMETRY INSPECT DRAWER */}
        {/* ========================================================================= */}
        {inspectVehicle && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xl bg-[#0B0F17] border-l border-slate-800 flex flex-col h-full shadow-2xl overflow-y-auto">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                      TELEMETRY DIAGNOSTIC // {inspectVehicle.callsign}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      VIN: {inspectVehicle.vin} | Model: {inspectVehicle.model}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setInspectVehicle(null)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-5 space-y-6 font-mono text-xs">
                {/* Driver & Run Summary */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Driver / Callsign</span>
                    <span className="font-bold text-white text-sm">{inspectVehicle.driver}</span>
                    <span className="text-[11px] text-cyan-400 block">CALLSIGN: {inspectVehicle.driverCallsign}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Assigned Corridor</span>
                    <span className="font-bold text-slate-200">{inspectVehicle.corridor}</span>
                    <span className="text-[11px] text-emerald-400 block">Speed: {inspectVehicle.speedMph} mph</span>
                  </div>
                </div>

                {/* Battery State & Cell Balance Graph (16 Cells) */}
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase">
                      <BatteryCharging className="w-4 h-4 text-emerald-400" />
                      16-Cell Module Voltage Distribution
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">
                      Delta-V: 0.03V (Nominal)
                    </span>
                  </div>

                  {/* Cell Voltage Bars */}
                  <div className="grid grid-cols-8 gap-2">
                    {inspectVehicle.cellVoltages.map((volt, idx) => {
                      const heightPct = Math.min(100, Math.max(10, ((volt - 3.2) / (4.25 - 3.2)) * 100));
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="w-full bg-slate-950 h-24 rounded flex items-end p-0.5 border border-slate-800">
                            <div
                              className="w-full rounded bg-gradient-to-t from-emerald-600 to-cyan-400 transition-all"
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-slate-400 mt-1">C-{String(idx + 1).padStart(2, '0')}</span>
                          <span className="text-[9px] font-bold text-slate-300">{volt.toFixed(2)}v</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Thermals & Power Train Inverter */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Inverter Thermals
                    </span>
                    <span className="text-lg font-bold text-white mt-1 block">
                      {inspectVehicle.tempMotorC}°C
                    </span>
                    <span className="text-[10px] text-emerald-400">Cooling loop flow: 18.2 L/min</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block uppercase flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> Battery Pack Temp
                    </span>
                    <span className="text-lg font-bold text-white mt-1 block">
                      {inspectVehicle.tempPackC}°C
                    </span>
                    <span className="text-[10px] text-slate-400">Thermal threshold: 52.0°C</span>
                  </div>
                </div>

                {/* TPMS Tire Pressure Monitor */}
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-3 uppercase flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    TPMS Quad-Axle Tire Pressure
                  </span>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">FRONT LEFT</span>
                      <span className="text-sm font-bold text-emerald-400">{inspectVehicle.tirePsi[0]} PSI</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">FRONT RIGHT</span>
                      <span className="text-sm font-bold text-emerald-400">{inspectVehicle.tirePsi[1]} PSI</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">REAR LEFT</span>
                      <span className="text-sm font-bold text-emerald-400">{inspectVehicle.tirePsi[2]} PSI</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-[9px] text-slate-400 block">REAR RIGHT</span>
                      <span className="text-sm font-bold text-emerald-400">{inspectVehicle.tirePsi[3]} PSI</span>
                    </div>
                  </div>
                </div>

                {/* Waypoints & Corridor Schedule */}
                <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="font-bold text-slate-200 block mb-3 uppercase flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    Delivery Stop Sequence
                  </span>
                  <div className="space-y-2">
                    {inspectVehicle.waypoints.map((wp, idx) => (
                      <div
                        key={wp.id}
                        className={`p-2 rounded border flex items-center justify-between ${
                          wp.completed
                            ? 'bg-slate-950/60 border-slate-800/80 text-slate-500'
                            : 'bg-slate-900 border-cyan-500/40 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            wp.completed ? 'bg-slate-800 text-slate-400' : 'bg-cyan-500 text-black'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <span className={`font-bold block ${wp.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                              {wp.name}
                            </span>
                            <span className="text-[10px] text-slate-400">{wp.address}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block font-bold text-cyan-300">{wp.eta}</span>
                          <span className="text-[10px] text-slate-400">{wp.parcels} parcels</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 mt-auto">
                <button
                  onClick={() => {
                    setRerouteVehicle(inspectVehicle);
                    setInspectVehicle(null);
                  }}
                  className="flex-1 py-2 rounded bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition text-xs flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" /> Transmit Depot Reroute
                </button>
                <button
                  onClick={() => setInspectVehicle(null)}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: REROUTE DISPATCH TO DEPOT CHARGER */}
        {/* ========================================================================= */}
        {rerouteVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#0F172A] border border-cyan-500/50 rounded-xl p-5 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-white uppercase text-sm">
                    Direct Reroute Dispatch
                  </h3>
                </div>
                <button onClick={() => setRerouteVehicle(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <p className="text-slate-300">
                  Select an available DC fast-charge bay at <strong>VoltGrid Depot Metro West</strong> for inbound priority docking:
                </p>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                  <div className="flex justify-between">
                    <span>Asset Callsign:</span>
                    <strong className="text-white">{rerouteVehicle.callsign}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Driver:</span>
                    <span className="text-cyan-300">{rerouteVehicle.driver} ({rerouteVehicle.driverCallsign})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current SoC:</span>
                    <strong className={rerouteVehicle.soc < 15 ? 'text-amber-400' : 'text-emerald-400'}>
                      {rerouteVehicle.soc}% ({rerouteVehicle.rangeMi} mi remaining)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Depot Arrival:</span>
                    <span className="text-white">8 mins (3.4 mi)</span>
                  </div>
                </div>

                <label className="block text-slate-400 text-[10px] uppercase font-bold mt-2">
                  Assign Inbound Bay:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {bays.map(b => (
                    <button
                      key={b.id}
                      onClick={() => handleConfirmReroute(b.bayNumber)}
                      className={`p-2 rounded border text-left transition ${
                        b.status === 'standby'
                          ? 'bg-slate-900 border-emerald-500/50 hover:bg-emerald-950/40 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>Bay {b.bayNumber}</span>
                        <span className={`text-[9px] px-1 rounded uppercase ${
                          b.status === 'standby' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{b.maxOutputKw} kW DC</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setRerouteVehicle(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmReroute('03')}
                  className="px-4 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Transmit Priority Divert
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: AURA & GRID STOREFRONT DOCUMENTATION PACKAGE */}
        {/* ========================================================================= */}
        {showStorefrontModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-3xl bg-[#0B0F17] border border-slate-800 rounded-xl shadow-2xl p-6 my-8 font-mono text-xs">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-wider">
                      Aura &amp; Grid // Blueprint Documentation Package
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      EVFleetDashboard.tsx — Track 1 Institutional Prototype Artifact
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStorefrontModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Package Content */}
              <div className="space-y-6 mt-5 text-slate-300">
                {/* 1. Product Truth & Disclosures Block */}
                <div className="p-4 rounded-lg bg-slate-900/80 border border-amber-500/40">
                  <div className="flex items-center gap-2 mb-2 text-amber-300 font-bold text-xs uppercase">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    1. Product Truth &amp; Disclosures Block
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    <strong>DISCLOSURE (TRACK 1 PROTOTYPE):</strong> This software artifact is an institutional frontend telematics simulation built with client-side reactive state loops in React 19 and Tailwind CSS. It is architected for rapid product testing, UI/UX benchmarking, investor presentations, and operational HUD prototyping.
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-[11px] text-slate-400">
                    <li>Does <strong>not</strong> include direct physical CAN bus hardware integrations (J1939/OBD-II dongles).</li>
                    <li>Does <strong>not</strong> include live physical OCPP 1.6/2.0.1 socket connections to physical charging stations.</li>
                    <li>State ticks, wattage ramp-up, battery drain, and GPS vectors are client-side reactive state loops managed via standard React hooks (<code className="text-cyan-300 font-bold">useState</code>, <code className="text-cyan-300 font-bold">useEffect</code>, <code className="text-cyan-300 font-bold">useCallback</code>).</li>
                  </ul>
                </div>

                {/* 2. Setup & Deployment Guide */}
                <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-300 font-bold text-xs uppercase flex items-center gap-2">
                      <Server className="w-4 h-4 text-cyan-400" />
                      2. Setup &amp; Deployment Guide (Zero-Config)
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('npm install\nnpm run dev\nnpm run build');
                        setCopiedCodeSnippet(true);
                        setTimeout(() => setCopiedCodeSnippet(false), 2000);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 border border-slate-700"
                    >
                      {copiedCodeSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedCodeSnippet ? 'Copied' : 'Copy Commands'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Launch the production blueprint in under 60 seconds using Vite, Tailwind CSS v4, and React 19:
                  </p>
                  <div className="p-3 rounded bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800 space-y-1">
                    <div><span className="text-slate-600"># Step 1: Install standard verified dependencies</span></div>
                    <div>npm install</div>
                    <div><span className="text-slate-600"># Step 2: Start local high-speed Vite dev server</span></div>
                    <div>npm run dev</div>
                    <div><span className="text-slate-600"># Step 3: Compile zero-defect production bundle</span></div>
                    <div>npm run build</div>
                  </div>
                </div>

                {/* 3. Storefront Marketing Copy & Track 1 Pricing */}
                <div className="p-4 rounded-lg bg-slate-900/80 border border-emerald-500/40">
                  <div className="flex items-center gap-2 mb-2 text-emerald-300 font-bold text-xs uppercase">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    3. Storefront Marketing Copy &amp; Licensing Tiers
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
                    <strong>THE HOOK:</strong> Designed for EV fleet founders, logistics dispatch directors, and enterprise software engineers who need an ultra-modern, dark tactical command center without spending 300+ engineering hours building custom vector maps, charging bay matrices, and telemetry drawers from scratch.
                  </p>
                  
                  {/* Pricing Tiers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded bg-slate-950 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Track 1 Micro-APA Buyout ($4,500 anchor)</span>
                      <span className="text-xl font-bold text-white my-1 block font-mono">$4,500</span>
                      <p className="text-[10px] text-slate-400 leading-tight">Single commercial project. Full React 19 source code, Supabase schema &amp; seed fixtures.</p>
                    </div>

                    <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/60 text-center relative">
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-black uppercase">
                        POPULAR
                      </span>
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block">Team Seat License</span>
                      <span className="text-xl font-bold text-emerald-300 my-1 block font-mono">$4,500</span>
                      <p className="text-[10px] text-slate-300 leading-tight">Up to 10 engineers, unlimited commercial apps, future blueprint revisions included.</p>
                    </div>

                    <div className="p-3 rounded bg-slate-950 border border-cyan-500/40 text-center">
                      <span className="text-[10px] text-cyan-400 uppercase font-bold block">Exclusive Buyout Anchor</span>
                      <span className="text-xl font-bold text-cyan-300 my-1 block font-mono">$4,500</span>
                      <p className="text-[10px] text-slate-400 leading-tight">Full IP transfer &amp; exclusivity rights. Blueprint delisted from storefront permanently.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowStorefrontModal(false)}
                  className="px-5 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition text-xs font-mono"
                >
                  Return to Fleet Command HUD
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {notificationToast && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm p-3 rounded-lg border shadow-2xl backdrop-blur-md font-mono text-xs flex items-start gap-2.5 animate-in slide-in-from-bottom-2 bg-slate-900/95 border-slate-700 text-slate-200">
            {notificationToast.type === 'warn' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : notificationToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="block text-white">{notificationToast.title}</strong>
              <span className="text-[11px] text-slate-400 leading-tight">{notificationToast.desc}</span>
            </div>
          </div>
        )}

        {/* Bottom Status Ticker */}
        <footer className="relative z-10 border-t border-slate-800/80 bg-[#0F172A]/90 px-4 py-1.5 text-[10px] font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              STATUS: NOMINAL
            </span>
            <span>GRID SUBSTATION: METRO-WEST 115kV</span>
            <span>DEPOT THROTTLE: {fastChargeThrottleActive ? '50% CLAMPED' : 'UNRESTRICTED'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span>AURA &amp; GRID // BLUEPRINT SPEC</span>
            <button
              onClick={() => setShowStorefrontModal(true)}
              className="text-cyan-400 hover:underline"
            >
              View Documentation &amp; Pricing
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
