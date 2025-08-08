/**
 * @fileoverview 指令歷史面板組件
 *
 * 此組件提供完整的指令歷史追蹤與狀態監控功能，包括：
 * - 指令時間軸顯示 (issued_at, executed_at, completed_at)
 * - 即時狀態監控 (PENDING, EXECUTING, COMPLETED, FAILED)
 * - 錯誤診斷介面 (error_message)
 * - 執行效能分析 (等待時間、執行時間、總時間)
 *
 * @author AIOT Team
 * @version 2.0.0
 * @since 2025-08-04
 */

import React, { useState, useMemo } from "react";
import { useGetLatestCommandsArchive } from "../hooks/useDroneCommandArchiveQuery";
import type { DroneCommandArchive } from "../hooks/useDroneCommandArchiveQuery";

// 使用後端的枚舉類型
enum DroneCommandType {
  TAKEOFF = 'takeoff',
  LAND = 'land',
  MOVE = 'move',
  HOVER = 'hover',
  RETURN = 'return'
}

enum DroneCommandStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

interface CommandHistoryPageProps {
  className?: string;
}

/**
 * 指令歷史面板組件
 *
 * 提供指令歷史的完整追蹤和分析功能
 */
const CommandHistoryPage: React.FC<CommandHistoryPageProps> = ({ className }) => {
  // 使用真實 API 查詢資料
  const { data: commandHistory = [], isLoading, error, refetch } = useGetLatestCommandsArchive(100);
  
  const [selectedCommand, setSelectedCommand] = useState<DroneCommandArchive | null>(null);
  const [filterStatus, setFilterStatus] = useState<DroneCommandStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<DroneCommandType | 'all'>('all');

  // 過濾後的指令列表
  const filteredCommands = useMemo(() => {
    return commandHistory.filter(cmd => {
      const statusMatch = filterStatus === 'all' || cmd.status === filterStatus;
      const typeMatch = filterType === 'all' || cmd.command_type === filterType;
      return statusMatch && typeMatch;
    });
  }, [commandHistory, filterStatus, filterType]);

  // 計算時間的輔助函數
  const calculateWaitTime = (cmd: DroneCommandArchive): number | null => {
    if (!cmd.executed_at) return null;
    return new Date(cmd.executed_at).getTime() - new Date(cmd.issued_at).getTime();
  };

  const calculateExecutionTime = (cmd: DroneCommandArchive): number | null => {
    if (!cmd.executed_at || !cmd.completed_at) return null;
    return new Date(cmd.completed_at).getTime() - new Date(cmd.executed_at).getTime();
  };

  const calculateTotalTime = (cmd: DroneCommandArchive): number | null => {
    if (!cmd.completed_at) return null;
    return new Date(cmd.completed_at).getTime() - new Date(cmd.issued_at).getTime();
  };

  const getStatusBadge = (status: DroneCommandStatus) => {
    const configs = {
      [DroneCommandStatus.PENDING]: { bg: 'bg-yellow-900/30', text: 'text-yellow-300', border: 'border-yellow-700', icon: '⏳' },
      [DroneCommandStatus.EXECUTING]: { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-700', icon: '⚡' },
      [DroneCommandStatus.COMPLETED]: { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700', icon: '✅' },
      [DroneCommandStatus.FAILED]: { bg: 'bg-red-900/30', text: 'text-red-300', border: 'border-red-700', icon: '❌' },
    };
    
    const config = configs[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        <span>{config.icon}</span>
        <span>{status.toUpperCase()}</span>
      </span>
    );
  };

  const getCommandIcon = (type: DroneCommandType) => {
    const icons = {
      [DroneCommandType.TAKEOFF]: '🚁',
      [DroneCommandType.LAND]: '🛬',
      [DroneCommandType.MOVE]: '✈️',
      [DroneCommandType.HOVER]: '⏸️',
      [DroneCommandType.RETURN]: '🏠',
    };
    return icons[type];
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // 錯誤狀態
  if (error) {
    return (
      <div className={`${className || ""} min-h-screen bg-gray-900`}>
        <div className="p-3 sm:p-6 space-y-6">
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-8 text-center">
            <span className="text-4xl mb-4 block">❌</span>
            <h2 className="text-xl font-semibold text-red-300 mb-2">載入指令歷史失敗</h2>
            <p className="text-red-400 mb-4">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className || ""} min-h-screen bg-gray-900`}>
      <div className="p-3 sm:p-6 space-y-6">
        {/* 標題與篩選器 */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">指令歷史與狀態追蹤</h2>
            <p className="text-sm text-gray-400">
              監控指令執行狀態與效能分析 
              {isLoading && <span className="ml-2 text-blue-400">載入中...</span>}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* 重新載入按鈕 */}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isLoading ? '載入中...' : '🔄 重新載入'}
            </button>

            {/* 狀態篩選器 */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有狀態</option>
              <option value="pending">待執行</option>
              <option value="executing">執行中</option>
              <option value="completed">已完成</option>
              <option value="failed">失敗</option>
            </select>

            {/* 類型篩選器 */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有類型</option>
              <option value="takeoff">起飛</option>
              <option value="land">降落</option>
              <option value="move">移動</option>
              <option value="hover">懸停</option>
              <option value="return">返航</option>
            </select>
          </div>
        </div>

        {/* 統計摘要 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.values(DroneCommandStatus).map((status) => {
            const count = commandHistory.filter(cmd => cmd.status === status).length;
            return (
              <div key={status} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">{status}</p>
                    <p className="text-2xl font-bold text-gray-100">{count}</p>
                  </div>
                  {getStatusBadge(status)}
                </div>
              </div>
            );
          })}
        </div>

        {/* 指令歷史列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：指令列表 */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100">指令時間軸</h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredCommands.length > 0 ? (
                  <div className="divide-y divide-gray-700">
                    {filteredCommands.map((command) => (
                      <div
                        key={command.id}
                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-700/50 ${
                          selectedCommand?.id === command.id ? 'bg-gray-700/30' : ''
                        }`}
                        onClick={() => setSelectedCommand(command)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCommandIcon(command.command_type)}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-100">
                                {command.command_type.toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-400">
                                ID: {command.id} | 發送時間: {formatTime(command.issued_at)}
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(command.status)}
                        </div>

                        {/* 時間軸 */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 ml-7">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>發送: {formatTime(command.issued_at)}</span>
                          </div>
                          {command.executed_at && (
                            <>
                              <span>→</span>
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                                <span>執行: {formatTime(command.executed_at)}</span>
                              </div>
                            </>
                          )}
                          {command.completed_at && (
                            <>
                              <span>→</span>
                              <div className="flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${
                                  command.status === DroneCommandStatus.COMPLETED ? 'bg-green-500' : 'bg-red-500'
                                }`}></span>
                                <span>完成: {formatTime(command.completed_at)}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* 錯誤訊息 */}
                        {command.error_message && (
                          <div className="mt-2 ml-7 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-300">
                            <span className="font-medium">錯誤: </span>
                            {command.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <span className="text-4xl mb-4 block">📋</span>
                    {isLoading ? (
                      <p>載入指令記錄中...</p>
                    ) : (
                      <p>沒有符合條件的指令記錄</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右側：詳細資訊 */}
          <div className="space-y-4">
            {selectedCommand ? (
              <>
                {/* 指令詳情 */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <h3 className="text-lg font-semibold text-gray-100 mb-3">指令詳情</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400">指令類型</label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">{getCommandIcon(selectedCommand.command_type)}</span>
                        <span className="text-sm font-medium text-gray-100">
                          {selectedCommand.command_type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400">狀態</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedCommand.status)}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400">無人機 ID</label>
                      <div className="mt-1 text-sm font-medium text-gray-100">
                        {selectedCommand.drone_id}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400">指令參數</label>
                      <div className="mt-1 p-2 bg-gray-700/50 rounded text-xs font-mono text-gray-300">
                        {JSON.stringify(selectedCommand.command_data, null, 2)}
                      </div>
                    </div>

                    {selectedCommand.error_message && (
                      <div>
                        <label className="text-xs text-gray-400">錯誤訊息</label>
                        <div className="mt-1 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-300">
                          {selectedCommand.error_message}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 效能分析 */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <h3 className="text-lg font-semibold text-gray-100 mb-3">執行效能分析</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">等待時間</span>
                      <span className="text-sm font-semibold text-gray-100">
                        {formatDuration(calculateWaitTime(selectedCommand))}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">執行時間</span>
                      <span className="text-sm font-semibold text-gray-100">
                        {formatDuration(calculateExecutionTime(selectedCommand))}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">總時間</span>
                      <span className="text-sm font-semibold text-gray-100">
                        {formatDuration(calculateTotalTime(selectedCommand))}
                      </span>
                    </div>

                    {calculateTotalTime(selectedCommand) && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="text-xs text-gray-400 mb-2">效能評估</div>
                        <div className={`text-xs px-2 py-1 rounded ${
                          calculateTotalTime(selectedCommand)! < 5000 
                            ? 'bg-green-900/30 text-green-300 border border-green-700' 
                            : calculateTotalTime(selectedCommand)! < 15000
                            ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                            : 'bg-red-900/30 text-red-300 border border-red-700'
                        }`}>
                          {calculateTotalTime(selectedCommand)! < 5000 ? '🟢 優秀' : 
                           calculateTotalTime(selectedCommand)! < 15000 ? '🟡 正常' : '🔴 緩慢'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
                <span className="text-4xl mb-4 block">📊</span>
                <p className="text-gray-400">選擇一個指令查看詳細資訊</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandHistoryPage;