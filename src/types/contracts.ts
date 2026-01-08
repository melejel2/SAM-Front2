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

// Payment Terms/Method options - matches SAM-Desktop dropdown
export const PAYMENT_TERMS_OPTIONS = [
  { value: "Effet / Trade Bill", label: "Effet / Trade Bill" },
  { value: "Chèque ou effet / Check or Bill", label: "Chèque ou effet / Check or Bill" },
  { value: "Chèque ou virement / Check or Transfer", label: "Chèque ou virement / Check or Transfer" },
  { value: "Paiement en Espèces / Cash Payment", label: "Paiement en Espèces / Cash Payment" },
] as const;

// Particular Conditions VM - matches backend ContractsDataSetBase + Id
export interface ParticularConditionVM {
  // Index signature required for apiRequest body parameter compatibility
  [key: string]: unknown;
  id: number;
  contractDate?: string | null;
  completionDate?: string | null;
  purchaseIncrease?: string | null;
  latePenalties?: string | null;
  latePenaliteCeiling?: string | null;
  holdWarranty?: string | null;
  mintenancePeriod?: string | null;
  workWarranty?: string | null;
  termination?: string | null;
  daysNumber?: string | null;
  progress?: string | null;
  holdBack?: string | null;
  /** Advance payment eligible percentage (e.g., "20" for 20%). Use this for display, NOT advancePayment. */
  subcontractorAdvancePayee?: string | null;
  recoverAdvance?: string | null;
  procurementConstruction?: string | null;
  prorataAccount?: string | null;
  managementFees?: string | null;
  contractNumber?: string | null;
  contractDatasetStatus: ContractDatasetStatus;
  remark?: string | null;
  remarkCP?: string | null;
  isGenerated: boolean;
  /** LEGACY: Stores total BOQ amount (NOT a percentage). For percentage, use subcontractorAdvancePayee. */
  advancePayment: number;
  plansExecution?: string | null;
  subTrade?: string | null;
  paymentsTerm?: string | null;
  materialSupply: number;
  vat: number;
}

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
  // Index signature required for apiRequest body parameter compatibility
  [key: string]: unknown;
  id: number;
  currencyId: number;
  projectId: number;
  subContractorId: number;
  contractId: number;
  contractDatasetStatus: string;
  
  // NEW: Total contract amount calculated from BOQ items (added in commit diff)
  amount: number;
  
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
  /** Advance payment eligible percentage (e.g., "20" for 20%). Use this for display, NOT advancePayment. */
  subcontractorAdvancePayee?: string;
  recoverAdvance?: string;
  procurementConstruction?: string;
  prorataAccount?: string;
  managementFees?: string;
  contractNumber?: string;
  remark?: string;
  remarkCP?: string;
  isGenerated: boolean;
  /** LEGACY: Stores total BOQ amount (NOT a percentage). For percentage, use subcontractorAdvancePayee. */
  advancePayment: number;
  plansExecution?: string;
  subTrade?: string;
  paymentsTerm?: string;
  materialSupply: number;
  vat: number;

  buildings: SubcontractorBuildingsVM[];
}

// Request DTOs
export interface CopyBoqItemsRequest {
  // Index signature required for apiRequest body parameter compatibility
  [key: string]: unknown;
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
  // Index signature required for apiRequest body parameter compatibility
  [key: string]: unknown;
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
  vat: number;

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
