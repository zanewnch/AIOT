/**
 * @fileoverview FeSetting gRPC 客戶端
 * 
 * 用於 RBAC 服務調用 FeSetting 服務的 gRPC 客戶端
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
   * 獲取使用者偏好設定 (用於 RBAC 決策)
   */
  async getUserSecurityPreferences(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        user_id: userId,
        category: 'security'
      };

      this.client.GetUserPreferences(request, (error: any, response: any) => {
        if (error) {
          console.error('❌ FeSetting GetUserSecurityPreferences error:', error);
          reject(error);
        } else {
          console.log(`✅ FeSetting GetUserSecurityPreferences success for user ${userId}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * 設置使用者安全偏好
   */
  async setUserSecurityPreference(userId: number, key: string, value: string): Promise<any> {
    try {
      const preferenceData = {
        user_id: userId,
        preference_key: key,
        preference_value: value,
        category: 'security'
      };

      return new Promise((resolve, reject) => {
        this.client.CreateUserPreference(preferenceData, (error: any, response: any) => {
          if (error) {
            console.error('❌ FeSetting CreateUserPreference error:', error);
            reject(error);
          } else {
            console.log(`✅ FeSetting CreateUserPreference success for user ${userId}`);
            resolve(response);
          }
        });
      });
    } catch (error) {
      console.error(`❌ Failed to set security preference for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 記錄使用者登入偏好
   */
  async recordLoginPreference(userId: number, loginData: {
    loginTime: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await this.setUserSecurityPreference(
        userId,
        'last_login',
        JSON.stringify(loginData)
      );
    } catch (error) {
      console.warn('⚠️ 記錄登入偏好失敗:', error);
      // 不影響主要功能
    }
  }

  /**
   * 獲取使用者的 RBAC 相關偏好設定
   */
  async getUserRbacPreferences(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        user_id: userId,
        category: 'rbac'
      };

      this.client.GetUserPreferences(request, (error: any, response: any) => {
        if (error) {
          console.error('❌ FeSetting GetUserRbacPreferences error:', error);
          reject(error);
        } else {
          console.log(`✅ FeSetting GetUserRbacPreferences success for user ${userId}`);
          resolve(response);
        }
      });
    });
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