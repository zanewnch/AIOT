/**
 * @fileoverview 排程配置
 * 
 * 定義所有的定時任務配置和相關設定
 */

import { ScheduleConfig, TaskType } from '@/types/scheduler.types';

/**
 * 預設排程配置
 */
export const DEFAULT_SCHEDULES: ScheduleConfig[] = [
  {
    name: 'archive-daily',
    cronExpression: '0 2 * * *',      // 每日凌晨 2:00
    taskType: TaskType.ARCHIVE,
    enabled: true,
    timezone: 'Asia/Taipei',
    description: '每日定期歸檔任務',
    parameters: {
      retentionDays: 1,
      batchSize: 1000,
      priority: 8,
      tables: ['drone_positions', 'drone_commands', 'drone_real_time_status']
    }
  },
  
  {
    name: 'cleanup-expired',
    cronExpression: '0 4 * * *',      // 每日凌晨 4:00
    taskType: TaskType.CLEANUP,
    enabled: true,
    timezone: 'Asia/Taipei',
    description: '每日清理過期的已歸檔數據',
    parameters: {
      cleanupDelayDays: 7,
      batchSize: 1000,
      priority: 3,
      cleanupType: 'physical_delete'
    }
  },
  
  {
    name: 'maintenance-weekly',
    cronExpression: '0 3 * * 0',      // 每週日凌晨 3:00
    taskType: TaskType.MAINTENANCE,
    enabled: true,
    timezone: 'Asia/Taipei',
    description: '每週維護任務 - 索引重建和統計更新',
    parameters: {
      maintenanceType: ['index_rebuild', 'statistics_update'],
      priority: 5,
      targetTables: [
        'drone_positions', 'drone_commands', 'drone_real_time_status',
        'drone_positions_archive', 'drone_commands_archive', 'drone_status_archive'
      ]
    }
  },
  
  {
    name: 'health-check-hourly',
    cronExpression: '0 * * * *',      // 每小時執行
    taskType: TaskType.MAINTENANCE,
    enabled: true,
    timezone: 'Asia/Taipei',
    description: '每小時健康檢查',
    parameters: {
      maintenanceType: 'health_check',
      priority: 2,
      checks: [
        'database_connection',
        'rabbitmq_connection',
        'redis_connection',
        'disk_space',
        'memory_usage'
      ]
    }
  },
  
  {
    name: 'daily-report',
    cronExpression: '0 6 * * *',      // 每日早上 6:00
    taskType: TaskType.REPORT,
    enabled: true,
    timezone: 'Asia/Taipei',
    description: '每日系統報告',
    parameters: {
      reportType: 'daily',
      reportFormat: 'json',
      priority: 2,
      includeStats: true,
      recipients: ['admin@aiot.system']
    }
  },
  
  {
    name: 'weekly-report',
    cronExpression: '0 7 * * 1',      // 每週一早上 7:00
    taskType: TaskType.REPORT,
    enabled: true,
    timezone: 'Asia/Taipei',
    description: '每週系統統計報告',
    parameters: {
      reportType: 'weekly',
      reportFormat: 'pdf',
      priority: 3,
      includeCharts: true,
      recipients: ['admin@aiot.system', 'manager@aiot.system']
    }
  }
];

/**
 * 歸檔任務配置
 */
export const ARCHIVE_CONFIG = {
  // 數據保留期限 (天)
  DATA_RETENTION_DAYS: 1,
  
  // 物理刪除延遲 (天)
  CLEANUP_DELAY_DAYS: 7,
  
  // 批量處理大小
  DEFAULT_BATCH_SIZE: 1000,
  
  // 歸檔表映射
  TABLE_MAPPINGS: {
    'drone_positions': 'drone_positions_archive',
    'drone_commands': 'drone_commands_archive',
    'drone_real_time_status': 'drone_status_archive'
  },
  
  // 任務類型映射
  JOB_TYPE_MAPPINGS: {
    'drone_positions': 'positions',
    'drone_commands': 'commands',
    'drone_real_time_status': 'status'
  } as const,
  
  // 優先級設定
  PRIORITY_SETTINGS: {
    'positions': 10,     // 最高優先級 (數據量最大)
    'commands': 8,       // 高優先級
    'status': 6          // 中等優先級
  }
} as const;

/**
 * 清理任務配置
 */
export const CLEANUP_CONFIG = {
  // 預設批量大小
  DEFAULT_BATCH_SIZE: 1000,
  
  // 批次間延遲 (毫秒)
  BATCH_DELAY_MS: 100,
  
  // 最大執行時間 (小時)
  MAX_EXECUTION_HOURS: 2,
  
  // 清理類型
  CLEANUP_TYPES: {
    MARK_ARCHIVED: 'mark_archived',
    PHYSICAL_DELETE: 'physical_delete'
  } as const
} as const;

/**
 * 維護任務配置
 */
export const MAINTENANCE_CONFIG = {
  // 維護類型
  MAINTENANCE_TYPES: {
    INDEX_REBUILD: 'index_rebuild',
    STATISTICS_UPDATE: 'statistics_update',
    HEALTH_CHECK: 'health_check'
  } as const,
  
  // 健康檢查項目
  HEALTH_CHECKS: {
    DATABASE_CONNECTION: 'database_connection',
    RABBITMQ_CONNECTION: 'rabbitmq_connection', 
    REDIS_CONNECTION: 'redis_connection',
    DISK_SPACE: 'disk_space',
    MEMORY_USAGE: 'memory_usage'
  } as const,
  
  // 閾值設定
  THRESHOLDS: {
    DISK_SPACE_WARNING: 80,      // 磁碟使用率警告閾值 (%)
    DISK_SPACE_CRITICAL: 90,     // 磁碟使用率嚴重閾值 (%)
    MEMORY_WARNING: 85,          // 記憶體使用率警告閾值 (%)
    MEMORY_CRITICAL: 95          // 記憶體使用率嚴重閾值 (%)
  }
} as const;

/**
 * 報告任務配置
 */
export const REPORT_CONFIG = {
  // 報告類型
  REPORT_TYPES: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly'
  } as const,
  
  // 報告格式
  REPORT_FORMATS: {
    JSON: 'json',
    CSV: 'csv',
    PDF: 'pdf'
  } as const,
  
  // 預設收件人
  DEFAULT_RECIPIENTS: [
    'admin@aiot.system'
  ],
  
  // 報告儲存路徑
  REPORT_STORAGE_PATH: '/data/reports',
  
  // 報告保留天數
  REPORT_RETENTION_DAYS: 90
} as const;