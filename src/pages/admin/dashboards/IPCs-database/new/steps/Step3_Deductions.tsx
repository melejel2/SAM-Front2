import React from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import type { Vos } from "@/types/ipc";

export const Step3_Deductions: React.FC = () => {
    const { formData, setFormData, selectedContract } = useIPCWizardContext();
    
    const safeBuildings = formData.buildings || [];
    const safeVOs = (formData.vos || []) as Vos[];

    // Calculate totals
    const totalContractAmount = safeBuildings.reduce((sum, building) => 
        sum + (building.boqsContract || []).reduce((boqSum, boq) => boqSum + (boq.actualAmount || 0), 0), 0
    );

    const totalVoAmount = safeVOs.reduce((voSum, vo) => {
        return voSum + (vo.buildings || []).reduce((buildSum, building) => {
            return buildSum + (building.boqs || []).reduce((boqSum, boq) => {
                return boqSum + (boq.actualAmount || 0);
            }, 0);
        }, 0);
    }, 0);

    const totalIPCAmount = totalContractAmount + totalVoAmount;
    
    const retentionAmount = (totalIPCAmount * formData.retentionPercentage) / 100;
    const advanceDeduction = (totalIPCAmount * formData.advancePaymentPercentage) / 100;
    const netPayableAmount = totalIPCAmount - retentionAmount - advanceDeduction - formData.penalty;
    
    const handleInputChange = (field: string, value: number) => {
        setFormData({ [field]: value });
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    
    const getAmountClass = (amount: number) => {
        if (amount > 0) return 'text-green-600';
        if (amount < 0) return 'text-red-600';
        return 'text-base-content';
    };

    const safeLabors = formData.labors || [];
    const safeMachines = formData.machines || [];
    const safeMaterials = formData.materials || [];
    
    if (!selectedContract) {
        return (
            <div className="text-center py-12">
                <span className="iconify lucide--calculator text-base-content/30 size-16 mb-4"></span>
                <h3 className="text-lg font-semibold text-base-content mb-2">No Contract Selected</h3>
                <p className="text-base-content/70">Please go back and select a contract first</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
                    <span className="iconify lucide--minus-circle text-red-600 dark:text-red-400 size-5"></span>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-base-content">Deductions</h2>
                    <p className="text-sm text-base-content/70">Configure labor, machine, and material deductions for this IPC</p>
                </div>
            </div>
            
            {/* Contract Context */}
            <div className="bg-base-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                    <span className="iconify lucide--info text-blue-600 dark:text-blue-400 size-5"></span>
                    <h3 className="font-semibold text-base-content">Contract: {selectedContract.contractNumber}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
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
                        <span className="text-base-content/60">Period:</span>
                        <div className="font-medium text-base-content">
                            {formData.fromDate && formData.toDate ? 
                                `${new Date(formData.fromDate).toLocaleDateString()} - ${new Date(formData.toDate).toLocaleDateString()}`
                                : 'Not set'
                            }
                        </div>
                    </div>
                    <div>
                        <span className="text-base-content/60">Buildings:</span>
                        <div className="font-medium text-base-content">
                            {safeBuildings.length}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* IPC Amount Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-4">
                    <span className="iconify lucide--trending-up text-blue-600 dark:text-blue-400 size-5"></span>
                    <h3 className="font-semibold text-blue-600 dark:text-blue-400">IPC Work Progress</h3>
                </div>
                
                <div className="space-y-3">
                    {safeBuildings.map(building => {
                        const buildingAmount = (building.boqsContract || []).reduce((sum, boq) => sum + (boq.actualAmount || 0), 0);
                        const itemsWithProgress = (building.boqsContract || []).filter(boq => (boq.actualQte || 0) > 0).length;
                        
                        if (itemsWithProgress === 0) return null;

                        return (
                            <div key={`bld-${building.id}`} className="flex justify-between items-center p-3 bg-blue-100 dark:bg-blue-800/30 rounded">
                                <div>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                        {building.buildingName}
                                    </span>
                                    <div className="text-sm text-blue-600/70 dark:text-blue-400/70">
                                        {itemsWithProgress} of {(building.boqsContract || []).length} items • Sheet: {building.sheetName}
                                    </div>
                                </div>
                                <div className="font-semibold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(buildingAmount)}
                                </div>
                            </div>
                        );
                    })}

                    {safeVOs.map(vo => {
                        const voAmount = (vo.buildings || []).reduce((sum, building) => 
                            sum + (building.boqs || []).reduce((boqSum, boq) => boqSum + (boq.actualAmount || 0), 0), 0
                        );
                        if (voAmount === 0) return null;

                        return (
                            <div key={`vo-${vo.id}`} className="flex justify-between items-center p-3 bg-purple-100 dark:bg-purple-800/30 rounded">
                                <div>
                                    <span className="font-medium text-purple-600 dark:text-purple-400">
                                        {vo.voNumber}
                                    </span>
                                    <div className="text-sm text-purple-600/70 dark:text-purple-400/70">
                                        Variation Order
                                    </div>
                                </div>
                                <div className="font-semibold text-purple-600 dark:text-purple-400">
                                    {formatCurrency(voAmount)}
                                </div>
                            </div>
                        );
                    })}
                    
                    <div className="flex justify-between items-center pt-3 border-t border-blue-300 dark:border-blue-700">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Gross IPC Amount:</span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(totalIPCAmount)}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Deductions Section - Traditional SAM Pattern */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Labor Deductions */}
                <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                            <span className="iconify lucide--users size-4"></span>
                            Labor Deductions
                        </h3>
                        
                        <div className="space-y-3">
                            {/* Labor Items */}
                            {(safeLabors.length > 0) ? (
                                safeLabors.map(labor => (
                                    <div key={labor.id} className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-800/30 rounded">
                                        <div>
                                            <span className="font-medium text-red-600 dark:text-red-400">
                                                {labor.activityDescription || labor.ref}
                                            </span>
                                            <div className="text-sm text-red-600/70 dark:text-red-400/70">
                                                {labor.quantity} {labor.unit} @ {formatCurrency(labor.unitPrice)} = {formatCurrency(labor.amount)}
                                            </div>
                                        </div>
                                        <div className="font-semibold text-red-600 dark:text-red-400">
                                            -{formatCurrency(labor.deduction)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-base-content/60">No labor deductions to display.</div>
                            )}

                            {/* Retention Percentage */}
                            <div className="floating-label-group">
                                <input
                                    type="number"
                                    value={formData.retentionPercentage}
                                    onChange={(e) => handleInputChange('retentionPercentage', parseFloat(e.target.value) || 0)}
                                    className="input input-sm bg-base-100 border-base-300 floating-input w-full"
                                    placeholder=" "
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                                <label className="floating-label">Retention Percentage (%)</label>
                            </div>
                            
                            {/* Calculated Retention Amount */}
                            <div className="bg-red-100 dark:bg-red-800/30 p-3 rounded border">
                                <div className="flex justify-between items-center">
                                    <span className="text-red-600/70 dark:text-red-400/70">Retention Amount:</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                        -{formatCurrency(retentionAmount)}
                                    </span>
                                </div>
                                <div className="text-xs text-red-600/60 dark:text-red-400/60 mt-1">
                                    {formData.retentionPercentage}% of {formatCurrency(totalIPCAmount)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Machine Deductions */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                        <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                            <span className="iconify lucide--truck size-4"></span>
                            Machine Deductions
                        </h3>
                        
                        <div className="space-y-3">
                            {/* Machine Items */}
                            {(safeMachines.length > 0) ? (
                                safeMachines.map(machine => (
                                    <div key={machine.id} className="flex justify-between items-center p-3 bg-orange-100 dark:bg-orange-800/30 rounded">
                                        <div>
                                            <span className="font-medium text-orange-600 dark:text-orange-400">
                                                {machine.machineAcronym || machine.ref}
                                            </span>
                                            <div className="text-sm text-orange-600/70 dark:text-orange-400/70">
                                                {machine.quantity} {machine.unit} @ {formatCurrency(machine.unitPrice)} = {formatCurrency(machine.amount)}
                                            </div>
                                        </div>
                                        <div className="font-semibold text-orange-600 dark:text-orange-400">
                                            -{formatCurrency(machine.deduction)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-base-content/60">No machine deductions to display.</div>
                            )}

                            {/* Advance Payment Percentage */}
                            <div className="floating-label-group">
                                <input
                                    type="number"
                                    value={formData.advancePaymentPercentage}
                                    onChange={(e) => handleInputChange('advancePaymentPercentage', parseFloat(e.target.value) || 0)}
                                    className="input input-sm bg-base-100 border-base-300 floating-input w-full"
                                    placeholder=" "
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                                <label className="floating-label">Advance Payment Recovery (%)</label>
                            </div>
                            
                            {/* Calculated Advance Deduction */}
                            <div className="bg-orange-100 dark:bg-orange-800/30 p-3 rounded border">
                                <div className="flex justify-between items-center">
                                    <span className="text-orange-600/70 dark:text-orange-400/70">Advance Recovery:</span>
                                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                                        -{formatCurrency(advanceDeduction)}
                                    </span>
                                </div>
                                <div className="text-xs text-orange-600/60 dark:text-orange-400/60 mt-1">
                                    {formData.advancePaymentPercentage}% of {formatCurrency(totalIPCAmount)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Column - Material Deductions & Penalties */}
                <div className="space-y-4">
                    {/* Material Deductions (Penalties) */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2">
                            <span className="iconify lucide--package size-4"></span>
                            Material Deductions & Penalties
                        </h3>
                        
                        <div className="space-y-3">
                            {/* Material Items */}
                            {(safeMaterials.length > 0) ? (
                                safeMaterials.map(material => (
                                    <div key={material.id} className="flex justify-between items-center p-3 bg-yellow-100 dark:bg-yellow-800/30 rounded">
                                        <div>
                                            <span className="font-medium text-yellow-600 dark:text-yellow-400">
                                                {material.designation || material.acronym || material.bc}
                                            </span>
                                            <div className="text-sm text-yellow-600/70 dark:text-yellow-400/70">
                                                {material.quantity} {material.unit} @ {formatCurrency(material.saleUnit)} = {formatCurrency(material.totalSale)}
                                            </div>
                                        </div>
                                        <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                                            -{formatCurrency(material.deduction)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-base-content/60">No material deductions to display.</div>
                            )}

                            {/* Current Penalty Amount */}
                            <div className="floating-label-group">
                                <input
                                    type="number"
                                    value={formData.penalty}
                                    onChange={(e) => handleInputChange('penalty', parseFloat(e.target.value) || 0)}
                                    className="input input-sm bg-base-100 border-base-300 floating-input w-full"
                                    placeholder=" "
                                    min="0"
                                    step="0.01"
                                />
                                <label className="floating-label">Current Penalty Amount</label>
                            </div>
                            
                            {/* Previous Penalty */}
                            <div className="floating-label-group">
                                <input
                                    type="number"
                                    value={formData.previousPenalty}
                                    onChange={(e) => handleInputChange('previousPenalty', parseFloat(e.target.value) || 0)}
                                    className="input input-sm bg-base-100 border-base-300 floating-input w-full"
                                    placeholder=" "
                                    min="0"
                                    step="0.01"
                                />
                                <label className="floating-label">Previous Penalty Amount</label>
                            </div>
                            
                            {/* Penalty Summary */}
                            <div className="space-y-2">
                                {formData.penalty > 0 && (
                                    <div className="bg-yellow-100 dark:bg-yellow-800/30 p-3 rounded border">
                                        <div className="flex justify-between items-center">
                                            <span className="text-yellow-600/70 dark:text-yellow-400/70">Penalty Deduction:</span>
                                            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                                                -{formatCurrency(formData.penalty)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {(formData.penalty !== formData.previousPenalty) && (
                                    <div className="bg-yellow-200 dark:bg-yellow-700/30 p-3 rounded border">
                                        <div className="flex justify-between items-center">
                                            <span className="text-yellow-700/70 dark:text-yellow-300/70">Penalty Difference:</span>
                                            <span className={`font-semibold ${getAmountClass(formData.penalty - formData.previousPenalty)}`}>
                                                {formData.penalty - formData.previousPenalty >= 0 ? '+' : ''}
                                                {formatCurrency(formData.penalty - formData.previousPenalty)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Deduction Summary */}
                    <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                        <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2">
                            <span className="iconify lucide--calculator size-4"></span>
                            Deduction Summary
                        </h3>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-base-content/70">Gross IPC Amount:</span>
                                <span className="font-semibold text-green-600">{formatCurrency(totalIPCAmount)}</span>
                            </div>
                            
                            {retentionAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">Less: Retention ({formData.retentionPercentage}%):</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(retentionAmount)}</span>
                                </div>
                            )}
                            
                            {advanceDeduction > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">Less: Advance Recovery ({formData.advancePaymentPercentage}%):</span>
                                    <span className="font-medium text-orange-600">-{formatCurrency(advanceDeduction)}</span>
                                </div>
                            )}
                            
                            {formData.penalty > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-base-content/70">Less: Penalty:</span>
                                    <span className="font-medium text-yellow-600">-{formatCurrency(formData.penalty)}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center pt-2 border-t border-base-300">
                                <span className="font-semibold text-base-content">Net Payable Amount:</span>
                                <span className={`text-lg font-bold ${netPayableAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(netPayableAmount)}
                                </span>
                            </div>
                            
                            <div className="text-xs text-base-content/60 text-center">
                                {netPayableAmount >= 0 
                                    ? `${((netPayableAmount / totalIPCAmount) * 100).toFixed(1)}% of gross amount`
                                    : 'Negative amount - please review deductions'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Net Payable Amount - Prominent Display */}
            <div className={`p-6 rounded-lg border ${
                netPayableAmount >= 0 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                            netPayableAmount >= 0
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                            <span className={`iconify lucide--dollar-sign size-6 ${
                                netPayableAmount >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                            }`}></span>
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold ${
                                netPayableAmount >= 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                Net Payable Amount
                            </h3>
                            <p className={`text-sm ${
                                netPayableAmount >= 0
                                    ? 'text-green-600/70 dark:text-green-400/70'
                                    : 'text-red-600/70 dark:text-red-400/70'
                            }`}>
                                {netPayableAmount >= 0 
                                    ? 'Amount to be paid after all deductions'
                                    : 'Amount is negative - review deductions'
                                }
                            </p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className={`text-3xl font-bold ${
                            netPayableAmount >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                        }`}>
                            {formatCurrency(netPayableAmount)}
                        </div>
                        {totalIPCAmount > 0 && (
                            <div className={`text-sm ${
                                netPayableAmount >= 0
                                    ? 'text-green-600/70 dark:text-green-400/70'
                                    : 'text-red-600/70 dark:text-red-400/70'
                            }`}>
                                {((netPayableAmount / totalIPCAmount) * 100).toFixed(1)}% of gross amount
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Validation Messages */}
            <div className="space-y-2">
                {netPayableAmount < 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                        <span className="iconify lucide--alert-circle size-4"></span>
                        <span className="text-sm">Warning: Net payable amount is negative. Please review deductions.</span>
                    </div>
                )}
                
                {totalIPCAmount === 0 && (
                    <div className="flex items-center gap-2 text-yellow-600">
                        <span className="iconify lucide--alert-triangle size-4"></span>
                        <span className="text-sm">No work progress has been entered. Please go back and update BOQ quantities.</span>
                    </div>
                )}
                
                {formData.retentionPercentage > 20 && (
                    <div className="flex items-center gap-2 text-yellow-600">
                        <span className="iconify lucide--alert-triangle size-4"></span>
                        <span className="text-sm">High retention percentage ({formData.retentionPercentage}%). Please verify this is correct.</span>
                    </div>
                )}
            </div>
        </div>
    );
};