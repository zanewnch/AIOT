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

import React, { useRef, useState } from "react"; // 引入 React 核心庫和 Hooks
import { useRealFlyLogic } from "../hooks/useRealFlyLogic";
import { useSimulateFlyLogic } from "../hooks/useSimulateFlyLogic";
import { DronePositionQuery } from "../hooks/useDronePositionQuery";
import { DroneCommandQuery } from "../hooks/useDroneCommandQuery";
import { DroneStatusQuery } from "../hooks/useDroneStatusQuery";
import FlyingPageHeader from "../components/flying/FlyingPageHeader";
import MapContainer from "../components/flying/MapContainer";
import DroneStatusPanel from "../components/flying/DroneStatusPanel";
import FlightControlPanel from "../components/flying/FlightControlPanel";

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
  // 地圖容器的引用
  const mapRef = useRef<HTMLDivElement>(null);

  // 模式狀態：true = 模擬模式, false = 真實模式
  const [isSimulateMode, setIsSimulateMode] = useState(false);

  // 根據模式選擇對應的 Hook
  const realFlyLogic = useRealFlyLogic(mapRef);
  const simulateFlyLogic = useSimulateFlyLogic(mapRef);

  // 真實 API 資料 hooks
  const positionQuery = new DronePositionQuery();
  const commandQuery = new DroneCommandQuery();
  const statusQuery = new DroneStatusQuery();
  
  const { data: dronePositions = [], isLoading: positionsLoading } = positionQuery.useLatest();
  const { data: activeCommands = [], isLoading: commandsLoading } = commandQuery.useLatestDroneCommands();
  const { data: droneStatuses = [], isLoading: statusLoading } = statusQuery.useAll();

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
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* 地圖容器 - 占3/5寬度 */}
            <MapContainer
              mapRef={mapRef}
              isLoading={currentLogic.isLoading}
              error={currentLogic.error}
              isSimulateMode={isSimulateMode}
              realModeLoading={realModeLoading}
            />

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
          />
        </div>
      </div>
    </div>
  );
};

export default FlyingPage;
