import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// Layout components
import { Topbar } from './components/Topbar';
import { VerticalAppNav } from './components/VerticalAppNav';

/**
 * Main dashboard layout with PORTAL-style sidebar
 *
 * Features:
 * - Fixed vertical sidebar navigation (desktop only)
 * - Content margin adjusts based on sidebar width (--sidebar-width CSS variable)
 * - Mobile-responsive (sidebar hidden <1024px, no margin)
 * - Topbar always visible at top
 */
const DashboardLayout = ({ children }: { children?: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen bg-base-200 overflow-hidden">
      {/* PORTAL-style vertical sidebar - Desktop only */}
      {!isMobile && <VerticalAppNav />}

      {/* Main content area with dynamic margin */}
      <div
        className="flex h-screen flex-col overflow-hidden"
        style={{ marginLeft: isMobile ? '0' : 'var(--sidebar-width, 52px)' }}
      >
        {/* Topbar */}
        <Topbar />

        {/* Page content - Add padding-top for topbar */}
        <div className={`flex-1 overflow-auto ${isMobile ? 'pt-14 px-4' : 'pt-20 px-6'}`}>
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;