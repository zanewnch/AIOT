/**
 * @fileoverview AIOT Database Query Optimization Patterns
 * 提供優化的查詢模式，避免 N+1 問題並提升性能
 */

'use strict';

/**
 * RBAC Service 優化查詢模式
 */
export class RBACQueryOptimizations {
  /**
   * 獲取用戶及其角色和權限（避免 N+1 查詢）
   */
  static async getUserWithRolesAndPermissions(sequelize, userId) {
    const query = `
      WITH user_roles AS (
        SELECT DISTINCT 
          u.id as user_id,
          u.username,
          u.email,
          u."isActive",
          r.id as role_id,
          r.name as role_name,
          r."displayName" as role_display_name
        FROM users u
        JOIN user_roles ur ON u.id = ur."userId"
        JOIN roles r ON ur."roleId" = r.id
        WHERE u.id = :userId AND u."isActive" = true AND r."isActive" = true
      ),
      role_permissions AS (
        SELECT DISTINCT
          ur.role_id,
          p.id as permission_id,
          p.name as permission_name,
          p.category as permission_category
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp."roleId"
        JOIN permissions p ON rp."permissionId" = p.id
        WHERE p."isActive" = true
      )
      SELECT 
        ur.user_id,
        ur.username,
        ur.email,
        ur."isActive",
        json_agg(DISTINCT jsonb_build_object(
          'id', ur.role_id,
          'name', ur.role_name,
          'displayName', ur.role_display_name,
          'permissions', rp.permissions
        )) as roles
      FROM user_roles ur
      LEFT JOIN (
        SELECT 
          role_id,
          json_agg(jsonb_build_object(
            'id', permission_id,
            'name', permission_name,
            'category', permission_category
          )) as permissions
        FROM role_permissions
        GROUP BY role_id
      ) rp ON ur.role_id = rp.role_id
      GROUP BY ur.user_id, ur.username, ur.email, ur."isActive";
    `;

    return await sequelize.query(query, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });
  }

  /**
   * 批量檢查用戶權限
   */
  static async checkUserPermissions(sequelize, userId, permissions) {
    const query = `
      SELECT DISTINCT p.name
      FROM users u
      JOIN user_roles ur ON u.id = ur."userId"
      JOIN role_permissions rp ON ur."roleId" = rp."roleId"
      JOIN permissions p ON rp."permissionId" = p.id
      WHERE u.id = :userId
        AND u."isActive" = true
        AND p.name = ANY(:permissions)
        AND p."isActive" = true;
    `;

    const results = await sequelize.query(query, {
      replacements: { userId, permissions },
      type: sequelize.QueryTypes.SELECT
    });

    return permissions.map(permission => ({
      permission,
      granted: results.some(r => r.name === permission)
    }));
  }

  /**
   * 獲取角色統計（優化聚合查詢）
   */
  static async getRoleStatistics(sequelize) {
    const query = `
      SELECT 
        r.id,
        r.name,
        r."displayName",
        COUNT(DISTINCT ur."userId") as user_count,
        COUNT(DISTINCT rp."permissionId") as permission_count,
        json_agg(DISTINCT p.category) FILTER (WHERE p.category IS NOT NULL) as permission_categories
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur."roleId"
      LEFT JOIN role_permissions rp ON r.id = rp."roleId"
      LEFT JOIN permissions p ON rp."permissionId" = p.id AND p."isActive" = true
      WHERE r."isActive" = true
      GROUP BY r.id, r.name, r."displayName"
      ORDER BY user_count DESC;
    `;

    return await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });
  }
}

/**
 * Drone Service 優化查詢模式
 */
export class DroneQueryOptimizations {
  /**
   * 獲取無人機當前狀態和最新位置（避免多次查詢）
   */
  static async getDroneStatusWithLatestPosition(sequelize, droneId) {
    const query = `
      SELECT 
        ds.*,
        lp.latitude,
        lp.longitude,
        lp.altitude,
        lp.heading,
        lp.speed,
        lp."recordedAt" as last_position_time,
        lp."gpsStatus",
        lp.accuracy
      FROM drone_status ds
      LEFT JOIN LATERAL (
        SELECT latitude, longitude, altitude, heading, speed, "recordedAt", "gpsStatus", accuracy
        FROM drone_positions dp
        WHERE dp."droneId" = ds."droneId"
        ORDER BY dp."recordedAt" DESC
        LIMIT 1
      ) lp ON true
      WHERE ds."droneId" = :droneId AND ds."isActive" = true;
    `;

    return await sequelize.query(query, {
      replacements: { droneId },
      type: sequelize.QueryTypes.SELECT
    });
  }

  /**
   * 批量獲取多個無人機的最新狀態
   */
  static async getBatchDroneStatuses(sequelize, droneIds) {
    const query = `
      WITH latest_positions AS (
        SELECT DISTINCT ON ("droneId")
          "droneId",
          latitude,
          longitude,
          altitude,
          speed,
          "recordedAt",
          "gpsStatus"
        FROM drone_positions
        WHERE "droneId" = ANY(:droneIds)
        ORDER BY "droneId", "recordedAt" DESC
      ),
      active_commands AS (
        SELECT 
          "droneId",
          COUNT(*) as pending_commands,
          MAX(priority) as highest_priority
        FROM drone_commands
        WHERE "droneId" = ANY(:droneIds)
          AND status IN ('pending', 'sent', 'acknowledged')
        GROUP BY "droneId"
      )
      SELECT 
        ds.*,
        COALESCE(lp.latitude, 0) as latitude,
        COALESCE(lp.longitude, 0) as longitude,
        COALESCE(lp.altitude, 0) as altitude,
        COALESCE(lp.speed, 0) as speed,
        lp."recordedAt" as last_position_time,
        lp."gpsStatus",
        COALESCE(ac.pending_commands, 0) as pending_commands,
        COALESCE(ac.highest_priority, 0) as highest_priority
      FROM drone_status ds
      LEFT JOIN latest_positions lp ON ds."droneId" = lp."droneId"
      LEFT JOIN active_commands ac ON ds."droneId" = ac."droneId"
      WHERE ds."droneId" = ANY(:droneIds) AND ds."isActive" = true;
    `;

    return await sequelize.query(query, {
      replacements: { droneIds },
      type: sequelize.QueryTypes.SELECT
    });
  }

  /**
   * 獲取無人機軌跡（優化時間範圍查詢）
   */
  static async getDroneTrajectory(sequelize, droneId, startTime, endTime, sampleInterval = '1 minute') {
    const query = `
      WITH sampled_trajectory AS (
        SELECT 
          "recordedAt",
          latitude,
          longitude,
          altitude,
          speed,
          heading,
          "gpsStatus",
          ROW_NUMBER() OVER (
            PARTITION BY DATE_TRUNC(:sampleInterval, "recordedAt")
            ORDER BY "recordedAt" DESC
          ) as rn
        FROM drone_positions
        WHERE "droneId" = :droneId
          AND "recordedAt" BETWEEN :startTime AND :endTime
      )
      SELECT 
        "recordedAt",
        latitude,
        longitude,
        altitude,
        speed,
        heading,
        "gpsStatus",
        -- 計算距離和方向變化
        LAG(latitude) OVER (ORDER BY "recordedAt") as prev_latitude,
        LAG(longitude) OVER (ORDER BY "recordedAt") as prev_longitude,
        EXTRACT(EPOCH FROM ("recordedAt" - LAG("recordedAt") OVER (ORDER BY "recordedAt"))) as time_diff_seconds
      FROM sampled_trajectory
      WHERE rn = 1
      ORDER BY "recordedAt";
    `;

    return await sequelize.query(query, {
      replacements: { droneId, startTime, endTime, sampleInterval },
      type: sequelize.QueryTypes.SELECT
    });
  }

  /**
   * 地理範圍內的無人機查詢（空間查詢優化）
   */
  static async getDronesInArea(sequelize, centerLat, centerLng, radiusKm) {
    const query = `
      WITH latest_positions AS (
        SELECT DISTINCT ON (dp."droneId")
          dp."droneId",
          dp.latitude,
          dp.longitude,
          dp.altitude,
          dp."recordedAt",
          earth_distance(
            ll_to_earth(:centerLat, :centerLng),
            ll_to_earth(dp.latitude, dp.longitude)
          ) / 1000 as distance_km
        FROM drone_positions dp
        WHERE dp."recordedAt" >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
        ORDER BY dp."droneId", dp."recordedAt" DESC
      )
      SELECT 
        ds."droneId",
        ds.status,
        ds."batteryLevel",
        ds."lastHeartbeat",
        lp.latitude,
        lp.longitude,
        lp.altitude,
        lp."recordedAt" as last_position_time,
        lp.distance_km
      FROM latest_positions lp
      JOIN drone_status ds ON lp."droneId" = ds."droneId"
      WHERE lp.distance_km <= :radiusKm
        AND ds."isActive" = true
      ORDER BY lp.distance_km;
    `;

    return await sequelize.query(query, {
      replacements: { centerLat, centerLng, radiusKm },
      type: sequelize.QueryTypes.SELECT
    });
  }
}

/**
 * General Service 用戶偏好優化查詢
 */
export class UserPreferencesQueryOptimizations {
  /**
   * 批量獲取用戶偏好設定
   */
  static async getUserPreferencesBatch(sequelize, userId, categories) {
    const query = `
      SELECT 
        category,
        json_object_agg(
          key, 
          CASE 
            WHEN value IS NOT NULL THEN value
            ELSE "defaultValue"
          END
        ) as preferences
      FROM user_preferences
      WHERE "userId" = :userId 
        AND category = ANY(:categories)
      GROUP BY category;
    `;

    return await sequelize.query(query, {
      replacements: { userId, categories },
      type: sequelize.QueryTypes.SELECT
    });
  }

  /**
   * 獲取公開偏好設定統計
   */
  static async getPublicPreferencesStats(sequelize) {
    const query = `
      SELECT 
        category,
        key,
        "dataType",
        COUNT(*) as usage_count,
        COUNT(DISTINCT "userId") as unique_users,
        CASE "dataType"
          WHEN 'string' THEN mode() WITHIN GROUP (ORDER BY value::text)
          WHEN 'number' THEN avg((value)::numeric)::text
          WHEN 'boolean' THEN mode() WITHIN GROUP (ORDER BY (value)::boolean::text)
          ELSE 'N/A'
        END as most_common_value
      FROM user_preferences
      WHERE "isPublic" = true
      GROUP BY category, key, "dataType"
      HAVING COUNT(*) >= 10  -- 至少10個用戶使用
      ORDER BY category, usage_count DESC;
    `;

    return await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });
  }
}

/**
 * 跨服務聚合查詢優化
 */
export class CrossServiceQueryOptimizations {
  /**
   * 獲取用戶完整配置文件（跨RBAC和偏好設定）
   */
  static async getUserCompleteProfile(rbacSequelize, generalSequelize, userId) {
    // RBAC 數據查詢
    const rbacQuery = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u."isActive",
        u."lastLoginAt",
        json_agg(DISTINCT jsonb_build_object(
          'roleName', r.name,
          'roleDisplayName', r."displayName",
          'permissions', rp.permissions
        )) as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur."userId"
      LEFT JOIN roles r ON ur."roleId" = r.id AND r."isActive" = true
      LEFT JOIN (
        SELECT 
          rp."roleId",
          json_agg(p.name) as permissions
        FROM role_permissions rp
        JOIN permissions p ON rp."permissionId" = p.id AND p."isActive" = true
        GROUP BY rp."roleId"
      ) rp ON r.id = rp."roleId"
      WHERE u.id = :userId
      GROUP BY u.id, u.username, u.email, u."isActive", u."lastLoginAt";
    `;

    // 偏好設定查詢
    const preferencesQuery = `
      SELECT 
        category,
        json_object_agg(key, COALESCE(value, "defaultValue")) as preferences
      FROM user_preferences
      WHERE "userId" = :userId
      GROUP BY category;
    `;

    const [rbacResult, preferencesResult] = await Promise.all([
      rbacSequelize.query(rbacQuery, {
        replacements: { userId },
        type: rbacSequelize.QueryTypes.SELECT
      }),
      generalSequelize.query(preferencesQuery, {
        replacements: { userId },
        type: generalSequelize.QueryTypes.SELECT
      })
    ]);

    return {
      user: rbacResult[0] || null,
      preferences: preferencesResult.reduce((acc, item) => {
        acc[item.category] = item.preferences;
        return acc;
      }, {})
    };
  }
}

/**
 * 查詢性能監控工具
 */
export class QueryPerformanceMonitor {
  /**
   * 記錄查詢執行時間
   */
  static async logQueryPerformance(sequelize, queryName, executionTime, rowCount) {
    await sequelize.query(`
      INSERT INTO query_performance_log (
        query_name, 
        execution_time_ms, 
        row_count, 
        executed_at
      ) VALUES (:queryName, :executionTime, :rowCount, CURRENT_TIMESTAMP)
      ON CONFLICT (query_name) DO UPDATE SET
        total_executions = query_performance_log.total_executions + 1,
        total_execution_time = query_performance_log.total_execution_time + :executionTime,
        avg_execution_time = (query_performance_log.total_execution_time + :executionTime) / (query_performance_log.total_executions + 1),
        last_execution_time = :executionTime,
        last_executed_at = CURRENT_TIMESTAMP;
    `, {
      replacements: { queryName, executionTime, rowCount }
    });
  }

  /**
   * 包裝查詢以自動監控性能
   */
  static async executeWithMonitoring(sequelize, queryName, queryFunction) {
    const startTime = Date.now();
    
    try {
      const result = await queryFunction();
      const executionTime = Date.now() - startTime;
      const rowCount = Array.isArray(result) ? result.length : 1;
      
      // 異步記錄性能數據
      setImmediate(() => {
        this.logQueryPerformance(sequelize, queryName, executionTime, rowCount)
          .catch(err => console.error('Failed to log query performance:', err));
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // 記錄失敗的查詢
      setImmediate(() => {
        this.logQueryPerformance(sequelize, `${queryName}_ERROR`, executionTime, 0)
          .catch(err => console.error('Failed to log query error:', err));
      });
      
      throw error;
    }
  }
}

export default {
  RBACQueryOptimizations,
  DroneQueryOptimizations,
  UserPreferencesQueryOptimizations,
  CrossServiceQueryOptimizations,
  QueryPerformanceMonitor
};