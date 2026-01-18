import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

// Layout components
import { Topbar } from './components/Topbar';
import { VerticalAppNav } from './components/VerticalAppNav';
import { TopbarContentProvider } from '@/contexts/topbar-content';
import { useArchive } from '@/contexts/archive';

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
  const { isArchiveMode } = useArchive();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <TopbarContentProvider>
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

          {/* Global Read-Only Banner */}
          {isArchiveMode && (
            <div className="bg-warning text-warning-content px-6 py-2 flex items-center justify-center gap-2 shadow-md z-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-semibold">ARCHIVE MODE - READ ONLY</span>
              <span className="text-sm opacity-90">- You cannot create or edit data in this mode. Uncheck "Show Archived Projects" to enable editing.</span>
            </div>
          )}

          {/* Page content - Add padding-top for topbar */}
          <div className={`flex-1 overflow-auto ${isMobile ? 'pt-14 px-4' : 'pt-20 px-6'}`}>
            {children || <Outlet />}
          </div>
        </div>
      </div>
    </TopbarContentProvider>
  );
};

export default DashboardLayout;