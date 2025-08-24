'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. 創建自動分區管理系統
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION auto_create_monthly_partitions()
      RETURNS void AS $$
      DECLARE
          start_date date;
          end_date date;
          partition_name text;
          future_months integer := 6; -- 創建未來6個月的分區
      BEGIN
          FOR i IN 1..future_months LOOP
              start_date := date_trunc('month', CURRENT_DATE + (i || ' month')::interval);
              end_date := start_date + interval '1 month';
              partition_name := 'drone_positions_' || to_char(start_date, 'YYYY_MM');
              
              IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = partition_name) THEN
                  EXECUTE format('CREATE TABLE %I PARTITION OF drone_positions 
                                 FOR VALUES FROM (%L) TO (%L)', 
                                 partition_name, start_date, end_date);
                                 
                  -- 為新分區創建專門的索引
                  EXECUTE format('CREATE INDEX %I ON %I ("droneId", "recordedAt")', 
                                 'idx_' || partition_name || '_drone_time', partition_name);
                  EXECUTE format('CREATE INDEX %I ON %I USING gist (ll_to_earth(latitude, longitude))', 
                                 'idx_' || partition_name || '_location', partition_name);
                                 
                  RAISE NOTICE 'Created partition % with indexes', partition_name;
              END IF;
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 2. 創建歷史數據歸檔系統
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION archive_old_drone_data()
      RETURNS TABLE(
          partition_name text,
          records_count bigint,
          partition_size text,
          action_taken text
      ) AS $$
      DECLARE
          old_partition_name text;
          archive_date date;
          records_count bigint;
          partition_size bigint;
          archive_threshold_months integer := 12; -- 歸檔12個月前的數據
      BEGIN
          archive_date := date_trunc('month', CURRENT_DATE - (archive_threshold_months || ' months')::interval);
          
          FOR old_partition_name IN 
              SELECT tablename 
              FROM pg_tables 
              WHERE tablename ~ '^drone_positions_[0-9]{4}_[0-9]{2}$'
                AND tablename <= 'drone_positions_' || to_char(archive_date, 'YYYY_MM')
          LOOP
              -- 獲取分區統計信息
              EXECUTE format('SELECT count(*) FROM %I', old_partition_name) INTO records_count;
              SELECT pg_relation_size(old_partition_name::regclass) INTO partition_size;
              
              -- 返回信息而不是直接刪除，由管理員決定
              RETURN QUERY SELECT 
                  old_partition_name,
                  records_count,
                  pg_size_pretty(partition_size),
                  CASE 
                      WHEN records_count > 1000000 THEN 'LARGE_PARTITION_REVIEW_NEEDED'
                      WHEN records_count > 0 THEN 'READY_FOR_ARCHIVE'
                      ELSE 'EMPTY_PARTITION_CAN_DROP'
                  END;
          END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. 創建分區統計和監控
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW drone_partition_stats AS
      SELECT 
          schemaname,
          tablename as partition_name,
          REGEXP_REPLACE(tablename, 'drone_positions_', '') as time_period,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          (SELECT count(*) FROM information_schema.columns WHERE table_name = t.tablename) as column_count,
          (SELECT count(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count
      FROM pg_tables t
      WHERE tablename LIKE 'drone_positions_%'
        AND schemaname = 'public'
      ORDER BY tablename DESC;
    `);

    // 4. 創建跨分區查詢優化
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION get_drone_trajectory(
          p_drone_id varchar(50),
          p_start_time timestamp,
          p_end_time timestamp,
          p_sample_interval interval DEFAULT '1 minute'
      )
      RETURNS TABLE(
          recorded_at timestamp,
          latitude decimal(10,8),
          longitude decimal(11,8),
          altitude decimal(8,2),
          speed decimal(6,2),
          heading decimal(5,2)
      ) AS $$
      BEGIN
          -- 優化的跨分區軌跡查詢，帶採樣間隔
          RETURN QUERY
          WITH sampled_positions AS (
              SELECT 
                  dp."recordedAt",
                  dp.latitude,
                  dp.longitude,
                  dp.altitude,
                  dp.speed,
                  dp.heading,
                  ROW_NUMBER() OVER (
                      PARTITION BY DATE_TRUNC('minute', dp."recordedAt") / EXTRACT(EPOCH FROM p_sample_interval)
                      ORDER BY dp."recordedAt"
                  ) as rn
              FROM drone_positions dp
              WHERE dp."droneId" = p_drone_id
                AND dp."recordedAt" BETWEEN p_start_time AND p_end_time
          )
          SELECT 
              sp."recordedAt",
              sp.latitude,
              sp.longitude,
              sp.altitude,
              sp.speed,
              sp.heading
          FROM sampled_positions sp
          WHERE sp.rn = 1
          ORDER BY sp."recordedAt";
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 5. 創建分區維護計劃任務
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION schedule_partition_maintenance()
      RETURNS text AS $$
      DECLARE
          result text := '';
      BEGIN
          -- 創建未來分區
          PERFORM auto_create_monthly_partitions();
          result := result || 'Auto-created future partitions. ';
          
          -- 更新所有分區統計信息
          PERFORM pg_stat_reset();
          result := result || 'Reset statistics. ';
          
          -- 分析所有 drone_positions 相關表
          ANALYZE drone_positions;
          result := result || 'Analyzed main table. ';
          
          -- 清理連接
          PERFORM pg_stat_clear_snapshot();
          result := result || 'Cleared snapshots. ';
          
          RETURN result || 'Partition maintenance completed successfully.';
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 6. 創建智能分區路由
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION insert_drone_position_smart(
          p_drone_id varchar(50),
          p_latitude decimal(10,8),
          p_longitude decimal(11,8),
          p_altitude decimal(8,2) DEFAULT 0,
          p_heading decimal(5,2) DEFAULT 0,
          p_speed decimal(6,2) DEFAULT 0,
          p_accuracy decimal(5,2) DEFAULT 0,
          p_gps_status varchar(20) DEFAULT 'unknown',
          p_recorded_at timestamp DEFAULT CURRENT_TIMESTAMP,
          p_metadata jsonb DEFAULT NULL
      )
      RETURNS bigint AS $$
      DECLARE
          new_id bigint;
          target_partition text;
      BEGIN
          -- 確保目標分區存在
          target_partition := 'drone_positions_' || to_char(p_recorded_at, 'YYYY_MM');
          
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = target_partition) THEN
              RAISE EXCEPTION 'Partition % does not exist for timestamp %', target_partition, p_recorded_at;
          END IF;
          
          -- 插入數據並返回ID
          INSERT INTO drone_positions (
              "droneId", latitude, longitude, altitude, heading, speed, 
              accuracy, "gpsStatus", "recordedAt", metadata
          ) VALUES (
              p_drone_id, p_latitude, p_longitude, p_altitude, p_heading, 
              p_speed, p_accuracy, p_gps_status, p_recorded_at, p_metadata
          ) RETURNING id INTO new_id;
          
          RETURN new_id;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 7. 創建分區數據遷移工具
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION migrate_partition_data(
          source_partition text,
          target_partition text,
          batch_size integer DEFAULT 1000
      )
      RETURNS TABLE(
          migrated_records bigint,
          migration_time interval,
          status text
      ) AS $$
      DECLARE
          start_time timestamp;
          end_time timestamp;
          total_migrated bigint := 0;
          batch_count integer := 0;
      BEGIN
          start_time := CURRENT_TIMESTAMP;
          
          -- 檢查源分區是否存在
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = source_partition) THEN
              RETURN QUERY SELECT 0::bigint, '0 seconds'::interval, 'SOURCE_PARTITION_NOT_FOUND'::text;
              RETURN;
          END IF;
          
          -- 檢查目標分區是否存在
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = target_partition) THEN
              RETURN QUERY SELECT 0::bigint, '0 seconds'::interval, 'TARGET_PARTITION_NOT_FOUND'::text;
              RETURN;
          END IF;
          
          -- 批量遷移數據 (這裡只是示例，實際實現需要更複雜的邏輯)
          LOOP
              EXECUTE format('INSERT INTO %I SELECT * FROM %I LIMIT %s', 
                           target_partition, source_partition, batch_size);
              
              GET DIAGNOSTICS batch_count = ROW_COUNT;
              total_migrated := total_migrated + batch_count;
              
              EXIT WHEN batch_count = 0;
          END LOOP;
          
          end_time := CURRENT_TIMESTAMP;
          
          RETURN QUERY SELECT 
              total_migrated,
              end_time - start_time,
              'MIGRATION_COMPLETED'::text;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Enhanced partitioning system with auto-management, archival, and monitoring created successfully');
  },

  async down(queryInterface, Sequelize) {
    // 移除函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS auto_create_monthly_partitions();
      DROP FUNCTION IF EXISTS archive_old_drone_data();
      DROP FUNCTION IF EXISTS get_drone_trajectory(varchar(50), timestamp, timestamp, interval);
      DROP FUNCTION IF EXISTS schedule_partition_maintenance();
      DROP FUNCTION IF EXISTS insert_drone_position_smart(varchar(50), decimal(10,8), decimal(11,8), decimal(8,2), decimal(5,2), decimal(6,2), decimal(5,2), varchar(20), timestamp, jsonb);
      DROP FUNCTION IF EXISTS migrate_partition_data(text, text, integer);
    `);

    // 移除視圖
    await queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS drone_partition_stats;
    `);

    console.log('✅ Enhanced partitioning system removed successfully');
  }
};