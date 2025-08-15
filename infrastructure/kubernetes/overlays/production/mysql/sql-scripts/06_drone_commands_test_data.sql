-- 清空 drone commands 表的測試數據
DELETE FROM drone_commands;

-- 重置自增 ID
ALTER TABLE drone_commands AUTO_INCREMENT = 1;

-- 插入各種類型的無人機指令測試數據
-- 假設我們有 drone_id = 1 的測試無人機，發送者 issued_by = 1

-- 1. 起飛指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'takeoff', '{"altitude": 50, "speed": 2.5}', 'completed', 1, NOW() - INTERVAL 10 MINUTE),
(1, NULL, 'takeoff', '{"altitude": 30, "speed": 3.0}', 'completed', 1, NOW() - INTERVAL 9 MINUTE);

-- 2. 降落指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'land', '{"speed": 2.0}', 'completed', 1, NOW() - INTERVAL 8 MINUTE),
(1, NULL, 'land', '{}', 'completed', 1, NOW() - INTERVAL 7 MINUTE);

-- 3. 懸停指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'hover', '{"duration": 30}', 'completed', 1, NOW() - INTERVAL 6 MINUTE),
(1, NULL, 'hover', '{"duration": 60}', 'failed', 1, NOW() - INTERVAL 5 MINUTE);

-- 4. 飛行到指定位置指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'flyTo', '{"latitude": 25.033964, "longitude": 121.564468, "altitude": 100, "speed": 5.0}', 'completed', 1, NOW() - INTERVAL 4 MINUTE),
(1, NULL, 'flyTo', '{"latitude": 25.047924, "longitude": 121.517081, "altitude": 80, "speed": 4.0}', 'executing', 1, NOW() - INTERVAL 3 MINUTE);

-- 5. 前進指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'moveForward', '{"distance": 100, "speed": 3.0}', 'completed', 1, NOW() - INTERVAL 2 MINUTE),
(1, NULL, 'moveForward', '{"distance": 50, "speed": 2.5}', 'pending', 1, NOW() - INTERVAL 1 MINUTE);

-- 6. 後退指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'moveBackward', '{"distance": 80, "speed": 2.0}', 'completed', 1, NOW() - INTERVAL 30 SECOND),
(1, NULL, 'moveBackward', '{"distance": 60, "speed": 3.0}', 'failed', 1, NOW() - INTERVAL 25 SECOND);

-- 7. 左移指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'moveLeft', '{"distance": 70, "speed": 2.5}', 'completed', 1, NOW() - INTERVAL 20 SECOND),
(1, NULL, 'moveLeft', '{"distance": 40, "speed": 2.0}', 'executing', 1, NOW() - INTERVAL 15 SECOND);

-- 8. 右移指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'moveRight', '{"distance": 90, "speed": 3.5}', 'completed', 1, NOW() - INTERVAL 10 SECOND),
(1, NULL, 'moveRight', '{"distance": 45, "speed": 2.8}', 'pending', 1, NOW() - INTERVAL 5 SECOND);

-- 9. 左轉指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'rotateLeft', '{"angle": 90}', 'completed', 1, NOW() - INTERVAL 3 SECOND),
(1, NULL, 'rotateLeft', '{"angle": 45}', 'executing', 1, NOW() - INTERVAL 2 SECOND);

-- 10. 右轉指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'rotateRight', '{"angle": 135}', 'completed', 1, NOW() - INTERVAL 1 SECOND),
(1, NULL, 'rotateRight', '{"angle": 60}', 'pending', 1, NOW());

-- 11. 返航指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'return', '{"speed": 4.0}', 'completed', 1, NOW() + INTERVAL 1 SECOND),
(1, NULL, 'return', '{}', 'failed', 1, NOW() + INTERVAL 2 SECOND);

-- 12. 緊急指令
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(1, NULL, 'emergency', '{"action": "land"}', 'completed', 1, NOW() + INTERVAL 3 SECOND),
(1, NULL, 'emergency', '{"action": "stop"}', 'executing', 1, NOW() + INTERVAL 4 SECOND);

-- 如果有第二台無人機 (drone_id = 2)，也可以添加一些測試數據
INSERT INTO drone_commands (drone_id, queue_id, command_type, command_data, status, issued_by, issued_at) VALUES
(2, NULL, 'takeoff', '{"altitude": 40, "speed": 2.0}', 'completed', 1, NOW() - INTERVAL 5 MINUTE),
(2, NULL, 'flyTo', '{"latitude": 25.040000, "longitude": 121.520000, "altitude": 60, "speed": 3.5}', 'executing', 1, NOW() - INTERVAL 2 MINUTE),
(2, NULL, 'hover', '{"duration": 45}', 'pending', 1, NOW());

-- 顯示插入的數據統計
SELECT 
    command_type,
    status,
    COUNT(*) as count
FROM drone_commands 
GROUP BY command_type, status 
ORDER BY command_type, status;