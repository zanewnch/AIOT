/**
 * @fileoverview Unified Route Management
 * 
 * This file manages all application route registration logic, including:
 * - Base routes (home, auth, init, etc.)
 * - Feature module routes (RBAC, progress tracking, etc.)
 * - User-related routes
 * - Development tools routes (development environment only)
 * - API documentation routes
 * 
 * Through unified route management, it simplifies app.ts complexity and provides better route organization.
 * 
 * @author AIOT Development Team
 * @version 1.0.0
 * @since 2025-07-26
 */

import type { Application } from 'express';

// Import all route modules
import { authRoutes } from './authRoutes.js';           
import { initRoutes } from './initRoutes.js';           
import { progressRoutes } from './progressRoutes.js';   
import { rtkRoutes } from './rtkRoutes.js';             
import { swaggerRoutes } from './swaggerRoutes.js';     
import { rbacRoutes } from './rbacRoutes.js';           
import { userRoutes } from './userRoutes.js';           
import { homeRoutes } from './homeRoutes.js';               
import developmentRoutes from './DevelopmentRoutes.js'; 

/**
 * Route configuration interface
 */
interface RouteConfig {
  name: string;
  description: string;
  handler: any;
  basePath: string;
  requireAuth?: boolean;
  developmentOnly?: boolean;
}

/**
 * Base routes configuration
 */
const baseRoutes: RouteConfig[] = [
  {
    name: 'home',
    description: 'Home routes',
    handler: homeRoutes,
    basePath: '/',
    requireAuth: false
  },
  {
    name: 'init',
    description: 'System initialization and health check routes',
    handler: initRoutes,
    basePath: '/',
    requireAuth: false
  },
  {
    name: 'auth',
    description: 'Authentication related routes',
    handler: authRoutes,
    basePath: '/',
    requireAuth: false
  },
  {
    name: 'rtk',
    description: 'Redux Toolkit related routes',
    handler: rtkRoutes,
    basePath: '/',
    requireAuth: true
  },
  {
    name: 'swagger',
    description: 'Swagger API documentation routes',
    handler: swaggerRoutes,
    basePath: '/',
    requireAuth: false
  }
];

/**
 * Feature module routes configuration
 */
const featureRoutes: RouteConfig[] = [
  {
    name: 'rbac',
    description: 'RBAC role-based access control routes',
    handler: rbacRoutes,
    basePath: '/',
    requireAuth: true
  },
  {
    name: 'progress',
    description: 'Task progress tracking routes',
    handler: progressRoutes,
    basePath: '/',
    requireAuth: true
  },
  {
    name: 'user',
    description: 'User management and settings routes',
    handler: userRoutes,
    basePath: '/',
    requireAuth: true
  }
];

/**
 * Development tools routes configuration
 */
const developmentRoutesConfig: RouteConfig[] = [
  {
    name: 'development',
    description: 'Development stage data viewing tools',
    handler: developmentRoutes,
    basePath: '/',
    requireAuth: false,
    developmentOnly: true
  }
];

/**
 * Register route group to Express application
 */
function registerRouteGroup(app: Application, routes: RouteConfig[], groupName: string): void {
  console.log(`🔗 Registering ${groupName} routes...`);
  
  routes.forEach(route => {
    // Check development environment restriction
    if (route.developmentOnly && process.env.NODE_ENV !== 'development') {
      console.log(`  ⏭️  Skipping ${route.name} (development only)`);
      return;
    }

    // Register route
    app.use(route.basePath, route.handler);
    
    // Output registration info
    const authStatus = route.requireAuth ? '🔒' : '🔓';
    const envStatus = route.developmentOnly ? '🔧' : '🌐';
    console.log(`  ✅ ${route.name}: ${route.description} ${authStatus} ${envStatus}`);
  });
}

/**
 * Unified route registration function
 * 
 * This function registers all routes to the Express application in order:
 * 1. Base routes: home, auth, system functions
 * 2. Feature module routes: RBAC, progress tracking, user management
 * 3. Development tools routes: only in development environment
 */
export function registerAllRoutes(app: Application): void {
  console.log('🚀 Starting route registration...');
  
  try {
    // 1. Register base routes
    registerRouteGroup(app, baseRoutes, 'Base');
    
    // 2. Register feature module routes
    registerRouteGroup(app, featureRoutes, 'Feature');
    
    // 3. Register development tools routes (development environment only)
    registerRouteGroup(app, developmentRoutesConfig, 'Development');
    
    console.log('✅ All routes registered successfully');
    
    // Output route statistics
    const totalRoutes = baseRoutes.length + featureRoutes.length + 
                       (process.env.NODE_ENV === 'development' ? developmentRoutesConfig.length : 0);
    console.log(`📊 Total active routes: ${totalRoutes}`);
    
  } catch (error) {
    console.error('❌ Route registration failed:', error);
    throw error;
  }
}

/**
 * Get all registered route information
 */
export function getRouteInfo(): RouteConfig[] {
  const allRoutes = [...baseRoutes, ...featureRoutes];
  
  // Include development routes if in development environment
  if (process.env.NODE_ENV === 'development') {
    allRoutes.push(...developmentRoutesConfig);
  }
  
  return allRoutes;
}

/**
 * Export route statistics
 */
export const routeStats = {
  baseRoutes: baseRoutes.length,
  featureRoutes: featureRoutes.length,
  developmentRoutes: developmentRoutesConfig.length,
  total: baseRoutes.length + featureRoutes.length + developmentRoutesConfig.length
};