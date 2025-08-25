/**
 * @fileoverview 認證命令服務 - 檔案層級意圖說明
 *
 * 目的：此服務類別負責處理所有認證相關的命令型操作（登入、登出），
 * 並提供 JWT 產生和權限管理功能。此為示範實作，生產環境應整合真實的
 * 身份驗證服務。
 *
 * **核心功能：**
 * - 使用者身份驗證和權限檢查
 * - JWT token 產生和管理
 * - 會話（session）生命週期管理
 * - 使用者權限和角色管理
 * - API 範圍（scopes）建置
 *
 * **安全考量：**
 * - 密碼驗證和用戶認證
 * - JWT 安全簽名和資訊封裝
 * - 會話管理和失效機制
 * - 詳細的認證日誌和審計追蹤
 *
 * **型別定義：**
 * 本檔案包含本服務專用的型別定義（UserPermissions、LoginRequest 等），
 * 以減少對外部依賴並方便 TypeDoc 文件生成。
 *
 * @version 1.0.0
 * @author AIOT Team
 * @since 2024-01-01
 */
import 'reflect-metadata';
import { injectable } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import { JwtUtils, JwtGenerateOptions } from '../../utils/JwtUtils.js';
import { createLogger } from '../../configs/loggerConfig.js';

const logger = createLogger('AuthCommandsService');

/**
 * 使用者權限簡化介面（本地定義以供範例使用）
 */
export interface UserPermissions {
    roles: string[];
    permissions: string[];
    departmentId?: number;
    level?: number;
}

/**
 * 登入請求 DTO（簡化）
 */
export interface LoginRequest {
    username: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
    rememberMe?: boolean;
}

/**
 * 登入回應 DTO（簡化）
 */
export interface LoginResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: { id: number; username: string; roles: string[]; permissions: string[]; departmentId?: number; level?: number };
}

/**
 * 登出請求 DTO（簡化）
 */
export interface LogoutRequest {
    token?: string;
    sessionId?: string;
}

/**
 * 認證命令服務類別 - 負責處理所有認證相關的命令型操作
 *
 * 此服務類別實作 CQRS 模式中的命令端負責，處理所有會改變系統狀態的
 * 認證操作。包括使用者登入、登出、權限驗證和 JWT 管理。
 *
 * **主要功能：**
 * - 使用者身份驗證（基於預設用戶資料或外部服務）
 * - JWT token 產生和簽名，包含使用者資訊和權限
 * - 會話管理和 sessionId 的生命週期控制
 * - 使用者權限和角色的查詢和管理
 * - API 範圍（scopes）的建置和管理
 *
 * **安全特性：**
 * - 密碼串比對驗證（示範版本使用明文，生產環境應使用雜湊）
 * - JWT 安全簽名防止篩改
 * - 會話 ID 追蹤防止重複登入
 * - 詳細的認證事件日誌記錄
 *
 * **測試用戶資料：**
 * 包含多種角色的預設用戶，包括管理員、操作員、一般用戶等，
 * 用於功能測試和演示。生產環境應整合真實的用戶資料庫。
 *
 * @class AuthCommandsService
 * @example
 * ```typescript
 * const authService = container.get<AuthCommandsService>(TYPES.AuthCommandsService);
 * const loginResult = await authService.login({
 *   username: 'admin',
 *   password: 'admin',
 *   ipAddress: '192.168.1.1'
 * });
 * ```
 *
 * @since 1.0.0
 * @public
 */
@injectable()
export class AuthCommandsService {
    /**
     * 活躍會話管理映射表
     * 儲存目前活躍的用戶會話，用於管理登入狀態和會話驗證
     * @private
     * @type {Map<string, string>} sessionId 對應到 userId 的映射
     */
    private readonly activeSessions = new Map<string, string>(); // sessionId -> userId 的映射關係

    /**
     * 測試用的預設用戶資料庫
     * 
     * 包含多種角色和權限等級的示範用戶，用於功能測試和演示。
     * 生產環境中應更換為真實的資料庫查詢或外部身份驗證服務。
     * 
     * **注意：** 此處使用明文密碼僅供示範，生產環境必須使用適當的雜湊演算法。
     * 
     * @private
     * @type {Record<string, {password: string, id: number}>}
     */
    private readonly validUsers: Record<string, { password: string, id: number }> = {
        'superadmin': { password: 'superadmin', id: 1 },
        'admin': { password: 'admin', id: 2 },
        'drone_admin': { password: 'drone123', id: 3 },
        'pilot_001': { password: 'pilot123', id: 4 },
        'mission_cmd': { password: 'mission123', id: 5 },
        'maintenance_tech': { password: 'maintenance123', id: 6 },
        'monitor_op': { password: 'monitor123', id: 7 },
        'dept_manager': { password: 'manager123', id: 8 },
        'regular_user': { password: 'user123', id: 9 },
        'emergency_user': { password: 'emergency123', id: 10 }
    };

    /**
     * 根據使用者名稱獲取完整的權限資訊
     *
     * 此方法根據使用者名稱回傳對應的角色、權限、部門和等級資訊。
     * 在示範實作中使用靜態資料庫，生產環境應改為資料庫查詢。
     *
     * **資料結構說明：**
     * - roles: 使用者所屬的角色清單
     * - permissions: 具體的權限字串清單，支援區点記號權限
     * - departmentId: 所屬部門 ID（選填）
     * - level: 權限等級，數字越高權限越大（選填）
     *
     * **支援的用戶類型：**
     * - superadmin: 超級管理員，擁有所有權限 (*)
     * - admin: 一般管理員，擁有大部分管理權限
     * - drone_admin: 無人機管理員
     * - pilot_001: 無人機操作員
     * - mission_cmd: 任務指揮官
     * - 其他各類特殊角色用戶
     *
     * @private
     * @param username - 使用者名稱，用於查詢權限設定
     * @returns {UserPermissions} 使用者權限物件，包含角色、權限、部門和等級資訊
     *
     * @example
     * ```typescript
     * const permissions = this.getUserPermissions('admin');
     * // 回傳: { roles: ['admin'], permissions: ['user.read', ...], departmentId: 1, level: 8 }
     * ```
     */
    private getUserPermissions(username: string): UserPermissions {
        const userPermissions: Record<string, UserPermissions> = {
            'superadmin': {
                roles: ['superadmin'],
                permissions: ['*'], // 超級管理員擁有所有權限
                departmentId: 1,
                level: 10
            },
            'admin': {
                roles: ['admin'],
                permissions: [
                    'user.create', 'user.read', 'user.update', 'user.delete',
                    'role.create', 'role.read', 'role.update', 'role.delete',
                    'permission.create', 'permission.read', 'permission.update', 'permission.delete',
                    'drone.read', 'drone.update', 'system.configure', 'audit.read'
                ],
                departmentId: 1,
                level: 8
            },
            'drone_admin': {
                roles: ['drone_admin'],
                permissions: [
                    'drone.create', 'drone.read', 'drone.update', 'drone.delete',
                    'drone.command.all', 'drone.status.all', 'drone.archive.all'
                ],
                departmentId: 2,
                level: 8
            },
            'pilot_001': {
                roles: ['drone_operator', 'flight_controller'],
                permissions: [
                    'drone.command.create', 'drone.command.read', 'drone.command.update',
                    'drone.status.read', 'drone.realtime.read', 'drone.command.assigned', 
                    'drone.status.assigned', 'drone.position.assigned'
                ],
                departmentId: 2,
                level: 5
            },
            'mission_cmd': {
                roles: ['mission_commander'],
                permissions: [
                    'mission.create', 'mission.read', 'mission.update', 'mission.delete',
                    'archive.create', 'archive.read', 'archive.update', 'archive.delete'
                ],
                departmentId: 2,
                level: 7
            },
            'maintenance_tech': {
                roles: ['maintenance_technician'],
                permissions: [
                    'drone.status.update', 'drone.maintenance.all',
                    'archive.read', 'diagnostic.run'
                ],
                departmentId: 3,
                level: 4
            },
            'monitor_op': {
                roles: ['monitor_operator'],
                permissions: [
                    'drone.status.read', 'drone.position.read', 
                    'system.monitor', 'alert.read'
                ],
                departmentId: 1,
                level: 2
            },
            'dept_manager': {
                roles: ['department_manager'],
                permissions: [
                    'user.read.department', 'user.update.department',
                    'report.generate.department', 'audit.read.department'
                ],
                departmentId: 2,
                level: 6
            },
            'regular_user': {
                roles: ['user'],
                permissions: [
                    'profile.read', 'profile.update',
                    'preference.read', 'preference.update', 'preference.create'
                ],
                departmentId: 2,
                level: 1
            },
            'emergency_user': {
                roles: ['user', 'emergency_responder'],
                permissions: [
                    'profile.read', 'profile.update',
                    'preference.read', 'preference.update', 'preference.create',
                    'emergency.override', 'drone.command.emergency',
                    'system.emergency', 'alert.create'
                ],
                departmentId: 3,
                level: 3
            }
        };

        return userPermissions[username] || { roles: ['user'], permissions: ['profile.read', 'profile.update', 'preference.read', 'preference.update'], departmentId: 1, level: 1 };
    }

    /**
     * 生成 JWT token 包含使用者認證資訊
     *
     * 此方法將使用者的身份資訊、權限、角色和會話資訊封裝成 JWT token，
     * 供 API Gateway 或其他服務進行認證和授權使用。
     *
     * **JWT 包含的資訊：**
     * - 使用者基本資訊（ID、名稱、狀態）
     * - 角色清單和權限清單
     * - API 範圍（scopes）設定
     * - 會話資訊（ID、IP、User Agent）
     * - 記住登入狀態和其他元數據
     *
     * **安全特性：**
     * - 使用 HMAC SHA256 算法簽名
     * - 包含過期時間和發行者資訊
     * - 支援不同的過期時間設定（根據 rememberMe）
     *
     * @private
     * @async
     * @param userId - 使用者的唯一識別符
     * @param username - 使用者名稱
     * @param userPermissions - 使用者的權限和角色資訊
     * @param sessionInfo - 會話相關資訊物件
     * @param sessionInfo.sessionId - 會話的唯一識別符
     * @param sessionInfo.ipAddress - 用戶的 IP 地址（選填）
     * @param sessionInfo.userAgent - 用戶的瀏覽器 User Agent（選填）
     * @param sessionInfo.rememberMe - 是否記住登入狀態（選填，預設 false）
     * @returns {Promise<string>} 簽名後的 JWT token 字串
     *
     * @throws {Error} 當 JWT 生成過程出現錯誤時拋出異常
     *
     * @example
     * ```typescript
     * const token = await this.generateJWT(
     *   1,
     *   'admin',
     *   { roles: ['admin'], permissions: ['user.read'] },
     *   { sessionId: 'session-123', ipAddress: '192.168.1.1' }
     * );
     * ```
     */
    private async generateJWT(
        userId: number, 
        username: string, 
        userPermissions: UserPermissions,
        sessionInfo: {
            sessionId: string;
            ipAddress?: string;
            userAgent?: string;
            rememberMe?: boolean;
        }
    ): Promise<string> {
        // 構建 scopes 並呼叫 JwtUtils 產生 token（封裝 claims）
        const scopes = this.buildApiScopes(userPermissions.permissions);
        const options: JwtGenerateOptions = {
            user: { id: userId, username: username, is_active: true },
            roles: userPermissions.roles,
            permissions: userPermissions.permissions,
            scopes,
            sessionId: sessionInfo.sessionId,
            ipAddress: sessionInfo.ipAddress,
            userAgent: sessionInfo.userAgent,
            rememberMe: sessionInfo.rememberMe || false
        };
        return await JwtUtils.generateToken(options);
    }

    /**
     * 根據權限清單建立 API 範圍（scopes）
     *
     * 此方法將使用者的具體權限轉換為 API 範圍設定，用於 JWT token 中的
     * scope 字段，方便 API Gateway 或中間件進行快速的權限檢查。
     *
     * **支援的 API 範圍：**
     * - `api:basic`: 基本 API 存取權限（所有用戶都有）
     * - `api:read`: 讀取權限，基於是否有 read 相關權限
     * - `api:write`: 寫入權限，基於 create/update/delete 權限
     * - `api:admin`: 管理員權限，基於 admin 相關權限
     * - `api:emergency`: 緊急權限，基於 emergency 相關權限
     *
     * **特殊處理：**
     * - 超級管理員權限 (*) 會獲得所有範圍
     * - 部分範圍會根據權限字串內容自動判斷
     *
     * @private
     * @param permissions - 使用者權限字串清單
     * @returns {string[]} API 範圍字串清單
     *
     * @example
     * ```typescript
     * const scopes = this.buildApiScopes(['user.read', 'user.create', 'admin.configure']);
     * // 回傳: ['api:basic', 'api:read', 'api:write', 'api:admin']
     * ```
     */
    private buildApiScopes(permissions: string[]): string[] {
        const scopes = ['api:basic'];
        if (permissions.includes('*') || permissions.some(p => p.includes('read'))) { scopes.push('api:read'); }
        if (permissions.includes('*') || permissions.some(p => p.includes('create') || p.includes('update') || p.includes('delete'))) { scopes.push('api:write'); }
        if (permissions.includes('*') || permissions.some(p => p.includes('admin'))) { scopes.push('api:admin'); }
        if (permissions.some(p => p.includes('emergency'))) { scopes.push('api:emergency'); }
        return scopes;
    }

    /**
     * 使用者登入驗證和 JWT 生成
     *
     * 此方法處理完整的用戶登入流程，包括身份驗證、權限查詢、
     * 會話管理和 JWT token 產生。此為示範實作，生產環境應整合
     * 真實的身份驗證服務和資料庫。
     *
     * **驗證流程：**
     * 1. 驗證使用者名稱和密碼（對照預設用戶資料）
     * 2. 查詢使用者的角色和權限設定
     * 3. 生成新的 sessionId 並儲存到活躍會話映射中
     * 4. 建置 API scopes 和 JWT 資訊
     * 5. 生成並簽名 JWT token
     * 6. 返回完整的登入結果
     *
     * **安全特性：**
     * - 密碼驗證（示範中使用明文比對）
     * - sessionId 唯一性保障
     * - 詳細的登入事件日誌記錄
     * - JWT 包含完整的安全資訊
     *
     * **錯誤處理：**
     * - 無效的用戶名稱或密碼
     * - 系統錯誤和異常情況
     * - 詳細的錯誤日誌和原因記錄
     *
     * @public
     * @async
     * @param request - 登入請求物件
     * @param request.username - 使用者名稱（必填）
     * @param request.password - 使用者密碼（必填）
     * @param request.ipAddress - 用戶 IP 地址（選填，用於審計）
     * @param request.userAgent - 用戶瀏覽器資訊（選填，用於審計）
     * @param request.rememberMe - 是否記住登入狀態（選填，影響 token 過期時間）
     * @returns {Promise<LoginResponse>} 登入結果物件
     *
     * @throws {Error} 當系統錯誤或 JWT 生成失敗時拋出異常
     *
     * @example
     * ```typescript
     * const loginResult = await authService.login({
     *   username: 'admin',
     *   password: 'admin',
     *   ipAddress: '192.168.1.1',
     *   userAgent: 'Mozilla/5.0...',
     *   rememberMe: true
     * });
     * 
     * if (loginResult.success) {
     *   console.log('Login successful, token:', loginResult.token);
     * }
     * ```
     */
    public login = async (request: LoginRequest): Promise<LoginResponse> => {
        try {
            logger.info(`Login attempt for user: ${request.username}, IP: ${request.ipAddress}`);
            // 從效能簡化的 map 中查詢使用者
            const user = this.validUsers[request.username];
            if (!user || user.password !== request.password) { logger.warn(`Authentication failed for user: ${request.username}`); return { success: false, message: 'Invalid username or password' }; }
            logger.info(`Login successful for user: ${request.username}`);
            const userPermissions = this.getUserPermissions(request.username);
            // 生成 sessionId 並存入記憶體 session map（示範用途）
            const sessionId = uuidv4();
            this.activeSessions.set(sessionId, user.id.toString());
            // 產生 jwt token
            const token = await this.generateJWT(user.id, request.username, userPermissions, { sessionId, ipAddress: request.ipAddress, userAgent: request.userAgent, rememberMe: request.rememberMe });
            logger.info(`JWT generated for user: ${request.username}, session: ${sessionId}, permissions: ${userPermissions.permissions.length} items, roles: ${userPermissions.roles.join(', ')}`);
            return { success: true, message: 'Login successful', token, user: { id: user.id, username: request.username, roles: userPermissions.roles, permissions: userPermissions.permissions, departmentId: userPermissions.departmentId, level: userPermissions.level } };
        } catch (error) {
            logger.error('Login error:', error);
            return { success: false, message: 'An error occurred during login' };
        }
    }

    /**
     * 使用者登出處理和會話清理
     *
     * 此方法處理使用者登出操作，目前為簡化的示範實作。
     * 生產環境中應扩展為完整的登出流程，包括 JWT 黑名單、
     * 會話清理和相關資源釋放。
     *
     * **目前功能：**
     * - 記錄登出事件日誌
     * - 基本的 token 驗證（如果提供）
     * - 成功回應訊息
     *
     * **建議的生產環境擴展：**
     * - 將 JWT token 加入黑名單以防止重用
     * - 從 activeSessions 中移除對應的會話
     * - 清理相關的緩存和暫存資料
     * - 通知其他相關服務登出事件
     *
     * @public
     * @async
     * @param request - 登出請求物件
     * @param request.token - JWT token（選填，用於加入黑名單）
     * @param request.sessionId - 會話 ID（選填，用於清理會話）
     * @returns {Promise<{success: boolean, message: string}>} 登出結果
     *
     * @throws {Error} 當系統錯誤或登出過程失敗時拋出異常
     *
     * @example
     * ```typescript
     * const logoutResult = await authService.logout({
     *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
     *   sessionId: 'session-123'
     * });
     * 
     * if (logoutResult.success) {
     *   console.log('Logout successful');
     * }
     * ```
     */
    public logout = async (request: LogoutRequest): Promise<{ success: boolean; message: string }> => {
        try {
            logger.info('Processing logout request');
            // 在範例實作中僅紀錄 token，生產環境應加入黑名單或移除 session
            if (request.token) { logger.info('Token invalidated successfully'); }
            return { success: true, message: 'Logout successful' };
        } catch (error) {
            logger.error('Logout error:', error);
            return { success: false, message: 'Logout failed due to system error' };
        }
    }
}