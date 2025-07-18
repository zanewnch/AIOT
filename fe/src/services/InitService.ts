/**
 * @fileoverview 初始化服務模組
 * 
 * 提供系統初始化相關的 API 調用功能，包括 RBAC 示例資料、RTK 示例資料、
 * 管理員帳號創建和壓力測試資料生成。
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// 匯入 API 客戶端工具
import { apiClient } from '../utils/RequestUtils';

/**
 * 初始化回應介面
 * 
 * @interface InitResponse
 * @description 定義初始化 API 回應的資料結構
 */
interface InitResponse {
  /** 操作是否成功 */
  ok: boolean;
  /** 成功訊息 */
  message?: string;
  /** 錯誤訊息 */
  error?: string;
  /** 其他動態屬性 */
  [key: string]: any;
}

/**
 * 壓力測試回應介面
 * 
 * @interface StressTestResponse
 * @description 定義壓力測試 API 回應的資料結構
 */
interface StressTestResponse {
  /** 操作是否成功 */
  ok: boolean;
  /** 任務 ID */
  taskId: string;
  /** 任務狀態 */
  status: string;
  /** 回應訊息 */
  message: string;
  /** 進度追蹤 URL */
  progressUrl: string;
}

/**
 * 初始化服務類別
 * 
 * @class InitService
 * @description 提供系統初始化相關的 API 調用功能
 * @example
 * ```typescript
 * // 初始化 RBAC 示例資料
 * const result = await InitService.initRbacDemo();
 * ```
 */
export class InitService {
  /**
   * 初始化 RBAC 示例資料
   * 
   * @method initRbacDemo
   * @returns {Promise<InitResponse>} 初始化結果
   * @description 向後端發送請求初始化 RBAC（角色權限控制）示例資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * try {
   *   const result = await InitService.initRbacDemo();
   *   console.log(result.message); // 初始化成功訊息
   * } catch (error) {
   *   console.error('初始化失敗:', error.message);
   * }
   * ```
   */
  static async initRbacDemo(): Promise<InitResponse> {
    try {
      // 發送 POST 請求到 /api/init/rbac-demo 端點
      const response = await apiClient.post<InitResponse>('/api/init/rbac-demo');
      return response; // 直接回傳 API 回應結果
    } catch (error: any) {
      // 記錄錯誤到控制台
      console.error('Failed to initialize RBAC demo:', error);
      // 拋出包含詳細錯誤訊息的錯誤
      throw new Error(error.response?.data?.message || 'Failed to initialize RBAC demo');
    }
  }

  /**
   * 初始化 RTK 示例資料
   * 
   * @method initRtkDemo
   * @returns {Promise<InitResponse>} 初始化結果
   * @description 向後端發送請求初始化 RTK（實時動態測量）示例資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * try {
   *   const result = await InitService.initRtkDemo();
   *   console.log(result.message); // 初始化成功訊息
   * } catch (error) {
   *   console.error('初始化失敗:', error.message);
   * }
   * ```
   */
  static async initRtkDemo(): Promise<InitResponse> {
    try {
      // 發送 POST 請求到 /api/init/rtk-demo 端點
      const response = await apiClient.post<InitResponse>('/api/init/rtk-demo');
      return response; // 直接回傳 API 回應結果
    } catch (error: any) {
      // 記錄錯誤到控制台
      console.error('Failed to initialize RTK demo:', error);
      // 拋出包含詳細錯誤訊息的錯誤
      throw new Error(error.response?.data?.message || 'Failed to initialize RTK demo');
    }
  }

  /**
   * 創建管理員帳號
   * 
   * @method createAdminUser
   * @returns {Promise<InitResponse>} 創建結果
   * @description 向後端發送請求創建預設的管理員帳號
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * try {
   *   const result = await InitService.createAdminUser();
   *   console.log(result.message); // 創建成功訊息
   * } catch (error) {
   *   console.error('創建管理員失敗:', error.message);
   * }
   * ```
   */
  static async createAdminUser(): Promise<InitResponse> {
    try {
      // 發送 POST 請求到 /api/init/admin-user 端點
      const response = await apiClient.post<InitResponse>('/api/init/admin-user');
      return response; // 直接回傳 API 回應結果
    } catch (error: any) {
      // 記錄錯誤到控制台
      console.error('Failed to create admin user:', error);
      // 拋出包含詳細錯誤訊息的錯誤
      throw new Error(error.response?.data?.message || 'Failed to create admin user');
    }
  }

  /**
   * 創建壓力測試資料
   * 
   * @method createStressTestData
   * @returns {Promise<StressTestResponse>} 壓力測試任務結果
   * @description 向後端發送請求創建壓力測試用的大量資料
   * @throws {Error} 當 API 請求失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * try {
   *   const result = await InitService.createStressTestData();
   *   console.log(result.taskId); // 任務 ID
   *   console.log(result.progressUrl); // 進度追蹤 URL
   * } catch (error) {
   *   console.error('創建壓力測試資料失敗:', error.message);
   * }
   * ```
   */
  static async createStressTestData(): Promise<StressTestResponse> {
    try {
      // 發送 POST 請求到 /api/init/stress-test-data 端點
      const response = await apiClient.post<StressTestResponse>('/api/init/stress-test-data');
      return response; // 直接回傳 API 回應結果
    } catch (error: any) {
      // 記錄錯誤到控制台
      console.error('Failed to create stress test data:', error);
      // 拋出包含詳細錯誤訊息的錯誤
      throw new Error(error.response?.data?.message || 'Failed to create stress test data');
    }
  }

  /**
   * 初始化所有示例資料
   * 
   * @method initAllDemo
   * @returns {Promise<{ rbac: InitResponse; rtk: InitResponse }>} 所有初始化結果
   * @description 並行執行 RBAC 和 RTK 示例資料的初始化
   * @throws {Error} 當任何一個初始化失敗時拋出錯誤
   * @static
   * @example
   * ```typescript
   * try {
   *   const results = await InitService.initAllDemo();
   *   console.log('RBAC 初始化:', results.rbac.message);
   *   console.log('RTK 初始化:', results.rtk.message);
   * } catch (error) {
   *   console.error('初始化失敗:', error.message);
   * }
   * ```
   */
  static async initAllDemo(): Promise<{
    rbac: InitResponse;
    rtk: InitResponse;
  }> {
    try {
      // 並行執行 RBAC 和 RTK 示例資料初始化，提高效率
      const [rbacResult, rtkResult] = await Promise.all([
        this.initRbacDemo(),  // 初始化 RBAC 示例資料
        this.initRtkDemo()    // 初始化 RTK 示例資料
      ]);

      // 回傳包含兩個初始化結果的物件
      return {
        rbac: rbacResult,
        rtk: rtkResult
      };
    } catch (error: any) {
      // 記錄錯誤到控制台
      console.error('Failed to initialize all demo data:', error);
      // 拋出簡化的錯誤訊息
      throw new Error('Failed to initialize demo data');
    }
  }
}