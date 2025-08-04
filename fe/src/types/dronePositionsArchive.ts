/**
 * 無人機位置歷史歸檔相關接口
 */
export interface DronePositionArchive {
  id: string;
  originalId: string;
  droneId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  batteryLevel: number;
  timestamp: string;
  batchId: string;
  archivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePositionArchiveRequest {
  originalId: string;
  droneId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  batteryLevel: number;
  timestamp: string;
  batchId?: string;
}

export interface BulkCreatePositionArchivesRequest {
  archives: CreatePositionArchiveRequest[];
}

export interface TimeRangeQuery {
  startTime: string;
  endTime: string;
  droneId?: string;
}

export interface GeoBoundsQuery {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  startTime?: string;
  endTime?: string;
}

export interface TrajectoryQuery {
  droneId: string;
  startTime: string;
  endTime: string;
}

export interface TrajectoryStatistics {
  totalDistance: number;
  averageSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  totalFlightTime: number;
  averageAltitude: number;
  maxAltitude: number;
  minAltitude: number;
}

export interface BatteryUsageStatistics {
  initialBatteryLevel: number;
  finalBatteryLevel: number;
  averageBatteryLevel: number;
  batteryConsumptionRate: number;
  lowBatteryEvents: number;
}

export interface PositionDistributionStatistics {
  latitudeRange: { min: number; max: number };
  longitudeRange: { min: number; max: number };
  altitudeRange: { min: number; max: number };
  coverage: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
}

export interface FlightPatterns {
  commonRoutes: Array<{
    startPosition: { latitude: number; longitude: number };
    endPosition: { latitude: number; longitude: number };
    frequency: number;
  }>;
  frequentAreas: Array<{
    center: { latitude: number; longitude: number };
    radius: number;
    visitCount: number;
  }>;
  flightDurations: {
    average: number;
    min: number;
    max: number;
  };
}

export interface AnomalousPositions {
  positions: Array<{
    id: string;
    position: DronePositionArchive;
    anomalyType: string;
    confidence: number;
    reason: string;
  }>;
  summary: {
    totalAnomalies: number;
    anomalyTypes: { [type: string]: number };
  };
}

export interface TrajectorySummaryReport {
  droneId: string;
  reportPeriod: { start: string; end: string };
  statistics: TrajectoryStatistics;
  batteryUsage: BatteryUsageStatistics;
  positionDistribution: PositionDistributionStatistics;
  flightPatterns: FlightPatterns;
  anomalies: AnomalousPositions;
  totalRecords: number;
}