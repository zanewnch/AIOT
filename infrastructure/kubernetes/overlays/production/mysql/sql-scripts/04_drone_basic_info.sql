-- =====================================================
-- AIOT 無人機基本資訊表清理與初始化腳本
-- =====================================================
-- 此腳本先清空 drones_status 表，然後生成 10 筆無人機基本資料
-- 配合 drone_positions 表的 drone_id (1-10)
-- =====================================================

USE main_db;

-- =====================================================
-- 第一階段：清理 drones_status 表
-- =====================================================

-- 建立存儲程序來處理條件式刪除
DELIMITER $$

DROP PROCEDURE IF EXISTS CleanupDroneStatus$$

CREATE PROCEDURE CleanupDroneStatus()
BEGIN
    DECLARE current_count INT DEFAULT 0;
    DECLARE deleted_count INT DEFAULT 0;
    
    -- 查詢目前 drones_status 表的資料筆數
    SELECT COUNT(*) INTO current_count FROM drones_status;
    
    -- 如果表有資料，則刪除所有記錄
    IF current_count > 0 THEN
        -- 儲存刪除前的筆數以供報告使用
        SET deleted_count = current_count;
        
        -- 刪除 drones_status 表的所有記錄
        DELETE FROM drones_status;
        
        -- 重置自動遞增計數器至 1（可選）
        ALTER TABLE drones_status AUTO_INCREMENT = 1;
        
        -- 輸出刪除結果
        SELECT CONCAT('已從 drones_status 表刪除 ', deleted_count, ' 筆記錄。表格現在為空。') AS cleanup_result;
    ELSE
        -- 如果表已經是空的，輸出訊息
        SELECT 'drones_status 表已經是空的，無需刪除。' AS cleanup_result;
    END IF;
    
END$$

DELIMITER ;

-- 執行清理存儲程序
CALL CleanupDroneStatus();

-- 驗證清理結果
SELECT 
    COUNT(*) as remaining_records,
    COALESCE(MAX(id), 0) as max_id
FROM drones_status;

-- =====================================================
-- 第二階段：生成無人機基本資料
-- =====================================================

-- 建立存儲程序來生成無人機基本資料
DELIMITER $$

DROP PROCEDURE IF EXISTS GenerateDroneStatusData$$

CREATE PROCEDURE GenerateDroneStatusData()
BEGIN
    DECLARE drone_counter INT DEFAULT 1;
    DECLARE current_timestamp TIMESTAMP DEFAULT NOW();
    
    -- 無人機製造商陣列（模擬不同品牌）
    DECLARE manufacturers CURSOR FOR 
        SELECT 'DJI' as manufacturer, 'Mavic Air 2' as model, 570 as weight, 3500 as battery, 500 as altitude, 18000 as range
        UNION SELECT 'Parrot', 'Anafi', 320, 2700, 4000, 25000
        UNION SELECT 'Autel', 'EVO II', 1127, 7100, 9000, 40000
        UNION SELECT 'Skydio', 'Skydio 2+', 775, 4280, 3500, 6000
        UNION SELECT 'Yuneec', 'Typhoon H Plus', 1850, 5400, 2500, 2000
        UNION SELECT 'DJI', 'Mini 3 Pro', 249, 2453, 4000, 12000
        UNION SELECT 'Parrot', 'Bebop 2', 500, 2700, 3000, 20000
        UNION SELECT 'DJI', 'Phantom 4 Pro', 1388, 5870, 6000, 15000
        UNION SELECT 'Autel', 'X-Star Premium', 1200, 4900, 1200, 12000
        UNION SELECT 'DJI', 'Air 2S', 595, 3500, 5000, 18500;
    
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_manufacturer VARCHAR(50);
    DECLARE v_model VARCHAR(100);
    DECLARE v_weight INT;
    DECLARE v_battery_capacity INT;
    DECLARE v_max_altitude INT;
    DECLARE v_max_range INT;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN manufacturers;
    
    -- 生成 10 筆無人機資料
    WHILE drone_counter <= 10 AND NOT done DO
        FETCH manufacturers INTO v_manufacturer, v_model, v_weight, v_battery_capacity, v_max_altitude, v_max_range;
        
        IF NOT done THEN
            -- 插入無人機基本資料
            INSERT INTO drones_status (
                drone_serial,
                drone_name,
                model,
                manufacturer,
                owner_user_id,
                status,
                max_altitude,
                max_range,
                battery_capacity,
                weight,
                createdAt,
                updatedAt
            ) VALUES (
                CONCAT('AIOT-', LPAD(drone_counter, 3, '0')),           -- drone_serial: AIOT-001, AIOT-002, ...
                CONCAT('無人機 ', drone_counter, ' 號'),                   -- drone_name: 無人機 1 號, 無人機 2 號, ...
                v_model,                                                -- model: 從陣列中取得
                v_manufacturer,                                         -- manufacturer: 從陣列中取得
                1,                                                      -- owner_user_id: 統一設為用戶1（admin）
                CASE 
                    WHEN drone_counter <= 7 THEN 'active'              -- 前7台設為活躍狀態
                    WHEN drone_counter = 8 THEN 'flying'               -- 第8台設為飛行中
                    WHEN drone_counter = 9 THEN 'maintenance'          -- 第9台設為維護中
                    ELSE 'inactive'                                     -- 第10台設為非活躍
                END,                                                    -- status: 不同狀態分配
                v_max_altitude,                                         -- max_altitude: 從陣列中取得
                v_max_range,                                            -- max_range: 從陣列中取得
                v_battery_capacity,                                     -- battery_capacity: 從陣列中取得
                v_weight,                                               -- weight: 從陣列中取得
                current_timestamp,                                      -- createdAt
                current_timestamp                                       -- updatedAt
            );
            
            SET drone_counter = drone_counter + 1;
        END IF;
    END WHILE;
    
    CLOSE manufacturers;
    
    -- 輸出生成結果
    SELECT CONCAT('已成功生成 ', (SELECT COUNT(*) FROM drones_status), ' 筆無人機基本資料') AS generation_result;
    
END$$

DELIMITER ;

-- 執行存儲程序生成無人機資料
CALL GenerateDroneStatusData();

-- =====================================================
-- 最終驗證結果
-- =====================================================

-- 驗證生成結果
SELECT 
    COUNT(*) as total_drones,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
    COUNT(CASE WHEN status = 'flying' THEN 1 END) as flying_count,
    COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_count,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_count,
    AVG(battery_capacity) as avg_battery_capacity,
    AVG(weight) as avg_weight
FROM drones_status;

-- 顯示所有生成的無人機資料
SELECT 
    id,
    drone_serial,
    drone_name,
    manufacturer,
    model,
    status,
    max_altitude,
    max_range,
    battery_capacity,
    weight
FROM drones_status 
ORDER BY id;

-- 檢查與 drone_positions 的 drone_id 是否對應
SELECT 
    ds.id as drone_status_id,
    ds.drone_serial,
    ds.status,
    COUNT(dp.id) as position_records_count
FROM drones_status ds
LEFT JOIN drone_positions dp ON ds.id = dp.drone_id
GROUP BY ds.id, ds.drone_serial, ds.status
ORDER BY ds.id;

-- 清理存儲程序（可選）
-- DROP PROCEDURE IF EXISTS CleanupDroneStatus;
-- DROP PROCEDURE IF EXISTS GenerateDroneStatusData;