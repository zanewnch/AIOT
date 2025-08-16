/**
 * @fileoverview RBAC 服務路由統一註冊中心
 * 
 * 此文件負責管理和註冊所有的 HTTP API 路由
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Application } from 'express';
import { router as authRoutes } from './authRoutes.js';
import { router as rbacRoutes } from './rbacRoutes.js';

/**
 * 註冊所有 API 路由到 Express 應用程式
 * 
 * @param app Express 應用程式實例
 */
export function registerRoutes(app: Application): void {
    console.log('🛣️  Registering RBAC API routes...');

    try {
        // 註冊健康檢查路由
        app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                service: 'rbac-service',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });
        console.log('✅ Health check route registered at /health');

        // 註冊認證路由（Kong strip_path=true 會移除 /api/auth，直接收到 /login）
        app.use('/', authRoutes);
        console.log('✅ Auth routes registered at /');

        // 註冊 RBAC 路由（Kong strip_path=true 會移除 /api/rbac，直接收到 /users）
        app.use('/', rbacRoutes);
        console.log('✅ RBAC routes registered at /');

        console.log('🚀 All RBAC routes registered successfully');
    } catch (error) {
        console.error('❌ Failed to register routes:', error);
        throw error;
    }
}