-- =====================================================
-- 03_user_preferences_init.sql - 用戶偏好設定系統初始化腳本
-- =====================================================
-- 功能描述：
-- 1. 創建 General 微服務的用戶偏好設定表結構
-- 2. 創建系統設定表結構
-- 3. 插入預設的用戶偏好設定和系統設定數據
-- 
-- 創建的表結構（2個表）：
-- - user_preferences: 用戶偏好設定表（主題、語言、時區、通知等）
-- - system_settings: 系統設定表（全局設定、應用配置等）
--
-- 插入的測試數據：
-- - admin 用戶偏好設定（dark主題、繁體中文、台北時區）
-- - 一般用戶偏好設定（light主題、英文、UTC時區）
-- - 8個系統設定項目（應用名稱、版本、維護模式、預設設定等）
--
-- 用於 general-service 微服務，管理用戶界面偏好和系統配置
-- =====================================================

-- 切換到 user_preference_db 數據庫
USE `user_preference_db`;

-- 開始交易
START TRANSACTION;

-- =====================================
-- 1. 創建 user_preferences 資料表
-- =====================================

CREATE TABLE IF NOT EXISTS user_preferences (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    `userId` BIGINT NOT NULL COMMENT '使用者識別碼（外鍵）',
    `theme` ENUM('light', 'dark', 'auto') NOT NULL DEFAULT 'light' COMMENT '主題設定',
    `language` VARCHAR(10) NOT NULL DEFAULT 'en' COMMENT '語言設定',
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC' COMMENT '時區設定',
    `autoSave` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '自動儲存設定',
    `notifications` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '通知設定',
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    
    PRIMARY KEY (`id`),
    INDEX `idx_userId` (`userId`),
    
    -- 暫時註釋外鍵約束，等 RBAC 系統實現後再啟用
    -- FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- 確保每個使用者只有一筆偏好設定記錄
    UNIQUE KEY `uk_user_preferences_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='使用者偏好設定資料表';

-- =====================================
-- 2. 插入預設的使用者偏好設定
-- =====================================

-- 為 admin 使用者（假設 userId = 1）創建預設偏好設定
INSERT IGNORE INTO user_preferences (userId, theme, language, timezone, autoSave, notifications, createdAt, updatedAt)
VALUES (1, 'dark', 'zh-TW', 'Asia/Taipei', TRUE, TRUE, NOW(), NOW());

-- 為 user 使用者（假設 userId = 2）創建預設偏好設定
INSERT IGNORE INTO user_preferences (userId, theme, language, timezone, autoSave, notifications, createdAt, updatedAt)
VALUES (2, 'light', 'en', 'UTC', TRUE, TRUE, NOW(), NOW());

-- =====================================
-- 3. 創建其他 general-service 可能需要的資料表
-- =====================================

-- 系統設定資料表（用於存放全局設定）
CREATE TABLE IF NOT EXISTS system_settings (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主鍵識別碼',
    `settingKey` VARCHAR(100) NOT NULL COMMENT '設定鍵名',
    `settingValue` TEXT COMMENT '設定值',
    `description` VARCHAR(255) COMMENT '設定描述',
    `category` VARCHAR(50) DEFAULT 'general' COMMENT '設定分類',
    `isActive` BOOLEAN NOT NULL DEFAULT TRUE COMMENT '是否啟用',
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '建立時間',
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新時間',
    
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_system_settings_key` (`settingKey`),
    INDEX `idx_category` (`category`),
    INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系統設定資料表';

-- 插入一些預設系統設定
INSERT IGNORE INTO system_settings (settingKey, settingValue, description, category, isActive, createdAt, updatedAt)
VALUES 
    ('app.name', 'AIOT Management System', '應用程式名稱', 'general', TRUE, NOW(), NOW()),
    ('app.version', '1.0.0', '應用程式版本', 'general', TRUE, NOW(), NOW()),
    ('maintenance.enabled', 'false', '維護模式開關', 'system', TRUE, NOW(), NOW()),
    ('default.theme', 'light', '預設主題', 'ui', TRUE, NOW(), NOW()),
    ('default.language', 'en', '預設語言', 'ui', TRUE, NOW(), NOW()),
    ('session.timeout', '3600', '會話逾時時間（秒）', 'security', TRUE, NOW(), NOW()),
    ('notification.email.enabled', 'true', '電子郵件通知開關', 'notification', TRUE, NOW(), NOW()),
    ('notification.sms.enabled', 'false', '簡訊通知開關', 'notification', TRUE, NOW(), NOW());

-- 提交交易
COMMIT;

-- 顯示執行結果
SELECT 'User Preferences and General Service tables initialization completed successfully' AS status;

-- 驗證結果：顯示創建的資料表
SHOW TABLES LIKE '%preference%';
SHOW TABLES LIKE '%setting%';

-- 驗證結果：顯示預設的使用者偏好設定
SELECT 
    id,
    userId,
    theme,
    language,
    timezone,
    autoSave,
    notifications,
    createdAt,
    updatedAt
FROM user_preferences
ORDER BY userId;

-- 驗證結果：顯示系統設定
SELECT 
    id,
    settingKey,
    settingValue,
    description,
    category,
    isActive
FROM system_settings
WHERE isActive = TRUE
ORDER BY category, settingKey;