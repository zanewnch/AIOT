import { Sequelize } from 'sequelize-typescript';
import { UserModel } from '../models/rbac/UserModel.js';
import { RoleModel } from '../models/rbac/RoleModel.js';
import { PermissionModel } from '../models/rbac/PermissionModel.js';
import { UserRoleModel } from '../models/rbac/UserToRoleModel.js';
import { RolePermissionModel } from '../models/rbac/RoleToPermissionModel.js';
import { RTKDataModel } from '../models/RTKDataModel.js';

export interface DatabaseConfig {
  host: string;
  database: string;
  username: string;
  password: string;
  port: number;
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
  logging: boolean | ((sql: string) => void);
}

export const getDatabaseConfig = (): DatabaseConfig => ({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'main_db',
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  port: parseInt(process.env.DB_PORT || '3306'),
  dialect: 'mysql',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export const createSequelizeInstance = (): Sequelize => {
  const config = getDatabaseConfig();
  
  return new Sequelize({
    ...config,
    models: [UserModel, RoleModel, PermissionModel, UserRoleModel, RolePermissionModel, RTKDataModel],
  });
};