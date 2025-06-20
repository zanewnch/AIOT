import { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(createError(404, `Route ${req.originalUrl} not found`));
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
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
}; 