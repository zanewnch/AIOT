import { Router, Request, Response } from 'express';
import { RbacInitService } from '../service/RbacInitService.js';
import { RTKInitService } from '../service/RTKInitService.js';

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
  private initializeRoutes(): void {
    /**
     * POST /api/init/rbac-demo
     * -------------------------------------------------
     * 一次性插入 RBAC demo 資料。
     * 如果資料已存在，不會重覆建立，仍回傳 200。
     */
    this.router.post('/init/rbac-demo', this.seedRbacDemo);

    /**
     * POST /api/init/rtk-demo
     * -------------------------------------------------
     * 一次性插入 RTK demo 資料。
     * 如果資料已存在，不會重覆建立，仍回傳 200。
     */
    this.router.post('/init/rtk-demo', this.seedRTKDemo);
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
  public async seedRbacDemo(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.rbacInitService.seedRbacDemo();
      res.json({ ok: true, ...result });
    } catch (err) {
      console.error('RBAC demo init failed', err);
      res.status(500).json({ ok: false, message: 'init failed', error: (err as Error).message });
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
  public async seedRTKDemo(_req: Request, res: Response): Promise<void> {
    try {
      const result = await this.rtkInitService.seedRTKDemo();
      res.json({ ok: true, ...result });
    } catch (err) {
      console.error('RTK demo init failed', err);
      res.status(500).json({ ok: false, message: 'init failed', error: (err as Error).message });
    }
  }
}


