/**
 * @fileoverview 前端服務依賴注入類型定義
 * 
 * 定義 InversifyJS 容器使用的服務識別符
 * 
 * @version 1.0.0
 * @author AIOT Team
 * @since 2025-08-08
 */

/**
 * 依賴注入服務類型識別符
 * 使用 Symbol 確保唯一性和類型安全
 */
export const TYPES = {
    // 目前前端服務保持簡單結構
    // 等後續有實際需要再擴展更多服務類型
    Container: Symbol.for('Container')
};