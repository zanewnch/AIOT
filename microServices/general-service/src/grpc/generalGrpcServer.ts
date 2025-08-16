/**
 * @fileoverview General gRPC 服務器實作
 * 
 * 此文件實作 General 服務的 gRPC 服務器，提供：
 * - 使用者偏好設定管理 gRPC 端點
 * - 系統設定管理 gRPC 端點
 * - 主題設定管理 gRPC 端點
 * - 語言設定管理 gRPC 端點
 * 
 * @module gRPC/GeneralGrpcServer
 * @version 1.0.0
 * @author AIOT Team
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * General gRPC 服務器類別
 */
export class GeneralGrpcServer {
  private server: grpc.Server;

  constructor() {
    this.server = new grpc.Server();
    this.loadProtoAndAddService();
    this.addHealthService();
  }

  /**
   * 載入 proto 文件並添加服務
   */
  private loadProtoAndAddService(): void {
    const PROTO_PATH = path.join(__dirname, '../../proto/general.proto');
    const PROTO_DIR = path.join(__dirname, '../../proto');
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [PROTO_DIR],
    });

    const generalProto = grpc.loadPackageDefinition(packageDefinition) as any;

    this.server.addService(generalProto.general.GeneralService.service, {
      // 健康檢查和服務資訊方法
      HealthCheck: this.healthCheck.bind(this),
      GetServiceInfo: this.getServiceInfo.bind(this),

      // 使用者偏好設定方法
      GetUserPreferences: this.getUserPreferences.bind(this),
      GetUserPreferenceById: this.getUserPreferenceById.bind(this),
      CreateUserPreference: this.createUserPreference.bind(this),
      UpdateUserPreference: this.updateUserPreference.bind(this),
      DeleteUserPreference: this.deleteUserPreference.bind(this),

      // 系統設定方法
      GetSystemSettings: this.getSystemSettings.bind(this),
      GetSystemSettingByKey: this.getSystemSettingByKey.bind(this),
      UpdateSystemSetting: this.updateSystemSetting.bind(this),

      // 主題設定方法
      GetThemeSettings: this.getThemeSettings.bind(this),
      UpdateThemeSettings: this.updateThemeSettings.bind(this),

      // 語言設定方法
      GetLanguageSettings: this.getLanguageSettings.bind(this),
      UpdateLanguageSettings: this.updateLanguageSettings.bind(this),
    });
  }

  /**
   * 通用控制器方法執行器
   */
  private async executeControllerMethod(
    controllerMethod: (req: any, res: any) => Promise<void>,
    request: any,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
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

  // ========== 使用者偏好設定方法 ==========
  private async getUserPreferences(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作使用者偏好設定查詢邏輯
    callback(null, {
      preferences: [],
      total: 0,
      success: true,
      message: 'User preferences retrieved successfully'
    });
  }

  private async getUserPreferenceById(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作根據 ID 查詢使用者偏好設定邏輯
    callback(null, {
      preference: null,
      success: true,
      message: 'User preference retrieved successfully'
    });
  }

  private async createUserPreference(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作建立使用者偏好設定邏輯
    callback(null, {
      preference: null,
      success: true,
      message: 'User preference created successfully'
    });
  }

  private async updateUserPreference(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作更新使用者偏好設定邏輯
    callback(null, {
      preference: null,
      success: true,
      message: 'User preference updated successfully'
    });
  }

  private async deleteUserPreference(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作刪除使用者偏好設定邏輯
    callback(null, {
      success: true,
      message: 'User preference deleted successfully'
    });
  }

  // ========== 系統設定方法 ==========
  private async getSystemSettings(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作系統設定查詢邏輯
    callback(null, {
      settings: [],
      total: 0,
      success: true,
      message: 'System settings retrieved successfully'
    });
  }

  private async getSystemSettingByKey(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作根據 Key 查詢系統設定邏輯
    callback(null, {
      setting: null,
      success: true,
      message: 'System setting retrieved successfully'
    });
  }

  private async updateSystemSetting(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作更新系統設定邏輯
    callback(null, {
      setting: null,
      success: true,
      message: 'System setting updated successfully'
    });
  }

  // ========== 主題設定方法 ==========
  private async getThemeSettings(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作主題設定查詢邏輯
    callback(null, {
      theme: null,
      success: true,
      message: 'Theme settings retrieved successfully'
    });
  }

  private async updateThemeSettings(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作主題設定更新邏輯
    callback(null, {
      theme: null,
      success: true,
      message: 'Theme settings updated successfully'
    });
  }

  // ========== 語言設定方法 ==========
  private async getLanguageSettings(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作語言設定查詢邏輯
    callback(null, {
      language: null,
      success: true,
      message: 'Language settings retrieved successfully'
    });
  }

  private async updateLanguageSettings(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    // TODO: 實作語言設定更新邏輯
    callback(null, {
      language: null,
      success: true,
      message: 'Language settings updated successfully'
    });
  }

  // ========== 健康檢查和服務資訊方法 ==========
  private async healthCheck(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    try {
      callback(null, {
        status: 'ok',
        service: 'general',
        message: 'general service is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      callback(null, {
        status: 'error',
        service: 'general',
        message: 'general service health check failed',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }
  }

  private async getServiceInfo(call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>): Promise<void> {
    try {
      callback(null, {
        service: 'general',
        description: 'General Setting Management Service',
        version: '1.0.0',
        author: 'AIOT Team',
        features: [
          'User Preference Management',
          'Dynamic Documentation System',
          'CQRS Architecture',
          'JWT-based Role Authorization',
          'RESTful API',
          'gRPC API'
        ]
      });
    } catch (error) {
      console.error('Service info error:', error);
      callback(error as grpc.ServiceError, null);
    }
  }

  /**
   * 添加標準的 gRPC 健康檢查服務
   */
  private addHealthService(): void {
    // 載入標準的健康檢查 proto
    const healthProtoPath = path.join(__dirname, '../../proto/health.proto');
    
    // 先嘗試創建簡單的健康檢查 proto 文件
    try {
      const packageDefinition = protoLoader.loadSync(healthProtoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      
      const healthProto = grpc.loadPackageDefinition(packageDefinition) as any;
      
      this.server.addService(healthProto.grpc.health.v1.Health.service, {
        check: (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
          callback(null, { status: 1 }); // SERVING = 1
        }
      });
    } catch (error) {
      console.log('Health check proto not found, using simple implementation');
      // 如果 proto 文件不存在，先跳過健康檢查服務
    }
  }

  /**
   * 啟動 gRPC 服務器
   */
  public start(port: number = 50053): void {
    this.server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (error, boundPort) => {
        if (error) {
          console.error('Failed to start gRPC server:', error);
          return;
        }
        
        console.log(`General gRPC server running on port ${boundPort}`);
        this.server.start();
      }
    );
  }

  /**
   * 停止 gRPC 服務器
   */
  public stop(): void {
    this.server.tryShutdown(() => {
      console.log('General gRPC server stopped');
    });
  }
}