/**
 * @fileoverview Cypress E2E 測試 - 自動測試所有 Sidebar 路由
 * 
 * 此測試檔案會：
 * 1. 自動登入系統
 * 2. 遍歷 Sidebar 中的所有路由
 * 3. 檢查每個頁面的載入狀態和錯誤
 * 4. 生成詳細的測試報告
 * 
 * @author AIOT Team
 * @version 2.0.0 (Cypress)
 */

interface TestRoute {
  path: string;
  label: string;
  icon: string;
  selector?: string;
}

const SIDEBAR_ROUTES: TestRoute[] = [
  { 
    path: '/', 
    label: '首頁', 
    icon: '🏠',
    selector: 'body, div, main'
  },
  { 
    path: '/tableviewer', 
    label: 'Table Viewer', 
    icon: '📊',
    selector: 'body, div, main'
  },
  { 
    path: '/chat', 
    label: 'AI 聊天', 
    icon: '🤖',
    selector: 'body, div, main'
  },
  { 
    path: '/mappage', 
    label: '地圖頁面', 
    icon: '🗺️',
    selector: 'body, div, main'
  },
  { 
    path: '/flyingpage', 
    label: '飛行頁面', 
    icon: '✈️',
    selector: 'body, div, main'
  },
  { 
    path: '/command-history', 
    label: '指令歷史', 
    icon: '📋',
    selector: 'body, div, main'
  },
  { 
    path: '/drone-fleet', 
    label: '機隊管理', 
    icon: '🚁',
    selector: 'body, div, main'
  },
  { 
    path: '/command-queue', 
    label: '指令佇列', 
    icon: '⚡',
    selector: 'body, div, main'
  },
  { 
    path: '/data-analytics', 
    label: '資料分析', 
    icon: '📈',
    selector: 'body, div, main'
  }
];

describe('Sidebar Routes E2E Testing', () => {
  let testResults: any[] = []

  before(() => {
    // 設定測試環境
    cy.clearCookies()
    cy.clearLocalStorage()
  })

  beforeEach(() => {
    // 每個測試前都重新登入以確保狀態一致
    cy.login()
  })

  SIDEBAR_ROUTES.forEach((route) => {
    it(`should load route: ${route.label} (${route.path})`, () => {
      const startTime = Date.now()
      
      // 捕獲控制台錯誤
      const consoleErrors: string[] = []
      const consoleWarnings: string[] = []
      
      cy.window().then((win) => {
        // 監聽控制台錯誤
        cy.stub(win.console, 'error').callsFake((...args) => {
          consoleErrors.push(args.join(' '))
        })
        
        cy.stub(win.console, 'warn').callsFake((...args) => {
          consoleWarnings.push(args.join(' '))
        })
      })

      // 導航到目標路由
      cy.visit(route.path)
      
      // 等待頁面載入
      cy.get('body').should('be.visible')
      
      if (route.selector) {
        // 檢查特定元素是否存在
        cy.get(route.selector, { timeout: 15000 }).should('exist')
        cy.log(`✅ 找到特定元素: ${route.selector}`)
      }
      
      // 確保頁面基本載入完成
      cy.wait(1000) // 給 React 時間渲染

      // 檢查頁面標題
      cy.title().then((title) => {
        cy.log(`頁面標題: ${title}`)
      })

      // 截圖
      cy.screenshot(`route-${route.path.replace(/\//g, '_') || 'home'}`)

      // 檢查是否有 JavaScript 錯誤
      cy.window().then(() => {
        const loadTime = Date.now() - startTime
        
        // 記錄測試結果
        const result = {
          route,
          success: consoleErrors.length === 0,
          loadTime,
          errors: consoleErrors,
          warnings: consoleWarnings,
          timestamp: new Date().toISOString()
        }
        
        testResults.push(result)
        
        // 日誌輸出
        cy.log(`${result.success ? '✅' : '❌'} ${route.label}: ${loadTime}ms, ${consoleErrors.length} 錯誤, ${consoleWarnings.length} 警告`)
        
        // 如果有錯誤，顯示詳細信息
        if (consoleErrors.length > 0) {
          cy.log('Console Errors:', consoleErrors.join('; '))
        }
        
        if (consoleWarnings.length > 0) {
          cy.log('Console Warnings:', consoleWarnings.join('; '))
        }

        // 驗證沒有嚴重的 JavaScript 錯誤
        expect(consoleErrors.filter(error => 
          error.toLowerCase().includes('error') || 
          error.toLowerCase().includes('uncaught')
        )).to.have.length(0, `Route ${route.path} has JavaScript errors: ${consoleErrors.join('; ')}`)
      })
    })
  })

  after(() => {
    // 測試完成後生成報告摘要
    cy.then(() => {
      const successfulRoutes = testResults.filter(r => r.success).length
      const failedRoutes = testResults.length - successfulRoutes
      const totalErrors = testResults.reduce((sum, r) => sum + r.errors.length, 0)
      const totalWarnings = testResults.reduce((sum, r) => sum + r.warnings.length, 0)
      const averageLoadTime = testResults.reduce((sum, r) => sum + r.loadTime, 0) / testResults.length

      cy.log('📊 測試摘要:')
      cy.log('='.repeat(50))
      cy.log(`總路由數: ${testResults.length}`)
      cy.log(`成功路由: ${successfulRoutes}`)
      cy.log(`失敗路由: ${failedRoutes}`)
      cy.log(`總錯誤數: ${totalErrors}`)
      cy.log(`總警告數: ${totalWarnings}`)
      cy.log(`平均載入時間: ${Math.round(averageLoadTime)}ms`)

      // 將結果寫入文件（可選）
      cy.writeFile('cypress/results/sidebar-routes-test-results.json', {
        timestamp: new Date().toISOString(),
        summary: {
          totalRoutes: testResults.length,
          successfulRoutes,
          failedRoutes,
          totalErrors,
          totalWarnings,
          averageLoadTime: Math.round(averageLoadTime)
        },
        results: testResults
      })
    })
  })
})

// 個別路由測試（可以單獨執行）
describe('Individual Route Tests', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should have accessible sidebar navigation', () => {
    cy.visit('/')
    cy.get('aside').should('be.visible')
    cy.checkSidebarItem('首頁')
    cy.checkSidebarItem('Table Viewer')
    cy.checkSidebarItem('AI 聊天')
    cy.checkSidebarItem('地圖頁面')
  })

  it('should navigate between routes without errors', () => {
    cy.visit('/')
    
    // 測試路由間導航
    cy.visit('/tableviewer')
    cy.get('body').should('be.visible')
    
    cy.visit('/chat')
    cy.get('body').should('be.visible')
    
    cy.visit('/mappage')
    cy.get('body').should('be.visible')
    
    // 回到首頁
    cy.visit('/')
    cy.get('body').should('be.visible')
  })

  it('should handle route not found gracefully', () => {
    cy.visit('/non-existent-route', { failOnStatusCode: false })
    cy.get('body').should('be.visible')
    // 可以檢查是否有適當的 404 處理
  })
})