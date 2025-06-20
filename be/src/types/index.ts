// Custom type definitions for the AIOT application

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extend Express Request interface if needed
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
} 