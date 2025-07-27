#!/bin/bash

# 檢查 AIOT-llm container 是否正在運行
if docker ps --format "table {{.Names}}" | grep -q "AIOT-llm"; then
    echo "AIOT-llm container is running, entering container..."
    docker exec -it AIOT-llm /bin/bash
else
    echo "AIOT-llm container is not running, starting development server..."
    cd llm
    source venv/bin/activate
    python manage.py migrate
    python manage.py runserver 