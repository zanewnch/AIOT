/**
 * @fileoverview 服務層結果類別
 *
 * 為所有服務層方法提供統一的結果結構，確保服務層回應的一致性。
 * 用於服務層內部邏輯處理，與 ControllerResult 不同，不直接對應 HTTP 狀態碼。
 *
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-08-08
 */

/**
 * 服務結果類別
 *
 * @class ServiceResult
 * @description 為所有服務層方法提供統一的結果結構
 * 包含成功狀態、訊息和資料，用於標準化服務層內部回應格式
 *
 * @template T - 資料的類型，預設為 any
 *
 * @example
 * ```typescript
 * // 成功結果
 * return ServiceResult.success('資料獲取成功', userData);
 *
 * // 失敗結果
 * return ServiceResult.failure('找不到使用者');
 *
 * // 帶資料的失敗結果
 * return ServiceResult.failure('驗證失敗', validationErrors);
 * ```
 */
export class ServiceResult<T = any> {
    /** 是否成功 */
    public readonly success: boolean;
    /** 結果訊息 */
    public readonly message: string;
    /** 結果資料 */
    public readonly data?: T;
    /** 錯誤代碼（可選） */
    public readonly errorCode?: string;

    /**
     * 建構函式
     *
     * @param success 是否成功
     * @param message 結果訊息
     * @param data 結果資料（可選）
     * @param errorCode 錯誤代碼（可選）
     */
    constructor(success: boolean, message: string, data?: T, errorCode?: string) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
    }

    /**
     * 創建成功結果
     *
     * @template T
     * @param message 成功訊息
     * @param data 結果資料（可選）
     * @returns ServiceResult 實例
     */
    static success<T = any>(message: string, data?: T): ServiceResult<T> {
        return new ServiceResult(true, message, data);
    }

    /**
     * 創建失敗結果
     *
     * @template T
     * @param message 失敗訊息
     * @param data 錯誤資料（可選）
     * @param errorCode 錯誤代碼（可選）
     * @returns ServiceResult 實例
     */
    static failure<T = any>(message: string, data?: T, errorCode?: string): ServiceResult<T> {
        return new ServiceResult(false, message, data, errorCode);
    }

    /**
     * 檢查是否為成功結果
     */
    isSuccess(): boolean {
        return this.success;
    }

    /**
     * 檢查是否為失敗結果
     */
    isFailure(): boolean {
        return !this.success;
    }

    /**
     * 獲取資料，如果失敗則拋出錯誤
     */
    unwrap(): T {
        if (this.isFailure()) {
            throw new Error(`操作失敗: ${this.message}`);
        }
        return this.data as T;
    }

    /**
     * 獲取資料，如果失敗則返回預設值
     */
    unwrapOr(defaultValue: T): T {
        if (this.isFailure() || this.data === undefined) {
            return defaultValue;
        }
        return this.data;
    }

    /**
     * 轉換為物件
     */
    toObject(): { success: boolean; message: string; data?: T; errorCode?: string } {
        const result: { success: boolean; message: string; data?: T; errorCode?: string } = {
            success: this.success,
            message: this.message
        };

        if (this.data !== undefined) {
            result.data = this.data;
        }

        if (this.errorCode !== undefined) {
            result.errorCode = this.errorCode;
        }

        return result;
    }
}