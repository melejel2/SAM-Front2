import ExcelJS from "exceljs";
import React from "react";

// =============================================================================
// CORE TYPES
// =============================================================================

export type CellEditorType = "text" | "number" | "select" | "checkbox" | "date" | "custom";
export type SpreadsheetMode = "view" | "edit" | "create";
export type SpreadsheetVariant = "default" | "compact" | "pointage" | "tasks";

export type CellPosition = {
  rowIndex: number;
  columnKey: string;
};

export type SelectionRange = {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
};

export type SelectionMode = "cell" | "row" | "column";

// =============================================================================
// COLUMN CONFIGURATION
// =============================================================================

export interface SpreadsheetColumn<T> {
  key: string;
  label: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  editable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  type?: CellEditorType;
  options?: Array<{ label: string; value: any }>;
  headerRender?: (column: SpreadsheetColumn<T>) => React.ReactNode;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  renderEditor?: (
    value: any,
    row: T,
    index: number,
    onChange: (value: any) => void,
    onClose: () => void
  ) => React.ReactNode;
  formatter?: (value: any, row: T, index: number) => any;
  parser?: (value: any, row: T, index: number, column: SpreadsheetColumn<T>) => any;
  cellClassName?: (value: any, row: T, index: number) => string | undefined;
}

// =============================================================================
// EXCEL CONFIGURATION
// =============================================================================

export interface SpreadsheetExcelConfig<T> {
  fileName?: string;
  sheetName?: string;
  exportBuilder?: (rows: T[], columns: SpreadsheetColumn<T>[]) => Promise<ExcelJS.Workbook>;
  importParser?: (workbook: ExcelJS.Workbook, columns: SpreadsheetColumn<T>[], rows: T[]) => Promise<T[]>;
}

// =============================================================================
// REF INTERFACE
// =============================================================================

export interface SpreadsheetRef<T> {
  exportToExcel: () => Promise<void>;
  importFromExcel: (file: File) => Promise<void>;
  resetColumnWidths: () => void;
  getData: () => T[];
}

// =============================================================================
// FEATURE CONFIGURATIONS
// =============================================================================

/** Inline row creation feature (from SiteTasks) */
export interface InlineRowCreationConfig<T = any> {
  /** Template function to create empty row data */
  template: () => Partial<T>;
  /** Callback when row is created */
  onCreateRow: (data: T) => Promise<void>;
  /** Optional validation before create */
  validateBeforeCreate?: (data: Partial<T>) => { valid: boolean; errors?: string[] };
  /** Position of the creation row */
  position?: "top" | "bottom";
  /** Button text */
  buttonText?: string;
  /** Button icon */
  buttonIcon?: string;
}

/** Row height resize feature (from SiteTasks) */
export interface RowHeightResizeConfig {
  enabled: boolean;
  minHeight?: number;
  maxHeight?: number;
  /** LocalStorage key for persisting heights */
  persistKey?: string;
}

/** Context menu feature (from SiteTasks) */
export interface ContextMenuItem {
  label: string;
  action: string;
  icon?: string;
  disabled?: boolean | ((row: any, index: number) => boolean);
  danger?: boolean;
  divider?: boolean;
}

export interface ContextMenuConfig {
  items: ContextMenuItem[];
  onAction: (action: string, row: any, rowIndex: number) => void;
}

/** Cost code dialog feature (from Pointage) */
export interface CostCodeDialogConfig {
  enabled: boolean;
  fetchCostCodes: () => Promise<any[]>;
  onSelect: (rowIndex: number, costCodeId: number, costCode: any) => void;
  /** Column key that triggers cost code dialog */
  triggerColumn?: string;
}

/** Hour validation feature (from Pointage) */
export interface HourValidationConfig {
  maxCellHours: number;
  maxDailyHours: number;
  hourColumns: string[];
  onValidationError?: (errors: HourValidationError[]) => void;
}

export interface HourValidationError {
  rowIndex: number;
  columnKey: string;
  type: "cell_limit" | "daily_limit";
  value: number;
  limit: number;
  message: string;
}

/** Calculated fields feature (from Progress) */
export interface CalculatedFieldConfig<T = any> {
  /** Target column to update */
  targetColumn: string;
  /** Calculate function */
  calculate: (row: T, allRows: T[]) => any;
  /** Columns that trigger recalculation */
  dependencies: string[];
  /** Optional format function for display */
  format?: (value: any) => string;
}

/** Dirty tracking feature (from Progress) */
export interface DirtyTrackingConfig {
  enabled: boolean;
  /** CSS class for dirty rows */
  dirtyClassName?: string;
  /** Callback when dirty state changes */
  onDirtyChange?: (dirtyRowIds: (string | number)[]) => void;
}

/** Dynamic columns feature (from MaterialBudget) */
export interface DynamicColumnConfig {
  enabled: boolean;
  /** Patterns to exclude from auto-generation */
  excludePatterns?: RegExp[];
  /** Custom formatters by column key pattern */
  formatters?: Record<string, (value: any) => string>;
  /** Custom width map by column key pattern */
  widthMap?: Record<string, number>;
  /** Custom label map */
  labelMap?: Record<string, string>;
  /** Sort columns alphabetically */
  sortAlphabetically?: boolean;
  /** Filter out columns with all empty/zero values */
  filterEmptyColumns?: boolean;
}

/** Multi-row selection feature (from SiteTasks) */
export interface MultiRowSelectionConfig {
  enabled: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (selectedRowIndexes: number[]) => void;
  /** Allow Ctrl+click for non-contiguous selection */
  allowNonContiguous?: boolean;
}

/** Position summary view feature (from Pointage) */
export interface PositionSummaryConfig {
  enabled: boolean;
  /** Field to group by */
  groupByField: string;
  /** Summary columns to display */
  summaryColumns?: Array<{
    key: string;
    label: string;
    aggregate: "sum" | "count" | "avg" | "min" | "max";
    sourceColumn: string;
    formatter?: (value: any) => string;
  }>;
}

// =============================================================================
// FEATURES CONTAINER
// =============================================================================

export interface SpreadsheetFeatures<T = any> {
  /** Inline row creation (SiteTasks feature) */
  inlineRowCreation?: InlineRowCreationConfig<T>;
  /** Row height resize (SiteTasks feature) */
  rowHeightResize?: boolean | RowHeightResizeConfig;
  /** Context menu (SiteTasks feature) */
  contextMenu?: ContextMenuConfig;
  /** Multi-row selection (SiteTasks feature) */
  multiRowSelection?: boolean | MultiRowSelectionConfig;
  /** Cost code dialog (Pointage feature) */
  costCodeDialog?: CostCodeDialogConfig;
  /** Hour validation (Pointage feature) */
  hourValidation?: HourValidationConfig;
  /** Position summary view (Pointage feature) */
  positionSummary?: PositionSummaryConfig;
  /** Calculated fields (Progress feature) */
  calculatedFields?: CalculatedFieldConfig<T>[];
  /** Dirty tracking (Progress feature) */
  dirtyTracking?: boolean | DirtyTrackingConfig;
  /** Dynamic columns (MaterialBudget feature) */
  dynamicColumns?: DynamicColumnConfig;
}

// =============================================================================
// PLUGIN SYSTEM
// =============================================================================

export interface CellInfo<T = any> {
  row: T;
  rowIndex: number;
  column: SpreadsheetColumn<T>;
  columnKey: string;
  columnIndex: number;
  value: any;
}

export interface PluginContext<T = any> {
  /** Current data */
  data: T[];
  /** Column definitions */
  columns: SpreadsheetColumn<T>[];
  /** Current mode */
  mode: SpreadsheetMode;
  /** Currently selected cell */
  selectedCell: CellPosition | null;
  /** Selection range */
  selectionRange: SelectionRange | null;
  /** Update cell value */
  updateCellValue: (rowIndex: number, columnKey: string, value: any) => void;
  /** Set selected cell */
  setSelectedCell: (cell: CellPosition | null) => void;
  /** Get row by index */
  getRow: (index: number) => T | undefined;
  /** Get column by key */
  getColumn: (key: string) => SpreadsheetColumn<T> | undefined;
  /** Force re-render */
  forceUpdate: () => void;
}

export interface SpreadsheetPlugin<T = any> {
  /** Unique plugin name */
  name: string;

  // Lifecycle hooks
  onMount?: (context: PluginContext<T>) => void | (() => void);
  onUnmount?: () => void;
  onDataChange?: (data: T[], prevData: T[]) => void;

  // Render hooks
  renderCellOverlay?: (cell: CellInfo<T>) => React.ReactNode;
  renderRowOverlay?: (row: T, index: number) => React.ReactNode;
  renderToolbarExtension?: (context: PluginContext<T>) => React.ReactNode;
  renderFooterExtension?: (context: PluginContext<T>) => React.ReactNode;

  // Event interceptors (return true to prevent default behavior)
  onCellClick?: (cell: CellInfo<T>, event: React.MouseEvent) => boolean | void;
  onCellDoubleClick?: (cell: CellInfo<T>, event: React.MouseEvent) => boolean | void;
  onCellChange?: (cell: CellInfo<T>, newValue: any, prevValue: any) => any;
  onRowClick?: (row: T, index: number, event: React.MouseEvent) => boolean | void;
  onKeyDown?: (event: React.KeyboardEvent, cell: CellInfo<T> | null) => boolean | void;
  onContextMenu?: (row: T, index: number, event: React.MouseEvent) => boolean | void;

  // Data transformations
  transformData?: (data: T[]) => T[];
  transformColumns?: (columns: SpreadsheetColumn<T>[]) => SpreadsheetColumn<T>[];

  // Validation
  validateCell?: (cell: CellInfo<T>, newValue: any) => { valid: boolean; message?: string };
}

// =============================================================================
// SHEET TABS (re-export for convenience)
// =============================================================================

export interface SheetTab {
  key: string;
  label: string;
  icon?: string;
  count?: number | string;
  disabled?: boolean;
}

// =============================================================================
// MAIN PROPS INTERFACE
// =============================================================================

export interface SpreadsheetProps<T> {
  // Data
  data: T[];
  columns: SpreadsheetColumn<T>[];

  // Mode & State
  mode?: SpreadsheetMode;
  loading?: boolean;
  emptyMessage?: string;

  // Persistence
  persistKey?: string;

  // Styling
  variant?: SpreadsheetVariant;
  containerClassName?: string;

  // Virtualization
  overscan?: number;
  rowHeight?: number | ((row: T, index: number) => number);
  maxHeight?: number | string;
  minBufferRows?: number;
  minRenderRows?: number;

  // Layout slots
  summaryRow?: (
    rows: T[],
    context?: { gridTemplateColumns: string; columnWidths: Record<string, number> }
  ) => React.ReactNode;
  footer?: React.ReactNode;
  slotBelowHeader?: React.ReactNode;
  toolbar?: React.ReactNode;
  toolbarLeft?: React.ReactNode;

  // Sheet tabs
  sheetTabs?: SheetTab[];
  activeSheetTab?: string;
  onSheetTabChange?: (key: string) => void;

  // Callbacks
  onCellChange?: (rowIndex: number, columnKey: string, value: any, row: T) => void;
  onRowChange?: (rowIndex: number, row: T) => void;
  onDataChange?: (rows: T[]) => void;
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  onRowContextMenu?: (row: T, index: number, event: React.MouseEvent) => void;
  onSelectionChange?: (cell: CellPosition | null, row?: T | null) => void;

  // Row customization
  rowClassName?: (row: T, index: number) => string | undefined;
  rowNumberRender?: (row: T, index: number) => React.ReactNode;
  rowNumberTitle?: (row: T, index: number) => string | undefined;
  isCellEditable?: (row: T, column: SpreadsheetColumn<T>, index: number) => boolean;
  actionsRender?: (row: T, index: number) => React.ReactNode;
  actionsColumnWidth?: number;
  actionsColumnResizable?: boolean;
  getRowId?: (row: T, index: number) => string | number;

  // Feature flags
  allowKeyboardNavigation?: boolean;
  allowColumnResize?: boolean;
  allowFilters?: boolean;
  allowSorting?: boolean;

  // Excel integration
  excelConfig?: SpreadsheetExcelConfig<T>;

  // Plugin system
  plugins?: SpreadsheetPlugin<T>[];

  // Feature configurations
  features?: SpreadsheetFeatures<T>;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Helper type for extracting row type from SpreadsheetProps */
export type ExtractRowType<P> = P extends SpreadsheetProps<infer T> ? T : never;

// =============================================================================
// CONSTANTS
// =============================================================================

export const DEFAULT_ROW_HEIGHT = 32;
export const DEFAULT_OVERSCAN = 8;
export const DEFAULT_MIN_BUFFER_ROWS = 8;
export const DEFAULT_MIN_RENDER_ROWS = 30;
export const DEFAULT_COLUMN_MIN_WIDTH = 60;
export const DEFAULT_COLUMN_MAX_WIDTH = 600;

// =============================================================================
// NAVIGATION TYPES (internal)
// =============================================================================

export type NavigationDirection = "down" | "up" | "right" | "left";
