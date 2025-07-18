/**
 * @fileoverview 通知管理 Redux slice - 處理應用通知系統的狀態管理
 * 
 * 這個文件包含了通知系統的完整狀態管理邏輯，包括：
 * - 通知的添加、移除和清空
 * - 通知的自動移除功能（帶動畫效果）
 * - 通知狀態的管理
 * - 詳細的 Redux Toolkit 使用說明和註解
 * 
 * @author AIOT Development Team
 * @since 2024
 */

// 引入 Redux Toolkit 的核心功能
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * 通知項目的類型定義
 * 
 * @interface Notification
 * @property {string} id - 通知的唯一標識符
 * @property {'success' | 'error'} type - 通知類型（成功或錯誤）
 * @property {string} message - 通知內容
 * @property {number} timestamp - 通知創建時間戳
 * @property {boolean} [isRemoving] - 可選，是否正在移除（用於動畫效果）
 */
export interface Notification {
  id: string;                    // 通知的唯一標識符
  type: 'success' | 'error';     // 通知類型：成功或錯誤
  message: string;               // 通知顯示的文本內容
  timestamp: number;             // 通知創建時的時間戳
  isRemoving?: boolean;          // 可選屬性，標記是否正在移除（觸發動畫）
}

/**
 * 通知狀態的類型定義
 * 
 * @interface NotificationState
 * @property {Notification[]} notifications - 通知列表數組
 */
interface NotificationState {
  notifications: Notification[];  // 存儲所有通知的數組
}

/**
 * 通知狀態的初始值
 * 
 * @constant {NotificationState} initialState - 通知狀態的初始設定
 */
const initialState: NotificationState = {
  notifications: [],  // 初始化為空的通知數組
};

/**
 * 異步 thunk - 添加通知並自動移除
 * 
 * 這個 thunk 函數展示了 Redux Toolkit 處理異步邏輯的完整機制：
 * 
 * ## Thunk 的作用：
 * - Thunk 是 Redux Toolkit 處理異步邏輯的機制
 * - 它允許我們在 action 中執行異步操作（如 API 呼叫、定時器等）
 * - 普通的 reducer 只能處理同步邏輯，不能包含異步操作
 * 
 * ## 為什麼不放在 slice 裡面？
 * - slice 的 reducers 必須是純函數（pure function），不能有副作用
 * - setTimeout 是副作用，會造成不可預測的結果
 * - Thunk 專門用來處理這種包含副作用的異步邏輯
 * 
 * ## createAsyncThunk 的語法說明：
 * - 第一個參數：action 的 type 名稱
 * - 第二個參數：異步函數，接收 payload 和 thunk API
 *   - payload: { type, message } - 呼叫時傳入的參數
 *   - thunkAPI: { dispatch, getState, ... } - Redux 的工具函數
 * 
 * @function addNotificationWithAutoRemove
 * @param {object} params - 通知參數
 * @param {'success' | 'error'} params.type - 通知類型
 * @param {string} params.message - 通知內容
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象，包含 dispatch 等方法
 * @returns {Promise<string>} 返回通知 ID
 */
export const addNotificationWithAutoRemove = createAsyncThunk(
  'notifications/addNotificationWithAutoRemove',  // action 類型名稱
  async ({ type, message }: { type: 'success' | 'error'; message: string }, { dispatch }) => {
    // 生成唯一 ID，使用時間戳和隨機數確保唯一性
    const notificationId = `notification-${Date.now()}-${Math.random()}`;
    
    // 立即添加通知到 store（這裡呼叫同步的 reducer action）
    dispatch(addNotification({ type, message, id: notificationId }));
    
    // 設定定時器，1秒後自動移除通知（這是副作用，必須在 thunk 中處理）
    // 就是這一步是關鍵 因為他是async 所以就必須使用thunk
    // thunk 除了 side effect, 也處理async
    setTimeout(() => {
      // 先標記為正在移除，觸發動畫效果
      dispatch(startRemoveNotification(notificationId));
      // 等待動畫完成後再真正移除
      setTimeout(() => {
        dispatch(removeNotification(notificationId));
      }, 300); // 配合 CSS 動畫時間
    }, 1000);
    
    // 回傳 notification ID（這會成為 fulfilled action 的 payload）
    return notificationId;
  }
);

/**
 * 通知管理的 Redux slice
 * 
 * ## Action 的概念說明：
 * - Action 是描述「發生了什麼事」的純 JavaScript 物件
 * - 每個 action 都有一個 type 屬性，用來識別 action 的類型
 * - Action 可以攜帶額外資料（payload）
 * 
 * ## 例如，當你呼叫 addNotification({ type: 'success', message: 'Hello' }) 時：
 * Redux 會自動產生這樣的 action 物件：
 * ```javascript
 * {
 *   type: 'notifications/addNotification',  // 自動產生的 type
 *   payload: { type: 'success', message: 'Hello' }  // 你傳入的資料
 * }
 * ```
 * 
 * ## createSlice 的魔法：
 * - 你不需要手動 declare action，createSlice 會自動幫你產生
 * - 每個 reducer 函數的名稱就會變成 action creator 的名稱
 * - Redux Toolkit 會自動產生 action type 和 action creator 函數
 * 
 * @constant {Slice} notificationSlice - 通知管理的 Redux slice
 */
const notificationSlice = createSlice({
  name: 'notifications',  // 這會成為 action type 的前綴
  initialState,           // 使用上面定義的初始狀態
  reducers: {
    /**
     * 同步 action - 添加通知
     * 
     * 這個函數會自動產生：
     * 1. Action type: 'notifications/addNotification'
     * 2. Action creator: addNotification(payload)
     * 
     * @function addNotification
     * @param {Draft<NotificationState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<{type: 'success' | 'error'; message: string; id?: string}>} action - 包含通知數據的 action
     */
    addNotification: (state, action: PayloadAction<{ type: 'success' | 'error'; message: string; id?: string }>) => {
      // action.payload 就是你呼叫 addNotification(data) 時傳入的 data
      const { type, message, id } = action.payload;
      const newNotification: Notification = {
        id: id || `notification-${Date.now()}-${Math.random()}`,  // 使用傳入的 ID 或生成新的
        type,                                                      // 通知類型
        message,                                                   // 通知內容
        timestamp: Date.now(),                                     // 創建時間戳
      };
      // 將新通知添加到狀態中的通知列表
      state.notifications.push(newNotification);
    },
    
    /**
     * 同步 action - 移除通知
     * 
     * 自動產生：
     * - Action type: 'notifications/removeNotification'
     * - Action creator: removeNotification(id)
     * 
     * @function removeNotification
     * @param {Draft<NotificationState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<string>} action - 包含通知 ID 的 action
     */
    removeNotification: (state, action: PayloadAction<string>) => {
      // action.payload 就是傳入的 notification ID
      // 過濾掉指定 ID 的通知
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    /**
     * 同步 action - 清除所有通知
     * 
     * 自動產生：
     * - Action type: 'notifications/clearAllNotifications'  
     * - Action creator: clearAllNotifications()
     * 
     * @function clearAllNotifications
     * @param {Draft<NotificationState>} state - 當前狀態（由 Immer 包裝）
     */
    clearAllNotifications: (state) => {
      // 這個 action 不需要 payload，所以沒有 action 參數
      // 清空所有通知
      state.notifications = [];
    },
    
    /**
     * 同步 action - 標記通知為正在移除狀態
     * 
     * 這個 action 用於觸發通知的移除動畫效果。
     * 
     * @function startRemoveNotification
     * @param {Draft<NotificationState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<string>} action - 包含通知 ID 的 action
     */
    startRemoveNotification: (state, action: PayloadAction<string>) => {
      // 查找指定 ID 的通知
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        // 標記該通知為正在移除狀態，觸發動畫
        notification.isRemoving = true;
      }
    },
  },
});

/**
 * Redux Toolkit 的智能之處：
 * 
 * ## 類型推斷的優勢：
 * - 你不需要手動定義 action creator 的類型
 * - TypeScript 會從 reducer 的 PayloadAction 自動推斷出類型
 * - createSlice 會自動產生對應的 action creator 函數
 * 
 * ## 所以這些 action creator 的類型都是自動推斷的：
 * - addNotification 的參數類型來自 reducer 中的 PayloadAction<{...}>
 * - removeNotification 的參數類型來自 PayloadAction<string>
 * - clearAllNotifications 沒有參數因為 reducer 沒有 action 參數
 */

/**
 * 導出同步 actions
 * 
 * 這些 action creators 由 createSlice 自動生成，
 * 可以直接在組件中使用來觸發狀態更新。
 */
export const { addNotification, removeNotification, clearAllNotifications, startRemoveNotification } = notificationSlice.actions;

// addNotificationWithAutoRemove 已經在上面使用 export 導出了
// createAsyncThunk 也會自動推斷類型，不需要手動定義

/**
 * 為了向後兼容，創建一個簡化的 API 別名
 * 
 * @constant {AsyncThunk} addNotificationAuto - addNotificationWithAutoRemove 的別名
 */
export const addNotificationAuto = addNotificationWithAutoRemove;

/**
 * 導出 reducer
 * 
 * 這個 reducer 會被包含在 store 的配置中，
 * 用於處理所有與通知相關的狀態更新。
 */
export default notificationSlice.reducer;

/**
 * Selectors - 用於從 Redux store 中選擇特定的狀態數據
 * 
 * 這些選擇器函數提供了一種類型安全的方式來訪問通知狀態，
 * 並可以在組件中與 useSelector hook 一起使用。
 * TypeScript 也會自動推斷參數和回傳值類型。
 */

/**
 * 選擇所有通知
 * 
 * @function selectNotifications
 * @param {object} state - 包含 notifications 屬性的根狀態
 * @returns {Notification[]} 通知列表數組
 */
export const selectNotifications = (state: { notifications: NotificationState }) => 
  state.notifications.notifications;