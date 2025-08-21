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
import { ResResult } from '@aiot/shared-packages';

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
    const result = ResResult.unauthorized('Access token required');
    res.status(result.status).json(result);
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    const result = ResResult.unauthorized('Invalid or expired token');
    res.status(result.status).json(result);
  }
}

/**
 * 角色檢查中介軟體工廠
 */
export function requireRole(allowedRoles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const result = ResResult.unauthorized('Authentication required');
      res.status(result.status).json(result);
      return;
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(req.user.role)) {
      const result = ResResult.forbidden('Insufficient permissions');
      res.status(result.status).json(result);
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