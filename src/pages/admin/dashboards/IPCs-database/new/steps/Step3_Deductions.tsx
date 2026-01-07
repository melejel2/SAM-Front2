import React, { useState, memo, useMemo } from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import type { Vos, LaborsVM, MachinesVM, MaterialsVM, CorrectPreviousValueRequest, CorrectionResultDTO, CorrectionHistoryDTO, CorrectionHistoryRequest } from "@/types/ipc";
import { CorrectionEntityType } from "@/types/ipc";
import { Icon } from "@iconify/react";
import minusCircleIcon from "@iconify/icons-lucide/minus-circle";
import infoIcon from "@iconify/icons-lucide/info";
import usersIcon from "@iconify/icons-lucide/users";
import truckIcon from "@iconify/icons-lucide/truck";
import packageIcon from "@iconify/icons-lucide/package";
import plusIcon from "@iconify/icons-lucide/plus";
import trashIcon from "@iconify/icons-lucide/trash-2";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import { formatCurrency } from "@/utils/formatters";
import { useAuth } from "@/contexts/auth";
import { usePermissions } from "@/hooks/use-permissions";
import useToast from "@/hooks/use-toast";
import { ipcApiService } from "@/api/services/ipc-api";
import CorrectPreviousValueModal from "../../components/CorrectPreviousValueModal";
import CorrectionHistoryModal from "../../components/CorrectionHistoryModal";

type DeductionTab = "labor" | "materials" | "machines";

// Common unit options for deductions
const UNIT_OPTIONS = [
    { value: 'HR', label: 'HR (Hour)' },
    { value: 'DAY', label: 'DAY' },
    { value: 'EA', label: 'EA (Each)' },
    { value: 'M', label: 'M (Meter)' },
    { value: 'M2', label: 'M² (Square Meter)' },
    { value: 'M3', label: 'M³ (Cubic Meter)' },
    { value: 'KG', label: 'KG (Kilogram)' },
    { value: 'TON', label: 'TON' },
    { value: 'L', label: 'L (Liter)' },
    { value: 'SET', label: 'SET' },
    { value: 'LOT', label: 'LOT' },
    { value: 'LS', label: 'LS (Lump Sum)' },
    { value: 'U', label: 'U (Unit)' },
];

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
    const deduction = item.deduction || 0; // Cumulative deduction %

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
    const deduction = item.deduction || 0; // Cumulative deduction %

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

export const Step3_Deductions: React.FC = memo(() => {
    const { formData, setFormData, selectedContract, setHasUnsavedChanges } = useIPCWizardContext();
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const { canCorrectPreviousValues } = usePermissions();
    const [activeTab, setActiveTab] = useState<DeductionTab>("labor");

    // Previous Value Correction Modal State
    const [correctionModal, setCorrectionModal] = useState<{
        isOpen: boolean;
        entityType: CorrectionEntityType;
        entityId: number;
        fieldName: 'PrecedQte' | 'CumulQte' | 'PrecedentAmount';
        fieldLabel: string;
        currentValue: number;
        entityDescription: string;
    } | null>(null);
    const [historyModal, setHistoryModal] = useState<{
        isOpen: boolean;
        entityType?: CorrectionEntityType;
        entityId?: number;
    } | null>(null);

    // Delete Confirmation Modal State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{
        isOpen: boolean;
        type: 'labors' | 'machines' | 'materials';
        index: number;
        itemDescription: string;
    } | null>(null);

    // Memoize derived arrays to prevent recreation on every render
    const safeBuildings = useMemo(() => formData.buildings || [], [formData.buildings]);
    const safeVOs = useMemo(() => (formData.vos || []) as Vos[], [formData.vos]);

    // Memoize IPC totals - only recalculate when buildings/VOs change
    const { totalContractAmount, totalVoAmount, totalIPCAmount } = useMemo(() => {
        const buildings = formData.buildings || [];
        const vos = (formData.vos || []) as Vos[];

        const contractAmount = buildings.reduce((sum, building) =>
            sum + (building.boqsContract || []).reduce((boqSum, boq) => boqSum + (boq.actualAmount || 0), 0), 0
        );

        const voAmount = vos.reduce((voSum, vo) => {
            return voSum + (vo.buildings || []).reduce((buildSum, building) => {
                return buildSum + (building.boqs || []).reduce((boqSum, boq) => {
                    return boqSum + (boq.actualAmount || 0);
                }, 0);
            }, 0);
        }, 0);

        return {
            totalContractAmount: contractAmount,
            totalVoAmount: voAmount,
            totalIPCAmount: contractAmount + voAmount
        };
    }, [formData.buildings, formData.vos]);

    const handleItemChange = (
        type: 'labors' | 'materials' | 'machines',
        index: number,
        field: 'quantity' | 'unitPrice' | 'consumedAmount' | 'deduction' | 'deductionAmount' | 'actualAmount',
        value: string
    ) => {
        const items = [...(formData[type] || [])] as any[];
        if (!items[index]) return;

        const item = { ...items[index] };
        const numericValue = parseFloat(value);
        // Allow empty strings, negative signs, and valid numbers
        if (isNaN(numericValue) && value !== '' && value !== '-') return;
        // Keep empty values as 0 for calculations, but allow empty input
        const cleanValue = value === '' ? 0 : (numericValue || 0);

        // For materials, use 'allocated' instead of 'quantity' for calculations
        let quantity = type === 'materials' ? (item.allocated || 0) : (item.quantity || 0);
        let unitPrice = (type === 'materials' ? item.saleUnit : item.unitPrice) || 0;
        // Use 'deduction' field (backend field name)
        let deductionPercent = item.deduction || 0;

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
            case 'deduction':
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

            // Calculate derived fields for Labor/Machine (required for Excel generation)
            const amount = quantity * unitPrice;
            item.amount = amount;
            item.consumedAmount = amount;

            // Calculate deduction amounts
            const precedentAmount = item.precedentAmount || 0;
            const previousDeductionPercent = amount !== 0 ? (precedentAmount / amount) * 100 : 0;
            const actualDeductionPercent = deductionPercent - previousDeductionPercent;

            item.previousDeduction = previousDeductionPercent;
            item.actualDeduction = actualDeductionPercent;
            item.actualAmount = (deductionPercent * amount) / 100;
        } else {
            item.saleUnit = unitPrice;

            // Calculate derived fields for Materials (required for Excel generation)
            const stockQte = item.stockQte || 0;
            const transferedQte = item.transferedQte || 0;
            const allocated = item.allocated || 0;

            // ConsumedAmount for materials = SaleUnit * (Allocated - StockQte - TransferedQte)
            const consumedAmount = unitPrice * (allocated - stockQte - transferedQte);
            item.consumedAmount = consumedAmount;
            item.totalSale = quantity * unitPrice;

            // Calculate deduction amounts
            const precedentAmount = item.precedentAmount || 0;
            const previousDeductionPercent = consumedAmount !== 0 ? (precedentAmount / consumedAmount) * 100 : 0;
            const actualDeductionPercent = deductionPercent - previousDeductionPercent;

            item.previousDeduction = previousDeductionPercent;
            item.actualDeduction = actualDeductionPercent;
            item.actualAmount = (deductionPercent * consumedAmount) / 100;
        }

        // Update the deduction field (single source of truth)
        item.deduction = deductionPercent;

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

    // ==================== Previous Value Correction Functions ====================

    /**
     * Open the correction modal for a deduction item (Labor, Machine, or Material).
     * This allows authorized users (CM, QS, Admin) to correct PrecedentAmount values.
     */
    const openCorrectionModal = (
        entityType: CorrectionEntityType,
        entityId: number,
        currentValue: number,
        entityDescription: string
    ) => {
        const contractDatasetId = selectedContract?.id || (formData as any).contractsDatasetId;
        if (!contractDatasetId) {
            toaster.error("Contract dataset ID not found");
            return;
        }
        setCorrectionModal({
            isOpen: true,
            entityType,
            entityId,
            fieldName: 'PrecedentAmount',
            fieldLabel: 'Previous Amount',
            currentValue,
            entityDescription,
        });
    };

    /**
     * Handle the correction submission.
     * Calls the API and updates local state on success.
     */
    const handleCorrection = async (request: CorrectPreviousValueRequest): Promise<CorrectionResultDTO | null> => {
        const token = getToken();
        if (!token) {
            toaster.error("Authentication required");
            return null;
        }

        const response = await ipcApiService.correctPreviousValue(request, token);

        if (!response.success || !response.data) {
            toaster.error(response.error?.message || "Failed to apply correction");
            return null;
        }

        // Update local state with the corrected value
        const correctionResult = response.data;
        const recalc = correctionResult.recalculatedValues;

        if (request.entityType === CorrectionEntityType.Labor) {
            // Update Labor item in local state with recalculated derived values
            const updatedLabors = (formData.labors || []).map(labor => {
                if (labor.id === request.entityId) {
                    return {
                        ...labor,
                        precedentAmount: request.newValue,
                        // Apply recalculated values if available
                        previousDeduction: recalc?.previousDeduction ?? labor.previousDeduction,
                        actualDeduction: recalc?.actualDeduction ?? labor.actualDeduction,
                    };
                }
                return labor;
            });
            setFormData({ labors: updatedLabors });
        } else if (request.entityType === CorrectionEntityType.Machine) {
            // Update Machine item in local state with recalculated derived values
            const updatedMachines = (formData.machines || []).map(machine => {
                if (machine.id === request.entityId) {
                    return {
                        ...machine,
                        precedentAmount: request.newValue,
                        // Apply recalculated values if available
                        previousDeduction: recalc?.previousDeduction ?? machine.previousDeduction,
                        actualDeduction: recalc?.actualDeduction ?? machine.actualDeduction,
                    };
                }
                return machine;
            });
            setFormData({ machines: updatedMachines });
        } else if (request.entityType === CorrectionEntityType.Material) {
            // Update Material item in local state with recalculated derived values
            const updatedMaterials = (formData.materials || []).map(material => {
                if (material.id === request.entityId) {
                    return {
                        ...material,
                        precedentAmount: request.newValue,
                        // Apply recalculated values if available
                        previousDeduction: recalc?.previousDeduction ?? material.previousDeduction,
                        actualDeduction: recalc?.actualDeduction ?? material.actualDeduction,
                    };
                }
                return material;
            });
            setFormData({ materials: updatedMaterials });
        }

        toaster.success("Previous amount corrected successfully. Audit record created.");
        return correctionResult;
    };

    /**
     * Fetch correction history for the audit trail display.
     */
    const handleFetchHistory = async (request: CorrectionHistoryRequest): Promise<CorrectionHistoryDTO[]> => {
        const token = getToken();
        if (!token) {
            toaster.error("Authentication required");
            return [];
        }

        const contractDatasetId = selectedContract?.id || (formData as any).contractsDatasetId;
        const response = await ipcApiService.getCorrectionHistory({ ...request, contractDatasetId }, token);

        if (!response.success || !response.data) {
            toaster.error(response.error?.message || "Failed to fetch correction history");
            return [];
        }

        return response.data;
    };

    // ==================== Add/Delete Deduction Functions ====================

    /**
     * Generate the next reference number for a deduction type
     */
    const generateNextRef = (type: 'labors' | 'machines' | 'materials'): string => {
        const items = formData[type] || [];
        const prefix = type === 'labors' ? 'L' : type === 'machines' ? 'M' : 'MAT';
        const nextNum = items.length + 1;
        return `${prefix}-${String(nextNum).padStart(3, '0')}`;
    };

    /**
     * Create default values for new Labor item
     */
    const createDefaultLabor = (): LaborsVM => ({
        id: 0,
        ref: generateNextRef('labors'),
        activityDescription: '',
        workerType: '',
        laborType: '',
        unit: 'HR',
        unitPrice: undefined as any, // Start empty for better UX
        quantity: undefined as any,   // Start empty for better UX
        amount: 0,
        consumedAmount: 0,
        actualAmount: 0,
        deduction: undefined as any,  // Start empty for better UX
        precedentAmount: 0,
        precedentAmountOld: 0,
        previousDeduction: 0,
        actualDeduction: 0,
    });

    /**
     * Create default values for new Machine item
     */
    const createDefaultMachine = (): MachinesVM => ({
        id: 0,
        ref: generateNextRef('machines'),
        machineAcronym: '',
        machineType: '',
        unit: 'HR',
        unitPrice: undefined as any, // Start empty for better UX
        quantity: undefined as any,   // Start empty for better UX
        amount: 0,
        consumedAmount: 0,
        actualAmount: 0,
        deduction: undefined as any,  // Start empty for better UX
        precedentAmount: 0,
        precedentAmountOld: 0,
        previousDeduction: 0,
        actualDeduction: 0,
    });

    /**
     * Create default values for new Material item
     */
    const createDefaultMaterial = (): MaterialsVM => ({
        id: 0,
        bc: generateNextRef('materials'),
        designation: '',
        unit: 'EA',
        saleUnit: undefined as any,   // Start empty for better UX
        quantity: undefined as any,    // Start empty for better UX
        allocated: undefined as any,   // Start empty for better UX
        stockQte: 0,
        transferedQte: 0,
        livree: 0,
        totalSale: 0,
        consumedAmount: 0,
        consumes: 0,
        actualAmount: 0,
        deduction: undefined as any,   // Start empty for better UX
        precedentAmount: 0,
        precedentAmountOld: 0,
        previousDeduction: 0,
        actualDeduction: 0,
        isTransferred: false,
        remark: '',
    });

    /**
     * Add new deduction item to the specified type
     */
    const handleAddItem = (type: 'labors' | 'machines' | 'materials') => {
        const currentItems = [...(formData[type] || [])] as any[];
        let newItem: LaborsVM | MachinesVM | MaterialsVM;

        switch (type) {
            case 'labors':
                newItem = createDefaultLabor();
                break;
            case 'machines':
                newItem = createDefaultMachine();
                break;
            case 'materials':
                newItem = createDefaultMaterial();
                break;
        }

        currentItems.push(newItem);
        setFormData({ [type]: currentItems });
        if (setHasUnsavedChanges) setHasUnsavedChanges(true);
    };

    /**
     * Open delete confirmation dialog
     */
    const handleDeleteClick = (
        type: 'labors' | 'machines' | 'materials',
        index: number,
        item: LaborsVM | MachinesVM | MaterialsVM
    ) => {
        let description = '';
        if (type === 'labors') {
            const labor = item as LaborsVM;
            description = `${labor.ref || ''} - ${labor.activityDescription || labor.workerType || 'Labor Item'}`;
        } else if (type === 'machines') {
            const machine = item as MachinesVM;
            description = `${machine.ref || ''} - ${machine.machineType || machine.machineAcronym || 'Machine Item'}`;
        } else {
            const material = item as MaterialsVM;
            description = `${material.bc || ''} - ${material.designation || 'Material Item'}`;
        }

        setDeleteConfirmation({
            isOpen: true,
            type,
            index,
            itemDescription: description.trim() || 'Deduction Item',
        });
    };

    /**
     * Confirm and execute deletion
     */
    const handleConfirmDelete = () => {
        if (!deleteConfirmation) return;

        const { type, index } = deleteConfirmation;
        const currentItems = [...(formData[type] || [])] as any[];
        currentItems.splice(index, 1);
        setFormData({ [type]: currentItems });
        if (setHasUnsavedChanges) setHasUnsavedChanges(true);

        setDeleteConfirmation(null);
    };

    /**
     * Cancel deletion
     */
    const handleCancelDelete = () => {
        setDeleteConfirmation(null);
    };

    // Memoize deduction arrays to prevent recreation on every render
    const safeLabors = useMemo(() => formData.labors || [], [formData.labors]);
    const safeMachines = useMemo(() => formData.machines || [], [formData.machines]);
    const safeMaterials = useMemo(() => formData.materials || [], [formData.materials]);

    // Memoize comprehensive totals for each deduction type - only recalculate when data changes
    const laborTotals = useMemo(() => safeLabors.reduce((totals, labor) => {
        const calc = calculateLaborMachineDeductions(labor);
        return {
            consumedAmount: totals.consumedAmount + calc.amount,
            deductionAmount: totals.deductionAmount + calc.cumulativeDeductionAmount,
            previousAmount: totals.previousAmount + calc.previousDeductionAmount,
            actualAmount: totals.actualAmount + calc.actualDeductionAmount,
            cumulAmount: totals.cumulAmount + calc.cumulativeDeductionAmount,
        };
    }, { consumedAmount: 0, deductionAmount: 0, previousAmount: 0, actualAmount: 0, cumulAmount: 0 }), [safeLabors]);

    const machineTotals = useMemo(() => safeMachines.reduce((totals, machine) => {
        const calc = calculateLaborMachineDeductions(machine);
        return {
            consumedAmount: totals.consumedAmount + calc.amount,
            deductionAmount: totals.deductionAmount + calc.cumulativeDeductionAmount,
            previousAmount: totals.previousAmount + calc.previousDeductionAmount,
            actualAmount: totals.actualAmount + calc.actualDeductionAmount,
            cumulAmount: totals.cumulAmount + calc.cumulativeDeductionAmount,
        };
    }, { consumedAmount: 0, deductionAmount: 0, previousAmount: 0, actualAmount: 0, cumulAmount: 0 }), [safeMachines]);

    const materialTotals = useMemo(() => safeMaterials.reduce((totals, material) => {
        const calc = calculateMaterialDeductions(material);
        return {
            totalSale: totals.totalSale + calc.consumedAmount,
            deductionAmount: totals.deductionAmount + calc.cumulativeDeductionAmount,
            previousAmount: totals.previousAmount + calc.previousDeductionAmount,
            actualAmount: totals.actualAmount + calc.actualDeductionAmount,
            cumulAmount: totals.cumulAmount + calc.cumulativeDeductionAmount,
        };
    }, { totalSale: 0, deductionAmount: 0, previousAmount: 0, actualAmount: 0, cumulAmount: 0 }), [safeMaterials]);

    // Keep backward compatible totals for header display
    const laborTotal = laborTotals.actualAmount;
    const machineTotal = machineTotals.actualAmount;
    const materialTotal = materialTotals.actualAmount;


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
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleAddItem('labors')}
                                    className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                                >
                                    <Icon icon={plusIcon} className="size-4" />
                                    <span>Add New</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    {safeLabors.length > 0 ? (
                        <div className="overflow-x-auto"><table className="table table-xs w-full">
                            <thead className="bg-base-200 sticky top-0">
                                <tr>
                                    <th className="text-center w-12"></th><th className="text-left w-20">Ref No</th><th className="text-left min-w-[150px]">Worker Type</th><th className="text-left min-w-[200px]">Activity Description</th><th className="text-center w-16">Unit</th><th className="text-right w-24">Unit Price</th><th className="text-right w-24">Quantity</th><th className="text-right w-28">Consumed Amount</th><th className="text-right w-20">Deduct %</th><th className="text-right w-28">Deduction Amount</th><th className="text-right w-28">Previous Amount</th><th className="text-right w-28">Actual Amount</th><th className="text-right w-28">Cumul Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeLabors.map((labor, index) => {
                                    // Use dynamic calculation function
                                    const calc = calculateLaborMachineDeductions(labor);
                                    const deductionPercent = labor.deduction || 0;

                                    return (
                                        <tr key={labor.id || index} className="hover:bg-base-200/50">
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick('labors', index, labor)}
                                                    className="btn btn-ghost btn-xs p-0 min-h-0 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                                                    title="Delete item"
                                                >
                                                    <Icon icon={trashIcon} className="size-4" />
                                                </button>
                                            </td>
                                            <td className="w-24 p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full font-mono"
                                                    value={labor.ref || ''}
                                                    onChange={(e) => handleTextChange('labors', index, 'ref', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    placeholder="Ref"
                                                />
                                            </td>
                                            <td className="w-28 p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full"
                                                    value={labor.workerType || labor.laborType || ''}
                                                    onChange={(e) => handleTextChange('labors', index, 'laborType', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    placeholder="Worker Type"
                                                />
                                            </td>
                                            <td className="w-[200px] p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full"
                                                    value={labor.activityDescription || ''}
                                                    onChange={(e) => handleTextChange('labors', index, 'activityDescription', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>
                                            <td className="w-20 p-1">
                                                <select
                                                    className="select select-bordered select-xs w-full"
                                                    value={labor.unit || 'HR'}
                                                    onChange={(e) => handleTextChange('labors', index, 'unit', e.target.value)}
                                                >
                                                    {UNIT_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.value}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="w-24 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={labor.unitPrice || ''} onChange={(e) => handleItemChange('labors', index, 'unitPrice', e.target.value)} onFocus={(e) => e.target.select()} step="any" /></td>
                                            <td className="w-24 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={labor.quantity || ''} onChange={(e) => handleItemChange('labors', index, 'quantity', e.target.value)} onFocus={(e) => e.target.select()} step="any" /></td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.amount)}</td>
                                            <td className="w-20 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={deductionPercent || ''} onChange={(e) => handleItemChange('labors', index, 'deduction', e.target.value)} onFocus={(e) => e.target.select()} step="any" /></td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                            {/* Previous Amount - with correction button for authorized users */}
                                            <td className="text-right text-xs text-blue-600 dark:text-blue-400" title={`Previous: ${calc.previousDeductionPercent.toFixed(1)}%`}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <span>{formatCurrency(calc.previousDeductionAmount)}</span>
                                                    {canCorrectPreviousValues && labor.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openCorrectionModal(
                                                                CorrectionEntityType.Labor,
                                                                labor.id,
                                                                calc.previousDeductionAmount,
                                                                `Labor: ${labor.ref || ''} - ${labor.activityDescription || labor.workerType || 'Labor Item'}`
                                                            )}
                                                            className="btn btn-ghost btn-xs p-0 min-h-0 h-4 w-4"
                                                            title="Correct previous amount (audit trail)"
                                                        >
                                                            <span className="iconify lucide--pencil text-amber-500 size-3"></span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-right text-xs font-medium text-green-600 dark:text-green-400" title={`Actual: ${calc.actualDeductionPercent.toFixed(1)}%`}>{formatCurrency(calc.actualDeductionAmount)}</td>
                                            <td className="text-right text-xs font-semibold bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-red-100 dark:bg-red-900/30 border-t-2 border-red-300 dark:border-red-700">
                                <tr className="font-semibold">
                                    <td colSpan={7} className="text-right text-xs py-2 pr-2">TOTALS:</td>
                                    <td className="text-right text-xs py-2">{formatCurrency(laborTotals.consumedAmount)}</td>
                                    <td className="text-center text-xs py-2">-</td>
                                    <td className="text-right text-xs py-2">{formatCurrency(laborTotals.deductionAmount)}</td>
                                    <td className="text-right text-xs py-2 text-blue-600 dark:text-blue-400">{formatCurrency(laborTotals.previousAmount)}</td>
                                    <td className="text-right text-xs py-2 text-green-600 dark:text-green-400">{formatCurrency(laborTotals.actualAmount)}</td>
                                    <td className="text-right text-xs py-2 font-bold">{formatCurrency(laborTotals.cumulAmount)}</td>
                                </tr>
                            </tfoot>
                        </table></div>
                    ) : (
                        <div className="p-8 text-center text-base-content/60">
                            <Icon icon={usersIcon} className="size-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm mb-4">No labor deductions found for this contract.</p>
                            <button
                                type="button"
                                onClick={() => handleAddItem('labors')}
                                className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-1 mx-auto"
                            >
                                <Icon icon={plusIcon} className="size-4" />
                                <span>Add Labor Deduction</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "materials" && (
                <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 border-b border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Icon icon={packageIcon} className="text-yellow-600 dark:text-yellow-400 size-5" /><h3 className="font-semibold text-yellow-600 dark:text-yellow-400">Material Deductions</h3><span className="text-sm text-yellow-600/70 dark:text-yellow-400/70">• {safeMaterials.length} items</span></div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleAddItem('materials')}
                                    className="btn btn-sm bg-yellow-600 text-white hover:bg-yellow-700 flex items-center gap-1"
                                >
                                    <Icon icon={plusIcon} className="size-4" />
                                    <span>Add New</span>
                                </button>
                                </div>
                        </div>
                    </div>
                    {safeMaterials.length > 0 ? (
                        <div className="overflow-x-auto"><table className="table table-xs w-full">
                            <thead className="bg-base-200 sticky top-0">
                                <tr>
                                    <th className="text-center w-12"></th><th className="text-left w-20">BC/PO</th><th className="text-left min-w-[200px]">Designation</th><th className="text-center w-16">Unit</th><th className="text-right w-24">Sale Unit</th><th className="text-right w-24">Quantity</th><th className="text-right w-28">Total Sale</th><th className="text-right w-20">Deduct %</th><th className="text-right w-28">Deduction Amount</th><th className="text-right w-28">Previous Amount</th><th className="text-right w-28">Actual Amount</th><th className="text-right w-28">Cumul Amount</th><th className="text-left min-w-[150px]">Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeMaterials.map((material, index) => {
                                    // Use dynamic calculation function
                                    const calc = calculateMaterialDeductions(material);
                                    const deductionPercent = material.deduction || 0;

                                    return (
                                        <tr key={material.id || index} className="hover:bg-base-200/50">
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick('materials', index, material)}
                                                    className="btn btn-ghost btn-xs p-0 min-h-0 h-6 w-6 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
                                                    title="Delete item"
                                                >
                                                    <Icon icon={trashIcon} className="size-4" />
                                                </button>
                                            </td>
                                            <td className="w-24 p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full font-mono"
                                                    value={material.bc || ''}
                                                    onChange={(e) => handleTextChange('materials', index, 'bc', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    placeholder="BC/PO"
                                                />
                                            </td>
                                            <td className="w-[200px] p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full"
                                                    value={material.designation || ''}
                                                    onChange={(e) => handleTextChange('materials', index, 'designation', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                />
                                            </td>
                                            <td className="w-20 p-1">
                                                <select
                                                    className="select select-bordered select-xs w-full"
                                                    value={material.unit || 'EA'}
                                                    onChange={(e) => handleTextChange('materials', index, 'unit', e.target.value)}
                                                >
                                                    {UNIT_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.value}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="w-24 p-1">
                                                <input
                                                    type="number"
                                                    className="input input-bordered input-xs w-full text-right"
                                                    value={material.saleUnit || ''}
                                                    onChange={(e) => handleItemChange('materials', index, 'unitPrice', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    step="any"
                                                />
                                            </td>
                                            <td className="w-24 p-1">
                                                <input
                                                    type="number"
                                                    className="input input-bordered input-xs w-full text-right"
                                                    value={material.allocated || ''}
                                                    onChange={(e) => handleItemChange('materials', index, 'quantity', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    step="any"
                                                />
                                            </td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.consumedAmount)}</td>
                                            <td className="w-20 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={deductionPercent || ''} onChange={(e) => handleItemChange('materials', index, 'deduction', e.target.value)} onFocus={(e) => e.target.select()} step="any" /></td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                            {/* Previous Amount - with correction button for authorized users */}
                                            <td className="text-right text-xs text-blue-600 dark:text-blue-400" title={`Previous: ${calc.previousDeductionPercent.toFixed(1)}%`}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <span>{formatCurrency(calc.previousDeductionAmount)}</span>
                                                    {canCorrectPreviousValues && material.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openCorrectionModal(
                                                                CorrectionEntityType.Material,
                                                                material.id,
                                                                calc.previousDeductionAmount,
                                                                `Material: ${material.bc || ''} - ${material.designation || 'Material Item'}`
                                                            )}
                                                            className="btn btn-ghost btn-xs p-0 min-h-0 h-4 w-4"
                                                            title="Correct previous amount (audit trail)"
                                                        >
                                                            <span className="iconify lucide--pencil text-amber-500 size-3"></span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
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
                            <tfoot className="bg-yellow-100 dark:bg-yellow-900/30 border-t-2 border-yellow-300 dark:border-yellow-700">
                                <tr className="font-semibold">
                                    <td colSpan={6} className="text-right text-xs py-2 pr-2">TOTALS:</td>
                                    <td className="text-right text-xs py-2">{formatCurrency(materialTotals.totalSale)}</td>
                                    <td className="text-center text-xs py-2">-</td>
                                    <td className="text-right text-xs py-2">{formatCurrency(materialTotals.deductionAmount)}</td>
                                    <td className="text-right text-xs py-2 text-blue-600 dark:text-blue-400">{formatCurrency(materialTotals.previousAmount)}</td>
                                    <td className="text-right text-xs py-2 text-green-600 dark:text-green-400">{formatCurrency(materialTotals.actualAmount)}</td>
                                    <td className="text-right text-xs py-2 font-bold">{formatCurrency(materialTotals.cumulAmount)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table></div>
                    ) : (
                        <div className="p-8 text-center text-base-content/60">
                            <Icon icon={packageIcon} className="size-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm mb-4">No material deductions found for this contract.</p>
                            <button
                                type="button"
                                onClick={() => handleAddItem('materials')}
                                className="btn btn-sm bg-yellow-600 text-white hover:bg-yellow-700 flex items-center gap-1 mx-auto"
                            >
                                <Icon icon={plusIcon} className="size-4" />
                                <span>Add Material Deduction</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "machines" && (
                <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 border-b border-orange-200 dark:border-orange-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Icon icon={truckIcon} className="text-orange-600 dark:text-orange-400 size-5" /><h3 className="font-semibold text-orange-600 dark:text-orange-400">Machine Deductions</h3><span className="text-sm text-orange-600/70 dark:text-orange-400/70">• {safeMachines.length} items</span></div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleAddItem('machines')}
                                    className="btn btn-sm bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-1"
                                >
                                    <Icon icon={plusIcon} className="size-4" />
                                    <span>Add New</span>
                                </button>    </div>
                        </div>
                    </div>
                    {safeMachines.length > 0 ? (
                        <div className="overflow-x-auto"><table className="table table-xs w-full">
                            <thead className="bg-base-200 sticky top-0">
                                <tr>
                                    <th className="text-center w-12"></th><th className="text-left w-20">Ref No</th><th className="text-left w-28">Machine Code</th><th className="text-left min-w-[200px]">Type of Machine</th><th className="text-center w-16">Unit</th><th className="text-right w-24">Unit Price</th><th className="text-right w-24">Quantity</th><th className="text-right w-28">Consumed Amount</th><th className="text-right w-20">Deduct %</th><th className="text-right w-28">Deduction Amount</th><th className="text-right w-28">Previous Amount</th><th className="text-right w-28">Actual Amount</th><th className="text-right w-28">Cumul Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeMachines.map((machine, index) => {
                                    // Use dynamic calculation function
                                    const calc = calculateLaborMachineDeductions(machine);
                                    const deductionPercent = machine.deduction || 0;

                                    return (
                                        <tr key={machine.id || index} className="hover:bg-base-200/50">
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick('machines', index, machine)}
                                                    className="btn btn-ghost btn-xs p-0 min-h-0 h-6 w-6 text-orange-500 hover:text-orange-700 hover:bg-orange-100"
                                                    title="Delete item"
                                                >
                                                    <Icon icon={trashIcon} className="size-4" />
                                                </button>
                                            </td>
                                            <td className="w-24 p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full font-mono"
                                                    value={machine.ref || ''}
                                                    onChange={(e) => handleTextChange('machines', index, 'ref', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    placeholder="Ref"
                                                />
                                            </td>
                                            <td className="w-28 p-1">
                                                <input
                                                    type="text"
                                                    className="input input-bordered input-xs w-full"
                                                    value={machine.machineAcronym || ''}
                                                    onChange={(e) => handleTextChange('machines', index, 'machineAcronym', e.target.value)}
                                                    onFocus={(e) => e.target.select()}
                                                    placeholder="Code"
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
                                            <td className="w-20 p-1">
                                                <select
                                                    className="select select-bordered select-xs w-full"
                                                    value={machine.unit || 'HR'}
                                                    onChange={(e) => handleTextChange('machines', index, 'unit', e.target.value)}
                                                >
                                                    {UNIT_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.value}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="w-24 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={machine.unitPrice || ''} onChange={(e) => handleItemChange('machines', index, 'unitPrice', e.target.value)} onFocus={(e) => e.target.select()} step="any" /></td>
                                            <td className="w-24 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={machine.quantity || ''} onChange={(e) => handleItemChange('machines', index, 'quantity', e.target.value)} onFocus={(e) => e.target.select()} step="any" /></td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.amount)}</td>
                                            <td className="w-20 p-1"><input type="number" className="input input-bordered input-xs w-full text-right" value={deductionPercent || ''} onChange={(e) => handleItemChange('machines', index, 'deduction', e.target.value)} onFocus={(e) => e.target.select()} step="any" /></td>
                                            <td className="text-right text-xs bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                            {/* Previous Amount - with correction button for authorized users */}
                                            <td className="text-right text-xs text-blue-600 dark:text-blue-400" title={`Previous: ${calc.previousDeductionPercent.toFixed(1)}%`}>
                                                <div className="flex items-center justify-end gap-1">
                                                    <span>{formatCurrency(calc.previousDeductionAmount)}</span>
                                                    {canCorrectPreviousValues && machine.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openCorrectionModal(
                                                                CorrectionEntityType.Machine,
                                                                machine.id,
                                                                calc.previousDeductionAmount,
                                                                `Machine: ${machine.ref || ''} - ${machine.machineType || machine.machineAcronym || 'Machine Item'}`
                                                            )}
                                                            className="btn btn-ghost btn-xs p-0 min-h-0 h-4 w-4"
                                                            title="Correct previous amount (audit trail)"
                                                        >
                                                            <span className="iconify lucide--pencil text-amber-500 size-3"></span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-right text-xs font-medium text-green-600 dark:text-green-400" title={`Actual: ${calc.actualDeductionPercent.toFixed(1)}%`}>{formatCurrency(calc.actualDeductionAmount)}</td>
                                            <td className="text-right text-xs font-semibold bg-base-200/50">{formatCurrency(calc.cumulativeDeductionAmount)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-orange-100 dark:bg-orange-900/30 border-t-2 border-orange-300 dark:border-orange-700">
                                <tr className="font-semibold">
                                    <td colSpan={7} className="text-right text-xs py-2 pr-2">TOTALS:</td>
                                    <td className="text-right text-xs py-2">{formatCurrency(machineTotals.consumedAmount)}</td>
                                    <td className="text-center text-xs py-2">-</td>
                                    <td className="text-right text-xs py-2">{formatCurrency(machineTotals.deductionAmount)}</td>
                                    <td className="text-right text-xs py-2 text-blue-600 dark:text-blue-400">{formatCurrency(machineTotals.previousAmount)}</td>
                                    <td className="text-right text-xs py-2 text-green-600 dark:text-green-400">{formatCurrency(machineTotals.actualAmount)}</td>
                                    <td className="text-right text-xs py-2 font-bold">{formatCurrency(machineTotals.cumulAmount)}</td>
                                </tr>
                            </tfoot>
                        </table></div>
                    ) : (
                        <div className="p-8 text-center text-base-content/60">
                            <Icon icon={truckIcon} className="size-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm mb-4">No machine deductions found for this contract.</p>
                            <button
                                type="button"
                                onClick={() => handleAddItem('machines')}
                                className="btn btn-sm bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-1 mx-auto"
                            >
                                <Icon icon={plusIcon} className="size-4" />
                                <span>Add Machine Deduction</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Correction Modals */}
            {correctionModal && (
                <CorrectPreviousValueModal
                    isOpen={correctionModal.isOpen}
                    onClose={() => setCorrectionModal(null)}
                    entityType={correctionModal.entityType}
                    entityId={correctionModal.entityId}
                    contractDatasetId={selectedContract?.id || (formData as any).contractsDatasetId}
                    fieldName={correctionModal.fieldName}
                    fieldLabel={correctionModal.fieldLabel}
                    currentValue={correctionModal.currentValue}
                    entityDescription={correctionModal.entityDescription}
                    onCorrect={handleCorrection}
                />
            )}

            {historyModal && (
                <CorrectionHistoryModal
                    isOpen={historyModal.isOpen}
                    onClose={() => setHistoryModal(null)}
                    contractDatasetId={selectedContract?.id || (formData as any).contractsDatasetId}
                    entityType={historyModal.entityType}
                    entityId={historyModal.entityId}
                    onFetchHistory={handleFetchHistory}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Icon icon={alertTriangleIcon} className="text-red-500 size-6" />
                            Confirm Deletion
                        </h3>
                        <p className="py-4">
                            Are you sure you want to delete this item?
                            <br />
                            <span className="font-medium text-base-content/80">
                                {deleteConfirmation.itemDescription}
                            </span>
                        </p>
                        <p className="text-sm text-base-content/60">
                            This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={handleCancelDelete}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-error"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop bg-black/20" onClick={handleCancelDelete}></div>
                </div>
            )}
        </div>
    );
});
