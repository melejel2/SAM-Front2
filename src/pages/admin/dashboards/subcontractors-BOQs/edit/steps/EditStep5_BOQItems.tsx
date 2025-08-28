import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import layersIcon from "@iconify/icons-lucide/layers";
import editIcon from "@iconify/icons-lucide/edit-2";
import uploadIcon from "@iconify/icons-lucide/upload";
import trashIcon from "@iconify/icons-lucide/trash";
import calculatorIcon from "@iconify/icons-lucide/calculator";
import xIcon from "@iconify/icons-lucide/x";
import infoIcon from "@iconify/icons-lucide/info";
import { useEditWizardContext, BOQItem } from "../context/EditWizardContext";
import useToast from "@/hooks/use-toast";
import useBOQUnits from "../../hooks/use-units";
import useBuildings, { BuildingSheet } from "@/hooks/use-buildings";
import DescriptionModal from "../../components/DescriptionModal";
import SheetSelectionModal from "../../components/SheetSelectionModal";
import BOQImportModal from "../../shared/components/BOQImportModal";

export const EditStep5_BOQItems: React.FC = () => {
    const { formData, setFormData, buildings } = useEditWizardContext();
    const { toaster } = useToast();
    const { units } = useBOQUnits();
    const { buildingSheets, sheetsLoading, getBuildingSheets } = useBuildings();
    
    const [selectedBuildingForBOQ, setSelectedBuildingForBOQ] = useState<string>("");
    const [selectedSheetForBOQ, setSelectedSheetForBOQ] = useState<string>("");
    
    // Auto-select first building for BOQ when buildings are available
    useEffect(() => {
        if (formData.buildingIds && formData.buildingIds.length > 0 && !selectedBuildingForBOQ) {
            const firstBuildingId = formData.buildingIds[0];
            if (firstBuildingId != null && firstBuildingId !== undefined) {
                setSelectedBuildingForBOQ(firstBuildingId.toString());
            }
        }
    }, [formData.buildingIds, selectedBuildingForBOQ]);

    // Load sheets when building changes
    useEffect(() => {
        if (selectedBuildingForBOQ) {
            const buildingId = parseInt(selectedBuildingForBOQ);
            getBuildingSheets(buildingId);
        }
    }, [selectedBuildingForBOQ]); // Remove getBuildingSheets from deps to prevent infinite loop

    // Initialize sheet from existing BOQ data
    useEffect(() => {
        if (selectedBuildingForBOQ && formData.boqData && !selectedSheetForBOQ) {
            const buildingId = parseInt(selectedBuildingForBOQ);
            const existingBOQ = formData.boqData.find(b => b.buildingId === buildingId);
            if (existingBOQ && existingBOQ.sheetName) {
                setSelectedSheetForBOQ(existingBOQ.sheetName);
            }
        }
    }, [selectedBuildingForBOQ, formData.boqData, selectedSheetForBOQ]);

    // EDIT MODE FIX: Maintain contract's original trade across all buildings
    useEffect(() => {
        if (buildingSheets.length > 0 && !selectedSheetForBOQ && formData.boqData && formData.boqData.length > 0) {
            // Get the contract's consistent trade name from existing BOQ data
            const contractTrade = formData.boqData[0]?.sheetName;
            if (contractTrade) {
                // Only select the trade if it exists in current building's sheets
                const matchingSheet = buildingSheets.find(sheet => sheet.name === contractTrade);
                if (matchingSheet) {
                    setSelectedSheetForBOQ(contractTrade);
                } else {
                    console.warn(`Contract trade "${contractTrade}" not found in building sheets:`, buildingSheets.map(s => s.name));
                }
            }
        }
    }, [buildingSheets, selectedSheetForBOQ, formData.boqData]);

    const [isImportingBOQ, setIsImportingBOQ] = useState(false);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState<{itemNo: string, description: string} | null>(null);
    const [showSheetSelectionModal, setShowSheetSelectionModal] = useState(false);

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

        const buildingId = parseInt(selectedBuildingForBOQ);

        // Convert imported items to BOQItem format
        const newBOQItems: BOQItem[] = importedItems.map((item, index) => ({
            id: 0, // Use 0 for new items (backend expects this)
            no: item.id?.toString() || '',
            key: item.description || '',
            costCode: item.costCodeName || '',
            unite: item.unit || '',
            qte: item.quantity || 0,
            pu: item.unitPrice || 0,
            pt: item.totalPrice || 0
        }));

        // Find or create BOQ data for the current building
        const existingBOQData = formData.boqData || [];
        const buildingBOQIndex = existingBOQData.findIndex(b => b.buildingId === buildingId);
        
        if (buildingBOQIndex !== -1) {
            // Update existing building BOQ data
            const updatedBOQData = [...existingBOQData];
            const existingItems = updatedBOQData[buildingBOQIndex].boqItems || [];
            
            // Filter out empty rows from existing items
            const nonEmptyExistingItems = existingItems.filter(item => 
                !(item.no === '' && item.key === '' && (!item.costCode || item.costCode === '') && 
                  (!item.unite || item.unite === '') && item.qte === 0 && item.pu === 0)
            );
            
            updatedBOQData[buildingBOQIndex] = {
                ...updatedBOQData[buildingBOQIndex],
                boqItems: [...nonEmptyExistingItems, ...newBOQItems]
            };

            setFormData(prev => ({
                ...prev,
                boqData: updatedBOQData
            }));
        } else {
            // Create new BOQ data entry for this building
            const newBOQData = {
                buildingId: buildingId,
                buildingName: buildings.find(b => b.id === buildingId)?.name || '',
                sheetName: selectedSheetForBOQ,
                boqItems: newBOQItems
            };

            setFormData(prev => ({
                ...prev,
                boqData: [...existingBOQData, newBOQData]
            }));
        }

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
        pu: 0,
        totalPrice: 0
    });

    // Get building name by ID
    const getBuildingName = (buildingId: number): string => {
        const building = buildings.find(b => b.id === buildingId);
        return building?.name || building?.buildingName || `Building ${buildingId}`;
    };

    // Handle sheet selection from modal
    const handleSheetSelect = (sheet: BuildingSheet) => {
        const previousSheet = selectedSheetForBOQ;
        setSelectedSheetForBOQ(sheet.name);
        
        // If sheet changed and we have existing BOQ data, clear it
        if (previousSheet && previousSheet !== sheet.name) {
            const buildingId = parseInt(selectedBuildingForBOQ);
            const updatedBOQData = (formData.boqData || []).filter(b => b.buildingId !== buildingId);
            setFormData({ boqData: updatedBOQData });
            
            toaster.success(`Sheet changed to "${sheet.name}". BOQ data has been cleared.`);
        }
    };

    // Check if current building has BOQ data
    const hasExistingBOQData = (): boolean => {
        if (!selectedBuildingForBOQ) return false;
        const buildingId = parseInt(selectedBuildingForBOQ);
        const buildingBOQ = (formData.boqData || []).find(b => b.buildingId === buildingId);
        return Boolean(buildingBOQ && buildingBOQ.items.length > 0);
    };

    // Add new BOQ item
    const addNewBOQItem = (initialData: Partial<BOQItem>, fieldName: string) => {
        const buildingId = parseInt(selectedBuildingForBOQ);
        const newItem = { ...createEmptyBOQItem(), ...initialData };
        
        const updatedBOQData = [...(formData.boqData || [])];
        const buildingIndex = updatedBOQData.findIndex(b => b.buildingId === buildingId);
        
        if (buildingIndex >= 0) {
            updatedBOQData[buildingIndex].items.push(newItem);
        } else {
            updatedBOQData.push({
                buildingId,
                buildingName: getBuildingName(buildingId),
                sheetName: selectedSheetForBOQ || "", // Use selected sheet name
                items: [newItem]
            });
        }
        
        setFormData({ boqData: updatedBOQData });
    };

    // Update BOQ item
    const updateBOQItem = (itemIndex: number, field: keyof BOQItem, value: any) => {
        const buildingId = parseInt(selectedBuildingForBOQ);
        const updatedBOQData = [...(formData.boqData || [])];
        const buildingBOQ = updatedBOQData.find(b => b.buildingId === buildingId);
        
        if (buildingBOQ && buildingBOQ.items[itemIndex]) {
            buildingBOQ.items[itemIndex] = {
                ...buildingBOQ.items[itemIndex],
                [field]: value
            };
            
            // Recalculate total price if quantity or unit price changed
            if (field === 'qte' || field === 'pu') {
                const item = buildingBOQ.items[itemIndex];
                buildingBOQ.items[itemIndex].totalPrice = item.qte * item.pu;
            }
        }
        
        setFormData({ boqData: updatedBOQData });
    };

    // Remove BOQ item
    const deleteBOQItem = (itemIndex: number) => {
        const buildingId = parseInt(selectedBuildingForBOQ);
        const updatedBOQData = [...(formData.boqData || [])];
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
        const buildingBOQ = formData.boqData?.find(b => b.buildingId === buildingId);
        return buildingBOQ?.items || [];
    };

    if (!formData.buildingIds || formData.buildingIds.length === 0) {
        return (
            <div className="text-center py-8">
                <Icon icon={calculatorIcon} className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                <p className="text-base-content/60">Please select buildings first</p>
            </div>
        );
    }

    const buildingBOQ = formData.boqData?.find(b => b.buildingId === parseInt(selectedBuildingForBOQ || "0"));
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
                            // EDIT MODE: Don't reset sheet - trade should be consistent across buildings
                        }}
                    >
                        {(formData.buildingIds || []).map(buildingId => {
                            if (buildingId == null || buildingId === undefined) return null;
                            const building = buildings.find(b => b.id === buildingId);
                            return (
                                <option key={buildingId} value={buildingId.toString()}>
                                    {building?.name || building?.buildingName}
                                </option>
                            );
                        }).filter(Boolean)}
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
                
                <button
                    onClick={() => setIsImportingBOQ(true)}
                    className="btn btn-info btn-sm hover:btn-info-focus transition-all duration-200 ease-in-out"
                >
                    <Icon icon={uploadIcon} className="w-4 h-4" />
                    Import BOQ
                </button>
            </div>

            {selectedBuildingForBOQ && (
                <div>
                    {/* BOQ Items Table - Custom implementation with SAMTable design language */}
                    <div className="bg-base-100 rounded-xl border border-base-300 flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto bg-base-100">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">No.</th>
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
                                                            if (isEmptyRow && e.target.value) {
                                                                addNewBOQItem({ no: e.target.value }, 'no');
                                                            } else if (!isEmptyRow) {
                                                                updateBOQItem(index, 'no', e.target.value);
                                                            }
                                                        }}
                                                        placeholder=""
                                                    />
                                                </td>
                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                    <input
                                                        id={`boq-input-${item.id}-key`}
                                                        type="text"
                                                        className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                        value={item.key}
                                                        onChange={(e) => {
                                                            if (isEmptyRow && e.target.value) {
                                                                addNewBOQItem({ key: e.target.value }, 'key');
                                                            } else if (!isEmptyRow) {
                                                                updateBOQItem(index, 'key', e.target.value);
                                                            }
                                                        }}
                                                        onDoubleClick={() => {
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
                                                        className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                        value={item.costCode || ''}
                                                        onChange={(e) => {
                                                            if (isEmptyRow && e.target.value) {
                                                                addNewBOQItem({ costCode: e.target.value }, 'costCode');
                                                            } else if (!isEmptyRow) {
                                                                updateBOQItem(index, 'costCode', e.target.value);
                                                            }
                                                        }}
                                                        placeholder=""
                                                    />
                                                </td>
                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                    <select
                                                        id={`boq-input-${item.id}-unite`}
                                                        className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5 border-0"
                                                        value={item.unite || ''}
                                                        onChange={(e) => {
                                                            const selectedUnit = (units || []).find(unit => unit.name === e.target.value);
                                                            const unitName = selectedUnit?.name || e.target.value;
                                                            if (isEmptyRow && unitName) {
                                                                addNewBOQItem({ unite: unitName }, 'unite');
                                                            } else if (!isEmptyRow) {
                                                                updateBOQItem(index, 'unite', unitName);
                                                            }
                                                        }}
                                                    >
                                                        <option value=""></option>
                                                        {(units || []).map(unit => (
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
                                                        className={`w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5 ${!item.unite && !isEmptyRow ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        value={item.qte || ''}
                                                        onChange={(e) => {
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
                                                        disabled={!item.unite && !isEmptyRow}
                                                    />
                                                </td>
                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                    {isEmptyRow ? (
                                                        <input
                                                            id={`boq-input-${item.id}-pu`}
                                                            type="number"
                                                            className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                            value={item.pu || ''}
                                                            onChange={(e) => {
                                                                const value = parseFloat(e.target.value) || 0;
                                                                if (value > 0) {
                                                                    addNewBOQItem({ pu: value }, 'pu');
                                                                }
                                                            }}
                                                            placeholder=""
                                                            step="0.01"
                                                        />
                                                    ) : (
                                                        <div className="relative">
                                                            <input
                                                                id={`boq-input-${item.id}-pu`}
                                                                type="number"
                                                                className={`w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5 opacity-0 absolute inset-0 ${!item.unite ? 'cursor-not-allowed' : ''}`}
                                                                value={item.pu || ''}
                                                                onChange={(e) => {
                                                                    const value = parseFloat(e.target.value) || 0;
                                                                    updateBOQItem(index, 'pu', value);
                                                                }}
                                                                step="0.01"
                                                                disabled={!item.unite}
                                                            />
                                                            <div 
                                                                className={`text-center text-xs sm:text-sm ${!item.unite ? 'opacity-50 cursor-not-allowed' : 'cursor-text'}`}
                                                                onClick={() => {
                                                                    if (item.unite) {
                                                                        document.getElementById(`boq-input-${item.id}-pu`)?.focus();
                                                                    }
                                                                }}
                                                            >
                                                                {!item.unite ? '-' : formatNumber(item.pu || 0)}
                                                            </div>
                                                        </div>
                                                    )}
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
                contractDataSetId={formData.contractDataSetId || 0}
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
        </div>
    );
};