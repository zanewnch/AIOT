/**
 * @fileoverview Auth 服務路由統一註冊中心
 *
 * 此文件負責管理和註冊認證相關的 HTTP API 路由，並提供一個單一入口
 * 將 Auth 子路由掛載到 Express 應用上。
 *
 * @module Routes/Auth
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Application } from 'express';
import { router as authRoutes } from './authRoutes.js';
import docsRoutes from './docsRoutes.js';

/**
 * 註冊所有 API 路由到 Express 應用程式
/**
 * 註冊所有 API 路由到 Express 應用
 *
 * @remarks
 * 這個函式在應用啟動時被呼叫，會掛載健康檢查與 Auth routes。
 *
 * @param app - Express 應用實例
 * @public
 */
export function registerRoutes(app: Application): void {
    try {
    // 註冊健康檢查路由 - 用於運維監控 (Liveness/Readiness)
        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                service: 'auth-service',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });
        console.log('✅ Health check route registered at /health');

    // 註冊認證路由 - 掛載 authRoutes 到根路徑
        app.use('/', authRoutes);
        console.log('✅ Auth routes registered at /');

        // 註冊文檔路由
        app.use('/', docsRoutes);
        console.log('✅ Documentation routes registered at /docs and /typedoc');

        console.log('🚀 All Auth routes registered successfully');
    } catch (error) {
        console.error('❌ Failed to register routes:', error);
        throw error;
    }
}