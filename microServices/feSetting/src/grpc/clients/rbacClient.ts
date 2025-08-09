/**
 * @fileoverview RBAC gRPC 客戶端
 * 
 * 用於 FeSetting 服務調用 RBAC 服務的 gRPC 客戶端
 * 
 * @module gRPC/Clients/RbacClient
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
 * RBAC gRPC 客戶端類別
 */
export class RbacGrpcClient {
  private client: any;
  private serviceUrl: string;

  constructor() {
    // 從環境變數獲取 RBAC 服務地址
    this.serviceUrl = process.env.RBAC_SERVICE_URL || 'aiot-rbac-service:50051';
    this.initializeClient();
  }

  /**
   * 初始化 gRPC 客戶端
   */
  private initializeClient(): void {
    // 載入 RBAC proto 文件
    const PROTO_PATH = path.join(__dirname, '../../../proto/rbac.proto');
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const rbacProto = grpc.loadPackageDefinition(packageDefinition) as any;
    
    // 創建 gRPC 客戶端
    this.client = new rbacProto.rbac.RbacService(
      this.serviceUrl,
      grpc.credentials.createInsecure()
    );

    console.log(`🔗 RBAC gRPC Client initialized: ${this.serviceUrl}`);
  }

  /**
   * 驗證使用者是否存在 (用於偏好設定驗證)
   */
  async validateUserExists(userId: number): Promise<boolean> {
    try {
      const response = await this.getUserById(userId);
      return response && response.success;
    } catch (error) {
      console.warn(`⚠️ 使用者 ${userId} 驗證失敗:`, error);
      return false;
    }
  }

  /**
   * 根據 ID 獲取使用者
   */
  async getUserById(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = { user_id: userId };

      this.client.GetUserById(req, (error: any, response: any) => {
        if (error) {
          console.error(`❌ RBAC GetUserById error for user ${userId}:`, error);
          reject(error);
        } else {
          console.log(`✅ RBAC GetUserById success for user ${userId}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * 獲取使用者基本資訊 (用於偏好設定關聯)
   */
  async getUserBasicInfo(userId: number): Promise<{
    success: boolean;
    userInfo?: any;
  }> {
    try {
      const response = await this.getUserById(userId);
      if (response && response.success) {
        return {
          success: true,
          userInfo: {
            id: response.data?.id,
            username: response.data?.username,
            email: response.data?.email,
            roles: response.data?.roles || []
          }
        };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error(`❌ 獲取使用者 ${userId} 基本資訊失敗:`, error);
      return { success: false };
    }
  }

  /**
   * 獲取使用者角色資訊 (用於角色相關偏好設定)
   */
  async getUserRoles(userId: number): Promise<string[]> {
    try {
      const userInfo = await this.getUserBasicInfo(userId);
      if (userInfo.success && userInfo.userInfo) {
        return userInfo.userInfo.roles || [];
      }
      return [];
    } catch (error) {
      console.error(`❌ 獲取使用者 ${userId} 角色資訊失敗:`, error);
      return [];
    }
  }

  /**
   * 檢查使用者是否有特定角色 (用於偏好設定存取控制)
   */
  async checkUserHasRole(userId: number, roleName: string): Promise<boolean> {
    try {
      const roles = await this.getUserRoles(userId);
      return roles.includes(roleName);
    } catch (error) {
      console.error(`❌ 檢查使用者 ${userId} 角色 ${roleName} 失敗:`, error);
      return false;
    }
  }

  /**
   * 關閉 gRPC 連接
   */
  close(): void {
    if (this.client) {
      this.client.close();
      console.log('🔌 RBAC gRPC Client connection closed');
    }
  }
}