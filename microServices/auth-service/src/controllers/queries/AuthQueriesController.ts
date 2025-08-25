/**
 * @fileoverview AuthQueriesController 控制器 - 檔案層級意圖說明
 *
 * 目的：此控制器負責提供認證相關的只讀 HTTP 端點（CQRS 查詢端）。
 * - 從 API Gateway 或 Gateway header 取得最小化的使用者資訊
 * - 必要時委派 `AuthQueriesService` 取得資料庫中更完整的使用者資料
 * - 回傳統一的 `ResResult` 格式給前端或 Gateway
 *
 * 這些註解採用 TypeDoc 友好的語法（@remarks, @param, @returns），
 * 並在檔案內重要行加入逐行說明以利閱讀與文件化。
 */

import 'reflect-metadata'; // 引入 reflect-metadata 以支援裝飾器反射 (Inversify 依賴)
import {inject, injectable} from 'inversify'; // 引入 Inversify 的 DI 裝飾器
import {NextFunction, Request, Response} from 'express'; // 引入 Express 的型別定義
import {AuthQueriesService} from '../../services/queries/AuthQueriesService.js'; // 引入查詢服務介面/實作
import {createLogger, logRequest} from '../../configs/loggerConfig.js'; // 引入 logger 設定與請求記錄 helper
import {ResResult} from 'aiot-shared-packages'; // 引入標準回應封裝工具
import {TYPES} from '../../container/types.js'; // 引入 DI container 的型別 key

const logger = createLogger('AuthQueriesController'); // 建立 logger 實例，標記為 AuthQueriesController 模組

/**
 * 認證查詢控制器類別 - 封裝所有 read-only 的認證查詢 API 方法，使用 DI 注入查詢服務。
 *
 * @remarks
 * 這個類別只提供查詢 (read-only) 相關的 HTTP 端點，遵循 CQRS 的查詢端職責。
 * 控制器從 API Gateway 或 Gateway 的 headers 取得使用者資訊，並委派給注入的
 * `AuthQueriesService` 取得補充資料。此類別適合用於 TypeDoc 產生的 API 文件。
 *
 * @public
 */
@injectable()
export class AuthQueriesController {
    constructor(
        @inject(TYPES.AuthQueriesService) private readonly authQueriesService: AuthQueriesService // 注入 AuthQueriesService 以獲取資料與邏輯
    ) {
    } // 建構子: DI 注入完成後無其他動作

    /**
     * 獲取當前使用者資訊 - 使用 API Gateway Headers
     *
     * @remarks
     * 優先使用 `req.gatewayUser`，否則回落到 `req.user`。若需要會呼叫
     * `authQueriesService.getUserDetails` 以取得更多資料並合併回傳。
     *
     * @param req - Express 請求物件，應含有 `gatewayUser` 或 `user` 資訊
     * @param res - Express 回應物件
     * @param next - Express 下一個中介函式
     * @returns Promise<void>
     */
    public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try { // 錯誤處理區塊開始
            logRequest(req, 'Get current user info request', 'info'); // 記錄此請求的基本資訊

            // 從 API Gateway headers 獲取用戶信息（由 ApiGatewayHeadersMiddleware 或 JwtMiddleware 設置）
            const user: any = (req as any).gatewayUser || (req as any).user; // 優先使用 gatewayUser，否則回落到 req.user

            if (!user) { // 若沒有使用者資訊，則回傳未授權
                logger.warn(`User info request failed: No user info from API Gateway headers, IP: ${req.ip}`); // 紀錄警告
                const response = ResResult.unauthorized('User information not available'); // 組出未授權回應
                res.status(response.status).json(response.toJSON()); // 傳回 JSON 格式回應
                return; // 終止流程
            }

            // 記錄基本成功資訊（注意： user 來自 header，可能只包含少量欄位）
            logger.info(`User info request successful for user: ${user.username || 'unknown'}, ID: ${user.id || 'unknown'}`);

            // 嘗試從後端 service 取得更完整的使用者資料（容錯處理）
            let userDetails = {}; // 初始化用戶詳細資料容器
            try {
                // AuthQueriesService.getUserById 會回傳完整的 UserModel（或 null）
                userDetails = (await this.authQueriesService.getUserById(user.id)) || {};
            } catch (error) {
                // 若失敗，不阻斷主要回應；只記錄日誌以便追蹤
                logger.warn(`Failed to fetch user details from database for user ${user.id}:`, error);
            }

            // 合併 header 資訊與 service 提供的詳細資料後回傳
            const response = ResResult.success('User information retrieved successfully', {
                isAuthenticated: true,
                user: {
                    id: user.id,
                    username: user.username,
                    roles: user.roles,
                    // 若 permissions 未定義，確保不會出錯
                    permissions: Array.isArray(user.permissions) ? user.permissions.slice(0, 20) : [],
                    departmentId: user.departmentId,
                    level: user.level,
                    sessionId: user.sessionId,
                    ...userDetails,
                    authMethod: 'express-gateway',
                    authenticatedAt: new Date().toISOString()
                }
            });
            res.status(response.status).json(response.toJSON()); // 回傳結果給用戶端
        } catch (err) { // 捕捉整個方法內未預期的錯誤
            logger.error('Get user info error:', err); // 記錄錯誤細節
            next(err); // 傳遞錯誤給 Express 的錯誤中間件
        }
    };

    /**
     * 檢查當前使用者的認證狀態 (備用)
     *
     * @remarks
     * 用於快速檢查使用者是否已通過 Gateway 的認證，回傳基本使用者與會話資訊。
     *
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     * @param next - Express 下一個中介函式
     * @returns Promise<void>
     */
    public checkAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try { // 錯誤處理開始
            logRequest(req, 'Authentication check request', 'info'); // 記錄請求

            // 從 API Gateway headers 獲取用戶信息
            const user: any = (req as any).gatewayUser || (req as any).user; // 同樣優先 gatewayUser

            if (!user) { // 如果沒有使用者資訊
                logger.warn(`Authentication check failed: No user info from API Gateway headers, IP: ${req.ip}`); // 紀錄警告
                const response = ResResult.unauthorized('Authentication required'); // 回傳未授權
                res.status(response.status).json(response.toJSON()); // 傳回回應
                return; // 終止
            }

            logger.info(`Authentication check successful for user: ${user.username}, ID: ${user.id}`); // 記錄成功

            // 回傳認證狀態
            const response = ResResult.success('User authenticated', { // 組建回應
                isAuthenticated: true, // 已認證
                user: { // 使用者基本資訊
                    id: user.id, // ID
                    username: user.username, // 使用者名稱
                    roles: user.roles, // 角色陣列
                    departmentId: user.departmentId, // 部門 ID
                    level: user.level // 使用者等級
                },
                session: { // 會話相關資訊
                    sessionId: user.sessionId, // 會話 ID
                    ipAddress: user.ipAddress, // 用戶 IP
                    authMethod: 'gateway-opa' // 來源註記
                }
            });
            res.status(response.status).json(response.toJSON()); // 傳回 JSON 結果
        } catch (err) { // 捕捉錯誤
            logger.error('Authentication check error:', err); // 紀錄錯誤
            next(err); // 傳遞給下一個錯誤處理器
        }
    };

    /**
     * 獲取用戶權限列表
     *
     * @remarks
     * 回傳使用者的權限清單、角色與摘要資訊，適用於前端 UI 或 RBAC 決策使用。
     *
     * @param req - Express 請求物件
     * @param res - Express 回應物件
     * @param next - Express 下一個中介函式
     * @returns Promise<void>
     */
    public getPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try { // 錯誤處理開始
            logRequest(req, 'Get user permissions request', 'info'); // 記錄請求資訊

            const user: any = (req as any).gatewayUser || (req as any).user; // 取得使用者物件

            if (!user) { // 若無使用者資訊則回傳未授權
                const response = ResResult.unauthorized('Authentication required'); // 組建未授權回應
                res.status(response.status).json(response.toJSON()); // 傳回
                return; // 終止處理
            }

            logger.info(`Permissions request for user: ${user.username}, permissions count: ${user.permissions.length}`); // 記錄權限數

            // 回傳完整權限列表
            const response = ResResult.success('User permissions retrieved', { // 組建成功回應
                user: { // 回傳的使用者識別資訊
                    id: user.id, // ID
                    username: user.username // username
                },
                permissions: user.permissions, // 權限清單
                roles: user.roles, // 角色陣列
                permissionSummary: { // 權限摘要資訊
                    totalPermissions: user.permissions.length, // 權限總數
                    hasSuperPermission: user.permissions.includes('*'), // 是否有萬用權限
                    roles: user.roles, // 角色重複回傳以利前端顯示
                    level: user.level // 使用者等級
                }
            });
            res.status(response.status).json(response.toJSON()); // 傳回結果
        } catch (err) { // 捕捉錯誤
            logger.error('Get permissions error:', err); // 記錄錯誤
            next(err); // 傳遞
        }
    };
} // 類別結尾