'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '角色唯一識別碼'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '角色名稱'
      },
      displayName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '角色顯示名稱'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '角色描述'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '角色是否啟用'
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
      comment: 'RBAC 系統角色資料表',
      indexes: [
        {
          name: 'idx_roles_name',
          fields: ['name']
        },
        {
          name: 'idx_roles_isActive',
          fields: ['isActive']
        },
        {
          name: 'idx_roles_createdAt',
          fields: ['createdAt']
        }
      ]
    });

    // 為 roles 表創建更新觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_roles_updated_at 
      BEFORE UPDATE ON roles
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Roles table created successfully with indexes and triggers');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
    `);

    await queryInterface.dropTable('roles');

    console.log('✅ Roles table dropped successfully');
  }
};