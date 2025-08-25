/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * 登入指令
       */
      login(username?: string, password?: string): Chainable<void>
      
      /**
       * 登出指令
       */
      logout(): Chainable<void>
      
      /**
       * 等待 API 回應
       */
      waitForApi(alias: string, timeout?: number): Chainable<void>
      
      /**
       * 檢查側邊欄項目
       */
      checkSidebarItem(itemText: string): Chainable<void>
    }
  }
}

// 自定義登入指令
Cypress.Commands.add('login', (username = 'admin', password = 'admin') => {
  cy.session([username, password], () => {
    cy.visit('/login')
    cy.get('#username').type(username)
    cy.get('#password').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.contain', '/login')
  })
})

// 自定義登出指令
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('contain', '/login')
})

// 等待 API 回應
Cypress.Commands.add('waitForApi', (alias: string, timeout = 10000) => {
  cy.wait(alias, { timeout })
})

// 檢查側邊欄項目
Cypress.Commands.add('checkSidebarItem', (itemText: string) => {
  cy.get('aside').should('be.visible')
  cy.get('aside').should('contain.text', itemText)
})

export {}