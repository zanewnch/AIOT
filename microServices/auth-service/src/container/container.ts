/**
 * @fileoverview Auth 服務的 IoC 容器配置
 * 
 * 簡化版本，只包含認證相關的服務和控制器
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../container/types.js';

// 認證服務
import { AuthCommandsSvc } from '../services/commands/AuthCommandsSvc.js';
import { AuthQueriesSvc } from '../services/queries/AuthQueriesSvc.js';
import { SessionQueriesSvc } from '../services/queries/SessionQueriesSvc.js';

// 認證控制器
import { AuthCommands } from '../controllers/commands/AuthCommandsCtrl.js';
import { AuthQueries } from '../controllers/queries/AuthQueriesCtrl.js';

// JWT 安全服務
import { JwtBlacklistService } from '../services/shared/JwtBlacklistService.js';

/**
 * 創建並配置 Auth 服務的 IoC 容器
 * 
 * @returns {Container} 配置好的 InversifyJS 容器
 */
export function createContainer(): Container {
  const container = new Container();

  // ===== 認證服務註冊 =====
  
  // 認證服務
  container.bind<AuthCommandsSvc>(TYPES.AuthCommandsSvc)
    .to(AuthCommandsSvc)
    .inSingletonScope();
  // 說明: 註冊認證命令服務為 singleton，供全域注入使用
  
  container.bind<AuthQueriesSvc>(TYPES.AuthQueriesSvc)
    .to(AuthQueriesSvc)
    .inSingletonScope();
  // 說明: 查詢服務同樣以 singleton 註冊，避免多次建立 DB 連線
    
  container.bind<SessionQueriesSvc>(TYPES.SessionQueriesSvc)
    .to(SessionQueriesSvc)
    .inSingletonScope();
  // 說明: 會話查詢服務，用於驗證與查詢 session 資訊

  // JWT 安全服務
  container.bind<JwtBlacklistService>(TYPES.JwtBlacklistService)
    .to(JwtBlacklistService)
    .inSingletonScope();
  // 說明: JWT 黑名單服務，用於登出或強制失效 token

  // ===== 認證控制器註冊 =====
  
  // 認證控制器
  container.bind<AuthCommands>(TYPES.AuthCommandsCtrl)
    .to(AuthCommands)
    .inSingletonScope();
  
  container.bind<AuthQueries>(TYPES.AuthQueriesCtrl)
    .to(AuthQueries)
    .inSingletonScope();

  console.log('✅ Auth IoC Container configured with authentication services only');
  
  return container;
}

/**
 * 全域容器實例
 */
export const container = createContainer();

/**
 * 簡化的容器工具函數
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