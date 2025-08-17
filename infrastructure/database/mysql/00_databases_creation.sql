-- =====================================================
-- 00_databases_creation.sql - 數據庫創建腳本
-- =====================================================
-- 功能描述：
-- 1. 創建 AIOT 微服務架構所需的所有數據庫
-- 2. 每個微服務擁有獨立的數據庫實例
-- 3. 設置數據庫字符集為 utf8mb4，排序規則為 utf8mb4_unicode_ci
-- 4. 為應用用戶 'admin' 授權所有數據庫的完整權限
-- 
-- 創建的數據庫：
-- - rbac_db: RBAC 權限管理微服務數據庫
-- - drone_db: Drone 無人機管理微服務數據庫  
-- - user_preference_db: General 微服務數據庫（用戶偏好設定）
-- - main_db: 共享數據庫（跨服務共享數據）
--
-- 注意：此腳本只創建數據庫結構，不包含表結構和數據
-- 表結構和數據由各自的完整初始化腳本負責
-- =====================================================

-- =====================================
-- 1. 創建 RBAC 微服務數據庫
-- =====================================
CREATE DATABASE IF NOT EXISTS `rbac_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- =====================================
-- 2. 創建 Drone 微服務數據庫
-- =====================================
CREATE DATABASE IF NOT EXISTS `drone_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- =====================================
-- 3. 創建 General 微服務數據庫（用戶偏好等）
-- =====================================
CREATE DATABASE IF NOT EXISTS `user_preference_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- =====================================
-- 4. 創建主要共享數據庫（如果需要跨服務共享數據）
-- =====================================
CREATE DATABASE IF NOT EXISTS `main_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- =====================================
-- 5. 為應用用戶授權所有數據庫的完整權限
-- =====================================
GRANT ALL PRIVILEGES ON rbac_db.* TO 'admin'@'%';
GRANT ALL PRIVILEGES ON drone_db.* TO 'admin'@'%';
GRANT ALL PRIVILEGES ON user_preference_db.* TO 'admin'@'%';
GRANT ALL PRIVILEGES ON main_db.* TO 'admin'@'%';

-- 刷新權限
FLUSH PRIVILEGES;

-- =====================================
-- 6. 顯示執行結果
-- =====================================
SELECT 'All microservice databases initialized successfully' AS status;

-- 顯示所有數據庫
SHOW DATABASES;