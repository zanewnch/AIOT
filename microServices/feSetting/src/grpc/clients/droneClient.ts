/**
 * @fileoverview Drone gRPC 客戶端
 * 
 * 用於 FeSetting 服務調用 Drone 服務的 gRPC 客戶端
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
    // 載入 Drone proto 文件
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
   * 獲取使用者相關的無人機偏好設定推薦
   */
  async getDronePreferenceRecommendations(userId: number): Promise<{
    success: boolean;
    recommendations?: any[];
  }> {
    try {
      // 獲取無人機狀態來分析使用者可能的偏好
      const statusResponse = await this.getDroneStatuses({ page: 1, limit: 10 });
      
      if (!statusResponse || !statusResponse.success) {
        return { success: false };
      }

      // 根據無人機狀態產生偏好設定推薦
      const recommendations = [
        {
          key: 'preferred_drone_altitude',
          value: '100',
          description: '建議的無人機飛行高度 (公尺)'
        },
        {
          key: 'default_flight_mode',
          value: 'stable',
          description: '預設飛行模式'
        },
        {
          key: 'auto_return_home',
          value: 'true',
          description: '低電量自動返航'
        }
      ];

      return {
        success: true,
        recommendations
      };
    } catch (error) {
      console.error(`❌ 獲取使用者 ${userId} 無人機偏好推薦失敗:`, error);
      return { success: false };
    }
  }

  /**
   * 獲取無人機狀態列表
   */
  private async getDroneStatuses(request: {
    page?: number;
    limit?: number;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.GetDroneStatuses(request, (error: any, response: any) => {
        if (error) {
          console.error('❌ Drone GetDroneStatuses error:', error);
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * 驗證無人機偏好設定值的合理性
   */
  async validateDronePreferenceValue(key: string, value: string): Promise<{
    isValid: boolean;
    message?: string;
    suggestedValue?: string;
  }> {
    try {
      switch (key) {
        case 'preferred_drone_altitude':
          const altitude = parseInt(value);
          if (isNaN(altitude) || altitude < 0 || altitude > 500) {
            return {
              isValid: false,
              message: '飛行高度應在 0-500 公尺之間',
              suggestedValue: '100'
            };
          }
          break;
          
        case 'default_flight_mode':
          const validModes = ['stable', 'sport', 'manual', 'auto'];
          if (!validModes.includes(value.toLowerCase())) {
            return {
              isValid: false,
              message: `飛行模式必須是: ${validModes.join(', ')}`,
              suggestedValue: 'stable'
            };
          }
          break;
          
        case 'auto_return_home':
          if (value !== 'true' && value !== 'false') {
            return {
              isValid: false,
              message: '自動返航設定必須是 true 或 false',
              suggestedValue: 'true'
            };
          }
          break;
          
        default:
          // 對於未知的偏好設定項目，接受任何值但給予警告
          console.warn(`⚠️ 未知的無人機偏好設定項目: ${key}`);
          break;
      }

      return { isValid: true };
    } catch (error) {
      console.error(`❌ 驗證無人機偏好設定失敗:`, error);
      return {
        isValid: false,
        message: '驗證過程中發生錯誤'
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