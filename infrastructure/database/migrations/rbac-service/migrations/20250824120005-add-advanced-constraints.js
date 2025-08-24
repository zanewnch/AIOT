'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. 添加用戶表的複合約束
    await queryInterface.addConstraint('users', {
      fields: ['username', 'email'],
      type: 'unique',
      name: 'users_username_email_unique'
    });

    // 2. 添加檢查約束
    await queryInterface.addConstraint('users', {
      fields: ['username'],
      type: 'check',
      where: {
        username: {
          [Sequelize.Op.and]: [
            { [Sequelize.Op.ne]: '' },
            Sequelize.literal("LENGTH(username) >= 3")
          ]
        }
      },
      name: 'users_username_length_check'
    });

    await queryInterface.addConstraint('users', {
      fields: ['email'],
      type: 'check',
      where: Sequelize.literal("email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'"),
      name: 'users_email_format_check'
    });

    // 3. 添加角色表的檢查約束
    await queryInterface.addConstraint('roles', {
      fields: ['name'],
      type: 'check',
      where: {
        name: {
          [Sequelize.Op.and]: [
            { [Sequelize.Op.ne]: '' },
            Sequelize.literal("LENGTH(name) >= 2")
          ]
        }
      },
      name: 'roles_name_length_check'
    });

    // 4. 添加權限表的檢查約束
    await queryInterface.addConstraint('permissions', {
      fields: ['name'],
      type: 'check',
      where: Sequelize.literal("name ~ '^[a-z]+\\.[a-z_]+$'"),
      name: 'permissions_name_format_check'
    });

    await queryInterface.addConstraint('permissions', {
      fields: ['category'],
      type: 'check',
      where: {
        category: {
          [Sequelize.Op.in]: [
            'user_management',
            'role_management', 
            'permission_management',
            'drone_management',
            'system_management',
            'general'
          ]
        }
      },
      name: 'permissions_category_enum_check'
    });

    // 5. 增強用戶角色關聯表約束
    await queryInterface.addConstraint('user_roles', {
      fields: ['assignedAt'],
      type: 'check',
      where: Sequelize.literal('"assignedAt" <= CURRENT_TIMESTAMP'),
      name: 'user_roles_assigned_at_check'
    });

    // 6. 增強角色權限關聯表約束
    await queryInterface.addConstraint('role_permissions', {
      fields: ['grantedAt'],
      type: 'check',
      where: Sequelize.literal('"grantedAt" <= CURRENT_TIMESTAMP'),
      name: 'role_permissions_granted_at_check'
    });

    // 7. 創建部分唯一索引（僅活躍用戶）
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX users_username_active_unique 
      ON users (username) 
      WHERE "isActive" = true;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX users_email_active_unique 
      ON users (email) 
      WHERE "isActive" = true;
    `);

    // 8. 創建複合函數索引
    await queryInterface.sequelize.query(`
      CREATE INDEX users_username_email_active_idx 
      ON users (LOWER(username), LOWER(email)) 
      WHERE "isActive" = true;
    `);

    // 9. 添加級聯更新外鍵約束
    await queryInterface.sequelize.query(`
      ALTER TABLE user_roles 
      ADD CONSTRAINT user_roles_userId_fkey_cascade 
      FOREIGN KEY ("userId") REFERENCES users(id) 
      ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE user_roles 
      ADD CONSTRAINT user_roles_roleId_fkey_cascade 
      FOREIGN KEY ("roleId") REFERENCES roles(id) 
      ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE role_permissions 
      ADD CONSTRAINT role_permissions_roleId_fkey_cascade 
      FOREIGN KEY ("roleId") REFERENCES roles(id) 
      ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE role_permissions 
      ADD CONSTRAINT role_permissions_permissionId_fkey_cascade 
      FOREIGN KEY ("permissionId") REFERENCES permissions(id) 
      ON UPDATE CASCADE ON DELETE CASCADE;
    `);

    // 10. 創建數據完整性檢查函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION validate_rbac_integrity()
      RETURNS trigger AS $$
      BEGIN
          -- 檢查用戶是否為自己分配角色
          IF TG_TABLE_NAME = 'user_roles' AND NEW."assignedBy" = NEW."userId" THEN
              RAISE EXCEPTION 'User cannot assign roles to themselves';
          END IF;
          
          -- 檢查角色分配時間不能早於用戶創建時間
          IF TG_TABLE_NAME = 'user_roles' THEN
              IF EXISTS (
                  SELECT 1 FROM users 
                  WHERE id = NEW."userId" 
                  AND "createdAt" > NEW."assignedAt"
              ) THEN
                  RAISE EXCEPTION 'Role assignment date cannot be earlier than user creation date';
              END IF;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 11. 創建觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER rbac_integrity_check_user_roles
      BEFORE INSERT OR UPDATE ON user_roles
      FOR EACH ROW EXECUTE FUNCTION validate_rbac_integrity();
    `);

    // 12. 創建審計日誌表
    await queryInterface.createTable('rbac_audit_log', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tableName: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      operation: {
        type: Sequelize.ENUM('INSERT', 'UPDATE', 'DELETE'),
        allowNull: false
      },
      recordId: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      oldValues: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      newValues: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      changedBy: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      changedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      ipAddress: {
        type: Sequelize.INET,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    }, {
      indexes: [
        {
          name: 'idx_rbac_audit_log_table_operation',
          fields: ['tableName', 'operation']
        },
        {
          name: 'idx_rbac_audit_log_record_id',
          fields: ['recordId']
        },
        {
          name: 'idx_rbac_audit_log_changed_at',
          fields: ['changedAt']
        },
        {
          name: 'idx_rbac_audit_log_changed_by',
          fields: ['changedBy']
        }
      ]
    });

    console.log('✅ Advanced RBAC constraints, indexes and audit system created successfully');
  },

  async down(queryInterface, Sequelize) {
    // 移除觸發器
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS rbac_integrity_check_user_roles ON user_roles;
    `);

    // 移除函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS validate_rbac_integrity();
    `);

    // 移除審計表
    await queryInterface.dropTable('rbac_audit_log');

    // 移除外鍵約束
    await queryInterface.removeConstraint('user_roles', 'user_roles_userId_fkey_cascade');
    await queryInterface.removeConstraint('user_roles', 'user_roles_roleId_fkey_cascade');
    await queryInterface.removeConstraint('role_permissions', 'role_permissions_roleId_fkey_cascade');
    await queryInterface.removeConstraint('role_permissions', 'role_permissions_permissionId_fkey_cascade');

    // 移除索引
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS users_username_active_unique;`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS users_email_active_unique;`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS users_username_email_active_idx;`);

    // 移除約束
    await queryInterface.removeConstraint('users', 'users_username_email_unique');
    await queryInterface.removeConstraint('users', 'users_username_length_check');
    await queryInterface.removeConstraint('users', 'users_email_format_check');
    await queryInterface.removeConstraint('roles', 'roles_name_length_check');
    await queryInterface.removeConstraint('permissions', 'permissions_name_format_check');
    await queryInterface.removeConstraint('permissions', 'permissions_category_enum_check');
    await queryInterface.removeConstraint('user_roles', 'user_roles_assigned_at_check');
    await queryInterface.removeConstraint('role_permissions', 'role_permissions_granted_at_check');

    // 移除 ENUM 類型
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_rbac_audit_log_operation";
    `);

    console.log('✅ Advanced RBAC constraints removed successfully');
  }
};