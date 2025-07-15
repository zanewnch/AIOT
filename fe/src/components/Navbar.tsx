import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { logout, selectUser } from '../store/authSlice';
import styles from '../styles/Navbar.module.scss';

interface NavbarProps {
  brandName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  brandName = "IOT"
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectUser);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
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