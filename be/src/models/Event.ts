// 事件類型，限制可用事件名稱
export type EventType = 'device_offline' | 'threshold_exceeded';

/**
 * 設備離線事件資料結構
 */
export interface DeviceOfflineEvent {
    type: 'device_offline';
    data?: { lastSeen: Date };
}

/**
 * 閾值超標事件資料結構
 */
export interface ThresholdExceededEvent {
    type: 'threshold_exceeded';
    data: { metric: string; value: number; threshold: number };
}

export type EventData = DeviceOfflineEvent | ThresholdExceededEvent;

export interface Event {
    /**
     * 事件的唯一識別碼（通常為 UUID 或資料庫自動產生的 ID）
     */
    id: string;
    /**
     * 觸發事件的設備 ID（可選，部分事件可能與設備無關）
     */
    deviceId?: string;
    /**
     * 事件類型，例如 'device_offline'（設備離線）、'threshold_exceeded'（超過閾值）等
     */
    eventType: EventType;
    /**
     * 事件的詳細描述訊息，方便記錄與顯示
     */
    message: string;
    /**
     * 事件發生的時間戳記
     */
    timestamp: Date;
    /**
     * 事件相關的其他資料（依事件類型而異，可選）
     */
    data?: EventData['data'];
    /**
     * 事件嚴重程度（可選），例如 info/warning/critical
     */
    severity?: 'info' | 'warning' | 'critical';
    /**
     * 事件關聯 ID（可選），用於關聯相關事件
     */
    correlationId?: string;
}
