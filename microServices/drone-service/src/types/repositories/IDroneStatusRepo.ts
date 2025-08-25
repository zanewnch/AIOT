export interface IDroneStatusRepo {
  create(data: any): Promise<any>;
  findById(id: number): Promise<any>;
  selectAll(limit?: number): Promise<any[]>;
  findByDroneId(droneId: number): Promise<any[]>;
  findByStatus(status: string): Promise<any[]>;
  findByTimeRange(start: Date, end: Date): Promise<any[]>;
  findLatest(limit?: number): Promise<any[]>;
  findLatestByDroneId(droneId: number): Promise<any>;
  count(): Promise<number>;
  countByDroneId(droneId: number): Promise<number>;
  countByTimeRange(start: Date, end: Date): Promise<number>;
  countByStatus(status: string): Promise<number>;
  findByBatteryRange(min: number, max: number): Promise<any[]>;
  findActiveStatuses(): Promise<any[]>;
  findInactiveStatuses(): Promise<any[]>;
  
  // 新增缺失的方法
  update(id: number, data: any): Promise<any>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, status: any): Promise<any>;
}