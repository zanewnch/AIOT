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
 * @version 2.0.0 - 使用真實後端 API
 * @since 2025-08-04
 */

import React, { useState, useRef } from "react";
import { useSimulateFlyLogic } from "../hooks/useSimulateFlyLogic";
import { 
  useGetAllQueues,
  useGetQueueById,
  useCreateQueue,
  useUpdateQueue,
  useDeleteQueue,
  useStartQueue,
  usePauseQueue,
  useResetQueue,
  useAddCommandToQueue,
  type DroneCommandQueue,
  type CreateQueueRequest,
  type CommandCondition
} from "../hooks";
import type { DroneCommandType } from "../hooks/useOptimisticCommand";

// 可用的命令類型列表（與後端保持一致）
const AVAILABLE_COMMAND_TYPES: DroneCommandType[] = [
  'takeoff',
  'land', 
  'hover',
  'flyTo',
  'return',
  'emergency'
];

enum CommandQueueStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

interface CommandQueuePageProps {
  className?: string;
}

/**
 * 智能指令佇列系統組件
 *
 * 提供批次指令規劃、條件式執行和智能衝突檢測功能
 */
const CommandQueuePage: React.FC<CommandQueuePageProps> = ({ className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const droneLogic = useSimulateFlyLogic(mapRef);
  
  // 狀態管理
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [isCreatingQueue, setIsCreatingQueue] = useState(false);
  const [newQueueName, setNewQueueName] = useState('');

  // API hooks
  const { data: queues = [], isLoading: queuesLoading, error: queuesError, refetch: refetchQueues } = useGetAllQueues();
  const { data: selectedQueue, isLoading: queueLoading } = useGetQueueById(selectedQueueId!, !!selectedQueueId);
  
  // Mutation hooks
  const createQueue = useCreateQueue();
  const updateQueue = useUpdateQueue();
  const deleteQueue = useDeleteQueue();
  const startQueue = useStartQueue();
  const pauseQueue = usePauseQueue();
  const resetQueue = useResetQueue();
  const addCommandToQueue = useAddCommandToQueue();

  // 預設指令模板（與後端命令類型保持一致）
  const commandTemplates: Record<string, any> = {
    'takeoff': { altitude: 50, speed: 2.5 },
    'land': { speed: 1.5 },
    'hover': { duration: 30 },
    'flyTo': { latitude: 25.034, longitude: 121.565, altitude: 50, speed: 5.0 },
    'return': { speed: 3.0 },
    'emergency': {}
  };

  const createNewQueue = async () => {
    if (!newQueueName.trim()) return;

    try {
      const queueData: CreateQueueRequest = {
        name: newQueueName,
        auto_execute: false,
        execution_conditions: null,
        max_loops: null,
        commands: []
      };

      const newQueue = await createQueue.mutateAsync(queueData);
      setNewQueueName('');
      setIsCreatingQueue(false);
      setSelectedQueueId(newQueue.id.toString());
    } catch (error) {
      console.error('Failed to create queue:', error);
    }
  };

  const handleAddCommandToQueue = async (queueId: string, commandType: DroneCommandType) => {
    try {
      await addCommandToQueue.mutateAsync({
        queueId,
        command: {
          drone_id: 1, // 默認使用無人機 ID 1
          command_type: commandType,
          command_data: commandTemplates[commandType]
        }
      });
    } catch (error) {
      console.error('Failed to add command to queue:', error);
    }
  };

  const handleStartQueue = async (queueId: string) => {
    try {
      await startQueue.mutateAsync(queueId);
    } catch (error) {
      console.error('Failed to start queue:', error);
    }
  };

  const handlePauseQueue = async (queueId: string) => {
    try {
      await pauseQueue.mutateAsync(queueId);
    } catch (error) {
      console.error('Failed to pause queue:', error);
    }
  };

  const handleResetQueue = async (queueId: string) => {
    try {
      await resetQueue.mutateAsync(queueId);
    } catch (error) {
      console.error('Failed to reset queue:', error);
    }
  };

  const handleDeleteQueue = async (queueId: string) => {
    try {
      await deleteQueue.mutateAsync(queueId);
      if (selectedQueueId === queueId) {
        setSelectedQueueId(null);
      }
    } catch (error) {
      console.error('Failed to delete queue:', error);
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

  const getCommandIcon = (type: string) => {
    const icons: Record<string, string> = {
      'takeoff': '🚁',
      'land': '🛬',
      'hover': '⏸️',
      'flyTo': '🎯',
      'return': '🏠',
      'moveForward': '⬆️',
      'moveBackward': '⬇️',
      'moveLeft': '⬅️',
      'moveRight': '➡️',
      'rotateLeft': '↪️',
      'rotateRight': '↩️',
      'emergency': '🚨',
      // 支援前端舊的類型
      'move': '✈️',
      'emergency_stop': '🚨',
      'return_to_home': '🏠',
    };
    return icons[type] || '📋';
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // 錯誤狀態
  if (queuesError) {
    return (
      <div className={`${className || ""} min-h-screen bg-gray-900`}>
        <div className="p-3 sm:p-6 space-y-6">
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-8 text-center">
            <span className="text-4xl mb-4 block">❌</span>
            <h2 className="text-xl font-semibold text-red-300 mb-2">載入指令佇列失敗</h2>
            <p className="text-red-400 mb-4">{queuesError.message}</p>
            <button
              onClick={() => refetchQueues()}
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
      {/* 標題與控制 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-100">智能指令佇列系統</h2>
          <p className="text-sm text-gray-400">
            批次指令規劃、條件式執行與衝突檢測
            {queuesLoading && <span className="ml-2 text-blue-400">載入中...</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => refetchQueues()}
            disabled={queuesLoading}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {queuesLoading ? '載入中...' : '🔄 重新載入'}
          </button>
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
              disabled={createQueue.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              {createQueue.isPending ? '建立中...' : '建立'}
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
                    selectedQueueId === queue.id.toString() ? 'bg-gray-700/30' : ''
                  }`}
                  onClick={() => setSelectedQueueId(queue.id.toString())}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-100">{queue.name}</h4>
                      <p className="text-xs text-gray-400">
                        {queue.commands?.length || 0} 個指令 | 
                        建立時間: {formatTime(queue.createdAt)}
                      </p>
                    </div>
                    {getStatusBadge(queue.status)}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>進度: {queue.current_index}/{queue.commands?.length || 0}</span>
                    <div className="flex gap-1">
                      {queue.status === CommandQueueStatus.PENDING && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartQueue(queue.id.toString()); }}
                          disabled={startQueue.isPending}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-xs"
                        >
                          開始
                        </button>
                      )}
                      {queue.status === CommandQueueStatus.RUNNING && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePauseQueue(queue.id.toString()); }}
                          disabled={pauseQueue.isPending}
                          className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded text-xs"
                        >
                          暫停
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResetQueue(queue.id.toString()); }}
                        disabled={resetQueue.isPending}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-xs"
                      >
                        重置
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteQueue(queue.id.toString()); }}
                        disabled={deleteQueue.isPending}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded text-xs"
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
                          width: `${(queue.commands?.length || 0) > 0 ? (queue.current_index / (queue.commands?.length || 1)) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}

              {queues.length === 0 && !queuesLoading && (
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
          {selectedQueue ? (
            <>
              {/* 佇列資訊 */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-100">{selectedQueue.name}</h3>
                  {getStatusBadge(selectedQueue.status)}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">總指令數</span>
                    <div className="font-semibold text-gray-100">{selectedQueue.commands?.length || 0}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">當前進度</span>
                    <div className="font-semibold text-gray-100">
                      {selectedQueue.current_index}/{selectedQueue.commands?.length || 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">自動執行</span>
                    <div className="font-semibold text-gray-100">
                      {selectedQueue.auto_execute ? '✅ 是' : '❌ 否'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">執行時間</span>
                    <div className="font-semibold text-gray-100">
                      {formatTime(selectedQueue.started_at)}
                    </div>
                  </div>
                </div>

                {/* 新增指令按鈕 */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COMMAND_TYPES.map((commandType) => (
                      <button
                        key={commandType}
                        onClick={() => handleAddCommandToQueue(selectedQueue.id.toString(), commandType)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-sm font-medium transition-colors"
                        disabled={selectedQueue.status === CommandQueueStatus.RUNNING || addCommandToQueue.isPending}
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
                  {selectedQueue.commands && selectedQueue.commands.length > 0 ? (
                    selectedQueue.commands.map((command, index) => (
                      <div
                        key={command.id}
                        className={`p-4 ${
                          index === selectedQueue.current_index && selectedQueue.status === CommandQueueStatus.RUNNING
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
                                建立時間: {formatTime(command.createdAt)}
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

                        {/* 錯誤訊息 */}
                        {command.error_message && (
                          <div className="ml-8 mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-xs text-red-300">
                            錯誤: {command.error_message}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
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
    </div>
  );
};

export default CommandQueuePage;