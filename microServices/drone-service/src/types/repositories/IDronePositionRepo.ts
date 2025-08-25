export interface IDronePositionRepositorysitory {
  create(data: any): Promise<any>;
  update(id: number, data: any): Promise<any>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<any>;
  selectAll(limit?: number): Promise<any[]>;
  findByDroneId(droneId: number): Promise<any[]>;
  findByTimeRange(start: Date, end: Date): Promise<any[]>;
  findLatest(limit?: number): Promise<any[]>;
  findLatestByDroneId(droneId: number): Promise<any>;
  count(): Promise<number>;
  countByDroneId(droneId: number): Promise<number>;
  countByTimeRange(start: Date, end: Date): Promise<number>;
  findByAltitudeRange(min: number, max: number): Promise<any[]>;
  findBySpeedRange(min: number, max: number): Promise<any[]>;
  findByCoordinateRange(bounds: any): Promise<any[]>;
}