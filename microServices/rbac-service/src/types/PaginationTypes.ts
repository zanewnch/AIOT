/**
 * @fileoverview 分頁查詢類型定義 - 統一分頁機制核心模組
 * 
 * **設計意圖說明：**
 * 此模組是整個 AIOT 微服務架構中分頁查詢的核心基礎設施，提供統一的分頁介面和工具。
 * 設計的核心理念和價值：
 * 
 * 1. **統一性原則**：
 *    - 確保所有微服務（RBAC、Drone、General）使用相同的分頁格式
 *    - 統一前端與後端的分頁交互協議
 *    - 標準化 API 回應格式，提升開發效率
 * 
 * 2. **安全性考量**：
 *    - 透過 maxPageSize 防止惡意大量資料請求
 *    - allowedSortFields 白名單機制防止 SQL 注入風險
 *    - 參數驗證確保資料完整性和系統穩定性
 * 
 * 3. **效能最佳化**：
 *    - 合理的預設值（defaultPageSize=10）平衡回應速度與資料完整性
 *    - offset 計算最佳化，支援大資料集分頁
 *    - 排序邏輯標準化，便於資料庫索引優化
 * 
 * 4. **可維護性**：
 *    - 集中式的分頁邏輯管理，修改一處影響全域
 *    - 類型安全的 TypeScript 定義，減少運行時錯誤
 *    - 清晰的介面分離（參數、結果、選項）
 * 
 * 5. **擴展性**：
 *    - 泛型設計支援任意資料類型的分頁
 *    - 可選參數設計，支援不同業務場景的客製化需求
 *    - 工具類別封裝常用操作，便於功能擴展
 * 
 * @author AIOT Development Team
 * @since 1.0.0
 * @version 2.0.0 - 增強型分頁支援與安全性改進
 */

/**
 * 分頁參數介面
 * 
 * **設計意圖：**
 * 此介面定義了所有分頁查詢的標準輸入格式，確保 API 一致性。
 * - page: 採用 1-based indexing，符合用戶直觀理解
 * - pageSize: 靈活的頁面大小設定，支援不同場景需求
 * - sortBy: 可選排序欄位，支援動態排序需求
 * - sortOrder: 嚴格的排序方向類型，防止無效值
 */
export interface PaginationParams {
  /** 頁碼，從 1 開始 */
  page: number;
  /** 每頁數量 */
  pageSize: number;
  /** 排序欄位 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 分頁結果介面
 * 
 * **設計意圖：**
 * 此泛型介面標準化了所有分頁查詢的回應格式，提供前端完整的分頁控制資訊。
 * 
 * 關鍵設計決策：
 * - 泛型 T: 支援任意資料類型，提升程式碼重用性
 * - 完整的分頁元數據: 讓前端能實現完整的分頁 UI 控制
 * - hasNextPage/hasPrevPage: 簡化前端分頁按鈕狀態控制
 * - totalPages: 支援跳頁功能和進度顯示
 */
export interface PaginatedResult<T> {
  /** 資料列表 */
  data: T[];
  /** 總記錄數 */
  total: number;
  /** 當前頁碼 */
  page: number;
  /** 每頁數量 */
  pageSize: number;
  /** 總頁數 */
  totalPages: number;
  /** 是否有下一頁 */
  hasNextPage: boolean;
  /** 是否有上一頁 */
  hasPrevPage: boolean;
}

/**
 * 分頁查詢選項
 * 
 * **設計意圖：**
 * 此介面提供分頁行為的細粒度控制，支援不同業務場景的客製化需求。
 * 
 * 安全性與效能考量：
 * - maxPageSize: 防止惡意請求大量資料，保護系統效能
 * - allowedSortFields: 白名單機制防止 SQL 注入和無效排序欄位
 * - 合理預設值: 在效能與使用體驗間取得平衡
 * 
 * 業務適應性：
 * - 不同模組可設定不同的預設值（如 RBAC vs IoT 資料）
 * - 支援業務特定的排序需求
 */
export interface PaginationOptions {
  /** 預設頁碼 */
  defaultPage?: number;
  /** 預設每頁數量 */
  defaultPageSize?: number;
  /** 最大每頁數量限制 */
  maxPageSize?: number;
  /** 預設排序欄位 */
  defaultSortBy?: string;
  /** 預設排序方向 */
  defaultSortOrder?: 'ASC' | 'DESC';
  /** 允許的排序欄位 */
  allowedSortFields?: string[];
}

/**
 * 分頁工具類
 * 
 * **設計意圖：**
 * 此工具類封裝了所有分頁相關的核心邏輯，提供類型安全且經過驗證的分頁操作。
 * 所有微服務都透過此類來確保分頁行為的一致性和安全性。
 */
export class PaginationUtils {
  /**
   * 驗證分頁參數
   * 
   * **方法意圖：**
   * 此方法是整個分頁系統的安全閘道，執行全面的輸入驗證和標準化。
   * 
   * 關鍵驗證邏輯：
   * 1. **頁碼正規化**: 確保 page >= 1，防止負數或零值
   * 2. **頁面大小限制**: 在 1 與 maxPageSize 間限制，防止效能問題
   * 3. **排序欄位白名單**: 只允許預定義欄位，防止 SQL 注入
   * 4. **排序方向驗證**: 嚴格限制為 ASC/DESC，防止無效值
   * 5. **預設值回退**: 提供合理預設值確保系統穩定運行
   */
  static validatePaginationParams(
    params: Partial<PaginationParams>, 
    options: PaginationOptions = {}
  ): PaginationParams {
    const {
      defaultPage = 1,
      defaultPageSize = 10,
      maxPageSize = 100,
      defaultSortBy = 'id',
      defaultSortOrder = 'DESC',
      allowedSortFields = []
    } = options;

    const page = Math.max(1, params.page || defaultPage);
    const pageSize = Math.min(Math.max(1, params.pageSize || defaultPageSize), maxPageSize);
    
    // 驗證排序欄位
    let sortBy = params.sortBy || defaultSortBy;
    if (allowedSortFields.length > 0 && !allowedSortFields.includes(sortBy)) {
      sortBy = defaultSortBy;
    }

    const sortOrder = ['ASC', 'DESC'].includes(params.sortOrder || '') 
      ? (params.sortOrder as 'ASC' | 'DESC')
      : defaultSortOrder;

    return {
      page,
      pageSize,
      sortBy,
      sortOrder
    };
  }

  /**
   * 計算分頁偏移量
   * 
   * **方法意圖：**
   * 將基於 1 的頁碼轉換為基於 0 的資料庫偏移量，是分頁查詢的核心計算邏輯。
   * 此方法確保所有微服務使用統一的偏移計算方式，避免 off-by-one 錯誤。
   */
  static calculateOffset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  }

  /**
   * 創建分頁結果
   * 
   * **方法意圖：**
   * 標準化分頁回應物件的創建過程，確保所有分頁 API 回應格式完全一致。
   * 
   * 計算邏輯：
   * - totalPages: 向上取整確保包含所有資料
   * - hasNextPage/hasPrevPage: 簡化前端分頁按鈕控制邏輯
   * - 完整元數據: 支援各種前端分頁 UI 需求
   */
  static createPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / pageSize);
    
    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  }
}