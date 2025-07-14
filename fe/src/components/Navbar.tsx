import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Navbar.module.scss';

interface NavbarProps {
  brandName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  brandName = "IOT"
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navBrand}>
          <h2>{brandName}</h2>
        </Link>
        <div className={styles.navRight}>
          {user && (
            <div className={styles.userInfo}>
              <span className={styles.username}>Welcome, {user.username}</span>
              <button 
                onClick={handleLogout}
                className={styles.logoutButton}
              >
                Logout
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}; 