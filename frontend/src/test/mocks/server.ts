/**
 * @fileoverview MSW 測試服務器設定
 * @description 模擬 API 端點用於單元和整合測試
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// 設定 Mock Service Worker 服務器
export const server = setupServer(...handlers);