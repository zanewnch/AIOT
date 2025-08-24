#!/bin/bash

# AIOT LLM 服務整合測試腳本
# 用於測試 LLM Service 和 LLM AI Engine 的 Docker Compose 整合

echo "🤖 AIOT LLM 服務整合測試"
echo "===================================="

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 基本 URL 配置
GATEWAY_URL="http://localhost:8000"
LLM_SERVICE_URL="http://localhost:8022"
AI_ENGINE_URL="http://localhost:8021"

# 1. 檢查服務容器狀態
echo -e "\n${BLUE}1. 檢查 LLM 服務容器狀態${NC}"
echo "------------------------------------"
docker ps --filter "name=aiot-llm" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. 檢查 AI Engine 健康狀態
echo -e "\n${BLUE}2. 檢查 AI Engine 健康狀態${NC}"
echo "------------------------------------"
curl -s "$AI_ENGINE_URL/health" | jq . 2>/dev/null || echo "AI Engine 不可用或回應非 JSON 格式"

# 3. 檢查 LLM Service 健康狀態
echo -e "\n${BLUE}3. 檢查 LLM Service 健康狀態${NC}"
echo "------------------------------------"
curl -s "$LLM_SERVICE_URL/api/transformers/health/" | jq . 2>/dev/null || echo "LLM Service 不可用或回應非 JSON 格式"

# 4. 通過 Gateway 測試 LLM 路由
echo -e "\n${BLUE}4. 測試 Gateway LLM 路由${NC}"
echo "------------------------------------"
echo "測試路徑: $GATEWAY_URL/api/llm/transformers/health/"
curl -s "$GATEWAY_URL/api/llm/transformers/health/" | jq . 2>/dev/null || echo "Gateway LLM 路由不可用"

# 5. 測試 AI Engine 文字生成功能
echo -e "\n${BLUE}5. 測試 AI Engine 文字生成${NC}"
echo "------------------------------------"
echo "發送測試 prompt: 'Hello, what is AI?'"
curl -s -X POST "$AI_ENGINE_URL/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello, what is AI?","use_rag":false}' | jq . 2>/dev/null || echo "文字生成測試失敗"

# 6. 測試對話記憶功能
echo -e "\n${BLUE}6. 測試對話記憶功能${NC}"
echo "------------------------------------"
echo "第一輪對話: 'My name is John'"
curl -s -X POST "$AI_ENGINE_URL/conversational" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"My name is John","use_rag":false}' | jq . 2>/dev/null || echo "對話測試失敗"

echo -e "\n第二輪對話: 'What is my name?'"
curl -s -X POST "$AI_ENGINE_URL/conversational" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is my name?","use_rag":false}' | jq . 2>/dev/null || echo "對話記憶測試失敗"

# 7. 檢查對話歷史
echo -e "\n${BLUE}7. 檢查對話歷史${NC}"
echo "------------------------------------"
curl -s "$AI_ENGINE_URL/memory/history" | jq . 2>/dev/null || echo "對話歷史檢查失敗"

# 8. 測試通過 Gateway 的完整流程
echo -e "\n${BLUE}8. 測試 Gateway 完整流程${NC}"
echo "------------------------------------"
echo "通過 Gateway 測試文字生成"
curl -s -X POST "$GATEWAY_URL/api/llm/transformers/generate/" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is machine learning?","use_rag":false}' | jq . 2>/dev/null || echo "Gateway LLM 測試失敗"

# 9. 檢查服務日誌（最後 10 行）
echo -e "\n${BLUE}9. 檢查服務日誌${NC}"
echo "------------------------------------"
echo -e "${YELLOW}AI Engine 日誌:${NC}"
docker logs aiot-llm-service --tail=5 2>/dev/null || echo "無法獲取 AI Engine 日誌"

echo -e "\n${YELLOW}LLM Service 日誌:${NC}"
docker logs aiot-llm-service --tail=5 2>/dev/null || echo "無法獲取 LLM Service 日誌"

# 10. 顯示網路連接狀態
echo -e "\n${BLUE}10. 檢查網路連接${NC}"
echo "------------------------------------"
echo "LLM 相關端口狀態:"
ss -tlnp | grep -E "(8021|8022)" || echo "端口未開放"

echo -e "\n${GREEN}✅ LLM 服務整合測試完成${NC}"
echo "===================================="
echo -e "${YELLOW}💡 使用說明:${NC}"
echo "- AI Engine: http://localhost:8021"
echo "- LLM Service: http://localhost:8022"
echo "- Gateway LLM: http://localhost:8000/api/llm"
echo "- Gateway AI Engine: http://localhost:8000/api/ai-engine"