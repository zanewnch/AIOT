import express from 'express';
import { JwtAuthMiddleware } from '../middleware/jwtAuthMiddleware.js';
import { PermissionMiddleware } from '../middleware/permissionMiddleware.js';

/**
 * 權限系統使用範例
 * ================
 * 
 * 此檔案展示如何在 Express 路由中使用權限中間件
 * 包含各種權限檢查方式的實際應用範例
 */

const app = express();
const jwtAuth = new JwtAuthMiddleware();
const permissionMiddleware = new PermissionMiddleware();

// 中間件設定
app.use(express.json());

/**
 * 範例 1: 單一權限檢查
 * 只有具有 'user.create' 權限的使用者才能建立新使用者
 */
app.post('/api/users', 
  jwtAuth.authenticate,
  permissionMiddleware.requirePermission('user.create'),
  (req, res) => {
    res.json({ 
      message: '使用者建立成功',
      createdBy: req.user?.username 
    });
  }
);

/**
 * 範例 2: 多重權限檢查（OR 邏輯）
 * 使用者需要具有 'user.update' 或 'user.manage' 權限之一
 */
app.put('/api/users/:id', 
  jwtAuth.authenticate,
  permissionMiddleware.requireAnyPermission(['user.update', 'user.manage']),
  (req, res) => {
    res.json({ 
      message: '使用者更新成功',
      updatedBy: req.user?.username 
    });
  }
);

/**
 * 範例 3: 多重權限檢查（AND 邏輯）
 * 使用者需要同時具有 'user.read' 和 'user.export' 權限
 */
app.get('/api/users/export', 
  jwtAuth.authenticate,
  permissionMiddleware.requireAllPermissions(['user.read', 'user.export']),
  (req, res) => {
    res.json({ 
      message: '使用者資料匯出',
      exportedBy: req.user?.username 
    });
  }
);

/**
 * 範例 4: 角色檢查
 * 只有管理員角色可以存取系統統計資料
 */
app.get('/api/admin/stats', 
  jwtAuth.authenticate,
  permissionMiddleware.requireRole('admin'),
  (req, res) => {
    res.json({ 
      message: '系統統計資料',
      accessedBy: req.user?.username 
    });
  }
);

/**
 * 範例 5: 裝置管理權限
 * 展示 IoT 裝置相關的權限控制
 */
app.post('/api/devices', 
  jwtAuth.authenticate,
  permissionMiddleware.requirePermission('device.create'),
  (req, res) => {
    res.json({ 
      message: '裝置建立成功',
      createdBy: req.user?.username 
    });
  }
);

app.delete('/api/devices/:id', 
  jwtAuth.authenticate,
  permissionMiddleware.requirePermission('device.delete'),
  (req, res) => {
    res.json({ 
      message: '裝置刪除成功',
      deletedBy: req.user?.username 
    });
  }
);

/**
 * 範例 6: 複雜的權限組合
 * 使用者需要具有任一裝置權限，並且必須是操作員或管理員
 */
app.patch('/api/devices/:id/config', 
  jwtAuth.authenticate,
  permissionMiddleware.requireAnyPermission(['device.update', 'device.manage']),
  // 可以串聯多個權限檢查
  permissionMiddleware.requireAnyPermission(['operator', 'admin']),
  (req, res) => {
    res.json({ 
      message: '裝置配置更新成功',
      updatedBy: req.user?.username 
    });
  }
);

/**
 * 範例 7: 可選驗證搭配權限檢查
 * 公開 API 但根據權限提供不同層級的資料
 */
app.get('/api/devices', 
  jwtAuth.optional, // 可選驗證
  async (req, res) => {
    const baseData = { devices: ['device1', 'device2'] };
    
    // 如果使用者已登入且有進階權限，提供更多資料
    if (req.user) {
      const permissionService = new (await import('../service/PermissionService.js')).PermissionService();
      const hasAdvancedAccess = await permissionService.userHasPermission(
        req.user.id, 
        'device.advanced_view'
      );
      
      if (hasAdvancedAccess) {
        (baseData as any).advanced = {
          status: 'online',
          metrics: { cpu: 45, memory: 60 }
        };
      }
    }
    
    res.json(baseData);
  }
);

/**
 * 範例 8: 錯誤處理
 * 展示權限檢查失敗時的錯誤回應
 */
app.get('/api/sensitive-data', 
  jwtAuth.authenticate,
  permissionMiddleware.requirePermission('sensitive.read'),
  (req, res) => {
    res.json({ 
      message: '敏感資料存取成功',
      data: 'This is sensitive information' 
    });
  }
);

// 全域錯誤處理中間件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Application error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * 權限設定說明
 * ============
 * 
 * 在實際使用前，需要在資料庫中設定以下權限：
 * 
 * 基本權限：
 * - user.create     - 建立使用者
 * - user.read       - 讀取使用者資料
 * - user.update     - 更新使用者資料
 * - user.delete     - 刪除使用者
 * - user.manage     - 管理使用者（包含所有使用者操作）
 * - user.export     - 匯出使用者資料
 * 
 * 裝置權限：
 * - device.create   - 建立裝置
 * - device.read     - 讀取裝置資料
 * - device.update   - 更新裝置資料
 * - device.delete   - 刪除裝置
 * - device.manage   - 管理裝置（包含所有裝置操作）
 * - device.advanced_view - 進階裝置資料檢視
 * 
 * 系統權限：
 * - sensitive.read  - 讀取敏感資料
 * - admin.stats     - 檢視系統統計
 * 
 * 角色設定：
 * - admin          - 管理員角色
 * - operator       - 操作員角色
 * - user           - 一般使用者角色
 */

export default app;