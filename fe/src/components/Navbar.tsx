import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import './Navbar.scss';

interface NavbarProps {
  brandName?: string;
  showSearch?: boolean;
  showLanguageSelector?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  brandName = "ANTHROPC",
  showSearch = true,
  showLanguageSelector = true
}) => {
  return (
    <header className="header">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>{brandName}</h2>
        </div>
        <div className="nav-right">
          <div className="nav-center">
            <a href="#welcome">歡迎</a>
            <a href="#developers">開發者指南</a>
            <a href="#api">API 指南</a>
            <a href="#claude">Claude Code</a>
            <a href="#model">模型上下文協議 (MCP)</a>
            <a href="#pricing">資源</a>
            <a href="#docs">發布說明</a>
          </div>
          <div className="nav-divider"></div>
          {showLanguageSelector && (
            <div className="language-selector">
              <span>繁體中文</span>
              <svg className="dropdown-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.5 6L8 9.5L11.5 6H4.5Z"/>
              </svg>
            </div>
          )}
          {showSearch && (
            <div className="search-container">
              <input type="text" placeholder="Search..." className="search-input" />
              <span className="search-shortcut">Ctrl K</span>
            </div>
          )}
          <div className="nav-actions">
            <a href="#research">Research</a>
            <a href="#login">Login</a>
            <a href="#support">Support</a>
            <ThemeToggle />
            <button className="signup-btn">Sign up</button>
          </div>
        </div>
      </nav>
    </header>
  );
}; 