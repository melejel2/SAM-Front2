import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import layersIcon from "@iconify/icons-lucide/layers";
import editIcon from "@iconify/icons-lucide/edit-2";
import uploadIcon from "@iconify/icons-lucide/upload";
import trashIcon from "@iconify/icons-lucide/trash";
import calculatorIcon from "@iconify/icons-lucide/calculator";
import xIcon from "@iconify/icons-lucide/x";
import infoIcon from "@iconify/icons-lucide/info";
import { useWizardContext, BOQItem } from "../context/WizardContext";
import useToast from "@/hooks/use-toast";
import useBOQUnits from "../../hooks/use-units";
import useBuildings, { BuildingSheet } from "@/hooks/use-buildings";
import DescriptionModal from "../../components/DescriptionModal";
import SheetSelectionModal from "../../components/SheetSelectionModal";
import BOQImportModal from "../../shared/components/BOQImportModal";
import CostCodeSelectionModal from "../../components/CostCodeSelectionModal";
import useCostCodeSelection from "../../hooks/use-cost-code-selection";
import BudgetBOQSelectionModal from "../../components/BudgetBOQSelectionModal";
import { useContractsApi } from "../../hooks/use-contracts-api";

export const Step6_BOQItems: React.FC = () => {
    const { formData, setFormData, buildings } = useWizardContext();
    const { toaster } = useToast();
    const { units } = useBOQUnits();
    const { buildingSheets, sheetsLoading, getBuildingSheets } = useBuildings();
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
    
    const [selectedBuildingForBOQ, setSelectedBuildingForBOQ] = useState<string>(
        formData.buildingIds && formData.buildingIds.length > 0 ? formData.buildingIds[0].toString() : ""
    );
    const [selectedSheetForBOQ, setSelectedSheetForBOQ] = useState<string>("");
    const [isImportingBOQ, setIsImportingBOQ] = useState(false);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState<{itemNo: string, description: string} | null>(null);
    const [showSheetSelectionModal, setShowSheetSelectionModal] = useState(false);
    const [selectedBOQItemIndex, setSelectedBOQItemIndex] = useState<number | null>(null);
    const [showBudgetBOQModal, setShowBudgetBOQModal] = useState(false);
    const [budgetBOQLoaded, setBudgetBOQLoaded] = useState(false);

    // Load sheets when building changes
    useEffect(() => {
        if (selectedBuildingForBOQ) {
            const buildingId = parseInt(selectedBuildingForBOQ);
            getBuildingSheets(buildingId);
        }
    }, [selectedBuildingForBOQ]); // Remove getBuildingSheets from deps to prevent infinite loop

    // Auto-select first sheet when sheets are loaded
    useEffect(() => {
        if (buildingSheets.length > 0 && !selectedSheetForBOQ) {
            setSelectedSheetForBOQ(buildingSheets[0].name);
        }
    }, [buildingSheets, selectedSheetForBOQ]);

    // Handle imported BOQ items
    const handleBOQImport = (importedItems: any[]) => {
        if (!importedItems || importedItems.length === 0) {
            toaster.error("No items to import");
            return;
        }

        if (!selectedBuildingForBOQ) {
            toaster.error("Please select a building first");
            return;
        }

        // Check if Budget BOQ is loaded and prevent import
        if (budgetBOQLoaded) {
            toaster.error("Cannot import BOQ items when Budget BOQ is loaded. Budget BOQ structure must be preserved.");
            return;
        }

        const buildingId = parseInt(selectedBuildingForBOQ);

        // Convert imported items to BOQItem format
        const newBOQItems: BOQItem[] = importedItems.map((item, index) => ({
            id: Date.now() + index, // Generate unique IDs
            no: item.no || (index + 1).toString(),
            key: item.description || '',
            costCode: item.costCodeName || '',
            unite: item.unit || '',
            qte: item.quantity || 0,
            pu: item.unitPrice || 0,
            pt: item.totalPrice || 0
        }));

        // Update the BOQ data structure
        const updatedBOQData = [...formData.boqData];
        const buildingIndex = updatedBOQData.findIndex(b => b.buildingId === buildingId);
        
        if (buildingIndex >= 0) {
            // Building BOQ data exists, add to existing items
            const existingItems = updatedBOQData[buildingIndex].items || [];
            
            // Filter out empty rows from existing items
            const nonEmptyExistingItems = existingItems.filter(item => 
                !(item.no === '' && item.key === '' && (!item.costCode || item.costCode === '') && 
                  (!item.unite || item.unite === '') && item.qte === 0 && item.pu === 0)
            );
            
            updatedBOQData[buildingIndex] = {
                ...updatedBOQData[buildingIndex],
                items: [...nonEmptyExistingItems, ...newBOQItems]
            };
        } else {
            // Create new BOQ data for this building
            const buildingName = buildings.find(b => b.id === buildingId)?.name || '';
            updatedBOQData.push({
                buildingId: buildingId,
                buildingName: buildingName,
                sheetName: selectedSheetForBOQ,
                items: newBOQItems
            });
        }

        setFormData({ boqData: updatedBOQData });
        setIsImportingBOQ(false);
        toaster.success(`Successfully imported ${newBOQItems.length} BOQ items`);
    };

    // Number formatting function
    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    };

    // Create empty BOQ item
    const createEmptyBOQItem = (): BOQItem => ({
        id: 0, // Use 0 for new items (backend expects this for new records)
        no: "",
        key: "",
        costCode: "",
        unite: "",
        qte: 0,
        pu: 0
    });

    // Get building name by ID
    const getBuildingName = (buildingId: number): string => {
        const building = buildings.find(b => b.id === buildingId);
        return building?.name || `Building ${buildingId}`;
    };

    // Handle sheet selection from modal
    const handleSheetSelect = (sheet: BuildingSheet) => {
        const previousSheet = selectedSheetForBOQ;
        setSelectedSheetForBOQ(sheet.name);
        
        // If sheet changed and we have existing BOQ data, clear it
        if (previousSheet && previousSheet !== sheet.name) {
            const buildingId = parseInt(selectedBuildingForBOQ);
            const updatedBOQData = formData.boqData.filter(b => b.buildingId !== buildingId);
            setFormData({ boqData: updatedBOQData });
            
            toaster.success(`Sheet changed to "${sheet.name}". BOQ data has been cleared.`);
        }
    };

    // Check if current building has BOQ data
    const hasExistingBOQData = (): boolean => {
        if (!selectedBuildingForBOQ) return false;
        const buildingId = parseInt(selectedBuildingForBOQ);
        const buildingBOQ = formData.boqData.find(b => b.buildingId === buildingId);
        return Boolean(buildingBOQ && buildingBOQ.items.length > 0);
    };

    // Add new BOQ item
    const addNewBOQItem = (initialData: Partial<BOQItem>, fieldName: string) => {
        const buildingId = parseInt(selectedBuildingForBOQ);
        const newItem = { ...createEmptyBOQItem(), ...initialData };
        
        const updatedBOQData = [...formData.boqData];
        const buildingIndex = updatedBOQData.findIndex(b => b.buildingId === buildingId);
        
        if (buildingIndex >= 0) {
            updatedBOQData[buildingIndex].items.push(newItem as BOQItem);
        } else {
            updatedBOQData.push({
                buildingId,
                buildingName: getBuildingName(buildingId),
                sheetName: selectedSheetForBOQ || "", // Use selected sheet name
                items: [newItem as BOQItem]
            });
        }
        
        setFormData({ boqData: updatedBOQData });
    };

    // Update BOQ item
    const updateBOQItem = (itemIndex: number, field: keyof BOQItem, value: any) => {
        const buildingId = parseInt(selectedBuildingForBOQ);
        const updatedBOQData = [...formData.boqData];
        const buildingBOQ = updatedBOQData.find(b => b.buildingId === buildingId);
        
        if (buildingBOQ && buildingBOQ.items[itemIndex]) {
            buildingBOQ.items[itemIndex] = {
                ...buildingBOQ.items[itemIndex],
                [field]: value
            };
        }
        
        setFormData({ boqData: updatedBOQData });
    };

    // Remove BOQ item
    const deleteBOQItem = (itemIndex: number) => {
        const buildingId = parseInt(selectedBuildingForBOQ);
        const updatedBOQData = [...formData.boqData];
        const buildingBOQ = updatedBOQData.find(b => b.buildingId === buildingId);
        
        if (buildingBOQ) {
            buildingBOQ.items.splice(itemIndex, 1);
            setFormData({ boqData: updatedBOQData });
        }
    };

    // Get current building BOQ items
    const getCurrentBuildingBOQ = () => {
        if (!selectedBuildingForBOQ) return [];
        const buildingId = parseInt(selectedBuildingForBOQ);
        const buildingBOQ = formData.boqData.find(b => b.buildingId === buildingId);
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
        const isReadonly = item._budgetBOQSource && item._readonly && item._readonly.includes(fieldName);
        // 🔍 DEBUG: Log readonly check results - FOCUS ON RESTRICTED FIELDS
        if (item._budgetBOQSource) {
            if (['no', 'key', 'costCode', 'unite'].includes(fieldName)) {
                console.log(`🚫 RESTRICTED FIELD CHECK - Field: ${fieldName}`);
                console.log(`🚫 _budgetBOQSource: ${item._budgetBOQSource}`);
                console.log(`🚫 _readonly array:`, item._readonly);
                console.log(`🚫 Field in readonly array:`, item._readonly?.includes(fieldName));
                console.log(`🚫 Final readonly result: ${isReadonly}`);
                if (isReadonly) {
                    console.log(`✅ FIELD SHOULD BE BLOCKED: ${fieldName}`);
                } else {
                    console.log(`❌ FIELD NOT BLOCKED - BUG! ${fieldName}`);
                }
            } else if (['qte', 'pu'].includes(fieldName)) {
                console.log(`✅ EDITABLE FIELD: ${fieldName} should be editable (readonly: ${isReadonly})`);
            }
        }
        return isReadonly;
    };

    // Handle field edit with Budget BOQ restrictions
    const handleFieldEdit = (index: number, field: string, value: any, item: any, isEmptyRow: boolean) => {
        // Check if field is readonly
        if (isFieldReadonly(item, field)) {
            toaster.warning(`${field.charAt(0).toUpperCase() + field.slice(1)} cannot be modified when loaded from Budget BOQ`);
            return;
        }

        // Allow editing for empty rows or editable fields
        if (isEmptyRow && value) {
            const newItemData: Partial<BOQItem> = {};
            newItemData[field as keyof BOQItem] = value;
            addNewBOQItem(newItemData, field);
        } else if (!isEmptyRow) {
            updateBOQItem(index, field as keyof BOQItem, value);
        }
    };

    // Handle Budget BOQ loading
    const handleLoadBudgetBOQ = async (sheetName: string, buildingIds: number[]) => {
        console.log("🎯📋 NEW - BUDGET BOQ LOADING STARTED");
        console.log("🎯📋 NEW - Sheet Name:", sheetName);
        console.log("🎯📋 NEW - Building IDs:", buildingIds);
        
        if (!sheetName || buildingIds.length === 0) {
            toaster.error("Please select a sheet and buildings");
            return;
        }

        try {
            const result = await copyBoqItems({
                sheetName: sheetName,
                buildingIds: buildingIds
            });

            console.log("🎯📋 NEW - API RESPONSE:", result);
            console.log("🎯📋 NEW - API Success:", result.success);
            console.log("🎯📋 NEW - API Data:", result.data);

            if (result.success && result.data) {
                // Transform Budget BOQ data to our BOQ format with field restrictions
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
                        // ✅ LOAD quantities and unit prices from Budget BOQ (user can edit these)
                        qte: item.qte || 0,
                        pu: item.pu || 0,
                        totalPrice: item.totalPrice || ((item.qte || 0) * (item.pu || 0)),
                        // Add metadata to track Budget BOQ source
                        _budgetBOQSource: true,
                        _readonly: ['no', 'key', 'costCode', 'unite'] // Only these fields are readonly
                    }))
                }));

                // Update form data with Budget BOQ items - use the correct function signature
                console.log("🎯📋 CALLING setFormData with:", { boqData: transformedBOQData });
                
                setFormData({ boqData: transformedBOQData });

                setBudgetBOQLoaded(true);
                setShowBudgetBOQModal(false);
                
                toaster.success(`Budget BOQ loaded successfully! Loaded ${transformedBOQData.reduce((sum: number, building: any) => sum + building.items.length, 0)} items with quantities/prices from ${transformedBOQData.length} buildings. Structure fields are now read-only.`);
            } else {
                toaster.error("Failed to load Budget BOQ items");
            }
        } catch (error) {
            console.error("Error loading Budget BOQ:", error);
            toaster.error("An error occurred while loading Budget BOQ items");
        }
    };

    if (formData.buildingIds.length === 0) {
        return (
            <div className="text-center py-8">
                <Icon icon={calculatorIcon} className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                <p className="text-base-content/60">Please select buildings first</p>
            </div>
        );
    }

    const buildingBOQ = formData.boqData.find(b => b.buildingId === parseInt(selectedBuildingForBOQ || "0"));
    const items = buildingBOQ?.items || [];
    
    // Always show at least one empty row for new entries
    const displayItems = [...items];
    if (displayItems.length === 0 || displayItems[displayItems.length - 1].no !== '') {
        displayItems.push(createEmptyBOQItem());
    }

    return (
        <div>
            {/* Building Selection, Sheet Selection, and Upload Button */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {/* Building Selection */}
                    <select 
                        className="select select-bordered w-auto max-w-xs"
                        value={selectedBuildingForBOQ || ''}
                        onChange={(e) => {
                            setSelectedBuildingForBOQ(e.target.value);
                            setSelectedSheetForBOQ(""); // Reset sheet when building changes
                        }}
                    >
                        {formData.buildingIds.map(buildingId => {
                            const building = buildings.find(b => b.id === buildingId);
                            return (
                                <option key={buildingId} value={buildingId.toString()}>
                                    {building?.name}
                                </option>
                            );
                        })}
                    </select>

                    {/* Sheet Selection Button */}
                    {selectedBuildingForBOQ && (
                        <button
                            onClick={() => setShowSheetSelectionModal(true)}
                            className={`btn btn-outline btn-sm gap-2 min-w-fit ${
                                selectedSheetForBOQ 
                                    ? 'btn-primary' 
                                    : 'btn-warning border-dashed'
                            }`}
                            disabled={sheetsLoading}
                        >
                            <Icon icon={layersIcon} className="w-4 h-4" />
                            {sheetsLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="loading loading-spinner loading-xs"></div>
                                    Loading...
                                </span>
                            ) : selectedSheetForBOQ ? (
                                <span className="flex items-center gap-2">
                                    {selectedSheetForBOQ}
                                    <Icon icon={editIcon} className="w-3 h-3 opacity-60" />
                                </span>
                            ) : (
                                <span className="text-warning-content font-medium">
                                    Select Sheet (Trade)
                                </span>
                            )}
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowBudgetBOQModal(true)}
                        className="btn btn-success btn-sm hover:btn-success-focus transition-all duration-200 ease-in-out"
                        disabled={!selectedSheetForBOQ || budgetBOQLoading}
                        title="Load items from Budget BOQ with field restrictions"
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
                        disabled={budgetBOQLoaded}
                        title={budgetBOQLoaded ? "Import disabled when Budget BOQ is loaded" : "Import BOQ from Excel file"}
                    >
                        <Icon icon={uploadIcon} className="w-4 h-4" />
                        Import BOQ
                    </button>
                </div>
            </div>

            {selectedBuildingForBOQ && (
                <div>
                    {/* BOQ Items Table - Custom implementation with SAMTable design language */}
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
                                                            console.log(`📝 COST CODE CHANGE ATTEMPT - Value: "${e.target.value}", Item:`, item);
                                                            console.log(`📝 _budgetBOQSource: ${item._budgetBOQSource}, _readonly:`, item._readonly);
                                                            
                                                            if (isFieldReadonly(item, 'costCode')) {
                                                                console.log('🚫 BLOCKING COST CODE CHANGE!');
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                toaster.warning('Cost code cannot be modified for Budget BOQ items');
                                                                return false;
                                                            }
                                                            
                                                            console.log('✅ ALLOWING COST CODE CHANGE (not readonly)');
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
                                                        type="number"
                                                        className={`w-full text-center text-xs sm:text-sm focus:outline-none focus:ring-2 rounded px-1 py-0.5 ${
                                                            (!item.unite && !isEmptyRow) || isFieldReadonly(item, 'qte')
                                                                ? 'bg-base-200/50 text-base-content/60 cursor-not-allowed border border-base-300/50'
                                                                : 'bg-transparent focus:ring-primary/20'
                                                        }`}
                                                        value={item.qte || ''}
                                                        onChange={(e) => {
                                                            if (isFieldReadonly(item, 'qte')) {
                                                                toaster.warning('Quantity cannot be modified for Budget BOQ items with readonly restrictions');
                                                                return;
                                                            }
                                                            if (!item.unite && !isEmptyRow) return; // Prevent editing if no unit
                                                            const value = parseFloat(e.target.value) || 0;
                                                            if (isEmptyRow && value > 0) {
                                                                addNewBOQItem({ qte: value }, 'qte');
                                                            } else if (!isEmptyRow) {
                                                                updateBOQItem(index, 'qte', value);
                                                            }
                                                        }}
                                                        placeholder=""
                                                        step="0.01"
                                                        disabled={(!item.unite && !isEmptyRow) || isFieldReadonly(item, 'qte')}
                                                        readOnly={isFieldReadonly(item, 'qte')}
                                                        title={isFieldReadonly(item, 'qte') ? 'This field is read-only (loaded from Budget BOQ)' : (!item.unite && !isEmptyRow) ? 'Select a unit first' : 'Enter quantity'}
                                                    />
                                                </td>
                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                    <input
                                                        id={`boq-input-${item.id}-pu`}
                                                        type="number"
                                                        className={`w-full text-center text-xs sm:text-sm focus:outline-none focus:ring-2 rounded px-1 py-0.5 ${
                                                            (!item.unite && !isEmptyRow) || isFieldReadonly(item, 'pu')
                                                                ? 'bg-base-200/50 text-base-content/60 cursor-not-allowed border border-base-300/50'
                                                                : 'bg-transparent focus:ring-primary/20'
                                                        }`}
                                                        value={item.pu || ''}
                                                        onChange={(e) => {
                                                            if (isFieldReadonly(item, 'pu')) {
                                                                toaster.warning('Unit price cannot be modified for Budget BOQ items with readonly restrictions');
                                                                return;
                                                            }
                                                            if (!item.unite && !isEmptyRow) return; // Prevent editing if no unit
                                                            const value = parseFloat(e.target.value) || 0;
                                                            if (isEmptyRow && value > 0) {
                                                                addNewBOQItem({ pu: value }, 'pu');
                                                            } else if (!isEmptyRow) {
                                                                updateBOQItem(index, 'pu', value);
                                                            }
                                                        }}
                                                        placeholder=""
                                                        step="0.01"
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
                                    })}
                                    
                                    {/* Total Row */}
                                    {(() => {
                                        if (items.length > 0) {
                                            const total = items.reduce((sum, item) => {
                                                if (!item.unite) return sum; // Skip items without unit
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
                </div>
            )}

            {/* BOQ Import Modal */}
            <BOQImportModal
                isOpen={isImportingBOQ}
                onClose={() => setIsImportingBOQ(false)}
                onSuccess={handleBOQImport}
                contractDataSetId={0} // Will be set when saving the contract
                availableBuildings={buildings.map(building => ({
                    id: building.id,
                    name: building.name,
                    sheets: buildingSheets.map(sheet => ({
                        id: sheet.id,
                        name: sheet.name
                    }))
                }))}
                currentBuildingId={selectedBuildingForBOQ ? parseInt(selectedBuildingForBOQ) : undefined}
                currentSheetName={selectedSheetForBOQ}
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

            {/* Sheet Selection Modal */}
            {showSheetSelectionModal && selectedBuildingForBOQ && (
                <SheetSelectionModal
                    isOpen={showSheetSelectionModal}
                    onClose={() => setShowSheetSelectionModal(false)}
                    onSheetSelect={handleSheetSelect}
                    sheets={buildingSheets}
                    currentSheet={selectedSheetForBOQ}
                    buildingName={getBuildingName(parseInt(selectedBuildingForBOQ))}
                    hasExistingBOQData={hasExistingBOQData()}
                    sheetsLoading={sheetsLoading}
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
                buildingIds={formData.buildingIds || []}
                buildings={buildings}
                selectedSheetName={selectedSheetForBOQ}
                hasExistingBOQData={hasExistingBOQData()}
                loading={budgetBOQLoading}
            />
        </div>
    );
};