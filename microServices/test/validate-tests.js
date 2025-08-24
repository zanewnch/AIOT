/**
 * @fileoverview 測試驗證腳本
 * 
 * 簡化的測試驗證工具，用於檢查：
 * - 測試檔案結構
 * - 測試覆蓋率統計
 * - 測試配置正確性
 * - 測試執行結果總結
 * 
 * @author AIOT Team
 * @since 1.0.0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.info = [];
        
        // 測試檔案統計
        this.stats = {
            unitTests: 0,
            integrationTests: 0,
            testFiles: 0,
            totalTestCases: 0
        };
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const prefix = {
            'ERROR': '❌',
            'WARN': '⚠️',
            'INFO': 'ℹ️',
            'SUCCESS': '✅'
        }[level] || 'ℹ️';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
        
        switch (level) {
            case 'ERROR':
                this.errors.push(message);
                break;
            case 'WARN':
                this.warnings.push(message);
                break;
            case 'INFO':
            case 'SUCCESS':
                this.info.push(message);
                break;
        }
    }

    // 檢查目錄結構
    validateDirectoryStructure() {
        this.log('INFO', '檢查測試目錄結構...');
        
        const requiredDirs = [
            'test',
            'test/unit',
            'test/integration',
            'test/setup'
        ];

        const testDir = path.join(__dirname);
        
        for (const dir of requiredDirs) {
            const fullPath = path.join(testDir, '..', dir);
            if (!fs.existsSync(fullPath)) {
                this.log('ERROR', `缺少必要目錄: ${dir}`);
            } else {
                this.log('INFO', `✓ 目錄存在: ${dir}`);
            }
        }
    }

    // 檢查測試檔案
    validateTestFiles() {
        this.log('INFO', '檢查測試檔案...');
        
        const testDirs = [
            { path: 'test/unit', type: 'unit' },
            { path: 'test/integration', type: 'integration' }
        ];

        for (const { path: testPath, type } of testDirs) {
            const fullPath = path.join(__dirname, '..', testPath);
            if (fs.existsSync(fullPath)) {
                this.scanTestFiles(fullPath, type);
            }
        }

        this.log('SUCCESS', `找到 ${this.stats.testFiles} 個測試檔案`);
        this.log('INFO', `單元測試: ${this.stats.unitTests} 個檔案`);
        this.log('INFO', `整合測試: ${this.stats.integrationTests} 個檔案`);
    }

    // 掃描測試檔案
    scanTestFiles(dir, type) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
            if (file.isDirectory()) {
                this.scanTestFiles(path.join(dir, file.name), type);
            } else if (file.name.endsWith('.test.ts') || file.name.endsWith('.test.js')) {
                this.stats.testFiles++;
                
                if (type === 'unit') {
                    this.stats.unitTests++;
                } else if (type === 'integration') {
                    this.stats.integrationTests++;
                }
                
                // 嘗試分析測試案例數量
                try {
                    const filePath = path.join(dir, file.name);
                    const content = fs.readFileSync(filePath, 'utf8');
                    const testCases = (content.match(/it\(|test\(/g) || []).length;
                    this.stats.totalTestCases += testCases;
                } catch (error) {
                    this.log('WARN', `無法讀取測試檔案: ${file.name}`);
                }
            }
        }
    }

    // 檢查配置檔案
    validateConfiguration() {
        this.log('INFO', '檢查測試配置...');
        
        const configFiles = [
            { name: 'jest.config.js', required: true },
            { name: 'package.json', required: true },
            { name: '.env.test', required: false }
        ];

        for (const { name, required } of configFiles) {
            const filePath = path.join(__dirname, name);
            if (fs.existsSync(filePath)) {
                this.log('SUCCESS', `✓ 配置檔案存在: ${name}`);
                
                if (name === 'package.json') {
                    this.validatePackageJson(filePath);
                } else if (name === 'jest.config.js') {
                    this.validateJestConfig(filePath);
                }
            } else if (required) {
                this.log('ERROR', `缺少必要配置檔案: ${name}`);
            } else {
                this.log('WARN', `建議配置檔案不存在: ${name}`);
            }
        }
    }

    // 驗證 package.json
    validatePackageJson(filePath) {
        try {
            const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // 檢查測試腳本
            const testScripts = [
                'test',
                'test:unit', 
                'test:integration',
                'test:coverage'
            ];
            
            for (const script of testScripts) {
                if (pkg.scripts && pkg.scripts[script]) {
                    this.log('SUCCESS', `✓ 測試腳本存在: ${script}`);
                } else {
                    this.log('WARN', `建議的測試腳本不存在: ${script}`);
                }
            }
            
            // 檢查測試依賴
            const testDeps = [
                'jest',
                'ts-jest',
                '@types/jest'
            ];
            
            for (const dep of testDeps) {
                if ((pkg.devDependencies && pkg.devDependencies[dep]) || 
                    (pkg.dependencies && pkg.dependencies[dep])) {
                    this.log('SUCCESS', `✓ 測試依賴存在: ${dep}`);
                } else {
                    this.log('WARN', `建議的測試依賴不存在: ${dep}`);
                }
            }
            
        } catch (error) {
            this.log('ERROR', `無法解析 package.json: ${error.message}`);
        }
    }

    // 驗證 Jest 配置
    validateJestConfig(filePath) {
        try {
            // 由於 Jest 配置可能使用 CommonJS，我們簡單檢查檔案內容
            const content = fs.readFileSync(filePath, 'utf8');
            
            const requiredConfigs = [
                'testEnvironment',
                'testMatch',
                'coverageDirectory',
                'collectCoverageFrom'
            ];
            
            for (const config of requiredConfigs) {
                if (content.includes(config)) {
                    this.log('SUCCESS', `✓ Jest 配置包含: ${config}`);
                } else {
                    this.log('WARN', `Jest 配置建議包含: ${config}`);
                }
            }
            
        } catch (error) {
            this.log('ERROR', `無法讀取 Jest 配置: ${error.message}`);
        }
    }

    // 檢查測試覆蓋率結果
    validateCoverageResults() {
        this.log('INFO', '檢查測試覆蓋率結果...');
        
        const coverageDirs = [
            'coverage',
            '../drone-service/coverage',
            '../rbac-service/coverage',
            '../general-service/coverage'
        ];
        
        let foundCoverage = false;
        
        for (const dir of coverageDirs) {
            const fullPath = path.join(__dirname, dir);
            if (fs.existsSync(fullPath)) {
                foundCoverage = true;
                this.log('SUCCESS', `✓ 發現覆蓋率報告: ${dir}`);
                
                // 檢查具體的覆蓋率檔案
                const summaryPath = path.join(fullPath, 'coverage-summary.json');
                if (fs.existsSync(summaryPath)) {
                    this.analyzeCoverageSummary(summaryPath);
                }
            }
        }
        
        if (!foundCoverage) {
            this.log('WARN', '未發現測試覆蓋率報告，建議執行測試以生成覆蓋率');
        }
    }

    // 分析覆蓋率摘要
    analyzeCoverageSummary(summaryPath) {
        try {
            const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
            
            if (summary.total) {
                const { lines, functions, branches, statements } = summary.total;
                
                this.log('INFO', `程式碼覆蓋率統計:`);
                this.log('INFO', `  - 行覆蓋率: ${lines.pct}%`);
                this.log('INFO', `  - 函數覆蓋率: ${functions.pct}%`);
                this.log('INFO', `  - 分支覆蓋率: ${branches.pct}%`);
                this.log('INFO', `  - 語句覆蓋率: ${statements.pct}%`);
                
                // 檢查覆蓋率門檻
                const thresholds = { lines: 70, functions: 70, branches: 70, statements: 70 };
                
                for (const [metric, threshold] of Object.entries(thresholds)) {
                    const actual = summary.total[metric].pct;
                    if (actual >= threshold) {
                        this.log('SUCCESS', `✓ ${metric} 覆蓋率達標: ${actual}% >= ${threshold}%`);
                    } else {
                        this.log('WARN', `${metric} 覆蓋率未達標: ${actual}% < ${threshold}%`);
                    }
                }
            }
        } catch (error) {
            this.log('ERROR', `無法解析覆蓋率摘要: ${error.message}`);
        }
    }

    // 生成測試報告
    generateReport() {
        this.log('INFO', '生成測試驗證報告...');
        
        const report = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            summary: {
                errors: this.errors.length,
                warnings: this.warnings.length,
                info: this.info.length
            },
            details: {
                errors: this.errors,
                warnings: this.warnings
            }
        };

        // 寫入報告檔案
        const reportPath = path.join(__dirname, 'test-validation-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log('SUCCESS', `測試驗證報告已生成: ${reportPath}`);
        
        // 輸出總結
        this.printSummary();
        
        return report;
    }

    // 輸出總結
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('測試驗證總結'.padStart(35));
        console.log('='.repeat(60));
        
        console.log(`\n📊 測試檔案統計:`);
        console.log(`   測試檔案總數: ${this.stats.testFiles}`);
        console.log(`   單元測試檔案: ${this.stats.unitTests}`);
        console.log(`   整合測試檔案: ${this.stats.integrationTests}`);
        console.log(`   測試案例總數: ${this.stats.totalTestCases}`);
        
        console.log(`\n📋 驗證結果:`);
        console.log(`   ❌ 錯誤: ${this.errors.length}`);
        console.log(`   ⚠️  警告: ${this.warnings.length}`);
        console.log(`   ℹ️  信息: ${this.info.length}`);
        
        if (this.errors.length === 0) {
            console.log(`\n✅ 測試結構驗證通過！`);
        } else {
            console.log(`\n❌ 發現 ${this.errors.length} 個錯誤，需要修正！`);
        }
        
        if (this.warnings.length > 0) {
            console.log(`⚠️  有 ${this.warnings.length} 個警告建議處理`);
        }
        
        console.log('\n' + '='.repeat(60));
    }

    // 執行完整驗證
    async validate() {
        this.log('INFO', '開始測試驗證...');
        
        this.validateDirectoryStructure();
        this.validateTestFiles();
        this.validateConfiguration();
        this.validateCoverageResults();
        
        const report = this.generateReport();
        
        // 如果有錯誤，退出程式時返回錯誤狀態
        process.exitCode = this.errors.length > 0 ? 1 : 0;
        
        return report;
    }
}

// 如果直接執行此檔案
if (import.meta.url === `file://${process.argv[1]}`) {
    const validator = new TestValidator();
    validator.validate().catch(error => {
        console.error('❌ 驗證過程中發生錯誤:', error);
        process.exit(1);
    });
}

export default TestValidator;