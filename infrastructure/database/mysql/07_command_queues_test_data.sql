-- 清空 drone command queues 表的測試數據
DELETE FROM drone_command_queues;

-- 重置自增 ID
ALTER TABLE drone_command_queues AUTO_INCREMENT = 1;

-- 插入無人機指令佇列測試數據
-- 根據 DroneCommandQueueModel.ts 的結構插入各種狀態的佇列

-- 1. 基本飛行任務佇列 (已完成)
INSERT INTO drone_command_queues (
    name, 
    status, 
    current_index, 
    auto_execute, 
    execution_conditions, 
    loop_count, 
    max_loops, 
    created_by, 
    started_at, 
    completed_at, 
    error_message
) VALUES 
(
    '基本飛行任務', 
    'completed', 
    3, 
    true, 
    NULL, 
    1, 
    1, 
    1, 
    NOW() - INTERVAL 15 MINUTE, 
    NOW() - INTERVAL 10 MINUTE, 
    NULL
);

-- 2. 巡航任務佇列 (執行中)
INSERT INTO drone_command_queues (
    name, 
    status, 
    current_index, 
    auto_execute, 
    execution_conditions, 
    loop_count, 
    max_loops, 
    created_by, 
    started_at, 
    completed_at, 
    error_message
) VALUES 
(
    '區域巡航任務', 
    'running', 
    2, 
    true, 
    '[{"type": "battery", "operator": ">=", "value": 20, "unit": "%"}]', 
    1, 
    3, 
    1, 
    NOW() - INTERVAL 5 MINUTE, 
    NULL, 
    NULL
);

-- 3. 緊急降落佇列 (已暫停)
INSERT INTO drone_command_queues (
    name, 
    status, 
    current_index, 
    auto_execute, 
    execution_conditions, 
    loop_count, 
    max_loops, 
    created_by, 
    started_at, 
    completed_at, 
    error_message
) VALUES 
(
    '緊急降落程序', 
    'paused', 
    1, 
    false, 
    '[{"type": "battery", "operator": "<=", "value": 15, "unit": "%"}]', 
    0, 
    1, 
    1, 
    NOW() - INTERVAL 2 MINUTE, 
    NULL, 
    '電量不足，任務暫停'
);

-- 4. 自動巡邏佇列 (待執行)
INSERT INTO drone_command_queues (
    name, 
    status, 
    current_index, 
    auto_execute, 
    execution_conditions, 
    loop_count, 
    max_loops, 
    created_by, 
    started_at, 
    completed_at, 
    error_message
) VALUES 
(
    '自動巡邏路線', 
    'pending', 
    0, 
    true, 
    '[{"type": "time", "operator": ">=", "value": "08:00", "unit": "hour"}, {"type": "battery", "operator": ">=", "value": 50, "unit": "%"}]', 
    0, 
    5, 
    1, 
    NULL, 
    NULL, 
    NULL
);

-- 5. 複雜任務佇列 (執行失敗)
INSERT INTO drone_command_queues (
    name, 
    status, 
    current_index, 
    auto_execute, 
    execution_conditions, 
    loop_count, 
    max_loops, 
    created_by, 
    started_at, 
    completed_at, 
    error_message
) VALUES 
(
    '複雜機動任務', 
    'failed', 
    1, 
    true, 
    '[{"type": "altitude", "operator": "<=", "value": 100, "unit": "m"}]', 
    0, 
    2, 
    1, 
    NOW() - INTERVAL 20 MINUTE, 
    NOW() - INTERVAL 18 MINUTE, 
    '無人機回應超時，任務失敗'
);

-- 6. 搜救任務佇列 (執行中，有迴圈)
INSERT INTO drone_command_queues (
    name, 
    status, 
    current_index, 
    auto_execute, 
    execution_conditions, 
    loop_count, 
    max_loops, 
    created_by, 
    started_at, 
    completed_at, 
    error_message
) VALUES 
(
    '搜救任務模式', 
    'running', 
    4, 
    true, 
    '[{"type": "battery", "operator": ">=", "value": 30, "unit": "%"}, {"type": "position", "operator": "<=", "value": 1000, "unit": "m"}]', 
    2, 
    10, 
    1, 
    NOW() - INTERVAL 30 MINUTE, 
    NULL, 
    NULL
);

-- 7. 測試佇列 (待執行，無迴圈)
INSERT INTO drone_command_queues (
    name, 
    status, 
    current_index, 
    auto_execute, 
    execution_conditions, 
    loop_count, 
    max_loops, 
    created_by, 
    started_at, 
    completed_at, 
    error_message
) VALUES 
(
    '系統測試佇列', 
    'pending', 
    0, 
    false, 
    NULL, 
    NULL, 
    NULL, 
    1, 
    NULL, 
    NULL, 
    NULL
);

-- 8. 快速巡檢佇列 (已完成，多次迴圈)
INSERT INTO drone_command_queues (
    name, 
    status, 
    current_index, 
    auto_execute, 
    execution_conditions, 
    loop_count, 
    max_loops, 
    created_by, 
    started_at, 
    completed_at, 
    error_message
) VALUES 
(
    '快速設備巡檢', 
    'completed', 
    6, 
    true, 
    '[{"type": "battery", "operator": ">=", "value": 25, "unit": "%"}]', 
    3, 
    3, 
    1, 
    NOW() - INTERVAL 1 HOUR, 
    NOW() - INTERVAL 45 MINUTE, 
    NULL
);

-- 為這些佇列創建相關的指令記錄
-- 佇列 1 的指令 (基本飛行任務)
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at, executed_at, completed_at) VALUES
(1, 1, 'takeoff', '{"altitude": 50, "speed": 2.5}', 'completed', 1, NOW() - INTERVAL 15 MINUTE, NOW() - INTERVAL 14 MINUTE, NOW() - INTERVAL 13 MINUTE),
(1, 1, 'flyTo', '{"latitude": 25.033964, "longitude": 121.564468, "altitude": 50, "speed": 3.0}', 'completed', 1, NOW() - INTERVAL 13 MINUTE, NOW() - INTERVAL 12 MINUTE, NOW() - INTERVAL 11 MINUTE),
(1, 1, 'land', '{"speed": 2.0}', 'completed', 1, NOW() - INTERVAL 11 MINUTE, NOW() - INTERVAL 10 MINUTE, NOW() - INTERVAL 10 MINUTE);

-- 佇列 2 的指令 (巡航任務)
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at, executed_at, completed_at) VALUES
(1, 2, 'takeoff', '{"altitude": 80, "speed": 3.0}', 'completed', 1, NOW() - INTERVAL 5 MINUTE, NOW() - INTERVAL 4 MINUTE, NOW() - INTERVAL 4 MINUTE),
(1, 2, 'flyTo', '{"latitude": 25.040000, "longitude": 121.520000, "altitude": 80, "speed": 4.0}', 'executing', 1, NOW() - INTERVAL 4 MINUTE, NOW() - INTERVAL 3 MINUTE, NULL),
(1, 2, 'hover', '{"duration": 60}', 'pending', 1, NOW() - INTERVAL 4 MINUTE, NULL, NULL);

-- 佇列 3 的指令 (緊急降落)
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at, executed_at, completed_at) VALUES
(1, 3, 'emergency', '{"action": "land"}', 'executing', 1, NOW() - INTERVAL 2 MINUTE, NOW() - INTERVAL 2 MINUTE, NULL);

-- 佇列 4 的指令 (自動巡邏，待執行)
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, 4, 'takeoff', '{"altitude": 60, "speed": 2.5}', 'pending', 1, NOW() - INTERVAL 1 MINUTE),
(1, 4, 'flyTo', '{"latitude": 25.045000, "longitude": 121.515000, "altitude": 60, "speed": 3.5}', 'pending', 1, NOW() - INTERVAL 1 MINUTE),
(1, 4, 'moveForward', '{"distance": 100, "speed": 3.0}', 'pending', 1, NOW() - INTERVAL 1 MINUTE),
(1, 4, 'rotateRight', '{"angle": 90}', 'pending', 1, NOW() - INTERVAL 1 MINUTE),
(1, 4, 'return', '{"speed": 4.0}', 'pending', 1, NOW() - INTERVAL 1 MINUTE);

-- 佇列 6 的指令 (搜救任務)
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at, executed_at, completed_at) VALUES
(1, 6, 'takeoff', '{"altitude": 120, "speed": 3.0}', 'completed', 1, NOW() - INTERVAL 30 MINUTE, NOW() - INTERVAL 29 MINUTE, NOW() - INTERVAL 28 MINUTE),
(1, 6, 'flyTo', '{"latitude": 25.050000, "longitude": 121.510000, "altitude": 120, "speed": 5.0}', 'completed', 1, NOW() - INTERVAL 28 MINUTE, NOW() - INTERVAL 27 MINUTE, NOW() - INTERVAL 25 MINUTE),
(1, 6, 'hover', '{"duration": 120}', 'completed', 1, NOW() - INTERVAL 25 MINUTE, NOW() - INTERVAL 25 MINUTE, NOW() - INTERVAL 23 MINUTE),
(1, 6, 'moveForward', '{"distance": 200, "speed": 4.0}', 'executing', 1, NOW() - INTERVAL 23 MINUTE, NOW() - INTERVAL 10 MINUTE, NULL),
(1, 6, 'rotateLeft', '{"angle": 45}', 'pending', 1, NOW() - INTERVAL 15 MINUTE, NULL, NULL);

-- 顯示插入的佇列統計
SELECT 
    status,
    COUNT(*) as queue_count,
    AVG(current_index) as avg_progress,
    SUM(CASE WHEN max_loops IS NOT NULL THEN 1 ELSE 0 END) as queues_with_loops
FROM drone_command_queues 
GROUP BY status 
ORDER BY status;

-- 顯示佇列與指令的關聯統計
SELECT 
    dcq.name as queue_name,
    dcq.status as queue_status,
    COUNT(dc.id) as command_count,
    SUM(CASE WHEN dc.status = 'completed' THEN 1 ELSE 0 END) as completed_commands,
    SUM(CASE WHEN dc.status = 'executing' THEN 1 ELSE 0 END) as executing_commands,
    SUM(CASE WHEN dc.status = 'pending' THEN 1 ELSE 0 END) as pending_commands
FROM drone_command_queues dcq
LEFT JOIN drone_commands dc ON dcq.id = dc.queue_id
GROUP BY dcq.id, dcq.name, dcq.status
ORDER BY dcq.id;