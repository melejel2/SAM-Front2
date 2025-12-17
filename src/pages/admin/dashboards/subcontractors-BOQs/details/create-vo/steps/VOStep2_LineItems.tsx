import calculatorIcon from "@iconify/icons-lucide/calculator";
import infoIcon from "@iconify/icons-lucide/info";
import trashIcon from "@iconify/icons-lucide/trash";
import uploadIcon from "@iconify/icons-lucide/upload";
import { Icon } from "@iconify/react";
import React, { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/utils/formatters";

import {
    BuildingsVOs,
    clearVoContractItems,
    copyVoProjectToVoDataSet,
    getContractBOQItems,
    getVosBuildings,
    uploadContractVo,
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
    const [availableBOQItems, setAvailableBOQItems] = useState<any[]>([]);
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

    useEffect(() => {
        if (formData.selectedBuildingIds.length > 0 && contractData) {
            loadBOQItemsForBuildings();
        }
    }, [formData.selectedBuildingIds, contractData?.id]);

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

    const loadBOQItemsForBuildings = async () => {
        if (!contractData || !getToken()) return;

        setLoadingBOQItems(true);
        try {
            const allBOQItems: any[] = [];
            for (const buildingId of formData.selectedBuildingIds) {
                const response = await getContractBOQItems(contractData.id, buildingId, getToken() || "");
                if (response.success && response.data) {
                    const itemsWithBuilding = response.data.map((item: any) => ({
                        ...item,
                        buildingId,
                        buildingName:
                            contractData.buildings.find((b) => b.id === buildingId)?.name || `Building ${buildingId}`,
                    }));
                    allBOQItems.push(...itemsWithBuilding);
                }
            }
            setAvailableBOQItems(allBOQItems);
        } catch (error) {
            console.error("Error loading BOQ items:", error);
            toaster.error("Failed to load BOQ items");
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

    const updateVOItem = (itemIndex: number, field: keyof VOLineItem, value: any) => {
        console.log(`Updating item ${itemIndex}, field: ${String(field)}, value:`, value);
        const updatedItems = [...formData.lineItems];
        if (updatedItems[itemIndex]) {
            updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };
            if (field === "quantity" || field === "unitPrice") {
                updatedItems[itemIndex].totalPrice =
                    (updatedItems[itemIndex].quantity || 0) * (updatedItems[itemIndex].unitPrice || 0);
            }
            console.log("Item after update in updateVOItem:", updatedItems[itemIndex]);
        }
        setFormData({ lineItems: updatedItems });
    };

    const deleteVOItem = (itemIndex: number) => {
        const updatedItems = formData.lineItems.filter((_, index) => index !== itemIndex);
        setFormData({ lineItems: updatedItems });
    };

    const handleBOQImport = (importedItems: any[]) => {
        if (!importedItems || importedItems.length === 0) {
            toaster.error("No items to import");
            return;
        }
        const newVOItems: VOLineItem[] = importedItems.map((item, index) => ({
            id: 0,
            no: `VO-${formData.lineItems.length + index + 1}`,
            description: item.key || item.description || "",
            costCode: item.costCode || "",
            costCodeId: item.costCodeId || undefined,
            unit: item.unite || item.unit || "",
            quantity: item.qte || item.quantity || 1,
            unitPrice: item.pu || item.unitPrice || 0,
            totalPrice: (item.qte || item.quantity || 1) * (item.pu || item.unitPrice || 0),
            buildingId: item.buildingId,
        }));
        const updatedItems = newVOItems; // Overwrite existing items as requested
        setFormData({ lineItems: updatedItems });
        toaster.success(`Successfully imported ${newVOItems.length} items`);
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

    const items = formData.lineItems || [];
    const displayItems = [...items];
    if (displayItems.length === 0 || displayItems[displayItems.length - 1].no !== "") {
        displayItems.push(createEmptyVOItem());
    }

    const isAddition = formData.voType === "Addition";
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    const netAmount = isAddition ? totalAmount : -totalAmount;

    useEffect(() => {
        setFormData({
            totalAdditions: isAddition ? totalAmount : 0,
            totalDeductions: !isAddition ? totalAmount : 0,
            totalAmount: netAmount,
        });
    }, [isAddition, totalAmount, netAmount, setFormData]);

    if (formData.selectedBuildingIds.length === 0) {
        return (
            <div className="py-8 text-center">
                <Icon icon={calculatorIcon} className="text-base-content/40 mx-auto mb-2 h-12 w-12" />
                <p className="text-base-content/60">Please select buildings first</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {selectedBuildings.length > 1 && (
                        <select
                            className="select select-bordered w-auto max-w-xs"
                            value={selectedBuildingForItems || ""}
                            onChange={(e) => setSelectedBuildingForItems(e.target.value)}>
                            {selectedBuildings.map((building) => (
                                <option key={building.id} value={building.id.toString()}>
                                    {building.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {vos.length > 0 && (
                        <select
                            className="select select-bordered w-auto max-w-xs"
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
                <div className="flex items-center gap-2">
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
                            {displayItems.map((item, index) => {
                                const isEmptyRow =
                                    item.no === "" &&
                                    item.description === "" &&
                                    (!item.costCode || item.costCode === "") &&
                                    (!item.unit || item.unit === "") &&
                                    item.quantity === 0 &&
                                    item.unitPrice === 0;
                                const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                                return (
                                    <tr key={item.id || index} className="bg-base-100 hover:bg-base-200">
                                        <td className="text-base-content px-2 py-1 text-center text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-3">
                                            <input
                                                type="text"
                                                className="focus:ring-primary/20 w-full rounded bg-transparent px-1 py-0.5 text-center text-xs focus:ring-2 focus:outline-none sm:text-sm"
                                                value={item.no}
                                                onChange={(e) => {
                                                    if (isEmptyRow && e.target.value) {
                                                        addNewVOItem({ no: e.target.value }, "no");
                                                    } else if (!isEmptyRow) {
                                                        updateVOItem(index, "no", e.target.value);
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
                                                    } else if (!isEmptyRow) {
                                                        updateVOItem(index, "description", e.target.value);
                                                    }
                                                }}
                                                placeholder="Description"
                                            />
                                        </td>
                                        <td className="text-base-content px-2 py-1 text-center text-xs sm:px-3 sm:py-2 sm:text-sm lg:px-4 lg:py-3">
                                            <input
                                                type="text"
                                                value={item.costCode || ""}
                                                onDoubleClick={() =>
                                                    handleCostCodeCellDoubleClick(index, item.costCode)
                                                }
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
                                                    } else if (!isEmptyRow) {
                                                        updateVOItem(index, "unit", unitName);
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
                                                    } else if (!isEmptyRow) {
                                                        updateVOItem(index, "quantity", value);
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
                                                    } else if (!isEmptyRow) {
                                                        updateVOItem(index, "unitPrice", value);
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
                                            {!isEmptyRow && (
                                                <div className="inline-flex">
                                                    <button
                                                        onClick={() => deleteVOItem(index)}
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
                            {items.length > 0 && (
                                <tr className="bg-base-200 border-base-300 text-base-content border-t-2 font-bold">
                                    <td
                                        className="px-2 py-2 text-center text-xs sm:px-3 sm:py-3 sm:text-sm lg:px-4"
                                        colSpan={6}>
                                        TOTAL
                                    </td>
                                    <td
                                        className={`px-2 py-2 text-center text-xs font-bold sm:px-3 sm:py-3 sm:text-sm lg:px-4 ${isAddition ? "text-primary" : "text-error"}`}>
                                        {formatCurrency(totalAmount)}
                                    </td>
                                    <td className="px-2 py-2 sm:px-3 sm:py-3 lg:px-4"></td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {items.length === 0 && (
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
