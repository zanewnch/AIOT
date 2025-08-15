#!/bin/bash

# MySQL ConfigMap 自動更新腳本
# 將 infrastructure/database/mysql/ 目錄中的所有 SQL 文件自動同步到 Kubernetes ConfigMap

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SQL_DIR="$PROJECT_ROOT/infrastructure/database/mysql"
NAMESPACE="aiot-prod"
CONFIGMAP_NAME="mysql-init-scripts"

echo "🔄 更新 MySQL 初始化腳本 ConfigMap..."
echo "📁 SQL 文件目錄: $SQL_DIR"
echo "🎯 命名空間: $NAMESPACE"
echo "📦 ConfigMap 名稱: $CONFIGMAP_NAME"

# 檢查 SQL 目錄是否存在
if [ ! -d "$SQL_DIR" ]; then
    echo "❌ 錯誤: SQL 目錄不存在: $SQL_DIR"
    exit 1
fi

# 檢查是否有 SQL 文件
sql_files=$(find "$SQL_DIR" -name "*.sql" | wc -l)
if [ "$sql_files" -eq 0 ]; then
    echo "❌ 錯誤: SQL 目錄中沒有找到 .sql 文件"
    exit 1
fi

echo "📄 找到 $sql_files 個 SQL 文件:"
find "$SQL_DIR" -name "*.sql" -exec basename {} \; | sort

# 檢查 namespace 是否存在
if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    echo "⚠️  命名空間 $NAMESPACE 不存在，正在創建..."
    kubectl create namespace "$NAMESPACE"
fi

# 檢查 ConfigMap 是否已存在
if kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" >/dev/null 2>&1; then
    echo "🗑️  刪除現有的 ConfigMap..."
    kubectl delete configmap "$CONFIGMAP_NAME" -n "$NAMESPACE"
fi

# 從文件目錄創建新的 ConfigMap
echo "📦 創建新的 ConfigMap..."
kubectl create configmap "$CONFIGMAP_NAME" \
    --from-file="$SQL_DIR" \
    --namespace="$NAMESPACE"

# 添加標籤
echo "🏷️  添加標籤..."
kubectl label configmap "$CONFIGMAP_NAME" \
    app=aiot-prod-mysql \
    app.kubernetes.io/name=mysql \
    app.kubernetes.io/component=init-scripts \
    -n "$NAMESPACE"

# 驗證 ConfigMap 內容
echo "✅ ConfigMap 創建成功！"
echo ""
echo "📋 ConfigMap 內容概要:"
kubectl describe configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" | head -20

echo ""
echo "🔍 包含的 SQL 文件:"
kubectl get configmap "$CONFIGMAP_NAME" -n "$NAMESPACE" -o jsonpath='{.data}' | jq -r 'keys[]' | sort

echo ""
echo "✨ MySQL 初始化腳本 ConfigMap 更新完成！"
echo ""
echo "💡 下一步："
echo "   1. 重新部署 MySQL Pod 以使用新的初始化腳本"
echo "   2. 運行: kubectl rollout restart deployment/aiot-prod-mysql-deployment -n $NAMESPACE"