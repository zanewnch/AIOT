/**
 * @fileoverview 無人機規格管理介面組件
 *
 * 此組件提供完整的無人機規格管理功能，包括：
 * - 機隊總覽 (drone_serial, model, manufacturer)
 * - 效能限制監控 (max_altitude, max_range)
 * - 維護狀態管理 (ACTIVE, INACTIVE, MAINTENANCE, FLYING)
 * - 規格對比工具 (battery_capacity, weight)
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-04
 */

import React, { useState } from "react";
import { DroneStatusQuery } from "../hooks/useDroneStatusQuery";
import type { DroneStatus } from "../types/droneStatus";

// 對應後端狀態枚舉
enum StatusFilter {
  ALL = 'all',
  IDLE = 'idle',
  ACTIVE = 'active',
  FLYING = 'flying',
  CHARGING = 'charging',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
  OFFLINE = 'offline',
  ERROR = 'error'
}

interface DroneFleetPageProps {
  className?: string;
}

/**
 * 無人機規格管理介面組件
 *
 * 提供機隊管理、規格對比和狀態監控功能
 */
const DroneFleetPage: React.FC<DroneFleetPageProps> = ({ className }) => {
  const [selectedDrones, setSelectedDrones] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'compare'>('grid');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>(StatusFilter.ALL);
  const [sortBy, setSortBy] = useState<'serial' | 'model' | 'status' | 'battery'>('serial');

  // 使用真實 API hooks
  const droneQuery = new DroneStatusQuery();
  const { data: droneFleet = [], isLoading, error } = droneQuery.useAll();

  // 調試：檢查 API 回傳的數據
  React.useEffect(() => {
    if (droneFleet.length > 0) {
      console.log('DroneFleet 數據:', droneFleet[0]);
      console.log('第一台無人機名稱:', droneFleet[0].drone_name);
      console.log('第一台無人機狀態:', droneFleet[0].status);
    }
  }, [droneFleet]);

  // 顯示載入狀態
  if (isLoading) {
    return (
      <div className={`${className || ""} min-h-screen bg-gray-900 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">載入無人機資料中...</p>
        </div>
      </div>
    );
  }

  // 顯示錯誤狀態
  if (error) {
    return (
      <div className={`${className || ""} min-h-screen bg-gray-900 flex items-center justify-center`}>
        <div className="text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <p className="text-gray-300">載入無人機資料失敗</p>
          <p className="text-gray-500 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const updateDroneStatus = (droneId: string, newStatus: string) => {
    // TODO: 實作狀態更新 API 呼叫
    console.log(`更新無人機 ${droneId} 狀態為 ${newStatus}`);
  };

  const toggleDroneSelection = (droneId: string) => {
    setSelectedDrones(prev => 
      prev.includes(droneId) 
        ? prev.filter(id => id !== droneId)
        : [...prev, droneId]
    );
  };

  const clearSelection = () => {
    setSelectedDrones([]);
  };

  const filteredAndSortedDrones = droneFleet
    .filter(drone => filterStatus === StatusFilter.ALL || normalizeStatus(drone.status) === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'serial':
          return (a.drone_serial || '').localeCompare(b.drone_serial || '');
        case 'model':
          return (a.model || '').localeCompare(b.model || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'battery':
          return (b.battery_capacity || 0) - (a.battery_capacity || 0);
        default:
          return 0;
      }
    });

  // 狀態轉換：將後端狀態轉換為前端顯示
  const normalizeStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'active',
      'INACTIVE': 'inactive', 
      'FLYING': 'flying',
      'IDLE': 'idle',
      'CHARGING': 'charging',
      'MAINTENANCE': 'maintenance',
      'OFFLINE': 'offline',
      'ERROR': 'error'
    };
    return statusMap[status.toUpperCase()] || status.toLowerCase();
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    const configs = {
      idle: { bg: 'bg-gray-900/30', text: 'text-gray-300', border: 'border-gray-700', icon: '🟢', label: '待機' },
      active: { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700', icon: '🟢', label: '活躍' },
      flying: { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-700', icon: '✈️', label: '飛行中' },
      charging: { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700', icon: '🔋', label: '充電中' },
      maintenance: { bg: 'bg-orange-900/30', text: 'text-orange-300', border: 'border-orange-700', icon: '🔧', label: '維護中' },
      inactive: { bg: 'bg-gray-900/30', text: 'text-gray-300', border: 'border-gray-700', icon: '⚫', label: '非活躍' },
      offline: { bg: 'bg-red-900/30', text: 'text-red-300', border: 'border-red-700', icon: '📴', label: '離線' },
      error: { bg: 'bg-red-900/30', text: 'text-red-300', border: 'border-red-700', icon: '⚠️', label: '錯誤' },
    };
    
    const config = configs[normalizedStatus as keyof typeof configs] || configs.offline;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  };

  const getManufacturerIcon = (manufacturer: string) => {
    const icons = {
      'DJI': '🇨🇳',
      'Autel': '🇺🇸',
      'Parrot': '🇫🇷',
      'Yuneec': '🇨🇳',
      'Skydio': '🇺🇸',
    };
    return icons[manufacturer as keyof typeof icons] || '🚁';
  };

  // 安全顯示文字（處理編碼問題）
  const safeDisplayText = (text: string | undefined | null): string => {
    if (!text) return '-';
    
    // 檢查是否為亂碼（包含特殊字符模式）
    const hasGarbledText = /[çä¸åæ™ºæ©]/g.test(text);
    
    if (hasGarbledText) {
      // 如果是亂碼，嘗試解碼或使用預設值
      const serialMatch = text.match(/AIOT-(\d+)/);
      if (serialMatch) {
        return `無人機 ${serialMatch[1]} 號`;
      }
      return '無人機名稱';
    }
    
    return text;
  };

  // 網格視圖
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredAndSortedDrones.map((drone) => (
        <div
          key={drone.id}
          className={`bg-gray-800 rounded-xl border transition-all cursor-pointer ${
            selectedDrones.includes(drone.id)
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-gray-700 hover:border-gray-600'
          }`}
          onClick={() => toggleDroneSelection(drone.id)}
        >
          <div className="p-4">
            {/* 標題區域 */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-100 text-sm">{drone.drone_serial}</h3>
                <p className="text-xs text-gray-400">{safeDisplayText(drone.drone_name)}</p>
              </div>
              <input
                type="checkbox"
                checked={selectedDrones.includes(drone.id)}
                onChange={() => toggleDroneSelection(drone.id)}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* 製造商與型號 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{getManufacturerIcon(drone.manufacturer)}</span>
              <div>
                <p className="text-xs font-medium text-gray-200">{drone.manufacturer}</p>
                <p className="text-xs text-gray-400">{drone.model}</p>
              </div>
            </div>

            {/* 狀態 */}
            <div className="mb-3">
              {getStatusBadge(drone.status)}
            </div>

            {/* 規格摘要 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">電池容量</span>
                <span className="text-gray-200">{drone.battery_capacity}mAh</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">最大航程</span>
                <span className="text-gray-200">{(drone.max_range / 1000).toFixed(1)}km</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">重量</span>
                <span className="text-gray-200">{drone.weight}g</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">最大高度</span>
                <span className="text-gray-200">{drone.max_altitude}m</span>
              </div>
            </div>

            {/* 狀態控制 */}
            {drone.status !== 'flying' && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <select
                  value={drone.status}
                  onChange={(e) => updateDroneStatus(drone.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="idle">待機</option>
                  <option value="active">活躍</option>
                  <option value="charging">充電中</option>
                  <option value="maintenance">維護中</option>
                  <option value="inactive">非活躍</option>
                  <option value="offline">離線</option>
                </select>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // 對比視圖
  const CompareView = () => {
    const selectedDroneData = droneFleet.filter(drone => selectedDrones.includes(drone.id));
    
    if (selectedDroneData.length === 0) {
      return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-gray-400">請選擇至少一台無人機進行對比</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">規格對比</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">規格項目</th>
                {selectedDroneData.map((drone) => (
                  <th key={drone.id} className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">
                    {drone.drone_serial}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {[
                { label: '製造商', key: 'manufacturer' },
                { label: '型號', key: 'model' },
                { label: '狀態', key: 'status' },
                { label: '電池容量 (mAh)', key: 'battery_capacity' },
                { label: '最大航程 (km)', key: 'max_range', format: (v: number) => (v / 1000).toFixed(1) },
                { label: '重量 (g)', key: 'weight' },
                { label: '最大高度 (m)', key: 'max_altitude' },
              ].map((spec) => (
                <tr key={spec.key}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-200">{spec.label}</td>
                  {selectedDroneData.map((drone) => (
                    <td key={drone.id} className="px-4 py-3 text-center text-sm text-gray-300">
                      {spec.key === 'status' ? (
                        getStatusBadge(drone[spec.key as keyof DroneStatus] as string)
                      ) : spec.format ? (
                        spec.format(drone[spec.key as keyof DroneStatus] as number)
                      ) : (
                        String(drone[spec.key as keyof DroneStatus])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={`${className || ""} min-h-screen bg-gray-900`}>
      <div className="p-3 sm:p-6 space-y-6">
      {/* 標題與控制 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">無人機規格管理</h2>
          <p className="text-sm text-gray-400">機隊管理、規格對比與狀態監控</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* 視圖模式切換 */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            {[
              { id: 'grid', icon: '📊', label: '網格' },
              { id: 'compare', icon: '⚖️', label: '對比' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === mode.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <span className="mr-1">{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 統計摘要 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">總數量</p>
              <p className="text-2xl font-bold text-gray-100">{droneFleet.length}</p>
            </div>
            <span className="text-2xl">🚁</span>
          </div>
        </div>

        {['idle', 'active', 'flying', 'charging', 'maintenance', 'inactive', 'offline', 'error'].map((status) => {
          const count = droneFleet.filter(drone => normalizeStatus(drone.status) === status).length;
          return (
            <div key={status} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase">{status}</p>
                  <p className="text-2xl font-bold text-gray-100">{count}</p>
                </div>
                {getStatusBadge(status)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 篩選與排序控制 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有狀態</option>
            <option value="idle">待機</option>
            <option value="active">活躍</option>
            <option value="flying">飛行中</option>
            <option value="charging">充電中</option>
            <option value="maintenance">維護中</option>
            <option value="inactive">非活躍</option>
            <option value="offline">離線</option>
            <option value="error">錯誤</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="serial">序號排序</option>
            <option value="model">型號排序</option>
            <option value="status">狀態排序</option>
            <option value="battery">電池容量排序</option>
          </select>
        </div>

        {selectedDrones.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">已選擇 {selectedDrones.length} 台</span>
            <button
              onClick={clearSelection}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
            >
              清除選擇
            </button>
          </div>
        )}
      </div>

      {/* 主要內容 */}
      {viewMode === 'grid' && <GridView />}
      {viewMode === 'compare' && <CompareView />}
      </div>
    </div>
  );
};

export default DroneFleetPage;