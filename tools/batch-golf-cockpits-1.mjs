/**
 * Batch Golf Cockpits — Part 1: Units #466 to #472 (Autonomous Operations & SCADA)
 * Fly-By-Wire Avionics, SCADA PLM, LiDAR Point Cloud, Robotic Teleoperation, PWM Oscilloscope, Battery BMS, Satellite Orbital Tracker
 */

export const AUTONOMOUS_SCADA_COCKPITS = [
  // UNIT #466: Autonomous Pilot Telemetry
  {
    num: 466,
    folder: '01-autonomous-pilot-telemetry',
    id: 'GF-T2-PILOT-01',
    name: 'AUTONOMOUS-PILOT-TELEMETRY',
    subtitle: 'Fly-By-Wire Avionics & Kalman Sensor Fusion Radar',
    accent: '#00F0FF',
    componentName: 'AutonomousPilotTelemetryCockpit',
    metric1: { label: 'KALMAN COVARIANCE ERROR', value: '0.0042', unit: 'σ', sub: '6-DOF IMU + GNSS DUAL LOCK', color: '#00F0FF' },
    metric2: { label: 'ATTITUDE UPDATE RATE', value: '1,000', unit: 'Hz', sub: 'AVIONICS BUS: ARINC 429', color: '#FF9F0A' },
    svgType: 'avionics_attitude',
    items: [
      { id: 'ROLL-STABILIZER', val: 'Roll -0.18° / Pitch +1.24°', status: 'LOCKED', lat: '0.01°/s' },
      { id: 'AIRSPEED-PITOT-01', val: 'IAS 248 kts (TAS 262 kts)', status: 'CALIBRATED', lat: '12.4 kPa' },
      { id: 'BARO-ALTIMETER', val: 'Alt 14,280 ft // VSI +420 fpm', status: 'OPTIMAL', lat: '29.92 inHg' },
      { id: 'GNSS-RTK-RECEIVER', val: '28 SVs Locked // PDOP 0.82', status: 'NOMINAL', lat: '1.2 cm' },
      { id: 'FLY-BY-WIRE-ACTUATOR', val: 'P1 12.4% / P2 14.8% Duty', status: 'NOMINAL', lat: '28.2V / 14A' }
    ]
  },

  // UNIT #467: SCADA Industrial PLM
  {
    num: 467,
    folder: '02-scada-industrial-plm',
    id: 'GF-T2-PLM-02',
    name: 'SCADA-INDUSTRIAL-PLM',
    subtitle: 'Modbus & OPC-UA Programmable Logic Controller Matrix',
    accent: '#FF9F0A',
    componentName: 'ScadaIndustrialPlmCockpit',
    metric1: { label: 'PLC SCAN CYCLE TIME', value: '1.24', unit: 'ms', sub: 'IEC 61131-3 DETERMINISTIC', color: '#FF9F0A' },
    metric2: { label: 'OPC-UA ACTIVE TAGS', value: '48,200', unit: 'TAGS', sub: 'PUB/SUB TSN DETERMINISTIC', color: '#00F0FF' },
    svgType: 'plc_ladder',
    items: [
      { id: 'TAG-BOILER-PRESSURE', val: '42.8 bar (Threshold 50.0)', status: 'NOMINAL', lat: '2.0ms' },
      { id: 'TAG-TURBINE-RPM', val: '3,600 RPM (Threshold 3,800)', status: 'NOMINAL', lat: '1.0ms' },
      { id: 'TAG-COOLING-FLOW', val: '1,420 gpm (Threshold 900)', status: 'NOMINAL', lat: '5.0ms' },
      { id: 'TAG-FEEDWATER-TEMP', val: '184.2°C (Threshold 210.0)', status: 'NOMINAL', lat: '5.0ms' },
      { id: 'TAG-EMERGENCY-E-STOP', val: 'NORM_HIGH // SIL-4 Triple Rung', status: 'ARMED', lat: '0.5ms' }
    ]
  },

  // UNIT #468: LiDAR Point-Cloud Scope
  {
    num: 468,
    folder: '03-lidar-pointcloud-scope',
    id: 'GF-T2-LIDAR-03',
    name: 'LIDAR-POINTCLOUD-SCOPE',
    subtitle: '3D Point-Cloud Depth Voxel Spatial Radar',
    accent: '#00F0FF',
    componentName: 'LidarPointcloudScopeCockpit',
    metric1: { label: 'POINT RETURNING RATE', value: '2.40', unit: 'M pts/s', sub: '128-BEAM SOLID-STATE SCAN', color: '#00F0FF' },
    metric2: { label: 'VOXEL OCCUPANCY GRID', value: '0.05', unit: 'm³ res', sub: '300m RANGE DETECTION', color: '#FF9F0A' },
    svgType: 'lidar_voxel_radar',
    items: [
      { id: 'VOXEL-SECTOR-NORTH', val: 'Dist 142.4m // 8,400 pts/m²', status: 'TRACKING', lat: 'Refl 88%' },
      { id: 'VOXEL-SECTOR-EAST', val: 'Dist 84.1m // 14,200 pts/m²', status: 'TRACKING', lat: 'Refl 94%' },
      { id: 'VOXEL-SECTOR-SOUTH', val: 'Dist 210.8m // 4,100 pts/m²', status: 'TRACKING', lat: 'Refl 76%' },
      { id: 'VOXEL-SECTOR-WEST', val: 'Dist 32.6m // 32,800 pts/m²', status: 'CLASSIFIED', lat: 'Static Obs' },
      { id: 'VOXEL-GROUND-PLANE', val: 'Dist 1.4m // 120k pts/m²', status: 'GROUND_LOCK', lat: 'Refl 45%' }
    ]
  },

  // UNIT #469: Teleoperation Low-Latency Rig
  {
    num: 469,
    folder: '04-teleop-low-latency-rig',
    id: 'GF-T2-TELEOP-04',
    name: 'TELEOP-LOW-LATENCY-RIG',
    subtitle: 'Sub-5ms WebRTC Robotic Haptic Control Loop',
    accent: '#FF9F0A',
    componentName: 'TeleopLowLatencyRigCockpit',
    metric1: { label: 'ROUND-TRIP TELEOP RTT', value: '4.82', unit: 'ms', sub: 'WEBRTC DATACHANNEL SCTP', color: '#FF9F0A' },
    metric2: { label: 'HAPTIC FORCE FEEDBACK', value: '1,000', unit: 'Hz loop', sub: 'TORQUE BANDWIDTH: 65Nm', color: '#00F0FF' },
    svgType: 'haptic_loop',
    items: [
      { id: 'ARM-JOINT-J1-BASE', val: 'Torque 14.2 Nm // Angle 45.2°', status: 'SYNCHRONIZED', lat: 'Temp 42°C' },
      { id: 'ARM-JOINT-J2-SHOULDER', val: 'Torque 38.4 Nm // Angle -12.8°', status: 'SYNCHRONIZED', lat: 'Temp 48°C' },
      { id: 'ARM-JOINT-J3-ELBOW', val: 'Torque 22.0 Nm // Angle 84.1°', status: 'SYNCHRONIZED', lat: 'Temp 44°C' },
      { id: 'GRIPPER-FORCE-GAUGE', val: 'Grip Force 18.4 N // Stroke 42mm', status: 'ENGAGED', lat: 'Zero Slip' },
      { id: 'STEREO-CAM-FEED-01', val: 'H.265-LL 4K@60FPS // 18.4 Mbps', status: 'OPTIMAL', lat: 'Glass 3.9ms' }
    ]
  },

  // UNIT #470: Actuator PWM Oscilloscope
  {
    num: 470,
    folder: '05-actuator-pwm-oscilloscope',
    id: 'GF-T2-ACT-05',
    name: 'ACTUATOR-PWM-OSCILLOSCOPE',
    subtitle: 'Brushless Motor PWM Frequency & Torque Dyno',
    accent: '#00F0FF',
    componentName: 'ActuatorPwmOscilloscopeCockpit',
    metric1: { label: 'CARRIER PWM FREQ', value: '40.0', unit: 'kHz', sub: 'SPACE VECTOR MODULATION (SVPWM)', color: '#00F0FF' },
    metric2: { label: 'INSTANT MOTOR TORQUE', value: '184.2', unit: 'Nm', sub: 'FIELD ORIENTED CONTROL (FOC)', color: '#FF9F0A' },
    svgType: 'pwm_oscilloscope',
    items: [
      { id: 'PHASE-U-CURRENT', val: 'Peak 42.4A // RMS 30.0A (THD 1.2%)', status: 'BALANCED', lat: 'Duty 68%' },
      { id: 'PHASE-V-CURRENT', val: 'Peak 42.2A // RMS 29.8A (THD 1.1%)', status: 'BALANCED', lat: 'Duty 68%' },
      { id: 'PHASE-W-CURRENT', val: 'Peak 42.5A // RMS 30.1A (THD 1.3%)', status: 'BALANCED', lat: 'Duty 68%' },
      { id: 'RESOLVER-ROTOR-ANGLE', val: 'Theta 142.8° // 12,400 e-RPM', status: 'LOCKED', lat: 'BEMF 84V' },
      { id: 'INVERTER-MOSFET-TEMP', val: 'Bridge 54.2°C // VBus 402.4V', status: 'OPTIMAL', lat: '8.4 kV/µs' }
    ]
  },

  // UNIT #471: Battery BMS Thermal Gauge
  {
    num: 471,
    folder: '06-battery-bms-thermal-gauge',
    id: 'GF-T2-BMS-06',
    name: 'BATTERY-BMS-THERMAL-GAUGE',
    subtitle: 'Lithium Cell Balancer & State-of-Charge (SoC) Arc',
    accent: '#FF9F0A',
    componentName: 'BatteryBmsThermalGaugeCockpit',
    metric1: { label: 'PACK STATE-OF-CHARGE', value: '88.4', unit: '%', sub: 'CELL DELTA V: 4.2mV (PASSIVE BAL)', color: '#FF9F0A' },
    metric2: { label: 'THERMAL SPREAD MAX', value: '31.2', unit: '°C', sub: 'COOLANT GLYCOL IN: 22.0°C', color: '#00F0FF' },
    svgType: 'bms_cell_matrix',
    items: [
      { id: 'CELL-BANK-01', val: 'VMean 4.182V (Min 4.180 / Max 4.184)', status: 'BALANCED', lat: 'Temp 29.8°C' },
      { id: 'CELL-BANK-02', val: 'VMean 4.183V (Min 4.181 / Max 4.185)', status: 'BALANCED', lat: 'Temp 30.4°C' },
      { id: 'CELL-BANK-03', val: 'VMean 4.181V (Delta 4.2mV Drain 2mA)', status: 'BALANCING', lat: 'Temp 31.2°C' },
      { id: 'CELL-BANK-04', val: 'VMean 4.184V (Min 4.182 / Max 4.186)', status: 'BALANCED', lat: 'Temp 30.1°C' },
      { id: 'MAIN-CONTACTOR-BOX', val: 'Pre-Charge Done // Isol >500 MΩ', status: 'ENGAGED', lat: 'Leak <1µA' }
    ]
  },

  // UNIT #472: Satellite Orbital Tracker
  {
    num: 472,
    folder: '07-satellite-orbital-tracker',
    id: 'GF-T2-SAT-07',
    name: 'SATELLITE-ORBITAL-TRACKER',
    subtitle: 'LEO Satellite Constellation Ground Station Ephemeris',
    accent: '#00F0FF',
    componentName: 'SatelliteOrbitalTrackerCockpit',
    metric1: { label: 'ORBITAL VELOCITY', value: '7.66', unit: 'km/s', sub: 'ALTITUDE: 550 km LEO', color: '#00F0FF' },
    metric2: { label: 'GROUND STATION SLANT', value: '842', unit: 'km', sub: 'DOPPLER SHIFT: ±38.4 kHz', color: '#FF9F0A' },
    svgType: 'orbital_ground_track',
    items: [
      { id: 'SAT-CONSTELLATION-01', val: 'Inc 53.2° // RAAN 142.8° // 95.4m Period', status: 'IN_PASS', lat: 'Elev 48°' },
      { id: 'SAT-CONSTELLATION-02', val: 'Inc 53.2° // RAAN 184.2° // 95.4m Period', status: 'ACQUIRING', lat: 'Elev 12°' },
      { id: 'SAT-CONSTELLATION-03', val: 'Inc 53.2° // RAAN 228.6° // 95.4m Period', status: 'STANDBY', lat: 'LOS' },
      { id: 'ANTENNA-AZ-EL-GIMBAL', val: 'Az 184.2° / El 42.8° // 8.4°/s Slew', status: 'AUTOTRACK', lat: 'RHCP Pol' },
      { id: 'DOWNLINK-X-BAND-CNR', val: 'Freq 8.2 GHz // ModCod 32APSK-8/9', status: 'LOCK_QEF', lat: '450 Mbps' }
    ]
  }
];
