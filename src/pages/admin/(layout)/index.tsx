import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Topbar } from './components/Topbar';
import { Sidebar } from './components/Sidebar';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdminTools = location.pathname.startsWith('/admin-tools');

  return (
    <div className="min-h-screen app-background">
      {/* Topbar */}
      <div className="relative z-30">
        <Topbar />
      </div>
      
      {/* Main content area */}
      <div className="relative dashboard-layout">
        {/* Floating Sidebar - only show when not in admin tools */}
        {!isAdminTools && (
          <div className="fixed left-10 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="pointer-events-auto">
              <Sidebar />
            </div>
          </div>
        )}
        
        {/* Page content with same container structure as topbar */}
        <div className="dashboard-content pt-4">
          <div className="container mx-auto px-8">
            {children || <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
