import { Router, Request, Response } from 'express';
import { RbacInitService } from '../service/RbacInitService.js';
import { RTKInitService } from '../service/RTKInitService.js';

export class InitController {
  public router: Router;
  private rbacInitService: RbacInitService;
  private rtkInitService: RTKInitService;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
    this.rbacInitService = new RbacInitService();
    this.rtkInitService = new RTKInitService();
  }

  private initializeRoutes(): void {
    /**
     * POST /api/init/rbac-demo
     * -------------------------------------------------
     * 一次性插入 RBAC demo 資料。
     * 如果資料已存在，不會重覆建立，仍回傳 200。
     */
    this.router.post('/rbac-demo', this.seedRbacDemo);

    /**
     * POST /api/init/rtk-demo
     * -------------------------------------------------
     * 一次性插入 RTK demo 資料。
     * 如果資料已存在，不會重覆建立，仍回傳 200。
     */
    this.router.post('/rtk-demo', this.seedRTKDemo);
  }

  private async seedRbacDemo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.rbacInitService.seedRbacDemo();
      res.json({ ok: true, ...result });
    } catch (err) {
      console.error('RBAC demo init failed', err);
      res.status(500).json({ ok: false, message: 'init failed', error: (err as Error).message });
    }
  }

  private async seedRTKDemo(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.rtkInitService.seedRTKDemo();
      res.json({ ok: true, ...result });
    } catch (err) {
      console.error('RTK demo init failed', err);
      res.status(500).json({ ok: false, message: 'init failed', error: (err as Error).message });
    }
  }
}


