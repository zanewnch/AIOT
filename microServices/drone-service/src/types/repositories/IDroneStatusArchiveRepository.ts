export interface IDroneStatusArchiveRepositorysitorysitorysitory {
  create(data: any): Promise<any>;
  update(id: number, data: any): Promise<any>;
  delete(id: number): Promise<void>;
  findById(id: number): Promise<any>;
  selectAll(limit?: number): Promise<any[]>;
  findByDroneId(droneId: number): Promise<any[]>;
  findByStatus(status: string): Promise<any[]>;
  findByCreatedBy(createdBy: number): Promise<any[]>;
  findByDateRange(start: Date, end: Date): Promise<any[]>;
  findByReason(reason: string): Promise<any[]>;
  findLatest(limit?: number): Promise<any[]>;
  findLatestByDroneId(droneId: number): Promise<any>;
  findByStatusTransition(fromStatus: string, toStatus: string): Promise<any[]>;
  getStatusChangeStatistics(start: Date, end: Date): Promise<any>;
  count(): Promise<number>;
  countByDroneId(droneId: number): Promise<number>;
  countByTimeRange(start: Date, end: Date): Promise<number>;
}