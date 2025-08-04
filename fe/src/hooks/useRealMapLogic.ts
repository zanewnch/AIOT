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

// 從環境變數獲取 Google Maps API Key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyD_o0dWCymZaMZRzN6Uy2Rt3U_L56L_eH0";
const GOOGLE_MAPS_API_URL = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&loading=async`;

// 台北101的座標作為預設中心點
const DEFAULT_CENTER = {
  lat: 25.0337,
  lng: 121.5645
};

// 宣告 Google Maps 全域類型
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

/**
 * 真實地圖邏輯 Hook
 *
 * 提供真實地圖功能的所有邏輯處理
 *
 * @param mapRef - 地圖容器的 React ref
 * @returns 地圖狀態和操作方法
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
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [], // 可以在這裡添加自定義樣式
      });

      // 添加預設標記（台北101）
      const marker = new window.google.maps.Marker({
        position: DEFAULT_CENTER,
        map: map,
        title: '台北101',
        animation: window.google.maps.Animation.DROP,
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

    const marker = new window.google.maps.Marker({
      position: position,
      map: map,
      title: `標記 ${markersRef.current.length + 1}`,
      animation: window.google.maps.Animation.DROP,
    });

    markersRef.current.push(marker);
  };

  /**
   * 縮放至適合所有標記
   */
  const fitToMarkers = () => {
    if (!mapInstanceRef.current || markersRef.current.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    markersRef.current.forEach(marker => {
      bounds.extend(marker.getPosition());
    });

    mapInstanceRef.current.fitBounds(bounds);
  };

  /**
   * 清除所有標記
   */
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
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