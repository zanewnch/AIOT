/**
 * @fileoverview Rate Limiting 中間件 (修復版)
 * @description 實現基於 IP、用戶的請求頻率限制，保護 API Gateway 免受濫用
 * @author AIOT Development Team
 * @version 1.0.0
 */

import 'reflect-metadata';
import { injectable } from 'inversify';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { loggerConfig } from '../configs/loggerConfig.js';

/**
 * Rate Limit 配置介面
 */
export interface RateLimitConfig {
    /** 時間窗口（毫秒） */
    windowMs: number;
    /** 最大請求數 */
    maxRequests: number;
    /** 錯誤訊息 */
    message?: string;
    /** 跳過條件函數 */
    skip?: (req: Request, res: Response) => boolean;
}

/**
 * Slow Down 配置介面
 */
export interface SlowDownConfig {
    /** 時間窗口（毫秒） */
    windowMs: number;
    /** 延遲開始閾值 */
    delayAfter: number;
    /** 延遲增量（毫秒） */
    delayMs: number;
    /** 最大延遲（毫秒） */
    maxDelayMs?: number;
}

/**
 * 用戶級別 Rate Limiting 配置
 */
export interface UserRateLimitConfig {
    /** 普通用戶限制 */
    user: RateLimitConfig;
    /** 管理員限制 */
    admin: RateLimitConfig;
    /** 匿名用戶限制 */
    anonymous: RateLimitConfig;
}

/**
 * Rate Limiting 中間件類別
 */
@injectable()
export class RateLimitMiddleware {
    private logger = loggerConfig.child({ service: 'RateLimit' });

    constructor() {
        this.logger.info('✅ RateLimit middleware initialized');
    }

    /**
     * 創建基本 IP 限流中間件
     */
    public createBasicIpLimiter(config: RateLimitConfig = {
        windowMs: 15 * 60 * 1000, // 15 分鐘
        maxRequests: 100,
        message: 'Too many requests from this IP, please try again later.'
    }) {
        const limiter = rateLimit({
            windowMs: config.windowMs,
            max: config.maxRequests,
            message: {
                status: 429,
                message: config.message,
                retryAfter: Math.ceil(config.windowMs / 1000),
                timestamp: new Date().toISOString()
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: config.skip,
            // 修復 trust proxy 警告：使用自定義 key 生成器而非依賴 IP
            keyGenerator: (req) => {
                // 優先使用 X-Forwarded-For，然後是 X-Real-IP，最後才是 req.ip
                const forwarded = req.headers['x-forwarded-for'] as string;
                const realIp = req.headers['x-real-ip'] as string;
                const clientIp = forwarded?.split(',')[0]?.trim() || realIp || req.ip;
                return `ip:${clientIp}`;
            }
        });

        return (req: Request, res: Response, next: NextFunction) => {
            limiter(req, res, (error?: any) => {
                if (res.statusCode === 429) {
                    this.logger.warn('Rate limit reached', {
                        ip: req.ip,
                        userAgent: req.get('user-agent'),
                        url: req.originalUrl,
                        method: req.method
                    });
                }
                next(error);
            });
        };
    }

    /**
     * 創建基於用戶角色的限流中間件
     */
    public createUserBasedLimiter(configs: UserRateLimitConfig = {
        anonymous: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 20,
            message: 'Too many requests. Please login for higher limits.'
        },
        user: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 200,
            message: 'Too many requests from this user, please try again later.'
        },
        admin: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 1000,
            message: 'Too many requests from this admin, please try again later.'
        }
    }) {
        return (req: Request, res: Response, next: NextFunction) => {
            const user = req.user;
            const isAdmin = req.permissions?.roles?.includes('admin');
            
            let config: RateLimitConfig;
            let keyGenerator: (req: Request) => string;

            if (!user) {
                config = configs.anonymous;
                keyGenerator = (req: Request) => `anon:${req.ip}`;
            } else if (isAdmin) {
                config = configs.admin;
                keyGenerator = (req: Request) => `admin:${req.user.id}`;
            } else {
                config = configs.user;
                keyGenerator = (req: Request) => `user:${req.user.id}`;
            }

            const limiter = rateLimit({
                windowMs: config.windowMs,
                max: config.maxRequests,
                message: {
                    status: 429,
                    message: config.message,
                    userType: !user ? 'anonymous' : (isAdmin ? 'admin' : 'user'),
                    retryAfter: Math.ceil(config.windowMs / 1000),
                    timestamp: new Date().toISOString()
                },
                keyGenerator: (req) => {
                    // 生成基於用戶和 IP 的唯一鍵值
                    const forwarded = req.headers['x-forwarded-for'] as string;
                    const realIp = req.headers['x-real-ip'] as string;
                    const clientIp = forwarded?.split(',')[0]?.trim() || realIp || req.ip;
                    
                    if (!req.user) {
                        return `anon:${clientIp}`;
                    } else if (req.permissions?.roles?.includes('admin')) {
                        return `admin:${req.user.id}:${clientIp}`;
                    } else {
                        return `user:${req.user.id}:${clientIp}`;
                    }
                },
                standardHeaders: true,
                legacyHeaders: false
            });

            limiter(req, res, (error?: any) => {
                if (res.statusCode === 429) {
                    this.logger.warn('User-based rate limit reached', {
                        userId: user?.id,
                        userType: !user ? 'anonymous' : (isAdmin ? 'admin' : 'user'),
                        ip: req.ip,
                        url: req.originalUrl,
                        method: req.method
                    });
                }
                next(error);
            });
        };
    }

    /**
     * 創建 API 端點特定限流中間件
     */
    public createEndpointLimiter(endpoint: string, config: RateLimitConfig) {
        const limiter = rateLimit({
            windowMs: config.windowMs,
            max: config.maxRequests,
            message: {
                status: 429,
                message: config.message || `Too many requests to ${endpoint}, please try again later.`,
                endpoint,
                retryAfter: Math.ceil(config.windowMs / 1000),
                timestamp: new Date().toISOString()
            },
            keyGenerator: (req) => {
                // 修復 trust proxy 警告：使用自定義 IP 提取
                const forwarded = req.headers['x-forwarded-for'] as string;
                const realIp = req.headers['x-real-ip'] as string;
                const clientIp = forwarded?.split(',')[0]?.trim() || realIp || req.ip;
                return `endpoint:${endpoint}:${clientIp}`;
            },
            standardHeaders: true,
            legacyHeaders: false,
            skip: config.skip
        });

        return (req: Request, res: Response, next: NextFunction) => {
            limiter(req, res, (error?: any) => {
                if (res.statusCode === 429) {
                    this.logger.warn('Endpoint rate limit reached', {
                        endpoint,
                        ip: req.ip,
                        userId: req.user?.id,
                        url: req.originalUrl,
                        method: req.method
                    });
                }
                next(error);
            });
        };
    }

    /**
     * 創建慢速請求中間件（逐漸增加延遲）
     */
    public createSlowDownMiddleware(config: SlowDownConfig = {
        windowMs: 15 * 60 * 1000, // 15 分鐘
        delayAfter: 50, // 50 請求後開始延遲
        delayMs: 500, // 每次增加 500ms
        maxDelayMs: 20000 // 最大延遲 20 秒
    }) {
        return slowDown({
            windowMs: config.windowMs,
            delayAfter: config.delayAfter,
            delayMs: config.delayMs,
            maxDelayMs: config.maxDelayMs
        });
    }

    /**
     * 預設 API Gateway 限流配置
     */
    public getDefaultGatewayLimiters() {
        return {
            // 全域 IP 限制（保護性）
            global: this.createBasicIpLimiter({
                windowMs: 15 * 60 * 1000, // 15 分鐘
                maxRequests: 1000,
                message: 'Too many requests from this IP address.'
            }),

            // 認證端點限制（更嚴格）
            auth: this.createEndpointLimiter('/auth', {
                windowMs: 15 * 60 * 1000, // 15 分鐘
                maxRequests: 10,
                message: 'Too many login attempts, please try again later.',
                skip: (req) => req.method === 'GET' // 跳過 GET 請求
            }),

            // API 端點限制（基於用戶）
            api: this.createUserBasedLimiter(),

            // LLM 服務限制（資源密集）
            llm: this.createEndpointLimiter('/llm', {
                windowMs: 60 * 1000, // 1 分鐘
                maxRequests: 20,
                message: 'Too many AI requests, please wait before trying again.'
            }),

            // WebSocket 連接限制
            websocket: this.createEndpointLimiter('/ws', {
                windowMs: 5 * 60 * 1000, // 5 分鐘
                maxRequests: 5,
                message: 'Too many WebSocket connections, please try again later.'
            }),

            // 慢速請求保護
            slowDown: this.createSlowDownMiddleware({
                windowMs: 15 * 60 * 1000,
                delayAfter: 100,
                delayMs: 250,
                maxDelayMs: 10000
            })
        };
    }
}