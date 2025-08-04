/**
 * @fileoverview 指令歷史頁面
 *
 * 此頁面提供完整的指令歷史追蹤與狀態監控功能，包括：
 * - 指令時間軸顯示 (issued_at, executed_at, completed_at)
 * - 即時狀態監控 (PENDING, EXECUTING, COMPLETED, FAILED)
 * - 錯誤診斷介面 (error_message)
 * - 執行效能分析 (等待時間、執行時間、總時間)
 *
 * @author AIOT Team
 * @version 1.0.0
 * @since 2025-08-04
 */

import React, { useRef } from "react";
import { useSimulateFlyLogic } from "../hooks/useSimulateFlyLogic";
import CommandHistoryPanel from "../components/DroneMonitoring/CommandHistoryPanel";

/**
 * CommandHistoryPage 組件的屬性介面
 */
interface CommandHistoryPageProps {
  className?: string;
}

/**
 * 指令歷史頁面組件
 *
 * 提供專業的指令歷史追蹤和分析功能
 *
 * @param props - 組件屬性
 * @returns 指令歷史頁面的 JSX 元素
 */
const CommandHistoryPage: React.FC<CommandHistoryPageProps> = ({ className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const simulateFlyLogic = useSimulateFlyLogic(mapRef);

  return (
    <div className={`${className || ""} min-h-screen bg-gray-900`}>
      <div className="p-3 sm:p-6">
        <CommandHistoryPanel droneLogic={simulateFlyLogic} />
      </div>
    </div>
  );
};

export default CommandHistoryPage;