/**
 * @fileoverview Drone Command Queue Service Interface
 * 
 * 定義無人機命令佇列服務的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import { DroneCommandQueueModel, DroneCommandQueueCreationAttributes } from '../../models/DroneCommandQueueModel.js';

export { DroneCommandQueueCreationAttributes };

export interface IDroneCommandQueueService {
  /**
   * 創建命令佇列項目
   */
  createCommandQueue(data: DroneCommandQueueCreationAttributes): Promise<DroneCommandQueueModel>;

  /**
   * 更新命令佇列項目
   */
  updateCommandQueue(id: number, data: Partial<DroneCommandQueueCreationAttributes>): Promise<DroneCommandQueueModel | null>;

  /**
   * 刪除命令佇列項目
   */
  deleteCommandQueue(id: number): Promise<void>;

  /**
   * 批量創建命令佇列項目
   */
  createCommandQueuesBatch(data: DroneCommandQueueCreationAttributes[]): Promise<DroneCommandQueueModel[]>;

  /**
   * 執行佇列中的命令
   */
  executeQueuedCommand(id: number): Promise<void>;

  /**
   * 清空佇列
   */
  clearQueue(droneId: number): Promise<void>;
}