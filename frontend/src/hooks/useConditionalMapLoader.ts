/**
 * @fileoverview 條件地圖加載 Hook
 * 
 * 提供智能的地圖組件條件載入功能，包括：
 * - 設備性能檢測
 * - 網路狀況分析
 * - 視窗大小適應
 * - 用戶偏好設定
 * - 電池狀態監控
 * - 懶加載策略
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-07
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('useConditionalMapLoader');

/**
 * 設備性能級別
 */
export type DevicePerformance = 'high' | 'medium' | 'low';

/**
 * 網路連接類型
 */
export type NetworkType = 'wifi' | '4g' | '3g' | '2g' | 'unknown';

/**
 * 載入策略
 */
export type LoadingStrategy = 
  | 'eager'          // 立即載入
  | 'lazy'           // 懶加載
  | 'on-interaction' // 用戶交互時載入
  | 'never';         // 不載入

/**
 * 地圖載入配置
 */
interface MapLoadingConfig {
  /** 最小視窗寬度（像素）*/
  minViewportWidth?: number;
  /** 最小視窗高度（像素）*/
  minViewportHeight?: number;
  /** 允許的最低性能級別 */
  minPerformanceLevel?: DevicePerformance;
  /** 允許的網路類型 */
  allowedNetworkTypes?: NetworkType[];
  /** 是否考慮電池狀態 */
  respectBatteryLevel?: boolean;
  /** 最低電池百分比 */
  minBatteryLevel?: number;
  /** 用戶偏好設定 */
  userPreference?: 'auto' | 'always' | 'never';
  /** 懶加載的延遲時間（毫秒）*/
  lazyLoadDelay?: number;
  /** 是否在可見時載入 */
  loadOnVisible?: boolean;
}

/**
 * 設備能力信息
 */
interface DeviceCapabilities {
  /** 性能級別 */
  performance: DevicePerformance;
  /** 是否為移動設備 */
  isMobile: boolean;
  /** 是否為觸控設備 */
  isTouchDevice: boolean;
  /** 可用記憶體（GB）*/
  availableMemory: number;
  /** CPU 核心數量 */
  cpuCores: number;
  /** 視窗大小 */
  viewport: {
    width: number;
    height: number;
  };
  /** 設備像素比 */
  devicePixelRatio: number;
}

/**
 * 網路狀況信息
 */
interface NetworkConditions {
  /** 連接類型 */
  type: NetworkType;
  /** 是否在線 */
  isOnline: boolean;
  /** 估計的下載速度（Mbps）*/
  downlink?: number;
  /** 網路延遲（毫秒）*/
  rtt?: number;
  /** 是否為節省數據模式 */
  saveData?: boolean;
}

/**
 * 電池狀態信息
 */
interface BatteryStatus {
  /** 電池電量百分比 */
  level: number;
  /** 是否正在充電 */
  charging: boolean;
  /** 是否為低電量 */
  isLow: boolean;
}

/**
 * 條件地圖載入 Hook
 * 
 * 根據設備性能、網路狀況、電池狀態等條件智能決定是否載入地圖
 * 
 * @param config 載入配置
 * @returns 載入狀態和控制函數
 */
export const useConditionalMapLoader = (config: MapLoadingConfig = {}) => {
  const {
    minViewportWidth = 768,
    minViewportHeight = 400,
    minPerformanceLevel = 'low',
    allowedNetworkTypes = ['wifi', '4g', '3g'],
    respectBatteryLevel = true,
    minBatteryLevel = 20,
    userPreference = 'auto',
    lazyLoadDelay = 2000,
    loadOnVisible = true,
  } = config;

  // 狀態管理
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities | null>(null);
  const [networkConditions, setNetworkConditions] = useState<NetworkConditions | null>(null);
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus | null>(null);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState<LoadingStrategy>('lazy');
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * 檢測設備性能
   */
  const detectDeviceCapabilities = useCallback((): DeviceCapabilities => {
    const nav = navigator as any;
    const screen = window.screen;
    const deviceMemory = nav.deviceMemory || 4; // 默認4GB
    const cpuCores = nav.hardwareConcurrency || 4; // 默認4核心
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // 性能評估邏輯
    let performance: DevicePerformance = 'medium';
    
    if (deviceMemory >= 8 && cpuCores >= 8 && viewport.width >= 1920) {
      performance = 'high';
    } else if (deviceMemory >= 4 && cpuCores >= 4 && viewport.width >= 1024) {
      performance = 'medium';
    } else {
      performance = 'low';
    }

    // 移動設備檢測
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(nav.userAgent);
    const isTouchDevice = 'ontouchstart' in window || nav.maxTouchPoints > 0;

    const capabilities: DeviceCapabilities = {
      performance,
      isMobile,
      isTouchDevice,
      availableMemory: deviceMemory,
      cpuCores,
      viewport,
      devicePixelRatio: window.devicePixelRatio || 1,
    };

    logger.info('設備性能檢測完成', capabilities);
    return capabilities;
  }, []);

  /**
   * 檢測網路狀況
   */
  const detectNetworkConditions = useCallback((): NetworkConditions => {
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    let networkType: NetworkType = 'unknown';
    let downlink: number | undefined;
    let rtt: number | undefined;
    let saveData: boolean | undefined;

    if (connection) {
      // 映射連接類型
      const effectiveType = connection.effectiveType;
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        networkType = '2g';
      } else if (effectiveType === '3g') {
        networkType = '3g';
      } else if (effectiveType === '4g') {
        networkType = '4g';
      } else {
        networkType = 'wifi'; // 假設高速連接為 WiFi
      }

      downlink = connection.downlink;
      rtt = connection.rtt;
      saveData = connection.saveData;
    } else {
      // 無法檢測網路信息，假設為 WiFi
      networkType = 'wifi';
    }

    const conditions: NetworkConditions = {
      type: networkType,
      isOnline: navigator.onLine,
      downlink,
      rtt,
      saveData,
    };

    logger.info('網路狀況檢測完成', conditions);
    return conditions;
  }, []);

  /**
   * 檢測電池狀態
   */
  const detectBatteryStatus = useCallback(async (): Promise<BatteryStatus> => {
    const nav = navigator as any;
    
    try {
      if ('getBattery' in nav) {
        const battery = await nav.getBattery();
        const status: BatteryStatus = {
          level: Math.round(battery.level * 100),
          charging: battery.charging,
          isLow: battery.level < 0.2,
        };

        logger.info('電池狀態檢測完成', status);
        return status;
      }
    } catch (error) {
      logger.warn('無法檢測電池狀態', { error });
    }

    // 默認電池狀態
    return {
      level: 100,
      charging: false,
      isLow: false,
    };
  }, []);

  /**
   * 決定載入策略
   */
  const determineLoadingStrategy = useCallback((
    device: DeviceCapabilities,
    network: NetworkConditions,
    battery: BatteryStatus
  ): LoadingStrategy => {
    // 用戶明確偏好
    if (userPreference === 'always') return 'eager';
    if (userPreference === 'never') return 'never';

    // 性能檢查
    const performanceLevels: DevicePerformance[] = ['low', 'medium', 'high'];
    const devicePerformanceIndex = performanceLevels.indexOf(device.performance);
    const minPerformanceIndex = performanceLevels.indexOf(minPerformanceLevel);
    
    if (devicePerformanceIndex < minPerformanceIndex) {
      logger.info('設備性能不足，採用交互時載入策略', {
        devicePerformance: device.performance,
        minRequired: minPerformanceLevel
      });
      return 'on-interaction';
    }

    // 視窗大小檢查
    if (device.viewport.width < minViewportWidth || device.viewport.height < minViewportHeight) {
      logger.info('視窗太小，採用交互時載入策略', {
        viewport: device.viewport,
        minRequired: { width: minViewportWidth, height: minViewportHeight }
      });
      return 'on-interaction';
    }

    // 網路狀況檢查
    if (!allowedNetworkTypes.includes(network.type)) {
      logger.info('網路類型不支援，採用交互時載入策略', {
        networkType: network.type,
        allowed: allowedNetworkTypes
      });
      return 'on-interaction';
    }

    // 節省數據模式檢查
    if (network.saveData) {
      logger.info('節省數據模式啟用，採用交互時載入策略');
      return 'on-interaction';
    }

    // 電池狀態檢查
    if (respectBatteryLevel && battery.level < minBatteryLevel && !battery.charging) {
      logger.info('電池電量不足，採用交互時載入策略', {
        batteryLevel: battery.level,
        minRequired: minBatteryLevel,
        charging: battery.charging
      });
      return 'on-interaction';
    }

    // 移動設備使用懶加載
    if (device.isMobile) {
      logger.info('移動設備，採用懶加載策略');
      return 'lazy';
    }

    // 桌面設備且條件良好，立即載入
    logger.info('條件良好，採用立即載入策略');
    return 'eager';
  }, [
    userPreference,
    minPerformanceLevel,
    minViewportWidth,
    minViewportHeight,
    allowedNetworkTypes,
    respectBatteryLevel,
    minBatteryLevel,
  ]);

  /**
   * 初始化檢測
   */
  const initialize = useCallback(async () => {
    try {
      logger.info('開始初始化條件地圖載入器');
      
      const device = detectDeviceCapabilities();
      const network = detectNetworkConditions();
      const battery = await detectBatteryStatus();

      setDeviceCapabilities(device);
      setNetworkConditions(network);
      setBatteryStatus(battery);

      const strategy = determineLoadingStrategy(device, network, battery);
      setLoadingStrategy(strategy);

      // 根據策略決定是否立即載入
      if (strategy === 'eager') {
        setShouldLoadMap(true);
      } else if (strategy === 'never') {
        setShouldLoadMap(false);
      }

      setIsInitialized(true);
      logger.info('條件地圖載入器初始化完成', { strategy });

    } catch (error) {
      logger.error('條件地圖載入器初始化失敗', { error });
      // 失敗時使用保守策略
      setLoadingStrategy('on-interaction');
      setIsInitialized(true);
    }
  }, [detectDeviceCapabilities, detectNetworkConditions, detectBatteryStatus, determineLoadingStrategy]);

  /**
   * 處理用戶交互
   */
  const handleUserInteraction = useCallback(() => {
    if (!userInteracted) {
      setUserInteracted(true);
      
      if (loadingStrategy === 'on-interaction') {
        logger.info('用戶交互觸發地圖載入');
        setShouldLoadMap(true);
      }
    }
  }, [userInteracted, loadingStrategy]);

  /**
   * 處理地圖可見性變化
   */
  const handleVisibilityChange = useCallback((isVisible: boolean) => {
    setIsMapVisible(isVisible);
    
    if (isVisible && loadOnVisible && loadingStrategy === 'lazy' && !shouldLoadMap) {
      // 延遲載入
      const timeoutId = setTimeout(() => {
        logger.info('延遲載入地圖（可見時觸發）');
        setShouldLoadMap(true);
      }, lazyLoadDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [loadOnVisible, loadingStrategy, shouldLoadMap, lazyLoadDelay]);

  /**
   * 強制載入地圖
   */
  const forceLoadMap = useCallback(() => {
    logger.info('強制載入地圖');
    setShouldLoadMap(true);
  }, []);

  /**
   * 禁用地圖載入
   */
  const disableMapLoading = useCallback(() => {
    logger.info('禁用地圖載入');
    setShouldLoadMap(false);
  }, []);

  /**
   * 重新評估載入條件
   */
  const reevaluate = useCallback(async () => {
    logger.info('重新評估地圖載入條件');
    
    try {
      const device = detectDeviceCapabilities();
      const network = detectNetworkConditions();
      const battery = await detectBatteryStatus();

      setDeviceCapabilities(device);
      setNetworkConditions(network);
      setBatteryStatus(battery);

      const strategy = determineLoadingStrategy(device, network, battery);
      setLoadingStrategy(strategy);

      // 根據策略決定是否立即載入
      if (strategy === 'eager') {
        setShouldLoadMap(true);
      } else if (strategy === 'never') {
        setShouldLoadMap(false);
      }

      logger.info('條件地圖載入器重新評估完成', { strategy });
    } catch (error) {
      logger.error('條件地圖載入器重新評估失敗', { error });
    }
  }, [detectDeviceCapabilities, detectNetworkConditions, detectBatteryStatus, determineLoadingStrategy]);

  // 監聽視窗大小變化
  useEffect(() => {
    const handleResize = () => {
      setDeviceCapabilities(prev => {
        if (!prev) return null;
        
        const newCapabilities = { 
          ...prev,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          }
        };
        
        // 重新評估策略
        if (networkConditions && batteryStatus) {
          const strategy = determineLoadingStrategy(newCapabilities, networkConditions, batteryStatus);
          setLoadingStrategy(strategy);
        }
        
        return newCapabilities;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [networkConditions, batteryStatus, determineLoadingStrategy]);

  // 監聽網路狀態變化
  useEffect(() => {
    const handleOnline = () => {
      setNetworkConditions(prev => prev ? { ...prev, isOnline: true } : null);
    };

    const handleOffline = () => {
      setNetworkConditions(prev => prev ? { ...prev, isOnline: false } : null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // 只在掛載時添加監聽器

  // 初始化 - 只在組件第一次掛載時執行
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * 載入建議
   */
  const loadingRecommendation = useMemo(() => {
    if (!isInitialized) return null;

    const reasons: string[] = [];
    
    if (loadingStrategy === 'never') {
      reasons.push('用戶偏好設定為從不載入地圖');
    } else if (loadingStrategy === 'on-interaction') {
      if (deviceCapabilities?.performance === 'low') {
        reasons.push('設備性能較低');
      }
      if (deviceCapabilities && (deviceCapabilities.viewport.width < minViewportWidth || deviceCapabilities.viewport.height < minViewportHeight)) {
        reasons.push('螢幕尺寸較小');
      }
      if (networkConditions && !allowedNetworkTypes.includes(networkConditions.type)) {
        reasons.push('網路連接速度較慢');
      }
      if (batteryStatus && respectBatteryLevel && batteryStatus.level < minBatteryLevel) {
        reasons.push('電池電量不足');
      }
      if (networkConditions?.saveData) {
        reasons.push('啟用了節省數據模式');
      }
    }

    return {
      strategy: loadingStrategy,
      shouldLoad: shouldLoadMap,
      reasons,
      isRecommended: loadingStrategy === 'eager' || (loadingStrategy === 'lazy' && isMapVisible),
    };
  }, [
    isInitialized,
    loadingStrategy,
    shouldLoadMap,
    deviceCapabilities,
    networkConditions,
    batteryStatus,
    minViewportWidth,
    minViewportHeight,
    allowedNetworkTypes,
    respectBatteryLevel,
    minBatteryLevel,
    isMapVisible,
  ]);

  return {
    // 核心狀態
    shouldLoadMap,
    isInitialized,
    loadingStrategy,
    
    // 設備信息
    deviceCapabilities,
    networkConditions,
    batteryStatus,
    
    // 用戶交互
    userInteracted,
    isMapVisible,
    
    // 控制函數
    handleUserInteraction,
    handleVisibilityChange,
    forceLoadMap,
    disableMapLoading,
    reevaluate,
    
    // 載入建議
    loadingRecommendation,
    
    // 便捷檢查函數
    isMobile: deviceCapabilities?.isMobile || false,
    isLowPerformance: deviceCapabilities?.performance === 'low',
    isSlowNetwork: networkConditions?.type === '2g' || networkConditions?.type === '3g',
    isLowBattery: batteryStatus?.isLow || false,
    isOnline: networkConditions?.isOnline ?? true,
  };
};

/**
 * 簡化版的條件地圖載入 Hook
 * 
 * 提供預設的載入策略，適用於大多數場景
 */
export const useSmartMapLoader = () => {
  return useConditionalMapLoader({
    minViewportWidth: 640,
    minViewportHeight: 400,
    minPerformanceLevel: 'low',
    allowedNetworkTypes: ['wifi', '4g'],
    respectBatteryLevel: true,
    minBatteryLevel: 15,
    lazyLoadDelay: 1500,
    loadOnVisible: true,
  });
};