/**
 * @fileoverview 表格管理 Redux slice - 處理多種表格數據的狀態管理
 * 
 * 這個文件包含了表格系統的完整狀態管理邏輯，包括：
 * - 多種表格類型的數據管理（RTK、權限、角色、用戶等）
 * - 表格數據的獲取、創建、更新和刪除
 * - 表格排序和篩選功能
 * - 編輯模態框的狀態管理
 * - 加載狀態和錯誤處理
 * 
 * @author AIOT Development Team
 * @since 2024
 */

// 引入 Redux Toolkit 的核心功能
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
// 引入表格服務，用於與後端 API 交互
import { TableService } from '../services/TableService';
// 引入 RTK 數據類型定義
import { RTKData } from '../types/IRTKData';

/**
 * 表格類型的聯合類型定義
 * 
 * @typedef {'permission' | 'role' | 'roletopermission' | 'user' | 'usertorole' | 'RTK'} TableType
 */
export type TableType = 'permission' | 'role' | 'roletopermission' | 'user' | 'usertorole' | 'RTK';

/**
 * 排序方向的聯合類型定義
 * 
 * @typedef {'asc' | 'desc'} SortOrder
 */
export type SortOrder = 'asc' | 'desc';

/**
 * 可排序欄位的聯合類型定義
 * 
 * @typedef {'id' | 'longitude' | 'latitude' | 'altitude' | 'timestamp'} SortField
 */
export type SortField = 'id' | 'longitude' | 'latitude' | 'altitude' | 'timestamp';

/**
 * 表格狀態的類型定義
 * 
 * @interface TableState
 * @property {TableType} activeTable - 當前活動的表格類型
 * @property {RTKData[]} rtkData - RTK 數據列表
 * @property {any[]} permissionData - 權限數據列表
 * @property {any[]} roleData - 角色數據列表
 * @property {any[]} userData - 用戶數據列表
 * @property {any[]} roleToPermissionData - 角色到權限的關聯數據
 * @property {any[]} userToRoleData - 用戶到角色的關聯數據
 * @property {object} loading - 各表格的加載狀態
 * @property {object} error - 各表格的錯誤狀態
 * @property {object} sorting - RTK 表格的排序設定
 * @property {object} editModal - 編輯模態框的狀態
 */
interface TableState {
  // 當前活動的表格類型
  activeTable: TableType;
  
  // 各表格的數據存儲
  rtkData: RTKData[];            // RTK 測站數據
  permissionData: any[];         // 權限數據
  roleData: any[];               // 角色數據
  userData: any[];               // 用戶數據
  roleToPermissionData: any[];   // 角色到權限的關聯數據
  userToRoleData: any[];         // 用戶到角色的關聯數據
  
  // 各表格的加載狀態管理
  loading: {
    rtk: boolean;                // RTK 數據加載狀態
    permission: boolean;         // 權限數據加載狀態
    role: boolean;               // 角色數據加載狀態
    user: boolean;               // 用戶數據加載狀態
    roleToPermission: boolean;   // 角色到權限關聯數據加載狀態
    userToRole: boolean;         // 用戶到角色關聯數據加載狀態
  };
  
  // 各表格的錯誤狀態管理
  error: {
    rtk: string | null;          // RTK 數據錯誤信息
    permission: string | null;   // 權限數據錯誤信息
    role: string | null;         // 角色數據錯誤信息
    user: string | null;         // 用戶數據錯誤信息
    roleToPermission: string | null;  // 角色到權限關聯數據錯誤信息
    userToRole: string | null;   // 用戶到角色關聯數據錯誤信息
  };
  
  // RTK 表格的排序狀態
  sorting: {
    field: SortField;            // 排序欄位
    order: SortOrder;            // 排序方向
  };
  
  // 編輯模態框的狀態管理
  editModal: {
    isOpen: boolean;             // 模態框是否開啟
    tableType: TableType;        // 正在編輯的表格類型
    editingItem: any | null;     // 正在編輯的項目數據
  };
}

/**
 * 表格狀態的初始值
 * 
 * @constant {TableState} initialState - 表格狀態的初始設定
 */
const initialState: TableState = {
  activeTable: 'RTK',           // 默認顯示 RTK 表格
  rtkData: [],                  // 初始化為空的 RTK 數據陣列
  permissionData: [],           // 初始化為空的權限數據陣列
  roleData: [],                 // 初始化為空的角色數據陣列
  userData: [],                 // 初始化為空的用戶數據陣列
  roleToPermissionData: [],     // 初始化為空的角色到權限關聯數據陣列
  userToRoleData: [],           // 初始化為空的用戶到角色關聯數據陣列
  loading: {
    rtk: false,                 // RTK 數據初始非加載狀態
    permission: false,          // 權限數據初始非加載狀態
    role: false,                // 角色數據初始非加載狀態
    user: false,                // 用戶數據初始非加載狀態
    roleToPermission: false,    // 角色到權限關聯數據初始非加載狀態
    userToRole: false,          // 用戶到角色關聯數據初始非加載狀態
  },
  error: {
    rtk: null,                  // RTK 數據初始無錯誤
    permission: null,           // 權限數據初始無錯誤
    role: null,                 // 角色數據初始無錯誤
    user: null,                 // 用戶數據初始無錯誤
    roleToPermission: null,     // 角色到權限關聯數據初始無錯誤
    userToRole: null,           // 用戶到角色關聯數據初始無錯誤
  },
  sorting: {
    field: 'timestamp',         // 默認按時間戳排序
    order: 'desc',              // 默認降序排列（最新的在前）
  },
  editModal: {
    isOpen: false,              // 編輯模態框初始關閉
    tableType: 'RTK',           // 默認編輯 RTK 表格
    editingItem: null,          // 初始無編輯項目
  },
};

/**
 * 異步 thunk - 加載 RTK 數據
 * 
 * 從後端 API 獲取 RTK 測站數據，包括座標、時間戳等信息。
 * 
 * @function loadRTKData
 * @param {void} _ - 無參數
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<RTKData[]>} 返回 RTK 數據陣列
 */
export const loadRTKData = createAsyncThunk(
  'table/loadRTKData',  // action 類型名稱
  async (_, { rejectWithValue }) => {
    try {
      // 調用表格服務獲取 RTK 數據
      const data = await TableService.getTableData('RTK');
      return data;
    } catch (error) {
      // 錯誤處理，返回錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load RTK data');
    }
  }
);

/**
 * 異步 thunk - 加載權限數據
 * 
 * 從後端 API 獲取系統權限數據，用於權限管理。
 * 
 * @function loadPermissionData
 * @param {void} _ - 無參數
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<any[]>} 返回權限數據陣列
 */
export const loadPermissionData = createAsyncThunk(
  'table/loadPermissionData',  // action 類型名稱
  async (_, { rejectWithValue }) => {
    try {
      // 調用表格服務獲取權限數據
      const data = await TableService.getTableData('permission');
      return data;
    } catch (error) {
      // 錯誤處理，返回錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load permission data');
    }
  }
);

/**
 * 異步 thunk - 加載角色數據
 * 
 * 從後端 API 獲取系統角色數據，用於角色管理。
 * 
 * @function loadRoleData
 * @param {void} _ - 無參數
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<any[]>} 返回角色數據陣列
 */
export const loadRoleData = createAsyncThunk(
  'table/loadRoleData',  // action 類型名稱
  async (_, { rejectWithValue }) => {
    try {
      // 調用表格服務獲取角色數據
      const data = await TableService.getTableData('role');
      return data;
    } catch (error) {
      // 錯誤處理，返回錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load role data');
    }
  }
);

/**
 * 異步 thunk - 加載用戶數據
 * 
 * 從後端 API 獲取系統用戶數據，用於用戶管理。
 * 
 * @function loadUserData
 * @param {void} _ - 無參數
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<any[]>} 返回用戶數據陣列
 */
export const loadUserData = createAsyncThunk(
  'table/loadUserData',  // action 類型名稱
  async (_, { rejectWithValue }) => {
    try {
      // 調用表格服務獲取用戶數據
      const data = await TableService.getTableData('user');
      return data;
    } catch (error) {
      // 錯誤處理，返回錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load user data');
    }
  }
);

/**
 * 異步 thunk - 加載角色到權限的關聯數據
 * 
 * 從後端 API 獲取角色與權限的關聯關係數據。
 * 首先獲取角色列表，然後獲取第一個角色的權限關聯數據。
 * 
 * @function loadRoleToPermissionData
 * @param {void} _ - 無參數
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<any[]>} 返回角色到權限的關聯數據陣列
 */
export const loadRoleToPermissionData = createAsyncThunk(
  'table/loadRoleToPermissionData',  // action 類型名稱
  async (_, { rejectWithValue }) => {
    try {
      // 首先獲取角色列表
      const roles = await TableService.getRoles();
      if (roles.length > 0) {
        // 如果有角色，獲取第一個角色的權限關聯數據
        const data = await TableService.getRoleToPermission(roles[0].id);
        return data;
      }
      // 如果沒有角色，返回空陣列
      return [];
    } catch (error) {
      // 錯誤處理，返回錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load role to permission data');
    }
  }
);

/**
 * 異步 thunk - 加載用戶到角色的關聯數據
 * 
 * 從後端 API 獲取用戶與角色的關聯關係數據。
 * 首先獲取用戶列表，然後獲取第一個用戶的角色關聯數據。
 * 
 * @function loadUserToRoleData
 * @param {void} _ - 無參數
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<any[]>} 返回用戶到角色的關聯數據陣列
 */
export const loadUserToRoleData = createAsyncThunk(
  'table/loadUserToRoleData',  // action 類型名稱
  async (_, { rejectWithValue }) => {
    try {
      // 首先獲取用戶列表
      const users = await TableService.getUsers();
      if (users.length > 0) {
        // 如果有用戶，獲取第一個用戶的角色關聯數據
        const data = await TableService.getUserToRole(users[0].id);
        return data;
      }
      // 如果沒有用戶，返回空陣列
      return [];
    } catch (error) {
      // 錯誤處理，返回錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load user to role data');
    }
  }
);

/**
 * 異步 thunk - 更新 RTK 數據
 * 
 * 向後端 API 發送更新 RTK 數據的請求。
 * 
 * @function updateRTKData
 * @param {object} params - 更新參數
 * @param {string} params.id - 要更新的 RTK 數據 ID
 * @param {Partial<RTKData>} params.data - 要更新的數據
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<{id: string, data: Partial<RTKData>}>} 返回更新的 ID 和數據
 */
export const updateRTKData = createAsyncThunk(
  'table/updateRTKData',  // action 類型名稱
  async ({ id, data }: { id: string; data: Partial<RTKData> }, { rejectWithValue }) => {
    try {
      // 調用表格服務更新 RTK 數據
      const response = await TableService.updateRTKData(id, data);
      if (response.success) {
        // 如果更新成功，返回 ID 和更新的數據
        return { id, data };
      }
      // 如果更新失敗，返回錯誤信息
      return rejectWithValue(response.message || 'Update failed');
    } catch (error) {
      // 錯誤處理，返回錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update RTK data');
    }
  }
);

/**
 * 異步 thunk - 更新權限數據
 * 
 * 向後端 API 發送更新權限數據的請求。
 * 
 * @function updatePermissionData
 * @param {object} params - 更新參數
 * @param {string} params.id - 要更新的權限數據 ID
 * @param {any} params.data - 要更新的數據
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<{id: string, data: any}>} 返回更新的 ID 和數據
 */
export const updatePermissionData = createAsyncThunk(
  'table/updatePermissionData',  // action 類型名稱
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      // 調用表格服務更新權限數據
      const response = await TableService.updatePermission(id, data);
      if (response.success) {
        // 如果更新成功，返回 ID 和更新的數據
        return { id, data };
      }
      // 如果更新失敗，返回錯誤信息
      return rejectWithValue(response.message || 'Update failed');
    } catch (error) {
      // 錯誤處理，返回錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update permission data');
    }
  }
);

/**
 * 異步 thunk - 更新角色數據
 * 
 * 向後端 API 發送更新角色數據的請求。
 * 
 * @function updateRoleData
 * @param {object} params - 更新參數
 * @param {string} params.id - 要更新的角色數據 ID
 * @param {any} params.data - 要更新的數據
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<{id: string, data: any}>} 返回更新的 ID 和數據
 */
export const updateRoleData = createAsyncThunk(
  'table/updateRoleData',  // action 類型名稱
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      // 調用表格服務更新角色數據
      const response = await TableService.updateRole(id, data);
      if (response.success) {
        // 如果更新成功，返回 ID 和更新的數據
        return { id, data };
      }
      // 如果更新失敗，返回錯誤信息
      return rejectWithValue(response.message || 'Update failed');
    } catch (error) {
      // 錯誤處理，返回錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update role data');
    }
  }
);

/**
 * 異步 thunk - 更新用戶數據
 * 
 * 向後端 API 發送更新用戶數據的請求。
 * 
 * @function updateUserData
 * @param {object} params - 更新參數
 * @param {string} params.id - 要更新的用戶數據 ID
 * @param {any} params.data - 要更新的數據
 * @param {AsyncThunkAPI} thunkAPI - thunk API 對象
 * @returns {Promise<{id: string, data: any}>} 返回更新的 ID 和數據
 */
export const updateUserData = createAsyncThunk(
  'table/updateUserData',  // action 類型名稱
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      // 調用表格服務更新用戶數據
      const response = await TableService.updateUser(id, data);
      if (response.success) {
        // 如果更新成功，返回 ID 和更新的數據
        return { id, data };
      }
      // 如果更新失敗，返回錯誤信息
      return rejectWithValue(response.message || 'Update failed');
    } catch (error) {
      // 錯誤處理，返回錯誤信息
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update user data');
    }
  }
);

/**
 * 表格管理的 Redux slice
 * 
 * 這個 slice 包含了表格系統的所有狀態管理邏輯，
 * 包括同步和異步操作的處理。
 * 
 * @constant {Slice} tableSlice - 表格管理的 Redux slice
 */
const tableSlice = createSlice({
  name: 'table',        // slice 的名稱，會作為 action type 的前綴
  initialState,         // 使用上面定義的初始狀態
  reducers: {
    /**
     * 同步 action - 設置活動表格
     * 
     * 切換當前顯示的表格類型，用於多表格切換的場景。
     * 
     * @function setActiveTable
     * @param {Draft<TableState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<TableType>} action - 包含表格類型的 action
     */
    setActiveTable: (state, action: PayloadAction<TableType>) => {
      // 更新當前活動的表格類型
      state.activeTable = action.payload;
    },
    
    /**
     * 同步 action - 設置 RTK 表格排序
     * 
     * 設置 RTK 表格的排序欄位和排序方向。
     * 
     * @function setRTKSorting
     * @param {Draft<TableState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<{field: SortField; order: SortOrder}>} action - 包含排序設定的 action
     */
    setRTKSorting: (state, action: PayloadAction<{ field: SortField; order: SortOrder }>) => {
      // 更新 RTK 表格的排序設定
      state.sorting = action.payload;
    },
    
    /**
     * 同步 action - 打開編輯模態框
     * 
     * 開啟編輯模態框並設置要編輯的表格類型和項目數據。
     * 
     * @function openEditModal
     * @param {Draft<TableState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<{tableType: TableType; item: any}>} action - 包含表格類型和編輯項目的 action
     */
    openEditModal: (state, action: PayloadAction<{ tableType: TableType; item: any }>) => {
      // 設置編輯模態框的狀態
      state.editModal = {
        isOpen: true,                           // 開啟模態框
        tableType: action.payload.tableType,    // 設置編輯的表格類型
        editingItem: action.payload.item,       // 設置要編輯的項目數據
      };
    },
    
    /**
     * 同步 action - 關閉編輯模態框
     * 
     * 關閉編輯模態框並重置相關狀態。
     * 
     * @function closeEditModal
     * @param {Draft<TableState>} state - 當前狀態（由 Immer 包裝）
     */
    closeEditModal: (state) => {
      // 重置編輯模態框的狀態
      state.editModal = {
        isOpen: false,        // 關閉模態框
        tableType: 'RTK',     // 重置為默認表格類型
        editingItem: null,    // 清除編輯項目
      };
    },
    
    /**
     * 同步 action - 更新編輯項目
     * 
     * 更新正在編輯的項目數據，通常用於表單輸入時的即時更新。
     * 
     * @function updateEditingItem
     * @param {Draft<TableState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<any>} action - 包含更新後項目數據的 action
     */
    updateEditingItem: (state, action: PayloadAction<any>) => {
      // 更新正在編輯的項目數據
      state.editModal.editingItem = action.payload;
    },
    
    /**
     * 同步 action - 清除特定表格的錯誤
     * 
     * 清除指定表格的錯誤信息，用於錯誤恢復。
     * 
     * @function clearError
     * @param {Draft<TableState>} state - 當前狀態（由 Immer 包裝）
     * @param {PayloadAction<keyof TableState['error']>} action - 包含要清除錯誤的表格類型的 action
     */
    clearError: (state, action: PayloadAction<keyof TableState['error']>) => {
      // 清除指定表格的錯誤信息
      state.error[action.payload] = null;
    },
  },
  /**
   * 處理異步 thunk 的額外 reducers
   * 
   * extraReducers 用於處理 createAsyncThunk 生成的 actions，
   * 包括 pending、fulfilled 和 rejected 三個狀態。
   * 
   * @param {ActionReducerMapBuilder<TableState>} builder - reducer 構建器
   */
  extraReducers: (builder) => {
    // 處理 RTK 數據加載的各個狀態
    builder
      /**
       * 處理 loadRTKData 的 pending 狀態
       * 當 RTK 數據加載開始時觸發
       */
      .addCase(loadRTKData.pending, (state) => {
        state.loading.rtk = true;     // 設置 RTK 加載狀態為 true
        state.error.rtk = null;       // 清除之前的錯誤信息
      })
      /**
       * 處理 loadRTKData 的 fulfilled 狀態
       * 當 RTK 數據加載成功完成時觸發
       */
      .addCase(loadRTKData.fulfilled, (state, action) => {
        state.loading.rtk = false;    // 設置 RTK 加載狀態為 false
        state.rtkData = action.payload; // 將獲取的 RTK 數據設置到狀態中
      })
      /**
       * 處理 loadRTKData 的 rejected 狀態
       * 當 RTK 數據加載失敗時觸發
       */
      .addCase(loadRTKData.rejected, (state, action) => {
        state.loading.rtk = false;    // 設置 RTK 加載狀態為 false
        state.error.rtk = action.payload as string; // 設置錯誤信息
      });
    
    // 處理權限數據加載的各個狀態
    builder
      /**
       * 處理 loadPermissionData 的 pending 狀態
       * 當權限數據加載開始時觸發
       */
      .addCase(loadPermissionData.pending, (state) => {
        state.loading.permission = true;  // 設置權限數據加載狀態為 true
        state.error.permission = null;    // 清除之前的錯誤信息
      })
      /**
       * 處理 loadPermissionData 的 fulfilled 狀態
       * 當權限數據加載成功完成時觸發
       */
      .addCase(loadPermissionData.fulfilled, (state, action) => {
        state.loading.permission = false; // 設置權限數據加載狀態為 false
        state.permissionData = action.payload; // 將獲取的權限數據設置到狀態中
      })
      /**
       * 處理 loadPermissionData 的 rejected 狀態
       * 當權限數據加載失敗時觸發
       */
      .addCase(loadPermissionData.rejected, (state, action) => {
        state.loading.permission = false; // 設置權限數據加載狀態為 false
        state.error.permission = action.payload as string; // 設置錯誤信息
      });
    
    // 處理角色數據加載的各個狀態
    builder
      /**
       * 處理 loadRoleData 的 pending 狀態
       * 當角色數據加載開始時觸發
       */
      .addCase(loadRoleData.pending, (state) => {
        state.loading.role = true;    // 設置角色數據加載狀態為 true
        state.error.role = null;      // 清除之前的錯誤信息
      })
      /**
       * 處理 loadRoleData 的 fulfilled 狀態
       * 當角色數據加載成功完成時觸發
       */
      .addCase(loadRoleData.fulfilled, (state, action) => {
        state.loading.role = false;   // 設置角色數據加載狀態為 false
        state.roleData = action.payload; // 將獲取的角色數據設置到狀態中
      })
      /**
       * 處理 loadRoleData 的 rejected 狀態
       * 當角色數據加載失敗時觸發
       */
      .addCase(loadRoleData.rejected, (state, action) => {
        state.loading.role = false;   // 設置角色數據加載狀態為 false
        state.error.role = action.payload as string; // 設置錯誤信息
      });
    
    // 處理用戶數據加載的各個狀態
    builder
      /**
       * 處理 loadUserData 的 pending 狀態
       * 當用戶數據加載開始時觸發
       */
      .addCase(loadUserData.pending, (state) => {
        state.loading.user = true;    // 設置用戶數據加載狀態為 true
        state.error.user = null;      // 清除之前的錯誤信息
      })
      /**
       * 處理 loadUserData 的 fulfilled 狀態
       * 當用戶數據加載成功完成時觸發
       */
      .addCase(loadUserData.fulfilled, (state, action) => {
        state.loading.user = false;   // 設置用戶數據加載狀態為 false
        state.userData = action.payload; // 將獲取的用戶數據設置到狀態中
      })
      /**
       * 處理 loadUserData 的 rejected 狀態
       * 當用戶數據加載失敗時觸發
       */
      .addCase(loadUserData.rejected, (state, action) => {
        state.loading.user = false;   // 設置用戶數據加載狀態為 false
        state.error.user = action.payload as string; // 設置錯誤信息
      });
    
    // 處理角色到權限關聯數據加載的各個狀態
    builder
      /**
       * 處理 loadRoleToPermissionData 的 pending 狀態
       * 當角色到權限關聯數據加載開始時觸發
       */
      .addCase(loadRoleToPermissionData.pending, (state) => {
        state.loading.roleToPermission = true;  // 設置角色到權限關聯數據加載狀態為 true
        state.error.roleToPermission = null;    // 清除之前的錯誤信息
      })
      /**
       * 處理 loadRoleToPermissionData 的 fulfilled 狀態
       * 當角色到權限關聯數據加載成功完成時觸發
       */
      .addCase(loadRoleToPermissionData.fulfilled, (state, action) => {
        state.loading.roleToPermission = false; // 設置角色到權限關聯數據加載狀態為 false
        state.roleToPermissionData = action.payload; // 將獲取的關聯數據設置到狀態中
      })
      /**
       * 處理 loadRoleToPermissionData 的 rejected 狀態
       * 當角色到權限關聯數據加載失敗時觸發
       */
      .addCase(loadRoleToPermissionData.rejected, (state, action) => {
        state.loading.roleToPermission = false; // 設置角色到權限關聯數據加載狀態為 false
        state.error.roleToPermission = action.payload as string; // 設置錯誤信息
      });
    
    // 處理用戶到角色關聯數據加載的各個狀態
    builder
      /**
       * 處理 loadUserToRoleData 的 pending 狀態
       * 當用戶到角色關聯數據加載開始時觸發
       */
      .addCase(loadUserToRoleData.pending, (state) => {
        state.loading.userToRole = true;  // 設置用戶到角色關聯數據加載狀態為 true
        state.error.userToRole = null;    // 清除之前的錯誤信息
      })
      /**
       * 處理 loadUserToRoleData 的 fulfilled 狀態
       * 當用戶到角色關聯數據加載成功完成時觸發
       */
      .addCase(loadUserToRoleData.fulfilled, (state, action) => {
        state.loading.userToRole = false; // 設置用戶到角色關聯數據加載狀態為 false
        state.userToRoleData = action.payload; // 將獲取的關聯數據設置到狀態中
      })
      /**
       * 處理 loadUserToRoleData 的 rejected 狀態
       * 當用戶到角色關聯數據加載失敗時觸發
       */
      .addCase(loadUserToRoleData.rejected, (state, action) => {
        state.loading.userToRole = false; // 設置用戶到角色關聯數據加載狀態為 false
        state.error.userToRole = action.payload as string; // 設置錯誤信息
      });
    
    // 處理 RTK 數據更新的成功狀態
    builder
      /**
       * 處理 updateRTKData 的 fulfilled 狀態
       * 當 RTK 數據更新成功完成時觸發
       */
      .addCase(updateRTKData.fulfilled, (state, action) => {
        const { id, data } = action.payload;  // 解構獲取更新的 ID 和數據
        // 在 RTK 數據陣列中查找要更新的項目索引
        const index = state.rtkData.findIndex(item => item.id === id);
        if (index !== -1) {
          // 如果找到項目，使用展開運算符合併原有數據和更新數據
          state.rtkData[index] = { ...state.rtkData[index], ...data };
        }
      });
    
    // 處理權限數據更新的成功狀態
    builder
      /**
       * 處理 updatePermissionData 的 fulfilled 狀態
       * 當權限數據更新成功完成時觸發
       */
      .addCase(updatePermissionData.fulfilled, (state, action) => {
        const { id, data } = action.payload;  // 解構獲取更新的 ID 和數據
        // 在權限數據陣列中查找要更新的項目索引
        const index = state.permissionData.findIndex(item => item.id === id);
        if (index !== -1) {
          // 如果找到項目，使用展開運算符合併原有數據和更新數據
          state.permissionData[index] = { ...state.permissionData[index], ...data };
        }
      });
    
    // 處理角色數據更新的成功狀態
    builder
      /**
       * 處理 updateRoleData 的 fulfilled 狀態
       * 當角色數據更新成功完成時觸發
       */
      .addCase(updateRoleData.fulfilled, (state, action) => {
        const { id, data } = action.payload;  // 解構獲取更新的 ID 和數據
        // 在角色數據陣列中查找要更新的項目索引
        const index = state.roleData.findIndex(item => item.id === id);
        if (index !== -1) {
          // 如果找到項目，使用展開運算符合併原有數據和更新數據
          state.roleData[index] = { ...state.roleData[index], ...data };
        }
      });
    
    // 處理用戶數據更新的成功狀態
    builder
      /**
       * 處理 updateUserData 的 fulfilled 狀態
       * 當用戶數據更新成功完成時觸發
       */
      .addCase(updateUserData.fulfilled, (state, action) => {
        const { id, data } = action.payload;  // 解構獲取更新的 ID 和數據
        // 在用戶數據陣列中查找要更新的項目索引
        const index = state.userData.findIndex(item => item.id === id);
        if (index !== -1) {
          // 如果找到項目，使用展開運算符合併原有數據和更新數據
          state.userData[index] = { ...state.userData[index], ...data };
        }
      });
  },
});

/**
 * 導出同步 actions
 * 
 * 這些 action creators 由 createSlice 自動生成，
 * 可以直接在組件中使用來觸發狀態更新。
 */
export const {
  setActiveTable,      // 設置活動表格
  setRTKSorting,       // 設置 RTK 排序
  openEditModal,       // 打開編輯模態框
  closeEditModal,      // 關閉編輯模態框
  updateEditingItem,   // 更新編輯項目
  clearError,          // 清除錯誤
} = tableSlice.actions;

/**
 * 導出 reducer
 * 
 * 這個 reducer 會被包含在 store 的配置中，
 * 用於處理所有與表格相關的狀態更新。
 */
export default tableSlice.reducer;