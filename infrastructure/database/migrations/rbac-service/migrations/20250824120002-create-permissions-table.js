'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '權限唯一識別碼'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '權限名稱'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '權限描述'
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'general',
        comment: '權限分類'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '權限是否啟用'
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
      comment: 'RBAC 系統權限資料表',
      indexes: [
        {
          name: 'idx_permissions_name',
          fields: ['name']
        },
        {
          name: 'idx_permissions_category',
          fields: ['category']
        },
        {
          name: 'idx_permissions_isActive',
          fields: ['isActive']
        },
        {
          name: 'idx_permissions_createdAt',
          fields: ['createdAt']
        }
      ]
    });

    // 為 permissions 表創建更新觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_permissions_updated_at 
      BEFORE UPDATE ON permissions
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Permissions table created successfully with indexes and triggers');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
    `);

    await queryInterface.dropTable('permissions');

    console.log('✅ Permissions table dropped successfully');
  }
};