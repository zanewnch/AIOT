import { Router, Request, Response } from 'express';
import { RbacInitService } from '../service/RbacInitService.js';

export class InitializationController {
  public router: Router;
  private rbacInitService: RbacInitService;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
    this.rbacInitService = new RbacInitService();
  }

  private initializeRoutes(): void {
    /**
     * POST /api/init/rbac-demo
     * -------------------------------------------------
     * 一次性插入 RBAC demo 資料。
     * 如果資料已存在，不會重覆建立，仍回傳 200。
     */
    this.router.post('/rbac-demo', this.seedRbacDemo);
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
}


