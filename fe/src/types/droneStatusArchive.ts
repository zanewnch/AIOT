/**
 * 無人機狀態歷史歸檔相關接口
 */
export interface DroneStatusArchive {
  id: string;
  droneId: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  metadata?: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStatusArchiveRequest {
  droneId: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  metadata?: any;
}

export interface UpdateStatusArchiveRequest {
  reason?: string;
  metadata?: any;
}

export interface StatusTransitionQuery {
  fromStatus?: string;
  toStatus?: string;
  droneId?: string;
}

export interface StatusChangeStatistics {
  totalChanges: number;
  statusDistribution: { [status: string]: number };
  reasonDistribution: { [reason: string]: number };
  transitionMatrix: { [from: string]: { [to: string]: number } };
  changesByDrone: { [droneId: string]: number };
  changesByUser: { [userId: string]: number };
  averageChangesPerDay: number;
  mostActiveHours: Array<{ hour: number; count: number }>;
}