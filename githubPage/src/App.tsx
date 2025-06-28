import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomeView from "./views/HomeView";
import AboutView from "./views/AboutView";

function App() {
  return (
    <Router>
      <nav style={{ marginBottom: 20 }}>
        <Link to="/" style={{ marginRight: 10 }}>Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomeView />} />
        <Route path="/about" element={<AboutView />} />
      </Routes>
    </Router>
  );
}

export default App;
