/**
 * @fileoverview 飛行控制面板組件
 * 
 * 提供飛行控制按鈕和操作功能
 * 支援模擬模式和真實模式的不同控制選項
 * 
 * @author AIOT Team
 * @version 1.0.0
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

interface FlightControlPanelProps {
  isSimulateMode: boolean;
  isLoading: boolean;
  error: string;
  // 模擬模式數據
  simulateDroneStats?: SimulateDroneStats;
  simulateFlyLogic?: SimulateFlyLogic;
  // 真實模式數據
  realFlyLogic?: RealFlyLogic;
}

const FlightControlPanel: React.FC<FlightControlPanelProps> = ({
  isSimulateMode,
  isLoading,
  error,
  simulateDroneStats,
  simulateFlyLogic,
  realFlyLogic,
}) => {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
      {/* 控制按鈕區域 */}
      <div className="p-4 sm:p-6 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">
          {isSimulateMode ? "飛行命令控制" : "飛行控制"}
        </h2>

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
                  onClick={simulateFlyLogic.takeoff}
                  disabled={
                    isLoading ||
                    !!error ||
                    simulateDroneStats.status !== "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🚁</span>
                    <span>起飛</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={simulateFlyLogic.hover}
                  disabled={
                    isLoading ||
                    !!error ||
                    simulateDroneStats.status === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⏸️</span>
                    <span>懸停</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={simulateFlyLogic.land}
                  disabled={
                    isLoading ||
                    !!error ||
                    simulateDroneStats.status === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>🛬</span>
                    <span>降落</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={simulateFlyLogic.emergencyStop}
                  disabled={isLoading || !!error}
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
                  onClick={simulateFlyLogic.moveForward}
                  disabled={
                    isLoading ||
                    !!error ||
                    simulateDroneStats.status === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⬆️</span>
                    <span>前進</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={simulateFlyLogic.moveBackward}
                  disabled={
                    isLoading ||
                    !!error ||
                    simulateDroneStats.status === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⬇️</span>
                    <span>後退</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={simulateFlyLogic.moveLeft}
                  disabled={
                    isLoading ||
                    !!error ||
                    simulateDroneStats.status === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>⬅️</span>
                    <span>左移</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={simulateFlyLogic.moveRight}
                  disabled={
                    isLoading ||
                    !!error ||
                    simulateDroneStats.status === "grounded"
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
                  onClick={simulateFlyLogic.rotateLeft}
                  disabled={
                    isLoading ||
                    !!error ||
                    simulateDroneStats.status === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>↪️</span>
                    <span>左轉</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={simulateFlyLogic.rotateRight}
                  disabled={
                    isLoading ||
                    !!error ||
                    simulateDroneStats.status === "grounded"
                  }
                >
                  <span className="flex items-center justify-center gap-1">
                    <span>↩️</span>
                    <span>右轉</span>
                  </span>
                </button>

                <button
                  className="group relative px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                  onClick={simulateFlyLogic.returnToHome}
                  disabled={
                    isLoading ||
                    !!error ||
                    simulateDroneStats.status === "grounded"
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
                  disabled={isLoading || !!error}
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
                  onClick={simulateFlyLogic.resetDrone}
                  disabled={isLoading || !!error}
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