import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useEditWizardContext, BOQItem } from "../context/EditWizardContext";
import useToast from "@/hooks/use-toast";
import useBOQUnits from "../../hooks/use-units";
import DescriptionModal from "../../components/DescriptionModal";

export const EditStep5_BOQItems: React.FC = () => {
    const { formData, setFormData, buildings } = useEditWizardContext();
    const { toaster } = useToast();
    const { units } = useBOQUnits();
    
    const [selectedBuildingForBOQ, setSelectedBuildingForBOQ] = useState<string>("");
    
    // Auto-select first building for BOQ when buildings are available (same as backup)
    useEffect(() => {
        if (formData.buildingIds && formData.buildingIds.length > 0 && !selectedBuildingForBOQ) {
            const firstBuildingId = formData.buildingIds[0];
            if (firstBuildingId != null && firstBuildingId !== undefined) {
                setSelectedBuildingForBOQ(firstBuildingId.toString());
            }
        }
    }, [formData.buildingIds, selectedBuildingForBOQ]);
    const [isImportingBOQ, setIsImportingBOQ] = useState(false);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);
    const [selectedDescription, setSelectedDescription] = useState<{itemNo: string, description: string} | null>(null);

    // Number formatting function
    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    };

    // Create empty BOQ item
    const createEmptyBOQItem = (): BOQItem => ({
        id: Date.now() + Math.random(),
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
                sheetName: "default",
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
                <Icon icon="lucide:calculator" className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
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
            {/* Building Selection and Upload Button in same row */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <select 
                    className="select select-bordered w-auto max-w-xs"
                    value={selectedBuildingForBOQ || ''}
                    onChange={(e) => setSelectedBuildingForBOQ(e.target.value)}
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
                
                <button
                    onClick={() => setIsImportingBOQ(true)}
                    className="btn btn-info btn-sm hover:btn-info-focus transition-all duration-200 ease-in-out"
                >
                    <span className="iconify lucide--upload w-4 h-4"></span>
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
                                                                <span className="iconify lucide--trash size-4"></span>
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

            {/* Import BOQ Modal */}
            {isImportingBOQ && (
                <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-base-content">Import BOQ</h3>
                            <button
                                onClick={() => setIsImportingBOQ(false)}
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                <Icon icon="lucide:x" className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-center py-8">
                            <Icon icon="lucide:info" className="w-12 h-12 text-info mx-auto mb-4" />
                            <p className="text-base-content mb-4">
                                BOQ import functionality will be implemented soon.
                            </p>
                            <button
                                onClick={() => {
                                    setIsImportingBOQ(false);
                                    toaster.info("BOQ import functionality will be implemented soon");
                                }}
                                className="btn btn-primary"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
};