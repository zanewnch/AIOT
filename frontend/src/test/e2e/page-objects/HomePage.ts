/**
 * @fileoverview 首頁頁面物件
 * @description 首頁的 Page Object Model 實現
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { WebDriver, By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

/**
 * 首頁頁面物件類別
 * 
 * 封裝首頁的所有元素和操作，提供清晰的 API 用於測試
 */
export class HomePage extends BasePage {
  
  // ==========================================================================
  // 元素定位器
  // ==========================================================================
  
  private readonly selectors = {
    // 導航欄
    navbar: '.navbar, nav',
    sidebarToggle: '.sidebar-toggle, [data-testid="sidebar-toggle"]',
    userMenu: '.user-menu, [data-testid="user-menu"]',
    logoutButton: '.logout-button, [data-testid="logout-button"]',
    
    // 側邊欄
    sidebar: '.sidebar, [data-testid="sidebar"]',
    sidebarLinks: '.sidebar a, [data-testid="sidebar"] a',
    
    // 主要內容區域
    mainContent: '.main-content, main, [data-testid="main-content"]',
    welcomeMessage: '.welcome-message, [data-testid="welcome-message"]',
    
    // 導航連結
    navLinks: {
      home: 'a[href="/"], a[href="#/"]',
      flying: 'a[href="/flying"]',
      map: 'a[href="/map"]',
      droneFleet: 'a[href="/drone-fleet"]',
      commandHistory: 'a[href="/command-history"]',
      commandQueue: 'a[href="/command-queue"]',
      dataAnalytics: 'a[href="/data-analytics"]',
      chat: 'a[href="/chat"]',
      swagger: 'a[href="/swagger"]',
    },
    
    // 主題切換
    themeToggle: '.theme-toggle, [data-testid="theme-toggle"]',
    
    // 載入狀態
    loadingSpinner: '.loading, .spinner, [data-testid="loading"]',
    
    // 錯誤訊息
    errorMessage: '.error-message, [data-testid="error-message"]',
    
    // 頁面標題
    pageTitle: 'h1, .page-title, [data-testid="page-title"]',
  };

  constructor(driver: WebDriver, baseUrl?: string) {
    super(driver, baseUrl);
  }

  // ==========================================================================
  // 頁面導航
  // ==========================================================================
  
  /**
   * 導航到首頁
   */
  public async open(): Promise<void> {
    await this.navigateTo('/');
    await this.waitForPageReady();
  }

  /**
   * 等待頁面準備就緒
   */
  public async waitForPageReady(): Promise<void> {
    await this.waitForElementVisible(this.selectors.mainContent);
  }

  // ==========================================================================
  // 導航欄操作
  // ==========================================================================
  
  /**
   * 檢查導航欄是否可見
   * @returns 是否可見
   */
  public async isNavbarVisible(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.navbar);
  }

  /**
   * 點擊用戶選單
   */
  public async clickUserMenu(): Promise<void> {
    await this.click(this.selectors.userMenu);
  }

  /**
   * 點擊登出按鈕
   */
  public async clickLogout(): Promise<void> {
    // 如果登出按鈕在用戶選單內，先打開選單
    if (!await this.isElementVisible(this.selectors.logoutButton)) {
      await this.clickUserMenu();
      await this.waitForElementVisible(this.selectors.logoutButton, 2000);
    }
    
    await this.click(this.selectors.logoutButton);
  }

  /**
   * 切換主題
   */
  public async toggleTheme(): Promise<void> {
    if (await this.isElementVisible(this.selectors.themeToggle)) {
      await this.click(this.selectors.themeToggle);
    }
  }

  // ==========================================================================
  // 側邊欄操作
  // ==========================================================================
  
  /**
   * 切換側邊欄顯示/隱藏
   */
  public async toggleSidebar(): Promise<void> {
    if (await this.isElementVisible(this.selectors.sidebarToggle)) {
      await this.click(this.selectors.sidebarToggle);
    }
  }

  /**
   * 檢查側邊欄是否可見
   * @returns 是否可見
   */
  public async isSidebarVisible(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.sidebar);
  }

  /**
   * 取得側邊欄連結列表
   * @returns 連結文字陣列
   */
  public async getSidebarLinks(): Promise<string[]> {
    const elements = await this.findElements(this.selectors.sidebarLinks);
    const links: string[] = [];
    
    for (const element of elements) {
      const text = await element.getText();
      if (text.trim()) {
        links.push(text.trim());
      }
    }
    
    return links;
  }

  // ==========================================================================
  // 頁面導航方法
  // ==========================================================================
  
  /**
   * 導航到飛行頁面
   */
  public async navigateToFlying(): Promise<void> {
    await this.click(this.selectors.navLinks.flying);
    await this.waitForPageLoad();
  }

  /**
   * 導航到地圖頁面
   */
  public async navigateToMap(): Promise<void> {
    await this.click(this.selectors.navLinks.map);
    await this.waitForPageLoad();
  }

  /**
   * 導航到無人機群頁面
   */
  public async navigateToDroneFleet(): Promise<void> {
    await this.click(this.selectors.navLinks.droneFleet);
    await this.waitForPageLoad();
  }

  /**
   * 導航到命令歷史頁面
   */
  public async navigateToCommandHistory(): Promise<void> {
    await this.click(this.selectors.navLinks.commandHistory);
    await this.waitForPageLoad();
  }

  /**
   * 導航到命令佇列頁面
   */
  public async navigateToCommandQueue(): Promise<void> {
    await this.click(this.selectors.navLinks.commandQueue);
    await this.waitForPageLoad();
  }

  /**
   * 導航到數據分析頁面
   */
  public async navigateToDataAnalytics(): Promise<void> {
    await this.click(this.selectors.navLinks.dataAnalytics);
    await this.waitForPageLoad();
  }

  /**
   * 導航到聊天頁面
   */
  public async navigateToChat(): Promise<void> {
    await this.click(this.selectors.navLinks.chat);
    await this.waitForPageLoad();
  }

  /**
   * 導航到 Swagger 文檔頁面
   */
  public async navigateToSwagger(): Promise<void> {
    await this.click(this.selectors.navLinks.swagger);
    await this.waitForPageLoad();
  }

  // ==========================================================================
  // 內容驗證方法
  // ==========================================================================
  
  /**
   * 取得歡迎訊息
   * @returns 歡迎訊息文字
   */
  public async getWelcomeMessage(): Promise<string | null> {
    if (await this.isElementVisible(this.selectors.welcomeMessage)) {
      return await this.getText(this.selectors.welcomeMessage);
    }
    return null;
  }

  /**
   * 取得頁面標題
   * @returns 頁面標題
   */
  public async getPageTitle(): Promise<string> {
    if (await this.isElementVisible(this.selectors.pageTitle)) {
      return await this.getText(this.selectors.pageTitle);
    }
    return await super.getPageTitle(); // 回退到 HTML title
  }

  /**
   * 檢查是否有錯誤訊息
   * @returns 錯誤訊息或 null
   */
  public async getErrorMessage(): Promise<string | null> {
    if (await this.isElementVisible(this.selectors.errorMessage)) {
      return await this.getText(this.selectors.errorMessage);
    }
    return null;
  }

  /**
   * 檢查頁面是否正在載入
   * @returns 是否正在載入
   */
  public async isLoading(): Promise<boolean> {
    return await this.isElementVisible(this.selectors.loadingSpinner);
  }

  /**
   * 等待載入完成
   * @param timeout - 超時時間
   */
  public async waitForLoadingComplete(timeout: number = 10000): Promise<void> {
    if (await this.isLoading()) {
      await this.waitForElementNotVisible(this.selectors.loadingSpinner, timeout);
    }
  }

  // ==========================================================================
  // 驗證方法
  // ==========================================================================
  
  /**
   * 驗證首頁已正確載入
   * @returns 是否正確載入
   */
  public async isPageLoaded(): Promise<boolean> {
    try {
      await this.waitForElementVisible(this.selectors.mainContent, 5000);
      
      // 檢查 URL 是否正確
      const currentUrl = await this.getCurrentUrl();
      const isCorrectUrl = currentUrl.endsWith('/') || currentUrl.includes('/home');
      
      return isCorrectUrl;
    } catch {
      return false;
    }
  }

  /**
   * 驗證用戶是否已登入（透過檢查認證相關元素）
   * @returns 是否已登入
   */
  public async isUserLoggedIn(): Promise<boolean> {
    // 檢查是否存在需要認證才能看到的元素
    return await this.isNavbarVisible() && await this.isElementVisible(this.selectors.mainContent);
  }

  /**
   * 取得當前頁面的所有可用導航連結
   * @returns 連結資訊陣列
   */
  public async getAvailableNavLinks(): Promise<Array<{text: string, href: string}>> {
    const links: Array<{text: string, href: string}> = [];
    
    // 檢查每個導航連結
    for (const [name, selector] of Object.entries(this.selectors.navLinks)) {
      if (await this.isElementVisible(selector)) {
        const element = await this.findElement(selector);
        const text = await element.getText();
        const href = await element.getAttribute('href') || '';
        
        if (text.trim()) {
          links.push({ text: text.trim(), href });
        }
      }
    }
    
    return links;
  }

  /**
   * 驗證所有基本導航元素是否存在
   * @returns 是否存在所有基本元素
   */
  public async hasBasicNavigationElements(): Promise<boolean> {
    const hasNavbar = await this.isNavbarVisible();
    const hasMainContent = await this.isElementVisible(this.selectors.mainContent);
    
    return hasNavbar && hasMainContent;
  }
}