// Main component
export { default as Spreadsheet } from "./Spreadsheet";

// Sub-components
export { default as SheetTabs } from "./SheetTabs";
export { default as LongTextDialog } from "./LongTextDialog";

// Hooks
export { useOverflowDetection } from "./useOverflowDetection";

// All types from types.ts
export type {
  // Core types
  CellEditorType,
  SpreadsheetMode,
  SpreadsheetVariant,
  CellPosition,
  SelectionRange,
  SelectionMode,
  NavigationDirection,

  // Column configuration
  SpreadsheetColumn,

  // Excel configuration
  SpreadsheetExcelConfig,

  // Ref interface
  SpreadsheetRef,

  // Feature configurations
  InlineRowCreationConfig,
  RowHeightResizeConfig,
  ContextMenuItem,
  ContextMenuConfig,
  CostCodeDialogConfig,
  HourValidationConfig,
  HourValidationError,
  CalculatedFieldConfig,
  DirtyTrackingConfig,
  DynamicColumnConfig,
  MultiRowSelectionConfig,
  PositionSummaryConfig,
  SpreadsheetFeatures,

  // Plugin system
  CellInfo,
  PluginContext,
  SpreadsheetPlugin,

  // Sheet tabs
  SheetTab,

  // Main props
  SpreadsheetProps,

  // Utility types
  DeepPartial,
  ExtractRowType
} from "./types";

// Constants
export {
  DEFAULT_ROW_HEIGHT,
  DEFAULT_OVERSCAN,
  DEFAULT_MIN_BUFFER_ROWS,
  DEFAULT_MIN_RENDER_ROWS,
  DEFAULT_COLUMN_MIN_WIDTH,
  DEFAULT_COLUMN_MAX_WIDTH
} from "./types";
