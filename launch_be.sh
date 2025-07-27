#!/bin/bash

# 檢查 AIOT-be container 是否正在運行
if docker ps --format "table {{.Names}}" | grep -q "AIOT-be"; then
    echo "AIOT-be container is running, entering container..."
    docker exec -it AIOT-be /bin/bash
else
    echo "AIOT-be container is not running, starting development server..."
    cd be
    npm run dev
fi