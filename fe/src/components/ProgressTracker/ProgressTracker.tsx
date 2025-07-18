/**
 * @fileoverview 進度追蹤器組件
 * 
 * 此組件提供任務進度追蹤的視覺化功能，包括：
 * - 實時進度顯示
 * - 任務狀態指示器
 * - 進度條和百分比顯示
 * - 錯誤狀態處理
 * - 任務取消功能
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import React from 'react'; // 引入 React 核心庫
import { ProgressInfo } from '../../services/SSEService'; // 引入進度信息類型定義

/**
 * 進度追蹤器組件的屬性介面
 * 
 * @interface ProgressTrackerProps
 */
interface ProgressTrackerProps {
  /** 進度信息物件，包含當前任務的進度詳情 */
  progress: ProgressInfo | null;
  /** 是否正在追蹤進度 */
  isTracking: boolean;
  /** 錯誤訊息，當發生錯誤時顯示 */
  error: string | null;
  /** 取消任務的回調函數 */
  onCancel?: () => void;
}

/**
 * 進度追蹤器組件
 * 
 * 此組件負責顯示任務的執行進度，包括進度條、狀態指示器、
 * 錯誤處理以及任務取消功能。支援實時更新和多種狀態顯示。
 * 
 * @param {ProgressTrackerProps} props - 組件屬性
 * @returns {JSX.Element | null} 進度追蹤器的 JSX 元素或 null
 * 
 * @example
 * ```tsx
 * import { ProgressTracker } from './ProgressTracker';
 * 
 * function App() {
 *   const [progress, setProgress] = useState<ProgressInfo | null>(null);
 *   const [isTracking, setIsTracking] = useState(false);
 *   const [error, setError] = useState<string | null>(null);
 * 
 *   const handleCancel = () => {
 *     setIsTracking(false);
 *   };
 * 
 *   return (
 *     <ProgressTracker
 *       progress={progress}
 *       isTracking={isTracking}
 *       error={error}
 *       onCancel={handleCancel}
 *     />
 *   );
 * }
 * ```
 */
export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  isTracking,
  error,
  onCancel
}) => {
  // 如果沒有任何需要顯示的內容，返回 null
  if (!isTracking && !progress && !error) {
    return null;
  }

  /**
   * 根據任務狀態獲取對應的顏色樣式
   * 
   * @param {string} status - 任務狀態
   * @returns {string} Tailwind CSS 顏色類名
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'started':
      case 'running':
        return 'text-blue-600'; // 執行中使用藍色
      case 'completed':
        return 'text-green-600'; // 完成使用綠色
      case 'failed':
        return 'text-red-600'; // 失敗使用紅色
      case 'cancelled':
        return 'text-gray-600'; // 取消使用灰色
      default:
        return 'text-gray-600'; // 預設使用灰色
    }
  };

  /**
   * 根據任務狀態獲取對應的圖示
   * 
   * @param {string} status - 任務狀態
   * @returns {string} 狀態圖示的 emoji 字符
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'started':
      case 'running':
        return '🔄'; // 執行中使用旋轉箭頭
      case 'completed':
        return '✅'; // 完成使用綠色勾號
      case 'failed':
        return '❌'; // 失敗使用紅色叉號
      case 'cancelled':
        return '⏹️'; // 取消使用停止符號
      default:
        return '❓'; // 預設使用問號
    }
  };

  /**
   * 格式化階段名稱為繁體中文
   * 
   * @param {string} stage - 英文階段名稱
   * @returns {string} 繁體中文階段名稱
   */
  const formatStage = (stage: string) => {
    const stageMap: { [key: string]: string } = {
      'initializing': '初始化中', // 初始化階段
      'generating_rtk': '生成 RTK 資料', // RTK 資料生成階段
      'inserting_rtk': '插入 RTK 資料', // RTK 資料插入階段
      'generating_users': '生成使用者資料', // 使用者資料生成階段
      'inserting_users': '插入使用者資料', // 使用者資料插入階段
      'creating_relationships': '建立關聯關係', // 關聯關係建立階段
      'finalizing': '完成處理' // 最終處理階段
    };
    return stageMap[stage] || stage; // 如果沒有對應的翻譯，返回原始值
  };

  // 錯誤狀態顯示 - 當發生錯誤時顯示錯誤訊息
  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md"> {/* 錯誤狀態容器 */}
        <div className="flex items-center">
          <span className="text-red-500 mr-2">❌</span> {/* 錯誤圖示 */}
          <span className="text-red-700 font-medium">錯誤</span> {/* 錯誤標題 */}
        </div>
        <p className="text-red-600 mt-1">{error}</p> {/* 錯誤訊息內容 */}
      </div>
    );
  }

  // 連接中狀態顯示 - 當正在追蹤但還沒有進度資訊時顯示
  if (!progress) {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md"> {/* 連接中狀態容器 */}
        <div className="flex items-center">
          <span className="text-blue-500 mr-2">🔄</span> {/* 連接中圖示 */}
          <span className="text-blue-700 font-medium">連接中...</span> {/* 連接中訊息 */}
        </div>
      </div>
    );
  }

  // 渲染進度追蹤器的主要內容
  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md"> {/* 進度容器根元素 */}
      <div className="space-y-3"> {/* 內容區域，設置垂直間距 */}
        {/* 任務狀態和任務 ID 顯示 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">{getStatusIcon(progress.status)}</span> {/* 狀態圖示 */}
            <span className={`font-medium ${getStatusColor(progress.status)}`}>
              {progress.status.toUpperCase()} {/* 大寫狀態文字 */}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Task ID: {progress.taskId.substring(0, 8)}... {/* 縮短的任務 ID */}
          </div>
        </div>

        {/* 進度條區域 */}
        <div className="w-full bg-gray-200 rounded-full h-2"> {/* 進度條背景 */}
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" // 進度條填充，加入動畫效果
            style={{ width: `${progress.percentage}%` }} // 動態設置寬度百分比
          />
        </div>

        {/* 進度百分比和數量信息 */}
        <div className="flex justify-between text-sm text-gray-600">
          <span>{progress.percentage.toFixed(1)}%</span> {/* 百分比顯示，保留一位小數 */}
          <span>{progress.current} / {progress.total}</span> {/* 當前進度 / 總數 */}
        </div>

        {/* 當前執行階段顯示 */}
        <div className="text-sm">
          <span className="font-medium text-gray-700">當前階段: </span>
          <span className="text-gray-600">{formatStage(progress.stage)}</span> {/* 格式化後的階段名稱 */}
        </div>

        {/* 任務消息顯示 */}
        <div className="text-sm text-gray-600">
          {progress.message} {/* 顯示當前任務消息 */}
        </div>

        {/* 時間信息區域 */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>開始時間: {new Date(progress.startTime).toLocaleTimeString()}</div> {/* 任務開始時間 */}
          <div>最後更新: {new Date(progress.lastUpdated).toLocaleTimeString()}</div> {/* 最後更新時間 */}
          {progress.estimatedCompletion && (
            <div>預計完成: {new Date(progress.estimatedCompletion).toLocaleTimeString()}</div> // 預計完成時間（可選）
          )}
        </div>

        {/* 取消追蹤按鈕 */}
        {isTracking && onCancel && (
          <button
            onClick={onCancel} // 點擊時執行取消回調函數
            className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200"
          >
            停止追蹤
          </button>
        )}

        {/* 任務完成結果顯示 */}
        {progress.status === 'completed' && progress.result && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded"> {/* 完成結果容器 */}
            <div className="text-sm font-medium text-green-800 mb-2">完成結果:</div>
            <pre className="text-xs text-green-700 overflow-x-auto"> {/* 格式化顯示 JSON 結果 */}
              {JSON.stringify(progress.result, null, 2)} {/* 美化後的 JSON 格式 */}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};