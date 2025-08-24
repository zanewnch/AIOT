#!/usr/bin/env python3

import os
import re

services = [
    'rbac-service',
    'drone-service', 
    'general-service',
    'drone-websocket-service'
]

def add_consul_to_app(service_name):
    app_path = f"/home/user/GitHub/AIOT/microServices/{service_name}/src/app.ts"
    
    if not os.path.exists(app_path):
        print(f"❌ {app_path} not found")
        return
    
    with open(app_path, 'r') as f:
        content = f.read()
    
    # 添加 import
    if 'ConsulService' not in content:
        # 在 container import 後添加 Consul import
        content = re.sub(
            r"(import.*container.*from.*container\.js['\"];?)",
            r"\1\n// Consul 服務註冊\nimport { ConsulService } from './services/ConsulService.js';",
            content
        )
    
    # 在類中添加 consulService 屬性
    if 'private consulService: ConsulService' not in content:
        # 找到最後一個 private 屬性後添加
        content = re.sub(
            r"(private.*?;)\s*\n(\s*\/\*\*\s*\n\s*\* [^*]*?建構函數)",
            r"\1\n\n    /**\n     * Consul 服務註冊實例\n     */\n    private consulService: ConsulService;\n\2",
            content,
            flags=re.DOTALL
        )
    
    # 在 constructor 中初始化
    if 'this.consulService = new ConsulService()' not in content:
        content = re.sub(
            r"(constructor\(\) \{[^}]*?)(console\.log\('🏗️)",
            r"\1        // 初始化 Consul 服務\n        this.consulService = new ConsulService();\n        \2",
            content
        )
    
    # 在初始化完成後註冊
    if 'this.consulService.registerService()' not in content:
        content = re.sub(
            r"(this\.initialized = true;)\s*\n\s*(console\.log\('✅.*?application.*?initialization.*?completed)",
            r"\1\n\n            // 註冊到 Consul\n            await this.consulService.registerService();\n\n            \2",
            content
        )
    
    # 在 shutdown 中註銷
    if 'this.consulService.deregisterService()' not in content:
        content = re.sub(
            r"(try \{)\s*\n\s*(\/\/ 步驟.*?關閉)",
            r"\1\n            // 步驟 1：從 Consul 註銷服務\n            if (this.consulService) {\n                console.log('🗂️  Deregistering from Consul...');\n                await this.consulService.deregisterService();\n            }\n\n            // 步驟 2：\2",
            content
        )
    
    with open(app_path, 'w') as f:
        f.write(content)
    
    print(f"✅ Updated {service_name} app.ts")

for service in services:
    add_consul_to_app(service)

print("🎉 All app.ts files updated!")