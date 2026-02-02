import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Select, SelectOption } from "@/components/daisyui";
import { ThemeToggleDropdown } from "@/components/ThemeToggleDropdown";
import { Loader } from "@/components/Loader";
import { useAuth } from "@/contexts/auth";
import { useConfig } from "@/contexts/config";
import { useTopbarContent } from "@/contexts/topbar-content";
import { useNavigationBlocker } from "@/contexts/navigation-blocker";
import { cn } from "@/helpers/utils/cn";
import apiRequest from "@/api/api";

/* --- Helper Functions --- */
// Format name to show only first name
const formatName = (fullName: string) => {
  if (!fullName) return "";
  const parts = fullName.trim().split(" ");
  return parts[0]; // Return only the first name
};

// Get user initials for avatar (e.g., "TB" for "Tamer Al Boustany")
const getUserInitials = (fullName: string) => {
  if (!fullName) return "";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Get page title based on current route
const getPageTitle = (pathname: string) => {
  // Dashboard routes
  if (pathname === '/' || pathname === '/dashboard') {
    return "Dashboard";
  }
  if (pathname.includes('/reports')) {
    return "Reports";
  }
  if (pathname.includes('/contracts-database')) {
    return "Contracts Database";
  }
  if (pathname.includes('/deductions-database')) {
    return "Deductions Database";
  }
  if (pathname.includes('/budget-BOQs')) {
    return "Budget BOQs";
  }
  if (pathname.includes('/subcontractors-boqs/new') || pathname.includes('/subcontractors-BOQs/new')) {
    return "New Subcontract";
  }
  if (pathname.includes('/subcontractors-boqs') || pathname.includes('/subcontractors-BOQs')) {
    return "Subcontractors BOQs";
  }
  if (pathname.includes('/IPCs-database')) {
    return "IPCs Database";
  }
  if (pathname.includes('/contract-analysis')) {
    return "Contract Analysis";
  }
  if (pathname.includes('/contracts')) {
    return "Contracts";
  }

  // Admin Tools routes
  if (pathname === '/admin-tools') {
    return "Admin Tools";
  }
  if (pathname.includes('/admin-tools/currencies')) {
    return "Currencies";
  }
  if (pathname.includes('/admin-tools/units')) {
    return "Units";
  }
  if (pathname.includes('/admin-tools/users')) {
    return "Users";
  }
  if (pathname.includes('/admin-tools/trades')) {
    return "Trades";
  }
  if (pathname.includes('/admin-tools/cost-codes')) {
    return "Cost Codes";
  }
  if (pathname.includes('/admin-tools/sheets')) {
    return "Sheets";
  }
  if (pathname.includes('/admin-tools/projects')) {
    return "Projects";
  }
  if (pathname.includes('/admin-tools/buildings')) {
    return "Buildings";
  }
  if (pathname.includes('/admin-tools/subcontractors')) {
    return "Subcontractors";
  }
  if (pathname.includes('/admin-tools/templates')) {
    return "Templates";
  }

  // Variation Orders routes
  if (pathname.includes('/variation-orders')) {
    return "Variation Orders";
  }

  // Auth routes
  if (pathname.includes('/auth/login')) {
    return "Login";
  }
  if (pathname.includes('/auth/register')) {
    return "Register";
  }
  if (pathname.includes('/auth/forgot-password')) {
    return "Forgot Password";
  }
  if (pathname.includes('/auth/reset-password')) {
    return "Reset Password";
  }

  // Default fallback
  return "SAM";
};

// Types for notifications
interface Notification {
  type: string;
  poId?: number;
  poNumber?: string;
  refNo?: string;
  message: string;
  date?: string;
  untreated: boolean;
  materialId?: number;
  expenseClaimId?: number;
  referenceNumber?: string;
  paymentScheduleId?: number;
  status?: string;
  sourceCountryId?: number;
  sourceCountryName?: string;
  sourceSiteId?: number;
  sourceSiteName?: string;
  sourceSiteAcronym?: string;
  beneficiaryName?: string;
}

// Types for database/company data
interface Database {
  id: string;
  name: string;
  displayName: string;
}

interface NotificationCardProps {
  icon: string;
  title: string;
  reference?: string;
  date?: string;
  onClick: () => void;
  index: number;
  isMobile: boolean;
  isSmallMobile: boolean;
}

// Notification Button Component
const NotificationButton = React.memo(({
  onClick,
  count,
  loading = false
}: {
  onClick: () => void;
  count: number;
  loading?: boolean;
}) => {
  // Only show notification dot if we have a valid count greater than 0 and not loading
  const showNotificationDot = !loading && typeof count === 'number' && count > 0;
  const showLoading = loading && !showNotificationDot;
  
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        disabled={loading}
        className="btn btn-circle btn-ghost btn-sm relative overflow-hidden hover:bg-primary/10 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Open notifications"
        type="button"
      >
        <span className="iconify lucide--bell w-5 h-5 text-base-content group-hover:text-primary transition-all duration-200" />
      </button>
      
      {/* Loading spinner indicator */}
      {showLoading && (
        <div className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center z-10">
          <span className="iconify lucide--loader-2 w-3 h-3 text-primary animate-spin" />
        </div>
      )}
      
      {/* Notification indicator with pulsing animation */}
      {showNotificationDot && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-base-100 animate-pulse z-10"></div>
      )}
    </div>
  );
});

// NotificationCard Component
const NotificationCard: React.FC<NotificationCardProps> = React.memo(({ 
  icon, 
  title, 
  reference, 
  date, 
  onClick,
  index,
  isMobile,
  isSmallMobile
}) => {
  const getNotificationStyle = (iconName: string) => {
    switch (iconName) {
      case "lucide:receipt":
        return { 
          bg: "bg-base-200", 
          border: "border-base-300", 
          icon: "text-base-content/70"
        };
      case "lucide:book-open":
        return { 
          bg: "bg-base-200", 
          border: "border-base-300", 
          icon: "text-base-content/70"
        };
      case "lucide:file-text":
        return { 
          bg: "bg-base-200", 
          border: "border-base-300", 
          icon: "text-base-content/70"
        };
      case "lucide:clipboard-list":
        return { 
          bg: "bg-base-200", 
          border: "border-base-300", 
          icon: "text-base-content/70"
        };
      default:
        return { 
          bg: "bg-base-200", 
          border: "border-base-300", 
          icon: "text-base-content/70"
        };
    }
  };

  const notificationStyle = getNotificationStyle(icon);

  return (
    <div 
      key={index} 
      className={`
        flex cursor-pointer items-center gap-3 rounded-lg 
        ${isMobile ? 'p-3' : 'p-4'} 
        bg-base-100 hover:bg-base-200 
        transition-all duration-200 border ${notificationStyle.border} shadow-sm select-none
        hover:shadow-md hover:border-base-400
        group
      `}
      onClick={onClick}
    >
      <div className={`
        flex-shrink-0 flex items-center justify-center rounded-lg ${notificationStyle.bg}
        ${isSmallMobile ? 'w-10 h-10' : 'w-12 h-12'}
        border ${notificationStyle.border}
      `}>
        <span className={`iconify ${icon} ${isSmallMobile ? 'w-5 h-5' : 'w-6 h-6'} ${notificationStyle.icon}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className={`${isSmallMobile ? 'text-sm' : 'text-sm'} font-medium text-base-content mb-1 line-clamp-2 leading-tight`}>
              {title}
            </p>
            <div className="flex items-center gap-3 text-xs text-base-content/60">
              {reference && (
                <span className="font-mono bg-base-200 px-2 py-0.5 rounded border border-base-300">
                  {reference}
                </span>
              )}
              {date && (
                <span className="whitespace-nowrap">
                  {date}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-shrink-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
            <span className="iconify lucide--chevron-right w-4 h-4 text-base-content/40" />
          </div>
        </div>
      </div>
    </div>
  );
});

// Database Switch Confirmation Dialog
const DatabaseSwitchDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetDatabase: Database | null;
}> = ({ isOpen, onClose, onConfirm, targetDatabase }) => {
  if (!isOpen || !targetDatabase) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[modal-fade_0.2s]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
            <span className="iconify lucide--database w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-base-content">Switch Database</h3>
            <p className="text-sm text-base-content/60">Confirm database change</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-base-content/80 mb-3">
            Are you sure you want to switch to <strong>{targetDatabase.displayName}</strong>?
          </p>
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
            <p className="text-sm text-warning-content">
              <span className="iconify lucide--alert-triangle w-4 h-4 inline mr-1" />
              This action will change your active database context. You may need to log in again to access database-specific data.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm px-6"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-warning btn-sm px-6"
          >
            Switch Database
          </button>
        </div>
      </div>
    </div>
  );
};

// Database Dropdown Component
const DatabaseDropdown: React.FC<{
  isMobile?: boolean;
}> = ({ isMobile = false }) => {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [targetDatabase, setTargetDatabase] = useState<Database | null>(null);
  const { config } = useConfig();
  const { authState } = useAuth();

  // Load databases from the same API used in login
  useEffect(() => {
    const loadDatabases = async () => {
      setLoading(true);
      try {
        const response = await apiRequest({
          endpoint: "Auth/GetDataBases",
          method: "GET",
        });
        
        // Check if response is successful
        if (response && typeof response === 'object') {
          let databaseNames: string[] = [];
          
          if ('success' in response && response.success === true && 'databases' in response && Array.isArray(response.databases)) {
            // Handle successful response with databases array
            databaseNames = response.databases;
          } else if ('success' in response && response.success === false) {
            // Handle API error response
            console.error("API Error:", response.message);
            databaseNames = [];
          } else if (Array.isArray(response)) {
            // Handle direct array response (fallback for different API format)
            databaseNames = response;
          } else {
            // Handle unexpected response format
            console.error("Unexpected response format:", response);
            databaseNames = [];
          }
          
          // Convert string array to Database objects
          const databaseList: Database[] = databaseNames.map((name, index) => ({
            id: `db_${index}`,
            name: name,
            displayName: name
          }));
          
          setDatabases(databaseList);
          if (databaseList.length > 0) {
            // Use stored database from auth context, fallback to first database
            const storedDatabase = authState.user?.database;
            const defaultDatabase = storedDatabase 
              ? databaseList.find(db => db.name === storedDatabase) || databaseList[0]
              : databaseList[0];
            setSelectedDatabase(defaultDatabase);
          }
        } else {
          setDatabases([]);
        }
      } catch (error) {
        console.error('Failed to load databases:', error);
        setDatabases([]);
      } finally {
        setLoading(false);
      }
    };

    loadDatabases();
  }, [authState.user?.database]);

  const handleDatabaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    
    if (selectedValue === 'clear') {
      setSelectedDatabase(null);
      return;
    }

    const database = databases.find(d => d.id === selectedValue);
    if (database && database.id !== selectedDatabase?.id) {
      setTargetDatabase(database);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSwitch = async () => {
    if (!targetDatabase) return;

    try {
      setLoading(true);
      // In a real implementation, you would make an API call to switch database context
      // For now, we'll just simulate the switch
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSelectedDatabase(targetDatabase);
      setShowConfirmDialog(false);
      setTargetDatabase(null);
      
      // You might want to refresh the page or update auth context here
      // window.location.reload();
    } catch (error) {
      console.error('Failed to switch database:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSwitch = () => {
    setShowConfirmDialog(false);
    setTargetDatabase(null);
  };

  // If there's only one database, show it as text without dropdown
  if (databases.length === 1) {
    // Auto-select the only database if not already selected
    if (!selectedDatabase || selectedDatabase.id !== databases[0].id) {
      setTimeout(() => {
        setSelectedDatabase(databases[0]);
      }, 0);
    }
    
    return (
      <div className="bg-base-200 rounded-md px-2 h-[32px] flex items-center min-w-[100px] max-w-[160px]">
        <span className="font-medium text-base-content truncate">{databases[0].displayName}</span>
      </div>
    );
  }

  const renderOptions = () => {
    const options: React.ReactElement[] = [];
    
    // Add default option if no database is selected
    if (!selectedDatabase) {
      options.push(
        <SelectOption 
          key="default" 
          value="" 
          className={`${config.theme === "dark" ? "bg-neutral text-neutral-content" : "bg-base-100"}`}
        >
          Select Database
        </SelectOption>
      );
    }
    
    // Add all databases
    databases.forEach((database) => {
      options.push(
        <SelectOption 
          key={database.id} 
          value={database.id} 
          className={`${config.theme === "dark" ? "bg-neutral text-neutral-content" : "bg-base-100"}`}
        >
          {database.displayName}
        </SelectOption>
      );
    });
    
    // Add clear option if a database is selected
    if (selectedDatabase) {
      options.unshift(
        <SelectOption 
          key="clear" 
          value="clear" 
          className={`${config.theme === "dark" ? "bg-neutral text-neutral-content" : "bg-base-100"}`}
        >
          Clear Selection
        </SelectOption>
      );
    }
    
    return options;
  };

  return (
    <>
      <div className="bg-base-200 rounded-md px-2 h-[32px] flex items-center min-w-[100px] max-w-[160px]">
        <Select
          className="border-none focus:outline-none focus:ring-0 bg-transparent w-full font-medium"
          value={selectedDatabase?.id || ""}
          onChange={handleDatabaseChange}
          disabled={loading}
          onTouchStart={(e) => e.touches.length > 1 && e.preventDefault()}
        >
          <>{renderOptions()}</>
        </Select>
      </div>

      <DatabaseSwitchDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelSwitch}
        onConfirm={handleConfirmSwitch}
        targetDatabase={targetDatabase}
      />
    </>
  );
};

// NotificationsDialog Component
const NotificationsDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  const isMobile = viewportSize.width < 768;
  const isSmallMobile = viewportSize.width < 375;

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load notifications when dialog opens - replace with real API call
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Simulate API call - replace with real implementation
      setTimeout(() => {
        setNotifications([]); // Empty for now - replace with real data
        setLoading(false);
      }, 500);
    }
  }, [isOpen]);

  const formatNotificationDate = useCallback((dateString?: string): string => {
    if (!dateString) return "Now";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return date.toLocaleDateString(undefined, { weekday: 'long' });
      } else {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${day}/${month}/${year}`;
      }
    } catch {
      return dateString || "Now";
    }
  }, []);

  const getNotificationIcon = useCallback((type: string): string => {
    switch (type) {
      case "expense-claim-approval":
        return "lucide:receipt";
      case "payment-schedule-approval":
        return "lucide:book-open";
      case "po-approval":
        return "lucide:file-text";
      case "request-approval":
        return "lucide:clipboard-list";
      default:
        return "lucide:bell";
    }
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    // Handle notification click - replace with actual navigation logic
  }, []);

  const notificationGroups = useMemo(() => {
    const groups: Record<string, typeof notifications> = {
      highPriority: [],
      others: []
    };
    
    notifications.forEach(notification => {
      if (
        notification.type === "po-approval" ||
        notification.type === "expense-claim-approval" ||
        notification.type === "payment-schedule-approval" ||
        notification.type === "request-approval"
      ) {
        groups.highPriority.push(notification);
      } else {
        groups.others.push(notification);
      }
    });
    
    const result: Array<{ title: string; notifications: typeof notifications }> = [];
    if (groups.highPriority.length > 0) {
      result.push({
        title: "Pending Approvals",
        notifications: groups.highPriority
      });
    }
    if (groups.others.length > 0) {
      result.push({
        title: "Other Notifications",
        notifications: groups.others
      });
    }
    return result;
  }, [notifications]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-hidden bg-black/20 backdrop-blur-sm flex items-start justify-center md:items-center"
      onClick={onClose}
    >
      <div
        className={`
          bg-base-100 flex flex-col overflow-hidden
          ${isMobile 
              ? 'w-full h-full max-h-full animate-[modal-slide-up_0.3s_ease-out]' 
              : 'rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] m-4 animate-[modal-fade_0.2s]'
          }
        `}
        style={{
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '90vh'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className={`
            sticky top-0 bg-base-100/95 backdrop-blur-md border-b border-base-200 z-10
            flex items-center justify-between
            ${isMobile 
                ? 'px-4 py-3 shadow-sm' 
                : 'px-6 py-4 rounded-t-2xl'
            }
          `}
        >
          <div className="flex items-center gap-3">
                         <h1 className={`
               font-bold flex items-center gap-2
               ${isSmallMobile ? 'text-xl' : 'text-2xl'}
             `}>
               <span className={`iconify lucide--bell ${isSmallMobile ? 'w-6 h-6' : 'w-7 h-7'} text-primary/80`} />
               Notifications
             </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 1000);
              }}
              disabled={loading}
              className="btn btn-sm btn-circle btn-ghost tooltip tooltip-bottom" 
              data-tip="Refresh notifications"
              aria-label="Refresh notifications"
            >
                             <span className={`iconify lucide--refresh-cw w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button 
              onClick={onClose} 
              className="btn btn-sm btn-circle btn-ghost" 
              aria-label="Close"
            >
                             <span className={`iconify lucide--x ${isSmallMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain bg-base-50"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            minHeight: isMobile ? 'calc(100vh - 4rem)' : '400px'
          }}
        >
          {loading ? (
            <Loader
              icon="bell"
              subtitle="Loading: Notifications"
              description="Fetching your notifications..."
              height="auto"
              minHeight="200px"
              size="md"
            />
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4 px-6">
                             <div className="w-20 h-20 rounded-lg bg-base-200 border border-base-300 flex items-center justify-center">
                 <span className="iconify lucide--bell w-10 h-10 text-base-content/40" />
               </div>
              <div>
                <p className="text-lg font-medium text-base-content mb-1">All caught up!</p>
                <p className="text-base-content/60 text-sm">You have no notifications at this time.</p>
              </div>
            </div>
          ) : (
            <div className={`
              ${isMobile ? "px-4 py-3" : "p-6"}
              space-y-6
            `}>
              {notificationGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {notificationGroups.length > 1 && (
                    <div className="mb-4">
                      <h2 className={`
                        font-semibold text-base-content flex items-center gap-2
                        ${isMobile ? 'text-sm' : 'text-base'}
                      `}>
                        {group.title === "Pending Approvals" && (
                          <div className="w-2 h-2 bg-base-content/60 rounded-full"></div>
                        )}
                        {group.title}
                        <span className="text-xs font-medium text-base-content/60 bg-base-200 px-2 py-0.5 rounded border border-base-300">
                          {group.notifications.length}
                        </span>
                      </h2>
                    </div>
                  )}
                  <div className={isMobile ? "space-y-3" : "space-y-4"}>
                    {group.notifications.map((notification, index) => {
                      const notificationIcon = getNotificationIcon(notification.type);
                      
                      return (
                        <NotificationCard
                          key={`${notification.type}-${notification.expenseClaimId || notification.poId || notification.paymentScheduleId || notification.materialId || index}`}
                          index={index}
                          icon={notificationIcon}
                          title={notification.message}
                          reference={notification.referenceNumber || notification.refNo}
                          date={formatNotificationDate(notification.date)}
                          onClick={() => handleNotificationClick(notification)}
                          isMobile={isMobile}
                          isSmallMobile={isSmallMobile}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              
              {isMobile && <div className="h-4"></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Account dropdown for both mobile and desktop views
const AccountDropdown = React.memo(({
  username,
  userEmail,
  onLogout,
  isMobile = false
}: {
  username: string;
  userEmail?: string;
  onLogout: () => void;
  isMobile?: boolean;
}) => {
  const { config } = useConfig();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(prev => !prev);
  }, []);
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  // For mobile bottom navigation style
  if (isMobile) {
    return (
      <div className="flex-1 relative isolate" ref={dropdownRef}>
        <button 
          onClick={handleToggle}
          className="w-full h-full flex flex-col items-center justify-center p-0.5"
          aria-label="Toggle account menu"
          type="button"
        >
          <div className={`flex flex-col items-center gap-0.5 ${isOpen 
            ? 'text-primary' 
            : (config.theme === 'dark' ? 'text-white' : 'text-black')}`}>
            <span className="iconify lucide--user-circle text-lg" />
            <span className="text-[10px]">Account</span>
          </div>
        </button>
        
        {isOpen && (
          <>
            {/* Overlay that covers entire screen for clicking outside */}
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={handleClose}
              style={{ touchAction: 'none' }}
            />
            
            {/* Position the dropdown as fixed instead of absolute to avoid clipping */}
            <div 
              className="fixed z-[100] p-3 shadow-2xl bg-base-100 rounded-xl border border-base-300"
              style={{
                width: '14rem', 
                bottom: '4rem', 
                right: '1rem', 
                maxHeight: 'calc(100vh - 8rem)', 
                overflowY: 'auto'
              }}
            >
              <div className="mb-3 flex flex-col items-center">
                <div className="w-12 h-12 bg-primary text-primary-content rounded-full flex items-center justify-center mb-2">
                  <span className="text-base font-medium">{getUserInitials(username)}</span>
                </div>
                <div className="text-center">
                  <p className="font-medium text-base">{username}</p>
                  {userEmail && <p className="text-sm text-base-content/60">{userEmail}</p>}
                </div>
              </div>
              
              <hr className="my-2 border-base-content/10" />
              
              <button 
                className="w-full py-2 flex items-center gap-2 text-sm hover:bg-base-200 rounded-md px-2 text-left"
                onClick={() => {
                  // Handle view profile
                  handleClose();
                }}
                type="button"
              >
                <span className="iconify lucide--user-plus text-base" />
                <span>View Profile</span>
              </button>
              
              <hr className="my-2 border-base-content/10" />
              
              <button 
                className="w-full text-error py-2 flex items-center gap-2 text-sm hover:bg-error/10 rounded-md px-2 text-left" 
                onClick={() => {
                  onLogout();
                  handleClose();
                }}
                type="button"
              >
                <span className="iconify lucide--log-out text-base" />
                <span>Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }
  
  // Desktop dropdown style (uses DaisyUI Dropdown)
  return (
    <Dropdown vertical="bottom" end>
      <DropdownToggle className="p-0" button={false}>
        <div className="relative group">
          <button className="btn btn-circle btn-ghost btn-sm relative overflow-hidden hover:bg-base-300 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-base-300 cursor-pointer bg-primary text-primary-content hover:bg-primary/90">
            <span className="text-sm font-medium">{getUserInitials(username || '')}</span>
          </button>
        </div>
      </DropdownToggle>
      <DropdownMenu className="mb-8 w-60 p-3 shadow-lg">
        <div className="mb-3 flex flex-col items-center">
          <div className="w-12 h-12 bg-primary text-primary-content rounded-full flex items-center justify-center mb-2">
            <span className="text-base font-medium">{getUserInitials(username || '')}</span>
          </div>
          <div className="text-center">
            <p className="font-medium text-base">{username}</p>
            {userEmail && <p className="text-sm text-base-content/60">{userEmail}</p>}
          </div>
        </div>
        
        <hr className="my-2 border-base-content/10" />
        
        <DropdownItem 
          className="py-2 flex items-center gap-2 text-sm hover:bg-base-200 rounded-md"
          onClick={() => {
            // Handle view profile
          }}
        >
          <span className="iconify lucide--user-plus text-base" />
          <span>View Profile</span>
        </DropdownItem>
        
        <hr className="my-2 border-base-content/10" />
        
        <DropdownItem 
          className="text-error py-2 flex items-center gap-2 text-sm hover:bg-error/10 rounded-md" 
          onClick={onLogout}
        >
          <span className="iconify lucide--log-out text-base" />
          <span>Logout</span>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
});

/* --- Main Topbar Component --- */
export const Topbar = () => {
  const { logout, authState } = useAuth();
  const { config } = useConfig();
  const { leftContent, centerContent, rightContent } = useTopbarContent();
  const { tryNavigate } = useNavigationBlocker();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Application state
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [textIndex, setTextIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isNotificationsDialogOpen, setIsNotificationsDialogOpen] = useState(false);
  const [showLogoNavigateDialog, setShowLogoNavigateDialog] = useState(false);
  
  // Mock notification count - replace with real data
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  // Refs for animation state and timer
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDisplayTextRef = useRef(""); // Ref to track current animation display
  const currentIsTypingRef = useRef(true); // Ref to track current animation mode
  const currentTextIndexRef = useRef(0); // Ref to track current text index
  
  // Determine if we're in admin tools
  const isAdminTools = location.pathname.startsWith('/admin-tools');
  const isDarkMode = config.theme === 'dark';

  const doLogout = useCallback(() => {
    logout();
    navigate("/auth/login");
  }, [logout, navigate]);
  
  const toggleNotificationsDialog = useCallback(() => {
    setIsNotificationsDialogOpen(prev => !prev);
  }, []);

  const handleLogoClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }
      event.preventDefault();
      // If already on dashboard, no need to navigate
      if (location.pathname === '/dashboard' || location.pathname === '/') {
        return;
      }
      setShowLogoNavigateDialog(true);
    },
    [location.pathname]
  );

  const handleConfirmLogoNavigate = useCallback(() => {
    setShowLogoNavigateDialog(false);
    navigate("/dashboard");
  }, [navigate]);

  const handleCancelLogoNavigate = useCallback(() => {
    setShowLogoNavigateDialog(false);
  }, []);
  
  // Dynamic text sequences based on current route - Memoized
  const logoTexts = useMemo(() => {
    const currentTitle = getPageTitle(location.pathname);
    return [currentTitle, `SAM - ${currentTitle}`];
  }, [location.pathname]);
  
  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        const safeWidth = width < 200 ? 1200 : width;
        const newIsMobile = safeWidth < 768;
        setIsMobile(newIsMobile);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animation logic for typing effect on logo text
  const animateText = useCallback(() => {
    const typingSpeed = 75;
    const deletingSpeed = 50;
    const pauseDuration = 4000;

    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
    }

    const currentLogoText = logoTexts[currentTextIndexRef.current];

    if (currentIsTypingRef.current) {
      // Typing
      if (currentDisplayTextRef.current.length < currentLogoText.length) {
        currentDisplayTextRef.current += currentLogoText[currentDisplayTextRef.current.length];
        setDisplayText(currentDisplayTextRef.current); // Update React state for display
        animationTimerRef.current = setTimeout(animateText, typingSpeed);
      } else {
        // Done typing, pause
        animationTimerRef.current = setTimeout(() => {
          currentIsTypingRef.current = false;
          animateText();
        }, pauseDuration);
      }
    } else {
      // Deleting
      if (currentDisplayTextRef.current.length > 0) {
        currentDisplayTextRef.current = currentDisplayTextRef.current.slice(0, -1);
        setDisplayText(currentDisplayTextRef.current);
        animationTimerRef.current = setTimeout(animateText, deletingSpeed);
      } else {
        // Done deleting, switch to next text and start typing
        currentIsTypingRef.current = true;
        currentTextIndexRef.current = (currentTextIndexRef.current + 1) % logoTexts.length;
        setTextIndex(currentTextIndexRef.current); // Update state to trigger re-render of logoTexts if needed
        animateText();
      }
    }
  }, [logoTexts]); // Only re-create if logoTexts changes

  // Start/restart animation when logoTexts changes (e.g., route change)
  useEffect(() => {
    // Initialize refs with actual state values on mount or logoTexts change
    currentDisplayTextRef.current = "";
    currentIsTypingRef.current = true;
    currentTextIndexRef.current = 0;
    setDisplayText("");
    setIsTyping(true);
    setTextIndex(0);
    
    animateText();

    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, [logoTexts, animateText]); // Depend on logoTexts and the stable animateText callback

  // Reset animation when app route changes (still needed for a clean reset)
  useEffect(() => {
    setDisplayText("");
    setIsTyping(true);
    setTextIndex(0);
  }, [location.pathname]);

  if (isMobile) {
    return (
      <>
        {/* Mobile Topbar */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-base-100 border-b border-base-300 h-14">
          <div className="h-full flex items-center justify-between px-16">
            <div className="flex items-center gap-2">
              <Link to="/dashboard" onClick={handleLogoClick} className="flex-shrink-0">
                <div className="flex items-center bg-base-200 rounded-md px-1 h-[32px] inline-flex">
                  <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <img src="/images/SAM.ico" alt="SAM Logo" className="h-4 w-4" />
                  </div>
                  <span className="ml-2 text-base font-semibold text-base-content whitespace-nowrap">
                    {location.pathname === '/admin-tools' ? 'SAM - Admin Tools' : displayText}
                    {location.pathname !== '/admin-tools' && (
                      <span className={cn(
                        "border-r-2 ml-0.5",
                        (isTyping && displayText.length < logoTexts[textIndex].length) || (!isTyping && displayText.length > 0)
                          ? "border-base-content animate-[blink_1s_step-end_infinite]"
                          : "border-transparent"
                      )}>
                        &nbsp;
                      </span>
                    )}
                  </span>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <NotificationButton
                onClick={toggleNotificationsDialog}
                count={notificationCount}
                loading={notificationsLoading}
              />
              <ThemeToggleDropdown 
                triggerClass="btn btn-circle btn-ghost btn-sm relative overflow-hidden hover:bg-base-300 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-base-300 cursor-pointer"
                iconClass="text-base-content group-hover:text-base-content/70 transition-all duration-200 group-hover:rotate-6"
              />
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-[95] bg-base-100 border-t border-base-300">
          <div className="flex items-center h-16 px-2">
            <div className="flex-1">
              <button
                type="button"
                onClick={() => tryNavigate("/dashboard")}
                className="flex flex-col items-center justify-center p-0.5 w-full"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="iconify lucide--home text-lg text-base-content" />
                  <span className="text-[10px] text-base-content">Dashboard</span>
                </div>
              </button>
            </div>

            <div className="flex-1">
              <button
                type="button"
                onClick={() => tryNavigate("/admin-tools")}
                className="flex flex-col items-center justify-center p-0.5 w-full"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="iconify lucide--settings text-lg text-base-content" />
                  <span className="text-[10px] text-base-content">Admin</span>
                </div>
              </button>
            </div>
            
            <AccountDropdown
              username={authState.user?.name || authState.user?.username || authState.user?.userName || ""}
              userEmail={authState.user?.email || authState.user?.userCode}
              onLogout={doLogout}
              isMobile={true}
            />
          </div>
        </div>

        <NotificationsDialog
          isOpen={isNotificationsDialogOpen}
          onClose={toggleNotificationsDialog}
        />

        {/* Logo Navigate Confirmation Dialog */}
        {showLogoNavigateDialog && (
          <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[modal-fade_0.2s]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                  <span className="iconify lucide--alert-triangle w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-base-content">Navigate to Dashboard</h3>
                  <p className="text-sm text-base-content/60">Confirm navigation</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-base-content/80">
                  Are you sure you want to go to the dashboard? Any unsaved changes will be lost.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={handleCancelLogoNavigate} className="btn btn-ghost btn-sm px-6">
                  Cancel
                </button>
                <button onClick={handleConfirmLogoNavigate} className="btn btn-warning btn-sm px-6">
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop Topbar
  return (
    <>
      <div
        className="fixed top-0 right-0 z-30 bg-base-100 border-b border-base-300 h-16 transition-all duration-300"
        style={{ left: 'var(--sidebar-width, 52px)' }}
      >
        <div className="h-full flex items-center justify-between px-6 relative">
          {/* Left side - Custom content + App Logo */}
          <div className="flex items-center gap-3 z-10">
            {/* Custom left content (e.g., back button) */}
            {leftContent}

            {/* App Logo - always visible */}
            <Link to="/dashboard" onClick={handleLogoClick} className="flex-shrink-0">
              <div className="flex items-center bg-base-200 rounded-md px-1 h-[36px] inline-flex">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <img src="/images/SAM.ico" alt="SAM Logo" className="h-6 w-6" />
                </div>
                <span className="ml-2 text-lg font-semibold text-base-content whitespace-nowrap">
                  {location.pathname === '/admin-tools' ? 'SAM - Admin Tools' : displayText}
                  {location.pathname !== '/admin-tools' && (
                    <span className={cn(
                      "border-r-2 ml-0.5",
                      (isTyping && displayText.length < logoTexts[textIndex].length) || (!isTyping && displayText.length > 0)
                        ? "border-base-content animate-[blink_1s_step-end_infinite]"
                        : "border-transparent"
                    )}>
                      &nbsp;
                    </span>
                  )}
                </span>
              </div>
            </Link>
          </div>

          {/* Center content - Absolutely positioned to stay fixed in center */}
          {centerContent && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              {centerContent}
            </div>
          )}

          {/* Right side controls */}
          <div className="flex items-center gap-3 z-10">
            {/* Custom right content */}
            {rightContent}

            {/* Database Dropdown */}
            <DatabaseDropdown isMobile={isMobile} />

            {/* Grouped Toggle buttons for Dashboard/Admin Tools - only show on dashboard page and first admin tools page */}
            {!isMobile && !centerContent && (location.pathname.startsWith('/dashboard') || location.pathname === '/admin-tools') && (
              <div className="bg-base-200 rounded-xl p-1 flex items-center gap-1 shadow-sm border border-base-300">
                <button
                  type="button"
                  onClick={() => tryNavigate("/dashboard")}
                  className={`btn btn-circle btn-ghost btn-sm relative overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer group ${
                    !isAdminTools
                      ? 'bg-primary text-primary-content hover:bg-primary/90 shadow-sm'
                      : 'hover:bg-primary/10'
                  }`}
                  title="Dashboard"
                >
                  <span className={`iconify lucide--monitor-dot w-5 h-5 transition-all duration-200 ${
                    !isAdminTools
                      ? 'text-primary-content'
                      : 'text-base-content group-hover:text-primary'
                  }`} />
                </button>
                <button
                  type="button"
                  onClick={() => tryNavigate("/admin-tools")}
                  className={`btn btn-circle btn-ghost btn-sm relative overflow-hidden transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer group ${
                    isAdminTools
                      ? 'bg-primary text-primary-content hover:bg-primary/90 shadow-sm'
                      : 'hover:bg-primary/10'
                  }`}
                  title="Admin Tools"
                >
                  <span className={`iconify lucide--settings w-5 h-5 transition-all duration-200 ${
                    isAdminTools
                      ? 'text-primary-content'
                      : 'text-base-content group-hover:text-primary'
                  }`} />
                </button>
              </div>
            )}

            {/* Theme toggle button */}
            <ThemeToggleDropdown
              triggerClass="btn btn-circle btn-ghost btn-sm relative overflow-hidden hover:bg-base-300 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-base-300 cursor-pointer"
              iconClass="text-base-content group-hover:text-base-content/70 transition-all duration-200 group-hover:rotate-6"
            />

            {/* Notifications Button */}
            <NotificationButton
              onClick={toggleNotificationsDialog}
              count={notificationCount}
              loading={notificationsLoading}
            />

            <AccountDropdown
              username={authState.user?.name || authState.user?.username || authState.user?.userName || ""}
              userEmail={authState.user?.email || authState.user?.userCode}
              onLogout={doLogout}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* Notifications Dialog */}
      <NotificationsDialog
        isOpen={isNotificationsDialogOpen}
        onClose={toggleNotificationsDialog}
      />

      {/* Logo Navigate Confirmation Dialog */}
      {showLogoNavigateDialog && (
        <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[modal-fade_0.2s]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                <span className="iconify lucide--alert-triangle w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-base-content">Navigate to Dashboard</h3>
                <p className="text-sm text-base-content/60">Confirm navigation</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-base-content/80">
                Are you sure you want to go to the dashboard? Any unsaved changes will be lost.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={handleCancelLogoNavigate} className="btn btn-ghost btn-sm px-6">
                Cancel
              </button>
              <button onClick={handleConfirmLogoNavigate} className="btn btn-warning btn-sm px-6">
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
