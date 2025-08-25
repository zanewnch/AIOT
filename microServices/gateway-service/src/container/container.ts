/**
 * @fileoverview Gateway Service 的 IoC 容器配置
 * 
 * 配置 Gateway Service 所需的所有依賴項注入
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-23
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types.js';

// 配置服務
import { ConsulConfig } from '../configs/consulConfig.js';
import { HealthConfig } from '../configs/healthConfig.js';

// 控制器
import { GatewayController } from '../controllers/GatewayCtrl.js';
import { AuthTestController } from '../controllers/AuthTestCtrl.js';

// 中間件
import { ProxyMiddleware } from '../middleware/ProxyMiddleware.js';

// 路由註冊器
import { RouteRegistrar } from '../routes/RouteRegistrar.js';

/**
 * 創建並配置 Gateway Service 的 IoC 容器
 * 
 * @returns {Container} 配置好的 InversifyJS 容器
 */
export function createContainer(): Container {
  const container = new Container();

  // ===== 配置服務註冊 =====
  
  container.bind<ConsulConfig>(TYPES.ConsulConfig)
    .to(ConsulConfig)
    .inSingletonScope();
    
  container.bind<HealthConfig>(TYPES.HealthConfig)
    .to(HealthConfig)
    .inSingletonScope();

  // ===== 控制器註冊 =====
  
  container.bind<GatewayController>(TYPES.GatewayController)
    .to(GatewayController)
    .inSingletonScope();
    
  container.bind<AuthTestController>(TYPES.AuthTestController)
    .to(AuthTestController)
    .inSingletonScope();

  // ===== 中間件註冊 =====
  
  container.bind<ProxyMiddleware>(TYPES.ProxyMiddleware)
    .to(ProxyMiddleware)
    .inSingletonScope();

  // ===== 路由註冊器 =====
  
  container.bind<RouteRegistrar>(TYPES.RouteRegistrar)
    .to(RouteRegistrar)
    .inSingletonScope();

  console.log('✅ Gateway IoC Container configured with all services');
  
  return container;
}

/**
 * 全域容器實例
 */
export const container = createContainer();

/**
 * 容器工具函數
 */
export class ContainerUtils {
  /**
   * 獲取服務實例
   */
  static get<T>(serviceId: symbol): T {
    return container.get<T>(serviceId);
  }

  /**
   * 檢查服務是否已註冊
   */
  static isBound(serviceId: symbol): boolean {
    return container.isBound(serviceId);
  }
}