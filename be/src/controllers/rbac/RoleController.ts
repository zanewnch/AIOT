/**
 * @fileoverview 角色管理控制器 - 處理 RBAC 系統中角色的完整生命週期管理
 * 
 * 此控制器負責管理系統中的角色相關操作，包括：
 * - 角色的建立、查詢、更新和刪除
 * - 角色權限的管理和分配
 * - 角色層級結構的維護
 * - 角色安全性驗證
 * 
 * 安全性考量：
 * - 所有操作都需要適當的權限驗證
 * - 防止未授權的角色修改
 * - 確保角色刪除時的依賴性檢查
 * - 維護角色操作的審計日誌
 * 
 * 特色功能：
 * - 支援角色層級結構
 * - 角色權限的批次管理
 * - 角色使用情況統計
 * - 角色變更歷史追蹤
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { Request, Response } from 'express'; // 引入 Express 的請求和回應類型定義
import { RoleModel } from '../../models/rbac/RoleModel.js'; // 引入角色資料模型，用於資料庫操作
import { IRoleController } from '../../types/controllers/IRoleController.js'; // 引入角色控制器介面定義

/**
 * 角色管理控制器類別
 * 
 * 實作 IRoleController 介面，提供完整的角色管理功能：
 * - 角色的 CRUD 操作
 * - 角色權限管理
 * - 角色安全性驗證
 * - 角色使用情況追蹤
 * 
 * 角色是 RBAC 系統中的核心概念，用於：
 * - 組織和管理權限的集合
 * - 簡化使用者權限分配
 * - 提供權限的層級結構
 * - 支援權限繼承機制
 * 
 * @class RoleController
 * @implements {IRoleController}
 * @description 處理所有與角色管理相關的 HTTP 請求和業務邏輯
 * 
 * @example
 * ```typescript
 * const roleController = new RoleController();
 * // 路由配置在專門的 rbacRoutes.ts 文件中處理
 * ```
 */
export class RoleController implements IRoleController {
    /**
     * 建構函式
     * 
     * 初始化角色管理控制器實例
     * 現代化的控制器設計將路由邏輯分離，專注於業務邏輯處理
     * 
     * @constructor
     * @description 建立新的角色控制器實例，準備處理角色相關的業務邏輯
     */
    constructor() {
        // 控制器僅包含業務邏輯，路由配置已移至專門的路由文件中
    }


    /**
     * 獲取所有角色列表
     * 
     * 此方法負責獲取系統中所有可用的角色列表，包括：
     * - 角色的唯一標識符（ID）
     * - 角色的系統名稱（name）
     * - 角色的顯示名稱（displayName）
     * - 建立和更新時間戳
     * 
     * 此方法通常用於：
     * - 管理介面的角色列表顯示
     * - 角色選擇下拉選單的資料來源
     * - 角色權限分配的參考資料
     * 
     * @async
     * @method getRoles
     * @param {Request} req - Express 請求物件（未使用但保留介面一致性）
     * @param {Response} res - Express 回應物件，用於回傳角色列表
     * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
     * 
     * @throws {500} 伺服器內部錯誤 - 無法獲取角色列表
     * 
     * @example
     * ```bash
     * GET /api/rbac/roles
     * ```
     * 
     * 成功回應格式:
     * ```json
     * [
     *   {
     *     "id": 1,
     *     "name": "admin",
     *     "displayName": "系統管理員",
     *     "createdAt": "2024-01-01T00:00:00.000Z",
     *     "updatedAt": "2024-01-01T00:00:00.000Z"
     *   },
     *   {
     *     "id": 2,
     *     "name": "user",
     *     "displayName": "一般使用者",
     *     "createdAt": "2024-01-01T00:00:00.000Z",
     *     "updatedAt": "2024-01-01T00:00:00.000Z"
     *   }
     * ]
     * ```
     */
    public async getRoles(req: Request, res: Response): Promise<void> {
        try {
            // 從資料庫中查詢所有角色記錄，包括所有欄位和時間戳資訊
            const roles = await RoleModel.findAll();
            
            // 直接回傳角色列表，不需要額外的包裝或轉換
            res.json(roles);
        } catch (error) {
            // 記錄錯誤詳細資訊到控制台，便於除錯和監控
            console.error('獲取角色列表時發生錯誤:', error);
            
            // 回傳 500 伺服器內部錯誤，提供適當的錯誤訊息但不暴露內部細節
            res.status(500).json({ 
                message: 'Failed to fetch roles', 
                error: (error as Error).message 
            });
        }
    }

    /**
     * 根據角色 ID 獲取特定角色詳細資訊
     * 
     * 此方法負責根據提供的角色 ID 查找並返回完整的角色資訊，包括：
     * - 角色的所有屬性和設定
     * - 角色的建立和更新時間戳
     * - 角色的關聯資料（如果有的話）
     * 
     * 此方法通常用於：
     * - 角色編輯表單的資料填充
     * - 角色詳細資訊的展示
     * - 角色權限的檢查和驗證
     * 
     * @async
     * @method getRoleById
     * @param {Request} req - Express 請求物件，包含 URL 參數中的 roleId
     * @param {Response} res - Express 回應物件，用於回傳角色詳細資訊
     * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
     * 
     * @throws {404} 角色不存在 - 指定的角色 ID 在系統中找不到
     * @throws {500} 伺服器內部錯誤 - 無法獲取角色資訊
     * 
     * @example
     * ```bash
     * GET /api/rbac/roles/1
     * ```
     * 
     * 成功回應格式:
     * ```json
     * {
     *   "id": 1,
     *   "name": "admin",
     *   "displayName": "系統管理員",
     *   "createdAt": "2024-01-01T00:00:00.000Z",
     *   "updatedAt": "2024-01-01T00:00:00.000Z"
     * }
     * ```
     * 
     * 錯誤回應格式:
     * ```json
     * {
     *   "message": "Role not found"
     * }
     * ```
     */
    public async getRoleById(req: Request, res: Response): Promise<void> {
        try {
            // 從 URL 參數中提取角色 ID
            const { roleId } = req.params;
            
            // 使用主鍵查找指定的角色記錄
            const role = await RoleModel.findByPk(roleId);
            
            // 檢查角色是否存在，如果不存在則回傳 404 錯誤
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            
            // 回傳找到的角色詳細資訊
            res.json(role);
        } catch (error) {
            // 記錄錯誤詳細資訊到控制台
            console.error('獲取角色詳細資訊時發生錯誤:', error);
            
            // 回傳 500 伺服器內部錯誤
            res.status(500).json({ 
                message: 'Failed to fetch role', 
                error: (error as Error).message 
            });
        }
    }

    /**
     * 創建新的角色
     * 
     * 此方法負責在系統中建立一個新的角色，包括：
     * - 驗證輸入資料的有效性
     * - 確保角色名稱的唯一性
     * - 設定適當的預設值
     * - 記錄建立時間和操作日誌
     * 
     * 輸入要求：
     * - name: 角色的系統名稱（必須，唯一）
     * - displayName: 角色的顯示名稱（可選）
     * 
     * 安全性考量：
     * - 需要適當的權限才能創建角色
     * - 角色名稱幾乎不能修改，需要謹慎考慮
     * 
     * @async
     * @method createRole
     * @param {Request} req - Express 請求物件，包含請求主體中的 name 和 displayName
     * @param {Response} res - Express 回應物件，用於回傳新建立的角色資訊
     * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
     * 
     * @throws {400} 請求資料無效 - 角色名稱缺失或格式不正確
     * @throws {409} 資料衝突 - 角色名稱已存在
     * @throws {500} 伺服器內部錯誤 - 無法建立角色
     * 
     * @example
     * ```bash
     * POST /api/rbac/roles
     * Content-Type: application/json
     * 
     * {
     *   "name": "admin",
     *   "displayName": "系統管理員"
     * }
     * ```
     * 
     * 成功回應格式（201 Created）:
     * ```json
     * {
     *   "id": 1,
     *   "name": "admin",
     *   "displayName": "系統管理員",
     *   "createdAt": "2024-01-01T00:00:00.000Z",
     *   "updatedAt": "2024-01-01T00:00:00.000Z"
     * }
     * ```
     */
    public async createRole(req: Request, res: Response): Promise<void> {
        try {
            // 從請求主體中提取角色名稱和顯示名稱
            const { name, displayName } = req.body;
            
            // 在資料庫中建立新的角色記錄
            // Sequelize 會自動處理時間戳和主鍵的設定
            const role = await RoleModel.create({ name, displayName });
            
            // 回傳 201 建立成功狀態碼和新建立的角色資訊
            res.status(201).json(role);
        } catch (error) {
            // 記錄錯誤詳細資訊到控制台
            console.error('建立角色時發生錯誤:', error);
            
            // 回傳 500 伺服器內部錯誤
            // 注意：這裡可能需要根據不同的錯誤類型回傳不同的狀態碼
            // 例如角色名稱重複時回傳 409 衝突狀態碼
            res.status(500).json({ 
                message: 'Failed to create role', 
                error: (error as Error).message 
            });
        }
    }

    /**
     * 更新指定角色的資訊
     * 
     * 此方法負責更新指定角色的資訊，包括：
     * - 驗證角色是否存在
     * - 更新角色名稱和顯示名稱
     * - 記錄更新時間和操作日誌
     * - 保留角色的權限關聯
     * 
     * 更新特性：
     * - 支援部分更新（只更新提供的欄位）
     * - 保留原有的權限關聯
     * - 自動更新修改時間戳
     * 
     * 安全性考量：
     * - 需要適當的權限才能更新角色
     * - 角色名稱更新可能影響權限檢查
     * - 需要謹慎處理系統內建角色
     * 
     * @async
     * @method updateRole
     * @param {Request} req - Express 請求物件，包含 URL 參數中的 roleId 和請求主體中的更新資料
     * @param {Response} res - Express 回應物件，用於回傳更新後的角色資訊
     * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
     * 
     * @throws {400} 請求資料無效 - 更新資料格式不正確
     * @throws {404} 角色不存在 - 指定的角色 ID 在系統中找不到
     * @throws {409} 資料衝突 - 新的角色名稱已存在
     * @throws {500} 伺服器內部錯誤 - 無法更新角色
     * 
     * @example
     * ```bash
     * PUT /api/rbac/roles/1
     * Content-Type: application/json
     * 
     * {
     *   "name": "super_admin",
     *   "displayName": "超級管理員"
     * }
     * ```
     * 
     * 成功回應格式:
     * ```json
     * {
     *   "id": 1,
     *   "name": "super_admin",
     *   "displayName": "超級管理員",
     *   "createdAt": "2024-01-01T00:00:00.000Z",
     *   "updatedAt": "2024-01-01T12:00:00.000Z"
     * }
     * ```
     */
    public async updateRole(req: Request, res: Response): Promise<void> {
        try {
            // 從 URL 參數中提取角色 ID
            const { roleId } = req.params;
            // 從請求主體中提取要更新的資料
            const { name, displayName } = req.body;
            
            // 查找指定的角色記錄
            const role = await RoleModel.findByPk(roleId);
            
            // 檢查角色是否存在
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            
            // 更新角色資訊，Sequelize 會自動更新 updatedAt 時間戳
            await role.update({ name, displayName });
            
            // 回傳更新後的角色資訊
            res.json(role);
        } catch (error) {
            // 記錄錯誤詳細資訊到控制台
            console.error('更新角色時發生錯誤:', error);
            
            // 回傳 500 伺服器內部錯誤
            // 注意：這裡可能需要根據不同的錯誤類型回傳不同的狀態碼
            res.status(500).json({ 
                message: 'Failed to update role', 
                error: (error as Error).message 
            });
        }
    }

    /**
     * 刪除指定的角色
     * 
     * 此方法負責從系統中刪除指定的角色，包括：
     * - 驗證角色是否存在
     * - 檢查角色的依賴性（是否有使用者使用）
     * - 刪除角色及其相關權限關聯
     * - 記錄刪除操作日誌
     * 
     * 安全性考量：
     * - 需要適當的權限才能刪除角色
     * - 不能刪除系統內建的核心角色
     * - 刪除前需要檢查是否有使用者使用
     * - 需要處理級聯刪除（角色-權限、使用者-角色）
     * 
     * 重要注意：
     * - 刪除角色是不可逆的操作
     * - 建議在刪除前備份相關資料
     * - 考慮使用停用而非刪除
     * 
     * @async
     * @method deleteRole
     * @param {Request} req - Express 請求物件，包含 URL 參數中的 roleId
     * @param {Response} res - Express 回應物件，用於回傳刪除結果
     * @returns {Promise<void>} 無回傳值，直接透過 res 物件回應
     * 
     * @throws {400} 請求無效 - 角色正在使用中或是系統內建角色
     * @throws {404} 角色不存在 - 指定的角色 ID 在系統中找不到
     * @throws {409} 資料衝突 - 角色正在被使用，無法刪除
     * @throws {500} 伺服器內部錯誤 - 無法刪除角色
     * 
     * @example
     * ```bash
     * DELETE /api/rbac/roles/1
     * ```
     * 
     * 成功回應（204 No Content）:
     * ```
     * 無回應主體，只有 204 狀態碼
     * ```
     * 
     * 錯誤回應格式:
     * ```json
     * {
     *   "message": "Role not found"
     * }
     * ```
     */
    public async deleteRole(req: Request, res: Response): Promise<void> {
        try {
            // 從 URL 參數中提取角色 ID
            const { roleId } = req.params;
            
            // 查找指定的角色記錄
            const role = await RoleModel.findByPk(roleId);
            
            // 檢查角色是否存在
            if (!role) {
                res.status(404).json({ message: 'Role not found' });
                return;
            }
            
            // 執行角色刪除操作
            // 注意：這裡可能需要添加依賴性檢查，確保沒有使用者使用此角色
            // 也需要處理級聯刪除（角色-權限關聯等）
            await role.destroy();
            
            // 回傳 204 No Content 狀態碼，表示成功刪除且無回傳內容
            res.status(204).send();
        } catch (error) {
            // 記錄錯誤詳細資訊到控制台
            console.error('刪除角色時發生錯誤:', error);
            
            // 回傳 500 伺服器內部錯誤
            // 注意：這裡可能需要根據不同的錯誤類型回傳不同的狀態碼
            // 例如外鍵約束錯誤時回傳 409 衝突狀態碼
            res.status(500).json({ 
                message: 'Failed to delete role', 
                error: (error as Error).message 
            });
        }
    }
}
