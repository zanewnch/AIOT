/**
 * @fileoverview Drone WebSocket Service IoC 容器配置
 * 
 * 遵循 CLAUDE.md 規範，使用 @injectable 和 @inject 裝飾器
 * 禁止使用 container.bind() 手動綁定
 * 
 * @version 2.0.0
 * @author AIOT Team
 * @since 2025-08-23
 */

import 'reflect-metadata';
import { Container } from 'inversify';

/**
 * 創建並配置 Drone WebSocket Service 的 IoC 容器
 * 
 * @returns {Container} 配置好的 InversifyJS 容器
 */
export function createContainer(): Container {
  const container = new Container({
    defaultScope: 'Singleton'
  });

  console.log('✅ Drone WebSocket Service IoC 容器已配置');
  console.log('📦 使用 @injectable 和 @inject 裝飾器進行依賴注入');
  console.log('🚫 遵循 CLAUDE.md 規範，不使用手動 container.bind()');
  
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