import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';

export class ErrorHandleMiddleware {
  /**
   * 處理 404 錯誤 - 找不到路由
   */
  static notFound(req: Request, res: Response, next: NextFunction): void {
    next(createError(404, `Route ${req.originalUrl} not found`));
  }

  /**
   * 統一錯誤處理中間件
   */
  static handle(err: any, req: Request, res: Response, next: NextFunction): void {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);

    // API vs HTML response
    if (req.accepts('json')) {
      res.json({
        success: false,
        error: err.message,
        ...(req.app.get('env') === 'development' && { stack: err.stack })
      });
    } else {
      res.render('error');
    }
  }
}