/**
 * @fileoverview 首頁路由模組
 * 處理應用程式首頁的路由請求
 */

import express from 'express';

const router = express.Router();

/**
 * 首頁路由
 * GET / - 渲染首頁模板
 */
router.get('/', (_req, res) => {
    res.render('index');
});

export default router;