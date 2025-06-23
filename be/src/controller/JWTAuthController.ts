import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/rbac/UserModel.js';

class JWTAuthController {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/login', this.login);
  }

  private async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      const user = await UserModel.findOne({ where: { username } });
      if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      const payload = { sub: user.id };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret_here', { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Login failed', error: (err as Error).message });
    }
  }
}

export default new JWTAuthController();
