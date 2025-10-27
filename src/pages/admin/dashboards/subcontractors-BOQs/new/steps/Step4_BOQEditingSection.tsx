import React, { useState, useCallback, useMemo, memo } from "react";
import { Icon } from "@iconify/react";
import layersIcon from "@iconify/icons-lucide/layers";
import uploadIcon from "@iconify/icons-lucide/upload";
import trashIcon from "@iconify/icons-lucide/trash";
import calculatorIcon from "@iconify/icons-lucide/calculator";
import { useWizardContext, BOQItem } from "../context/WizardContext";
import useToast from "@/hooks/use-toast";
import useBOQUnits from "../../hooks/use-units";
import BOQImportModal from "../../shared/components/BOQImportModal";
import CostCodeSelectionModal from "../../components/CostCodeSelectionModal";
import useCostCodeSelection from "../../hooks/use-cost-code-selection";
import BudgetBOQSelectionModal from "../../components/BudgetBOQSelectionModal";
import { useContractsApi } from "../../hooks/use-contracts-api";
import DescriptionModal from "../../components/DescriptionModal";

interface BOQEditingSectionProps {
    tabs: Array<{ key: string; label: string; buildingId: number; tradeName: string }>;
    activeTab: string;
    onTabChange: (tabKey: string) => void;
    budgetBOQLoadedTabs: Set<string>;
    setBudgetBOQLoadedTabs: React.Dispatch<React.SetStateAction<Set<string>>>;
}

// Memoized BOQ Table Row Component for performance
interface BOQTableRowProps {
    item: BOQItem;
    index: number;
    units: any[];
    isEmptyRow: boolean;
    formatNumber: (value: number) => string;
    formatInputValue: (value: number | string | undefined) => string;
    parseInputValue: (value: string) => number;
    updateBOQItem: (index: number, field: keyof BOQItem, value: any) => void;
    addNewBOQItem: (initialData: Partial<BOQItem>, fieldName: string) => void;
    deleteBOQItem: (index: number) => void;
    isFieldReadonly: (item: any, fieldName: string) => boolean;
    handleCostCodeCellDoubleClick: (index: number, currentCostCode?: string) => void;
    setShowDescriptionModal: (show: boolean) => void;
    setSelectedDescription: (desc: { itemNo: string; description: string } | null) => void;
}

const BOQTableRow = memo<BOQTableRowProps>(({
    item,
    index,
    units,
    isEmptyRow,
    formatNumber,
    formatInputValue,
    parseInputValue,
    updateBOQItem,
    addNewBOQItem,
    deleteBOQItem,
    isFieldReadonly,
    handleCostCodeCellDoubleClick,
    setShowDescriptionModal,
    setSelectedDescription
}) => {
    const { toaster } = useToast();

    return (
        <tr key={item.id || index} className="bg-base-100 hover:bg-base-200">
            <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                <input
                    id={`boq-input-${item.id}-no`}
                    type="text"
                    className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                    value={item.no}
                    onChange={(e) => {
                        if (isFieldReadonly(item, 'no')) {
                            e.preventDefault();
                            toaster.warning('Reference number cannot be modified for Budget BOQ items');
                            return false;
                        }
                        if (isEmptyRow && e.target.value) {
                            addNewBOQItem({ no: e.target.value }, 'no');
                        } else if (!isEmptyRow) {
                            updateBOQItem(index, 'no', e.target.value);
                        }
                    }}
                    placeholder="Ref#"
                />
            </td>
            <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                <input
                    id={`boq-input-${item.id}-key`}
                    type="text"
                    className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                    value={item.key}
                    onChange={(e) => {
                        if (isFieldReadonly(item, 'key')) {
                            e.preventDefault();
                            toaster.warning('Description cannot be modified for Budget BOQ items');
                            return false;
                        }
                        if (isEmptyRow && e.target.value) {
                            addNewBOQItem({ key: e.target.value }, 'key');
                        } else if (!isEmptyRow) {
                            updateBOQItem(index, 'key', e.target.value);
                        }
                    }}
                    onDoubleClick={() => {
                        if (isFieldReadonly(item, 'key')) {
                            toaster.warning('Description cannot be modified for Budget BOQ items');
                            return;
                        }
                        if (item.key) {
                            setSelectedDescription({
                                itemNo: item.no || `Item ${index + 1}`,
                                description: item.key
                            });
                            setShowDescriptionModal(true);
                        }
                    }}
                    placeholder=""
                />
            </td>
            <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                <input
                    id={`boq-input-${item.id}-costCode`}
                    type="text"
                    className={`w-full text-center text-xs sm:text-sm focus:outline-none focus:ring-2 rounded px-1 py-0.5 transition-colors ${
                        isFieldReadonly(item, 'costCode')
                            ? 'bg-base-200/50 text-base-content/60 cursor-not-allowed border border-base-300/50'
                            : 'bg-transparent focus:ring-primary/20 cursor-pointer hover:bg-base-200/50'
                    }`}
                    value={item.costCode || ''}
                    onChange={(e) => {
                        if (isFieldReadonly(item, 'costCode')) {
                            e.preventDefault();
                            e.stopPropagation();
                            toaster.warning('Cost code cannot be modified for Budget BOQ items');
                            return false;
                        }

                        if (isEmptyRow && e.target.value) {
                            addNewBOQItem({ costCode: e.target.value }, 'costCode');
                        } else if (!isEmptyRow) {
                            updateBOQItem(index, 'costCode', e.target.value);
                        }
                    }}
                    onDoubleClick={() => {
                        if (isFieldReadonly(item, 'costCode')) {
                            toaster.warning('Cost code cannot be modified for Budget BOQ items');
                            return;
                        }
                        handleCostCodeCellDoubleClick(index, item.costCode);
                    }}
                    placeholder=""
                    readOnly={isFieldReadonly(item, 'costCode')}
                    disabled={isFieldReadonly(item, 'costCode')}
                    title={isFieldReadonly(item, 'costCode') ? 'This field is read-only (loaded from Budget BOQ)' : 'Double-click to select from cost code library'}
                />
            </td>
            <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                <select
                    id={`boq-input-${item.id}-unite`}
                    className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5 border-0"
                    value={item.unite || ''}
                    onChange={(e) => {
                        if (isFieldReadonly(item, 'unite')) {
                            e.preventDefault();
                            toaster.warning('Unit cannot be modified for Budget BOQ items');
                            return false;
                        }
                        const selectedUnit = units.find(unit => unit.name === e.target.value);
                        const unitName = selectedUnit?.name || e.target.value;
                        if (isEmptyRow && unitName) {
                            addNewBOQItem({ unite: unitName }, 'unite');
                        } else if (!isEmptyRow) {
                            updateBOQItem(index, 'unite', unitName);
                        }
                    }}
                >
                    <option value=""></option>
                    {units.map(unit => (
                        <option key={unit.id} value={unit.name}>
                            {unit.name}
                        </option>
                    ))}
                </select>
            </td>
            <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                <input
                    id={`boq-input-${item.id}-qte`}
                    type="text"
                    className={`w-full text-center text-xs sm:text-sm focus:outline-none focus:ring-2 rounded px-1 py-0.5 ${
                        (!item.unite && !isEmptyRow) || isFieldReadonly(item, 'qte')
                            ? 'bg-base-200/50 text-base-content/60 cursor-not-allowed border border-base-300/50'
                            : 'bg-transparent focus:ring-primary/20'
                    }`}
                    value={formatInputValue(item.qte)}
                    onChange={(e) => {
                        if (isFieldReadonly(item, 'qte')) {
                            toaster.warning('Quantity cannot be modified for Budget BOQ items with readonly restrictions');
                            return;
                        }
                        if (!item.unite && !isEmptyRow) return;
                        const value = parseInputValue(e.target.value);
                        if (isEmptyRow && value > 0) {
                            addNewBOQItem({ qte: value }, 'qte');
                        } else if (!isEmptyRow) {
                            updateBOQItem(index, 'qte', value);
                        }
                    }}
                    placeholder=""
                    disabled={(!item.unite && !isEmptyRow) || isFieldReadonly(item, 'qte')}
                    readOnly={isFieldReadonly(item, 'qte')}
                    title={isFieldReadonly(item, 'qte') ? 'This field is read-only (loaded from Budget BOQ)' : (!item.unite && !isEmptyRow) ? 'Select a unit first' : 'Enter quantity'}
                />
            </td>
            <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                <input
                    id={`boq-input-${item.id}-pu`}
                    type="text"
                    className={`w-full text-center text-xs sm:text-sm focus:outline-none focus:ring-2 rounded px-1 py-0.5 ${
                        (!item.unite && !isEmptyRow) || isFieldReadonly(item, 'pu')
                            ? 'bg-base-200/50 text-base-content/60 cursor-not-allowed border border-base-300/50'
                            : 'bg-transparent focus:ring-primary/20'
                    }`}
                    value={formatInputValue(item.pu)}
                    onChange={(e) => {
                        if (isFieldReadonly(item, 'pu')) {
                            toaster.warning('Unit price cannot be modified for Budget BOQ items with readonly restrictions');
                            return;
                        }
                        if (!item.unite && !isEmptyRow) return;
                        const value = parseInputValue(e.target.value);
                        if (isEmptyRow && value > 0) {
                            addNewBOQItem({ pu: value }, 'pu');
                        } else if (!isEmptyRow) {
                            updateBOQItem(index, 'pu', value);
                        }
                    }}
                    placeholder=""
                    disabled={(!item.unite && !isEmptyRow) || isFieldReadonly(item, 'pu')}
                    readOnly={isFieldReadonly(item, 'pu')}
                    title={isFieldReadonly(item, 'pu') ? 'This field is read-only (loaded from Budget BOQ)' : (!item.unite && !isEmptyRow) ? 'Select a unit first' : 'Enter unit price'}
                />
            </td>
            <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-medium text-base-content text-center">
                {isEmptyRow || !item.unite ? '-' : formatNumber((item.qte || 0) * (item.pu || 0))}
            </td>
            <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-medium text-base-content w-24 sm:w-28 text-center">
                {!isEmptyRow && (
                    <div className="inline-flex">
                        <button
                            onClick={() => deleteBOQItem(index)}
                            className="btn btn-ghost btn-sm text-error/70 hover:bg-error/20"
                            title="Delete item"
                        >
                            <Icon icon={trashIcon} className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.no === nextProps.item.no &&
        prevProps.item.key === nextProps.item.key &&
        prevProps.item.costCode === nextProps.item.costCode &&
        prevProps.item.unite === nextProps.item.unite &&
        prevProps.item.qte === nextProps.item.qte &&
        prevProps.item.pu === nextProps.item.pu &&
        prevProps.isEmptyRow === nextProps.isEmptyRow &&
        prevProps.index === nextProps.index
    );
});

BOQTableRow.displayName = 'BOQTableRow';

export const BOQEditingSection: React.FC<BOQEditingSectionProps> = ({
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
        handleCostCodeSelect,
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

    // Number formatting function - memoized
    const formatNumber = useCallback((value: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value || 0);
    }, []);

    // Format input value for display (handles numbers and strings)
    const formatInputValue = useCallback((value: number | string | undefined) => {
        if (!value && value !== 0) return '';
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) return '';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: true
        }).format(numValue);
    }, []);

    // Parse formatted input back to number
    const parseInputValue = useCallback((value: string): number => {
        // Remove commas and parse
        const cleaned = value.replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }, []);

    // Create empty BOQ item
    const createEmptyBOQItem = (): BOQItem => ({
        id: 0,
        no: "",
        key: "",
        costCode: "",
        unite: "",
        qte: 0,
        pu: 0
    });

    // Add new BOQ item - memoized
    const addNewBOQItem = useCallback((initialData: Partial<BOQItem>, fieldName: string) => {
        if (!activeTabInfo) return;

        const newItem = { ...createEmptyBOQItem(), ...initialData };
        const updatedBOQData = [...formData.boqData];
        const buildingIndex = updatedBOQData.findIndex(
            b => b.buildingId === activeTabInfo.buildingId && b.sheetName === activeTabInfo.tradeName
        );

        if (buildingIndex >= 0) {
            updatedBOQData[buildingIndex].items.push(newItem as BOQItem);
        } else {
            const building = allBuildings.find(b => b.id === activeTabInfo.buildingId);
            updatedBOQData.push({
                buildingId: activeTabInfo.buildingId,
                buildingName: building?.name || `Building ${activeTabInfo.buildingId}`,
                sheetName: activeTabInfo.tradeName,
                items: [newItem as BOQItem]
            });
        }

        setFormData({ boqData: updatedBOQData });
    }, [activeTabInfo, formData.boqData, allBuildings, setFormData]);

    // Update BOQ item - memoized
    const updateBOQItem = useCallback((itemIndex: number, field: keyof BOQItem, value: any) => {
        if (!activeTabInfo) return;

        const updatedBOQData = [...formData.boqData];
        const buildingBOQ = updatedBOQData.find(
            b => b.buildingId === activeTabInfo.buildingId && b.sheetName === activeTabInfo.tradeName
        );

        if (buildingBOQ && buildingBOQ.items[itemIndex]) {
            buildingBOQ.items[itemIndex] = {
                ...buildingBOQ.items[itemIndex],
                [field]: value
            };
        }

        setFormData({ boqData: updatedBOQData });
    }, [activeTabInfo, formData.boqData, setFormData]);

    // Remove BOQ item - memoized
    const deleteBOQItem = useCallback((itemIndex: number) => {
        if (!activeTabInfo) return;

        const updatedBOQData = [...formData.boqData];
        const buildingBOQ = updatedBOQData.find(
            b => b.buildingId === activeTabInfo.buildingId && b.sheetName === activeTabInfo.tradeName
        );

        if (buildingBOQ) {
            buildingBOQ.items.splice(itemIndex, 1);

            // If all items are deleted, clear the budgetBOQLoaded flag for this tab
            if (buildingBOQ.items.length === 0) {
                setBudgetBOQLoadedTabs(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(activeTab);
                    return newSet;
                });
            }

            setFormData({ boqData: updatedBOQData });
        }
    }, [activeTabInfo, formData.boqData, activeTab, setFormData]);

    // Get current BOQ items for active tab
    const getCurrentBOQItems = () => {
        if (!activeTabInfo) return [];
        const buildingBOQ = formData.boqData.find(
            b => b.buildingId === activeTabInfo.buildingId && b.sheetName === activeTabInfo.tradeName
        );
        return buildingBOQ?.items || [];
    };

    // Handle cost code selection for a BOQ item
    const handleCostCodeSelectForItem = (costCode: any) => {
        if (selectedBOQItemIndex !== null) {
            updateBOQItem(selectedBOQItemIndex, 'costCode', costCode.code);
            setSelectedBOQItemIndex(null);
        }
    };

    // Handle double-click on cost code cell
    const handleCostCodeCellDoubleClick = (itemIndex: number, currentCostCode?: string) => {
        setSelectedBOQItemIndex(itemIndex);
        handleCostCodeDoubleClick(currentCostCode);
    };

    // Check if a field is readonly for Budget BOQ items
    const isFieldReadonly = (item: any, fieldName: string) => {
        return item._budgetBOQSource && item._readonly && item._readonly.includes(fieldName);
    };

    // Handle imported BOQ items - memoized
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
            key: item.description || '',
            costCode: item.costCodeName || '',
            unite: item.unit || '',
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
                !(item.no === '' && item.key === '' && (!item.costCode || item.costCode === '') &&
                    (!item.unite || item.unite === '') && item.qte === 0 && item.pu === 0)
            );

            updatedBOQData[buildingIndex] = {
                ...updatedBOQData[buildingIndex],
                items: [...nonEmptyExistingItems, ...newBOQItems]
            };
        } else {
            const building = allBuildings.find(b => b.id === activeTabInfo.buildingId);
            updatedBOQData.push({
                buildingId: activeTabInfo.buildingId,
                buildingName: building?.name || '',
                sheetName: activeTabInfo.tradeName,
                items: newBOQItems
            });
        }

        setFormData({ boqData: updatedBOQData });
        setIsImportingBOQ(false);
        toaster.success(`Successfully imported ${newBOQItems.length} BOQ items`);
    }, [formData.boqData, activeTabInfo, budgetBOQLoadedTabs, activeTab, allBuildings, setFormData, toaster]);

    // Handle Budget BOQ loading
    const handleLoadBudgetBOQ = async (sheetName: string, buildingIds: number[]) => {
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
                        no: item.no || '',
                        key: item.key || '',
                        costCode: item.costCode || '',
                        unite: item.unite || '',
                        qte: item.qte || 0,
                        pu: item.pu || 0,
                        totalPrice: item.totalPrice || ((item.qte || 0) * (item.pu || 0)),
                        _budgetBOQSource: true,
                        _readonly: ['no', 'key', 'costCode', 'unite']
                    }))
                }));

                // MERGE Budget BOQ items with existing boqData (don't wipe other trades/buildings)
                console.log("🎯📋 MERGING Budget BOQ with existing data");
                console.log("🎯📋 Existing boqData:", formData.boqData);
                console.log("🎯📋 New Budget BOQ data:", transformedBOQData);

                // Create a map of existing BOQ data by buildingId-sheetName
                const existingDataMap = new Map(
                    formData.boqData.map(item => [`${item.buildingId}-${item.sheetName}`, item])
                );

                // Add or replace with new Budget BOQ data
                transformedBOQData.forEach(newItem => {
                    const key = `${newItem.buildingId}-${newItem.sheetName}`;
                    existingDataMap.set(key, newItem);
                });

                // Convert back to array
                const mergedBoqData = Array.from(existingDataMap.values());

                console.log("🎯📋 Merged boqData:", mergedBoqData);
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
    };

    const items = getCurrentBOQItems();
    const displayItems = [...items];
    if (displayItems.length === 0 || displayItems[displayItems.length - 1].no !== '') {
        displayItems.push(createEmptyBOQItem());
    }

    if (!activeTabInfo) {
        return (
            <div className="text-center py-8">
                <Icon icon={calculatorIcon} className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                <p className="text-base-content/60">Please select trades and buildings first</p>
            </div>
        );
    }

    return (
        <div className="bg-base-100 border border-base-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon icon={calculatorIcon} className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-base-content">BOQ Items</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowBudgetBOQModal(true)}
                        className="btn btn-success btn-sm hover:btn-success-focus transition-all duration-200 ease-in-out"
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
                        className="btn btn-info btn-sm hover:btn-info-focus transition-all duration-200 ease-in-out"
                        disabled={budgetBOQLoadedTabs.has(activeTab)}
                        title={budgetBOQLoadedTabs.has(activeTab) ? "Import disabled when Budget BOQ is loaded for this tab" : "Import BOQ from Excel file"}
                    >
                        <Icon icon={uploadIcon} className="w-4 h-4" />
                        Import BOQ
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed mb-4 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
                        onClick={() => onTabChange(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* BOQ Table */}
            <div className="bg-base-100 rounded-xl border border-base-300 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full table-auto bg-base-100">
                        <thead className="bg-base-200">
                            <tr>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Ref#</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Description</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Cost Code</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Unit</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Quantity</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Unit Price</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Total Price</th>
                                <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider w-24 sm:w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-base-300">
                            {displayItems.map((item, index) => {
                                const isEmptyRow = item.no === '' && item.key === '' && (!item.costCode || item.costCode === '') && (!item.unite || item.unite === '') && item.qte === 0 && item.pu === 0;

                                return (
                                    <BOQTableRow
                                        key={item.id || index}
                                        item={item}
                                        index={index}
                                        units={units}
                                        isEmptyRow={isEmptyRow}
                                        formatNumber={formatNumber}
                                        formatInputValue={formatInputValue}
                                        parseInputValue={parseInputValue}
                                        updateBOQItem={updateBOQItem}
                                        addNewBOQItem={addNewBOQItem}
                                        deleteBOQItem={deleteBOQItem}
                                        isFieldReadonly={isFieldReadonly}
                                        handleCostCodeCellDoubleClick={handleCostCodeCellDoubleClick}
                                        setShowDescriptionModal={setShowDescriptionModal}
                                        setSelectedDescription={setSelectedDescription}
                                    />
                                );
                            })}

                            {/* Total Row */}
                            {(() => {
                                if (items.length > 0) {
                                    const total = items.reduce((sum, item) => {
                                        if (!item.unite) return sum;
                                        return sum + ((item.qte || 0) * (item.pu || 0));
                                    }, 0);
                                    return (
                                        <tr className="bg-base-200 border-t-2 border-base-300 font-bold text-base-content">
                                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center" colSpan={6}>TOTAL</td>
                                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center text-lg font-bold text-primary">
                                                {formatNumber(total)}
                                            </td>
                                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3"></td>
                                        </tr>
                                    );
                                }
                                return null;
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

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
                hasExistingBOQData={items.length > 0}
                loading={budgetBOQLoading}
            />
        </div>
    );
};
