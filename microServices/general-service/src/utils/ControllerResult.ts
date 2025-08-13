/**
 * @fileoverview 控制器統一回應格式
 * 
 * 確保所有 API 端點使用相同的回應格式
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-08
 */

import { Response } from 'express';

/**
 * 統一的 API 回應格式
 */
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

/**
 * 控制器回應工具類別
 */
export class ControllerResult {
  /**
   * 成功回應
   */
  static success<T>(res: Response, data?: T, message: string = 'Success', status: number = 200): Response {
    return res.status(status).json({
      status,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 錯誤回應
   */
  static error(res: Response, message: string, status: number = 400, error?: string): Response {
    return res.status(status).json({
      status,
      message,
      error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 未找到回應
   */
  static notFound(res: Response, message: string = 'Resource not found'): Response {
    return this.error(res, message, 404, 'NOT_FOUND');
  }

  /**
   * 未授權回應
   */
  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, 401, 'UNAUTHORIZED');
  }

  /**
   * 禁止存取回應
   */
  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, 403, 'FORBIDDEN');
  }

  /**
   * 內部伺服器錯誤回應
   */
  static internalError(res: Response, message: string = 'Internal server error'): Response {
    return this.error(res, message, 500, 'INTERNAL_ERROR');
  }

  /**
   * 建立回應 - 向後相容
   */
  static created<T>(res: Response, data?: T, message: string = 'Created'): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * 錯誤請求回應 - 向後相容
   */
  static badRequest(res: Response, message: string = 'Bad request'): Response {
    return this.error(res, message, 400, 'BAD_REQUEST');
  }
}