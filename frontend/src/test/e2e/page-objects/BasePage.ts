/**
 * @fileoverview 基礎頁面物件類別
 * @description 提供所有頁面物件的共同功能和工具方法
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { WebDriver, By, WebElement, until, Key } from 'selenium-webdriver';
import { defaultConfig } from '../selenium.config';

/**
 * 元素定位器類型
 */
export type Locator = By | string;

/**
 * 基礎頁面物件類別
 * 
 * 提供所有頁面物件的共同功能，包括元素查找、等待、互動等
 */
export abstract class BasePage {
  protected driver: WebDriver;
  protected baseUrl: string;
  protected defaultTimeout: number;

  constructor(driver: WebDriver, baseUrl: string = defaultConfig.baseUrl) {
    this.driver = driver;
    this.baseUrl = baseUrl;
    this.defaultTimeout = defaultConfig.defaultTimeout;
  }

  /**
   * 導航到指定頁面
   * @param path - 相對路徑
   */
  public async navigateTo(path: string = ''): Promise<void> {
    const fullUrl = `${this.baseUrl}${path}`;
    await this.driver.get(fullUrl);
    await this.waitForPageLoad();
  }

  /**
   * 等待頁面載入完成
   */
  public async waitForPageLoad(): Promise<void> {
    await this.driver.wait(
      () => this.driver.executeScript('return document.readyState === "complete"'),
      this.defaultTimeout
    );
  }

  /**
   * 查找元素
   * @param locator - 元素定位器
   * @returns WebElement
   */
  public async findElement(locator: Locator): Promise<WebElement> {
    const by = typeof locator === 'string' ? By.css(locator) : locator;
    return await this.driver.findElement(by);
  }

  /**
   * 查找多個元素
   * @param locator - 元素定位器
   * @returns WebElement[]
   */
  public async findElements(locator: Locator): Promise<WebElement[]> {
    const by = typeof locator === 'string' ? By.css(locator) : locator;
    return await this.driver.findElements(by);
  }

  /**
   * 等待元素可見
   * @param locator - 元素定位器
   * @param timeout - 超時時間
   * @returns WebElement
   */
  public async waitForElementVisible(locator: Locator, timeout: number = this.defaultTimeout): Promise<WebElement> {
    const by = typeof locator === 'string' ? By.css(locator) : locator;
    return await this.driver.wait(until.elementLocated(by), timeout);
  }

  /**
   * 等待元素可點擊
   * @param locator - 元素定位器
   * @param timeout - 超時時間
   * @returns WebElement
   */
  public async waitForElementClickable(locator: Locator, timeout: number = this.defaultTimeout): Promise<WebElement> {
    const element = await this.waitForElementVisible(locator, timeout);
    await this.driver.wait(until.elementIsEnabled(element), timeout);
    return element;
  }

  /**
   * 等待元素包含指定文字
   * @param locator - 元素定位器
   * @param text - 期望的文字
   * @param timeout - 超時時間
   */
  public async waitForElementText(locator: Locator, text: string, timeout: number = this.defaultTimeout): Promise<void> {
    const by = typeof locator === 'string' ? By.css(locator) : locator;
    await this.driver.wait(until.elementTextContains(this.driver.findElement(by), text), timeout);
  }

  /**
   * 點擊元素
   * @param locator - 元素定位器
   */
  public async click(locator: Locator): Promise<void> {
    const element = await this.waitForElementClickable(locator);
    await element.click();
  }

  /**
   * 輸入文字
   * @param locator - 元素定位器
   * @param text - 輸入的文字
   * @param clear - 是否先清除現有內容
   */
  public async type(locator: Locator, text: string, clear: boolean = true): Promise<void> {
    const element = await this.waitForElementVisible(locator);
    if (clear) {
      await element.clear();
    }
    await element.sendKeys(text);
  }

  /**
   * 取得元素文字
   * @param locator - 元素定位器
   * @returns 元素的文字內容
   */
  public async getText(locator: Locator): Promise<string> {
    const element = await this.waitForElementVisible(locator);
    return await element.getText();
  }

  /**
   * 取得元素屬性值
   * @param locator - 元素定位器
   * @param attribute - 屬性名稱
   * @returns 屬性值
   */
  public async getAttribute(locator: Locator, attribute: string): Promise<string | null> {
    const element = await this.waitForElementVisible(locator);
    return await element.getAttribute(attribute);
  }

  /**
   * 檢查元素是否存在
   * @param locator - 元素定位器
   * @returns 是否存在
   */
  public async isElementPresent(locator: Locator): Promise<boolean> {
    try {
      const by = typeof locator === 'string' ? By.css(locator) : locator;
      await this.driver.findElement(by);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 檢查元素是否可見
   * @param locator - 元素定位器
   * @returns 是否可見
   */
  public async isElementVisible(locator: Locator): Promise<boolean> {
    try {
      const element = await this.findElement(locator);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * 檢查元素是否啟用
   * @param locator - 元素定位器
   * @returns 是否啟用
   */
  public async isElementEnabled(locator: Locator): Promise<boolean> {
    try {
      const element = await this.findElement(locator);
      return await element.isEnabled();
    } catch {
      return false;
    }
  }

  /**
   * 等待元素消失
   * @param locator - 元素定位器
   * @param timeout - 超時時間
   */
  public async waitForElementNotVisible(locator: Locator, timeout: number = this.defaultTimeout): Promise<void> {
    const by = typeof locator === 'string' ? By.css(locator) : locator;
    await this.driver.wait(until.elementIsNotVisible(this.driver.findElement(by)), timeout);
  }

  /**
   * 滾動到元素
   * @param locator - 元素定位器
   */
  public async scrollToElement(locator: Locator): Promise<void> {
    const element = await this.waitForElementVisible(locator);
    await this.driver.executeScript('arguments[0].scrollIntoView({block: "center"});', element);
  }

  /**
   * 按下鍵盤按鍵
   * @param locator - 元素定位器
   * @param key - 按鍵
   */
  public async sendKey(locator: Locator, key: string): Promise<void> {
    const element = await this.waitForElementVisible(locator);
    await element.sendKeys(key);
  }

  /**
   * 按下 Enter 鍵
   * @param locator - 元素定位器
   */
  public async pressEnter(locator: Locator): Promise<void> {
    await this.sendKey(locator, Key.ENTER);
  }

  /**
   * 按下 Tab 鍵
   * @param locator - 元素定位器
   */
  public async pressTab(locator: Locator): Promise<void> {
    await this.sendKey(locator, Key.TAB);
  }

  /**
   * 執行 JavaScript
   * @param script - JavaScript 代碼
   * @param args - 參數
   * @returns 執行結果
   */
  public async executeScript(script: string, ...args: any[]): Promise<any> {
    return await this.driver.executeScript(script, ...args);
  }

  /**
   * 等待指定時間
   * @param milliseconds - 等待時間（毫秒）
   */
  public async sleep(milliseconds: number): Promise<void> {
    await this.driver.sleep(milliseconds);
  }

  /**
   * 取得頁面標題
   * @returns 頁面標題
   */
  public async getPageTitle(): Promise<string> {
    return await this.driver.getTitle();
  }

  /**
   * 取得當前 URL
   * @returns 當前 URL
   */
  public async getCurrentUrl(): Promise<string> {
    return await this.driver.getCurrentUrl();
  }

  /**
   * 重新整理頁面
   */
  public async refresh(): Promise<void> {
    await this.driver.navigate().refresh();
    await this.waitForPageLoad();
  }

  /**
   * 回到上一頁
   */
  public async goBack(): Promise<void> {
    await this.driver.navigate().back();
    await this.waitForPageLoad();
  }

  /**
   * 前往下一頁
   */
  public async goForward(): Promise<void> {
    await this.driver.navigate().forward();
    await this.waitForPageLoad();
  }

  /**
   * 截圖
   * @returns Base64 編碼的截圖資料
   */
  public async takeScreenshot(): Promise<string> {
    return await this.driver.takeScreenshot();
  }

  /**
   * 設置視窗大小
   * @param width - 寬度
   * @param height - 高度
   */
  public async setWindowSize(width: number, height: number): Promise<void> {
    await this.driver.manage().window().setRect({ width, height });
  }

  /**
   * 最大化視窗
   */
  public async maximizeWindow(): Promise<void> {
    await this.driver.manage().window().maximize();
  }
}