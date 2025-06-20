import { Request, Response, NextFunction } from 'express';
import { ApiResponse, User } from '../types/index.js';

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Mock data - replace with actual database logic
    const users: User[] = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const response: ApiResponse<User[]> = {
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Mock data - replace with actual database logic
    const user: User = {
      id,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const response: ApiResponse<User> = {
      success: true,
      data: user,
      message: 'User retrieved successfully'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
}; 