#!/bin/bash

# Kong gRPC-Gateway 測試腳本
# 用於測試 HTTP 到 gRPC 的轉換是否正常工作

echo "🚀 測試 Kong gRPC-Gateway 插件..."

# 基本設定
KONG_URL="http://localhost:8000"
COOKIE_FILE="/tmp/kong-test-cookies.txt"

# 顏色設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 測試函數
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}測試: $description${NC}"
    echo "方法: $method"
    echo "端點: $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -v "$KONG_URL$endpoint" \
            -H "Accept-Encoding: gzip" \
            -b "$COOKIE_FILE" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -v -X "$method" "$KONG_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Accept-Encoding: gzip" \
            -d "$data" \
            -b "$COOKIE_FILE" 2>&1)
    fi
    
    # 提取 HTTP 回應碼和頭部資訊
    http_code=$(echo "$response" | tail -n1)
    headers=$(echo "$response" | grep -E "^< " | sed 's/^< //')
    body=$(echo "$response" | sed -n '/^$/,$ p' | sed '$d')
    
    # 檢查新增的插件標頭
    echo "🔍 檢查插件標頭:"
    echo "$headers" | grep -E "(X-Powered-By|X-Response-Time|X-Service-Name|Content-Encoding)" || echo "  - 未找到插件標頭"
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✅ 成功 (HTTP $http_code)${NC}"
        if [ -n "$body" ]; then
            echo "回應: $body"
        fi
    else
        echo -e "${RED}❌ 失敗 (HTTP $http_code)${NC}"
        if [ -n "$body" ]; then
            echo "回應: $body"
        fi
    fi
}

# 等待 Kong 啟動
echo "等待 Kong 啟動..."
sleep 5

# 測試 RBAC 服務
echo -e "\n${YELLOW}=== 測試 RBAC 服務 ===${NC}"

test_endpoint "GET" "/api/rbac/users" "" "獲取使用者列表"

test_endpoint "POST" "/api/rbac/users" '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
}' "創建新使用者"

# 測試 Drone 服務
echo -e "\n${YELLOW}=== 測試 Drone 服務 ===${NC}"

test_endpoint "GET" "/api/drone/statuses" "" "獲取無人機狀態列表"

test_endpoint "POST" "/api/drone/statuses" '{
    "drone_id": "drone-001",
    "status": "active",
    "battery_level": "85%"
}' "創建無人機狀態"

test_endpoint "GET" "/api/drone/positions" "" "獲取無人機位置列表"

test_endpoint "POST" "/api/drone/commands" '{
    "drone_id": "drone-001",
    "command_type": "takeoff",
    "parameters": "{\"altitude\": 100}"
}' "發送無人機命令"

# 測試 FeSetting 服務
echo -e "\n${YELLOW}=== 測試 FeSetting 服務 ===${NC}"

test_endpoint "GET" "/api/user-preferences" "" "獲取使用者偏好設定"

test_endpoint "POST" "/api/user-preferences" '{
    "user_id": 1,
    "preference_key": "theme",
    "preference_value": "dark",
    "category": "ui"
}' "創建使用者偏好設定"

echo -e "\n${GREEN}🎉 測試完成！${NC}"

# 檢查插件功能
echo -e "\n${YELLOW}=== 檢查插件功能 ===${NC}"

# 檢查日誌文件
echo -e "\n📝 檢查訪問日誌:"
if docker exec aiot-kong ls -la /tmp/kong-access.log 2>/dev/null; then
    echo -e "${GREEN}✅ 日誌文件已創建${NC}"
    echo "最新日誌條目:"
    docker exec aiot-kong tail -n 3 /tmp/kong-access.log 2>/dev/null || echo "日誌文件為空"
else
    echo -e "${RED}❌ 日誌文件未找到${NC}"
fi

# 測試機器人檢測
echo -e "\n🤖 測試機器人檢測:"
bot_response=$(curl -s -w "\n%{http_code}" "$KONG_URL/api/rbac/users" \
    -H "User-Agent: BadBot" 2>/dev/null)
bot_code=$(echo "$bot_response" | tail -n1)
if [ "$bot_code" -eq 403 ]; then
    echo -e "${GREEN}✅ 機器人檢測正常工作 (阻擋 BadBot)${NC}"
else
    echo -e "${YELLOW}⚠️ 機器人檢測可能未生效 (HTTP $bot_code)${NC}"
fi

# 測試快取功能 (兩次相同請求)
echo -e "\n🗄️ 測試回應快取:"
echo "首次請求..."
time1=$(date +%s%N)
curl -s "$KONG_URL/api/rbac/users" >/dev/null 2>&1
time2=$(date +%s%N)
first_time=$((($time2 - $time1) / 1000000))

echo "第二次請求 (應該從快取返回)..."
time1=$(date +%s%N)
curl -s "$KONG_URL/api/rbac/users" >/dev/null 2>&1
time2=$(date +%s%N)
second_time=$((($time2 - $time1) / 1000000))

echo "首次請求時間: ${first_time}ms"
echo "第二次請求時間: ${second_time}ms"

if [ "$second_time" -lt "$first_time" ]; then
    echo -e "${GREEN}✅ 快取可能正常工作 (第二次請求更快)${NC}"
else
    echo -e "${YELLOW}⚠️ 快取效果不明顯或未生效${NC}"
fi

echo -e "\n${GREEN}🔧 插件配置驗證完成！${NC}"
echo -e "如果看到大量錯誤，請檢查："
echo -e "1. Kong Gateway 是否正常運行"
echo -e "2. gRPC 服務是否已啟動"  
echo -e "3. 插件配置是否正確載入"
echo -e "4. Docker 容器網路連接是否正常"