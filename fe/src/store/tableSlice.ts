import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TableService } from '../services/TableService';
import { RTKData } from '../types/IRTKData';

// 表格類型定義
export type TableType = 'permission' | 'role' | 'roletopermission' | 'user' | 'usertorole' | 'RTK';

// 排序相關類型
export type SortOrder = 'asc' | 'desc';
export type SortField = 'id' | 'longitude' | 'latitude' | 'altitude' | 'timestamp';

// 表格狀態接口
interface TableState {
  // 當前活動的表格
  activeTable: TableType;
  
  // 各表格的數據
  rtkData: RTKData[];
  permissionData: any[];
  roleData: any[];
  userData: any[];
  roleToPermissionData: any[];
  userToRoleData: any[];
  
  // 加載狀態
  loading: {
    rtk: boolean;
    permission: boolean;
    role: boolean;
    user: boolean;
    roleToPermission: boolean;
    userToRole: boolean;
  };
  
  // 錯誤狀態
  error: {
    rtk: string | null;
    permission: string | null;
    role: string | null;
    user: string | null;
    roleToPermission: string | null;
    userToRole: string | null;
  };
  
  // RTK 排序狀態
  sorting: {
    field: SortField;
    order: SortOrder;
  };
  
  // 編輯模態框狀態
  editModal: {
    isOpen: boolean;
    tableType: TableType;
    editingItem: any | null;
  };
}

// 初始狀態
const initialState: TableState = {
  activeTable: 'RTK',
  rtkData: [],
  permissionData: [],
  roleData: [],
  userData: [],
  roleToPermissionData: [],
  userToRoleData: [],
  loading: {
    rtk: false,
    permission: false,
    role: false,
    user: false,
    roleToPermission: false,
    userToRole: false,
  },
  error: {
    rtk: null,
    permission: null,
    role: null,
    user: null,
    roleToPermission: null,
    userToRole: null,
  },
  sorting: {
    field: 'timestamp',
    order: 'desc',
  },
  editModal: {
    isOpen: false,
    tableType: 'RTK',
    editingItem: null,
  },
};

// 異步操作 - 加載 RTK 數據
export const loadRTKData = createAsyncThunk(
  'table/loadRTKData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await TableService.getTableData('RTK');
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load RTK data');
    }
  }
);

// 異步操作 - 加載權限數據
export const loadPermissionData = createAsyncThunk(
  'table/loadPermissionData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await TableService.getTableData('permission');
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load permission data');
    }
  }
);

// 異步操作 - 加載角色數據
export const loadRoleData = createAsyncThunk(
  'table/loadRoleData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await TableService.getTableData('role');
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load role data');
    }
  }
);

// 異步操作 - 加載用戶數據
export const loadUserData = createAsyncThunk(
  'table/loadUserData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await TableService.getTableData('user');
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load user data');
    }
  }
);

// 異步操作 - 加載角色到權限數據
export const loadRoleToPermissionData = createAsyncThunk(
  'table/loadRoleToPermissionData',
  async (_, { rejectWithValue }) => {
    try {
      const roles = await TableService.getRoles();
      if (roles.length > 0) {
        const data = await TableService.getRoleToPermission(roles[0].id);
        return data;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load role to permission data');
    }
  }
);

// 異步操作 - 加載用戶到角色數據
export const loadUserToRoleData = createAsyncThunk(
  'table/loadUserToRoleData',
  async (_, { rejectWithValue }) => {
    try {
      const users = await TableService.getUsers();
      if (users.length > 0) {
        const data = await TableService.getUserToRole(users[0].id);
        return data;
      }
      return [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load user to role data');
    }
  }
);

// 異步操作 - 更新 RTK 數據
export const updateRTKData = createAsyncThunk(
  'table/updateRTKData',
  async ({ id, data }: { id: string; data: Partial<RTKData> }, { rejectWithValue }) => {
    try {
      const response = await TableService.updateRTKData(id, data);
      if (response.success) {
        return { id, data };
      }
      return rejectWithValue(response.message || 'Update failed');
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update RTK data');
    }
  }
);

// 異步操作 - 更新權限數據
export const updatePermissionData = createAsyncThunk(
  'table/updatePermissionData',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await TableService.updatePermission(id, data);
      if (response.success) {
        return { id, data };
      }
      return rejectWithValue(response.message || 'Update failed');
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update permission data');
    }
  }
);

// 異步操作 - 更新角色數據
export const updateRoleData = createAsyncThunk(
  'table/updateRoleData',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await TableService.updateRole(id, data);
      if (response.success) {
        return { id, data };
      }
      return rejectWithValue(response.message || 'Update failed');
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update role data');
    }
  }
);

// 異步操作 - 更新用戶數據
export const updateUserData = createAsyncThunk(
  'table/updateUserData',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await TableService.updateUser(id, data);
      if (response.success) {
        return { id, data };
      }
      return rejectWithValue(response.message || 'Update failed');
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update user data');
    }
  }
);

const tableSlice = createSlice({
  name: 'table',
  initialState,
  reducers: {
    // 設置活動表格
    setActiveTable: (state, action: PayloadAction<TableType>) => {
      state.activeTable = action.payload;
    },
    
    // 設置 RTK 排序
    setRTKSorting: (state, action: PayloadAction<{ field: SortField; order: SortOrder }>) => {
      state.sorting = action.payload;
    },
    
    // 打開編輯模態框
    openEditModal: (state, action: PayloadAction<{ tableType: TableType; item: any }>) => {
      state.editModal = {
        isOpen: true,
        tableType: action.payload.tableType,
        editingItem: action.payload.item,
      };
    },
    
    // 關閉編輯模態框
    closeEditModal: (state) => {
      state.editModal = {
        isOpen: false,
        tableType: 'RTK',
        editingItem: null,
      };
    },
    
    // 更新編輯項目
    updateEditingItem: (state, action: PayloadAction<any>) => {
      state.editModal.editingItem = action.payload;
    },
    
    // 清除錯誤
    clearError: (state, action: PayloadAction<keyof TableState['error']>) => {
      state.error[action.payload] = null;
    },
  },
  extraReducers: (builder) => {
    // RTK 數據加載
    builder
      .addCase(loadRTKData.pending, (state) => {
        state.loading.rtk = true;
        state.error.rtk = null;
      })
      .addCase(loadRTKData.fulfilled, (state, action) => {
        state.loading.rtk = false;
        state.rtkData = action.payload;
      })
      .addCase(loadRTKData.rejected, (state, action) => {
        state.loading.rtk = false;
        state.error.rtk = action.payload as string;
      });
    
    // 權限數據加載
    builder
      .addCase(loadPermissionData.pending, (state) => {
        state.loading.permission = true;
        state.error.permission = null;
      })
      .addCase(loadPermissionData.fulfilled, (state, action) => {
        state.loading.permission = false;
        state.permissionData = action.payload;
      })
      .addCase(loadPermissionData.rejected, (state, action) => {
        state.loading.permission = false;
        state.error.permission = action.payload as string;
      });
    
    // 角色數據加載
    builder
      .addCase(loadRoleData.pending, (state) => {
        state.loading.role = true;
        state.error.role = null;
      })
      .addCase(loadRoleData.fulfilled, (state, action) => {
        state.loading.role = false;
        state.roleData = action.payload;
      })
      .addCase(loadRoleData.rejected, (state, action) => {
        state.loading.role = false;
        state.error.role = action.payload as string;
      });
    
    // 用戶數據加載
    builder
      .addCase(loadUserData.pending, (state) => {
        state.loading.user = true;
        state.error.user = null;
      })
      .addCase(loadUserData.fulfilled, (state, action) => {
        state.loading.user = false;
        state.userData = action.payload;
      })
      .addCase(loadUserData.rejected, (state, action) => {
        state.loading.user = false;
        state.error.user = action.payload as string;
      });
    
    // 角色到權限數據加載
    builder
      .addCase(loadRoleToPermissionData.pending, (state) => {
        state.loading.roleToPermission = true;
        state.error.roleToPermission = null;
      })
      .addCase(loadRoleToPermissionData.fulfilled, (state, action) => {
        state.loading.roleToPermission = false;
        state.roleToPermissionData = action.payload;
      })
      .addCase(loadRoleToPermissionData.rejected, (state, action) => {
        state.loading.roleToPermission = false;
        state.error.roleToPermission = action.payload as string;
      });
    
    // 用戶到角色數據加載
    builder
      .addCase(loadUserToRoleData.pending, (state) => {
        state.loading.userToRole = true;
        state.error.userToRole = null;
      })
      .addCase(loadUserToRoleData.fulfilled, (state, action) => {
        state.loading.userToRole = false;
        state.userToRoleData = action.payload;
      })
      .addCase(loadUserToRoleData.rejected, (state, action) => {
        state.loading.userToRole = false;
        state.error.userToRole = action.payload as string;
      });
    
    // RTK 數據更新
    builder
      .addCase(updateRTKData.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        const index = state.rtkData.findIndex(item => item.id === id);
        if (index !== -1) {
          state.rtkData[index] = { ...state.rtkData[index], ...data };
        }
      });
    
    // 權限數據更新
    builder
      .addCase(updatePermissionData.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        const index = state.permissionData.findIndex(item => item.id === id);
        if (index !== -1) {
          state.permissionData[index] = { ...state.permissionData[index], ...data };
        }
      });
    
    // 角色數據更新
    builder
      .addCase(updateRoleData.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        const index = state.roleData.findIndex(item => item.id === id);
        if (index !== -1) {
          state.roleData[index] = { ...state.roleData[index], ...data };
        }
      });
    
    // 用戶數據更新
    builder
      .addCase(updateUserData.fulfilled, (state, action) => {
        const { id, data } = action.payload;
        const index = state.userData.findIndex(item => item.id === id);
        if (index !== -1) {
          state.userData[index] = { ...state.userData[index], ...data };
        }
      });
  },
});

export const {
  setActiveTable,
  setRTKSorting,
  openEditModal,
  closeEditModal,
  updateEditingItem,
  clearError,
} = tableSlice.actions;

export default tableSlice.reducer;