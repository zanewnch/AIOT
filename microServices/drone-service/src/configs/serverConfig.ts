/**
 * @fileoverview Express 伺服器配置模組
 * 此模組提供 Express 應用程式的完整配置，包括中間件設定、路徑配置和埠號處理
 * 用於建立和設定 Web 伺服器的基本架構
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * 設定 Express 中間件
 * 配置所有必要的 Express 中間件，包括 CORS、解析器、日誌等
 * 
 * @param app Express 應用程式實例
 */
export const setupExpressMiddleware = (app: express.Application): void => {
    // 獲取當前檔案目錄
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // 設定視圖引擎和靜態檔案
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '../views'));
    app.use('/static', express.static(path.join(__dirname, '../public')));

    // CORS 配置 - 允許跨域請求
    app.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:8000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
    }));

    // 日誌記錄中間件
    app.use(logger('combined'));

    // JSON 解析中間件 - 解析 JSON 格式的請求體
    app.use(express.json({
        limit: '10mb' // 設定請求體大小限制
    }));

    // URL 編碼解析中間件 - 解析 URL 編碼的請求體
    app.use(express.urlencoded({ 
        extended: false,
        limit: '10mb'
    }));

    // Cookie 解析中間件
    app.use(cookieParser());

    // 設定回應標頭
    app.use((req, res, next) => {
        res.header('X-Powered-By', 'AIOT Drone Service');
        next();
    });

    console.log('✅ Express middleware configured for Drone service');
};