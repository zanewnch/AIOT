/**
 * @fileoverview Drone gRPC 客戶端
 * 
 * 用於 RBAC 服務調用 Drone 服務的 gRPC 客戶端
 * 
 * @module gRPC/Clients/DroneClient
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
 * Drone gRPC 客戶端類別
 */
export class DroneGrpcClient {
  private client: any;
  private serviceUrl: string;

  constructor() {
    // 從環境變數獲取 Drone 服務地址
    this.serviceUrl = process.env.DRONE_SERVICE_URL || 'aiot-drone-service:50052';
    this.initializeClient();
  }

  /**
   * 初始化 gRPC 客戶端
   */
  private initializeClient(): void {
    // 載入 Drone proto 文件 (需要複製到 RBAC 服務中)
    const PROTO_PATH = path.join(__dirname, '../../../proto/drone.proto');
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const droneProto = grpc.loadPackageDefinition(packageDefinition) as any;
    
    // 創建 gRPC 客戶端
    this.client = new droneProto.drone.DroneService(
      this.serviceUrl,
      grpc.credentials.createInsecure()
    );

    console.log(`🔗 Drone gRPC Client initialized: ${this.serviceUrl}`);
  }

  /**
   * 獲取無人機狀態列表
   */
  async getDroneStatuses(request: {
    page?: number;
    limit?: number;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetDroneStatuses(request, (error: any, response: any) => {
        if (error) {
          console.error('❌ Drone GetDroneStatuses error:', error);
          reject(error);
        } else {
          console.log('✅ Drone GetDroneStatuses success');
          resolve(response);
        }
      });
    });
  }

  /**
   * 根據 ID 獲取無人機狀態
   */
  async getDroneStatusById(statusId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = { status_id: statusId };

      this.client.GetDroneStatusById(req, (error: any, response: any) => {
        if (error) {
          console.error(`❌ Drone GetDroneStatusById error for status ${statusId}:`, error);
          reject(error);
        } else {
          console.log(`✅ Drone GetDroneStatusById success for status ${statusId}`);
          resolve(response);
        }
      });
    });
  }

  /**
   * 獲取指定使用者的無人機操作統計
   */
  async getUserDroneStatistics(userId: number): Promise<any> {
    try {
      // 獲取所有無人機狀態
      const statusResponse = await this.getDroneStatuses({ page: 1, limit: 100 });
      
      // 這裡可以根據實際需求過濾和統計使用者相關的無人機資料
      return {
        success: true,
        user_id: userId,
        total_drones: statusResponse.data?.length || 0,
        message: '無人機統計資料獲取成功'
      };
    } catch (error) {
      console.error(`❌ Failed to get drone statistics for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * 檢查使用者是否有作用中的無人機
   */
  async checkUserActiveDrones(userId: number): Promise<{
    hasActiveDrones: boolean;
    activeDroneCount: number;
  }> {
    try {
      // 這裡應該根據實際業務邏輯來檢查
      // 目前只是示例實作
      const statusResponse = await this.getDroneStatuses({ page: 1, limit: 50 });
      
      // 假設我們有使用者和無人機的關聯邏輯
      const activeDroneCount = 0; // 實際應該從資料中計算
      
      return {
        hasActiveDrones: activeDroneCount > 0,
        activeDroneCount
      };
    } catch (error) {
      console.error(`❌ Failed to check active drones for user ${userId}:`, error);
      return {
        hasActiveDrones: false,
        activeDroneCount: 0
      };
    }
  }

  /**
   * 關閉 gRPC 連接
   */
  close(): void {
    if (this.client) {
      this.client.close();
      console.log('🔌 Drone gRPC Client connection closed');
    }
  }
}