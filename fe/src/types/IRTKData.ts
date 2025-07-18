/**
 * @fileoverview RTK（Real-Time Kinematic）數據類型定義
 * 
 * 此檔案定義了即時動態定位系統（RTK）數據的介面結構，
 * 用於表示高精度GPS定位數據，包含座標、高度和時間戳記等資訊。
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-01-01
 */

/**
 * RTK 定位數據介面
 * 
 * 定義了即時動態定位系統返回的數據結構，包含完整的空間座標資訊。
 * RTK 技術能提供公分級別的定位精度，廣泛應用於測量、導航和精準農業等領域。
 * 
 * @interface RTKData
 * @example
 * ```typescript
 * const rtkData: RTKData = {
 *   id: 1,
 *   longitude: 121.5654,
 *   latitude: 25.0330,
 *   altitude: 100.5,
 *   timestamp: '2025-01-01T12:00:00Z'
 * };
 * ```
 */
export interface RTKData {
    /** 
     * 數據記錄的唯一識別符
     * 用於區分不同的RTK定位記錄，通常為自增數字
     */
    id: number;
    
    /** 
     * 經度座標（十進制度數）
     * 表示東西方向的地理座標，範圍通常在-180到180度之間
     */
    longitude: number;
    
    /** 
     * 緯度座標（十進制度數）
     * 表示南北方向的地理座標，範圍通常在-90到90度之間
     */
    latitude: number;
    
    /** 
     * 海拔高度（公尺）
     * 表示相對於海平面的高度，正值表示高於海平面
     */
    altitude: number;
    
    /** 
     * 時間戳記（ISO 8601格式）
     * 記錄RTK定位數據的產生時間，格式為ISO 8601標準時間字串
     */
    timestamp: string;
}