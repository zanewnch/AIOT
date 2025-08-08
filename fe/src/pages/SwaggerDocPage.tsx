/**
 * @fileoverview Swagger API 文檔頁面
 *
 * 此文件提供 API 文檔的入口頁面，包含前往 Swagger UI 的連結和相關資訊。
 * 用戶可以透過此頁面訪問互動式的 API 文檔和 OpenAPI 規範。
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-07-18
 */

import React from "react"; // 引入 React 核心庫

/**
 * SwaggerDocPage 組件的屬性介面
 *
 * 定義了 SwaggerDocPage 組件接受的屬性類型
 *
 * @interface SwaggerDocPageProps
 */
interface SwaggerDocPageProps {
  /**
   * 可選的 CSS 類名，用於自定義組件樣式
   * @optional
   */
  className?: string;
}

/**
 * Swagger API 文檔頁面組件
 *
 * 此組件提供了一個用戶友好的介面來訪問 API 文檔，包括：
 * - 前往 Swagger UI 的按鈕
 * - 直接連結到 API 文檔和 OpenAPI 規範
 * - 響應式設計和優雅的用戶體驗
 *
 * 組件會從環境變數中讀取 API 基礎 URL，如果未設定則使用預設值。
 *
 * @param {SwaggerDocPageProps} props - 組件屬性
 * @param {string} [props.className] - 可選的 CSS 類名
 *
 * @returns {JSX.Element} Swagger 文檔頁面的 JSX 元素
 *
 * @example
 * ```tsx
 * // 基本使用
 * <SwaggerDocPage />
 *
 * // 使用自定義樣式
 * <SwaggerDocPage className="custom-swagger-page" />
 * ```
 */
const SwaggerDocPage: React.FC<SwaggerDocPageProps> = ({ className }) => {
  // 從環境變數讀取 API 基礎 URL，如果未設定則使用預設的本地開發伺服器位址
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  return (
    // 主容器，使用最小高度為全螢幕，結合可選的自定義類名
    <div className={`min-h-screen ${className || ""}`}>
      {/* 內容容器，提供適當的內邊距 */}
      <div className="p-6">
        {/* 頁面標題 */}
        <h1 className="text-3xl font-bold mb-6">API Documentation</h1>

        {/* 主要內容卡片 */}
        <div className="rounded-lg shadow-lg p-6">
          {/* 說明文字 */}
          <p className="text-gray-600 mb-4">
            View the interactive API documentation by visiting the Swagger UI
            directly.
          </p>

          {/* 連結和操作區域 */}
          <div className="space-y-4">
            {/* 主要 API 文檔按鈕 */}
            <div>
              <a
                href={`${apiBaseUrl}/api/docs/`} // 動態構建 API 文檔 URL
                target="_blank" // 在新分頁中開啟
                rel="noopener noreferrer" // 安全性考量，防止 window.opener 存取
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Open API Documentation
                {/* 外部連結圖示 SVG */}
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>

            {/* 額外的直接連結區域 */}
            <div className="text-sm text-gray-500">
              <p>Direct links:</p>
              {/* 連結清單 */}
              <ul className="list-disc list-inside mt-2 space-y-1">
                {/* 互動式 API 探索器連結 */}
                <li>
                  <a
                    href={`${apiBaseUrl}/api/docs/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Interactive API Explorer
                  </a>
                </li>
                {/* OpenAPI JSON 規範連結 */}
                <li>
                  <a
                    href={`${apiBaseUrl}/api/swagger.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OpenAPI JSON Specification
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwaggerDocPage;
