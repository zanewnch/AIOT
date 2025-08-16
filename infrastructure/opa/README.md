# AIOT Centralized OPA (Open Policy Agent) System

## 概述

此目录包含 AIOT 系统的集中式权限管理配置，使用 Open Policy Agent (OPA) 实现统一的授权策略。

## 架构设计

```
Kong Gateway → OPA Server → Policy Evaluation → Allow/Deny
```

### 主要组件

- **OPA Server**: 核心政策引擎
- **Policy Files**: Rego 语言编写的授权规则 
- **Data Files**: JSON 格式的权限数据
- **Bundle Server**: 政策分发服务

## 目录结构

```
infrastructure/opa/
├── server/
│   ├── config.yaml          # OPA 服务器配置
│   └── nginx.conf            # Bundle 服务器配置
├── policies/
│   ├── common/
│   │   └── base_policy.rego  # 通用策略规则
│   ├── gateway/
│   │   └── gateway_policy.rego # Kong Gateway 集成策略
│   └── services/
│       ├── rbac_policy.rego     # RBAC 服务策略
│       ├── drone_policy.rego    # 无人机服务策略  
│       └── fesetting_policy.rego # 前端设置策略
├── data/
│   ├── users.json               # 用户数据
│   ├── roles_and_permissions.json # 角色权限数据
│   └── business_rules.json      # 业务规则数据
├── tests/
│   └── gateway_test.rego        # 策略单元测试
├── docker-compose.opa.yml       # Docker 容器编排
└── README.md                    # 本文档
```

## 快速开始

### 1. 启动 OPA 服务

```bash
# 在 infrastructure/opa 目录下运行
docker-compose -f docker-compose.opa.yml up -d
```

### 2. 验证服务状态

```bash
# 检查 OPA 服务健康状态
curl http://localhost:8181/health

# 检查策略加载状态
curl http://localhost:8181/v1/policies
```

### 3. 测试策略决策

```bash
# 测试网关策略
curl -X POST http://localhost:8181/v1/data/aiot/gateway/allow \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "route": {
        "service": {"name": "rbac-service"},
        "path": "/api/rbac/users"
      },
      "request": {"method": "GET"},
      "jwt": {
        "user": {
          "id": 1,
          "roles": ["admin"]
        }
      }
    }
  }'
```

## 策略说明

### Gateway Policy (gateway_policy.rego)

处理 Kong Gateway 层面的授权决策：

- **认证端点**: `/api/auth/*` 无需 JWT 验证
- **健康检查**: `/health` 端点公开访问
- **服务路由**: 根据服务名称和用户角色授权
- **WebSocket**: 支持实时连接的权限控制

### Service Policies

#### RBAC Policy (rbac_policy.rego)
- 用户管理权限控制
- 角色和权限管理
- 部门级别的访问控制

#### Drone Policy (drone_policy.rego)  
- 无人机操作权限
- 飞行员认证检查
- 天气和安全限制
- 地理围栏控制

#### FE Setting Policy (fesetting_policy.rego)
- 用户偏好设置管理
- 时间和地理位置限制
- 资源所有权验证

## 数据模型

### 用户数据 (users.json)
```json
{
  "users": {
    "1": {
      "id": 1,
      "username": "admin",
      "roles": ["admin"],
      "departmentId": 1,
      "level": 8
    }
  }
}
```

### 角色权限 (roles_and_permissions.json)
```json
{
  "roles": {
    "admin": {
      "name": "Administrator",
      "level": 8,
      "permissions": ["user.create", "user.read", ...]
    }
  },
  "permissions": {
    "user.create": "Create new users"
  }
}
```

### 业务规则 (business_rules.json)
- 部门信息和层级
- 无人机和飞行员数据
- 飞行区域限制
- 天气和安全规则

## Kong 集成

### JWT 插件配置

```yaml
plugins:
  - name: jwt
    config:
      secret_is_base64: false
      key_claim_name: iss
```

### OPA 插件配置

```yaml 
plugins:
  - name: opa
    config:
      opa_url: "http://opa-server:8181"
      policy_path: "/v1/data/aiot/gateway/allow"
```

## 策略测试

### 运行单元测试

```bash
# 测试网关策略
opa test policies/gateway/ tests/gateway_test.rego

# 测试所有策略
opa test policies/ tests/
```

### 策略验证

```bash
# 验证策略语法
opa fmt policies/

# 静态分析
opa check policies/
```

## 性能优化

### 缓存配置
- 启用内置函数缓存 (100MB)
- 查询结果缓存
- Bundle 轮询优化

### 监控和日志
- Prometheus 指标导出
- 决策日志记录
- 分布式追踪支持

## 安全考量

### 策略安全
- 默认拒绝 (Deny by Default) 原则
- 最小权限原则
- 审计日志要求

### 网络安全
- TLS 加密传输
- 内网访问限制
- 访问令牌验证

## 故障排除

### 常见问题

1. **策略加载失败**
   ```bash
   # 检查策略语法
   opa fmt --diff policies/
   ```

2. **决策评估错误**  
   ```bash
   # 查看详细日志
   docker logs AIOT-opa-server
   ```

3. **Bundle 更新失败**
   ```bash
   # 检查 Bundle 服务器状态
   curl http://localhost:8080/bundles/
   ```

### 日志分析

```bash
# 查看 OPA 决策日志
docker logs AIOT-opa-server | grep decision

# 查看错误日志  
docker logs AIOT-opa-server | grep ERROR
```

## 开发指南

### 添加新策略

1. 在 `policies/services/` 下创建新的 `.rego` 文件
2. 定义包名: `package aiot.servicename`
3. 实现授权规则
4. 添加对应测试文件
5. 更新数据文件 (如需要)

### 策略最佳实践

- 使用描述性的规则名称
- 添加详细的注释说明
- 实现拒绝原因输出
- 考虑审计日志要求
- 遵循最小权限原则

### 测试驱动开发

1. 先编写测试用例
2. 实现策略逻辑
3. 验证测试通过
4. 集成测试验证

## 维护和更新

### 策略更新流程

1. 修改策略文件
2. 运行单元测试
3. 更新 Bundle
4. 重启 OPA 服务
5. 验证生产环境

### 数据同步

定期同步以下数据：
- 用户和角色信息
- 部门结构变更  
- 业务规则更新
- 安全策略调整

### 版本管理

- 使用 Git 管理策略版本
- 标记重要发布版本
- 保留策略变更历史
- 建立回滚机制

## 联系信息

如有问题或建议，请联系 AIOT 开发团队。