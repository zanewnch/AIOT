'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 創建 drone_positions 主表（準備分區）
    await queryInterface.sequelize.query(`
      CREATE TABLE drone_positions (
        id BIGSERIAL,
        "droneId" VARCHAR(50) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        altitude DECIMAL(8, 2) DEFAULT 0.00,
        heading DECIMAL(5, 2) DEFAULT 0.00,
        speed DECIMAL(6, 2) DEFAULT 0.00,
        accuracy DECIMAL(5, 2) DEFAULT 0.00,
        "gpsStatus" VARCHAR(20) DEFAULT 'unknown',
        "recordedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB,
        PRIMARY KEY (id, "recordedAt")
      ) PARTITION BY RANGE ("recordedAt");
      
      COMMENT ON TABLE drone_positions IS '無人機位置資料表（按時間分區）';
      COMMENT ON COLUMN drone_positions.id IS '位置記錄唯一識別碼';
      COMMENT ON COLUMN drone_positions."droneId" IS '無人機識別碼';
      COMMENT ON COLUMN drone_positions.latitude IS '緯度';
      COMMENT ON COLUMN drone_positions.longitude IS '經度';
      COMMENT ON COLUMN drone_positions.altitude IS '海拔高度（公尺）';
      COMMENT ON COLUMN drone_positions.heading IS '航向角度（度）';
      COMMENT ON COLUMN drone_positions.speed IS '速度（m/s）';
      COMMENT ON COLUMN drone_positions.accuracy IS 'GPS精確度（公尺）';
      COMMENT ON COLUMN drone_positions."gpsStatus" IS 'GPS狀態';
      COMMENT ON COLUMN drone_positions."recordedAt" IS '記錄時間';
      COMMENT ON COLUMN drone_positions.metadata IS '額外元數據（JSON格式）';
    `);

    // 創建當前月份分區
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const currentMonthStr = currentMonth.toString().padStart(2, '0');
    const nextMonthStr = nextMonth.toString().padStart(2, '0');

    await queryInterface.sequelize.query(`
      CREATE TABLE drone_positions_${currentYear}_${currentMonthStr} PARTITION OF drone_positions
      FOR VALUES FROM ('${currentYear}-${currentMonthStr}-01') TO ('${nextYear}-${nextMonthStr}-01');
    `);

    // 創建下個月分區（提前準備）
    const nextNextMonth = nextMonth === 12 ? 1 : nextMonth + 1;
    const nextNextYear = nextMonth === 12 ? nextYear + 1 : nextYear;
    const nextNextMonthStr = nextNextMonth.toString().padStart(2, '0');

    await queryInterface.sequelize.query(`
      CREATE TABLE drone_positions_${nextYear}_${nextMonthStr} PARTITION OF drone_positions
      FOR VALUES FROM ('${nextYear}-${nextMonthStr}-01') TO ('${nextNextYear}-${nextNextMonthStr}-01');
    `);

    // 創建索引（會自動應用到所有分區）
    await queryInterface.addIndex('drone_positions', ['droneId'], {
      name: 'idx_drone_positions_droneId'
    });

    await queryInterface.addIndex('drone_positions', ['recordedAt'], {
      name: 'idx_drone_positions_recordedAt'
    });

    await queryInterface.addIndex('drone_positions', ['droneId', 'recordedAt'], {
      name: 'idx_drone_positions_droneId_recordedAt'
    });

    // 創建 GiST 索引用於地理位置查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_drone_positions_location ON drone_positions 
      USING GIST (ll_to_earth(latitude, longitude));
    `);

    // 為主表創建更新觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_drone_positions_updated_at 
      BEFORE UPDATE ON drone_positions
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // 創建自動分區管理函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION create_monthly_partition()
      RETURNS void AS $$
      DECLARE
          start_date date;
          end_date date;
          partition_name text;
      BEGIN
          -- 計算下個月的第一天
          start_date := date_trunc('month', CURRENT_DATE + interval '2 month');
          end_date := start_date + interval '1 month';
          partition_name := 'drone_positions_' || to_char(start_date, 'YYYY_MM');
          
          -- 檢查分區是否已存在
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.tables 
              WHERE table_name = partition_name
          ) THEN
              EXECUTE format('CREATE TABLE %I PARTITION OF drone_positions 
                             FOR VALUES FROM (%L) TO (%L)',
                             partition_name, start_date, end_date);
              RAISE NOTICE 'Created partition: %', partition_name;
          END IF;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Drone positions partitioned table created successfully with indexes and auto-partition function');
  },

  async down(queryInterface, Sequelize) {
    // 移除觸發器
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_drone_positions_updated_at ON drone_positions;
    `);

    // 移除自動分區函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS create_monthly_partition();
    `);

    // 移除主表（會自動移除所有分區）
    await queryInterface.dropTable('drone_positions');

    console.log('✅ Drone positions partitioned table dropped successfully');
  }
};