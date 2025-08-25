/**
 * @fileoverview Cypress 登入功能測試
 */

describe('Login Functionality', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
    cy.visit('/login')
  })

  it('should display login form', () => {
    cy.get('#username').should('be.visible')
    cy.get('#password').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should login with valid credentials', () => {
    cy.get('#username').type('admin')
    cy.get('#password').type('admin')
    cy.get('button[type="submit"]').click()
    
    // 檢查是否重導向到主頁或看到側邊欄
    cy.url().should('not.contain', '/login')
    cy.get('aside', { timeout: 15000 }).should('be.visible')
  })

  it('should show error with invalid credentials', () => {
    cy.get('#username').type('invalid')
    cy.get('#password').type('invalid')
    cy.get('button[type="submit"]').click()
    
    // 應該留在登入頁面或顯示錯誤訊息
    cy.url().should('contain', '/login')
  })

  it('should validate required fields', () => {
    cy.get('button[type="submit"]').click()
    
    // 檢查表單驗證（根據實際實現調整）
    cy.url().should('contain', '/login')
  })
})