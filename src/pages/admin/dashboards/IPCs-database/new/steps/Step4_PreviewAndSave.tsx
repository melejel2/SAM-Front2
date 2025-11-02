import React from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";

export const Step4_PreviewAndSave: React.FC = () => {
    const { formData, selectedContract, handleSubmit } = useIPCWizardContext();
    
    const safeBuildings = formData.buildings || [];
    // Calculate totals
    const totalIPCAmount = safeBuildings.reduce((sum, building) => 
        sum + (building.boqsContract || []).reduce((boqSum, boq) => boqSum + (boq.actualAmount || 0), 0), 0
    );
    
    const retentionAmount = (totalIPCAmount * formData.retentionPercentage) / 100;
    const advanceDeduction = (totalIPCAmount * formData.advancePaymentPercentage) / 100;
    const netPayableAmount = totalIPCAmount - retentionAmount - advanceDeduction - formData.penalty;
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    if (!selectedContract) {
        return (
            <div className="text-center py-12">
                <span className="iconify lucide--eye text-base-content/30 size-16 mb-4"></span>
                <h3 className="text-lg font-semibold text-base-content mb-2">No Contract Selected</h3>
                <p className="text-base-content/70">Please go back and select a contract first</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                    <span className="iconify lucide--check text-green-600 dark:text-green-400 size-5"></span>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-base-content">Preview & Save IPC</h2>
                    <p className="text-sm text-base-content/70">Review all IPC details before creating the certificate</p>
                </div>
            </div>
            
            {/* IPC Summary Card */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                            <span className="iconify lucide--file-text text-blue-600 dark:text-blue-400 size-6"></span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                Interim Payment Certificate
                            </h3>
                            <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
                                {formData.type} • {formatDate(formData.dateIpc)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(netPayableAmount)}
                        </div>
                        <div className="text-sm text-green-600/70 dark:text-green-400/70">
                            Net Payable Amount
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Contract Information */}
            <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2">
                    <span className="iconify lucide--building size-4"></span>
                    Contract Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-base-content/60">Contract Number:</span>
                        <div className="font-semibold text-base-content">
                            {selectedContract.contractNumber}
                        </div>
                    </div>
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
                        <span className="text-base-content/60">Trade:</span>
                        <div className="font-medium text-base-content">
                            {selectedContract.tradeName}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* IPC Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - IPC Information */}
                <div className="space-y-4">
                    <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                        <h4 className="font-semibold text-base-content mb-3 flex items-center gap-2">
                            <span className="iconify lucide--calendar size-4"></span>
                            IPC Details
                        </h4>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-base-content/60">IPC Type:</span>
                                <span className="font-medium text-base-content">{formData.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/60">IPC Date:</span>
                                <span className="font-medium text-base-content">{formatDate(formData.dateIpc)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/60">Period From:</span>
                                <span className="font-medium text-base-content">{formatDate(formData.fromDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/60">Period To:</span>
                                <span className="font-medium text-base-content">{formatDate(formData.toDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/60">Duration:</span>
                                <span className="font-medium text-base-content">
                                    {Math.ceil((new Date(formData.toDate).getTime() - new Date(formData.fromDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Buildings Summary */}
                    <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                        <h4 className="font-semibold text-base-content mb-3 flex items-center gap-2">
                            <span className="iconify lucide--building-2 size-4"></span>
                            Buildings Summary
                        </h4>
                        
                        <div className="space-y-2">
                            {safeBuildings.map(building => {
                                const buildingAmount = (building.boqsContract || []).reduce((sum, boq) => sum + (boq.actualAmount || 0), 0);
                                const itemsWithProgress = (building.boqsContract || []).filter(boq => (boq.actualQte || 0) > 0).length;
                                
                                return (
                                    <div key={building.id} className="flex justify-between items-center p-2 bg-base-200 rounded">
                                        <div>
                                            <div className="font-medium text-base-content text-sm">
                                                {building.buildingName}
                                            </div>
                                            <div className="text-xs text-base-content/60">
                                                {itemsWithProgress} / {(building.boqsContract || []).length} items
                                            </div>
                                        </div>
                                        <div className="font-semibold text-blue-600 text-sm">
                                            {formatCurrency(buildingAmount)}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            <div className="flex justify-between items-center pt-2 border-t border-base-300">
                                <span className="font-semibold text-base-content text-sm">Total Buildings:</span>
                                <span className="font-semibold text-base-content text-sm">{safeBuildings.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Column - Financial Summary */}
                <div className="space-y-4">
                    <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                        <h4 className="font-semibold text-base-content mb-3 flex items-center gap-2">
                            <span className="iconify lucide--calculator size-4"></span>
                            Financial Summary
                        </h4>
                        
                        <div className="space-y-3">
                            {/* Gross Amount */}
                            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <span className="font-medium text-blue-600 dark:text-blue-400">Gross IPC Amount:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(totalIPCAmount)}
                                </span>
                            </div>
                            
                            {/* Deductions */}
                            {retentionAmount > 0 && (
                                <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                    <span className="text-red-600/70 dark:text-red-400/70 text-sm">
                                        Less: Retention ({formData.retentionPercentage}%)
                                    </span>
                                    <span className="font-medium text-red-600 dark:text-red-400 text-sm">
                                        -{formatCurrency(retentionAmount)}
                                    </span>
                                </div>
                            )}
                            
                            {advanceDeduction > 0 && (
                                <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                                    <span className="text-orange-600/70 dark:text-orange-400/70 text-sm">
                                        Less: Advance Recovery ({formData.advancePaymentPercentage}%)
                                    </span>
                                    <span className="font-medium text-orange-600 dark:text-orange-400 text-sm">
                                        -{formatCurrency(advanceDeduction)}
                                    </span>
                                </div>
                            )}
                            
                            {formData.penalty > 0 && (
                                <div className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                    <span className="text-yellow-600/70 dark:text-yellow-400/70 text-sm">
                                        Less: Penalty
                                    </span>
                                    <span className="font-medium text-yellow-600 dark:text-yellow-400 text-sm">
                                        -{formatCurrency(formData.penalty)}
                                    </span>
                                </div>
                            )}
                            
                            {/* Net Amount */}
                            <div className={`flex justify-between items-center p-3 rounded border-2 ${
                                netPayableAmount >= 0
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                            }`}>
                                <span className={`font-bold ${
                                    netPayableAmount >= 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                }`}>
                                    Net Payable Amount:
                                </span>
                                <span className={`text-lg font-bold ${
                                    netPayableAmount >= 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                }`}>
                                    {formatCurrency(netPayableAmount)}
                                </span>
                            </div>
                            
                            {/* Percentage */}
                            {totalIPCAmount > 0 && (
                                <div className="text-center text-sm text-base-content/60">
                                    {((netPayableAmount / totalIPCAmount) * 100).toFixed(1)}% of gross amount
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Contract Value Comparison */}
                    <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                        <h4 className="font-semibold text-base-content mb-3 flex items-center gap-2">
                            <span className="iconify lucide--trending-up size-4"></span>
                            Progress Against Contract
                        </h4>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-base-content/60">Contract Value:</span>
                                <span className="font-semibold text-base-content">
                                    {formatCurrency(selectedContract.totalAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/60">This IPC Amount:</span>
                                <span className="font-semibold text-blue-600">
                                    {formatCurrency(totalIPCAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/60">Percentage of Contract:</span>
                                <span className="font-semibold text-green-600">
                                    {((totalIPCAmount / selectedContract.totalAmount) * 100).toFixed(2)}%
                                </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div>
                                <div className="flex justify-between text-xs text-base-content/60 mb-1">
                                    <span>Contract Progress</span>
                                    <span>{((totalIPCAmount / selectedContract.totalAmount) * 100).toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-base-300 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min((totalIPCAmount / selectedContract.totalAmount) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* BOQ Items Summary */}
            <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                <h4 className="font-semibold text-base-content mb-4 flex items-center gap-2">
                    <span className="iconify lucide--table size-4"></span>
                    BOQ Items Summary
                </h4>
                
                <div className="space-y-4">
                    {safeBuildings.map(building => {
                        const itemsWithProgress = (building.boqsContract || []).filter(boq => (boq.actualQte || 0) > 0);
                        
                        if (itemsWithProgress.length === 0) return null;
                        
                        return (
                            <div key={building.id} className="border border-base-300 rounded">
                                <div className="bg-base-200 p-3 font-medium text-base-content">
                                    {building.buildingName} - {itemsWithProgress.length} items with progress
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="table table-sm w-full">
                                        <thead>
                                            <tr className="bg-base-200">
                                                <th className="text-left">Item Code</th>
                                                <th className="text-left">Description</th>
                                                <th className="text-center">Unit</th>
                                                <th className="text-right">This IPC Qty</th>
                                                <th className="text-right">Unit Price</th>
                                                <th className="text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsWithProgress.map(boq => (
                                                <tr key={boq.id}>
                                                    <td className="font-mono text-sm">{boq.no}</td>
                                                    <td className="text-sm max-w-48">
                                                        <div className="truncate" title={boq.key}>
                                                            {boq.key}
                                                        </div>
                                                    </td>
                                                    <td className="text-center text-sm">{boq.unite}</td>
                                                    <td className="text-right text-sm font-medium">
                                                        {(boq.actualQte || 0).toFixed(2)}
                                                    </td>
                                                    <td className="text-right text-sm">
                                                        {formatCurrency(boq.unitPrice)}
                                                    </td>
                                                    <td className="text-right text-sm font-semibold text-blue-600">
                                                        {formatCurrency(boq.actualAmount || 0)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-base-200 font-semibold">
                                                <td colSpan={5} className="text-right">Building Total:</td>
                                                <td className="text-right text-blue-600">
                                                    {formatCurrency(
                                                        (building.boqsContract || []).reduce((sum, boq) => sum + (boq.actualAmount || 0), 0)
                                                    )}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {/* Validation Status */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                    <span className="iconify lucide--check-circle text-green-600 dark:text-green-400 size-5"></span>
                    <h4 className="font-semibold text-green-600 dark:text-green-400">Ready to Create IPC</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--check text-green-600 dark:text-green-400 size-4"></span>
                        <span className="text-green-600 dark:text-green-400">Contract Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--check text-green-600 dark:text-green-400 size-4"></span>
                        <span className="text-green-600 dark:text-green-400">IPC Type Configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--check text-green-600 dark:text-green-400 size-4"></span>
                        <span className="text-green-600 dark:text-green-400">Work Period Set</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--check text-green-600 dark:text-green-400 size-4"></span>
                        <span className="text-green-600 dark:text-green-400">Buildings Selected</span>
                    </div>
                </div>
                
                <div className="mt-3 p-3 bg-green-100 dark:bg-green-800/30 rounded">
                    <p className="text-sm text-green-600 dark:text-green-400">
                        All required information has been provided. You can now create the IPC by clicking the "Create IPC" button.
                    </p>
                </div>
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end">
                <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleSubmit}
                >
                    Create IPC
                </button>
            </div>
        </div>
    );
};