/**
 * @fileoverview 路由註冊中心
 */

import type { Express } from 'express';
import { HealthRoutes } from './healthRoutes.js';
import { ServiceRoutes } from './serviceRoutes.js';
import { DocsRoutes } from './docsRoutes.js';

export class AppRoutes {
  public static register(app: Express): void {
    // 健康檢查路由
    const healthRoutes = new HealthRoutes();
    app.use('/', healthRoutes.router);

    // 服務資訊路由
    const serviceRoutes = new ServiceRoutes();
    app.use('/', serviceRoutes.router);

    // 文檔路由
    const docsRoutes = new DocsRoutes();
    app.use('/', docsRoutes.router);
  }
}