/**
 * @fileoverview AIOT Gateway Service 伺服器配置模組
 * @description 提供 Gateway Service 的完整配置，包括埠號、環境變數等設定
 * @author AIOT Development Team
 * @version 1.0.0
 */

import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Gateway 服務伺服器配置介面
 * @description 定義 Gateway Service 的基本配置參數
 */
export interface GatewayServerConfig {
    /** 伺服器埠號 */
    port: number;
    /** Node.js 環境模式 */
    nodeEnv: string;
    /** 視圖模板檔案路徑 */
    viewsPath: string;
    /** 靜態檔案服務路徑 */
    publicPath: string;
    /** 文檔檔案路徑 */
    docsPath: string;
    /** 服務名稱 */
    serviceName: string;
    /** API 版本 */
    apiVersion: string;
}

/**
 * 微服務端點配置介面
 * @description 定義各個微服務的連接配置
 */
export interface MicroserviceEndpoints {
    /** RBAC 服務配置 */
    rbac: {
        host: string;
        grpcPort: number;
        httpPort: number;
        url: string;
    };
    /** Drone 服務配置 */
    drone: {
        host: string;
        grpcPort: number;
        httpPort: number;
        url: string;
    };
    /** General 服務配置 */
    general: {
        host: string;
        grpcPort: number;
        httpPort: number;
        url: string;
    };
    /** Docs 服務配置 */
    docs: {
        host: string;
        httpPort: number;
        url: string;
    };
    /** Drone WebSocket 服務配置 */
    droneWebsocket: {
        host: string;
        port: number;
        url: string;
    };
}

/**
 * 正規化埠號
 * @description 將埠號字串轉換為適當的數字格式
 * @param val - 埠號字串
 * @returns 正規化後的埠號
 */
export const normalizePort = (val: string): number => {
    const portNum = parseInt(val, 10);
    
    if (isNaN(portNum) || portNum < 0) {
        throw new Error(`Invalid port number: ${val}`);
    }
    
    return portNum;
};

/**
 * 獲取 Gateway 服務配置物件
 * @description 建立並返回包含所有 Gateway 服務配置的物件
 * @returns Gateway 服務配置物件
 */
export const getGatewayServerConfig = (): GatewayServerConfig => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    return {
        port: normalizePort(process.env.PORT || process.env.GATEWAY_PORT || '8000'),
        nodeEnv: process.env.NODE_ENV || 'development',
        viewsPath: path.join(__dirname, '../../views'),
        publicPath: path.join(__dirname, '../../public'),
        docsPath: path.join(__dirname, '../../docs'),
        serviceName: process.env.SERVICE_NAME || 'gateway-service',
        apiVersion: process.env.API_VERSION || 'v1'
    };
};

/**
 * 獲取微服務端點配置
 * @description 取得所有微服務的連接端點配置
 * @returns 微服務端點配置物件
 */
export const getMicroserviceEndpoints = (): MicroserviceEndpoints => {
    return {
        rbac: {
            host: process.env.RBAC_SERVICE_HOST || 'aiot-rbac-service',
            grpcPort: normalizePort(process.env.RBAC_SERVICE_PORT || '50051'),
            httpPort: normalizePort(process.env.RBAC_HTTP_PORT || '3051'),
            url: process.env.RBAC_SERVICE_URL || 'aiot-rbac-service:50051'
        },
        drone: {
            host: process.env.DRONE_SERVICE_HOST || 'aiot-drone-service',
            grpcPort: normalizePort(process.env.DRONE_SERVICE_PORT || '50052'),
            httpPort: normalizePort(process.env.DRONE_HTTP_PORT || '3052'),
            url: process.env.DRONE_SERVICE_URL || 'aiot-drone-service:50052'
        },
        general: {
            host: process.env.GENERAL_SERVICE_HOST || 'aiot-general-service',
            grpcPort: normalizePort(process.env.GENERAL_SERVICE_PORT || '50053'),
            httpPort: normalizePort(process.env.GENERAL_HTTP_PORT || '3053'),
            url: process.env.GENERAL_SERVICE_URL || 'aiot-general-service:50053'
        },
        docs: {
            host: process.env.DOCS_SERVICE_HOST || 'aiot-docs-service',
            httpPort: normalizePort(process.env.DOCS_SERVICE_PORT || '3054'),
            url: process.env.DOCS_SERVICE_URL || 'http://aiot-docs-service:3054'
        },
        droneWebsocket: {
            host: process.env.DRONE_WEBSOCKET_SERVICE_HOST || 'aiot-drone-websocket-service',
            port: normalizePort(process.env.DRONE_WEBSOCKET_SERVICE_PORT || '3004'),
            url: process.env.DRONE_WEBSOCKET_SERVICE_URL || 'http://aiot-drone-websocket-service:3004'
        }
    };
};

// 導出配置實例
export const serverConfig = getGatewayServerConfig();
export const microserviceEndpoints = getMicroserviceEndpoints();