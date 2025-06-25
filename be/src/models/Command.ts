// 指令類型，限制可用指令名稱
export type CommandType = 'turn_on' | 'turn_off' | 'set_param';

/**
 * turn_on 指令參數構造（無參數）
 */
export interface TurnOnCommand {
    type: 'turn_on';
    parameters?: Record<string, never>;
}

/**
 * set_param 指令參數構造
 */
export interface SetParamCommand {
    type: 'set_param';
    parameters: { key: string; value: number | string };
}

export type CommandParameters = TurnOnCommand | SetParamCommand;

export interface Command {
    /**
     * 指令的唯一識別碼（通常為 UUID 或資料庫自動產生的 ID）
     */
    id: string;
    /**
     * 目標設備的 ID，指令將發送給此設備
     */
    deviceId: string;
    /**
     * 指令類型，例如 'turn_on'（開啟）、'set_param'（設定參數）等
     */
    commandType: CommandType;
    /**
     * 指令所需的參數（依指令類型而異）
     */
    parameters?: CommandParameters['parameters'];
    /**
     * 指令狀態：'pending'（待處理）、'sent'（已送出）、'acknowledged'（已確認）、'failed'（失敗）
     */
    status: 'pending' | 'sent' | 'acknowledged' | 'failed';
    /**
     * 指令下達的時間
     */
    issuedAt: Date;
    /**
     * 指令實際執行完成的時間（可選）
     */
    executedAt?: Date;
    /**
     * 指令優先級（可選），例如 low/normal/high
     */
    priority?: 'low' | 'normal' | 'high';
    /**
     * 指令超時時間（可選，單位：毫秒）
     */
    timeout?: number;
}
