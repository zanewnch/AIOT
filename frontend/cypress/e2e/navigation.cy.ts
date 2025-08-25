/**
 * @fileoverview Cypress 導航功能測試
 */

describe('Navigation Tests', () => {
  beforeEach(() => {
    cy.login()
  })

  it('should display sidebar navigation', () => {
    cy.visit('/')
    cy.get('aside').should('be.visible')
  })

  it('should navigate to different pages via sidebar', () => {
    cy.visit('/')
    
    // 測試側邊欄導航項目
    const navigationTests = [
      { selector: 'a[href="/tableviewer"], [data-testid="nav-tableviewer"]', path: '/tableviewer' },
      { selector: 'a[href="/chat"], [data-testid="nav-chat"]', path: '/chat' },
      { selector: 'a[href="/mappage"], [data-testid="nav-mappage"]', path: '/mappage' },
      { selector: 'a[href="/"], [data-testid="nav-home"]', path: '/' }
    ]

    navigationTests.forEach(({ selector, path }) => {
      cy.get(selector, { timeout: 10000 }).should('exist').then(($el) => {
        if ($el.length > 0) {
          cy.wrap($el).first().click()
          cy.url().should('include', path)
          cy.get('body').should('be.visible')
        }
      })
    })
  })

  it('should maintain navigation state', () => {
    cy.visit('/')
    cy.get('aside').should('be.visible')
    
    cy.visit('/tableviewer')
    cy.get('aside').should('be.visible')
  })

  it('should handle browser back and forward', () => {
    cy.visit('/')
    cy.visit('/tableviewer')
    cy.visit('/chat')
    
    cy.go('back')
    cy.url().should('include', '/tableviewer')
    
    cy.go('forward')
    cy.url().should('include', '/chat')
  })
})