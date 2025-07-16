import { Router, Request, Response, NextFunction } from 'express';
import { RbacInitService } from '../service/RbacInitService.js';
import { RTKInitService } from '../service/RTKInitService.js';
import { progressService } from '../service/ProgressService.js';
import { TaskStatus, TaskStage } from '../types/ProgressTypes.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * 初始化控制器，處理系統初始化相關的API請求
 * 
 * 提供系統演示資料的初始化功能，包括RBAC權限控制和RTK定位資料。
 * 所有初始化操作都是冪等的，多次執行不會產生重複資料。
 * 
 * @module Controllers
 * @example
 * ```typescript
 * const initController = new InitController();
 * app.use('/api/', initController.router);
 * ```
 */
export class InitController {
  public router: Router;
  private rbacInitService: RbacInitService;
  private rtkInitService: RTKInitService;

  /**
   * 初始化控制器實例
   * 設置路由和必要的服務依賴
   */
  constructor() {
    this.router = Router();
    this.initializeRoutes();
    this.rbacInitService = new RbacInitService();
    this.rtkInitService = new RTKInitService();
  }

  /**
   * 初始化路由配置
   * 
   * 設置初始化相關的API路由，包括RBAC和RTK演示資料的初始化端點。
   * 
   * @private
   * @returns {void}
   */
  private initializeRoutes = (): void => {
    /**
     * POST /api/init/rbac-demo
     * -------------------------------------------------
     * 一次性插入 RBAC demo 資料。
     * 如果資料已存在，不會重覆建立，仍回傳 200。
     */
    this.router.post('/api/init/rbac-demo', this.seedRbacDemo);

    /**
     * POST /api/init/rtk-demo
     * -------------------------------------------------
     * 一次性插入 RTK demo 資料。
     * 如果資料已存在，不會重覆建立，仍回傳 200。
     */
    this.router.post('/api/init/rtk-demo', this.seedRTKDemo);

    /**
     * POST /api/init/admin-user
     * -------------------------------------------------
     * 創建系統管理員帳號。
     * 用戶名：admin，密碼：admin，具有完整系統權限。
     */
    this.router.post('/api/init/admin-user', this.createAdminUser);

    /**
     * POST /api/init/stress-test-data
     * -------------------------------------------------
     * 生成大量測試資料供壓力測試使用。
     * 包含 5000 筆 RTK 資料和 5000 筆使用者資料。
     * 返回 taskId 供進度追蹤使用。
     */
    this.router.post('/api/init/stress-test-data', this.createStressTestData);

    /**
     * GET /api/init/progress/:taskId
     * -------------------------------------------------
     * SSE 端點，提供任務進度的即時串流更新。
     * 客戶端可透過此端點接收進度事件。
     */
    this.router.get('/api/init/progress/:taskId', this.getProgressStream);
  }

  /**
   * 初始化RBAC演示資料
   * 
   * 創建預設的使用者、角色和權限資料供系統演示使用。
   * 此操作是冪等的，不會創建重複的資料。
   * 
   * @param res - Express回應物件
   * @returns Promise<void>
   * 
   * @example
   * ```bash
   * POST /api/init/rbac-demo
   * ```
   * 
   * 成功回應:
   * ```json
   * {
   *   "ok": true,
   *   "message": "RBAC demo data initialized"
   * }
   * ```
   */
  public seedRbacDemo = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.rbacInitService.seedRbacDemo();
      res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 初始化RTK演示資料
   * 
   * 創建RTK定位系統的演示資料，包括基站和定位記錄。
   * 此操作是冪等的，不會創建重複的資料。
   * 
   * @param res - Express回應物件
   * @returns Promise<void>
   * 
   * @example
   * ```bash
   * POST /api/init/rtk-demo
   * ```
   * 
   * 成功回應:
   * ```json
   * {
   *   "ok": true,
   *   "message": "RTK demo data initialized"
   * }
   * ```
   */
  public seedRTKDemo = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.rtkInitService.seedRTKDemo();
      res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 創建系統管理員帳號
   * 
   * 創建一個具有完整權限的管理員用戶供系統管理使用。
   * 此操作是冪等的，如果管理員已存在則不會重複創建。
   * 
   * @param _req - Express請求物件（未使用）
   * @param res - Express回應物件
   * @param next - Express next函數
   * @returns Promise<void>
   * 
   * @example
   * ```bash
   * POST /api/init/admin-user
   * ```
   * 
   * 成功回應:
   * ```json
   * {
   *   "ok": true,
   *   "success": true,
   *   "message": "Admin user 'admin' created successfully with full permissions"
   * }
   * ```
   */
  public createAdminUser = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.rbacInitService.createAdminUser();
      res.json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 創建壓力測試資料（背景任務）
   * 
   * 啟動背景任務生成大量測試資料，立即返回 taskId 供進度追蹤。
   * 包括：
   * - 5000 筆 RTK 定位資料（台灣地區隨機座標）
   * - 5000 筆使用者資料（自動生成的測試帳號）
   * - 基本的 RBAC 角色權限資料
   * 
   * @param _req - Express請求物件（未使用）
   * @param res - Express回應物件
   * @param next - Express next函數
   * @returns Promise<void>
   * 
   * @example
   * ```bash
   * POST /api/init/stress-test-data
   * ```
   * 
   * 成功回應:
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
  public createStressTestData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 生成唯一任務 ID
      const taskId = uuidv4();
      const totalWork = 10000; // 5000 RTK + 5000 Users
      
      // 建立進度追蹤任務
      progressService.createTask(taskId, totalWork, '正在初始化壓力測試資料...');
      
      // 立即回應，任務在背景執行
      res.json({
        ok: true,
        taskId,
        status: TaskStatus.STARTED,
        message: 'Background task initiated',
        progressUrl: `/api/init/progress/${taskId}`
      });
      
      // 在背景執行實際任務
      this.executeStressTestDataCreation(taskId).catch(error => {
        console.error('Background task failed:', error);
        progressService.failTask(taskId, error.message || 'Unknown error occurred');
      });
      
    } catch (err) {
      next(err);
    }
  }

  /**
   * 取得任務進度串流（SSE）
   * 
   * 建立 Server-Sent Events 連線，即時推送任務執行進度。
   * 
   * @param req - Express請求物件
   * @param res - Express回應物件
   * @param next - Express next函數
   * @returns Promise<void>
   * 
   * @example
   * ```bash
   * GET /api/init/progress/12345678-1234-1234-1234-123456789012
   * Accept: text/event-stream
   * ```
   * 
   * SSE 事件格式:
   * ```
   * event: progress
   * data: {"type":"progress","timestamp":1234567890,"data":{"taskId":"...","percentage":25,...}}
   * 
   * event: completed
   * data: {"type":"completed","timestamp":1234567890,"data":{"taskId":"...","percentage":100,...}}
   * ```
   */
  public getProgressStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { taskId } = req.params;
      
      if (!taskId) {
        res.status(400).json({ error: 'Task ID is required' });
        return;
      }
      
      // 檢查任務是否存在
      const progress = progressService.getProgress(taskId);
      if (!progress) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      
      // 建立 SSE 連線
      const success = progressService.createSSEConnection(taskId, res);
      if (!success) {
        res.status(500).json({ error: 'Failed to create SSE connection' });
        return;
      }
      
      // 連線已由 ProgressService 管理，這裡不需要額外處理
      
    } catch (err) {
      next(err);
    }
  }

  /**
   * 執行壓力測試資料創建的背景任務
   * 
   * @param taskId 任務識別碼
   * @returns Promise<void>
   * @private
   */
  private async executeStressTestDataCreation(taskId: string): Promise<void> {
    try {
      console.log(`開始執行壓力測試資料創建任務: ${taskId}`);
      
      // 更新狀態為執行中
      progressService.updateProgress(taskId, {
        status: TaskStatus.RUNNING,
        stage: TaskStage.INITIALIZING,
        message: '正在初始化...'
      });
      
      // 建立進度回調
      const progressCallback = progressService.createProgressCallback(taskId);
      
      // 階段 1: RTK 資料生成
      progressService.updateProgress(taskId, {
        stage: TaskStage.GENERATING_RTK,
        message: '正在生成 RTK 資料...'
      });
      
      const rtkResult = await this.rtkInitService.seedRTKDemoWithProgress(progressCallback);
      
      // 階段 2: RBAC 資料生成  
      progressService.updateProgress(taskId, {
        stage: TaskStage.GENERATING_USERS,
        current: 5000, // RTK 完成
        message: '正在生成使用者資料...'
      });
      
      const rbacResult = await this.rbacInitService.seedRbacDemoWithProgress(progressCallback);
      
      // 任務完成
      const finalResult = {
        rtk: rtkResult,
        rbac: rbacResult,
        summary: {
          totalRTKRecords: rtkResult.count,
          totalUsers: rbacResult.users,
          totalRoles: rbacResult.roles,
          totalPermissions: rbacResult.permissions
        }
      };
      
      progressService.completeTask(taskId, finalResult, '壓力測試資料創建完成');
      console.log(`壓力測試資料創建任務完成: ${taskId}`);
      
    } catch (error) {
      console.error(`壓力測試資料創建任務失敗: ${taskId}`, error);
      progressService.failTask(taskId, error instanceof Error ? error.message : '未知錯誤');
    }
  }
}


