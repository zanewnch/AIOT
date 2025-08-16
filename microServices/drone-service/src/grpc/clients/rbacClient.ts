/**
 * @fileoverview RBAC gRPC 客戶端
 * 
 * 用於 Drone 服務調用 RBAC 服務的 gRPC 客戶端
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
   * 獲取使用者資訊
   */
  async getUsers(request: {
    page?: number;
    limit?: number;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = {
        page: request.page || 1,
        limit: request.limit || 10,
      };

      this.client.GetUsers(req, (error: any, response: any) => {
        if (error) {
          console.error('❌ RBAC GetUsers error:', error);
          reject(error);
        } else {
          console.log('✅ RBAC GetUsers success');
          resolve(response);
        }
      });
    });
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
   * 創建新使用者
   */
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.CreateUser(userData, (error: any, response: any) => {
        if (error) {
          console.error('❌ RBAC CreateUser error:', error);
          reject(error);
        } else {
          console.log('✅ RBAC CreateUser success');
          resolve(response);
        }
      });
    });
  }

  /**
   * 驗證使用者權限 (示例方法)
   */
  async validateUserPermission(userId: number, action: string): Promise<boolean> {
    try {
      // 先獲取使用者資訊
      const userResponse = await this.getUserById(userId);
      
      if (!userResponse.success) {
        console.log(`❌ User ${userId} not found`);
        return false;
      }

      // 這裡可以加入權限檢查邏輯
      // 例如檢查使用者角色、權限等
      console.log(`✅ User ${userId} permission validated for action: ${action}`);
      return true;
    } catch (error) {
      console.error(`❌ Permission validation failed for user ${userId}:`, error);
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