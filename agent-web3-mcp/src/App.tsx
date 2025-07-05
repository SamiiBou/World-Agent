import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import IdentityLinking from './components/IdentityLinking';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        {/* Simple navigation bar */}
        <nav className="nav-bar">
          <ul>
            <li>
              <Link to="/">Chat</Link>
            </li>
            <li>
              <Link to="/identity-link">Link Identity</Link>
            </li>
          </ul>
        </nav>
        {/* Route handling */}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/identity-link" element={<IdentityLinking />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
