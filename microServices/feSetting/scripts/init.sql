-- feSetting 服務初始化 SQL 腳本
-- 創建用戶偏好設定表和測試資料

USE fesetting_db;

-- 創建用戶偏好設定表
CREATE TABLE IF NOT EXISTS user_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    userId BIGINT NOT NULL,
    theme ENUM('light', 'dark', 'auto') NOT NULL DEFAULT 'auto',
    language VARCHAR(10) NOT NULL DEFAULT 'zh-TW',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Taipei',
    autoSave BOOLEAN NOT NULL DEFAULT TRUE,
    notifications BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_preference (userId),
    INDEX idx_userId (userId),
    INDEX idx_theme (theme),
    INDEX idx_language (language)
);

-- 插入測試資料
INSERT INTO user_preferences (userId, theme, language, timezone, autoSave, notifications) 
VALUES 
    (1, 'dark', 'zh-TW', 'Asia/Taipei', TRUE, TRUE),
    (2, 'light', 'en-US', 'America/New_York', FALSE, TRUE),
    (3, 'auto', 'zh-TW', 'Asia/Tokyo', TRUE, FALSE),
    (4, 'dark', 'zh-CN', 'Asia/Shanghai', TRUE, TRUE),
    (5, 'light', 'en-US', 'Europe/London', FALSE, FALSE)
ON DUPLICATE KEY UPDATE
    theme = VALUES(theme),
    language = VALUES(language),
    timezone = VALUES(timezone),
    autoSave = VALUES(autoSave),
    notifications = VALUES(notifications),
    updatedAt = CURRENT_TIMESTAMP;

-- 創建資料庫索引以優化查詢性能
CREATE INDEX IF NOT EXISTS idx_user_preferences_created_at ON user_preferences(createdAt);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON user_preferences(updatedAt);

-- 顯示表結構
DESCRIBE user_preferences;