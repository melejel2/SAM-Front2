import React, { useState, useCallback } from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import type { Vos, LaborsVM, MachinesVM, MaterialsVM } from "@/types/ipc";
import { Icon } from "@iconify/react";
import minusCircleIcon from "@iconify/icons-lucide/minus-circle";
import infoIcon from "@iconify/icons-lucide/info";
import usersIcon from "@iconify/icons-lucide/users";
import truckIcon from "@iconify/icons-lucide/truck";
import packageIcon from "@iconify/icons-lucide/package";
import calculatorIcon from "@iconify/icons-lucide/calculator";

type DeductionTab = "labor" | "materials" | "machines";

/**
 * Calculate dynamic deduction values for Labor/Machine items.
 * PreviousDeduction% is dynamically calculated as (PrecedentAmount / Amount) * 100
 * This ensures correct % when unit price or quantity changes.
 */
const calculateLaborMachineDeductions = (item: LaborsVM | MachinesVM) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const amount = quantity * unitPrice; // Total amount (consumed)
    const precedentAmount = item.precedentAmount || 0; // Fixed: what was actually deducted before
    const deduction = item.deduction || item.deductionPercentage || 0; // Cumulative deduction %

    // Dynamic calculation: PreviousDeduction% = (PrecedentAmount / Amount) * 100
    const previousDeductionPercent = amount !== 0 ? (precedentAmount / amount) * 100 : 0;

    // ActualDeduction% = Cumulative% - Previous%
    const actualDeductionPercent = deduction - previousDeductionPercent;

    // Deduction amounts
    const cumulativeDeductionAmount = (deduction * amount) / 100; // Total deducted so far
    const previousDeductionAmount = precedentAmount; // Fixed amount from previous IPCs
    const actualDeductionAmount = (actualDeductionPercent * amount) / 100; // Current IPC deduction

    return {
        amount,
        previousDeductionPercent,
        actualDeductionPercent,
        cumulativeDeductionAmount,
        previousDeductionAmount,
        actualDeductionAmount,
    };
};

/**
 * Calculate dynamic deduction values for Material items.
 * PreviousDeduction% is dynamically calculated as (PrecedentAmount / ConsumedAmount) * 100
 */
const calculateMaterialDeductions = (item: MaterialsVM) => {
    const quantity = item.quantity || 0;
    const saleUnit = item.saleUnit || 0;
    const allocated = item.allocated || 0;
    const stockQte = item.stockQte || 0;
    const transferedQte = item.transferedQte || 0;

    // ConsumedAmount for materials = SaleUnit * (Allocated - StockQte - TransferedQte)
    const consumedAmount = saleUnit * (allocated - stockQte - transferedQte);
    const precedentAmount = item.precedentAmount || 0; // Fixed: what was actually deducted before
    const deduction = item.deduction || item.deductionPercentage || 0; // Cumulative deduction %

    // Dynamic calculation: PreviousDeduction% = (PrecedentAmount / ConsumedAmount) * 100
    const previousDeductionPercent = consumedAmount !== 0 ? (precedentAmount / consumedAmount) * 100 : 0;

    // ActualDeduction% = Cumulative% - Previous%
    const actualDeductionPercent = deduction - previousDeductionPercent;

    // Deduction amounts
    const cumulativeDeductionAmount = (deduction * consumedAmount) / 100;
    const previousDeductionAmount = precedentAmount;
    const actualDeductionAmount = (actualDeductionPercent * consumedAmount) / 100;

    // Total sale for display
    const totalSale = quantity * saleUnit;

    return {
        consumedAmount,
        totalSale,
        previousDeductionPercent,
        actualDeductionPercent,
        cumulativeDeductionAmount,
        previousDeductionAmount,
        actualDeductionAmount,
    };
};

export const Step3_Deductions: React.FC = () => {
    const { formData, setFormData, selectedContract, setHasUnsavedChanges } = useIPCWizardContext();
    const [activeTab, setActiveTab] = useState<DeductionTab>("labor");

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
        if (setHasUnsavedChanges) setHasUnsavedChanges(true);
    };

    const handleItemChange = (
        type: 'labors' | 'materials' | 'machines',
        index: number,
        field: 'quantity' | 'unitPrice' | 'consumedAmount' | 'deductionPercentage' | 'deductionAmount' | 'actualAmount',
        value: string
    ) => {
        const items = [...(formData[type] || [])] as any[];
        if (!items[index]) return;

        const item = { ...items[index] };
        const numericValue = parseFloat(value);
        if (isNaN(numericValue) && value !== '' && value !== '-') return;
        const cleanValue = numericValue || 0;

        // For materials, use 'allocated' instead of 'quantity' for calculations
        let quantity = type === 'materials' ? (item.allocated || 0) : (item.quantity || 0);
        let unitPrice = (type === 'materials' ? item.saleUnit : item.unitPrice) || 0;
        // Use 'deduction' as the primary field (backend field name), fallback to deductionPercentage
        let deductionPercent = item.deduction || item.deductionPercentage || 0;

        // Update one of the base values depending on which field was edited.
        switch (field) {
            case 'quantity':
                if (type === 'materials') {
                    item.allocated = cleanValue;
                    quantity = cleanValue;
                } else {
                    quantity = cleanValue;
                }
                break;
            case 'unitPrice':
                unitPrice = cleanValue;
                break;
            case 'consumedAmount':
                // Back-calculate quantity from consumed amount
                if (type === 'materials') {
                    item.allocated = unitPrice > 0 ? cleanValue / unitPrice : 0;
                    quantity = item.allocated;
                } else {
                    quantity = unitPrice > 0 ? cleanValue / unitPrice : 0;
                }
                break;
            case 'deductionPercentage':
                // Clamp to 0-100 range
                deductionPercent = Math.max(0, Math.min(100, cleanValue));
                break;
            case 'deductionAmount':
                const consumedForDeduct = quantity * unitPrice;
                deductionPercent = consumedForDeduct > 0 ? Math.max(0, Math.min(100, (cleanValue / consumedForDeduct) * 100)) : 0;
                break;
            case 'actualAmount':
                // actualAmount = consumed - deductionAmount, so deductionAmount = consumed - actualAmount
                const consumedForActual = quantity * unitPrice;
                const newDeductionAmt = consumedForActual - cleanValue;
                deductionPercent = consumedForActual > 0 ? Math.max(0, Math.min(100, (newDeductionAmt / consumedForActual) * 100)) : 0;
                break;
        }

        // Update the item object with the final source-of-truth values.
        if (type !== 'materials') {
            item.quantity = quantity;
            item.unitPrice = unitPrice;
        } else {
            item.saleUnit = unitPrice;
        }

        // IMPORTANT: Update both 'deduction' (backend field) and 'deductionPercentage' (frontend field)
        // to ensure consistency between frontend display and backend storage
        item.deduction = deductionPercent;
        item.deductionPercentage = deductionPercent;

        items[index] = item;
        setFormData({ [type]: items });
        if (setHasUnsavedChanges) setHasUnsavedChanges(true);
    };

    const handleTextChange = (
        type: 'labors' | 'materials' | 'machines',
        index: number,
        field: string, // e.g., 'activityDescription', 'designation', 'acronym', 'remark'
        newValue: string
    ) => {
        const items = [...(formData[type] || [])] as any[];
        if (!items[index]) return;

        const item = { ...items[index] };
        item[field] = newValue;

        items[index] = item;
        setFormData({ [type]: items });
        if (setHasUnsavedChanges) setHasUnsavedChanges(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const safeLabors = formData.labors || [];
    const safeMachines = formData.machines || [];
    const safeMaterials = formData.materials || [];

    // Calculate totals using the dynamic calculation functions
    // ActualDeductionAmount = current IPC deduction only (not cumulative)
    const laborTotal = safeLabors.reduce((sum, labor) => {
        const calc = calculateLaborMachineDeductions(labor);
        return sum + calc.actualDeductionAmount;
    }, 0);

    const machineTotal = safeMachines.reduce((sum, machine) => {
        const calc = calculateLaborMachineDeductions(machine);
        return sum + calc.actualDeductionAmount;
    }, 0);

    const materialTotal = safeMaterials.reduce((sum, material) => {
        const calc = calculateMaterialDeductions(material);
        return sum + calc.actualDeductionAmount;
    }, 0);


    const isEditMode = (formData as any).id && (formData as any).id > 0;
    if (!selectedContract && !isEditMode) {
        return (
            <div className="text-center py-12">
                <span className="iconify lucide--calculator text-base-content/30 size-16 mb-4"></span>
                <h3 className="text-lg font-semibold text-base-content mb-2">No Contract Selected</h3>
                <p className="text-base-content/70">Please go back and select a contract first</p>
            </div>
        );
    }

    const contractInfo = selectedContract || {
        contractNumber: (formData as any).contract || 'N/A',
        projectName: (formData as any).projectName || 'N/A',
        subcontractorName: (formData as any).subcontractorName || 'N/A',
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
                    <Icon icon={minusCircleIcon} className="text-red-600 dark:text-red-400 size-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-base-content">Deductions & Financial Adjustments</h2>
                    <p className="text-sm text-base-content/70">Configure deductions, retention, advance recovery, and penalties</p>
                </div>
            </div>

            <div className="bg-base-200 p-3 rounded-lg border border-base-300">
                <div className="flex items-center gap-2 mb-2">
                    <Icon icon={infoIcon} className="text-blue-600 dark:text-blue-400 size-4" />
                    <h3 className="font-semibold text-base-content text-sm">Contract: {contractInfo.contractNumber}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-base-content/60">Project:</span><div className="font-medium text-base-content">{contractInfo.projectName}</div></div>
                    <div><span className="text-base-content/60">Subcontractor:</span><div className="font-medium text-base-content">{contractInfo.subcontractorName}</div></div>
                    <div><span className="text-base-content/60">Period:</span><div className="font-medium text-base-content">{formData.fromDate && formData.toDate ? `${new Date(formData.fromDate).toLocaleDateString()} - ${new Date(formData.toDate).toLocaleDateString()}` : 'Not set'}</div></div>
                    <div><span className="text-base-content/60">Gross IPC Amount:</span><div className="font-semibold text-green-600">{formatCurrency(totalIPCAmount)}</div></div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button type="button" onClick={() => setActiveTab("labor")} className={`btn btn-sm ${activeTab === "labor" ? "bg-red-600 text-white hover:bg-red-700" : "bg-base-200 text-base-content hover:bg-base-300 border-base-300"}`}><Icon icon={usersIcon} className="size-4" />Labor Deductions</button>
                <button type="button" onClick={() => setActiveTab("materials")} className={`btn btn-sm ${activeTab === "materials" ? "bg-yellow-600 text-white hover:bg-yellow-700" : "bg-base-200 text-base-content hover:bg-base-300 border-base-300"}`}><Icon icon={packageIcon} className="size-4" />Material Deductions</button>
                <button type="button" onClick={() => setActiveTab("machines")} className={`btn btn-sm ${activeTab === "machines" ? "bg-orange-600 text-white hover:bg-orange-700" : "bg-base-200 text-base-content hover:bg-base-300 border-base-300"}`}><Icon icon={truckIcon} className="size-4" />Machine Deductions</button>
            </div>

            {activeTab === "labor" && (
                <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 border-b border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Icon icon={usersIcon} className="text-red-600 dark:text-red-400 size-5" /><h3 className="font-semibold text-red-600 dark:text-red-400">Labor Deductions</h3><span className="text-sm text-red-600/70 dark:text-red-400/70">• {safeLabors.length} items</span></div>
                            <div className="text-sm font-semibold text-red-600 dark:text-red-400">Total Deductions: {formatCurrency(laborTotal)}</div>
                        </div>
                    </div>
                    {safeLabors.length > 0 ? (
                        <div className="overflow-x-auto"><table className="table table-xs w-full">
                            <thead className="bg-base-200 sticky top-0">
                                <tr>
                                    <th className="text-left w-20">Ref No</th><th className="text-left min-w-[150px]">Worker Type</th><th className="text-left min-w-[200px]">Activity Description</th><th className="text-center w-16">Unit</th><th className="text-right w-24">Unit Price</th><th className="text-right w-24">Quantity</th><th className="text-right w-28">Consumed Amount</th><th className="text-right w-20">Deduct %</th><th className="text-right w-28">Deduction Amount</th><th className="text-right w-28">Previous Amount</th><th className="text-right w-28">Actual Amount</th><th className="text-right w-28">Cumul Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeLabors.map((labor, index) => {
                                    // Use dynamic calculation function
                                    const calc = calculateLaborMachineDeductions(labor);
                                    const deductionPercent = labor.deduction || labor.deductionPercentage || 0;

                                    return (
                                        <tr key={labor.id || index} className="hover:bg-base-200/50">
                                            <td className="font-mono text-xs">{labor.ref || '-'}</td>
                                            <td className="text-xs">{labor.workerType || labor.laborType || '-'}</td>
                                            <td className="w-[200px] p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full"
                                                    value={labor.activityDescription || ''}
                                                    onChange={(e) => handleTextChange('labors', index, 'activityDescription', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>
                                            <td className="text-center text-xs">{labor.unit || '-'}</td>
                                            <td className="w-24 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={(labor.unitPrice || 0).toFixed(2)} onChange={(e) => handleItemChange('labors', index, 'unitPrice', e.target.value)} step="0.01" onFocus={(e) => e.target.select()} /></td>
                                            <td className="w-24 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={(labor.quantity || 0).toFixed(2)} onChange={(e) => handleItemChange('labors', index, 'quantity', e.target.value)} step="0.01" onFocus={(e) => e.target.select()} /></td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.amount)}</td>
                                            <td className="w-20 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={deductionPercent.toFixed(1)} onChange={(e) => handleItemChange('labors', index, 'deductionPercentage', e.target.value)} step="0.1" min="0" max="100" onFocus={(e) => e.target.select()} /></td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                            <td className="text-right text-xs text-blue-600 dark:text-blue-400" title={`Previous: ${calc.previousDeductionPercent.toFixed(1)}%`}>{formatCurrency(calc.previousDeductionAmount)}</td>
                                            <td className="text-right text-xs font-medium text-green-600 dark:text-green-400" title={`Actual: ${calc.actualDeductionPercent.toFixed(1)}%`}>{formatCurrency(calc.actualDeductionAmount)}</td>
                                            <td className="text-right text-xs font-semibold bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table></div>
                    ) : (
                        <div className="p-8 text-center text-base-content/60"><Icon icon={usersIcon} className="size-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No labor deductions found for this contract.</p></div>
                    )}
                </div>
            )}

            {activeTab === "materials" && (
                <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 border-b border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Icon icon={packageIcon} className="text-yellow-600 dark:text-yellow-400 size-5" /><h3 className="font-semibold text-yellow-600 dark:text-yellow-400">Material Deductions</h3><span className="text-sm text-yellow-600/70 dark:text-yellow-400/70">• {safeMaterials.length} items</span></div>
                            <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Total Deductions: {formatCurrency(materialTotal)}</div>
                        </div>
                    </div>
                    {safeMaterials.length > 0 ? (
                        <div className="overflow-x-auto"><table className="table table-xs w-full">
                            <thead className="bg-base-200 sticky top-0">
                                <tr>
                                    <th className="text-left w-20">BC/PO</th><th className="text-left min-w-[200px]">Designation</th><th className="text-left w-28">Acronym</th><th className="text-center w-16">Unit</th><th className="text-right w-24">Sale Unit</th><th className="text-right w-24">Quantity</th><th className="text-right w-28">Total Sale</th><th className="text-right w-20">Deduct %</th><th className="text-right w-28">Deduction Amount</th><th className="text-right w-28">Previous Amount</th><th className="text-right w-28">Actual Amount</th><th className="text-right w-28">Cumul Amount</th><th className="text-left min-w-[150px]">Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeMaterials.map((material, index) => {
                                    // Use dynamic calculation function
                                    const calc = calculateMaterialDeductions(material);
                                    const deductionPercent = material.deduction || material.deductionPercentage || 0;

                                    return (
                                        <tr key={material.id || index} className="hover:bg-base-200/50">
                                            <td className="font-mono text-xs">{material.bc || '-'}</td>
                                            <td className="w-[200px] p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full"
                                                    value={material.designation || ''}
                                                    onChange={(e) => handleTextChange('materials', index, 'designation', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>
                                            <td className="w-28 p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full"
                                                    value={material.acronym || ''}
                                                    onChange={(e) => handleTextChange('materials', index, 'acronym', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>
                                            <td className="text-center text-xs">{material.unit || '-'}</td>
                                            <td className="w-24 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={(material.saleUnit || 0).toFixed(2)} onChange={(e) => handleItemChange('materials', index, 'unitPrice', e.target.value)} step="0.01" onFocus={(e) => e.target.select()} /></td>
                                            <td className="w-24 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={(material.allocated || 0).toFixed(2)} onChange={(e) => handleItemChange('materials', index, 'quantity', e.target.value)} step="0.01" onFocus={(e) => e.target.select()} /></td>
                                            <td className="text-right text-xs bg-base-200/50" title="Consumed = SaleUnit × (Allocated - Stock - Transferred)">{formatCurrency(calc.consumedAmount)}</td>
                                            <td className="w-20 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={deductionPercent.toFixed(1)} onChange={(e) => handleItemChange('materials', index, 'deductionPercentage', e.target.value)} step="0.1" min="0" max="100" onFocus={(e) => e.target.select()} /></td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                            <td className="text-right text-xs text-blue-600 dark:text-blue-400" title={`Previous: ${calc.previousDeductionPercent.toFixed(1)}%`}>{formatCurrency(calc.previousDeductionAmount)}</td>
                                            <td className="text-right text-xs font-medium text-green-600 dark:text-green-400" title={`Actual: ${calc.actualDeductionPercent.toFixed(1)}%`}>{formatCurrency(calc.actualDeductionAmount)}</td>
                                            <td className="text-right text-xs font-semibold bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                            <td className="text-xs w-[150px] p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full"
                                                    value={material.remark || ''}
                                                    onChange={(e) => handleTextChange('materials', index, 'remark', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table></div>
                    ) : (
                        <div className="p-8 text-center text-base-content/60"><Icon icon={packageIcon} className="size-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No material deductions found for this contract.</p></div>
                    )}
                </div>
            )}

            {activeTab === "machines" && (
                <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 border-b border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Icon icon={truckIcon} className="text-orange-600 dark:text-orange-400 size-5" /><h3 className="font-semibold text-orange-600 dark:text-orange-400">Machine Deductions</h3><span className="text-sm text-orange-600/70 dark:text-orange-400/70">• {safeMachines.length} items</span></div>
                            <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">Total Deductions: {formatCurrency(machineTotal)}</div>
                        </div>
                    </div>
                    {safeMachines.length > 0 ? (
                        <div className="overflow-x-auto"><table className="table table-xs w-full">
                            <thead className="bg-base-200 sticky top-0">
                                <tr>
                                    <th className="text-left w-20">Ref No</th><th className="text-left w-28">Machine Code</th><th className="text-left min-w-[200px]">Type of Machine</th><th className="text-center w-16">Unit</th><th className="text-right w-24">Unit Price</th><th className="text-right w-24">Quantity</th><th className="text-right w-28">Consumed Amount</th><th className="text-right w-20">Deduct %</th><th className="text-right w-28">Deduction Amount</th><th className="text-right w-28">Previous Amount</th><th className="text-right w-28">Actual Amount</th><th className="text-right w-28">Cumul Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeMachines.map((machine, index) => {
                                    // Use dynamic calculation function
                                    const calc = calculateLaborMachineDeductions(machine);
                                    const deductionPercent = machine.deduction || machine.deductionPercentage || 0;

                                    return (
                                        <tr key={machine.id || index} className="hover:bg-base-200/50">
                                            <td className="font-mono text-xs">{machine.ref || '-'}</td>
                                            <td className="w-28 p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full"
                                                    value={machine.machineAcronym || ''}
                                                    onChange={(e) => handleTextChange('machines', index, 'machineAcronym', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>
                                            <td className="w-[200px] p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full"
                                                    value={machine.machineType || ''}
                                                    onChange={(e) => handleTextChange('machines', index, 'machineType', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>
                                            <td className="text-center text-xs">{machine.unit || '-'}</td>
                                            <td className="w-24 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={(machine.unitPrice || 0).toFixed(2)} onChange={(e) => handleItemChange('machines', index, 'unitPrice', e.target.value)} step="0.01" onFocus={(e) => e.target.select()} /></td>
                                            <td className="w-24 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={(machine.quantity || 0).toFixed(2)} onChange={(e) => handleItemChange('machines', index, 'quantity', e.target.value)} step="0.01" onFocus={(e) => e.target.select()} /></td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.amount)}</td>
                                            <td className="w-20 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={deductionPercent.toFixed(1)} onChange={(e) => handleItemChange('machines', index, 'deductionPercentage', e.target.value)} step="0.1" min="0" max="100" onFocus={(e) => e.target.select()} /></td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                            <td className="text-right text-xs text-blue-600 dark:text-blue-400" title={`Previous: ${calc.previousDeductionPercent.toFixed(1)}%`}>{formatCurrency(calc.previousDeductionAmount)}</td>
                                            <td className="text-right text-xs font-medium text-green-600 dark:text-green-400" title={`Actual: ${calc.actualDeductionPercent.toFixed(1)}%`}>{formatCurrency(calc.actualDeductionAmount)}</td>
                                            <td className="text-right text-xs font-semibold bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table></div>
                    ) : (
                        <div className="p-8 text-center text-base-content/60"><Icon icon={truckIcon} className="size-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No machine deductions found for this contract.</p></div>
                    )}
                </div>
            )}

            {/* ... Rest of the component ... */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                    <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2"><Icon icon={calculatorIcon} className="size-4" />Retention & Advance Recovery</h3>
                    <div className="space-y-3">
                        <div className="floating-label-group">
                            <input type="number" value={formData.retentionPercentage} onChange={(e) => handleInputChange('retentionPercentage', parseFloat(e.target.value) || 0)} className="input input-sm bg-base-100 border-base-300 floating-input w-full" placeholder=" " min="0" max="100" step="0.1" />
                            <label className="floating-label">Retention Percentage (%)</label>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                            <div className="flex justify-between items-center"><span className="text-sm text-red-600/70 dark:text-red-400/70">Retention Amount:</span><span className="font-semibold text-red-600 dark:text-red-400">-{formatCurrency(retentionAmount)}</span></div>
                            <div className="text-xs text-red-600/60 dark:text-red-400/60 mt-1">{formData.retentionPercentage}% of {formatCurrency(totalIPCAmount)}</div>
                        </div>
                        <div className="floating-label-group">
                            <input type="number" value={formData.advancePaymentPercentage} onChange={(e) => handleInputChange('advancePaymentPercentage', parseFloat(e.target.value) || 0)} className="input input-sm bg-base-100 border-base-300 floating-input w-full" placeholder=" " min="0" max="100" step="0.1" />
                            <label className="floating-label">Advance Payment Recovery (%)</label>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border border-orange-200 dark:border-orange-800">
                            <div className="flex justify-between items-center"><span className="text-sm text-orange-600/70 dark:text-orange-400/70">Advance Recovery:</span><span className="font-semibold text-orange-600 dark:text-orange-400">-{formatCurrency(advanceDeduction)}</span></div>
                            <div className="text-xs text-orange-600/60 dark:text-orange-400/60 mt-1">{formData.advancePaymentPercentage}% of {formatCurrency(totalIPCAmount)}</div>
                        </div>
                    </div>
                </div>
                <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                    <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2"><Icon icon={minusCircleIcon} className="size-4" />Penalties</h3>
                    <div className="space-y-3">
                        <div className="floating-label-group">
                            <input type="number" value={formData.penalty} onChange={(e) => handleInputChange('penalty', parseFloat(e.target.value) || 0)} className="input input-sm bg-base-100 border-base-300 floating-input w-full" placeholder=" " min="0" step="0.01" />
                            <label className="floating-label">Current Penalty Amount</label>
                        </div>
                        <div className="floating-label-group">
                            <input type="number" value={formData.previousPenalty} onChange={(e) => handleInputChange('previousPenalty', parseFloat(e.target.value) || 0)} className="input input-sm bg-base-100 border-base-300 floating-input w-full" placeholder=" " min="0" step="0.01" />
                            <label className="floating-label">Previous Penalty Amount</label>
                        </div>
                        {formData.penalty > 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                                <div className="flex justify-between items-center"><span className="text-sm text-yellow-600/70 dark:text-yellow-400/70">Penalty Deduction:</span><span className="font-semibold text-yellow-600 dark:text-yellow-400">-{formatCurrency(formData.penalty)}</span></div>
                            </div>
                        )}
                        {formData.penalty !== formData.previousPenalty && (
                            <div className="bg-yellow-100 dark:bg-yellow-800/30 p-3 rounded border border-yellow-300 dark:border-yellow-700">
                                <div className="flex justify-between items-center"><span className="text-sm text-yellow-700/70 dark:text-yellow-300/70">Penalty Change:</span><span className={`font-semibold ${formData.penalty > formData.previousPenalty ? 'text-red-600' : 'text-green-600'}`}>{formData.penalty - formData.previousPenalty >= 0 ? '+' : ''}{formatCurrency(formData.penalty - formData.previousPenalty)}</span></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className={`p-6 rounded-lg border-2 ${netPayableAmount >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700'}`}>
                <div className="flex items-center justify-between mb-4"><h3 className={`text-xl font-bold ${netPayableAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>Financial Summary</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-base-content/70">Gross IPC Amount:</span><span className="font-semibold text-green-600">{formatCurrency(totalIPCAmount)}</span></div>
                        {retentionAmount > 0 && (<div className="flex justify-between"><span className="text-base-content/70">Less: Retention ({formData.retentionPercentage}%):</span><span className="font-medium text-red-600">-{formatCurrency(retentionAmount)}</span></div>)}
                        {advanceDeduction > 0 && (<div className="flex justify-between"><span className="text-base-content/70">Less: Advance Recovery ({formData.advancePaymentPercentage}%):</span><span className="font-medium text-orange-600">-{formatCurrency(advanceDeduction)}</span></div>)}
                        {formData.penalty > 0 && (<div className="flex justify-between"><span className="text-base-content/70">Less: Penalty:</span><span className="font-medium text-yellow-600">-{formatCurrency(formData.penalty)}</span></div>)}
                    </div>
                    <div className="flex flex-col justify-center">
                        <div className="text-right">
                            <div className="text-sm text-base-content/60 mb-1">Net Payable Amount</div>
                            <div className={`text-4xl font-bold ${netPayableAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(netPayableAmount)}</div>
                            {totalIPCAmount > 0 && (<div className="text-sm text-base-content/60 mt-1">{((netPayableAmount / totalIPCAmount) * 100).toFixed(1)}% of gross amount</div>)}
                        </div>
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                {netPayableAmount < 0 && (<div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800"><span className="iconify lucide--alert-circle size-4"></span><span className="text-sm">Warning: Net payable amount is negative. Please review deductions.</span></div>)}
                {totalIPCAmount === 0 && (<div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800"><span className="iconify lucide--alert-triangle size-4"></span><span className="text-sm">No work progress has been entered. Please go back and update BOQ quantities.</span></div>)}
                {formData.retentionPercentage > 20 && (<div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800"><span className="iconify lucide--alert-triangle size-4"></span><span className="text-sm">High retention percentage ({formData.retentionPercentage}%). Please verify this is correct.</span></div>)}
            </div>
        </div>
    );
};
