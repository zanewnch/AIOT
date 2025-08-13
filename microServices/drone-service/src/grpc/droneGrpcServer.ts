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
import { DroneStatusQueriesCtrl } from '../controllers/queries/DroneStatusQueriesCtrl.js';
import { DroneStatusCommandsCtrl } from '../controllers/commands/DroneStatusCommandsCtrl.js';
import { DronePositionQueriesCtrl } from '../controllers/queries/DronePositionQueriesCtrl.js';
import { DronePositionCommandsCtrl } from '../controllers/commands/DronePositionCommandsCtrl.js';
import { DroneCommandQueriesCtrl } from '../controllers/queries/DroneCommandQueriesCtrl.js';
import { DroneCommandCommandsCtrl } from '../controllers/commands/DroneCommandCommandsCtrl.js';
import { DroneCommandQueueQueriesCtrl } from '../controllers/queries/DroneCommandQueueQueriesCtrl.js';
import { DroneCommandQueueCommandsCtrl } from '../controllers/commands/DroneCommandQueueCommandsCtrl.js';
import { DroneRealTimeStatusQueriesCtrl } from '../controllers/queries/DroneRealTimeStatusQueriesCtrl.js';
import { DroneRealTimeStatusCommandsCtrl } from '../controllers/commands/DroneRealTimeStatusCommandsCtrl.js';
import { ArchiveTaskQueriesCtrl } from '../controllers/queries/ArchiveTaskQueriesCtrl.js';
import { ArchiveTaskCommandsCtrl } from '../controllers/commands/ArchiveTaskCommandsCtrl.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Drone gRPC 服務器類別
 */
export class DroneGrpcServer {
  private server: grpc.Server;
  
  // 狀態控制器
  private droneStatusQueries: DroneStatusQueriesCtrl;
  private droneStatusCommands: DroneStatusCommandsCtrl;
  
  // 位置控制器
  private dronePositionQueries: DronePositionQueriesCtrl;
  private dronePositionCommands: DronePositionCommandsCtrl;
  
  // 命令控制器
  private droneCommandQueries: DroneCommandQueriesCtrl;
  private droneCommandCommands: DroneCommandCommandsCtrl;
  
  // 命令佇列控制器
  private droneCommandQueueQueries: DroneCommandQueueQueriesCtrl;
  private droneCommandQueueCommands: DroneCommandQueueCommandsCtrl;
  
  // 即時狀態控制器
  private droneRealTimeStatusQueries: DroneRealTimeStatusQueriesCtrl;
  private droneRealTimeStatusCommands: DroneRealTimeStatusCommandsCtrl;
  
  // 封存任務控制器
  private archiveTaskQueries: ArchiveTaskQueriesCtrl;
  private archiveTaskCommands: ArchiveTaskCommandsCtrl;

  constructor() {
    this.server = new grpc.Server();
    
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
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const droneProto = grpc.loadPackageDefinition(packageDefinition) as any;

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
    await this.executeControllerMethod(this.droneStatusQueries.getDroneStatuses.bind(this.droneStatusQueries), call.request, callback);
  }

  private async getDroneStatusById(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneStatusQueries.getDroneStatusById.bind(this.droneStatusQueries), { id: call.request.status_id }, callback);
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
    await this.executeControllerMethod(this.dronePositionQueries.getDronePositions.bind(this.dronePositionQueries), call.request, callback);
  }

  private async getDronePositionById(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.dronePositionQueries.getDronePositionById.bind(this.dronePositionQueries), { id: call.request.position_id }, callback);
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
    await this.executeControllerMethod(this.droneCommandQueries.getDroneCommands.bind(this.droneCommandQueries), call.request, callback);
  }

  private async getDroneCommandById(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneCommandQueries.getDroneCommandById.bind(this.droneCommandQueries), { id: call.request.command_id }, callback);
  }

  private async createDroneCommand(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(
      this.droneCommandCommands.createDroneCommand.bind(this.droneCommandCommands), 
      call.request, 
      callback,
      {
        enrichUserInfo: true,
        action: 'drone:command:create'
      }
    );
  }

  private async updateDroneCommand(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(
      this.droneCommandCommands.updateDroneCommand.bind(this.droneCommandCommands), 
      { id: call.request.command_id, ...call.request }, 
      callback,
      {
        enrichUserInfo: true,
        action: 'drone:command:update'
      }
    );
  }

  private async deleteDroneCommand(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(
      this.droneCommandCommands.deleteDroneCommand.bind(this.droneCommandCommands), 
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
    await this.executeControllerMethod(this.droneCommandQueueQueries.getDroneCommandQueue.bind(this.droneCommandQueueQueries), call.request, callback);
  }

  private async addToCommandQueue(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneCommandQueueCommands.addToCommandQueue.bind(this.droneCommandQueueCommands), call.request, callback);
  }

  private async removeFromCommandQueue(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneCommandQueueCommands.removeFromCommandQueue.bind(this.droneCommandQueueCommands), { id: call.request.queue_id }, callback);
  }

  // ========== 無人機即時狀態方法 ==========
  private async getDroneRealTimeStatus(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneRealTimeStatusQueries.getDroneRealTimeStatus.bind(this.droneRealTimeStatusQueries), call.request, callback);
  }

  private async updateDroneRealTimeStatus(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.droneRealTimeStatusCommands.updateDroneRealTimeStatus.bind(this.droneRealTimeStatusCommands), call.request, callback);
  }

  // ========== 封存任務管理方法 ==========
  private async getArchiveTasks(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.archiveTaskQueries.getArchiveTasks.bind(this.archiveTaskQueries), call.request, callback);
  }

  private async createArchiveTask(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    await this.executeControllerMethod(this.archiveTaskCommands.createArchiveTask.bind(this.archiveTaskCommands), call.request, callback);
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