// Variation Orders Module Exports

// Main Dashboard Component
export { default as VariationOrdersDashboard } from './VariationOrdersDashboard';

// Form Components
export { default as CreateVOForm } from './forms/CreateVOForm';

// Modal Components  
export { default as VOUploadModal } from './modals/VOUploadModal';
export { default as VOPreviewModal } from './modals/VOPreviewModal';
export { default as ConfirmDeleteModal } from './modals/ConfirmDeleteModal';

// Main hooks
export { default as useVariationOrders } from './use-variation-orders';
export { default as useVoDatasets } from './use-vo-datasets';
export { default as useVoBOQ } from './use-vo-boq';

// Re-export types for convenience
export type {
  VoVM,
  VoDatasetVM,
  VoDatasetBoqDetailsVM,
  ContractDatasetStatus,
  ImportVoRequest,
  ClearBoqItemsRequest,
  VariationOrderApiResponse,
  VariationOrderApiError,
  UploadVoResponse,
  VOServiceResult,
  FormattedVoDataset,
  VOTableColumns,
  VoItemsModel,
  VOSheetsModel,
  ContractVoesVM,
  VoDataSetBuildingsVM,
  BoqDeletionScope,
  VOFormField
} from '@/types/variation-order';

// Default export for router
export { default } from './VariationOrdersDashboard';