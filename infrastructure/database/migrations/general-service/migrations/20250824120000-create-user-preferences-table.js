'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 創建 user_preferences 表
    await queryInterface.createTable('user_preferences', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '用戶偏好設定唯一識別碼'
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '用戶ID（關聯到RBAC服務的用戶）'
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '偏好設定分類'
      },
      key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '偏好設定鍵值'
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '偏好設定值（JSON格式）'
      },
      dataType: {
        type: Sequelize.ENUM('string', 'number', 'boolean', 'object', 'array'),
        allowNull: false,
        defaultValue: 'string',
        comment: '數據類型'
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否為公開設定'
      },
      isReadonly: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: '是否為只讀設定'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '設定描述'
      },
      validationRules: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '驗證規則（JSON格式）'
      },
      defaultValue: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '預設值（JSON格式）'
      },
      lastModifiedBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: '最後修改者ID'
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: '版本號（用於樂觀鎖定）'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '建立時間'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '更新時間'
      }
    }, {
      comment: '用戶偏好設定資料表',
      indexes: [
        {
          name: 'idx_user_preferences_userId',
          fields: ['userId']
        },
        {
          name: 'idx_user_preferences_category',
          fields: ['category']
        },
        {
          name: 'idx_user_preferences_key',
          fields: ['key']
        },
        {
          name: 'idx_user_preferences_userId_category',
          fields: ['userId', 'category']
        },
        {
          name: 'idx_user_preferences_category_key',
          fields: ['category', 'key']
        },
        {
          name: 'idx_user_preferences_unique',
          unique: true,
          fields: ['userId', 'category', 'key']
        },
        {
          name: 'idx_user_preferences_isPublic',
          fields: ['isPublic']
        },
        {
          name: 'idx_user_preferences_createdAt',
          fields: ['createdAt']
        }
      ]
    });

    // 創建更新時間觸發器函數（如果不存在）
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW."updatedAt" = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 為 user_preferences 表創建更新觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_user_preferences_updated_at 
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // 創建版本號自動更新觸發器
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION update_version_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.version = OLD.version + 1;
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER update_user_preferences_version 
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW 
      EXECUTE FUNCTION update_version_column();
    `);

    console.log('✅ User preferences table created successfully with indexes, triggers and version control');
  },

  async down(queryInterface, Sequelize) {
    // 移除觸發器
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
      DROP TRIGGER IF EXISTS update_user_preferences_version ON user_preferences;
    `);

    // 移除函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS update_version_column();
    `);

    // 移除表
    await queryInterface.dropTable('user_preferences');

    // 移除 ENUM 類型
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_user_preferences_dataType";
    `);

    console.log('✅ User preferences table dropped successfully');
  }
};