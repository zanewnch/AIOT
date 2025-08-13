#!/bin/bash

# 批量更新 Logger Decorator 使用方式的腳本

update_file() {
    local file="$1"
    echo "更新文件: $file"
    
    # 檢查文件是否存在
    if [ ! -f "$file" ]; then
        echo "文件不存在: $file"
        return 1
    fi
    
    # 創建備份
    cp "$file" "${file}.backup"
    
    # 更新導入語句
    sed -i 's|import { Logger } from.*decorators/LoggerDecorator\.js.*|import { loggerDecorator } from "../../patterns/LoggerDecorator.js";|g' "$file"
    
    # 如果文件沒有 loggerDecorator 導入，添加它
    if ! grep -q "import.*loggerDecorator.*patterns/LoggerDecorator" "$file"; then
        # 在最後一個 import 語句後添加導入
        sed -i '/^import.*\.js.*;$/a import { loggerDecorator } from "../../patterns/LoggerDecorator.js";' "$file"
    fi
    
    echo "完成更新: $file"
}

# 定義需要更新的文件列表
files=(
    "microServices/drone-service/src/controllers/queries/DroneCommandQueriesCtrl.ts"
    "microServices/drone-service/src/controllers/commands/ArchiveTaskCommandsCtrl.ts"
    "microServices/drone-service/src/controllers/queries/ArchiveTaskQueriesCtrl.ts"
    "microServices/drone-service/src/controllers/queries/DronePositionQueriesCtrl.ts"
    "microServices/drone-service/src/controllers/commands/DronePositionsArchiveCommandsCtrl.ts"
    "microServices/drone-service/src/controllers/commands/DroneRealTimeStatusCommandsCtrl.ts"
    "microServices/drone-service/src/controllers/commands/DroneStatusArchiveCommandsCtrl.ts"
    "microServices/drone-service/src/controllers/commands/DroneCommandQueueCommandsCtrl.ts"
    "microServices/drone-service/src/controllers/commands/DroneCommandsArchiveCommandsCtrl.ts"
    "microServices/drone-service/src/controllers/queries/DronePositionsArchiveQueriesCtrl.ts"
    "microServices/drone-service/src/controllers/queries/DroneRealTimeStatusQueriesCtrl.ts"
    "microServices/drone-service/src/controllers/queries/DroneStatusArchiveQueriesCtrl.ts"
    "microServices/drone-service/src/controllers/queries/DroneStatusQueriesCtrl.ts"
    "microServices/drone-service/src/controllers/queries/DroneCommandQueueQueriesCtrl.ts"
)

# 更新每個文件
for file in "${files[@]}"; do
    update_file "$file"
done

echo "所有文件更新完成！"