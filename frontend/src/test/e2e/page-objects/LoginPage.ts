/**
 * @fileoverview 登入頁面物件
 * @description 登入頁面的 Page Object Model 實現
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { WebDriver, By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

/**
 * 登入頁面物件類別
 * 
 * 封裝登入頁面的所有元素和操作，提供清晰的 API 用於測試
 */
export class LoginPage extends BasePage {
  
  // ==========================================================================
  // 元素定位器
  // ==========================================================================
  
  private readonly selectors = {
    // 表單容器
    loginContainer: '.loginContainer',
    loginCard: '.loginCard',
    
    // 標題和訊息
    title: 'h2',
    errorMessage: '.errorMessage',
    
    // 表單欄位
    usernameInput: '#username',
    passwordInput: '#password',
    rememberMeCheckbox: '#rememberMe',
    
    // 按鈕
    submitButton: 'button[type="submit"]',
    
    // 錯誤訊息
    usernameError: '.fieldError:has(+ #username), .fieldError[data-field="username"]',
    passwordError: '.fieldError:has(+ #password), .fieldError[data-field="password"]',
    
    // 載入狀態
    loadingSpinner: '.loading, .spinner',
    loadingText: '[data-testid="loading-text"]',
    
    // 示範資訊
    demoCredentials: '.demoCredentials',
  };

  constructor(driver: WebDriver, baseUrl?: string) {
    super(driver, baseUrl);
  }

  // ==========================================================================
  // 頁面導航
  // ==========================================================================
  
  /**
   * 導航到登入頁面
   */
  public async open(): Promise<void> {
    await this.navigateTo('/login');
    await this.waitForPageReady();
  }

  /**
   * 等待頁面準備就緒
   */
  public async waitForPageReady(): Promise<void> {
    await this.waitForElementVisible(this.selectors.loginContainer);
    await this.waitForElementVisible(this.selectors.usernameInput);
    await this.waitForElementVisible(this.selectors.passwordInput);
  }

  // ==========================================================================
  // 元素互動方法
  // ==========================================================================
  
  /**
   * 輸入用戶名
   * @param username - 用戶名
   */
  public async enterUsername(username: string): Promise<void> {
    await this.type(this.selectors.usernameInput, username);
  }

  /**
   * 輸入密碼
   * @param password - 密碼
   */
  public async enterPassword(password: string): Promise<void> {
    await this.type(this.selectors.passwordInput, password);
  }

  /**
   * 設置記住我選項
   * @param remember - 是否記住
   */
  public async setRememberMe(remember: boolean): Promise<void> {
    const checkbox = await this.waitForElementVisible(this.selectors.rememberMeCheckbox);
    const isChecked = await checkbox.isSelected();
    
    if (isChecked !== remember) {
      await this.click(this.selectors.rememberMeCheckbox);
    }
  }

  /**
   * 點擊登入按鈕
   */
  public async clickLoginButton(): Promise<void> {
    await this.click(this.selectors.submitButton);
  }

  /**
   * 執行完整的登入流程
   * @param username - 用戶名
   * @param password - 密碼
   * @param rememberMe - 是否記住我
   */
  public async login(username: string, password: string, rememberMe: boolean = false): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    
    if (rememberMe) {
      await this.setRememberMe(true);
    }
    
    await this.clickLoginButton();
  }

  /**
   * 使用預設管理員憑證登入
   */
  public async loginAsAdmin(): Promise<void> {
    await this.login('admin', 'admin', false);
  }

  // ==========================================================================
  // 表單驗證方法
  // ==========================================================================
  
  /**
   * 取得用戶名輸入值
   * @returns 用戶名
   */
  public async getUsernameValue(): Promise<string> {
    return await this.getAttribute(this.selectors.usernameInput, 'value') || '';
  }

  /**
   * 取得密碼輸入值
   * @returns 密碼
   */
  public async getPasswordValue(): Promise<string> {
    return await this.getAttribute(this.selectors.passwordInput, 'value') || '';
  }

  /**
   * 檢查記住我是否被選中
   * @returns 是否選中
   */
  public async isRememberMeChecked(): Promise<boolean> {
    const element = await this.findElement(this.selectors.rememberMeCheckbox);
    return await element.isSelected();
  }

  /**
   * 檢查登入按鈕是否被禁用
   * @returns 是否被禁用
   */
  public async isLoginButtonDisabled(): Promise<boolean> {
    const element = await this.findElement(this.selectors.submitButton);
    return !(await element.isEnabled());
  }

  // ==========================================================================
  // 錯誤和狀態檢查方法
  // ==========================================================================
  
  /**
   * 取得頁面標題
   * @returns 標題文字
   */
  public async getTitle(): Promise<string> {
    return await this.getText(this.selectors.title);
  }

  /**
   * 取得通用錯誤訊息
   * @returns 錯誤訊息
   */
  public async getErrorMessage(): Promise<string | null> {
    if (await this.isElementVisible(this.selectors.errorMessage)) {
      return await this.getText(this.selectors.errorMessage);
    }
    return null;
  }

  /**
   * 取得用戶名欄位錯誤訊息
   * @returns 錯誤訊息
   */
  public async getUsernameError(): Promise<string | null> {
    // 尋找用戶名相關的錯誤訊息
    const errorElements = await this.findElements('.fieldError');
    
    for (const element of errorElements) {
      const text = await element.getText();
      if (text.toLowerCase().includes('username') || text.includes('用戶名') || text.includes('Username is required')) {
        return text;
      }
    }
    return null;
  }

  /**
   * 取得密碼欄位錯誤訊息
   * @returns 錯誤訊息
   */
  public async getPasswordError(): Promise<string | null> {
    // 尋找密碼相關的錯誤訊息
    const errorElements = await this.findElements('.fieldError');
    
    for (const element of errorElements) {
      const text = await element.getText();
      if (text.toLowerCase().includes('password') || text.includes('密碼') || text.includes('Password is required')) {
        return text;
      }
    }
    return null;
  }

  /**
   * 檢查是否有載入狀態
   * @returns 是否正在載入
   */
  public async isLoading(): Promise<boolean> {
    // 檢查載入頁面
    if (await this.isElementVisible('[data-testid="loading"]')) {
      return true;
    }
    
    // 檢查按鈕載入狀態
    const buttonText = await this.getText(this.selectors.submitButton);
    return buttonText.includes('Logging in') || buttonText.includes('載入中') || buttonText.includes('Loading');
  }

  /**
   * 等待載入完成
   * @param timeout - 超時時間
   */
  public async waitForLoadingComplete(timeout: number = 10000): Promise<void> {
    // 等待載入頁面消失
    try {
      await this.waitForElementNotVisible('[data-testid="loading"]', timeout);
    } catch {
      // 如果載入頁面不存在，繼續檢查其他載入狀態
    }
    
    // 等待按鈕恢復正常狀態
    await this.driver.wait(async () => {
      const buttonText = await this.getText(this.selectors.submitButton);
      return !buttonText.includes('Logging in') && !buttonText.includes('載入中') && !buttonText.includes('Loading');
    }, timeout);
  }

  // ==========================================================================
  // 驗證方法
  // ==========================================================================
  
  /**
   * 驗證登入頁面已正確載入
   * @returns 是否正確載入
   */
  public async isPageLoaded(): Promise<boolean> {
    try {
      await this.waitForElementVisible(this.selectors.loginContainer, 5000);
      await this.waitForElementVisible(this.selectors.usernameInput, 1000);
      await this.waitForElementVisible(this.selectors.passwordInput, 1000);
      await this.waitForElementVisible(this.selectors.submitButton, 1000);
      
      const title = await this.getTitle();
      return title.toLowerCase().includes('login') || title.includes('登入');
    } catch {
      return false;
    }
  }

  /**
   * 驗證是否已成功登入（透過重定向檢查）
   * @param timeout - 超時時間
   * @returns 是否成功登入
   */
  public async isLoginSuccessful(timeout: number = 10000): Promise<boolean> {
    try {
      // 等待重定向
      await this.driver.wait(async () => {
        const currentUrl = await this.getCurrentUrl();
        return !currentUrl.includes('/login');
      }, timeout);
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 取得示範憑證資訊
   * @returns 示範憑證文字
   */
  public async getDemoCredentials(): Promise<string> {
    if (await this.isElementVisible(this.selectors.demoCredentials)) {
      return await this.getText(this.selectors.demoCredentials);
    }
    return '';
  }
}