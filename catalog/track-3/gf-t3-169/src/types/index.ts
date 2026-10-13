export type DriveMode = 'EV' | 'AUTO_EV_HEV' | 'HYBRID_HEV' | 'SPORT_S_PLUS';

export type UserRole = 
  | 'CHIEF_SYSTEMS_ARCHITECT'
  | 'ACQUIRE_BUYER_ESCROW'
  | 'LEAD_POWERTRAIN_AUDITOR'
  | 'FIELD_OPERATIONS_ENGINEER';

export interface PowertrainState {
  throttlePercent: number; // 0 - 100%
  lateralG: number; // -1.00 to +1.00 G
  steeringAngleDeg: number; // -45 to +45 deg
  stateOfCharge: number; // 15 - 100%
  driveMode: DriveMode;
  regenLevel: number; // 1 - 4
  batteryTempC: number; // 25 - 55 C
  iceCoolantTempC: number; // 75 - 95 C
  inverterTempC: number; // 40 - 75 C
  tirePressurePsi: { fl: number; fr: number; rl: number; rr: number };
  brakeLineBar: number;
}

export interface CalculatedTorque {
  frontMotorTorqueNm: number; // 0 - 270 Nm
  rearMotorTorqueNm: number; // 0 - 121 Nm
  iceTorqueNm: number; // 0 - 227 Nm
  frontLeftTorqueNm: number;
  frontRightTorqueNm: number;
  rearLeftTorqueNm: number;
  rearRightTorqueNm: number;
  totalSystemPowerKw: number;
  totalSystemPowerHp: number;
  fuelConsumptionLph: number;
  cRate: number;
  mpcSolveTimeMs: number;
  thermalThrottlingFactor: number; // 0.0 to 1.0 (1.0 = full power)
  yawMomentNm: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  sequenceNumber: number;
  eventType: 'MPC_SOLVE' | 'MERKLE_ANCHOR' | 'DRIVE_MODE_SHIFT' | 'JIRA_SYNC' | 'GITHUB_SYNC' | 'ESCROW_SIGN' | 'ALERT_DISPATCH' | 'CONFIG_UPDATE';
  actorRole: UserRole;
  actorName: string;
  details: string;
  sha256Hash: string;
  status: 'VERIFIED' | 'COMMITTED' | 'DISPATCHED';
}

export interface JiraGithubTask {
  id: string;
  system: 'JIRA' | 'GITHUB';
  key: string;
  title: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'VERIFIED' | 'DONE';
  assignee: string;
  priority: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM';
  milestone: string;
  completionPercent: number;
  lastSync: string;
}

export interface SystemAlert {
  id: string;
  channel: 'SLACK' | 'PAGERDUTY' | 'SYSTEM';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metric: string;
  value: string;
  threshold: string;
  timestamp: string;
  message: string;
  acknowledged: boolean;
}

export interface MerkleNode {
  level: number;
  index: number;
  hash: string;
  isLeaf?: boolean;
  value?: string;
  verified?: boolean;
}
