'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 創建 drone_commands 表
    await queryInterface.createTable('drone_commands', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '無人機指令唯一識別碼'
      },
      droneId: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '無人機識別碼'
      },
      commandType: {
        type: Sequelize.ENUM('takeoff', 'land', 'move', 'hover', 'return_home', 'emergency_stop', 'custom'),
        allowNull: false,
        comment: '指令類型'
      },
      parameters: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '指令參數（JSON格式）'
      },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'acknowledged', 'executing', 'completed', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '指令狀態'
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
          min: 1,
          max: 10
        },
        comment: '指令優先級（1-10，10為最高）'
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '指令發送時間'
      },
      acknowledgedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '指令確認時間'
      },
      executedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '指令執行時間'
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '指令完成時間'
      },
      failureReason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '失敗原因'
      },
      timeout: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 300,
        comment: '超時時間（秒）'
      },
      retryCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '重試次數'
      },
      maxRetries: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
        comment: '最大重試次數'
      },
      createdBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: '指令創建者ID'
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
      comment: '無人機指令資料表',
      indexes: [
        {
          name: 'idx_drone_commands_droneId',
          fields: ['droneId']
        },
        {
          name: 'idx_drone_commands_commandType',
          fields: ['commandType']
        },
        {
          name: 'idx_drone_commands_status',
          fields: ['status']
        },
        {
          name: 'idx_drone_commands_priority',
          fields: ['priority']
        },
        {
          name: 'idx_drone_commands_createdAt',
          fields: ['createdAt']
        },
        {
          name: 'idx_drone_commands_sentAt',
          fields: ['sentAt']
        },
        {
          name: 'idx_drone_commands_droneId_status',
          fields: ['droneId', 'status']
        },
        {
          name: 'idx_drone_commands_status_priority',
          fields: ['status', 'priority']
        }
      ]
    });

    // 為 drone_commands 表創建更新觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER update_drone_commands_updated_at 
      BEFORE UPDATE ON drone_commands
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `);

    // 創建指令超時檢查函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION check_command_timeout()
      RETURNS void AS $$
      BEGIN
          UPDATE drone_commands 
          SET status = 'failed',
              "failureReason" = 'Command timeout',
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE status IN ('sent', 'executing') 
            AND "sentAt" IS NOT NULL
            AND "sentAt" + INTERVAL '1 second' * timeout < CURRENT_TIMESTAMP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Drone commands table created successfully with indexes, triggers and timeout function');
  },

  async down(queryInterface, Sequelize) {
    // 移除觸發器
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS update_drone_commands_updated_at ON drone_commands;
    `);

    // 移除函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS check_command_timeout();
    `);

    // 移除表
    await queryInterface.dropTable('drone_commands');

    // 移除 ENUM 類型
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_drone_commands_commandType";
      DROP TYPE IF EXISTS "enum_drone_commands_status";
    `);

    console.log('✅ Drone commands table dropped successfully');
  }
};