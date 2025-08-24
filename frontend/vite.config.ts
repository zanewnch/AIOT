/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - 只在構建時啟用
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  css: {
    postcss: "./postcss.config.js",
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    // 提高 chunk 大小警告閾值
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      external: ['socket.io-client'],
      output: {
        // 手動 chunk 分割
        manualChunks: {
          // React 核心庫
          'react-vendor': ['react', 'react-dom'],
          // React 路由
          'react-router': ['react-router-dom'],
          // 狀態管理
          'state-management': ['@reduxjs/toolkit', 'react-redux', 'zustand'],
          // HTTP 客戶端和查詢
          'data-fetching': ['@tanstack/react-query', 'axios'],
          // 工具庫
          'utils': ['lodash', 'loglevel', 'tslib'],
        },
        // 設置文件名和 hash 策略，啟用長期緩存
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.names?.[0] || 'asset';
          if (/\.(css)$/.test(fileName)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(fileName)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(fileName)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  esbuild: {
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "socket.io-client"],
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".ts": "ts",
        ".tsx": "tsx",
      },
    },
  },
  // Vitest 測試配置
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        'src/vite-env.d.ts',
        '**/*.d.ts',
        '**/types/**',
        '**/test/**',
        '**/tests/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    },
  },
});