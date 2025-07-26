/**
 * @fileoverview 任務進度資料存取層介面定義
 * 
 * 定義任務進度相關資料操作的標準介面，為進度資料存取層提供契約。
 * 此介面確保所有進度相關的資料操作保持一致性和可擴展性。
 * 
 * @author AIOT 開發團隊
 * @version 1.0.0
 * @since 2025-07-26
 */

import type { Transaction } from 'sequelize';

/**
 * 任務進度資料結構（持久化版本）
 */
export interface ProgressData {
  taskId: string;
  status: string;
  stage: string;
  percentage: number;
  current: number;
  total: number;
  message: string;
  startTime: Date;
  lastUpdated: Date;
  estimatedCompletion?: Date;
  result?: any;
  error?: string;
}

/**
 * 任務進度建立屬性
 */
export interface ProgressCreationData {
  taskId: string;
  status: string;
  stage: string;
  percentage?: number;
  current?: number;
  total: number;
  message: string;
  startTime?: Date;
  lastUpdated?: Date;
  estimatedCompletion?: Date;
  result?: any;
  error?: string;
}

/**
 * 任務進度資料存取層介面
 * 定義任務進度相關資料操作的標準介面
 */
export interface IProgressRepository {
  /**
   * 根據任務 ID 查詢進度
   * @param taskId 任務 ID
   * @returns 進度資料或 null
   */
  findByTaskId(taskId: string): Promise<ProgressData | null>;

  /**
   * 建立任務進度記錄
   * @param progressData 進度資料
   * @param transaction 資料庫交易（可選）
   * @returns 建立的進度記錄
   */
  create(progressData: ProgressCreationData, transaction?: Transaction): Promise<ProgressData>;

  /**
   * 更新任務進度
   * @param taskId 任務 ID
   * @param updateData 更新資料
   * @param transaction 資料庫交易（可選）
   * @returns 更新的進度記錄或 null
   */
  update(
    taskId: string,
    updateData: Partial<ProgressCreationData>,
    transaction?: Transaction
  ): Promise<ProgressData | null>;

  /**
   * 刪除任務進度記錄
   * @param taskId 任務 ID
   * @param transaction 資料庫交易（可選）
   * @returns 是否刪除成功
   */
  delete(taskId: string, transaction?: Transaction): Promise<boolean>;

  /**
   * 查詢所有進行中的任務
   * @returns 進行中的任務列表
   */
  findActiveProgress(): Promise<ProgressData[]>;

  /**
   * 查詢已完成的任務
   * @param limit 限制數量
   * @returns 已完成的任務列表
   */
  findCompletedProgress(limit?: number): Promise<ProgressData[]>;

  /**
   * 查詢失敗的任務
   * @param limit 限制數量
   * @returns 失敗的任務列表
   */
  findFailedProgress(limit?: number): Promise<ProgressData[]>;

  /**
   * 清理過期的任務記錄
   * @param olderThanHours 超過指定小時數的記錄
   * @param transaction 資料庫交易（可選）
   * @returns 清理的記錄數量
   */
  cleanupOldProgress(olderThanHours: number, transaction?: Transaction): Promise<number>;

  /**
   * 計算進度記錄總數
   * @returns 記錄總數
   */
  count(): Promise<number>;

  /**
   * 根據狀態計算任務數量
   * @param status 任務狀態
   * @returns 該狀態的任務數量
   */
  countByStatus(status: string): Promise<number>;
}