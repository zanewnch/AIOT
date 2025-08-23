/**
 * @fileoverview RBAC 服務文檔路由
 * @description 提供服務說明和 API 文檔的端點
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ResResult } from '../utils/ResResult.js';
import { createLogger } from '../configs/loggerConfig.js';

const logger = createLogger('DocsRoutes');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

/**
 * RBAC 服務功能說明頁面
 * 提供服務用途、功能列表、API 範例等資訊
 */
router.get('/docs', (req: Request, res: Response) => {
    try {
        const serviceInfo = {
            serviceName: 'RBAC Service',
            description: '基於角色的存取控制（Role-Based Access Control）服務',
            version: '1.0.0',
            features: [
                {
                    name: '用戶管理',
                    description: '完整的用戶生命週期管理',
                    endpoints: [
                        'POST /users - 創建新用戶',
                        'GET /users - 獲取用戶列表',
                        'GET /users/:id - 獲取用戶詳情',
                        'PUT /users/:id - 更新用戶資訊',
                        'DELETE /users/:id - 刪除用戶'
                    ]
                },
                {
                    name: '角色管理',
                    description: '動態角色定義和權限分配',
                    endpoints: [
                        'POST /roles - 創建新角色',
                        'GET /roles - 獲取角色列表',
                        'GET /roles/:id - 獲取角色詳情',
                        'PUT /roles/:id - 更新角色資訊',
                        'DELETE /roles/:id - 刪除角色'
                    ]
                },
                {
                    name: '權限管理',
                    description: '細粒度權限控制和授權管理',
                    endpoints: [
                        'POST /permissions - 創建新權限',
                        'GET /permissions - 獲取權限列表',
                        'GET /permissions/:id - 獲取權限詳情',
                        'PUT /permissions/:id - 更新權限資訊',
                        'DELETE /permissions/:id - 刪除權限'
                    ]
                },
                {
                    name: '關聯管理',
                    description: '用戶-角色和角色-權限的關聯管理',
                    endpoints: [
                        'POST /user-roles - 分配用戶角色',
                        'GET /user-roles - 獲取用戶角色關聯',
                        'DELETE /user-roles - 移除用戶角色',
                        'POST /role-permissions - 分配角色權限',
                        'GET /role-permissions - 獲取角色權限關聯',
                        'DELETE /role-permissions - 移除角色權限'
                    ]
                }
            ],
            architecture: {
                pattern: 'CQRS (Command Query Responsibility Segregation)',
                database: 'MySQL',
                cache: 'Redis',
                communication: 'gRPC + HTTP REST',
                dependencies: ['consul', 'mysql', 'redis', 'jwt']
            },
            examples: [
                {
                    title: '創建用戶並分配角色',
                    steps: [
                        '1. POST /users - 創建新用戶',
                        '2. POST /roles - 創建角色（如果不存在）',
                        '3. POST /user-roles - 將角色分配給用戶',
                        '4. GET /users/:id/roles - 驗證角色分配'
                    ]
                },
                {
                    title: '權限檢查流程',
                    steps: [
                        '1. 用戶請求受保護資源',
                        '2. 中間件提取 JWT Token',
                        '3. 查詢用戶的角色和權限',
                        '4. 驗證是否有足夠權限',
                        '5. 允許或拒絕存取'
                    ]
                }
            ],
            monitoring: {
                healthCheck: '/health',
                metrics: '/metrics',
                swagger: '/api-docs'
            }
        };

        // 如果是 API 請求，返回 JSON
        if (req.headers.accept?.includes('application/json')) {
            ResResult.success(res, serviceInfo, 'RBAC 服務文檔資訊');
            return;
        }

        // 否則渲染 HTML 頁面
        res.render('rbac-docs', serviceInfo);

    } catch (error) {
        logger.error('文檔頁面生成失敗:', error);
        ResResult.serverError(res, '文檔載入失敗');
    }
});

/**
 * TypeDoc API 文檔重定向
 * 重定向到 TypeDoc 生成的技術文檔
 */
router.get('/typedoc', (req: Request, res: Response) => {
    try {
        const typedocPath = path.join(__dirname, '../../docs/index.html');
        
        // 檢查 TypeDoc 文檔是否存在
        const fs = require('fs');
        if (fs.existsSync(typedocPath)) {
            res.sendFile(typedocPath);
        } else {
            // 如果 TypeDoc 文檔不存在，提供說明
            const message = {
                message: 'TypeDoc 文檔尚未生成',
                instructions: [
                    '1. 執行 npm run docs 生成 TypeDoc 文檔',
                    '2. 或查看 /utils/TYPEDOC_USAGE.md 了解使用方法'
                ],
                alternativeApi: '/docs - 查看服務功能說明'
            };

            if (req.headers.accept?.includes('application/json')) {
                ResResult.notFound(res, '文檔未找到', message);
                return;
            } else {
                res.status(404).send(`
                    <h1>TypeDoc 文檔未找到</h1>
                    <p>請先生成 TypeDoc 文檔：</p>
                    <ul>
                        <li>執行 <code>npm run docs</code></li>
                        <li>或查看 <a href="/utils/TYPEDOC_USAGE.md">使用說明</a></li>
                    </ul>
                    <p><a href="/docs">查看服務功能說明</a></p>
                `);
            }
        }

    } catch (error) {
        logger.error('TypeDoc 文檔載入失敗:', error);
        ResResult.serverError(res, 'TypeDoc 文檔載入失敗');
    }
});

/**
 * API 文檔重定向（兼容性）
 */
router.get('/api-docs', (req: Request, res: Response) => {
    res.redirect('/docs');
});

/**
 * Swagger 文檔重定向（如果有配置 Swagger）
 */
router.get('/swagger', (req: Request, res: Response) => {
    // 如果有配置 Swagger，可以重定向到 Swagger UI
    // 這裡先重定向到服務說明頁面
    res.redirect('/docs');
});

export default router;