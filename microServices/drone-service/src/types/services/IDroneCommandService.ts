/**
 * @fileoverview Drone Command Service Interface
 * 
 * 定義無人機命令服務的介面規範
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-08
 */

import { DroneCommandModel, DroneCommandCreationAttributes, DroneCommandStatus } from '../../models/DroneCommandModel.js';

export interface CommandExecutionResult {
  success: boolean;
  command: DroneCommandModel | null;
  message: string;
  error?: string;
}

export interface BatchCommandResult {
  successCount: number;
  failureCount: number;
  results?: CommandExecutionResult[];
  successful: DroneCommandModel[];
  failed: Array<{ command: DroneCommandCreationAttributes; error: string }>;
  total: number;
}

export interface CommandStatistics {
  totalCommands: number;
  pendingCommands: number;
  executingCommands: number;
  completedCommands: number;
  failedCommands: number;
  successRate?: number; // 成功率
}

export interface CommandTypeStatistics {
  [key: string]: number;
}

export interface DroneCommandSummary {
  id: number;
  drone_id: number;
  droneId: number; // 別名，用於兼容性
  command_type: string;
  status: string;
  issued_at: Date;
  executed_at?: Date;
  completed_at?: Date;
  error_message?: string;
  totalCommands?: number; // 總命令數量，用於統計
}

export interface IDroneCommandService {
  /**
   * 創建命令
   */
  createCommand(data: DroneCommandCreationAttributes): Promise<DroneCommandModel>;

  /**
   * 更新命令
   */
  updateCommand(id: number, data: Partial<DroneCommandCreationAttributes>): Promise<DroneCommandModel | null>;

  /**
   * 刪除命令
   */
  deleteCommand(id: number): Promise<void>;
}