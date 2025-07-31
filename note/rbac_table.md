
## 使用者表 (`users`)
- **id**: 主鍵識別碼
- **username**: 使用者名稱
- **passwordHash**: 密碼雜湊值
- **email**: 電子郵件
- **createdAt**: 建立時間
- **updatedAt**: 更新時間

**範例資料：**
```json
{
  "id": 2,
  "username": "alice_chen",
  "passwordHash": "$2b$10$randomhash1234567890abcdef",
  "email": "alice.chen@example.com",
  "createdAt": "2025-07-15T08:00:00.000Z",
  "updatedAt": "2025-07-15T08:00:00.000Z"
}
```

## 角色表 (`roles`)
- **id**: 主鍵識別碼
- **name**: 角色名稱
- **displayName**: 角色顯示名稱
- **createdAt**: 建立時間
- **updatedAt**: 更新時間

**範例資料：**
```json
[
  {
    "id": 1,
    "name": "admin",
    "displayName": "System Administrator",
    "createdAt": "2025-07-14T17:59:33.000Z",
    "updatedAt": "2025-07-14T17:59:33.000Z"
  },
  {
    "id": 2,
    "name": "user",
    "displayName": "Regular User",
    "createdAt": "2025-07-28T14:53:46.000Z",
    "updatedAt": "2025-07-28T14:53:46.000Z"
  }
]
```

## 權限表 (`permissions`)
- **id**: 主鍵識別碼
- **name**: 權限名稱
- **description**: 權限描述
- **createdAt**: 建立時間
- **updatedAt**: 更新時間

**範例資料：**
```json
[
  {
    "id": 1,
    "name": "user.create",
    "description": "Create users",
    "createdAt": "2025-07-14T17:59:33.000Z",
    "updatedAt": "2025-07-14T17:59:33.000Z"
  },
  {
    "id": 2,
    "name": "user.read",
    "description": "Read users and create Users",
    "createdAt": "2025-07-14T17:59:33.000Z",
    "updatedAt": "2025-07-16T00:05:41.000Z"
  },
  {
    "id": 16,
    "name": "rtk.read",
    "description": "Read RTK data",
    "createdAt": "2025-07-14T17:59:33.000Z",
    "updatedAt": "2025-07-14T17:59:33.000Z"
  }
]
```

## 使用者角色關聯表 (`user_roles`)
- **userId**: 使用者 ID
- **roleId**: 角色 ID
- **createdAt**: 建立時間
- **updatedAt**: 更新時間

**範例資料：**
```json
[
  {
    "userId": 1,
    "roleId": 1,
    "createdAt": "2025-07-14T18:00:00.000Z",
    "updatedAt": "2025-07-14T18:00:00.000Z"
  },
  {
    "userId": 2,
    "roleId": 2,
    "createdAt": "2025-07-28T14:55:00.000Z",
    "updatedAt": "2025-07-28T14:55:00.000Z"
  }
]
```

## 角色權限關聯表 (`role_permissions`)
- **roleId**: 角色 ID
- **permissionId**: 權限 ID
- **createdAt**: 建立時間
- **updatedAt**: 更新時間

**範例資料：**
```json
[
  {
    "roleId": 1,
    "permissionId": 1,
    "createdAt": "2025-07-14T17:59:33.000Z",
    "updatedAt": "2025-07-14T17:59:33.000Z"
  },
  {
    "roleId": 2,
    "permissionId": 2,
    "createdAt": "2025-07-28T14:54:00.000Z",
    "updatedAt": "2025-07-28T14:54:00.000Z"
  }
]
```