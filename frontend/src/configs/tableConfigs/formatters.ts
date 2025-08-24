/**
 * @fileoverview 表格數據格式化函數
 * 
 * 統一的數據格式化函數庫，用於表格數據顯示格式化
 * 包含日期時間、數值、狀態、座標等各類數據格式化功能
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { FormatterMap } from './types';

/**
 * 通用格式化函數集合
 * 
 * **設計說明：**
 * 1. **統一性**：所有格式化函數都使用相同的函數簽名
 * 2. **防錯性**：每個函數都包含空值和異常處理
 * 3. **本地化**：支援繁體中文本地化顯示
 * 4. **可擴展性**：使用 Record 類型便於添加新的格式化函數
 * 5. **類型安全**：使用 TypeScript 確保類型安全
 */
export const formatters: FormatterMap = {
  /** 
   * 日期時間格式化
   * 將 ISO 字符串轉換為繁體中文本地化顯示
   */
  datetime: (value: string) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString('zh-TW');
    } catch {
      return value;
    }
  },

  /** 
   * 布林值格式化
   * true/false 轉換為 是/否
   */
  boolean: (value: boolean) => value ? '是' : '否',

  /** 
   * 狀態格式化
   * 適用於 isActive 等布林狀態欄位
   */
  status: (value: boolean) => value ? '啟用' : '停用',

  /** 
   * 數字格式化
   * 添加千分位分隔符
   */
  number: (value: number) => value?.toLocaleString() || '-',

  /** 
   * 座標格式化
   * GPS 座標保留 6 位小數
   */
  coordinate: (value: number) => typeof value === 'number' ? value.toFixed(6) : value,

  /** 
   * 高度格式化
   * 添加米單位，保留 2 位小數
   */
  altitude: (value: number) => typeof value === 'number' ? `${value.toFixed(2)}m` : value,

  /** 
   * 速度格式化
   * 添加 m/s 單位，保留 2 位小數
   */
  speed: (value: number) => typeof value === 'number' ? `${value.toFixed(2)}m/s` : value,

  /** 
   * 角度格式化
   * 航向角度添加度數符號，保留 1 位小數
   */
  heading: (value: number) => typeof value === 'number' ? `${value.toFixed(1)}°` : value,

  /** 
   * 電池電量格式化
   * 添加百分比符號
   */
  battery: (value: number) => typeof value === 'number' ? `${value}%` : value,

  /** 
   * 信號強度格式化
   * 添加 dBm 單位，四捨五入到整數
   */
  signal: (value: number) => typeof value === 'number' ? `${Math.round(value)}dBm` : value,

  /** 
   * 溫度格式化
   * 添加攝氏度符號，保留 1 位小數
   */
  temperature: (value: number) => typeof value === 'number' ? `${value.toFixed(1)}°C` : value,

  /** 
   * 濕度格式化
   * 添加百分比符號，保留 1 位小數
   */
  humidity: (value: number) => typeof value === 'number' ? `${value.toFixed(1)}%` : value,

  /** 
   * 飛行狀態中文化
   * 將英文狀態轉換為繁體中文
   */
  flightStatus: (value: string) => {
    const statusMap: Record<string, string> = {
      'grounded': '待機',
      'taking_off': '起飛中',
      'hovering': '懸停',
      'flying': '飛行中',
      'landing': '降落中',
      'emergency': '緊急狀態',
      'maintenance': '維護中'
    };
    return statusMap[value] || value;
  },

  /** 
   * GPS 狀態中文化
   * 將 GPS 定位狀態轉換為繁體中文
   */
  gpsStatus: (value: string) => {
    const gpsStatusMap: Record<string, string> = {
      'no_fix': '無信號',
      '2d_fix': '2D定位',
      '3d_fix': '3D定位',
      'dgps': 'DGPS',
      'rtk': 'RTK'
    };
    return gpsStatusMap[value] || value;
  },

  /** 
   * 指令狀態中文化
   * 將指令執行狀態轉換為繁體中文
   */
  commandStatus: (value: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待執行',
      'executing': '執行中',
      'completed': '已完成',
      'failed': '執行失敗',
      'cancelled': '已取消'
    };
    return statusMap[value] || value;
  },

  /** 
   * 指令類型中文化
   * 將無人機指令類型轉換為繁體中文
   */
  commandType: (value: string) => {
    const typeMap: Record<string, string> = {
      'takeoff': '起飛',
      'land': '降落',
      'move': '移動',
      'hover': '懸停',
      'return': '返航',
      'moveForward': '前進',
      'moveBackward': '後退',
      'moveLeft': '左移',
      'moveRight': '右移',
      'rotateLeft': '左轉',
      'rotateRight': '右轉',
      'emergency': '緊急停止'
    };
    return typeMap[value] || value;
  },

  /** 
   * 主題設定中文化
   * 將主題設定轉換為繁體中文
   */
  theme: (value: string) => {
    const themeMap: Record<string, string> = {
      'light': '淺色主題',
      'dark': '深色主題',
      'auto': '自動調整'
    };
    return themeMap[value] || value;
  },

  /** 
   * 時間格式中文化
   * 將時間格式設定轉換為繁體中文
   */
  timeFormat: (value: string) => {
    const timeFormatMap: Record<string, string> = {
      '12h': '12小時制',
      '24h': '24小時制'
    };
    return timeFormatMap[value] || value;
  },

  /** 
   * 語言設定中文化
   * 將語言代碼轉換為繁體中文顯示
   */
  language: (value: string) => {
    const languageMap: Record<string, string> = {
      'zh-TW': '繁體中文',
      'zh-CN': '簡體中文',
      'en-US': '英文 (美國)',
      'ja-JP': '日文',
      'ko-KR': '韓文'
    };
    return languageMap[value] || value;
  },

  /** 
   * JSON 物件格式化
   * 將 JSON 物件格式化為可讀的字符串
   */
  json: (value: any) => {
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }
};