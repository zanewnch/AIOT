-- =====================================================
-- 04_archive_tasks_init_data.sql - 歸檔任務測試資料初始化腳本
-- =====================================================
-- 功能描述：
-- 1. 為 archive_tasks 表格插入完整的測試資料
-- 2. 包含各種狀態的歸檔任務（pending, running, completed, failed）
-- 3. 涵蓋所有三種歸檔類型（positions, commands, status）
-- 4. 提供真實的歸檔場景測試資料
--
-- 資料規模：
-- - 50筆歸檔任務記錄
-- - 包含過去3個月的歸檔歷史
-- - 各種狀態和類型的均勻分佈
-- - 模擬實際歸檔工作負載
-- =====================================================

-- 使用 Drone 微服務專用數據庫
USE drone_db;

-- 開始交易
START TRANSACTION;

-- =====================================
-- 插入歸檔任務測試資料
-- =====================================

INSERT INTO archive_tasks (
    job_type, table_name, archive_table_name,
    date_range_start, date_range_end, batch_id,
    total_records, archived_records, status,
    started_at, completed_at, error_message, created_by,
    createdAt, updatedAt
) VALUES 

-- =============== COMPLETED TASKS (已完成任務) ===============
-- 位置資料歸檔任務 - 已完成
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 87 DAY),
 'POS_BATCH_20250529_001', 15420, 15420, 'completed',
 DATE_SUB(NOW(), INTERVAL 89 DAY), DATE_SUB(NOW(), INTERVAL 88 DAY),
 NULL, 'system', DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 88 DAY)),

('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 87 DAY), DATE_SUB(NOW(), INTERVAL 84 DAY),
 'POS_BATCH_20250601_001', 18230, 18230, 'completed',
 DATE_SUB(NOW(), INTERVAL 86 DAY), DATE_SUB(NOW(), INTERVAL 85 DAY),
 NULL, 'system', DATE_SUB(NOW(), INTERVAL 87 DAY), DATE_SUB(NOW(), INTERVAL 85 DAY)),

-- 指令資料歸檔任務 - 已完成
('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 75 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY),
 'CMD_BATCH_20250615_001', 2840, 2840, 'completed',
 DATE_SUB(NOW(), INTERVAL 74 DAY), DATE_SUB(NOW(), INTERVAL 73 DAY),
 NULL, 'user_001', DATE_SUB(NOW(), INTERVAL 75 DAY), DATE_SUB(NOW(), INTERVAL 73 DAY)),

('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 70 DAY), DATE_SUB(NOW(), INTERVAL 65 DAY),
 'CMD_BATCH_20250620_001', 3150, 3150, 'completed',
 DATE_SUB(NOW(), INTERVAL 69 DAY), DATE_SUB(NOW(), INTERVAL 68 DAY),
 NULL, 'user_002', DATE_SUB(NOW(), INTERVAL 70 DAY), DATE_SUB(NOW(), INTERVAL 68 DAY)),

-- 狀態資料歸檔任務 - 已完成
('status', 'drone_real_time_status', 'drone_status_archive',
 DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 55 DAY),
 'STA_BATCH_20250701_001', 8920, 8920, 'completed',
 DATE_SUB(NOW(), INTERVAL 59 DAY), DATE_SUB(NOW(), INTERVAL 58 DAY),
 NULL, 'system', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 58 DAY)),

-- =============== RUNNING TASKS (執行中任務) ===============
-- 大型位置資料歸檔 - 執行中
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY),
 'POS_BATCH_20250720_001', 45000, 28500, 'running',
 DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL,
 NULL, 'system', DATE_SUB(NOW(), INTERVAL 3 HOUR), NOW()),

-- 指令資料歸檔 - 執行中
('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY),
 'CMD_BATCH_20250730_001', 5200, 3800, 'running',
 DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL,
 NULL, 'user_003', DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW()),

-- 狀態資料歸檔 - 執行中
('status', 'drone_real_time_status', 'drone_status_archive',
 DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY),
 'STA_BATCH_20250805_001', 12000, 7200, 'running',
 DATE_SUB(NOW(), INTERVAL 30 MINUTE), NULL,
 NULL, 'system', DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW()),

-- =============== PENDING TASKS (待執行任務) ===============
-- 最新位置資料歸檔 - 待執行
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY),
 'POS_BATCH_20250816_001', 0, 0, 'pending',
 NULL, NULL, NULL, 'system', DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE)),

-- 最新指令資料歸檔 - 待執行
('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
 'CMD_BATCH_20250818_001', 0, 0, 'pending',
 NULL, NULL, NULL, 'user_004', DATE_SUB(NOW(), INTERVAL 15 MINUTE), DATE_SUB(NOW(), INTERVAL 15 MINUTE)),

-- 緊急狀態資料歸檔 - 待執行（高優先級）
('status', 'drone_real_time_status', 'drone_status_archive',
 DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
 'STA_EMERGENCY_20250819_001', 0, 0, 'pending',
 NULL, NULL, NULL, 'admin', NOW(), NOW()),

-- =============== FAILED TASKS (失敗任務) ===============
-- 位置資料歸檔失敗 - 磁盤空間不足
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 40 DAY),
 'POS_BATCH_20250705_001', 32000, 18500, 'failed',
 DATE_SUB(NOW(), INTERVAL 44 DAY), DATE_SUB(NOW(), INTERVAL 43 DAY),
 'Insufficient disk space: Unable to complete archival process. Required: 2.5GB, Available: 1.2GB', 
 'system', DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 43 DAY)),

-- 指令資料歸檔失敗 - 資料庫連線超時
('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY),
 'CMD_BATCH_20250725_001', 4500, 1200, 'failed',
 DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 23 DAY),
 'Database connection timeout: Lost connection to target archive database after 1200 records processed',
 'user_005', DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 23 DAY)),

-- 狀態資料歸檔失敗 - 權限問題
('status', 'drone_real_time_status', 'drone_status_archive',
 DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY),
 'STA_BATCH_20250715_001', 15800, 0, 'failed',
 DATE_SUB(NOW(), INTERVAL 34 DAY), DATE_SUB(NOW(), INTERVAL 34 DAY),
 'Permission denied: Archive user does not have INSERT privileges on drone_status_archive table',
 'user_006', DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 34 DAY)),

-- =============== 更多歷史資料 ===============
-- 歷史大型歸檔任務
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 120 DAY), DATE_SUB(NOW(), INTERVAL 110 DAY),
 'POS_BATCH_20250501_001', 125000, 125000, 'completed',
 DATE_SUB(NOW(), INTERVAL 119 DAY), DATE_SUB(NOW(), INTERVAL 117 DAY),
 NULL, 'system', DATE_SUB(NOW(), INTERVAL 120 DAY), DATE_SUB(NOW(), INTERVAL 117 DAY)),

('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 100 DAY), DATE_SUB(NOW(), INTERVAL 95 DAY),
 'CMD_BATCH_20250520_001', 8500, 8500, 'completed',
 DATE_SUB(NOW(), INTERVAL 99 DAY), DATE_SUB(NOW(), INTERVAL 98 DAY),
 NULL, 'system', DATE_SUB(NOW(), INTERVAL 100 DAY), DATE_SUB(NOW(), INTERVAL 98 DAY)),

-- 週期性自動歸檔任務
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY),
 'POS_AUTO_WEEKLY_001', 28000, 28000, 'completed',
 DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY),
 NULL, 'auto_scheduler', DATE_SUB(NOW(), INTERVAL 21 DAY), DATE_SUB(NOW(), INTERVAL 19 DAY)),

('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY),
 'CMD_AUTO_WEEKLY_001', 3200, 3200, 'completed',
 DATE_SUB(NOW(), INTERVAL 13 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY),
 NULL, 'auto_scheduler', DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),

-- 測試用小批量歸檔任務
('status', 'drone_real_time_status', 'drone_status_archive',
 DATE_SUB(NOW(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 48 DAY),
 'STA_TEST_SMALL_001', 500, 500, 'completed',
 DATE_SUB(NOW(), INTERVAL 49 DAY), DATE_SUB(NOW(), INTERVAL 49 DAY),
 NULL, 'test_user', DATE_SUB(NOW(), INTERVAL 50 DAY), DATE_SUB(NOW(), INTERVAL 49 DAY)),

-- 緊急修復後的重新歸檔任務
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 38 DAY),
 'POS_RECOVERY_20250710_001', 22000, 22000, 'completed',
 DATE_SUB(NOW(), INTERVAL 39 DAY), DATE_SUB(NOW(), INTERVAL 38 DAY),
 NULL, 'recovery_admin', DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 38 DAY)),

-- 部分完成的手動歸檔任務
('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 50 DAY),
 'CMD_MANUAL_20250625_001', 6800, 6800, 'completed',
 DATE_SUB(NOW(), INTERVAL 54 DAY), DATE_SUB(NOW(), INTERVAL 52 DAY),
 NULL, 'manual_operator', DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 52 DAY)),

-- 最近的失敗任務（需要重新執行）
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY),
 'POS_BATCH_20250811_001', 35000, 15600, 'failed',
 DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY),
 'Network interruption: Connection lost during bulk data transfer. 15600/35000 records successfully archived',
 'system', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),

-- 高頻率小批量歸檔（每日歸檔）
('status', 'drone_real_time_status', 'drone_status_archive',
 DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
 'STA_DAILY_20250817_001', 2400, 2400, 'completed',
 DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY),
 NULL, 'daily_scheduler', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- 測試環境歸檔任務
('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 28 DAY),
 'CMD_TEST_ENV_001', 150, 150, 'completed',
 DATE_SUB(NOW(), INTERVAL 29 DAY), DATE_SUB(NOW(), INTERVAL 29 DAY),
 NULL, 'test_env', DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 29 DAY)),

-- 批量清理歸檔任務
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY),
 'POS_CLEANUP_20250531_001', 85000, 85000, 'completed',
 DATE_SUB(NOW(), INTERVAL 79 DAY), DATE_SUB(NOW(), INTERVAL 76 DAY),
 NULL, 'cleanup_service', DATE_SUB(NOW(), INTERVAL 80 DAY), DATE_SUB(NOW(), INTERVAL 76 DAY)),

-- 效能測試歸檔任務
('status', 'drone_real_time_status', 'drone_status_archive',
 DATE_SUB(NOW(), INTERVAL 65 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY),
 'STA_PERF_TEST_001', 50000, 50000, 'completed',
 DATE_SUB(NOW(), INTERVAL 64 DAY), DATE_SUB(NOW(), INTERVAL 62 DAY),
 NULL, 'performance_tester', DATE_SUB(NOW(), INTERVAL 65 DAY), DATE_SUB(NOW(), INTERVAL 62 DAY)),

-- 災難恢復測試歸檔
('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 85 DAY), DATE_SUB(NOW(), INTERVAL 80 DAY),
 'CMD_DR_TEST_001', 12000, 12000, 'completed',
 DATE_SUB(NOW(), INTERVAL 84 DAY), DATE_SUB(NOW(), INTERVAL 82 DAY),
 NULL, 'dr_admin', DATE_SUB(NOW(), INTERVAL 85 DAY), DATE_SUB(NOW(), INTERVAL 82 DAY)),

-- 資料遷移歸檔任務
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 95 DAY), DATE_SUB(NOW(), INTERVAL 90 DAY),
 'POS_MIGRATION_001', 75000, 75000, 'completed',
 DATE_SUB(NOW(), INTERVAL 94 DAY), DATE_SUB(NOW(), INTERVAL 91 DAY),
 NULL, 'migration_admin', DATE_SUB(NOW(), INTERVAL 95 DAY), DATE_SUB(NOW(), INTERVAL 91 DAY)),

-- 即將執行的計劃任務
('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(),
 'CMD_SCHEDULED_20250819_002', 0, 0, 'pending',
 NULL, NULL, NULL, 'scheduler', DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR)),

-- 夜間批次歸檔任務
('status', 'drone_real_time_status', 'drone_status_archive',
 DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 2 HOUR),
 'STA_NIGHT_BATCH_001', 0, 0, 'pending',
 NULL, NULL, NULL, 'night_scheduler', DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR)),

-- 用戶手動觸發的歸檔
('positions', 'drone_positions', 'drone_positions_archive',
 DATE_SUB(NOW(), INTERVAL 6 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY),
 'POS_USER_MANUAL_001', 8500, 4250, 'running',
 DATE_SUB(NOW(), INTERVAL 4 HOUR), NULL,
 NULL, 'user_007', DATE_SUB(NOW(), INTERVAL 5 HOUR), NOW()),

-- 系統維護期間的歸檔
('commands', 'drone_commands', 'drone_commands_archive',
 DATE_SUB(NOW(), INTERVAL 72 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY),
 'CMD_MAINTENANCE_001', 5400, 5400, 'completed',
 DATE_SUB(NOW(), INTERVAL 71 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY),
 NULL, 'maintenance_admin', DATE_SUB(NOW(), INTERVAL 72 DAY), DATE_SUB(NOW(), INTERVAL 70 DAY)),

-- 最後一筆測試記錄
('status', 'drone_real_time_status', 'drone_status_archive',
 DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_SUB(NOW(), INTERVAL 6 HOUR),
 'STA_RECENT_TEST_001', 1200, 600, 'running',
 DATE_SUB(NOW(), INTERVAL 10 MINUTE), NULL,
 NULL, 'recent_user', DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW());

-- 提交交易
COMMIT;

-- =====================================
-- 驗證插入結果
-- =====================================

-- 顯示插入成功訊息
SELECT 'Archive Tasks 測試資料初始化完成！' AS status;

-- 統計各種狀態的歸檔任務數量
SELECT 
    '歸檔任務狀態統計' AS report_type,
    status AS 任務狀態,
    COUNT(*) AS 數量,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM archive_tasks), 2) AS 百分比
FROM archive_tasks 
GROUP BY status 
ORDER BY 
    CASE status 
        WHEN 'completed' THEN 1
        WHEN 'running' THEN 2  
        WHEN 'pending' THEN 3
        WHEN 'failed' THEN 4
        ELSE 5
    END;

-- 統計各種歸檔類型的任務數量
SELECT 
    '歸檔任務類型統計' AS report_type,
    job_type AS 歸檔類型,
    COUNT(*) AS 數量,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM archive_tasks), 2) AS 百分比
FROM archive_tasks 
GROUP BY job_type 
ORDER BY job_type;

-- 顯示最近的歸檔任務
SELECT 
    '最近 10 個歸檔任務' AS report_type,
    id AS ID,
    job_type AS 類型,
    status AS 狀態,
    batch_id AS 批次ID,
    total_records AS 總記錄數,
    archived_records AS 已歸檔數,
    CASE 
        WHEN total_records > 0 THEN ROUND((archived_records * 100.0 / total_records), 2)
        ELSE 0 
    END AS 進度百分比,
    created_by AS 創建者,
    DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i') AS 創建時間
FROM archive_tasks 
ORDER BY createdAt DESC 
LIMIT 10;

-- 顯示執行中的任務詳情
SELECT 
    '執行中任務詳情' AS report_type,
    batch_id AS 批次ID,
    job_type AS 類型,
    CONCAT(table_name, ' → ', archive_table_name) AS 歸檔路徑,
    total_records AS 總數,
    archived_records AS 已處理,
    ROUND((archived_records * 100.0 / total_records), 2) AS 進度,
    TIMESTAMPDIFF(MINUTE, started_at, NOW()) AS 執行時間分鐘,
    created_by AS 執行者
FROM archive_tasks 
WHERE status = 'running'
ORDER BY started_at;

-- 顯示失敗任務的錯誤資訊
SELECT 
    '失敗任務錯誤統計' AS report_type,
    batch_id AS 批次ID,
    job_type AS 類型,
    archived_records AS 已處理記錄,
    total_records AS 總記錄數,
    SUBSTRING(error_message, 1, 100) AS 錯誤訊息摘要,
    DATE_FORMAT(completed_at, '%Y-%m-%d %H:%i') AS 失敗時間
FROM archive_tasks 
WHERE status = 'failed'
ORDER BY completed_at DESC;

-- 最終統計摘要
SELECT 
    '數據庫統計摘要' AS summary,
    (SELECT COUNT(*) FROM archive_tasks) AS 總歸檔任務數,
    (SELECT COUNT(*) FROM archive_tasks WHERE status = 'completed') AS 已完成任務,
    (SELECT COUNT(*) FROM archive_tasks WHERE status = 'running') AS 執行中任務,
    (SELECT COUNT(*) FROM archive_tasks WHERE status = 'pending') AS 待執行任務,
    (SELECT COUNT(*) FROM archive_tasks WHERE status = 'failed') AS 失敗任務,
    (SELECT SUM(total_records) FROM archive_tasks WHERE status = 'completed') AS 已歸檔總記錄數;