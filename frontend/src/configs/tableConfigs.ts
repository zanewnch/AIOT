/**
 * @fileoverview 表格配置文件
 * 
 * 統一的表格配置，用於驅動 GenericTableViewer 組件
 * 包含所有表格類型的列定義、數據處理、編輯功能等配置
 * 
 * @author AIOT 開發團隊
 * @since 2024-01-01
 */

import { TableType } from '../stores/tableStore';

// 導入所有需要的 Query hooks
import { PermissionQuery } from '../hooks/usePermissionQuery';
import { RoleQuery } from '../hooks/useRoleQuery';
import { UserQuery } from '../hooks/useUserQuery';
import { DronePositionQuery } from '../hooks/useDronePositionQuery';
import { DroneStatusQuery } from '../hooks/useDroneStatusQuery';
import { DroneCommandQuery } from '../hooks/useDroneCommandQuery';
import { UserPreferenceQuery } from '../hooks/useUserPreferenceQuery';
import { ArchiveTaskQuery } from '../hooks/useArchiveTaskQuery';
import { DronePositionsArchiveQuery } from '../hooks/useDronePositionsArchiveQuery';
import { DroneStatusArchiveQuery } from '../hooks/useDroneStatusArchiveQuery';
import { useGetAllCommandsArchive } from '../hooks/useDroneCommandArchiveQuery';
import droneCommandArchiveQuery from '../hooks/useDroneCommandArchiveQuery';

/**
 * 列配置接口
 */
export interface ColumnConfig {
  /** 列的鍵名 */
  key: string;
  /** 顯示標題 */
  title: string;
  /** 是否可排序 */
  sortable?: boolean;
  /** 自定義格式化函數 */
  formatter?: (value: any, row: any) => string;
  /** 列寬度 */
  width?: string;
  /** 是否在編輯模式中隱藏 */
  hideInEdit?: boolean;
}

/**
 * 表格配置接口
 */
export interface TableConfig<T = any> {
  /** 表格標識 */
  type: TableType;
  /** 表格顯示名稱 */
  title: string;
  /** 列配置 */
  columns: ColumnConfig[];
  /** 數據獲取函數 */
  useData: () => {
    data: T[] | undefined;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };
  /** 是否支持編輯功能 */
  hasEdit?: boolean;
  /** 是否支持快速操作（如狀態切換） */
  hasQuickActions?: boolean;
  /** 更新數據的 mutation - 必須始終提供，即使返回 null */
  useUpdateMutation: () => any;
  /** 自定義行操作 */
  customActions?: Array<{
    label: string;
    onClick: (row: T) => void;
    className?: string;
  }>;
  /** 是否懒加載 */
  isLazy?: boolean;
  /** 數據為空時的提示文字 */
  emptyText?: string;
}

/**
 * 通用格式化函數
 */
export const formatters = {
  /** 日期時間格式化 */
  datetime: (value: string) => {
    if (!value) return '-';
    try {
      return new Date(value).toLocaleString('zh-TW');
    } catch {
      return value;
    }
  },

  /** 布林值格式化 */
  boolean: (value: boolean) => value ? '是' : '否',

  /** 狀態格式化 */
  status: (value: boolean) => value ? '啟用' : '停用',

  /** 數字格式化 */
  number: (value: number) => value?.toLocaleString() || '-',

  /** 座標格式化 */
  coordinate: (value: number) => typeof value === 'number' ? value.toFixed(6) : value,

  /** 高度格式化 */
  altitude: (value: number) => typeof value === 'number' ? `${value.toFixed(2)}m` : value,

  /** 速度格式化 */
  speed: (value: number) => typeof value === 'number' ? `${value.toFixed(2)}m/s` : value,

  /** 角度格式化 */
  heading: (value: number) => typeof value === 'number' ? `${value.toFixed(1)}°` : value,

  /** 電池電量格式化 */
  battery: (value: number) => typeof value === 'number' ? `${value}%` : value,

  /** 信號強度格式化 */
  signal: (value: number) => typeof value === 'number' ? `${Math.round(value)}dBm` : value,

  /** 溫度格式化 */
  temperature: (value: number) => typeof value === 'number' ? `${value.toFixed(1)}°C` : value,

  /** 濕度格式化 */
  humidity: (value: number) => typeof value === 'number' ? `${value.toFixed(1)}%` : value,

  /** 飛行狀態中文化 */
  flightStatus: (value: string) => {
    const statusMap: Record<string, string> = {
      'grounded': '待機',
      'taking_off': '起飛中',
      'hovering': '懸停',
      'flying': '飛行中',
      'landing': '降落中',
      'emergency': '緊急狀態',
      'maintenance': '維護中'
    };
    return statusMap[value] || value;
  },

  /** GPS 狀態中文化 */
  gpsStatus: (value: string) => {
    const gpsStatusMap: Record<string, string> = {
      'no_fix': '無信號',
      '2d_fix': '2D定位',
      '3d_fix': '3D定位',
      'dgps': 'DGPS',
      'rtk': 'RTK'
    };
    return gpsStatusMap[value] || value;
  },

  /** 指令狀態中文化 */
  commandStatus: (value: string) => {
    const statusMap: Record<string, string> = {
      'pending': '待執行',
      'executing': '執行中',
      'completed': '已完成',
      'failed': '執行失敗',
      'cancelled': '已取消'
    };
    return statusMap[value] || value;
  },

  /** 指令類型中文化 */
  commandType: (value: string) => {
    const typeMap: Record<string, string> = {
      'takeoff': '起飛',
      'land': '降落',
      'move': '移動',
      'hover': '懸停',
      'return': '返航',
      'moveForward': '前進',
      'moveBackward': '後退',
      'moveLeft': '左移',
      'moveRight': '右移',
      'rotateLeft': '左轉',
      'rotateRight': '右轉',
      'emergency': '緊急停止'
    };
    return typeMap[value] || value;
  },

  /** 主題設定中文化 */
  theme: (value: string) => {
    const themeMap: Record<string, string> = {
      'light': '淺色主題',
      'dark': '深色主題',
      'auto': '自動調整'
    };
    return themeMap[value] || value;
  },

  /** 時間格式中文化 */
  timeFormat: (value: string) => {
    const timeFormatMap: Record<string, string> = {
      '12h': '12小時制',
      '24h': '24小時制'
    };
    return timeFormatMap[value] || value;
  },

  /** 語言設定中文化 */
  language: (value: string) => {
    const languageMap: Record<string, string> = {
      'zh-TW': '繁體中文',
      'zh-CN': '簡體中文',
      'en-US': '英文 (美國)',
      'ja-JP': '日文',
      'ko-KR': '韓文'
    };
    return languageMap[value] || value;
  },

  /** JSON 物件格式化 */
  json: (value: any) => {
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return String(value);
  }
};

/**
 * 獲取表格配置
 */
export const getTableConfig = (tableType: TableType): TableConfig | null => {
  const configs: Record<TableType, TableConfig> = {
    // 權限表格配置
    permission: {
      type: 'permission',
      title: 'Permission Table',
      hasEdit: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'name', title: '權限名稱', sortable: true },
        { key: 'description', title: '描述', sortable: false },
        { key: 'category', title: '分類', sortable: true },
        { key: 'isActive', title: '狀態', sortable: true, formatter: formatters.status },
        { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime },
        { key: 'updatedAt', title: '更新時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const permissionQuery = new PermissionQuery();
        return permissionQuery.useAllPermissionData();
      },
      useUpdateMutation: () => {
        const permissionQuery = new PermissionQuery();
        return permissionQuery.useUpdatePermissionData();
      }
    },

    // 角色表格配置
    role: {
      type: 'role',
      title: 'Role Table',
      hasEdit: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'name', title: '角色名稱', sortable: true },
        { key: 'displayName', title: '顯示名稱', sortable: true },
        { key: 'description', title: '描述', sortable: false },
        { key: 'isActive', title: '狀態', sortable: true, formatter: formatters.status },
        { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime },
        { key: 'updatedAt', title: '更新時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const roleQuery = new RoleQuery();
        return roleQuery.useRoleData();
      },
      useUpdateMutation: () => {
        const roleQuery = new RoleQuery();
        return roleQuery.useUpdateRoleData();
      }
    },

    // 用戶表格配置
    user: {
      type: 'user',
      title: 'User Table',
      hasEdit: true,
      hasQuickActions: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'username', title: '用戶名', sortable: true },
        { key: 'email', title: '電子郵件', sortable: true },
        { key: 'isActive', title: '狀態', sortable: true, formatter: formatters.status },
        { key: 'lastLoginAt', title: '最後登入', sortable: true, formatter: formatters.datetime },
        { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime },
        { key: 'updatedAt', title: '更新時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const userQuery = new UserQuery();
        return userQuery.useRbacUsers();
      },
      useUpdateMutation: () => {
        const userQuery = new UserQuery();
        return userQuery.useUpdateUser();
      }
    },

    // 角色權限關聯表格配置
    roletopermission: {
      type: 'roletopermission',
      title: 'Role to Permission Table',
      hasEdit: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'roleId', title: '角色ID', sortable: true },
        { key: 'permissionId', title: '權限ID', sortable: true },
        { key: 'isActive', title: '狀態', sortable: true, formatter: formatters.status },
        { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const roleQuery = new RoleQuery();
        return roleQuery.useAllRolePermissions();
      },
      useUpdateMutation: () => {
        const roleQuery = new RoleQuery();
        return roleQuery.useUpdateRoleData();
      }
    },

    // 用戶角色關聯表格配置
    usertorole: {
      type: 'usertorole',
      title: 'User to Role Table',
      hasEdit: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'userId', title: '用戶ID', sortable: true },
        { key: 'roleId', title: '角色ID', sortable: true },
        { key: 'isActive', title: '狀態', sortable: true, formatter: formatters.status },
        { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const userQuery = new UserQuery();
        return userQuery.useUserRoles();
      },
      useUpdateMutation: () => {
        const userQuery = new UserQuery();
        return userQuery.useUpdateUser();
      }
    },

    // 無人機位置表格配置
    DronePosition: {
      type: 'DronePosition',
      title: 'Drone Position Table',
      hasEdit: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'drone_id', title: '無人機ID', sortable: true },
        { key: 'latitude', title: '緯度', sortable: true, formatter: formatters.coordinate },
        { key: 'longitude', title: '經度', sortable: true, formatter: formatters.coordinate },
        { key: 'altitude', title: '高度', sortable: true, formatter: formatters.altitude },
        { key: 'speed', title: '速度', sortable: true, formatter: formatters.speed },
        { key: 'heading', title: '航向', sortable: true, formatter: formatters.heading },
        { key: 'battery_level', title: '電池電量', sortable: true, formatter: formatters.battery },
        { key: 'signal_strength', title: '信號強度', sortable: true, formatter: formatters.signal },
        { key: 'timestamp', title: '時間戳記', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const dronePositionQuery = new DronePositionQuery();
        return dronePositionQuery.useAll();
      },
      useUpdateMutation: () => {
        const dronePositionQuery = new DronePositionQuery();
        return dronePositionQuery.useUpdate();
      }
    },

    // 無人機狀態表格配置
    DroneStatus: {
      type: 'DroneStatus',
      title: 'Drone Status Table',
      hasEdit: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'drone_id', title: '無人機ID', sortable: true },
        { key: 'current_battery_level', title: '電池電量', sortable: true, formatter: formatters.battery },
        { key: 'current_status', title: '狀態', sortable: true },
        { key: 'last_seen', title: '最後連線', sortable: true, formatter: formatters.datetime },
        { key: 'current_altitude', title: '當前高度', sortable: true, formatter: formatters.altitude },
        { key: 'current_speed', title: '當前速度', sortable: true, formatter: formatters.speed },
        { key: 'is_connected', title: '連線狀態', sortable: true, formatter: formatters.boolean },
        { key: 'temperature', title: '溫度', sortable: true, formatter: formatters.temperature }
      ],
      useData: () => {
        const droneStatusQuery = new DroneStatusQuery();
        return droneStatusQuery.useAll();
      },
      useUpdateMutation: () => {
        const droneStatusQuery = new DroneStatusQuery();
        return droneStatusQuery.useUpdate();
      }
    },

    // 無人機指令表格配置
    DroneCommand: {
      type: 'DroneCommand',
      title: 'Drone Command Table',
      hasEdit: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'drone_id', title: '無人機ID', sortable: true },
        { key: 'command_type', title: '指令類型', sortable: true, formatter: formatters.commandType },
        { key: 'command_data', title: '指令參數', sortable: false, formatter: formatters.json },
        { key: 'status', title: '狀態', sortable: true, formatter: formatters.commandStatus },
        { key: 'issued_by', title: '發出者', sortable: true },
        { key: 'issued_at', title: '發出時間', sortable: true, formatter: formatters.datetime },
        { key: 'executed_at', title: '執行時間', sortable: true, formatter: formatters.datetime },
        { key: 'completed_at', title: '完成時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const droneCommandQuery = new DroneCommandQuery();
        return droneCommandQuery.useAllDroneCommands();
      },
      useUpdateMutation: () => {
        const droneCommandQuery = new DroneCommandQuery();
        return droneCommandQuery.useUpdate();
      }
    },

    // 用戶偏好設定表格配置
    UserPreference: {
      type: 'UserPreference',
      title: 'User Preference Table',
      hasEdit: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'userId', title: '用戶ID', sortable: true },
        { key: 'theme', title: '主題', sortable: true, formatter: formatters.theme },
        { key: 'language', title: '語言', sortable: true, formatter: formatters.language },
        { key: 'timeFormat', title: '時間格式', sortable: true, formatter: formatters.timeFormat },
        { key: 'autoSave', title: '自動儲存', sortable: true, formatter: formatters.boolean },
        { key: 'autoLogout', title: '自動登出', sortable: true, formatter: formatters.boolean },
        { key: 'createdAt', title: '建立時間', sortable: true, formatter: formatters.datetime },
        { key: 'updatedAt', title: '更新時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const userPreferenceQuery = new UserPreferenceQuery();
        return userPreferenceQuery.useUserPreferences();
      },
      useUpdateMutation: () => {
        const userPreferenceQuery = new UserPreferenceQuery();
        return userPreferenceQuery.useUpdateUserPreferences();
      }
    },

    // 歸檔任務表格配置
    ArchiveTask: {
      type: 'ArchiveTask',
      title: 'Archive Task Table',
      hasEdit: true,
      isLazy: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'job_type', title: '任務類型', sortable: true },
        { key: 'table_name', title: '來源表名', sortable: true },
        { key: 'archive_table_name', title: '歸檔表名', sortable: true },
        { key: 'total_records', title: '總記錄數', sortable: true, formatter: formatters.number },
        { key: 'archived_records', title: '已歸檔記錄數', sortable: true, formatter: formatters.number },
        { key: 'status', title: '狀態', sortable: true },
        { key: 'started_at', title: '開始時間', sortable: true, formatter: formatters.datetime },
        { key: 'completed_at', title: '完成時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const archiveTaskQuery = new ArchiveTaskQuery();
        return archiveTaskQuery.useArchiveTasks({});
      },
      useUpdateMutation: () => {
        const archiveTaskQuery = new ArchiveTaskQuery();
        return archiveTaskQuery.useUpdate();
      }
    },

    // 無人機位置歷史歸檔表格配置
    DronePositionsArchive: {
      type: 'DronePositionsArchive',
      title: 'Drone Positions Archive Table',
      hasEdit: true,
      isLazy: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'original_id', title: '原始ID', sortable: true },
        { key: 'drone_id', title: '無人機ID', sortable: true },
        { key: 'latitude', title: '緯度', sortable: true, formatter: formatters.coordinate },
        { key: 'longitude', title: '經度', sortable: true, formatter: formatters.coordinate },
        { key: 'altitude', title: '高度', sortable: true, formatter: formatters.altitude },
        { key: 'speed', title: '速度', sortable: true, formatter: formatters.speed },
        { key: 'heading', title: '航向', sortable: true, formatter: formatters.heading },
        { key: 'battery_level', title: '電池電量', sortable: true, formatter: formatters.battery },
        { key: 'signal_strength', title: '信號強度', sortable: true, formatter: formatters.signal },
        { key: 'temperature', title: '環境溫度', sortable: true, formatter: formatters.temperature },
        { key: 'timestamp', title: '記錄時間', sortable: true, formatter: formatters.datetime },
        { key: 'archived_at', title: '歸檔時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const dronePositionsArchiveQuery = new DronePositionsArchiveQuery();
        return dronePositionsArchiveQuery.useAll();
      },
      useUpdateMutation: () => {
        const dronePositionsArchiveQuery = new DronePositionsArchiveQuery();
        return dronePositionsArchiveQuery.useUpdate();
      }
    },

    // 無人機狀態歷史歸檔表格配置
    DroneStatusArchive: {
      type: 'DroneStatusArchive',
      title: 'Drone Status Archive Table',
      hasEdit: true,
      isLazy: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'original_id', title: '原始ID', sortable: true },
        { key: 'drone_id', title: '無人機ID', sortable: true },
        { key: 'current_battery_level', title: '電池電量', sortable: true, formatter: formatters.battery },
        { key: 'current_status', title: '狀態', sortable: true },
        { key: 'last_seen', title: '最後連線', sortable: true, formatter: formatters.datetime },
        { key: 'current_altitude', title: '高度', sortable: true, formatter: formatters.altitude },
        { key: 'current_speed', title: '速度', sortable: true, formatter: formatters.speed },
        { key: 'is_connected', title: '連線狀態', sortable: true, formatter: formatters.boolean },
        { key: 'archived_at', title: '歸檔時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        const droneStatusArchiveQuery = new DroneStatusArchiveQuery();
        return droneStatusArchiveQuery.useAll();
      },
      useUpdateMutation: () => {
        const droneStatusArchiveQuery = new DroneStatusArchiveQuery();
        return droneStatusArchiveQuery.useUpdate();
      }
    },

    // 無人機指令歷史歸檔表格配置
    DroneCommandsArchive: {
      type: 'DroneCommandsArchive',
      title: 'Drone Commands Archive Table',
      hasEdit: true,
      isLazy: true,
      columns: [
        { key: 'id', title: 'ID', sortable: true, width: '80px' },
        { key: 'original_id', title: '原始ID', sortable: true },
        { key: 'drone_id', title: '無人機ID', sortable: true },
        { key: 'command_type', title: '指令類型', sortable: true, formatter: formatters.commandType },
        { key: 'command_data', title: '指令參數', sortable: false, formatter: formatters.json },
        { key: 'status', title: '狀態', sortable: true, formatter: formatters.commandStatus },
        { key: 'issued_by', title: '發出者', sortable: true },
        { key: 'issued_at', title: '發出時間', sortable: true, formatter: formatters.datetime },
        { key: 'executed_at', title: '執行時間', sortable: true, formatter: formatters.datetime },
        { key: 'completed_at', title: '完成時間', sortable: true, formatter: formatters.datetime },
        { key: 'archived_at', title: '歸檔時間', sortable: true, formatter: formatters.datetime }
      ],
      useData: () => {
        // 使用特殊的歸檔指令 hook
        return useGetAllCommandsArchive({
          limit: 100,
          sortBy: 'issued_at',
          sortOrder: 'DESC'
        });
      },
      useUpdateMutation: () => {
        return droneCommandArchiveQuery.useUpdate();
      }
    }
  };

  return configs[tableType] || null;
};

/**
 * 獲取所有表格配置的列表
 */
export const getAllTableConfigs = (): Array<{ viewName: TableType; title: string }> => {
  const tableTypes: TableType[] = [
    'permission',
    'role', 
    'user',
    'roletopermission',
    'usertorole',
    'DronePosition',
    'DroneStatus', 
    'DroneCommand',
    'UserPreference',
    'ArchiveTask',
    'DronePositionsArchive',
    'DroneStatusArchive',
    'DroneCommandsArchive'
  ];

  return tableTypes.map(type => {
    const config = getTableConfig(type);
    return {
      viewName: type,
      title: config?.title || type
    };
  });
};