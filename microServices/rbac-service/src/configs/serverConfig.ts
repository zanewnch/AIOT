/**
 * @fileoverview Express 伺服器配置模組
 * 此模組提供 Express 應用程式的完整配置，包括中間件設定、路徑配置和埠號處理
 * 用於建立和設定 Web 伺服器的基本架構
 */

// 匯入 Express 框架用於建立 Web 伺服器
import express from 'express';
// 匯入 path 模組用於處理檔案路徑
import path from 'path';
// 匯入 fileURLToPath 用於將文件 URL 轉換為檔案路徑
import { fileURLToPath } from 'url';
// 匯入 cookie 解析器中間件
import cookieParser from 'cookie-parser';
// 匯入 Morgan 日誌記錄中間件
import logger from 'morgan';
// 匯入 Passport.js 身份驗證中間件
import passport from 'passport';
// 匯入 CORS 跨域資源共享中間件
import cors from 'cors';

/**
 * 伺服器配置介面
 * 定義 Express 伺服器的基本配置參數
 */
export interface ServerConfig {
    /** 伺服器埠號，可以是數字、字串或 false */
    port: number | string | false;
    /** 視圖模板檔案路徑 */
    viewsPath: string;
    /** 靜態檔案服務路徑 */
    publicPath: string;
    /** 文檔檔案路徑 */
    docsPath: string;
    /** 視圖引擎類型 */
    viewEngine: string;
}

/**
 * 獲取伺服器配置物件
 * 建立並返回包含所有伺服器配置的物件
 * @returns {ServerConfig} 完整的伺服器配置物件
 */
export const getServerConfig = (): ServerConfig => {
    // 將當前模組的 URL 轉換為檔案路徑
    const __filename = fileURLToPath(import.meta.url);
    // 獲取當前檔案的目錄路徑
    const __dirname = path.dirname(__filename);

    // 返回伺服器配置物件
    return {
        // 從環境變數獲取埠號，預設為 8000，並進行格式化處理
        port: normalizePort(process.env.PORT || '8000'),
        // 設定視圖模板檔案的路徑
        viewsPath: path.join(__dirname, '../../views'),
        // 設定靜態檔案服務的路徑
        publicPath: path.join(__dirname, '../../public'),
        // 設定文檔檔案的路徑
        docsPath: path.join(__dirname, '../../docs'),
        // 設定視圖引擎為 EJS
        viewEngine: 'ejs'
    };
};

/**
 * 設定 Express 中間件
 * 為 Express 應用程式配置所有必要的中間件
 * @param {express.Application} app - Express 應用程式實例
 * @returns {void} 無返回值
 */
export const setupExpressMiddleware = (app: express.Application): void => {
    // 獲取伺服器配置
    const config = getServerConfig();

    // 設定視圖模板檔案路徑
    app.set('views', config.viewsPath);
    // 設定視圖引擎
    app.set('view engine', config.viewEngine);
    // 設定伺服器埠號
    app.set('port', config.port);
    
    // 禁用 ETag 以避免 304 Not Modified 響應
    app.set('etag', false);

    // 設定 CORS 跨域資源共享中間件
    app.use(cors({
        // 根據環境設定允許的來源網域
        origin: process.env.NODE_ENV === 'production'
            ? process.env.FRONTEND_URL  // 生產環境使用環境變數中的前端 URL
            : ['http://localhost:3000', 'http://aiot-frontend:3000'],  // 開發環境支援多個來源
        // 允許發送認證資訊（如 cookies）
        credentials: true,
        // 允許的 HTTP 方法
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        // 允許的請求標頭
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // 設定 Morgan 日誌記錄中間件，使用開發模式格式
    app.use(logger('dev'));
    // 設定 JSON 請求體解析中間件
    app.use(express.json());
    // 設定 URL 編碼請求體解析中間件，不支援擴展語法
    app.use(express.urlencoded({ extended: false }));
    // 設定 Cookie 解析中間件
    app.use(cookieParser());
    // 設定靜態檔案服務中間件
    app.use(express.static(config.publicPath));
    // 設定 API 文檔靜態檔案服務
    app.use('/api/docs', express.static(config.docsPath));
    // 初始化 Passport 身份驗證中間件
    app.use(passport.initialize());
};

/**
 * 正規化埠號
 * 將埠號字串轉換為適當的格式（數字、字串或 false）
 * @param {string} val - 埠號字串
 * @returns {number | string | false} 正規化後的埠號
 */
export const normalizePort = (val: string): number | string | false => {
    // 將字串轉換為十進位整數
    const portNum = parseInt(val, 10);

    // 檢查是否為有效數字
    if (isNaN(portNum)) {
        // 如果不是數字，返回原始字串（可能是命名管道）
        return val;
    }

    // 檢查埠號是否為非負數
    if (portNum >= 0) {
        // 如果是有效的埠號，返回數字
        return portNum;
    }

    // 如果埠號無效，返回 false
    return false;
};