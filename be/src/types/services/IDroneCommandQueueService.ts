/**
 * @fileoverview 無人機指令佇列服務介面定義
 * 
 * 定義無人機指令佇列業務邏輯層的抽象介面，規範所有佇列管理相關的業務操作方法。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * 無人機指令佇列創建屬性介面
 */
export interface DroneCommandQueueCreationAttributes {
    drone_id: number;
    command_type: string;
    command_data?: any;
    priority?: number;
    status?: string;
    scheduled_at?: Date;
}

/**
 * 無人機指令佇列屬性介面
 */
export interface DroneCommandQueueAttributes extends DroneCommandQueueCreationAttributes {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 佇列統計資料介面
 */
export interface QueueStatistics {
    totalQueues: number;
    pendingQueues: number;
    executingQueues: number;
    completedQueues: number;
    failedQueues: number;
}

/**
 * 無人機指令佇列服務介面
 */
export interface IDroneCommandQueueService {
    /**
     * 取得所有指令佇列
     */
    getAllDroneCommandQueues(): Promise<DroneCommandQueueAttributes[]>;

    /**
     * 根據 ID 取得指令佇列
     */
    getDroneCommandQueueById(id: number): Promise<DroneCommandQueueAttributes | null>;

    /**
     * 根據無人機 ID 取得指令佇列
     */
    getDroneCommandQueueByDroneId(droneId: number): Promise<DroneCommandQueueAttributes[]>;

    /**
     * 根據狀態取得指令佇列
     */
    getDroneCommandQueuesByStatus(status: string): Promise<DroneCommandQueueAttributes[]>;

    /**
     * 根據優先級取得指令佇列
     */
    getDroneCommandQueuesByPriority(priority: number): Promise<DroneCommandQueueAttributes[]>;

    /**
     * 取得待執行的指令佇列
     */
    getPendingDroneCommandQueues(): Promise<DroneCommandQueueAttributes[]>;

    /**
     * 取得佇列統計
     */
    getDroneCommandQueueStatistics(): Promise<QueueStatistics>;

    /**
     * 取得下一個指令
     */
    getNextDroneCommand(droneId: number): Promise<DroneCommandQueueAttributes | null>;

    /**
     * 創建指令佇列
     */
    createDroneCommandQueue(data: DroneCommandQueueCreationAttributes): Promise<DroneCommandQueueAttributes>;

    /**
     * 更新指令佇列
     */
    updateDroneCommandQueue(id: number, data: Partial<DroneCommandQueueCreationAttributes>): Promise<DroneCommandQueueAttributes | null>;

    /**
     * 刪除指令佇列
     */
    deleteDroneCommandQueue(id: number): Promise<number>;

    /**
     * 將指令加入佇列
     */
    enqueueDroneCommand(droneId: number, commandType: string, commandData?: any, priority?: number): Promise<DroneCommandQueueAttributes>;

    /**
     * 從佇列中取出指令
     */
    dequeueDroneCommand(droneId: number): Promise<DroneCommandQueueAttributes | null>;

    /**
     * 清空指令佇列
     */
    clearDroneCommandQueue(droneId: number): Promise<number>;

    /**
     * 更新佇列狀態
     */
    updateDroneCommandQueueStatus(id: number, status: string): Promise<DroneCommandQueueAttributes | null>;
}