import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Icon } from "@iconify/react";
import trashIcon from "@iconify/icons-lucide/trash";
import trash2Icon from "@iconify/icons-lucide/trash-2";
import downloadIcon from "@iconify/icons-lucide/download";
import saveIcon from "@iconify/icons-lucide/save";
import buildingIcon from "@iconify/icons-lucide/building";
import coinsIcon from "@iconify/icons-lucide/coins";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import plusIcon from "@iconify/icons-lucide/plus";
import { formatCurrency } from "@/utils/formatters";
import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn, SpreadsheetRef, SheetTab } from "@/components/Spreadsheet";

import useTrades from "@/pages/admin/adminTools/trades/use-trades";
import useBOQUnits from "@/pages/admin/dashboards/subcontractors-BOQs/hooks/use-units";

// =============================================================================
// TYPES
// =============================================================================

interface BOQItem {
  id: number;
  no?: string;
  key?: string;
  unite?: string;
  qte?: number | string;
  pu?: number | string;
  pt?: number;
  _isTotalRow?: boolean; // Flag for the total row
  _isEmptyRow?: boolean; // Flag for the empty row (for adding new data)
  [key: string]: any;
}

interface Currency {
  id: number;
  name: string;
  currencies: string;
}

interface Building {
  id: number;
  name: string;
  [key: string]: any;
}

interface BOQSpreadsheetProps {
  selectedBuilding: any;
  projectData: any;
  setProjectData: (data: any) => void;
  selectedProject?: any;
  columns: Record<string, string>;
  processBoqData: (data: any) => any;
  selectedTrade: any;
  setSelectedTrade: (trade: any) => void;
  // Action handlers
  onClearBoq?: () => void;
  onImportBoq?: () => void;
  onSave?: () => void;
  saving?: boolean;
  hasUnsavedChanges?: boolean;
  importingBoq?: boolean;
  // Building selector
  buildings?: Building[];
  onBuildingDialogOpen?: () => void;
  // Currency selector
  currencies?: Currency[];
  currencyId?: number;
  onCurrencyDialogOpen?: () => void;
}

// Ref interface for external access
export interface BOQSpreadsheetRef {
  addRow: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const parseNumberValue = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0;
  const stringValue = String(value).replace(/,/g, "");
  const parsed = parseFloat(stringValue);
  return Number.isFinite(parsed) ? parsed : 0;
};

// =============================================================================
// COMPONENT
// =============================================================================

const BOQSpreadsheet = forwardRef<BOQSpreadsheetRef, BOQSpreadsheetProps>(({
  selectedBuilding,
  projectData,
  setProjectData,
  columns,
  processBoqData,
  selectedTrade,
  setSelectedTrade,
  onClearBoq,
  onImportBoq,
  onSave,
  saving,
  hasUnsavedChanges,
  importingBoq,
  buildings,
  onBuildingDialogOpen,
  currencies,
  currencyId,
  onCurrencyDialogOpen
}, ref) => {
  const { getTrades, sheets } = useTrades();
  const { units } = useBOQUnits();

  // Use RAW data for the spreadsheet (not processed/formatted)
  const [rawTableData, setRawTableData] = useState<BOQItem[]>([]);
  const [enhancedSheets, setEnhancedSheets] = useState<any[]>([]);
  const projectDataRef = useRef(projectData);
  const spreadsheetRef = useRef<SpreadsheetRef<BOQItem>>(null);

  // Keep projectDataRef in sync
  useEffect(() => {
    projectDataRef.current = projectData;
  }, [projectData]);

  // Load trades on mount
  useEffect(() => {
    getTrades();
  }, []);

  // =============================================================================
  // SHEET MANAGEMENT
  // =============================================================================

  useEffect(() => {
    if (sheets && sheets.length > 0) {
      const building =
        selectedBuilding &&
        projectData?.buildings?.find((b: any) => b.id === selectedBuilding.id);

      const enhanced = sheets.map((sheet: any) => {
        const buildingSheet = building?.boqSheets?.find(
          (s: any) => s.name === sheet.name
        );
        const hasData = !!(
          buildingSheet &&
          buildingSheet.boqItems &&
          buildingSheet.boqItems.length > 0
        );

        return {
          ...sheet,
          hasData,
          itemCount: buildingSheet?.boqItems?.length || 0,
          buildingSheetId: buildingSheet?.id
        };
      });

      setEnhancedSheets(enhanced);

      let newSelectedTrade = null;
      const selectedTradeStillExists = enhanced.some(
        (s) => s.id === selectedTrade?.id
      );

      if (selectedTradeStillExists) {
        newSelectedTrade = enhanced.find((s) => s.id === selectedTrade?.id);
      } else {
        newSelectedTrade = enhanced.find((s) => s.hasData) || enhanced[0] || null;
      }

      if (JSON.stringify(newSelectedTrade) !== JSON.stringify(selectedTrade)) {
        setSelectedTrade(newSelectedTrade);
      }
    } else {
      setEnhancedSheets([]);
      setSelectedTrade(null);
    }
  }, [sheets, selectedBuilding, projectData]);

  // Load table data when selection changes - USE RAW DATA
  useEffect(() => {
    if (selectedBuilding && projectData && selectedTrade) {
      const building = projectData.buildings?.find(
        (b: any) => b.id === selectedBuilding.id
      );

      if (building) {
        const sheet = (selectedTrade as any).buildingSheetId
          ? building.boqSheets?.find(
              (s: any) => s.id === (selectedTrade as any).buildingSheetId
            )
          : building.boqSheets?.find((s: any) => s.name === selectedTrade.name);

        if (sheet && sheet.boqItems && sheet.boqItems.length > 0) {
          // Use raw data directly - don't process/format it
          setRawTableData([...sheet.boqItems]);
        } else {
          setRawTableData([]);
        }
      } else {
        setRawTableData([]);
      }
    }
  }, [selectedBuilding, projectData, selectedTrade]);

  // =============================================================================
  // DATA OPERATIONS
  // =============================================================================

  const handleItemUpdate = useCallback(
    (updatedItem: Partial<BOQItem> & { id: number }) => {
      const currentProject = projectDataRef.current;
      if (!currentProject || !selectedBuilding || !selectedTrade) return null;

      const buildings = currentProject.buildings || [];
      const buildingIndex = buildings.findIndex(
        (b: any) => b.id === selectedBuilding.id
      );
      if (buildingIndex === -1) return null;

      const building = { ...buildings[buildingIndex] };
      const boqSheets = building.boqSheets ? [...building.boqSheets] : [];

      const sheetIndex = boqSheets.findIndex(
        (s: any) =>
          s.id === (selectedTrade as any).buildingSheetId ||
          s.name === selectedTrade.name
      );
      if (sheetIndex === -1) return null;

      const sheet = { ...boqSheets[sheetIndex] };
      const items = sheet.boqItems ? [...sheet.boqItems] : [];
      const itemIndex = items.findIndex(
        (item: any) => item.id === updatedItem.id
      );

      if (itemIndex === -1) return null;

      const existingItem = items[itemIndex];
      const hasQteUpdate = Object.prototype.hasOwnProperty.call(updatedItem, "qte");
      const hasPuUpdate = Object.prototype.hasOwnProperty.call(updatedItem, "pu");

      const resolvedQte = hasQteUpdate
        ? parseNumberValue(updatedItem.qte)
        : parseNumberValue(existingItem.qte);
      const resolvedPu = hasPuUpdate
        ? parseNumberValue(updatedItem.pu)
        : parseNumberValue(existingItem.pu);

      const qte = Number.isFinite(resolvedQte) ? resolvedQte : 0;
      const pu = Number.isFinite(resolvedPu) ? resolvedPu : 0;
      const pt = qte * pu;

      const newItem = {
        ...existingItem,
        ...updatedItem,
        qte,
        pu,
        pt
      };

      items[itemIndex] = newItem;
      sheet.boqItems = items;
      boqSheets[sheetIndex] = sheet;
      building.boqSheets = boqSheets;

      const updatedProjectData = {
        ...currentProject,
        buildings: [
          ...buildings.slice(0, buildingIndex),
          building,
          ...buildings.slice(buildingIndex + 1)
        ]
      };

      projectDataRef.current = updatedProjectData;
      setProjectData(updatedProjectData);

      // Update local raw data
      setRawTableData([...items]);

      return newItem;
    },
    [selectedBuilding, selectedTrade, setProjectData]
  );

  const handleItemDelete = useCallback(
    (itemToDelete: BOQItem) => {
      const currentProject = projectDataRef.current;
      if (!currentProject || !selectedBuilding || !selectedTrade || !itemToDelete)
        return;

      const buildings = currentProject.buildings || [];
      const buildingIndex = buildings.findIndex(
        (b: any) => b.id === selectedBuilding.id
      );
      if (buildingIndex === -1) return;

      const building = { ...buildings[buildingIndex] };
      const boqSheets = building.boqSheets ? [...building.boqSheets] : [];
      const sheetIndex = boqSheets.findIndex(
        (s: any) =>
          s.id === (selectedTrade as any).buildingSheetId ||
          s.name === selectedTrade.name
      );
      if (sheetIndex === -1) return;

      const sheet = { ...boqSheets[sheetIndex] };
      const filteredItems = sheet.boqItems
        ? sheet.boqItems.filter((item: any) => item.id !== itemToDelete.id)
        : [];

      sheet.boqItems = filteredItems;
      boqSheets[sheetIndex] = sheet;
      building.boqSheets = boqSheets;

      const updatedProjectData = {
        ...currentProject,
        buildings: [
          ...buildings.slice(0, buildingIndex),
          building,
          ...buildings.slice(buildingIndex + 1)
        ]
      };

      projectDataRef.current = updatedProjectData;
      setProjectData(updatedProjectData);

      // Update local raw data
      setRawTableData([...filteredItems]);
    },
    [selectedBuilding, selectedTrade, setProjectData]
  );

  // Add new row function
  const handleAddRow = useCallback(() => {
    const currentProject = projectDataRef.current;
    if (!currentProject || !selectedBuilding || !selectedTrade) return;

    const buildings = currentProject.buildings || [];
    const buildingIndex = buildings.findIndex(
      (b: any) => b.id === selectedBuilding.id
    );
    if (buildingIndex === -1) return;

    const building = { ...buildings[buildingIndex] };
    let boqSheets = building.boqSheets ? [...building.boqSheets] : [];

    // Find or create the sheet
    let sheetIndex = boqSheets.findIndex(
      (s: any) =>
        s.id === (selectedTrade as any).buildingSheetId ||
        s.name === selectedTrade.name
    );

    // If sheet doesn't exist, create it
    if (sheetIndex === -1) {
      const newSheet = {
        id: (selectedTrade as any).buildingSheetId || -(Date.now()),
        name: selectedTrade.name,
        boqItems: []
      };
      boqSheets.push(newSheet);
      sheetIndex = boqSheets.length - 1;
    }

    const sheet = { ...boqSheets[sheetIndex] };
    const items = sheet.boqItems ? [...sheet.boqItems] : [];

    // Generate unique temporary ID (negative to avoid conflicts with real IDs)
    const minId = items.length > 0
      ? Math.min(...items.map((item: any) => item.id || 0), 0)
      : 0;
    const newId = minId - 1;

    // Calculate the next row number
    const maxNo = items
      .filter((item: any) => !item._isTotalRow)
      .reduce((max: number, item: any) => {
        const num = parseInt(item.no) || 0;
        return num > max ? num : max;
      }, 0);

    // Create new empty row
    const newRow: BOQItem = {
      id: newId,
      no: String(maxNo + 1),
      key: "",
      unite: "",
      qte: 0,
      pu: 0,
      pt: 0
    };

    items.push(newRow);
    sheet.boqItems = items;
    boqSheets[sheetIndex] = sheet;
    building.boqSheets = boqSheets;

    const updatedProjectData = {
      ...currentProject,
      buildings: [
        ...buildings.slice(0, buildingIndex),
        building,
        ...buildings.slice(buildingIndex + 1)
      ]
    };

    projectDataRef.current = updatedProjectData;
    setProjectData(updatedProjectData);

    // Update local raw data
    setRawTableData([...items]);
  }, [selectedBuilding, selectedTrade, setProjectData]);

  // Expose addRow function to parent via ref
  useImperativeHandle(ref, () => ({
    addRow: handleAddRow
  }), [handleAddRow]);

  // =============================================================================
  // SPREADSHEET CONFIGURATION
  // =============================================================================

  // Convert columns to SpreadsheetColumn format
  const spreadsheetColumns = useMemo((): SpreadsheetColumn<BOQItem>[] => {
    const columnKeys = Object.keys(columns);
    const unitOptions = units.map((u) => ({ label: u.name, value: u.name }));

    return columnKeys.map((key) => {
      const label = columns[key];
      const isItemColumn = key === "key";
      const isUnitColumn = key === "unite";
      const isQuantityColumn = key === "qte";
      const isUnitPriceColumn = key === "pu";
      const isTotalColumn = key === "pt" || key === "total_price";

      const column: SpreadsheetColumn<BOQItem> = {
        key,
        label,
        width: isItemColumn ? 300 : isTotalColumn ? 150 : 120,
        align: isItemColumn ? "left" : "center",
        editable: !isTotalColumn && key !== "no",
        sortable: true,
        filterable: true
      };

      // Configure unit column as select
      if (isUnitColumn) {
        column.type = "select";
        column.options = unitOptions;
      }

      // Configure number columns
      if (isQuantityColumn || isUnitPriceColumn) {
        column.type = "number";
        column.parser = (value) => parseNumberValue(value);
        // Use render for display formatting (NOT formatter, which affects edit mode)
        column.render = (value, row) => {
          // Total row - show empty for qty/pu columns
          if (row._isTotalRow) return "";
          const num = parseNumberValue(value);
          if (num === 0) return "";
          return num.toLocaleString();
        };
      }

      // Configure total column with calculation and formatting
      if (isTotalColumn) {
        column.render = (_value, row) => {
          // Total row - show the total price
          if (row._isTotalRow) {
            return <span className="text-primary font-semibold">{formatCurrency(row.pt || 0)}</span>;
          }
          const total = parseNumberValue(row.qte) * parseNumberValue(row.pu);
          if (!total || Number.isNaN(total)) return "-";
          return formatCurrency(total);
        };
      }

      // Special render for first column (N° or key) to show "TOTAL" label
      if (key === "no") {
        const originalRender = column.render;
        column.render = (value, row, index) => {
          if (row._isTotalRow) return <span className="text-primary font-semibold">TOTAL</span>;
          return originalRender ? originalRender(value, row, index) : value;
        };
      }

      // Row styling for title rows, total row, and empty row
      column.cellClassName = (_value, row) => {
        // Total row styling
        if (row._isTotalRow) return "font-semibold bg-base-200";

        // Empty row styling (subtle hint that it's for adding new data)
        if (row._isEmptyRow) return "bg-base-100/50 text-base-content/40";

        // Title row detection (no unit, no qty, no price)
        const isTitleRow =
          (!row.unite || row.unite === "") &&
          (!row.qte || row.qte === 0 || row.qte === "0") &&
          (!row.pu || row.pu === 0 || row.pu === "0");

        if (isTitleRow) return "font-bold";
        return undefined;
      };

      return column;
    });
  }, [columns, units]);

  // Handle cell changes - including adding new row when typing in empty row
  const handleCellChange = useCallback(
    (rowIndex: number, columnKey: string, value: any, row: BOQItem) => {
      // If editing the empty row, convert it to a real row
      if (row._isEmptyRow) {
        const currentProject = projectDataRef.current;
        if (!currentProject || !selectedBuilding || !selectedTrade) return;

        const buildings = currentProject.buildings || [];
        const buildingIndex = buildings.findIndex(
          (b: any) => b.id === selectedBuilding.id
        );
        if (buildingIndex === -1) return;

        const building = { ...buildings[buildingIndex] };
        let boqSheets = building.boqSheets ? [...building.boqSheets] : [];

        // Find or create the sheet
        let sheetIndex = boqSheets.findIndex(
          (s: any) =>
            s.id === (selectedTrade as any).buildingSheetId ||
            s.name === selectedTrade.name
        );

        // If sheet doesn't exist, create it
        if (sheetIndex === -1) {
          const newSheet = {
            id: (selectedTrade as any).buildingSheetId || -(Date.now()),
            name: selectedTrade.name,
            boqItems: []
          };
          boqSheets.push(newSheet);
          sheetIndex = boqSheets.length - 1;
        }

        const sheet = { ...boqSheets[sheetIndex] };
        const items = sheet.boqItems ? [...sheet.boqItems] : [];

        // Generate unique temporary ID (negative to avoid conflicts with real IDs)
        const minId = items.length > 0
          ? Math.min(...items.map((item: any) => item.id || 0), 0)
          : 0;
        const newId = minId - 1;

        // Create new row with the entered value
        const newRow: BOQItem = {
          id: newId,
          no: row.no, // Use the row number from the empty row
          key: columnKey === 'key' ? value : "",
          unite: columnKey === 'unite' ? value : "",
          qte: columnKey === 'qte' ? parseNumberValue(value) : 0,
          pu: columnKey === 'pu' ? parseNumberValue(value) : 0,
          pt: 0
        };

        items.push(newRow);
        sheet.boqItems = items;
        boqSheets[sheetIndex] = sheet;
        building.boqSheets = boqSheets;

        const updatedProjectData = {
          ...currentProject,
          buildings: [
            ...buildings.slice(0, buildingIndex),
            building,
            ...buildings.slice(buildingIndex + 1)
          ]
        };

        projectDataRef.current = updatedProjectData;
        setProjectData(updatedProjectData);
        setRawTableData([...items]);
      } else {
        // Normal update for existing rows
        handleItemUpdate({
          id: row.id,
          [columnKey]: value
        });
      }
    },
    [handleItemUpdate, selectedBuilding, selectedTrade, setProjectData]
  );

  // Render delete action button (hidden for total row and empty row)
  const renderActions = useCallback(
    (row: BOQItem) => {
      if (row._isTotalRow || row._isEmptyRow) return null;
      return (
        <button
          className="btn btn-ghost btn-xs text-error hover:bg-error/20"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Are you sure you want to delete this item?")) {
              handleItemDelete(row);
            }
          }}
          title="Delete"
        >
          <Icon icon={trashIcon} className="w-4 h-4" />
        </button>
      );
    },
    [handleItemDelete]
  );

  // Prevent editing the total row but allow empty row
  const isCellEditable = useCallback(
    (row: BOQItem, _column: SpreadsheetColumn<BOQItem>, _index: number) => {
      return !row._isTotalRow; // Allow editing empty row, only block total row
    },
    []
  );

  // Calculate totals from raw data (excluding total row itself)
  const totalPrice = useMemo(() => {
    return rawTableData
      .filter(item => !item._isTotalRow)
      .reduce((sum, item) => {
        const qte = parseNumberValue(item.qte);
        const pu = parseNumberValue(item.pu);
        return sum + qte * pu;
      }, 0);
  }, [rawTableData]);

  // Data with empty row and total row appended
  const dataWithTotalRow = useMemo((): BOQItem[] => {
    const dataRows = rawTableData.filter(item => !item._isTotalRow && !item._isEmptyRow);

    // Calculate next row number
    const maxNo = dataRows.reduce((max: number, item: any) => {
      const num = parseInt(item.no) || 0;
      return num > max ? num : max;
    }, 0);

    // Create empty row for adding new data
    const emptyRow: BOQItem = {
      id: -998, // Special ID for empty row
      no: String(maxNo + 1),
      key: "",
      unite: "",
      qte: "",
      pu: "",
      pt: 0,
      _isEmptyRow: true
    };

    // Create total row
    const totalRow: BOQItem = {
      id: -999, // Special ID for total row
      no: "",
      key: "TOTAL",
      unite: "",
      qte: "",
      pu: "",
      pt: totalPrice,
      _isTotalRow: true
    };

    return [...dataRows, emptyRow, totalRow];
  }, [rawTableData, totalPrice]);

  // Convert sheets to SheetTab format for Spreadsheet's built-in tabs
  const sheetTabs = useMemo((): SheetTab[] => {
    return enhancedSheets.map((sheet) => ({
      key: String(sheet.id),
      label: sheet.name,
      count: sheet.itemCount > 0 ? sheet.itemCount : undefined
    }));
  }, [enhancedSheets]);

  const handleSheetTabChange = useCallback(
    (key: string) => {
      const sheet = enhancedSheets.find((s) => String(s.id) === key);
      if (sheet) {
        setSelectedTrade(sheet);
      }
    },
    [enhancedSheets, setSelectedTrade]
  );

  // =============================================================================
  // TOOLBAR
  // =============================================================================

  // Get selected currency name
  const selectedCurrencyName = useMemo(() => {
    if (!currencies || !currencyId) return "Select Currency";
    const currency = currencies.find(c => c.id === currencyId);
    return currency?.currencies || "Select Currency";
  }, [currencies, currencyId]);

  // Left toolbar - Building and Currency selectors (far left of formula bar)
  const toolbarLeftContent = useMemo(() => (
    <div className="flex items-center gap-2">
      {/* Building Selector */}
      {onBuildingDialogOpen && (
        <div className="tooltip tooltip-bottom z-50 before:z-50 after:z-50" data-tip="Select Building">
          <button
            type="button"
            onClick={onBuildingDialogOpen}
            disabled={!buildings || buildings.length === 0}
            className="h-8 px-3 flex items-center gap-2 rounded-lg bg-base-100 border border-base-300 text-base-content hover:bg-base-200 hover:border-base-400 transition-colors disabled:opacity-50"
          >
            <Icon icon={buildingIcon} className="w-4 h-4 text-base-content/60" />
            <span className="font-medium text-sm max-w-32 truncate">{selectedBuilding?.name || "Select Building"}</span>
            <Icon icon={chevronDownIcon} className="w-3 h-3 opacity-60" />
          </button>
        </div>
      )}

      {/* Currency Selector */}
      {onCurrencyDialogOpen && (
        <div className="tooltip tooltip-bottom z-50 before:z-50 after:z-50" data-tip="Select Currency">
          <button
            type="button"
            onClick={onCurrencyDialogOpen}
            className="h-8 px-3 flex items-center gap-2 rounded-lg bg-base-100 border border-base-300 text-base-content hover:bg-base-200 hover:border-base-400 transition-colors disabled:opacity-50"
          >
            <Icon icon={coinsIcon} className="w-4 h-4 text-base-content/60" />
            <span className="font-medium text-sm">{selectedCurrencyName}</span>
            <Icon icon={chevronDownIcon} className="w-3 h-3 opacity-60" />
          </button>
        </div>
      )}
    </div>
  ), [onBuildingDialogOpen, onCurrencyDialogOpen, buildings, selectedBuilding, selectedCurrencyName]);

  // Right toolbar - Action buttons (Import, Save, Clear)
  const toolbarButtons = useMemo(() => (
    <div className="flex items-center gap-2">
      {/* Import BOQ */}
      {onImportBoq && (
        <div className="tooltip tooltip-bottom z-50 before:z-50 after:z-50" data-tip="Import BOQ from Excel">
          <button
            type="button"
            onClick={onImportBoq}
            disabled={importingBoq}
            className="w-14 h-9 flex items-center justify-center rounded-lg bg-base-100 border border-base-300 text-base-content/60 hover:bg-base-200 hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50"
          >
            <Icon icon={downloadIcon} className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Save */}
      {onSave && (
        <div className="tooltip tooltip-bottom z-50 before:z-50 after:z-50" data-tip={hasUnsavedChanges ? "Save changes" : "No changes to save"}>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !hasUnsavedChanges || importingBoq}
            className={`w-14 h-9 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
              hasUnsavedChanges
                ? "bg-primary/10 text-primary border-primary/40 hover:bg-primary/20"
                : "bg-base-100 text-base-content/40 border-base-300 hover:bg-base-200"
            }`}
          >
            <Icon icon={saveIcon} className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Divider */}
      {onClearBoq && <div className="w-px h-6 bg-base-300 mx-1" />}

      {/* Clear BOQ */}
      {onClearBoq && (
        <div className="tooltip tooltip-bottom z-50 before:z-50 after:z-50" data-tip="Clear BOQ data">
          <button
            type="button"
            onClick={onClearBoq}
            disabled={importingBoq}
            className="w-14 h-9 flex items-center justify-center rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-colors disabled:opacity-50"
          >
            <Icon icon={trash2Icon} className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  ), [onClearBoq, onImportBoq, onSave, saving, hasUnsavedChanges, importingBoq]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <Spreadsheet
      ref={spreadsheetRef}
      data={dataWithTotalRow}
      columns={spreadsheetColumns}
      mode="edit"
      emptyMessage="No data available"
      persistKey="budget-boq-spreadsheet"
      rowHeight={32}
      onCellChange={handleCellChange}
      actionsRender={renderActions}
      isCellEditable={isCellEditable}
      getRowId={(row) => row.id}
      sheetTabs={sheetTabs}
      activeSheetTab={selectedTrade ? String(selectedTrade.id) : ""}
      onSheetTabChange={handleSheetTabChange}
      allowKeyboardNavigation
      allowColumnResize
      allowSorting={false}
      allowFilters={false}
      toolbarLeft={toolbarLeftContent}
      toolbar={toolbarButtons}
    />
  );
});

BOQSpreadsheet.displayName = 'BOQSpreadsheet';

export default BOQSpreadsheet;
