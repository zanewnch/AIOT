'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. 添加用戶偏好設定的業務邏輯約束
    await queryInterface.addConstraint('user_preferences', {
      fields: ['category'],
      type: 'check',
      where: {
        category: {
          [Sequelize.Op.and]: [
            { [Sequelize.Op.ne]: '' },
            Sequelize.literal("LENGTH(category) >= 2")
          ]
        }
      },
      name: 'user_preferences_category_length_check'
    });

    await queryInterface.addConstraint('user_preferences', {
      fields: ['key'],
      type: 'check',
      where: Sequelize.literal("key ~ '^[a-zA-Z][a-zA-Z0-9_.-]*[a-zA-Z0-9]$'"),
      name: 'user_preferences_key_format_check'
    });

    // 2. 添加數據類型驗證約束
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION validate_preference_value_type()
      RETURNS trigger AS $$
      BEGIN
          -- 根據 dataType 驗證 value 的格式
          CASE NEW."dataType"
              WHEN 'string' THEN
                  IF jsonb_typeof(NEW.value) != 'string' THEN
                      RAISE EXCEPTION 'Value must be a string for dataType string';
                  END IF;
              WHEN 'number' THEN
                  IF jsonb_typeof(NEW.value) NOT IN ('number') THEN
                      RAISE EXCEPTION 'Value must be a number for dataType number';
                  END IF;
              WHEN 'boolean' THEN
                  IF jsonb_typeof(NEW.value) != 'boolean' THEN
                      RAISE EXCEPTION 'Value must be a boolean for dataType boolean';
                  END IF;
              WHEN 'object' THEN
                  IF jsonb_typeof(NEW.value) != 'object' THEN
                      RAISE EXCEPTION 'Value must be an object for dataType object';
                  END IF;
              WHEN 'array' THEN
                  IF jsonb_typeof(NEW.value) != 'array' THEN
                      RAISE EXCEPTION 'Value must be an array for dataType array';
                  END IF;
          END CASE;
          
          -- 驗證 defaultValue 的類型（如果提供）
          IF NEW."defaultValue" IS NOT NULL THEN
              CASE NEW."dataType"
                  WHEN 'string' THEN
                      IF jsonb_typeof(NEW."defaultValue") != 'string' THEN
                          RAISE EXCEPTION 'Default value must be a string for dataType string';
                      END IF;
                  WHEN 'number' THEN
                      IF jsonb_typeof(NEW."defaultValue") NOT IN ('number') THEN
                          RAISE EXCEPTION 'Default value must be a number for dataType number';
                      END IF;
                  WHEN 'boolean' THEN
                      IF jsonb_typeof(NEW."defaultValue") != 'boolean' THEN
                          RAISE EXCEPTION 'Default value must be a boolean for dataType boolean';
                      END IF;
                  WHEN 'object' THEN
                      IF jsonb_typeof(NEW."defaultValue") != 'object' THEN
                          RAISE EXCEPTION 'Default value must be an object for dataType object';
                      END IF;
                  WHEN 'array' THEN
                      IF jsonb_typeof(NEW."defaultValue") != 'array' THEN
                          RAISE EXCEPTION 'Default value must be an array for dataType array';
                      END IF;
              END CASE;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. 創建數據類型驗證觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER user_preferences_value_type_validation
      BEFORE INSERT OR UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION validate_preference_value_type();
    `);

    // 4. 添加驗證規則處理函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION validate_preference_rules()
      RETURNS trigger AS $$
      DECLARE
          rule_key text;
          rule_value jsonb;
          actual_value jsonb;
      BEGIN
          -- 如果有驗證規則，進行驗證
          IF NEW."validationRules" IS NOT NULL THEN
              FOR rule_key, rule_value IN SELECT * FROM jsonb_each(NEW."validationRules") LOOP
                  actual_value := NEW.value;
                  
                  CASE rule_key
                      WHEN 'required' THEN
                          IF (rule_value)::boolean = true AND actual_value IS NULL THEN
                              RAISE EXCEPTION 'Value is required for preference %', NEW.key;
                          END IF;
                      
                      WHEN 'minLength' THEN
                          IF NEW."dataType" = 'string' AND 
                             jsonb_typeof(actual_value) = 'string' AND
                             length((actual_value #>> '{}')) < (rule_value)::int THEN
                              RAISE EXCEPTION 'Value length must be at least % characters', rule_value;
                          END IF;
                      
                      WHEN 'maxLength' THEN
                          IF NEW."dataType" = 'string' AND 
                             jsonb_typeof(actual_value) = 'string' AND
                             length((actual_value #>> '{}')) > (rule_value)::int THEN
                              RAISE EXCEPTION 'Value length must not exceed % characters', rule_value;
                          END IF;
                      
                      WHEN 'min' THEN
                          IF NEW."dataType" = 'number' AND 
                             jsonb_typeof(actual_value) = 'number' AND
                             (actual_value)::numeric < (rule_value)::numeric THEN
                              RAISE EXCEPTION 'Value must be at least %', rule_value;
                          END IF;
                      
                      WHEN 'max' THEN
                          IF NEW."dataType" = 'number' AND 
                             jsonb_typeof(actual_value) = 'number' AND
                             (actual_value)::numeric > (rule_value)::numeric THEN
                              RAISE EXCEPTION 'Value must not exceed %', rule_value;
                          END IF;
                      
                      WHEN 'pattern' THEN
                          IF NEW."dataType" = 'string' AND 
                             jsonb_typeof(actual_value) = 'string' AND
                             NOT ((actual_value #>> '{}') ~ (rule_value #>> '{}')) THEN
                              RAISE EXCEPTION 'Value does not match required pattern';
                          END IF;
                      
                      WHEN 'enum' THEN
                          IF NOT (actual_value <@ rule_value) THEN
                              RAISE EXCEPTION 'Value must be one of: %', rule_value;
                          END IF;
                  END CASE;
              END LOOP;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 5. 創建驗證規則觸發器
    await queryInterface.sequelize.query(`
      CREATE TRIGGER user_preferences_validation_rules_check
      BEFORE INSERT OR UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION validate_preference_rules();
    `);

    // 6. 添加只讀保護機制
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION protect_readonly_preferences()
      RETURNS trigger AS $$
      BEGIN
          IF OLD."isReadonly" = true AND NEW.value != OLD.value THEN
              RAISE EXCEPTION 'Cannot modify readonly preference: %', OLD.key;
          END IF;
          
          -- 防止將已有數據的偏好設定為只讀後再修改
          IF TG_OP = 'UPDATE' AND OLD."isReadonly" = false AND NEW."isReadonly" = true THEN
              RAISE NOTICE 'Preference % is now set to readonly', NEW.key;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER user_preferences_readonly_protection
      BEFORE UPDATE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION protect_readonly_preferences();
    `);

    // 7. 創建偏好設定歷史表
    await queryInterface.createTable('user_preferences_history', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      preferenceId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '偏好設定ID'
      },
      userId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: '用戶ID'
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
      oldValue: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '舊值'
      },
      newValue: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '新值'
      },
      changeType: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE'),
        allowNull: false,
        comment: '變更類型'
      },
      changedBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
        comment: '變更者ID'
      },
      changedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '變更時間'
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '變更原因'
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '版本號'
      }
    }, {
      indexes: [
        {
          name: 'idx_user_preferences_history_preference_id',
          fields: ['preferenceId']
        },
        {
          name: 'idx_user_preferences_history_user_id',
          fields: ['userId']
        },
        {
          name: 'idx_user_preferences_history_changed_at',
          fields: ['changedAt']
        },
        {
          name: 'idx_user_preferences_history_category_key',
          fields: ['category', 'key']
        }
      ]
    });

    // 8. 創建歷史記錄觸發器
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION log_preference_changes()
      RETURNS trigger AS $$
      BEGIN
          IF TG_OP = 'INSERT' THEN
              INSERT INTO user_preferences_history (
                  "preferenceId", "userId", category, key, "oldValue", "newValue",
                  "changeType", "changedBy", "changedAt", version
              ) VALUES (
                  NEW.id, NEW."userId", NEW.category, NEW.key, NULL, NEW.value,
                  'CREATE', NEW."lastModifiedBy", CURRENT_TIMESTAMP, NEW.version
              );
          ELSIF TG_OP = 'UPDATE' THEN
              INSERT INTO user_preferences_history (
                  "preferenceId", "userId", category, key, "oldValue", "newValue",
                  "changeType", "changedBy", "changedAt", version
              ) VALUES (
                  NEW.id, NEW."userId", NEW.category, NEW.key, OLD.value, NEW.value,
                  'UPDATE', NEW."lastModifiedBy", CURRENT_TIMESTAMP, NEW.version
              );
          ELSIF TG_OP = 'DELETE' THEN
              INSERT INTO user_preferences_history (
                  "preferenceId", "userId", category, key, "oldValue", "newValue",
                  "changeType", "changedBy", "changedAt", version
              ) VALUES (
                  OLD.id, OLD."userId", OLD.category, OLD.key, OLD.value, NULL,
                  'DELETE', OLD."lastModifiedBy", CURRENT_TIMESTAMP, OLD.version
              );
          END IF;
          
          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE TRIGGER user_preferences_history_log
      AFTER INSERT OR UPDATE OR DELETE ON user_preferences
      FOR EACH ROW EXECUTE FUNCTION log_preference_changes();
    `);

    // 9. 創建高級索引
    await queryInterface.sequelize.query(`
      -- 創建 GIN 索引用於 JSONB 查詢
      CREATE INDEX idx_user_preferences_value_gin 
      ON user_preferences USING gin (value);
      
      CREATE INDEX idx_user_preferences_default_value_gin 
      ON user_preferences USING gin ("defaultValue");
      
      CREATE INDEX idx_user_preferences_validation_rules_gin 
      ON user_preferences USING gin ("validationRules");
    `);

    await queryInterface.sequelize.query(`
      -- 創建部分索引
      CREATE INDEX idx_user_preferences_public 
      ON user_preferences ("category", "key") 
      WHERE "isPublic" = true;
      
      CREATE INDEX idx_user_preferences_readonly 
      ON user_preferences ("userId", "category") 
      WHERE "isReadonly" = true;
    `);

    // 10. 創建偏好設定工具函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION get_user_preference(
          p_user_id bigint,
          p_category varchar(50),
          p_key varchar(100),
          p_default_value jsonb DEFAULT NULL
      )
      RETURNS jsonb AS $$
      DECLARE
          preference_value jsonb;
      BEGIN
          SELECT value INTO preference_value
          FROM user_preferences
          WHERE "userId" = p_user_id
            AND category = p_category
            AND key = p_key;
          
          IF preference_value IS NULL THEN
              -- 嘗試獲取預設值
              SELECT "defaultValue" INTO preference_value
              FROM user_preferences
              WHERE "userId" = p_user_id
                AND category = p_category
                AND key = p_key;
                
              -- 如果還是沒有，使用傳入的預設值
              IF preference_value IS NULL THEN
                  preference_value := p_default_value;
              END IF;
          END IF;
          
          RETURN preference_value;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION set_user_preference(
          p_user_id bigint,
          p_category varchar(50),
          p_key varchar(100),
          p_value jsonb,
          p_data_type varchar(10) DEFAULT 'string',
          p_modified_by bigint DEFAULT NULL
      )
      RETURNS boolean AS $$
      BEGIN
          INSERT INTO user_preferences (
              "userId", category, key, value, "dataType", "lastModifiedBy"
          ) VALUES (
              p_user_id, p_category, p_key, p_value, p_data_type, p_modified_by
          )
          ON CONFLICT ("userId", category, key)
          DO UPDATE SET
              value = EXCLUDED.value,
              "lastModifiedBy" = EXCLUDED."lastModifiedBy",
              "updatedAt" = CURRENT_TIMESTAMP;
              
          RETURN true;
      EXCEPTION WHEN OTHERS THEN
          RETURN false;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Advanced user preferences constraints, validation, history tracking and utility functions created successfully');
  },

  async down(queryInterface, Sequelize) {
    // 移除函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS get_user_preference(bigint, varchar(50), varchar(100), jsonb);
      DROP FUNCTION IF EXISTS set_user_preference(bigint, varchar(50), varchar(100), jsonb, varchar(10), bigint);
    `);

    // 移除觸發器
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS user_preferences_value_type_validation ON user_preferences;
      DROP TRIGGER IF EXISTS user_preferences_validation_rules_check ON user_preferences;
      DROP TRIGGER IF EXISTS user_preferences_readonly_protection ON user_preferences;
      DROP TRIGGER IF EXISTS user_preferences_history_log ON user_preferences;
    `);

    // 移除函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS validate_preference_value_type();
      DROP FUNCTION IF EXISTS validate_preference_rules();
      DROP FUNCTION IF EXISTS protect_readonly_preferences();
      DROP FUNCTION IF EXISTS log_preference_changes();
    `);

    // 移除歷史表
    await queryInterface.dropTable('user_preferences_history');

    // 移除索引
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_user_preferences_value_gin;`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_user_preferences_default_value_gin;`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_user_preferences_validation_rules_gin;`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_user_preferences_public;`);
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS idx_user_preferences_readonly;`);

    // 移除約束
    await queryInterface.removeConstraint('user_preferences', 'user_preferences_category_length_check');
    await queryInterface.removeConstraint('user_preferences', 'user_preferences_key_format_check');

    // 移除 ENUM 類型
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_user_preferences_history_changeType";
    `);

    console.log('✅ Advanced user preferences constraints removed successfully');
  }
};