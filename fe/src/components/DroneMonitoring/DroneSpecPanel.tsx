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

import React, { useState, useEffect } from "react";

// 模擬後端的無人機狀態枚舉
enum DroneStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  FLYING = 'flying'
}

// 模擬無人機規格資料結構
interface DroneSpec {
  id: number;
  drone_serial: string;
  drone_name: string;
  model: string;
  manufacturer: string;
  owner_user_id: number;
  status: DroneStatus;
  max_altitude: number;
  max_range: number;
  battery_capacity: number;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DroneSpecPanelProps {
  droneLogic: any;
}

/**
 * 無人機規格管理介面組件
 *
 * 提供機隊管理、規格對比和狀態監控功能
 */
const DroneSpecPanel: React.FC<DroneSpecPanelProps> = ({ droneLogic }) => {
  const [droneFleet, setDroneFleet] = useState<DroneSpec[]>([]);
  const [selectedDrones, setSelectedDrones] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'compare'>('grid');
  const [filterStatus, setFilterStatus] = useState<DroneStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'serial' | 'model' | 'status' | 'battery'>('serial');

  // 生成模擬機隊資料
  useEffect(() => {
    generateMockFleet();
  }, []);

  const generateMockFleet = () => {
    const manufacturers = ['DJI', 'Autel', 'Parrot', 'Yuneec', 'Skydio'];
    const models = {
      'DJI': ['Mavic Air 2', 'Mavic 3', 'Mini 3 Pro', 'Phantom 4 Pro', 'Matrice 300'],
      'Autel': ['EVO II Pro', 'EVO Lite+', 'EVO Max 4T'],
      'Parrot': ['ANAFI', 'ANAFI Ai', 'ANAFI USA'],
      'Yuneec': ['Typhoon H3', 'Mantis G'],
      'Skydio': ['S2+', 'X2']
    };

    const mockFleet: DroneSpec[] = [];
    
    for (let i = 1; i <= 12; i++) {
      const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
      const modelList = models[manufacturer as keyof typeof models];
      const model = modelList[Math.floor(Math.random() * modelList.length)];
      
      const statusValues = Object.values(DroneStatus);
      const status = i === 1 ? DroneStatus.FLYING : statusValues[Math.floor(Math.random() * statusValues.length)];

      mockFleet.push({
        id: i,
        drone_serial: `${manufacturer.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`,
        drone_name: `${manufacturer} ${model} ${i}`,
        model,
        manufacturer,
        owner_user_id: 1,
        status,
        max_altitude: 500 + Math.floor(Math.random() * 1000),
        max_range: 5000 + Math.floor(Math.random() * 10000),
        battery_capacity: 3000 + Math.floor(Math.random() * 2000),
        weight: 400 + Math.floor(Math.random() * 800),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      });
    }

    setDroneFleet(mockFleet);
  };

  const updateDroneStatus = (droneId: number, newStatus: DroneStatus) => {
    setDroneFleet(prev => prev.map(drone => 
      drone.id === droneId 
        ? { ...drone, status: newStatus, updatedAt: new Date() }
        : drone
    ));
  };

  const toggleDroneSelection = (droneId: number) => {
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
    .filter(drone => filterStatus === 'all' || drone.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'serial':
          return a.drone_serial.localeCompare(b.drone_serial);
        case 'model':
          return a.model.localeCompare(b.model);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'battery':
          return b.battery_capacity - a.battery_capacity;
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: DroneStatus) => {
    const configs = {
      [DroneStatus.ACTIVE]: { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700', icon: '🟢' },
      [DroneStatus.INACTIVE]: { bg: 'bg-gray-900/30', text: 'text-gray-300', border: 'border-gray-700', icon: '⚫' },
      [DroneStatus.MAINTENANCE]: { bg: 'bg-orange-900/30', text: 'text-orange-300', border: 'border-orange-700', icon: '🔧' },
      [DroneStatus.FLYING]: { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-700', icon: '✈️' },
    };
    
    const config = configs[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        <span>{config.icon}</span>
        <span>{status.toUpperCase()}</span>
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
                <p className="text-xs text-gray-400">{drone.drone_name}</p>
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
                <span className="text-gray-400">最大高度</span>
                <span className="text-gray-200">{drone.max_altitude}m</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">航程</span>
                <span className="text-gray-200">{(drone.max_range / 1000).toFixed(1)}km</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">電池</span>
                <span className="text-gray-200">{drone.battery_capacity}mAh</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">重量</span>
                <span className="text-gray-200">{drone.weight}g</span>
              </div>
            </div>

            {/* 狀態控制 */}
            {drone.status !== DroneStatus.FLYING && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <select
                  value={drone.status}
                  onChange={(e) => updateDroneStatus(drone.id, e.target.value as DroneStatus)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-gray-100 focus:ring-2 focus:ring-blue-500"
                >
                  <option value={DroneStatus.ACTIVE}>啟用</option>
                  <option value={DroneStatus.INACTIVE}>停用</option>
                  <option value={DroneStatus.MAINTENANCE}>維護中</option>
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
                { label: '最大高度 (m)', key: 'max_altitude' },
                { label: '最大航程 (km)', key: 'max_range', format: (v: number) => (v / 1000).toFixed(1) },
                { label: '電池容量 (mAh)', key: 'battery_capacity' },
                { label: '重量 (g)', key: 'weight' },
              ].map((spec) => (
                <tr key={spec.key}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-200">{spec.label}</td>
                  {selectedDroneData.map((drone) => (
                    <td key={drone.id} className="px-4 py-3 text-center text-sm text-gray-300">
                      {spec.key === 'status' ? (
                        getStatusBadge(drone[spec.key as keyof DroneSpec] as DroneStatus)
                      ) : spec.format ? (
                        spec.format(drone[spec.key as keyof DroneSpec] as number)
                      ) : (
                        String(drone[spec.key as keyof DroneSpec])
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
    <div className="space-y-6">
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
              { id: 'grid', icon: '⊞', label: '網格' },
              { id: 'compare', icon: '⚖', label: '對比' }
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

        {Object.values(DroneStatus).map((status) => {
          const count = droneFleet.filter(drone => drone.status === status).length;
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
            <option value="active">啟用</option>
            <option value="inactive">停用</option>
            <option value="maintenance">維護中</option>
            <option value="flying">飛行中</option>
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
  );
};

export default DroneSpecPanel;