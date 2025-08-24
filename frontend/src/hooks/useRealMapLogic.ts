/**
 * @fileoverview 真實地圖邏輯 Hook
 *
 * 此文件提供真實地圖功能的邏輯處理，包括：
 * - Google Maps API 載入和初始化
 * - 基本地圖操作（添加標記、縮放等）
 * - 真實數據的地圖展示
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-04
 */

import { useEffect, useRef, useState } from "react";
import { googleMapsLoader } from "../utils/GoogleMapsLoader";

/**
 * 預設地圖中心點座標（台北101）
 * 
 * @constant {Object} DEFAULT_CENTER
 * @description 作為地圖初始化的預設地理座標
 */
const DEFAULT_CENTER = {
  /** 緯度 */
  lat: 25.0337,
  /** 經度 */
  lng: 121.5645
};

/**
 * 宣告 Google Maps 全域類型
 * 
 * @description 擴展 Window 介面以包含 Google Maps API
 */
declare global {
  interface Window {
    /** Google Maps API 全域物件 */
    google: any;
    /** Google Maps 初始化函數（可選） */
    initMap?: () => void;
  }
}

/**
 * 真實地圖邏輯 Hook
 *
 * @description 提供真實地圖功能的所有邏輯處理，包括 Google Maps 初始化、標記管理等
 * @param mapRef - 地圖容器的 React ref
 * @returns 包含地圖狀態、標記管理和操作方法的物件
 * 
 * @example
 * ```typescript
 * const mapRef = useRef<HTMLDivElement>(null);
 * const {
 *   isLoading,
 *   error,
 *   addMarker,
 *   clearMarkers,
 *   markersCount
 * } = useRealMapLogic(mapRef);
 * 
 * // 添加標記
 * const handleAddMarker = () => {
 *   addMarker();
 * };
 * 
 * // 清除所有標記
 * const handleClearMarkers = () => {
 *   clearMarkers();
 * };
 * ```
 */
export const useRealMapLogic = (mapRef: React.RefObject<HTMLDivElement>) => {
  // Google Maps 實例
  const mapInstanceRef = useRef<any>(null);
  // 標記陣列
  const markersRef = useRef<any[]>([]);
  
  // 組件狀態
  const [isLoading, setIsLoading] = useState(true);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [error, setError] = useState<string>("");

  /**
   * 載入 Google Maps JavaScript API
   * 
   * @description 使用統一管理器加載 Google Maps API
   * @returns Promise，解析為 void
   * @throws 當 API 載入失敗時拋出錯誤
   */
  const loadGoogleMapsAPI = async (): Promise<void> => {
    try {
      await googleMapsLoader.load();
    } catch (error) {
      throw error;
    }
  };

  /**
   * 初始化 Google Maps
   * 
   * @description 創建地圖實例並設置預設標記（台北101）
   * @throws 當地圖初始化失敗時拋出錯誤
   */
  const initializeMap = async () => {
    if (!mapRef.current || !googleMapsLoader.isGoogleMapsLoaded()) {
      return;
    }

    try {
      // 創建地圖實例
      const map = new window.google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapId: 'AIOT_DRONE_MAP' // 必須添加 mapId 以支援 AdvancedMarkerElement
      });

      // 添加預設標記（台北101）
      const markerContent = document.createElement('div');
      markerContent.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background-color: #4F46E5;
          border: 2px solid #1E40AF;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <span style="color: white; font-size: 14px; line-height: 1;">🏢</span>
        </div>
      `;
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: DEFAULT_CENTER,
        map: map,
        title: '台北101',
        content: markerContent,
      });

      // 添加資訊視窗
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">台北101</h3>
            <p style="margin: 0; color: #666;">台北市信義區信義路五段7號</p>
            <p style="margin: 5px 0 0 0; color: #666;">緯度: ${DEFAULT_CENTER.lat}, 經度: ${DEFAULT_CENTER.lng}</p>
          </div>
        `,
      });

      // 點擊標記顯示資訊視窗
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // 地圖點擊事件
      map.addListener('click', (event: any) => {
        console.log('地圖點擊座標:', event.latLng.lat(), event.latLng.lng());
      });

      // 儲存引用
      mapInstanceRef.current = map;
      markersRef.current = [marker];

      setIsLoading(false);
    } catch (err) {
      console.error('地圖初始化錯誤:', err);
      setError('地圖初始化失敗');
      setIsLoading(false);
    }
  };

  /**
   * 添加新標記
   * 
   * @description 在地圖中心附近隨機位置添加新的標記
   * 
   * @example
   * ```typescript
   * // 添加標記
   * addMarker();
   * console.log('標記數量:', markersCount);
   * ```
   */
  const addMarker = () => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const center = map.getCenter();
    
    // 在地圖中心稍微偏移的位置添加標記
    const position = {
      lat: center.lat() + (Math.random() - 0.5) * 0.01,
      lng: center.lng() + (Math.random() - 0.5) * 0.01,
    };

    const markerContent = document.createElement('div');
    markerContent.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        background-color: #10B981;
        border: 2px solid #059669;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <span style="color: white; font-size: 12px; line-height: 1;">📍</span>
      </div>
    `;
    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      position: position,
      map: map,
      title: `標記 ${markersRef.current.length + 1}`,
      content: markerContent,
    });

    markersRef.current.push(marker);
  };

  /**
   * 縮放至適合所有標記
   * 
   * @description 自動調整地圖縮放和中心點，使所有標記都可見
   * 
   * @example
   * ```typescript
   * // 添加多個標記後，調整視野
   * addMarker();
   * addMarker();
   * fitToMarkers();
   * ```
   */
  const fitToMarkers = () => {
    if (!mapInstanceRef.current || markersRef.current.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    markersRef.current.forEach(marker => {
      bounds.extend(marker.position);
    });

    mapInstanceRef.current.fitBounds(bounds);
  };

  /**
   * 清除所有標記
   * 
   * @description 移除地圖上所有的標記
   * 
   * @example
   * ```typescript
   * clearMarkers();
   * console.log('清除後標記數量:', markersCount); // 0
   * ```
   */
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];
  };

  /**
   * 載入 Google Maps API 並初始化地圖
   * 
   * @description 組件歷產時的副作用，負責載入 API 和初始化地圖
   */
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

    /**
     * 清理函數
     * 
     * @description 組件卸載時清理所有標記資源
     */
    return () => {
      if (markersRef.current.length > 0) {
        clearMarkers();
      }
    };
  }, []);

  return {
    // 狀態
    isLoading,
    isApiLoaded,
    error,
    markersCount: markersRef.current.length,
    
    // 操作方法
    addMarker,
    fitToMarkers,
    clearMarkers,
    
    // 地圖實例（供進階使用）
    mapInstance: mapInstanceRef.current,
  };
};