/**
 * @fileoverview FeSetting gRPC 客戶端
 * 
 * 用於 Drone 服務調用 FeSetting 服務的 gRPC 客戶端
 * 
 * @module gRPC/Clients/FeSettingClient
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
 * FeSetting gRPC 客戶端類別
 */
export class FeSettingGrpcClient {
  private client: any;
  private serviceUrl: string;

  constructor() {
    // 從環境變數獲取 FeSetting 服務地址
    this.serviceUrl = process.env.FESETTING_SERVICE_URL || 'aiot-fesetting-service:50053';
    this.initializeClient();
  }

  /**
   * 初始化 gRPC 客戶端
   */
  private initializeClient(): void {
    // 載入 FeSetting proto 文件
    const PROTO_PATH = path.join(__dirname, '../../../proto/fesetting.proto');
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const feSettingProto = grpc.loadPackageDefinition(packageDefinition) as any;
    
    // 創建 gRPC 客戶端
    this.client = new feSettingProto.fesetting.FeSettingService(
      this.serviceUrl,
      grpc.credentials.createInsecure()
    );

    console.log(`🔗 FeSetting gRPC Client initialized: ${this.serviceUrl}`);
  }

  /**
   * 獲取使用者偏好設定
   */
  async getUserPreferences(request: {
    user_id: number;
    category?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetUserPreferences(request, (error: any, response: any) => {
        if (error) {
          console.error('❌ FeSetting GetUserPreferences error:', error);
          reject(error);
        } else {
          console.log(`✅ FeSetting GetUserPreferences success for user ${request.user_id}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * 創建使用者偏好設定
   */
  async createUserPreference(preferenceData: {
    user_id: number;
    preference_key: string;
    preference_value: string;
    category?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.CreateUserPreference(preferenceData, (error: any, response: any) => {
        if (error) {
          console.error('❌ FeSetting CreateUserPreference error:', error);
          reject(error);
        } else {
          console.log(`✅ FeSetting CreateUserPreference success for user ${preferenceData.user_id}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * 更新使用者偏好設定
   */
  async updateUserPreference(request: {
    preference_id: number;
    preference_value: string;
    category?: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.UpdateUserPreference(request, (error: any, response: any) => {
        if (error) {
          console.error('❌ FeSetting UpdateUserPreference error:', error);
          reject(error);
        } else {
          console.log(`✅ FeSetting UpdateUserPreference success for preference ${request.preference_id}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * 獲取使用者的無人機相關偏好設定
   */
  async getUserDronePreferences(userId: number): Promise<any> {
    try {
      const response = await this.getUserPreferences({
        user_id: userId,
        category: 'drone'
      });
      
      return response;
    } catch (error) {
      console.error(`❌ Failed to get drone preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 設置使用者的無人機操作偏好
   */
  async setUserDronePreference(userId: number, key: string, value: string): Promise<any> {
    try {
      const preferenceData = {
        user_id: userId,
        preference_key: key,
        preference_value: value,
        category: 'drone'
      };
      
      const response = await this.createUserPreference(preferenceData);
      return response;
    } catch (error) {
      console.error(`❌ Failed to set drone preference for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 關閉 gRPC 連接
   */
  close(): void {
    if (this.client) {
      this.client.close();
      console.log('🔌 FeSetting gRPC Client connection closed');
    }
  }
}