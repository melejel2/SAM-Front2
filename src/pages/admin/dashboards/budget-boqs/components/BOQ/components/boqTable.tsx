import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/daisyui";
import trashIcon from "@iconify/icons-lucide/trash";

import useTrades from "@/pages/admin/adminTools/trades/use-trades";
import useBOQUnits from "@/pages/admin/dashboards/subcontractors-BOQs/hooks/use-units";

const parseNumberValue = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;

    // Convert to string and remove thousand separators (commas)
    const stringValue = String(value).replace(/,/g, '');

    // Parse the cleaned string
    const parsed = parseFloat(stringValue);

    return Number.isFinite(parsed) ? parsed : 0;
};

const toEditableValue = (value: any, fieldType?: string) => {
    if (value === null || value === undefined) return '';
    if (fieldType === 'number') {
        return value === '' ? '' : String(value);
    }
    return String(value);
};

const valuesAreDifferent = (current: any, next: any, fieldType?: string) => {
    if (fieldType === 'number') {
        const currentNumber = parseNumberValue(current);
        const nextNumber = parseNumberValue(next);

        if (Number.isNaN(currentNumber) && Number.isNaN(nextNumber)) {
            return false;
        }

        return currentNumber !== nextNumber;
    }

    return toEditableValue(current, fieldType) !== toEditableValue(next, fieldType);
};

interface BOQTableProps {
    selectedBuilding: any;
    projectData: any;
    setProjectData: (data: any) => void;
    selectedProject?: any;
    columns: Record<string, string>;
    processBoqData: (data: any) => any;
    selectedTrade: any;
    setSelectedTrade: (trade: any) => void;
}

// Memoized table row component for better performance
const TableRow = memo(({
    row,
    columnKeys,
    columns,
    inputFields,
    editingCell,
    selectedCell,
    editingValue,
    getRawItem,
    getDisplayValue,
    handleCellClick,
    handleCellBlur,
    handleCellKeyDown,
    setEditingValue,
    handleItemDelete
}: any) => {
    const rawItem = getRawItem(row.id);

    const rowCells = columnKeys.map((columnKey: string, columnIndex: number) => {
        const fieldConfig = inputFields.find((f: any) => f.name === columnKey);
        const isEditing = editingCell?.rowId === row.id && editingCell?.columnKey === columnKey;
        const isSelected = selectedCell?.rowId === row.id && selectedCell?.columnKey === columnKey;
        const isSecondColumn = columnIndex === 1;
        const alignmentWrapper = isSecondColumn ? 'justify-start text-left' : 'justify-center text-center';
        const inputAlignment = isSecondColumn ? 'text-left' : 'text-center';
        const displayValue = getDisplayValue(row.id, columnKey, rawItem);
        const isMissingUnit = columnKey === 'unite' && rawItem && (!rawItem.unite || rawItem.unite === '');
        const highlightStyle = isSelected ? { boxShadow: '0 0 0 2px var(--p)' } : undefined;

        return (
            <td
                key={`${row.id}-${columnKey}`}
                className="relative border border-base-300 align-middle"
                style={highlightStyle}
                onClick={() => {
                    if (fieldConfig) {
                        handleCellClick(row.id, columnKey);
                    }
                }}
            >
                <div
                    className={`relative z-10 flex items-center min-h-[2.2rem] px-2 py-1 ${alignmentWrapper} ${fieldConfig ? 'cursor-cell' : 'cursor-default'}`}
                >
                    {isEditing && fieldConfig ? (
                        fieldConfig.type === 'select' ? (
                            <select
                                value={editingValue ?? ''}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => handleCellBlur(row.id, columnKey)}
                                onKeyDown={(e) => handleCellKeyDown(e, row.id, columnKey)}
                                autoFocus
                                data-cell={`${row.id}-${columnKey}`}
                                className={`w-full px-2 py-1 text-xs sm:text-sm bg-base-100 border border-base-300 focus:border-primary focus:outline-none ${inputAlignment}`}
                            >
                                <option value="">Select {fieldConfig.label}</option>
                                {(fieldConfig.options || []).map((opt: string) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={fieldConfig.type}
                                value={editingValue ?? ''}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={() => handleCellBlur(row.id, columnKey)}
                                onKeyDown={(e) => handleCellKeyDown(e, row.id, columnKey)}
                                autoFocus
                                data-cell={`${row.id}-${columnKey}`}
                                className={`w-full bg-transparent px-1 py-1 text-xs sm:text-sm focus:outline-none ${inputAlignment}`}
                                placeholder={`Enter ${fieldConfig.label}`}
                            />
                        )
                    ) : (
                        <span
                            className={`block w-full ${isSecondColumn ? 'text-left' : 'text-center'} ${isMissingUnit ? 'font-semibold' : ''}`}
                        >
                            {displayValue}
                        </span>
                    )}
                </div>
            </td>
        );
    });

    return (
        <tr
            key={row.id}
            className="bg-base-100 hover:bg-primary/10 transition-colors"
        >
            {rowCells}
            <td className="border border-base-300 text-center align-middle px-1 py-1 bg-base-100">
                <Button
                    color="ghost"
                    size="sm"
                    shape="square"
                    className="text-error hover:bg-error/20 tooltip"
                    data-tip="Delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Are you sure you want to delete this item?")) {
                            handleItemDelete(row);
                        }
                    }}
                >
                    <Icon icon={trashIcon} className="w-4 h-4" />
                </Button>
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
        prevProps.row.id === nextProps.row.id &&
        prevProps.editingCell?.rowId === nextProps.editingCell?.rowId &&
        prevProps.editingCell?.columnKey === nextProps.editingCell?.columnKey &&
        prevProps.selectedCell?.rowId === nextProps.selectedCell?.rowId &&
        prevProps.selectedCell?.columnKey === nextProps.selectedCell?.columnKey &&
        prevProps.editingValue === nextProps.editingValue &&
        JSON.stringify(prevProps.getRawItem(prevProps.row.id)) === JSON.stringify(nextProps.getRawItem(nextProps.row.id))
    );
});

TableRow.displayName = 'TableRow';

const BOQTable: React.FC<BOQTableProps> = ({
    selectedBuilding,
    projectData,
    setProjectData,
    selectedProject,
    columns,
    processBoqData,
    selectedTrade,
    setSelectedTrade,
}) => {
    const { getTrades, sheets } = useTrades();
    const { units } = useBOQUnits();

    const [tableData, setTableData] = useState<any[]>([]);
    const [enhancedSheets, setEnhancedSheets] = useState<any[]>([]);
    const projectDataRef = useRef(projectData);

    // Excel-like cell selection state
    const [selectedCell, setSelectedCell] = useState<{rowId: any, columnKey: string} | null>(null);
    const [editingCell, setEditingCell] = useState<{rowId: any, columnKey: string} | null>(null);
    const [editingValue, setEditingValue] = useState<any>('');
    const [originalValue, setOriginalValue] = useState<any>('');

    // Keep projectDataRef in sync with projectData prop
    useEffect(() => {
        projectDataRef.current = projectData;
    }, [projectData]);

    const inputFields = useMemo(() => [
        { name: 'key', label: 'Item', type: 'text', required: true },
        { name: 'unite', label: 'Unit', type: 'select', required: true, options: units.map(u => u.name) },
        { name: 'qte', label: 'Quantity', type: 'number', required: true },
        { name: 'pu', label: 'Unit Price', type: 'number', required: true }
    ], [units]);

    const columnKeys = useMemo(() => Object.keys(columns), [columns]);

    const editableColumns = useMemo(
        () => columnKeys.filter((col) => inputFields.some((f) => f.name === col)),
        [columnKeys, inputFields]
    );

    useEffect(() => {
        getTrades();
    }, []);


    useEffect(() => {
         
        if (sheets && sheets.length > 0) {
            const building = selectedBuilding && projectData?.buildings?.find((b: any) => b.id === selectedBuilding.id);
            
            const enhanced = sheets.map((sheet: any) => {
                // For each master trade sheet, find the corresponding data sheet in the building's data.
                const buildingSheet = building?.boqSheets?.find((s: any) => s.name === sheet.name);
                const hasData = !!(buildingSheet && buildingSheet.boqItems && buildingSheet.boqItems.length > 0);
                
                return {
                    ...sheet,
                    hasData,
                    itemCount: buildingSheet?.boqItems?.length || 0,
                    buildingSheetId: buildingSheet?.id
                };
            });

            setEnhancedSheets(enhanced);

            let newSelectedTrade = null;
            const selectedTradeStillExists = enhanced.some(s => s.id === selectedTrade?.id);

            if (selectedTradeStillExists) {
                // If it still exists, get the updated version from the new enhanced list
                newSelectedTrade = enhanced.find(s => s.id === selectedTrade?.id);
            } else {
                // If not, find the first one with data
                newSelectedTrade = enhanced.find(s => s.hasData) || enhanced[0] || null;
            }
            
            // Only update if the trade object has actually changed to avoid loops
            if (JSON.stringify(newSelectedTrade) !== JSON.stringify(selectedTrade)) {
                setSelectedTrade(newSelectedTrade);
            }
        } else {
            setEnhancedSheets([]);
            setSelectedTrade(null);
        }
    }, [sheets, selectedBuilding, projectData]);

    useEffect(() => {
        if (selectedBuilding && projectData && selectedTrade) {
            const building = projectData.buildings?.find((b: any) => b.id === selectedBuilding.id);
            
            if (building) {
                // First try to find by building sheet ID if available, otherwise by name
                const sheet = (selectedTrade as any).buildingSheetId 
                    ? building.boqSheets?.find((s: any) => s.id === (selectedTrade as any).buildingSheetId)
                    : building.boqSheets?.find((s: any) => s.name === selectedTrade.name);
                
                if (sheet && sheet.boqItems && sheet.boqItems.length > 0) {
                    const processedData = processBoqData(sheet.boqItems);
                    setTableData(processedData);
                } else {
                    setTableData([]);
                }
            } else {
                setTableData([]);
            }
        }
    }, [selectedBuilding, projectData, selectedTrade]);

    const handleSheetSelect = (sheetId: number) => {
        const sheet = enhancedSheets.find((s: any) => s.id === sheetId);
        if (sheet) {
            setSelectedTrade(sheet);
        }
    };

    const handleItemUpdate = useCallback((updatedItem: any) => {
        const currentProject = projectDataRef.current;
        if (!currentProject || !selectedBuilding || !selectedTrade) return null;

        const buildings = currentProject.buildings || [];
        const buildingIndex = buildings.findIndex((b: any) => b.id === selectedBuilding.id);
        if (buildingIndex === -1) return null;

        const building = { ...buildings[buildingIndex] };
        const boqSheets = building.boqSheets ? [...building.boqSheets] : [];

        const sheetIndex = boqSheets.findIndex(
            (s: any) => s.id === (selectedTrade as any).buildingSheetId || s.name === selectedTrade.name
        );
        if (sheetIndex === -1) return null;

        const sheet = { ...boqSheets[sheetIndex] };
        const items = sheet.boqItems ? [...sheet.boqItems] : [];
        const itemIndex = items.findIndex((item: any) => item.id === updatedItem.id);

        if (itemIndex === -1) return null;

        const existingItem = items[itemIndex];
        const hasQteUpdate = Object.prototype.hasOwnProperty.call(updatedItem, 'qte');
        const hasPuUpdate = Object.prototype.hasOwnProperty.call(updatedItem, 'pu');

        const resolvedQte = hasQteUpdate ? parseNumberValue(updatedItem.qte) : parseNumberValue(existingItem.qte);
        const resolvedPu = hasPuUpdate ? parseNumberValue(updatedItem.pu) : parseNumberValue(existingItem.pu);

        const qte = Number.isFinite(resolvedQte) ? resolvedQte : 0;
        const pu = Number.isFinite(resolvedPu) ? resolvedPu : 0;
        const pt = qte * pu;

        const newItem = {
            ...existingItem,
            ...updatedItem,
            qte,
            pu,
            pt,
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
                ...buildings.slice(buildingIndex + 1),
            ],
        };

        projectDataRef.current = updatedProjectData;
        setProjectData(updatedProjectData);

        const processedRows = processBoqData ? processBoqData(items) : items;
        setTableData(processedRows);

        return newItem;
    }, [processBoqData, selectedBuilding, selectedTrade, setProjectData]);

    const handleItemDelete = (itemToDelete: any) => {
        const currentProject = projectDataRef.current;
        if (!currentProject || !selectedBuilding || !selectedTrade || !itemToDelete) return;

        const buildings = currentProject.buildings || [];
        const buildingIndex = buildings.findIndex((b: any) => b.id === selectedBuilding.id);
        if (buildingIndex === -1) return;

        const building = { ...buildings[buildingIndex] };
        const boqSheets = building.boqSheets ? [...building.boqSheets] : [];
        const sheetIndex = boqSheets.findIndex(
            (s: any) => s.id === (selectedTrade as any).buildingSheetId || s.name === selectedTrade.name
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
                ...buildings.slice(buildingIndex + 1),
            ],
        };

        projectDataRef.current = updatedProjectData;
        setProjectData(updatedProjectData);

        const processedRows = processBoqData ? processBoqData(filteredItems) : filteredItems;
        setTableData(processedRows);
    };

    const getRawItem = useCallback((rowId: any) => {
        const currentProject = projectDataRef.current;
        if (!currentProject || !selectedBuilding || !selectedTrade) return null;

        const building = currentProject.buildings?.find((b: any) => b.id === selectedBuilding.id);
        if (!building) return null;

        const sheet = (selectedTrade as any).buildingSheetId
            ? building.boqSheets?.find((s: any) => s.id === (selectedTrade as any).buildingSheetId)
            : building.boqSheets?.find((s: any) => s.name === selectedTrade.name);

        if (!sheet || !Array.isArray(sheet.boqItems)) return null;
        return sheet.boqItems.find((item: any) => item.id === rowId) || null;
    }, [selectedBuilding, selectedTrade]);

    const focusCell = useCallback((targetRowId: any, targetColumnKey: string) => {
        if (!editableColumns.includes(targetColumnKey)) return;

        const fieldConfig = inputFields.find((f) => f.name === targetColumnKey);
        if (!fieldConfig) return;

        const rawItem = getRawItem(targetRowId);
        const rawValue = rawItem ? rawItem[targetColumnKey] : '';
        const nextValue = toEditableValue(rawValue, fieldConfig.type);

        setSelectedCell({ rowId: targetRowId, columnKey: targetColumnKey });
        setEditingCell({ rowId: targetRowId, columnKey: targetColumnKey });
        setEditingValue(nextValue);
        setOriginalValue(nextValue);

        if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
                const element = document.querySelector(
                    `[data-cell="${targetRowId}-${targetColumnKey}"]`
                ) as HTMLInputElement | HTMLSelectElement | null;

                if (element) {
                    element.focus();
                    if (element instanceof HTMLInputElement && typeof element.select === 'function') {
                        element.select();
                    }
                }
            });
        }
    }, [editableColumns, getRawItem, inputFields]);

    const saveCellIfChanged = useCallback((rowId: any, columnKey: string, rawValue: any) => {
        const fieldConfig = inputFields.find((f) => f.name === columnKey);
        if (!fieldConfig) return null;

        const currentItem = getRawItem(rowId);
        const currentValue = currentItem ? currentItem[columnKey] : undefined;

        if (!valuesAreDifferent(currentValue, rawValue, fieldConfig.type)) {
            return currentItem;
        }

        const updatedItem = {
            id: rowId,
            [columnKey]: rawValue,
        };

        return handleItemUpdate(updatedItem);
    }, [getRawItem, handleItemUpdate, inputFields]);

    const getDisplayValue = useCallback((rowId: any, columnKey: string, providedRawItem?: any) => {
        const rawItem = providedRawItem ?? getRawItem(rowId);

        if ((columnKey === 'pt' || columnKey === 'total_price') && rawItem) {
            if (rawItem) {
                const total = parseNumberValue(rawItem.qte) * parseNumberValue(rawItem.pu);
                if (!total || Number.isNaN(total)) {
                    return '-';
                }

                const hasDecimals = total % 1 !== 0;
                return new Intl.NumberFormat('en-US', {
                    style: 'decimal',
                    minimumFractionDigits: hasDecimals ? 1 : 0,
                    maximumFractionDigits: hasDecimals ? 2 : 0,
                }).format(total);
            }
        }

        const row = tableData.find((r) => r.id === rowId);
        const value = row ? row[columnKey] : rawItem?.[columnKey];
        return value !== undefined && value !== null && value !== '' ? value : '-';
    }, [getRawItem, tableData]);

    // Excel-like cell editing handlers
    const handleCellClick = useCallback((rowId: any, columnKey: string) => {
        if (!editableColumns.includes(columnKey)) return;
        focusCell(rowId, columnKey);
    }, [editableColumns, focusCell]);

    const handleCellBlur = useCallback((rowId: any, columnKey: string) => {
        if (!editingCell || editingCell.rowId !== rowId || editingCell.columnKey !== columnKey) {
            return;
        }

        saveCellIfChanged(rowId, columnKey, editingValue);
        setEditingCell(null);
        setSelectedCell(null);
        setEditingValue('');
        setOriginalValue('');
    }, [editingCell, editingValue, saveCellIfChanged]);

    const handleCellKeyDown = useCallback((e: React.KeyboardEvent, rowId: any, columnKey: string) => {
        if (!editableColumns.length) return;

        const currentRowIndex = tableData.findIndex((r) => r.id === rowId);
        if (currentRowIndex === -1) return;

        const currentColIndex = editableColumns.indexOf(columnKey);
        if (currentColIndex === -1) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            saveCellIfChanged(rowId, columnKey, editingValue);

            if (currentRowIndex < tableData.length - 1) {
                const nextRow = tableData[currentRowIndex + 1];
                focusCell(nextRow.id, columnKey);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            saveCellIfChanged(rowId, columnKey, editingValue);

            if (e.shiftKey) {
                if (currentColIndex > 0) {
                    const prevCol = editableColumns[currentColIndex - 1];
                    focusCell(rowId, prevCol);
                } else if (currentRowIndex > 0) {
                    const prevRow = tableData[currentRowIndex - 1];
                    const prevCol = editableColumns[editableColumns.length - 1];
                    focusCell(prevRow.id, prevCol);
                }
            } else {
                if (currentColIndex < editableColumns.length - 1) {
                    const nextCol = editableColumns[currentColIndex + 1];
                    focusCell(rowId, nextCol);
                } else if (currentRowIndex < tableData.length - 1) {
                    const nextRow = tableData[currentRowIndex + 1];
                    const firstCol = editableColumns[0];
                    focusCell(nextRow.id, firstCol);
                }
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setEditingValue(originalValue);
            setEditingCell(null);
            setSelectedCell(null);
        }
    }, [editableColumns, editingValue, focusCell, originalValue, saveCellIfChanged, tableData]);

    const customHeaderContent = selectedProject ? (
        <div className="flex items-center gap-4">
            <span className="text-sm text-base-content/70">
                {selectedProject.name}
            </span>
            {selectedBuilding && (
                <>
                    <span className="text-base-content/40">&gt;</span>
                    <span className="text-sm font-medium text-base-content">
                        {selectedBuilding.name}
                    </span>
                </>
            )}
        </div>
    ) : null;

    // Calculate totals from original data
    const calculateTotals = useMemo(() => {
        if (!projectData || !selectedBuilding || !selectedTrade) {
            return { totalPrice: 0, hasData: false };
        }

        const building = projectData.buildings?.find((b: any) => b.id === selectedBuilding.id);
        if (!building) return { totalPrice: 0, hasData: false };

        const sheet = (selectedTrade as any).buildingSheetId
            ? building.boqSheets?.find((s: any) => s.id === (selectedTrade as any).buildingSheetId)
            : building.boqSheets?.find((s: any) => s.name === selectedTrade.name);

        if (!sheet || !sheet.boqItems || sheet.boqItems.length === 0) {
            return { totalPrice: 0, hasData: false };
        }

        const totalPrice = sheet.boqItems.reduce((sum: number, item: any) => {
            const qte = Number(item.qte) || 0;
            const pu = Number(item.pu) || 0;
            return sum + (qte * pu);
        }, 0);

        return { totalPrice, hasData: true };
    }, [projectData, selectedBuilding, selectedTrade]);

    const formatTotalPrice = (amount: number) => {
        if (!amount || isNaN(amount) || amount === 0) return '-';
        const hasDecimals = amount % 1 !== 0;
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: hasDecimals ? 1 : 0,
            maximumFractionDigits: hasDecimals ? 2 : 0
        }).format(amount);
    };

    // Excel-like table rendering with direct cell editing
    const renderExcelLikeTable = () => {
        if (tableData.length === 0) {
            return (
                <div className="p-8 text-center text-base-content/60">
                    No data available
                </div>
            );
        }

        const totalsRowCells = columnKeys.map((columnKey, index) => (
            <td
                key={`total-${columnKey}`}
                className="px-3 py-2 border border-base-300 font-semibold text-center"
            >
                {index === 0 ? (
                    <span className="text-primary">TOTAL</span>
                ) : columnKey === 'pt' || columnKey === 'total_price' ? (
                    <span className="text-primary">
                        {formatTotalPrice(calculateTotals.totalPrice)}
                    </span>
                ) : (
                    ''
                )}
            </td>
        ));

        return (
            <div className="h-full overflow-auto relative">
                <table className="w-full border-collapse bg-base-100 text-xs sm:text-sm">
                    <thead className="sticky top-0 z-20">
                        <tr>
                            {columnKeys.map((columnKey) => (
                                <th
                                    key={columnKey}
                                    className="px-3 py-2.5 border border-base-300 bg-base-200 text-center text-xs sm:text-sm font-semibold uppercase tracking-wide text-base-content"
                                >
                                    {columns[columnKey]}
                                </th>
                            ))}
                            <th className="px-3 py-3 border border-base-300 bg-base-200 text-center text-sm sm:text-base font-semibold uppercase tracking-wide text-base-content w-20">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row) => (
                            <TableRow
                                key={row.id}
                                row={row}
                                columnKeys={columnKeys}
                                columns={columns}
                                inputFields={inputFields}
                                editingCell={editingCell}
                                selectedCell={selectedCell}
                                editingValue={editingValue}
                                getRawItem={getRawItem}
                                getDisplayValue={getDisplayValue}
                                handleCellClick={handleCellClick}
                                handleCellBlur={handleCellBlur}
                                handleCellKeyDown={handleCellKeyDown}
                                setEditingValue={setEditingValue}
                                handleItemDelete={handleItemDelete}
                            />
                        ))}
                    </tbody>
                    {calculateTotals.hasData && (
                        <tfoot className="sticky bottom-0 z-10">
                            <tr className="bg-base-200">
                                {totalsRowCells}
                                <td className="border border-base-300 bg-base-200" />
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        );
    };

    return (
        <div className="bg-base-100 rounded-t-xl border border-base-300" style={{ height: '100%', width: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-base-300 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-base-content">Budget BOQ</h3>
                    {customHeaderContent}
                </div>
            </div>

            {/* Table */}
            <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'auto' }}>
                {renderExcelLikeTable()}
            </div>

            {/* Sheet Tabs */}
            {enhancedSheets.length > 0 && (
                <div className="bg-base-100 flex w-full overflow-x-auto border-t border-base-300 flex-shrink-0">
                    {enhancedSheets.map((sheet) => (
                        <span
                            key={sheet.id}
                            className={`min-w-max cursor-pointer px-3 py-1.5 text-center text-sm transition-all duration-200 relative border-b-2 ${
                                sheet.id === selectedTrade?.id
                                    ? sheet.hasData
                                        ? 'text-primary border-primary bg-primary/5'
                                        : 'text-base-content border-base-content/20 bg-base-200'
                                    : sheet.hasData
                                        ? 'text-base-content hover:text-primary border-transparent hover:border-primary/30'
                                        : 'text-base-content/50 border-transparent hover:text-base-content/70'
                            }`}
                            onClick={() => handleSheetSelect(sheet.id)}>
                            {sheet.name}
                            {sheet.itemCount > 0 && (
                                <span className="ml-1 text-xs opacity-60">
                                    ({sheet.itemCount})
                                </span>
                            )}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(BOQTable);
