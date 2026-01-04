import calculatorIcon from "@iconify/icons-lucide/calculator";
import copyIcon from "@iconify/icons-lucide/copy";
import infoIcon from "@iconify/icons-lucide/info";
import trashIcon from "@iconify/icons-lucide/trash";
import uploadIcon from "@iconify/icons-lucide/upload";
import { Icon } from "@iconify/react";
import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/utils/formatters";

import {
    BuildingsVOs,
    clearVoContractItems,
    copyVoProjectToVoDataSet,
    getContractBOQItems,
    getVosBuildings,
} from "@/api/services/vo-api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

import CostCodeSelectionModal from "../../../components/CostCodeSelectionModal";
import useCostCodeSelection from "../../../hooks/use-cost-code-selection";
import useBOQUnits from "../../../hooks/use-units";
import { useContractVOWizardContext } from "../context/ContractVOWizardContext";
import VOBOQImportModal from "../components/VOBOQImportModal";

interface VOLineItem {
    id?: number;
    no: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costCode?: string;
    costCodeId?: number; // Added CostCodeId
    buildingId?: number;
}

export const VOStep2_LineItems: React.FC = () => {
    const { contractData, formData, setFormData, isUpdate, voDatasetId } = useContractVOWizardContext();

    const { getToken } = useAuth();
    const { toaster } = useToast();
    const { units } = useBOQUnits();
    const [loadingBOQItems, setLoadingBOQItems] = useState(false);
    const [selectedBuildingForItems, setSelectedBuildingForItems] = useState<string>(
        formData.selectedBuildingIds && formData.selectedBuildingIds.length > 0
            ? formData.selectedBuildingIds[0].toString()
            : "",
    );
    const [vos, setVos] = useState<BuildingsVOs[]>([]);
    const [filteredVOs, setFilteredVOs] = useState<BuildingsVOs[]>([]);
    const [selectedVO, setSelectedVO] = useState<string>("");
    const [loadingVOs, setLoadingVOs] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Cost Code Selection Logic
    const [selectedVOLineItemIndex, setSelectedVOLineItemIndex] = useState<number | null>(null);
    const {
        costCodes,
        loading: costCodesLoading,
        selectedCostCode,
        modalOpen: costCodeModalOpen,
        setModalOpen: setCostCodeModalOpen,
        handleCostCodeSelect,
        handleCostCodeDoubleClick,
    } = useCostCodeSelection();

    // Sync selectedBuildingForItems when selectedBuildingIds changes (e.g., edit flow async load)
    useEffect(() => {
        if (formData.selectedBuildingIds.length > 0 && !selectedBuildingForItems) {
            setSelectedBuildingForItems(formData.selectedBuildingIds[0].toString());
        }
    }, [formData.selectedBuildingIds]);

    useEffect(() => {
        if (contractData?.projectId && getToken()) {
            setLoadingVOs(true);
            getVosBuildings(contractData.projectId, getToken() || "")
                .then((response) => {
                    if (response.success && response.data) {
                        setVos(response.data);
                    } else {
                        toaster.error("Failed to load VOs");
                    }
                })
                .catch((error) => {
                    console.error("Error loading VOs:", error);
                    toaster.error("Failed to load VOs");
                })
                .finally(() => {
                    setLoadingVOs(false);
                });
        }
    }, [contractData?.projectId]);

    useEffect(() => {
        if (selectedBuildingForItems) {
            const buildingId = parseInt(selectedBuildingForItems);
            const filtered = vos.filter((vo) => vo.buildingId === buildingId);
            setFilteredVOs(filtered);
            setSelectedVO(""); // Reset selected VO when building changes
        } else {
            setFilteredVOs([]);
        }
    }, [selectedBuildingForItems, vos]);

    const handleVOSelect = async (selectedVoName: string) => {
        setSelectedVO(selectedVoName);
        if (!selectedVoName) return;

        const vo = filteredVOs.find((v) => v.vo === selectedVoName);
        if (!vo) return;

        if (!contractData || !selectedBuildingForItems) {
            toaster.error("Contract data or building not selected.");
            return;
        }

        setLoadingBOQItems(true);
        try {
            const response = await copyVoProjectToVoDataSet(
                parseInt(selectedBuildingForItems),
                vo.voLevel,
                contractData.id,
                getToken() || "",
            );

            if (response && response.contractVoes) {
                handleBOQImport(response.contractVoes);
            } else {
                const itemsResponse = await getContractBOQItems(
                    contractData.id,
                    parseInt(selectedBuildingForItems),
                    getToken() || "",
                );
                if (itemsResponse.success && itemsResponse.data) {
                    handleBOQImport(itemsResponse.data);
                } else {
                    toaster.error("Failed to fetch imported items after VO import.");
                }
            }
        } catch (error) {
            console.error("Error importing from VO:", error);
            toaster.error((error as any).message || "An error occurred while importing from VO.");
        } finally {
            setLoadingBOQItems(false);
        }
    };

    // Open import modal instead of file input
    const handleImportButtonClick = () => {
        setShowImportModal(true);
    };

    const handleClearBOQ = async () => {
        if (!contractData || !getToken()) {
            toaster.error("Contract data or authentication token is not available.");
            return;
        }

        // Check if we're in edit mode (voDatasetId exists)
        if (!voDatasetId) {
            toaster.error("No VO dataset ID available for clearing items.");
            return;
        }

        if (!confirm("Are you sure you want to clear all BOQ items? This action cannot be undone.")) {
            return;
        }

        setLoadingBOQItems(true);
        try {
            const response = await clearVoContractItems(voDatasetId, getToken() || "");

            if (response.success) {
                // Clear the line items from the form
                setFormData({ lineItems: [] });
                toaster.success("Successfully cleared all BOQ items from the VO dataset.");
            } else {
                toaster.error(response.message || "Failed to clear BOQ items.");
            }
        } catch (error) {
            console.error("Error clearing BOQ items:", error);
            toaster.error((error as any).message || "An error occurred while clearing BOQ items.");
        } finally {
            setLoadingBOQItems(false);
        }
    };

    const createEmptyVOItem = (): VOLineItem => ({
        id: 0,
        no: "",
        description: "",
        costCode: "",
        unit: "",
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
    });

    const addNewVOItem = (initialData: Partial<VOLineItem>, fieldName: string) => {
        const buildingId = selectedBuildingForItems
            ? parseInt(selectedBuildingForItems)
            : formData.selectedBuildingIds[0];
        const newItem = { ...createEmptyVOItem(), ...initialData, buildingId };
        const updatedItems = [...formData.lineItems, newItem];
        setFormData({ lineItems: updatedItems });
    };

    // Update item using ORIGINAL index in formData.lineItems array
    const updateVOItem = (originalIndex: number, field: keyof VOLineItem, value: any) => {
        const updatedItems = [...formData.lineItems];
        if (updatedItems[originalIndex]) {
            updatedItems[originalIndex] = { ...updatedItems[originalIndex], [field]: value };
            if (field === "quantity" || field === "unitPrice") {
                updatedItems[originalIndex].totalPrice =
                    (updatedItems[originalIndex].quantity || 0) * (updatedItems[originalIndex].unitPrice || 0);
            }
        }
        setFormData({ lineItems: updatedItems });
    };

    // Delete item using ORIGINAL index in formData.lineItems array
    const deleteVOItem = (originalIndex: number) => {
        const updatedItems = formData.lineItems.filter((_, index) => index !== originalIndex);
        setFormData({ lineItems: updatedItems });
    };

    // Helper to get original index from display index
    const getOriginalIndex = (displayIndex: number): number => {
        if (displayIndex < itemsWithIndices.length) {
            return itemsWithIndices[displayIndex].originalIndex;
        }
        return -1; // New item (empty row)
    };

    const handleBOQImport = (importedItems: any[]) => {
        if (!importedItems || importedItems.length === 0) {
            toaster.error("No items to import");
            return;
        }

        // Get current building ID from dropdown or first selected building
        const targetBuildingId = selectedBuildingForItems
            ? parseInt(selectedBuildingForItems)
            : formData.selectedBuildingIds[0];

        const newVOItems: VOLineItem[] = importedItems.map((item) => ({
            id: 0,
            no: item.no || "",
            description: item.key || item.description || "",
            costCode: item.costCode || "",
            costCodeId: item.costCodeId || undefined,
            unit: item.unite || item.unit || "",
            quantity: item.qte || item.quantity || 1,
            unitPrice: item.pu || item.unitPrice || 0,
            totalPrice: (item.qte || item.quantity || 1) * (item.pu || item.unitPrice || 0),
            // Always assign to the currently selected building
            buildingId: targetBuildingId,
        }));

        // Keep items from other buildings (including assigning any unassigned items to their first building)
        const otherBuildingItems = formData.lineItems
            .filter((item) => item.buildingId !== targetBuildingId)
            .map((item) => {
                // Assign unassigned items to first selected building if it's not the target
                if (!item.buildingId && formData.selectedBuildingIds.length > 1) {
                    const firstOtherBuilding = formData.selectedBuildingIds.find((id) => id !== targetBuildingId);
                    return { ...item, buildingId: firstOtherBuilding || item.buildingId };
                }
                return item;
            })
            .filter((item) => item.buildingId && item.buildingId !== targetBuildingId);
        const updatedItems = [...otherBuildingItems, ...newVOItems];
        setFormData({ lineItems: updatedItems });
        toaster.success(`Successfully imported ${newVOItems.length} items for current building`);
    };

    // Copy current building's items to other selected buildings
    const copyToOtherBuildings = () => {
        if (selectedBuildings.length <= 1) {
            toaster.error("No other buildings to copy to");
            return;
        }

        const currentBuildingItems = allItems.filter(
            (item) => item.buildingId === currentBuildingId
        );

        if (currentBuildingItems.length === 0) {
            toaster.error("No items to copy from current building");
            return;
        }

        // Get other building IDs and their existing item counts
        const otherBuildingIds = formData.selectedBuildingIds.filter(
            (id) => id !== currentBuildingId
        );

        const existingItemsInOtherBuildings = allItems.filter(
            (item) => item.buildingId && otherBuildingIds.includes(item.buildingId)
        );

        // Confirm if other buildings have existing items
        if (existingItemsInOtherBuildings.length > 0) {
            const buildingName = selectedBuildings.find((b) => b.id === currentBuildingId)?.name || "current building";
            const confirmed = confirm(
                `This will REPLACE ${existingItemsInOtherBuildings.length} existing items in ${otherBuildingIds.length} other building(s) with ${currentBuildingItems.length} items from ${buildingName}.\n\nAre you sure you want to continue?`
            );
            if (!confirmed) return;
        }

        // Create copies for each other building
        const copiedItems: VOLineItem[] = [];
        for (const buildingId of otherBuildingIds) {
            for (const item of currentBuildingItems) {
                copiedItems.push({
                    ...item,
                    id: 0, // New item
                    buildingId: buildingId,
                });
            }
        }

        // Keep current building items, remove old items from other buildings, add new copies
        const updatedItems = [...currentBuildingItems, ...copiedItems];
        setFormData({ lineItems: updatedItems });
        toaster.success(`Copied ${currentBuildingItems.length} items to ${otherBuildingIds.length} other building(s)`);
    };

    // Handle cost code selection for a VO line item
    const handleCostCodeSelectForItem = (costCode: any) => {
        console.log("Selected Cost Code:", costCode);
        if (selectedVOLineItemIndex !== null) {
            const updatedItems = [...formData.lineItems];
            if (updatedItems[selectedVOLineItemIndex]) {
                updatedItems[selectedVOLineItemIndex] = {
                    ...updatedItems[selectedVOLineItemIndex],
                    costCode: costCode.code,
                    costCodeId: costCode.id,
                };
                console.log("Item after cost code update:", updatedItems[selectedVOLineItemIndex]);
                setFormData({ lineItems: updatedItems });
            }
            setSelectedVOLineItemIndex(null);
        }
    };

    // Handle double-click on cost code cell
    const handleCostCodeCellDoubleClick = (itemIndex: number, currentCostCode?: string) => {
        setSelectedVOLineItemIndex(itemIndex);
        handleCostCodeDoubleClick(currentCostCode);
    };

    const selectedBuildings = contractData?.buildings.filter((b) => formData.selectedBuildingIds.includes(b.id)) || [];

    // Get current building ID for filtering
    const currentBuildingId = selectedBuildingForItems ? parseInt(selectedBuildingForItems) : formData.selectedBuildingIds[0];

    // Filter items by selected building and track original indices
    // STRICT filtering: only show items that belong to the current building
    // Unassigned items (no buildingId) should be assigned when first loaded or edited
    const allItems = formData.lineItems || [];
    const itemsWithIndices = useMemo(() => {
        return allItems
            .map((item, originalIndex) => ({ item, originalIndex }))
            .filter(({ item }) => {
                // Only show items that explicitly belong to the current building
                return item.buildingId === currentBuildingId;
            });
    }, [allItems, currentBuildingId]);

    // Auto-assign unassigned items to first selected building on initial load
    useEffect(() => {
        const unassignedItems = allItems.filter((item) => !item.buildingId);
        if (unassignedItems.length > 0 && formData.selectedBuildingIds.length > 0) {
            const firstBuildingId = formData.selectedBuildingIds[0];
            const updatedItems = allItems.map((item) => {
                if (!item.buildingId) {
                    return { ...item, buildingId: firstBuildingId };
                }
                return item;
            });
            setFormData({ lineItems: updatedItems });
        }
    }, []);

    const filteredItems = itemsWithIndices.map(({ item }) => item);

    // Create display items with empty row at end
    const displayItems = [...filteredItems];
    if (displayItems.length === 0 || displayItems[displayItems.length - 1].no !== "") {
        displayItems.push(createEmptyVOItem());
    }

    const isAddition = formData.voType === "Addition";

    // Calculate total for current building only
    const currentBuildingTotal = filteredItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);

    // Calculate total for all buildings (for summary)
    const allBuildingsTotal = allItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);

    const netAmount = isAddition ? allBuildingsTotal : -allBuildingsTotal;

    // Update totals only when values actually change to prevent marking form dirty on load
    useEffect(() => {
        const newTotalAdditions = isAddition ? allBuildingsTotal : 0;
        const newTotalDeductions = !isAddition ? allBuildingsTotal : 0;

        // Only update if values have changed
        if (
            formData.totalAdditions !== newTotalAdditions ||
            formData.totalDeductions !== newTotalDeductions ||
            formData.totalAmount !== netAmount
        ) {
            setFormData({
                totalAdditions: newTotalAdditions,
                totalDeductions: newTotalDeductions,
                totalAmount: netAmount,
            });
        }
    }, [isAddition, allBuildingsTotal, netAmount]);

    if (formData.selectedBuildingIds.length === 0) {
        return (
            <div className="py-8 text-center">
                <Icon icon={calculatorIcon} className="text-base-content/40 mx-auto mb-2 h-12 w-12" />
                <p className="text-base-content/60">Please select buildings first</p>
            </div>
        );
    }

    // Get current building name for display
    const currentBuildingName = selectedBuildings.find((b) => b.id === currentBuildingId)?.name || "Building";

    return (
        <div>
            {/* Building context indicator */}
            {selectedBuildings.length > 1 && (
                <div className="alert alert-info mb-4 py-2">
                    <Icon icon={infoIcon} className="h-5 w-5" />
                    <span>
                        Editing items for <strong>{currentBuildingName}</strong>.
                        Each building has its own set of line items. Use the dropdown to switch buildings.
                    </span>
                </div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    {selectedBuildings.length > 1 && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Building:</label>
                            <select
                                className="select select-bordered select-sm w-auto max-w-xs"
                                value={selectedBuildingForItems || ""}
                                onChange={(e) => setSelectedBuildingForItems(e.target.value)}>
                                {selectedBuildings.map((building) => (
                                    <option key={building.id} value={building.id.toString()}>
                                        {building.name} ({allItems.filter((i) => i.buildingId === building.id).length} items)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {vos.length > 0 && (
                        <select
                            className="select select-bordered select-sm w-auto max-w-xs"
                            value={selectedVO}
                            onChange={(e) => handleVOSelect(e.target.value)}
                            disabled={loadingVOs}>
                            <option value="">Select a VO to import from</option>
                            {filteredVOs.map((vo) => (
                                <option key={vo.vo} value={vo.vo}>
                                    {vo.vo}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Copy to other buildings button */}
                    {selectedBuildings.length > 1 && filteredItems.length > 0 && (
                        <button
                            onClick={copyToOtherBuildings}
                            className="btn btn-outline btn-sm transition-all duration-200 ease-in-out"
                            title={`Copy items from ${currentBuildingName} to all other selected buildings`}>
                            <Icon icon={copyIcon} className="h-4 w-4" />
                            Copy to Other Buildings
                        </button>
                    )}
                    {isUpdate && voDatasetId && (
                        <button
                            onClick={handleClearBOQ}
                            className="btn btn-error btn-sm hover:btn-error-focus transition-all duration-200 ease-in-out"
                            disabled={loadingBOQItems}>
                            {loadingBOQItems ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <Icon icon={trashIcon} className="h-4 w-4" />
                            )}
                            Clear BOQ
                        </button>
                    )}
                    <button
                        onClick={handleImportButtonClick}
                        className="btn btn-info btn-sm hover:btn-info-focus transition-all duration-200 ease-in-out">
                        <Icon icon={uploadIcon} className="h-4 w-4" />
                        Import BOQ
                    </button>
                </div>
            </div>
            <div className="bg-base-100 border-base-300 flex flex-col rounded-xl border">
                <div className="overflow-x-auto">
                    <table className="bg-base-100 w-full table-auto">
                        <thead className="bg-base-200">
                            <tr>
                                <th className="text-base-content/70 px-2 py-1 text-center text-xs font-medium tracking-wider uppercase sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-xs">
                                    Item No.
                                </th>
                                <th className="text-base-content/70 px-2 py-1 text-center text-xs font-medium tracking-wider uppercase sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-xs">
                                    Description
                                </th>
                                <th className="text-base-content/70 px-2 py-1 text-center text-xs font-medium tracking-wider uppercase sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-xs">
                                    Cost Code
                                </th>
                                <th className="text-base-content/70 px-2 py-1 text-center text-xs font-medium tracking-wider uppercase sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-xs">
                                    Unit
                                </th>
                                <th className="text-base-content/70 px-2 py-1 text-center text-xs font-medium tracking-wider uppercase sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-xs">
                                    Quantity
                                </th>
                                <th className="text-base-content/70 px-2 py-1 text-center text-xs font-medium tracking-wider uppercase sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-xs">
                                    Unit Price
                                </th>
                                <th className="text-base-content/70 px-2 py-1 text-center text-xs font-medium tracking-wider uppercase sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-xs">
                                    Total Price
                                </th>
                                <th className="text-base-content/70 w-24 px-2 py-1 text-center text-xs font-medium tracking-wider uppercase sm:w-28 sm:px-3 sm:py-2 sm:text-xs lg:px-4 lg:text-xs">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-base-300 divide-y">
                            {displayItems.map((item, displayIndex) => {
                                // Get original index for existing items, -1 for new empty row
                                const originalIndex = getOriginalIndex(displayIndex);
                                const isEmptyRow =
                                    item.no === "" &&
                                    item.description === "" &&
                                    (!item.costCode || item.costCode === "") &&
                                    (!item.unit || item.unit === "") &&
                                    item.quantity === 0 &&
                                    item.unitPrice === 0;
                                const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                                return (
                                    <tr key={item.id || `display-${displayIndex}`} className="bg-base-100 hover:bg-base-200">
                                        <td className="text-base-content px-2 py-1 text-center text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-3">
                                            <input
                                                type="text"
                                                className="focus:ring-primary/20 w-full rounded bg-transparent px-1 py-0.5 text-center text-xs focus:ring-2 focus:outline-none sm:text-sm"
                                                value={item.no}
                                                onChange={(e) => {
                                                    if (isEmptyRow && e.target.value) {
                                                        addNewVOItem({ no: e.target.value }, "no");
                                                    } else if (!isEmptyRow && originalIndex >= 0) {
                                                        updateVOItem(originalIndex, "no", e.target.value);
                                                    }
                                                }}
                                                placeholder="Item No."
                                            />
                                        </td>
                                        <td className="text-base-content px-2 py-1 text-center text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-3">
                                            <input
                                                type="text"
                                                className="focus:ring-primary/20 w-full rounded bg-transparent px-1 py-0.5 text-center text-xs focus:ring-2 focus:outline-none sm:text-sm"
                                                value={item.description}
                                                onChange={(e) => {
                                                    if (isEmptyRow && e.target.value) {
                                                        addNewVOItem({ description: e.target.value }, "description");
                                                    } else if (!isEmptyRow && originalIndex >= 0) {
                                                        updateVOItem(originalIndex, "description", e.target.value);
                                                    }
                                                }}
                                                placeholder="Description"
                                            />
                                        </td>
                                        <td className="text-base-content px-2 py-1 text-center text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-3">
                                            <input
                                                type="text"
                                                value={item.costCode || ""}
                                                onDoubleClick={() => {
                                                    if (originalIndex >= 0) {
                                                        handleCostCodeCellDoubleClick(originalIndex, item.costCode);
                                                    }
                                                }}
                                                placeholder=""
                                                disabled={costCodeModalOpen}
                                                title={"Double-click to select from cost code library"}
                                            />
                                        </td>
                                        <td className="text-base-content px-2 py-1 text-center text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-3">
                                            <select
                                                className="focus:ring-primary/20 w-full rounded border-0 bg-transparent px-1 py-0.5 text-center text-xs focus:ring-2 focus:outline-none sm:text-sm"
                                                value={item.unit || ""}
                                                onChange={(e) => {
                                                    const selectedUnit = units.find(
                                                        (unit) => unit.name === e.target.value,
                                                    );
                                                    const unitName = selectedUnit?.name || e.target.value;
                                                    if (isEmptyRow && unitName) {
                                                        addNewVOItem({ unit: unitName }, "unit");
                                                    } else if (!isEmptyRow && originalIndex >= 0) {
                                                        updateVOItem(originalIndex, "unit", unitName);
                                                    }
                                                }}>
                                                <option value=""></option>
                                                {units.map((unit) => (
                                                    <option key={unit.id} value={unit.name}>
                                                        {unit.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="text-base-content px-2 py-1 text-center text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-3">
                                            <input
                                                type="text"
                                                className={`focus:ring-primary/20 w-full rounded bg-transparent px-1 py-0.5 text-center text-xs focus:ring-2 focus:outline-none sm:text-sm ${!item.unit && !isEmptyRow ? "cursor-not-allowed opacity-50" : ""}`}
                                                value={
                                                    isEmptyRow ? "" : item.quantity ? formatCurrency(item.quantity) : ""
                                                }
                                                onChange={(e) => {
                                                    if (!item.unit && !isEmptyRow) return;
                                                    const cleanValue = e.target.value.replace(/,/g, "");
                                                    const value = parseFloat(cleanValue) || 0;
                                                    if (isEmptyRow && value !== 0) {
                                                        addNewVOItem({ quantity: value }, "quantity");
                                                    } else if (!isEmptyRow && originalIndex >= 0) {
                                                        updateVOItem(originalIndex, "quantity", value);
                                                    }
                                                }}
                                                placeholder=""
                                                disabled={!item.unit && !isEmptyRow}
                                            />
                                        </td>
                                        <td className="text-base-content px-2 py-1 text-center text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-3">
                                            <input
                                                type="text"
                                                className={`focus:ring-primary/20 w-full rounded bg-transparent px-1 py-0.5 text-center text-xs focus:ring-2 focus:outline-none sm:text-sm ${!item.unit && !isEmptyRow ? "cursor-not-allowed opacity-50" : ""}`}
                                                value={
                                                    isEmptyRow ? "" : item.unitPrice ? formatCurrency(item.unitPrice) : ""
                                                }
                                                onChange={(e) => {
                                                    if (!item.unit && !isEmptyRow) return;
                                                    const cleanValue = e.target.value.replace(/,/g, "");
                                                    const value = parseFloat(cleanValue) || 0;
                                                    if (isEmptyRow && value !== 0) {
                                                        addNewVOItem({ unitPrice: value }, "unitPrice");
                                                    } else if (!isEmptyRow && originalIndex >= 0) {
                                                        updateVOItem(originalIndex, "unitPrice", value);
                                                    }
                                                }}
                                                placeholder=""
                                                disabled={!item.unit && !isEmptyRow}
                                            />
                                        </td>
                                        <td
                                            className={`px-2 py-1 text-center text-xs font-medium sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-3 ${isAddition ? "text-success" : "text-error"}`}>
                                            {isEmptyRow || !item.unit ? "-" : formatCurrency(itemTotal)}
                                        </td>
                                        <td className="text-base-content w-24 px-2 py-1 text-center text-xs font-medium sm:w-28 sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-3">
                                            {!isEmptyRow && originalIndex >= 0 && (
                                                <div className="inline-flex">
                                                    <button
                                                        onClick={() => deleteVOItem(originalIndex)}
                                                        className="btn btn-ghost btn-sm text-error/70 hover:bg-error/20"
                                                        title="Delete item">
                                                        <Icon icon={trashIcon} className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredItems.length > 0 && (
                                <tr className="bg-base-200 border-base-300 text-base-content border-t-2 font-bold">
                                    <td
                                        className="px-2 py-2 text-center text-xs sm:px-3 sm:py-3 sm:text-sm lg:px-4"
                                        colSpan={6}>
                                        TOTAL (This Building)
                                    </td>
                                    <td
                                        className={`px-2 py-2 text-center text-xs font-bold sm:px-3 sm:py-3 sm:text-sm lg:px-4 ${isAddition ? "text-primary" : "text-error"}`}>
                                        {formatCurrency(currentBuildingTotal)}
                                    </td>
                                    <td className="px-2 py-2 sm:px-3 sm:py-3 lg:px-4"></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {filteredItems.length === 0 && (
                <div className="mt-4 py-8 text-center">
                    <Icon icon={infoIcon} className="text-base-content/40 mx-auto mb-2 h-8 w-8" />
                    <p className="text-base-content/60 text-sm">
                        Start adding line items by typing in any field in the empty row above.
                    </p>
                    <p className="text-base-content/50 mt-1 text-xs">
                        Items will be automatically marked as additions or deductions based on the VO type.
                    </p>
                </div>
            )}

            {/* Cost Code Selection Modal */}
            <CostCodeSelectionModal
                isOpen={costCodeModalOpen}
                onClose={() => {
                    setCostCodeModalOpen(false);
                    setSelectedVOLineItemIndex(null);
                }}
                onSelect={handleCostCodeSelectForItem}
                selectedCostCode={selectedCostCode}
                costCodes={costCodes}
                loading={costCodesLoading}
            />

            {/* VO BOQ Import Modal */}
            {contractData && (
                <VOBOQImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleBOQImport}
                    contractDataSetId={contractData.id}
                    voNumber={formData.voNumber}
                    tradeName={contractData.tradeName}
                    contractNumber={contractData.contractNumber}
                    projectName={contractData.projectName}
                />
            )}
        </div>
    );
};
