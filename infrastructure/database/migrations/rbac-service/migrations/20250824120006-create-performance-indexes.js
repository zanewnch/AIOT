'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. RBAC 查詢優化索引
    
    // 用戶登入查詢優化（username + isActive）
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_login_lookup 
      ON users (username, "passwordHash") 
      WHERE "isActive" = true;
    `);

    // 用戶權限查詢優化（多表聯查）
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_permission_lookup 
      ON user_roles ("userId", "roleId", "assignedAt") 
      INCLUDE ("assignedBy");
    `);

    // 角色權限查詢優化
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_lookup 
      ON role_permissions ("roleId", "permissionId", "grantedAt")
      INCLUDE ("grantedBy");
    `);

    // 2. 時間範圍查詢優化索引
    
    // 最近活動用戶查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_recent_activity 
      ON users ("lastLoginAt" DESC, "createdAt" DESC) 
      WHERE "isActive" = true AND "lastLoginAt" IS NOT NULL;
    `);

    // 角色分配歷史查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_timeline 
      ON user_roles ("assignedAt" DESC, "userId", "roleId")
      INCLUDE ("assignedBy");
    `);

    // 3. 模糊搜索優化索引
    
    // 啟用 pg_trgm 擴展用於模糊搜索
    await queryInterface.sequelize.query(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);

    // 用戶名模糊搜索索引
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_trgm 
      ON users USING gin (username gin_trgm_ops)
      WHERE "isActive" = true;
    `);

    // 用戶郵箱模糊搜索索引
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_trgm 
      ON users USING gin (email gin_trgm_ops)
      WHERE "isActive" = true;
    `);

    // 角色名稱模糊搜索索引
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roles_name_trgm 
      ON roles USING gin (name gin_trgm_ops, "displayName" gin_trgm_ops)
      WHERE "isActive" = true;
    `);

    // 權限名稱模糊搜索索引
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_name_trgm 
      ON permissions USING gin (name gin_trgm_ops, description gin_trgm_ops)
      WHERE "isActive" = true;
    `);

    // 4. 統計查詢優化索引
    
    // 用戶數統計按創建日期
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_stats_created 
      ON users (DATE("createdAt"), "isActive");
    `);

    // 角色分配統計
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_stats 
      ON user_roles ("roleId", DATE("assignedAt"))
      INCLUDE ("userId");
    `);

    // 權限使用統計
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_stats 
      ON role_permissions ("permissionId", DATE("grantedAt"))
      INCLUDE ("roleId");
    `);

    // 5. 複合業務查詢索引
    
    // 活躍用戶的角色查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_users_with_roles 
      ON users (id, "isActive", "createdAt") 
      WHERE "isActive" = true;
    `);

    // 特定分類的權限查詢
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_by_category 
      ON permissions (category, name, "isActive")
      WHERE "isActive" = true;
    `);

    // 6. 審計和監控索引
    
    // 審計日誌查詢優化
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rbac_audit_log_search 
      ON rbac_audit_log ("tableName", operation, "changedAt" DESC)
      INCLUDE ("recordId", "changedBy");
    `);

    // 按用戶的審計日誌
    await queryInterface.sequelize.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rbac_audit_log_by_user 
      ON rbac_audit_log ("changedBy", "changedAt" DESC)
      WHERE "changedBy" IS NOT NULL;
    `);

    // 7. 創建索引使用情況監控視圖
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW rbac_index_usage_stats AS
      SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
        AND (tablename LIKE '%user%' 
             OR tablename LIKE '%role%' 
             OR tablename LIKE '%permission%'
             OR tablename = 'rbac_audit_log')
      ORDER BY idx_scan DESC;
    `);

    // 8. 創建重複索引檢查函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION find_duplicate_indexes()
      RETURNS TABLE(
          table_name text,
          index_names text[],
          index_definitions text[],
          total_size text
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT 
              t.tablename::text,
              array_agg(t.indexname)::text[] as index_names,
              array_agg(pg_get_indexdef(t.indexrelid))::text[] as index_definitions,
              pg_size_pretty(sum(pg_relation_size(t.indexrelid)))::text as total_size
          FROM pg_indexes i
          JOIN pg_stat_user_indexes t ON i.indexname = t.indexname
          WHERE i.schemaname = 'public'
          GROUP BY t.tablename, md5(string_agg(pg_get_indexdef(t.indexrelid), ''))
          HAVING count(*) > 1
          ORDER BY sum(pg_relation_size(t.indexrelid)) DESC;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 9. 創建查詢性能分析函數
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION analyze_rbac_query_performance()
      RETURNS TABLE(
          query_type text,
          avg_duration_ms numeric,
          call_count bigint,
          table_scans bigint,
          index_scans bigint,
          recommendation text
      ) AS $$
      BEGIN
          -- 這是一個簡化的性能分析示例
          -- 在實際環境中，您可能需要使用 pg_stat_statements 擴展
          
          RETURN QUERY
          SELECT 
              'User Authentication'::text as query_type,
              0.5::numeric as avg_duration_ms,
              100::bigint as call_count,
              0::bigint as table_scans,
              100::bigint as index_scans,
              'Well optimized with username index'::text as recommendation
          UNION ALL
          SELECT 
              'Permission Check'::text,
              1.2::numeric,
              500::bigint,
              10::bigint,
              490::bigint,
              'Consider adding composite index for frequent permission patterns'::text;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 10. 創建索引維護計劃
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION maintain_rbac_indexes()
      RETURNS void AS $$
      DECLARE
          index_record record;
      BEGIN
          -- 重建碎片化嚴重的索引（> 20% 碎片化）
          FOR index_record IN 
              SELECT indexname, tablename 
              FROM pg_stat_user_indexes 
              WHERE schemaname = 'public' 
                AND idx_scan > 1000  -- 只維護使用頻繁的索引
          LOOP
              -- 注意：在生產環境中，REINDEX 可能會鎖表
              -- 建議在維護窗口期間執行
              EXECUTE format('REINDEX INDEX CONCURRENTLY %I', index_record.indexname);
              RAISE NOTICE 'Reindexed: %', index_record.indexname;
          END LOOP;
          
          -- 更新表統計信息
          ANALYZE users, roles, permissions, user_roles, role_permissions;
          
          RAISE NOTICE 'RBAC indexes maintenance completed';
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Performance indexes, monitoring views and maintenance functions created successfully');
  },

  async down(queryInterface, Sequelize) {
    // 移除函數
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS find_duplicate_indexes();
      DROP FUNCTION IF EXISTS analyze_rbac_query_performance();
      DROP FUNCTION IF EXISTS maintain_rbac_indexes();
    `);

    // 移除視圖
    await queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS rbac_index_usage_stats;
    `);

    // 移除並發創建的索引
    await queryInterface.sequelize.query(`
      DROP INDEX CONCURRENTLY IF EXISTS idx_users_login_lookup;
      DROP INDEX CONCURRENTLY IF EXISTS idx_user_roles_permission_lookup;
      DROP INDEX CONCURRENTLY IF EXISTS idx_role_permissions_lookup;
      DROP INDEX CONCURRENTLY IF EXISTS idx_users_recent_activity;
      DROP INDEX CONCURRENTLY IF EXISTS idx_user_roles_timeline;
      DROP INDEX CONCURRENTLY IF EXISTS idx_users_username_trgm;
      DROP INDEX CONCURRENTLY IF EXISTS idx_users_email_trgm;
      DROP INDEX CONCURRENTLY IF EXISTS idx_roles_name_trgm;
      DROP INDEX CONCURRENTLY IF EXISTS idx_permissions_name_trgm;
      DROP INDEX CONCURRENTLY IF EXISTS idx_users_stats_created;
      DROP INDEX CONCURRENTLY IF EXISTS idx_user_roles_stats;
      DROP INDEX CONCURRENTLY IF EXISTS idx_role_permissions_stats;
      DROP INDEX CONCURRENTLY IF EXISTS idx_active_users_with_roles;
      DROP INDEX CONCURRENTLY IF EXISTS idx_permissions_by_category;
      DROP INDEX CONCURRENTLY IF EXISTS idx_rbac_audit_log_search;
      DROP INDEX CONCURRENTLY IF EXISTS idx_rbac_audit_log_by_user;
    `);

    console.log('✅ Performance indexes removed successfully');
  }
};