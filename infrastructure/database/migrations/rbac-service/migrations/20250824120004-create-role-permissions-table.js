'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_permissions', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '角色權限關聯唯一識別碼'
      },
      roleId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '角色ID',
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permissionId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '權限ID',
        references: {
          model: 'permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      grantedBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: '授權者ID',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL'
      },
      grantedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '授權時間'
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
      comment: 'RBAC 系統角色權限關聯表',
      indexes: [
        {
          name: 'idx_role_permissions_roleId',
          fields: ['roleId']
        },
        {
          name: 'idx_role_permissions_permissionId',
          fields: ['permissionId']
        },
        {
          name: 'idx_role_permissions_grantedBy',
          fields: ['grantedBy']
        },
        {
          name: 'idx_role_permissions_grantedAt',
          fields: ['grantedAt']
        },
        {
          name: 'idx_role_permissions_unique',
          unique: true,
          fields: ['roleId', 'permissionId']
        }
      ]
    });

    // 為 role_permissions 表創建更新觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_role_permissions_updated_at 
      BEFORE UPDATE ON role_permissions
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Role permissions table created successfully with foreign keys, indexes and triggers');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_role_permissions_updated_at ON role_permissions;
    `);

    await queryInterface.dropTable('role_permissions');

    console.log('✅ Role permissions table dropped successfully');
  }
};