import React from 'react';
import { Navbar, Sidebar } from '../components';
import styles from '../styles/homeview.module.scss';

export function HomeView() {
  return (
    <div className={styles.homeView}>
      <Navbar />

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Content Area */}
        <div className={styles.contentArea}>
          <div className={styles.breadcrumb}>
            <span>快速入門</span>
          </div>

          <div className={styles.contentHeader}>
            <h1>Claude Code 概覽</h1>
            <button className={styles.copyPageBtn}>
              📋 Copy page
            </button>
          </div>

          <div className={styles.contentBody}>
            <p className={styles.contentIntro}>
              了解 Claude Code，這個存在於您終端機中的代理編程工具，理解您的程式碼庫，並透過自然語言指令幫助您快速編程。
            </p>

            <p className={styles.contentDescription}>
              透過直接整合您的開發環境，Claude Code 簡化您的工作流程，無需額外的伺服器或複雜的設定。
            </p>

            <section className={styles.contentSection}>
              <h2>基本使用</h2>
              <p>要安裝 Claude Code，請使用 NPM：</p>
              
              <div className={styles.codeBlock}>
                <code>npm install -g @anthropic-ai/claude-code</code>
                <button className={styles.copyBtn}>📋</button>
              </div>

              <p>更詳細的安裝說明，請參閱<a href="#setup" className={styles.contentLink}>設定 Claude Code</a>。</p>

              <p>要執行 Claude Code，只需呼叫 <code className={styles.inlineCode}>claude</code> CLI：</p>

              <div className={styles.codeBlock}>
                <code>claude</code>
                <button className={styles.copyBtn}>📋</button>
              </div>

              <p>然後您可以直接從動式 Claude Code REPL 會話中提示 Claude。</p>
            </section>
          </div>
        </div>

        {/* Table of Contents */}
        <aside className={styles.toc}>
          <h3>On this page</h3>
          <nav className={styles.tocNav}>
            <a href="#basic-usage">基本使用</a>
            <a href="#why-choose">為什麼選擇 Claude Code？</a>
            <a href="#quickstart">加速開發</a>
            <a href="#security">安全性和隱私設計</a>
            <a href="#enterprise">企業整合</a>
            <a href="#next-steps">下一步</a>
            <a href="#resources">其他資源</a>
          </nav>
        </aside>
      </main>
    </div>
  );
}