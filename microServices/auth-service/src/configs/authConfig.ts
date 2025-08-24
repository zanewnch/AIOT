/**
 * @fileoverview JWT 基於令牌的身份驗證配置模組
 * 此模組提供 Passport.js JWT 身份驗證策略的配置和設置
 * 用於保護 API 端點和驗證 JWT 令牌
 */

// 匯入主要的 passport 函式庫用於身份驗證策略
import passport from 'passport';
// 從 passport-jwt 匯入 JWT 策略、JWT 提取工具和回調類型
import { Strategy as JwtStrategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
// 匯入用戶模型進行資料庫操作
import { UserModel } from '../models/UserModel.js';
// 匯入 JWT 負載類型定義
// import { JwtPayload } from 'aiot-shared-packages/AuthMiddleware.js';

// 臨時定義 JwtPayload 介面
export interface JwtPayload {
    userId: number;
    username: string;
    roles?: string[];
    permissions?: string[];
    iat?: number;
    exp?: number;
}

/**
 * 身份驗證設定的配置介面
 * 定義 JWT 身份驗證配置的結構
 */
export interface AuthConfig {
  /** 用於簽名 JWT 令牌的密鑰 */
  jwtSecret: string;
  /** JWT 策略配置選項 */
  jwtOptions: {
    /** 從請求中提取 JWT 的函式 */
    jwtFromRequest: any;
    /** 用於驗證 JWT 令牌的密鑰 */
    secretOrKey: string;
  };
}

/**
 * 建立並返回身份驗證配置物件
 * 從環境變數中獲取 JWT 密鑰並配置提取方法
 * @returns {AuthConfig} 完整的身份驗證配置
 */
export const getAuthConfig = (): AuthConfig => ({
  // 從環境變數獲取 JWT 密鑰並轉換為字串
  jwtSecret: process.env.JWT_SECRET as string,
  // 配置 passport 策略的 JWT 選項
  jwtOptions: {
    // 設定從 Authorization 標頭中提取 JWT 作為 Bearer 令牌
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // 使用相同的 JWT 密鑰進行令牌驗證
    secretOrKey: process.env.JWT_SECRET as string,
  }
});

/**
 * 設定並配置 Passport.js JWT 身份驗證策略
 * 此函式向 passport 註冊 JWT 策略以進行令牌驗證
 * @returns {void} 無返回值 - 全域配置 passport
 */
export const setupPassportJWT = (): void => {
  // 獲取 JWT 配置選項
  const { jwtOptions } = getAuthConfig();

  // 向 passport 註冊 JWT 策略
  passport.use(new JwtStrategy(jwtOptions, async (payload: JwtPayload, done: VerifiedCallback) => {
    try {
      // 嘗試使用 JWT 負載中的主題（用戶 ID）在資料庫中查找用戶
      const user = await UserModel.findByPk((payload as any).sub);
      // 如果用戶存在，身份驗證成功 - 返回用戶物件
      if (user) return done(null, user);
      // 如果未找到用戶，身份驗證失敗 - 返回 false
      return done(null, false);
    } catch (err) {
      // 如果發生資料庫錯誤，返回錯誤和身份驗證失敗
      return done(err, false);
    }
  }));
};