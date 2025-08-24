-- =====================================================
-- 02_drone_complete_init.sql - Drone 完整系統初始化腳本 (PostgreSQL)
-- =====================================================
-- 功能描述：
-- 1. 創建完整的 Drone 無人機管理系統表結構
-- 2. 插入 10 台測試無人機和相關數據
-- 3. 建立無人機狀態、位置、指令等完整數據
--
-- 創建的表結構（9個表）：
-- - drones_status: 無人機基本狀態表
-- - drone_real_time_status: 無人機即時狀態表
-- - drone_positions: 無人機位置記錄表
-- - drone_commands: 無人機指令表
-- - drone_command_queue: 無人機指令佇列表
-- - archive_tasks: 歸檔任務表
-- - drone_positions_archive: 位置數據歷史歸檔表
-- - drone_commands_archive: 指令數據歷史歸檔表
-- - drone_status_archive: 狀態數據歷史歸檔表
-- =====================================================

-- 連接到 Drone 微服務專用資料庫
\c drone_db;

-- 開始交易
BEGIN;

-- =====================================
-- 1. 創建 Drone 表結構
-- =====================================

-- 創建無人機基本狀態表 (drones_status)
CREATE TABLE IF NOT EXISTS drones_status (
    id BIGSERIAL PRIMARY KEY,
    "droneSerial" VARCHAR(255) NOT NULL UNIQUE,
    "droneName" VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    "ownerUserId" BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance', 'flying')),
    "maxAltitude" INTEGER NOT NULL,
    "maxRange" INTEGER NOT NULL,
    "batteryCapacity" INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_drones_status_droneSerial ON drones_status("droneSerial");
CREATE INDEX IF NOT EXISTS idx_drones_status_ownerUserId ON drones_status("ownerUserId");
CREATE INDEX IF NOT EXISTS idx_drones_status_status ON drones_status(status);
CREATE INDEX IF NOT EXISTS idx_drones_status_createdAt ON drones_status("createdAt");

-- 創建無人機即時狀態表 (drone_real_time_status)
CREATE TABLE IF NOT EXISTS drone_real_time_status (
    id BIGSERIAL PRIMARY KEY,
    "droneId" BIGINT NOT NULL REFERENCES drones_status(id) ON DELETE CASCADE,
    "batteryLevel" INTEGER NOT NULL CHECK ("batteryLevel" >= 0 AND "batteryLevel" <= 100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('idle', 'flying', 'charging', 'maintenance', 'offline')),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude INTEGER,
    heading INTEGER CHECK (heading >= 0 AND heading <= 360),
    speed DECIMAL(5, 2),
    "lastCommunication" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_drone_real_time_status_droneId ON drone_real_time_status("droneId");
CREATE INDEX IF NOT EXISTS idx_drone_real_time_status_status ON drone_real_time_status(status);
CREATE INDEX IF NOT EXISTS idx_drone_real_time_status_lastCommunication ON drone_real_time_status("lastCommunication");

-- 創建無人機位置記錄表 (drone_positions)
CREATE TABLE IF NOT EXISTS drone_positions (
    id BIGSERIAL PRIMARY KEY,
    "droneId" BIGINT NOT NULL REFERENCES drones_status(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude INTEGER NOT NULL,
    heading INTEGER CHECK (heading >= 0 AND heading <= 360),
    speed DECIMAL(5, 2),
    "batteryLevel" INTEGER CHECK ("batteryLevel" >= 0 AND "batteryLevel" <= 100),
    timestamp TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_drone_positions_droneId ON drone_positions("droneId");
CREATE INDEX IF NOT EXISTS idx_drone_positions_timestamp ON drone_positions(timestamp);
CREATE INDEX IF NOT EXISTS idx_drone_positions_createdAt ON drone_positions("createdAt");

-- 創建無人機指令表 (drone_commands)
CREATE TABLE IF NOT EXISTS drone_commands (
    id BIGSERIAL PRIMARY KEY,
    "droneId" BIGINT NOT NULL REFERENCES drones_status(id) ON DELETE CASCADE,
    "commandType" VARCHAR(50) NOT NULL,
    "commandData" TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed', 'cancelled')),
    "issuedBy" BIGINT NOT NULL,
    "issuedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_drone_commands_droneId ON drone_commands("droneId");
CREATE INDEX IF NOT EXISTS idx_drone_commands_status ON drone_commands(status);
CREATE INDEX IF NOT EXISTS idx_drone_commands_issuedBy ON drone_commands("issuedBy");
CREATE INDEX IF NOT EXISTS idx_drone_commands_issuedAt ON drone_commands("issuedAt");

-- 創建無人機指令佇列表 (drone_command_queue)
CREATE TABLE IF NOT EXISTS drone_command_queue (
    id BIGSERIAL PRIMARY KEY,
    "droneId" BIGINT NOT NULL REFERENCES drones_status(id) ON DELETE CASCADE,
    "commandType" VARCHAR(50) NOT NULL,
    "commandData" TEXT,
    priority INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'executing', 'completed', 'failed', 'cancelled')),
    "scheduledAt" TIMESTAMP,
    attempts INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_drone_command_queue_droneId ON drone_command_queue("droneId");
CREATE INDEX IF NOT EXISTS idx_drone_command_queue_status ON drone_command_queue(status);
CREATE INDEX IF NOT EXISTS idx_drone_command_queue_priority ON drone_command_queue(priority);
CREATE INDEX IF NOT EXISTS idx_drone_command_queue_scheduledAt ON drone_command_queue("scheduledAt");

-- 創建歸檔任務表 (archive_tasks)
CREATE TABLE IF NOT EXISTS archive_tasks (
    id BIGSERIAL PRIMARY KEY,
    "tableName" VARCHAR(100) NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    "totalRecords" INTEGER,
    "processedRecords" INTEGER DEFAULT 0,
    "batchId" VARCHAR(50),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_archive_tasks_tableName ON archive_tasks("tableName");
CREATE INDEX IF NOT EXISTS idx_archive_tasks_status ON archive_tasks(status);
CREATE INDEX IF NOT EXISTS idx_archive_tasks_startDate ON archive_tasks("startDate");
CREATE INDEX IF NOT EXISTS idx_archive_tasks_endDate ON archive_tasks("endDate");

-- 創建位置數據歷史歸檔表 (drone_positions_archive)
CREATE TABLE IF NOT EXISTS drone_positions_archive (
    id BIGSERIAL PRIMARY KEY,
    "originalId" BIGINT NOT NULL,
    "droneId" BIGINT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude INTEGER NOT NULL,
    heading INTEGER,
    speed DECIMAL(5, 2),
    "batteryLevel" INTEGER,
    timestamp TIMESTAMP NOT NULL,
    "batchId" VARCHAR(50),
    "archivedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_drone_positions_archive_droneId ON drone_positions_archive("droneId");
CREATE INDEX IF NOT EXISTS idx_drone_positions_archive_timestamp ON drone_positions_archive(timestamp);
CREATE INDEX IF NOT EXISTS idx_drone_positions_archive_batchId ON drone_positions_archive("batchId");

-- 創建指令數據歷史歸檔表 (drone_commands_archive)
CREATE TABLE IF NOT EXISTS drone_commands_archive (
    id BIGSERIAL PRIMARY KEY,
    "originalId" BIGINT NOT NULL,
    "droneId" BIGINT NOT NULL,
    "commandType" VARCHAR(50) NOT NULL,
    "commandData" TEXT,
    status VARCHAR(20) NOT NULL,
    "issuedBy" BIGINT NOT NULL,
    "issuedAt" TIMESTAMP NOT NULL,
    "executedAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "errorMessage" TEXT,
    "archivedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archiveBatchId" VARCHAR(50),
    "createdAt" TIMESTAMP NOT NULL
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_drone_commands_archive_droneId ON drone_commands_archive("droneId");
CREATE INDEX IF NOT EXISTS idx_drone_commands_archive_issuedAt ON drone_commands_archive("issuedAt");
CREATE INDEX IF NOT EXISTS idx_drone_commands_archive_archiveBatchId ON drone_commands_archive("archiveBatchId");

-- 創建狀態數據歷史歸檔表 (drone_status_archive)
CREATE TABLE IF NOT EXISTS drone_status_archive (
    id BIGSERIAL PRIMARY KEY,
    "originalId" BIGINT NOT NULL,
    "droneId" BIGINT NOT NULL,
    "batteryLevel" INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    altitude INTEGER,
    heading INTEGER,
    speed DECIMAL(5, 2),
    "lastCommunication" TIMESTAMP NOT NULL,
    "archivedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archiveBatchId" VARCHAR(50),
    "createdAt" TIMESTAMP NOT NULL
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_drone_status_archive_droneId ON drone_status_archive("droneId");
CREATE INDEX IF NOT EXISTS idx_drone_status_archive_lastCommunication ON drone_status_archive("lastCommunication");
CREATE INDEX IF NOT EXISTS idx_drone_status_archive_archiveBatchId ON drone_status_archive("archiveBatchId");

-- =====================================
-- 2. 插入測試無人機數據
-- =====================================

INSERT INTO drones_status ("droneSerial", "droneName", model, manufacturer, "ownerUserId", status, "maxAltitude", "maxRange", "batteryCapacity", weight) VALUES
('DJI-001-MINI4PRO', 'DJI Mini 4 Pro Alpha', 'Mini 4 Pro', 'DJI', 1, 'active', 3000, 18000, 2590, 249),
('DJI-002-AIR3', 'DJI Air 3 Beta', 'Air 3', 'DJI', 1, 'flying', 6000, 32000, 4242, 720),
('DJI-003-MAVIC3PRO', 'DJI Mavic 3 Pro Gamma', 'Mavic 3 Pro', 'DJI', 2, 'maintenance', 6000, 43000, 5000, 958),
('AUTEL-004-EVOMAX4T', 'Autel EVO Max 4T Delta', 'EVO Max 4T', 'Autel Robotics', 2, 'active', 7000, 42000, 8700, 1795),
('SKYDIO-005-2PLUS', 'Skydio 2+ Epsilon', '2+', 'Skydio', 3, 'flying', 3200, 6000, 2440, 775),
('PARROT-006-ANAFIAI', 'Parrot ANAFI Ai Zeta', 'ANAFI Ai', 'Parrot', 3, 'inactive', 4000, 25000, 3400, 700),
('DJI-007-PHANTOM4PRO', 'DJI Phantom 4 Pro Eta', 'Phantom 4 Pro', 'DJI', 4, 'active', 6000, 30000, 5870, 1388),
('YUNEEC-008-TYPHOONH', 'Yuneec Typhoon H Theta', 'Typhoon H', 'Yuneec', 4, 'flying', 2000, 1600, 5400, 1950),
('FREEFLY-009-ASTRO', 'Freefly Astro Iota', 'Astro', 'Freefly Systems', 1, 'active', 4600, 3200, 8000, 1950),
('WALKERA-010-VITUS320', 'Walkera Vitus 320 Kappa', 'Vitus 320', 'Walkera', 2, 'maintenance', 800, 1500, 5200, 734);

-- =====================================
-- 3. 插入即時狀態數據
-- =====================================

INSERT INTO drone_real_time_status ("droneId", "batteryLevel", status, latitude, longitude, altitude, heading, speed, "lastCommunication") VALUES
(1, 85, 'idle', 25.0330, 121.5654, 100, 270, 0.0, CURRENT_TIMESTAMP - INTERVAL '2 minutes'),
(2, 72, 'flying', 25.0340, 121.5664, 250, 45, 12.5, CURRENT_TIMESTAMP - INTERVAL '30 seconds'),
(3, 0, 'maintenance', 25.0320, 121.5644, 0, 0, 0.0, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(4, 91, 'idle', 25.0350, 121.5674, 150, 180, 0.0, CURRENT_TIMESTAMP - INTERVAL '1 minute'),
(5, 65, 'flying', 25.0360, 121.5684, 300, 90, 15.0, CURRENT_TIMESTAMP - INTERVAL '15 seconds'),
(6, 45, 'charging', 25.0310, 121.5634, 0, 0, 0.0, CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
(7, 88, 'idle', 25.0370, 121.5694, 120, 315, 0.0, CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
(8, 78, 'flying', 25.0380, 121.5704, 280, 225, 8.3, CURRENT_TIMESTAMP - INTERVAL '45 seconds'),
(9, 95, 'idle', 25.0290, 121.5614, 80, 135, 0.0, CURRENT_TIMESTAMP - INTERVAL '3 minutes'),
(10, 0, 'offline', 25.0300, 121.5624, 0, 0, 0.0, CURRENT_TIMESTAMP - INTERVAL '1 day');

-- =====================================
-- 4. 批量創建位置數據
-- =====================================

-- 創建批量位置數據插入函數
CREATE OR REPLACE FUNCTION create_drone_positions()
RETURNS void AS $$
DECLARE
    drone_record RECORD;
    i INTEGER;
    base_lat DECIMAL(10, 8);
    base_lng DECIMAL(11, 8);
    current_time TIMESTAMP;
BEGIN
    -- 台北101周邊區域基準點
    base_lat := 25.0330;
    base_lng := 121.5654;
    
    -- 為每台無人機創建 1000 筆位置記錄
    FOR drone_record IN SELECT id FROM drones_status LOOP
        FOR i IN 1..1000 LOOP
            current_time := CURRENT_TIMESTAMP - INTERVAL '30 days' + INTERVAL '43.2 minutes' * i;
            
            INSERT INTO drone_positions (
                "droneId",
                latitude,
                longitude,
                altitude,
                heading,
                speed,
                "batteryLevel",
                timestamp
            ) VALUES (
                drone_record.id,
                base_lat + (RANDOM() - 0.5) * 0.01, -- ±0.005度範圍 (~500米)
                base_lng + (RANDOM() - 0.5) * 0.01, -- ±0.005度範圍 (~500米)
                (RANDOM() * 400 + 50)::INTEGER, -- 50-450米高度
                (RANDOM() * 360)::INTEGER, -- 0-360度方向
                ROUND((RANDOM() * 20)::NUMERIC, 2), -- 0-20 m/s速度
                (RANDOM() * 100)::INTEGER, -- 0-100%電量
                current_time
            );
        END LOOP;
        
        RAISE NOTICE 'Created 1000 position records for drone %', drone_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 執行位置數據創建
SELECT create_drone_positions();

-- =====================================
-- 5. 插入指令數據
-- =====================================

INSERT INTO drone_commands ("droneId", "commandType", "commandData", status, "issuedBy", "issuedAt", "executedAt", "completedAt") VALUES
(1, 'takeoff', '{"altitude": 100}', 'completed', 1, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '59 minutes', CURRENT_TIMESTAMP - INTERVAL '58 minutes'),
(2, 'move', '{"latitude": 25.0340, "longitude": 121.5664, "altitude": 250}', 'executing', 1, CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '29 minutes', NULL),
(3, 'land', '{}', 'completed', 2, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour 58 minutes', CURRENT_TIMESTAMP - INTERVAL '1 hour 55 minutes'),
(4, 'hover', '{"duration": 300}', 'pending', 2, CURRENT_TIMESTAMP - INTERVAL '10 minutes', NULL, NULL),
(5, 'return_to_home', '{}', 'executing', 3, CURRENT_TIMESTAMP - INTERVAL '15 minutes', CURRENT_TIMESTAMP - INTERVAL '14 minutes', NULL);

-- =====================================
-- 6. 插入指令佇列數據
-- =====================================

INSERT INTO drone_command_queue ("droneId", "commandType", "commandData", priority, status, "scheduledAt") VALUES
(1, 'battery_check', '{}', 1, 'queued', CURRENT_TIMESTAMP + INTERVAL '10 minutes'),
(2, 'land', '{}', 2, 'queued', CURRENT_TIMESTAMP + INTERVAL '5 minutes'),
(4, 'takeoff', '{"altitude": 150}', 3, 'queued', CURRENT_TIMESTAMP + INTERVAL '2 minutes'),
(5, 'move', '{"latitude": 25.0380, "longitude": 121.5704}', 1, 'queued', CURRENT_TIMESTAMP + INTERVAL '20 minutes');

-- =====================================
-- 7. 插入歸檔任務數據
-- =====================================

INSERT INTO archive_tasks ("tableName", "startDate", "endDate", status, "totalRecords", "processedRecords", "batchId", "completedAt") VALUES
('drone_positions', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '30 days', 'completed', 5000, 5000, 'BATCH_2024_001', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('drone_commands', CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '60 days', 'completed', 250, 250, 'BATCH_2024_002', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('drone_status', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '15 days', 'processing', 1000, 750, 'BATCH_2024_003', NULL),
('drone_positions', CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP - INTERVAL '75 days', 'pending', NULL, 0, NULL, NULL),
('drone_commands', CURRENT_TIMESTAMP - INTERVAL '120 days', CURRENT_TIMESTAMP - INTERVAL '90 days', 'failed', 180, 45, 'BATCH_2024_004', NULL),
('drone_status', CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '30 days', 'completed', 800, 800, 'BATCH_2024_005', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- =====================================
-- 8. 創建更新時間觸發器
-- =====================================

-- 創建更新時間函數（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 為相關表創建更新時間觸發器
CREATE TRIGGER update_drones_status_updated_at BEFORE UPDATE ON drones_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drone_real_time_status_updated_at BEFORE UPDATE ON drone_real_time_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drone_commands_updated_at BEFORE UPDATE ON drone_commands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drone_command_queue_updated_at BEFORE UPDATE ON drone_command_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_archive_tasks_updated_at BEFORE UPDATE ON archive_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 清理函數
DROP FUNCTION create_drone_positions();

-- 提交交易
COMMIT;

-- =====================================
-- 9. 顯示統計信息
-- =====================================

SELECT 'Drone system initialization completed successfully' AS status;

-- 統計信息
SELECT 
    'Drones' AS table_name,
    COUNT(*) AS record_count
FROM drones_status
UNION ALL
SELECT 
    'Real-time Status' AS table_name,
    COUNT(*) AS record_count
FROM drone_real_time_status
UNION ALL
SELECT 
    'Position Records' AS table_name,
    COUNT(*) AS record_count
FROM drone_positions
UNION ALL
SELECT 
    'Commands' AS table_name,
    COUNT(*) AS record_count
FROM drone_commands
UNION ALL
SELECT 
    'Command Queue' AS table_name,
    COUNT(*) AS record_count
FROM drone_command_queue
UNION ALL
SELECT 
    'Archive Tasks' AS table_name,
    COUNT(*) AS record_count
FROM archive_tasks;

-- 無人機狀態分佈
SELECT 
    status,
    COUNT(*) AS drone_count
FROM drones_status
GROUP BY status
ORDER BY drone_count DESC;