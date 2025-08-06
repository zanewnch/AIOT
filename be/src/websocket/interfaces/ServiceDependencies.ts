/**
 * @fileoverview 服務依賴介面定義
 * 
 * 定義 WebSocket 事件處理器工廠所需的服務依賴，
 * 實現依賴注入模式以避免業務邏輯重複
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import { DroneCommandService } from '../../services/drone/DroneCommandService.js';
import { DronePositionService } from '../../services/drone/DronePositionService.js';
import { DroneRealTimeStatusService } from '../../services/drone/DroneRealTimeStatusService.js';

/**
 * 無人機服務依賴集合介面
 * 
 * 定義 Factory 所需的所有業務服務依賴，
 * 確保 WebSocket 和 HTTP 共用同一套業務邏輯
 */
export interface DroneServiceDependencies {
  /**
   * 無人機命令服務
   * 處理無人機命令執行的核心業務邏輯
   */
  commandService: DroneCommandService;

  /**
   * 無人機位置服務
   * 處理無人機位置數據的業務邏輯
   */
  positionService: DronePositionService;

  /**
   * 無人機狀態服務
   * 處理無人機狀態數據的業務邏輯
   */
  statusService: DroneRealTimeStatusService;
}

/**
 * WebSocket 基礎依賴介面
 * 
 * 定義 WebSocket 處理器所需的基礎設施依賴
 */
export interface WebSocketBaseDependencies {
  /**
   * WebSocket 服務實例
   */
  wsService: any; // 暫時使用 any，避免循環引用

  /**
   * WebSocket 認證中間件
   */
  authMiddleware: any; // 暫時使用 any，避免循環引用
}

/**
 * 完整的依賴注入配置
 * 
 * 結合業務服務依賴和基礎設施依賴
 */
export interface FactoryDependencies extends WebSocketBaseDependencies {
  /**
   * 業務服務依賴
   */
  services: DroneServiceDependencies;
}