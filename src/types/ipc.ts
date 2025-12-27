// IPC API Types - Synchronized with SAMBACK DTOs

// Financial Constants
export const FINANCIAL_CONSTANTS = {
  DEFAULT_VAT_RATE: 0.18, // 18% VAT rate
  DEFAULT_RETENTION_RATE: 0.10, // 10% retention
  MAX_ADVANCE_PAYMENT: 0.30, // 30% maximum advance payment
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
  WIZARD_PERSISTENCE_HOURS: 24 // Extended from 1 hour to 24 hours
} as const;

// Enums
export enum IpcStatus {
  Editable = "Editable",
  PendingApproval = "PendingApproval",
  Issued = "Issued"
}

// Core IPC DTOs matching backend
export interface IpcSummaryData {
  amount: number;
  previousPaid: number;
  remaining: number;
}

export interface BoqIpcVM {
  id: number;
  no?: string; // BOQ item code/reference
  key?: string; // BOQ item description
  unite?: string; // Alternative unit field name
  qte: number;
  unitPrice: number;
  orderBoq: number;
  cumulQte: number;
  actualQte: number;
  precedQte: number;
  totalAmount: number; // computed property: qte * unitPrice
  cumulAmount: number; // computed property: unitPrice * cumulQte
  actualAmount: number; // computed property: unitPrice * actualQte
  precedAmount: number; // computed property: unitPrice * precedQte
  cumulPercent: number; // computed property: qte == 0 ? 0 : (cumulQte / qte) * 100
}

export interface ContractBuildingsVM {
  id: number;
  buildingName: string;
  sheetId?: number; // Optional - may not be present in all API responses
  sheetName?: string; // Optional - may not be present in all API responses
  boqsContract: BoqIpcVM[];
}

// Deduction DTOs (still referenced in SaveIPCVM)
export interface LaborsVM {
  id: number;
  ref?: string;
  activityDescription?: string;
  unit?: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  contractsDatasetId?: number;
  consumedAmount: number;
  actualAmount: number;
  deduction: number;
  precedentAmount: number;
  precedentAmountOld: number;
  previousDeduction: number;
  actualDeduction: number;
  laborType?: string;
  workerType?: string;
  previousAmount?: number;
}

export interface MachinesVM {
  id: number;
  unit?: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  consumedAmount: number;
  actualAmount: number;
  deduction: number;
  previousDeduction: number;
  actualDeduction: number;
  contractsDatasetId?: number;
  ref?: string;
  machineType?: string;
  precedentAmount: number;
  machineCode_Id?: number;
  precedentAmountOld: number;
  machineAcronym?: string;
  previousAmount?: number;
}

export interface MaterialsVM {
  id: number;
  bc?: string;
  designation?: string;
  subcontractor?: string;
  contract?: string;
  unit?: string;
  allocated: number;
  quantity: number; // Ordered Quantity
  saleUnit: number; // Unit Price
  stockQte: number;
  transferedQte: number;
  livree: number; // Delivered Qte
  actualAmount: number;
  deduction: number;
  previousDeduction: number;
  actualDeduction: number;
  consumedAmount: number;
  isTransferred: boolean;
  remark?: string;
  transferedTo?: string;
  transferedToID?: number;
  totalSale: number;
  consumes: number;
  contractDatasetId?: number;
  precedentAmount: number;
  po_Id?: number;
  precedentAmountOld: number;
  cumulAmount?: number; // New field for cumulative amount
  previousAmount?: number;
}

// VO-related DTOs for SaveIPCVM
export interface VOBoqIpcVM {
    id: number;
    no: string | null;
    key: string | null;
    unite: string | null;
    qte: number;
    unitPrice: number;
    cumulQte: number;
    actualQte: number;
    precedQte: number;
    totalAmount?: number;
    cumulAmount?: number;
    actualAmount?: number;
    precedAmount?: number;
    cumulPercent?: number;
}

export interface VoBuildingsVM {
    id: number;
    buildingName: string;
    boqs: VOBoqIpcVM[];
}

export interface Vos {
    id: number;
    voNumber: string;
    type: string;
    buildings: VoBuildingsVM[];
}

export interface IpcDataExtended extends IpcVM {
    vos: Vos[];
    labors: LaborsVM[];
    machines: MachinesVM[];
    materials: MaterialsVM[];
}

// Base IPC VM
export interface IpcVM {
  id: number;
  contractsDatasetId: number;
  status: string;
  totalAmount: number;
  type?: string;
  number: number;
  isGenerated: boolean;
  paid: number;
  projectId: number;
  projectName: string;
  subcontractorId: number;
  subcontractorName: string;
  tradeId: number;
  tradeName: string;
  contract: string;
}

// Enhanced Save IPC VM with new penalty fields
export interface SaveIPCVM extends IpcDataExtended {
  // NEW: Summary data for IPC edit forms
  ipcSummaryData?: IpcSummaryData;

  advancePayment: number;
  retentionPercentage: number;
  advancePaymentPercentage: number;
  retentionAmount: number;
  advancePaymentAmount: number;

  // NEW: Enhanced penalty management
  penalty: number;
  openPenaltyForm: boolean; // NEW: Flag to conditionally open penalty modal
  previousPenalty: number; // NEW: Previous penalty amount for calculations

  contractActivated: boolean;
  retention: number;
  advancePaymentAmountCumul: number;
  retentionAmountCumul: number;
  apRecovery: number;
  prorata: number;
  fromDate?: string;
  toDate?: string;
  dateIpc?: string;

  // Previous IPC's toDate for auto-setting fromDate in new IPC
  previousIpcToDate?: string;

  // Additional fields
  advance?: number;
  remarks?: string;
  contractsDataset?: any;

  // Collections
  buildings: ContractBuildingsVM[];
  vos: Vos[];
  labors: LaborsVM[];
  machines: MachinesVM[];
  materials: MaterialsVM[];
}

// Request DTOs
export interface CreateIpcRequest {
  contractsDatasetId: number;
  type?: string;
  fromDate?: string;
  toDate?: string;
  dateIpc?: string;
  buildings: ContractBuildingsVM[];
}

export interface UpdateIpcRequest extends SaveIPCVM {
  // All SaveIPCVM properties are available for update
}

// Response DTOs
export interface IpcListItem {
  id: number;
  contract: string;
  number: number;
  subcontractorName: string;
  tradeName: string;
  totalAmount: number;
  status: string;
  type?: string;
  retention: number;
  contractsDatasetId: number;
  isGenerated: boolean;
  paid: number;
  projectId: number;
  projectName: string;
  subcontractorId: number;
  tradeId: number;
}

// API Response Types
export interface IpcApiResponse<T = any> {
  success: boolean;
  isSuccess?: boolean;
  message?: string;
  data?: T;
  error?: { code?: string; message: string; };
}

export interface BackendDataWrapper<T = any> {
  value: T;
  isSuccess: boolean;
  isFailure: boolean;
  error: {
    code: string;
    message: string;
  };
}

export interface IpcApiResult<T = any> {
  isSuccess: boolean;
  success?: boolean;
  data?: T;
  error?: {
    message: string;
  };
  message?: string;
}

// Frontend Form Types
export interface IpcWizardFormData {
  // Basic info
  contractsDatasetId: number;
  type: string;
  fromDate: string;
  toDate: string;
  dateIpc: string;

  // Financial calculations
  advancePayment: number;
  retentionPercentage: number;
  advancePaymentPercentage: number;
  penalty: number;
  previousPenalty: number;
  penaltyReason?: string; // Optional penalty reason/description

  // BOQ progress data
  buildings: ContractBuildingsVM[];
  vos: Vos[];

  // Deduction data (if still used)
  labors: LaborsVM[];
  machines: MachinesVM[];
  materials: MaterialsVM[];
}

// Supporting types for dropdowns and selections
export interface IpcTypeOption {
  value: string;
  label: string;
}

export const IpcTypeOptions: IpcTypeOption[] = [
  { value: "Provisoire / Interim", label: "Provisoire / Interim" },
  { value: "Final / Final", label: "Final / Final" },
  { value: "Rg / Retention", label: "Rg / Retention" },
  { value: "Avance / Advance Payment", label: "Avance / Advance Payment" }
];

export const IpcStatusOptions: IpcTypeOption[] = [
  { value: "Editable", label: "Editable" },
  { value: "Pending Approval", label: "Pending Approval" },
  { value: "Issued", label: "Issued" }
];

// ============================================
// Previous Value Correction Types
// ============================================

/**
 * Entity types that can have their previous values corrected.
 * Maps to backend CorrectionEntityType enum.
 */
export enum CorrectionEntityType {
  ContractBoqItem = 0,
  ContractVo = 1,
  Labor = 2,
  Machine = 3,
  Material = 4
}

/**
 * Request DTO for correcting a previous value.
 * Only Contract Managers and Quantity Surveyors can make corrections.
 */
export interface CorrectPreviousValueRequest {
  entityType: CorrectionEntityType;
  entityId: number;
  contractDatasetId: number;
  fieldName: 'PrecedQte' | 'CumulQte' | 'PrecedentAmount';
  newValue: number;
  reason: string;
}

/**
 * Response DTO showing the result of a correction.
 */
export interface CorrectionResultDTO {
  correctionId: number;
  oldValue: number;
  newValue: number;
  fieldName: string;
  correctedAt: string;
  recalculatedValues?: RecalculatedValuesDTO;
}

/**
 * Recalculated values after a correction is applied.
 */
export interface RecalculatedValuesDTO {
  // For BOQ/VO items
  precedAmount?: number;
  actualQte?: number;
  cumulQte?: number;
  actualAmount?: number;
  // For Deductions
  previousDeduction?: number;
  actualDeduction?: number;
}

/**
 * DTO for displaying correction history in the audit trail.
 */
export interface CorrectionHistoryDTO {
  id: number;
  entityType: string;
  entityId: number;
  entityDescription: string;
  fieldName: string;
  oldValue: number;
  newValue: number;
  reason: string;
  correctedByName: string;
  correctedAt: string;
  contractDatasetId: number;
}

/**
 * Request DTO for querying correction history.
 */
export interface CorrectionHistoryRequest {
  contractDatasetId?: number;
  entityType?: CorrectionEntityType;
  entityId?: number;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

/**
 * Props for the correction modal component.
 */
export interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: CorrectionEntityType;
  entityId: number;
  contractDatasetId: number;
  fieldName: 'PrecedQte' | 'CumulQte' | 'PrecedentAmount';
  fieldLabel: string;
  currentValue: number;
  entityDescription: string;
  onCorrect: (request: CorrectPreviousValueRequest) => Promise<CorrectionResultDTO | null>;
}

/**
 * Props for the correction history modal component.
 */
export interface CorrectionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractDatasetId: number;
  entityType?: CorrectionEntityType;
  entityId?: number;
  onFetchHistory: (request: CorrectionHistoryRequest) => Promise<CorrectionHistoryDTO[]>;
}

