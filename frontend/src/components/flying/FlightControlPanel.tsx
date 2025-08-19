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
import { useOptimisticCommand } from '../../hooks/useOptimisticCommand';

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
  // 🚀 樂觀更新 Hook
  const {
    executeCommand,
    optimisticState,
    isCommandPending,
    hasAnyPendingCommand,
    error: commandError
  } = useOptimisticCommand();

  /**
   * 為指定的命令類型創建樂觀更新版本的事件處理器
   * 
   * 這個函式會根據模式和設定決定使用樂觀更新或傳統處理方式
   * 
   * @param commandType - 命令類型，用於樂觀更新和待處理狀態管理
   * @param originalHandler - 原始的事件處理器，在不使用樂觀更新時調用
   * @returns 返回一個結合了樂觀更新功能的事件處理器
   * 
   * @example
   * ```typescript
   * const optimisticTakeoff = createOptimisticHandler('takeoff', simulateFlyLogic.takeoff);
   * // 在模擬模式且啟用樂觀更新時，會使用 executeCommand
   * // 否則直接調用 simulateFlyLogic.takeoff
   * ```
   */
  const createOptimisticHandler = (commandType: any, originalHandler?: () => void) => {
    return async () => {
      if (!enableOptimisticUpdates || !isSimulateMode) {
        // 如果不啟用樂觀更新或在真實模式，使用原始處理器
        originalHandler?.();
        return;
      }

      try {
        await executeCommand(commandType);
      } catch (error) {
        console.error(`Command ${commandType} failed:`, error);
        // 錯誤已在 Hook 中處理，這裡可以添加額外的錯誤處理
      }
    };
  };

  // 🔄 合併狀態 - 樂觀狀態優先於實際狀態
  const currentDroneStatus = optimisticState?.status || simulateDroneStats?.status || 'grounded';
  const isAnyOperationPending = hasAnyPendingCommand || isLoading;
  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
      {/* 控制按鈕區域 */}
      <div className="p-4 sm:p-6 border-b border-gray-700">
        {/* 🚀 增強的標題區域，包含樂觀更新狀態 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">
            {isSimulateMode ? "飛行命令控制" : "飛行控制"}
          </h2>
          
          {/* 樂觀更新狀態指示器 */}
          {isSimulateMode && enableOptimisticUpdates && (
            <div className="flex items-center gap-3 text-sm">
              {/* 當前執行命令 */}
              {optimisticState?.isExecuting && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-300">
                    執行中: {optimisticState.currentCommand}
                  </span>
                </div>
              )}
              
              {/* 錯誤狀態 */}
              {(commandError || error) && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span className="text-red-300">命令失敗</span>
                </div>
              )}
              
              {/* 正常狀態 */}
              {!optimisticState?.isExecuting && !commandError && !error && (
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
                  className={`group relative px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('takeoff') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('takeoff', simulateFlyLogic.takeoff)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    !!commandError ||
                    currentDroneStatus !== "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🚁</span>
                    <span>起飛</span>
                  </span>
                </button>

                <button
                  className={`group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('hover') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('hover', simulateFlyLogic.hover)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    !!commandError ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⏸️</span>
                    <span>懸停</span>
                  </span>
                </button>

                <button
                  className={`group relative px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('land') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('land', simulateFlyLogic.land)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    !!commandError ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🛬</span>
                    <span>降落</span>
                  </span>
                </button>

                <button
                  className={`group relative px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('emergency_stop') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('emergency_stop', simulateFlyLogic.emergencyStop)}
                  disabled={isAnyOperationPending || !!error || !!commandError}
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
                  className={`group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('move_forward') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('move_forward', simulateFlyLogic.moveForward)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    !!commandError ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⬆️</span>
                    <span>前進</span>
                  </span>
                </button>

                <button
                  className={`group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('move_backward') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('move_backward', simulateFlyLogic.moveBackward)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    !!commandError ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⬇️</span>
                    <span>後退</span>
                  </span>
                </button>

                <button
                  className={`group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('move_left') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('move_left', simulateFlyLogic.moveLeft)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    !!commandError ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⬅️</span>
                    <span>左移</span>
                  </span>
                </button>

                <button
                  className={`group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('move_right') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('move_right', simulateFlyLogic.moveRight)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    !!commandError ||
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
                  className={`group relative px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('rotate_left') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('rotate_left', simulateFlyLogic.rotateLeft)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    !!commandError ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>↪️</span>
                    <span>左轉</span>
                  </span>
                </button>

                <button
                  className={`group relative px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('rotate_right') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('rotate_right', simulateFlyLogic.rotateRight)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    !!commandError ||
                    currentDroneStatus === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>↩️</span>
                    <span>右轉</span>
                  </span>
                </button>

                <button
                  className={`group relative px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('return_to_home') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('return_to_home', simulateFlyLogic.returnToHome)}
                  disabled={
                    isAnyOperationPending ||
                    !!error ||
                    !!commandError ||
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
                  disabled={isAnyOperationPending || !!error || !!commandError}
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
                  className={`group relative px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm ${
                    isCommandPending('reset') ? 'animate-pulse bg-opacity-80' : ''
                  }`}
                  onClick={createOptimisticHandler('reset', simulateFlyLogic.resetDrone)}
                  disabled={isAnyOperationPending || !!error || !!commandError}
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🔄</span>
                    <span>重置無人機</span>
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