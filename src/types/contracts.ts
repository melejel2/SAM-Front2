// Contracts API Types - Synchronized with SAMBACK DTOs

// Enums
export enum ContractDatasetStatus {
  Editable = 0,
  Terminated = 1,
  Active = 2,
  PendingApproval = 3,
  None = 4
}

export enum ContractType {
  Subcontractor = 0,
  Supplier = 1,
  Other = 2
}

export enum AttachmentsType {
  PDF = 0,
  Word = 1
}

// Keep the old name for backward compatibility
export const AttachmentType = AttachmentsType;

// Core DTOs matching backend
export interface BoqContractVM {
  id: number;
  no?: string;
  key?: string;
  unite?: string;
  qte: number;
  pu: number;
  costCode?: string;
  costCodeId?: number | null;
  boqtype: string;
  boqSheetId: number;
  sheetName: string;
  orderBoq: number;
  totalPrice: number;
}

export interface SubcontractorBuildingsVM {
  id: number;
  buildingName: string;
  sheetId: number;
  sheetName: string;
  replaceAllItems?: boolean;
  boqsContract: BoqContractVM[];
}

export interface SubcontractorBoqVM {
  [key: string]: any; // Allow index signature for API compatibility
  id: number;
  currencyId: number;
  projectId: number;
  subContractorId: number;
  contractId: number;
  contractDatasetStatus: string;
  
  // Contract details from ContractsDataSetBase
  contractDate?: string;
  completionDate?: string;
  purchaseIncrease?: string;
  latePenalties?: string;
  latePenalityCeiling?: string;
  holdWarranty?: string;
  mintenancePeriod?: string;
  workWarranty?: string;
  termination?: string;
  daysNumber?: string;
  progress?: string;
  holdBack?: string;
  subcontractorAdvancePayee?: string;
  recoverAdvance?: string;
  procurementConstruction?: string;
  prorataAccount?: string;
  managementFees?: string;
  contractNumber?: string;
  remark?: string;
  remarkCP?: string;
  isGenerated: boolean;
  advancePayment: number;
  plansExecution?: string;
  subTrade?: string;
  paymentsTerm?: string;
  materialSupply: number;
  
  buildings: SubcontractorBuildingsVM[];
}

// Request DTOs
export interface CopyBoqItemsRequest {
  [key: string]: any; // Allow index signature for API compatibility
  sheetName: string;
  buildingIds: number[];
}

export interface ImportContractBoqsRequest {
  contractsDataSetId: number;
  buildingId: number;
  sheetName: string;
  excelFile?: File;
}

export interface ClearContractBoqItemsRequest {
  [key: string]: any; // Allow index signature for API compatibility
  contractDataSetId: number;
  buildingId?: number;
}

export interface AttachDocVM {
  contractsDataSetId: number;
  attachmentsType: AttachmentsType;
  wordFile: File;
}

// Response DTOs
export interface ContractExportResult {
  fileName: string;
  wordFile: ArrayBuffer;
  pdfFile: ArrayBuffer;
}

export interface ContractDatasetListItem {
  id: number;
  contractNumber?: string;
  projectName?: string;
  subcontractorName?: string;
  tradeName?: string;
  contractDate?: string;
  completionDate?: string;
  amount?: number;
  status?: string;
  projectId?: number;
  subcontractorId?: number;
  contractId?: number;
  isGenerated?: boolean;
}

// API Response Types
export interface ApiResult<T = any> {
  isSuccess: boolean;
  success?: boolean;
  data?: T;
  error?: {
    message: string;
  };
  message?: string;
}

export interface ContractsApiResponse<T = any> {
  success: boolean;
  isSuccess?: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Frontend Form Types (for wizard)
export interface ContractWizardFormData {
  // IDs
  projectId: number | null;
  buildingIds: number[];
  subcontractorId: number | null;
  contractId: number | null;
  currencyId: number | null;
  
  // Basic contract info
  contractNumber: string;
  contractDate: string;
  completionDate: string;
  
  // Financial terms
  advancePayment: number;
  materialSupply: number;
  
  // Contract terms
  purchaseIncrease: string;
  latePenalties: string;
  latePenalityCeiling: string;
  holdWarranty: string;
  mintenancePeriod: string;
  workWarranty: string;
  termination: string;
  daysNumber: string;
  progress: string;
  holdBack: string;
  subcontractorAdvancePayee: string;
  recoverAdvance: string;
  procurementConstruction: string;
  prorataAccount: string;
  managementFees: string;
  plansExecution: string;
  subTrade: string;
  paymentsTerm: string;
  
  // Notes
  remark: string;
  remarkCP: string;
  
  // Attachments and BOQ data
  attachments: {
    file: File;
    type: string;
  }[];
  boqData: {
    buildingId: number;
    buildingName: string;
    sheetName: string;
    items: BoqItem[];
  }[];
}

export interface BoqItem {
  id?: number;
  no: string;
  key: string;
  costCode?: string;
  unite: string;
  qte: number;
  pu: number;
  totalPrice?: number;
}

// Supporting types
export interface Project {
  id: number;
  code: string;
  name?: string;
  acronym?: string;
  city?: string;
}

export interface Building {
  id: number;
  name: string;
  buildingName?: string;
}

export interface Subcontractor {
  id: number;
  name: string | null;
  siegeSocial?: string | null;
  commerceRegistrar?: string | null;
  commerceNumber?: string | null;
  taxNumber?: string | null;
  representedBy?: string | null;
  qualityRepresentive?: string | null;
  subcontractorTel?: string | null;
}

export interface Contract {
  id: number;
  templateName: string;
  type: string;
  contractType?: string;
}

export interface Currency {
  id: number;
  name: string;
  currencies: string; // This is the code/symbol
}
