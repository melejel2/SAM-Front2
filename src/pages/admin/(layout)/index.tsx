import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// Replace with your actual components
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';

const DashboardLayout = ({ children }: { children?: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Topbar - Always at top */}
      <Topbar />
      
      {/* Main layout area */}
      <div className="relative">
        {/* Sidebar - Desktop only */}
        {!isMobile && (
          <div
            className="fixed z-30"
            style={{
              left: '8px',
              top: '64px',
              bottom: 0,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Sidebar />
          </div>
        )}
        
        {/* Main content */}
        <div
          className={`
            ${isMobile ? 'pt-14' : 'pt-16'}
            px-16
          `}
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: isMobile ? '3.5rem' : '4rem',
            paddingBottom: 0
          }}
        >
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;