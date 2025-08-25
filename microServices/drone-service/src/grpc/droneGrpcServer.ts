/**
 * @fileoverview Drone gRPC 服務器實作
 * 
 * 此文件實作 Drone 服務的 gRPC 服務器，提供：
 * - 無人機狀態管理 gRPC 端點
 * - 無人機位置管理 gRPC 端點
 * - 無人機命令管理 gRPC 端點
 * - 無人機命令佇列管理 gRPC 端點
 * - 無人機即時狀態管理 gRPC 端點
 * - 封存任務管理 gRPC 端點
 * 
 * @module gRPC/DroneGrpcServer
 * @version 1.0.0
 * @author AIOT Team
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { container } from '../container/container.js';
import { TYPES } from '../container/types.js';
import { grpcServiceManager } from './clients/grpcServiceManager.js';
import path from 'path';
import { fileURLToPath } from 'url';

// 導入控制器
import { DroneStatusQueriesCtrl } from '../controllers/queries/DroneStatusQueriesController.js';
import { DroneStatusCommandsCtrl } from '../controllers/commands/DroneStatusCommandsController.js';
import { DronePositionQueriesCtrl } from '../controllers/queries/DronePositionQueriesController.js';
import { DronePositionCommandsCtrl } from '../controllers/commands/DronePositionCommandsController.js';
import { DroneCommandQueriesCtrl } from '../controllers/queries/DroneCommandQueriesController.js';
import { DroneCommandCommandsCtrl } from '../controllers/commands/DroneCommandCommandsController.js';
import { DroneCommandQueueQueriesCtrl } from '../controllers/queries/DroneCommandQueueQueriesController.js';
import { DroneCommandQueueCommandsCtrl } from '../controllers/commands/DroneCommandQueueCommandsController.js';
import { DroneRealTimeStatusQueriesCtrl } from '../controllers/queries/DroneRealTimeStatusQueriesController.js';
import { DroneRealTimeStatusCommandsCtrl } from '../controllers/commands/DroneRealTimeStatusCommandsController.js';
import { ArchiveTaskQueriesCtrl } from '../controllers/queries/ArchiveTaskQueriesController.js';
import { ArchiveTaskCommandsCtrl } from '../controllers/commands/ArchiveTaskCommandsController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Drone gRPC 服務器類別
 */
export class DroneGrpcServer {
  private server: grpc.Server;
  
  // 狀態控制器
  private droneStatusQueries: DroneStatusQueriesController;
  private droneStatusCommands: DroneStatusCommandsController;
  
  // 位置控制器
  private dronePositionQueries: DronePositionQueriesController;
  private dronePositionCommands: DronePositionCommandsController;
  
  // 命令控制器
  private droneCommandQueries: DroneCommandQueriesController;
  private droneCommandCommands: DroneCommandCommandsController;
  
  // 命令佇列控制器
  private droneCommandQueueQueries: DroneCommandQueueQueriesController;
  private droneCommandQueueCommands: DroneCommandQueueCommandsController;
  
  // 即時狀態控制器
  private droneRealTimeStatusQueries: DroneRealTimeStatusQueriesController;
  private droneRealTimeStatusCommands: DroneRealTimeStatusCommandsController;
  
  // 封存任務控制器
  private archiveTaskQueries: ArchiveTaskQueriesController;
  private archiveTaskCommands: ArchiveTaskCommandsController;

  constructor() {
    this.server = new grpc.Server({
      'grpc.keepalive_time_ms': 30000,
      'grpc.keepalive_timeout_ms': 5000,
      'grpc.keepalive_permit_without_calls': 1,
      'grpc.http2.max_pings_without_data': 0,
      'grpc.http2.min_time_between_pings_ms': 10000,
      'grpc.http2.min_ping_interval_without_data_ms': 300000,
      'grpc.max_connection_idle_ms': 300000,
      'grpc.max_connection_age_ms': 30000,
      'grpc.max_connection_age_grace_ms': 5000
    });
    
    // 注入依賴
    this.droneStatusQueries = container.get<DroneStatusQueriesCtrl>(TYPES.DroneStatusQueriesCtrl);
    this.droneStatusCommands = container.get<DroneStatusCommandsCtrl>(TYPES.DroneStatusCommandsCtrl);
    this.dronePositionQueries = container.get<DronePositionQueriesCtrl>(TYPES.DronePositionQueriesCtrl);
    this.dronePositionCommands = container.get<DronePositionCommandsCtrl>(TYPES.DronePositionCommandsCtrl);
    this.droneCommandQueries = container.get<DroneCommandQueriesCtrl>(TYPES.DroneCommandQueriesCtrl);
    this.droneCommandCommands = container.get<DroneCommandCommandsCtrl>(TYPES.DroneCommandCommandsCtrl);
    this.droneCommandQueueQueries = container.get<DroneCommandQueueQueriesCtrl>(TYPES.DroneCommandQueueQueriesCtrl);
    this.droneCommandQueueCommands = container.get<DroneCommandQueueCommandsCtrl>(TYPES.DroneCommandQueueCommandsCtrl);
    this.droneRealTimeStatusQueries = container.get<DroneRealTimeStatusQueriesCtrl>(TYPES.DroneRealTimeStatusQueriesCtrl);
    this.droneRealTimeStatusCommands = container.get<DroneRealTimeStatusCommandsCtrl>(TYPES.DroneRealTimeStatusCommandsCtrl);
    this.archiveTaskQueries = container.get<ArchiveTaskQueriesCtrl>(TYPES.ArchiveTaskQueriesCtrl);
    this.archiveTaskCommands = container.get<ArchiveTaskCommandsCtrl>(TYPES.ArchiveTaskCommandsCtrl);

    this.initializeGrpcServices();
    this.loadProtoAndAddService();
  }

  /**
   * 初始化 gRPC 服務管理器
   */
  private async initializeGrpcServices(): Promise<void> {
    try {
      await grpcServiceManager.initialize();
      console.log('✅ gRPC 服務管理器初始化完成');
    } catch (error) {
      console.error('❌ gRPC 服務管理器初始化失敗:', error);
    }
  }

  /**
   * 載入 proto 文件並添加服務
   */
  private loadProtoAndAddService(): void {
    const PROTO_PATH = path.join(__dirname, '../../proto/drone.proto');
    const HEALTH_PROTO_PATH = path.join(__dirname, '../../proto/health.proto');
    const PROTO_DIR = path.join(__dirname, '../../proto');
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_DIR],
    });

    // 載入健康檢查 proto
    const healthPackageDefinition = protoLoader.loadSync(HEALTH_PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_DIR],
    });

    const droneProto = grpc.loadPackageDefinition(packageDefinition) as any;
    const healthProto = grpc.loadPackageDefinition(healthPackageDefinition) as any;

    this.server.addService(droneProto.drone.DroneService.service, {
      // 無人機狀態管理方法
      GetDroneStatuses: this.getDroneStatuses.bind(this),
      GetDroneStatusById: this.getDroneStatusById.bind(this),
      CreateDroneStatus: this.createDroneStatus.bind(this),
      UpdateDroneStatus: this.updateDroneStatus.bind(this),
      DeleteDroneStatus: this.deleteDroneStatus.bind(this),

      // 無人機位置管理方法
      GetDronePositions: this.getDronePositions.bind(this),
      GetDronePositionById: this.getDronePositionById.bind(this),
      CreateDronePosition: this.createDronePosition.bind(this),
      UpdateDronePosition: this.updateDronePosition.bind(this),
      DeleteDronePosition: this.deleteDronePosition.bind(this),

      // 無人機命令管理方法
      GetDroneCommands: this.getDroneCommands.bind(this),
      GetDroneCommandById: this.getDroneCommandById.bind(this),
      CreateDroneCommand: this.createDroneCommand.bind(this),
      UpdateDroneCommand: this.updateDroneCommand.bind(this),
      DeleteDroneCommand: this.deleteDroneCommand.bind(this),

      // 無人機命令佇列管理方法
      GetDroneCommandQueue: this.getDroneCommandQueue.bind(this),
      AddToCommandQueue: this.addToCommandQueue.bind(this),
      RemoveFromCommandQueue: this.removeFromCommandQueue.bind(this),

      // 無人機即時狀態方法
      GetDroneRealTimeStatus: this.getDroneRealTimeStatus.bind(this),
      UpdateDroneRealTimeStatus: this.updateDroneRealTimeStatus.bind(this),

      // 封存任務管理方法
      GetArchiveTasks: this.getArchiveTasks.bind(this),
      CreateArchiveTask: this.createArchiveTask.bind(this),
    });

    // 添加健康檢查服務
    this.server.addService(healthProto.grpc.health.v1.Health.service, {
      Check: this.healthCheck.bind(this),
      Watch: this.healthWatch.bind(this),
    });
  }

  /**
   * 獲取使用者相關資訊 (用於豐富化處理)
   */
  private async enrichWithUserInfo(request: any): Promise<void> {
    try {
      const userId = request.user_id || request.userId;
      if (!userId) {
        return; // 沒有使用者 ID，跳過
      }

      // 獲取使用者資訊和偏好設定來豐富化請求
      const userInfo = await grpcServiceManager.getUserInfoAndPreferences(userId);
      if (userInfo.success) {
        request._userInfo = userInfo.user;
        request._userPreferences = userInfo.preferences;
        console.log(`✅ 已為使用者 ${userId} 載入資訊和偏好設定`);
      }
    } catch (error) {
      console.warn('⚠️ 獲取使用者資訊失敗，繼續執行:', error);
      // 不影響主要流程
    }
  }

  /**
   * 記錄使用者操作偏好
   */
  private async recordUserOperation(userId: number, operation: string, droneId: string, operationData: any): Promise<void> {
    try {
      await grpcServiceManager.recordUserPreference(userId, operation, {
        drone_id: droneId,
        timestamp: new Date().toISOString(),
        operation_data: operationData
      });
    } catch (error) {
      console.warn('⚠️ 記錄使用者操作偏好失敗:', error);
      // 不影響主要功能
    }
  }

  /**
   * 將 Express 控制器轉換為 gRPC 回調格式 (簡化版本，移除權限檢查)
   */
  private async executeControllerMethod(
    controllerMethod: (req: any, res: any) => Promise<void>,
    request: any,
    callback: grpc.sendUnaryData<any>,
    options: {
      enrichUserInfo?: boolean;
      action?: string;
    } = {}
  ): Promise<void> {
    try {
      // 豐富化使用者資訊 (如果需要)
      if (options.enrichUserInfo) {
        await this.enrichWithUserInfo(request);
      }

      // 模擬 Express req/res 物件
      const mockReq = {
        body: request,
        params: request,
        query: request,
      };

      let responseData: any;
      const mockRes = {
        json: (data: any) => {
          responseData = data;
        },
        status: (code: number) => ({
          json: (data: any) => {
            responseData = { ...data, statusCode: code };
          }
        })
      };

      await controllerMethod(mockReq, mockRes);
      
      // 記錄使用者操作偏好 (如果適用)
      if (options.enrichUserInfo && options.action && request.user_id) {
        await this.recordUserOperation(
          request.user_id,
          options.action,
          request.drone_id || 'unknown',
          request
        );
      }

      // 轉換為 gRPC 格式回應
      callback(null, {
        success: responseData?.status === 200,
        message: responseData?.message || '',
        ...responseData?.data,
      });
    } catch (error) {
      console.error('gRPC method execution error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Internal server error',
      });
    }
  }

  // ========== 無人機狀態管理方法 ==========
  private async getDroneStatuses(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneStatusQueries.getAllStatusesPaginated.bind(this.droneStatusQueries), call.request, callback);
  }

  private async getDroneStatusById(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneStatusQueries.getStatusesByDroneIdPaginated.bind(this.droneStatusQueries), { droneId: call.request.status_id }, callback);
  }

  private async createDroneStatus(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneStatusCommands.createDroneStatus.bind(this.droneStatusCommands), call.request, callback);
  }

  private async updateDroneStatus(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneStatusCommands.updateDroneStatus.bind(this.droneStatusCommands), 
      { id: call.request.status_id, ...call.request }, callback);
  }

  private async deleteDroneStatus(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneStatusCommands.deleteDroneStatus.bind(this.droneStatusCommands), { id: call.request.status_id }, callback);
  }

  // ========== 無人機位置管理方法 ==========
  private async getDronePositions(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.dronePositionQueries.getAllPositionsPaginated.bind(this.dronePositionQueries), call.request, callback);
  }

  private async getDronePositionById(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.dronePositionQueries.getAllPositionsPaginated.bind(this.dronePositionQueries), call.request, callback);
  }

  private async createDronePosition(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.dronePositionCommands.createDronePosition.bind(this.dronePositionCommands), call.request, callback);
  }

  private async updateDronePosition(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.dronePositionCommands.updateDronePosition.bind(this.dronePositionCommands), 
      { id: call.request.position_id, ...call.request }, callback);
  }

  private async deleteDronePosition(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.dronePositionCommands.deleteDronePosition.bind(this.dronePositionCommands), { id: call.request.position_id }, callback);
  }

  // ========== 無人機命令管理方法 ==========
  private async getDroneCommands(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneCommandQueries.getAllCommandsPaginated.bind(this.droneCommandQueries), call.request, callback);
  }

  private async getDroneCommandById(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneCommandQueries.getAllCommandsPaginated.bind(this.droneCommandQueries), call.request, callback);
  }

  private async createDroneCommand(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // Create wrapper to match expected signature (req, res) instead of (req, res, next)
    const wrapperMethod = async (req: any, res: any): Promise<void> => {
      return await this.droneCommandCommands.createCommand(req, res, () => {}); 
    };
    
    await this.executeControllerMethod(
      wrapperMethod, 
      call.request, 
      callback,
      {
        enrichUserInfo: true,
        action: 'drone:command:create'
      }
    );
  }

  private async updateDroneCommand(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    const wrapperMethod = async (req: any, res: any): Promise<void> => {
      return await this.droneCommandCommands.updateCommand(req, res, () => {}); 
    };
    
    await this.executeControllerMethod(
      wrapperMethod, 
      { id: call.request.command_id, ...call.request }, 
      callback,
      {
        enrichUserInfo: true,
        action: 'drone:command:update'
      }
    );
  }

  private async deleteDroneCommand(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    const wrapperMethod = async (req: any, res: any): Promise<void> => {
      return await this.droneCommandCommands.deleteCommand(req, res, () => {}); 
    };
    
    await this.executeControllerMethod(
      wrapperMethod, 
      { id: call.request.command_id }, 
      callback,
      {
        enrichUserInfo: true,
        action: 'drone:command:delete'
      }
    );
  }

  // ========== 無人機命令佇列管理方法 ==========
  private async getDroneCommandQueue(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneCommandQueueQueries.getAllDroneCommandQueuesPaginated.bind(this.droneCommandQueueQueries), call.request, callback);
  }

  private async addToCommandQueue(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    const wrapperMethod = async (req: any, res: any): Promise<void> => {
      return await this.droneCommandQueueCommands.addCommandToQueue(req, res, () => {}); 
    };
    
    await this.executeControllerMethod(wrapperMethod, call.request, callback);
  }

  private async removeFromCommandQueue(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    const wrapperMethod = async (req: any, res: any): Promise<void> => {
      return await this.droneCommandQueueCommands.dequeueDroneCommand(req, res, () => {}); 
    };
    
    await this.executeControllerMethod(wrapperMethod, { id: call.request.queue_id }, callback);
  }

  // ========== 無人機即時狀態方法 ==========
  private async getDroneRealTimeStatus(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneRealTimeStatusQueries.getAllRealTimeStatusesPaginated.bind(this.droneRealTimeStatusQueries), call.request, callback);
  }

  private async updateDroneRealTimeStatus(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    const wrapperMethod = async (req: any, res: any): Promise<void> => {
      return await this.droneRealTimeStatusCommands.updateDroneRealTimeStatus(req, res, () => {}); 
    };
    
    await this.executeControllerMethod(wrapperMethod, call.request, callback);
  }

  // ========== 封存任務管理方法 ==========
  private async getArchiveTasks(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.archiveTaskQueries.getAllTasksPaginated.bind(this.archiveTaskQueries), call.request, callback);
  }

  private async createArchiveTask(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.archiveTaskCommands.createTask.bind(this.archiveTaskCommands), call.request, callback);
  }

  /**
   * 啟動 gRPC 服務器
   */
  public start(port: number = 50052): void {
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, boundPort) => {
        if (error) {
          console.error('Failed to start gRPC server:', error);
          return;
        }
        
        console.log(`Drone gRPC server running on port ${boundPort}`);
        this.server.start();
      }
    );
  }

  /**
   * 健康檢查方法
   */
  private healthCheck(call: any, callback: grpc.sendUnaryData<any>): void {
    callback(null, { status: 1 }); // 1 = SERVING
  }

  /**
   * 健康檢查監聽方法
   */
  private healthWatch(call: any): void {
    call.write({ status: 1 }); // 1 = SERVING
  }

  /**
   * 停止 gRPC 服務器
   */
  public stop(): void {
    this.server.tryShutdown(() => {
      console.log('Drone gRPC server stopped');
      // 關閉 gRPC 客戶端連接
      grpcServiceManager.close();
    });
  }
}