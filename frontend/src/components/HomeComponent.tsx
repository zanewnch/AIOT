/**
 * @fileoverview 首頁主要內容組件
 *
 * 此組件提供了應用程式的主要功能入口點，包括：
 * - 系統初始化功能
 * - API 文檔連結
 * - 用戶管理功能
 * - 系統監控功能
 *
 * @author AI-IOT Development Team
 * @version 2.0.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/HomeContent.module.scss';

/**
 * 首頁主要內容組件
 *
 * 提供現代化的應用程式主頁，包含功能導航卡片和系統統計
 *
 * @returns {JSX.Element} 美化後的首頁內容組件
 */
export const HomeContent: React.FC = () => {
    return (
        <div className={styles.homeContainer}>
            <div className={styles.contentWrapper}>
                {/* 頁面標題區域 */}
                <header className={styles.header}>
                    <h1 className={styles.title}>AI-IOT 管理系統</h1>
                    <p className={styles.subtitle}>
                        智能物聯網一站式管理平台 · 高效 · 安全 · 可靠
                    </p>
                </header>

                {/* 功能卡片網格 */}
                <div className={styles.featuresGrid}>
                    {/* 系統初始化卡片 */}
                    <div className={styles.featureCard}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>🚀</span>
                            <h2 className={styles.cardTitle}>系統初始化</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            快速初始化系統組件、創建管理員用戶、配置基礎權限和角色設定
                        </p>
                        <div className={styles.cardAction}>
                            <Link
                                to="/init"
                                className={`${styles.actionButton} ${styles.primary}`}
                            >
                                開始初始化
                            </Link>
                        </div>
                    </div>

                    {/* API 文檔卡片 */}
                    <div className={styles.featureCard}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>📚</span>
                            <h2 className={styles.cardTitle}>API 文檔</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            查看完整的 REST API 文檔、使用說明和範例代碼，支援開發者快速上手
                        </p>
                        <div className={styles.cardAction}>
                            <Link
                                to="/api-docs"
                                className={`${styles.actionButton} ${styles.secondary}`}
                            >
                                查看文檔
                            </Link>
                        </div>
                    </div>

                    {/* 用戶管理卡片 */}
                    <div className={styles.featureCard}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>👥</span>
                            <h2 className={styles.cardTitle}>用戶管理</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            管理系統用戶、分配角色權限、查看用戶活動記錄和安全設定
                        </p>
                        <div className={styles.cardAction}>
                            <Link
                                to="/users"
                                className={`${styles.actionButton} ${styles.accent}`}
                            >
                                管理用戶
                            </Link>
                        </div>
                    </div>

                    {/* 系統監控卡片 */}
                    <div className={styles.featureCard}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIcon}>📊</span>
                            <h2 className={styles.cardTitle}>系統監控</h2>
                        </div>
                        <p className={styles.cardDescription}>
                            實時監控系統狀態、查看性能指標、日誌分析和告警設定
                        </p>
                        <div className={styles.cardAction}>
                            <Link
                                to="/monitoring"
                                className={`${styles.actionButton} ${styles.danger}`}
                            >
                                查看監控
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 系統統計區域 */}
                <section className={styles.statsSection}>
                    <h3 className={styles.statsTitle}>系統概覽</h3>
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>24/7</div>
                            <div className={styles.statLabel}>服務運行</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>99.9%</div>
                            <div className={styles.statLabel}>系統可用性</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>API</div>
                            <div className={styles.statLabel}>RESTful 接口</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>RBAC</div>
                            <div className={styles.statLabel}>權限控制</div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};