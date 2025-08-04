/**
 * 無人機狀態相關接口
 */
export interface DroneStatus {
  id: string;
  serialNumber: string;
  name: string;
  model: string;
  manufacturer: string;
  status: 'idle' | 'flying' | 'charging' | 'maintenance' | 'offline' | 'error';
  batteryLevel: number;
  lastSeen: string;
  ownerId: string;
  registrationDate: string;
  firmwareVersion: string;
  maxFlightTime: number;
  maxRange: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDroneStatusRequest {
  serialNumber: string;
  name: string;
  model: string;
  manufacturer: string;
  ownerId: string;
  firmwareVersion?: string;
  maxFlightTime?: number;
  maxRange?: number;
}

export interface UpdateDroneStatusRequest {
  name?: string;
  model?: string;
  manufacturer?: string;
  status?: string;
  batteryLevel?: number;
  ownerId?: string;
  firmwareVersion?: string;
  maxFlightTime?: number;
  maxRange?: number;
  isActive?: boolean;
}

export interface UpdateDroneStatusOnlyRequest {
  status: string;
  batteryLevel?: number;
}

export interface DroneStatusStatistics {
  totalDrones: number;
  activeDrones: number;
  idleDrones: number;
  flyingDrones: number;
  chargingDrones: number;
  maintenanceDrones: number;
  offlineDrones: number;
  errorDrones: number;
  averageBatteryLevel: number;
}