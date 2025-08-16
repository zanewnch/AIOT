/**
 * @fileoverview 地圖容器組件
 * 
 * 提供地圖顯示容器，包含載入和錯誤狀態處理
 * 
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-05
 */

import React from "react";

interface MapContainerProps {
  mapRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  error: string;
  isSimulateMode: boolean;
  realModeLoading?: boolean;
}

const MapContainer: React.FC<MapContainerProps> = ({
  mapRef,
  isLoading,
  error,
  isSimulateMode,
  realModeLoading = false,
}) => {
  const showLoading = isLoading || realModeLoading;

  return (
    <div className="col-span-1 lg:col-span-3 bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden flex flex-col">
      <div className="relative flex-1">
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ minHeight: "400px" }}
        />

        {/* 載入覆蓋層 - 改善動畫 */}
        {showLoading && (
          <div className="absolute inset-0 bg-gray-800/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center text-gray-300">
              <div className="relative mb-4">
                <div className="animate-spin w-12 h-12 border-4 border-blue-800 border-t-blue-400 rounded-full mx-auto"></div>
                <div className="absolute inset-0 animate-pulse">
                  <div className="w-8 h-8 bg-blue-400/20 rounded-full mx-auto mt-2"></div>
                </div>
              </div>
              <p className="text-lg font-semibold">
                {isSimulateMode
                  ? "模擬地圖載入中..."
                  : "Google Maps 載入中..."}
              </p>
              <p className="text-sm mt-2 text-gray-400">請稍候片刻</p>
            </div>
          </div>
        )}

        {/* 錯誤覆蓋層 - 改善設計 */}
        {error && (
          <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center text-red-300 bg-gray-800 p-6 rounded-xl shadow-lg max-w-md mx-4 border border-red-700">
              <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-700">
                <span className="text-2xl">⚠</span>
              </div>
              <p className="text-lg font-semibold mb-2">載入失敗</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapContainer;