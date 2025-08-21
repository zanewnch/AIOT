/**
 * @fileoverview 指標端點路由
 * 
 * 【設計意圖】
 * 提供 Prometheus 格式的指標數據，供監控系統收集服務指標
 * 
 * 【指標類型】
 * - archive_processor_uptime_seconds: 服務運行時間
 * - archive_processor_memory_usage_bytes: 記憶體使用量
 * - archive_processor_consumer_status: Consumer 運行狀態
 * - archive_processor_processing_tasks: 當前處理任務數
 */

import { Router, Request, Response } from 'express';
import { ArchiveConsumer } from '../consumers/ArchiveConsumer';

export function createMetricsRoutes(archiveConsumer: ArchiveConsumer): Router {
  const router = Router();

  /**
   * 指標端點 (Prometheus 格式)
   * 
   * 【用途】監控系統 (如 Prometheus) 收集服務指標
   * 【監控用途】
   * - 服務可用性監控（uptime）
   * - 資源使用監控（memory）
   * - 業務指標監控（processing tasks）
   * - 告警設定（如記憶體過高、Consumer 停止）
   */
  router.get('/metrics', (req: Request, res: Response) => {
    const memUsage = process.memoryUsage();
    const consumerStatus = archiveConsumer.getStatus();

    // Prometheus 格式指標
    const metrics = [
      `# HELP archive_processor_uptime_seconds Total uptime in seconds`,
      `# TYPE archive_processor_uptime_seconds counter`,
      `archive_processor_uptime_seconds ${process.uptime()}`,
      '',
      `# HELP archive_processor_memory_usage_bytes Memory usage in bytes`,
      `# TYPE archive_processor_memory_usage_bytes gauge`,
      `archive_processor_memory_usage_bytes{type="rss"} ${memUsage.rss}`,
      `archive_processor_memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}`,
      `archive_processor_memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}`,
      `archive_processor_memory_usage_bytes{type="external"} ${memUsage.external}`,
      '',
      `# HELP archive_processor_consumer_status Consumer status (1=running, 0=stopped)`,
      `# TYPE archive_processor_consumer_status gauge`,
      `archive_processor_consumer_status ${consumerStatus.isRunning ? 1 : 0}`,
      '',
      `# HELP archive_processor_processing_tasks Current number of processing tasks`,
      `# TYPE archive_processor_processing_tasks gauge`,
      `archive_processor_processing_tasks ${consumerStatus.processingCount}`,
      ''
    ].join('\n');

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  });

  return router;
}