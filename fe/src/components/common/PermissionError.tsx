/**
 * @fileoverview 權限錯誤顯示組件
 * 
 * 專門處理權限拒絕錯誤的顯示
 * 
 * @author AIOT Development Team
 * @since 2024-01-01
 */

import React from 'react';
import styles from './PermissionError.module.scss';

interface PermissionErrorProps {
  /** 錯誤訊息 */
  message: string;
  /** 所需權限 */
  requiredPermission?: string;
  /** 重試函數 */
  onRetry?: () => void;
}

/**
 * 權限錯誤顯示組件
 */
export const PermissionError: React.FC<PermissionErrorProps> = ({
  message,
  requiredPermission,
  onRetry
}) => {
  return (
    <div className={styles.permissionError}>
      <div className={styles.errorIcon}>🔒</div>
      <div className={styles.errorContent}>
        <h3>權限不足</h3>
        <p>{message}</p>
        {requiredPermission && (
          <p className={styles.requiredPermission}>
            所需權限: <code>{requiredPermission}</code>
          </p>
        )}
        <div className={styles.actions}>
          {onRetry && (
            <button onClick={onRetry} className={styles.retryButton}>
              重試
            </button>
          )}
          <p className={styles.helpText}>
            請聯絡系統管理員獲取相應權限
          </p>
        </div>
      </div>
    </div>
  );
};

export default PermissionError;