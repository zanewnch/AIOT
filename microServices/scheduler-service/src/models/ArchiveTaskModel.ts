/**
 * @fileoverview 歸檔任務資料模型
 * 
 * 對應 archive_tasks 表的 Sequelize 模型定義
 */

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  Index,
  Comment
} from 'sequelize-typescript';
import type { Optional } from 'sequelize';

/**
 * 歸檔任務狀態枚舉
 */
export enum ArchiveTaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 歸檔任務類型枚舉
 */
export enum ArchiveJobType {
  POSITIONS = 'positions',
  COMMANDS = 'commands',
  STATUS = 'status'
}

/**
 * 歸檔任務屬性介面
 */
export interface ArchiveTaskAttributes {
  id: number;
  jobType: ArchiveJobType;
  tableName: string;
  archiveTableName: string;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  batchId: string;
  totalRecords: number;
  archivedRecords: number;
  status: ArchiveTaskStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 創建歸檔任務時的可選屬性
 */
export interface ArchiveTaskCreationAttributes extends Optional<
  ArchiveTaskAttributes,
  'id' | 'totalRecords' | 'archivedRecords' | 'status' | 'startedAt' | 'completedAt' | 'errorMessage' | 'createdAt' | 'updatedAt'
> {}

/**
 * 歸檔任務模型
 */
@Table({
  tableName: 'archive_tasks',
  timestamps: true,
  indexes: [
    { fields: ['job_type'] },
    { fields: ['status'] },
    { fields: ['batch_id'] },
    { fields: ['date_range_start'] },
    { fields: ['started_at'] },
    { fields: ['status', 'job_type'] }
  ]
})
export class ArchiveTaskModel extends Model<ArchiveTaskAttributes, ArchiveTaskCreationAttributes> implements ArchiveTaskAttributes {
  
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
    comment: '主鍵識別碼'
  })
  declare id: number;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM('positions', 'commands', 'status'),
    field: 'job_type',
    comment: '歸檔任務類型'
  })
  declare jobType: ArchiveJobType;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
    field: 'table_name',
    comment: '來源表名'
  })
  declare tableName: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
    field: 'archive_table_name',
    comment: '目標歸檔表名'
  })
  declare archiveTableName: string;

  @AllowNull(false)
  @Index
  @Column({
    type: DataType.DATE,
    field: 'date_range_start',
    comment: '歸檔資料起始時間'
  })
  declare dateRangeStart: Date;

  @AllowNull(false)
  @Column({
    type: DataType.DATE,
    field: 'date_range_end',
    comment: '歸檔資料結束時間'
  })
  declare dateRangeEnd: Date;

  @AllowNull(false)
  @Index
  @Column({
    type: DataType.STRING(255),
    field: 'batch_id',
    comment: '歸檔批次識別碼'
  })
  declare batchId: string;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    field: 'total_records',
    defaultValue: 0,
    comment: '總歸檔記錄數'
  })
  declare totalRecords: number;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    field: 'archived_records',
    defaultValue: 0,
    comment: '已歸檔記錄數'
  })
  declare archivedRecords: number;

  @AllowNull(false)
  @Index
  @Column({
    type: DataType.ENUM('pending', 'running', 'completed', 'failed'),
    defaultValue: 'pending',
    comment: '任務狀態'
  })
  declare status: ArchiveTaskStatus;

  @AllowNull(true)
  @Index
  @Column({
    type: DataType.DATE,
    field: 'started_at',
    comment: '開始時間'
  })
  declare startedAt: Date | null;

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
    field: 'completed_at',
    comment: '完成時間'
  })
  declare completedAt: Date | null;

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    field: 'error_message',
    comment: '錯誤訊息'
  })
  declare errorMessage: string | null;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(100),
    field: 'created_by',
    comment: '創建者'
  })
  declare createdBy: string;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: 'createdAt',
    comment: '建立時間'
  })
  declare createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
    comment: '更新時間'
  })
  declare updatedAt: Date;

  /**
   * 獲取進度百分比
   */
  get progressPercentage(): number {
    if (this.totalRecords === 0) return 0;
    return Math.round((this.archivedRecords / this.totalRecords) * 100);
  }

  /**
   * 獲取執行時間 (秒)
   */
  get executionTimeSeconds(): number | null {
    if (!this.startedAt) return null;
    
    const endTime = this.completedAt || new Date();
    return Math.round((endTime.getTime() - this.startedAt.getTime()) / 1000);
  }

  /**
   * 檢查任務是否正在執行
   */
  get isRunning(): boolean {
    return this.status === ArchiveTaskStatus.RUNNING;
  }

  /**
   * 檢查任務是否已完成
   */
  get isCompleted(): boolean {
    return this.status === ArchiveTaskStatus.COMPLETED;
  }

  /**
   * 檢查任務是否失敗
   */
  get isFailed(): boolean {
    return this.status === ArchiveTaskStatus.FAILED;
  }

  /**
   * 檢查任務是否可以重試
   */
  get canRetry(): boolean {
    return this.status === ArchiveTaskStatus.FAILED;
  }

  /**
   * 標記任務開始
   */
  async markAsStarted(): Promise<void> {
    await this.update({
      status: ArchiveTaskStatus.RUNNING,
      startedAt: new Date(),
      errorMessage: null
    });
  }

  /**
   * 標記任務完成
   */
  async markAsCompleted(totalRecords: number, archivedRecords: number): Promise<void> {
    await this.update({
      status: ArchiveTaskStatus.COMPLETED,
      completedAt: new Date(),
      totalRecords,
      archivedRecords,
      errorMessage: null
    });
  }

  /**
   * 標記任務失敗
   */
  async markAsFailed(errorMessage: string, archivedRecords?: number): Promise<void> {
    const updateData: any = {
      status: ArchiveTaskStatus.FAILED,
      completedAt: new Date(),
      errorMessage
    };

    if (archivedRecords !== undefined) {
      updateData.archivedRecords = archivedRecords;
    }

    await this.update(updateData);
  }

  /**
   * 更新進度
   */
  async updateProgress(archivedRecords: number, totalRecords?: number): Promise<void> {
    const updateData: any = { archivedRecords };
    
    if (totalRecords !== undefined) {
      updateData.totalRecords = totalRecords;
    }

    await this.update(updateData);
  }

  /**
   * 重置任務狀態 (用於重試)
   */
  async reset(): Promise<void> {
    await this.update({
      status: ArchiveTaskStatus.PENDING,
      startedAt: null,
      completedAt: null,
      errorMessage: null,
      archivedRecords: 0
    });
  }

  /**
   * 轉換為 JSON 格式
   */
  toSummary(): {
    id: number;
    jobType: string;
    batchId: string;
    status: string;
    progress: string;
    executionTime: string;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
  } {
    return {
      id: this.id,
      jobType: this.jobType,
      batchId: this.batchId,
      status: this.status,
      progress: `${this.archivedRecords}/${this.totalRecords} (${this.progressPercentage}%)`,
      executionTime: this.executionTimeSeconds ? `${this.executionTimeSeconds}s` : 'N/A',
      createdAt: this.createdAt.toISOString(),
      startedAt: this.startedAt?.toISOString() || null,
      completedAt: this.completedAt?.toISOString() || null
    };
  }
}