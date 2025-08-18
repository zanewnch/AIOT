/**
 * @fileoverview 地圖容器組件
 * 
 * 提供 Google Maps 載入和顯示功能，包含：
 * - Google Maps JavaScript API 載入
 * - 地圖初始化和配置
 * - 無人機標記和路徑顯示
 * - 飛行控制整合
 * 
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-18
 */

import React, { useEffect, useState, useCallback } from "react";
import { createLogger } from "../../configs/loggerConfig";
import { googleMapsLoader } from "../../utils/GoogleMapsLoader";

const logger = createLogger('MapContainer');

interface MapContainerProps {
  mapRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  error: string;
  isSimulateMode: boolean;
  realModeLoading?: boolean;
}

// 使用單例的 Google Maps 載入管理器，不需要全局變量

const MapContainer: React.FC<MapContainerProps> = ({
  mapRef,
  isLoading,
  error,
  isSimulateMode,
  realModeLoading = false,
}) => {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string>('');
  
  const showLoading = isLoading || realModeLoading || isMapLoading;

  /**
   * 載入 Google Maps JavaScript API (使用單例管理器)
   */
  const loadGoogleMapsAPI = useCallback(async () => {
    try {
      await googleMapsLoader.load();
    } catch (error: any) {
      setMapError(error.message);
      throw error;
    }
  }, []);

  /**
   * 初始化 Google Maps 地圖實例
   */
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !googleMapsLoader.isGoogleMapsLoaded()) {
      logger.warn('Map container or Google Maps not available');
      return;
    }

    try {
      logger.info('Initializing Google Maps...');

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 25.0330, lng: 121.5654 }, // 台北101 coordinates
        zoom: 12,
        mapTypeId: window.google.maps.MapTypeId.HYBRID,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition.TOP_CENTER
        },
        zoomControl: true,
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER
        },
        scaleControl: true,
        streetViewControl: true,
        streetViewControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_TOP
        },
        fullscreenControl: true,
        styles: [
          {
            featureType: "all",
            elementType: "labels",
            stylers: [{ visibility: "on" }]
          }
        ]
      });

      setMapInstance(map);
      setIsMapLoading(false);
      setMapError('');
      
      logger.info('Google Maps initialized successfully');
      
      // 添加示例標記
      if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map: map,
          position: { lat: 25.0330, lng: 121.5654 },
          title: '無人機基地'
        });
      } else {
        // 使用傳統標記作為後備
        const marker = new window.google.maps.Marker({
          position: { lat: 25.0330, lng: 121.5654 },
          map: map,
          title: '無人機基地'
        });
      }

    } catch (err: any) {
      const errorMsg = `Failed to initialize Google Maps: ${err.message}`;
      logger.error(errorMsg, err);
      setMapError(errorMsg);
      setIsMapLoading(false);
    }
  }, [mapRef]);

  /**
   * 載入和初始化地圖
   */
  useEffect(() => {
    let isMounted = true;

    const loadAndInitMap = async () => {
      try {
        if (!isMounted) return;
        
        setIsMapLoading(true);
        setMapError('');
        
        await loadGoogleMapsAPI();
        
        if (!isMounted) return;
        
        initializeMap();
        
      } catch (err: any) {
        if (!isMounted) return;
        
        logger.error('Failed to load map:', err);
        setMapError(err.message);
        setIsMapLoading(false);
      }
    };

    loadAndInitMap();

    // 清理函數
    return () => {
      isMounted = false;
    };
  }, [loadGoogleMapsAPI, initializeMap]);

  return (
    <div className="col-span-1 lg:col-span-3 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden flex flex-col">
      <div className="relative flex-1">
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        />

        {/* 載入覆蓋層 - 改善動畫 */}
        {showLoading && (
          <div className="absolute inset-0 bg-gray-800/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center text-gray-300">
              <div className="relative mb-4">
                <div className="animate-spin w-12 h-12 border-4 border-blue-800 border-t-blue-400 rounded-full mx-auto"></div>
                <div className="absolute inset-0 animate-pulse">
                  <div className="w-8 h-8 bg-blue-400/20 rounded-full mx-auto mt-2"></div>
                </div>
              </div>
              <p className="text-lg font-semibold">
                {isSimulateMode
                  ? "模擬地圖載入中..."
                  : "Google Maps 載入中..."}
              </p>
              <p className="text-sm mt-2 text-gray-400">請稍候片刻</p>
            </div>
          </div>
        )}

        {/* 錯誤覆蓋層 - 改善設計 */}
        {(error || mapError) && (
          <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center text-red-300 bg-gray-800 p-6 rounded-xl shadow-lg max-w-md mx-4 border border-red-700">
              <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-700">
                <span className="text-2xl">⚠</span>
              </div>
              <p className="text-lg font-semibold mb-2">地圖載入失敗</p>
              <p className="text-sm text-gray-400 mb-4">{error || mapError}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-700 text-red-100 rounded-lg text-sm font-medium transition-colors hover:bg-red-600"
              >
                重新載入頁面
              </button>
            </div>
          </div>
        )}

        {/* 成功載入後的地圖狀態指示器 */}
        {mapInstance && !showLoading && !error && !mapError && (
          <div className="absolute top-4 left-4 bg-green-900/80 backdrop-blur-sm border border-green-700 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-green-200 text-sm">
              <span>🗺️</span>
              <span>地圖載入完成</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapContainer;