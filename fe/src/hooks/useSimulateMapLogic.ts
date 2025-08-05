/**
 * @fileoverview 模擬地圖邏輯 Hook
 *
 * 此文件提供模擬地圖功能的邏輯處理，包括：
 * - Google Maps API 載入和初始化
 * - 模擬無人機追蹤和移動
 * - 即時位置更新模擬
 * - 飛行路徑追蹤
 * - 模擬數據展示
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-04
 */

import { useEffect, useRef, useState, useCallback } from "react";

// 從環境變數獲取 Google Maps API Key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyD_o0dWCymZaMZRzN6Uy2Rt3U_L56L_eH0";
const GOOGLE_MAPS_API_URL = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=marker&loading=async`;

// 台北101的座標作為預設中心點
const DEFAULT_CENTER = {
  lat: 25.0337,
  lng: 121.5645
};

// 統一起始點（台北101）
const COMMON_START_POINT = { lat: 25.0337, lng: 121.5645 };

// 模擬無人機數據 - 10台無人機
const DRONE_CONFIGS = [
  { id: 'DRONE_001', name: '偵察無人機 Alpha', color: '#FF6B6B', speed: 0.0001 },
  { id: 'DRONE_002', name: '巡邏無人機 Beta', color: '#4ECDC4', speed: 0.0001 },
  { id: 'DRONE_003', name: '監控無人機 Gamma', color: '#45B7D1', speed: 0.0001 },
  { id: 'DRONE_004', name: '救援無人機 Delta', color: '#96CEB4', speed: 0.0001 },
  { id: 'DRONE_005', name: '運輸無人機 Echo', color: '#FFEAA7', speed: 0.0001 },
  { id: 'DRONE_006', name: '測繪無人機 Foxtrot', color: '#DA70D6', speed: 0.0001 },
  { id: 'DRONE_007', name: '通訊無人機 Golf', color: '#FFB347', speed: 0.0001 },
  { id: 'DRONE_008', name: '氣象無人機 Hotel', color: '#87CEEB', speed: 0.0001 },
  { id: 'DRONE_009', name: '安防無人機 India', color: '#F08080', speed: 0.0001 },
  { id: 'DRONE_010', name: '研究無人機 Juliet', color: '#DDA0DD', speed: 0.0001 },
];

/**
 * 生成從共同起點向不同方向的飛行路徑
 * 每台無人機有20個軌跡點，形成放射狀飛行模式
 */
const generateRadialFlightPaths = () => {
  const paths = [];
  const numDrones = DRONE_CONFIGS.length;
  const numWaypoints = 20; // 每台無人機20個軌跡點
  const maxDistance = 0.02; // 最大飛行距離（約2公里）

  for (let droneIndex = 0; droneIndex < numDrones; droneIndex++) {
    // 計算每台無人機的飛行角度（360度均勻分布）
    const angle = (droneIndex * 360) / numDrones;
    const radianAngle = (angle * Math.PI) / 180;

    const path = [COMMON_START_POINT]; // 起始點

    // 生成沿直線方向的20個軌跡點
    for (let waypointIndex = 1; waypointIndex <= numWaypoints; waypointIndex++) {
      const progress = waypointIndex / numWaypoints; // 0.05, 0.1, 0.15, ... 1.0
      const distance = maxDistance * progress;

      // 計算新位置
      const newLat = COMMON_START_POINT.lat + distance * Math.cos(radianAngle);
      const newLng = COMMON_START_POINT.lng + distance * Math.sin(radianAngle);

      path.push({
        lat: newLat,
        lng: newLng
      });
    }

    paths.push(path);
  }

  return paths;
};

// 生成模擬飛行路徑
const SIMULATION_PATHS = generateRadialFlightPaths();

interface DroneState {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  targetIndex: number;
  path: { lat: number; lng: number }[];
  marker: any;
  infoWindow: any;
  polyline: any;
  color: string;
  speed: number;
  altitude: number;
  battery: number;
  status: 'active' | 'returning' | 'landed';
}

// 宣告 Google Maps 全域類型
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

/**
 * 模擬地圖邏輯 Hook
 *
 * 提供模擬地圖功能的所有邏輯處理，包含無人機追蹤等功能
 *
 * @param mapRef - 地圖容器的 React ref
 * @returns 地圖狀態和操作方法
 */
export const useSimulateMapLogic = (mapRef: React.RefObject<HTMLDivElement>) => {
  // Google Maps 實例
  const mapInstanceRef = useRef<any>(null);
  // 無人機狀態
  const dronesRef = useRef<DroneState[]>([]);
  // 模擬計時器
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 組件狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [error, setError] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStats, setSimulationStats] = useState({
    activeDrones: 0,
    completedDrones: 0,
    currentStep: 0,
    totalSteps: 20,
    averageBattery: 100,
    elapsedTime: 0,
    estimatedCompletion: 0,
    coverageRadius: 0,
  });

  /**
   * 載入 Google Maps JavaScript API
   */
  const loadGoogleMapsAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 如果已經載入，直接返回
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      // 如果腳本已經存在，等待載入完成
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Google Maps API 載入失敗')));
        return;
      }

      // 創建並載入腳本
      const script = document.createElement('script');
      script.src = GOOGLE_MAPS_API_URL;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Maps API 載入失敗'));

      document.head.appendChild(script);
    });
  };

  /**
   * 創建自定義無人機圖標 - 現代科技風格
   */
  const createDroneIcon = (color: string): HTMLElement => {
    const droneIcon = document.createElement('div');
    droneIcon.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 1.5px solid #1a1a1a;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.85;
      ">
        <span style="color: white; font-size: 14px; line-height: 1;">⚙</span>
      </div>
    `;
    return droneIcon;
  };

  /**
   * 初始化 Google Maps
   */
  const initializeMap = async () => {
    if (!mapRef.current || !window.google) {
      return;
    }

    try {
      // 創建地圖實例
      const map = new window.google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 14,
        mapTypeId: window.google.maps.MapTypeId.HYBRID, // 使用衛星視圖更適合無人機追蹤
        mapId: 'AIOT_DRONE_MAP' // 必須添加 mapId 以支持 AdvancedMarkerElement
      });

      // 儲存地圖實例
      mapInstanceRef.current = map;

      // 初始化無人機
      initializeDrones(map);

      setIsLoading(false);
    } catch (err) {
      console.error('地圖初始化錯誤:', err);
      setError('地圖初始化失敗');
      setIsLoading(false);
    }
  };

  /**
   * 初始化無人機
   */
  const initializeDrones = (map: any) => {
    dronesRef.current = DRONE_CONFIGS.map((config, index) => {
      const path = SIMULATION_PATHS[index];
      const initialPosition = path[0];

      // 創建標記
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: initialPosition,
        map: map,
        title: config.name,
        content: createDroneIcon(config.color),
      });

      // 創建資訊視窗
      const infoWindow = new window.google.maps.InfoWindow({
        content: createDroneInfoContent(config, initialPosition, 100, 50, 'active'),
      });

      // 創建飛行路徑
      const polyline = new window.google.maps.Polyline({
        path: [initialPosition],
        geodesic: true,
        strokeColor: config.color,
        strokeOpacity: 0.8,
        strokeWeight: 3,
      });
      polyline.setMap(map);

      // 點擊標記顯示資訊視窗
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return {
        id: config.id,
        name: config.name,
        position: initialPosition,
        targetIndex: 1,
        path: path,
        marker: marker,
        infoWindow: infoWindow,
        polyline: polyline,
        color: config.color,
        speed: config.speed,
        altitude: Math.floor(Math.random() * 50) + 30,
        battery: 100,
        status: 'active' as const,
      };
    });
  };

  /**
   * 創建無人機資訊內容
   */
  const createDroneInfoContent = (
    config: { id: string; name: string; color: string },
    position: { lat: number; lng: number },
    battery: number,
    altitude: number,
    status: string
  ) => {
    return `
      <div style="padding: 12px; min-width: 200px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="width: 12px; height: 12px; background-color: ${config.color}; border-radius: 50%; margin-right: 8px;"></div>
          <h3 style="margin: 0; color: #333; font-size: 14px;">${config.name}</h3>
        </div>
        <div style="font-size: 12px; color: #666; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>ID:</strong> ${config.id}</p>
          <p style="margin: 4px 0;"><strong>狀態:</strong> <span style="color: ${status === 'active' ? '#10B981' : '#F59E0B'};">${status === 'active' ? '執行任務' : '返航中'}</span></p>
          <p style="margin: 4px 0;"><strong>高度:</strong> ${altitude}m</p>
          <p style="margin: 4px 0;"><strong>電量:</strong> ${battery}%</p>
          <p style="margin: 4px 0;"><strong>座標:</strong> ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}</p>
        </div>
      </div>
    `;
  };

  /**
   * 更新無人機位置 - 每秒移動到下一個軌跡點
   */
  const updateDronePositions = useCallback(() => {
    if (!mapInstanceRef.current) return;

    let activeDrones = 0;
    let completedDrones = 0;
    let totalBattery = 0;
    let minStep = 20; // 最小步數（用於計算整體進度）
    let maxStep = 0;  // 最大步數

    dronesRef.current.forEach(drone => {
      // 更新步數統計
      const currentStep = Math.max(0, drone.targetIndex - 1);
      minStep = Math.min(minStep, currentStep);
      maxStep = Math.max(maxStep, currentStep);

      if (drone.status === 'landed') {
        completedDrones++;
        totalBattery += drone.battery;
        return;
      }

      // 檢查是否還有軌跡點
      if (drone.targetIndex >= drone.path.length) {
        drone.status = 'landed';
        completedDrones++;
        totalBattery += drone.battery;
        return;
      }

      // 直接移動到下一個軌跡點
      const targetPosition = drone.path[drone.targetIndex];
      drone.position = { ...targetPosition };

      // 更新標記位置
      drone.marker.position = drone.position;

      // 更新飛行路徑
      const currentPath = drone.polyline.getPath();
      currentPath.push(new window.google.maps.LatLng(drone.position.lat, drone.position.lng));

      // 移動到下一個軌跡點
      drone.targetIndex++;

      // 模擬電量消耗（每步消耗4-6%）
      drone.battery = Math.max(0, drone.battery - (4 + Math.random() * 2));

      // 更新資訊視窗內容
      drone.infoWindow.setContent(
        createDroneInfoContent(
          { id: drone.id, name: drone.name, color: drone.color },
          drone.position,
          Math.floor(drone.battery),
          drone.altitude,
          drone.status
        )
      );

      if (drone.status === 'active') {
        activeDrones++;
      }
      totalBattery += drone.battery;
    });

    // 計算覆蓋半徑（基於當前最遠的無人機位置）
    const maxDistance = 0.02; // 總飛行距離
    const currentRadius = (maxStep / 20) * maxDistance * 111; // 轉換為公里

    // 更新統計數據
    setSimulationStats(prev => ({
      activeDrones,
      completedDrones,
      currentStep: minStep,
      totalSteps: 20,
      averageBattery: Math.floor(totalBattery / dronesRef.current.length),
      elapsedTime: prev.elapsedTime + 1,
      estimatedCompletion: activeDrones > 0 ? Math.ceil((20 - minStep)) : 0,
      coverageRadius: Math.round(currentRadius * 100) / 100,
    }));
  }, []);

  /**
   * 開始模擬
   */
  const startSimulation = () => {
    if (simulationTimerRef.current) return;

    setIsSimulating(true);
    // 修改為每秒更新一次（1000ms）
    simulationTimerRef.current = setInterval(updateDronePositions, 1000);
  };

  /**
   * 停止模擬
   */
  const stopSimulation = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
  };

  /**
   * 重置模擬
   */
  const resetSimulation = () => {
    stopSimulation();

    // 重置無人機狀態
    dronesRef.current.forEach(drone => {
      drone.position = drone.path[0];
      drone.targetIndex = 1;
      drone.battery = 100;
      drone.status = 'active';
      drone.marker.position = drone.position;
      drone.polyline.setPath([drone.position]);
    });

    setSimulationStats({
      activeDrones: 0,
      completedDrones: 0,
      currentStep: 0,
      totalSteps: 20,
      averageBattery: 100,
      elapsedTime: 0,
      estimatedCompletion: 20,
      coverageRadius: 0,
    });
  };

  /**
   * 縮放至所有無人機
   */
  const fitToDrones = () => {
    if (!mapInstanceRef.current || dronesRef.current.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    dronesRef.current.forEach(drone => {
      bounds.extend(drone.position);
    });

    mapInstanceRef.current.fitBounds(bounds);
  };

  // 載入 Google Maps API 並初始化地圖
  useEffect(() => {
    const loadAndInitMap = async () => {
      try {
        setIsLoading(true);
        setError("");

        await loadGoogleMapsAPI();
        setIsApiLoaded(true);

        // 短暫延遲確保 DOM 已準備好
        setTimeout(() => {
          initializeMap();
        }, 100);

      } catch (err) {
        console.error('Google Maps 載入錯誤:', err);
        setError(err instanceof Error ? err.message : 'Google Maps 載入失敗');
        setIsLoading(false);
      }
    };

    loadAndInitMap();

    // 清理函數
    return () => {
      stopSimulation();
      dronesRef.current.forEach(drone => {
        if (drone.marker) drone.marker.map = null;
        if (drone.polyline) drone.polyline.map = null;
      });
    };
  }, []);

  return {
    // 狀態
    isLoading,
    isApiLoaded,
    error,
    isSimulating,
    simulationStats,
    dronesCount: dronesRef.current.length,

    // 操作方法
    startSimulation,
    stopSimulation,
    resetSimulation,
    fitToDrones,

    // 地圖實例（供進階使用）
    mapInstance: mapInstanceRef.current,
  };
};