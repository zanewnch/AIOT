/**
 * @fileoverview Archive Task Repository 實作
 * 
 * 【設計意圖 (Intention)】
 * 實作歷史任務數據存取層，提供任務狀態更新和查詢功能
 * 確保任務處理過程中的狀態追蹤和數據一致性
 * 
 * 【實作架構 (Implementation Architecture)】
 * - 實作 ArchiveTaskRepo 介面定義的方法
 * - 使用 DatabaseConnection 進行數據操作
 * - 提供事務支援確保數據一致性
 */

import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { ArchiveTaskRepo, DatabaseConnection } from '../types/processor.types';
import { TYPES } from '../container/types';

export interface ArchiveTask {
  id: number;
  task_id: string;
  job_type: string;
  status: string;
  batch_id?: string;
  total_records?: number;
  processed_records?: number;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  completed_at?: Date;
}

@injectable()
export class ArchiveTaskRepoImpl implements ArchiveTaskRepo {
  
  constructor(
    @inject(TYPES.DatabaseConnection) private readonly db: DatabaseConnection,
    @inject(TYPES.Logger) private readonly logger: Logger
  ) {}

  /**
   * 根據任務 ID 查找歷史任務
   * 
   * 【查詢策略】
   * - 使用索引優化查詢性能
   * - 返回完整的任務資訊
   */
  findById = async (id: number): Promise<ArchiveTask | null> => {
    try {
      const sql = `
        SELECT 
          id, task_id, job_type, status, batch_id,
          total_records, processed_records, error_message,
          created_at, updated_at, started_at, completed_at
        FROM archive_tasks 
        WHERE id = ?
      `;
      
      const results = await this.db.query(sql, [id]);
      
      if (results.length === 0) {
        return null;
      }

      const task = results[0] as ArchiveTask;
      
      this.logger.debug('Archive task found', {
        taskId: task.task_id,
        status: task.status,
        jobType: task.job_type
      });

      return task;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Failed to find archive task by ID', {
        id,
        error: err.message
      });
      throw error;
    }
  };

  /**
   * 根據任務字符串 ID 查找歷史任務
   */
  findByTaskId = async (taskId: string): Promise<ArchiveTask | null> => {
    try {
      const sql = `
        SELECT 
          id, task_id, job_type, status, batch_id,
          total_records, processed_records, error_message,
          created_at, updated_at, started_at, completed_at
        FROM archive_tasks 
        WHERE task_id = ?
      `;
      
      const results = await this.db.query(sql, [taskId]);
      
      if (results.length === 0) {
        return null;
      }

      return results[0] as ArchiveTask;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Failed to find archive task by task ID', {
        taskId,
        error: err.message
      });
      throw error;
    }
  };

  /**
   * 更新歷史任務
   * 
   * 【更新策略】
   * - 支援部分欄位更新
   * - 自動更新 updated_at 時間戳
   * - 使用事務確保數據一致性
   */
  update = async (id: number, data: Partial<Omit<ArchiveTask, 'id' | 'created_at'>>): Promise<ArchiveTask | null> => {
    try {
      return await this.db.transaction(async (connection) => {
        // 構建動態更新 SQL
        const updateFields: string[] = [];
        const values: any[] = [];

        // 處理可更新的欄位
        if (data.status !== undefined) {
          updateFields.push('status = ?');
          values.push(data.status);
        }

        if (data.total_records !== undefined) {
          updateFields.push('total_records = ?');
          values.push(data.total_records);
        }

        if (data.processed_records !== undefined) {
          updateFields.push('processed_records = ?');
          values.push(data.processed_records);
        }

        if (data.error_message !== undefined) {
          updateFields.push('error_message = ?');
          values.push(data.error_message);
        }

        if (data.started_at !== undefined) {
          updateFields.push('started_at = ?');
          values.push(data.started_at);
        }

        if (data.completed_at !== undefined) {
          updateFields.push('completed_at = ?');
          values.push(data.completed_at);
        }

        if (data.batch_id !== undefined) {
          updateFields.push('batch_id = ?');
          values.push(data.batch_id);
        }

        // 總是更新 updated_at
        updateFields.push('updated_at = NOW()');
        
        if (updateFields.length === 1) { // 只有 updated_at
          this.logger.warn('No fields to update for archive task', { id });
          return await this.findById(id);
        }

        values.push(id); // WHERE 條件的 ID

        const sql = `
          UPDATE archive_tasks 
          SET ${updateFields.join(', ')} 
          WHERE id = ?
        `;

        const result: any = await connection.execute(sql, values);

        if (result.affectedRows === 0) {
          this.logger.warn('No archive task found for update', { id });
          return null;
        }

        this.logger.info('Archive task updated successfully', {
          id,
          updatedFields: Object.keys(data),
          affectedRows: result.affectedRows
        });

        // 返回更新後的任務
        return await this.findById(id);
      });
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error('Failed to update archive task', {
        id,
        data,
        error: err.message
      });
      throw error;
    }
  };

  /**
   * 創建新的歷史任務記錄
   */
  create = async (taskData: Omit<ArchiveTask, 'id' | 'created_at' | 'updated_at'>): Promise<ArchiveTask> => {
    try {
      const sql = `
        INSERT INTO archive_tasks (
          task_id, job_type, status, batch_id,
          total_records, processed_records, error_message,
          started_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        taskData.task_id,
        taskData.job_type,
        taskData.status,
        taskData.batch_id || null,
        taskData.total_records || null,
        taskData.processed_records || null,
        taskData.error_message || null,
        taskData.started_at || null,
        taskData.completed_at || null
      ];

      const result: any = await this.db.query(sql, values);
      const insertId = result.insertId;

      this.logger.info('Archive task created successfully', {
        taskId: taskData.task_id,
        insertId,
        jobType: taskData.job_type,
        status: taskData.status
      });

      // 返回創建的任務
      const createdTask = await this.findById(insertId);
      if (!createdTask) {
        throw new Error(`Failed to retrieve created task with ID ${insertId}`);
      }

      return createdTask;
    } catch (error) {
      this.logger.error('Failed to create archive task', {
        taskData,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 根據批次 ID 查找相關任務
   */
  async findByBatchId(batchId: string): Promise<ArchiveTask[]> {
    try {
      const sql = `
        SELECT 
          id, task_id, job_type, status, batch_id,
          total_records, processed_records, error_message,
          created_at, updated_at, started_at, completed_at
        FROM archive_tasks 
        WHERE batch_id = ?
        ORDER BY created_at ASC
      `;
      
      const results = await this.db.query(sql, [batchId]);
      
      this.logger.debug('Archive tasks found by batch ID', {
        batchId,
        taskCount: results.length
      });

      return results as ArchiveTask[];
    } catch (error) {
      this.logger.error('Failed to find archive tasks by batch ID', {
        batchId,
        error: error.message
      });
      throw error;
    }
  }
}