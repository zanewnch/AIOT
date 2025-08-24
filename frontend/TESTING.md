# Frontend 測試指南

本專案使用完整的測試策略，包括單元測試、整合測試和端到端 (E2E) 測試，確保應用程式的品質和可靠性。

## 📋 目錄

1. [測試環境設置](#測試環境設置)
2. [測試類型](#測試類型)
3. [運行測試](#運行測試)
4. [測試工具和框架](#測試工具和框架)
5. [測試最佳實踐](#測試最佳實踐)
6. [CI/CD 整合](#cicd-整合)
7. [故障排除](#故障排除)

## 🔧 測試環境設置

### 前置需求

```bash
# Node.js (建議版本 18 或 20)
node --version

# Chrome/Chromium (用於 E2E 測試)
google-chrome --version
# 或
chromium --version
```

### 安裝依賴

```bash
cd frontend
npm install
```

### 環境變數

創建 `.env.test` 文件：

```env
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
HEADLESS=true
```

## 🧪 測試類型

### 1. 單元測試 (Unit Tests)

測試個別組件和函數的功能。

**位置**: `src/test/unit/`

**特色**:
- 使用 Vitest 和 React Testing Library
- 快速執行，隔離測試
- 高覆蓋率要求

**範例**:
```typescript
// Button.test.tsx
describe('Button Component', () => {
  it('應該正確渲染按鈕文字', () => {
    render(<Button>測試按鈕</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('測試按鈕');
  });
});
```

### 2. 整合測試 (Integration Tests)

測試組件間的互動和 API 整合。

**位置**: `src/test/integration/`

**特色**:
- 使用 MSW (Mock Service Worker) 模擬 API
- 測試完整的用戶流程
- 驗證數據流和狀態管理

**範例**:
```typescript
// auth.integration.test.tsx
describe('認證整合測試', () => {
  it('應該完成完整的登入流程', async () => {
    render(<LoginPage />, { queryClient });
    
    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'admin');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
```

### 3. E2E 測試 (End-to-End Tests)

使用真實瀏覽器測試完整的用戶體驗。

**位置**: `src/test/e2e/`

**特色**:
- 使用 Selenium WebDriver
- Page Object Model 設計模式
- 真實瀏覽器環境測試

**範例**:
```typescript
// login.e2e.test.ts
describe('登入流程 E2E 測試', () => {
  it('應該使用正確憑證成功登入', async () => {
    await loginPage.open();
    await loginPage.login('admin', 'admin');
    
    const isLoginSuccessful = await loginPage.isLoginSuccessful();
    expect(isLoginSuccessful).toBe(true);
  });
});
```

## 🚀 運行測試

### 使用 npm 腳本

```bash
# 運行所有測試
npm test

# 運行特定類型的測試
npm run test:unit           # 單元測試
npm run test:integration    # 整合測試
npm run test:e2e           # E2E 測試

# 其他有用的命令
npm run test:watch          # 監視模式
npm run test:coverage       # 生成覆蓋率報告
npm run test:ui            # 使用 Vitest UI
npm run test:e2e:headed    # 有頭瀏覽器 E2E 測試
```

### 使用測試運行腳本

我們提供了一個方便的測試運行腳本：

```bash
# 運行所有測試
./test-runner.sh

# 運行特定測試類型
./test-runner.sh --unit
./test-runner.sh --integration
./test-runner.sh --e2e

# 帶覆蓋率報告
./test-runner.sh --unit --coverage

# E2E 測試顯示瀏覽器
./test-runner.sh --e2e --headed

# 監視模式（僅單元測試）
./test-runner.sh --unit --watch
```

### 測試選項

```bash
# 運行特定測試文件
npx vitest run src/test/unit/Button.test.tsx

# 使用過濾器
npx vitest run --grep "登入"

# 調試模式
npx vitest run --inspect-brk

# 產生詳細報告
npx vitest run --reporter=verbose
```

## 🛠️ 測試工具和框架

### 核心測試框架

| 工具 | 用途 | 文檔連結 |
|------|------|----------|
| **Vitest** | 測試運行器和斷言庫 | [Vitest 文檔](https://vitest.dev/) |
| **React Testing Library** | React 組件測試工具 | [RTL 文檔](https://testing-library.com/docs/react-testing-library/intro/) |
| **Selenium WebDriver** | E2E 瀏覽器自動化 | [Selenium 文檔](https://selenium-webdriver.github.io/selenium/docs/api/javascript/) |
| **MSW** | API Mock Service | [MSW 文檔](https://mswjs.io/) |

### 測試工具

| 工具 | 用途 |
|------|------|
| `@testing-library/user-event` | 模擬用戶互動 |
| `@testing-library/jest-dom` | DOM 斷言擴展 |
| `happy-dom` / `jsdom` | DOM 環境模擬 |

## 📝 測試最佳實踐

### 1. 測試結構

遵循 AAA 模式：
- **Arrange** (準備): 設置測試數據和環境
- **Act** (執行): 執行要測試的操作
- **Assert** (斷言): 驗證結果

```typescript
it('應該在點擊時觸發回調', async () => {
  // Arrange
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>點擊我</Button>);
  
  // Act
  await user.click(screen.getByRole('button'));
  
  // Assert
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 2. 命名規範

- **描述性**: 測試名稱應清楚描述測試的行為
- **使用中文**: 本專案使用繁體中文測試名稱
- **一致性**: 保持命名風格一致

```typescript
// ✅ 好的命名
it('應該在用戶名為空時顯示錯誤訊息', () => { ... });

// ❌ 不好的命名
it('test input validation', () => { ... });
```

### 3. 測試隔離

每個測試應該是獨立的：

```typescript
beforeEach(() => {
  // 重置狀態
  vi.clearAllMocks();
  localStorage.clear();
});
```

### 4. Page Object Model (E2E)

使用 Page Object 封裝頁面操作：

```typescript
export class LoginPage extends BasePage {
  public async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }
}
```

### 5. 測試數據管理

使用 Fixtures 管理測試數據：

```typescript
// fixtures/user.fixtures.ts
export const userFixtures = {
  validUser: {
    id: 'user_001',
    username: 'admin',
    email: 'admin@aiot.com',
  },
};
```

## 📊 覆蓋率要求

我們的覆蓋率目標：

| 類型 | 目標覆蓋率 |
|------|-----------|
| 陳述式 (Statements) | > 80% |
| 分支 (Branches) | > 75% |
| 函數 (Functions) | > 80% |
| 行數 (Lines) | > 80% |

### 檢查覆蓋率

```bash
# 生成覆蓋率報告
npm run test:coverage

# 查看 HTML 報告
open coverage/index.html
```

## 🔄 CI/CD 整合

### GitHub Actions

我們的 CI/CD 流程包括：

1. **並行測試**: 不同 Node.js 版本的矩陣測試
2. **服務依賴**: PostgreSQL 和 Redis 服務
3. **測試分層**: 單元 → 整合 → E2E
4. **結果上傳**: 測試結果和覆蓋率報告

### 本地 CI 模擬

```bash
# 模擬 CI 環境
npm run test:ci

# 檢查 CI 結果
cat coverage/junit.xml
```

## 🐛 故障排除

### 常見問題

#### 1. Selenium 瀏覽器問題

**問題**: WebDriver 找不到瀏覽器

**解決方案**:
```bash
# Ubuntu/Debian
sudo apt-get install google-chrome-stable

# macOS
brew install --cask google-chrome

# 檢查安裝
google-chrome --version
```

#### 2. 測試超時

**問題**: E2E 測試超時

**解決方案**:
```typescript
// 增加超時時間
it('長時間運行的測試', async () => {
  // ...
}, 30000); // 30 秒超時

// 或在配置中設置
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000,
  },
});
```

#### 3. Mock 服務問題

**問題**: API mock 不工作

**解決方案**:
```typescript
// 確保 MSW 服務器正確啟動
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// 重置處理器
afterEach(() => {
  server.resetHandlers();
});
```

#### 4. 記憶體問題

**問題**: 大量測試導致記憶體不足

**解決方案**:
```bash
# 增加 Node.js 記憶體限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 或使用測試分片
npx vitest run --shard=1/2
```

### 調試技巧

#### 1. 測試調試

```typescript
// 使用 console.log
console.log('Current state:', component.debug());

// 使用 screen.debug()
screen.debug(); // 印出當前 DOM

// 暫停測試
await new Promise(resolve => setTimeout(resolve, 1000));
```

#### 2. E2E 調試

```bash
# 有頭模式運行
npm run test:e2e:headed

# 截圖調試
await driverManager.takeScreenshot();

# 慢速模式
await loginPage.sleep(2000);
```

#### 3. 網路問題

```typescript
// 檢查服務可用性
const isServiceUp = await fetch('http://localhost:8000/health')
  .then(() => true)
  .catch(() => false);

if (!isServiceUp) {
  console.log('Backend service not available');
  return;
}
```

## 📚 進階主題

### 測試自動化

設置 Git hooks 自動運行測試：

```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run test:unit
```

### 性能測試

```typescript
// 測量組件渲染時間
const start = performance.now();
render(<ComplexComponent />);
const renderTime = performance.now() - start;
expect(renderTime).toBeLessThan(100); // 100ms 以內
```

### 視覺回歸測試

使用截圖比較檢測 UI 變化：

```typescript
// E2E 視覺測試
const screenshot = await driverManager.takeScreenshot();
expect(screenshot).toMatchSnapshot('login-page.png');
```

## 🤝 貢獻指南

1. **新增測試**: 每個新功能都應該有相應的測試
2. **測試維護**: 保持測試與代碼同步更新
3. **覆蓋率**: 確保新代碼不降低整體覆蓋率
4. **文檔**: 更新測試文檔和範例

## 📞 支援和幫助

如果遇到測試相關問題：

1. 查看本文檔的故障排除部分
2. 檢查 [Vitest 文檔](https://vitest.dev/)
3. 查看專案的 Issue 追蹤器
4. 聯繫開發團隊

---

**最後更新**: 2025-08-24  
**版本**: 1.0.0  
**維護者**: AIOT Development Team