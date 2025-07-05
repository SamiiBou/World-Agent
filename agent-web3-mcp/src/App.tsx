import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChatInterface } from './components/ChatInterface';
import SelfVerificationQR from './components/SelfQRCode';
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
        <Routes>
          <Route path="/" element={<ChatInterface />} />
          <Route path="/identity-link" element={<SelfVerificationQR />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
