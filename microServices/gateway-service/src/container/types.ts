/**
 * @fileoverview Gateway Service IoC 容器類型定義
 * 
 * 定義 InversifyJS 容器中所有服務的類型標識符，
 * 用於依賴注入的 @inject() decorator
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-23
 */

/**
 * 服務類型標識符
 * 這些常數用於 InversifyJS 容器中識別不同的服務類型，
 * 確保依賴注入時的類型安全和清晰性
 */
export const TYPES = {
  // ===== 基礎設施服務 =====
  /**
   * Logger 服務類型
   */
  Logger: Symbol.for('Logger'),
  // ===== 配置服務 =====
  /**
   * Consul 配置服務類型
   */
  ConsulConfig: Symbol.for('ConsulConfig'),
  /**
   * 健康檢查配置服務類型
   */
  HealthConfig: Symbol.for('HealthConfig'),
  /**
   * 伺服器配置服務類型
   */
  ServerConfig: Symbol.for('ServerConfig'),
  
  // ===== 中間件服務 =====
  /**
   * 認證中間件服務類型
   */
  AuthMiddleware: Symbol.for('AuthMiddleware'),
  /**
   * 代理中間件服務類型
   */
  ProxyMiddleware: Symbol.for('ProxyMiddleware'),
  /**
   * 錯誤處理中間件服務類型
   */
  ErrorHandleMiddleware: Symbol.for('ErrorHandleMiddleware'),
  
  // ===== 控制器服務 =====
  /**
   * Gateway 控制器服務類型
   */
  GatewayController: Symbol.for('GatewayController'),
  /**
   * 認證測試控制器服務類型
   */
  AuthTestController: Symbol.for('AuthTestController'),
  
  // ===== 路由服務 =====
  /**
   * API 路由服務類型
   */
  ApiRoutes: Symbol.for('ApiRoutes'),
  /**
   * 文檔路由服務類型
   */
  DocsRoutes: Symbol.for('DocsRoutes'),
  /**
   * 路由註冊器類型
   */
  RouteRegistrar: Symbol.for('RouteRegistrar'),
  
  // ===== 應用程式核心 =====
  /**
   * Gateway 應用程式類型
   */
  GatewayApp: Symbol.for('GatewayApp')
} as const;

/**
 * 類型標識符的類型定義
 * 用於 TypeScript 類型檢查
 */
export type ServiceTypes = typeof TYPES[keyof typeof TYPES];
