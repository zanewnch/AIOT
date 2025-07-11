import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar, Sidebar } from '../components';
import styles from '../styles/homepage.module.scss';

export function Homepage() {
  return (
    <div className={styles.homeView}>
      <Navbar />

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Content Area - 這裡會根據路由渲染不同的子組件 */}
        <div className={styles.contentArea}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}