'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 創建 users 表
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '使用者唯一識別碼'
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '使用者名稱'
      },
      passwordHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '密碼雜湊值'
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: '電子郵件地址'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '帳號是否啟用'
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '最後登入時間'
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
      comment: 'RBAC 系統使用者資料表',
      indexes: [
        {
          name: 'idx_users_username',
          fields: ['username']
        },
        {
          name: 'idx_users_email',
          fields: ['email']
        },
        {
          name: 'idx_users_isActive',
          fields: ['isActive']
        },
        {
          name: 'idx_users_createdAt',
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

    // 為 users 表創建更新觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Users table created successfully with indexes and triggers');
  },

  async down(queryInterface, Sequelize) {
    // 移除觸發器
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    `);

    // 移除表
    await queryInterface.dropTable('users');

    console.log('✅ Users table dropped successfully');
  }
};