'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 創建 drone_status 表
    await queryInterface.createTable('drone_status', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '無人機狀態唯一識別碼'
      },
      droneId: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '無人機識別碼'
      },
      status: {
        type: Sequelize.ENUM('idle', 'flying', 'charging', 'maintenance', 'offline'),
        allowNull: false,
        defaultValue: 'idle',
        comment: '無人機狀態'
      },
      batteryLevel: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 100,
        validate: {
          min: 0,
          max: 100
        },
        comment: '電池電量（百分比）'
      },
      lastHeartbeat: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '最後心跳時間'
      },
      firmware: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '韌體版本'
      },
      model: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '無人機型號'
      },
      serialNumber: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        comment: '序列號'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否啟用'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '額外元數據（JSON格式）'
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
      comment: '無人機基本狀態資料表',
      indexes: [
        {
          name: 'idx_drone_status_droneId',
          fields: ['droneId']
        },
        {
          name: 'idx_drone_status_status',
          fields: ['status']
        },
        {
          name: 'idx_drone_status_batteryLevel',
          fields: ['batteryLevel']
        },
        {
          name: 'idx_drone_status_lastHeartbeat',
          fields: ['lastHeartbeat']
        },
        {
          name: 'idx_drone_status_serialNumber',
          unique: true,
          fields: ['serialNumber']
        },
        {
          name: 'idx_drone_status_isActive',
          fields: ['isActive']
        },
        {
          name: 'idx_drone_status_createdAt',
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

    // 為 drone_status 表創建更新觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_drone_status_updated_at 
      BEFORE UPDATE ON drone_status
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Drone status table created successfully with indexes and triggers');
  },

  async down(queryInterface, Sequelize) {
    // 移除觸發器
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_drone_status_updated_at ON drone_status;
    `);

    // 移除表
    await queryInterface.dropTable('drone_status');

    // 移除 ENUM 類型
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_drone_status_status";
    `);

    console.log('✅ Drone status table dropped successfully');
  }
};