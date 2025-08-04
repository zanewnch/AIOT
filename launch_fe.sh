#!/bin/bash

# 檢查 AIOT-fe container 是否正在運行
if docker ps --format "table {{.Names}}" | grep -q "AIOT-fe"; then
    echo "AIOT-fe container is running, showing React logs..."
    echo "Recent logs:"
    docker logs --tail 10 AIOT-fe
    echo ""
    echo "Following live logs (Press Ctrl+C to exit):"
    docker logs -f AIOT-fe
else
    echo "AIOT-fe container is not running, starting development server..."
    cd fe
    npm run dev
fi