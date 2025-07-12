/**
 * RBAC 控制器介面定義
 * 
 * 定義 RBAC 主控制器必須實現的基本結構，包含路由器屬性。
 * RBAC 控制器負責整合所有角色權限相關的子控制器。
 * 
 * @module Types
 */

import { Router } from 'express';

export interface IRBACController {
    router: Router;
}