/**
 * @fileoverview 無人機狀態面板組件
 * 
 * 提供無人機狀態監控和資訊顯示功能
 * 支援模擬模式和真實模式的不同資料顯示
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-05
 */

import React from "react";

interface DroneStatus {
  status: string;
  length?: number;
}

interface DronePosition {
  latitude: number;
  longitude: number;
  altitude: number;
}

interface SimulateDroneStats {
  status: 'grounded' | 'taking_off' | 'hovering' | 'flying' | 'landing' | 'emergency';
  altitude: number;
  battery: number;
  heading: number;
  position: { lat: number; lng: number };
  currentCommand: string | null;
}

interface DroneStatusPanelProps {
  isSimulateMode: boolean;
  // 模擬模式數據
  simulateDroneStats?: SimulateDroneStats;
  isApiLoaded?: boolean;
  // 真實模式數據
  droneStatuses?: DroneStatus[];
  dronePositions?: DronePosition[];
  activeCommands?: any[];
  markersCount?: number;
  realModeLoading?: boolean;
}

const DroneStatusPanel: React.FC<DroneStatusPanelProps> = ({
  isSimulateMode,
  simulateDroneStats,
  isApiLoaded = false,
  droneStatuses = [],
  dronePositions = [],
  activeCommands = [],
  markersCount = 0,
  realModeLoading = false,
}) => {
  return (
    <div className="col-span-1 lg:col-span-2 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
      <div className="p-3">
        <h3 className="text-base font-semibold text-gray-100 mb-3">
          {isSimulateMode ? "無人機狀態監控" : "飛行資訊"}
        </h3>

        {isSimulateMode ? (
          /* 模擬模式 - 緊湊型無人機狀態監控 */
          <div className="space-y-3">
            {/* 飛行器狀態 - 2x2 網格 */}
            <div>
              <h4 className="text-xs font-medium text-gray-300 mb-2">
                飛行器狀態
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-2 rounded border border-blue-700">
                  <div className="text-xs text-blue-300 mb-1">
                    飛行狀態
                  </div>
                  <div className="text-xs font-bold text-gray-100 flex items-center gap-1">
                    <span>
                      {simulateDroneStats?.status === "grounded" && "🛬"}
                      {simulateDroneStats?.status === "taking_off" && "🚁"}
                      {simulateDroneStats?.status === "hovering" && "⏸️"}
                      {simulateDroneStats?.status === "flying" && "✈️"}
                      {simulateDroneStats?.status === "landing" && "🛬"}
                      {simulateDroneStats?.status === "emergency" && "🚨"}
                    </span>
                    <span className="text-xs">
                      {simulateDroneStats?.status === "grounded" && "待機中"}
                      {simulateDroneStats?.status === "taking_off" && "起飛中"}
                      {simulateDroneStats?.status === "hovering" && "懸停中"}
                      {simulateDroneStats?.status === "flying" && "飛行中"}
                      {simulateDroneStats?.status === "landing" && "降落中"}
                      {simulateDroneStats?.status === "emergency" && "緊急狀態"}
                    </span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-2 rounded border border-green-700">
                  <div className="text-xs text-green-300 mb-1">
                    飛行高度
                  </div>
                  <div className="text-sm font-bold text-gray-100">
                    {simulateDroneStats?.altitude || 0}m
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-900 to-amber-900 p-2 rounded border border-yellow-700">
                  <div className="text-xs text-yellow-300 mb-1">
                    電量剩餘
                  </div>
                  <div
                    className={`text-sm font-bold ${
                      (simulateDroneStats?.battery || 0) > 50
                        ? "text-green-300"
                        : (simulateDroneStats?.battery || 0) > 20
                        ? "text-yellow-300"
                        : "text-red-300"
                    }`}
                  >
                    {simulateDroneStats?.battery || 0}%
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-2 rounded border border-purple-700">
                  <div className="text-xs text-purple-300 mb-1">
                    航向角度
                  </div>
                  <div className="text-sm font-bold text-gray-100">
                    {simulateDroneStats?.heading || 0}°
                  </div>
                </div>
              </div>
            </div>

            {/* 位置資訊 */}
            <div>
              <h4 className="text-xs font-medium text-gray-300 mb-2">
                位置資訊
              </h4>
              <div className="space-y-2">
                <div className="bg-gradient-to-br from-cyan-900 to-blue-900 p-2 rounded border border-cyan-700">
                  <div className="text-xs text-cyan-300 mb-1">
                    GPS 座標
                  </div>
                  <div className="text-xs font-mono text-gray-100">
                    {simulateDroneStats?.position?.lat.toFixed(4) || "0.0000"}
                    ,{" "}
                    {simulateDroneStats?.position?.lng.toFixed(4) || "0.0000"}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 to-violet-900 p-2 rounded border border-indigo-700">
                  <div className="text-xs text-indigo-300 mb-1">
                    目前命令
                  </div>
                  <div className="text-xs font-semibold text-gray-100">
                    {simulateDroneStats?.currentCommand
                      ? `執行中: ${simulateDroneStats.currentCommand}`
                      : "無"}
                  </div>
                </div>
              </div>
            </div>

            {/* 系統資訊 */}
            <div>
              <h4 className="text-xs font-medium text-gray-300 mb-2">
                系統資訊
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-gradient-to-br from-teal-900 to-cyan-900 p-2 rounded border border-teal-700">
                  <div className="text-xs text-teal-300 mb-1">
                    API 狀態
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isApiLoaded
                        ? "bg-green-900/50 text-green-300 border border-green-700"
                        : "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                    }`}
                  >
                    {isApiLoaded ? "已載入" : "載入中"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gradient-to-br from-slate-900 to-gray-900 p-2 rounded border border-slate-700">
                    <div className="text-xs text-slate-300 mb-1">
                      運行模式
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-900/50 text-orange-300 border border-orange-700">
                      模擬模式
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-violet-900 to-purple-900 p-2 rounded border border-violet-700">
                    <div className="text-xs text-violet-300 mb-1">
                      座標系統
                    </div>
                    <div className="text-xs font-semibold text-gray-100">
                      WGS84
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 真實模式 - 顯示實際資料 */
          <div className="space-y-3">
            {/* 系統狀態 */}
            <div>
              <h4 className="text-xs font-medium text-gray-300 mb-2">
                系統狀態
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-2 rounded border border-blue-700">
                  <div className="text-xs text-blue-300 mb-1">連線無人機</div>
                  <div className="text-sm font-bold text-gray-100">
                    {droneStatuses.length}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-2 rounded border border-green-700">
                  <div className="text-xs text-green-300 mb-1">飛行中</div>
                  <div className="text-sm font-bold text-gray-100">
                    {droneStatuses.filter(d => (d as any).status === 'flying').length}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-2 rounded border border-purple-700">
                  <div className="text-xs text-purple-300 mb-1">
                    執行中指令
                  </div>
                  <div className="text-sm font-bold text-gray-100">
                    {activeCommands.length}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-900 to-pink-900 p-2 rounded border border-red-700">
                  <div className="text-xs text-red-300 mb-1">
                    飛行點數量
                  </div>
                  <div className="text-sm font-bold text-gray-100">
                    {markersCount}
                  </div>
                </div>
              </div>
            </div>

            {/* 最新位置資訊 */}
            {dronePositions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-2">
                  最新位置
                </h4>
                <div className="bg-gradient-to-br from-cyan-900 to-blue-900 p-2 rounded border border-cyan-700">
                  <div className="text-xs text-cyan-300 mb-1">
                    最近更新位置
                  </div>
                  <div className="text-xs font-mono text-gray-100">
                    {dronePositions[0].latitude.toFixed(4)}, {dronePositions[0].longitude.toFixed(4)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    高度: {dronePositions[0].altitude}m
                  </div>
                </div>
              </div>
            )}

            {/* 技術資訊 */}
            <div>
              <h4 className="text-xs font-medium text-gray-300 mb-2">
                技術資訊
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-teal-900 to-cyan-900 p-2 rounded border border-teal-700">
                  <div className="text-xs text-teal-300 mb-1">API 狀態</div>
                  <span
                    className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium ${
                      isApiLoaded && !realModeLoading
                        ? "bg-green-900/50 text-green-300 border border-green-700"
                        : "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                    }`}
                  >
                    {isApiLoaded && !realModeLoading ? "已載入" : "載入中"}
                  </span>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-gray-900 p-2 rounded border border-slate-700">
                  <div className="text-xs text-slate-300 mb-1">
                    運行模式
                  </div>
                  <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700">
                    真實模式
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DroneStatusPanel;