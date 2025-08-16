/**
 * 無人機位置數據接口
 */
export interface DronePosition {
  id: string;
  droneId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDronePositionRequest {
  droneId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
}

export interface UpdateDronePositionRequest {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}