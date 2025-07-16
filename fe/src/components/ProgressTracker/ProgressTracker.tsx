import React from 'react';
import { ProgressInfo } from '../../services/SSEService';

interface ProgressTrackerProps {
  progress: ProgressInfo | null;
  isTracking: boolean;
  error: string | null;
  onCancel?: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  isTracking,
  error,
  onCancel
}) => {
  if (!isTracking && !progress && !error) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started':
      case 'running':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'started':
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⏹️';
      default:
        return '❓';
    }
  };

  const formatStage = (stage: string) => {
    const stageMap: { [key: string]: string } = {
      'initializing': '初始化中',
      'generating_rtk': '生成 RTK 資料',
      'inserting_rtk': '插入 RTK 資料',
      'generating_users': '生成使用者資料',
      'inserting_users': '插入使用者資料',
      'creating_relationships': '建立關聯關係',
      'finalizing': '完成處理'
    };
    return stageMap[stage] || stage;
  };

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center">
          <span className="text-red-500 mr-2">❌</span>
          <span className="text-red-700 font-medium">錯誤</span>
        </div>
        <p className="text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center">
          <span className="text-blue-500 mr-2">🔄</span>
          <span className="text-blue-700 font-medium">連接中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
      <div className="space-y-3">
        {/* 狀態和任務 ID */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">{getStatusIcon(progress.status)}</span>
            <span className={`font-medium ${getStatusColor(progress.status)}`}>
              {progress.status.toUpperCase()}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Task ID: {progress.taskId.substring(0, 8)}...
          </div>
        </div>

        {/* 進度條 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {/* 進度信息 */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>{progress.percentage.toFixed(1)}%</span>
          <span>{progress.current} / {progress.total}</span>
        </div>

        {/* 當前階段 */}
        <div className="text-sm">
          <span className="font-medium text-gray-700">當前階段: </span>
          <span className="text-gray-600">{formatStage(progress.stage)}</span>
        </div>

        {/* 消息 */}
        <div className="text-sm text-gray-600">
          {progress.message}
        </div>

        {/* 時間信息 */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>開始時間: {new Date(progress.startTime).toLocaleTimeString()}</div>
          <div>最後更新: {new Date(progress.lastUpdated).toLocaleTimeString()}</div>
          {progress.estimatedCompletion && (
            <div>預計完成: {new Date(progress.estimatedCompletion).toLocaleTimeString()}</div>
          )}
        </div>

        {/* 取消按鈕 */}
        {isTracking && onCancel && (
          <button
            onClick={onCancel}
            className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200"
          >
            停止追蹤
          </button>
        )}

        {/* 結果顯示 */}
        {progress.status === 'completed' && progress.result && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
            <div className="text-sm font-medium text-green-800 mb-2">完成結果:</div>
            <pre className="text-xs text-green-700 overflow-x-auto">
              {JSON.stringify(progress.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};