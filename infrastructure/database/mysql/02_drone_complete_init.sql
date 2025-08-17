-- =====================================================
-- 02_drone_complete_init.sql - Drone 完整系統初始化腳本
-- =====================================================
-- 功能描述：
-- 1. 創建完整的 Drone 無人機管理系統表結構
-- 2. 插入 10 台測試無人機和相關數據
-- 3. 建立無人機狀態、位置、指令等完整數據
--
-- 創建的表結構（9個表）：
-- - drones_status: 無人機基本狀態表（序號、名稱、型號、製造商等）
-- - drone_real_time_status: 無人機即時狀態表（電量、狀態、位置等）
-- - drone_positions: 無人機位置記錄表（GPS座標、高度、速度等）
-- - drone_commands: 無人機指令表（起飛、降落、移動等指令）
-- - drone_command_queue: 無人機指令佇列表（指令排程和優先級）
-- - archive_tasks: 歸檔任務表（數據歸檔管理）
-- - drone_positions_archive: 位置數據歷史歸檔表
-- - drone_commands_archive: 指令數據歷史歸檔表
-- - drone_status_archive: 狀態數據歷史歸檔表
--
-- 插入的測試數據：
-- - 10台測試無人機（DJI、Autel、Skydio、Parrot等品牌）
-- - 即時狀態數據（電量、連線狀態、GPS信號等）
-- - 位置記錄（台北101周邊區域的GPS座標）
-- - 指令記錄（起飛、移動、返航等測試指令）
-- - 指令佇列（待執行和正在執行的指令）
--
-- 🎯 前端測試場景設計：
-- Simulation 1 - 多機協同測試：
--   - 10台無人機從同一個起點（台北101）出發
--   - 分別往10個不同方向同時飛行
--   - 測試多機同時控制、位置追蹤、狀態監控
--   - 驗證 WebSocket 即時通訊和大量數據處理能力
--
-- Simulation 2 - 單機精確控制測試：
--   - 1台無人機執行完整的飛行任務
--   - 指令序列：起飛 → 上升 → 左移 → 右移 → 下降 → 降落 or 自由操作
--   - 測試指令佇列、順序執行、即時回饋
--   - 驗證精確控制和狀態同步功能
--
-- 這些測試數據專門為前端 Drone 控制界面和 WebSocket 即時通訊設計
--
-- 基於 drone-websocket-service 中的 Sequelize 模型定義
-- =====================================================

-- 使用 Drone 微服務專用數據庫
USE drone_db;

-- 開始交易
START TRANSACTION;

-- =====================================
-- 1. 創建 Drone 表結構
-- =====================================

-- 創建無人機基本狀態表 (drones_status)
CREATE TABLE IF NOT EXISTS drones_status (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    drone_serial VARCHAR(255) NOT NULL UNIQUE COMMENT '無人機序號（唯一）',
    drone_name VARCHAR(255) NOT NULL COMMENT '無人機名稱',
    model VARCHAR(255) NOT NULL COMMENT '型號',
    manufacturer VARCHAR(255) NOT NULL COMMENT '製造商',
    owner_user_id BIGINT NOT NULL COMMENT '擁有者用戶ID（外鍵）',
    status ENUM('active', 'inactive', 'maintenance', 'flying') NOT NULL COMMENT '狀態',
    max_altitude INT NOT NULL COMMENT '最大飛行高度（公尺）',
    max_range INT NOT NULL COMMENT '最大飛行距離（公尺）',
    battery_capacity INT NOT NULL COMMENT '電池容量（mAh）',
    weight INT NOT NULL COMMENT '重量（公克）',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',

    PRIMARY KEY (id),
    UNIQUE KEY uk_drone_serial (drone_serial),
    INDEX idx_owner_user_id (owner_user_id),
    INDEX idx_status (status),
    INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='無人機基本狀態表';

-- 創建無人機即時狀態表 (drone_real_time_status)
CREATE TABLE IF NOT EXISTS drone_real_time_status (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    drone_id BIGINT NOT NULL COMMENT '無人機ID（外鍵）',
    current_battery_level FLOAT NOT NULL COMMENT '即時電量百分比（0-100%）',
    current_status ENUM('idle', 'flying', 'charging', 'maintenance', 'offline', 'error') NOT NULL COMMENT '即時狀態',
    last_seen TIMESTAMP NOT NULL COMMENT '最後連線時間',
    current_altitude FLOAT NULL COMMENT '當前高度（公尺）',
    current_speed FLOAT NULL COMMENT '當前速度（m/s）',
    current_heading FLOAT NULL COMMENT '當前航向（0-360度）',
    signal_strength FLOAT NULL COMMENT 'GPS信號強度',
    is_connected BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否在線',
    error_message TEXT NULL COMMENT '錯誤訊息',
    temperature FLOAT NULL COMMENT '設備溫度（攝氏度）',
    flight_time_today INT NOT NULL DEFAULT 0 COMMENT '今日飛行時間（秒）',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',

    PRIMARY KEY (id),
    INDEX idx_drone_id (drone_id),
    INDEX idx_current_status (current_status),
    INDEX idx_last_seen (last_seen),
    INDEX idx_is_connected (is_connected),

    FOREIGN KEY (drone_id) REFERENCES drones_status(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='無人機即時狀態表';

-- 創建無人機位置表 (drone_positions)
CREATE TABLE IF NOT EXISTS drone_positions (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    drone_id BIGINT NOT NULL COMMENT '無人機ID（外鍵）',
    latitude FLOAT NOT NULL COMMENT '緯度',
    longitude FLOAT NOT NULL COMMENT '經度',
    altitude FLOAT NOT NULL COMMENT '高度（公尺）',
    speed FLOAT NULL COMMENT '速度（m/s）',
    heading FLOAT NULL COMMENT '航向（0-360度）',
    battery_level FLOAT NOT NULL COMMENT '電池電量百分比',
    timestamp TIMESTAMP NOT NULL COMMENT '位置記錄時間',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',

    PRIMARY KEY (id),
    INDEX idx_drone_id (drone_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_drone_timestamp (drone_id, timestamp),

    FOREIGN KEY (drone_id) REFERENCES drones_status(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='無人機位置記錄表';

-- 創建無人機指令表 (drone_commands)
CREATE TABLE IF NOT EXISTS drone_commands (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    drone_id BIGINT NOT NULL COMMENT '無人機ID（外鍵）',
    command_type ENUM('takeoff', 'land', 'hover', 'flyTo', 'return', 'moveForward', 'moveBackward', 'moveLeft', 'moveRight', 'rotateLeft', 'rotateRight', 'emergency') NOT NULL COMMENT '指令類型',
    command_data JSON NULL COMMENT '指令參數（JSON格式）',
    status ENUM('pending', 'executing', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '指令狀態',
    issued_by BIGINT NOT NULL COMMENT '指令發出者用戶ID',
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '指令發出時間',
    executed_at TIMESTAMP NULL COMMENT '指令執行時間',
    completed_at TIMESTAMP NULL COMMENT '指令完成時間',
    error_message TEXT NULL COMMENT '錯誤訊息',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',

    PRIMARY KEY (id),
    INDEX idx_drone_id (drone_id),
    INDEX idx_command_type (command_type),
    INDEX idx_status (status),
    INDEX idx_issued_by (issued_by),
    INDEX idx_issued_at (issued_at),

    FOREIGN KEY (drone_id) REFERENCES drones_status(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='無人機指令表';

-- 創建無人機指令佇列表 (drone_command_queue)
CREATE TABLE IF NOT EXISTS drone_command_queue (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    drone_id BIGINT NOT NULL COMMENT '無人機ID（外鍵）',
    command_id BIGINT NOT NULL COMMENT '指令ID（外鍵）',
    queue_position INT NOT NULL COMMENT '佇列位置',
    priority INT NOT NULL DEFAULT 5 COMMENT '優先級（1-10，1最高）',
    scheduled_time TIMESTAMP NULL COMMENT '排程執行時間',
    status ENUM('queued', 'processing', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'queued' COMMENT '佇列狀態',
    retry_count INT NOT NULL DEFAULT 0 COMMENT '重試次數',
    max_retries INT NOT NULL DEFAULT 3 COMMENT '最大重試次數',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',

    PRIMARY KEY (id),
    UNIQUE KEY uk_drone_command (drone_id, command_id),
    INDEX idx_drone_id (drone_id),
    INDEX idx_command_id (command_id),
    INDEX idx_queue_position (queue_position),
    INDEX idx_priority (priority),
    INDEX idx_status (status),
    INDEX idx_scheduled_time (scheduled_time),

    FOREIGN KEY (drone_id) REFERENCES drones_status(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (command_id) REFERENCES drone_commands(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='無人機指令佇列表';

-- 創建歸檔任務表 (archive_tasks)
CREATE TABLE IF NOT EXISTS archive_tasks (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    job_type ENUM('positions', 'commands', 'status') NOT NULL COMMENT '歸檔任務類型',
    table_name VARCHAR(100) NOT NULL COMMENT '來源表名',
    archive_table_name VARCHAR(100) NOT NULL COMMENT '目標歸檔表名',
    date_range_start TIMESTAMP NOT NULL COMMENT '歸檔資料起始時間',
    date_range_end TIMESTAMP NOT NULL COMMENT '歸檔資料結束時間',
    batch_id VARCHAR(255) NOT NULL COMMENT '歸檔批次識別碼',
    total_records INT NOT NULL DEFAULT 0 COMMENT '總歸檔記錄數',
    archived_records INT NOT NULL DEFAULT 0 COMMENT '已歸檔記錄數',
    status ENUM('pending', 'running', 'completed', 'failed') NOT NULL DEFAULT 'pending' COMMENT '任務狀態',
    started_at TIMESTAMP NULL COMMENT '開始時間',
    completed_at TIMESTAMP NULL COMMENT '完成時間',
    error_message TEXT NULL COMMENT '錯誤訊息',
    created_by VARCHAR(100) NOT NULL COMMENT '創建者',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',

    PRIMARY KEY (id),
    INDEX idx_job_type (job_type),
    INDEX idx_status (status),
    INDEX idx_batch_id (batch_id),
    INDEX idx_date_range_start (date_range_start),
    INDEX idx_started_at (started_at),
    INDEX idx_status_job_type (status, job_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='歸檔任務表';

-- 創建歷史資料歸檔表
-- 無人機位置歷史表 (drone_positions_archive)
CREATE TABLE IF NOT EXISTS drone_positions_archive (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    original_id BIGINT NOT NULL COMMENT '原始記錄ID',
    drone_id BIGINT NOT NULL COMMENT '無人機ID',
    latitude FLOAT NOT NULL COMMENT '緯度',
    longitude FLOAT NOT NULL COMMENT '經度',
    altitude FLOAT NOT NULL COMMENT '高度（公尺）',
    speed FLOAT NULL COMMENT '速度（m/s）',
    heading FLOAT NULL COMMENT '航向（0-360度）',
    battery_level FLOAT NOT NULL COMMENT '電池電量百分比',
    temperature FLOAT NOT NULL COMMENT '環境溫度（攝氏度）',
    timestamp TIMESTAMP NOT NULL COMMENT '位置記錄時間',
    archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '歸檔時間',
    archive_batch_id VARCHAR(255) NOT NULL COMMENT '歸檔批次識別碼',
    created_at TIMESTAMP NOT NULL COMMENT '原始記錄建立時間',

    PRIMARY KEY (id),
    INDEX idx_drone_id (drone_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_archived_at (archived_at),
    INDEX idx_archive_batch_id (archive_batch_id),
    INDEX idx_original_id (original_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='無人機位置歷史歸檔表';

-- 無人機指令歷史表 (drone_commands_archive)
CREATE TABLE IF NOT EXISTS drone_commands_archive (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    original_id BIGINT NOT NULL COMMENT '原始記錄ID',
    drone_id BIGINT NOT NULL COMMENT '無人機ID',
    command_type ENUM('takeoff', 'land', 'hover', 'flyTo', 'return', 'moveForward', 'moveBackward', 'moveLeft', 'moveRight', 'rotateLeft', 'rotateRight', 'emergency') NOT NULL COMMENT '指令類型',
    command_data JSON NULL COMMENT '指令參數（JSON格式）',
    status ENUM('pending', 'executing', 'completed', 'failed', 'cancelled') NOT NULL COMMENT '指令狀態',
    issued_by BIGINT NOT NULL COMMENT '指令發出者用戶ID',
    issued_at TIMESTAMP NOT NULL COMMENT '指令發出時間',
    executed_at TIMESTAMP NULL COMMENT '指令執行時間',
    completed_at TIMESTAMP NULL COMMENT '指令完成時間',
    error_message TEXT NULL COMMENT '錯誤訊息',
    archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '歸檔時間',
    archive_batch_id VARCHAR(255) NOT NULL COMMENT '歸檔批次識別碼',
    created_at TIMESTAMP NOT NULL COMMENT '原始記錄建立時間',

    PRIMARY KEY (id),
    INDEX idx_drone_id (drone_id),
    INDEX idx_command_type (command_type),
    INDEX idx_issued_at (issued_at),
    INDEX idx_archived_at (archived_at),
    INDEX idx_archive_batch_id (archive_batch_id),
    INDEX idx_original_id (original_id),
    INDEX idx_issued_by (issued_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='無人機指令歷史歸檔表';

-- 無人機狀態歷史表 (drone_status_archive)
CREATE TABLE IF NOT EXISTS drone_status_archive (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    original_id BIGINT NOT NULL COMMENT '原始記錄ID',
    drone_id BIGINT NOT NULL COMMENT '無人機ID',
    current_battery_level FLOAT NOT NULL COMMENT '電量百分比',
    current_status ENUM('idle', 'flying', 'charging', 'maintenance', 'offline', 'error') NOT NULL COMMENT '狀態',
    last_seen TIMESTAMP NOT NULL COMMENT '最後連線時間',
    current_altitude FLOAT NULL COMMENT '當前高度',
    current_speed FLOAT NULL COMMENT '當前速度',
    is_connected BOOLEAN NOT NULL COMMENT '是否在線',
    archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '歸檔時間',
    archive_batch_id VARCHAR(255) NOT NULL COMMENT '歸檔批次識別碼',
    created_at TIMESTAMP NOT NULL COMMENT '原始記錄建立時間',

    PRIMARY KEY (id),
    INDEX idx_drone_id (drone_id),
    INDEX idx_last_seen (last_seen),
    INDEX idx_archived_at (archived_at),
    INDEX idx_archive_batch_id (archive_batch_id),
    INDEX idx_original_id (original_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='無人機狀態歷史歸檔表';

-- =====================================
-- 2. 插入測試數據
-- =====================================

-- 插入無人機基本資料測試數據
INSERT IGNORE INTO drones_status (drone_serial, drone_name, model, manufacturer, owner_user_id, status, max_altitude, max_range, battery_capacity, weight, createdAt, updatedAt)
VALUES
  ('AIOT-001', '無人機 1 號', 'DJI Mini 2', 'DJI', 1, 'active', 500, 10000, 2250, 249, NOW(), NOW()),
  ('AIOT-002', '無人機 2 號', 'DJI Air 2S', 'DJI', 1, 'active', 500, 12000, 3500, 595, NOW(), NOW()),
  ('AIOT-003', '無人機 3 號', 'DJI Mavic 3', 'DJI', 1, 'active', 500, 15000, 5000, 895, NOW(), NOW()),
  ('AIOT-004', '無人機 4 號', 'Autel EVO II', 'Autel', 1, 'active', 500, 9000, 7100, 1127, NOW(), NOW()),
  ('AIOT-005', '無人機 5 號', 'Skydio 2+', 'Skydio', 1, 'active', 500, 6000, 4280, 775, NOW(), NOW()),
  ('AIOT-006', '無人機 6 號', 'Parrot Anafi', 'Parrot', 1, 'active', 500, 4000, 2700, 320, NOW(), NOW()),
  ('AIOT-007', '無人機 7 號', 'DJI Mini 3', 'DJI', 1, 'active', 500, 10000, 2453, 248, NOW(), NOW()),
  ('AIOT-008', '無人機 8 號', 'DJI FPV', 'DJI', 1, 'flying', 500, 10000, 2000, 795, NOW(), NOW()),
  ('AIOT-009', '無人機 9 號', 'Autel EVO Lite+', 'Autel', 1, 'maintenance', 500, 12000, 4300, 835, NOW(), NOW()),
  ('AIOT-010', '無人機 10 號', 'DJI Phantom 4', 'DJI', 1, 'inactive', 500, 7000, 5870, 1388, NOW(), NOW());

-- 插入無人機即時狀態測試數據
INSERT IGNORE INTO drone_real_time_status (drone_id, current_battery_level, current_status, last_seen, current_altitude, current_speed, current_heading, signal_strength, is_connected, error_message, temperature, flight_time_today, createdAt, updatedAt)
VALUES
  (1, 85.5, 'idle', NOW(), 0, 0, 0, 95.2, TRUE, NULL, 25.3, 0, NOW(), NOW()),
  (2, 92.1, 'idle', NOW(), 0, 0, 45, 98.7, TRUE, NULL, 23.8, 0, NOW(), NOW()),
  (3, 78.3, 'idle', NOW(), 0, 0, 90, 87.5, TRUE, NULL, 26.1, 0, NOW(), NOW()),
  (4, 65.7, 'charging', DATE_SUB(NOW(), INTERVAL 5 MINUTE), 0, 0, 180, 92.3, FALSE, NULL, 28.4, 1200, NOW(), NOW()),
  (5, 90.8, 'idle', NOW(), 0, 0, 270, 94.1, TRUE, NULL, 24.7, 0, NOW(), NOW()),
  (6, 45.2, 'offline', DATE_SUB(NOW(), INTERVAL 30 MINUTE), 0, 0, 315, 0, FALSE, 'Low battery - auto landing', 29.2, 2400, NOW(), NOW()),
  (7, 88.9, 'idle', NOW(), 0, 0, 0, 96.8, TRUE, NULL, 25.9, 0, NOW(), NOW()),
  (8, 72.4, 'flying', NOW(), 150.0, 12.5, 135, 89.3, TRUE, NULL, 31.5, 3600, NOW(), NOW()),
  (9, 55.1, 'maintenance', DATE_SUB(NOW(), INTERVAL 2 HOUR), 0, 0, 0, 0, FALSE, 'Scheduled maintenance', 22.1, 0, NOW(), NOW()),
  (10, 0, 'offline', DATE_SUB(NOW(), INTERVAL 1 DAY), 0, 0, 0, 0, FALSE, 'Battery depleted', 20.0, 0, NOW(), NOW());

-- 插入無人機位置測試數據（台北101周邊）
INSERT IGNORE INTO drone_positions (drone_id, latitude, longitude, altitude, speed, heading, battery_level, timestamp, createdAt, updatedAt)
VALUES
  (1, 25.0337, 121.5645, 100.0, 0, 0, 85.5, NOW(), NOW(), NOW()),
  (2, 25.0340, 121.5650, 100.0, 0, 45, 92.3, NOW(), NOW(), NOW()),
  (3, 25.0345, 121.5655, 100.0, 0, 90, 78.8, NOW(), NOW(), NOW()),
  (4, 25.0350, 121.5660, 100.0, 0, 180, 45.2, DATE_SUB(NOW(), INTERVAL 5 MINUTE), NOW(), NOW()),
  (5, 25.0355, 121.5665, 100.0, 0, 270, 90.1, NOW(), NOW(), NOW()),
  (6, 25.0360, 121.5670, 100.0, 0, 315, 23.4, DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NOW()),
  (7, 25.0365, 121.5675, 100.0, 0, 0, 67.9, NOW(), NOW(), NOW()),
  (8, 25.0370, 121.5680, 150.0, 12.5, 135, 88.7, NOW(), NOW(), NOW()),
  (9, 25.0375, 121.5685, 100.0, 0, 0, 15.3, DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW(), NOW()),
  (10, 25.0380, 121.5690, 100.0, 0, 0, 56.8, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NOW());

-- 插入無人機指令測試數據
INSERT IGNORE INTO drone_commands (drone_id, command_type, command_data, status, issued_by, issued_at, executed_at, completed_at, error_message, createdAt, updatedAt)
VALUES
  (8, 'takeoff', '{"altitude": 150}', 'completed', 1, DATE_SUB(NOW(), INTERVAL 10 MINUTE), DATE_SUB(NOW(), INTERVAL 9 MINUTE), DATE_SUB(NOW(), INTERVAL 8 MINUTE), NULL, NOW(), NOW()),
  (8, 'move', '{"latitude": 25.0370, "longitude": 121.5680, "altitude": 150}', 'executing', 1, DATE_SUB(NOW(), INTERVAL 5 MINUTE), DATE_SUB(NOW(), INTERVAL 4 MINUTE), NULL, NULL, NOW(), NOW()),
  (1, 'takeoff', '{"altitude": 100}', 'pending', 1, NOW(), NULL, NULL, NULL, NOW(), NOW()),
  (4, 'return_home', '{}', 'failed', 1, DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 14 MINUTE), DATE_SUB(NOW(), INTERVAL 13 MINUTE), 'Low battery - emergency landing', NOW(), NOW()),
  (9, 'emergency_stop', '{}', 'completed', 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, NOW(), NOW());

-- 插入指令佇列測試數據
INSERT IGNORE INTO drone_command_queue (drone_id, command_id, queue_position, priority, scheduled_time, status, retry_count, max_retries, createdAt, updatedAt)
VALUES
  (1, 3, 1, 3, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 'queued', 0, 3, NOW(), NOW()),
  (8, 2, 1, 1, NOW(), 'processing', 0, 3, NOW(), NOW());

-- 提交交易
COMMIT;

-- 顯示創建結果
SELECT 'Drone schema and test data created successfully' AS status;

-- 顯示所有創建的表
SHOW TABLES;

-- 顯示表結構概覽
SELECT
    TABLE_NAME as '表名',
    TABLE_COMMENT as '描述',
    CREATE_TIME as '創建時間'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'drone_db'
ORDER BY TABLE_NAME;