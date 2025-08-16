-- ==========================================
-- 無人機即時狀態資料表初始化腳本
-- ==========================================
-- 本腳本用於初始化 drone_real_time_status 資料表
-- 功能：
-- 1. 檢查資料表是否存在
-- 2. 如果存在且有資料，則清空資料表
-- 3. 如果不存在，則建立資料表
-- ==========================================

USE drone_db;

-- 檢查資料表是否存在
SET @table_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'main_db'
    AND TABLE_NAME = 'drone_real_time_status'
);

-- 如果資料表存在，檢查是否有資料
SET @row_count = 0;
SET @sql = IF(@table_exists > 0,
    'SELECT COUNT(*) INTO @row_count FROM drone_real_time_status',
    'SELECT 0 INTO @row_count'
);

-- 執行資料計數查詢（僅在資料表存在時）
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 顯示檢查結果
SELECT
    CASE
        WHEN @table_exists = 0 THEN '❌ 資料表 drone_real_time_status 不存在'
        WHEN @table_exists > 0 AND @row_count = 0 THEN '✅ 資料表 drone_real_time_status 存在但為空'
        WHEN @table_exists > 0 AND @row_count > 0 THEN CONCAT('⚠️  資料表 drone_real_time_status 存在且有 ', @row_count, ' 筆資料')
        ELSE '❓ 未知狀態'
    END AS table_status;

-- 如果資料表存在且有資料，則清空資料表
SET @clear_sql = IF(@table_exists > 0 AND @row_count > 0,
    'TRUNCATE TABLE drone_real_time_status',
    'SELECT "無需清空資料表" as message'
);

PREPARE clear_stmt FROM @clear_sql;
EXECUTE clear_stmt;
DEALLOCATE PREPARE clear_stmt;

-- 如果成功清空，顯示確認訊息
SELECT
    CASE
        WHEN @table_exists > 0 AND @row_count > 0 THEN '✅ 資料表已成功清空'
        WHEN @table_exists > 0 AND @row_count = 0 THEN '✅ 資料表本來就是空的'
        WHEN @table_exists = 0 THEN '⚠️  資料表不存在，需要建立'
        ELSE '❓ 未知狀態'
    END AS clear_result;

-- 如果資料表不存在，則建立資料表
SET @create_table_sql = IF(@table_exists = 0,
    'CREATE TABLE drone_real_time_status (
        id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT "主鍵識別碼",
        drone_id BIGINT NOT NULL COMMENT "無人機外鍵，關聯到 drones_status 表",
        current_battery_level FLOAT NOT NULL COMMENT "即時電量百分比 (0-100%)",
        current_status ENUM(\"idle\", \"flying\", \"charging\", \"maintenance\", \"offline\", \"error\") NOT NULL COMMENT "即時狀態",
        last_seen TIMESTAMP NOT NULL COMMENT "最後連線時間",
        current_altitude FLOAT NULL COMMENT "當前高度 (公尺)",
        current_speed FLOAT NULL COMMENT "當前速度 (m/s)",
        current_heading FLOAT NULL COMMENT "當前航向 (0-360度)",
        signal_strength FLOAT NULL COMMENT "GPS信號強度",
        is_connected BOOLEAN NOT NULL DEFAULT FALSE COMMENT "是否在線",
        error_message TEXT NULL COMMENT "錯誤訊息",
        temperature FLOAT NULL COMMENT "設備溫度 (攝氏度)",
        flight_time_today INT NOT NULL DEFAULT 0 COMMENT "今日飛行時間 (秒)",
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT "建立時間",
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT "更新時間",

        FOREIGN KEY (drone_id) REFERENCES drones_status(id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_drone_id (drone_id),
        INDEX idx_current_status (current_status),
        INDEX idx_last_seen (last_seen),
        INDEX idx_is_connected (is_connected)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT="無人機即時狀態資料表"',
    'SELECT "資料表已存在，無需建立" as message'
);

PREPARE create_stmt FROM @create_table_sql;
EXECUTE create_stmt;
DEALLOCATE PREPARE create_stmt;

-- 最終狀態檢查
SET @final_table_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'main_db'
    AND TABLE_NAME = 'drone_real_time_status'
);

SET @final_row_count = 0;
SET @final_sql = IF(@final_table_exists > 0,
    'SELECT COUNT(*) INTO @final_row_count FROM drone_real_time_status',
    'SELECT 0 INTO @final_row_count'
);

PREPARE final_stmt FROM @final_sql;
EXECUTE final_stmt;
DEALLOCATE PREPARE final_stmt;

-- 顯示最終結果
SELECT
    CASE
        WHEN @final_table_exists = 0 THEN '❌ 腳本執行失敗：資料表仍不存在'
        WHEN @final_table_exists > 0 AND @final_row_count = 0 THEN '✅ 腳本執行成功：資料表存在且為空，可以安全使用'
        WHEN @final_table_exists > 0 AND @final_row_count > 0 THEN CONCAT('⚠️  腳本執行異常：資料表存在但仍有 ', @final_row_count, ' 筆資料')
        ELSE '❓ 未知狀態'
    END AS final_status;

-- 顯示資料表結構（如果存在）
SET @describe_sql = IF(@final_table_exists > 0,
    'DESCRIBE drone_real_time_status',
    'SELECT "資料表不存在" as message'
);

PREPARE describe_stmt FROM @describe_sql;
EXECUTE describe_stmt;
DEALLOCATE PREPARE describe_stmt;

-- 腳本完成訊息
SELECT '🎉 drone_real_time_status 資料表初始化腳本執行完成' as script_complete;