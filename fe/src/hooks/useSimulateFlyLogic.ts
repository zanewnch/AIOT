/**
 * @fileoverview 模擬飛行邏輯 Hook
 *
 * 此文件提供模擬飛行功能的邏輯處理，包括：
 * - Google Maps API 載入和初始化
 * - 模擬無人機飛行追蹤和移動
 * - 即時飛行位置更新模擬
 * - 飛行路徑和航跡追蹤
 * - 模擬飛行數據展示
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

// 起始位置（台北101）
const START_POSITION = { lat: 25.0337, lng: 121.5645 };

// 單一無人機配置
const DRONE_CONFIG = {
  id: 'COMMAND_DRONE_001',
  name: '指令控制飛行器',
  color: '#FF6B6B',
  speed: 0.0002, // 移動速度
};

// 飛行狀態枚舉
type DroneStatus = 'grounded' | 'taking_off' | 'hovering' | 'flying' | 'landing' | 'emergency';

// 飛行命令類型
type FlightCommand = 'takeoff' | 'land' | 'hover' | 'flyTo' | 'moveForward' | 'moveBackward' | 'moveLeft' | 'moveRight' | 'rotateLeft' | 'rotateRight' | 'emergency';

interface DroneState {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  targetPosition: { lat: number; lng: number } | null;
  homePosition: { lat: number; lng: number };
  marker: any;
  infoWindow: any;
  polyline: any;
  color: string;
  speed: number;
  altitude: number;
  battery: number;
  status: DroneStatus;
  heading: number; // 航向角度 (0-360)
  currentCommand: FlightCommand | null;
  flightPath: { lat: number; lng: number }[];
}

// 宣告 Google Maps 全域類型
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

/**
 * 模擬飛行邏輯 Hook
 *
 * 提供模擬飛行功能的所有邏輯處理，包含飛行器追蹤等功能
 *
 * @param mapRef - 地圖容器的 React ref
 * @returns 地圖狀態和操作方法
 */
export const useSimulateFlyLogic = (mapRef: React.RefObject<HTMLDivElement>) => {
  // Google Maps 實例
  const mapInstanceRef = useRef<any>(null);
  // 單一無人機狀態
  const droneRef = useRef<DroneState | null>(null);
  // 飛行控制計時器
  const flightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 組件狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [error, setError] = useState<string>("");
  const [droneStats, setDroneStats] = useState({
    status: 'grounded' as DroneStatus,
    altitude: 0,
    battery: 100,
    heading: 0,
    position: START_POSITION,
    currentCommand: null as FlightCommand | null,
    flightTime: 0,
    distanceTraveled: 0,
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
   * 創建自定義飛行器圖標 - 可旋轉的航空風格
   */
  const createDroneIcon = (color: string, heading: number = 0): HTMLElement => {
    const droneIcon = document.createElement('div');
    droneIcon.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 2px solid #1a1a1a;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${heading}deg);
        cursor: pointer;
      ">
        <span style="color: white; font-size: 14px; line-height: 1;">✈</span>
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
        mapTypeId: window.google.maps.MapTypeId.HYBRID, // 使用衛星視圖更適合飛行追蹤
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ],
        mapId: 'AIOT_DRONE_MAP' // 必須添加 mapId 以支持 AdvancedMarkerElement
      });

      // 儲存地圖實例
      mapInstanceRef.current = map;

      // 初始化無人機
      initializeDrone(map);

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
  const initializeDrone = (map: any) => {
    const initialPosition = START_POSITION;

    // 創建標記
    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      position: initialPosition,
      map: map,
      title: DRONE_CONFIG.name,
      content: createDroneIcon(DRONE_CONFIG.color, 0), // 初始航向為0度
    });

    // 創建資訊視窗
    const infoWindow = new window.google.maps.InfoWindow({
      content: createDroneInfoContent(initialPosition, 0, 100, 0, 'grounded', null),
    });

    // 創建飛行路徑
    const polyline = new window.google.maps.Polyline({
      path: [initialPosition],
      geodesic: true,
      strokeColor: DRONE_CONFIG.color,
      strokeOpacity: 0.8,
      strokeWeight: 3,
    });
    polyline.setMap(map);

    // 點擊標記顯示資訊視窗
    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    // 地圖點擊事件 - 飛行到指定位置
    map.addListener('click', (event: any) => {
      const clickPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      if (droneRef.current && droneRef.current.status !== 'grounded') {
        flyToPosition(clickPosition);
      }
    });

    droneRef.current = {
      id: DRONE_CONFIG.id,
      name: DRONE_CONFIG.name,
      position: initialPosition,
      targetPosition: null,
      homePosition: initialPosition,
      marker: marker,
      infoWindow: infoWindow,
      polyline: polyline,
      color: DRONE_CONFIG.color,
      speed: DRONE_CONFIG.speed,
      altitude: 0,
      battery: 100,
      status: 'grounded',
      heading: 0,
      currentCommand: null,
      flightPath: [initialPosition],
    };
  };

  /**
   * 創建無人機資訊內容
   */
  const createDroneInfoContent = (
    position: { lat: number; lng: number },
    altitude: number,
    battery: number,
    heading: number,
    status: DroneStatus,
    currentCommand: FlightCommand | null
  ) => {
    const statusMap = {
      'grounded': { text: '待機中', color: '#6B7280', icon: '🛬' },
      'taking_off': { text: '起飛中', color: '#F59E0B', icon: '🚁' },
      'hovering': { text: '懸停中', color: '#10B981', icon: '⏸️' },
      'flying': { text: '飛行中', color: '#3B82F6', icon: '✈️' },
      'landing': { text: '降落中', color: '#F59E0B', icon: '🛬' },
      'emergency': { text: '緊急狀態', color: '#EF4444', icon: '🚨' },
    };

    const statusInfo = statusMap[status];
    const commandText = currentCommand ? `執行中: ${currentCommand}` : '無';
    
    return `
      <div style="padding: 12px; min-width: 250px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <div style="width: 12px; height: 12px; background-color: ${DRONE_CONFIG.color}; border-radius: 50%; margin-right: 8px;"></div>
          <h3 style="margin: 0; color: #333; font-size: 14px;">${DRONE_CONFIG.name}</h3>
        </div>
        <div style="font-size: 12px; color: #666; line-height: 1.4;">
          <p style="margin: 4px 0;"><strong>飛行器ID:</strong> ${DRONE_CONFIG.id}</p>
          <p style="margin: 4px 0;"><strong>狀態:</strong> <span style="color: ${statusInfo.color};">${statusInfo.icon} ${statusInfo.text}</span></p>
          <p style="margin: 4px 0;"><strong>高度:</strong> ${altitude}m</p>
          <p style="margin: 4px 0;"><strong>航向:</strong> ${heading}°</p>
          <p style="margin: 4px 0;"><strong>電量:</strong> <span style="color: ${battery > 50 ? '#10B981' : battery > 20 ? '#F59E0B' : '#EF4444'};">${battery}%</span></p>
          <p style="margin: 4px 0;"><strong>目前命令:</strong> ${commandText}</p>
          <p style="margin: 4px 0;"><strong>座標:</strong> ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}</p>
        </div>
      </div>
    `;
  };

  /**
   * 飛行命令：起飛
   */
  const takeoff = () => {
    if (!droneRef.current || droneRef.current.status !== 'grounded') return;
    
    droneRef.current.status = 'taking_off';
    droneRef.current.currentCommand = 'takeoff';
    
    // 模擬起飛過程（3秒內升到50米）
    let currentAltitude = 0;
    const takeoffTimer = setInterval(() => {
      if (!droneRef.current) return;
      
      currentAltitude += 17; // 每秒上升約17米
      droneRef.current.altitude = Math.min(currentAltitude, 50);
      
      if (currentAltitude >= 50) {
        droneRef.current.status = 'hovering';
        droneRef.current.currentCommand = null;
        clearInterval(takeoffTimer);
      }
      
      updateDroneStats();
    }, 1000);
  };

  /**
   * 飛行命令：降落
   */
  const land = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    droneRef.current.status = 'landing';
    droneRef.current.currentCommand = 'land';
    droneRef.current.targetPosition = null;
    
    // 模擬降落過程
    const landingTimer = setInterval(() => {
      if (!droneRef.current) return;
      
      droneRef.current.altitude = Math.max(0, droneRef.current.altitude - 17);
      
      if (droneRef.current.altitude <= 0) {
        droneRef.current.status = 'grounded';
        droneRef.current.currentCommand = null;
        clearInterval(landingTimer);
      }
      
      updateDroneStats();
    }, 1000);
  };

  /**
   * 飛行命令：懸停
   */
  const hover = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    droneRef.current.status = 'hovering';
    droneRef.current.currentCommand = 'hover';
    droneRef.current.targetPosition = null;
  };

  /**
   * 飛行命令：飛行到指定位置
   */
  const flyToPosition = (targetPos: { lat: number; lng: number }) => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    droneRef.current.status = 'flying';
    droneRef.current.currentCommand = 'flyTo';
    droneRef.current.targetPosition = targetPos;
  };

  /**
   * 飛行命令：前進
   */
  const moveForward = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    const distance = 0.001; // 約100米
    const headingRad = (droneRef.current.heading * Math.PI) / 180;
    const newLat = droneRef.current.position.lat + distance * Math.cos(headingRad);
    const newLng = droneRef.current.position.lng + distance * Math.sin(headingRad);
    
    // 保持當前航向不變（前進）
    flyToPosition({ lat: newLat, lng: newLng });
  };

  /**
   * 飛行命令：後退
   */
  const moveBackward = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    const distance = 0.001;
    const headingRad = ((droneRef.current.heading + 180) % 360 * Math.PI) / 180;
    const newLat = droneRef.current.position.lat + distance * Math.cos(headingRad);
    const newLng = droneRef.current.position.lng + distance * Math.sin(headingRad);
    
    // 後退時航向應該相反
    const newHeading = (droneRef.current.heading + 180) % 360;
    droneRef.current.heading = newHeading;
    droneRef.current.marker.content = createDroneIcon(DRONE_CONFIG.color, newHeading);
    
    flyToPosition({ lat: newLat, lng: newLng });
  };

  /**
   * 飛行命令：左移
   */
  const moveLeft = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    const distance = 0.001;
    const headingRad = ((droneRef.current.heading - 90 + 360) % 360 * Math.PI) / 180;
    const newLat = droneRef.current.position.lat + distance * Math.cos(headingRad);
    const newLng = droneRef.current.position.lng + distance * Math.sin(headingRad);
    
    // 左移時航向應該向左
    const newHeading = (droneRef.current.heading - 90 + 360) % 360;
    droneRef.current.heading = newHeading;
    droneRef.current.marker.content = createDroneIcon(DRONE_CONFIG.color, newHeading);
    
    flyToPosition({ lat: newLat, lng: newLng });
  };

  /**
   * 飛行命令：右移
   */
  const moveRight = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    const distance = 0.001;
    const headingRad = ((droneRef.current.heading + 90) % 360 * Math.PI) / 180;
    const newLat = droneRef.current.position.lat + distance * Math.cos(headingRad);
    const newLng = droneRef.current.position.lng + distance * Math.sin(headingRad);
    
    // 右移時航向應該向右
    const newHeading = (droneRef.current.heading + 90) % 360;
    droneRef.current.heading = newHeading;
    droneRef.current.marker.content = createDroneIcon(DRONE_CONFIG.color, newHeading);
    
    flyToPosition({ lat: newLat, lng: newLng });
  };

  /**
   * 飛行命令：左轉
   */
  const rotateLeft = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    droneRef.current.heading = (droneRef.current.heading - 45 + 360) % 360;
    
    // 更新標記圖標以反映新的航向
    droneRef.current.marker.content = createDroneIcon(DRONE_CONFIG.color, droneRef.current.heading);
    
    updateDroneStats();
  };

  /**
   * 飛行命令：右轉
   */
  const rotateRight = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    droneRef.current.heading = (droneRef.current.heading + 45) % 360;
    
    // 更新標記圖標以反映新的航向
    droneRef.current.marker.content = createDroneIcon(DRONE_CONFIG.color, droneRef.current.heading);
    
    updateDroneStats();
  };

  /**
   * 飛行命令：緊急停止
   */
  const emergencyStop = () => {
    if (!droneRef.current) return;
    
    droneRef.current.status = 'emergency';
    droneRef.current.currentCommand = 'emergency';
    droneRef.current.targetPosition = null;
    
    // 緊急降落
    setTimeout(() => {
      land();
    }, 2000);
  };

  /**
   * 返航
   */
  const returnToHome = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    flyToPosition(droneRef.current.homePosition);
  };

  /**
   * 更新無人機統計資訊
   */
  const updateDroneStats = () => {
    if (!droneRef.current) return;
    
    setDroneStats({
      status: droneRef.current.status,
      altitude: droneRef.current.altitude,
      battery: droneRef.current.battery,
      heading: droneRef.current.heading,
      position: droneRef.current.position,
      currentCommand: droneRef.current.currentCommand,
      flightTime: Math.floor(Date.now() / 1000), // 簡化的飛行時間
      distanceTraveled: droneRef.current.flightPath.length * 0.1, // 簡化的距離計算
    });

    // 更新資訊視窗
    if (droneRef.current.infoWindow) {
      droneRef.current.infoWindow.setContent(
        createDroneInfoContent(
          droneRef.current.position,
          droneRef.current.altitude,
          droneRef.current.battery,
          droneRef.current.heading,
          droneRef.current.status,
          droneRef.current.currentCommand
        )
      );
    }
  };

  /**
   * 更新無人機位置 - 持續飛行控制
   */
  const updateDronePositions = useCallback(() => {
    if (!mapInstanceRef.current || !droneRef.current) return;

    const drone = droneRef.current;

    // 如果有目標位置且正在飛行，移動向目標
    if (drone.targetPosition && drone.status === 'flying') {
      const currentLat = drone.position.lat;
      const currentLng = drone.position.lng;
      const targetLat = drone.targetPosition.lat;
      const targetLng = drone.targetPosition.lng;

      // 計算距離
      const latDiff = targetLat - currentLat;
      const lngDiff = targetLng - currentLng;
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

      // 如果距離很小，認為已到達目標
      if (distance < drone.speed * 2) {
        drone.position = { ...drone.targetPosition };
        drone.targetPosition = null;
        drone.status = 'hovering';
        drone.currentCommand = null;
      } else {
        // 計算移動方向的航向角度
        const newHeading = Math.atan2(lngDiff, latDiff) * (180 / Math.PI);
        const normalizedHeading = (newHeading + 360) % 360;
        
        // 只有當航向有明顯變化時才更新（避免頻繁小幅度調整）
        if (Math.abs(normalizedHeading - drone.heading) > 5) {
          drone.heading = normalizedHeading;
          
          // 更新標記圖標以反映飛行方向
          drone.marker.content = createDroneIcon(DRONE_CONFIG.color, drone.heading);
        }

        // 按速度移動向目標
        const moveRatio = drone.speed / distance;
        drone.position = {
          lat: currentLat + latDiff * moveRatio,
          lng: currentLng + lngDiff * moveRatio
        };
      }

      // 更新標記位置
      drone.marker.setPosition(drone.position);

      // 更新飛行路徑
      const currentPath = drone.polyline.getPath();
      currentPath.push(new window.google.maps.LatLng(drone.position.lat, drone.position.lng));
      
      // 添加到飛行路徑歷史
      drone.flightPath.push({ ...drone.position });
    }

    // 模擬電量消耗
    if (drone.status !== 'grounded') {
      const consumptionRate = drone.status === 'flying' ? 0.1 : 0.05; // 飛行時消耗更多電量
      drone.battery = Math.max(0, drone.battery - consumptionRate);
    }

    // 更新統計資訊
    updateDroneStats();
  }, []);

  /**
   * 開始飛行控制系統
   */
  const startFlightControl = () => {
    if (flightTimerRef.current) return;

    // 每500ms更新一次位置（更平滑的移動）
    flightTimerRef.current = setInterval(updateDronePositions, 500);
  };

  /**
   * 停止飛行控制系統
   */
  const stopFlightControl = () => {
    if (flightTimerRef.current) {
      clearInterval(flightTimerRef.current);
      flightTimerRef.current = null;
    }
  };

  /**
   * 重置無人機
   */
  const resetDrone = () => {
    if (!droneRef.current) return;

    // 停止飛行控制
    stopFlightControl();

    // 重置無人機狀態
    droneRef.current.position = { ...droneRef.current.homePosition };
    droneRef.current.targetPosition = null;
    droneRef.current.altitude = 0;
    droneRef.current.battery = 100;
    droneRef.current.status = 'grounded';
    droneRef.current.heading = 0;
    droneRef.current.currentCommand = null;
    droneRef.current.flightPath = [droneRef.current.homePosition];

    // 重置地圖標記
    droneRef.current.marker.setPosition(droneRef.current.position);
    droneRef.current.polyline.setPath([droneRef.current.position]);

    // 更新統計
    updateDroneStats();
  };

  /**
   * 縮放至無人機位置
   */
  const fitToDrone = () => {
    if (!mapInstanceRef.current || !droneRef.current) return;

    mapInstanceRef.current.setCenter(droneRef.current.position);
    mapInstanceRef.current.setZoom(16);
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
      stopFlightControl();
      if (droneRef.current) {
        if (droneRef.current.marker) droneRef.current.marker.setMap(null);
        if (droneRef.current.polyline) droneRef.current.polyline.setMap(null);
      }
    };
  }, []);

  // 自動啟動飛行控制系統
  useEffect(() => {
    if (!isLoading && !error) {
      startFlightControl();
    }
    return () => {
      stopFlightControl();
    };
  }, [isLoading, error]);

  return {
    // 狀態
    isLoading,
    isApiLoaded,
    error,
    droneStats,
    droneCount: droneRef.current ? 1 : 0,

    // 飛行命令
    takeoff,
    land,
    hover,
    flyToPosition,
    moveForward,
    moveBackward,
    moveLeft,
    moveRight,
    rotateLeft,
    rotateRight,
    emergencyStop,
    returnToHome,

    // 系統控制
    startFlightControl,
    stopFlightControl,
    resetDrone,
    fitToDrone,

    // 地圖實例（供進階使用）
    mapInstance: mapInstanceRef.current,
  };
};