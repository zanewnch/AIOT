'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. 無人機狀態表的高級約束
    await queryInterface.addConstraint('drone_status', {
      fields: ['droneId'],
      type: 'check',
      where: Sequelize.literal("\"droneId\" ~ '^[A-Z0-9]{3,20}$'"),
      name: 'drone_status_droneId_format_check'
    });

    await queryInterface.addConstraint('drone_status', {
      fields: ['batteryLevel'],
      type: 'check',
      where: {
        batteryLevel: {
          [Sequelize.Op.and]: [
            { [Sequelize.Op.gte]: 0 },
            { [Sequelize.Op.lte]: 100 }
          ]
        }
      },
      name: 'drone_status_battery_range_check'
    });

    await queryInterface.addConstraint('drone_status', {
      fields: ['lastHeartbeat'],
      type: 'check',
      where: Sequelize.literal('"lastHeartbeat" <= CURRENT_TIMESTAMP'),
      name: 'drone_status_heartbeat_time_check'
    });

    // 2. 無人機位置表的地理約束
    await queryInterface.sequelize.query(`
      ALTER TABLE drone_positions 
      ADD CONSTRAINT drone_positions_latitude_range_check 
      CHECK (latitude BETWEEN -90.0 AND 90.0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE drone_positions 
      ADD CONSTRAINT drone_positions_longitude_range_check 
      CHECK (longitude BETWEEN -180.0 AND 180.0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE drone_positions 
      ADD CONSTRAINT drone_positions_altitude_range_check 
      CHECK (altitude BETWEEN -1000.0 AND 50000.0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE drone_positions 
      ADD CONSTRAINT drone_positions_heading_range_check 
      CHECK (heading BETWEEN 0.0 AND 360.0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE drone_positions 
      ADD CONSTRAINT drone_positions_speed_range_check 
      CHECK (speed >= 0.0 AND speed <= 200.0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE drone_positions 
      ADD CONSTRAINT drone_positions_accuracy_range_check 
      CHECK (accuracy >= 0.0);
    `);

    // 3. 記錄時間邏輯約束
    await queryInterface.sequelize.query(`
      ALTER TABLE drone_positions 
      ADD CONSTRAINT drone_positions_recorded_at_check 
      CHECK ("recordedAt" <= CURRENT_TIMESTAMP + INTERVAL '1 hour');
    `);

    // 4. GPS狀態枚舉約束
    await queryInterface.addConstraint('drone_positions', {
      fields: ['gpsStatus'],
      type: 'check',
      where: {
        gpsStatus: {
          [Sequelize.Op.in]: [
            'unknown', 'no_fix', '2d_fix', '3d_fix', 
            'dgps_fix', 'rtk_fix', 'rtk_float', 'dead_reckoning'
          ]
        }
      },
      name: 'drone_positions_gps_status_enum_check'
    });

    // 5. 無人機指令表的業務邏輯約束
    await queryInterface.addConstraint('drone_commands', {
      fields: ['priority'],
      type: 'check',
      where: {
        priority: {
          [Sequelize.Op.and]: [
            { [Sequelize.Op.gte]: 1 },
            { [Sequelize.Op.lte]: 10 }
          ]
        }
      },
      name: 'drone_commands_priority_range_check'
    });

    await queryInterface.addConstraint('drone_commands', {
      fields: ['timeout'],
      type: 'check',
      where: {
        timeout: {
          [Sequelize.Op.and]: [
            { [Sequelize.Op.gte]: 10 },  // 至少10秒
            { [Sequelize.Op.lte]: 3600 } // 最多1小時
          ]
        }
      },
      name: 'drone_commands_timeout_range_check'
    });

    await queryInterface.addConstraint('drone_commands', {
      fields: ['retryCount', 'maxRetries'],
      type: 'check',
      where: Sequelize.literal('"retryCount" <= "maxRetries"'),
      name: 'drone_commands_retry_logic_check'
    });

    // 6. 指令狀態轉換約束
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION validate_command_state_transition()
      RETURNS trigger AS $$
      BEGIN
          -- 檢查狀態轉換的合法性
          IF OLD.status IS NOT NULL THEN
              -- pending -> sent, cancelled
              IF OLD.status = 'pending' AND NEW.status NOT IN ('sent', 'cancelled', 'failed') THEN
                  RAISE EXCEPTION 'Invalid state transition from pending to %', NEW.status;
              END IF;
              
              -- sent -> acknowledged, failed, cancelled
              IF OLD.status = 'sent' AND NEW.status NOT IN ('acknowledged', 'failed', 'cancelled') THEN
                  RAISE EXCEPTION 'Invalid state transition from sent to %', NEW.status;
              END IF;
              
              -- acknowledged -> executing, failed, cancelled
              IF OLD.status = 'acknowledged' AND NEW.status NOT IN ('executing', 'failed', 'cancelled') THEN
                  RAISE EXCEPTION 'Invalid state transition from acknowledged to %', NEW.status;
              END IF;
              
              -- executing -> completed, failed, cancelled
              IF OLD.status = 'executing' AND NEW.status NOT IN ('completed', 'failed', 'cancelled') THEN
                  RAISE EXCEPTION 'Invalid state transition from executing to %', NEW.status;
              END IF;
              
              -- 終態不能再變更
              IF OLD.status IN ('completed', 'failed', 'cancelled') THEN
                  RAISE EXCEPTION 'Cannot change status from final state: %', OLD.status;
              END IF;
          END IF;
          
          -- 設置時間戳
          IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
              NEW."sentAt" = CURRENT_TIMESTAMP;
          END IF;
          
          IF NEW.status = 'acknowledged' AND OLD.status != 'acknowledged' THEN
              NEW."acknowledgedAt" = CURRENT_TIMESTAMP;
          END IF;
          
          IF NEW.status = 'executing' AND OLD.status != 'executing' THEN
              NEW."executedAt" = CURRENT_TIMESTAMP;
          END IF;
          
          IF NEW.status IN ('completed', 'failed') AND OLD.status NOT IN ('completed', 'failed') THEN
              NEW."completedAt" = CURRENT_TIMESTAMP;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 7. 創建狀態轉換觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER drone_commands_state_transition_check
      BEFORE UPDATE ON drone_commands
      FOR EACH ROW EXECUTE FUNCTION validate_command_state_transition();
    `);

    // 8. 創建複合索引優化查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_drone_status_droneId_active 
      ON drone_status ("droneId") 
      WHERE "isActive" = true;
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX idx_drone_status_battery_critical 
      ON drone_status ("batteryLevel", "droneId") 
      WHERE "batteryLevel" < 20 AND "isActive" = true;
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX idx_drone_commands_pending_priority 
      ON drone_commands (priority DESC, "createdAt" ASC) 
      WHERE status IN ('pending', 'sent');
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX idx_drone_commands_timeout_check 
      ON drone_commands ("droneId", "sentAt", timeout) 
      WHERE status IN ('sent', 'executing');
    `);

    // 9. 創建地理空間索引
    await queryInterface.sequelize.query(`
      -- 啟用 earthdistance 擴展（如果還沒有）
      CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
      
      -- 創建地理位置索引
      CREATE INDEX idx_drone_positions_geo_location 
      ON drone_positions USING gist (ll_to_earth(latitude, longitude));
    `);

    // 10. 創建分區維護函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION maintain_drone_partitions()
      RETURNS void AS $$
      DECLARE
          partition_date date;
          partition_name text;
          old_partition_name text;
      BEGIN
          -- 創建未來3個月的分區
          FOR i IN 1..3 LOOP
              partition_date := date_trunc('month', CURRENT_DATE + (i || ' month')::interval);
              partition_name := 'drone_positions_' || to_char(partition_date, 'YYYY_MM');
              
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.tables 
                  WHERE table_name = partition_name
              ) THEN
                  EXECUTE format('CREATE TABLE %I PARTITION OF drone_positions 
                                 FOR VALUES FROM (%L) TO (%L)',
                                 partition_name, 
                                 partition_date, 
                                 partition_date + interval '1 month');
                  RAISE NOTICE 'Created partition: %', partition_name;
              END IF;
          END LOOP;
          
          -- 清理6個月前的舊分區（可選）
          partition_date := date_trunc('month', CURRENT_DATE - interval '6 months');
          old_partition_name := 'drone_positions_' || to_char(partition_date, 'YYYY_MM');
          
          IF EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_name = old_partition_name
          ) THEN
              -- 在生產環境中，可能需要先備份數據
              -- EXECUTE format('DROP TABLE %I', old_partition_name);
              RAISE NOTICE 'Old partition exists but not dropped: %', old_partition_name;
          END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 11. 創建無人機數據驗證函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION validate_drone_data()
      RETURNS trigger AS $$
      BEGIN
          -- 檢查無人機是否存在且活躍
          IF TG_TABLE_NAME IN ('drone_positions', 'drone_commands') THEN
              IF NOT EXISTS (
                  SELECT 1 FROM drone_status 
                  WHERE "droneId" = NEW."droneId" AND "isActive" = true
              ) THEN
                  RAISE EXCEPTION 'Drone % is not active or does not exist', NEW."droneId";
              END IF;
          END IF;
          
          -- 位置數據的額外驗證
          IF TG_TABLE_NAME = 'drone_positions' THEN
              -- 檢查位置變化的合理性（防止瞬間移動）
              IF EXISTS (
                  SELECT 1 FROM drone_positions 
                  WHERE "droneId" = NEW."droneId" 
                  AND "recordedAt" > NEW."recordedAt" - interval '1 minute'
                  AND earth_distance(
                      ll_to_earth(latitude, longitude),
                      ll_to_earth(NEW.latitude, NEW.longitude)
                  ) > 10000 -- 10km in 1 minute seems suspicious
              ) THEN
                  RAISE WARNING 'Suspicious position change detected for drone %', NEW."droneId";
              END IF;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 12. 創建數據驗證觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER drone_positions_validation_trigger
      BEFORE INSERT ON drone_positions
      FOR EACH ROW EXECUTE FUNCTION validate_drone_data();
      
      CREATE TRIGGER drone_commands_validation_trigger
      BEFORE INSERT ON drone_commands
      FOR EACH ROW EXECUTE FUNCTION validate_drone_data();
    `);

    console.log('✅ Advanced drone service constraints, indexes and validation system created successfully');
  },

  async down(queryInterface, Sequelize) {
    // 移除觸發器
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS drone_commands_state_transition_check ON drone_commands;
      DROP TRIGGER IF EXISTS drone_positions_validation_trigger ON drone_positions;
      DROP TRIGGER IF EXISTS drone_commands_validation_trigger ON drone_commands;
    `);

    // 移除函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS validate_command_state_transition();
      DROP FUNCTION IF EXISTS maintain_drone_partitions();
      DROP FUNCTION IF EXISTS validate_drone_data();
    `);

    // 移除索引
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_drone_status_droneId_active;`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_drone_status_battery_critical;`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_drone_commands_pending_priority;`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_drone_commands_timeout_check;`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_drone_positions_geo_location;`);

    // 移除約束
    await queryInterface.removeConstraint('drone_status', 'drone_status_droneId_format_check');
    await queryInterface.removeConstraint('drone_status', 'drone_status_battery_range_check');
    await queryInterface.removeConstraint('drone_status', 'drone_status_heartbeat_time_check');
    await queryInterface.removeConstraint('drone_positions', 'drone_positions_gps_status_enum_check');
    await queryInterface.removeConstraint('drone_commands', 'drone_commands_priority_range_check');
    await queryInterface.removeConstraint('drone_commands', 'drone_commands_timeout_range_check');
    await queryInterface.removeConstraint('drone_commands', 'drone_commands_retry_logic_check');

    // 移除地理約束
    await queryInterface.sequelize.query(`
      ALTER TABLE drone_positions DROP CONSTRAINT IF EXISTS drone_positions_latitude_range_check;
      ALTER TABLE drone_positions DROP CONSTRAINT IF EXISTS drone_positions_longitude_range_check;
      ALTER TABLE drone_positions DROP CONSTRAINT IF EXISTS drone_positions_altitude_range_check;
      ALTER TABLE drone_positions DROP CONSTRAINT IF EXISTS drone_positions_heading_range_check;
      ALTER TABLE drone_positions DROP CONSTRAINT IF EXISTS drone_positions_speed_range_check;
      ALTER TABLE drone_positions DROP CONSTRAINT IF EXISTS drone_positions_accuracy_range_check;
      ALTER TABLE drone_positions DROP CONSTRAINT IF EXISTS drone_positions_recorded_at_check;
    `);

    console.log('✅ Advanced drone service constraints removed successfully');
  }
};