import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

// 通知項目介面
export interface Notification {
  id: string;
  type: 'success' | 'error';
  message: string;
  timestamp: number;
  isRemoving?: boolean;
}

// 通知狀態介面
interface NotificationState {
  notifications: Notification[];
}

// 初始狀態
const initialState: NotificationState = {
  notifications: [],
};

/**
 * Thunk 是什麼？
 * - Thunk 是 Redux Toolkit 處理異步邏輯的機制
 * - 它允許我們在 action 中執行異步操作（如 API 呼叫、定時器等）
 * - 普通的 reducer 只能處理同步邏輯，不能包含異步操作
 * 
 * 為什麼不放在 slice 裡面？
 * - slice 的 reducers 必須是純函數（pure function），不能有副作用
 * - setTimeout 是副作用，會造成不可預測的結果
 * - Thunk 專門用來處理這種包含副作用的異步邏輯
 * 
 * createAsyncThunk 的語法說明：
 * - 第一個參數：action 的 type 名稱
 * - 第二個參數：異步函數，接收 payload 和 thunk API
 *   - payload: { type, message } - 呼叫時傳入的參數
 *   - thunkAPI: { dispatch, getState, ... } - Redux 的工具函數
 */
export const addNotificationWithAutoRemove = createAsyncThunk(
  'notifications/addNotificationWithAutoRemove',
  async ({ type, message }: { type: 'success' | 'error'; message: string }, { dispatch }) => {
    // 生成唯一 ID
    const notificationId = `notification-${Date.now()}-${Math.random()}`;
    
    // 立即添加通知到 store（這裡呼叫同步的 reducer action）
    dispatch(addNotification({ type, message, id: notificationId }));
    
    // 設定定時器，5秒後自動移除通知（這是副作用，必須在 thunk 中處理）
    // 就是這一步是關鍵 因為他是async 所以就必須使用thunk
    // thunk 除了 side effect, 也處理async
    setTimeout(() => {
      // 先標記為正在移除，觸發動畫
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
 * Action 到底是什麼？
 * - Action 是描述「發生了什麼事」的純 JavaScript 物件
 * - 每個 action 都有一個 type 屬性，用來識別 action 的類型
 * - Action 可以攜帶額外資料（payload）
 * 
 * 例如，當你呼叫 addNotification({ type: 'success', message: 'Hello' }) 時：
 * Redux 會自動產生這樣的 action 物件：
 * {
 *   type: 'notifications/addNotification',  // 自動產生的 type
 *   payload: { type: 'success', message: 'Hello' }  // 你傳入的資料
 * }
 * 
 * createSlice 的魔法：
 * - 你不需要手動 declare action，createSlice 會自動幫你產生
 * - 每個 reducer 函數的名稱就會變成 action creator 的名稱
 * - Redux Toolkit 會自動產生 action type 和 action creator 函數
 */
const notificationSlice = createSlice({
  name: 'notifications',  // 這會成為 action type 的前綴
  initialState,
  reducers: {
    // 這個函數會自動產生：
    // 1. Action type: 'notifications/addNotification'
    // 2. Action creator: addNotification(payload)
    addNotification: (state, action: PayloadAction<{ type: 'success' | 'error'; message: string; id?: string }>) => {
      // action.payload 就是你呼叫 addNotification(data) 時傳入的 data
      const { type, message, id } = action.payload;
      const newNotification: Notification = {
        id: id || `notification-${Date.now()}-${Math.random()}`,
        type,
        message,
        timestamp: Date.now(),
      };
      state.notifications.push(newNotification);
    },
    
    // 自動產生：
    // Action type: 'notifications/removeNotification'
    // Action creator: removeNotification(id)
    removeNotification: (state, action: PayloadAction<string>) => {
      // action.payload 就是傳入的 notification ID
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    
    // 自動產生：
    // Action type: 'notifications/clearAllNotifications'  
    // Action creator: clearAllNotifications()
    clearAllNotifications: (state) => {
      // 這個 action 不需要 payload，所以沒有 action 參數
      state.notifications = [];
    },
    
    // 標記通知為正在移除狀態，觸發動畫
    startRemoveNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.isRemoving = true;
      }
    },
  },
});

/**
 * Redux Toolkit 的智能之處：
 * - 你不需要手動定義 action creator 的類型
 * - TypeScript 會從 reducer 的 PayloadAction 自動推斷出類型
 * - createSlice 會自動產生對應的 action creator 函數
 * 
 * 所以這些 action creator 的類型都是自動推斷的：
 * - addNotification 的參數類型來自 reducer 中的 PayloadAction<{...}>
 * - removeNotification 的參數類型來自 PayloadAction<string>
 * - clearAllNotifications 沒有參數因為 reducer 沒有 action 參數
 */
export const { addNotification, removeNotification, clearAllNotifications, startRemoveNotification } = notificationSlice.actions;

// addNotificationWithAutoRemove 已經在上面使用 export 導出了
// createAsyncThunk 也會自動推斷類型，不需要手動定義

// 為了向後兼容，創建一個簡化的 API
export const addNotificationAuto = addNotificationWithAutoRemove;

// 導出 reducer
export default notificationSlice.reducer;

// Selectors - TypeScript 也會自動推斷參數和回傳值類型
export const selectNotifications = (state: { notifications: NotificationState }) => 
  state.notifications.notifications;