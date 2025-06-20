// 設備類型，限制可用類型
export type DeviceType = 'sensor' | 'controller' | 'actuator';
// 設備狀態，限制可用狀態
export type DeviceStatus = 'online' | 'offline' | 'error';

export interface Device {
    /**
     * 設備的唯一識別碼（通常為 UUID 或資料庫自動產生的 ID）
     */
    id: string;
    /**
     * 設備名稱，方便辨識用途或位置
     */
    name: string;
    /**
     * 設備類型，例如感測器（sensor）、控制器（controller）、執行器（actuator）
     */
    type: DeviceType;
    /**
     * 設備目前狀態：'online'（上線）、'offline'（離線）、'error'（異常）
     */
    status: DeviceStatus;
    /**
     * 設備所在位置（可選），例如「會議室A」
     */
    location?: string;
    /**
     * 其他額外資訊，以 key-value 形式儲存（可選）
     */
    metadata?: Record<string, any>;
    /**
     * 設備最後一次上線時間（可選）
     */
    lastSeen?: Date;
}
