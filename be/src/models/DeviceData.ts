// 泛型型別，根據設備類型定義資料結構
export interface DeviceData<T = Record<string, any>> {
    /**
     * 資料的唯一識別碼（通常為 UUID 或資料庫自動產生的 ID）
     */
    id: string;
    /**
     * 產生此筆資料的設備 ID
     */
    deviceId: string;
    /**
     * 資料產生的時間戳記
     */
    timestamp: Date;
    /**
     * 設備回傳的感測數據內容，以 key-value 形式儲存，例如 { temperature: 25, humidity: 60 }
     */
    data: T;
    /**
     * 數據來源（可選），例如 hardware、simulated
     */
    source?: 'hardware' | 'simulated';
}
