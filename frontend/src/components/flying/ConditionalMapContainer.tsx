/**
 * @fileoverview 條件載入地圖容器組件
 * 
 * 提供智能的地圖載入功能，根據設備性能、網路狀況等條件決定載入策略
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-07
 */

import React, { useRef, useEffect, useState, Suspense, lazy } from "react";
import { useConditionalMapLoader } from "../../hooks/useConditionalMapLoader";
import { createLogger } from "../../configs/loggerConfig";

const logger = createLogger('ConditionalMapContainer');

// 🔄 懶加載地圖組件
const LazyMapContainer = lazy(() => import('./MapContainer'));

/**
 * 條件載入地圖容器組件的屬性介面
 * 
 * @interface ConditionalMapContainerProps
 */
interface ConditionalMapContainerProps {
  /** 地圖容器的 React ref 參考 */
  mapRef: React.RefObject<HTMLDivElement>;
  /** 是否正在載入狀態 */
  isLoading: boolean;
  /** 錯誤訊息字串 */
  error: string;
  /** 是否為模擬模式 */
  isSimulateMode: boolean;
  /** 真實模式是否正在載入，可選參數 */
  realModeLoading?: boolean;
  /** 自定義 CSS 類名，可選參數 */
  className?: string;
}

/**
 * 地圖載入建議卡片組件的屬性介面
 * 
 * @interface MapLoadingRecommendationProps
 */
interface MapLoadingRecommendationProps {
  /** 載入建議物件，包含策略和原因資訊 */
  recommendation: any;
  /** 強制載入地圖的回調函數 */
  onForceLoad: () => void;
  /** 停用地圖載入的回調函數 */
  onDisable: () => void;
}

/**
 * 地圖載入建議卡片組件
 * 
 * 根據系統建議顯示載入策略，並提供使用者強制載入或停用的選項
 * 
 * @param props - 組件屬性
 * @param props.recommendation - 載入建議物件
 * @param props.onForceLoad - 強制載入回調函數
 * @param props.onDisable - 停用載入回調函數
 * @returns JSX 元素或 null
 */
const MapLoadingRecommendation: React.FC<MapLoadingRecommendationProps> = ({ recommendation, onForceLoad, onDisable }) => {
  if (!recommendation) return null;

  const { strategy, shouldLoad, reasons, isRecommended } = recommendation;

  const strategyLabels = {
    eager: '立即載入',
    lazy: '懶加載',
    'on-interaction': '互動時載入',
    never: '不載入',
  };

  const strategyColors = {
    eager: 'border-green-500 bg-green-50',
    lazy: 'border-blue-500 bg-blue-50',
    'on-interaction': 'border-yellow-500 bg-yellow-50',
    never: 'border-red-500 bg-red-50',
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${strategyColors[strategy]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-800">
          載入策略: {strategyLabels[strategy]}
        </h4>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          isRecommended 
            ? 'bg-green-100 text-green-800'
            : 'bg-orange-100 text-orange-800'
        }`}>
          {isRecommended ? '建議載入' : '建議延遲'}
        </span>
      </div>

      {reasons.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-1">原因:</p>
          <ul className="text-xs text-gray-500 space-y-1">
            {reasons.map((reason, index) => (
              <li key={index} className="flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        {!shouldLoad && (
          <button
            onClick={onForceLoad}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            強制載入
          </button>
        )}
        {shouldLoad && (
          <button
            onClick={onDisable}
            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
          >
            停用載入
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * 設備資訊面板組件的屬性介面
 * 
 * @interface DeviceInfoPanelProps
 */
interface DeviceInfoPanelProps {
  /** 設備性能資訊物件 */
  deviceCapabilities: any;
  /** 網路狀況資訊物件 */
  networkConditions: any;
  /** 電池狀態資訊物件 */
  batteryStatus: any;
}

/**
 * 設備資訊面板組件
 * 
 * 顯示設備性能、網路狀況和電池狀態等資訊，支援展開/收合功能
 * 
 * @param props - 組件屬性
 * @param props.deviceCapabilities - 設備性能資訊
 * @param props.networkConditions - 網路狀況資訊
 * @param props.batteryStatus - 電池狀態資訊
 * @returns JSX 元素或 null
 */
const DeviceInfoPanel: React.FC<DeviceInfoPanelProps> = ({ deviceCapabilities, networkConditions, batteryStatus }) => {
  /** 面板是否展開的狀態 */
  const [isExpanded, setIsExpanded] = useState(false);

  if (!deviceCapabilities) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-3 mb-4 text-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-gray-300 hover:text-gray-100"
      >
        <span>設備信息</span>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-400">性能:</span>
              <span className={`ml-1 px-1 rounded text-xs ${
                deviceCapabilities.performance === 'high' ? 'bg-green-700 text-green-200' :
                deviceCapabilities.performance === 'medium' ? 'bg-yellow-700 text-yellow-200' :
                'bg-red-700 text-red-200'
              }`}>
                {deviceCapabilities.performance}
              </span>
            </div>
            <div>
              <span className="text-gray-400">設備:</span>
              <span className="ml-1 text-gray-200">
                {deviceCapabilities.isMobile ? '移動端' : '桌面端'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">記憶體:</span>
              <span className="ml-1 text-gray-200">{deviceCapabilities.availableMemory}GB</span>
            </div>
            <div>
              <span className="text-gray-400">螢幕:</span>
              <span className="ml-1 text-gray-200">
                {deviceCapabilities.viewport.width}×{deviceCapabilities.viewport.height}
              </span>
            </div>
          </div>

          {networkConditions && (
            <div className="border-t border-gray-600 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400">網路:</span>
                  <span className={`ml-1 px-1 rounded text-xs ${
                    networkConditions.type === 'wifi' ? 'bg-green-700 text-green-200' :
                    networkConditions.type === '4g' ? 'bg-blue-700 text-blue-200' :
                    'bg-orange-700 text-orange-200'
                  }`}>
                    {networkConditions.type.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">狀態:</span>
                  <span className={`ml-1 px-1 rounded text-xs ${
                    networkConditions.isOnline ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'
                  }`}>
                    {networkConditions.isOnline ? '在線' : '離線'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {batteryStatus && (
            <div className="border-t border-gray-600 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-400">電池:</span>
                  <span className={`ml-1 px-1 rounded text-xs ${
                    batteryStatus.level > 50 ? 'bg-green-700 text-green-200' :
                    batteryStatus.level > 20 ? 'bg-yellow-700 text-yellow-200' :
                    'bg-red-700 text-red-200'
                  }`}>
                    {batteryStatus.level}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">充電:</span>
                  <span className={`ml-1 px-1 rounded text-xs ${
                    batteryStatus.charging ? 'bg-blue-700 text-blue-200' : 'bg-gray-700 text-gray-200'
                  }`}>
                    {batteryStatus.charging ? '是' : '否'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 條件載入地圖容器組件
 * 
 * 提供智能的地圖載入功能，根據設備性能、網路狀況、電池狀態等條件
 * 決定地圖載入策略，支援懶載入、互動載入等多種載入模式
 * 
 * @param props - 組件屬性
 * @param props.mapRef - 地圖容器的 React ref 參考
 * @param props.isLoading - 是否正在載入狀態
 * @param props.error - 錯誤訊息字串
 * @param props.isSimulateMode - 是否為模擬模式
 * @param props.realModeLoading - 真實模式是否正在載入
 * @param props.className - 自定義 CSS 類名
 * @returns JSX 元素
 */
const ConditionalMapContainer: React.FC<ConditionalMapContainerProps> = ({
  mapRef,
  isLoading,
  error,
  isSimulateMode,
  realModeLoading = false,
  className,
}) => {
  // 🚀 使用條件載入 hook
  const {
    shouldLoadMap,
    isInitialized,
    loadingStrategy,
    deviceCapabilities,
    networkConditions,
    batteryStatus,
    userInteracted,
    handleUserInteraction,
    handleVisibilityChange,
    forceLoadMap,
    disableMapLoading,
    loadingRecommendation,
    isMobile,
    isLowPerformance,
    isSlowNetwork,
  } = useConditionalMapLoader({
    minViewportWidth: 768,
    minViewportHeight: 400,
    minPerformanceLevel: 'low',
    allowedNetworkTypes: ['wifi', '4g', '3g'],
    respectBatteryLevel: true,
    minBatteryLevel: 15,
    userPreference: 'auto',
    lazyLoadDelay: 1000,
    loadOnVisible: true,
  });

  // 可見性檢測
  /** 容器元素的 ref 參考 */
  const containerRef = useRef<HTMLDivElement>(null);
  /** 容器是否在視窗範圍內的狀態 */
  const [isInView, setIsInView] = useState(false);

  // Intersection Observer for visibility detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const visible = entry.isIntersecting;
        setIsInView(visible);
        handleVisibilityChange(visible);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, [handleVisibilityChange]);

  // 日誌記錄
  useEffect(() => {
    if (isInitialized) {
      logger.info('條件載入地圖狀態', {
        shouldLoadMap,
        loadingStrategy,
        userInteracted,
        isInView,
        isMobile,
        isLowPerformance,
        isSlowNetwork,
      });
    }
  }, [shouldLoadMap, loadingStrategy, userInteracted, isInView, isMobile, isLowPerformance, isSlowNetwork, isInitialized]);

  /**
   * 渲染載入中狀態
   * 
   * 顯示帶有動畫效果的載入提示畫面
   * 
   * @returns JSX 元素
   */
  const renderLoadingState = () => (
    <div className="absolute inset-0 bg-gray-800/90 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center text-gray-300">
        <div className="relative mb-4">
          <div className="animate-spin w-12 h-12 border-4 border-blue-800 border-t-blue-400 rounded-full mx-auto"></div>
          <div className="absolute inset-0 animate-pulse">
            <div className="w-8 h-8 bg-blue-400/20 rounded-full mx-auto mt-2"></div>
          </div>
        </div>
        <p className="text-lg font-semibold">
          {isInitialized ? '地圖載入中...' : '初始化檢測中...'}
        </p>
        <p className="text-sm mt-2 text-gray-400">
          {isMobile ? '移動端優化載入' : '請稍候片刻'}
        </p>
      </div>
    </div>
  );

  /**
   * 渲染互動提示
   * 
   * 顯示需要使用者互動才能載入地圖的提示畫面
   * 
   * @returns JSX 元素
   */
  const renderInteractionPrompt = () => (
    <div className="absolute inset-0 bg-gray-800/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center text-gray-300 max-w-md mx-4">
        <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-700">
          <span className="text-2xl">🗺️</span>
        </div>
        <h3 className="text-xl font-semibold mb-2">地圖準備就緒</h3>
        <p className="text-sm text-gray-400 mb-4">
          {isLowPerformance && '為了確保最佳性能，'}
          {isSlowNetwork && '考慮到網路狀況，'}
          點擊下方按鈕載入地圖
        </p>
        
        <button
          onClick={() => {
            handleUserInteraction();
            logger.info('用戶點擊載入地圖');
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
        >
          <span className="flex items-center justify-center gap-2">
            <span>📍</span>
            <span>載入地圖</span>
          </span>
        </button>

        {/* 自動載入提示 */}
        {loadingStrategy === 'lazy' && isInView && (
          <p className="text-xs text-gray-500 mt-2">
            或者等待自動載入 ({Math.max(0, 3 - Math.floor(Date.now() / 1000) % 3)}秒)
          </p>
        )}
      </div>
    </div>
  );

  /**
   * 渲染禁用狀態
   * 
   * 顯示地圖功能已被禁用的提示畫面，並提供強制啟用選項
   * 
   * @returns JSX 元素
   */
  const renderDisabledState = () => (
    <div className="absolute inset-0 bg-gray-800/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center text-gray-400 max-w-md mx-4">
        <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-600">
          <span className="text-2xl">🚫</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">地圖已禁用</h3>
        <p className="text-sm text-gray-500 mb-4">
          基於當前設備狀況，地圖功能已被停用以節省資源
        </p>
        
        <button
          onClick={() => {
            forceLoadMap();
            logger.info('用戶強制啟用地圖');
          }}
          className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors hover:bg-gray-500"
        >
          強制啟用
        </button>
      </div>
    </div>
  );

  // 🚀 簡化渲染邏輯 - 直接載入地圖，跳過複雜的條件判斷
  return (
    <div 
      ref={containerRef}
      className={`col-span-1 lg:col-span-3 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden flex flex-col ${className}`}
    >
      <div className="relative flex-1">
        {/* 地圖容器 */}
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        />

        {/* 直接載入地圖組件，跳過條件檢查 */}
        <Suspense fallback={renderLoadingState()}>
          <LazyMapContainer
            mapRef={mapRef}
            isLoading={isLoading}
            error={error}
            isSimulateMode={isSimulateMode}
            realModeLoading={realModeLoading}
          />
        </Suspense>

        {/* 錯誤處理 */}
        {error && (
          <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center text-red-200 max-w-md mx-4">
              <div className="w-16 h-16 bg-red-800/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-600">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">地圖載入失敗</h3>
              <p className="text-sm text-red-300 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-700 text-red-100 rounded-lg text-sm font-medium transition-colors hover:bg-red-600"
              >
                重新載入頁面
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConditionalMapContainer;