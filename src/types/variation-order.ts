// Variation Order Types matching the backend API

// Enums
export enum ContractDatasetStatus {
  Editable = 0,
  Terminated = 1,
  Active = 2
}

export enum BoqDeletionScope {
  Sheet = 0,
  Building = 1,
  Project = 2
}

// Core VO Types
export interface VoItemsModel {
  id: number;
  level: number;
  orderVo: number;
  no: string | null;
  key: string | null;
  unite: string | null;
  qte: number;
  pu: number;
  costCode: string | null;
  costCodeId: number | null;
}

export interface VOSheetsModel {
  id: number;
  sheetName: string | null;
  voItems: VoItemsModel[];
}

export interface VoVM {
  buildingId: number;
  voLevel: number;
  voSheets: VOSheetsModel[];
}

// VO Dataset Types
export interface VoDatasetVM {
  id: number;
  contractNumber: string;
  voNumber: string;
  date: string | null;
  status: string;
  projectId: number | null;
  projectName: string;
  subcontractorId: number | null;
  subcontractorName: string | null;
  type: string;
  amount: number;
  tradeName: string | null;
}

export interface ContractVoesVM {
  id: number;
  no: string | null;
  key: string | null;
  unite: string | null;
  qte: number;
  pu: number;
  costCode: string | null;
  costCodeId: number | null;
  boqtype: string;
  boqSheetId: number;
  sheetName: string;
  level: number;
  orderVo: number;
  totalPrice: number; // Computed property: Qte * Pu
}

export interface VoDataSetBuildingsVM {
  id: number;
  buildingName: string;
  contractVoes: ContractVoesVM[];
}

export interface VoDatasetBoqDetailsVM extends VoDatasetVM {
  buildingId: number | null;
  contractId: number | null;
  contractsDatasetId: number | null;
  subTrade: string | null;
  remark: string | null;
  buildings: VoDataSetBuildingsVM[];
}

// Request Types
export interface ImportVoRequest {
  projectId: number;
  buildingId: number;
  sheetId: number;
  voLevel?: number;
  isFromBudgetBoq?: boolean;
  excelFile?: File;
}

export interface ClearBoqItemsRequest {
  scope: BoqDeletionScope;
  projectId: number;
  buildingId?: number | null;
  sheetId?: number | null;
}

// API Response Types
export interface VariationOrderApiResponse<T = any> {
  isSuccess: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  status?: number;
}

export interface VariationOrderApiError {
  isSuccess: false;
  success: false;
  message: string;
  status?: number;
}

// Form and Display Types
export interface VOFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'file';
  required: boolean;
  options?: string[];
}

// Table columns for displaying VOs
export type VOTableColumns = {
  [key: string]: string;
};

// Upload response type
export interface UploadVoResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

// Generic result type matching backend
export interface VOServiceResult<T = any> {
  isSuccess: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

// Status formatting helpers
export interface StatusBadgeConfig {
  class: string;
  displayText: string;
}

export interface FormattedVoDataset extends Omit<VoDatasetVM, 'date' | 'amount' | 'status'> {
  date: string; // Formatted date
  amount: string; // Formatted currency
  status: string; // HTML badge
  originalStatus: string; // Original status for filtering
}