import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useConfig } from '@/contexts/config';
import { useNavigationBlocker } from '@/contexts/navigation-blocker';
import { dashboardMenuItems, adminToolsMenuItems } from '../helpers';
import { ISidebarMenuItem } from './SidebarMenuItem';

export const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { authState } = useAuth();
  const { config } = useConfig();
  const { tryNavigate } = useNavigationBlocker();
  
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

  // Filter items with URLs (no isTitle in new INavMenuItem type)
  const navigationItems = menuItems.filter(item => item.url);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoize the isActive function to prevent recreation and fix the logic
  const isActive = React.useCallback((item: ISidebarMenuItem & { activePaths?: string[] }) => {
    if (!item.url) return false;

    // Normalize pathname to lowercase for comparison
    const normalizedPathname = pathname.toLowerCase();

    // Check activePaths first if available (handles merged pages like contracts)
    if (item.activePaths && item.activePaths.length > 0) {
      for (const activePath of item.activePaths) {
        const normalizedActivePath = activePath.toLowerCase();
        // Exact match or path starts with activePath
        if (normalizedPathname === normalizedActivePath ||
            normalizedPathname.startsWith(normalizedActivePath + '/')) {
          return true;
        }
      }
    }

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
    const typingSpeed = 25; // ms per letter (reduced from 50 for faster typing)
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
  const itemHeight = 40; // height of each icon container (reduced from 44)
  const spacing = 14; // spacing between items (reduced from 16)
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
        <div className="relative flex flex-col items-center space-y-3.5 py-4">
          {navigationItems.map((item, index) => {
            const active = isActive(item);
            const isHovered = hoveredItem === item.label;

            // Base styles for icon and container
            let containerClasses = 'flex items-center transition-all duration-200 rounded-full h-10 relative z-10 ';
            
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
                <button
                  type="button"
                  className="group flex items-center cursor-pointer"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => {
                    // Cancel typing animation on click
                    setHoveredItem(null);
                    // Use tryNavigate for navigation blocking support
                    if (item.url) {
                      tryNavigate(item.url);
                    }
                  }}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="flex items-center relative">
                    {/* Fixed icon button container */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 relative z-20 ${containerClasses}`}>
                      <span className={`iconify ${item.icon} text-xl`} />
                    </div>

                    {/* Expanding text container - positioned behind and to the right */}
                    {isHovered && (
                      <div
                        className={`absolute left-6 top-0 h-10 flex items-center rounded-r-lg transition-all duration-200 overflow-hidden z-10 ${
                          active
                            ? 'bg-primary text-primary-content shadow-sm'
                            : (isDarkMode
                                ? 'bg-gray-800 border border-gray-700 text-gray-400'
                                : 'bg-white border border-gray-300 text-gray-700')
                        }`}
                        style={{
                          paddingLeft: '24px', // Space for the icon overlap
                          paddingRight: '12px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div className="whitespace-nowrap">
                          <span className="text-sm font-medium">
                            {displayText}
                            {isTyping && (
                              <span className="border-r-2 ml-0.5 border-current animate-[blink_1s_step-end_infinite]">
                                &nbsp;
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};