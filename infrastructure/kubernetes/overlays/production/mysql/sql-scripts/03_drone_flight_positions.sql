-- =====================================================
-- AIOT 無人機位置資料表清理腳本
-- =====================================================
-- 此腳本檢查 drone_positions 表是否有資料
-- 如果有資料則全部刪除
-- =====================================================

USE main_db;

-- 建立存儲程序來處理條件式刪除
DELIMITER $$

DROP PROCEDURE IF EXISTS CleanupDronePositions$$

CREATE PROCEDURE CleanupDronePositions()
BEGIN
    DECLARE current_count INT DEFAULT 0;
    DECLARE deleted_count INT DEFAULT 0;

    -- 查詢目前 drone_positions 表的資料筆數
    SELECT COUNT(*) INTO current_count FROM drone_positions;

    -- 如果表有資料，則刪除所有記錄
    IF current_count > 0 THEN
        -- 儲存刪除前的筆數以供報告使用
        SET deleted_count = current_count;

        -- 刪除 drone_positions 表的所有記錄
        DELETE FROM drone_positions;

        -- 重置自動遞增計數器至 1（可選）
        ALTER TABLE drone_positions AUTO_INCREMENT = 1;

        -- 輸出刪除結果
        SELECT CONCAT('已從 drone_positions 表刪除 ', deleted_count, ' 筆記錄。表格現在為空。') AS result;
    ELSE
        -- 如果表已經是空的，輸出訊息
        SELECT 'drone_positions 表已經是空的，無需刪除。' AS result;
    END IF;

END$$

DELIMITER ;

-- 執行存儲程序
CALL CleanupDronePositions();

-- 驗證清理結果
SELECT
    COUNT(*) as remaining_records,
    COALESCE(MAX(id), 0) as max_id
FROM drone_positions;

-- 顯示清理後的表狀態
SHOW TABLE STATUS LIKE 'drone_positions';

-- =====================================================
-- 第二階段：生成模擬飛行資料
-- =====================================================

-- 建立存儲程序來生成模擬飛行資料
DELIMITER $$

DROP PROCEDURE IF EXISTS GenerateDroneFlightData$$

CREATE PROCEDURE GenerateDroneFlightData()
BEGIN
    DECLARE drone_counter INT DEFAULT 1;
    DECLARE time_counter INT DEFAULT 0;
    DECLARE base_timestamp TIMESTAMP DEFAULT NOW();
    
    -- 起始位置：台北101 (25.0337, 121.5645)
    DECLARE start_latitude FLOAT DEFAULT 25.0337;
    DECLARE start_longitude FLOAT DEFAULT 121.5645;
    DECLARE start_altitude FLOAT DEFAULT 100.0;
    
    -- 飛行參數
    DECLARE flight_speed FLOAT DEFAULT 15.0; -- 15 m/s 飛行速度
    DECLARE distance_per_second FLOAT DEFAULT 0.00013; -- 每秒移動的經緯度距離（約15公尺）
    
    -- 方位角度 (每台無人機間隔36度)
    DECLARE current_heading FLOAT;
    DECLARE heading_rad FLOAT;
    
    -- 計算變數
    DECLARE current_lat FLOAT;
    DECLARE current_lng FLOAT;
    DECLARE current_alt FLOAT;
    DECLARE current_battery FLOAT;
    DECLARE current_signal FLOAT;
    DECLARE current_timestamp TIMESTAMP;
    
    -- 外層迴圈：10台無人機
    WHILE drone_counter <= 10 DO
        -- 計算當前無人機的航向角度 (0°, 36°, 72°, ..., 324°)
        SET current_heading = (drone_counter - 1) * 36;
        SET heading_rad = RADIANS(current_heading);
        
        -- 重置時間計數器
        SET time_counter = 0;
        
        -- 內層迴圈：20秒的飛行資料
        WHILE time_counter < 20 DO
            -- 計算當前時間戳記（每秒遞增）
            SET current_timestamp = DATE_ADD(base_timestamp, INTERVAL time_counter SECOND);
            
            -- 計算當前位置（基於飛行時間和方向）
            SET current_lat = start_latitude + (distance_per_second * time_counter * COS(heading_rad));
            SET current_lng = start_longitude + (distance_per_second * time_counter * SIN(heading_rad));
            
            -- 計算高度（起飛後逐漸上升）
            SET current_alt = start_altitude + (time_counter * 2.5); -- 每秒上升2.5公尺
            
            -- 計算電池電量（每秒消耗約0.5%）
            SET current_battery = 100.0 - (time_counter * 0.5);
            
            -- 模擬GPS信號強度（90-95之間波動）
            SET current_signal = 90.0 + (RAND() * 5.0);
            
            -- 插入飛行資料
            INSERT INTO drone_positions (
                drone_id,
                latitude,
                longitude,
                altitude,
                timestamp,
                signal_strength,
                speed,
                heading,
                battery_level,
                createdAt,
                updatedAt
            ) VALUES (
                drone_counter,                    -- drone_id
                current_lat,                      -- latitude
                current_lng,                      -- longitude  
                current_alt,                      -- altitude
                current_timestamp,                -- timestamp
                current_signal,                   -- signal_strength
                flight_speed,                     -- speed (固定15 m/s)
                current_heading,                  -- heading
                current_battery,                  -- battery_level
                current_timestamp,                -- createdAt
                current_timestamp                 -- updatedAt
            );
            
            SET time_counter = time_counter + 1;
        END WHILE;
        
        SET drone_counter = drone_counter + 1;
    END WHILE;
    
    -- 輸出生成結果
    SELECT CONCAT('已成功生成 ', (SELECT COUNT(*) FROM drone_positions), ' 筆無人機飛行模擬資料') AS flight_data_result;
    
END$$

DELIMITER ;

-- 執行存儲程序生成飛行資料
CALL GenerateDroneFlightData();

-- =====================================================
-- 最終驗證結果
-- =====================================================

-- 驗證生成結果
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT drone_id) as unique_drones,
    MIN(timestamp) as earliest_time,
    MAX(timestamp) as latest_time,
    AVG(battery_level) as avg_battery,
    AVG(altitude) as avg_altitude
FROM drone_positions;

-- 顯示每台無人機的資料筆數
SELECT 
    drone_id,
    COUNT(*) as record_count,
    MIN(battery_level) as min_battery,
    MAX(altitude) as max_altitude,
    heading as flight_direction
FROM drone_positions 
GROUP BY drone_id, heading
ORDER BY drone_id;

-- 顯示部分樣本資料
SELECT 
    drone_id,
    latitude,
    longitude,
    altitude,
    timestamp,
    heading,
    battery_level
FROM drone_positions 
WHERE drone_id IN (1, 5, 10)
AND MOD(UNIX_TIMESTAMP(timestamp), 5) = 0  -- 每5秒顯示一筆
ORDER BY drone_id, timestamp
LIMIT 20;

-- 清理存儲程序（可選）
-- DROP PROCEDURE IF EXISTS CleanupDronePositions;
-- DROP PROCEDURE IF EXISTS GenerateDroneFlightData;