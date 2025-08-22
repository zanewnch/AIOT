/**
 * @fileoverview 微服務配置
 * @description 統一管理所有微服務的配置資訊
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { ServiceConfig } from '../types/DocumentationTypes.js';

/**
 * 微服務配置列表
 * 定義所有 AIOT 系統中的微服務及其相關資訊
 */
export const MICROSERVICES_CONFIG: ServiceConfig[] = [
    {
        name: 'RBAC Service',
        description: '權限控制與使用者管理服務',
        baseUrl: process.env.RBAC_SERVICE_URL || 'http://aiot-rbac-service:3051',
        features: ['用戶管理', '角色管理', '權限控制', '會話管理'],
        icon: '🔐',
        color: '#e53e3e'
    },
    {
        name: 'Drone Service',
        description: '無人機控制與監控服務',
        baseUrl: process.env.DRONE_SERVICE_URL || 'http://aiot-drone-service:3052',
        features: ['無人機控制', '位置追蹤', '狀態監控', '飛行路徑'],
        icon: '🚁',
        color: '#3182ce'
    },
    {
        name: 'General Service',
        description: '通用功能與系統管理服務',
        baseUrl: process.env.GENERAL_SERVICE_URL || 'http://aiot-general-service:3053',
        features: ['系統設定', '通用查詢', '資料處理', '工具函數'],
        icon: '⚙️',
        color: '#38a169'
    },
    {
        name: 'Auth Service',
        description: '身份驗證與授權服務',
        baseUrl: process.env.AUTH_SERVICE_URL || 'http://aiot-auth-service:3055',
        features: ['JWT 驗證', '登入登出', 'Token 管理', '密碼處理'],
        icon: '🔑',
        color: '#d69e2e'
    }
];

/**
 * 根據服務名稱獲取服務配置
 * @param serviceName 服務名稱 (不區分大小寫)
 * @returns 服務配置或 undefined
 */
export function getServiceConfig(serviceName: string): ServiceConfig | undefined {
    return MICROSERVICES_CONFIG.find(service => 
        service.name.toLowerCase().replace(' service', '') === serviceName.toLowerCase()
    );
}

/**
 * 獲取所有微服務的名稱列表
 * @returns 服務名稱陣列
 */
export function getAllServiceNames(): string[] {
    return MICROSERVICES_CONFIG.map(service => 
        service.name.toLowerCase().replace(' service', '')
    );
}

/**
 * 檢查服務是否存在
 * @param serviceName 服務名稱
 * @returns 是否存在
 */
export function isValidService(serviceName: string): boolean {
    return getServiceConfig(serviceName) !== undefined;
}