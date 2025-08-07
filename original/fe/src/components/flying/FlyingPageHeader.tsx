/**
 * @fileoverview 飛行頁面標題組件
 * 
 * 提供頁面標題顯示和模式切換功能
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-05
 */

import React from "react";

interface FlyingPageHeaderProps {
  isSimulateMode: boolean;
  onModeToggle: () => void;
  isLoading: boolean;
  enableSimulateMode: boolean;
}

const FlyingPageHeader: React.FC<FlyingPageHeaderProps> = ({
  isSimulateMode,
  onModeToggle,
  isLoading,
  enableSimulateMode,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
          飛行頁面
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          無人機飛行控制與監控中心
        </p>
      </div>

      {/* 模式切換按鈕 */}
      {enableSimulateMode && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-300">
              目前模式:
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isSimulateMode
                  ? "bg-orange-900/30 text-orange-300 border border-orange-700"
                  : "bg-blue-900/30 text-blue-300 border border-blue-700"
              }`}
            >
              {isSimulateMode ? "模擬模式" : "真實模式"}
            </span>
          </div>
          <button
            onClick={onModeToggle}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg ${
              isSimulateMode
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
            }`}
            disabled={isLoading}
          >
            <span className="flex items-center gap-2">
              <span>{isSimulateMode ? "↻" : "✈"}</span>
              <span className="hidden sm:inline">
                {isSimulateMode ? "切換至真實模式" : "切換至模擬模式"}
              </span>
              <span className="sm:hidden">
                {isSimulateMode ? "真實" : "模擬"}
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FlyingPageHeader;