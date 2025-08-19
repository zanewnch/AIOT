/**
 * @fileoverview 飛行控制面板組件
 * 
 * 提供飛行控制按鈕和操作功能
 * 支援模擬模式和真實模式的不同控制選項
 * 🚀 集成樂觀更新功能，提升操作響應性
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-05
 */

import React from "react";

interface SimulateDroneStats {
  status: 'grounded' | 'taking_off' | 'hovering' | 'flying' | 'landing' | 'emergency';
}

interface SimulateFlyLogic {
  takeoff: () => void;
  hover: () => void;
  land: () => void;
  emergencyStop: () => void;
  moveForward: () => void;
  moveBackward: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  returnToHome: () => void;
  fitToDrone: () => void;
  resetDrone: () => void;
}

interface RealFlyLogic {
  fitToMarkers: () => void;
  addMarker: () => void;
  clearMarkers: () => void;
  markersCount: number;
}

/**
 * 飛行控制面板組件屬性介面
 * 
 * 定義飛行控制面板組件需要的所有屬性
 */
interface FlightControlPanelProps {
  /** 是否為模擬模式，true 為模擬模式，false 為真實模式 */
  isSimulateMode: boolean;
  /** 是否正在載入中 */
  isLoading: boolean;
  /** 錯誤訊息，無錯誤時為空字串 */
  error: string;
  /** 模擬模式下的無人機狀態資料 */
  simulateDroneStats?: SimulateDroneStats;
  /** 模擬模式下的飛行操作函式 */
  simulateFlyLogic?: SimulateFlyLogic;
  /** 真實模式下的操作函式 */
  realFlyLogic?: RealFlyLogic;
  /** 是否啟用樂觀更新功能，預設為 true */
  enableOptimisticUpdates?: boolean;
}

/**
 * 飛行控制面板組件
 * 
 * 提供無人機飛行控制的主要介面，支援模擬和真實兩種模式。
 * 在模擬模式下提供完整的飛行命令控制，在真實模式下提供地圖標記管理。
 * 集成樂觀更新功能，提升使用者操作體驗。
 * 
 * @param props - 組件屬性
 * @returns 飛行控制面板 JSX 元素
 * 
 * @example
 * ```tsx
 * // 模擬模式使用
 * <FlightControlPanel
 *   isSimulateMode={true}
 *   isLoading={false}
 *   error=""
 *   simulateDroneStats={{ status: 'grounded' }}
 *   simulateFlyLogic={simulateLogic}
 *   enableOptimisticUpdates={true}
 * />
 * 
 * // 真實模式使用
 * <FlightControlPanel
 *   isSimulateMode={false}
 *   isLoading={false}
 *   error=""
 *   realFlyLogic={realLogic}
 * />
 * ```
 */
const FlightControlPanel: React.FC<FlightControlPanelProps> = ({
  isSimulateMode,
  isLoading,
  error,
  simulateDroneStats,
  simulateFlyLogic,
  realFlyLogic,
  enableOptimisticUpdates = true,
}) => {
  // 模擬模式不需要樂觀更新

  /**
   * 創建模擬飛行命令處理器
   * 
   * @param originalHandler - 模擬飛行邏輯函數
   * @returns 返回處理器函數
   */
  const createHandler = (originalHandler?: () => void) => {
    return () => {
      // 模擬模式：直接調用模擬邏輯函數
      originalHandler?.();
    };
  };

  // 🔄 簡化狀態邏輯 - 模擬模式直接使用模擬狀態
  const currentDroneStatus = simulateDroneStats?.status || 'grounded';
  const isAnyOperationPending = isLoading;
  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
      {/* 控制按鈕區域 */}
      <div className="p-4 sm:p-6 border-b border-gray-700">
        {/* 🚀 增強的標題區域，包含樂觀更新狀態 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">
            {isSimulateMode ? "飛行命令控制" : "飛行控制"}
          </h2>
          
          {/* 模擬模式狀態指示器 */}
          {isSimulateMode && (
            <div className="flex items-center gap-3 text-sm">
              {/* 當前執行命令 */}
              {simulateDroneStats?.currentCommand && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-300">
                    執行中: {simulateDroneStats.currentCommand}
                  </span>
                </div>
              )}
              
              {/* 錯誤狀態 */}
              {error && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-red-300">載入失敗</span>
                </div>
              )}
              
              {/* 正常狀態 */}
              {!simulateDroneStats?.currentCommand && !error && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-gray-400">就緒</span>
                </div>
              )}
            </div>
          )}
        </div>

        {isSimulateMode && simulateFlyLogic && simulateDroneStats ? (
          /* 模擬模式 - 命令式控制 */
          <div className="space-y-4">
            {/* 基礎飛行命令 */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                基礎飛行命令
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.takeoff)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    currentDroneStatus !== "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🚁</span>
                    <span>起飛</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.hover)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⏸️</span>
                    <span>懸停</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.land)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🛬</span>
                    <span>降落</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.emergencyStop)}
                  disabled={isAnyOperationPending || !!error}
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🚨</span>
                    <span>緊急停止</span>
                  </span>
                </button>
              </div>
            </div>

            {/* 方向控制命令 */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                方向控制
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.moveForward)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⬆️</span>
                    <span>前進</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.moveBackward)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⬇️</span>
                    <span>後退</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.moveLeft)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⬅️</span>
                    <span>左移</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.moveRight)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>➡️</span>
                    <span>右移</span>
                  </span>
                </button>
              </div>
            </div>

            {/* 旋轉控制 */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                旋轉控制
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.rotateLeft)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>↪️</span>
                    <span>左轉</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.rotateRight)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>↩️</span>
                    <span>右轉</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.returnToHome)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🏠</span>
                    <span>返航</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={simulateFlyLogic.fitToDrone}
                  disabled={isAnyOperationPending || !!error}
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🎯</span>
                    <span>定位</span>
                  </span>
                </button>
              </div>
            </div>

            {/* 系統控制 */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                系統控制
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={createHandler(simulateFlyLogic.resetDrone)}
                  disabled={isAnyOperationPending || !!error}
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🏠</span>
                    <span>返航</span>
                  </span>
                </button>

                <div className="flex items-center justify-center text-xs text-gray-400 bg-gray-700 rounded-lg px-3 py-2">
                  <span>💡 點擊地圖可直接飛行到該位置</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 真實模式控制按鈕 - 改為小按鈕設計
          realFlyLogic && (
            <div className="space-y-4">
              {/* 地圖控制 */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  地圖控制
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    className="group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    onClick={realFlyLogic.fitToMarkers}
                    disabled={
                      isLoading ||
                      !!error ||
                      realFlyLogic.markersCount === 0
                    }
                  >
                    <span className="flex items-center justify-center gap-1">
                      <span>🎯</span>
                      <span>縮放至適合大小</span>
                    </span>
                  </button>

                  <button
                    className="group relative px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    onClick={realFlyLogic.addMarker}
                    disabled={isLoading || !!error}
                  >
                    <span className="flex items-center justify-center gap-1">
                      <span>📍</span>
                      <span>新增飛行點</span>
                    </span>
                  </button>

                  <button
                    className="group relative px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    onClick={realFlyLogic.clearMarkers}
                    disabled={
                      isLoading ||
                      !!error ||
                      realFlyLogic.markersCount === 0
                    }
                  >
                    <span className="flex items-center justify-center gap-1">
                      <span>🗑</span>
                      <span>清除飛行點</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FlightControlPanel;