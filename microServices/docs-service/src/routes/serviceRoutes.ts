/**
 * @fileoverview 服務資訊路由
 */

import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController.js';

export class ServiceRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes = (): void => {
    this.router.get('/info', ServiceController.getInfo);
    this.router.get('/api/services', ServiceController.getServicesList);
  };
}