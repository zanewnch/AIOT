/**
 * @fileoverview 認證中介軟體
 * 
 * 提供 JWT Token 驗證和角色檢查功能
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-08
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ControllerResult } from '../utils/ControllerResult.js';

/**
 * JWT Payload 介面
 */
export interface JwtPayload {
  id?: number;
  sub?: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * 擴充 Request 介面以包含使用者資訊
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
    interface User extends JwtPayload {}
  }
}

/**
 * JWT Token 驗證中介軟體
 */
export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    ControllerResult.unauthorized(res, 'Access token required');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    ControllerResult.unauthorized(res, 'Invalid or expired token');
  }
}

/**
 * 角色檢查中介軟體工廠
 */
export function requireRole(allowedRoles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ControllerResult.unauthorized(res, 'Authentication required');
      return;
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      ControllerResult.forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
}

/**
 * 管理員權限檢查中介軟體
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole('admin')(req, res, next);
}

/**
 * 可選的 Token 驗證中介軟體（不強制要求 Token）
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JwtPayload;
      req.user = decoded;
    } catch (error) {
      // 忽略錯誤，繼續處理
    }
  }

  next();
}