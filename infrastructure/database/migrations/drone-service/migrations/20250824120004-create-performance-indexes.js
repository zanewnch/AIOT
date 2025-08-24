'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. 無人機狀態查詢優化索引
    
    // 活躍無人機快速查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_status_active_lookup 
      ON drone_status ("droneId", status, "batteryLevel") 
      WHERE "isActive" = true;
    `);

    // 低電量無人機預警查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_status_battery_warning 
      ON drone_status ("batteryLevel" ASC, "droneId", "lastHeartbeat") 
      WHERE "isActive" = true AND "batteryLevel" < 30;
    `);

    // 無人機型號統計查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_status_model_stats 
      ON drone_status (model, status, "createdAt")
      WHERE model IS NOT NULL AND "isActive" = true;
    `);

    // 2. 無人機位置數據優化索引（每個分區會自動繼承）
    
    // 最新位置查詢（每個無人機的最新記錄）
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_positions_latest 
      ON drone_positions ("droneId", "recordedAt" DESC);
    `);

    // 時間範圍內的軌跡查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_positions_trajectory 
      ON drone_positions ("droneId", "recordedAt", latitude, longitude)
      INCLUDE (altitude, heading, speed);
    `);

    // 地理範圍查詢（使用空間索引）
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_positions_spatial 
      ON drone_positions USING gist (
          ll_to_earth(latitude, longitude), 
          "recordedAt"
      );
    `);

    // GPS 精度查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_positions_accuracy 
      ON drone_positions ("gpsStatus", accuracy, "droneId", "recordedAt")
      WHERE "gpsStatus" IN ('3d_fix', 'dgps_fix', 'rtk_fix');
    `);

    // 3. 無人機指令執行優化索引
    
    // 待執行指令隊列查詢（按優先級和時間排序）
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_commands_queue 
      ON drone_commands (status, priority DESC, "createdAt" ASC)
      WHERE status IN ('pending', 'sent', 'acknowledged');
    `);

    // 特定無人機的指令歷史
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_commands_history 
      ON drone_commands ("droneId", "createdAt" DESC, status)
      INCLUDE ("commandType", "completedAt");
    `);

    // 指令執行時間分析
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_commands_performance 
      ON drone_commands ("commandType", "completedAt", "executedAt")
      WHERE status = 'completed' AND "executedAt" IS NOT NULL AND "completedAt" IS NOT NULL;
    `);

    // 超時指令監控
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_commands_timeout 
      ON drone_commands ("sentAt", timeout, status)
      WHERE status IN ('sent', 'executing') AND "sentAt" IS NOT NULL;
    `);

    // 失敗指令分析
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_commands_failures 
      ON drone_commands ("commandType", "retryCount", "failureReason")
      WHERE status = 'failed';
    `);

    // 4. 時間序列數據優化
    
    // 按小時聚合的位置數據查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_positions_hourly 
      ON drone_positions (
          "droneId", 
          DATE_TRUNC('hour', "recordedAt"), 
          "recordedAt"
      );
    `);

    // 心跳監控查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_status_heartbeat 
      ON drone_status ("lastHeartbeat" DESC, "droneId", status)
      WHERE "lastHeartbeat" IS NOT NULL AND "isActive" = true;
    `);

    // 5. JSON 數據查詢優化
    
    // 位置元數據 GIN 索引
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_positions_metadata_gin 
      ON drone_positions USING gin (metadata);
    `);

    // 無人機狀態元數據 GIN 索引
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_status_metadata_gin 
      ON drone_status USING gin (metadata);
    `);

    // 指令參數 GIN 索引
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_commands_parameters_gin 
      ON drone_commands USING gin (parameters);
    `);

    // 6. 複合業務查詢索引
    
    // 飛行中無人機的最新狀態
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_flying_status 
      ON drone_status ("droneId", "lastHeartbeat", "batteryLevel")
      WHERE status = 'flying' AND "isActive" = true;
    `);

    // 維護模式的無人機
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_maintenance 
      ON drone_status ("createdAt" DESC, model, firmware)
      WHERE status = 'maintenance';
    `);

    // 7. 統計和報表查詢索引
    
    // 每日飛行統計
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_daily_stats 
      ON drone_positions (
          DATE("recordedAt"), 
          "droneId"
      ) INCLUDE (latitude, longitude, altitude);
    `);

    // 指令類型統計
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drone_command_type_stats 
      ON drone_commands ("commandType", DATE("createdAt"), status);
    `);

    // 8. 創建無人機性能監控視圖
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW drone_performance_stats AS
      WITH latest_positions AS (
          SELECT DISTINCT ON ("droneId") 
              "droneId", 
              latitude, 
              longitude, 
              altitude, 
              speed, 
              "recordedAt"
          FROM drone_positions 
          ORDER BY "droneId", "recordedAt" DESC
      ),
      command_stats AS (
          SELECT 
              "droneId",
              COUNT(*) as total_commands,
              COUNT(*) FILTER (WHERE status = 'completed') as completed_commands,
              COUNT(*) FILTER (WHERE status = 'failed') as failed_commands,
              AVG(EXTRACT(EPOCH FROM ("completedAt" - "createdAt"))) as avg_execution_time
          FROM drone_commands 
          WHERE "createdAt" >= CURRENT_DATE - INTERVAL '24 hours'
          GROUP BY "droneId"
      )
      SELECT 
          ds."droneId",
          ds.status as current_status,
          ds."batteryLevel",
          ds."lastHeartbeat",
          lp.latitude,
          lp.longitude,
          lp.altitude,
          lp.speed as current_speed,
          lp."recordedAt" as last_position_update,
          COALESCE(cs.total_commands, 0) as commands_24h,
          COALESCE(cs.completed_commands, 0) as completed_commands_24h,
          COALESCE(cs.failed_commands, 0) as failed_commands_24h,
          COALESCE(cs.avg_execution_time, 0) as avg_execution_time_24h
      FROM drone_status ds
      LEFT JOIN latest_positions lp ON ds."droneId" = lp."droneId"
      LEFT JOIN command_stats cs ON ds."droneId" = cs."droneId"
      WHERE ds."isActive" = true;
    `);

    // 9. 創建索引使用情況監控
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW drone_index_usage_stats AS
      SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched,
          pg_size_pretty(pg_relation_size(indexrelid)) as size,
          CASE 
              WHEN idx_scan = 0 THEN 'Unused'
              WHEN idx_scan < 100 THEN 'Low Usage'
              WHEN idx_scan < 1000 THEN 'Medium Usage'
              ELSE 'High Usage'
          END as usage_category
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
        AND (tablename LIKE 'drone_%' OR tablename LIKE '%positions%' OR tablename LIKE '%commands%')
      ORDER BY idx_scan DESC;
    `);

    // 10. 創建分區維護和索引優化函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION optimize_drone_indexes()
      RETURNS void AS $$
      DECLARE
          partition_record record;
          index_record record;
      BEGIN
          -- 維護分區索引
          FOR partition_record IN 
              SELECT schemaname, tablename 
              FROM pg_tables 
              WHERE tablename LIKE 'drone_positions_%'
                AND schemaname = 'public'
          LOOP
              -- 更新分區統計信息
              EXECUTE format('ANALYZE %I.%I', partition_record.schemaname, partition_record.tablename);
              RAISE NOTICE 'Analyzed partition: %', partition_record.tablename;
          END LOOP;
          
          -- 重建使用頻繁但碎片化的索引
          FOR index_record IN 
              SELECT indexname 
              FROM pg_stat_user_indexes 
              WHERE schemaname = 'public' 
                AND tablename LIKE 'drone_%'
                AND idx_scan > 1000  -- 高使用頻率
          LOOP
              -- 在維護窗口期間執行
              EXECUTE format('REINDEX INDEX CONCURRENTLY %I', index_record.indexname);
              RAISE NOTICE 'Reindexed: %', index_record.indexname;
          END LOOP;
          
          RAISE NOTICE 'Drone indexes optimization completed';
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Drone service performance indexes, monitoring views and optimization functions created successfully');
  },

  async down(queryInterface, Sequelize) {
    // 移除函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS optimize_drone_indexes();
    `);

    // 移除視圖
    await queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS drone_performance_stats;
      DROP VIEW IF EXISTS drone_index_usage_stats;
    `);

    // 移除並發創建的索引
    await queryInterface.sequelize.query(`
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_status_active_lookup;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_status_battery_warning;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_status_model_stats;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_positions_latest;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_positions_trajectory;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_positions_spatial;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_positions_accuracy;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_commands_queue;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_commands_history;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_commands_performance;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_commands_timeout;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_commands_failures;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_positions_hourly;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_status_heartbeat;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_positions_metadata_gin;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_status_metadata_gin;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_commands_parameters_gin;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_flying_status;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_maintenance;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_daily_stats;
      DROP INDEX CONCURRENTLY IF EXISTS idx_drone_command_type_stats;
    `);

    console.log('✅ Drone service performance indexes removed successfully');
  }
};