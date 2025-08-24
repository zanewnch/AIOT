/**
 * @fileoverview Selenium WebDriver 配置
 * @description 為 E2E 測試配置不同瀏覽器的 WebDriver
 * @author AIOT Development Team
 * @version 1.0.0
 */

import { Builder, WebDriver, Capabilities } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import firefox from 'selenium-webdriver/firefox.js';

// 瀏覽器類型定義
export type BrowserType = 'chrome' | 'firefox' | 'headless-chrome';

// 測試環境配置
export interface TestConfig {
  /** 基礎 URL */
  baseUrl: string;
  /** 預設等待時間（毫秒） */
  defaultTimeout: number;
  /** 隱式等待時間（毫秒） */
  implicitWait: number;
  /** 頁面載入超時時間（毫秒） */
  pageLoadTimeout: number;
  /** 瀏覽器視窗大小 */
  windowSize: {
    width: number;
    height: number;
  };
}

// 預設測試配置
export const defaultConfig: TestConfig = {
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  defaultTimeout: 10000,
  implicitWait: 10000,
  pageLoadTimeout: 30000,
  windowSize: {
    width: 1920,
    height: 1080,
  },
};

/**
 * 創建 Chrome WebDriver
 */
const createChromeDriver = (headless: boolean = false): WebDriver => {
  const options = new chrome.Options();
  
  if (headless) {
    options.addArguments('--headless=new');
  }
  
  // Chrome 配置選項
  options.addArguments([
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-features=TranslateUI',
    '--disable-default-apps',
    `--window-size=${defaultConfig.windowSize.width},${defaultConfig.windowSize.height}`,
  ]);

  // 設置偏好設定
  options.setUserPreferences({
    'profile.default_content_setting_values.notifications': 2, // 禁用通知
    'profile.managed_default_content_settings.images': 2, // 禁用圖片（可選，加速測試）
  });

  const driver = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  return driver;
};

/**
 * 創建 Firefox WebDriver
 */
const createFirefoxDriver = (headless: boolean = false): WebDriver => {
  const options = new firefox.Options();
  
  if (headless) {
    options.addArguments('--headless');
  }
  
  // Firefox 配置選項
  options.addArguments([
    `--width=${defaultConfig.windowSize.width}`,
    `--height=${defaultConfig.windowSize.height}`,
  ]);

  // 設置偏好設定
  options.setPreference('dom.webnotifications.enabled', false);
  options.setPreference('media.navigator.permission.disabled', true);

  const driver = new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build();

  return driver;
};

/**
 * 創建 WebDriver 實例
 * 
 * @param browserType - 瀏覽器類型
 * @returns WebDriver 實例
 */
export const createWebDriver = (browserType: BrowserType = 'headless-chrome'): WebDriver => {
  let driver: WebDriver;

  switch (browserType) {
    case 'chrome':
      driver = createChromeDriver(false);
      break;
    case 'firefox':
      driver = createFirefoxDriver(false);
      break;
    case 'headless-chrome':
    default:
      driver = createChromeDriver(true);
      break;
  }

  // 設置超時時間
  driver.manage().setTimeouts({
    implicit: defaultConfig.implicitWait,
    pageLoad: defaultConfig.pageLoadTimeout,
    script: defaultConfig.defaultTimeout,
  });

  return driver;
};

/**
 * WebDriver 管理器類別
 */
export class WebDriverManager {
  private driver: WebDriver | null = null;
  private config: TestConfig;

  constructor(config: TestConfig = defaultConfig) {
    this.config = config;
  }

  /**
   * 啟動 WebDriver
   */
  public async start(browserType: BrowserType = 'headless-chrome'): Promise<void> {
    if (this.driver) {
      await this.quit();
    }

    this.driver = createWebDriver(browserType);
    
    // 設置視窗大小
    await this.driver.manage().window().setRect({
      width: this.config.windowSize.width,
      height: this.config.windowSize.height,
    });
  }

  /**
   * 取得 WebDriver 實例
   */
  public getDriver(): WebDriver {
    if (!this.driver) {
      throw new Error('WebDriver 尚未啟動，請先呼叫 start() 方法');
    }
    return this.driver;
  }

  /**
   * 導航到指定 URL
   */
  public async navigateTo(path: string = ''): Promise<void> {
    const fullUrl = `${this.config.baseUrl}${path}`;
    await this.getDriver().get(fullUrl);
  }

  /**
   * 等待頁面載入完成
   */
  public async waitForPageLoad(): Promise<void> {
    await this.getDriver().executeScript('return document.readyState').then((readyState) => {
      if (readyState !== 'complete') {
        return this.getDriver().wait(() => 
          this.getDriver().executeScript('return document.readyState === "complete"'),
          this.config.pageLoadTimeout
        );
      }
    });
  }

  /**
   * 截圖
   */
  public async takeScreenshot(): Promise<string> {
    return await this.getDriver().takeScreenshot();
  }

  /**
   * 取得頁面標題
   */
  public async getPageTitle(): Promise<string> {
    return await this.getDriver().getTitle();
  }

  /**
   * 取得當前 URL
   */
  public async getCurrentUrl(): Promise<string> {
    return await this.getDriver().getCurrentUrl();
  }

  /**
   * 關閉 WebDriver
   */
  public async quit(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  /**
   * 取得配置
   */
  public getConfig(): TestConfig {
    return this.config;
  }
}

// 預設匯出
export default WebDriverManager;