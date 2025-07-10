import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import styles from '../styles/Navbar.module.scss';

interface NavbarProps {
  brandName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  brandName = "IOT"
}) => {
  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <Link to="/" className={styles.navBrand}>
          <h2>{brandName}</h2>
        </Link>
        <div className={styles.navRight}>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}; 