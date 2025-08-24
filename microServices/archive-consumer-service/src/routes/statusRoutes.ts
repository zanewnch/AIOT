/**
 * @fileoverview 狀態資訊路由
 * 
 * 【設計意圖】
 * 提供服務運行狀態資訊，用於運維人員快速檢查和故障排查
 * 
 * 【提供資訊】
 * - Consumer 狀態（是否運行、處理任務數量）
 * - 記憶體使用情況
 * - 服務運行時間
 * - 環境資訊
 */

import { Router, Request, Response } from 'express';
import { ArchiveConsumer } from '../consumers/ArchiveConsumer';
import { config } from '../configs/environment';

export const createStatusRoutes = (archiveConsumer: ArchiveConsumer): Router => {
  const router = Router();

  /**
   * 狀態資訊端點
   * 
   * 【用途】運維人員快速檢查服務運行狀態
   * 【使用場景】
   * - 故障排查時檢查服務狀態
   * - 性能監控和容量規劃
   * - 運維儀表板顯示
   */
  router.get('/status', (req: Request, res: Response) => {
    const consumerStatus = archiveConsumer.getStatus();
    
    res.json({
      service: config.service.name,
      status: 'running',
      timestamp: new Date().toISOString(),
      consumer: consumerStatus,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      environment: config.service.nodeEnv,
      pid: process.pid
    });
  });

  return router;
}