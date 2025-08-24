/**
 * @fileoverview RBAC 服務路由統一註冊中心
 * 
 * 使用 InversifyJS RouteRegistrar 模式管理和註冊所有的 HTTP API 路由
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Application } from 'express';
import { container } from '../container/container.js';
import { TYPES } from '../container/types.js';
import { RouteRegistrar } from './RouteRegistrar.js';

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