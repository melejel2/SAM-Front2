import React, { useState } from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import type { ContractBuildingsVM } from "@/types/ipc";
import { Icon } from "@iconify/react";
import calendarDaysIcon from "@iconify/icons-lucide/calendar-days";
import infoIcon from "@iconify/icons-lucide/info";
import calendarRangeIcon from "@iconify/icons-lucide/calendar-range";
import calendarCheckIcon from "@iconify/icons-lucide/calendar-check";
import buildingIcon from "@iconify/icons-lucide/building";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import alertCircleIcon from "@iconify/icons-lucide/alert-circle";

export const Step2_PeriodBuildingAndBOQ: React.FC = () => {
    const { formData, setFormData, selectedContract } = useIPCWizardContext();
    const [expandedBuildings, setExpandedBuildings] = useState<Set<number>>(new Set());
    
    const handleInputChange = (field: string, value: string | number) => {
        setFormData({ [field]: value });
    };
    
    // Set default period (current month) if not set
    React.useEffect(() => {
        if (!formData.fromDate || !formData.toDate) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            
            setFormData({
                fromDate: firstDay.toISOString().split('T')[0],
                toDate: lastDay.toISOString().split('T')[0]
            });
        }
    }, [formData.fromDate, formData.toDate, setFormData]);
    
    // Building selection logic
    const availableBuildings = selectedContract?.buildings || [];
    const selectedBuildingIds = formData.buildings.map(b => b.id);
    
    const handleBuildingToggle = (building: ContractBuildingsVM) => {
        const isSelected = selectedBuildingIds.includes(building.id);
        
        if (isSelected) {
            // Remove building
            setFormData({
                buildings: formData.buildings.filter(b => b.id !== building.id)
            });
        } else {
            // Add building with initialized BOQ data
            const buildingWithInitializedBOQ = {
                ...building,
                boqs: building.boqs.map(boq => ({
                    ...boq,
                    actualQte: 0,
                    actualAmount: 0,
                    cumulQte: boq.precedQte || 0,
                    cumulAmount: (boq.precedQte || 0) * boq.unitPrice,
                    cumulPercent: boq.qte === 0 ? 0 : ((boq.precedQte || 0) / boq.qte) * 100
                }))
            };
            
            setFormData({
                buildings: [...formData.buildings, buildingWithInitializedBOQ]
            });
        }
    };
    
    // BOQ editing logic with validation
    const handleBOQQuantityChange = (buildingId: number, boqId: number, actualQte: number) => {
        // Find the specific BOQ item to validate against
        const building = availableBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqs.find(b => b.id === boqId);
        
        if (!boqItem) return;
        
        // Calculate maximum allowed quantity
        const precedQte = boqItem.precedQte || 0;
        const maxAllowedQty = Math.max(0, boqItem.qte - precedQte);
        
        // Validate quantity limits
        let validatedQte = actualQte;
        if (actualQte < 0) {
            validatedQte = 0;
        } else if (actualQte > maxAllowedQty) {
            validatedQte = maxAllowedQty;
            // Show warning toast for exceeded quantity
            import("@/hooks/use-toast").then(({ default: useToast }) => {
                const { toaster } = useToast();
                toaster.warning(`Maximum quantity for this item is ${maxAllowedQty.toFixed(2)} ${boqItem.unit || boqItem.unite || ''}`);
            });
        }
        
        setFormData({
            buildings: formData.buildings.map(building => {
                if (building.id === buildingId) {
                    return {
                        ...building,
                        boqs: building.boqs.map(boq => {
                            if (boq.id === boqId) {
                                const actualAmount = validatedQte * boq.unitPrice;
                                const newCumulQte = (boq.precedQte || 0) + validatedQte;
                                const newCumulAmount = newCumulQte * boq.unitPrice;
                                const newCumulPercent = boq.qte === 0 ? 0 : (newCumulQte / boq.qte) * 100;
                                
                                return {
                                    ...boq,
                                    actualQte: validatedQte,
                                    actualAmount,
                                    cumulQte: newCumulQte,
                                    cumulAmount: newCumulAmount,
                                    cumulPercent: newCumulPercent
                                };
                            }
                            return boq;
                        })
                    };
                }
                return building;
            })
        });
    };
    
    const toggleBuildingExpansion = (buildingId: number) => {
        const newExpanded = new Set(expandedBuildings);
        if (newExpanded.has(buildingId)) {
            newExpanded.delete(buildingId);
        } else {
            newExpanded.add(buildingId);
        }
        setExpandedBuildings(newExpanded);
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    
    if (!selectedContract) {
        return (
            <div className="text-center py-12">
                <span className="iconify lucide--building text-base-content/30 size-16 mb-4"></span>
                <h3 className="text-lg font-semibold text-base-content mb-2">No Contract Selected</h3>
                <p className="text-base-content/70">Please go back and select a contract first</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                    <Icon icon={calendarDaysIcon} className="text-purple-600 dark:text-purple-400 size-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-base-content">Work Period, Buildings & BOQ Progress</h2>
                    <p className="text-sm text-base-content/70">Set work period, select buildings and update progress quantities</p>
                </div>
            </div>
            
            {/* Contract Context */}
            <div className="bg-base-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                    <Icon icon={infoIcon} className="text-blue-600 dark:text-blue-400 size-5" />
                    <h3 className="font-semibold text-base-content">Contract: {selectedContract.contractNumber}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-base-content/60">Project:</span>
                        <div className="font-medium text-base-content">
                            {selectedContract.projectName}
                        </div>
                    </div>
                    <div>
                        <span className="text-base-content/60">Subcontractor:</span>
                        <div className="font-medium text-base-content">
                            {selectedContract.subcontractorName}
                        </div>
                    </div>
                    <div>
                        <span className="text-base-content/60">IPC Type:</span>
                        <div className="font-medium text-base-content">
                            {formData.type}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Work Period Section */}
            <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2">
                    <span className="iconify lucide--calendar-range size-4"></span>
                    Work Period Covered
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Period Dates */}
                    <div className="space-y-4">
                        {/* From Date */}
                        <div className="floating-label-group">
                            <input
                                type="date"
                                value={formData.fromDate}
                                onChange={(e) => handleInputChange('fromDate', e.target.value)}
                                className="input input-sm bg-base-100 border-base-300 floating-input w-full"
                                placeholder=" "
                            />
                            <label className="floating-label">Period From *</label>
                        </div>
                        
                        {/* To Date */}
                        <div className="floating-label-group">
                            <input
                                type="date"
                                value={formData.toDate}
                                onChange={(e) => handleInputChange('toDate', e.target.value)}
                                className="input input-sm bg-base-100 border-base-300 floating-input w-full"
                                placeholder=" "
                                min={formData.fromDate}
                            />
                            <label className="floating-label">Period To *</label>
                        </div>
                    </div>
                    
                    {/* Period Summary and Presets */}
                    <div className="space-y-4">
                        {/* Quick Period Presets */}
                        <div>
                            <h4 className="font-medium text-base-content mb-2">Quick Period Presets:</h4>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const now = new Date();
                                        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                                        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                                        setFormData({
                                            fromDate: firstDay.toISOString().split('T')[0],
                                            toDate: lastDay.toISOString().split('T')[0]
                                        });
                                    }}
                                    className="btn btn-xs btn-outline"
                                >
                                    This Month
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const now = new Date();
                                        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                                        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
                                        setFormData({
                                            fromDate: firstDay.toISOString().split('T')[0],
                                            toDate: lastDay.toISOString().split('T')[0]
                                        });
                                    }}
                                    className="btn btn-xs btn-outline"
                                >
                                    Last Month
                                </button>
                            </div>
                        </div>
                        
                        {/* Period Summary */}
                        {formData.fromDate && formData.toDate && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="iconify lucide--calendar-check text-green-600 dark:text-green-400 size-4"></span>
                                    <h4 className="font-medium text-green-600 dark:text-green-400">Work Period Summary</h4>
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400">
                                    <div className="flex justify-between">
                                        <span>Duration:</span>
                                        <span className="font-medium">
                                            {Math.ceil((new Date(formData.toDate).getTime() - new Date(formData.fromDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Building Selection */}
            <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2">
                    <span className="iconify lucide--building size-4"></span>
                    Building Selection
                </h3>
                
                {/* Building Selection Header */}
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-base-content/60">
                        {selectedBuildingIds.length} of {availableBuildings.length} buildings selected
                    </span>
                </div>
                
                {/* Buildings List */}
                <div className="space-y-3">
                    {availableBuildings.map(building => {
                        const isSelected = selectedBuildingIds.includes(building.id);
                        
                        return (
                            <div key={building.id} className="border border-base-300 rounded-lg overflow-hidden">
                                {/* Building Header */}
                                <div 
                                    className={`p-3 cursor-pointer transition-all duration-200 ${
                                        isSelected
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                            : 'bg-base-100 hover:bg-base-200'
                                    }`}
                                    onClick={() => handleBuildingToggle(building)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleBuildingToggle(building)}
                                                className="checkbox checkbox-sm"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <div>
                                                <h4 className="font-semibold text-base-content">
                                                    {building.buildingName}
                                                </h4>
                                                <p className="text-sm text-base-content/60">
                                                    Sheet: {building.sheetName} • {building.boqs.length} BOQ items
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {isSelected && (
                                            <div className="flex items-center gap-2">
                                                <span className="iconify lucide--check-circle text-green-600 size-5"></span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleBuildingExpansion(building.id);
                                                    }}
                                                    className="btn btn-xs btn-outline"
                                                >
                                                    {expandedBuildings.has(building.id) ? 'Hide' : 'Show'} BOQ
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* BOQ Progress Table - Only show if building is selected and expanded */}
                                {isSelected && expandedBuildings.has(building.id) && (
                                    <div className="bg-base-100 border-t border-base-300">
                                        <div className="p-4">
                                            <h5 className="font-medium text-base-content mb-3">BOQ Progress for {building.buildingName}</h5>
                                            
                                            <div className="overflow-x-auto">
                                                <table className="table table-sm w-full">
                                                    <thead>
                                                        <tr className="bg-base-200">
                                                            <th className="text-left">Item Code</th>
                                                            <th className="text-left">Description</th>
                                                            <th className="text-center">Unit</th>
                                                            <th className="text-right">Contract Qty</th>
                                                            <th className="text-right">Previous Qty</th>
                                                            <th className="text-right">This IPC Qty</th>
                                                            <th className="text-right">Unit Price</th>
                                                            <th className="text-right">This IPC Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {building.boqs.map(boq => {
                                                            const selectedBuilding = formData.buildings.find(b => b.id === building.id);
                                                            const selectedBOQ = selectedBuilding?.boqs.find(b => b.id === boq.id);
                                                            const actualQte = selectedBOQ?.actualQte || 0;
                                                            
                                                            return (
                                                                <tr key={boq.id} className="hover:bg-base-200/50">
                                                                    <td className="font-mono text-sm">
                                                                        {boq.itemCode}
                                                                    </td>
                                                                    <td className="text-sm max-w-48">
                                                                        <div className="truncate" title={boq.description}>
                                                                            {boq.description}
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center text-sm">
                                                                        {boq.unit}
                                                                    </td>
                                                                    <td className="text-right text-sm font-medium">
                                                                        {boq.qte.toFixed(2)}
                                                                    </td>
                                                                    <td className="text-right text-sm">
                                                                        {(boq.precedQte || 0).toFixed(2)}
                                                                    </td>
                                                                    <td className="text-right">
                                                                        {(() => {
                                                                            const maxAllowed = Math.max(0, boq.qte - (boq.precedQte || 0));
                                                                            const isInvalid = actualQte > maxAllowed;
                                                                            return (
                                                                                <div className="relative">
                                                                                    <input
                                                                                        type="number"
                                                                                        value={actualQte}
                                                                                        onChange={(e) => handleBOQQuantityChange(
                                                                                            building.id, 
                                                                                            boq.id, 
                                                                                            parseFloat(e.target.value) || 0
                                                                                        )}
                                                                                        className={`input input-xs w-20 text-right bg-base-100 ${
                                                                                            isInvalid ? 'border-error border-2' : 'border-base-300'
                                                                                        }`}
                                                                                        step="0.01"
                                                                                        min="0"
                                                                                        max={maxAllowed}
                                                                                        title={`Maximum available: ${maxAllowed.toFixed(2)} ${boq.unit || boq.unite || ''}`}
                                                                                    />
                                                                                    {isInvalid && (
                                                                                        <div className="absolute -bottom-5 left-0 text-xs text-error whitespace-nowrap">
                                                                                            Max: {maxAllowed.toFixed(2)}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </td>
                                                                    <td className="text-right text-sm font-medium">
                                                                        {formatCurrency(boq.unitPrice)}
                                                                    </td>
                                                                    <td className="text-right text-sm font-semibold text-blue-600">
                                                                        {formatCurrency(actualQte * boq.unitPrice)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="bg-base-200 font-semibold">
                                                            <td colSpan={7} className="text-right">Building Total:</td>
                                                            <td className="text-right text-blue-600">
                                                                {formatCurrency(
                                                                    building.boqs.reduce((sum, boq) => {
                                                                        const selectedBuilding = formData.buildings.find(b => b.id === building.id);
                                                                        const selectedBOQ = selectedBuilding?.boqs.find(b => b.id === boq.id);
                                                                        const actualQte = selectedBOQ?.actualQte || 0;
                                                                        return sum + (actualQte * boq.unitPrice);
                                                                    }, 0)
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* IPC Summary */}
            {formData.buildings.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-3">IPC Progress Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-blue-600/70 dark:text-blue-400/70">Buildings Selected:</span>
                            <div className="font-semibold text-blue-600 dark:text-blue-400">
                                {formData.buildings.length}
                            </div>
                        </div>
                        <div>
                            <span className="text-blue-600/70 dark:text-blue-400/70">Total BOQ Items:</span>
                            <div className="font-semibold text-blue-600 dark:text-blue-400">
                                {formData.buildings.reduce((sum, building) => sum + building.boqs.length, 0)}
                            </div>
                        </div>
                        <div>
                            <span className="text-blue-600/70 dark:text-blue-400/70">Total IPC Amount:</span>
                            <div className="font-semibold text-green-600">
                                {formatCurrency(
                                    formData.buildings.reduce((sum, building) => 
                                        sum + building.boqs.reduce((boqSum, boq) => 
                                            boqSum + (boq.actualAmount || 0), 0), 0)
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Validation Messages */}
            <div className="space-y-2">
                {!formData.fromDate && (
                    <div className="flex items-center gap-2 text-yellow-600">
                        <span className="iconify lucide--alert-triangle size-4"></span>
                        <span className="text-sm">Please select a start date for the work period</span>
                    </div>
                )}
                {!formData.toDate && (
                    <div className="flex items-center gap-2 text-yellow-600">
                        <span className="iconify lucide--alert-triangle size-4"></span>
                        <span className="text-sm">Please select an end date for the work period</span>
                    </div>
                )}
                {formData.fromDate && formData.toDate && new Date(formData.toDate) < new Date(formData.fromDate) && (
                    <div className="flex items-center gap-2 text-red-600">
                        <span className="iconify lucide--alert-circle size-4"></span>
                        <span className="text-sm">End date must be after start date</span>
                    </div>
                )}
                {formData.buildings.length === 0 && (
                    <div className="flex items-center gap-2 text-yellow-600">
                        <span className="iconify lucide--alert-triangle size-4"></span>
                        <span className="text-sm">Please select at least one building for the IPC</span>
                    </div>
                )}
            </div>
        </div>
    );
};