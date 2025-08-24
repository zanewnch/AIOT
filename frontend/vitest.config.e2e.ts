/**
 * @fileoverview E2E 測試專用的 Vitest 配置
 * @description 為 E2E 測試提供獨立的配置，包括更長的超時時間和特殊設定
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // E2E 測試需要更長的超時時間
    testTimeout: 60000, // 60 秒
    hookTimeout: 30000, // 30 秒
    
    // E2E 測試通常較慢，減少並發以提高穩定性
    threads: false, // 禁用多線程
    maxConcurrency: 1, // 一次只運行一個測試
    
    // E2E 測試環境
    environment: 'node', // E2E 測試在 Node 環境運行
    
    // 包含的測試文件
    include: ['src/test/e2e/**/*.{test,spec}.{js,ts}'],
    
    // 排除的文件
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/test/unit/**',
      'src/test/integration/**',
    ],
    
    // 全局設定
    globals: true,
    
    // 測試報告
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './coverage/e2e-results.xml'
    },
    
    // 覆蓋率設定（E2E 測試通常不需要覆蓋率）
    coverage: {
      enabled: false,
    },
    
    // 重試失敗的測試
    retry: 2,
    
    // 測試設定文件
    setupFiles: ['./src/test/e2e/setup.ts'],
  },
});