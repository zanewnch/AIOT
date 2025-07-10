import React from 'react';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  return (
    <aside className={`${styles.sidebar} ${className || ''}`}>
      <div className={styles.sidebarSection}>
        <h3>Documentation</h3>
        <nav className={styles.sidebarNav}>
          <a href="#discord" className={styles.sidebarLink}>
            <span className={styles.sidebarIcon}>💬</span>
            Developer Discord
          </a>
          <a href="#support" className={styles.sidebarLink}>
            <span className={styles.sidebarIcon}>❓</span>
            Support
          </a>
        </nav>
      </div>

      <div className={styles.sidebarSection}>
        <h4>快速入門</h4>
        <nav className={styles.sidebarNav}>
          <a href="#overview" className={`${styles.sidebarLink} ${styles.active}`}>概覽</a>
          <a href="#setup" className={styles.sidebarLink}>設定</a>
          <a href="#quickstart" className={styles.sidebarLink}>快速入門</a>
          <a href="#memory" className={styles.sidebarLink}>記憶體管理</a>
          <a href="#workflow" className={styles.sidebarLink}>常見工作流程</a>
        </nav>
      </div>

      <div className={styles.sidebarSection}>
        <h4>使用 Claude 搭建</h4>
        <nav className={styles.sidebarNav}>
          <a href="#ide" className={styles.sidebarLink}>將 Claude Code 新增到您的 IDE</a>
          <a href="#mcp" className={styles.sidebarLink}>模型上下文協議 (MCP)</a>
          <a href="#actions" className={styles.sidebarLink}>GitHub Actions</a>
          <a href="#sdk" className={styles.sidebarLink}>Claude Code SDK</a>
          <a href="#troubleshoot" className={styles.sidebarLink}>疑難排解</a>
        </nav>
      </div>

      <div className={styles.sidebarSection}>
        <h4>部署</h4>
      </div>
    </aside>
  );
}; 