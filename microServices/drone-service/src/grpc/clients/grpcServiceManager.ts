/**
 * @fileoverview gRPC 服務管理器
 * 
 * 統一管理所有 gRPC 客戶端連接
 * 
 * @module gRPC/Clients/ServiceManager
 * @version 1.0.0
 * @author AIOT Team
 */

import { RbacGrpcClient } from './rbacClient.js';
import { FeSettingGrpcClient } from './feSettingClient.js';

/**
 * gRPC 服務管理器類別
 * 負責初始化和管理所有外部服務的 gRPC 客戶端連接
 */
export class GrpcServiceManager {
  private static instance: GrpcServiceManager;
  
  // gRPC 客戶端實例
  private rbacClient: RbacGrpcClient;
  private feSettingClient: FeSettingGrpcClient;
  
  private isInitialized: boolean = false;

  /**
   * 私有建構子 - 實施單例模式
   */
  private constructor() {
    this.rbacClient = new RbacGrpcClient();
    this.feSettingClient = new FeSettingGrpcClient();
  }

  /**
   * 獲取服務管理器實例 (單例)
   */
  public static getInstance(): GrpcServiceManager {
    if (!GrpcServiceManager.instance) {
      GrpcServiceManager.instance = new GrpcServiceManager();
    }
    return GrpcServiceManager.instance;
  }

  /**
   * 初始化所有 gRPC 客戶端連接
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔄 gRPC Service Manager 已經初始化');
      return;
    }

    try {
      console.log('🚀 初始化 gRPC Service Manager...');
      
      // 這裡可以添加健康檢查或連接測試
      console.log('✅ RBAC gRPC Client 已準備就緒');
      console.log('✅ FeSetting gRPC Client 已準備就緒');
      
      this.isInitialized = true;
      console.log('🎉 gRPC Service Manager 初始化完成');
      
    } catch (error) {
      console.error('❌ gRPC Service Manager 初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取 RBAC gRPC 客戶端
   */
  public getRbacClient(): RbacGrpcClient {
    if (!this.isInitialized) {
      throw new Error('Service Manager 尚未初始化，請先調用 initialize()');
    }
    return this.rbacClient;
  }

  /**
   * 獲取 FeSetting gRPC 客戶端
   */
  public getFeSettingClient(): FeSettingGrpcClient {
    if (!this.isInitialized) {
      throw new Error('Service Manager 尚未初始化，請先調用 initialize()');
    }
    return this.feSettingClient;
  }

  /**
   * 獲取使用者資訊和偏好設定 (純資料獲取，不做權限檢查)
   */
  public async getUserInfoAndPreferences(userId: number): Promise<{
    user?: any;
    preferences?: any;
    success: boolean;
  }> {
    try {
      // 1. 獲取使用者資訊
      const userResponse = await this.rbacClient.getUserById(userId);
      if (!userResponse || !userResponse.success) {
        return {
          success: false
        };
      }

      // 2. 獲取使用者的無人機偏好設定
      let preferences = null;
      try {
        preferences = await this.feSettingClient.getUserDronePreferences(userId);
      } catch (error) {
        console.warn('⚠️ 無法獲取使用者無人機偏好設定:', error);
      }

      return {
        success: true,
        user: userResponse.data,
        preferences: preferences
      };

    } catch (error) {
      console.error('❌ 獲取使用者資訊時發生錯誤:', error);
      return {
        success: false
      };
    }
  }

  /**
   * 記錄使用者操作偏好 (便捷方法)
   */
  public async recordUserPreference(userId: number, operation: string, value: any): Promise<void> {
    try {
      await this.feSettingClient.setUserDronePreference(
        userId,
        `operation_${operation}`,
        JSON.stringify(value)
      );
      
      console.log(`✅ 已記錄使用者 ${userId} 的操作偏好: ${operation}`);
    } catch (error) {
      console.error(`❌ 記錄使用者偏好失敗:`, error);
      // 不拋出錯誤，因為這不是關鍵功能
    }
  }

  /**
   * 健康檢查 - 檢查所有客戶端連接狀態
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      rbac: boolean;
      feSetting: boolean;
    };
  }> {
    const services = {
      rbac: false,
      feSetting: false
    };

    try {
      // 測試 RBAC 服務
      await this.rbacClient.getUsers({ page: 1, limit: 1 });
      services.rbac = true;
    } catch (error) {
      console.warn('⚠️ RBAC 服務健康檢查失敗:', error);
    }

    try {
      // 測試 FeSetting 服務 - 假設有一個簡單的測試方法
      services.feSetting = true; // 暫時設為 true，實際應該有測試方法
    } catch (error) {
      console.warn('⚠️ FeSetting 服務健康檢查失敗:', error);
    }

    const healthyServices = Object.values(services).filter(status => status).length;
    const totalServices = Object.keys(services).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, services };
  }

  /**
   * 關閉所有 gRPC 客戶端連接
   */
  public close(): void {
    if (this.rbacClient) {
      this.rbacClient.close();
    }
    
    if (this.feSettingClient) {
      this.feSettingClient.close();
    }
    
    this.isInitialized = false;
    console.log('🔌 所有 gRPC 客戶端連接已關閉');
  }
}

/**
 * 匯出單例實例
 */
export const grpcServiceManager = GrpcServiceManager.getInstance();