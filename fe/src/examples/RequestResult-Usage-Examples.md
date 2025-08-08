# RequestResult 使用示例

這個文檔展示如何使用新的 `RequestResult` 類來處理 API 響應，提供更好的錯誤處理和調試體驗。

## 基本使用方式

### 1. 簡單的 GET 請求

```typescript
import { apiClient } from '../utils/RequestUtils';

// 使用新的 RequestResult 方法
const fetchUsers = async () => {
  const result = await apiClient.getWithResult<User[]>('/api/users');
  
  if (result.isSuccess()) {
    console.log('用戶列表:', result.data);
    return result.data;
  } else {
    console.error('獲取用戶失敗:', result.message);
    // 可以根據不同的錯誤類型進行處理
    if (result.isUnauthorized()) {
      // 重定向到登入頁面
      window.location.href = '/login';
    }
    return [];
  }
};
```

### 2. POST 請求與錯誤處理

```typescript
const createUser = async (userData: CreateUserRequest) => {
  const result = await apiClient.postWithResult<User>('/api/users', userData);
  
  // 使用鏈式調用記錄錯誤
  result.logError('創建用戶失敗');
  
  if (result.isSuccess()) {
    console.log('用戶創建成功:', result.data);
    return result.unwrap(); // 獲取數據，如果失敗會拋出異常
  } else if (result.isClientError()) {
    // 處理客戶端錯誤（400-499）
    alert(`輸入錯誤: ${result.message}`);
  } else if (result.isServerError()) {
    // 處理伺服器錯誤（500-599）
    alert('伺服器錯誤，請稍後再試');
  }
  
  throw new Error(result.message);
};
```

### 3. 使用 unwrapOr 提供預設值

```typescript
const getUserProfile = async (userId: number) => {
  const result = await apiClient.getWithResult<UserProfile>(`/api/users/${userId}/profile`);
  
  // 如果失敗，返回預設的用戶配置
  const defaultProfile: UserProfile = {
    id: userId,
    name: '未知用戶',
    email: '',
    avatar: '/default-avatar.png'
  };
  
  return result.unwrapOr(defaultProfile);
};
```

## 錯誤處理最佳實踐

### 1. 統一錯誤處理函數

```typescript
const handleRequestError = (result: RequestResult) => {
  result.logError('請求失敗');
  
  if (result.isUnauthorized()) {
    // 清除本地認證狀態並重定向
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  } else if (result.isForbidden()) {
    alert('您沒有權限執行此操作');
  } else if (result.isNotFound()) {
    alert('請求的資源不存在');
  } else if (result.isServerError()) {
    alert('伺服器錯誤，請稍後再試');
  } else {
    alert(`請求失敗: ${result.message}`);
  }
};

// 使用示例
const deleteUser = async (userId: number) => {
  const result = await apiClient.deleteWithResult(`/api/users/${userId}`);
  
  if (result.isSuccess()) {
    alert('用戶刪除成功');
  } else {
    handleRequestError(result);
  }
};
```

### 2. React Hook 中的使用

```typescript
import { useState, useEffect } from 'react';
import { apiClient } from '../utils/RequestUtils';

const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      const result = await apiClient.getWithResult<User[]>('/api/users');
      
      if (result.isSuccess()) {
        setUsers(result.data || []);
      } else {
        setError(result.message);
        result.logError('獲取用戶列表失敗');
      }
      
      setLoading(false);
    };
    
    fetchUsers();
  }, []);
  
  return { users, loading, error };
};
```

## 調試技巧

### 1. 使用內建的日誌方法

```typescript
const result = await apiClient.postWithResult('/api/data', payload)
  .then(result => result.logSuccess('數據提交成功'))  // 只在成功時記錄
  .then(result => result.logError('數據提交失敗'));   // 只在失敗時記錄
```

### 2. 檢查詳細的錯誤信息

```typescript
const result = await apiClient.getWithResult('/api/sensitive-data');

if (result.isError()) {
  console.log('錯誤詳情:', {
    status: result.status,
    message: result.message,
    originalError: result.error,  // 原始的 axios 錯誤對象
    responseData: result.data     // 如果後端返回了錯誤詳情
  });
}
```

### 3. 自定義錯誤處理

```typescript
const customErrorHandler = (result: RequestResult) => {
  if (result.isError()) {
    // 發送錯誤到監控系統
    if (window.analytics) {
      window.analytics.track('API Error', {
        url: result.error?.config?.url,
        status: result.status,
        message: result.message
      });
    }
    
    // 顯示用戶友好的錯誤訊息
    const userMessage = result.isServerError() 
      ? '系統暫時無法使用，請稍後再試'
      : result.message;
      
    showNotification(userMessage, 'error');
  }
};
```

## 類型安全

### 1. 泛型使用

```typescript
interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
}

// 明確指定返回類型
const result = await apiClient.getWithResult<ApiResponse<User[]>>('/api/users');

if (result.isSuccess()) {
  // TypeScript 知道 result.data 的完整類型
  const users = result.data.data;
  const total = result.data.total;
}
```

### 2. 自定義錯誤類型

```typescript
interface ValidationError {
  field: string;
  message: string;
}

const result = await apiClient.postWithResult<User, ValidationError[]>('/api/users', userData);

if (result.isClientError() && result.data) {
  // 處理驗證錯誤
  result.data.forEach(error => {
    console.log(`欄位 ${error.field}: ${error.message}`);
  });
}
```

## 遷移指南

### 從舊版 RequestUtils 遷移

```typescript
// 舊版本
try {
  const data = await apiClient.get<User[]>('/api/users');
  console.log('用戶:', data);
} catch (error) {
  console.error('錯誤:', error);
}

// 新版本
const result = await apiClient.getWithResult<User[]>('/api/users');
if (result.isSuccess()) {
  console.log('用戶:', result.data);
} else {
  result.logError('獲取用戶失敗');
}
```

這個新的 `RequestResult` 系統提供了：
- ✅ 統一的錯誤處理
- ✅ 更好的類型安全
- ✅ 內建的調試功能
- ✅ 鏈式調用支持
- ✅ 靈活的錯誤檢查方法
- ✅ 與現有代碼的向後兼容性