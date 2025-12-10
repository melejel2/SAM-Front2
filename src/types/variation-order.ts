// Variation Order Types matching the backend API

// Re-export VO API types for backward compatibility (avoid conflicts)
export type {
  ContractContext,
  ContractBuilding,
  VoApiResponse,
  VoApiError
} from '@/api/services/vo-api';

// Enums - Updated to match backend enum exactly (SAMBACK/SAMBackend.Domain/Enums/ContractDatasetStatus.cs)
export enum ContractDatasetStatus {
  Editable = 0,
  Terminated = 1,
  Active = 2,
  PendingApproval = 3,
  None = 4
}

export enum VOType {
  BudgetBOQ = 'budget-boq',     // Budget-level VOs that modify project BOQs
  ContractDataset = 'contract-dataset'  // Subcontractor-specific VOs for individual contracts
}

export enum BoqDeletionScope {
  Sheet = 0,
  Building = 1,
  Project = 2
}

export enum BOQType {
  Header = 0,
  Item = 1,
  SubTotal = 2,
  Total = 3
}

export enum ContractType {
  VO = 0,
  RG = 1,
  Terminate = 2,
  Final = 3
}

// Core VO Types
export interface VariationOrder {
  id: number;
  voNumber: string;
  title?: string;
  description?: string;
  level: 'Project' | 'Building' | 'Sheet';
  projectId: number | null;
  buildingId: number | null;
  status: string;
  date: string | null;
  voSheets: VOSheetsModel[];
}

export interface VODataset {
  id: number;
  voNumber: string;
  contractId: number;
  projectId: number;
  status: string;
  date: string | null;
}

export interface CreateVORequest {
  title: string;
  description: string;
  level: 'Project' | 'Building' | 'Sheet';
  projectId: number | null;
  buildingId: number | null;
  voSheets: VOSheetsModel[];
}
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

export interface Building {
  id: number;
  name: string;
  projectLevel: number;
  subContractorLevel: number;
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
  /** When true, applies VO data to all buildings with the same Type (identical buildings). Default: false */
  applyToIdenticalBuildings?: boolean;
  excelFile?: File;
}

// Subcontractor VO Creation Request (now transforms to VoDatasetBoqDetailsVM for SaveVoDataset endpoint)
export interface CreateSubcontractorVoRequest {
  VoNumber: string;
  Description: string;
  Reason?: string;
  Amount: number;
  Type: string; // "Addition" or "Deduction"
  ContractDatasetId: number;
  SubcontractorId: number;
  ProjectId: number;
  BuildingId: number;
  Date: string; // ISO date string
}

export interface ImportContractVoRequest {
  contractDataSetId: number;
  excelFile: File;
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

// VO Template Types
export interface VOContractVM {
  id: number;
  name: string;
  templateNumber: string;
  type: ContractType;
  language: string;
  created: string;
  content?: Uint8Array;
  fileSize?: string;
}

export interface UploadVOTemplateRequest {
  name: string;
  templateNumber: string;
  type: ContractType;
  language?: string;
  templateFile: File;
}

// VO Level Hierarchy Types
export type VOLevelType = 'Project' | 'Building' | 'Sheet';

export interface VOLevelContext {
  level: VOLevelType;
  projectId?: number;
  buildingId?: number;
  sheetId?: number;
  projectName?: string;
  buildingName?: string;
  sheetName?: string;
}

export interface VOLevelHierarchyState {
  currentLevel: VOLevelType;
  context: VOLevelContext;
  filteredItems: ContractVoesVM[];
  availableBuildings: VoDataSetBuildingsVM[];
  availableSheets: { id: number; name: string }[];
}

// VO Type Selection Types
export interface VOTypeSelectionData {
  voType: VOType;
  selectedFor?: {
    // For Budget BOQ VOs
    projectId?: number;
    projectName?: string;
    
    // For Contract Dataset VOs
    contractDatasetId?: number;
    contractNumber?: string;
    subcontractorId?: number;
    subcontractorName?: string;
  };
}