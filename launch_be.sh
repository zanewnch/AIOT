#!/bin/bash

# 檢查 AIOT-be container 是否正在運行
if docker ps --format "table {{.Names}}" | grep -q "AIOT-be"; then
    echo "AIOT-be container is running, showing Express server logs..."
    echo "Recent logs:"
    docker logs --tail 10 AIOT-be
    echo ""
    echo "Following live logs (Press Ctrl+C to exit):"
    docker logs -f AIOT-be
else
    echo "AIOT-be container is not running, starting development server..."
    cd be
    npm run dev
fi