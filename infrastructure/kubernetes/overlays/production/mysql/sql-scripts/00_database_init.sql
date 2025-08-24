-- 數據庫初始化 SQL Script
-- 創建 AIOT 系統所需的數據庫

-- =====================================
-- 1. 創建主要數據庫 main_db（如果不存在）
-- =====================================
CREATE DATABASE IF NOT EXISTS `main_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci
COMMENT 'AIOT 主要數據庫';

-- =====================================
-- 2. 創建使用者偏好數據庫 user_preference_db（如果不存在）
-- =====================================
CREATE DATABASE IF NOT EXISTS `user_preference_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci
COMMENT 'AIOT 使用者偏好設定數據庫';

-- =====================================
-- 3. 切換到 main_db 作為預設數據庫
-- =====================================
USE `main_db`;

-- 顯示執行結果
SELECT 'Database initialization completed successfully' AS status;

-- 顯示所有數據庫
SHOW DATABASES LIKE '%aiot%' OR SHOW DATABASES LIKE '%main%' OR SHOW DATABASES LIKE '%preference%';