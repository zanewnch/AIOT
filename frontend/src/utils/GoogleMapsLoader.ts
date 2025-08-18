/**
 * @fileoverview Google Maps JavaScript API 載入管理器
 * 
 * 提供單一的 Google Maps API 載入邏輯，防止重複載入和衝突
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-18
 */

import { createLogger } from '../configs/loggerConfig';

const logger = createLogger('GoogleMapsLoader');

// 全局狀態管理
class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;
  private isLoading = false;

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  /**
   * 檢查 Google Maps API 是否已載入
   */
  isGoogleMapsLoaded(): boolean {
    // 檢查全局 google 對象和完整的 maps 對象
    const hasGoogleObject = window.google && 
                           window.google.maps && 
                           window.google.maps.Map && 
                           window.google.maps.marker &&
                           window.google.maps.marker.AdvancedMarkerElement;
    
    if (hasGoogleObject && !this.isLoaded) {
      // 如果全局對象存在但狀態未更新，同步狀態
      this.isLoaded = true;
      this.isLoading = false;
      this.loadPromise = null;
      logger.info('Google Maps already loaded globally, syncing state');
    }
    
    return hasGoogleObject;
  }

  /**
   * 檢查頁面上是否存在 Google Maps script
   */
  private hasExistingScript(): boolean {
    return document.querySelector('script[src*="maps.googleapis.com"]') !== null;
  }

  /**
   * 移除現有的 Google Maps script
   */
  private removeExistingScript(): void {
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    existingScripts.forEach(script => {
      logger.warn('Removing existing Google Maps script');
      script.remove();
    });
  }

  /**
   * 載入 Google Maps JavaScript API
   */
  async load(): Promise<void> {
    // 強制檢查是否已經載入
    if (this.isGoogleMapsLoaded()) {
      logger.info('Google Maps already loaded, skipping');
      return Promise.resolve();
    }

    // 如果正在載入，等待現有的 Promise
    if (this.isLoading && this.loadPromise) {
      logger.info('Google Maps loading in progress, waiting for completion');
      return this.loadPromise;
    }

    // 再次檢查是否有現有的全局回調正在處理
    if ((window as any).__googleMapsCallback) {
      logger.warn('Google Maps callback already exists, waiting...');
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (this.isGoogleMapsLoaded()) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    // 檢查 API Key
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      const error = 'Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in .env file';
      logger.error(error);
      throw new Error(error);
    }

    // 如果已經存在 script 但 API 未載入，可能是載入失敗，清理後重試
    if (this.hasExistingScript()) {
      logger.warn('Found existing Google Maps script, cleaning up...');
      this.removeExistingScript();
      // 等待一下讓清理完成
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 創建載入 Promise
    this.loadPromise = new Promise<void>((resolve, reject) => {
      logger.info('Loading Google Maps API...');
      this.isLoading = true;

      const script = document.createElement('script');
      script.id = 'google-maps-api-script'; // 添加 ID 以便追蹤
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async&callback=__googleMapsCallback`;
      script.async = true;
      script.defer = true;

      // 全局回調函數
      (window as any).__googleMapsCallback = () => {
        logger.info('Google Maps API loaded successfully');
        this.isLoaded = true;
        this.isLoading = false;
        this.loadPromise = null;
        
        // 清理全局回調
        delete (window as any).__googleMapsCallback;
        
        resolve();
      };

      script.onerror = (error) => {
        logger.error('Failed to load Google Maps API', error);
        this.isLoading = false;
        this.loadPromise = null;
        
        // 清理全局回調
        delete (window as any).__googleMapsCallback;
        
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * 重置載入狀態（用於測試或特殊情況）
   */
  reset(): void {
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
    this.removeExistingScript();
    
    // 清理全局回調
    if ((window as any).__googleMapsCallback) {
      delete (window as any).__googleMapsCallback;
    }
    
    logger.info('Google Maps loader reset');
  }
}

// 導出單例實例
export const googleMapsLoader = GoogleMapsLoader.getInstance();