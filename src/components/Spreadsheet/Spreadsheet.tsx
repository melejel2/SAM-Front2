import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import ExcelJS from "exceljs";
import { Icon } from "@iconify/react";
import filterIcon from "@iconify/icons-lucide/filter";
import filterXIcon from "@iconify/icons-lucide/filter-x";
import chevronUpIcon from "@iconify/icons-lucide/chevron-up";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import checkSquareIcon from "@iconify/icons-lucide/check-square";
import squareIcon from "@iconify/icons-lucide/square";
import xIcon from "@iconify/icons-lucide/x";
import checkIcon from "@iconify/icons-lucide/check";
import searchIcon from "@iconify/icons-lucide/search";
import externalLinkIcon from "@iconify/icons-lucide/external-link";
import SheetTabs from "./SheetTabs";
import LongTextDialog from "./LongTextDialog";
import { useOverflowDetection } from "./useOverflowDetection";
import { Loader } from "@/components/Loader";
import "./spreadsheet.css";

// Import types from dedicated types file
import type {
  CellEditorType,
  SpreadsheetMode,
  SpreadsheetVariant,
  SpreadsheetColumn,
  SpreadsheetExcelConfig,
  SpreadsheetRef,
  SpreadsheetProps,
  CellPosition,
  SelectionRange,
  SelectionMode,
  NavigationDirection,
  SheetTab
} from "./types";

// Re-export types for backward compatibility
export type {
  CellEditorType,
  SpreadsheetMode,
  SpreadsheetVariant,
  SpreadsheetColumn,
  SpreadsheetExcelConfig,
  SpreadsheetRef,
  SpreadsheetProps
};

import {
  DEFAULT_ROW_HEIGHT,
  DEFAULT_OVERSCAN
} from "./types";

// Convert column index to Excel-style letter (0 -> A, 1 -> B, ... 25 -> Z, 26 -> AA, etc.)
const columnIndexToLetter = (index: number): string => {
  let result = "";
  let num = index + 1;
  while (num > 0) {
    const remainder = (num - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
};

const getValue = <T,>(row: T, column: SpreadsheetColumn<T>) => {
  if (column.formatter) return column.formatter((row as any)[column.key], row, -1);
  return (row as any)[column.key];
};

// Types imported from ./types

// Separate component for text/number/date cell editing to avoid committing on every keystroke
type CellTextEditorProps = {
  type: "text" | "number" | "date";
  initialValue: any;
  onCommit: (value: any) => void;
  onClose: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
  onValueChange?: (value: any) => void;
};

const CellTextEditor: React.FC<CellTextEditorProps> = ({ type, initialValue, onCommit, onClose, onNavigate, onValueChange }) => {
  const [localValue, setLocalValue] = useState<string>(initialValue ?? "");
  const isNavigatingRef = useRef(false);

  const getValueToCommit = useCallback(() => {
    return type === "number" ? Number(localValue) : localValue;
  }, [localValue, type]);

  const handleValueChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    // Report the value to parent for tracking
    const valueToReport = type === "number" ? Number(newValue) : newValue;
    onValueChange?.(valueToReport);
  }, [type, onValueChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        isNavigatingRef.current = true;
        onCommit(getValueToCommit());
        if (onNavigate) {
          onNavigate(e.shiftKey ? "up" : "down");
        } else {
          onClose();
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        isNavigatingRef.current = true;
        onCommit(getValueToCommit());
        if (onNavigate) {
          onNavigate(e.shiftKey ? "left" : "right");
        } else {
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        isNavigatingRef.current = true;
        onClose();
      }
    },
    [getValueToCommit, onCommit, onClose, onNavigate]
  );

  const handleBlur = useCallback(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    // Skip commit on blur if parent is tracking via onValueChange (parent will commit in beginSelection)
    if (!onValueChange) {
      onCommit(getValueToCommit());
    }
    onClose();
  }, [getValueToCommit, onCommit, onClose, onValueChange]);

  return (
    <input
      className="input input-xs w-full bg-transparent"
      type={type}
      value={localValue}
      onChange={(e) => handleValueChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
    />
  );
};

// Select editor component with Excel-like navigation
type CellSelectEditorProps = {
  value: any;
  options: { value: string; label: string }[];
  onCommit: (value: any) => void;
  onClose: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
  onValueChange?: (value: any) => void;
};

const CellSelectEditor: React.FC<CellSelectEditorProps> = ({ value, options, onCommit, onClose, onNavigate, onValueChange }) => {
  const isNavigatingRef = useRef(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSelectElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        isNavigatingRef.current = true;
        onCommit(e.currentTarget.value);
        if (onNavigate) {
          onNavigate(e.shiftKey ? "up" : "down");
        } else {
          onClose();
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        isNavigatingRef.current = true;
        onCommit(e.currentTarget.value);
        if (onNavigate) {
          onNavigate(e.shiftKey ? "left" : "right");
        } else {
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        isNavigatingRef.current = true;
        onClose();
      }
    },
    [onCommit, onClose, onNavigate]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      onCommit(newValue);
      onValueChange?.(newValue);
    },
    [onCommit, onValueChange]
  );

  const handleBlur = useCallback(() => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    onClose();
  }, [onClose]);

  return (
    <select
      className="input input-xs w-full bg-transparent"
      value={value ?? ""}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

function SpreadsheetInner<T>(
  props: SpreadsheetProps<T>,
  ref: React.Ref<SpreadsheetRef<T>>
) {
  const {
    data,
    columns,
    mode = "view",
    loading = false,
    emptyMessage = "No data available",
    persistKey,
    variant = "default",
    containerClassName,
    overscan = DEFAULT_OVERSCAN,
    rowHeight = DEFAULT_ROW_HEIGHT,
    minBufferRows = 8,
    minRenderRows = 30,
    maxHeight,
    summaryRow,
    footer,
    slotBelowHeader,
    sheetTabs,
    activeSheetTab,
    onSheetTabChange,
    onCellChange,
    onRowChange,
    onDataChange,
    onRowClick,
    onRowDoubleClick,
    onRowContextMenu,
    onSelectionChange,
    rowClassName,
    rowNumberRender,
    rowNumberTitle,
    isCellEditable,
    actionsRender,
    actionsColumnWidth = 120,
    actionsColumnResizable = true,
    getRowId,
    scrollToRowId,
    allowKeyboardNavigation = true,
    allowColumnResize = true,
    allowFilters = true,
    allowSorting = true,
    hideFormulaBar = false,
    excelConfig,
    toolbar,
    toolbarLeft
  } = props;

  const isViewMode = mode === "view";

  const [rows, setRows] = useState<T[]>(data);
  useEffect(() => {
    setRows(data);
  }, [data]);

  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("cell");
  const [selectionEnd, setSelectionEnd] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [formulaValue, setFormulaValue] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [filterSearchTerms, setFilterSearchTerms] = useState<Record<string, string>>({});
  const [filterDropdownPosition, setFilterDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [longTextCell, setLongTextCell] = useState<{ rowIndex: number; columnKey: string; value: string } | null>(null);

  // Ref to track if we're in the middle of navigating to prevent blur from clearing editingCell
  const isNavigatingRef = useRef(false);

  // Ref to track pending edit value for committing when clicking another cell
  const pendingEditRef = useRef<{ value: any; commit: ((val: any) => void) | null }>({ value: null, commit: null });

  const defaultWidths = useMemo(() => {
    const widths: Record<string, number> = {};
    columns.forEach((col) => {
      widths[col.key] = col.width;
    });
    return widths;
  }, [columns]);

  const columnIndexMap = useMemo(() => {
    const indexes: Record<string, number> = {};
    columns.forEach((col, index) => {
      indexes[col.key] = index;
    });
    return indexes;
  }, [columns]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (!persistKey) return defaultWidths;
    if (typeof window === "undefined") return defaultWidths;
    const stored = window.localStorage.getItem(`sheet-widths-${persistKey}`);
    if (!stored) return defaultWidths;
    try {
      return { ...defaultWidths, ...JSON.parse(stored) };
    } catch (_err) {
      return defaultWidths;
    }
  });

  // State for actions column width (resizable)
  const [actionsWidth, setActionsWidth] = useState(actionsColumnWidth);

  const gridTemplateColumns = useMemo(() => {
    return `var(--row-number-width, 36px) ${columns
      .map((col) => `${columnWidths[col.key] || col.width}px`)
      .join(" ")}${actionsRender ? ` ${actionsWidth}px` : ""}`;
  }, [columns, columnWidths, actionsRender, actionsWidth]);

  // Persist widths
  useEffect(() => {
    if (!persistKey) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`sheet-widths-${persistKey}`, JSON.stringify(columnWidths));
  }, [persistKey, columnWidths]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!openFilterDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setOpenFilterDropdown(null);
      }
    };

    // Use capture phase to ensure we catch the click before it reaches other handlers
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [openFilterDropdown]);

  // Clear selection and blur when clicking outside the spreadsheet
  // This ensures proper navigation when clicking sidebar or other elements
  useEffect(() => {
    const handleClickOutsideSpreadsheet = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !filterDropdownRef.current?.contains(event.target as Node)
      ) {
        // Commit any pending edit before clearing state
        if (pendingEditRef.current.commit && pendingEditRef.current.value !== null) {
          pendingEditRef.current.commit(pendingEditRef.current.value);
          pendingEditRef.current = { value: null, commit: null };
        }

        // Clear selection state
        setSelectedCell(null);
        setSelectionEnd(null);
        setEditingCell(null);
        isDraggingSelectionRef.current = false;

        // Blur active element if it's inside the spreadsheet
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && containerRef.current?.contains(activeElement)) {
          activeElement.blur();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutsideSpreadsheet);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideSpreadsheet);
    };
  }, []);

  const [isResizing, setIsResizing] = useState<string | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const resizeColumnStartWidth = useRef<number>(0);
  const resizeColumnKey = useRef<string | null>(null);
  const isDraggingSelectionRef = useRef(false);
  const selectionDragModeRef = useRef<SelectionMode>("cell");

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const lastAutoScrollRef = useRef<{ id: string | number | null; found: boolean } | null>(null);

  const rowHeightGetter = useCallback(
    (row: T, index: number) => {
      if (typeof rowHeight === "function") {
        try {
          return rowHeight(row, index) ?? DEFAULT_ROW_HEIGHT;
        } catch (_err) {
          return DEFAULT_ROW_HEIGHT;
        }
      }
      return rowHeight;
    },
    [rowHeight]
  );

  const sortRecords = useCallback(
    (source: T[]) => {
      if (!allowSorting || !sortColumn) return source;
      const column = columns.find((c) => c.key === sortColumn);
      if (!column) return source;
      const sorted = [...source].sort((a, b) => {
        const aVal = getValue(a, column);
        const bVal = getValue(b, column);
        if (aVal === bVal) return 0;
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        return sortDirection === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
      return sorted;
    },
    [allowSorting, columns, sortColumn, sortDirection]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const passesColumnFilters = (row: T) =>
      Object.entries(columnFilters).every(([key, values]) => {
        if (!values || values.length === 0) return true;
        const column = columns.find((c) => c.key === key);
        if (!column) return true;
        const value = getValue(row, column);
        return values.includes(String(value ?? ""));
      });

    return rows.filter((row) => {
      if (allowFilters && Object.keys(columnFilters).length > 0 && !passesColumnFilters(row)) {
        return false;
      }
      if (!normalizedSearch) return true;
      return columns.some((col) => {
        const value = getValue(row, col);
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(normalizedSearch);
      });
    });
  }, [rows, columnFilters, columns, allowFilters, searchTerm]);

  const processedRows = useMemo(() => sortRecords(filteredRows), [filteredRows, sortRecords]);

  const minRowsWithBuffer = Math.max(processedRows.length, minBufferRows, minRenderRows);
  const heights = useMemo(() => {
    if (processedRows.length === 0) {
      return Array.from({ length: minRowsWithBuffer }, () =>
        rowHeightGetter(undefined as unknown as T, 0)
      );
    }
    return processedRows.map((row, idx) => rowHeightGetter(row, idx));
  }, [processedRows, rowHeightGetter, minRowsWithBuffer]);

  const offsets = useMemo(() => {
    const list: number[] = [];
    let running = 0;
    const count = Math.max(processedRows.length, minRowsWithBuffer);
    for (let i = 0; i < count; i += 1) {
      const h = heights[i] ?? DEFAULT_ROW_HEIGHT;
      list.push(running);
      running += h;
    }
    return list;
  }, [heights, processedRows.length, minRowsWithBuffer]);

  const totalHeight = useMemo(() => {
    const count = Math.max(processedRows.length, minRowsWithBuffer);
    if (count === 0) return 0;
    return offsets[count - 1] + (heights[count - 1] ?? DEFAULT_ROW_HEIGHT);
  }, [offsets, heights, processedRows.length, minRowsWithBuffer]);

  useEffect(() => {
    if (scrollToRowId === undefined || scrollToRowId === null) {
      lastAutoScrollRef.current = null;
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    const resolveId = (row: T, index: number) => {
      if (getRowId) return getRowId(row, index);
      const fallbackId = (row as any)?.id;
      return fallbackId ?? index;
    };

    const targetIndex = processedRows.findIndex((row, index) => resolveId(row, index) === scrollToRowId);
    if (targetIndex === -1) {
      lastAutoScrollRef.current = { id: scrollToRowId, found: false };
      return;
    }

    const lastScroll = lastAutoScrollRef.current;
    if (lastScroll?.id === scrollToRowId && lastScroll?.found) {
      return;
    }

    const targetOffset = offsets[targetIndex] ?? 0;
    container.scrollTo({ top: targetOffset });
    lastAutoScrollRef.current = { id: scrollToRowId, found: true };
  }, [scrollToRowId, processedRows, offsets, getRowId]);

  const selectionRange = useMemo<SelectionRange | null>(() => {
    if (!selectedCell) return null;
    const endCell = selectionEnd || selectedCell;
    const startColIndex = columnIndexMap[selectedCell.columnKey];
    const endColIndex = columnIndexMap[endCell.columnKey];
    if (startColIndex === undefined || endColIndex === undefined) return null;
    return {
      startRow: Math.min(selectedCell.rowIndex, endCell.rowIndex),
      endRow: Math.max(selectedCell.rowIndex, endCell.rowIndex),
      startCol: Math.min(startColIndex, endColIndex),
      endCol: Math.max(startColIndex, endColIndex)
    };
  }, [columnIndexMap, selectedCell, selectionEnd]);

  const isRowSelection = selectionMode === "row";
  const isColumnSelection = selectionMode === "column";
  const firstColumnKey = columns[0]?.key;
  const lastColumnKey = columns[columns.length - 1]?.key;
  const lastRowIndex = Math.max(0, processedRows.length - 1);

  const rowIndexByRef = useMemo(() => {
    const map = new Map<T, number>();
    rows.forEach((row, idx) => map.set(row, idx));
    return map;
  }, [rows]);

  const resolveRowIndex = useCallback(
    (processedIndex: number) => {
      const row = processedRows[processedIndex];
      if (!row) return processedIndex;
      const mapped = rowIndexByRef.get(row);
      if (mapped !== undefined) return mapped;
      if (!getRowId) return processedIndex;
      const targetId = getRowId(row, processedIndex);
      const fallbackIndex = rows.findIndex((candidate, idx) => getRowId(candidate, idx) === targetId);
      return fallbackIndex === -1 ? processedIndex : fallbackIndex;
    },
    [processedRows, rowIndexByRef, rows, getRowId]
  );

  const computeVisibleRange = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return { start: 0, end: processedRows.length };
    const viewportHeight = container.clientHeight || 0;
    const startPx = Math.max(0, scrollTop - overscan * DEFAULT_ROW_HEIGHT);
    let startIndex = 0;
    while (startIndex < offsets.length && offsets[startIndex] + (heights[startIndex] ?? DEFAULT_ROW_HEIGHT) < startPx) {
      startIndex += 1;
    }
    const endPx = scrollTop + viewportHeight + overscan * DEFAULT_ROW_HEIGHT;
    let endIndex = startIndex;
    while (
      endIndex < offsets.length &&
      offsets[endIndex] < endPx &&
      endIndex < processedRows.length
    ) {
      endIndex += 1;
    }
    return { start: startIndex, end: Math.min(endIndex + overscan, processedRows.length) };
  }, [heights, offsets, overscan, processedRows.length, scrollTop]);

  const visibleRows = useMemo(() => {
    const range = computeVisibleRange();
    const items: Array<{ row: T | null; rowIndex: number; offset: number; height: number }> = [];
    const count = Math.max(processedRows.length, minRowsWithBuffer);
    for (let i = range.start; i < Math.min(range.end, count); i += 1) {
      const item = processedRows[i] ?? null;
      items.push({
        row: item,
        rowIndex: i,
        offset: offsets[i],
        height: heights[i] ?? DEFAULT_ROW_HEIGHT
      });
    }
    return items;
  }, [computeVisibleRange, processedRows, offsets, heights, minRowsWithBuffer]);

  useEffect(() => {
    if (!selectedCell) {
      setFormulaValue("");
      return;
    }
    const { rowIndex, columnKey } = selectedCell;
    const row = processedRows[rowIndex];
    const column = columns.find((c) => c.key === columnKey);
    if (!row || !column) {
      setFormulaValue("");
      return;
    }
    const raw = getValue(row, column);
    setFormulaValue(raw === null || raw === undefined ? "" : String(raw));
  }, [selectedCell, processedRows, columns]);

  const commitRows = useCallback(
    (newRows: T[]) => {
      setRows(newRows);
      onDataChange?.(newRows);
    },
    [onDataChange]
  );

  const updateCellValue = useCallback(
    (rowIndex: number, column: SpreadsheetColumn<T>, value: any) => {
      const actualRowIndex = resolveRowIndex(rowIndex);
      const next = [...rows];
      const currentRow = next[actualRowIndex];
      if (!currentRow) return;
      const row = { ...(currentRow as any) } as T;
      (row as any)[column.key] = column.parser
        ? column.parser(value, row, rowIndex, column)
        : value;
      next[actualRowIndex] = row;
      onCellChange?.(actualRowIndex, column.key, value, row);
      onRowChange?.(actualRowIndex, row);
      commitRows(next);
    },
    [rows, commitRows, onCellChange, onRowChange, resolveRowIndex]
  );

  const beginSelection = useCallback(
    (
      rowIndex: number,
      columnKey: string,
      options?: { extend?: boolean; mode?: SelectionMode; endCell?: CellPosition }
    ) => {
      // Commit any pending edit before switching cells
      if (pendingEditRef.current.commit && pendingEditRef.current.value !== null) {
        pendingEditRef.current.commit(pendingEditRef.current.value);
        pendingEditRef.current = { value: null, commit: null };
      }

      const cell = { rowIndex, columnKey };
      const anchor = options?.extend && selectedCell ? selectedCell : cell;
      const end = options?.endCell || cell;
      setSelectedCell(anchor);
      setSelectionEnd(end);
      setEditingCell(null);
      setSelectionMode(options?.mode ?? "cell");
      const selectedRow = processedRows[anchor.rowIndex] ?? null;
      onSelectionChange?.(anchor, selectedRow);
      if (options?.mode) {
        isDraggingSelectionRef.current = true;
        selectionDragModeRef.current = options.mode;
      }
    },
    [onSelectionChange, processedRows, selectedCell]
  );

  const stopSelectionDrag = useCallback(() => {
    if (!isDraggingSelectionRef.current) return;
    isDraggingSelectionRef.current = false;
    selectionDragModeRef.current = "cell";
  }, []);

  useEffect(() => {
    const handleMouseUp = () => stopSelectionDrag();
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [stopSelectionDrag]);

  const handleCellDoubleClick = useCallback((rowIndex: number, columnKey: string) => {
    // IMPORTANT: Call beginSelection FIRST (which clears editingCell),
    // then set editingCell to enable editing mode
    beginSelection(rowIndex, columnKey);
    setEditingCell({ rowIndex, columnKey });
  }, [beginSelection]);

  // Navigate to next/prev cell and enter edit mode (Excel-like behavior)
  const navigateAndEdit = useCallback(
    (fromRowIndex: number, fromColumnKey: string, direction: NavigationDirection) => {
      const colIndex = columnIndexMap[fromColumnKey];
      if (colIndex === undefined) return;

      let nextRow = fromRowIndex;
      let nextCol = colIndex;

      switch (direction) {
        case "down":
          nextRow = fromRowIndex + 1;
          if (nextRow >= processedRows.length) {
            setEditingCell(null);
            return;
          }
          break;
        case "up":
          nextRow = fromRowIndex - 1;
          if (nextRow < 0) {
            setEditingCell(null);
            return;
          }
          break;
        case "right":
          nextCol = colIndex + 1;
          if (nextCol >= columns.length) {
            nextCol = 0;
            nextRow = fromRowIndex + 1;
            if (nextRow >= processedRows.length) {
              setEditingCell(null);
              return;
            }
          }
          break;
        case "left":
          nextCol = colIndex - 1;
          if (nextCol < 0) {
            nextCol = columns.length - 1;
            nextRow = fromRowIndex - 1;
            if (nextRow < 0) {
              setEditingCell(null);
              return;
            }
          }
          break;
      }

      const nextColumnKey = columns[nextCol]?.key;
      if (!nextColumnKey) {
        setEditingCell(null);
        return;
      }

      const nextColumn = columns[nextCol];
      const nextRowData = processedRows[nextRow];

      // Check if next cell is editable
      const nextCellEditable =
        nextColumn?.editable &&
        !isViewMode &&
        nextRowData &&
        (!isCellEditable || isCellEditable(nextRowData, nextColumn, nextRow));

      // Set selection directly (don't use beginSelection which clears editingCell)
      const nextCell = { rowIndex: nextRow, columnKey: nextColumnKey };
      setSelectedCell(nextCell);
      setSelectionEnd(nextCell);
      setSelectionMode("cell");

      // Mark that we're navigating to prevent blur from clearing editingCell
      isNavigatingRef.current = true;

      // Use setTimeout to set editingCell AFTER React completes the current batch
      setTimeout(() => {
        if (nextCellEditable) {
          setEditingCell({ rowIndex: nextRow, columnKey: nextColumnKey });
        } else {
          setEditingCell(null);
        }
        // Clear the navigation flag after setting editingCell
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 0);
      }, 0);
    },
    [columnIndexMap, columns, processedRows, isViewMode, isCellEditable]
  );

  const extendSelectionTo = useCallback(
    (rowIndex: number, columnKey: string) => {
      if (!isDraggingSelectionRef.current) return;
      if (selectionDragModeRef.current === "row") {
        const safeRow = Math.min(rowIndex, lastRowIndex);
        setSelectionEnd({ rowIndex: safeRow, columnKey: lastColumnKey || columnKey });
        return;
      }
      if (selectionDragModeRef.current === "column") {
        setSelectionEnd({ rowIndex: lastRowIndex, columnKey });
        return;
      }
      setSelectionEnd({ rowIndex, columnKey });
    },
    [lastColumnKey, lastRowIndex]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, rowIndex: number, columnKey: string) => {
      if (!allowKeyboardNavigation) return;
      const colIndex = columnIndexMap[columnKey];
      if (colIndex === undefined) return;

      const moveTo = (nextRow: number, nextCol: number) => {
        const clampedRow = Math.min(Math.max(nextRow, 0), processedRows.length - 1);
        const targetKey = columns[nextCol]?.key;
        if (targetKey === undefined || clampedRow < 0 || clampedRow >= processedRows.length) return;
        beginSelection(clampedRow, targetKey);
        setEditingCell(null);
      };

      if (event.key === "F2") {
        if (!isViewMode && columns[colIndex]?.editable) {
          event.preventDefault();
          setEditingCell({ rowIndex, columnKey });
        }
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const delta = event.shiftKey ? -1 : 1;
        moveTo(rowIndex + delta, colIndex);
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        const isShift = event.shiftKey;
        let nextCol = colIndex + (isShift ? -1 : 1);
        let nextRow = rowIndex;

        if (nextCol >= columns.length) {
          nextCol = 0;
          nextRow = rowIndex + 1;
        } else if (nextCol < 0) {
          nextCol = columns.length - 1;
          nextRow = rowIndex - 1;
        }

        moveTo(nextRow, nextCol);
        return;
      }

      let nextRow = rowIndex;
      let nextCol = colIndex;
      if (event.key === "ArrowDown") nextRow = rowIndex + 1;
      if (event.key === "ArrowUp") nextRow = rowIndex - 1;
      if (event.key === "ArrowRight") nextCol = colIndex + 1;
      if (event.key === "ArrowLeft") nextCol = colIndex - 1;

      if (nextRow !== rowIndex || nextCol !== colIndex) {
        event.preventDefault();
        nextRow = Math.min(Math.max(nextRow, 0), processedRows.length - 1);
        nextCol = Math.min(Math.max(nextCol, 0), columns.length - 1);
        moveTo(nextRow, nextCol);
      }
    },
    [allowKeyboardNavigation, beginSelection, columnIndexMap, columns, isViewMode, processedRows.length]
  );

  const handleColumnSort = useCallback(
    (columnKey: string) => {
      if (!allowSorting) return;
      startTransition(() => {
        setSortDirection((prev) => (sortColumn === columnKey ? (prev === "asc" ? "desc" : "asc") : "asc"));
        setSortColumn(columnKey);
      });
    },
    [allowSorting, sortColumn]
  );

  const handleRowHeaderMouseDown = useCallback(
    (event: React.MouseEvent, rowIndex: number) => {
      event.preventDefault();
      if (!firstColumnKey) return;
      const anchorRow = event.shiftKey && selectedCell ? selectedCell.rowIndex : rowIndex;
      const safeAnchorRow = Math.min(anchorRow, lastRowIndex);
      const safeRowIndex = Math.min(rowIndex, lastRowIndex);
      const anchor: CellPosition = { rowIndex: safeAnchorRow, columnKey: firstColumnKey };
      const endCell: CellPosition = { rowIndex: safeRowIndex, columnKey: lastColumnKey || firstColumnKey };
      beginSelection(anchor.rowIndex, anchor.columnKey, { endCell, mode: "row" });
    },
    [beginSelection, firstColumnKey, lastColumnKey, lastRowIndex, selectedCell]
  );

  const handleColumnHeaderMouseDown = useCallback(
    (event: React.MouseEvent, columnKey: string) => {
      const target = event.target as HTMLElement;
      if (target.closest("button") || target.classList.contains("column-resize-handle")) return;
      event.preventDefault();
      const anchorRow = event.shiftKey && selectedCell ? selectedCell.rowIndex : 0;
      const safeAnchorRow = Math.min(anchorRow, lastRowIndex);
      const endCell: CellPosition = { rowIndex: lastRowIndex, columnKey };
      beginSelection(safeAnchorRow, columnKey, { endCell, mode: "column" });
    },
    [beginSelection, lastRowIndex, selectedCell]
  );

  const toggleFilterDropdown = useCallback(
    (columnKey: string, event: React.MouseEvent) => {
      event.stopPropagation();
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      setFilterDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      setOpenFilterDropdown((prev) => (prev === columnKey ? null : columnKey));
    },
    []
  );

  const handleColumnFilterChange = useCallback((columnKey: string, value: string, checked: boolean) => {
    setColumnFilters((prev) => {
      const current = prev[columnKey] || [];
      const nextValues = checked ? [...current, value] : current.filter((v) => v !== value);
      const next = { ...prev, [columnKey]: nextValues };
      if (nextValues.length === 0) delete next[columnKey];
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => setColumnFilters({}), []);

  const getUniqueColumnValues = useCallback(
    (columnKey: string) => {
      const values = new Set<string>();
      rows.forEach((row) => {
        const col = columns.find((c) => c.key === columnKey);
        if (!col) return;
        const value = getValue(row, col);
        if (value !== undefined && value !== null) {
          values.add(String(value));
        }
      });
      return Array.from(values).sort((a, b) => a.localeCompare(b));
    },
    [rows, columns]
  );

  // Column resizing
  const handleResizeStart = useCallback(
    (event: React.MouseEvent, columnKey: string) => {
      if (!allowColumnResize) return;
      event.preventDefault();
      setIsResizing(columnKey);
      resizeColumnKey.current = columnKey;
      resizeColumnStartWidth.current = columnWidths[columnKey] || defaultWidths[columnKey] || 120;

      const startX = event.clientX;

      const handleMove = (e: MouseEvent) => {
        const delta = e.clientX - startX;
        const newWidth = Math.max(60, resizeColumnStartWidth.current + delta);
        if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = requestAnimationFrame(() => {
          setColumnWidths((prev) => ({
            ...prev,
            [columnKey]: newWidth
          }));
        });
      };

      const handleUp = () => {
        setIsResizing(null);
        resizeColumnKey.current = null;
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [allowColumnResize, columnWidths, defaultWidths]
  );

  const handleAutoFitColumn = useCallback(
    (columnKey: string) => {
      const col = columns.find((c) => c.key === columnKey);
      if (!col) return;
      const maxLength = Math.max(
        col.label.length,
        ...rows.map((row) => String(getValue(row, col) ?? "").length)
      );
      const approxWidth = Math.max(col.minWidth ?? 80, Math.min((col.maxWidth ?? 400), maxLength * 8 + 32));
      setColumnWidths((prev) => ({ ...prev, [columnKey]: approxWidth }));
    },
    [columns, rows]
  );

  const activeCellRow = selectedCell ? processedRows[selectedCell.rowIndex] : null;
  const activeCellColumn = selectedCell ? columns.find((c) => c.key === selectedCell.columnKey) : undefined;
  const formulaBarEditable =
    !!activeCellRow &&
    !!activeCellColumn?.editable &&
    !isViewMode &&
    (!isCellEditable || isCellEditable(activeCellRow, activeCellColumn, selectedCell?.rowIndex ?? 0));

  const handleFormulaCommit = useCallback(() => {
    if (!formulaBarEditable || !selectedCell || !activeCellColumn) return;
    const currentRow = activeCellRow;
    if (!currentRow) return;

    const existingValue = getValue(currentRow, activeCellColumn);
    const existingString = existingValue === null || existingValue === undefined ? "" : String(existingValue);
    if (existingString === formulaValue) return;

    let nextValue: any = formulaValue;
    if (activeCellColumn.type === "number") {
      nextValue = Number(formulaValue);
    } else if (activeCellColumn.type === "checkbox") {
      const normalized = formulaValue.trim().toLowerCase();
      nextValue = normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
    }

    updateCellValue(selectedCell.rowIndex, activeCellColumn, nextValue);
  }, [activeCellColumn, activeCellRow, formulaBarEditable, formulaValue, selectedCell, updateCellValue]);

  const handleFormulaChange = useCallback((next: string) => {
    setFormulaValue(next);
  }, []);

  const handleFormulaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleFormulaCommit();
      }
    },
    [handleFormulaCommit]
  );
  const filteredCount = processedRows.length;
  const hasActiveFilters = Object.keys(columnFilters).length > 0;
  const activeLongTextColumn = longTextCell ? columns.find((c) => c.key === longTextCell.columnKey) : undefined;
  const longTextEditable = !!activeLongTextColumn?.editable && !isViewMode;
  const longTextTitle = activeLongTextColumn?.label || longTextCell?.columnKey;
  const activeCellLabel =
    selectedCell && activeCellColumn
      ? `${activeCellColumn.label || activeCellColumn.key} · Row ${selectedCell.rowIndex + 1}`
      : "No cell selected";
  const activeCellColIndex = selectedCell ? columnIndexMap[selectedCell.columnKey] : -1;
  const activeCellRef =
    selectedCell && activeCellColIndex >= 0 ? `${columnIndexToLetter(activeCellColIndex)}${selectedCell.rowIndex + 1}` : "";
  const selectionRowCount = selectionRange ? selectionRange.endRow - selectionRange.startRow + 1 : 0;
  const selectionColCount = selectionRange ? selectionRange.endCol - selectionRange.startCol + 1 : 0;
  const selectionSizeLabel =
    selectionRange && (selectionRowCount > 1 || selectionColCount > 1)
      ? ` · ${selectionRowCount} row${selectionRowCount > 1 ? "s" : ""} × ${selectionColCount} col${selectionColCount > 1 ? "s" : ""}`
      : "";

  // Optimized scroll handler with requestAnimationFrame throttling
  const scrollRafRef = useRef<number | null>(null);
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;

    // Cancel any pending animation frame
    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
    }

    // Schedule update in next animation frame for smooth 60fps scrolling
    scrollRafRef.current = requestAnimationFrame(() => {
      // Use startTransition to mark scroll updates as non-urgent
      // This prevents blocking user interactions during rapid scrolling
      startTransition(() => {
        setScrollTop(newScrollTop);
      });
      scrollRafRef.current = null;
    });
  }, []);

  const resetColumnWidths = useCallback(() => {
    setColumnWidths(defaultWidths);
  }, [defaultWidths]);

  const exportToExcel = useCallback(async () => {
    const workbook = excelConfig?.exportBuilder
      ? await excelConfig.exportBuilder(processedRows, columns)
      : (() => {
          const wb = new ExcelJS.Workbook();
          const ws = wb.addWorksheet(excelConfig?.sheetName || "Sheet 1");
          ws.addRow(columns.map((c) => c.label));
          processedRows.forEach((row) => {
            ws.addRow(columns.map((col) => getValue(row, col)));
          });
          columns.forEach((col, idx) => {
            ws.getColumn(idx + 1).width = (columnWidths[col.key] || col.width) / 8;
          });
          return wb;
        })();

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      excelConfig?.fileName ||
      `export-${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }, [columns, processedRows, columnWidths, excelConfig]);

  const importFromExcel = useCallback(
    async (file: File) => {
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      if (excelConfig?.importParser) {
        const nextRows = await excelConfig.importParser(workbook, columns, rows);
        if (nextRows) {
          commitRows(nextRows);
        }
        return;
      }

      const sheet = workbook.getWorksheet(1);
      if (!sheet) return;
      const headerRow = sheet.getRow(1);
      const headerMap: Record<number, string> = {};
      headerRow.eachCell((cell, colNumber) => {
        const headerText = String(cell.value || "").trim().toLowerCase();
        const match = columns.find(
          (col) =>
            col.label.toLowerCase() === headerText || col.key.toLowerCase() === headerText
        );
        if (match) headerMap[colNumber] = match.key;
      });

      const updatedRows = rows.map((row) => ({ ...(row as any) })) as T[];

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const target = updatedRows[rowNumber - 2];
        if (!target) return;
        row.eachCell((cell, colNumber) => {
          const key = headerMap[colNumber];
          if (!key) return;
          const column = columns.find((c) => c.key === key);
          if (!column) return;
          const rawValue = cell.value as any;
          (target as any)[key] = column.parser
            ? column.parser(rawValue, target, rowNumber - 2, column)
            : rawValue;
        });
      });

      commitRows(updatedRows);
    },
    [columns, rows, excelConfig, commitRows]
  );

  useImperativeHandle(
    ref,
    () => ({
      exportToExcel,
      importFromExcel,
      resetColumnWidths,
      getData: () => rows
    }),
    [exportToExcel, importFromExcel, resetColumnWidths, rows]
  );

  const handleOpenLongText = useCallback((rowIndex: number, columnKey: string, value: string) => {
    const safeValue = value ?? "";
    setLongTextCell({ rowIndex, columnKey, value: safeValue });
  }, []);

  const renderDisplayValue = useCallback(
    (column: SpreadsheetColumn<T>, row: T | null, rowIndex: number) => {
      if (!row) return null;
      const raw = getValue(row, column);
      if (column.render) {
        const rendered = column.render(raw, row, rowIndex);
        if (rendered !== undefined) return rendered;
      }
      if (column.type === "checkbox") {
        return (
          <div className="flex items-center justify-center gap-2">
            {raw ? (
              <Icon icon={checkSquareIcon} className="text-success" fontSize={14} />
            ) : (
              <Icon icon={squareIcon} className="text-base-content/40" fontSize={14} />
            )}
          </div>
        );
      }
      if (typeof raw === "string" || typeof raw === "number") {
        return (
          <OverflowCellContent
            value={raw}
            rowIndex={rowIndex}
            columnKey={column.key}
            columnWidth={columnWidths[column.key] || column.width}
            onOpenLongText={handleOpenLongText}
          />
        );
      }
      return <div className="excel-cell-content">{raw ?? "-"}</div>;
    },
    [columnWidths, handleOpenLongText]
  );

  const renderEditor = useCallback(
    (
      column: SpreadsheetColumn<T>,
      row: T,
      rowIndex: number,
      currentValue: any
    ) => {
      const commit = (val: any) => updateCellValue(rowIndex, column, val);
      const handleNavigate = (direction: NavigationDirection) => {
        navigateAndEdit(rowIndex, column.key, direction);
      };
      // Safe close that ignores blur events during navigation
      const safeClose = () => {
        // Always clear pending edit ref when closing (prevents accidental commits, e.g., after Escape)
        pendingEditRef.current = { value: null, commit: null };
        if (isNavigatingRef.current) return;
        setEditingCell(null);
      };

      // Track value changes for committing when clicking another cell
      const handleValueChange = (val: any) => {
        pendingEditRef.current = { value: val, commit };
      };

      // Initialize pending edit ref with current value and commit function
      pendingEditRef.current = { value: currentValue, commit };

      if (column.renderEditor) {
        return column.renderEditor(currentValue, row, rowIndex, commit, safeClose);
      }

      if (column.type === "select") {
        return (
          <CellSelectEditor
            value={currentValue}
            options={column.options || []}
            onCommit={commit}
            onClose={safeClose}
            onNavigate={handleNavigate}
            onValueChange={handleValueChange}
          />
        );
      }

      if (column.type === "checkbox") {
        return (
          <label className="flex items-center justify-center w-full h-full cursor-pointer">
            <input
              type="checkbox"
              className="checkbox checkbox-xs"
              checked={!!currentValue}
              onChange={(e) => {
                commit(e.target.checked);
                safeClose();
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  commit(e.currentTarget.checked);
                  handleNavigate(e.shiftKey ? "left" : "right");
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  commit(e.currentTarget.checked);
                  handleNavigate(e.shiftKey ? "up" : "down");
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  safeClose();
                }
              }}
              autoFocus
            />
          </label>
        );
      }

      return (
        <CellTextEditor
          type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
          initialValue={currentValue}
          onCommit={commit}
          onClose={safeClose}
          onNavigate={handleNavigate}
          onValueChange={handleValueChange}
        />
      );
    },
    [updateCellValue, navigateAndEdit]
  );

  if (loading) {
    return (
      <div className="spreadsheet-container spreadsheet-sheet">
        <Loader
          icon="table-2"
          subtitle="Loading: Data"
          description="Preparing spreadsheet data..."
          size="lg"
        />
      </div>
    );
  }

  return (
    <div
      className={`spreadsheet-container spreadsheet-sheet${containerClassName ? ` ${containerClassName}` : ""}`}
      data-variant={variant !== "default" ? variant : undefined}
      ref={containerRef}
    >
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-3 py-2 bg-info/10 border-b border-base-300 text-sm">
          <Icon icon={filterIcon} className="text-info" fontSize={14} />
          Filters active – showing {filteredCount} of {rows.length} rows
          <button className="btn btn-xs btn-ghost ml-auto gap-1" onClick={clearAllFilters}>
            <Icon icon={xIcon} fontSize={14} />
            Clear
          </button>
        </div>
      )}
      {slotBelowHeader}
      <div className="spreadsheet-formula-bar">
        {toolbarLeft && <div className="spreadsheet-toolbar-left">{toolbarLeft}</div>}
        {!hideFormulaBar && (
          <>
            <div className="spreadsheet-formula-left">
              <div className="spreadsheet-formula-chip" aria-label="Active cell reference">
                {activeCellRef || "--"}
              </div>
              <span className="spreadsheet-formula-fx" aria-label="Formula">fx</span>
            </div>
            <div className="spreadsheet-formula-input-wrap">
              <textarea
                className="spreadsheet-formula-input"
                value={formulaValue}
                onChange={(e) => handleFormulaChange(e.target.value)}
                onBlur={handleFormulaCommit}
                onKeyDown={handleFormulaKeyDown}
                placeholder="Select a cell to view its value"
                rows={1}
                disabled={!selectedCell}
                readOnly={!formulaBarEditable}
              />
              {formulaBarEditable && (
                <button
                  type="button"
                  className="spreadsheet-formula-apply"
                  onClick={handleFormulaCommit}
                  title="Apply (Enter)"
                >
                  <Icon icon={checkIcon} width={16} height={16} />
                </button>
              )}
            </div>
          </>
        )}
        {toolbar && <div className="spreadsheet-toolbar">{toolbar}</div>}
        <div className="spreadsheet-search">
          <Icon icon={searchIcon} width={14} height={14} className="text-base-content/60" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in sheet"
            className="spreadsheet-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="spreadsheet-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <Icon icon={xIcon} width={12} height={12} />
            </button>
          )}
        </div>
      </div>
      <div
        className="spreadsheet-scroll-region"
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={maxHeight ? { maxHeight } : undefined}
      >
          <div
            className="spreadsheet-header-grid spreadsheet-grid-base"
            style={{ gridTemplateColumns }}
          >
          <div className="spreadsheet-row-number spreadsheet-column-header">#</div>
          {columns.map((column) => {
            const isSorted = sortColumn === column.key;
            const isFiltered = columnFilters[column.key]?.length > 0;
            const columnIndex = columnIndexMap[column.key];
            const isColumnSelected =
              isColumnSelection && selectionRange && columnIndex !== undefined
                ? columnIndex >= selectionRange.startCol && columnIndex <= selectionRange.endCol
                : false;
            const isActiveColumn = isColumnSelection && selectedCell?.columnKey === column.key;
            return (
              <div
                key={column.key}
                className={`spreadsheet-column-header ${isColumnSelected ? "column-selected" : ""} ${
                  isActiveColumn ? "column-active" : ""
                }`}
                data-column={column.key}
                style={{ position: "relative" }}
                onMouseDown={(e) => handleColumnHeaderMouseDown(e, column.key)}
                onMouseEnter={() =>
                  isDraggingSelectionRef.current &&
                  selectionDragModeRef.current === "column" &&
                  extendSelectionTo(lastRowIndex, column.key)
                }
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <button
                    className="flex-1 text-center hover:bg-base-300/30 rounded px-1 transition-colors flex items-center justify-center gap-1"
                    onClick={() => handleColumnSort(column.key)}
                    disabled={!column.sortable || !allowSorting}
                  >
                    {column.headerRender ? column.headerRender(column) : column.label}
                    {isSorted && (
                      <Icon
                        icon={sortDirection === "asc" ? chevronUpIcon : chevronDownIcon}
                        fontSize={14}
                      />
                    )}
                  </button>
                  {allowFilters && column.filterable && (
                    <button
                      className={`btn btn-ghost btn-xs p-0 h-6 w-6 min-h-0 flex items-center justify-center ${
                        isFiltered ? "text-primary" : "text-base-content/40 hover:text-base-content/70"
                      }`}
                      title="Filter column"
                      onClick={(e) => toggleFilterDropdown(column.key, e)}
                    >
                      <Icon icon={isFiltered ? filterXIcon : filterIcon} width={16} height={16} />
                    </button>
                  )}
                </div>
                <div
                  className="column-resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, column.key)}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAutoFitColumn(column.key);
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: -3,
                    width: "8px",
                    height: "100%",
                    cursor: allowColumnResize ? "col-resize" : "default",
                    backgroundColor: isResizing === column.key ? "#3b82f6" : "transparent",
                    zIndex: 10
                  }}
                  title="Drag to resize | Double-click to auto-fit"
                />
              </div>
            );
          })}
          {actionsRender && (
            <div className="spreadsheet-column-header" style={{ position: "relative" }}>
              Actions
              {actionsColumnResizable && (
                <div
                  className="resize-handle"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startWidth = actionsWidth;

                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const delta = moveEvent.clientX - startX;
                      const newWidth = Math.max(80, Math.min(400, startWidth + delta));
                      setActionsWidth(newWidth);
                    };

                    const onMouseUp = () => {
                      document.removeEventListener("mousemove", onMouseMove);
                      document.removeEventListener("mouseup", onMouseUp);
                    };

                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                  }}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: "8px",
                    height: "100%",
                    cursor: "col-resize",
                    backgroundColor: "transparent",
                    zIndex: 10
                  }}
                  title="Drag to resize"
                />
              )}
            </div>
          )}
        </div>

        <div className="spreadsheet-virtual-canvas" style={{ height: totalHeight }}>
          {visibleRows.map(({ row, rowIndex, offset, height }) => {
            const hasRow = !!row;
            const isRowSelected =
              isRowSelection &&
              selectionRange &&
              rowIndex >= selectionRange.startRow &&
              rowIndex <= selectionRange.endRow;
            const isRowActive = isRowSelection && selectedCell?.rowIndex === rowIndex;
            return (
              <div
                key={(hasRow && (getRowId?.(row as T, rowIndex) ?? (row as any).id)) ?? `placeholder-${rowIndex}`}
                className={`spreadsheet-grid-base spreadsheet-row-grid ${
                  hasRow && row ? rowClassName?.(row, rowIndex) ?? "" : ""
                }`}
                style={{
                  gridTemplateColumns,
                  top: offset,
                  height
                }}
                onClick={() => hasRow && row && onRowClick?.(row, rowIndex)}
                onDoubleClick={() => hasRow && row && onRowDoubleClick?.(row, rowIndex)}
                onContextMenu={(event) => hasRow && row && onRowContextMenu?.(row, rowIndex, event)}
                data-row-index={rowIndex}
              >
                <div
                  className={`spreadsheet-row-number ${isRowSelected ? "row-selected" : ""} ${
                    isRowActive ? "row-active" : ""
                  }`}
                  title={hasRow && row && rowNumberTitle ? rowNumberTitle(row, rowIndex) : undefined}
                  onMouseDown={(e) => handleRowHeaderMouseDown(e, rowIndex)}
                  onMouseEnter={() => {
                    if (!firstColumnKey) return;
                    if (!isDraggingSelectionRef.current || selectionDragModeRef.current !== "row") return;
                    extendSelectionTo(rowIndex, lastColumnKey || firstColumnKey);
                  }}
                >
                  {hasRow && row && rowNumberRender ? rowNumberRender(row, rowIndex) : rowIndex + 1}
                </div>

                {columns.map((column) => {
                  const columnIndex = columnIndexMap[column.key];
                  const isActive =
                    selectedCell?.rowIndex === rowIndex && selectedCell?.columnKey === column.key;
                  const isEditing =
                    editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key;
                  const isEditable =
                    column.editable &&
                    !isViewMode &&
                    hasRow &&
                    !!row &&
                    (!isCellEditable || isCellEditable(row, column, rowIndex));
                  const cellValue = hasRow && row ? getValue(row, column) : null;
                  const cellClass =
                    hasRow && column.cellClassName && row
                      ? column.cellClassName(cellValue, row, rowIndex)
                      : "";
                  const isInSelection =
                    selectionRange && columnIndex !== undefined
                      ? rowIndex >= selectionRange.startRow &&
                        rowIndex <= selectionRange.endRow &&
                        columnIndex >= selectionRange.startCol &&
                        columnIndex <= selectionRange.endCol
                      : false;
                  const isSelectionEdge =
                    isInSelection &&
                    selectionRange &&
                    (rowIndex === selectionRange.startRow ||
                      rowIndex === selectionRange.endRow ||
                      columnIndex === selectionRange.startCol ||
                      columnIndex === selectionRange.endCol);

                  // Compute selection border edges for unified rectangle
                  const selectionBorderLeft = isInSelection && selectionRange && columnIndex === selectionRange.startCol;
                  const selectionBorderRight = isInSelection && selectionRange && columnIndex === selectionRange.endCol;
                  const selectionBorderTop = isInSelection && selectionRange && rowIndex === selectionRange.startRow;
                  const selectionBorderBottom = isInSelection && selectionRange && rowIndex === selectionRange.endRow;
                  const alignClass = column.align ? `cell-align-${column.align}` : "";

                  return (
                    <div
                      key={column.key}
                      className={`spreadsheet-data-cell ${isActive ? "cell-selected-primary cell-active" : ""} ${
                        isEditable ? "editable-cell" : ""
                      } ${cellClass ?? ""} ${alignClass} ${isInSelection ? "cell-range" : ""} ${
                        isSelectionEdge ? "cell-range-edge" : ""
                      } ${selectionBorderLeft ? "selection-border-left" : ""} ${
                        selectionBorderRight ? "selection-border-right" : ""
                      } ${selectionBorderTop ? "selection-border-top" : ""} ${
                        selectionBorderBottom ? "selection-border-bottom" : ""
                      }`}
                      data-column={column.key}
                      tabIndex={0}
                      onMouseDown={(e) =>
                        !isEditing && beginSelection(rowIndex, column.key, { extend: e.shiftKey, mode: "cell" })
                      }
                      onMouseEnter={() => extendSelectionTo(rowIndex, column.key)}
                      onClick={(e) => {
                        // Start editing on single click if cell is editable and not shift-clicking or drag-selecting
                        if (isEditable && !e.shiftKey && !isDraggingSelectionRef.current) {
                          setEditingCell({ rowIndex, columnKey: column.key });
                        }
                      }}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, column.key)}
                      onKeyDown={(e) => handleKeyDown(e, rowIndex, column.key)}
                    >
                      {isEditing && hasRow && row && isEditable
                        ? renderEditor(column, row, rowIndex, cellValue)
                        : renderDisplayValue(column, row as T, rowIndex)}
                    </div>
                  );
                })}
                {actionsRender && (
                  <div className="spreadsheet-data-cell" data-column="actions">
                    <div className="excel-cell-content">{hasRow && row ? actionsRender(row, rowIndex) : null}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {summaryRow && (
          <div className="spreadsheet-summary">
            {summaryRow(processedRows, { gridTemplateColumns, columnWidths })}
          </div>
        )}
      </div>

      {sheetTabs && sheetTabs.length > 0 && (
        <div className="sheet-tabs-wrapper">
          <SheetTabs
            flushWithGrid
            tabs={sheetTabs}
            activeKey={activeSheetTab || sheetTabs[0].key}
            onChange={onSheetTabChange || (() => {})}
          />
        </div>
      )}

      {footer}

      {openFilterDropdown && allowFilters && (
        <div
          ref={filterDropdownRef}
          className="filter-dropdown fixed bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 z-50"
          style={{
            top: filterDropdownPosition?.top ?? 0,
            left: filterDropdownPosition?.left ?? 0
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Filter</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => {
                setOpenFilterDropdown(null);
              }}
            >
              <Icon icon={xIcon} fontSize={14} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Search..."
            className="input input-xs input-bordered w-full mb-2"
            value={filterSearchTerms[openFilterDropdown] || ""}
            onChange={(e) =>
              setFilterSearchTerms((prev) => ({ ...prev, [openFilterDropdown]: e.target.value }))
            }
          />

          <div className="flex gap-1 mb-2">
            <button
              className="btn btn-xs flex-1"
              onClick={() =>
                setColumnFilters((prev) => ({
                  ...prev,
                  [openFilterDropdown]: getUniqueColumnValues(openFilterDropdown)
                }))
              }
            >
              Select All
            </button>
            <button
              className="btn btn-xs flex-1"
              onClick={() =>
                setColumnFilters((prev) => {
                  const next = { ...prev };
                  delete next[openFilterDropdown];
                  return next;
                })
              }
            >
              Clear
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {getUniqueColumnValues(openFilterDropdown)
              .filter((value) => {
                const searchTerm = filterSearchTerms[openFilterDropdown]?.toLowerCase() || "";
                return value.toLowerCase().includes(searchTerm);
              })
              .map((value) => {
                const isChecked = columnFilters[openFilterDropdown]?.includes(value) ?? false;
                return (
                  <label
                    key={value}
                    className="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={isChecked}
                      onChange={(e) =>
                        handleColumnFilterChange(openFilterDropdown, value, e.target.checked)
                      }
                    />
                    <span className="text-sm truncate">{value}</span>
                  </label>
                );
              })}
          </div>
        </div>
      )}

      <LongTextDialog
        open={!!longTextCell}
        title={longTextTitle}
        value={longTextCell?.value || ""}
        editable={longTextEditable}
        onClose={() => setLongTextCell(null)}
        onSave={
          longTextEditable && longTextCell
            ? (next) => {
                const column = columns.find((c) => c.key === longTextCell.columnKey);
                if (column) {
                  updateCellValue(longTextCell.rowIndex, column, next);
                }
              }
            : undefined
        }
      />
    </div>
  );
}

const Spreadsheet = forwardRef(SpreadsheetInner) as <T>(
  props: SpreadsheetProps<T> & { ref?: React.Ref<SpreadsheetRef<T>> }
) => React.ReactElement;

export default Spreadsheet;

type OverflowCellContentProps = {
  value: string | number | null | undefined;
  rowIndex: number;
  columnKey: string;
  columnWidth: number;
  onOpenLongText: (rowIndex: number, columnKey: string, value: string) => void;
};

// Format numbers: show 123.01 if decimals are meaningful, or 123 if no decimals (not 123.00)
const formatNumberDisplay = (value: number): string => {
  // Check if the number has meaningful decimal places
  const rounded = Math.round(value * 100) / 100; // Round to 2 decimal places
  if (Number.isInteger(rounded)) {
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  // Has meaningful decimals - show up to 2 decimal places
  return rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const OverflowCellContent: React.FC<OverflowCellContentProps> = ({
  value,
  rowIndex,
  columnKey,
  columnWidth,
  onOpenLongText
}) => {
  let displayValue: string;
  if (value === null || value === undefined || value === "") {
    displayValue = "-";
  } else if (typeof value === "number") {
    displayValue = formatNumberDisplay(value);
  } else {
    displayValue = String(value);
  }
  const { textRef, isOverflowing } = useOverflowDetection<HTMLSpanElement>(displayValue, columnWidth);

  if (isOverflowing) {
    return (
      <button
        type="button"
        className="excel-cell-content spreadsheet-longtext"
        title={displayValue}
        onClick={() => onOpenLongText(rowIndex, columnKey, displayValue)}
      >
        <span className="flex-1 min-w-0 truncate" ref={textRef}>
          {displayValue}
        </span>
        <Icon icon={externalLinkIcon} fontSize={14} />
      </button>
    );
  }

  return (
    <div className="excel-cell-content" title={undefined}>
      <span className="block w-full truncate" ref={textRef}>
        {displayValue}
      </span>
    </div>
  );
};
