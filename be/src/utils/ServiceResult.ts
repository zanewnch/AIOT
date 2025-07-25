/**
 * @fileoverview 服務結果類別
 * 
 * 為所有服務層方法提供統一的回應結構，確保一致性並減少錯誤。
 * 提供靜態工廠方法來快速創建常見的服務層回應類型。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-07-25
 */

/**
 * 服務結果類別
 * 
 * @class ServiceResult
 * @description 為所有服務層方法提供統一的回應結構
 * 包含操作成功狀態和結果訊息，可被其他具體結果類別繼承
 * 
 * @template T - 資料的類型，預設為 any
 */
export class ServiceResult<T = any> {
    /** 操作是否成功 */
    public success: boolean;
    /** 操作結果訊息 */
    public message: string;
    /** 操作結果資料 */
    public data?: T;

    /**
     * 建構函式
     * 
     * @param success 操作是否成功
     * @param message 操作結果訊息
     * @param data 操作結果資料（可選）
     */
    constructor(success: boolean, message: string, data?: T) {
        this.success = success;
        this.message = message;
        this.data = data;
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
     * @param message 失敗訊息
     * @returns ServiceResult 實例
     */
    static failure(message: string): ServiceResult {
        return new ServiceResult(false, message);
    }

    /**
     * 創建失敗結果（帶資料）
     * 
     * @template T
     * @param message 失敗訊息
     * @param data 失敗相關資料（可選）
     * @returns ServiceResult 實例
     */
    static failureWithData<T = any>(message: string, data?: T): ServiceResult<T> {
        return new ServiceResult(false, message, data);
    }

    /**
     * 檢查結果是否成功
     * 
     * @returns 是否成功
     */
    isSuccess(): boolean {
        return this.success;
    }

    /**
     * 檢查結果是否失敗
     * 
     * @returns 是否失敗
     */
    isFailure(): boolean {
        return !this.success;
    }

    /**
     * 轉換為 JSON 物件
     * 
     * @returns 包含 success, message 和 data 的物件
     */
    toJSON(): { success: boolean; message: string; data?: T } {
        const result: { success: boolean; message: string; data?: T } = {
            success: this.success,
            message: this.message
        };

        if (this.data !== undefined) {
            result.data = this.data;
        }

        return result;
    }
}