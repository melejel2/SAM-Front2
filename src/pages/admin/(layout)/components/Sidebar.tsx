import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useConfig } from '@/contexts/config';
import { dashboardMenuItems, adminToolsMenuItems } from '../helpers';
import { ISidebarMenuItem } from './SidebarMenuItem';

export const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { authState } = useAuth();
  const { config } = useConfig();
  
  // Typing animation states
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Determine if we're in dark mode
  const isDarkMode = config.theme === 'dark';

  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Determine which menu to show based on current route
  const isAdminTools = pathname.startsWith('/admin-tools');
  const menuItems = isAdminTools ? adminToolsMenuItems : dashboardMenuItems;

  // Filter out title items for the floating sidebar
  const navigationItems = menuItems.filter(item => !item.isTitle && item.url);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoize the isActive function to prevent recreation and fix the logic
  const isActive = React.useCallback((item: ISidebarMenuItem) => {
    if (!item.url) return false;
    
    // Exact match
    if (item.url === pathname) return true;
    
    // For dashboard items, check if we're on any dashboard route
    if (item.url === '/dashboard' && pathname.startsWith('/dashboard')) {
      // Only highlight main dashboard if we're exactly on /dashboard
      return pathname === '/dashboard';
    }
    
    // For specific dashboard routes, check if current path starts with the item's URL
    if (item.url.startsWith('/dashboard/') && pathname.startsWith(item.url)) {
      return true;
    }
    
    // For admin tools, check for specific matches
    if (pathname.startsWith('/admin-tools')) {
      // Handle specific admin tool routes
      if (item.url.startsWith('/admin-tools') && pathname.startsWith(item.url)) {
        return true;
      }
    }
    
    return false;
  }, [pathname]);

  // Typing animation effect when hovering
  useEffect(() => {
    if (!hoveredItem) {
      setDisplayText("");
      setIsTyping(false);
      return;
    }
    // Reset text and start typing effect
    setDisplayText("");
    setIsTyping(true);
    let index = 0;
    const typingSpeed = 50; // ms per letter
    const timer = setInterval(() => {
      index++;
      setDisplayText(hoveredItem.substring(0, index));
      if (index === hoveredItem.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, typingSpeed);
    return () => clearInterval(timer);
  }, [hoveredItem]);
  
  // If we're on mobile, don't render the sidebar
  if (isMobile) {
    return null;
  }

  // Calculate line positioning based on number of items
  const totalItems = navigationItems.length;
  const itemHeight = 44; // height of each icon container (increased from 40)
  const spacing = 16; // spacing between items (increased from 14)
  const totalHeight = (totalItems * itemHeight) + ((totalItems - 1) * spacing);
  const lineStart = (itemHeight / 2); // Start from center of first icon
  const lineEnd = totalHeight - (itemHeight / 2); // End at center of last icon
  
  return (
    <div className="w-20 h-full flex items-center justify-center pr-8">
      <div className="relative">
        {/* Vertical line - contained within icon boundaries */}
        {navigationItems.length > 1 && (
          <div 
            className={`absolute w-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-400'}`}
            style={{
              left: '50%',
              transform: 'translateX(-0.5px)',
              top: `${lineStart}px`,
              height: `${lineEnd - lineStart}px`
            }}
          />
        )}
        
        {/* Navigation items */}
        <div className="relative flex flex-col items-center space-y-4 py-4">
          {navigationItems.map((item, index) => {
            const active = isActive(item);
            const isHovered = hoveredItem === item.label;

            // Base styles for icon and container
            let containerClasses = 'flex items-center transition-all duration-200 rounded-full h-11 relative z-10 ';
            
            if (active) {
              containerClasses += 'bg-primary text-primary-content shadow-sm';
            } else {
              // Use theme-aware styling
              containerClasses += isDarkMode 
                ? 'bg-gray-800 border border-gray-700 text-gray-400'
                : 'bg-white border border-gray-300 text-gray-700';
            }
            
            if (isHovered && !active) {
              containerClasses += ' shadow-sm';
            }

            return (
              <div key={item.id} className="relative">
                <Link
                  to={item.url || '#'}
                  className="group flex items-center"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    // Cancel typing animation on click
                    setHoveredItem(null);
                  }}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className={containerClasses} style={{
                    width: isHovered ? 'auto' : '2.75rem',
                    maxWidth: isHovered ? '200px' : '2.75rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <div className="flex items-center justify-center min-w-[44px] h-11">
                      <span className={`iconify ${item.icon} text-2xl`} />
                    </div>
                    
                    <div className="whitespace-nowrap overflow-hidden" style={{
                      maxWidth: isHovered ? '160px' : '0',
                      opacity: isHovered ? 1 : 0,
                      transition: 'all 0.2s ease'
                    }}>
                      <span className="pr-3 text-base font-medium">
                        {isHovered ? (
                          <>
                            {displayText}
                            {isTyping && (
                              <span className="border-r-2 ml-0.5 border-current animate-[blink_1s_step-end_infinite]">
                                &nbsp;
                              </span>
                            )}
                          </>
                        ) : item.label}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};