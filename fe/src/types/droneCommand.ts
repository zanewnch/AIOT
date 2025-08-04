/**
 * 無人機指令相關接口
 */
export interface DroneCommand {
  id: string;
  droneId: string;
  commandType: string;
  parameters?: any;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  issuedBy: string;
  issuedAt: string;
  executedAt?: string;
  completedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDroneCommandRequest {
  droneId: string;
  commandType: string;
  parameters?: any;
  maxRetries?: number;
}

export interface CreateBatchCommandsRequest {
  commands: CreateDroneCommandRequest[];
}

export interface UpdateDroneCommandRequest {
  commandType?: string;
  parameters?: any;
  status?: string;
  maxRetries?: number;
}

export interface SendCommandRequest {
  droneId: string;
  parameters?: any;
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
  droneId: string;
  totalCommands: number;
  recentCommands: DroneCommand[];
  statistics: CommandStatistics;
}