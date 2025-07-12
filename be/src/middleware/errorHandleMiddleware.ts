import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';

/**
 * 錯誤處理中間件類別
 * 
 * 提供統一的錯誤處理功能，包括404錯誤和通用錯誤處理。
 * 支援API和網頁兩種回應格式，並根據環境變數決定錯誤詳細程度。
 * 
 * @class ErrorHandleMiddleware
 * @example
 * ```typescript
 * import express from 'express';
 * import { ErrorHandleMiddleware } from './middleware/errorHandleMiddleware';
 * 
 * const app = express();
 * 
 * // 設置路由...
 * 
 * // 404 錯誤處理 - 必須放在所有路由之後
 * app.use(ErrorHandleMiddleware.notFound);
 * 
 * // 統一錯誤處理 - 必須放在最後
 * app.use(ErrorHandleMiddleware.handle);
 * ```
 */
export class ErrorHandleMiddleware {
  /**
   * 處理404錯誤的中間件
   * 
   * 當請求的路由不存在時，創建一個404錯誤並傳遞給錯誤處理中間件。
   * 此中間件應該放置在所有其他路由定義之後，作為路由的最後捕獲器。
   * 
   * @param {Request} req - Express請求物件，包含請求的詳細資訊
   * @param {Response} res - Express回應物件（在此方法中未直接使用）
   * @param {NextFunction} next - Express下一個中間件函數，用於傳遞錯誤
   * @returns {void}
   * 
   * @example
   * ```typescript
   * import express from 'express';
   * import { ErrorHandleMiddleware } from './middleware/errorHandleMiddleware';
   * 
   * const app = express();
   * 
   * // 定義你的路由
   * app.get('/api/users', (req, res) => {
   *   res.json({ users: [] });
   * });
   * 
   * // 404處理 - 放在所有路由之後
   * app.use(ErrorHandleMiddleware.notFound);
   * 
   * // 當訪問不存在的路由如 /api/unknown 時，
   * // 會創建404錯誤並傳遞給錯誤處理中間件
   * ```
   */
  static notFound(req: Request, res: Response, next: NextFunction): void {
    next(createError(404, `Route ${req.originalUrl} not found`));
  }

  /**
   * 統一錯誤處理中間件
   * 
   * 處理應用程式中的所有錯誤，根據請求類型（API或網頁）返回適當的回應格式。
   * 在開發環境中提供詳細的錯誤資訊，在生產環境中隱藏敏感資訊。
   * 
   * 錯誤回應行為：
   * - API請求（接受JSON）：返回JSON格式的錯誤資訊
   * - 網頁請求：渲染錯誤頁面模板
   * - 開發環境：包含完整的錯誤堆疊資訊
   * - 生產環境：只顯示錯誤訊息，隱藏堆疊追蹤
   * 
   * @param {any} err - 錯誤物件，可能包含status、message、stack等屬性
   * @param {Request} req - Express請求物件，用於判斷回應類型和環境
   * @param {Response} res - Express回應物件，用於發送錯誤回應
   * @param {NextFunction} next - Express下一個中間件函數（在此方法中未使用）
   * @returns {void}
   * 
   * @example
   * ```typescript
   * import express from 'express';
   * import { ErrorHandleMiddleware } from './middleware/errorHandleMiddleware';
   * 
   * const app = express();
   * 
   * // 路由中拋出錯誤
   * app.get('/api/error-test', (req, res, next) => {
   *   try {
   *     throw new Error('測試錯誤');
   *   } catch (error) {
   *     next(error); // 傳遞給錯誤處理中間件
   *   }
   * });
   * 
   * // 統一錯誤處理 - 必須放在最後
   * app.use(ErrorHandleMiddleware.handle);
   * 
   * // API請求錯誤回應範例：
   * // {
   * //   "success": false,
   * //   "error": "測試錯誤",
   * //   "stack": "Error: 測試錯誤\n    at ..." // 僅開發環境
   * // }
   * ```
   * 
   * @example
   * ```typescript
   * // 使用http-errors創建標準HTTP錯誤
   * import createError from 'http-errors';
   * 
   * app.get('/api/forbidden', (req, res, next) => {
   *   next(createError(403, '沒有權限訪問此資源'));
   * });
   * 
   * // 處理業務邏輯錯誤
   * app.post('/api/users', async (req, res, next) => {
   *   try {
   *     const user = await createUser(req.body);
   *     res.json({ success: true, user });
   *   } catch (error) {
   *     // 自動傳遞給錯誤處理中間件
   *     next(error);
   *   }
   * });
   * ```
   */
  static handle(err: any, req: Request, res: Response, next: NextFunction): void {
    // 設置本地變數，僅在開發環境中提供錯誤詳細資訊
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // 設置HTTP狀態碼，預設為500（內部伺服器錯誤）
    res.status(err.status || 500);

    // 根據請求接受的內容類型決定回應格式
    if (req.accepts('json')) {
      // API回應：返回JSON格式
      res.json({
        success: false,
        error: err.message,
        // 僅在開發環境中包含堆疊追蹤
        ...(req.app.get('env') === 'development' && { stack: err.stack })
      });
    } else {
      // 網頁回應：渲染錯誤頁面模板
      res.render('error');
    }
  }
}