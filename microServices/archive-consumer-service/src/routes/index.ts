/**
 * @fileoverview Archive Consumer Service 路由統一註冊中心
 * 
 * 使用 InversifyJS RouteRegistrar 模式管理和註冊所有的 HTTP API 路由
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-23
 */

import { Application } from 'express';
import { container } from '../container/container';
import { TYPES } from '../container/types';
import { RouteRegistrar } from './RouteRegistrar';

/**
 * 註冊所有 API 路由到 Express 應用程式
 * 使用 InversifyJS 依賴注入模式
 * 
 * @param app Express 應用程式實例
 */
export function registerRoutes(app: Application): void {
    // 使用 InversifyJS RouteRegistrar
    const routeRegistrar = container.get<RouteRegistrar>(TYPES.RouteRegistrar);
    routeRegistrar.registerRoutes(app);
}

// 向後兼容：匯出 RouteRegistrar 類別
export { RouteRegistrar };