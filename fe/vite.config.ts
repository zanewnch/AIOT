import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from 'rollup-plugin-visualizer';

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
  server: {
    host: "127.0.0.1",
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
      },
    },
  },
  esbuild: {
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".ts": "ts",
        ".tsx": "tsx",
      },
    },
  },
});
