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
  deductionAmount: number;
  previousDeduction: number;
  actualDeduction: number;
  actAmount: number;
  perAmount: number;
  contractsDatasetId?: number;
  ref?: string;
  machineType?: string;
  precedentAmount: number;
  machineCode_Id?: number;
  precedentAmountOld: number;
  machineAcronym?: string;
}

export interface MaterialsVM {
  id: number;
  bc?: string;
  designation?: string;
  acronym?: string;
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
  deductionAmount: number;
  previousDeduction: number;
  actualDeduction: number;
  actAmount: number;
  perAmount: number;
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
}

// VO-related DTOs
export interface Vos {
  // VO structure - to be defined based on backend Vo.Vos class
  [key: string]: any;
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
export interface SaveIPCVM extends IpcVM {
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
  error?: string;
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
  
  // BOQ progress data
  buildings: ContractBuildingsVM[];
  
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

