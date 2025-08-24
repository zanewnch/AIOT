/**
 * @fileoverview General Service README 路由
 * @description 提供 README 文檔顯示功能
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

/**
 * 獲取並顯示 README 文檔
 */
router.get('/readme', (_req, res) => {
    try {
        const readmePath = join(__dirname, '../../../README.md');
        const readmeContent = readFileSync(readmePath, 'utf-8');
        
        // 設定 Content-Type 為 text/markdown
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.send(readmeContent);
    } catch (error) {
        res.status(404).json({
            status: 404,
            success: false,
            message: 'README.md not found',
            timestamp: new Date().toISOString()
        });
    }
});

export default router;