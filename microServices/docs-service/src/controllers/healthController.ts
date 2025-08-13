/**
 * @fileoverview 健康檢查控制器
 */

import type { Request, Response } from 'express';
import { config } from '../config/index.js';
import type { HealthCheckResponse } from '../types/index.js';

export class HealthController {
  public static getHealth = (_req: Request, res: Response): void => {
    const healthResponse: HealthCheckResponse = {
      status: 'healthy',
      service: 'docs-service',
      version: config.service.version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.environment
    };
    
    res.json(healthResponse);
  };
}