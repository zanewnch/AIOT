#!/bin/bash

# 檢查 AIOT-fe container 是否正在運行
if docker ps --format "table {{.Names}}" | grep -q "AIOT-fe"; then
    echo "AIOT-fe container is running, showing React logs..."
    docker logs -f AIOT-fe
else
    echo "AIOT-fe container is not running, starting development server..."
    cd fe
    npm run dev
fi