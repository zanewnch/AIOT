/**
 * @fileoverview 統一回應結果工具類別
 * @description 提供統一的 API 回應格式，確保所有端點的回應結構一致
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Response } from 'express';

/**
 * 統一回應結果介面
 */
export interface IResResult<T = any> {
    /** HTTP 狀態碼 */
    status: number;
    /** 回應訊息 */
    message: string;
    /** 資料內容 */
    data?: T;
    /** 錯誤詳情（僅在失敗時） */
    error?: string;
    /** 時間戳 */
    timestamp: string;
}

/**
 * 統一回應結果工具類別
 * @description 提供標準化的 API 回應方法
 */
export class ResResult {
    /**
     * 成功回應
     * @param res - Express Response 物件
     * @param data - 回應資料
     * @param message - 回應訊息
     * @param statusCode - HTTP 狀態碼
     */
    public static success<T>(
        res: Response,
        data?: T,
        message: string = 'Success',
        statusCode: number = 200
    ): Response {
        const result: IResResult<T> = {
            status: statusCode,
            message,
            data,
            timestamp: new Date().toISOString()
        };

        return res.status(statusCode).json(result);
    }

    /**
     * 失敗回應
     * @param res - Express Response 物件
     * @param message - 錯誤訊息
     * @param statusCode - HTTP 狀態碼
     * @param error - 錯誤詳情
     */
    public static fail(
        res: Response,
        message: string = 'Internal Server Error',
        statusCode: number = 500,
        error?: string
    ): Response {
        const result: IResResult = {
            status: statusCode,
            message,
            error,
            timestamp: new Date().toISOString()
        };

        return res.status(statusCode).json(result);
    }

    /**
     * 未授權回應
     * @param res - Express Response 物件
     * @param message - 未授權訊息
     * @param data - 額外資料
     */
    public static unauthorized(
        res: Response,
        message: string = 'Unauthorized',
        data?: any
    ): Response {
        const result: IResResult = {
            status: 401,
            message,
            data,
            timestamp: new Date().toISOString()
        };

        return res.status(401).json(result);
    }

    /**
     * 禁止存取回應
     * @param res - Express Response 物件
     * @param message - 禁止存取訊息
     */
    public static forbidden(
        res: Response,
        message: string = 'Forbidden'
    ): Response {
        const result: IResResult = {
            status: 403,
            message,
            timestamp: new Date().toISOString()
        };

        return res.status(403).json(result);
    }

    /**
     * 找不到資源回應
     * @param res - Express Response 物件
     * @param message - 找不到資源訊息
     * @param data - 額外資料
     */
    public static notFound(
        res: Response,
        message: string = 'Resource Not Found',
        data?: any
    ): Response {
        const result: IResResult = {
            status: 404,
            message,
            data,
            timestamp: new Date().toISOString()
        };

        return res.status(404).json(result);
    }

    /**
     * 伺服器錯誤回應
     * @param res - Express Response 物件
     * @param message - 錯誤訊息
     */
    public static serverError(
        res: Response,
        message: string = 'Internal Server Error'
    ): Response {
        const result: IResResult = {
            status: 500,
            message,
            timestamp: new Date().toISOString()
        };

        return res.status(500).json(result);
    }
}

export default ResResult;