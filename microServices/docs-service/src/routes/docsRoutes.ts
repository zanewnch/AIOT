/**
 * @fileoverview 文檔路由
 */

import { Router } from 'express';
import serveStatic from 'serve-static';
import path from 'path';
import { config, availableServices } from '../config/index.js';
import { DocsController } from '../controllers/docsController.js';

export class DocsRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes = (): void => {
    // 靜態文件服務配置
    const serveOptions = {
      maxAge: config.cache.maxAge,
      setHeaders: (res: any, filePath: string) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        
        if (config.server.environment !== 'production') {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    };

    // 先註冊精確匹配的路由
    // 根路徑直接顯示主頁 (Kong會將 /docs 截掉，所以這裡是 /)
    this.router.get('/', DocsController.getHomepage);
    
    // 也支援 /docs 路徑 (如果沒有通過Kong直接訪問)
    this.router.get('/docs', DocsController.getHomepage);
    
    // 手動生成文檔端點
    this.router.post('/generate', DocsController.generateDocs);
    
    // 獲取生成狀態端點
    this.router.get('/status', DocsController.getGenerationStatus);

    // 服務名稱映射 - 將顯示名稱映射到實際資料夾名稱
    const serviceNameMapping: Record<string, string> = {
      'RBAC Service': 'rbac-service',
      'Drone Service': 'drone-service', 
      'Drone WebSocket Service': 'drone-websocket-service',
      'General Service': 'general-service'
    };

    // 然後註冊微服務文檔的靜態路由
    availableServices.forEach(service => {
      const folderName = serviceNameMapping[service.name];
      if (!folderName) {
        console.warn(`未找到服務 ${service.name} 的資料夾映射`);
        return;
      }
      
      const routePath = service.path.replace(/\/$/, ''); // 移除尾部斜線
      const docsPath = path.join(config.paths.docs, `${folderName}/docs`);
      
      this.router.use(routePath, serveStatic(docsPath, serveOptions));
    });
  };
}