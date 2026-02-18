import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import { CustomTooltip } from './CustomTooltip';
import { useNavigationBlocker } from '@/contexts/navigation-blocker';
import {
  dashboardMenuItems,
  adminToolsMenuItems,
  sectionOrder,
  sectionLabels,
  INavMenuItem,
  NavCategory
} from '../helpers';

const SIDEBAR_STORAGE_KEY = '__SAM_SIDEBAR_COLLAPSED__';

/**
 * PORTAL-style vertical sidebar navigation
 *
 * Features:
 * - Collapsible design (160px expanded / 52px collapsed)
 * - Section-based grouping (Overview, Projects, Finance, Operations, Admin)
 * - Theme-aware colors using DaisyUI semantic tokens
 * - Portal-based tooltips for collapsed state
 * - LocalStorage persistence of collapsed state
 * - Mobile-responsive (hidden <1024px)
 */
export const VerticalAppNav: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const { tryNavigate } = useNavigationBlocker();

  // State management - Default to collapsed (true)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true; // Default collapsed
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored !== null ? stored === 'true' : true; // Default to collapsed if no stored value
  });

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle collapse
  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      document.documentElement.style.setProperty(
        '--sidebar-width',
        next ? '52px' : '160px'
      );
      return next;
    });
  };

  // Initialize CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '52px' : '160px'
    );
  }, [isCollapsed]);

  // Combine all menu items
  const allMenuItems = useMemo(() => {
    return [...dashboardMenuItems, ...adminToolsMenuItems];
  }, []);

  // Active state detection
  const isActive = useCallback((item: INavMenuItem) => {
    // Direct match
    if (item.activePaths.includes(pathname)) return true;

    // Prefix match (excluding root-only paths)
    return item.activePaths.some(path =>
      pathname.startsWith(path) && (path !== '/' || pathname === '/')
    );
  }, [pathname]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const grouped: Record<NavCategory, INavMenuItem[]> = {
      overview: [],
      project: [],
      finance: [],
      operations: [],
      admin: [],
    };

    allMenuItems.forEach(item => {
      grouped[item.category].push(item);
    });

    return grouped;
  }, [allMenuItems]);

  // Hide on mobile
  if (isMobile) return null;

  const handleNavClick = useCallback(
    (url?: string) => (event: React.MouseEvent) => {
      if (!url) {
        event.preventDefault();
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }

      event.preventDefault();
      tryNavigate(url);
    },
    [tryNavigate]
  );

  // Render expanded item
  const renderExpandedItem = (item: INavMenuItem) => {
    const active = isActive(item);
    return (
      <li key={item.id}>
        <Link
          to={item.url || '#'}
          onClick={handleNavClick(item.url)}
          aria-current={active ? 'page' : undefined}
          className={clsx(
            'flex items-center rounded-md px-2.5 py-2 text-sm font-medium',
            'transition-colors focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-primary/30',
            'focus-visible:ring-offset-2 dark:focus-visible:ring-offset-base-300/30',
            active
              ? 'bg-primary/10 text-primary dark:text-primary-content'
              : 'text-base-content/70 hover:bg-base-200/70 dark:text-base-content/80 dark:hover:bg-base-300/20'
          )}
        >
          <span className={`iconify ${item.icon} text-lg`} />
          <span className="ml-3 truncate">{item.label}</span>
          {item.status === 'upcoming' && (
            <span className="ml-auto rounded-md border border-base-300 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-base-content/60">
              Preview
            </span>
          )}
        </Link>
      </li>
    );
  };

  // Render collapsed item
  const renderCollapsedItem = (item: INavMenuItem) => {
    const active = isActive(item);
    return (
      <li key={item.id} className="flex justify-center">
        <CustomTooltip content={item.label}>
          <Link
            to={item.url || '#'}
            onClick={handleNavClick(item.url)}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full',
              'transition-transform focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-primary/30',
              'focus-visible:ring-offset-2 dark:focus-visible:ring-offset-base-300/30',
              active
                ? 'bg-primary/15 text-primary'
                : 'text-base-content/70 hover:bg-base-200/70 dark:text-base-content/80 dark:hover:bg-base-300/20'
            )}
          >
            <span className={`iconify ${item.icon} text-xl`} />
          </Link>
        </CustomTooltip>
      </li>
    );
  };

  return (
    <nav
      className="fixed top-0 left-0 h-screen flex flex-col bg-base-100 border-r border-base-200 transition-all duration-300 z-40"
      style={{ width: isCollapsed ? '52px' : '160px', overflow: 'visible' }}
      aria-label="Main navigation"
    >
      {/* Header with toggle button */}
      <div className={`flex items-center p-4 border-b border-base-200 min-h-[64px] ${
        isCollapsed ? 'justify-center' : 'justify-end'
      }`}>
        <button
          onClick={toggleCollapse}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
        >
          <span
            className={`iconify ${isCollapsed ? 'lucide--chevron-right' : 'lucide--chevron-left'} text-xl`}
          />
        </button>
      </div>

      {/* Navigation content */}
      <div
        className="flex-1 py-4 flex flex-col justify-center"
        style={{ overflowY: 'auto', overflowX: 'visible' }}
      >
        {isCollapsed ? (
          // Collapsed view - simple list
          <ul className="space-y-2 px-2">
            {allMenuItems.map(item => renderCollapsedItem(item))}
          </ul>
        ) : (
          // Expanded view - grouped by sections
          <div className="space-y-6">
            {sectionOrder.map(category => {
              const categoryItems = groupedItems[category];
              if (categoryItems.length === 0) return null;

              return (
                <div key={category} role="group" aria-labelledby={`section-${category}`}>
                  {/* Section header */}
                  <div className="px-4 mb-2">
                    <h3
                      id={`section-${category}`}
                      className="text-xs font-semibold uppercase tracking-wider text-base-content/50"
                    >
                      {sectionLabels[category]}
                    </h3>
                  </div>

                  {/* Navigation items */}
                  <ul className="space-y-1 px-2">
                    {categoryItems.map(item => renderExpandedItem(item))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Version footer */}
      <div className={`border-t border-base-200 py-2 text-center ${isCollapsed ? 'px-1' : 'px-3'}`}>
        <span className="text-[10px] text-base-content/40 select-none">
          {isCollapsed ? `v${__APP_PKG_VERSION__}` : `SAM v${__APP_PKG_VERSION__}`}
        </span>
      </div>
    </nav>
  );
};

export default React.memo(VerticalAppNav);
