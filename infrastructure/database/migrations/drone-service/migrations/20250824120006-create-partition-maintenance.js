'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. 創建分區維護調度函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION schedule_partition_maintenance()
      RETURNS TABLE(
          action_type text,
          partition_name text,
          execution_time interval,
          result_status text,
          details text
      ) AS $$
      DECLARE
          start_time timestamp;
          end_time timestamp;
          maintenance_record record;
      BEGIN
          start_time := CURRENT_TIMESTAMP;
          
          -- 1. 自動創建未來分區
          PERFORM auto_create_monthly_partitions();
          end_time := CURRENT_TIMESTAMP;
          
          RETURN QUERY SELECT 
              'CREATE_FUTURE_PARTITIONS'::text,
              'ALL_FUTURE_PARTITIONS'::text,
              end_time - start_time,
              'SUCCESS'::text,
              'Future partitions created successfully'::text;
          
          -- 2. 分析現有分區
          start_time := CURRENT_TIMESTAMP;
          ANALYZE drone_positions;
          end_time := CURRENT_TIMESTAMP;
          
          RETURN QUERY SELECT 
              'ANALYZE_PARTITIONS'::text,
              'drone_positions'::text,
              end_time - start_time,
              'SUCCESS'::text,
              'Partition statistics updated'::text;
          
          -- 3. 檢查老舊分區
          FOR maintenance_record IN 
              SELECT * FROM archive_old_drone_data()
          LOOP
              RETURN QUERY SELECT 
                  'CHECK_OLD_PARTITIONS'::text,
                  maintenance_record.partition_name,
                  '0 seconds'::interval,
                  maintenance_record.action_taken,
                  format('Records: %s, Size: %s', 
                         maintenance_record.records_count, 
                         maintenance_record.partition_size);
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. 創建分區性能監控函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION monitor_partition_performance()
      RETURNS TABLE(
          partition_name text,
          total_size text,
          record_count bigint,
          avg_query_time_ms numeric,
          index_efficiency numeric,
          fragmentation_ratio numeric,
          recommendation text
      ) AS $$
      DECLARE
          partition_record record;
          query_stats record;
          index_stats record;
      BEGIN
          FOR partition_record IN 
              SELECT tablename 
              FROM pg_tables 
              WHERE tablename LIKE 'drone_positions_%'
                AND schemaname = 'public'
          LOOP
              -- 基礎分區統計
              DECLARE
                  part_size text;
                  part_count bigint;
                  avg_time numeric := 0;
                  idx_efficiency numeric := 0;
                  fragmentation numeric := 0;
                  rec_text text := 'Healthy partition';
              BEGIN
                  -- 獲取分區大小
                  SELECT pg_size_pretty(pg_total_relation_size(partition_record.tablename::regclass))
                  INTO part_size;
                  
                  -- 獲取記錄數量
                  EXECUTE format('SELECT count(*) FROM %I', partition_record.tablename)
                  INTO part_count;
                  
                  -- 估算查詢效能（簡化版本）
                  SELECT COALESCE(
                      (SELECT avg(mean_exec_time) 
                       FROM pg_stat_statements 
                       WHERE query LIKE '%' || partition_record.tablename || '%'), 
                      0
                  ) INTO avg_time;
                  
                  -- 計算索引效率
                  SELECT COALESCE(
                      avg(CASE 
                          WHEN idx_scan + seq_scan = 0 THEN 0
                          ELSE idx_scan::numeric / (idx_scan + seq_scan) * 100
                      END), 
                      0
                  )
                  FROM pg_stat_user_tables
                  WHERE relname = partition_record.tablename
                  INTO idx_efficiency;
                  
                  -- 簡化的碎片化檢查
                  fragmentation := 
                      CASE 
                          WHEN part_count > 1000000 THEN 15.0  -- 大表假設有碎片化
                          WHEN part_count > 100000 THEN 5.0
                          ELSE 1.0
                      END;
                  
                  -- 生成建議
                  rec_text := 
                      CASE 
                          WHEN part_count = 0 THEN 'Empty partition - consider dropping'
                          WHEN part_count > 5000000 THEN 'Very large partition - monitor performance'
                          WHEN idx_efficiency < 50 THEN 'Low index usage - check query patterns'
                          WHEN fragmentation > 20 THEN 'High fragmentation - consider VACUUM FULL'
                          ELSE 'Partition is healthy'
                      END;
                  
                  RETURN QUERY SELECT 
                      partition_record.tablename,
                      part_size,
                      part_count,
                      avg_time,
                      idx_efficiency,
                      fragmentation,
                      rec_text;
              END;
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. 創建分區數據遷移優化函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION optimize_partition_data(
          target_partition text,
          optimization_type text DEFAULT 'vacuum'
      )
      RETURNS TABLE(
          operation text,
          duration interval,
          space_freed text,
          performance_gain numeric,
          status text
      ) AS $$
      DECLARE
          start_time timestamp;
          end_time timestamp;
          size_before bigint;
          size_after bigint;
      BEGIN
          start_time := CURRENT_TIMESTAMP;
          
          -- 檢查分區是否存在
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = target_partition) THEN
              RETURN QUERY SELECT 
                  'VALIDATION'::text,
                  '0 seconds'::interval,
                  '0 bytes'::text,
                  0::numeric,
                  'ERROR: Partition not found'::text;
              RETURN;
          END IF;
          
          -- 記錄操作前大小
          SELECT pg_total_relation_size(target_partition::regclass) INTO size_before;
          
          CASE optimization_type
              WHEN 'vacuum' THEN
                  -- 執行 VACUUM
                  EXECUTE format('VACUUM (ANALYZE, VERBOSE) %I', target_partition);
                  
              WHEN 'vacuum_full' THEN
                  -- 執行 VACUUM FULL（需要排他鎖）
                  EXECUTE format('VACUUM FULL %I', target_partition);
                  
              WHEN 'reindex' THEN
                  -- 重建索引
                  EXECUTE format('REINDEX TABLE %I', target_partition);
                  
              WHEN 'analyze' THEN
                  -- 只更新統計信息
                  EXECUTE format('ANALYZE %I', target_partition);
                  
              ELSE
                  RETURN QUERY SELECT 
                      'VALIDATION'::text,
                      '0 seconds'::interval,
                      '0 bytes'::text,
                      0::numeric,
                      'ERROR: Unknown optimization type'::text;
                  RETURN;
          END CASE;
          
          end_time := CURRENT_TIMESTAMP;
          SELECT pg_total_relation_size(target_partition::regclass) INTO size_after;
          
          RETURN QUERY SELECT 
              optimization_type::text,
              end_time - start_time,
              pg_size_pretty(size_before - size_after),
              CASE 
                  WHEN size_before > 0 THEN ((size_before - size_after)::numeric / size_before * 100)
                  ELSE 0
              END,
              'SUCCESS'::text;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 4. 創建智能分區路由改進版
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION smart_insert_drone_batch(
          drone_data jsonb[]
      )
      RETURNS TABLE(
          inserted_count bigint,
          failed_count bigint,
          execution_time interval,
          partition_distribution jsonb
      ) AS $$
      DECLARE
          start_time timestamp;
          end_time timestamp;
          success_count bigint := 0;
          fail_count bigint := 0;
          data_item jsonb;
          partition_stats jsonb := '{}';
          target_partition text;
          partition_count integer;
      BEGIN
          start_time := CURRENT_TIMESTAMP;
          
          -- 批量插入處理
          FOREACH data_item IN ARRAY drone_data
          LOOP
              BEGIN
                  -- 確定目標分區
                  target_partition := 'drone_positions_' || 
                      to_char((data_item->>'recordedAt')::timestamp, 'YYYY_MM');
                  
                  -- 確保分區存在
                  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = target_partition) THEN
                      -- 自動創建分區
                      EXECUTE format(
                          'CREATE TABLE %I PARTITION OF drone_positions 
                           FOR VALUES FROM (%L) TO (%L)',
                          target_partition,
                          date_trunc('month', (data_item->>'recordedAt')::timestamp),
                          date_trunc('month', (data_item->>'recordedAt')::timestamp) + interval '1 month'
                      );
                  END IF;
                  
                  -- 執行插入
                  INSERT INTO drone_positions (
                      "droneId", latitude, longitude, altitude, heading, speed,
                      accuracy, "gpsStatus", "recordedAt", metadata
                  ) VALUES (
                      data_item->>'droneId',
                      (data_item->>'latitude')::numeric,
                      (data_item->>'longitude')::numeric,
                      COALESCE((data_item->>'altitude')::numeric, 0),
                      COALESCE((data_item->>'heading')::numeric, 0),
                      COALESCE((data_item->>'speed')::numeric, 0),
                      COALESCE((data_item->>'accuracy')::numeric, 0),
                      COALESCE(data_item->>'gpsStatus', 'unknown'),
                      (data_item->>'recordedAt')::timestamp,
                      data_item->'metadata'
                  );
                  
                  success_count := success_count + 1;
                  
                  -- 統計分區使用情況
                  SELECT COALESCE((partition_stats->>target_partition)::integer, 0) + 1 INTO partition_count;
                  partition_stats := jsonb_set(partition_stats, ARRAY[target_partition], to_jsonb(partition_count));
                  
              EXCEPTION WHEN OTHERS THEN
                  fail_count := fail_count + 1;
                  CONTINUE;
              END;
          END LOOP;
          
          end_time := CURRENT_TIMESTAMP;
          
          RETURN QUERY SELECT 
              success_count,
              fail_count,
              end_time - start_time,
              partition_stats;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 5. 創建分區清理策略
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_partitions(
          retention_months integer DEFAULT 24,
          dry_run boolean DEFAULT true
      )
      RETURNS TABLE(
          partition_name text,
          partition_date text,
          record_count bigint,
          size_mb numeric,
          action_taken text,
          space_freed text
      ) AS $$
      DECLARE
          old_partition_name text;
          cutoff_date date;
          records_count bigint;
          partition_size bigint;
          size_mb_calc numeric;
      BEGIN
          -- 計算保留截止日期
          cutoff_date := date_trunc('month', CURRENT_DATE - (retention_months || ' months')::interval);
          
          -- 查找需要清理的分區
          FOR old_partition_name IN 
              SELECT tablename 
              FROM pg_tables 
              WHERE tablename ~ '^drone_positions_[0-9]{4}_[0-9]{2}$'
                AND tablename < 'drone_positions_' || to_char(cutoff_date, 'YYYY_MM')
                AND schemaname = 'public'
              ORDER BY tablename
          LOOP
              -- 獲取分區統計
              EXECUTE format('SELECT count(*) FROM %I', old_partition_name) INTO records_count;
              SELECT pg_total_relation_size(old_partition_name::regclass) INTO partition_size;
              size_mb_calc := partition_size / 1024.0 / 1024.0;
              
              IF NOT dry_run THEN
                  -- 實際刪除分區
                  EXECUTE format('DROP TABLE %I', old_partition_name);
                  
                  RETURN QUERY SELECT 
                      old_partition_name,
                      substring(old_partition_name from 'drone_positions_(.+)'),
                      records_count,
                      size_mb_calc,
                      'DROPPED'::text,
                      pg_size_pretty(partition_size);
              ELSE
                  -- 乾跑模式，只報告
                  RETURN QUERY SELECT 
                      old_partition_name,
                      substring(old_partition_name from 'drone_positions_(.+)'),
                      records_count,
                      size_mb_calc,
                      'WOULD_DROP'::text,
                      pg_size_pretty(partition_size);
              END IF;
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 6. 創建分區健康檢查視圖
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW partition_health_dashboard AS
      WITH partition_stats AS (
          SELECT 
              tablename as partition_name,
              substring(tablename from 'drone_positions_(.+)') as time_period,
              pg_total_relation_size(schemaname||'.'||tablename) as total_size,
              pg_relation_size(schemaname||'.'||tablename) as table_size
          FROM pg_tables 
          WHERE tablename LIKE 'drone_positions_%'
            AND schemaname = 'public'
      ),
      partition_records AS (
          SELECT 
              p.partition_name,
              p.time_period,
              p.total_size,
              p.table_size,
              COALESCE(s.n_tup_ins, 0) as inserts,
              COALESCE(s.n_tup_upd, 0) as updates,
              COALESCE(s.n_tup_del, 0) as deletes,
              COALESCE(s.seq_scan, 0) as seq_scans,
              COALESCE(s.idx_scan, 0) as index_scans
          FROM partition_stats p
          LEFT JOIN pg_stat_user_tables s ON s.relname = p.partition_name
      )
      SELECT 
          partition_name,
          time_period,
          pg_size_pretty(total_size) as total_size,
          pg_size_pretty(table_size) as table_size,
          inserts + updates + deletes as total_operations,
          seq_scans,
          index_scans,
          CASE 
              WHEN index_scans + seq_scans = 0 THEN 'No Activity'
              WHEN index_scans::numeric / (index_scans + seq_scans) > 0.9 THEN 'Excellent'
              WHEN index_scans::numeric / (index_scans + seq_scans) > 0.7 THEN 'Good'
              WHEN index_scans::numeric / (index_scans + seq_scans) > 0.5 THEN 'Fair'
              ELSE 'Poor'
          END as index_usage_rating,
          CASE 
              WHEN total_size > 1073741824 THEN 'Large (>1GB)'
              WHEN total_size > 268435456 THEN 'Medium (>256MB)'
              WHEN total_size > 0 THEN 'Small'
              ELSE 'Empty'
          END as size_category
      FROM partition_records
      ORDER BY time_period DESC;
    `);

    console.log('✅ Advanced partition maintenance, monitoring and cleanup functions created successfully');
  },

  async down(queryInterface, Sequelize) {
    // 移除函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS schedule_partition_maintenance();
      DROP FUNCTION IF EXISTS monitor_partition_performance();
      DROP FUNCTION IF EXISTS optimize_partition_data(text, text);
      DROP FUNCTION IF EXISTS smart_insert_drone_batch(jsonb[]);
      DROP FUNCTION IF EXISTS cleanup_old_partitions(integer, boolean);
    `);

    // 移除視圖
    await queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS partition_health_dashboard;
    `);

    console.log('✅ Advanced partition maintenance functions removed successfully');
  }
};