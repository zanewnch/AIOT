/**
 * 無人機指令相關接口 - 匹配後端模型結構
 */
export interface DroneCommand {
  id: number;
  drone_id: number;
  command_type: 'takeoff' | 'land' | 'move' | 'hover' | 'return';
  command_data?: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  issued_by: number;
  issued_at: Date | string;
  executed_at?: Date | string | null;
  completed_at?: Date | string | null;
  error_message?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateDroneCommandRequest {
  drone_id: number;
  command_type: 'takeoff' | 'land' | 'move' | 'hover' | 'return';
  command_data?: any;
  issued_by: number;
  issued_at: Date | string;
}

export interface CreateBatchCommandsRequest {
  commands: CreateDroneCommandRequest[];
}

export interface UpdateDroneCommandRequest {
  command_type?: 'takeoff' | 'land' | 'move' | 'hover' | 'return';
  command_data?: any;
  status?: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface SendCommandRequest {
  drone_id: number;
  command_data?: any;
}

export interface DateRangeQuery {
  startDate: string;
  endDate: string;
}

export interface CommandStatistics {
  totalCommands: number;
  pendingCommands: number;
  executingCommands: number;
  completedCommands: number;
  failedCommands: number;
  cancelledCommands: number;
}

export interface CommandTypeStatistics {
  [commandType: string]: number;
}

export interface DroneCommandSummary {
  drone_id: number;
  totalCommands: number;
  recentCommands: DroneCommand[];
  statistics: CommandStatistics;
}