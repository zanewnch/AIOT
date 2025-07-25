/**
 * @fileoverview 系統初始化控制器
 * 負責處理系統初始化相關的 HTTP 端點和背景任務
 * 提供 RBAC 權限資料、RTK 定位資料和壓力測試資料的初始化功能
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response, NextFunction } from 'express'; // 匯入 Express 的核心型別定義
import { RbacInitService } from '../services/RbacInitService.js'; // 匯入 RBAC 初始化服務
import { RTKInitService } from '../services/RTKInitService.js'; // 匯入 RTK 初始化服務
import { progressService } from '../services/ProgressService.js'; // 匯入進度追蹤服務
import { TaskStage, TaskStatus } from '../types/ProgressTypes.js'; // 匯入任務狀態和階段定義
import { backgroundTaskHandler } from '../utils/backgroundTask.js'; // 匯入背景任務處理器
import { createLogger, logRequest } from '../configs/loggerConfig.js'; // 匯入日誌記錄器
import { ControllerResult } from '../utils/ControllerResult.js'; // 匯入控制器結果類別

// 創建控制器專用的日誌記錄器
const logger = createLogger('InitController');

/**
 * 系統初始化控制器
 * 
 * @class InitController
 * @description 處理系統初始化相關的 API 請求
 * 提供系統演示資料的初始化功能，包括 RBAC 權限控制和 RTK 定位資料
 * 所有初始化操作都是冪等的，多次執行不會產生重複資料
 *
 * @example
 * ```typescript
 * const initController = new InitController();
 * app.use('/api/', initController.router);
 * ```
 */
export class InitController {
  
  /**
   * RBAC 初始化服務實例
   * 
   * @private
   * @type {RbacInitService}
   * @description 負責處理角色權限控制相關的資料初始化
   */
  private rbacInitService: RbacInitService;
  
  /**
   * RTK 初始化服務實例
   * 
   * @private
   * @type {RTKInitService}
   * @description 負責處理即時動態定位相關的資料初始化
   */
  private rtkInitService: RTKInitService;

  /**
   * 初始化控制器實例
   * 設置路由和必要的服務依賴
   * 
   * @constructor
   * @description 建立初始化控制器並設定相關服務
   */
  constructor() {
    // 建立 RBAC 初始化服務實例
    this.rbacInitService = new RbacInitService();
    // 建立 RTK 初始化服務實例
    this.rtkInitService = new RTKInitService();
  }


  /**
   * 初始化 RBAC 演示資料
   *
   * 創建預設的使用者、角色和權限資料供系統演示使用
   * 此操作是冪等的，不會創建重複的資料
   *
   * @method seedRbacDemo
   * @param {Request} _req - Express 請求物件（未使用）
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express next 函數，用於錯誤處理
   * @returns {Promise<void>} 無回傳值的 Promise
   *
   * @throws {500} 當初始化過程發生錯誤時
   *
   * @example
   * ```bash
   * POST /api/init/rbac-demo
   * ```
   *
   * @example 成功回應
   * ```json
   * {
   *   "ok": true,
   *   "message": "RBAC demo data initialized"
   * }
   * ```
   */
  public seedRbacDemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Starting RBAC demo data initialization');
      logRequest(req, 'RBAC demo data initialization request', 'info');
      
      // 呼叫 RBAC 初始化服務來建立演示資料
      const result = await this.rbacInitService.seedRbacDemo();
      
      logger.info(`RBAC demo data initialization completed successfully: ${result.message}`);
      // 回傳成功結果給客戶端
      const response = ControllerResult.success('RBAC demo data initialized successfully', result);
      res.status(response.status).json(response.toJSON());
    } catch (err) {
      logger.error('Failed to initialize RBAC demo data:', err);
      // 將例外處理委派給 Express 錯誤處理中間件
      next(err);
    }
  }

  /**
   * 初始化 RTK 演示資料
   *
   * 創建 RTK 定位系統的演示資料，包括基站和定位記錄
   * 此操作是冪等的，不會創建重複的資料
   *
   * @method seedRTKDemo
   * @param {Request} _req - Express 請求物件（未使用）
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express next 函數，用於錯誤處理
   * @returns {Promise<void>} 無回傳值的 Promise
   *
   * @throws {500} 當初始化過程發生錯誤時
   *
   * @example
   * ```bash
   * POST /api/init/rtk-demo
   * ```
   *
   * @example 成功回應
   * ```json
   * {
   *   "ok": true,
   *   "message": "RTK demo data initialized"
   * }
   * ```
   */
  public seedRTKDemo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Starting RTK demo data initialization');
      logRequest(req, 'RTK demo data initialization request', 'info');
      
      // 呼叫 RTK 初始化服務來建立演示資料
      const result = await this.rtkInitService.seedRTKDemo();
      
      logger.info(`RTK demo data initialization completed successfully: ${result.message}`);
      // 回傳成功結果給客戶端
      const response = ControllerResult.success('RTK demo data initialized successfully', result);
      res.status(response.status).json(response.toJSON());
    } catch (err) {
      logger.error('Failed to initialize RTK demo data:', err);
      // 將例外處理委派給 Express 錯誤處理中間件
      next(err);
    }
  }

  /**
   * 創建系統管理員帳號
   *
   * 創建一個具有完整權限的管理員用戶供系統管理使用
   * 此操作是冪等的，如果管理員已存在則不會重複創建
   *
   * @method createAdminUser
   * @param {Request} _req - Express 請求物件（未使用）
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express next 函數，用於錯誤處理
   * @returns {Promise<void>} 無回傳值的 Promise
   *
   * @throws {500} 當管理員創建過程發生錯誤時
   *
   * @example
   * ```bash
   * POST /api/init/admin-user
   * ```
   *
   * @example 成功回應
   * ```json
   * {
   *   "ok": true,
   *   "success": true,
   *   "message": "Admin user 'admin' created successfully with full permissions"
   * }
   * ```
   */
  public createAdminUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Starting admin user creation process');
      logRequest(req, 'Admin user creation request', 'info');
      
      // 呼叫 RBAC 初始化服務來建立管理員使用者
      const result = await this.rbacInitService.createAdminUser();
      
      logger.info(`Admin user creation completed: ${result.message}`);
      // 回傳成功結果給客戶端
      const response = ControllerResult.success('Admin user created successfully', result);
      res.status(response.status).json(response.toJSON());
    } catch (err) {
      logger.error('Failed to create admin user:', err);
      // 將例外處理委派給 Express 錯誤處理中間件
      next(err);
    }
  }

  /**
   * 創建壓力測試資料（背景任務）
   *
   * 啟動背景任務生成大量測試資料，立即返回 taskId 供進度追蹤
   * 包括：
   * - 5000 筆 RTK 定位資料（台灣地區隨機座標）
   * - 5000 筆使用者資料（自動生成的測試帳號）
   * - 基本的 RBAC 角色權限資料
   *
   * @method createStressTestData
   * @param {Request} _req - Express 請求物件（未使用）
   * @param {Response} res - Express 回應物件
   * @param {NextFunction} next - Express next 函數，用於錯誤處理
   * @returns {Promise<void>} 無回傳值的 Promise
   *
   * @throws {500} 當背景任務啟動失敗時
   *
   * @example
   * ```bash
   * POST /api/init/stress-test-data
   * ```
   *
   * @example 成功回應
   * ```json
   * {
   *   "ok": true,
   *   "taskId": "12345678-1234-1234-1234-123456789012",
   *   "status": "started",
   *   "message": "Background task initiated",
   *   "progressUrl": "/api/init/progress/12345678-1234-1234-1234-123456789012"
   * }
   * ```
   */
  public createStressTestData = backgroundTaskHandler(
    {
      totalWork: 10000, // 5000 RTK + 5000 Users - 總工作量設定
      initialMessage: '正在初始化壓力測試資料...', // 初始任務訊息
      taskName: 'StressTestDataCreation' // 任務名稱識別符
    },
    (taskId) => this.executeStressTestDataCreation(taskId) // 任務執行函數
  );


  /**
   * 執行壓力測試資料創建的背景任務
   *
   * @method executeStressTestDataCreation
   * @param {string} taskId - 任務識別碼
   * @returns {Promise<void>} 無回傳值的 Promise
   * @private
   * @description 實際執行壓力測試資料創建的背景任務邏輯
   */
  private executeStressTestDataCreation = async (taskId: string): Promise<void> => {
    try {
      // 記錄任務開始資訊
      logger.info(`Starting stress test data creation background task: ${taskId}`);

      // 更新任務狀態為執行中
      progressService.updateProgress(taskId, {
        status: TaskStatus.RUNNING, // 設定為執行中狀態
        stage: TaskStage.INITIALIZING, // 設定為初始化階段
        message: '正在初始化...' // 更新狀態訊息
      });

      // 建立進度回調函數
      const progressCallback = progressService.createProgressCallback(taskId);

      // 階段 1: RTK 資料生成
      logger.debug(`Task ${taskId}: Starting RTK data generation phase`);
      progressService.updateProgress(taskId, {
        stage: TaskStage.GENERATING_RTK, // 設定為 RTK 資料生成階段
        message: '正在生成 RTK 資料...' // 更新狀態訊息
      });

      // 執行 RTK 資料生成並追蹤進度
      const rtkResult = await this.rtkInitService.seedRTKDemoWithProgress(progressCallback);
      logger.debug(`Task ${taskId}: RTK data generation completed with ${rtkResult.count} records`);

      // 階段 2: RBAC 資料生成
      logger.debug(`Task ${taskId}: Starting RBAC data generation phase`);
      progressService.updateProgress(taskId, {
        stage: TaskStage.GENERATING_USERS, // 設定為使用者資料生成階段
        current: 5000, // RTK 資料生成完成，更新目前進度
        message: '正在生成使用者資料...' // 更新狀態訊息
      });

      // 執行 RBAC 資料生成並追蹤進度
      const rbacResult = await this.rbacInitService.seedRbacDemoWithProgress(progressCallback);
      logger.debug(`Task ${taskId}: RBAC data generation completed - Users: ${rbacResult.users}, Roles: ${rbacResult.roles}, Permissions: ${rbacResult.permissions}`);

      // 整理任務完成結果
      const finalResult = {
        rtk: rtkResult, // RTK 資料生成結果
        rbac: rbacResult, // RBAC 資料生成結果
        summary: {
          totalRTKRecords: rtkResult.count, // RTK 記錄總數
          totalUsers: rbacResult.users, // 使用者總數
          totalRoles: rbacResult.roles, // 角色總數
          totalPermissions: rbacResult.permissions // 權限總數
        }
      };

      // 標示任務完成並記錄結果
      progressService.completeTask(taskId, finalResult, '壓力測試資料創建完成');
      logger.info(`Stress test data creation task completed successfully: ${taskId}, Total RTK records: ${finalResult.summary.totalRTKRecords}, Total users: ${finalResult.summary.totalUsers}`);

    } catch (error) {
      // 記錄任務失敗錯誤訊息
      logger.error(`Stress test data creation task failed: ${taskId}`, error);
      // 標示任務失敗並記錄錯誤訊息
      progressService.failTask(taskId, error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
}


