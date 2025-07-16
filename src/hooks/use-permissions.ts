import { useMemo } from 'react';
import { useAuth } from '@/contexts/auth';
import { UserRole } from '@/types/user';
import {
  checkPermission,
  isAdmin,
  canManageUsers,
  canAddEditSubcontractors,
  canDeleteSubcontractors,
  canAddDeleteCurrencies,
  canEditCurrencyRates,
  canManageCostCodes,
  canManageTrades,
  canManageTemplates,
  canViewTemplates,
  canManageUnits,
  ROLE_PERMISSIONS
} from '@/utils/permissions';

// Map role IDs to role names based on the user data provided
// This maps both legacy roleid and backend UserType enum values
const ROLE_ID_MAP: Record<number, UserRole> = {
  0: 'GeneralManager',
  1: 'RegionalOperationsManager', 
  2: 'OperationsManager',
  3: 'ContractsManager',
  4: 'QuantitySurveyor',
  5: 'Accountant',
  6: 'Admin',  // Based on your debug output, roleType: 6 should be Admin
};

export const usePermissions = () => {
  const { authState } = useAuth();
  
  const userRole = useMemo(() => {
    // Check if roleType is provided (backend sends it as a number)
    if (authState.user?.roleType !== undefined) {
      return ROLE_ID_MAP[authState.user.roleType];
    }
    
    // Fallback to roleid mapping (legacy support)
    if (authState.user?.roleid !== undefined) {
      return ROLE_ID_MAP[authState.user.roleid];
    }
    
    return undefined;
  }, [authState.user?.roleType, authState.user?.roleid]);


  const permissions = useMemo(() => ({
    // General permissions
    isAdmin: isAdmin(userRole),
    userRole,
    
    // Users management
    canManageUsers: canManageUsers(userRole),
    
    // Subcontractors
    canAddEditSubcontractors: canAddEditSubcontractors(userRole),
    canDeleteSubcontractors: canDeleteSubcontractors(userRole),
    
    // Currencies
    canAddDeleteCurrencies: canAddDeleteCurrencies(userRole),
    canEditCurrencyRates: canEditCurrencyRates(userRole),
    
    // Cost codes
    canManageCostCodes: canManageCostCodes(userRole),
    
    // Trades
    canManageTrades: canManageTrades(userRole),
    
    // Templates
    canManageTemplates: canManageTemplates(userRole),
    canViewTemplates: canViewTemplates(userRole),
    
    // Units
    canManageUnits: canManageUnits(userRole),
    
    // Generic permission checker
    hasPermission: (permission: keyof typeof ROLE_PERMISSIONS) => checkPermission(userRole, permission),
  }), [userRole]);

  return permissions;
};