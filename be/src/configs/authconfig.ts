import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { UserModel } from '../models/rbac/UserModel.js';
import { JwtPayload } from '../middleware/jwtAuthMiddleware.js';

export interface AuthConfig {
  jwtSecret: string;
  jwtOptions: {
    jwtFromRequest: any;
    secretOrKey: string;
  };
}

export const getAuthConfig = (): AuthConfig => ({
  jwtSecret: process.env.JWT_SECRET as string,
  jwtOptions: {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET as string,
  }
});

export const setupPassportJWT = (): void => {
  const { jwtOptions } = getAuthConfig();

  passport.use(new JwtStrategy(jwtOptions, async (payload: JwtPayload, done: VerifiedCallback) => {
    try {
      const user = await UserModel.findByPk(payload.sub);
      if (user) return done(null, user);
      return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  }));
};