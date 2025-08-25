/**
 * @fileoverview IDroneCommandQueue Repository Interface
 * 
 * 定義無人機命令佇列儲存庫介面
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-25
 */

import type { 
    DroneCommandQueueAttributes, 
    DroneCommandQueueCreationAttributes 
} from '../../models/DroneCommandQueueModel.js';
import type { PaginationParams, PaginatedResponse } from '../ApiResponseType.js';

/**
 * 無人機命令佇列儲存庫介面
 */
export interface IDroneCommandQueueRepo {
    /**
     * 創建新的命令佇列項目
     */
    create(data: DroneCommandQueueCreationAttributes): Promise<DroneCommandQueueAttributes>;

    /**
     * 根據ID查找命令佇列項目
     */
    findById(id: number): Promise<DroneCommandQueueAttributes | null>;

    /**
     * 獲取所有命令佇列項目（分頁）
     */
    findAllPaginated(params: PaginationParams): Promise<PaginatedResponse<DroneCommandQueueAttributes>>;

    /**
     * 更新命令佇列項目
     */
    update(id: number, data: Partial<DroneCommandQueueCreationAttributes>): Promise<DroneCommandQueueAttributes | null>;

    /**
     * 刪除命令佇列項目
     */
    delete(id: number): Promise<boolean>;

    /**
     * 根據無人機ID獲取命令佇列
     */
    findByDroneId(droneId: number): Promise<DroneCommandQueueAttributes[]>;

    /**
     * 獲取下一個待執行的命令
     */
    getNextPendingCommand(droneId: number): Promise<DroneCommandQueueAttributes | null>;
}