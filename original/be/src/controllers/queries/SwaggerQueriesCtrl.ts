/**
 * @fileoverview Swagger 查詢控制器
 * 
 * 此文件實作了 Swagger 查詢控制器，
 * 專注於處理所有讀取相關的 HTTP API 端點。
 * 遵循 CQRS 模式，只處理查詢操作，提供 OpenAPI 規格文件的存取功能。
 * 
 * @module SwaggerQueries
 * @author AIOT Team
 * @since 1.0.0
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { specs } from '../../configs/swaggerConfig.js';
import { createLogger, logRequest } from '../../configs/loggerConfig.js';

const logger = createLogger('SwaggerQueries');

/**
 * Swagger 查詢控制器類別
 * 
 * 專門處理 API 文檔相關的查詢請求，提供 OpenAPI 規格文件的存取功能。
 * 所有方法都是唯讀操作，不會修改系統狀態。
 * 
 * @class SwaggerQueries
 * @since 1.0.0
 */
export class SwaggerQueries {
    constructor() {
        // 控制器專注於業務邏輯處理
    }

    /**
     * 獲取 OpenAPI 規格文件
     * @route GET /api/swagger.json
     */
    public getSwaggerSpec = (req: Request, res: Response, next: NextFunction): void => {
        try {
            logger.info('Serving OpenAPI specification document');
            logRequest(req, 'Swagger specification request', 'info');

            // 設定回應標頭為 JSON 格式
            res.setHeader('Content-Type', 'application/json');

            logger.debug('OpenAPI specification document prepared and sent successfully');
            // 回傳 OpenAPI 規格文件給客戶端（直接返回規格，不使用 ControllerResult 包裝）
            // 這是因為 Swagger UI 和其他工具期望直接獲得 OpenAPI 規格文件
            res.status(200).send(specs);
        } catch (error) {
            logger.error('Error serving OpenAPI specification:', error);
            // 將例外處理委派給 Express 錯誤處理中間件
            next(error);
        }
    };
}