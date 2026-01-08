import { UserRole } from "@/types/user";

export const ROLE_PERMISSIONS = {
  // Users management - only Admin can add/edit/delete
  USERS_MANAGE: ['Admin'],
  
  // Subcontractors - OperationsManager and ContractsManager can add/edit, only Admin can delete
  SUBCONTRACTORS_ADD_EDIT: ['Admin', 'OperationsManager', 'ContractsManager'],
  SUBCONTRACTORS_DELETE: ['Admin'],
  
  // Currencies - only Admin can add/delete, OperationsManager and ContractsManager can edit conversion rates
  CURRENCIES_ADD_DELETE: ['Admin'],
  CURRENCIES_EDIT_RATES: ['Admin', 'OperationsManager', 'ContractsManager'],
  
  // Cost codes - only Admin can add/edit/delete
  COST_CODES_MANAGE: ['Admin'],
  
  // Trades - only Admin can add/edit/delete
  TRADES_MANAGE: ['Admin'],
  
  // Templates - Admin and ContractsManager can add/edit, only Admin can delete, others can preview/download
  TEMPLATES_ADD_EDIT: ['Admin', 'ContractsManager'],
  TEMPLATES_DELETE: ['Admin'],
  TEMPLATES_VIEW: ['Admin', 'GeneralManager', 'RegionalOperationsManager', 'OperationsManager', 'ContractsManager', 'QuantitySurveyor', 'Accountant'],
  
  // Units - only Admin can add/edit/delete
  UNITS_MANAGE: ['Admin'],

  // Previous Value Corrections - ContractsManager, QuantitySurveyor, OperationsManager, and Admin
  PREVIOUS_VALUES_CORRECT: ['Admin', 'ContractsManager', 'QuantitySurveyor', 'OperationsManager'],
} as const;

export const checkPermission = (userRole: UserRole | undefined, permission: keyof typeof ROLE_PERMISSIONS): boolean => {
  if (!userRole) return false;
  const allowedRoles = ROLE_PERMISSIONS[permission] as readonly UserRole[];
  return allowedRoles.includes(userRole);
};

export const isAdmin = (userRole: UserRole | undefined): boolean => {
  return userRole === 'Admin';
};

export const canManageUsers = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'USERS_MANAGE');
};

export const canAddEditSubcontractors = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'SUBCONTRACTORS_ADD_EDIT');
};

export const canDeleteSubcontractors = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'SUBCONTRACTORS_DELETE');
};

export const canAddDeleteCurrencies = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'CURRENCIES_ADD_DELETE');
};

export const canEditCurrencyRates = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'CURRENCIES_EDIT_RATES');
};

export const canManageCostCodes = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'COST_CODES_MANAGE');
};

export const canManageTrades = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'TRADES_MANAGE');
};

export const canAddEditTemplates = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'TEMPLATES_ADD_EDIT');
};

export const canDeleteTemplates = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'TEMPLATES_DELETE');
};

export const canManageTemplates = (userRole: UserRole | undefined): boolean => {
  return canAddEditTemplates(userRole);
};

export const canViewTemplates = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'TEMPLATES_VIEW');
};

export const canManageUnits = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'UNITS_MANAGE');
};

/**
 * Check if user can correct previous values in IPCs.
 * ContractsManager, QuantitySurveyor, OperationsManager, and Admin can correct values.
 */
export const canCorrectPreviousValues = (userRole: UserRole | undefined): boolean => {
  return checkPermission(userRole, 'PREVIOUS_VALUES_CORRECT');
};