import React, { useState } from 'react';
import SelfVerificationQR from './SelfQRCode';
import './IdentityLinking.css';

export default function IdentityLinking() {
  const [activeConnection, setActiveConnection] = useState<'worldid' | 'selfid' | null>(null);

  const handleWorldIdConnect = () => {
    setActiveConnection('worldid');
    // TODO: Implement World ID connection
    console.log('World ID connection clicked');
  };

  const handleSelfIdConnect = () => {
    setActiveConnection('selfid');
  };

  const handleBack = () => {
    setActiveConnection(null);
  };

  if (activeConnection === 'selfid') {
    return (
      <div className="identity-linking-container">
        <div className="back-button-container">
          <button onClick={handleBack} className="back-button">
            ← Back to Identity Options
          </button>
        </div>
        <SelfVerificationQR />
      </div>
    );
  }

  if (activeConnection === 'worldid') {
    return (
      <div className="identity-linking-container">
        <div className="back-button-container">
          <button onClick={handleBack} className="back-button">
            ← Back to Identity Options
          </button>
        </div>
        <div className="connection-content">
          <h2 className="connection-title">Connect World ID</h2>
          <div className="coming-soon">
            <p>🌍 World ID integration coming soon!</p>
            <p className="coming-soon-description">
              This will allow you to verify your identity using Worldcoin's World ID protocol.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="identity-linking-container">
      <div className="identity-header">
        <h1 className="identity-title">Link Your Identity</h1>
        <p className="identity-subtitle">
          Choose how you'd like to verify your identity to enable advanced agent features
        </p>
      </div>

      <div className="connection-options">
        <div className="connection-card" onClick={handleWorldIdConnect}>
          <div className="connection-icon">🌍</div>
          <h3 className="connection-name">World ID</h3>
          <p className="connection-description">
            Verify your humanity using Worldcoin's biometric identity system
          </p>
          <div className="connection-features">
            <span className="feature-tag">Biometric</span>
            <span className="feature-tag">Sybil-resistant</span>
            <span className="feature-tag">Privacy-preserving</span>
          </div>
          <button className="connect-button world-id-button">
            Connect World ID
          </button>
        </div>

        <div className="connection-card" onClick={handleSelfIdConnect}>
          <div className="connection-icon">🆔</div>
          <h3 className="connection-name">Self ID</h3>
          <p className="connection-description">
            Verify your identity using government-issued documents
          </p>
          <div className="connection-features">
            <span className="feature-tag">Document-based</span>
            <span className="feature-tag">KYC compliant</span>
            <span className="feature-tag">Zero-knowledge</span>
          </div>
          <button className="connect-button self-id-button">
            Connect Self ID
          </button>
        </div>
      </div>

      <div className="identity-info">
        <h3 className="info-title">Why verify your identity?</h3>
        <div className="info-benefits">
          <div className="benefit-item">
            <span className="benefit-icon">🔒</span>
            <span className="benefit-text">Enhanced security for high-value transactions</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🤖</span>
            <span className="benefit-text">Access to advanced AI agent capabilities</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">⚡</span>
            <span className="benefit-text">Faster transaction processing</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🌐</span>
            <span className="benefit-text">Cross-platform identity verification</span>
          </div>
        </div>
      </div>
    </div>
  );
} 