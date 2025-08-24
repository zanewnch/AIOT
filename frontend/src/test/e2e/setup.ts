/**
 * @fileoverview E2E 測試環境設定
 * @description 為 E2E 測試設定全域環境和工具
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// 全域測試設定
beforeAll(async () => {
  console.log('🚀 Starting E2E test environment...');
  
  // 檢查必要的環境變數
  const requiredEnvVars = {
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
  };
  
  console.log('Environment configuration:', requiredEnvVars);
  
  // 設定全域超時
  if (global.setTimeout) {
    global.setTimeout = setTimeout;
  }
  
  // 檢查 Chrome/Chromium 是否可用（用於 Selenium）
  try {
    const { execSync } = require('child_process');
    execSync('google-chrome --version', { stdio: 'pipe' });
    console.log('✅ Chrome browser available');
  } catch (error) {
    try {
      execSync('chromium --version', { stdio: 'pipe' });
      console.log('✅ Chromium browser available');
    } catch (chromiumError) {
      console.warn('⚠️  No Chrome/Chromium found - E2E tests may fail');
      console.warn('Please install Chrome or Chromium for E2E testing');
    }
  }
});

afterAll(async () => {
  console.log('🏁 Cleaning up E2E test environment...');
  
  // 清理任何全域資源
  if (global.gc) {
    global.gc();
  }
});

beforeEach(async () => {
  // 每個測試前的設定
  // 這裡可以添加測試數據初始化等
});

afterEach(async () => {
  // 每個測試後的清理
  // 清理可能會影響其他測試的狀態
});

// 處理未捕獲的異常
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// 導出輔助工具
export const testHelpers = {
  /**
   * 等待指定時間
   */
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * 重試函數
   */
  retry: async <T>(
    fn: () => Promise<T>, 
    retries: number = 3, 
    delay: number = 1000
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await testHelpers.sleep(delay);
        return testHelpers.retry(fn, retries - 1, delay);
      }
      throw error;
    }
  },
  
  /**
   * 檢查服務是否可用
   */
  checkServiceAvailable: async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(`${url}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
};