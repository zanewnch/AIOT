import React from 'react';
import '../styles/HomeViewStyle.scss';

function HomeView() {
  return (
    <div className="home-view">
      <nav className="navbar">
        <div className="nav-brand">
          <a href="#">Your Name</a>
        </div>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#blog">Blog</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <main className="main-content">
        <section className="hero-section">
          <h1 className="hero-title">Crafting Digital Experiences</h1>
          <p className="hero-subtitle">
            Hi, I'm [Your Name], a passionate developer and creator. Welcome to my personal space where I share my thoughts, projects, and journey in the world of tech.
          </p>
          <button className="cta-button">Explore My Work</button>
        </section>
      </main>

      <footer className="footer">
        <div className="social-links">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
        </div>
        <p className="copyright">&copy; 2025 [Your Name]. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default HomeView;