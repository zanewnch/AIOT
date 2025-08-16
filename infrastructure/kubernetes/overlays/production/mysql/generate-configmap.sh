#!/bin/bash

# 生成 MySQL 初始化腳本 ConfigMap 的 Kustomize 友好方法
# 這個腳本將 SQL 文件複製到當前目錄，以便 Kustomize 可以使用

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_SOURCE_DIR="$SCRIPT_DIR/../../../../database/mysql"
SQL_TARGET_DIR="$SCRIPT_DIR/sql-scripts"

echo "🔄 準備 MySQL 初始化腳本用於 Kustomize..."

# 清理並創建目標目錄
rm -rf "$SQL_TARGET_DIR"
mkdir -p "$SQL_TARGET_DIR"

# 複製所有 SQL 文件
if [ -d "$SQL_SOURCE_DIR" ]; then
    echo "📄 複製 SQL 文件從 $SQL_SOURCE_DIR 到 $SQL_TARGET_DIR"
    cp "$SQL_SOURCE_DIR"/*.sql "$SQL_TARGET_DIR/"
    
    echo "✅ 複製完成! 文件列表："
    ls -la "$SQL_TARGET_DIR"
else
    echo "❌ 錯誤: SQL 源目錄不存在: $SQL_SOURCE_DIR"
    exit 1
fi

# 更新 kustomization.yaml 使用本地文件
cat > "$SCRIPT_DIR/kustomization.yaml" << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

# MySQL 生產環境配置 Kustomization
namespace: aiot-prod

# 引用基礎配置
resources:
- ../../../bases/mysql

# 從本地文件生成 ConfigMap
configMapGenerator:
- name: mysql-init-scripts
  files:
  - sql-scripts/00_database_init.sql
  - sql-scripts/01_rbac_system_init.sql
  - sql-scripts/02_users_test_data.sql
  - sql-scripts/03_drone_flight_positions.sql
  - sql-scripts/04_drone_basic_info.sql
  - sql-scripts/05_drone_realtime_status_table.sql
  - sql-scripts/06_drone_commands_test_data.sql
  - sql-scripts/07_command_queues_test_data.sql
  - sql-scripts/08_user_preferences_init.sql
  options:
    labels:
      app: mysql
      app.kubernetes.io/name: mysql
      app.kubernetes.io/component: init-scripts

# 生產環境特定的配置
patches:
- mysql-production-patch.yaml

# 標籤
labels:
- pairs:
    environment: production
    tier: database

# 名稱前綴
namePrefix: aiot-prod-
EOF

echo "✅ Kustomization 配置已更新"
echo "🚀 現在可以運行: kubectl kustomize . 或 kubectl apply -k ."