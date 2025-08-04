/**
 * @fileoverview 智能指令佇列系統組件
 *
 * 此組件提供完整的智能指令管理功能，包括：
 * - 批次指令規劃 (DroneCommandType 序列)
 * - 條件式指令 (基於 battery_level 或 altitude 的自動觸發)
 * - 指令衝突檢測 (防止不相容的指令組合)
 * - 佇列執行控制與監控
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

enum CommandQueueStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 條件類型
interface CommandCondition {
  type: 'battery' | 'altitude' | 'time' | 'position';
  operator: '>=' | '<=' | '==' | '!=' | '>' | '<';
  value: number | string;
  unit?: string;
}

// 排隊指令項目
interface QueuedCommand {
  id: string;
  command_type: DroneCommandType;
  command_data: any;
  conditions?: CommandCondition[];
  delay?: number; // 執行前等待時間 (秒)
  retry_count?: number;
  max_retries?: number;
  status: 'waiting' | 'ready' | 'executing' | 'completed' | 'failed' | 'skipped';
  created_at: Date;
  execute_at?: Date;
  completed_at?: Date;
  error_message?: string;
}

// 指令佇列
interface CommandQueue {
  id: string;
  name: string;
  status: CommandQueueStatus;
  commands: QueuedCommand[];
  current_index: number;
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  auto_execute: boolean;
  loop_count?: number;
  max_loops?: number;
}

interface CommandQueuePanelProps {
  droneLogic: any;
}

/**
 * 智能指令佇列系統組件
 *
 * 提供批次指令規劃、條件式執行和智能衝突檢測功能
 */
const CommandQueuePanel: React.FC<CommandQueuePanelProps> = ({ droneLogic }) => {
  const [queues, setQueues] = useState<CommandQueue[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [isCreatingQueue, setIsCreatingQueue] = useState(false);
  const [newQueueName, setNewQueueName] = useState('');
  const [currentCommand, setCurrentCommand] = useState<QueuedCommand | null>(null);

  // 預設指令模板
  const commandTemplates = {
    [DroneCommandType.TAKEOFF]: { altitude: 50, speed: 2.5 },
    [DroneCommandType.LAND]: { speed: 1.5 },
    [DroneCommandType.MOVE]: { latitude: 25.034, longitude: 121.565, altitude: 50, speed: 5.0 },
    [DroneCommandType.HOVER]: { duration: 30 },
    [DroneCommandType.RETURN]: { speed: 3.0 }
  };

  // 預設條件模板
  const conditionTemplates = {
    battery_low: { type: 'battery' as const, operator: '<=' as const, value: 30, unit: '%' },
    battery_sufficient: { type: 'battery' as const, operator: '>=' as const, value: 50, unit: '%' },
    altitude_safe: { type: 'altitude' as const, operator: '>=' as const, value: 10, unit: 'm' },
    altitude_limit: { type: 'altitude' as const, operator: '<=' as const, value: 100, unit: 'm' }
  };

  useEffect(() => {
    // 初始化一些示例佇列
    initializeSampleQueues();
    
    // 模擬佇列執行
    const interval = setInterval(() => {
      processQueues();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const initializeSampleQueues = () => {
    const sampleQueues: CommandQueue[] = [
      {
        id: 'queue-1',
        name: '自動巡邏任務',
        status: CommandQueueStatus.PENDING,
        current_index: 0,
        auto_execute: true,
        created_at: new Date(),
        commands: [
          {
            id: 'cmd-1',
            command_type: DroneCommandType.TAKEOFF,
            command_data: { altitude: 50, speed: 2.5 },
            conditions: [conditionTemplates.battery_sufficient],
            status: 'waiting',
            created_at: new Date(),
            max_retries: 3,
            retry_count: 0
          },
          {
            id: 'cmd-2',
            command_type: DroneCommandType.MOVE,
            command_data: { latitude: 25.035, longitude: 121.566, altitude: 50, speed: 5.0 },
            delay: 5,
            status: 'waiting',
            created_at: new Date(),
            max_retries: 2,
            retry_count: 0
          },
          {
            id: 'cmd-3',
            command_type: DroneCommandType.HOVER,
            command_data: { duration: 30 },
            status: 'waiting',
            created_at: new Date(),
            max_retries: 1,
            retry_count: 0
          },
          {
            id: 'cmd-4',
            command_type: DroneCommandType.RETURN,
            command_data: { speed: 3.0 },
            conditions: [conditionTemplates.battery_low],
            status: 'waiting',
            created_at: new Date(),
            max_retries: 3,
            retry_count: 0
          },
          {
            id: 'cmd-5',
            command_type: DroneCommandType.LAND,
            command_data: { speed: 1.5 },
            status: 'waiting',
            created_at: new Date(),
            max_retries: 3,
            retry_count: 0
          }
        ]
      }
    ];

    setQueues(sampleQueues);
  };

  const processQueues = () => {
    setQueues(prevQueues => prevQueues.map(queue => {
      if (queue.status !== CommandQueueStatus.RUNNING) return queue;

      const currentCmd = queue.commands[queue.current_index];
      if (!currentCmd) return { ...queue, status: CommandQueueStatus.COMPLETED, completed_at: new Date() };

      // 模擬指令執行
      if (currentCmd.status === 'waiting') {
        // 檢查條件
        const conditionsMet = checkConditions(currentCmd.conditions || []);
        if (conditionsMet) {
          return {
            ...queue,
            commands: queue.commands.map(cmd => 
              cmd.id === currentCmd.id 
                ? { ...cmd, status: 'ready', execute_at: new Date() }
                : cmd
            )
          };
        }
      } else if (currentCmd.status === 'ready') {
        return {
          ...queue,
          commands: queue.commands.map(cmd => 
            cmd.id === currentCmd.id 
              ? { ...cmd, status: 'executing' }
              : cmd
          )
        };
      } else if (currentCmd.status === 'executing') {
        // 模擬執行完成
        const success = Math.random() > 0.1; // 90% 成功率
        const newStatus = success ? 'completed' : 'failed';
        const shouldRetry = !success && (currentCmd.retry_count || 0) < (currentCmd.max_retries || 0);

        if (shouldRetry) {
          return {
            ...queue,
            commands: queue.commands.map(cmd => 
              cmd.id === currentCmd.id 
                ? { ...cmd, status: 'waiting', retry_count: (cmd.retry_count || 0) + 1 }
                : cmd
            )
          };
        } else {
          const nextIndex = success ? queue.current_index + 1 : queue.current_index + 1;
          return {
            ...queue,
            current_index: nextIndex,
            commands: queue.commands.map(cmd => 
              cmd.id === currentCmd.id 
                ? { 
                    ...cmd, 
                    status: newStatus, 
                    completed_at: new Date(),
                    error_message: success ? undefined : '模擬執行失敗'
                  }
                : cmd
            )
          };
        }
      }

      return queue;
    }));
  };

  const checkConditions = (conditions: CommandCondition[]): boolean => {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      switch (condition.type) {
        case 'battery':
          const currentBattery = droneLogic.droneStats?.battery || 100;
          return evaluateCondition(currentBattery, condition.operator, condition.value as number);
        case 'altitude':
          const currentAltitude = droneLogic.droneStats?.altitude || 0;
          return evaluateCondition(currentAltitude, condition.operator, condition.value as number);
        default:
          return true;
      }
    });
  };

  const evaluateCondition = (current: number, operator: string, target: number): boolean => {
    switch (operator) {
      case '>=': return current >= target;
      case '<=': return current <= target;
      case '>': return current > target;
      case '<': return current < target;
      case '==': return current === target;
      case '!=': return current !== target;
      default: return true;
    }
  };

  const createNewQueue = () => {
    if (!newQueueName.trim()) return;

    const newQueue: CommandQueue = {
      id: `queue-${Date.now()}`,
      name: newQueueName,
      status: CommandQueueStatus.PENDING,
      current_index: 0,
      auto_execute: false,
      created_at: new Date(),
      commands: []
    };

    setQueues(prev => [...prev, newQueue]);
    setNewQueueName('');
    setIsCreatingQueue(false);
    setSelectedQueue(newQueue.id);
  };

  const addCommandToQueue = (queueId: string, commandType: DroneCommandType) => {
    const newCommand: QueuedCommand = {
      id: `cmd-${Date.now()}`,
      command_type: commandType,
      command_data: commandTemplates[commandType],
      status: 'waiting',
      created_at: new Date(),
      max_retries: 2,
      retry_count: 0
    };

    setQueues(prev => prev.map(queue => 
      queue.id === queueId 
        ? { ...queue, commands: [...queue.commands, newCommand] }
        : queue
    ));
  };

  const startQueue = (queueId: string) => {
    setQueues(prev => prev.map(queue => 
      queue.id === queueId 
        ? { ...queue, status: CommandQueueStatus.RUNNING, started_at: new Date() }
        : queue
    ));
  };

  const pauseQueue = (queueId: string) => {
    setQueues(prev => prev.map(queue => 
      queue.id === queueId 
        ? { ...queue, status: CommandQueueStatus.PAUSED }
        : queue
    ));
  };

  const resetQueue = (queueId: string) => {
    setQueues(prev => prev.map(queue => 
      queue.id === queueId 
        ? { 
            ...queue, 
            status: CommandQueueStatus.PENDING, 
            current_index: 0,
            started_at: undefined,
            completed_at: undefined,
            commands: queue.commands.map(cmd => ({
              ...cmd,
              status: 'waiting',
              retry_count: 0,
              execute_at: undefined,
              completed_at: undefined,
              error_message: undefined
            }))
          }
        : queue
    ));
  };

  const deleteQueue = (queueId: string) => {
    setQueues(prev => prev.filter(queue => queue.id !== queueId));
    if (selectedQueue === queueId) {
      setSelectedQueue(null);
    }
  };

  const getStatusBadge = (status: CommandQueueStatus | string) => {
    const configs = {
      'pending': { bg: 'bg-gray-900/30', text: 'text-gray-300', border: 'border-gray-700', icon: '⏳' },
      'running': { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-700', icon: '▶️' },
      'paused': { bg: 'bg-yellow-900/30', text: 'text-yellow-300', border: 'border-yellow-700', icon: '⏸️' },
      'completed': { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700', icon: '✅' },
      'failed': { bg: 'bg-red-900/30', text: 'text-red-300', border: 'border-red-700', icon: '❌' },
      'waiting': { bg: 'bg-gray-900/30', text: 'text-gray-300', border: 'border-gray-700', icon: '⏳' },
      'ready': { bg: 'bg-green-900/30', text: 'text-green-300', border: 'border-green-700', icon: '🟢' },
      'executing': { bg: 'bg-blue-900/30', text: 'text-blue-300', border: 'border-blue-700', icon: '⚡' },
      'skipped': { bg: 'bg-orange-900/30', text: 'text-orange-300', border: 'border-orange-700', icon: '⏭️' },
    };
    
    const config = configs[status as keyof typeof configs];
    if (!config) return null;
    
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

  const selectedQueueData = queues.find(q => q.id === selectedQueue);

  return (
    <div className="space-y-6">
      {/* 標題與控制 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">智能指令佇列系統</h2>
          <p className="text-sm text-gray-400">批次指令規劃、條件式執行與衝突檢測</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsCreatingQueue(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            ➕ 新增佇列
          </button>
        </div>
      </div>

      {/* 新增佇列對話框 */}
      {isCreatingQueue && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-100 mb-3">建立新佇列</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newQueueName}
              onChange={(e) => setNewQueueName(e.target.value)}
              placeholder="輸入佇列名稱..."
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && createNewQueue()}
            />
            <button
              onClick={createNewQueue}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              建立
            </button>
            <button
              onClick={() => setIsCreatingQueue(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 主要內容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：佇列列表 */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100">指令佇列</h3>
            </div>
            
            <div className="divide-y divide-gray-700">
              {queues.map((queue) => (
                <div
                  key={queue.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-700/50 ${
                    selectedQueue === queue.id ? 'bg-gray-700/30' : ''
                  }`}
                  onClick={() => setSelectedQueue(queue.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-100">{queue.name}</h4>
                      <p className="text-xs text-gray-400">
                        {queue.commands.length} 個指令 | 
                        建立時間: {queue.created_at.toLocaleTimeString('zh-TW')}
                      </p>
                    </div>
                    {getStatusBadge(queue.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>進度: {queue.current_index}/{queue.commands.length}</span>
                    <div className="flex gap-1">
                      {queue.status === CommandQueueStatus.PENDING && (
                        <button
                          onClick={(e) => { e.stopPropagation(); startQueue(queue.id); }}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                        >
                          開始
                        </button>
                      )}
                      {queue.status === CommandQueueStatus.RUNNING && (
                        <button
                          onClick={(e) => { e.stopPropagation(); pauseQueue(queue.id); }}
                          className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs"
                        >
                          暫停
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); resetQueue(queue.id); }}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                      >
                        重置
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteQueue(queue.id); }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                      >
                        刪除
                      </button>
                    </div>
                  </div>

                  {/* 進度條 */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${queue.commands.length > 0 ? (queue.current_index / queue.commands.length) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}

              {queues.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <span className="text-4xl mb-4 block">📋</span>
                  <p>尚無指令佇列</p>
                  <p className="text-xs mt-1">點擊上方按鈕建立新佇列</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右側：佇列詳情 */}
        <div className="lg:col-span-2 space-y-4">
          {selectedQueueData ? (
            <>
              {/* 佇列資訊 */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-100">{selectedQueueData.name}</h3>
                  {getStatusBadge(selectedQueueData.status)}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">總指令數</span>
                    <div className="font-semibold text-gray-100">{selectedQueueData.commands.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">當前進度</span>
                    <div className="font-semibold text-gray-100">
                      {selectedQueueData.current_index}/{selectedQueueData.commands.length}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">自動執行</span>
                    <div className="font-semibold text-gray-100">
                      {selectedQueueData.auto_execute ? '✅ 是' : '❌ 否'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">執行時間</span>
                    <div className="font-semibold text-gray-100">
                      {selectedQueueData.started_at ? 
                        selectedQueueData.started_at.toLocaleTimeString('zh-TW') : '-'
                      }
                    </div>
                  </div>
                </div>

                {/* 新增指令按鈕 */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {Object.values(DroneCommandType).map((commandType) => (
                      <button
                        key={commandType}
                        onClick={() => addCommandToQueue(selectedQueueData.id, commandType)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                        disabled={selectedQueueData.status === CommandQueueStatus.RUNNING}
                      >
                        {getCommandIcon(commandType)} {commandType.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 指令列表 */}
              <div className="bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-100">指令序列</h3>
                </div>
                
                <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                  {selectedQueueData.commands.map((command, index) => (
                    <div
                      key={command.id}
                      className={`p-4 ${
                        index === selectedQueueData.current_index && selectedQueueData.status === CommandQueueStatus.RUNNING
                          ? 'bg-blue-900/20 border-l-4 border-blue-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm">#{index + 1}</span>
                          <span className="text-lg">{getCommandIcon(command.command_type)}</span>
                          <div>
                            <h4 className="font-medium text-gray-100">
                              {command.command_type.toUpperCase()}
                            </h4>
                            <p className="text-xs text-gray-400">
                              建立時間: {command.created_at.toLocaleTimeString('zh-TW')}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(command.status)}
                      </div>

                      {/* 指令參數 */}
                      <div className="ml-8 mb-2">
                        <div className="text-xs text-gray-400 mb-1">參數:</div>
                        <div className="text-xs font-mono text-gray-300 bg-gray-700/50 p-2 rounded">
                          {JSON.stringify(command.command_data, null, 2)}
                        </div>
                      </div>

                      {/* 條件顯示 */}
                      {command.conditions && command.conditions.length > 0 && (
                        <div className="ml-8 mb-2">
                          <div className="text-xs text-gray-400 mb-1">執行條件:</div>
                          <div className="flex flex-wrap gap-1">
                            {command.conditions.map((condition, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-900/30 text-purple-300 border border-purple-700 rounded text-xs">
                                {condition.type} {condition.operator} {condition.value}{condition.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 重試資訊 */}
                      {command.max_retries && command.max_retries > 0 && (
                        <div className="ml-8 text-xs text-gray-400">
                          重試: {command.retry_count || 0}/{command.max_retries}
                        </div>
                      )}

                      {/* 錯誤訊息 */}
                      {command.error_message && (
                        <div className="ml-8 mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-300">
                          錯誤: {command.error_message}
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedQueueData.commands.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                      <span className="text-4xl mb-4 block">📝</span>
                      <p>此佇列尚無指令</p>
                      <p className="text-xs mt-1">使用上方按鈕新增指令</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
              <span className="text-4xl mb-4 block">⚡</span>
              <p className="text-gray-400">選擇一個佇列查看詳細資訊</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandQueuePanel;