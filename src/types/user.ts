// User Types matching the backend API

export type UserRole =
  | 'GeneralManager'
  | 'RegionalOperationsManager'
  | 'OperationsManager'
  | 'ContractsManager'
  | 'QuantitySurveyor'
  | 'Accountant'
  | 'Admin'
  | 'ProjectManager';

export interface User {
  id: number;
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userRole: UserRole;
}

export interface UserFormData {
  userName: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userRole: UserRole;
}

export type UserCreateRequest = UserFormData;

export interface UserUpdateRequest extends UserFormData {
  id: number;
}

export interface UserApiResponse {
  isSuccess: boolean;
  success?: boolean; // For backward compatibility
  message?: string;
  data?: User;
  status?: number;
}

export interface UserApiError {
  isSuccess: false;
  success: false;
  message: string;
  status?: number;
}

// Generic API response type that matches the backend API structure
export interface ApiResponse<T = any> {
  isSuccess: boolean;
  success?: boolean; // For backward compatibility
  message?: string;
  data?: T;
  status?: number;
}

// Form field configuration for the user form
export interface UserFormField {
  name: keyof UserFormData;
  label: string;
  type: 'text' | 'email' | 'password' | 'select';
  required: boolean;
  options?: UserRole[];
}

// Display columns for the user table
export type UserTableColumns = {
  [K in keyof Omit<User, 'id' | 'password'>]: string;
};

// Auth context user type - matches backend LoginResponse
export interface AuthUser {
  token: string;
  userName: string;
  email: string;
  name: string;
  roleType: number; // Backend sends UserType enum as number
  database?: string; // Store selected database
  // Legacy support fields
  roleid?: number; 
  username?: string;
  userCode?: string;
}

export interface AuthState {
  user?: AuthUser;
}