/**
 * @fileoverview 無人機狀態面板組件
 * 
 * 提供無人機狀態監控和資訊顯示功能
 * 支援模擬模式和真實模式的不同資料顯示
 * 🚀 集成 WebSocket 即時更新功能
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-05
 */

import React, { useMemo } from "react";
import { useSimpleRealtimeDroneData } from "../../hooks/useRealtimeDroneData";

/**
 * 無人機狀態介面
 * 
 * 定義無人機狀態資料的基本結構
 */
interface DroneStatus {
  /** 無人機目前狀態 */
  status: string;
  /** 狀態資料長度（可選） */
  length?: number;
}

/**
 * 無人機位置介面
 * 
 * 定義無人機位置資料的基本結構
 */
interface DronePosition {
  /** 緯度 */
  latitude: number;
  /** 經度 */
  longitude: number;
  /** 高度（公尺） */
  altitude: number;
}

/**
 * 模擬無人機狀態統計介面
 * 
 * 定義模擬模式下無人機的完整狀態資訊
 */
interface SimulateDroneStats {
  /** 無人機目前狀態 */
  status: 'grounded' | 'taking_off' | 'hovering' | 'flying' | 'landing' | 'emergency';
  /** 高度（公尺） */
  altitude: number;
  /** 電池電量（百分比） */
  battery: number;
  /** 航向（度） */
  heading: number;
  /** 無人機位置坐標 */
  position: { lat: number; lng: number };
  /** 目前執行中的命令 */
  currentCommand: string | null;
}

/**
 * 無人機狀態面板組件屬性介面
 * 
 * 定義無人機狀態面板組件需要的所有屬性
 */
interface DroneStatusPanelProps {
  /** 是否為模擬模式 */
  isSimulateMode: boolean;
  /** 模擬模式下的無人機狀態統計 */
  simulateDroneStats?: SimulateDroneStats;
  /** Google Maps API 是否已載入 */
  isApiLoaded?: boolean;
  /** 真實模式下的無人機狀態列表 */
  droneStatuses?: DroneStatus[];
  /** 真實模式下的無人機位置列表 */
  dronePositions?: DronePosition[];
  /** 目前活躍的命令列表 */
  activeCommands?: any[];
  /** 地圖上標記點數量 */
  markersCount?: number;
  /** 真實模式是否正在載入 */
  realModeLoading?: boolean;
  /** 是否正在背景更新數據 */
  isBackgroundUpdating?: boolean;
  /** 最後更新時間 */
  lastUpdated?: Date;
  /** WebSocket 連接狀態 */
  wsConnected?: boolean;
}

/**
 * 無人機狀態面板組件
 * 
 * 提供無人機狀態監控和資訊顯示功能，支援模擬和真實兩種模式。
 * 集成 WebSocket 即時更新功能，能夠在真實模式下提供即時的無人機狀態和位置資訊。
 * 在模擬模式下顯示詳細的無人機統計資訊。
 * 
 * @param props - 組件屬性
 * @returns 無人機狀態面板 JSX 元素
 * 
 * @example
 * ```tsx
 * // 模擬模式使用
 * <DroneStatusPanel
 *   isSimulateMode={true}
 *   simulateDroneStats={{
 *     status: 'flying',
 *     altitude: 50,
 *     battery: 85,
 *     heading: 45,
 *     position: { lat: 25.0330, lng: 121.5654 },
 *     currentCommand: 'move_forward'
 *   }}
 *   isApiLoaded={true}
 * />
 * 
 * // 真實模式使用
 * <DroneStatusPanel
 *   isSimulateMode={false}
 *   droneStatuses={droneStatusList}
 *   dronePositions={dronePositionList}
 *   activeCommands={commandList}
 *   markersCount={3}
 * />
 * ```
 */
const DroneStatusPanel: React.FC<DroneStatusPanelProps> = ({
  isSimulateMode,
  simulateDroneStats,
  isApiLoaded = false,
  droneStatuses = [],
  dronePositions = [],
  activeCommands = [],
  markersCount = 0,
  realModeLoading = false,
  isBackgroundUpdating = false,
  lastUpdated,
}) => {
  // 🚀 WebSocket 即時數據
  const {
    realtimeStatuses,
    realtimePositions,
    stats: realtimeStats,
    isConnected: wsConnected,
    isAuthenticated: wsAuthenticated,
    connectionStatus,
    positionCount,
    statusCount,
  } = useSimpleRealtimeDroneData();

  /**
   * 合併 API 數據和 WebSocket 即時數據為無人機狀態
   * 
   * 在真實模式且 WebSocket 連接成功時，優先使用即時數據，
   * 否則使用 API 數據。模擬模式直接使用 API 數據。
   * 
   * @returns 合併後的無人機狀態數據
   */
  const mergedDroneStatuses = useMemo(() => {
    if (isSimulateMode || !wsConnected) {
      return droneStatuses;
    }

    // 將即時狀態數據轉換為與 API 數據兼容的格式
    const realtimeStatusMap = new Map();
    realtimeStatuses.forEach(status => {
      realtimeStatusMap.set(status.drone_id, {
        ...status,
        status: status.flight_status, // 統一狀態欄位名稱
      });
    });

    // 合併 API 數據和即時數據，優先使用即時數據
    const merged = droneStatuses.map(apiStatus => {
      const realtimeStatus = realtimeStatusMap.get((apiStatus as any).drone_id);
      return realtimeStatus ? realtimeStatus : apiStatus;
    });

    // 添加只存在於即時數據中的新無人機
    realtimeStatuses.forEach(realtimeStatus => {
      const existsInApi = droneStatuses.some(
        apiStatus => (apiStatus as any).drone_id === realtimeStatus.drone_id
      );
      if (!existsInApi) {
        merged.push({
          ...realtimeStatus,
          status: realtimeStatus.flight_status,
        });
      }
    });

    return merged;
  }, [isSimulateMode, wsConnected, droneStatuses, realtimeStatuses]);

  /**
   * 合併 API 數據和 WebSocket 即時數據為無人機位置
   * 
   * 在真實模式且 WebSocket 連接成功時，優先使用即時位置數據，
   * 否則使用 API 位置數據。模擬模式不使用即時數據。
   * 
   * @returns 合併後的無人機位置數據
   */
  const mergedDronePositions = useMemo(() => {
    if (isSimulateMode || !wsConnected) {
      return dronePositions;
    }

    return realtimePositions.length > 0 ? realtimePositions : dronePositions;
  }, [isSimulateMode, wsConnected, dronePositions, realtimePositions]);

  /**
   * 取得 WebSocket 連接狀態的顯示顏色
   * 
   * 根據目前的連接狀態和模式返回對應的 CSS 顏色類別
   * 
   * @returns CSS 顏色類別字串
   * 
   * @example
   * ```typescript
   * const colorClass = getConnectionStatusColor();
   * // 返回值可能為: 'text-green-300', 'text-red-300', 等
   * ```
   */
  const getConnectionStatusColor = () => {
    if (isSimulateMode) return 'text-orange-300';
    
    switch (connectionStatus) {
      case 'connected':
      case 'authenticated':
        return 'text-green-300';
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-300';
      case 'disconnected':
      case 'failed':
        return 'text-red-300';
      default:
        return 'text-gray-300';
    }
  };

  /**
   * 取得 WebSocket 連接狀態的顯示文字
   * 
   * 根據目前的連接狀態和模式返回對應的中文狀態文字
   * 
   * @returns 中文狀態文字
   * 
   * @example
   * ```typescript
   * const statusText = getConnectionStatusText();
   * // 返回值可能為: '即時連接', '未連接', '模擬模式', 等
   * ```
   */
  const getConnectionStatusText = () => {
    if (isSimulateMode) return '模擬模式';
    
    switch (connectionStatus) {
      case 'authenticated':
        return '即時連接';
      case 'connected':
        return '已連接';
      case 'connecting':
        return '連接中';
      case 'reconnecting':
        return '重連中';
      case 'disconnected':
        return '未連接';
      case 'failed':
        return '連接失敗';
      default:
        return '未知狀態';
    }
  };
  return (
    <div className="col-span-1 lg:col-span-2 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
      <div className="p-3">
        {/* 🚀 增強的標題區域，包含即時更新和 WebSocket 狀態指示器 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-100">
            {isSimulateMode ? "無人機狀態監控" : "飛行資訊"}
          </h3>
          
          {/* 即時更新和 WebSocket 狀態指示器 */}
          <div className="flex items-center gap-2 text-xs">
            {/* WebSocket 連接狀態 */}
            {!isSimulateMode && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  wsAuthenticated ? 'bg-green-400 animate-pulse' :
                  wsConnected ? 'bg-yellow-400 animate-pulse' : 
                  'bg-red-400'
                }`}></div>
                <span className={getConnectionStatusColor()}>
                  {getConnectionStatusText()}
                </span>
                {wsAuthenticated && realtimeStats.lastUpdateTime && (
                  <span className="text-gray-400 ml-1">
                    ({realtimeStats.positionUpdates + realtimeStats.statusUpdates} 更新)
                  </span>
                )}
              </div>
            )}
            
            {/* 傳統背景更新狀態 */}
            {isBackgroundUpdating && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-300">API更新</span>
              </div>
            )}
            
            {/* 最後更新時間 */}
            {lastUpdated && !isBackgroundUpdating && !wsAuthenticated && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-400">
                  {lastUpdated.toLocaleTimeString('zh-TW', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </span>
              </div>
            )}
            
            {/* 即時更新時間 */}
            {wsAuthenticated && realtimeStats.lastUpdateTime && !isSimulateMode && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-400">
                  {realtimeStats.lastUpdateTime.toLocaleTimeString('zh-TW', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

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
          /* 真實模式 - 顯示實際資料（🚀 集成即時數據）*/
          <div className="space-y-3">
            {/* 系統狀態 */}
            <div>
              <h4 className="text-xs font-medium text-gray-300 mb-2">
                系統狀態 {wsAuthenticated && <span className="text-green-400">• 即時</span>}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className={`bg-gradient-to-br from-blue-900 to-indigo-900 p-2 rounded border border-blue-700 ${
                  wsAuthenticated ? 'ring-1 ring-green-500/30' : ''
                }`}>
                  <div className="text-xs text-blue-300 mb-1">連線無人機</div>
                  <div className="text-sm font-bold text-gray-100">
                    {mergedDroneStatuses.length}
                    {wsAuthenticated && statusCount > 0 && (
                      <span className="text-xs text-green-400 ml-1">
                        (即時: {statusCount})
                      </span>
                    )}
                  </div>
                </div>

                <div className={`bg-gradient-to-br from-green-900 to-emerald-900 p-2 rounded border border-green-700 ${
                  wsAuthenticated ? 'ring-1 ring-green-500/30' : ''
                }`}>
                  <div className="text-xs text-green-300 mb-1">飛行中</div>
                  <div className="text-sm font-bold text-gray-100">
                    {mergedDroneStatuses.filter(d => (d as any).status === 'flying').length}
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

                <div className={`bg-gradient-to-br from-red-900 to-pink-900 p-2 rounded border border-red-700 ${
                  wsAuthenticated && positionCount > 0 ? 'ring-1 ring-green-500/30' : ''
                }`}>
                  <div className="text-xs text-red-300 mb-1">
                    位置追蹤點
                  </div>
                  <div className="text-sm font-bold text-gray-100">
                    {wsAuthenticated ? positionCount : markersCount}
                  </div>
                </div>
              </div>
            </div>

            {/* WebSocket 統計信息（開發模式下顯示）*/}
            {import.meta.env.DEV && wsAuthenticated && (
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-2">
                  即時統計
                </h4>
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-gradient-to-br from-emerald-900 to-green-900 p-1 rounded border border-emerald-700">
                    <div className="text-xs text-emerald-300">位置更新</div>
                    <div className="text-xs font-bold text-gray-100">
                      {realtimeStats.positionUpdates}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-1 rounded border border-blue-700">
                    <div className="text-xs text-blue-300">狀態更新</div>
                    <div className="text-xs font-bold text-gray-100">
                      {realtimeStats.statusUpdates}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-1 rounded border border-purple-700">
                    <div className="text-xs text-purple-300">命令響應</div>
                    <div className="text-xs font-bold text-gray-100">
                      {realtimeStats.commandResponses}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 最新位置資訊 */}
            {mergedDronePositions.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-300 mb-2">
                  最新位置 {wsAuthenticated && realtimePositions.length > 0 && <span className="text-green-400">• 即時</span>}
                </h4>
                <div className={`bg-gradient-to-br from-cyan-900 to-blue-900 p-2 rounded border border-cyan-700 ${
                  wsAuthenticated && realtimePositions.length > 0 ? 'ring-1 ring-green-500/30' : ''
                }`}>
                  <div className="text-xs text-cyan-300 mb-1">
                    {wsAuthenticated && realtimePositions.length > 0 ? 
                      `即時位置 (${realtimePositions[0].drone_id})` : 
                      '最近更新位置'
                    }
                  </div>
                  <div className="text-xs font-mono text-gray-100">
                    {mergedDronePositions[0].latitude.toFixed(4)}, {mergedDronePositions[0].longitude.toFixed(4)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    高度: {mergedDronePositions[0].altitude}m
                    {wsAuthenticated && realtimePositions.length > 0 && (
                      <span className="ml-2 text-green-400">
                        • 速度: {realtimePositions[0].speed || 0} m/s
                      </span>
                    )}
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