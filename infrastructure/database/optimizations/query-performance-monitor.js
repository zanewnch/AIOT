/**
 * @fileoverview AIOT 查詢性能監控系統
 * 提供實時查詢監控、性能分析和自動警報功能
 */

'use strict';

/**
 * 查詢性能監控器
 */
export class QueryPerformanceMonitor {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.queryCache = new Map();
    this.performanceThresholds = {
      slowQueryMs: 1000,
      verySlowQueryMs: 5000,
      maxConnections: 20,
      highCpuPercent: 80
    };
  }

  /**
   * 初始化性能監控
   */
  async initialize() {
    // 啟用 pg_stat_statements 如果尚未啟用
    await this.enableStatStatements();
    
    // 創建性能監控表
    await this.createMonitoringTables();
    
    // 設置查詢攔截器
    this.setupQueryInterceptor();
    
    console.log('Query Performance Monitor initialized successfully');
  }

  /**
   * 啟用 pg_stat_statements 擴展
   */
  async enableStatStatements() {
    try {
      await this.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements;');
    } catch (error) {
      console.warn('Unable to create pg_stat_statements extension:', error.message);
    }
  }

  /**
   * 創建監控表
   */
  async createMonitoringTables() {
    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS query_performance_log (
        id BIGSERIAL PRIMARY KEY,
        query_hash VARCHAR(64) NOT NULL,
        query_text TEXT NOT NULL,
        service_name VARCHAR(50),
        execution_time_ms INTEGER NOT NULL,
        cpu_time_ms INTEGER DEFAULT 0,
        rows_examined BIGINT DEFAULT 0,
        rows_returned BIGINT DEFAULT 0,
        buffer_hits BIGINT DEFAULT 0,
        buffer_misses BIGINT DEFAULT 0,
        temp_files INTEGER DEFAULT 0,
        temp_bytes BIGINT DEFAULT 0,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_name VARCHAR(50),
        database_name VARCHAR(50),
        application_name VARCHAR(50),
        client_addr INET,
        query_plan JSONB,
        error_message TEXT,
        warning_flags TEXT[],
        INDEX idx_query_performance_executed_at (executed_at),
        INDEX idx_query_performance_hash (query_hash),
        INDEX idx_query_performance_service (service_name, executed_at),
        INDEX idx_query_performance_slow (execution_time_ms DESC)
      );
    `);

    await this.sequelize.query(`
      CREATE TABLE IF NOT EXISTS query_alerts (
        id BIGSERIAL PRIMARY KEY,
        alert_type VARCHAR(30) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        query_hash VARCHAR(64),
        service_name VARCHAR(50),
        alert_message TEXT NOT NULL,
        metrics JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP,
        acknowledged_at TIMESTAMP,
        acknowledged_by VARCHAR(50),
        INDEX idx_query_alerts_created (created_at),
        INDEX idx_query_alerts_type_severity (alert_type, severity)
      );
    `);
  }

  /**
   * 設置查詢攔截器
   */
  setupQueryInterceptor() {
    const originalQuery = this.sequelize.query.bind(this.sequelize);
    
    this.sequelize.query = async (sql, options = {}) => {
      const startTime = Date.now();
      const queryHash = this.hashQuery(sql);
      
      try {
        const result = await originalQuery(sql, options);
        const executionTime = Date.now() - startTime;
        
        // 異步記錄性能數據
        setImmediate(() => {
          this.logQueryPerformance(sql, queryHash, executionTime, result, options);
        });
        
        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        // 記錄錯誤查詢
        setImmediate(() => {
          this.logQueryError(sql, queryHash, executionTime, error, options);
        });
        
        throw error;
      }
    };
  }

  /**
   * 記錄查詢性能
   */
  async logQueryPerformance(sql, queryHash, executionTime, result, options) {
    try {
      const serviceName = process.env.SERVICE_NAME || 'unknown';
      const rowsReturned = Array.isArray(result) ? result.length : 0;
      const warnings = [];

      // 檢查性能警告
      if (executionTime > this.performanceThresholds.slowQueryMs) {
        warnings.push('SLOW_QUERY');
      }
      
      if (executionTime > this.performanceThresholds.verySlowQueryMs) {
        warnings.push('VERY_SLOW_QUERY');
        await this.createAlert('SLOW_QUERY', 'HIGH', queryHash, serviceName, 
          `Very slow query detected: ${executionTime}ms`, { executionTime, sql: sql.substring(0, 200) });
      }

      // 記錄到性能日誌
      await this.sequelize.query(`
        INSERT INTO query_performance_log (
          query_hash, query_text, service_name, execution_time_ms, 
          rows_returned, executed_at, warning_flags
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      `, {
        replacements: [queryHash, sql.substring(0, 2000), serviceName, executionTime, rowsReturned, warnings],
        type: this.sequelize.QueryTypes.INSERT
      });

    } catch (error) {
      console.error('Failed to log query performance:', error);
    }
  }

  /**
   * 記錄查詢錯誤
   */
  async logQueryError(sql, queryHash, executionTime, error, options) {
    try {
      const serviceName = process.env.SERVICE_NAME || 'unknown';

      await this.sequelize.query(`
        INSERT INTO query_performance_log (
          query_hash, query_text, service_name, execution_time_ms, 
          executed_at, error_message, warning_flags
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
      `, {
        replacements: [queryHash, sql.substring(0, 2000), serviceName, executionTime, error.message, ['ERROR']],
        type: this.sequelize.QueryTypes.INSERT
      });

      // 創建錯誤警報
      await this.createAlert('QUERY_ERROR', 'HIGH', queryHash, serviceName,
        `Query execution failed: ${error.message}`, { sql: sql.substring(0, 200), error: error.message });

    } catch (logError) {
      console.error('Failed to log query error:', logError);
    }
  }

  /**
   * 創建警報
   */
  async createAlert(alertType, severity, queryHash, serviceName, message, metrics) {
    try {
      await this.sequelize.query(`
        INSERT INTO query_alerts (alert_type, severity, query_hash, service_name, alert_message, metrics)
        VALUES (?, ?, ?, ?, ?, ?)
      `, {
        replacements: [alertType, severity, queryHash, serviceName, message, JSON.stringify(metrics)],
        type: this.sequelize.QueryTypes.INSERT
      });
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  }

  /**
   * 獲取性能統計
   */
  async getPerformanceStats(timeRange = '1 hour') {
    const stats = await this.sequelize.query(`
      WITH time_stats AS (
        SELECT 
          service_name,
          COUNT(*) as total_queries,
          AVG(execution_time_ms) as avg_execution_time,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY execution_time_ms) as median_execution_time,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time,
          MAX(execution_time_ms) as max_execution_time,
          COUNT(*) FILTER (WHERE execution_time_ms > :slowThreshold) as slow_queries,
          COUNT(*) FILTER (WHERE error_message IS NOT NULL) as failed_queries,
          SUM(rows_returned) as total_rows_returned
        FROM query_performance_log
        WHERE executed_at >= CURRENT_TIMESTAMP - INTERVAL '${timeRange}'
        GROUP BY service_name
      )
      SELECT 
        *,
        CASE 
          WHEN avg_execution_time < 100 THEN 'EXCELLENT'
          WHEN avg_execution_time < 500 THEN 'GOOD'
          WHEN avg_execution_time < 1000 THEN 'FAIR'
          ELSE 'POOR'
        END as performance_rating,
        ROUND((slow_queries::numeric / total_queries * 100), 2) as slow_query_percentage,
        ROUND((failed_queries::numeric / total_queries * 100), 2) as error_rate_percentage
      FROM time_stats
      ORDER BY total_queries DESC;
    `, {
      replacements: { slowThreshold: this.performanceThresholds.slowQueryMs },
      type: this.sequelize.QueryTypes.SELECT
    });

    return stats;
  }

  /**
   * 獲取最慢的查詢
   */
  async getSlowestQueries(limit = 10, timeRange = '24 hours') {
    return await this.sequelize.query(`
      SELECT 
        query_hash,
        LEFT(query_text, 200) as query_preview,
        service_name,
        execution_time_ms,
        rows_returned,
        executed_at,
        COALESCE(array_length(warning_flags, 1), 0) as warning_count
      FROM query_performance_log
      WHERE executed_at >= CURRENT_TIMESTAMP - INTERVAL '${timeRange}'
        AND error_message IS NULL
      ORDER BY execution_time_ms DESC
      LIMIT ${limit};
    `, {
      type: this.sequelize.QueryTypes.SELECT
    });
  }

  /**
   * 獲取查詢模式分析
   */
  async getQueryPatternAnalysis(timeRange = '24 hours') {
    return await this.sequelize.query(`
      WITH query_patterns AS (
        SELECT 
          query_hash,
          LEFT(query_text, 100) as pattern,
          service_name,
          COUNT(*) as execution_count,
          AVG(execution_time_ms) as avg_time,
          MIN(execution_time_ms) as min_time,
          MAX(execution_time_ms) as max_time,
          STDDEV(execution_time_ms) as time_stddev,
          SUM(rows_returned) as total_rows,
          COUNT(*) FILTER (WHERE warning_flags && ARRAY['SLOW_QUERY']) as slow_executions
        FROM query_performance_log
        WHERE executed_at >= CURRENT_TIMESTAMP - INTERVAL '${timeRange}'
        GROUP BY query_hash, LEFT(query_text, 100), service_name
      )
      SELECT 
        *,
        CASE 
          WHEN execution_count > 1000 THEN 'HIGH_FREQUENCY'
          WHEN execution_count > 100 THEN 'MEDIUM_FREQUENCY'
          ELSE 'LOW_FREQUENCY'
        END as frequency_category,
        ROUND((slow_executions::numeric / execution_count * 100), 2) as slow_percentage,
        CASE 
          WHEN time_stddev > avg_time * 0.5 THEN 'HIGH_VARIANCE'
          WHEN time_stddev > avg_time * 0.2 THEN 'MEDIUM_VARIANCE'
          ELSE 'LOW_VARIANCE'
        END as performance_consistency
      FROM query_patterns
      WHERE execution_count > 1
      ORDER BY execution_count DESC, avg_time DESC;
    `, {
      type: this.sequelize.QueryTypes.SELECT
    });
  }

  /**
   * 獲取活動警報
   */
  async getActiveAlerts(severity = null) {
    const severityFilter = severity ? `AND severity = '${severity}'` : '';
    
    return await this.sequelize.query(`
      SELECT 
        alert_type,
        severity,
        service_name,
        alert_message,
        metrics,
        created_at,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 60 as age_minutes
      FROM query_alerts
      WHERE resolved_at IS NULL
        ${severityFilter}
      ORDER BY 
        CASE severity
          WHEN 'HIGH' THEN 1
          WHEN 'MEDIUM' THEN 2
          WHEN 'LOW' THEN 3
        END,
        created_at DESC;
    `, {
      type: this.sequelize.QueryTypes.SELECT
    });
  }

  /**
   * 清理舊的性能數據
   */
  async cleanupOldData(retentionDays = 30) {
    const deletedLogs = await this.sequelize.query(`
      DELETE FROM query_performance_log 
      WHERE executed_at < CURRENT_TIMESTAMP - INTERVAL '${retentionDays} days';
    `);

    const deletedAlerts = await this.sequelize.query(`
      DELETE FROM query_alerts 
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${retentionDays} days'
        AND resolved_at IS NOT NULL;
    `);

    return {
      deletedLogs: deletedLogs[1],
      deletedAlerts: deletedAlerts[1],
      cleanupDate: new Date().toISOString()
    };
  }

  /**
   * 生成查詢哈希
   */
  hashQuery(query) {
    const crypto = require('crypto');
    // 正規化查詢（移除空白、參數等）
    const normalized = query.replace(/\s+/g, ' ').replace(/\$\d+/g, '?').trim();
    return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
  }

  /**
   * 設置性能閾值
   */
  setThresholds(newThresholds) {
    this.performanceThresholds = { ...this.performanceThresholds, ...newThresholds };
  }

  /**
   * 獲取數據庫連接統計
   */
  async getConnectionStats() {
    try {
      const [connectionStats] = await this.sequelize.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
          max(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - query_start))) as longest_query_seconds,
          max(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - state_change))) as longest_idle_seconds
        FROM pg_stat_activity 
        WHERE datname = current_database();
      `, {
        type: this.sequelize.QueryTypes.SELECT
      });

      return connectionStats;
    } catch (error) {
      console.error('Failed to get connection stats:', error);
      return null;
    }
  }
}

/**
 * 自動性能調優器
 */
export class AutoPerformanceTuner {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.tuningHistory = [];
  }

  /**
   * 分析並建議性能調優
   */
  async analyzeDatabasePerformance() {
    const recommendations = [];

    // 檢查未使用的索引
    const unusedIndexes = await this.findUnusedIndexes();
    if (unusedIndexes.length > 0) {
      recommendations.push({
        category: 'INDEX_CLEANUP',
        priority: 'MEDIUM',
        title: 'Remove unused indexes',
        details: unusedIndexes,
        potentialImpact: 'Reduce storage and improve write performance'
      });
    }

    // 檢查缺失的索引
    const missingIndexes = await this.suggestMissingIndexes();
    if (missingIndexes.length > 0) {
      recommendations.push({
        category: 'INDEX_CREATION',
        priority: 'HIGH',
        title: 'Create recommended indexes',
        details: missingIndexes,
        potentialImpact: 'Significantly improve query performance'
      });
    }

    // 檢查表統計信息
    const outdatedStats = await this.findOutdatedStatistics();
    if (outdatedStats.length > 0) {
      recommendations.push({
        category: 'STATISTICS_UPDATE',
        priority: 'MEDIUM',
        title: 'Update table statistics',
        details: outdatedStats,
        potentialImpact: 'Improve query planner decisions'
      });
    }

    return recommendations;
  }

  /**
   * 查找未使用的索引
   */
  async findUnusedIndexes() {
    return await this.sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan as scan_count,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND schemaname = 'public'
        AND NOT indisunique  -- 不包括唯一索引
      ORDER BY pg_relation_size(indexrelid) DESC;
    `, {
      type: this.sequelize.QueryTypes.SELECT
    });
  }

  /**
   * 建議缺失的索引
   */
  async suggestMissingIndexes() {
    // 基於慢查詢日誌分析建議索引
    return await this.sequelize.query(`
      WITH slow_queries AS (
        SELECT 
          query_text,
          COUNT(*) as frequency,
          AVG(execution_time_ms) as avg_time
        FROM query_performance_log
        WHERE execution_time_ms > 1000
          AND executed_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        GROUP BY query_text
        HAVING COUNT(*) > 10
      )
      SELECT 
        'Consider index on columns mentioned in WHERE/JOIN clauses' as suggestion,
        frequency,
        avg_time,
        LEFT(query_text, 200) as query_sample
      FROM slow_queries
      ORDER BY frequency * avg_time DESC
      LIMIT 10;
    `, {
      type: this.sequelize.QueryTypes.SELECT
    });
  }

  /**
   * 查找過期的統計信息
   */
  async findOutdatedStatistics() {
    return await this.sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        last_analyze,
        last_autoanalyze,
        n_tup_ins + n_tup_upd + n_tup_del as total_changes
      FROM pg_stat_user_tables
      WHERE (last_analyze IS NULL OR last_analyze < CURRENT_TIMESTAMP - INTERVAL '7 days')
        AND (last_autoanalyze IS NULL OR last_autoanalyze < CURRENT_TIMESTAMP - INTERVAL '7 days')
        AND (n_tup_ins + n_tup_upd + n_tup_del) > 1000
      ORDER BY total_changes DESC;
    `, {
      type: this.sequelize.QueryTypes.SELECT
    });
  }
}

export default {
  QueryPerformanceMonitor,
  AutoPerformanceTuner
};