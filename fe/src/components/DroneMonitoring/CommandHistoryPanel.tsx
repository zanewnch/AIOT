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
 * @version 1.0.0
 * @since 2025-08-04
 */

import React, { useState, useEffect } from "react";

// 模擬後端的指令類型和狀態
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

// 模擬指令歷史資料結構
interface CommandHistoryItem {
  id: number;
  drone_id: number;
  command_type: DroneCommandType;
  command_data: any;
  status: DroneCommandStatus;
  issued_by: number;
  issued_at: Date;
  executed_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  // 計算方法
  getWaitTime(): number | null;
  getExecutionTime(): number | null;
  getTotalTime(): number | null;
}

interface CommandHistoryPanelProps {
  droneLogic: any;
}

/**
 * 指令歷史面板組件
 *
 * 提供指令歷史的完整追蹤和分析功能
 */
const CommandHistoryPanel: React.FC<CommandHistoryPanelProps> = ({ droneLogic }) => {
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<CommandHistoryItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<DroneCommandStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<DroneCommandType | 'all'>('all');

  // 模擬生成指令歷史資料
  useEffect(() => {
    generateMockCommandHistory();
    
    // 模擬即時更新
    const interval = setInterval(() => {
      updateCommandStatuses();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const generateMockCommandHistory = () => {
    const mockCommands: CommandHistoryItem[] = [];
    const now = new Date();

    // 生成最近的指令歷史
    for (let i = 0; i < 15; i++) {
      const issuedTime = new Date(now.getTime() - i * 300000); // 每5分鐘一個指令
      const executedTime = Math.random() > 0.3 ? new Date(issuedTime.getTime() + Math.random() * 10000) : null;
      const completedTime = executedTime && Math.random() > 0.2 ? 
        new Date(executedTime.getTime() + Math.random() * 30000) : null;

      const commandTypes = Object.values(DroneCommandType);
      const command_type = commandTypes[Math.floor(Math.random() * commandTypes.length)];
      
      let status: DroneCommandStatus;
      let error_message: string | null = null;

      if (!executedTime) {
        status = DroneCommandStatus.PENDING;
      } else if (!completedTime) {
        status = DroneCommandStatus.EXECUTING;
      } else if (Math.random() > 0.85) {
        status = DroneCommandStatus.FAILED;
        error_message = "GPS信號失去連接" + (Math.random() > 0.5 ? "" : " - 電量不足無法執行指令");
      } else {
        status = DroneCommandStatus.COMPLETED;
      }

      const commandItem: CommandHistoryItem = {
        id: i + 1,
        drone_id: 1,
        command_type,
        command_data: getCommandData(command_type),
        status,
        issued_by: 1,
        issued_at: issuedTime,
        executed_at: executedTime,
        completed_at: completedTime,
        error_message,
        getWaitTime() {
          if (!this.executed_at) return null;
          return this.executed_at.getTime() - this.issued_at.getTime();
        },
        getExecutionTime() {
          if (!this.executed_at || !this.completed_at) return null;
          return this.completed_at.getTime() - this.executed_at.getTime();
        },
        getTotalTime() {
          if (!this.completed_at) return null;
          return this.completed_at.getTime() - this.issued_at.getTime();
        }
      };

      mockCommands.push(commandItem);
    }

    setCommandHistory(mockCommands);
  };

  const getCommandData = (type: DroneCommandType) => {
    switch (type) {
      case DroneCommandType.TAKEOFF:
        return { altitude: 50, speed: 2.5 };
      case DroneCommandType.MOVE:
        return { 
          latitude: 25.033964 + (Math.random() - 0.5) * 0.01, 
          longitude: 121.564468 + (Math.random() - 0.5) * 0.01,
          altitude: 50,
          speed: 5.0 
        };
      case DroneCommandType.HOVER:
        return { duration: 30 };
      case DroneCommandType.LAND:
        return { speed: 1.5 };
      case DroneCommandType.RETURN:
        return { speed: 3.0 };
      default:
        return {};
    }
  };

  const updateCommandStatuses = () => {
    setCommandHistory(prev => prev.map(cmd => {
      // 模擬狀態變化
      if (cmd.status === DroneCommandStatus.PENDING && Math.random() > 0.7) {
        return {
          ...cmd,
          status: DroneCommandStatus.EXECUTING,
          executed_at: new Date()
        };
      }
      if (cmd.status === DroneCommandStatus.EXECUTING && Math.random() > 0.8) {
        const completed = Math.random() > 0.1;
        return {
          ...cmd,
          status: completed ? DroneCommandStatus.COMPLETED : DroneCommandStatus.FAILED,
          completed_at: new Date(),
          error_message: completed ? null : "執行超時"
        };
      }
      return cmd;
    }));
  };

  const filteredCommands = commandHistory.filter(cmd => {
    const statusMatch = filterStatus === 'all' || cmd.status === filterStatus;
    const typeMatch = filterType === 'all' || cmd.command_type === filterType;
    return statusMatch && typeMatch;
  });

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

  const formatTime = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleTimeString('zh-TW', { 
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

  return (
    <div className="space-y-6">
      {/* 標題與篩選器 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">指令歷史與狀態追蹤</h2>
          <p className="text-sm text-gray-400">監控指令執行狀態與效能分析</p>
        </div>

        <div className="flex flex-wrap gap-3">
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
                  <p>沒有符合條件的指令記錄</p>
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
                      {formatDuration(selectedCommand.getWaitTime())}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">執行時間</span>
                    <span className="text-sm font-semibold text-gray-100">
                      {formatDuration(selectedCommand.getExecutionTime())}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">總時間</span>
                    <span className="text-sm font-semibold text-gray-100">
                      {formatDuration(selectedCommand.getTotalTime())}
                    </span>
                  </div>

                  {selectedCommand.getTotalTime() && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-xs text-gray-400 mb-2">效能評估</div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        selectedCommand.getTotalTime()! < 5000 
                          ? 'bg-green-900/30 text-green-300 border border-green-700' 
                          : selectedCommand.getTotalTime()! < 15000
                          ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
                          : 'bg-red-900/30 text-red-300 border border-red-700'
                      }`}>
                        {selectedCommand.getTotalTime()! < 5000 ? '🟢 優秀' : 
                         selectedCommand.getTotalTime()! < 15000 ? '🟡 正常' : '🔴 緩慢'}
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
  );
};

export default CommandHistoryPanel;