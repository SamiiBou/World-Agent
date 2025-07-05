import React, { useEffect, useState } from 'react';
import MiniKitService from '../services/miniKitService';
import './MiniKitStatus.css';

interface MiniKitStatusProps {
  className?: string;
}

const MiniKitStatus: React.FC<MiniKitStatusProps> = ({ className }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [detectionDetails, setDetectionDetails] = useState<string>('');

  useEffect(() => {
    const checkMiniKitStatus = () => {
      try {
        console.log('=== MiniKit Status Check ===');
        const installed = MiniKitService.isInstalled();
        setIsInstalled(installed);
        setIsLoading(false);
        
        // Get more detailed information
        const userAgent = navigator.userAgent;
        const details = `User Agent: ${userAgent.substring(0, 100)}...`;
        setDetectionDetails(details);
        
        if (installed) {
          console.log('✅ MiniKit is detected as installed!');
          // Initialize MiniKit
          MiniKitService.init();
        } else {
          console.log('❌ MiniKit is not detected. This might be a false negative.');
          console.log('If you are running in World App, please check the console for more details.');
        }
      } catch (error) {
        console.error('Error checking MiniKit status:', error);
        setIsInstalled(false);
        setIsLoading(false);
        setDetectionDetails(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    checkMiniKitStatus();
  }, []);

  const handleRetryDetection = () => {
    setIsLoading(true);
    // Retry after a short delay
    setTimeout(() => {
      const installed = MiniKitService.isInstalled();
      setIsInstalled(installed);
      setIsLoading(false);
      
      if (installed) {
        console.log('✅ MiniKit detected on retry!');
        MiniKitService.init();
      }
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className={`minikit-status loading ${className || ''}`}>
        <div className="status-indicator">
          <div className="loading-spinner"></div>
          <span>Checking MiniKit status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`minikit-status ${isInstalled ? 'installed' : 'not-installed'} ${className || ''}`}>
      <div className="status-indicator">
        <div className={`status-icon ${isInstalled ? 'success' : 'warning'}`}>
          {isInstalled ? '✅' : '⚠️'}
        </div>
        <span className="status-text">
          {isInstalled 
            ? 'Running in World App' 
            : 'MiniKit Detection Issue'
          }
        </span>
      </div>
      {!isInstalled && (
        <div className="status-message">
          <p>
            If you are running this in World App and seeing this message, 
            try refreshing the page or clicking retry below.
          </p>
          <button 
            onClick={handleRetryDetection}
            className="retry-button"
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Retry Detection
          </button>
          <details style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            <summary>Detection Details</summary>
            <p>{detectionDetails}</p>
          </details>
        </div>
      )}
    </div>
  );
};

export default MiniKitStatus; 