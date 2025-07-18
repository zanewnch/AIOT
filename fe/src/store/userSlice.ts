/**
 * @fileoverview 用戶管理 Redux slice - 處理用戶相關的狀態管理
 * 
 * 這個文件包含了用戶管理的完整狀態管理邏輯，包括：
 * - 用戶列表的獲取和管理
 * - 用戶的創建、更新和刪除
 * - 異步操作的加載狀態和錯誤處理
 * 
 * @author AIOT Development Team
 * @since 2024
 */

// 引入 Redux Toolkit 的核心功能
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

/**
 * 用戶數據的類型定義
 * 
 * @interface User
 * @property {number} id - 用戶的唯一標識符
 * @property {string} name - 用戶姓名
 * @property {string} email - 用戶電子郵件地址
 */
export interface User {
  id: number;        // 用戶 ID，作為唯一標識符
  name: string;      // 用戶姓名
  email: string;     // 用戶電子郵件地址
}

/**
 * 用戶狀態的類型定義
 * 
 * @interface UserState
 * @property {User[]} users - 用戶列表數組
 * @property {boolean} loading - 加載狀態標誌
 * @property {string | null} error - 錯誤信息，無錯誤時為 null
 */
interface UserState {
  users: User[];          // 存儲所有用戶的數組
  loading: boolean;       // 指示是否正在進行異步操作
  error: string | null;   // 存儲錯誤信息，無錯誤時為 null
}

/**
 * 用戶狀態的初始值
 * 
 * @constant {UserState} initialState - 用戶狀態的初始設定
 */
const initialState: UserState = {
  users: [],       // 初始化為空數組
  loading: false,  // 初始加載狀態為 false
  error: null,     // 初始錯誤為 null
};

/**
 * 異步 thunk - 從伺服器獲取用戶列表
 * 
 * 這個異步操作會發送 GET 請求到 /api/users 端點，
 * 獲取所有用戶的列表數據。
 * 
 * @function fetchUsers
 * @returns {Promise<User[]>} 返回包含用戶列表的 Promise
 * @throws {Error} 當 API 請求失敗時拋出錯誤
 */
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',  // action 類型名稱
  async () => {
    // 發送 GET 請求到用戶 API 端點
    const response = await fetch('/api/users');
    
    // 檢查響應狀態，如果不是成功狀態則拋出錯誤
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    // 解析響應的 JSON 數據並返回
    return response.json();
  }
);

/**
 * 異步 thunk - 創建新用戶
 * 
 * 這個異步操作會發送 POST 請求到 /api/users 端點，
 * 創建一個新的用戶記錄。
 * 
 * @function createUser
 * @param {Omit<User, 'id'>} userData - 要創建的用戶數據（不包含 id）
 * @returns {Promise<User>} 返回創建成功的用戶數據
 * @throws {Error} 當 API 請求失敗時拋出錯誤
 */
export const createUser = createAsyncThunk(
  'user/createUser',  // action 類型名稱
  async (userData: Omit<User, 'id'>) => {
    // 發送 POST 請求到用戶 API 端點
    const response = await fetch('/api/users', {
      method: 'POST',                           // 使用 POST 方法
      headers: {
        'Content-Type': 'application/json',     // 設置內容類型為 JSON
      },
      body: JSON.stringify(userData),           // 將用戶數據轉換為 JSON 字符串
    });
    
    // 檢查響應狀態，如果不是成功狀態則拋出錯誤
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    
    // 解析響應的 JSON 數據並返回新創建的用戶
    return response.json();
  }
);

/**
 * 用戶管理的 Redux slice
 * 
 * 這個 slice 包含了用戶管理的所有同步和異步操作的處理邏輯。
 * 使用 Redux Toolkit 的 createSlice 來簡化 reducer 的編寫。
 * 
 * @constant {Slice} userSlice - 用戶管理的 Redux slice
 */
const userSlice = createSlice({
  name: 'user',          // slice 的名稱，會作為 action type 的前綴
  initialState,          // 使用上面定義的初始狀態
  reducers: {
    /**
     * 同步 action - 添加用戶到本地狀態
     * 
     * @function addUser
     * @param {Draft<UserState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<User>} action - 包含用戶數據的 action
     */
    addUser: (state, action: PayloadAction<User>) => {
      // 直接修改狀態（Immer 會處理不可變性）
      state.users.push(action.payload);
    },
    
    /**
     * 同步 action - 根據用戶 ID 刪除用戶
     * 
     * @function removeUser
     * @param {Draft<UserState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<number>} action - 包含用戶 ID 的 action
     */
    removeUser: (state, action: PayloadAction<number>) => {
      // 過濾掉指定 ID 的用戶
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    
    /**
     * 同步 action - 更新用戶信息
     * 
     * @function updateUser
     * @param {Draft<UserState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<User>} action - 包含更新後用戶數據的 action
     */
    updateUser: (state, action: PayloadAction<User>) => {
      // 根據 ID 查找用戶在數組中的索引
      const index = state.users.findIndex(user => user.id === action.payload.id);
      
      // 如果找到用戶，則更新該用戶的信息
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    
    /**
     * 同步 action - 清除錯誤信息
     * 
     * @function clearError
     * @param {Draft<UserState>} state - 當前狀態（由 Immer 包裝）
     */
    clearError: (state) => {
      // 將錯誤狀態重置為 null
      state.error = null;
    },
  },
  
  /**
   * 處理異步 thunk 的額外 reducers
   * 
   * extraReducers 用於處理在其他地方定義的 actions，
   * 主要用於處理 createAsyncThunk 生成的 actions。
   * 
   * @param {ActionReducerMapBuilder<UserState>} builder - reducer 構建器
   */
  extraReducers: (builder) => {
    // 處理 fetchUsers 異步操作的各個狀態
    builder
      /**
       * 處理 fetchUsers 的 pending 狀態
       * 當異步操作開始時觸發
       */
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;    // 設置加載狀態為 true
        state.error = null;      // 清除之前的錯誤信息
      })
      /**
       * 處理 fetchUsers 的 fulfilled 狀態
       * 當異步操作成功完成時觸發
       */
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        state.users = action.payload; // 將獲取的用戶列表設置到狀態中
      })
      /**
       * 處理 fetchUsers 的 rejected 狀態
       * 當異步操作失敗時觸發
       */
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        // 設置錯誤信息，使用 action.error.message 或默認錯誤信息
        state.error = action.error.message || 'Failed to fetch users';
      });

    // 處理 createUser 異步操作的各個狀態
    builder
      /**
       * 處理 createUser 的 pending 狀態
       * 當創建用戶操作開始時觸發
       */
      .addCase(createUser.pending, (state) => {
        state.loading = true;    // 設置加載狀態為 true
        state.error = null;      // 清除之前的錯誤信息
      })
      /**
       * 處理 createUser 的 fulfilled 狀態
       * 當創建用戶操作成功完成時觸發
       */
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        state.users.push(action.payload); // 將新創建的用戶添加到用戶列表中
      })
      /**
       * 處理 createUser 的 rejected 狀態
       * 當創建用戶操作失敗時觸發
       */
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;   // 設置加載狀態為 false
        // 設置錯誤信息，使用 action.error.message 或默認錯誤信息
        state.error = action.error.message || 'Failed to create user';
      });
  },
});

/**
 * 導出同步 actions
 * 
 * 這些 action creators 由 createSlice 自動生成，
 * 可以直接在組件中使用來觸發狀態更新。
 */
export const { addUser, removeUser, updateUser, clearError } = userSlice.actions;

/**
 * 導出 reducer
 * 
 * 這個 reducer 會被包含在 store 的配置中，
 * 用於處理所有與用戶相關的狀態更新。
 */
export default userSlice.reducer;