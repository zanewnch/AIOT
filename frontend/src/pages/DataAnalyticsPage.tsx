/**
 * @fileoverview 資料視覺化儀表板組件
 *
 * 此組件提供完整的資料視覺化功能，包括：
 * - 即時性能圖表 (指令執行時間趨勢)
 * - 飛行熱力圖 (基於位置資料的飛行密度分析)
 * - 電量消耗分析 (預測剩餘飛行時間)
 * - 統計報表與趨勢分析
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-04
 */

import React, { useState, useEffect, useRef } from "react";
import { useGetLatestCommandsArchive } from "../hooks/useDroneCommandArchiveQuery";
import { DronePositionsArchiveQuery } from "../hooks/useDronePositionsArchiveQuery";
import { DroneStatusArchiveQuery } from "../hooks/useDroneStatusArchiveQuery";
import { DroneStatusQuery } from "../hooks/useDroneStatusQuery";
import { DronePositionQuery } from "../hooks/useDronePositionQuery";
import type { DronePositionArchive } from "../types/dronePositionsArchive";

interface DataAnalyticsPageProps {
  className?: string;
}

// 資料點介面
interface PerformanceDataPoint {
  timestamp: Date;
  command_type: string;
  execution_time: number;
  wait_time: number;
  success: boolean;
}

interface FlightPathPoint {
  lat: number;
  lng: number;
  timestamp: Date;
  altitude: number;
  speed: number;
}

interface BatteryDataPoint {
  timestamp: Date;
  battery_level: number;
  consumption_rate: number;
  predicted_remaining: number;
}

/**
 * 資料視覺化儀表板組件
 *
 * 提供各種圖表和分析工具的專業視覺化介面
 */
const DataAnalyticsPage: React.FC<DataAnalyticsPageProps> = ({ className }) => {
  const [selectedChart, setSelectedChart] = useState<'operations' | 'flight' | 'power' | 'drones' | 'archive'>('operations');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);

  // 計算查詢時間範圍
  const getTimeRangeQuery = () => {
    const now = new Date();
    const timeRangeMap = {
      '1h': 1 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    const endDate = now.toISOString();
    const startDate = new Date(now.getTime() - timeRangeMap[timeRange]).toISOString();
    
    return { startDate, endDate };
  };

  // 使用真實 API hooks - 改用可用的 API
  const { data: commandsArchiveData = [], isLoading: commandsLoading } = useGetLatestCommandsArchive(100);
  
  const positionsQuery = new DronePositionsArchiveQuery();
  const { data: positionsData = [], isLoading: positionsLoading } = positionsQuery.useLatest();
  
  const statusQuery = new DroneStatusArchiveQuery();
  const { isLoading: statusLoading } = statusQuery.useLatest();

  // 新增：查詢當前無人機狀態和位置（用於無人機狀態分析）
  const currentStatusQuery = new DroneStatusQuery();
  const { data: currentStatusData = [], isLoading: currentStatusLoading } = currentStatusQuery.useAll();
  
  const currentPositionQuery = new DronePositionQuery();
  const { data: currentPositionData = [], isLoading: currentPositionLoading } = currentPositionQuery.useAll();

  // 轉換真實資料格式
  const performanceData: PerformanceDataPoint[] = commandsArchiveData.map(cmd => {
    // 計算執行時間（毫秒）
    const executionTime = cmd.executed_at && cmd.completed_at 
      ? new Date(cmd.completed_at).getTime() - new Date(cmd.executed_at).getTime()
      : 0;
    
    // 計算等待時間（毫秒）
    const waitTime = cmd.executed_at 
      ? new Date(cmd.executed_at).getTime() - new Date(cmd.issued_at).getTime()
      : 0;
    
    return {
      timestamp: new Date(cmd.issued_at),
      command_type: cmd.command_type,
      execution_time: executionTime,
      wait_time: waitTime,
      success: cmd.status === 'completed'
    };
  });

  const flightPathData: FlightPathPoint[] = positionsData.map((pos: DronePositionArchive) => ({
    lat: pos.latitude,
    lng: pos.longitude,
    timestamp: new Date(pos.timestamp),
    altitude: pos.altitude,
    speed: pos.speed || 0
  }));

  // 從位置資料中提取電量資訊，使用正確的欄位名稱
  const batteryData: BatteryDataPoint[] = positionsData
    .filter((pos: DronePositionArchive) => (pos.batteryLevel !== undefined && pos.batteryLevel !== null))
    .map((pos: DronePositionArchive) => ({
      timestamp: new Date(pos.timestamp),
      battery_level: pos.batteryLevel || 0,
      consumption_rate: 0.8, // 預設消耗率
      predicted_remaining: (pos.batteryLevel || 0) / 0.8
    }));

  // 載入狀態
  const isLoading = commandsLoading || positionsLoading || statusLoading || currentStatusLoading || currentPositionLoading;



  // 繪製效能圖表
  const drawPerformanceChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || performanceData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // 設定樣式
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, width, height);

    // 繪製網格
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // 垂直網格線
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 水平網格線
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 繪製資料線
    if (performanceData.length > 1) {
      const maxExecutionTime = Math.max(...performanceData.map(d => d.execution_time));
      
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();

      performanceData.forEach((point, index) => {
        const x = (width / (performanceData.length - 1)) * index;
        const y = height - (point.execution_time / maxExecutionTime) * height;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // 繪製資料點
      performanceData.forEach((point, index) => {
        const x = (width / (performanceData.length - 1)) * index;
        const y = height - (point.execution_time / maxExecutionTime) * height;
        
        ctx.fillStyle = point.success ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // 繪製標籤
    ctx.fillStyle = '#d1d5db';
    ctx.font = '12px Arial';
    ctx.fillText('執行時間 (ms)', 10, 20);
    ctx.fillText('時間軸', width - 60, height - 10);
  };

  // 繪製熱力圖
  const drawHeatmap = () => {
    const canvas = heatmapRef.current;
    if (!canvas || flightPathData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // 計算邊界
    const lats = flightPathData.map(p => p.lat);
    const lngs = flightPathData.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // 創建密度網格
    const gridSize = 20;
    const grid: number[][] = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));

    flightPathData.forEach(point => {
      const x = Math.floor(((point.lng - minLng) / (maxLng - minLng)) * (gridSize - 1));
      const y = Math.floor(((point.lat - minLat) / (maxLat - minLat)) * (gridSize - 1));
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        grid[y][x]++;
      }
    });

    // 找到最大密度值
    const maxDensity = Math.max(...grid.flat());

    // 繪製熱力圖
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const density = grid[y][x];
        if (density > 0) {
          const intensity = density / maxDensity;
          const alpha = intensity * 0.8;
          
          // 使用顏色漸變：藍色到紅色
          const red = Math.floor(255 * intensity);
          const blue = Math.floor(255 * (1 - intensity));
          
          ctx.fillStyle = `rgba(${red}, 100, ${blue}, ${alpha})`;
          ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    }

    // 繪製飛行路徑
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();

    flightPathData.forEach((point, index) => {
      const x = ((point.lng - minLng) / (maxLng - minLng)) * width;
      const y = ((point.lat - minLat) / (maxLat - minLat)) * height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  // 更新圖表
  useEffect(() => {
    if (selectedChart === 'operations') {
      drawPerformanceChart();
    } else if (selectedChart === 'flight') {
      drawHeatmap();
    }
  }, [selectedChart, performanceData, flightPathData]);

  const getStatistics = () => {
    const totalCommands = performanceData.length;
    const successfulCommands = performanceData.filter(d => d.success).length;
    const successRate = totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0;
    const avgExecutionTime = totalCommands > 0 ? 
      performanceData.reduce((sum, d) => sum + d.execution_time, 0) / totalCommands : 0;
    
    const totalFlightDistance = flightPathData.length > 1 ? 
      flightPathData.reduce((total, point, index) => {
        if (index === 0) return 0;
        const prev = flightPathData[index - 1];
        const distance = Math.sqrt(
          Math.pow((point.lat - prev.lat) * 111000, 2) + 
          Math.pow((point.lng - prev.lng) * 111000 * Math.cos(point.lat * Math.PI / 180), 2)
        );
        return total + distance;
      }, 0) : 0;

    const currentBattery = batteryData.length > 0 ? batteryData[batteryData.length - 1].battery_level : 0;
    const avgConsumptionRate = batteryData.length > 0 ? 
      batteryData.reduce((sum, d) => sum + d.consumption_rate, 0) / batteryData.length : 0;

    return {
      totalCommands,
      successRate,
      avgExecutionTime,
      totalFlightDistance,
      currentBattery,
      avgConsumptionRate,
      estimatedFlightTime: currentBattery / avgConsumptionRate
    };
  };

  const stats = getStatistics();

  // 顯示載入狀態
  if (isLoading) {
    return (
      <div className={`${className || ""} min-h-screen bg-gray-900 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">載入資料分析中...</p>
        </div>
      </div>
    );
  }

  // 檢查是否有任何資料
  const hasAnyData = performanceData.length > 0 || flightPathData.length > 0 || batteryData.length > 0;

  return (
    <div className={`${className || ""} min-h-screen bg-gray-900`}>
      <div className="p-3 sm:p-6 space-y-6">
      {/* 標題與控制 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">資料視覺化儀表板</h2>
          <p className="text-sm text-gray-400">性能分析、飛行軌跡與統計報表</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* 圖表類型選擇 */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            {[
              { id: 'operations', icon: '⚡', label: '運營效率' },
              { id: 'flight', icon: '🛩️', label: '飛行性能' },
              { id: 'power', icon: '🔋', label: '電力管理' },
              { id: 'drones', icon: '🚁', label: '無人機狀態' },
              { id: 'archive', icon: '📊', label: '歷史統計' }
            ].map((chart) => (
              <button
                key={chart.id}
                onClick={() => setSelectedChart(chart.id as 'operations' | 'flight' | 'power' | 'drones' | 'archive')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedChart === chart.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <span className="mr-1">{chart.icon}</span>
                {chart.label}
              </button>
            ))}
          </div>

          {/* 時間範圍選擇 */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">過去 1 小時</option>
            <option value="6h">過去 6 小時</option>
            <option value="24h">過去 24 小時</option>
            <option value="7d">過去 7 天</option>
          </select>
        </div>
      </div>

      {/* 關鍵指標摘要 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalCommands}</div>
            <div className="text-xs text-gray-400">總指令數</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.successRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">成功率</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.avgExecutionTime.toFixed(0)}ms</div>
            <div className="text-xs text-gray-400">平均執行時間</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{(stats.totalFlightDistance / 1000).toFixed(1)}km</div>
            <div className="text-xs text-gray-400">飛行距離</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              stats.currentBattery > 50 ? 'text-green-400' : 
              stats.currentBattery > 20 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {stats.currentBattery.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">當前電量</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{stats.estimatedFlightTime.toFixed(0)}min</div>
            <div className="text-xs text-gray-400">預估飛行時間</div>
          </div>
        </div>
      </div>

      {/* 主要圖表區域 */}
      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">
            {selectedChart === 'operations' && '運營效率分析 - 任務完成率與設備利用率'}
            {selectedChart === 'flight' && '飛行性能分析 - 軌跡熱力圖與飛行統計'}
            {selectedChart === 'power' && '電力管理分析 - 電量趨勢與耗電預測'}
            {selectedChart === 'drones' && '無人機狀態分析 - 設備狀態與健康監控'}
            {selectedChart === 'archive' && '歷史資料分析 - 趨勢統計與性能評估'}
          </h3>
        </div>

        <div className="p-4">
          {selectedChart === 'operations' && (
            <div className="space-y-4">
              {performanceData.length > 0 ? (
                <>
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={300}
                    className="w-full border border-gray-600 rounded"
                  />
                  <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-300">成功執行</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-300">執行失敗</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-1 bg-blue-400"></div>
                      <span className="text-gray-300">執行時間趨勢</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">暫無運營資料</h3>
                  <p className="text-sm text-gray-500">執行一些無人機任務後，運營效率分析圖表將顯示在這裡</p>
                </div>
              )}
            </div>
          )}

          {selectedChart === 'flight' && (
            <div className="space-y-4">
              {flightPathData.length > 0 ? (
                <>
                  <canvas
                    ref={heatmapRef}
                    width={600}
                    height={400}
                    className="w-full border border-gray-600 rounded"
                  />
                  <div className="text-center text-sm text-gray-400">
                    顏色深度表示飛行密度 - 紅色：高密度，藍色：低密度
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">🛩️</div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">暫無飛行路徑資料</h3>
                  <p className="text-sm text-gray-500">無人機開始飛行後，飛行性能分析將顯示在這裡</p>
                </div>
              )}
            </div>
          )}

          {selectedChart === 'power' && (
            <div className="space-y-6">
              {batteryData.length > 0 ? (
                <>
                  {/* 電量趨勢圖 */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-100 mb-3">電量消耗趨勢</h4>
                    <div className="space-y-3">
                      {batteryData.slice(-10).map((point, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="text-xs text-gray-400 w-16">
                            {point.timestamp.toLocaleTimeString('zh-TW').slice(0, 5)}
                          </div>
                          <div className="flex-1 bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                point.battery_level > 50 ? 'bg-green-500' :
                                point.battery_level > 20 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${point.battery_level}%` }}
                            ></div>
                          </div>
                          <div className="text-xs font-semibold text-gray-100 w-12">
                            {point.battery_level.toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 預測分析 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-100 mb-3">電量統計</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">當前電量</span>
                          <span className="text-gray-100">{stats.currentBattery.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">平均電量消耗</span>
                          <span className="text-gray-100">{stats.avgConsumptionRate.toFixed(1)}% /分</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">預估剩餘飛行時間</span>
                          <span className="text-gray-100">{stats.estimatedFlightTime.toFixed(0)} 分鐘</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">建議返航時間</span>
                          <span className="text-yellow-300">{Math.max(0, stats.estimatedFlightTime - 10).toFixed(0)} 分鐘內</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-100 mb-3">安全監控</h4>
                      <div className="space-y-2">
                        {stats.currentBattery <= 15 && (
                          <div className="flex items-center gap-2 text-red-400">
                            <span>🔴</span>
                            <span className="text-sm font-semibold">緊急狀態：電量嚴重不足，必須立即降落</span>
                          </div>
                        )}
                        {stats.currentBattery > 15 && stats.currentBattery <= 25 && (
                          <div className="flex items-center gap-2 text-orange-300">
                            <span>🟡</span>
                            <span className="text-sm">警告：電量偏低，建議準備返航</span>
                          </div>
                        )}
                        {stats.currentBattery > 25 && stats.currentBattery <= 40 && (
                          <div className="flex items-center gap-2 text-yellow-300">
                            <span>🟠</span>
                            <span className="text-sm">注意：電量正常，建議規劃返航路線</span>
                          </div>
                        )}
                        {stats.currentBattery > 40 && (
                          <div className="flex items-center gap-2 text-green-400">
                            <span>🟢</span>
                            <span className="text-sm">正常：電量充足，可安全繼續飛行</span>
                          </div>
                        )}
                        
                        {/* 額外的安全提示 */}
                        <div className="mt-3 pt-2 border-t border-gray-600">
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>• 低電量模式將在 20% 時自動啟用</div>
                            <div>• 系統建議保留 10% 電量做緊急降落</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">🔋</div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">暫無電力資料</h3>
                  <p className="text-sm text-gray-500">無人機開始運作後，電力管理分析將顯示在這裡</p>
                </div>
              )}
            </div>
          )}

          {selectedChart === 'drones' && (
            <div className="space-y-6">
              {(() => {
                // 如果沒有實際資料，使用模擬資料來展示功能
                const hasRealData = currentStatusData.length > 0 || currentPositionData.length > 0;
                const displayStatusData = hasRealData ? currentStatusData : [
                  { id: 1, drone_id: 1, current_status: 'active', current_battery_level: 85, current_altitude: 120, current_speed: 5.2, is_connected: true, last_seen: new Date() },
                  { id: 2, drone_id: 2, current_status: 'flying', current_battery_level: 67, current_altitude: 95, current_speed: 8.1, is_connected: true, last_seen: new Date() },
                  { id: 3, drone_id: 3, current_status: 'inactive', current_battery_level: 23, current_altitude: 0, current_speed: 0, is_connected: false, last_seen: new Date(Date.now() - 300000) },
                  { id: 4, drone_id: 4, current_status: 'maintenance', current_battery_level: 45, current_altitude: 0, current_speed: 0, is_connected: true, last_seen: new Date() },
                  { id: 5, drone_id: 5, current_status: 'flying', current_battery_level: 78, current_altitude: 150, current_speed: 6.8, is_connected: true, last_seen: new Date() }
                ];
                const displayPositionData = hasRealData ? currentPositionData : [
                  { drone_id: 1, latitude: 25.033964, longitude: 121.564468 },
                  { drone_id: 2, latitude: 25.047924, longitude: 121.517081 },
                  { drone_id: 5, latitude: 25.021175, longitude: 121.535885 }
                ];
                
                return hasRealData || displayStatusData.length > 0 ? (
                <>
                  {/* 無人機狀態統計 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 狀態分布圓餅圖 */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-100 mb-4">無人機狀態分布</h4>
                      <div className="space-y-3">
                        {(() => {
                          const statusCounts = displayStatusData.reduce((acc: Record<string, number>, drone: any) => {
                            const status = drone.current_status || drone.status || 'unknown';
                            acc[status] = (acc[status] || 0) + 1;
                            return acc;
                          }, {});

                          const totalDrones = Object.values(statusCounts).reduce((sum: number, count: number) => sum + count, 0);
                          const statusLabels: Record<string, string> = {
                            'active': '活躍',
                            'inactive': '待機',
                            'flying': '飛行中',
                            'maintenance': '維護中',
                            'emergency': '緊急狀態',
                            'unknown': '未知'
                          };

                          const statusColors: Record<string, string> = {
                            'active': 'bg-green-500',
                            'inactive': 'bg-gray-500',
                            'flying': 'bg-blue-500',
                            'maintenance': 'bg-yellow-500',
                            'emergency': 'bg-red-500',
                            'unknown': 'bg-gray-400'
                          };

                          return Object.entries(statusCounts).map(([status, count]) => {
                            const percentage = totalDrones > 0 ? (count / totalDrones * 100) : 0;
                            return (
                              <div key={status} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${statusColors[status] || 'bg-gray-400'}`}></div>
                                  <span className="text-gray-300">{statusLabels[status] || status}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-400">{count} 台</span>
                                  <span className="text-sm font-semibold text-gray-100">{percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* 電量分布統計 */}
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-100 mb-4">電量分布統計</h4>
                      <div className="space-y-3">
                        {(() => {
                          const batteryRanges = [
                            { min: 80, max: 100, label: '充足 (80-100%)', color: 'bg-green-500' },
                            { min: 50, max: 79, label: '良好 (50-79%)', color: 'bg-blue-500' },
                            { min: 30, max: 49, label: '中等 (30-49%)', color: 'bg-yellow-500' },
                            { min: 15, max: 29, label: '偏低 (15-29%)', color: 'bg-orange-500' },
                            { min: 0, max: 14, label: '不足 (0-14%)', color: 'bg-red-500' }
                          ];

                          const batteryCounts = batteryRanges.map(range => {
                            const count = displayStatusData.filter((drone: any) => {
                              const battery = drone.current_battery_level || drone.battery_level || 0;
                              return battery >= range.min && battery <= range.max;
                            }).length;
                            return { ...range, count };
                          });

                          const totalDrones = batteryCounts.reduce((sum, range) => sum + range.count, 0);

                          return batteryCounts.map(range => {
                            const percentage = totalDrones > 0 ? (range.count / totalDrones * 100) : 0;
                            return (
                              <div key={`${range.min}-${range.max}`} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${range.color}`}></div>
                                  <span className="text-gray-300">{range.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-400">{range.count} 台</span>
                                  <span className="text-sm font-semibold text-gray-100">{percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 無人機詳細狀態列表 */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-100 mb-4">無人機狀態詳情</h4>
                    
                    {/* 除錯資訊 - 暫時顯示以了解資料結構 */}
                    {!hasRealData && (
                      <div className="mb-4 p-2 bg-blue-900/30 rounded text-xs border border-blue-500/30">
                        <div className="text-blue-300 text-center">
                          ⚠️ 目前顯示模擬資料 - 當有實際無人機連線時將顯示真實資料
                        </div>
                      </div>
                    )}
                    
                    {hasRealData && currentStatusData.length > 0 && (
                      <div className="mb-4 p-2 bg-gray-800 rounded text-xs">
                        <details className="text-gray-300">
                          <summary className="cursor-pointer text-yellow-400">除錯：資料結構檢視</summary>
                          <pre className="mt-2 overflow-auto">
                            Status Data Sample: {JSON.stringify(currentStatusData[0], null, 2)}
                          </pre>
                          {currentPositionData.length > 0 && (
                            <pre className="mt-2 overflow-auto">
                              Position Data Sample: {JSON.stringify(currentPositionData[0], null, 2)}
                            </pre>
                          )}
                        </details>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayStatusData.slice(0, 9).map((drone: any, index: number) => {
                        const position = displayPositionData.find((pos: any) => pos.drone_id === drone.drone_id);
                        
                        // 嘗試不同的欄位名稱組合
                        const batteryLevel = drone.current_battery_level || drone.battery_level || 0;
                        const status = drone.current_status || drone.status || 'unknown';
                        const droneId = drone.drone_id || drone.id || index;
                        
                        return (
                          <div key={drone.id || index} className="bg-gray-600/50 rounded-lg p-3 border border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-100">無人機 #{droneId}</span>
                                <div className={`w-2 h-2 rounded-full ${
                                  status === 'flying' ? 'bg-blue-500' :
                                  status === 'active' ? 'bg-green-500' :
                                  status === 'maintenance' ? 'bg-yellow-500' :
                                  status === 'emergency' ? 'bg-red-500' : 'bg-gray-500'
                                }`}></div>
                              </div>
                            </div>
                            
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-400">電量</span>
                                <span className={`font-semibold ${
                                  batteryLevel > 50 ? 'text-green-400' :
                                  batteryLevel > 20 ? 'text-yellow-400' : 'text-red-400'
                                }`}>{batteryLevel}%</span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="text-gray-400">高度</span>
                                <span className="text-gray-200">
                                  {(drone.current_altitude || drone.altitude || 0)?.toFixed?.(1) || '--'}m
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="text-gray-400">速度</span>
                                <span className="text-gray-200">
                                  {(drone.current_speed || drone.speed || 0)?.toFixed?.(1) || '--'}m/s
                                </span>
                              </div>
                              
                              <div className="flex justify-between">
                                <span className="text-gray-400">連線</span>
                                <span className={`font-semibold ${
                                  (drone.is_connected !== undefined ? drone.is_connected : true) ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {(drone.is_connected !== undefined ? drone.is_connected : true) ? '已連線' : '離線'}
                                </span>
                              </div>
                              
                              {position && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">位置</span>
                                  <span className="text-gray-200 text-xs">
                                    {position.latitude?.toFixed(4)}, {position.longitude?.toFixed(4)}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex justify-between">
                                <span className="text-gray-400">最後活動</span>
                                <span className="text-gray-200">
                                  {(drone.last_seen || drone.updatedAt) ? 
                                    new Date(drone.last_seen || drone.updatedAt).toLocaleTimeString('zh-TW').slice(0, 5) : 
                                    '--'
                                  }
                                </span>
                              </div>
                              
                              {/* 顯示原始資料以除錯 */}
                              <div className="flex justify-between text-orange-300">
                                <span className="text-gray-400">狀態</span>
                                <span className="text-xs">{status}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {displayStatusData.length > 9 && (
                      <div className="mt-4 text-center">
                        <span className="text-sm text-gray-400">
                          顯示 9 台，共 {displayStatusData.length} 台無人機 {!hasRealData ? '(模擬資料)' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-6xl mb-4">🚁</div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">暫無無人機狀態資料</h3>
                    <p className="text-sm text-gray-500">無人機上線後，狀態分析將顯示在這裡</p>
                  </div>
                );
              })()}
            </div>
          )}

          {selectedChart === 'archive' && (
            <div className="space-y-6">
              {hasAnyData ? (
                <>
                  {/* 詳細統計表格 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-100 mb-3">指令統計</h4>
                      <div className="space-y-3">
                        {['takeoff', 'move', 'hover', 'land'].map(cmdType => {
                          const cmdData = performanceData.filter(d => d.command_type === cmdType);
                          const successCount = cmdData.filter(d => d.success).length;
                          const successRate = cmdData.length > 0 ? (successCount / cmdData.length) * 100 : 0;
                          
                          return (
                            <div key={cmdType} className="flex items-center justify-between">
                              <span className="text-gray-300 capitalize">{cmdType}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{cmdData.length}次</span>
                                <span className={`text-xs font-semibold ${
                                  successRate >= 90 ? 'text-green-300' :
                                  successRate >= 70 ? 'text-yellow-300' : 'text-red-300'
                                }`}>
                                  {successRate.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-100 mb-3">飛行統計</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">總飛行點數</span>
                          <span className="text-gray-100">{flightPathData.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">最高飛行高度</span>
                          <span className="text-gray-100">
                            {flightPathData.length > 0 ? Math.max(...flightPathData.map(d => d.altitude)).toFixed(0) : 0}m
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">最大飛行速度</span>
                          <span className="text-gray-100">
                            {flightPathData.length > 0 ? Math.max(...flightPathData.map(d => d.speed)).toFixed(1) : 0} m/s
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">平均飛行速度</span>
                          <span className="text-gray-100">
                            {flightPathData.length > 0 ? 
                              (flightPathData.reduce((sum, d) => sum + d.speed, 0) / flightPathData.length).toFixed(1) : 0
                            } m/s
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 性能評估 */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-100 mb-3">系統性能評估</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-600/50 rounded">
                        <div className={`text-lg font-bold ${
                          stats.successRate >= 95 ? 'text-green-400' :
                          stats.successRate >= 85 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {stats.successRate >= 95 ? '優秀' : stats.successRate >= 85 ? '良好' : '需改善'}
                        </div>
                        <div className="text-xs text-gray-400">指令執行穩定性</div>
                      </div>

                      <div className="text-center p-3 bg-gray-600/50 rounded">
                        <div className={`text-lg font-bold ${
                          stats.avgExecutionTime < 2000 ? 'text-green-400' :
                          stats.avgExecutionTime < 4000 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {stats.avgExecutionTime < 2000 ? '快速' : stats.avgExecutionTime < 4000 ? '正常' : '緩慢'}
                        </div>
                        <div className="text-xs text-gray-400">響應速度</div>
                      </div>

                      <div className="text-center p-3 bg-gray-600/50 rounded">
                        <div className={`text-lg font-bold ${
                          stats.currentBattery > 50 ? 'text-green-400' :
                          stats.currentBattery > 20 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {stats.currentBattery > 50 ? '充足' : stats.currentBattery > 20 ? '適中' : '不足'}
                        </div>
                        <div className="text-xs text-gray-400">電力狀況</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">📈</div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">暫無統計資料</h3>
                  <p className="text-sm text-gray-500">系統開始運作後，詳細統計報表將顯示在這裡</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default DataAnalyticsPage;