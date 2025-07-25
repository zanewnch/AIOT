/**
 * @fileoverview 控制器結果類別
 *
 * 為所有控制器方法提供統一的 HTTP 回應結構，確保 API 回應的一致性。
 * 提供靜態工廠方法來快速創建常見的回應類型。
 * 靜態工廠方法（Static Factory Method）是一種設計模式，指在類中定義靜態方法來創建和返回該類的實例，而非直接使用構造函數。
 * 這種方法通常用於：
 * 1. 提供更有意義的名稱：方法名稱可以清楚表達創建意圖，如 from() 或 valueOf()，比構造函數更直觀。
 * 2. 控制實例創建：可以返回單例、緩存實例，或根據參數返回不同子類實例。
 * 3. 靈活性：允許返回類型為接口或抽象類，隱藏實現細節。
 * 4. 簡化創建過程：可以封裝複雜的初始化邏輯。
 *
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-07-25
 */

/**
 * 控制器結果類別
 *
 * @class ControllerResult
 * @description 為所有控制器層方法提供統一的 HTTP 回應結構
 * 包含 HTTP 狀態碼、訊息和資料，用於標準化 API 回應格式
 *
 * @template T - 資料的類型，預設為 any
 */
export class ControllerResult<T = any> {
    /** HTTP 狀態碼 */
    public status: number;
    /** 回應訊息 */
    public message: string;
    /** 回應資料 */
    public data?: T;

    /**
     * 建構函式
     *
     * @param status HTTP 狀態碼
     * @param message 回應訊息
     * @param data 回應資料（可選）
     */
    constructor(status: number, message: string, data?: T) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

    /**
     * 創建成功回應（200 OK）
     *
     * @template T
     * @param message 成功訊息
     * @param data 回應資料（可選）
     * @returns ControllerResult 實例
     */
    static success<T = any>(message: string, data?: T): ControllerResult<T> {
        return new ControllerResult(200, message, data);
    }

    /**
     * 創建創建成功回應（201 Created）
     *
     * @template T
     * @param message 創建成功訊息
     * @param data 創建的資料（可選）
     * @returns ControllerResult 實例
     */
    static created<T = any>(message: string, data?: T): ControllerResult<T> {
        return new ControllerResult(201, message, data);
    }

    /**
     * 創建錯誤請求回應（400 Bad Request）
     *
     * @param message 錯誤訊息
     * @returns ControllerResult 實例
     */
    static badRequest(message: string): ControllerResult {
        return new ControllerResult(400, message);
    }

    /**
     * 創建未授權回應（401 Unauthorized）
     *
     * @param message 未授權訊息，預設為 'Unauthorized'
     * @returns ControllerResult 實例
     */
    static unauthorized(message: string = 'Unauthorized'): ControllerResult {
        return new ControllerResult(401, message);
    }

    /**
     * 創建禁止存取回應（403 Forbidden）
     *
     * @param message 禁止存取訊息，預設為 'Forbidden'
     * @returns ControllerResult 實例
     */
    static forbidden(message: string = 'Forbidden'): ControllerResult {
        return new ControllerResult(403, message);
    }

    /**
     * 創建找不到資源回應（404 Not Found）
     *
     * @param message 找不到資源訊息，預設為 'Not Found'
     * @returns ControllerResult 實例
     */
    static notFound(message: string = 'Not Found'): ControllerResult {
        return new ControllerResult(404, message);
    }

    /**
     * 創建衝突回應（409 Conflict）
     *
     * @param message 衝突訊息
     * @returns ControllerResult 實例
     */
    static conflict(message: string): ControllerResult {
        return new ControllerResult(409, message);
    }

    /**
     * 創建伺服器錯誤回應（500 Internal Server Error）
     *
     * @param message 伺服器錯誤訊息，預設為 'Internal Server Error'
     * @returns ControllerResult 實例
     */
    static internalError(message: string = 'Internal Server Error'): ControllerResult {
        return new ControllerResult(500, message);
    }

    /**
     * 轉換為 JSON 物件
     *
     * @returns 包含 status, message 和 data 的物件
     */
    toJSON(): { status: number; message: string; data?: T } {
        const result: { status: number; message: string; data?: T } = {
            status: this.status,
            message: this.message
        };

        if (this.data !== undefined) {
            result.data = this.data;
        }

        return result;
    }
}