// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
// ***********************************************************

import './commands'

// 設定默認選項
Cypress.config('defaultCommandTimeout', 10000)
Cypress.config('requestTimeout', 10000)
Cypress.config('responseTimeout', 10000)

// 全域錯誤處理
Cypress.on('uncaught:exception', (err, runnable) => {
  // 返回 false 以防止 Cypress 因未捕獲的異常而失敗
  // 可以根據具體錯誤類型決定是否忽略
  console.error('Uncaught exception:', err)
  return false
})

// 全域設定
beforeEach(() => {
  // 每個測試前的通用設定
  cy.viewport(1280, 720)
})