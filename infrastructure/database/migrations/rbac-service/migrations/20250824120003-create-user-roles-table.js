'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '用戶角色關聯唯一識別碼'
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '用戶ID',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      assignedBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: '指派者ID',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'SET NULL',
        onDelete: 'SET NULL'
      },
      assignedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '指派時間'
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
      comment: 'RBAC 系統用戶角色關聯表',
      indexes: [
        {
          name: 'idx_user_roles_userId',
          fields: ['userId']
        },
        {
          name: 'idx_user_roles_roleId',
          fields: ['roleId']
        },
        {
          name: 'idx_user_roles_assignedBy',
          fields: ['assignedBy']
        },
        {
          name: 'idx_user_roles_assignedAt',
          fields: ['assignedAt']
        },
        {
          name: 'idx_user_roles_unique',
          unique: true,
          fields: ['userId', 'roleId']
        }
      ]
    });

    // 為 user_roles 表創建更新觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_user_roles_updated_at 
      BEFORE UPDATE ON user_roles
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ User roles table created successfully with foreign keys, indexes and triggers');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
    `);

    await queryInterface.dropTable('user_roles');

    console.log('✅ User roles table dropped successfully');
  }
};