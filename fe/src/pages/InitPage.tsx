/**
 * @fileoverview 系統初始化頁面組件
 *
 * 此組件提供了應用程式的系統初始化功能，包括：
 * - RBAC 權限管理系統示例初始化
 * - Redux Toolkit 示例數據初始化
 * - 管理員用戶創建功能
 * - 壓力測試數據生成（附帶進度追蹤）
 *
 * 組件使用了自定義 Hook 來管理進度追蹤和 SSE 連接，
 * 並通過 useInit Hook 與後端 API 進行交互。
 *
 * @author AI-IOT Development Team
 * @version 1.0.0
 */

import { useState } from "react";
import { Button } from "../components/Button";
import { useInitQuery } from "../hooks/useInitQuery";
import { useSSEQuery } from "../hooks/useSSEQuery";
import { ProgressTracker } from "../components/ProgressTracker/ProgressTracker";
import styles from "../styles/InitPage.module.scss";
import { Link } from 'react-router-dom';

/**
 * 載入狀態介面定義
 * 用於管理各個功能按鈕的載入狀態
 */
interface LoadingStates {
  /** RBAC 示例初始化載入狀態 */
  rbac: boolean;
  /** RTK 示例初始化載入狀態 */
  rtk: boolean;
  /** 管理員用戶創建載入狀態 */
  admin: boolean;
  /** 壓力測試數據生成載入狀態 */
  stress: boolean;
}

/**
 * 系統初始化組件
 *
 * 提供了系統初始化所需的各項功能，包括權限系統、示例數據、
 * 管理員用戶創建和壓力測試數據生成等功能。
 *
 * @returns {JSX.Element} 初始化頁面組件
 */
export const InitPage = () => {
  // 狀態管理：各個功能按鈕的載入狀態
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    rbac: false, // RBAC 示例初始化載入狀態
    rtk: false, // RTK 示例初始化載入狀態
    admin: false, // 管理員用戶創建載入狀態
    stress: false, // 壓力測試數據生成載入狀態
  });

  // 狀態管理：各個功能的消息顯示
  const [messages, setMessages] = useState<{ [key: string]: string }>({});

  // 使用自定義 Hook 進行進度追蹤（用於 SSE 連接）
  const sseQuery = useSSEQuery();
  const { progress, isTracking, error: sseError, startTracking, stopTracking } = sseQuery.progressTracking();

  // 使用初始化相關的 Hook
  const initQuery = useInitQuery();
  const { initRbacDemo, initRtkDemo, createAdminUser, createStressTestData } = initQuery.init();

  /**
   * 更新載入狀態的輔助函數
   */
  const updateLoadingState = (key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  };

  /**
   * 更新消息顯示的輔助函數
   */
  const updateMessage = (key: string, message: string) => {
    setMessages((prev) => ({ ...prev, [key]: message }));
  };

  /**
   * 處理 RBAC 示例初始化
   */
  const handleRbacDemo = async () => {
    updateLoadingState("rbac", true);
    updateMessage("rbac", "");

    try {
      const result = await initRbacDemo();

      if (result.ok) {
        updateMessage("rbac", "✅ RBAC demo data initialized successfully!");
      } else {
        updateMessage(
          "rbac",
          "⚠️ RBAC initialization failed. Check console for details."
        );
      }
    } catch (error) {
      console.error("RBAC initialization error:", error);
      updateMessage(
        "rbac",
        `❌ RBAC initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      updateLoadingState("rbac", false);
    }
  };

  /**
   * 處理 Redux Toolkit 示例初始化
   */
  const handleRtkDemo = async () => {
    updateLoadingState("rtk", true);
    updateMessage("rtk", "");

    try {
      const result = await initRtkDemo();

      if (result.ok) {
        updateMessage("rtk", "✅ RTK demo data initialized successfully!");
      } else {
        updateMessage(
          "rtk",
          "⚠️ RTK initialization failed. Check console for details."
        );
      }
    } catch (error) {
      console.error("RTK initialization error:", error);
      updateMessage(
        "rtk",
        `❌ RTK initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      updateLoadingState("rtk", false);
    }
  };

  /**
   * 處理管理員用戶創建
   */
  const handleCreateAdminUser = async () => {
    updateLoadingState("admin", true);
    updateMessage("admin", "");

    try {
      const result = await createAdminUser();

      if (result.ok) {
        updateMessage("admin", "✅ Admin user created successfully!");
      } else {
        updateMessage(
          "admin",
          "⚠️ Admin user creation failed. Check console for details."
        );
      }
    } catch (error) {
      console.error("Admin user creation error:", error);
      updateMessage(
        "admin",
        `❌ Admin user creation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      updateLoadingState("admin", false);
    }
  };

  /**
   * 處理壓力測試數據創建
   */
  const handleStressTestData = async () => {
    updateLoadingState("stress", true);
    updateMessage("stress", "");

    try {
      const result = await createStressTestData();

      if (result.ok) {
        updateMessage(
          "stress",
          `✅ Stress test data creation started! Task ID: ${result.taskId}`
        );
        startTracking(result.taskId);
      } else {
        updateMessage(
          "stress",
          "⚠️ Stress test data creation failed. Check console for details."
        );
      }
    } catch (error) {
      console.error("Stress test data creation error:", error);
      updateMessage(
        "stress",
        `❌ Stress test data creation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      updateLoadingState("stress", false);
    }
  };

  /**
   * 渲染消息組件
   */
  const renderMessage = (key: string) => {
    const message = messages[key];
    if (!message) return null;

    const messageType = message.includes("✅")
      ? "success"
      : message.includes("⚠️")
      ? "warning"
      : "error";

    return (
      <div className={`${styles.message} ${styles[messageType]}`}>
        {message}
      </div>
    );
  };

  return (
    <div className={styles.initPage}>
      <div className={styles.header}>
        <h1>系統初始化</h1>
        <p>選擇需要初始化的功能模組</p>
      </div>

      <div className={styles.grid}>
        {/* RBAC 示例初始化按鈕區域 */}
        <div className={styles.section}>
          <Button
            onClick={handleRbacDemo}
            disabled={loadingStates.rbac}
            className={styles.button}
          >
            {loadingStates.rbac ? "Initializing..." : "Initialize RBAC Demo"}
          </Button>
          {renderMessage("rbac")}
        </div>

        {/* RTK 示例初始化按鈕區域 */}
        <div className={styles.section}>
          <Button
            onClick={handleRtkDemo}
            disabled={loadingStates.rtk}
            className={styles.button}
          >
            {loadingStates.rtk ? "Initializing..." : "Initialize RTK Demo"}
          </Button>
          {renderMessage("rtk")}
        </div>

        {/* 管理員用戶創建按鈕區域 */}
        <div className={styles.section}>
          <Button
            onClick={handleCreateAdminUser}
            disabled={loadingStates.admin}
            className={styles.button}
          >
            {loadingStates.admin ? "Creating..." : "Create Admin User"}
          </Button>
          {renderMessage("admin")}
        </div>

        {/* 壓力測試數據生成按鈕區域 */}
        <div className={styles.section}>
          <Button
            onClick={handleStressTestData}
            disabled={loadingStates.stress || isTracking}
            className={styles.button}
          >
            {loadingStates.stress
              ? "Starting..."
              : isTracking
              ? "Tracking Progress..."
              : "Create Stress Test Data"}
          </Button>
          {renderMessage("stress")}
        </div>
        <div className={styles.section}>
          <div className={styles.linkContainer}>
            <Link to="/content" className={styles.navLink}>
              <span className={styles.linkIcon}>🏠</span>
              <span className={styles.linkText}>前往內容頁面</span>
              <span className={styles.linkArrow}>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* SSE 進度追蹤組件 */}
      <ProgressTracker
        progress={progress}
        isTracking={isTracking}
        error={sseError}
        onCancel={stopTracking}
      />
    </div>
  );
};
