import React, { useState, useCallback, useMemo, memo } from "react";
import { Icon } from "@iconify/react";
import layersIcon from "@iconify/icons-lucide/layers";
import uploadIcon from "@iconify/icons-lucide/upload";
import trashIcon from "@iconify/icons-lucide/trash";
import calculatorIcon from "@iconify/icons-lucide/calculator";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { useWizardContext, BOQItem } from "../context/WizardContext";
import useToast from "@/hooks/use-toast";
import useBOQUnits from "../../hooks/use-units";
import BOQImportModal from "../../shared/components/BOQImportModal";
import CostCodeSelectionModal from "../../components/CostCodeSelectionModal";
import useCostCodeSelection from "../../hooks/use-cost-code-selection";
import BudgetBOQSelectionModal from "../../components/BudgetBOQSelectionModal";
import { useContractsApi } from "../../hooks/use-contracts-api";
import DescriptionModal from "../../components/DescriptionModal";
import { formatCurrency } from "@/utils/formatters";

interface BOQEditingSectionProps {
    tabs: Array<{ key: string; label: string; buildingId: number; tradeName: string }>;
    activeTab: string;
    onTabChange: (tabKey: string) => void;
    budgetBOQLoadedTabs: Set<string>;
    setBudgetBOQLoadedTabs: React.Dispatch<React.SetStateAction<Set<string>>>;
}

// Extended BOQ item type with empty row marker
interface DisplayBOQItem extends BOQItem {
    _isEmptyRow?: boolean;
}

export const BOQEditingSection: React.FC<BOQEditingSectionProps> = memo(({
    tabs,
    activeTab,
    onTabChange,
    budgetBOQLoadedTabs,
    setBudgetBOQLoadedTabs
}) => {
    const { formData, setFormData, allBuildings } = useWizardContext();
    const { toaster } = useToast();
    const { units } = useBOQUnits();
    const {
        costCodes,
        loading: costCodesLoading,
        selectedCostCode,
        modalOpen: costCodeModalOpen,
        setModalOpen: setCostCodeModalOpen,
        handleCostCodeDoubleClick
    } = useCostCodeSelection();
    const { copyBoqItems, loading: budgetBOQLoading } = useContractsApi();

    const [isImportingBOQ, setIsImportingBOQ] = useState(false);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState<{ itemNo: string; description: string } | null>(null);
    const [selectedBOQItemIndex, setSelectedBOQItemIndex] = useState<number | null>(null);
    const [showBudgetBOQModal, setShowBudgetBOQModal] = useState(false);

    // Get active tab info
    const activeTabInfo = useMemo(() => {
        return tabs.find(t => t.key === activeTab);
    }, [tabs, activeTab]);

    // Create empty BOQ item
    const createEmptyBOQItem = useCallback((): DisplayBOQItem => ({
        id: 0,
        no: "",
        key: "",
        costCode: "",
        unite: "",
        qte: 0,
        pu: 0,
        _isEmptyRow: true
    }), []);

    // Get current BOQ items for active tab with empty row
    const displayItems = useMemo((): DisplayBOQItem[] => {
        if (!activeTabInfo) return [createEmptyBOQItem()];
        const buildingBOQ = formData.boqData.find(
            b => b.buildingId === activeTabInfo.buildingId && b.sheetName === activeTabInfo.tradeName
        );
        const items: DisplayBOQItem[] = (buildingBOQ?.items || []).map(item => ({
            ...item,
            _isEmptyRow: false
        }));
        // Add empty row at the end
        items.push(createEmptyBOQItem());
        return items;
    }, [activeTabInfo, formData.boqData, createEmptyBOQItem]);

    // Get items without empty row for calculations
    const actualItems = useMemo(() => {
        return displayItems.filter(item => !item._isEmptyRow);
    }, [displayItems]);

    // Update BOQ item
    const updateBOQItem = useCallback((itemIndex: number, field: keyof BOQItem, value: any) => {
        if (!activeTabInfo) return;

        const updatedBOQData = [...formData.boqData];
        const buildingIndex = updatedBOQData.findIndex(
            b => b.buildingId === activeTabInfo.buildingId && b.sheetName === activeTabInfo.tradeName
        );

        if (buildingIndex >= 0) {
            const buildingBOQ = updatedBOQData[buildingIndex];
            if (buildingBOQ.items[itemIndex]) {
                buildingBOQ.items[itemIndex] = {
                    ...buildingBOQ.items[itemIndex],
                    [field]: value
                };
            }
        }

        setFormData({ boqData: updatedBOQData });
    }, [activeTabInfo, formData.boqData, setFormData]);

    // Add new BOQ item
    const addNewBOQItem = useCallback((initialData: Partial<BOQItem>) => {
        if (!activeTabInfo) return;

        const newItem: BOQItem = {
            id: Date.now(),
            no: "",
            key: "",
            costCode: "",
            unite: "",
            qte: 0,
            pu: 0,
            ...initialData
        };

        const updatedBOQData = [...formData.boqData];
        const buildingIndex = updatedBOQData.findIndex(
            b => b.buildingId === activeTabInfo.buildingId && b.sheetName === activeTabInfo.tradeName
        );

        if (buildingIndex >= 0) {
            updatedBOQData[buildingIndex].items.push(newItem);
        } else {
            const building = allBuildings.find(b => b.id === activeTabInfo.buildingId);
            updatedBOQData.push({
                buildingId: activeTabInfo.buildingId,
                buildingName: building?.name || `Building ${activeTabInfo.buildingId}`,
                sheetName: activeTabInfo.tradeName,
                items: [newItem]
            });
        }

        setFormData({ boqData: updatedBOQData });
    }, [activeTabInfo, formData.boqData, allBuildings, setFormData]);

    // Delete BOQ item
    const deleteBOQItem = useCallback((itemIndex: number) => {
        if (!activeTabInfo) return;

        const updatedBOQData = [...formData.boqData];
        const buildingIndex = updatedBOQData.findIndex(
            b => b.buildingId === activeTabInfo.buildingId && b.sheetName === activeTabInfo.tradeName
        );

        if (buildingIndex >= 0) {
            updatedBOQData[buildingIndex].items.splice(itemIndex, 1);

            // If all items are deleted, clear the budgetBOQLoaded flag for this tab
            if (updatedBOQData[buildingIndex].items.length === 0) {
                setBudgetBOQLoadedTabs(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(activeTab);
                    return newSet;
                });
            }

            setFormData({ boqData: updatedBOQData });
        }
    }, [activeTabInfo, formData.boqData, activeTab, setFormData, setBudgetBOQLoadedTabs]);

    // Fields that are readonly when Budget BOQ is loaded
    const budgetBOQReadonlyFields = useMemo(() => ["no", "key", "costCode", "unite"], []);

    // Handle cell change from Spreadsheet
    const handleCellChange = useCallback((rowIndex: number, columnKey: string, value: any, row: DisplayBOQItem) => {
        if (row._isEmptyRow) {
            // Adding new row - only add if value is not empty
            if (value !== "" && value !== 0) {
                addNewBOQItem({ [columnKey]: value });
            }
        } else {
            // Check read-only fields
            if (row._budgetBOQSource && row._readonly && budgetBOQReadonlyFields.includes(columnKey)) {
                toaster.warning(`${columnKey} cannot be modified for Budget BOQ items`);
                return;
            }
            updateBOQItem(rowIndex, columnKey as keyof BOQItem, value);
        }
    }, [addNewBOQItem, updateBOQItem, toaster, budgetBOQReadonlyFields]);

    // Check if a cell is editable
    const isCellEditable = useCallback((row: DisplayBOQItem, column: SpreadsheetColumn<DisplayBOQItem>, _index: number) => {
        // Empty row is always editable
        if (row._isEmptyRow) return true;

        // Check if field is readonly for Budget BOQ items
        if (row._budgetBOQSource && row._readonly && budgetBOQReadonlyFields.includes(column.key)) {
            return false;
        }

        // For qte and pu columns, require unite to be set first
        if ((column.key === "qte" || column.key === "pu") && !row.unite) {
            return false;
        }

        return column.editable !== false;
    }, [budgetBOQReadonlyFields]);

    // Handle cost code selection for a BOQ item
    const handleCostCodeSelectForItem = useCallback((costCode: any) => {
        if (selectedBOQItemIndex !== null) {
            updateBOQItem(selectedBOQItemIndex, "costCode", costCode.code);
            setSelectedBOQItemIndex(null);
        }
    }, [selectedBOQItemIndex, updateBOQItem]);

    // Define columns for Spreadsheet
    const columns = useMemo((): SpreadsheetColumn<DisplayBOQItem>[] => [
        {
            key: "no",
            label: "Ref#",
            width: 80,
            align: "center",
            editable: true,
            sortable: true,
            filterable: true,
            type: "text"
        },
        {
            key: "key",
            label: "Description",
            width: 250,
            align: "left",
            editable: true,
            sortable: true,
            filterable: true,
            type: "text"
        },
        {
            key: "costCode",
            label: "Cost Code",
            width: 120,
            align: "center",
            editable: true,
            sortable: true,
            filterable: true,
            type: "text"
        },
        {
            key: "unite",
            label: "Unit",
            width: 80,
            align: "center",
            editable: true,
            sortable: true,
            filterable: true,
            type: "select",
            options: units.map(unit => ({ label: unit.name, value: unit.name }))
        },
        {
            key: "qte",
            label: "Quantity",
            width: 100,
            align: "right",
            editable: true,
            sortable: true,
            filterable: true,
            type: "number",
            formatter: (value) => {
                if (!value && value !== 0) return "";
                return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
            }
        },
        {
            key: "pu",
            label: "Unit Price",
            width: 120,
            align: "right",
            editable: true,
            sortable: true,
            filterable: true,
            type: "number",
            formatter: (value) => {
                if (!value && value !== 0) return "";
                return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
            }
        },
        {
            key: "totalPrice",
            label: "Total Price",
            width: 140,
            align: "right",
            editable: false,
            sortable: true,
            formatter: (_value, row) => {
                if (row._isEmptyRow || !row.unite) return "-";
                const total = (row.qte || 0) * (row.pu || 0);
                return formatCurrency(total);
            }
        }
    ], [units]);

    // Render actions column
    const actionsRender = useCallback((row: DisplayBOQItem, index: number) => {
        if (row._isEmptyRow) return null;
        return (
            <button
                onClick={() => deleteBOQItem(index)}
                className="btn btn-ghost btn-sm text-error/70 hover:bg-error/20"
                title="Delete item"
            >
                <Icon icon={trashIcon} className="w-4 h-4" />
            </button>
        );
    }, [deleteBOQItem]);

    // Summary row
    const summaryRow = useCallback((rows: DisplayBOQItem[], meta?: { gridTemplateColumns: string }) => {
        const actualRows = rows.filter(r => !r._isEmptyRow);
        if (actualRows.length === 0) return null;

        const total = actualRows.reduce((sum, item) => {
            if (!item.unite) return sum;
            return sum + ((item.qte || 0) * (item.pu || 0));
        }, 0);

        return (
            <div
                className="spreadsheet-grid-base font-semibold text-xs bg-base-200"
                style={{ gridTemplateColumns: meta?.gridTemplateColumns, minHeight: 36 }}
            >
                {/* Row number */}
                <div className="spreadsheet-row-number flex items-center justify-center border-r border-b border-base-300 bg-base-200">Σ</div>
                {/* Ref# */}
                <div className="border-r border-b border-base-300"></div>
                {/* Description */}
                <div className="flex items-center px-3 border-r border-b border-base-300">Totals</div>
                {/* Cost Code */}
                <div className="border-r border-b border-base-300"></div>
                {/* Unit */}
                <div className="border-r border-b border-base-300"></div>
                {/* Quantity */}
                <div className="border-r border-b border-base-300"></div>
                {/* Unit Price */}
                <div className="border-r border-b border-base-300"></div>
                {/* Total Price */}
                <div className="flex items-center justify-end px-3 border-r border-b border-base-300 text-primary">
                    {formatCurrency(total)}
                </div>
                {/* Actions */}
                <div className="border-b border-base-300"></div>
            </div>
        );
    }, []);

    // Row click handler for cost code double-click
    const handleRowDoubleClick = useCallback((row: DisplayBOQItem, index: number) => {
        // Note: For more precise cell double-click handling, we'd need to use the plugin system
        // For now, we handle cost code selection via the modal button or by typing
    }, []);

    // Handle imported BOQ items
    const handleBOQImport = useCallback((importedItems: any[]) => {
        if (!importedItems || importedItems.length === 0 || !activeTabInfo) {
            toaster.error("No items to import");
            return;
        }

        if (budgetBOQLoadedTabs.has(activeTab)) {
            toaster.error("Cannot import BOQ items when Budget BOQ is loaded for this tab. Budget BOQ structure must be preserved.");
            return;
        }

        const newBOQItems: BOQItem[] = importedItems.map((item, index) => ({
            id: Date.now() + index,
            no: item.no || (index + 1).toString(),
            key: item.description || "",
            costCode: item.costCodeName || "",
            unite: item.unit || "",
            qte: item.quantity || 0,
            pu: item.unitPrice || 0,
        }));

        const updatedBOQData = [...formData.boqData];
        const buildingIndex = updatedBOQData.findIndex(
            b => b.buildingId === activeTabInfo.buildingId && b.sheetName === activeTabInfo.tradeName
        );

        if (buildingIndex >= 0) {
            const existingItems = updatedBOQData[buildingIndex].items || [];
            const nonEmptyExistingItems = existingItems.filter(item =>
                !(item.no === "" && item.key === "" && (!item.costCode || item.costCode === "") &&
                    (!item.unite || item.unite === "") && item.qte === 0 && item.pu === 0)
            );

            updatedBOQData[buildingIndex] = {
                ...updatedBOQData[buildingIndex],
                items: [...nonEmptyExistingItems, ...newBOQItems]
            };
        } else {
            const building = allBuildings.find(b => b.id === activeTabInfo.buildingId);
            updatedBOQData.push({
                buildingId: activeTabInfo.buildingId,
                buildingName: building?.name || "",
                sheetName: activeTabInfo.tradeName,
                items: newBOQItems
            });
        }

        setFormData({ boqData: updatedBOQData });
        setIsImportingBOQ(false);
        toaster.success(`Successfully imported ${newBOQItems.length} BOQ items`);
    }, [formData.boqData, activeTabInfo, budgetBOQLoadedTabs, activeTab, allBuildings, setFormData, toaster]);

    // Handle Budget BOQ loading
    const handleLoadBudgetBOQ = useCallback(async (sheetName: string, buildingIds: number[]) => {
        if (!sheetName || buildingIds.length === 0) {
            toaster.error("Please select a sheet and buildings");
            return;
        }

        try {
            const result = await copyBoqItems({
                sheetName: sheetName,
                buildingIds: buildingIds
            });

            if (result.success && result.data) {
                const transformedBOQData = result.data.map((building: any) => ({
                    buildingId: building.id,
                    buildingName: building.buildingName,
                    sheetName: building.sheetName,
                    items: building.boqsContract.map((item: any) => ({
                        id: item.id || 0,
                        no: item.no || "",
                        key: item.key || "",
                        costCode: item.costCode || "",
                        unite: item.unite || "",
                        qte: item.qte || 0,
                        pu: item.pu || 0,
                        totalPrice: item.totalPrice || ((item.qte || 0) * (item.pu || 0)),
                        _budgetBOQSource: "budget",
                        _readonly: true
                    }))
                }));

                // MERGE Budget BOQ items with existing boqData
                const existingDataMap = new Map(
                    formData.boqData.map(item => [`${item.buildingId}-${item.sheetName}`, item])
                );

                transformedBOQData.forEach(newItem => {
                    const key = `${newItem.buildingId}-${newItem.sheetName}`;
                    existingDataMap.set(key, newItem);
                });

                const mergedBoqData = Array.from(existingDataMap.values());
                setFormData({ boqData: mergedBoqData });

                // Mark Budget BOQ as loaded for the tabs we just loaded
                const loadedTabKeys = transformedBOQData.map(
                    (building: any) => `${building.buildingId}-${building.sheetName}`
                );
                setBudgetBOQLoadedTabs(prev => {
                    const newSet = new Set(prev);
                    loadedTabKeys.forEach(key => newSet.add(key));
                    return newSet;
                });

                setShowBudgetBOQModal(false);
                toaster.success(`Budget BOQ loaded successfully! Loaded ${transformedBOQData.reduce((sum: number, building: any) => sum + building.items.length, 0)} items from ${transformedBOQData.length} buildings.`);
            } else {
                toaster.error("Failed to load Budget BOQ items");
            }
        } catch (error) {
            console.error("Error loading Budget BOQ:", error);
            toaster.error("An error occurred while loading Budget BOQ items");
        }
    }, [copyBoqItems, formData.boqData, setFormData, setBudgetBOQLoadedTabs, toaster]);

    // Row class for read-only items
    const rowClassName = useCallback((row: DisplayBOQItem, _index: number) => {
        if (row._isEmptyRow) return "opacity-50";
        if (row._budgetBOQSource) return "bg-info/5";
        return undefined;
    }, []);

    if (!activeTabInfo) {
        return (
            <div className="text-center py-8">
                <Icon icon={calculatorIcon} className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                <p className="text-base-content/60">Please select trades and buildings first</p>
            </div>
        );
    }

    // Toolbar with building selector and action buttons
    const toolbar = (
        <div className="flex items-center justify-between w-full flex-wrap gap-3">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <Icon icon={calculatorIcon} className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-base-content">BOQ Items</h3>
                </div>

                {/* Building/Trade Dropdown Selector */}
                <div className="relative">
                    <select
                        value={activeTab}
                        onChange={(e) => onTabChange(e.target.value)}
                        className="select select-bordered select-sm min-w-[280px] pr-10 font-medium"
                    >
                        {tabs.map(tab => (
                            <option key={tab.key} value={tab.key}>
                                {tab.label}
                            </option>
                        ))}
                    </select>
                    <Icon
                        icon={chevronDownIcon}
                        className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/50"
                    />
                </div>

                {tabs.length > 1 && (
                    <span className="text-xs text-base-content/50">
                        {tabs.findIndex(t => t.key === activeTab) + 1} of {tabs.length}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowBudgetBOQModal(true)}
                    className="btn btn-success btn-sm"
                    disabled={budgetBOQLoading}
                    title="Load items from Budget BOQ"
                >
                    {budgetBOQLoading ? (
                        <>
                            <div className="loading loading-spinner loading-xs"></div>
                            Loading...
                        </>
                    ) : (
                        <>
                            <Icon icon={layersIcon} className="w-4 h-4" />
                            Load Budget BOQ
                        </>
                    )}
                </button>

                <button
                    onClick={() => setIsImportingBOQ(true)}
                    className="btn btn-info btn-sm"
                    disabled={budgetBOQLoadedTabs.has(activeTab)}
                    title={budgetBOQLoadedTabs.has(activeTab) ? "Import disabled when Budget BOQ is loaded for this tab" : "Import BOQ from Excel file"}
                >
                    <Icon icon={uploadIcon} className="w-4 h-4" />
                    Import BOQ
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-base-100 border border-base-300 rounded-lg h-full flex flex-col overflow-hidden">
            <Spreadsheet<DisplayBOQItem>
                data={displayItems}
                columns={columns}
                mode="edit"
                loading={false}
                emptyMessage="No BOQ items. Start typing to add items."
                rowHeight={40}
                toolbar={toolbar}
                onCellChange={handleCellChange}
                onRowDoubleClick={handleRowDoubleClick}
                isCellEditable={isCellEditable}
                actionsRender={actionsRender}
                actionsColumnWidth={60}
                rowClassName={rowClassName}
                summaryRow={summaryRow}
                getRowId={(row, index) => row.id || `empty-${index}`}
                allowKeyboardNavigation
                allowColumnResize
                allowSorting={false}
                allowFilters={false}
            />

            {/* BOQ Import Modal */}
            <BOQImportModal
                isOpen={isImportingBOQ}
                onClose={() => setIsImportingBOQ(false)}
                onSuccess={handleBOQImport}
                contractDataSetId={0}
                availableBuildings={allBuildings.map(building => ({
                    id: building.id,
                    name: building.name,
                    sheets: building.sheets.map(sheet => ({
                        id: sheet.id,
                        name: sheet.name
                    }))
                }))}
                currentBuildingId={activeTabInfo.buildingId}
                currentSheetName={activeTabInfo.tradeName}
            />

            {/* Description Modal */}
            {showDescriptionModal && selectedDescription && (
                <DescriptionModal
                    isOpen={showDescriptionModal}
                    onClose={() => {
                        setShowDescriptionModal(false);
                        setSelectedDescription(null);
                    }}
                    title={`Item ${selectedDescription.itemNo} Description`}
                    description={selectedDescription.description}
                    itemNo={selectedDescription.itemNo}
                />
            )}

            {/* Cost Code Selection Modal */}
            <CostCodeSelectionModal
                isOpen={costCodeModalOpen}
                onClose={() => {
                    setCostCodeModalOpen(false);
                    setSelectedBOQItemIndex(null);
                }}
                onSelect={handleCostCodeSelectForItem}
                selectedCostCode={selectedCostCode}
                costCodes={costCodes}
                loading={costCodesLoading}
            />

            {/* Budget BOQ Selection Modal */}
            <BudgetBOQSelectionModal
                isOpen={showBudgetBOQModal}
                onClose={() => setShowBudgetBOQModal(false)}
                onLoadBudgetBOQ={handleLoadBudgetBOQ}
                projectId={formData.projectId}
                buildingIds={activeTabInfo ? [activeTabInfo.buildingId] : []}
                buildings={allBuildings}
                selectedSheetName={activeTabInfo.tradeName}
                hasExistingBOQData={actualItems.length > 0}
                loading={budgetBOQLoading}
            />
        </div>
    );
});
