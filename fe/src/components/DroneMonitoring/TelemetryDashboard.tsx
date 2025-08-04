/**
 * @fileoverview 進階遙測儀表板組件
 *
 * 此組件提供完整的遙測數據監控功能，包括：
 * - GPS 訊號強度指示器 (signal_strength)
 * - 速度計與高度計即時顯示 (speed, altitude)
 * - 飛行軌跡回放 (timestamp 序列)
 * - 電量預警系統 (battery_level)
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-04
 */

import React, { useState, useEffect, useRef } from "react";

interface TelemetryDashboardProps {
  droneLogic: any;
}

interface TelemetryData {
  timestamp: Date;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  battery_level: number;
  signal_strength: number;
}

/**
 * 進階遙測儀表板組件
 *
 * 提供專業級的遙測數據監控和分析功能
 */
const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ droneLogic }) => {
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryData[]>([]);
  const [isRecording, setIsRecording] = useState(true);
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 記錄遙測資料
  useEffect(() => {
    if (!isRecording || !droneLogic.droneStats) return;

    const interval = setInterval(() => {
      const newData: TelemetryData = {
        timestamp: new Date(),
        latitude: droneLogic.droneStats.position.lat,
        longitude: droneLogic.droneStats.position.lng,
        altitude: droneLogic.droneStats.altitude,
        speed: Math.random() * 15, // 模擬速度數據
        heading: droneLogic.droneStats.heading,
        battery_level: droneLogic.droneStats.battery,
        signal_strength: 85 + Math.random() * 15, // 模擬GPS信號強度
      };

      setTelemetryHistory(prev => {
        const updated = [...prev, newData];
        // 只保留最近500筆資料
        return updated.slice(-500);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, droneLogic.droneStats]);

  // 軌跡回放控制
  const startPlayback = () => {
    if (telemetryHistory.length === 0) return;
    
    setIsPlaying(true);
    setPlaybackIndex(0);
    
    playbackIntervalRef.current = setInterval(() => {
      setPlaybackIndex(prev => {
        if (prev >= telemetryHistory.length - 1) {
          setIsPlaying(false);
          return -1;
        }
        return prev + 1;
      });
    }, 200);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setPlaybackIndex(-1);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const clearHistory = () => {
    setTelemetryHistory([]);
    stopPlayback();
  };

  // 獲取當前顯示的數據（回放模式下顯示歷史數據）
  const getCurrentData = (): TelemetryData | null => {
    if (playbackIndex >= 0 && telemetryHistory[playbackIndex]) {
      return telemetryHistory[playbackIndex];
    }
    if (telemetryHistory.length > 0) {
      return telemetryHistory[telemetryHistory.length - 1];
    }
    return null;
  };

  const currentData = getCurrentData();

  // 圓形進度條組件
  const CircularProgress: React.FC<{
    value: number;
    max: number;
    color: string;
    size: number;
    strokeWidth: number;
    children: React.ReactNode;
  }> = ({ value, max, color, size, strokeWidth, children }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = (value / max) * circumference;

    return (
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(55, 65, 81)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  };

  // GPS信號強度指示器
  const GPSStrengthIndicator: React.FC<{ strength: number }> = ({ strength }) => {
    const bars = Array.from({ length: 5 }, (_, i) => {
      const threshold = (i + 1) * 20;
      const isActive = strength >= threshold;
      return (
        <div
          key={i}
          className={`w-2 rounded-t transition-colors ${
            isActive 
              ? strength >= 80 ? 'bg-green-400' : strength >= 60 ? 'bg-yellow-400' : 'bg-orange-400'
              : 'bg-gray-600'
          }`}
          style={{ height: `${(i + 1) * 4 + 8}px` }}
        />
      );
    });

    return (
      <div className="flex items-end gap-1 h-8">
        {bars}
      </div>
    );
  };

  // 電量預警檢查
  const getBatteryWarning = (battery: number) => {
    if (battery <= 10) return { level: 'critical', message: '電量極低！請立即降落', color: 'text-red-300' };
    if (battery <= 20) return { level: 'warning', message: '電量偏低，建議返航', color: 'text-orange-300' };
    if (battery <= 30) return { level: 'caution', message: '注意電量狀況', color: 'text-yellow-300' };
    return null;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* 標題與控制 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">進階遙測儀表板</h2>
          <p className="text-sm text-gray-400">即時監控無人機遙測數據與飛行軌跡</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggleRecording}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRecording ? '⏹️ 停止記錄' : '⏺️ 開始記錄'}
          </button>

          <button
            onClick={isPlaying ? stopPlayback : startPlayback}
            disabled={telemetryHistory.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? '⏸️ 停止回放' : '▶️ 軌跡回放'}
          </button>

          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
          >
            🗑️ 清除歷史
          </button>
        </div>
      </div>

      {/* 電量預警 */}
      {currentData && getBatteryWarning(currentData.battery_level) && (
        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-300">電量預警</p>
              <p className={`text-sm ${getBatteryWarning(currentData.battery_level)?.color}`}>
                {getBatteryWarning(currentData.battery_level)?.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 主要儀表板 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 速度計 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 text-center">飛行速度</h3>
          <CircularProgress
            value={currentData?.speed || 0}
            max={20}
            color="rgb(59, 130, 246)"
            size={120}
            strokeWidth={8}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {currentData?.speed.toFixed(1) || '0.0'}
              </div>
              <div className="text-xs text-gray-400">m/s</div>
            </div>
          </CircularProgress>
        </div>

        {/* 高度計 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 text-center">飛行高度</h3>
          <CircularProgress
            value={currentData?.altitude || 0}
            max={120}
            color="rgb(16, 185, 129)"
            size={120}
            strokeWidth={8}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {currentData?.altitude || 0}
              </div>
              <div className="text-xs text-gray-400">m</div>
            </div>
          </CircularProgress>
        </div>

        {/* 電量計 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 text-center">電池電量</h3>
          <CircularProgress
            value={currentData?.battery_level || 0}
            max={100}
            color={
              (currentData?.battery_level || 0) > 50 ? "rgb(16, 185, 129)" :
              (currentData?.battery_level || 0) > 20 ? "rgb(245, 158, 11)" : "rgb(239, 68, 68)"
            }
            size={120}
            strokeWidth={8}
          >
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                (currentData?.battery_level || 0) > 50 ? 'text-green-400' :
                (currentData?.battery_level || 0) > 20 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {currentData?.battery_level || 0}
              </div>
              <div className="text-xs text-gray-400">%</div>
            </div>
          </CircularProgress>
        </div>

        {/* GPS信號強度 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4 text-center">GPS信號</h3>
          <div className="flex flex-col items-center gap-4">
            <GPSStrengthIndicator strength={currentData?.signal_strength || 0} />
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                (currentData?.signal_strength || 0) >= 80 ? 'text-green-400' :
                (currentData?.signal_strength || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {currentData?.signal_strength.toFixed(0) || 0}
              </div>
              <div className="text-xs text-gray-400">dBm</div>
            </div>
          </div>
        </div>
      </div>

      {/* 詳細數據面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 即時數據 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100">
              即時遙測數據
              {playbackIndex >= 0 && (
                <span className="ml-2 text-sm text-orange-300">(回放模式)</span>
              )}
            </h3>
          </div>
          
          <div className="p-4 space-y-4">
            {currentData ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">時間戳記</label>
                    <div className="text-sm font-mono text-gray-100">
                      {formatTime(currentData.timestamp)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">航向角度</label>
                    <div className="text-sm font-semibold text-gray-100">
                      {currentData.heading.toFixed(1)}°
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">緯度</label>
                    <div className="text-sm font-mono text-gray-100">
                      {currentData.latitude.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">經度</label>
                    <div className="text-sm font-mono text-gray-100">
                      {currentData.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-700">
                  <label className="text-xs text-gray-400">原始數據 (JSON)</label>
                  <div className="mt-2 p-3 bg-gray-900/50 rounded text-xs font-mono text-gray-300 overflow-auto max-h-32">
                    {JSON.stringify(currentData, null, 2)}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <span className="text-4xl mb-4 block">📡</span>
                <p>等待遙測數據...</p>
              </div>
            )}
          </div>
        </div>

        {/* 軌跡統計 */}
        <div className="bg-gray-800 rounded-xl border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100">飛行軌跡統計</h3>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-900/20 rounded border border-blue-700">
                <div className="text-2xl font-bold text-blue-400">
                  {telemetryHistory.length}
                </div>
                <div className="text-xs text-blue-300">記錄點數</div>
              </div>
              
              <div className="text-center p-3 bg-green-900/20 rounded border border-green-700">
                <div className="text-2xl font-bold text-green-400">
                  {telemetryHistory.length > 0 ? 
                    Math.max(...telemetryHistory.map(d => d.altitude)).toFixed(0) : '0'
                  }m
                </div>
                <div className="text-xs text-green-300">最高高度</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-purple-900/20 rounded border border-purple-700">
                <div className="text-2xl font-bold text-purple-400">
                  {telemetryHistory.length > 0 ? 
                    Math.max(...telemetryHistory.map(d => d.speed)).toFixed(1) : '0.0'
                  }
                </div>
                <div className="text-xs text-purple-300">最大速度 (m/s)</div>
              </div>

              <div className="text-center p-3 bg-yellow-900/20 rounded border border-yellow-700">
                <div className="text-2xl font-bold text-yellow-400">
                  {telemetryHistory.length > 0 ? 
                    (telemetryHistory.reduce((sum, d) => sum + d.signal_strength, 0) / telemetryHistory.length).toFixed(0) : '0'
                  }
                </div>
                <div className="text-xs text-yellow-300">平均GPS信號</div>
              </div>
            </div>

            {/* 記錄狀態 */}
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">記錄狀態</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isRecording 
                    ? 'bg-red-900/30 text-red-300 border border-red-700' 
                    : 'bg-gray-700 text-gray-300'
                }`}>
                  {isRecording ? '🔴 記錄中' : '⏹️ 已停止'}
                </span>
              </div>
              
              {playbackIndex >= 0 && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">回放進度</span>
                  <span className="text-xs text-orange-300">
                    {playbackIndex + 1} / {telemetryHistory.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryDashboard;