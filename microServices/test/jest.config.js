/**
 * @fileoverview Jest 測試配置
 * 
 * 配置單元測試和整合測試的執行環境，包含：
 * - TypeScript 支援
 * - ES Module 支援
 * - 測試覆蓋率設定
 * - 測試環境設定
 * - Mock 和 Setup 配置
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

/** @type {import('jest').Config} */
const config = {
  // 測試環境
  testEnvironment: 'node',
  
  // TypeScript 支援
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  
  // 模組解析
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // TypeScript 設定
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: {
        module: 'ESNext',
        target: 'ES2020',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }
  },
  
  // 測試檔案匹配模式
  testMatch: [
    '**/test/**/*.test.ts',
    '**/test/**/*.test.js',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js'
  ],
  
  // 忽略的測試檔案
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/docs/'
  ],
  
  // 覆蓋率設定
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/server.ts',
    '!src/server-*.ts'
  ],
  
  // 覆蓋率報告格式
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // 覆蓋率輸出目錄
  coverageDirectory: 'coverage',
  
  // 覆蓋率門檻
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // 測試設定檔案
  setupFilesAfterEnv: [
    '<rootDir>/test/setup/jest.setup.ts'
  ],
  
  // 測試逾時設定
  testTimeout: 30000,
  
  // 詳細輸出
  verbose: true,
  
  // 測試結果報告
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        suiteName: 'AIOT Microservices Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › '
      }
    ],
    [
      'jest-html-reporter',
      {
        outputPath: 'test-results/test-report.html',
        pageTitle: 'AIOT Test Report',
        includeFailureMsg: true,
        includeSuiteFailure: true
      }
    ]
  ],
  
  // 轉換器設定
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          target: 'ES2020'
        }
      }
    ]
  },
  
  // 模組檔案副檔名
  moduleFileExtensions: [
    'ts',
    'js',
    'json',
    'node'
  ],
  
  // 清理模擬
  clearMocks: true,
  restoreMocks: true,
  
  // 最大工作進程
  maxWorkers: '50%',
  
  // 快取設定
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // 錯誤輸出設定
  errorOnDeprecated: true,
  
  // 測試序列執行（適用於整合測試）
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/test/unit/**/*.test.ts'
      ],
      // 單元測試可以並行執行
      maxWorkers: '50%'
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/test/integration/**/*.test.ts'
      ],
      // 整合測試序列執行以避免資料庫衝突
      maxWorkers: 1,
      // 整合測試需要更長的逾時時間
      testTimeout: 60000
    }
  ]
};

module.exports = config;