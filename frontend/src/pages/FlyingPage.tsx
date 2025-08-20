/**
 * @fileoverview 飛行頁面組件
 *
 * 此文件提供飛行控制和監控功能的頁面。
 * 支援無人機飛行狀態監控、路徑規劃和飛行控制操作。
 * 整合 Google Maps JavaScript API 以提供完整的地圖功能。
 * 支援真實模式和模擬模式的切換。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-04
 */

import React, { useRef, useState, useCallback } from "react"; // 引入 React 核心庫和 Hooks
import { useRealFlyLogic } from "../hooks/useRealFlyLogic";
import { useSimulateFlyLogic } from "../hooks/useSimulateFlyLogic";
import { DronePositionQuery } from "../hooks/useDronePositionQuery";
import { DroneCommandQuery } from "../hooks/useDroneCommandQuery";
import { DroneStatusQuery } from "../hooks/useDroneStatusQuery";
import { useDroneWebSocket } from "../hooks/useDroneWebSocket";
import FlyingPageHeader from "../components/flying/FlyingPageHeader";
import DroneStatusPanel from "../components/flying/DroneStatusPanel";
import FlightControlPanel from "../components/flying/FlightControlPanel";
import { createLogger } from "../configs/loggerConfig";

// 檢查是否啟用模擬模式
const ENABLE_SIMULATE_MODE =
  import.meta.env.VITE_ENABLE_SIMULATE_MODE === "true";

/**
 * FlyingPage 組件的屬性介面
 *
 * 定義了 FlyingPage 組件接受的屬性類型
 */
interface FlyingPageProps {
  /**
   * 可選的 CSS 類名，用於自定義組件樣式
   */
  className?: string;
}

/**
 * 飛行頁面組件
 *
 * 此組件提供了一個完整的 Google Maps 介面，包括：
 * - Google Maps JavaScript API 整合
 * - 地圖顯示和互動功能
 * - 基本的地圖控制選項
 * - 標記添加和管理功能
 * - 響應式設計和用戶友好的介面
 *
 * @param props - 組件屬性
 * @param props.className - 可選的 CSS 類名
 *
 * @returns 飛行頁面的 JSX 元素
 *
 * @example
 * ```tsx
 * // 基本使用
 * <FlyingPage />
 *
 * // 使用自定義樣式
 * <FlyingPage className="custom-flying-page" />
 * ```
 */
const FlyingPage: React.FC<FlyingPageProps> = ({ className }) => {
  // 日誌記錄器
  const logger = createLogger('FlyingPage');
  
  // 地圖容器的引用
  const mapRef = useRef<HTMLDivElement>(null);

  // 模式狀態：true = 模擬模式, false = 真實模式
  // 預設啟用模擬模式以方便測試
  const [isSimulateMode, setIsSimulateMode] = useState(ENABLE_SIMULATE_MODE);

  // 根據模式選擇對應的 Hook
  const realFlyLogic = useRealFlyLogic(mapRef);
  const simulateFlyLogic = useSimulateFlyLogic(mapRef);

  // 真實 API 資料 hooks
  const positionQuery = new DronePositionQuery();
  const commandQuery = new DroneCommandQuery();
  const statusQuery = new DroneStatusQuery();
  
  const { data: dronePositions = [], isLoading: positionsLoading, refetch: refetchPositions } = positionQuery.useLatest();
  const { data: activeCommands = [], isLoading: commandsLoading, refetch: refetchCommands } = commandQuery.useLatestDroneCommands();
  const { data: droneStatuses = [], isLoading: statusLoading, refetch: refetchStatus } = statusQuery.useAll();

  // WebSocket 即時更新回調函數
  const handlePositionUpdate = useCallback((position: any) => {
    logger.info('飛行頁面收到位置更新', { droneId: position.drone_id, position });
    
    // 刷新位置資料查詢（樂觀更新）
    refetchPositions();
  }, [refetchPositions, logger]);

  const handleStatusUpdate = useCallback((status: any) => {
    logger.info('飛行頁面收到狀態更新', { droneId: status.drone_id, status: status.current_status });
    
    // 刷新狀態資料查詢
    refetchStatus();
  }, [refetchStatus, logger]);

  const handleCommandResponse = useCallback((response: any) => {
    logger.info('飛行頁面收到指令響應', { 
      droneId: response.drone_id, 
      command: response.command_type,
      status: response.status 
    });
    
    // 刷新指令資料查詢
    refetchCommands();
    
    // 飛行控制專用：記錄控制指令響應
    if (response.command_type && ['takeoff', 'land', 'move', 'rotate'].includes(response.command_type)) {
      logger.info('收到飛行控制指令響應', { 
        command: response.command_type, 
        status: response.status,
        droneId: response.drone_id 
      });
    }
  }, [refetchCommands, logger]);

  const handleWebSocketError = useCallback((error: string) => {
    logger.error('飛行頁面 WebSocket 錯誤', { error });
  }, [logger]);

  // WebSocket 連接（只在真實模式下啟用）
  const { isConnected: wsConnected, sendCommand } = useDroneWebSocket(
    {
      onPositionUpdate: handlePositionUpdate,
      onStatusUpdate: handleStatusUpdate,
      onCommandResponse: handleCommandResponse,
      onError: handleWebSocketError,
    },
    {
      subscribeToPositions: !isSimulateMode, // 只在真實模式下訂閱
      subscribeToStatus: !isSimulateMode,
      subscribeToCommands: !isSimulateMode,
    }
  );

  // 選擇當前使用的邏輯
  const currentLogic = isSimulateMode ? simulateFlyLogic : realFlyLogic;

  // 真實模式的載入狀態
  const realModeLoading = !isSimulateMode && (positionsLoading || commandsLoading || statusLoading);

  /**
   * 切換模式處理函數
   */
  const handleModeToggle = () => {
    setIsSimulateMode(!isSimulateMode);
  };

  return (
    <div className={`${className || ""} min-h-screen bg-gray-900`}>
      <div className="p-3 sm:p-6">
        {/* 頁面標題和模式切換 */}
        <FlyingPageHeader
          isSimulateMode={isSimulateMode}
          onModeToggle={handleModeToggle}
          isLoading={currentLogic.isLoading}
          enableSimulateMode={ENABLE_SIMULATE_MODE}
        />

        {/* 主要內容區域 */}
        <div className="space-y-6">
          {/* 第一行：地圖 + 無人機狀態 */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-auto lg:h-[520px]">
            {/* 地圖容器 - 完全照抄 MapPage 邏輯 */}
            <div className="col-span-1 lg:col-span-3 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden flex flex-col">
              <div className="relative flex-1 min-h-[300px]">
                <div
                  ref={mapRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ 
                    minHeight: "300px"
                  }}
                />

                {/* 載入覆蓋層 - 改善動畫 */}
                {currentLogic.isLoading && (
                  <div className="absolute inset-0 bg-gray-800/90 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center text-gray-300">
                      <div className="relative mb-4">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-800 border-t-blue-400 rounded-full mx-auto"></div>
                        <div className="absolute inset-0 animate-pulse">
                          <div className="w-8 h-8 bg-blue-400/20 rounded-full mx-auto mt-2"></div>
                        </div>
                      </div>
                      <p className="text-lg font-semibold">
                        {isSimulateMode
                          ? "模擬地圖載入中..."
                          : "Google Maps 載入中..."}
                      </p>
                      <p className="text-sm mt-2 text-gray-400">請稍候片刻</p>
                    </div>
                  </div>
                )}

                {/* 錯誤覆蓋層 - 改善設計 */}
                {currentLogic.error && (
                  <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center text-red-300 bg-gray-800 p-6 rounded-xl shadow-lg max-w-md mx-4 border border-red-700">
                      <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-700">
                        <span className="text-2xl">⚠</span>
                      </div>
                      <p className="text-lg font-semibold mb-2">載入失敗</p>
                      <p className="text-sm text-gray-400">
                        {currentLogic.error}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 無人機狀態面板 - 占2/5寬度 */}
            <DroneStatusPanel
              isSimulateMode={isSimulateMode}
              simulateDroneStats={simulateFlyLogic.droneStats}
              isApiLoaded={currentLogic.isApiLoaded}
              droneStatuses={droneStatuses}
              dronePositions={dronePositions}
              activeCommands={activeCommands}
              markersCount={realFlyLogic.markersCount}
              realModeLoading={realModeLoading}
              wsConnected={wsConnected}
            />

          </div>

          {/* 控制面板 - 命令式控制設計 */}
          <FlightControlPanel
            isSimulateMode={isSimulateMode}
            isLoading={currentLogic.isLoading}
            error={currentLogic.error}
            simulateDroneStats={simulateFlyLogic.droneStats}
            simulateFlyLogic={simulateFlyLogic}
            realFlyLogic={realFlyLogic}
            wsConnected={wsConnected}
            sendCommand={sendCommand}
          />
        </div>
      </div>
    </div>
  );
};

export default FlyingPage;
