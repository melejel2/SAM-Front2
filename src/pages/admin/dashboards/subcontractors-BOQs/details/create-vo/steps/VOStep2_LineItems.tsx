import calculatorIcon from "@iconify/icons-lucide/calculator";
import copyIcon from "@iconify/icons-lucide/copy";
import infoIcon from "@iconify/icons-lucide/info";
import trashIcon from "@iconify/icons-lucide/trash";
import uploadIcon from "@iconify/icons-lucide/upload";
import { Icon } from "@iconify/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";

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

interface DisplayVOLineItem extends VOLineItem {
    _isEmptyRow?: boolean;
    _originalIndex?: number;
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
    // Also reset if the currently selected building is no longer in the list
    useEffect(() => {
        if (formData.selectedBuildingIds.length > 0) {
            const currentSelection = selectedBuildingForItems ? parseInt(selectedBuildingForItems) : null;
            const isCurrentSelectionValid = currentSelection && formData.selectedBuildingIds.includes(currentSelection);

            if (!isCurrentSelectionValid) {
                setSelectedBuildingForItems(formData.selectedBuildingIds[0].toString());
            }
        }
    }, [formData.selectedBuildingIds, selectedBuildingForItems]);

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

    const createEmptyVOItem = (buildingId?: number): DisplayVOLineItem => ({
        id: 0,
        no: "",
        description: "",
        costCode: "",
        unit: "",
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        buildingId,
        _isEmptyRow: true,
        _originalIndex: -1,
    });

    const addNewVOItem = (initialData: Partial<VOLineItem>) => {
        const buildingId = selectedBuildingForItems
            ? parseInt(selectedBuildingForItems)
            : formData.selectedBuildingIds[0];
        const newItem: VOLineItem = {
            id: 0,
            no: "",
            description: "",
            costCode: "",
            unit: "",
            quantity: 0,
            unitPrice: 0,
            totalPrice: 0,
            ...initialData,
            buildingId
        };
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
    const displayItems = useMemo((): DisplayVOLineItem[] => {
        const itemsForBuilding = allItems
            .map((item, originalIndex) => ({
                ...item,
                _isEmptyRow: false,
                _originalIndex: originalIndex
            }))
            .filter((item) => item.buildingId === currentBuildingId);

        return [...itemsForBuilding, createEmptyVOItem(currentBuildingId)];
    }, [allItems, currentBuildingId]);

    // Auto-assign unassigned items to first selected building when items load (including async edit flow)
    useEffect(() => {
        // Skip if no buildings selected
        if (formData.selectedBuildingIds.length === 0) return;

        // Check for unassigned items
        const currentItems = formData.lineItems || [];
        const unassignedItems = currentItems.filter((item) => !item.buildingId);

        // Skip if no unassigned items (prevents infinite loop)
        if (unassignedItems.length === 0) return;

        const firstBuildingId = formData.selectedBuildingIds[0];
        const updatedItems = currentItems.map((item) => {
            if (!item.buildingId) {
                return { ...item, buildingId: firstBuildingId };
            }
            return item;
        });
        setFormData({ lineItems: updatedItems });
    }, [formData.lineItems, formData.selectedBuildingIds, setFormData]);

    const filteredItems = useMemo(() => displayItems.filter((item) => !item._isEmptyRow), [displayItems]);

    const isAddition = formData.voType === "Addition";

    // Calculate total for all buildings (for summary)
    const allBuildingsTotal = allItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);

    const netAmount = isAddition ? allBuildingsTotal : -allBuildingsTotal;

    // Update totals only when values actually change to prevent marking form dirty on load
    useEffect(() => {
        const newTotalAdditions = isAddition ? allBuildingsTotal : 0;
        const newTotalDeductions = !isAddition ? allBuildingsTotal : 0;

        // Only update if values have changed (prevents infinite loop when values match)
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
    }, [isAddition, allBuildingsTotal, netAmount, formData.totalAdditions, formData.totalDeductions, formData.totalAmount, setFormData]);

    const handleCellChange = useCallback((_rowIndex: number, columnKey: string, value: any, row: DisplayVOLineItem) => {
        const fieldKey = columnKey as keyof VOLineItem;
        if (row._isEmptyRow) {
            if (value !== "" && value !== 0) {
                addNewVOItem({ [fieldKey]: value } as Partial<VOLineItem>);
            }
            return;
        }

        if (typeof row._originalIndex !== "number" || row._originalIndex < 0) return;
        updateVOItem(row._originalIndex, fieldKey, value);
    }, [addNewVOItem, updateVOItem]);

    const isCellEditable = useCallback((row: DisplayVOLineItem, column: SpreadsheetColumn<DisplayVOLineItem>) => {
        if (row._isEmptyRow) return true;
        if ((column.key === "quantity" || column.key === "unitPrice") && !row.unit) return false;
        return column.editable !== false;
    }, []);

    const columns = useMemo((): SpreadsheetColumn<DisplayVOLineItem>[] => [
        {
            key: "no",
            label: "Item No.",
            width: 90,
            align: "center",
            editable: true,
            sortable: false,
            filterable: false,
            type: "text",
            render: (value: string, row: DisplayVOLineItem) => (
                <span className={`text-xs ${row._isEmptyRow ? "text-base-content/40" : ""}`}>{value || ""}</span>
            )
        },
        {
            key: "description",
            label: "Description",
            width: 260,
            align: "left",
            editable: true,
            sortable: false,
            filterable: false,
            type: "text",
            render: (value: string) => (
                <div className="truncate text-xs" title={value || ""}>{value || ""}</div>
            )
        },
        {
            key: "costCode",
            label: "Cost Code",
            width: 120,
            align: "center",
            editable: true,
            sortable: false,
            filterable: false,
            type: "text",
            render: (value: string, row: DisplayVOLineItem) => (
                <div
                    className={`flex items-center justify-center gap-1 text-xs ${row._isEmptyRow ? "text-base-content/40" : "cursor-pointer"}`}
                    onDoubleClick={(e) => {
                        if (row._isEmptyRow) return;
                        e.stopPropagation();
                        if (typeof row._originalIndex === "number" && row._originalIndex >= 0) {
                            handleCostCodeCellDoubleClick(row._originalIndex, row.costCode);
                        }
                    }}
                    title={row._isEmptyRow ? "" : "Double-click to select from cost codes"}
                >
                    <span className="truncate">{value || ""}</span>
                </div>
            )
        },
        {
            key: "unit",
            label: "Unit",
            width: 80,
            align: "center",
            editable: true,
            sortable: false,
            filterable: false,
            type: "select",
            options: units.map((unit) => ({ label: unit.name, value: unit.name })),
            render: (value: string, row: DisplayVOLineItem) => (
                <span className={`text-xs ${row._isEmptyRow ? "text-base-content/40" : ""}`}>{value || ""}</span>
            )
        },
        {
            key: "quantity",
            label: "Quantity",
            width: 110,
            align: "right",
            editable: true,
            sortable: false,
            filterable: false,
            type: "number",
            render: (value: number, row: DisplayVOLineItem) => {
                if (row._isEmptyRow) return "";
                return value ? formatCurrency(value) : "";
            }
        },
        {
            key: "unitPrice",
            label: "Unit Price",
            width: 120,
            align: "right",
            editable: true,
            sortable: false,
            filterable: false,
            type: "number",
            render: (value: number, row: DisplayVOLineItem) => {
                if (row._isEmptyRow) return "";
                return value ? formatCurrency(value) : "";
            }
        },
        {
            key: "totalPrice",
            label: "Total Price",
            width: 130,
            align: "right",
            editable: false,
            sortable: false,
            filterable: false,
            render: (_value: number, row: DisplayVOLineItem) => {
                if (row._isEmptyRow || !row.unit) return "-";
                const total = (row.quantity || 0) * (row.unitPrice || 0);
                return (
                    <span className={`text-xs font-semibold ${isAddition ? "text-success" : "text-error"}`}>
                        {formatCurrency(total)}
                    </span>
                );
            }
        }
    ], [units, isAddition, handleCostCodeCellDoubleClick]);

    const actionsRender = useCallback((row: DisplayVOLineItem) => {
        if (row._isEmptyRow || typeof row._originalIndex !== "number" || row._originalIndex < 0) return null;
        return (
            <button
                onClick={() => deleteVOItem(row._originalIndex as number)}
                className="btn btn-ghost btn-sm text-error/70 hover:bg-error/20"
                title="Delete item"
            >
                <Icon icon={trashIcon} className="h-4 w-4" />
            </button>
        );
    }, [deleteVOItem]);

    const summaryRow = useCallback((rows: DisplayVOLineItem[], meta?: { gridTemplateColumns: string }) => {
        const actualRows = rows.filter((row) => !row._isEmptyRow);
        if (actualRows.length === 0) return null;
        const total = actualRows.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
        return (
            <div
                className="spreadsheet-grid-base font-semibold text-xs bg-base-200"
                style={{ gridTemplateColumns: meta?.gridTemplateColumns, minHeight: 36 }}
            >
                {/* Row number */}
                <div className="spreadsheet-row-number flex items-center justify-center border-r border-b border-base-300 bg-base-200">Σ</div>
                {/* Item No. */}
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
                <div className={`flex items-center justify-end px-3 border-r border-b border-base-300 ${isAddition ? "text-success" : "text-error"}`}>
                    {formatCurrency(total)}
                </div>
                {/* Actions */}
                <div className="border-b border-base-300"></div>
            </div>
        );
    }, [isAddition]);

    const toolbarLeft = (
        <div className="flex flex-wrap items-center gap-2">
            {selectedBuildings.length > 1 && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-base-content/60">Building</span>
                    <select
                        className="select select-bordered select-xs w-auto max-w-xs"
                        value={selectedBuildingForItems || ""}
                        onChange={(e) => setSelectedBuildingForItems(e.target.value)}
                    >
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
                    className="select select-bordered select-xs w-auto max-w-xs"
                    value={selectedVO}
                    onChange={(e) => handleVOSelect(e.target.value)}
                    disabled={loadingVOs}
                >
                    <option value="">Select a VO to import from</option>
                    {filteredVOs.map((vo) => (
                        <option key={vo.vo} value={vo.vo}>
                            {vo.vo}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );

    const toolbar = (
        <div className="flex flex-wrap items-center gap-2">
            {selectedBuildings.length > 1 && filteredItems.length > 0 && (
                <button
                    onClick={copyToOtherBuildings}
                    className="btn btn-outline btn-xs"
                    title={`Copy items from ${selectedBuildings.find((b) => b.id === currentBuildingId)?.name || "current building"} to all other selected buildings`}
                >
                    <Icon icon={copyIcon} className="h-3.5 w-3.5" />
                    Copy to Other Buildings
                </button>
            )}
            {isUpdate && voDatasetId && (
                <button
                    onClick={handleClearBOQ}
                    className="btn btn-error btn-xs"
                    disabled={loadingBOQItems}
                >
                    {loadingBOQItems ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <Icon icon={trashIcon} className="h-3.5 w-3.5" />
                    )}
                    Clear BOQ
                </button>
            )}
            <button
                onClick={handleImportButtonClick}
                className="btn btn-info btn-xs"
            >
                <Icon icon={uploadIcon} className="h-3.5 w-3.5" />
                Import BOQ
            </button>
        </div>
    );

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

            <div
                className="bg-base-100 border border-base-300 rounded-xl overflow-hidden flex flex-col relative"
                style={{ height: "calc(100vh - 180px)", minHeight: "520px" }}
            >
                <Spreadsheet<DisplayVOLineItem>
                    data={displayItems}
                    columns={columns}
                    mode="edit"
                    rowHeight={38}
                    toolbarLeft={toolbarLeft}
                    toolbar={toolbar}
                    onCellChange={handleCellChange}
                    isCellEditable={isCellEditable}
                    actionsRender={actionsRender}
                    actionsColumnWidth={60}
                    summaryRow={summaryRow}
                    getRowId={(row, index) =>
                        row._isEmptyRow ? `empty-${index}` : row.id || `row-${row._originalIndex ?? index}`
                    }
                    allowKeyboardNavigation
                    allowColumnResize
                    allowSorting={false}
                    allowFilters={false}
                />
                {filteredItems.length === 0 && (
                    <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
                        <Icon icon={infoIcon} className="text-base-content/40 mx-auto mb-2 h-8 w-8" />
                        <p className="text-base-content/60 text-sm">
                            Start adding line items by typing in any field in the empty row above.
                        </p>
                        <p className="text-base-content/50 mt-1 text-xs">
                            Items will be automatically marked as additions or deductions based on the VO type.
                        </p>
                    </div>
                )}
            </div>

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
