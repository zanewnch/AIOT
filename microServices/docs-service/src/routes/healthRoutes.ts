/**
 * @fileoverview 健康檢查路由
 */

import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';

export class HealthRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes = (): void => {
    this.router.get('/health', HealthController.getHealth);
  };
}