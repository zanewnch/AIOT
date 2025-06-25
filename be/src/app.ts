import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import initRouter from './controller/InitializationController.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { UserModel } from './models/rbac/UserModel.js';
import jwtAuthController from './controller/JWTAuthController.js';
import { RBACFactory } from './utils/RBACFactory.js';

// passport JWT config
/*
是的，引入并配置好 Passport-JWT 以后，你就不需要再在每个接口里手动去解析、验签、校验过期时间之类了。

流程是这样的：

你在 app.ts 里用 passport.use(new JwtStrategy(...)) 定义了「怎么从请求里拿 token」「用哪个 secret 验签」「载荷里哪个字段存 user id」；
接着在路由上用 passport.authenticate('jwt',{session:false}) 就会：
a. 自动从 Authorization: Bearer 里取出 JWT；
b. 用你配置的 secret 做验签、校验过期；
c. 验签通过后把解出的 payload 传给你在 strategy 里写的回调，从数据库查到对应 user 并挂到 req.user；
d. 验签不通过或用户不存在则会直接返回 401。
所以你在业务 handler（如 RBACController）里只要用 req.user 就可以放心它已经被验证过了，不用再写任何手动 decode/jwt.verify 的逻辑。

唯一还需要自己写的是「登录／注册」接口，用来校验用户名密码并发放 JWT。需要的话我可以帮你加上。
*/
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret',
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await UserModel.findByPk((payload as any).sub);
    if (user) return done(null, user);
    return done(null, false);
  } catch (err) {
    return done(err, false);
  }
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// initialize passport
app.use(passport.initialize());

// view engine setup
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'jade');

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// routes
app.use('/api/init', initRouter.router);

// Auth routes
app.use('/api/auth', jwtAuthController.router);

// RBAC routes (protected) - 使用 Factory 創建實例
const rbacController = RBACFactory.createDefaultRBACController();
app.use('/api/rbac', passport.authenticate('jwt', { session: false }), rbacController.router);

// error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;