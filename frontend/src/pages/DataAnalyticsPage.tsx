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
  const [selectedChart, setSelectedChart] = useState<'performance' | 'heatmap' | 'battery' | 'statistics'>('performance');
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

  // 轉換真實資料格式
  const performanceData: PerformanceDataPoint[] = commandsArchiveData.map(cmd => ({
    timestamp: new Date(cmd.issued_at),
    command_type: cmd.command_type,
    execution_time: cmd.getExecutionTime() || 0,
    wait_time: cmd.getWaitTime() || 0,
    success: cmd.status === 'completed'
  }));

  const flightPathData: FlightPathPoint[] = positionsData.map((pos: DronePositionArchive) => ({
    lat: pos.latitude,
    lng: pos.longitude,
    timestamp: new Date(pos.timestamp),
    altitude: pos.altitude,
    speed: pos.speed || 0
  }));

  // 從位置資料中提取電量資訊，因為狀態歸檔沒有電量欄位
  const batteryData: BatteryDataPoint[] = positionsData
    .filter((pos: DronePositionArchive) => pos.batteryLevel !== undefined)
    .map((pos: DronePositionArchive) => ({
      timestamp: new Date(pos.timestamp),
      battery_level: pos.batteryLevel || 0,
      consumption_rate: 0.8, // 預設消耗率
      predicted_remaining: (pos.batteryLevel || 0) / 0.8
    }));

  // 載入狀態
  const isLoading = commandsLoading || positionsLoading || statusLoading;



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
    if (selectedChart === 'performance') {
      drawPerformanceChart();
    } else if (selectedChart === 'heatmap') {
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
              { id: 'performance', icon: '📊', label: '效能' },
              { id: 'heatmap', icon: '🔥', label: '熱力圖' },
              { id: 'battery', icon: '🔋', label: '電量' },
              { id: 'statistics', icon: '📈', label: '統計' }
            ].map((chart) => (
              <button
                key={chart.id}
                onClick={() => setSelectedChart(chart.id as any)}
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
            {selectedChart === 'performance' && '指令執行效能趨勢'}
            {selectedChart === 'heatmap' && '飛行密度熱力圖'}
            {selectedChart === 'battery' && '電量消耗分析'}
            {selectedChart === 'statistics' && '統計報表'}
          </h3>
        </div>

        <div className="p-4">
          {selectedChart === 'performance' && (
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
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">暫無性能資料</h3>
                  <p className="text-sm text-gray-500">執行一些無人機指令後，性能分析圖表將顯示在這裡</p>
                </div>
              )}
            </div>
          )}

          {selectedChart === 'heatmap' && (
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
                  <div className="text-6xl mb-4">🔥</div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">暫無飛行路徑資料</h3>
                  <p className="text-sm text-gray-500">無人機開始飛行後，飛行密度熱力圖將顯示在這裡</p>
                </div>
              )}
            </div>
          )}

          {selectedChart === 'battery' && (
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
                      <h4 className="text-md font-semibold text-gray-100 mb-3">消耗分析</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">平均消耗率</span>
                          <span className="text-gray-100">{stats.avgConsumptionRate.toFixed(2)}%/min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">預估剩餘時間</span>
                          <span className="text-gray-100">{stats.estimatedFlightTime.toFixed(0)} 分鐘</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">建議返航時間</span>
                          <span className="text-yellow-300">{Math.max(0, stats.estimatedFlightTime - 10).toFixed(0)} 分鐘後</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-100 mb-3">電量預警</h4>
                      <div className="space-y-2">
                        {stats.currentBattery <= 20 && (
                          <div className="flex items-center gap-2 text-red-300">
                            <span>🚨</span>
                            <span className="text-sm">電量嚴重不足，請立即降落</span>
                          </div>
                        )}
                        {stats.currentBattery <= 30 && stats.currentBattery > 20 && (
                          <div className="flex items-center gap-2 text-orange-300">
                            <span>⚠️</span>
                            <span className="text-sm">電量偏低，建議準備返航</span>
                          </div>
                        )}
                        {stats.currentBattery > 30 && (
                          <div className="flex items-center gap-2 text-green-300">
                            <span>✅</span>
                            <span className="text-sm">電量充足，可繼續飛行</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="text-6xl mb-4">🔋</div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">暫無電量資料</h3>
                  <p className="text-sm text-gray-500">無人機開始運作後，電量分析將顯示在這裡</p>
                </div>
              )}
            </div>
          )}

          {selectedChart === 'statistics' && (
            <div className="space-y-6">
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
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default DataAnalyticsPage;