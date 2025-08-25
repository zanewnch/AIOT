import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // 基本設定
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // 測試文件路徑
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    
    // 時間設定
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // 測試隔離設定
    testIsolation: true,
    
    // 瀏覽器設定
    chromeWebSecurity: false,
    
    // 視頻和截圖設定
    video: true,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    
    // 環境變數
    env: {
      apiUrl: 'http://localhost:8000/api',
      wsUrl: 'ws://localhost:3004'
    },
    
    setupNodeEvents(on, config) {
      // 在這裡可以添加 Node.js 事件監聽器
      return config
    }
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'cypress/components/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts'
  }
})