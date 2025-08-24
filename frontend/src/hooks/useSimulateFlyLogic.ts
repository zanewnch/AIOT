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
import { googleMapsLoader } from "../utils/GoogleMapsLoader";

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
type FlightCommand = 'takeoff' | 'land' | 'hover' | 'flyTo' | 'moveForward' | 'moveBackward' | 'moveLeft' | 'moveRight' | 'rotateLeft' | 'rotateRight' | 'emergency' | 'return';

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
  // 動作定時器集合（用於管理各種定時器，避免內存洩漏）
  const actionTimersRef = useRef<Set<NodeJS.Timeout>>(new Set());

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
   * 定時器管理函數
   */
  const addTimer = (timer: NodeJS.Timeout) => {
    actionTimersRef.current.add(timer);
  };

  const clearTimer = (timer: NodeJS.Timeout) => {
    clearInterval(timer);
    actionTimersRef.current.delete(timer);
  };

  const clearAllTimers = () => {
    actionTimersRef.current.forEach(timer => clearInterval(timer));
    actionTimersRef.current.clear();
  };

  /**
   * 載入 Google Maps JavaScript API (使用統一管理器)
   */
  const loadGoogleMapsAPI = async (): Promise<void> => {
    try {
      await googleMapsLoader.load();
    } catch (error) {
      throw error;
    }
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
    if (!mapRef.current || !googleMapsLoader.isGoogleMapsLoaded()) {
      return;
    }

    try {
      // 創建地圖實例
      const map = new window.google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 14,
        mapTypeId: window.google.maps.MapTypeId.HYBRID, // 使用衛星視圖更適合飛行追蹤
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
      if (!droneRef.current) {
        clearTimer(takeoffTimer);
        return;
      }
      
      currentAltitude += 17; // 每秒上升約17米
      droneRef.current.altitude = Math.min(currentAltitude, 50);
      
      if (currentAltitude >= 50) {
        droneRef.current.status = 'hovering';
        droneRef.current.currentCommand = null;
        clearTimer(takeoffTimer);
      }
      
      updateDroneStats();
    }, 1000);
    addTimer(takeoffTimer);
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
      if (!droneRef.current) {
        clearTimer(landingTimer);
        return;
      }
      
      droneRef.current.altitude = Math.max(0, droneRef.current.altitude - 17);
      
      if (droneRef.current.altitude <= 0) {
        droneRef.current.status = 'grounded';
        droneRef.current.currentCommand = null;
        clearTimer(landingTimer);
      }
      
      updateDroneStats();
    }, 1000);
    addTimer(landingTimer);
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
    // 後退：朝航向相反方向移動，但保持原航向
    const headingRad = ((droneRef.current.heading + 180) % 360 * Math.PI) / 180;
    const newLat = droneRef.current.position.lat + distance * Math.cos(headingRad);
    const newLng = droneRef.current.position.lng + distance * Math.sin(headingRad);
    
    // 保持原航向不變（後退不改變朝向）
    flyToPosition({ lat: newLat, lng: newLng });
  };

  /**
   * 飛行命令：左移
   */
  const moveLeft = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    const distance = 0.001;
    // 左移：朝左90度方向移動，但保持原航向
    const headingRad = ((droneRef.current.heading - 90 + 360) % 360 * Math.PI) / 180;
    const newLat = droneRef.current.position.lat + distance * Math.cos(headingRad);
    const newLng = droneRef.current.position.lng + distance * Math.sin(headingRad);
    
    // 保持原航向不變（側移不改變朝向）
    flyToPosition({ lat: newLat, lng: newLng });
  };

  /**
   * 飛行命令：右移
   */
  const moveRight = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    const distance = 0.001;
    // 右移：朝右90度方向移動，但保持原航向
    const headingRad = ((droneRef.current.heading + 90) % 360 * Math.PI) / 180;
    const newLat = droneRef.current.position.lat + distance * Math.cos(headingRad);
    const newLng = droneRef.current.position.lng + distance * Math.sin(headingRad);
    
    // 保持原航向不變（側移不改變朝向）
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
    
    // 清除所有動作定時器
    clearAllTimers();
    
    droneRef.current.status = 'emergency';
    droneRef.current.currentCommand = 'emergency';
    droneRef.current.targetPosition = null;
    
    // 緊急降落（2秒後自動降落）
    const emergencyTimer = setTimeout(() => {
      if (droneRef.current) {
        land();
      }
    }, 2000);
    addTimer(emergencyTimer);
    
    updateDroneStats();
  };

  /**
   * 返航
   */
  const returnToHome = () => {
    if (!droneRef.current || droneRef.current.status === 'grounded') return;
    
    droneRef.current.currentCommand = 'return';
    flyToPosition(droneRef.current.homePosition);
  };

  /**
   * 更新無人機統計資訊
   */
  const updateDroneStats = () => {
    if (!droneRef.current) return;
    
    // 計算真實的飛行距離
    let totalDistance = 0;
    for (let i = 1; i < droneRef.current.flightPath.length; i++) {
      const prev = droneRef.current.flightPath[i - 1];
      const curr = droneRef.current.flightPath[i];
      const latDiff = curr.lat - prev.lat;
      const lngDiff = curr.lng - prev.lng;
      totalDistance += Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // 轉換為公尺
    }
    
    setDroneStats({
      status: droneRef.current.status,
      altitude: droneRef.current.altitude,
      battery: droneRef.current.battery,
      heading: droneRef.current.heading,
      position: droneRef.current.position,
      currentCommand: droneRef.current.currentCommand,
      flightTime: Math.floor(Date.now() / 1000), // 簡化的飛行時間
      distanceTraveled: Math.round(totalDistance), // 真實的距離計算（公尺）
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
        
        // 檢查是否為返航指令，如果是則自動降落
        if (drone.currentCommand === 'return') {
          // 返航到達後自動降落
          drone.status = 'landing';
          drone.currentCommand = 'land';
          
          // 模擬降落過程
          const landingTimer = setInterval(() => {
            if (!droneRef.current) {
              clearTimer(landingTimer);
              return;
            }
            
            droneRef.current.altitude = Math.max(0, droneRef.current.altitude - 17);
            
            if (droneRef.current.altitude <= 0) {
              droneRef.current.status = 'grounded';
              droneRef.current.currentCommand = null;
              clearTimer(landingTimer);
            }
            
            updateDroneStats();
          }, 1000);
          addTimer(landingTimer);
        } else {
          // 其他飛行指令到達後懸停
          drone.status = 'hovering';
          drone.currentCommand = null;
        }
      } else {
        // 計算移動方向的航向角度
        const newHeading = Math.atan2(lngDiff, latDiff) * (180 / Math.PI);
        const normalizedHeading = (newHeading + 360) % 360;
        
        // 只有在非側移和後退時才更新航向（這些操作應保持原航向）
        const currentCommand = drone.currentCommand;
        const shouldUpdateHeading = currentCommand !== 'moveLeft' && 
                                     currentCommand !== 'moveRight' && 
                                     currentCommand !== 'moveBackward';
        
        if (shouldUpdateHeading && Math.abs(normalizedHeading - drone.heading) > 5) {
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
      drone.marker.position = drone.position;

      // 更新飛行路徑
      const currentPath = drone.polyline.getPath();
      currentPath.push(new window.google.maps.LatLng(drone.position.lat, drone.position.lng));
      
      // 添加到飛行路徑歷史
      drone.flightPath.push({ ...drone.position });
    }

    // 模擬電量消耗（基於狀態和高度）
    if (drone.status !== 'grounded') {
      let consumptionRate = 0.05; // 基礎消耗
      
      // 根據狀態調整消耗率
      switch (drone.status) {
        case 'taking_off':
        case 'landing':
          consumptionRate = 0.15; // 起飛降落消耗最多
          break;
        case 'flying':
          consumptionRate = 0.10; // 飛行消耗中等
          break;
        case 'hovering':
          consumptionRate = 0.08; // 懸停消耗稍少
          break;
        case 'emergency':
          consumptionRate = 0.20; // 緊急狀態消耗很大
          break;
      }
      
      // 高度越高，消耗越大
      const altitudeFactor = 1 + (drone.altitude / 1000); // 每1000米增加1倍消耗
      consumptionRate *= altitudeFactor;
      
      drone.battery = Math.max(0, drone.battery - consumptionRate);
      
      // 電量不足時自動返航
      if (drone.battery <= 20 && drone.status !== 'landing' && drone.status !== 'emergency') {
        console.warn('電量不足，自動執行返航');
        returnToHome();
      }
      
      // 電量極低時緊急降落
      if (drone.battery <= 5 && drone.status !== 'emergency') {
        console.error('電量極低，執行緊急降落');
        emergencyStop();
      }
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
    // 清理所有動作定時器
    clearAllTimers();
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
    droneRef.current.marker.position = droneRef.current.position;
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

        // 延遲確保 DOM 和 Google Maps API 都已準備好
        setTimeout(() => {
          initializeMap();
        }, 300);

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
        if (droneRef.current.marker) droneRef.current.marker.map = null;
        if (droneRef.current.polyline) droneRef.current.polyline.map = null;
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