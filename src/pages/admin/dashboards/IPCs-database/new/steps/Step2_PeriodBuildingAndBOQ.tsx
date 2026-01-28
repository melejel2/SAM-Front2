import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import type { Vos, BoqIpcVM, VOBoqIpcVM, CorrectPreviousValueRequest, CorrectionResultDTO, CorrectionHistoryDTO, CorrectionHistoryRequest } from "@/types/ipc";
import { CorrectionEntityType, isAdvancePaymentType, isRetentionType } from "@/types/ipc";
import shieldIcon from "@iconify/icons-lucide/shield";
import { Icon } from "@iconify/react";
import infoIcon from "@iconify/icons-lucide/info";
import buildingIcon from "@iconify/icons-lucide/building";
import dollarSignIcon from "@iconify/icons-lucide/dollar-sign";
import xIcon from "@iconify/icons-lucide/x";
import pencilIcon from "@iconify/icons-lucide/pencil";
import downloadIcon from "@iconify/icons-lucide/download";
import uploadIcon from "@iconify/icons-lucide/upload";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import hashIcon from "@iconify/icons-lucide/hash";
import building2Icon from "@iconify/icons-lucide/building-2";
import usersIcon from "@iconify/icons-lucide/users";
import fileCheckIcon from "@iconify/icons-lucide/file-check";
import { useAuth } from "@/contexts/auth";
import { ipcApiService } from "@/api/services/ipc-api";
import ExcelJS from "exceljs";
import useToast from "@/hooks/use-toast";
import { formatCurrency, formatQuantity } from "@/utils/formatters";
import { usePermissions } from "@/hooks/use-permissions";
import CorrectPreviousValueModal from "../../components/CorrectPreviousValueModal";
import CorrectionHistoryModal from "../../components/CorrectionHistoryModal";
import PenaltyForm from "../../components/PenaltyForm";
import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";

function cellValueToPrimitive(value: ExcelJS.CellValue): unknown {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return value;
    if (typeof value === "object") {
        if ("result" in value) return (value as ExcelJS.CellFormulaValue).result ?? "";
        if ("text" in value) return (value as ExcelJS.CellHyperlinkValue).text ?? (value as ExcelJS.CellHyperlinkValue).hyperlink ?? "";
        if ("richText" in value) return (value as ExcelJS.CellRichTextValue).richText.map((t: ExcelJS.RichText) => t.text).join("");
        return "";
    }
    return value;
}

function downloadXlsx(buffer: ArrayBuffer, filename: string) {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export const Step2_PeriodBuildingAndBOQ: React.FC = () => {
    const { formData, setFormData, selectedContract } = useIPCWizardContext();
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { canCorrectPreviousValues } = usePermissions();

    // Legacy: Both quantity and percentage inputs are now always visible (no toggle needed)
    // This mirrors the SAM-Desktop behavior where users can edit either field

    // Active building/VO tab - follows legacy SAM bottom tab pattern
    const [activeBuildingId, setActiveBuildingId] = useState<number | null>(null);
    const [activeVOId, setActiveVOId] = useState<number | null>(null);
    const [activeVOBuildingId, setActiveVOBuildingId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"contract" | "vo">("contract");

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

    // Pending input state - allows free typing during edit, validates on blur
    // Key format: "contract-{buildingId}-{boqId}-{field}" or "vo-{voId}-{buildingId}-{boqId}-{field}"
    const [pendingInputs, setPendingInputs] = useState<Record<string, string>>({});

    // Advance Payment Modal State
    const [showAdvancePaymentModal, setShowAdvancePaymentModal] = useState(false);
    const [advancePaymentAutoOpened, setAdvancePaymentAutoOpened] = useState(false);

    // Retention Release Modal State
    const [showRetentionReleaseModal, setShowRetentionReleaseModal] = useState(false);
    const [retentionReleaseAutoOpened, setRetentionReleaseAutoOpened] = useState(false);

    // Penalty Modal State (only visible in edit mode)
    const [showPenaltyModal, setShowPenaltyModal] = useState(false);

    // Store the ORIGINAL cumulative when data loads (for edit mode calculation)
    // This allows us to calculate what was paid BEFORE this IPC (for Advance Payment)
    const [originalCumulativeRef, setOriginalCumulativeRef] = useState<{
        cumulative: number;
        thisIpcAmount: number;
        captured: boolean;
    }>({ cumulative: 0, thisIpcAmount: 0, captured: false });

    // Store the ORIGINAL retention cumulative when data loads (for edit mode calculation)
    // This allows us to calculate what was released BEFORE this IPC (for Retention Release)
    const [originalRetentionCumulativeRef, setOriginalRetentionCumulativeRef] = useState<{
        cumulative: number;
        thisIpcAmount: number;
        captured: boolean;
    }>({ cumulative: 0, thisIpcAmount: 0, captured: false });

    // Capture original values when IPC data loads (for edit mode)
    // This is needed to calculate what was paid/released BEFORE this IPC
    useEffect(() => {
        const isInEditMode = formData.id && formData.id > 0;
        // Capture when: edit mode, not yet captured, and we have data loaded (contractsDatasetId > 0)
        if (isInEditMode && !originalCumulativeRef.captured && formData.contractsDatasetId > 0) {
            setOriginalCumulativeRef({
                cumulative: formData.advancePaymentAmountCumul || 0,
                thisIpcAmount: formData.advancePaymentAmount || 0,
                captured: true
            });
        }
        // Capture retention cumulative
        if (isInEditMode && !originalRetentionCumulativeRef.captured && formData.contractsDatasetId > 0) {
            setOriginalRetentionCumulativeRef({
                cumulative: formData.retentionAmountCumul || 0,
                thisIpcAmount: formData.retentionAmount || 0,
                captured: true
            });
        }
    }, [formData.id, formData.contractsDatasetId, formData.advancePaymentAmountCumul, formData.advancePaymentAmount, originalCumulativeRef.captured, formData.retentionAmountCumul, formData.retentionAmount, originalRetentionCumulativeRef.captured]);

    // Advance Payment Selection State - which items to include in calculation
    // 'all' = BOQ + all VOs, 'boq' = BOQ only, or specific VO IDs
    // Initialize from formData to persist selection across navigation
    const [advancePaymentSelection, setAdvancePaymentSelectionLocal] = useState<'all' | 'boq' | number[]>(
        formData.advancePaymentSelection || 'all'
    );

    // Sync selection state back to formData when it changes
    const setAdvancePaymentSelection = (newSelection: 'all' | 'boq' | number[]) => {
        setAdvancePaymentSelectionLocal(newSelection);
        setFormData({ advancePaymentSelection: newSelection });
    };

    // Initialize local state from formData when component mounts or formData changes
    useEffect(() => {
        if (formData.advancePaymentSelection && formData.advancePaymentSelection !== advancePaymentSelection) {
            setAdvancePaymentSelectionLocal(formData.advancePaymentSelection);
        }
    }, [formData.advancePaymentSelection]);

    // Effect to fetch all buildings for the selected contract
    useEffect(() => {
        const fetchAllBuildings = async () => {
            if (selectedContract) {
                const token = getToken();
                if (!token) return;
                const response = await ipcApiService.getContractDataForNewIpc(selectedContract.id, token);
                if (response.success && response.data) {
                    // Auto-initialize fromDate from previous IPC's toDate if available
                    const isEditMode = formData.id && formData.id > 0;
                    if (!isEditMode && response.data.previousIpcToDate && !formData.fromDate) {
                        setFormData({ fromDate: response.data.previousIpcToDate.split('T')[0] });
                    }

                    // Auto-initialize buildings ONLY in NEW mode (not edit mode)
                    if (!isEditMode && (!formData.buildings || formData.buildings.length === 0) && response.data.buildings && response.data.buildings.length > 0) {
                        const initializedBuildings = response.data.buildings.map(building => ({
                            ...building,
                            boqsContract: (building.boqsContract || []).map(boq => ({
                                ...boq,
                                actualQte: 0,
                                actualAmount: 0,
                                cumulQte: boq.precedQte || 0,
                                cumulAmount: (boq.precedQte || 0) * boq.unitPrice,
                                cumulPercent: boq.qte === 0 ? 0 : ((boq.precedQte || 0) / boq.qte) * 100
                            }))
                        }));
                        setFormData({ buildings: initializedBuildings });
                        setActiveBuildingId(initializedBuildings[0]?.id || null);
                    }
                }
            }
        };
        fetchAllBuildings();
    }, [selectedContract, getToken]);

    // Set default period if not set - ONLY in NEW mode
    // fromDate: First day of current month (will be updated to previous IPC's toDate in future enhancement)
    // toDate: Today's date
    useEffect(() => {
        const isEditMode = formData.id && formData.id > 0;
        if (!isEditMode && (!formData.fromDate || !formData.toDate)) {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            // Changed: toDate now defaults to TODAY instead of end of month
            const today = now;

            setFormData({
                fromDate: firstDay.toISOString().split('T')[0],
                toDate: today.toISOString().split('T')[0]
            });
        }
    }, [formData.fromDate, formData.toDate, setFormData]);

    // Set initial active building
    useEffect(() => {
        if (!activeBuildingId && formData.buildings && formData.buildings.length > 0) {
            setActiveBuildingId(formData.buildings[0].id);
        }
    }, [formData.buildings, activeBuildingId]);

    // Auto-open Advance Payment Modal when IPC type is "Advance Payment"
    useEffect(() => {
        const isAdvanceType = isAdvancePaymentType(formData.type);
        const isInEditMode = formData.id && formData.id > 0;

        // For advance payment type IPCs, we always want to show the modal:
        // - In new mode: when there's eligible amount data available
        // - In edit mode: always (user needs to review/modify advance payment settings)
        const hasDataLoaded = isInEditMode
            ? formData.contractsDatasetId > 0 // Edit mode: data is loaded when contract ID is set
            : (formData.ipcSummaryData?.amount || 0) > 0 ||
              (formData.advancePayment || 0) > 0 ||
              (formData.advancePaymentAmountCumul || 0) > 0 ||
              (formData.advancePaymentPercentage || 0) > 0;

        if (isAdvanceType && hasDataLoaded && !advancePaymentAutoOpened) {
            setShowAdvancePaymentModal(true);
            setAdvancePaymentAutoOpened(true);
        }
    }, [formData, advancePaymentAutoOpened]);

    // Auto-open Retention Release Modal when IPC type is "RG / Retention"
    useEffect(() => {
        const isRetentionReleaseType = isRetentionType(formData.type);
        const isInEditMode = formData.id && formData.id > 0;

        // For retention release type IPCs, we always want to show the modal:
        // - In new mode: when there's cumulative data or retention data available
        // - In edit mode: always (user needs to review/modify retention release settings)
        const hasRetentionDataLoaded = isInEditMode
            ? formData.contractsDatasetId > 0 // Edit mode: data is loaded when contract ID is set
            : (formData.retentionAmountCumul || 0) > 0 ||
              (formData.retentionAmount || 0) > 0 ||
              (formData.retentionPercentage || 0) > 0 ||
              (formData.holdWarranty || 0) > 0;

        if (isRetentionReleaseType && hasRetentionDataLoaded && !retentionReleaseAutoOpened) {
            setShowRetentionReleaseModal(true);
            setRetentionReleaseAutoOpened(true);
        }
    }, [formData, retentionReleaseAutoOpened]);

    // Check if this is an advance payment type IPC (for showing the button)
    const isAdvanceType = isAdvancePaymentType(formData.type);

    // Check if this is a retention release type IPC (for showing the button)
    const isRetentionReleaseType = isRetentionType(formData.type);

    // Calculate BOQ total amount FIRST (sum of all building BOQ items' Pt = qty * unitPrice)
    const boqTotalAmount = useMemo(() => {
        const safeBuildings = formData.buildings || [];
        return safeBuildings.reduce((total, building) => {
            const buildingTotal = (building.boqsContract || []).reduce((bTotal, boq) => {
                return bTotal + (boq.qte * boq.unitPrice);
            }, 0);
            return total + buildingTotal;
        }, 0);
    }, [formData.buildings]);

    // Calculate individual VO amounts with their types
    const voAmounts = useMemo(() => {
        const safeVOs = (formData.vos || []) as Vos[];
        return safeVOs.map(vo => {
            const voTotal = vo.buildings.reduce((total, building) => {
                const buildingTotal = (building.boqs || []).reduce((bTotal, boq) => {
                    return bTotal + (boq.qte * boq.unitPrice);
                }, 0);
                return total + buildingTotal;
            }, 0);
            return {
                id: vo.id,
                voNumber: vo.voNumber,
                type: vo.type, // 'Addition' or 'Omission'
                amount: voTotal
            };
        });
    }, [formData.vos]);

    // Calculate full total (BOQ + all VOs) for percentage derivation
    const fullTotalAmount = useMemo(() => {
        let total = boqTotalAmount;
        voAmounts.forEach(vo => {
            if (vo.type?.toLowerCase() === 'addition') {
                total += vo.amount;
            } else if (vo.type?.toLowerCase() === 'omission') {
                total -= vo.amount;
            }
        });
        return Math.max(0, total);
    }, [boqTotalAmount, voAmounts]);

    // Get contract's advance payment eligible percentage
    // Priority: 1) Backend response, 2) Selected contract, 3) Derive from eligible amount
    const contractAdvancePayeePercent = useMemo(() => {
        // First try: get from backend's response (formData.subcontractorAdvancePayee - sent by OpenIpc)
        const fromBackend = formData.subcontractorAdvancePayee || 0;
        if (fromBackend > 0) return fromBackend;

        // Second try: get from selected contract (for new IPC mode)
        const fromContract = parseFloat((selectedContract as any)?.subcontractorAdvancePayee || '0');
        if (fromContract > 0) return fromContract;

        // Third try: get from formData.contractsDataset (fallback)
        const fromFormDataContract = parseFloat((formData as any).contractsDataset?.subcontractorAdvancePayee || '0');
        if (fromFormDataContract > 0) return fromFormDataContract;

        // Fourth try: DERIVE from backend's advancePayment / fullTotalAmount
        // This handles edit mode if percentage wasn't sent (fallback)
        const backendEligible = formData.advancePayment || 0;
        if (backendEligible > 0 && fullTotalAmount > 0) {
            const derived = (backendEligible / fullTotalAmount) * 100;
            // Round to reasonable precision
            return Math.round(derived * 100) / 100;
        }

        return 0;
    }, [selectedContract, formData, fullTotalAmount]);

    // Calculate selected total based on user selection
    const selectedTotalAmount = useMemo(() => {
        let total = 0;

        if (advancePaymentSelection === 'all') {
            // BOQ + all Addition VOs - Omission VOs
            total = boqTotalAmount;
            voAmounts.forEach(vo => {
                if (vo.type?.toLowerCase() === 'addition') {
                    total += vo.amount;
                } else if (vo.type?.toLowerCase() === 'omission') {
                    total -= vo.amount;
                }
            });
        } else if (advancePaymentSelection === 'boq') {
            // BOQ only
            total = boqTotalAmount;
        } else if (Array.isArray(advancePaymentSelection)) {
            // BOQ + selected VOs only
            total = boqTotalAmount;
            voAmounts.forEach(vo => {
                if (advancePaymentSelection.includes(vo.id)) {
                    if (vo.type?.toLowerCase() === 'addition') {
                        total += vo.amount;
                    } else if (vo.type?.toLowerCase() === 'omission') {
                        total -= vo.amount;
                    }
                }
            });
        }

        return Math.max(0, total);
    }, [advancePaymentSelection, boqTotalAmount, voAmounts]);

    // Calculate eligible amount based on selection and contract percentage
    const calculatedEligibleAmount = useMemo(() => {
        return selectedTotalAmount * (contractAdvancePayeePercent / 100);
    }, [selectedTotalAmount, contractAdvancePayeePercent]);

    // SYNC: Update formData.advancePayment when selection changes
    // This ensures the backend receives the correct eligible amount
    useEffect(() => {
        // Only update if we have valid calculated amount and it differs from current
        if (calculatedEligibleAmount > 0 && calculatedEligibleAmount !== formData.advancePayment) {
            // Calculate previousPaid correctly for edit mode
            // In edit mode: subtract this IPC's original amount from cumulative
            const isEditMode = formData.id && formData.id > 0;
            let adjustedPreviousPaid: number;

            if (isEditMode && originalCumulativeRef.captured) {
                // Edit mode: previous paid = original cumulative - original this IPC amount
                adjustedPreviousPaid = Math.max(0, originalCumulativeRef.cumulative - originalCumulativeRef.thisIpcAmount);
            } else {
                // New mode: use raw cumulative
                adjustedPreviousPaid = formData.advancePaymentAmountCumul || 0;
            }

            // Calculate the new remaining amount with the new eligible and correct previousPaid
            const newRemaining = Math.max(0, calculatedEligibleAmount - adjustedPreviousPaid);

            // Recalculate this IPC's amount based on new remaining
            const currentPercentage = formData.advancePaymentPercentage || 0;
            const newThisIpcAmount = (newRemaining * currentPercentage) / 100;

            setFormData({
                advancePayment: calculatedEligibleAmount,
                advancePaymentAmount: newThisIpcAmount
            });
        }
    }, [calculatedEligibleAmount, formData.advancePayment, formData.advancePaymentAmountCumul, formData.advancePaymentPercentage, formData.id, originalCumulativeRef, setFormData]);

    // Get advance payment data
    const summaryData = formData.ipcSummaryData;
    // For DISPLAY: use calculatedEligibleAmount directly for IMMEDIATE feedback when VO selection changes
    // The sync effect above updates formData.advancePayment for backend, but display needs to be instant
    const eligibleAmount = calculatedEligibleAmount > 0 ? calculatedEligibleAmount :
        (summaryData?.amount || formData.advancePayment || 0);

    // Calculate ACTUAL previous paid (paid in IPCs BEFORE this one)
    // In edit mode: cumulative includes this IPC's saved amount, so subtract it
    // In new mode: cumulative is from previous IPCs only
    const isInEditMode = formData.id && formData.id > 0;
    const rawCumulative = summaryData?.previousPaid || formData.advancePaymentAmountCumul || 0;

    // For edit mode, calculate what was paid BEFORE this IPC
    const previousPaid = useMemo(() => {
        if (isInEditMode && originalCumulativeRef.captured) {
            // Previous paid = original cumulative - original this IPC amount
            return Math.max(0, originalCumulativeRef.cumulative - originalCumulativeRef.thisIpcAmount);
        }
        // For new IPC or if not captured yet, use raw cumulative
        // (For new IPC, cumulative is what was paid in previous IPCs)
        return rawCumulative;
    }, [isInEditMode, originalCumulativeRef, rawCumulative]);

    // Remaining is what's left after all PREVIOUS IPCs (not including this one)
    const remainingAmount = Math.max(0, eligibleAmount - previousPaid);
    const advancePaymentPercentage = formData.advancePaymentPercentage || 0;
    // This IPC's amount = percentage of remaining
    const thisIpcAdvanceAmount = (remainingAmount * advancePaymentPercentage) / 100;
    // Show advance payment button if:
    // 1. It's an advance payment type IPC (always show for these)
    // 2. OR there's BOQ/VO data with contract advance percentage configured
    const hasAdvancePaymentData = isAdvanceType ||
        ((boqTotalAmount > 0 || voAmounts.length > 0) && contractAdvancePayeePercent > 0);

    // Handle advance payment percentage change
    const handleAdvancePaymentChange = (value: string) => {
        const numValue = parseFloat(value) || 0;
        const clampedValue = Math.max(0, Math.min(100, numValue));
        setFormData({
            advancePaymentPercentage: clampedValue,
            advancePaymentAmount: (remainingAmount * clampedValue) / 100
        });
    };

    // Handle VO selection toggle
    const handleVOSelectionToggle = (voId: number) => {
        if (advancePaymentSelection === 'all' || advancePaymentSelection === 'boq') {
            // Switch to specific selection mode with this VO
            setAdvancePaymentSelection([voId]);
        } else if (Array.isArray(advancePaymentSelection)) {
            if (advancePaymentSelection.includes(voId)) {
                // Remove this VO
                const newSelection = advancePaymentSelection.filter(id => id !== voId);
                setAdvancePaymentSelection(newSelection.length > 0 ? newSelection : 'boq');
            } else {
                // Add this VO
                setAdvancePaymentSelection([...advancePaymentSelection, voId]);
            }
        }
    };

    // Check if a VO is selected (for Advance Payment)
    const isVOSelected = (voId: number) => {
        if (advancePaymentSelection === 'all') return true;
        if (advancePaymentSelection === 'boq') return false;
        return Array.isArray(advancePaymentSelection) && advancePaymentSelection.includes(voId);
    };

    // ==================== Retention Release Calculations ====================
    // Retention Release is SIMPLE: release a percentage of ALREADY HELD retention
    // No VO selection needed - retention was already calculated on all BOQ + VOs during regular IPCs

    // Get contract's HoldWarranty percentage (for display only)
    const contractHoldWarrantyPercent = useMemo(() => {
        const fromBackend = formData.holdWarranty || 0;
        if (fromBackend > 0) return fromBackend;
        const fromContract = parseFloat((selectedContract as any)?.holdWarranty || '0');
        if (fromContract > 0) return fromContract;
        return 10; // Default 10%
    }, [selectedContract, formData.holdWarranty]);

    // Total Retention Held = formData.retention (calculated by backend during interim IPCs)
    // This is the total retention that has been held across all previous IPCs
    // It equals: (TotalBoqCum + Material - Deductions + AdditionVOs - OmissionVOs) × HoldWarranty%
    const totalRetentionHeld = formData.retention || 0;

    // Previously Released = what was released in prior RG IPCs
    // In edit mode: subtract this IPC's original amount from cumulative
    const previousRetentionReleased = useMemo(() => {
        if (isInEditMode && originalRetentionCumulativeRef.captured) {
            return Math.max(0, originalRetentionCumulativeRef.cumulative - originalRetentionCumulativeRef.thisIpcAmount);
        }
        return formData.retentionAmountCumul || 0;
    }, [isInEditMode, originalRetentionCumulativeRef, formData.retentionAmountCumul]);

    // Available to release = Total Held - Previously Released
    const remainingRetentionAmount = Math.max(0, totalRetentionHeld - previousRetentionReleased);

    // This IPC's retention release amount = Available × User's Percentage
    const retentionReleasePercentage = formData.retentionPercentage || 0;
    const thisIpcRetentionAmount = (remainingRetentionAmount * retentionReleasePercentage) / 100;

    // Show retention release button only for RG/Retention type IPCs
    const hasRetentionReleaseData = isRetentionReleaseType;

    // Handle retention percentage change
    const handleRetentionPercentageChange = (value: string) => {
        const numValue = parseFloat(value) || 0;
        const clampedValue = Math.max(0, Math.min(100, numValue));
        setFormData({
            retentionPercentage: clampedValue,
            retentionAmount: (remainingRetentionAmount * clampedValue) / 100
        });
    };

    // ==================== End Retention Release Calculations ====================

    const handleInputChange = (field: string, value: string | number) => {
        setFormData({ [field]: value });
    };

    // Handle penalty save from the penalty modal
    const handlePenaltySave = (penaltyData: { penalty: number; previousPenalty: number; reason: string }) => {
        setFormData({
            penalty: penaltyData.penalty,
            previousPenalty: penaltyData.previousPenalty,
            penaltyReason: penaltyData.reason,
        });
        setShowPenaltyModal(false);
        toaster.success("Penalty information updated");
    };

    // Handle quantity input change - updates percentage and amounts automatically
    // No restrictions - allows free input
    const handleBOQQuantityChange = (buildingId: number, boqId: number, actualQte: number) => {
        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqsContract?.find(b => b.id === boqId);

        if (!boqItem) return;

        // Allow any value >= 0
        const validatedQte = Math.max(0, actualQte);
        updateBOQItem(buildingId, boqId, validatedQte);
    };

    // Handle CUMULATIVE percentage input - calculates actual qty from cumulative target
    const handleBOQCumulPercentChange = (buildingId: number, boqId: number, cumulPercent: number) => {
        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqsContract?.find(b => b.id === boqId);

        if (!boqItem || boqItem.qte === 0) return;

        // Convert cumulative percentage to cumulative quantity
        const cumulQte = (cumulPercent / 100) * boqItem.qte;
        const precedQte = boqItem.precedQte || 0;

        // Calculate actual qty = cumul qty - previous qty
        const actualQte = Math.max(0, cumulQte - precedQte);

        updateBOQItem(buildingId, boqId, actualQte);
    };

    // Handle cumulative quantity input change - calculates actual qty by subtracting previous
    // No restrictions - allows free input
    const handleBOQCumulQtyChange = (buildingId: number, boqId: number, cumulQte: number) => {
        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqsContract?.find(b => b.id === boqId);

        if (!boqItem) return;

        const precedQte = boqItem.precedQte || 0;
        // Calculate actual qty = cumulative - previous (allow any value >= 0)
        const actualQte = Math.max(0, cumulQte - precedQte);

        updateBOQItem(buildingId, boqId, actualQte);
    };

    // Shared function to update BOQ item with calculated values
    // Also auto-syncs deduction percentage to match progress (SAM-Desktop behavior)
    const updateBOQItem = (buildingId: number, boqId: number, validatedQte: number) => {
        const safeBuildings = formData.buildings || [];

        setFormData({
            buildings: safeBuildings.map(building => {
                if (building.id === buildingId) {
                    return {
                        ...building,
                        boqsContract: (building.boqsContract || []).map(boq => {
                            if (boq.id === boqId) {
                                const actualAmount = validatedQte * boq.unitPrice;
                                const newCumulQte = (boq.precedQte || 0) + validatedQte;
                                const newCumulAmount = newCumulQte * boq.unitPrice;
                                const newCumulPercent = boq.qte === 0 ? 0 : (newCumulQte / boq.qte) * 100;

                                // SAM-Desktop behavior: Auto-sync deduction % to match progress %
                                // If deduction % is less than or equal to the new progress %, update it
                                // This ensures deduction is always >= cumulative progress
                                const currentDeductionPercent = boq.cumulDeductionPercentage || 0;
                                let newDeductionPercent = currentDeductionPercent;
                                let newDeductionValue = boq.cumulDeductionValue || 0;

                                if (currentDeductionPercent <= newCumulPercent) {
                                    newDeductionPercent = Math.min(newCumulPercent, 100); // Cap at 100%
                                    // Recalculate deduction value based on material value
                                    newDeductionValue = (newDeductionPercent / 100) * (boq.cumulMaterialValue || 0);
                                }

                                return {
                                    ...boq,
                                    actualQte: validatedQte,
                                    actualAmount,
                                    cumulQte: newCumulQte,
                                    cumulAmount: newCumulAmount,
                                    cumulPercent: newCumulPercent,
                                    // Auto-synced deduction values
                                    cumulDeductionPercentage: newDeductionPercent,
                                    cumulDeductionValue: newDeductionValue,
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

    // Handle VO quantity input change - no restrictions
    const handleVOBOQQuantityChange = (voId: number, buildingId: number, boqId: number, actualQte: number) => {
        const vos = (formData.vos || []) as Vos[];
        const vo = vos.find(v => v.id === voId);
        const building = vo?.buildings.find(b => b.id === buildingId);
        const boqItem = building?.boqs.find(b => b.id === boqId);

        if (!boqItem) return;

        const validatedQte = Math.max(0, actualQte);
        updateVOBOQItem(voId, buildingId, boqId, validatedQte);
    };

    // Handle VO CUMULATIVE percentage input - calculates actual qty from cumulative target
    const handleVOBOQCumulPercentChange = (voId: number, buildingId: number, boqId: number, cumulPercent: number) => {
        const vos = (formData.vos || []) as Vos[];
        const vo = vos.find(v => v.id === voId);
        const building = vo?.buildings.find(b => b.id === buildingId);
        const boqItem = building?.boqs.find(b => b.id === boqId);

        if (!boqItem || boqItem.qte === 0) return;

        // Convert cumulative percentage to cumulative quantity
        const cumulQte = (cumulPercent / 100) * boqItem.qte;
        const precedQte = boqItem.precedQte || 0;
        const actualQte = Math.max(0, cumulQte - precedQte);

        updateVOBOQItem(voId, buildingId, boqId, actualQte);
    };

    // Handle VO cumulative quantity input change - no restrictions
    const handleVOBOQCumulQtyChange = (voId: number, buildingId: number, boqId: number, cumulQte: number) => {
        const vos = (formData.vos || []) as Vos[];
        const vo = vos.find(v => v.id === voId);
        const building = vo?.buildings.find(b => b.id === buildingId);
        const boqItem = building?.boqs.find(b => b.id === boqId);

        if (!boqItem) return;

        const precedQte = boqItem.precedQte || 0;
        const actualQte = Math.max(0, cumulQte - precedQte);

        updateVOBOQItem(voId, buildingId, boqId, actualQte);
    };

    // Shared function to update VO BOQ item with calculated values
    const updateVOBOQItem = (voId: number, buildingId: number, boqId: number, validatedQte: number) => {
        const vos = (formData.vos || []) as Vos[];

        setFormData({
            vos: vos.map(v => {
                if (v.id === voId) {
                    return {
                        ...v,
                        buildings: v.buildings.map(b => {
                            if (b.id === buildingId) {
                                return {
                                    ...b,
                                    boqs: b.boqs.map(boq => {
                                        if (boq.id === boqId) {
                                            const precedQte = boq.precedQte || 0;
                                            const unitPrice = boq.unitPrice;
                                            const actualAmount = validatedQte * unitPrice;
                                            const newCumulQte = precedQte + validatedQte;
                                            const newCumulAmount = newCumulQte * unitPrice;
                                            const newCumulPercent = boq.qte === 0 ? 0 : (newCumulQte / boq.qte) * 100;

                                            return {
                                                ...boq,
                                                actualQte: validatedQte,
                                                actualAmount,
                                                cumulQte: newCumulQte,
                                                cumulAmount: newCumulAmount,
                                                cumulPercent: newCumulPercent,
                                                precedQte: precedQte,
                                            };
                                        }
                                        return boq;
                                    })
                                };
                            }
                            return b;
                        })
                    };
                }
                return v;
            })
        });
    };

    // ==================== Pending Input Helpers (blur-based validation) ====================

    /**
     * Get a pending input key for contract BOQ items
     */
    const getContractInputKey = (buildingId: number, boqId: number, field: 'actualQty' | 'cumulQty' | 'cumulPercent' | 'materialPercent' | 'deductionPercent') =>
        `contract-${buildingId}-${boqId}-${field}`;

    /**
     * Get a pending input key for VO BOQ items
     */
    const getVOInputKey = (voId: number, buildingId: number, boqId: number, field: 'actualQty' | 'cumulQty' | 'cumulPercent') =>
        `vo-${voId}-${buildingId}-${boqId}-${field}`;

    /**
     * Handle input change - stores value in pending state without validation
     */
    const handlePendingInputChange = (key: string, value: string) => {
        setPendingInputs(prev => ({ ...prev, [key]: value }));
    };

    /**
     * Clear a pending input when editing is complete
     */
    const clearPendingInput = (key: string) => {
        setPendingInputs(prev => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
    };

    /**
     * Validate and apply cumulative percentage on blur
     * Shows toast and reverts to minimum if value is below allowed minimum
     */
    const handleCumulPercentBlur = (buildingId: number, boqId: number) => {
        const key = getContractInputKey(buildingId, boqId, 'cumulPercent');
        const pendingValue = pendingInputs[key];

        if (pendingValue === undefined) return; // No pending change

        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqsContract?.find(b => b.id === boqId);

        if (!boqItem || boqItem.qte === 0) {
            clearPendingInput(key);
            return;
        }

        const inputPercent = parseFloat(pendingValue) || 0;
        const precedQte = boqItem.precedQte || 0;
        const minPercent = (precedQte / boqItem.qte) * 100;

        if (inputPercent < minPercent) {
            toaster.error(`Cumulative % cannot be less than ${minPercent.toFixed(1)}% (previous progress). Reverted to minimum.`);
            // Apply minimum value
            handleBOQCumulPercentChange(buildingId, boqId, minPercent);
        } else {
            // Apply the valid value
            handleBOQCumulPercentChange(buildingId, boqId, inputPercent);
        }

        clearPendingInput(key);
    };

    /**
     * Validate and apply cumulative quantity on blur
     */
    const handleCumulQtyBlur = (buildingId: number, boqId: number) => {
        const key = getContractInputKey(buildingId, boqId, 'cumulQty');
        const pendingValue = pendingInputs[key];

        if (pendingValue === undefined) return;

        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqsContract?.find(b => b.id === boqId);

        if (!boqItem) {
            clearPendingInput(key);
            return;
        }

        const inputQty = parseFloat(pendingValue) || 0;
        const precedQte = boqItem.precedQte || 0;

        if (inputQty < precedQte) {
            toaster.error(`Cumulative Qty cannot be less than ${precedQte} (previous progress). Reverted to minimum.`);
            handleBOQCumulQtyChange(buildingId, boqId, precedQte);
        } else {
            handleBOQCumulQtyChange(buildingId, boqId, inputQty);
        }

        clearPendingInput(key);
    };

    /**
     * Validate and apply material supply percentage on blur
     * Material % cannot exceed contract's MaterialSupply limit
     * SAM-Desktop behavior: Reset to 0 if exceeds limit (not clamp to max)
     */
    const handleMaterialPercentBlur = (buildingId: number, boqId: number) => {
        const key = getContractInputKey(buildingId, boqId, 'materialPercent');
        const pendingValue = pendingInputs[key];

        if (pendingValue === undefined) return;

        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqsContract?.find(b => b.id === boqId);

        if (!boqItem) {
            clearPendingInput(key);
            return;
        }

        const inputPercent = parseFloat(pendingValue) || 0;
        const maxMaterialSupply = formData.materialSupply || 0;

        // SAM-Desktop behavior: Reset to 0 if exceeds limit (not clamp to max)
        if (inputPercent > maxMaterialSupply) {
            toaster.error(`Material Supply % cannot exceed contract limit of ${maxMaterialSupply}%. Reset to 0.`);
            handleBOQMaterialPercentChange(buildingId, boqId, 0);
        } else if (inputPercent < 0) {
            handleBOQMaterialPercentChange(buildingId, boqId, 0);
        } else {
            handleBOQMaterialPercentChange(buildingId, boqId, inputPercent);
        }

        clearPendingInput(key);
    };

    /**
     * Update BOQ item's material supply percentage and recalculate values
     */
    const handleBOQMaterialPercentChange = (buildingId: number, boqId: number, cumulMaterialPercentage: number) => {
        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqsContract?.find(b => b.id === boqId);

        if (!boqItem) return;

        const totalAmount = boqItem.qte * boqItem.unitPrice;
        const cumulMaterialValue = (cumulMaterialPercentage / 100) * totalAmount;

        setFormData({
            buildings: safeBuildings.map(b =>
                b.id === buildingId
                    ? {
                        ...b,
                        boqsContract: (b.boqsContract || []).map(boq =>
                            boq.id === boqId
                                ? {
                                    ...boq,
                                    cumulMaterialPercentage,
                                    cumulMaterialValue,
                                    // Recalculate deduction value when material value changes
                                    cumulDeductionValue: ((boq.cumulDeductionPercentage || 0) / 100) * cumulMaterialValue,
                                }
                                : boq
                        ),
                    }
                    : b
            ),
        });
    };

    /**
     * Validate and apply deduction percentage on blur
     * Deduction % should default to cumulative progress % (like SAM-Desktop)
     */
    const handleDeductionPercentBlur = (buildingId: number, boqId: number) => {
        const key = getContractInputKey(buildingId, boqId, 'deductionPercent');
        const pendingValue = pendingInputs[key];

        if (pendingValue === undefined) return;

        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqsContract?.find(b => b.id === boqId);

        if (!boqItem) {
            clearPendingInput(key);
            return;
        }

        const inputPercent = parseFloat(pendingValue) || 0;

        // Validate: cannot exceed 100%
        if (inputPercent > 100) {
            toaster.error(`Deduction % cannot exceed 100%. Reverted to maximum.`);
            handleBOQDeductionPercentChange(buildingId, boqId, 100);
        } else if (inputPercent < 0) {
            handleBOQDeductionPercentChange(buildingId, boqId, 0);
        } else {
            handleBOQDeductionPercentChange(buildingId, boqId, inputPercent);
        }

        clearPendingInput(key);
    };

    /**
     * Update BOQ item's deduction percentage and recalculate values
     */
    const handleBOQDeductionPercentChange = (buildingId: number, boqId: number, cumulDeductionPercentage: number) => {
        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqsContract?.find(b => b.id === boqId);

        if (!boqItem) return;

        const cumulDeductionValue = (cumulDeductionPercentage / 100) * (boqItem.cumulMaterialValue || 0);

        setFormData({
            buildings: safeBuildings.map(b =>
                b.id === buildingId
                    ? {
                        ...b,
                        boqsContract: (b.boqsContract || []).map(boq =>
                            boq.id === boqId
                                ? {
                                    ...boq,
                                    cumulDeductionPercentage,
                                    cumulDeductionValue,
                                }
                                : boq
                        ),
                    }
                    : b
            ),
        });
    };

    /**
     * Validate and apply VO cumulative percentage on blur
     */
    const handleVOCumulPercentBlur = (voId: number, buildingId: number, boqId: number) => {
        const key = getVOInputKey(voId, buildingId, boqId, 'cumulPercent');
        const pendingValue = pendingInputs[key];

        if (pendingValue === undefined) return;

        const vos = (formData.vos || []) as Vos[];
        const vo = vos.find(v => v.id === voId);
        const building = vo?.buildings.find(b => b.id === buildingId);
        const boqItem = building?.boqs.find(b => b.id === boqId);

        if (!boqItem || boqItem.qte === 0) {
            clearPendingInput(key);
            return;
        }

        const inputPercent = parseFloat(pendingValue) || 0;
        const precedQte = boqItem.precedQte || 0;
        const minPercent = (precedQte / boqItem.qte) * 100;

        if (inputPercent < minPercent) {
            toaster.error(`Cumulative % cannot be less than ${minPercent.toFixed(1)}% (previous progress). Reverted to minimum.`);
            handleVOBOQCumulPercentChange(voId, buildingId, boqId, minPercent);
        } else {
            handleVOBOQCumulPercentChange(voId, buildingId, boqId, inputPercent);
        }

        clearPendingInput(key);
    };

    /**
     * Validate and apply VO cumulative quantity on blur
     */
    const handleVOCumulQtyBlur = (voId: number, buildingId: number, boqId: number) => {
        const key = getVOInputKey(voId, buildingId, boqId, 'cumulQty');
        const pendingValue = pendingInputs[key];

        if (pendingValue === undefined) return;

        const vos = (formData.vos || []) as Vos[];
        const vo = vos.find(v => v.id === voId);
        const building = vo?.buildings.find(b => b.id === buildingId);
        const boqItem = building?.boqs.find(b => b.id === boqId);

        if (!boqItem) {
            clearPendingInput(key);
            return;
        }

        const inputQty = parseFloat(pendingValue) || 0;
        const precedQte = boqItem.precedQte || 0;

        if (inputQty < precedQte) {
            toaster.error(`Cumulative Qty cannot be less than ${precedQte} (previous progress). Reverted to minimum.`);
            handleVOBOQCumulQtyChange(voId, buildingId, boqId, precedQte);
        } else {
            handleVOBOQCumulQtyChange(voId, buildingId, boqId, inputQty);
        }

        clearPendingInput(key);
    };

    // ==================== Previous Value Correction Functions ====================

    /**
     * Open the correction modal for a BOQ or VO item.
     * This allows authorized users (CM, QS, Admin) to correct PrecedQte values.
     */
    const openCorrectionModal = (
        entityType: CorrectionEntityType,
        entityId: number,
        currentValue: number,
        entityDescription: string
    ) => {
        const isEditMode = formData.id && formData.id > 0;
        const contractDatasetId = selectedContract?.id || (formData as any).contractsDatasetId;
        if (!contractDatasetId) {
            toaster.error("Contract dataset ID not found");
            return;
        }
        setCorrectionModal({
            isOpen: true,
            entityType,
            entityId,
            // In NEW IPC mode, "Prev Qty" represents the last saved cumulative (CumulQte) from the previous IPC.
            // In EDIT IPC mode, "Prev Qty" is the stored PrecedQte for the edited period.
            fieldName: isEditMode ? 'PrecedQte' : 'CumulQte',
            fieldLabel: 'Previous Quantity',
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

        if (request.entityType === CorrectionEntityType.ContractBoqItem) {
            // Update BOQ item in local state
            const safeBuildings = formData.buildings || [];
            const updatedBuildings = safeBuildings.map(building => ({
                ...building,
                boqsContract: (building.boqsContract || []).map(boq => {
                    if (boq.id === request.entityId) {
                        const actualQte = boq.actualQte || 0;
                        const newPrecedQte = request.newValue;
                        const newCumulQte =
                            request.fieldName === 'CumulQte'
                                ? (request.newValue + actualQte)
                                : (newPrecedQte + actualQte);
                        const newCumulPercent = boq.qte === 0 ? 0 : (newCumulQte / boq.qte) * 100;
                        return {
                            ...boq,
                            precedQte: newPrecedQte,
                            cumulQte: newCumulQte,
                            cumulAmount: newCumulQte * boq.unitPrice,
                            cumulPercent: newCumulPercent,
                        };
                    }
                    return boq;
                })
            }));
            setFormData({ buildings: updatedBuildings });
        } else if (request.entityType === CorrectionEntityType.ContractVo) {
            // Update VO item in local state
            const vos = (formData.vos || []) as Vos[];
            const updatedVos = vos.map(vo => ({
                ...vo,
                buildings: vo.buildings.map(building => ({
                    ...building,
                    boqs: building.boqs.map(boq => {
                        if (boq.id === request.entityId) {
                            const actualQte = boq.actualQte || 0;
                            const newPrecedQte = request.newValue;
                            const newCumulQte =
                                request.fieldName === 'CumulQte'
                                    ? (request.newValue + actualQte)
                                    : (newPrecedQte + actualQte);
                            const newCumulPercent = boq.qte === 0 ? 0 : (newCumulQte / boq.qte) * 100;
                            return {
                                ...boq,
                                precedQte: newPrecedQte,
                                cumulQte: newCumulQte,
                                cumulAmount: newCumulQte * boq.unitPrice,
                                cumulPercent: newCumulPercent,
                            };
                        }
                        return boq;
                    })
                }))
            }));
            setFormData({ vos: updatedVos });
        }

        toaster.success("Previous value corrected successfully. Audit record created.");
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

    // ==================== Excel Export/Import Functions ====================

    // Export BOQ progress to Excel for the active building
    const handleExportBOQ = async () => {
        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === activeBuildingId);

        if (!building || !building.boqsContract?.length) {
            toaster.error("No BOQ data to export");
            return;
        }

        // Prepare data for Excel - columns match the table structure
        const exportData = building.boqsContract.map(boq => {
            const precedQte = boq.precedQte || 0;
            const actualQte = boq.actualQte || 0;
            const cumulQte = precedQte + actualQte;
            const cumulPercent = boq.qte === 0 ? 0 : (cumulQte / boq.qte) * 100;

            return {
                "N°": boq.no,
                "Item": boq.key,
                "Unit": boq.unite,
                "Contract Qty": boq.qte,
                "Unit Price": boq.unitPrice,
                "Total Amt": boq.qte * boq.unitPrice,
                "Prev Qty": precedQte,
                "Actual Qty": actualQte,  // EDITABLE
                "Cumul Qty": cumulQte,    // EDITABLE
                "Cumul %": Math.round(cumulPercent * 100) / 100,  // EDITABLE
                "Prev Amt": precedQte * boq.unitPrice,
                "Actual Amt": actualQte * boq.unitPrice,
                "Cumul Amt": cumulQte * boq.unitPrice,
            };
        });

        // Create workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("BOQ Progress");

        // Add headers
        worksheet.addRow(Object.keys(exportData[0]));

        // Add data rows
        exportData.forEach(row => {
            worksheet.addRow(Object.values(row));
        });

        // Set column widths
        worksheet.columns = [
            { key: 'no', width: 8 },
            { key: 'item', width: 40 },
            { key: 'unit', width: 8 },
            { key: 'contractQty', width: 12 },
            { key: 'unitPrice', width: 12 },
            { key: 'totalAmt', width: 14 },
            { key: 'prevQty', width: 10 },
            { key: 'actualQty', width: 12 },
            { key: 'cumulQty', width: 12 },
            { key: 'cumulPercent', width: 10 },
            { key: 'prevAmt', width: 14 },
            { key: 'actualAmt', width: 14 },
            { key: 'cumulAmt', width: 14 },
        ];

        // Generate filename with building name and date
        const buildingName = building.buildingName?.replace(/[^a-zA-Z0-9]/g, "_") || `Building_${building.id}`;
        const dateStr = new Date().toISOString().split("T")[0];
        const filename = `IPC_BOQ_${buildingName}_${dateStr}.xlsx`;

        // Download the file
        try {
            const buffer = await workbook.xlsx.writeBuffer();
            downloadXlsx(buffer, filename);
            toaster.success(`BOQ exported: ${filename}`);
        } catch (error) {
            console.error("Export error:", error);
            toaster.error("Failed to save Excel file. Check browser permissions.");
        }
    };

    // Import BOQ progress from Excel file
    const handleImportBOQ = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(arrayBuffer);

                // Get first sheet
                const worksheet = workbook.worksheets[0];
                if (!worksheet) {
                    toaster.error("Excel file has no sheets");
                    return;
                }

                // Convert to JSON-like array using headers from the first row
                const headerRow = worksheet.getRow(1);
                const headers = (headerRow.values as any[]).slice(1).map(h => String(h ?? "").trim());

                const jsonData: Record<string, unknown>[] = [];
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber === 1) return; // skip header
                    const rowObj: Record<string, unknown> = {};
                    headers.forEach((key, idx) => {
                        const cell = row.getCell(idx + 1);
                        rowObj[key] = cellValueToPrimitive(cell.value as ExcelJS.CellValue);
                    });
                    const allEmpty = Object.values(rowObj).every(v => v === "" || v === null || v === undefined);
                    if (!allEmpty) jsonData.push(rowObj);
                });

                if (!jsonData.length) {
                    toaster.error("Excel file is empty");
                    return;
                }

                // Get current building
                const safeBuildings = formData.buildings || [];
                const buildingIndex = safeBuildings.findIndex(b => b.id === activeBuildingId);

                if (buildingIndex === -1) {
                    toaster.error("No active building selected");
                    return;
                }

                const building = safeBuildings[buildingIndex];
                let updatedCount = 0;
                let skippedCount = 0;

                // Update BOQ items based on imported data
                const updatedBoqs = (building.boqsContract || []).map((boq, index) => {
                    // Find matching row by N° and Item (key) - must match both for safety
                    const matchingRow = jsonData.find((row: Record<string, unknown>, rowIndex: number) => {
                        const rowNo = String(row["N°"] || "").trim();
                        const rowItem = String(row["Item"] || "").trim();
                        const boqNo = String(boq.no || "").trim();
                        const boqKey = String(boq.key || "").trim();

                        // Match by N° and Item name, OR by row position if N° matches
                        return (rowNo === boqNo && rowItem === boqKey) ||
                               (rowNo === boqNo && rowIndex === index);
                    });

                    if (!matchingRow) {
                        skippedCount++;
                        return boq;
                    }

                    // Skip header rows - don't allow updates to rows with qte=0 and unitPrice=0
                    if (boq.qte === 0 && boq.unitPrice === 0) {
                        return boq;
                    }

                    // Only read editable columns: Actual Qty, Cumul Qty, or Cumul %
                    const importedActualQty = parseFloat(String(matchingRow["Actual Qty"] || "0")) || 0;
                    const importedCumulQty = parseFloat(String(matchingRow["Cumul Qty"] || "0")) || 0;
                    const importedCumulPercent = parseFloat(String(matchingRow["Cumul %"] || "0")) || 0;

                    const precedQte = boq.precedQte || 0;

                    // Calculate what cumul values SHOULD be based on imported Actual Qty
                    // This allows us to detect which field was edited by checking consistency
                    const expectedCumulFromActual = precedQte + importedActualQty;
                    const expectedPercentFromActual = boq.qte === 0 ? 0 : (expectedCumulFromActual / boq.qte) * 100;

                    // Detect which field was edited by checking consistency between imported values
                    let finalActualQte: number;

                    // If Cumul Qty is inconsistent with Actual Qty, user edited Cumul Qty
                    if (Math.abs(importedCumulQty - expectedCumulFromActual) > 0.001) {
                        finalActualQte = Math.max(0, importedCumulQty - precedQte);
                    }
                    // If Cumul % is inconsistent with Actual Qty, user edited Cumul %
                    else if (Math.abs(importedCumulPercent - expectedPercentFromActual) > 0.1 && boq.qte > 0) {
                        const cumulQtyFromPercent = (importedCumulPercent / 100) * boq.qte;
                        finalActualQte = Math.max(0, cumulQtyFromPercent - precedQte);
                    }
                    // All values are consistent, use Actual Qty directly
                    else {
                        finalActualQte = Math.max(0, importedActualQty);
                    }

                    // Calculate all derived values
                    const actualAmount = finalActualQte * boq.unitPrice;
                    const newCumulQte = precedQte + finalActualQte;
                    const newCumulAmount = newCumulQte * boq.unitPrice;
                    const newCumulPercent = boq.qte === 0 ? 0 : (newCumulQte / boq.qte) * 100;

                    updatedCount++;

                    return {
                        ...boq,
                        actualQte: finalActualQte,
                        actualAmount,
                        cumulQte: newCumulQte,
                        cumulAmount: newCumulAmount,
                        cumulPercent: newCumulPercent,
                    };
                });

                // Update state with new BOQ values
                setFormData({
                    buildings: safeBuildings.map((b, i) =>
                        i === buildingIndex
                            ? { ...b, boqsContract: updatedBoqs }
                            : b
                    )
                });

                toaster.success(`Imported ${updatedCount} items (${skippedCount} skipped)`);

            } catch (error) {
                console.error("Import error:", error);
                const errorMsg = error instanceof Error ? error.message : "Unknown error";
                toaster.error(`Failed to import: ${errorMsg}`);
            }
        };

        reader.readAsArrayBuffer(file);

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // ==================== End Excel Functions ====================

    // Derived state - must be before useMemo hooks for consistency
    const safeBuildings = useMemo(() => formData.buildings || [], [formData.buildings]);
    const safeVOs = useMemo(() => (formData.vos || []) as Vos[], [formData.vos]);
    const activeBuilding = useMemo(() => safeBuildings.find(b => b.id === activeBuildingId), [safeBuildings, activeBuildingId]);
    const activeVO = useMemo(() => safeVOs.find(v => v.id === activeVOId), [safeVOs, activeVOId]);
    const activeVOBuilding = useMemo(() => activeVO?.buildings.find(b => b.id === activeVOBuildingId), [activeVO, activeVOBuildingId]);

    // Calculate totals for active building (memoized for performance) - must be before early return
    const activeBuildingTotal = useMemo(() => {
        return activeBuilding
            ? (activeBuilding.boqsContract || []).reduce((sum, boq) => sum + (boq.actualAmount || 0), 0)
            : 0;
    }, [activeBuilding]);

    const activeVOBuildingTotal = useMemo(() => {
        return activeVOBuilding
            ? (activeVOBuilding.boqs || []).reduce((sum, boq) => sum + ((boq.actualQte || 0) * boq.unitPrice), 0)
            : 0;
    }, [activeVOBuilding]);

    // Memoized table totals for contract BOQs
    const contractBOQContractTotal = useMemo(() => {
        return activeBuilding
            ? (activeBuilding.boqsContract || []).reduce((sum, boq) => sum + (boq.qte * boq.unitPrice), 0)
            : 0;
    }, [activeBuilding]);

    const contractBOQPrecedTotal = useMemo(() => {
        return activeBuilding
            ? (activeBuilding.boqsContract || []).reduce((sum, boq) => sum + ((boq.precedQte || 0) * boq.unitPrice), 0)
            : 0;
    }, [activeBuilding]);

    const contractBOQCumulTotal = useMemo(() => {
        return activeBuilding
            ? (activeBuilding.boqsContract || []).reduce((sum, boq) => sum + (((boq.precedQte || 0) + (boq.actualQte || 0)) * boq.unitPrice), 0)
            : 0;
    }, [activeBuilding]);

    // Memoized table totals for VO BOQs
    const voBOQContractTotal = useMemo(() => {
        return activeVOBuilding
            ? (activeVOBuilding.boqs || []).reduce((sum, boq) => sum + (boq.qte * boq.unitPrice), 0)
            : 0;
    }, [activeVOBuilding]);

    const voBOQPrecedTotal = useMemo(() => {
        return activeVOBuilding
            ? (activeVOBuilding.boqs || []).reduce((sum, boq) => sum + ((boq.precedQte || 0) * boq.unitPrice), 0)
            : 0;
    }, [activeVOBuilding]);

    const voBOQCumulTotal = useMemo(() => {
        return activeVOBuilding
            ? (activeVOBuilding.boqs || []).reduce((sum, boq) => sum + (((boq.precedQte || 0) + (boq.actualQte || 0)) * boq.unitPrice), 0)
            : 0;
    }, [activeVOBuilding]);

    // ==================== Spreadsheet Column Definitions ====================

    /**
     * Contract BOQ Spreadsheet columns - using the new Spreadsheet component
     * Editable columns: actualQte, cumulQte, cumulPercent, cumulMaterialPercentage, cumulDeductionPercentage
     */
    const contractBOQColumns = useMemo((): SpreadsheetColumn<BoqIpcVM>[] => [
        {
            key: "no",
            label: "N°",
            width: 70,
            align: "center",
            sortable: true,
            filterable: true,
            render: (value: string) => <span className="font-mono text-xs">{value || ''}</span>
        },
        {
            key: "key",
            label: "Item",
            width: 200,
            align: "left",
            sortable: true,
            filterable: true,
            render: (value: string) => (
                <div className="truncate text-xs" title={value || ''}>{value || ''}</div>
            )
        },
        {
            key: "unite",
            label: "Unit",
            width: 70,
            align: "center",
            sortable: true,
            filterable: true,
            render: (value: string) => <span className="text-xs">{value || ''}</span>
        },
        {
            key: "qte",
            label: "Contract Qty",
            width: 100,
            align: "right",
            sortable: true,
            render: (value: number) => <span className="text-xs font-medium">{value ? formatQuantity(value) : ''}</span>
        },
        {
            key: "unitPrice",
            label: "Unit Price",
            width: 100,
            align: "right",
            sortable: true,
            render: (value: number) => <span className="text-xs">{formatCurrency(value)}</span>
        },
        {
            key: "totalAmount",
            label: "Total Amt",
            width: 110,
            align: "right",
            sortable: true,
            render: (_value: number, row: BoqIpcVM) => (
                <span className="text-xs font-medium">{formatCurrency((row.qte || 0) * (row.unitPrice || 0))}</span>
            )
        },
        {
            key: "precedQte",
            label: "Prev Qty",
            width: 90,
            align: "right",
            sortable: true,
            render: (value: number, row: BoqIpcVM) => {
                const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
                return (
                    <div className="flex items-center justify-end gap-1 text-xs">
                        <span>{value ? formatQuantity(value) : ''}</span>
                        {canCorrectPreviousValues && !isHeaderRow && row.id && activeBuilding && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openCorrectionModal(
                                        CorrectionEntityType.ContractBoqItem,
                                        row.id,
                                        value || 0,
                                        `${row.no || ''} - ${row.key || 'BOQ Item'}`
                                    );
                                }}
                                className="btn btn-ghost btn-xs p-0 min-h-0 h-4 w-4"
                                title="Correct previous quantity (audit trail)"
                            >
                                <Icon icon={pencilIcon} className="text-amber-500 size-3" />
                            </button>
                        )}
                    </div>
                );
            }
        },
        {
            key: "actualQte",
            label: "Actual Qty",
            width: 100,
            align: "right",
            editable: true,
            type: "number",
            sortable: true,
            render: (value: number, row: BoqIpcVM) => {
                const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
                if (isHeaderRow) return <span className="text-xs text-base-content/30">-</span>;
                return <span className="text-xs">{value ? formatQuantity(value) : ''}</span>;
            }
        },
        {
            key: "cumulQte",
            label: "Cumul Qty",
            width: 100,
            align: "right",
            editable: true,
            type: "number",
            sortable: true,
            render: (_value: number, row: BoqIpcVM) => {
                const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
                if (isHeaderRow) return <span className="text-xs text-base-content/30">-</span>;
                const cumulQte = (row.precedQte || 0) + (row.actualQte || 0);
                return <span className="text-xs">{cumulQte ? formatQuantity(cumulQte) : ''}</span>;
            }
        },
        {
            key: "cumulPercent",
            label: "Cumul %",
            width: 85,
            align: "right",
            editable: true,
            type: "number",
            sortable: true,
            render: (_value: number, row: BoqIpcVM) => {
                const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
                if (isHeaderRow || row.qte === 0) return <span className="text-xs text-base-content/30">-</span>;
                const cumulQte = (row.precedQte || 0) + (row.actualQte || 0);
                const cumulPercent = (cumulQte / row.qte) * 100;
                return <span className="text-xs">{Math.round(cumulPercent * 100) / 100}%</span>;
            }
        },
        {
            key: "precedAmount",
            label: "Prev Amt",
            width: 100,
            align: "right",
            sortable: true,
            render: (_value: number, row: BoqIpcVM) => (
                <span className="text-xs">{formatCurrency((row.precedQte || 0) * (row.unitPrice || 0))}</span>
            )
        },
        {
            key: "actualAmount",
            label: "Actual Amt",
            width: 100,
            align: "right",
            sortable: true,
            render: (_value: number, row: BoqIpcVM) => (
                <span className="text-xs font-semibold text-green-600">{formatCurrency((row.actualQte || 0) * (row.unitPrice || 0))}</span>
            )
        },
        {
            key: "cumulAmount",
            label: "Cumul Amt",
            width: 100,
            align: "right",
            sortable: true,
            render: (_value: number, row: BoqIpcVM) => {
                const cumulQte = (row.precedQte || 0) + (row.actualQte || 0);
                return <span className="text-xs font-medium">{formatCurrency(cumulQte * (row.unitPrice || 0))}</span>;
            }
        },
        {
            key: "cumulMaterialPercentage",
            label: "Mat. Supply",
            width: 100,
            align: "right",
            editable: true,
            type: "number",
            sortable: true,
            render: (value: number, row: BoqIpcVM) => {
                const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
                if (isHeaderRow) return <span className="text-xs text-base-content/30">-</span>;
                return <span className="text-xs">{value ? `${formatQuantity(value)}%` : ''}</span>;
            }
        },
        {
            key: "cumulDeductionPercentage",
            label: "Deduction",
            width: 95,
            align: "right",
            editable: true,
            type: "number",
            sortable: true,
            render: (value: number, row: BoqIpcVM) => {
                const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
                if (isHeaderRow) return <span className="text-xs text-base-content/30">-</span>;
                return <span className="text-xs">{value ? `${formatQuantity(value)}%` : ''}</span>;
            }
        }
    ], [canCorrectPreviousValues, activeBuilding]);

    /**
     * VO BOQ Spreadsheet columns
     */
    const voBOQColumns = useMemo((): SpreadsheetColumn<VOBoqIpcVM>[] => [
        {
            key: "no",
            label: "N°",
            width: 70,
            align: "center",
            sortable: true,
            filterable: true,
            render: (value: string | null) => <span className="font-mono text-xs">{value || ''}</span>
        },
        {
            key: "key",
            label: "Item",
            width: 200,
            align: "left",
            sortable: true,
            filterable: true,
            render: (value: string | null) => (
                <div className="truncate text-xs" title={value || ''}>{value || ''}</div>
            )
        },
        {
            key: "unite",
            label: "Unit",
            width: 70,
            align: "center",
            sortable: true,
            filterable: true,
            render: (value: string | null) => <span className="text-xs">{value || ''}</span>
        },
        {
            key: "qte",
            label: "VO Qty",
            width: 100,
            align: "right",
            sortable: true,
            render: (value: number) => <span className="text-xs font-medium">{value ? formatQuantity(value) : ''}</span>
        },
        {
            key: "unitPrice",
            label: "Unit Price",
            width: 100,
            align: "right",
            sortable: true,
            render: (value: number) => <span className="text-xs">{formatCurrency(value)}</span>
        },
        {
            key: "totalAmount",
            label: "Total Amt",
            width: 110,
            align: "right",
            sortable: true,
            render: (_value: number | undefined, row: VOBoqIpcVM) => (
                <span className="text-xs font-medium">{formatCurrency((row.qte || 0) * (row.unitPrice || 0))}</span>
            )
        },
        {
            key: "precedQte",
            label: "Prev Qty",
            width: 100,
            align: "right",
            sortable: true,
            render: (value: number, row: VOBoqIpcVM) => {
                const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
                return (
                    <div className="flex items-center justify-end gap-1 text-xs">
                        <span>{value ? formatQuantity(value) : ''}</span>
                        {canCorrectPreviousValues && !isHeaderRow && row.id && activeVO && activeVOBuilding && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openCorrectionModal(
                                        CorrectionEntityType.ContractVo,
                                        row.id,
                                        value || 0,
                                        `VO ${activeVO.voNumber} - ${row.no || ''} - ${row.key || 'VO Item'}`
                                    );
                                }}
                                className="btn btn-ghost btn-xs p-0 min-h-0 h-4 w-4"
                                title="Correct previous quantity (audit trail)"
                            >
                                <Icon icon={pencilIcon} className="text-amber-500 size-3" />
                            </button>
                        )}
                    </div>
                );
            }
        },
        {
            key: "actualQte",
            label: "Actual Qty",
            width: 100,
            align: "right",
            editable: true,
            type: "number",
            sortable: true,
            render: (value: number, row: VOBoqIpcVM) => {
                const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
                if (isHeaderRow) return <span className="text-xs text-base-content/30">-</span>;
                return <span className="text-xs">{value ? formatQuantity(value) : ''}</span>;
            }
        },
        {
            key: "cumulQte",
            label: "Cumul Qty",
            width: 100,
            align: "right",
            editable: true,
            type: "number",
            sortable: true,
            render: (_value: number | undefined, row: VOBoqIpcVM) => {
                const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
                if (isHeaderRow) return <span className="text-xs text-base-content/30">-</span>;
                const cumulQte = (row.precedQte || 0) + (row.actualQte || 0);
                return <span className="text-xs">{cumulQte ? formatQuantity(cumulQte) : ''}</span>;
            }
        },
        {
            key: "cumulPercent",
            label: "Cumul %",
            width: 85,
            align: "right",
            editable: true,
            type: "number",
            sortable: true,
            render: (_value: number | undefined, row: VOBoqIpcVM) => {
                const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
                if (isHeaderRow || row.qte === 0) return <span className="text-xs text-base-content/30">-</span>;
                const cumulQte = (row.precedQte || 0) + (row.actualQte || 0);
                const cumulPercent = (cumulQte / row.qte) * 100;
                return <span className="text-xs">{Math.round(cumulPercent * 100) / 100}%</span>;
            }
        },
        {
            key: "precedAmount",
            label: "Prev Amt",
            width: 100,
            align: "right",
            sortable: true,
            render: (_value: number | undefined, row: VOBoqIpcVM) => (
                <span className="text-xs">{formatCurrency((row.precedQte || 0) * (row.unitPrice || 0))}</span>
            )
        },
        {
            key: "actualAmount",
            label: "Actual Amt",
            width: 100,
            align: "right",
            sortable: true,
            render: (_value: number | undefined, row: VOBoqIpcVM) => (
                <span className="text-xs font-semibold text-green-600">{formatCurrency((row.actualQte || 0) * (row.unitPrice || 0))}</span>
            )
        },
        {
            key: "cumulAmount",
            label: "Cumul Amt",
            width: 100,
            align: "right",
            sortable: true,
            render: (_value: number | undefined, row: VOBoqIpcVM) => {
                const cumulQte = (row.precedQte || 0) + (row.actualQte || 0);
                return <span className="text-xs font-medium">{formatCurrency(cumulQte * (row.unitPrice || 0))}</span>;
            }
        }
    ], [canCorrectPreviousValues, activeVO, activeVOBuilding]);

    /**
     * Handle Contract BOQ cell changes from Spreadsheet component
     */
    const handleContractBOQCellChange = useCallback((
        rowIndex: number,
        columnKey: string,
        value: any,
        row: BoqIpcVM
    ) => {
        if (!activeBuilding) return;

        const numValue = parseFloat(value) || 0;
        const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
        if (isHeaderRow) return;

        switch (columnKey) {
            case 'actualQte':
                handleBOQQuantityChange(activeBuilding.id, row.id, numValue);
                break;
            case 'cumulQte':
                handleBOQCumulQtyChange(activeBuilding.id, row.id, numValue);
                break;
            case 'cumulPercent':
                handleBOQCumulPercentChange(activeBuilding.id, row.id, numValue);
                break;
            case 'cumulMaterialPercentage':
                handleBOQMaterialPercentChange(activeBuilding.id, row.id, numValue);
                break;
            case 'cumulDeductionPercentage':
                handleBOQDeductionPercentChange(activeBuilding.id, row.id, numValue);
                break;
        }
    }, [activeBuilding, handleBOQQuantityChange, handleBOQCumulQtyChange, handleBOQCumulPercentChange, handleBOQMaterialPercentChange, handleBOQDeductionPercentChange]);

    /**
     * Handle VO BOQ cell changes from Spreadsheet component
     */
    const handleVOBOQCellChange = useCallback((
        rowIndex: number,
        columnKey: string,
        value: any,
        row: VOBoqIpcVM
    ) => {
        if (!activeVO || !activeVOBuilding) return;

        const numValue = parseFloat(value) || 0;
        const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
        if (isHeaderRow) return;

        switch (columnKey) {
            case 'actualQte':
                handleVOBOQQuantityChange(activeVO.id, activeVOBuilding.id, row.id, numValue);
                break;
            case 'cumulQte':
                handleVOBOQCumulQtyChange(activeVO.id, activeVOBuilding.id, row.id, numValue);
                break;
            case 'cumulPercent':
                handleVOBOQCumulPercentChange(activeVO.id, activeVOBuilding.id, row.id, numValue);
                break;
        }
    }, [activeVO, activeVOBuilding, handleVOBOQQuantityChange, handleVOBOQCumulQtyChange, handleVOBOQCumulPercentChange]);

    /**
     * Check if Contract BOQ cell is editable (header rows are not editable)
     */
    const isContractBOQCellEditable = useCallback((row: BoqIpcVM, column: SpreadsheetColumn<BoqIpcVM>, _index: number) => {
        const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
        if (isHeaderRow) return false;
        // Cumul % is not editable if qte is 0
        if (column.key === 'cumulPercent' && row.qte === 0) return false;
        return column.editable === true;
    }, []);

    /**
     * Check if VO BOQ cell is editable (header rows are not editable)
     */
    const isVOBOQCellEditable = useCallback((row: VOBoqIpcVM, column: SpreadsheetColumn<VOBoqIpcVM>, _index: number) => {
        const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
        if (isHeaderRow) return false;
        // Cumul % is not editable if qte is 0
        if (column.key === 'cumulPercent' && row.qte === 0) return false;
        return column.editable === true;
    }, []);

    /**
     * Row class name for Contract BOQ - bold for header rows
     */
    const getContractBOQRowClassName = useCallback((row: BoqIpcVM, _index: number) => {
        const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
        return isHeaderRow ? 'font-bold bg-base-200' : undefined;
    }, []);

    /**
     * Row class name for VO BOQ - bold for header rows
     */
    const getVOBOQRowClassName = useCallback((row: VOBoqIpcVM, _index: number) => {
        const isHeaderRow = row.qte === 0 && row.unitPrice === 0;
        return isHeaderRow ? 'font-bold bg-base-200' : undefined;
    }, []);


    /**
     * Contract BOQ toolbar
     */
    const contractBOQToolbar = useMemo(() => (
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={handleExportBOQ}
                className="btn btn-xs bg-green-600 hover:bg-green-700 text-white border-0"
                title="Export BOQ to Excel"
            >
                <Icon icon={downloadIcon} className="size-3.5" />
                Export
            </button>
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-xs bg-blue-600 hover:bg-blue-700 text-white border-0"
                title="Import BOQ from Excel"
            >
                <Icon icon={uploadIcon} className="size-3.5" />
                Import
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportBOQ}
                className="hidden"
            />
        </div>
    ), [handleExportBOQ, handleImportBOQ]);

    // ==================== End Spreadsheet Column Definitions ====================

    // In Edit mode, selectedContract might not be set, but formData has the contract data
    const isEditMode = formData.id && formData.id > 0;
    if (!selectedContract && !isEditMode) {
        return (
            <div className="text-center py-12">
                <span className="iconify lucide--building text-base-content/30 size-16 mb-4"></span>
                <h3 className="text-lg font-semibold text-base-content mb-2">No Contract Selected</h3>
                <p className="text-sm text-base-content/70">Please go back and select a contract first</p>
            </div>
        );
    }

    // In Edit mode, get contract info from formData instead of selectedContract
    const contractInfo = selectedContract || {
        contractNumber: (formData as any).contract || 'N/A',
        projectName: (formData as any).projectName || 'N/A',
        subcontractorName: (formData as any).subcontractorName || 'N/A',
        tradeCode: (formData as any).tradeCode || '',
    };

    // Generate combined site code: ProjectName (e.g., A61) + TradeCode (e.g., 0302) = A610302
    const siteCode = contractInfo.projectName && contractInfo.tradeCode
        ? `${contractInfo.projectName}${contractInfo.tradeCode}`
        : contractInfo.projectName || 'N/A';

    return (
        <div className="space-y-4">
            {/* Combined Card: Contract Info + Work Period */}
            <div className="bg-base-100 rounded-lg border border-base-300 p-4">
                {/* Contract Context Header */}
                <div className="flex items-center gap-6 text-sm flex-wrap mb-4 pb-3 border-b border-base-300">
                    <div className="flex items-center gap-2">
                        <Icon icon={fileTextIcon} className="size-4 text-primary" />
                        <span className="text-base-content/70 font-medium">Contract:</span>
                        <span className="font-semibold text-base-content">{contractInfo.contractNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon icon={hashIcon} className="size-4 text-primary" />
                        <span className="text-base-content/70 font-medium">Site Code:</span>
                        <span className="font-semibold text-base-content">{siteCode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon icon={building2Icon} className="size-4 text-primary" />
                        <span className="text-base-content/70 font-medium">Project:</span>
                        <span className="font-semibold text-base-content">{contractInfo.projectName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon icon={usersIcon} className="size-4 text-primary" />
                        <span className="text-base-content/70 font-medium">Subcontractor:</span>
                        <span className="font-semibold text-base-content">{contractInfo.subcontractorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon icon={fileCheckIcon} className="size-4 text-primary" />
                        <span className="text-base-content/70 font-medium">Type:</span>
                        <span className="font-semibold text-base-content">{formData.type}</span>
                    </div>
                    {/* Advance Payment Button - Shows for all IPCs with eligible amount */}
                    {hasAdvancePaymentData && (
                        <button
                            type="button"
                            onClick={() => setShowAdvancePaymentModal(true)}
                            className={`btn btn-sm ${thisIpcAdvanceAmount > 0 ? 'btn-primary' : 'btn-outline btn-primary'} gap-1`}
                        >
                            <Icon icon={dollarSignIcon} className="size-4" />
                            Advance Payment
                            {thisIpcAdvanceAmount > 0 && (
                                <span className="badge badge-sm badge-ghost ml-1">
                                    {formatCurrency(thisIpcAdvanceAmount)}
                                </span>
                            )}
                        </button>
                    )}
                    {/* Retention Release Button - Shows for retention type IPCs or when retention data is available */}
                    {hasRetentionReleaseData && (
                        <button
                            type="button"
                            onClick={() => setShowRetentionReleaseModal(true)}
                            className={`btn btn-sm ${thisIpcRetentionAmount > 0 ? 'btn-success' : 'btn-outline btn-success'} gap-1`}
                        >
                            <Icon icon={shieldIcon} className="size-4" />
                            Retention Release
                            {thisIpcRetentionAmount > 0 && (
                                <span className="badge badge-sm badge-ghost ml-1">
                                    {formatCurrency(thisIpcRetentionAmount)}
                                </span>
                            )}
                        </button>
                    )}
                    {/* Penalties Button - Shows only in edit mode */}
                    {formData.id && formData.id > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowPenaltyModal(true)}
                            className={`btn btn-sm ${formData.penalty > 0 ? 'btn-error' : 'btn-outline btn-error'} gap-1`}
                        >
                            <Icon icon={alertTriangleIcon} className="size-4" />
                            Penalties
                            {formData.penalty > 0 && (
                                <span className="badge badge-sm badge-ghost ml-1">
                                    {formatCurrency(formData.penalty)}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* Work Period Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 items-end">
                    {/* IPC Date */}
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text font-medium text-sm">IPC Date *</span>
                        </label>
                        <input
                            type="date"
                            value={formData.dateIpc}
                            onChange={(e) => handleInputChange('dateIpc', e.target.value)}
                            className="input input-sm input-bordered"
                        />
                    </div>

                    {/* From Date */}
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text font-medium text-sm">Period From *</span>
                        </label>
                        <input
                            type="date"
                            value={formData.fromDate}
                            onChange={(e) => handleInputChange('fromDate', e.target.value)}
                            className="input input-sm input-bordered"
                        />
                    </div>

                    {/* To Date */}
                    <div className="form-control">
                        <label className="label py-1">
                            <span className="label-text font-medium text-sm">Period To *</span>
                        </label>
                        <input
                            type="date"
                            value={formData.toDate}
                            onChange={(e) => handleInputChange('toDate', e.target.value)}
                            className="input input-sm input-bordered"
                            min={formData.fromDate}
                        />
                    </div>

                    {/* Quick Period Presets + Days Count */}
                    <div className="flex items-center gap-2 col-span-2 md:col-span-1 lg:col-span-3">
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
                            className="btn btn-xs btn-ghost"
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
                            className="btn btn-xs btn-ghost"
                        >
                            Last Month
                        </button>
                        {formData.fromDate && formData.toDate && (
                            <span className="badge badge-primary badge-sm ml-auto">
                                {Math.ceil((new Date(formData.toDate).getTime() - new Date(formData.fromDate).getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* View Mode Toggle - Only show if there are VOs */}
            {safeVOs.length > 0 && (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setViewMode("contract")}
                            className={`btn btn-sm ${viewMode === "contract" ? "btn-primary" : "bg-base-200 text-base-content hover:bg-base-300 border-base-300"}`}
                        >
                            Contract BOQ
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode("vo");
                                if (!activeVOId) {
                                    setActiveVOId(safeVOs[0].id);
                                    if (safeVOs[0].buildings.length > 0) {
                                        setActiveVOBuildingId(safeVOs[0].buildings[0].id);
                                    }
                                }
                            }}
                            className={`btn btn-sm ${viewMode === "vo" ? "btn-primary" : "bg-base-200 text-base-content hover:bg-base-300 border-base-300"}`}
                        >
                            Variation Orders ({safeVOs.length})
                        </button>
                    </div>
                </div>
            )}

            {/* BOQ Spreadsheet - Contract BOQ */}
            {viewMode === "contract" && activeBuilding && (
                <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
                    {/* Spreadsheet with toolbarLeft for building selector */}
                    <Spreadsheet<BoqIpcVM>
                        data={activeBuilding.boqsContract || []}
                        columns={contractBOQColumns}
                        mode="edit"
                        emptyMessage="No BOQ items for this building"
                        persistKey={`ipc-contract-boq-${activeBuilding.id}`}
                        rowHeight={32}
                        onCellChange={handleContractBOQCellChange}
                        isCellEditable={isContractBOQCellEditable}
                        getRowId={(row) => row.id}
                        rowClassName={getContractBOQRowClassName}
                        allowKeyboardNavigation
                        allowColumnResize
                        allowSorting={false}
                        allowFilters
                        toolbarLeft={
                            <div className="flex items-center gap-3">
                                <Icon icon={buildingIcon} className="text-blue-600 dark:text-blue-400 size-4" />
                                {safeBuildings.length > 1 ? (
                                    <div className="relative">
                                        <select
                                            value={activeBuildingId || ''}
                                            onChange={(e) => setActiveBuildingId(Number(e.target.value))}
                                            className="select select-bordered select-sm min-w-[200px] pr-8 font-medium text-sm"
                                        >
                                            {safeBuildings.map(building => (
                                                <option key={building.id} value={building.id}>
                                                    {building.buildingName} | {building.sheetName}
                                                </option>
                                            ))}
                                        </select>
                                        <Icon
                                            icon={chevronDownIcon}
                                            className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-base-content/50"
                                        />
                                    </div>
                                ) : (
                                    <span className="font-medium text-sm">{activeBuilding.buildingName} | {activeBuilding.sheetName}</span>
                                )}
                                <span className="text-xs text-base-content/50">
                                    {(activeBuilding.boqsContract || []).length} items
                                </span>
                            </div>
                        }
                        toolbar={contractBOQToolbar}
                        summaryRow={(_rows, meta) => (
                            <div
                                className="spreadsheet-grid-base font-semibold text-xs bg-base-200"
                                style={{ gridTemplateColumns: meta?.gridTemplateColumns, minHeight: 36 }}
                            >
                                {/* Row number */}
                                <div className="spreadsheet-row-number flex items-center justify-center border-r border-b border-base-300 bg-base-200">Σ</div>
                                {/* N° */}
                                <div className="border-r border-b border-base-300"></div>
                                {/* Item */}
                                <div className="flex items-center px-3 border-r border-b border-base-300">Totals</div>
                                {/* Unit */}
                                <div className="border-r border-b border-base-300"></div>
                                {/* Contract Qty */}
                                <div className="border-r border-b border-base-300"></div>
                                {/* Unit Price */}
                                <div className="border-r border-b border-base-300"></div>
                                {/* Total Amt - Contract Total */}
                                <div className="flex items-center justify-end px-3 border-r border-b border-base-300">{formatCurrency(contractBOQContractTotal)}</div>
                                {/* Prev Qty */}
                                <div className="border-r border-b border-base-300"></div>
                                {/* Actual Qty */}
                                <div className="border-r border-b border-base-300"></div>
                                {/* Cumul Qty */}
                                <div className="border-r border-b border-base-300"></div>
                                {/* Cumul % */}
                                <div className="border-r border-b border-base-300"></div>
                                {/* Prev Amt */}
                                <div className="flex items-center justify-end px-3 border-r border-b border-base-300">{formatCurrency(contractBOQPrecedTotal)}</div>
                                {/* Actual Amt */}
                                <div className="flex items-center justify-end px-3 border-r border-b border-base-300 text-green-600">{formatCurrency(activeBuildingTotal)}</div>
                                {/* Cumul Amt */}
                                <div className="flex items-center justify-end px-3 border-r border-b border-base-300">{formatCurrency(contractBOQCumulTotal)}</div>
                                {/* Mat. Supply */}
                                <div className="border-r border-b border-base-300"></div>
                                {/* Deduction */}
                                <div className="border-b border-base-300"></div>
                            </div>
                        )}
                    />
                </div>
            )}

            {/* VO BOQ Spreadsheet */}
            {viewMode === "vo" && activeVO && activeVOBuilding && (
                <div className="bg-base-100 border border-purple-300 dark:border-purple-800 rounded-lg overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 320px)', minHeight: '400px' }}>
                    {/* Spreadsheet with toolbarLeft for VO/Building selector */}
                    <Spreadsheet<VOBoqIpcVM>
                        data={activeVOBuilding.boqs || []}
                        columns={voBOQColumns}
                        mode="edit"
                        emptyMessage="No VO BOQ items for this building"
                        persistKey={`ipc-vo-boq-${activeVO.id}-${activeVOBuilding.id}`}
                        rowHeight={32}
                        onCellChange={handleVOBOQCellChange}
                        isCellEditable={isVOBOQCellEditable}
                        getRowId={(row) => row.id}
                        rowClassName={getVOBOQRowClassName}
                        allowKeyboardNavigation
                        allowColumnResize
                        allowSorting={false}
                        allowFilters
                        toolbarLeft={
                            <div className="flex items-center gap-3">
                                <span className="iconify lucide--file-plus-2 text-purple-600 dark:text-purple-400 size-4"></span>
                                {/* VO Selector */}
                                {safeVOs.length > 1 ? (
                                    <div className="relative">
                                        <select
                                            value={activeVOId || ''}
                                            onChange={(e) => {
                                                const voId = Number(e.target.value);
                                                setActiveVOId(voId);
                                                const vo = safeVOs.find(v => v.id === voId);
                                                if (vo && vo.buildings.length > 0) {
                                                    setActiveVOBuildingId(vo.buildings[0].id);
                                                }
                                            }}
                                            className="select select-bordered select-sm min-w-[120px] pr-8 font-medium text-sm bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                                        >
                                            {safeVOs.map(vo => (
                                                <option key={vo.id} value={vo.id}>
                                                    {vo.voNumber}
                                                </option>
                                            ))}
                                        </select>
                                        <Icon
                                            icon={chevronDownIcon}
                                            className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400"
                                        />
                                    </div>
                                ) : (
                                    <span className="font-medium text-sm text-purple-600 dark:text-purple-400">{activeVO.voNumber}</span>
                                )}
                                {/* Building Selector */}
                                {activeVO.buildings.length > 1 ? (
                                    <div className="relative">
                                        <select
                                            value={activeVOBuildingId || ''}
                                            onChange={(e) => setActiveVOBuildingId(Number(e.target.value))}
                                            className="select select-bordered select-sm min-w-[180px] pr-8 font-medium text-sm bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                                        >
                                            {activeVO.buildings.map(building => (
                                                <option key={building.id} value={building.id}>
                                                    {building.buildingName}
                                                </option>
                                            ))}
                                        </select>
                                        <Icon
                                            icon={chevronDownIcon}
                                            className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-purple-400"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-purple-600/70 dark:text-purple-400/70">| {activeVOBuilding.buildingName}</span>
                                )}
                                <span className="text-xs text-purple-400">
                                    {(activeVOBuilding.boqs || []).length} items
                                </span>
                            </div>
                        }
                        toolbar={
                            <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                VO Building Total: {formatCurrency(activeVOBuildingTotal)}
                            </div>
                        }
                        summaryRow={(_rows, meta) => (
                            <div
                                className="spreadsheet-grid-base font-semibold text-xs bg-purple-50 dark:bg-purple-900/20"
                                style={{ gridTemplateColumns: meta?.gridTemplateColumns, minHeight: 36 }}
                            >
                                {/* Row number */}
                                <div className="spreadsheet-row-number flex items-center justify-center border-r border-b border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">Σ</div>
                                {/* N° */}
                                <div className="border-r border-b border-purple-200 dark:border-purple-800"></div>
                                {/* Item */}
                                <div className="flex items-center px-3 border-r border-b border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">Totals</div>
                                {/* Unit */}
                                <div className="border-r border-b border-purple-200 dark:border-purple-800"></div>
                                {/* VO Qty */}
                                <div className="border-r border-b border-purple-200 dark:border-purple-800"></div>
                                {/* Unit Price */}
                                <div className="border-r border-b border-purple-200 dark:border-purple-800"></div>
                                {/* Total Amt - VO Total */}
                                <div className="flex items-center justify-end px-3 border-r border-b border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">{formatCurrency(voBOQContractTotal)}</div>
                                {/* Prev Qty */}
                                <div className="border-r border-b border-purple-200 dark:border-purple-800"></div>
                                {/* Actual Qty */}
                                <div className="border-r border-b border-purple-200 dark:border-purple-800"></div>
                                {/* Cumul Qty */}
                                <div className="border-r border-b border-purple-200 dark:border-purple-800"></div>
                                {/* Cumul % */}
                                <div className="border-r border-b border-purple-200 dark:border-purple-800"></div>
                                {/* Prev Amt */}
                                <div className="flex items-center justify-end px-3 border-r border-b border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">{formatCurrency(voBOQPrecedTotal)}</div>
                                {/* Actual Amt */}
                                <div className="flex items-center justify-end px-3 border-r border-b border-purple-200 dark:border-purple-800 text-green-600">{formatCurrency(activeVOBuildingTotal)}</div>
                                {/* Cumul Amt */}
                                <div className="flex items-center justify-end px-3 border-b border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">{formatCurrency(voBOQCumulTotal)}</div>
                            </div>
                        )}
                    />
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

            {/* ==================== ADVANCE PAYMENT MODAL ==================== */}
            {showAdvancePaymentModal && hasAdvancePaymentData && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-4xl w-full p-0">
                        {/* Compact Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-base-300 bg-base-200/50">
                            <h3 className="text-base font-semibold">Advance Payment</h3>
                            <button type="button" onClick={() => setShowAdvancePaymentModal(false)} className="btn btn-xs btn-ghost btn-circle">
                                <Icon icon={xIcon} className="size-4" />
                            </button>
                        </div>

                        {/* Main Content - Horizontal Layout */}
                        <div className="p-5">
                            <div className={`flex gap-6 ${voAmounts.length > 0 ? '' : 'justify-center'}`}>

                                {/* LEFT: VO Selection */}
                                {voAmounts.length > 0 && (
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Include in Calculation</span>
                                            <div className="join">
                                                <button type="button" onClick={() => setAdvancePaymentSelection('all')}
                                                    className={`btn btn-xs join-item ${advancePaymentSelection === 'all' ? 'btn-primary' : 'btn-ghost'}`}>All</button>
                                                <button type="button" onClick={() => setAdvancePaymentSelection('boq')}
                                                    className={`btn btn-xs join-item ${advancePaymentSelection === 'boq' ? 'btn-primary' : 'btn-ghost'}`}>BOQ Only</button>
                                            </div>
                                        </div>
                                        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
                                            <table className="table table-xs w-full">
                                                <tbody>
                                                    <tr className="bg-base-200/50">
                                                        <td className="py-1.5"><span className="text-xs">BOQ Items</span></td>
                                                        <td className="py-1.5 text-right font-medium text-xs">{formatCurrency(boqTotalAmount)}</td>
                                                    </tr>
                                                    {voAmounts.map(vo => (
                                                        <tr key={vo.id} className={isVOSelected(vo.id) ? '' : 'opacity-40'}>
                                                            <td className="py-1">
                                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                                    <input type="checkbox" className="checkbox checkbox-xs checkbox-primary"
                                                                        checked={isVOSelected(vo.id)} onChange={() => handleVOSelectionToggle(vo.id)} />
                                                                    <span className={`text-xs ${vo.type?.toLowerCase() === 'omission' ? 'text-error' : 'text-success'}`}>
                                                                        {vo.voNumber}
                                                                    </span>
                                                                    <span className="badge badge-xs">{vo.type}</span>
                                                                </label>
                                                            </td>
                                                            <td className={`py-1 text-right text-xs font-medium ${vo.type?.toLowerCase() === 'omission' ? 'text-error' : 'text-success'}`}>
                                                                {vo.type?.toLowerCase() === 'omission' ? '−' : '+'}{formatCurrency(vo.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="border-t-2 border-base-300 bg-base-200">
                                                        <td className="py-1.5 font-medium text-xs">Selected Total</td>
                                                        <td className="py-1.5 text-right font-bold text-sm">{formatCurrency(selectedTotalAmount)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* RIGHT: Summary & Input */}
                                <div className={voAmounts.length > 0 ? 'flex-1 min-w-0' : 'w-full max-w-md'}>
                                    {/* Summary Table */}
                                    <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Summary</span>
                                    <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden mt-2 mb-4">
                                        <table className="table table-xs w-full">
                                            <tbody>
                                                <tr>
                                                    <td className="py-1.5 text-xs">Eligible ({contractAdvancePayeePercent}% of {formatCurrency(selectedTotalAmount)})</td>
                                                    <td className="py-1.5 text-right font-semibold text-sm">{formatCurrency(eligibleAmount)}</td>
                                                </tr>
                                                <tr className="text-success">
                                                    <td className="py-1.5 text-xs">Previous IPCs</td>
                                                    <td className="py-1.5 text-right font-medium text-xs">− {formatCurrency(previousPaid)}</td>
                                                </tr>
                                                <tr className="border-t-2 border-warning/30 bg-warning/10">
                                                    <td className="py-2 text-xs font-semibold text-warning">Available</td>
                                                    <td className="py-2 text-right font-bold text-base text-warning">{formatCurrency(remainingAmount)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* This IPC Input */}
                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                        <div className="flex items-center justify-between gap-4 mb-3">
                                            <span className="text-xs font-medium text-base-content/70">This IPC:</span>
                                            <div className="flex items-center gap-2">
                                                <input type="number" className="input input-sm input-bordered w-16 text-center font-semibold"
                                                    value={advancePaymentPercentage || ''} onChange={(e) => handleAdvancePaymentChange(e.target.value)}
                                                    onFocus={(e) => e.target.select()} min="0" max="100" placeholder="0" />
                                                <span className="text-sm text-base-content/60">%</span>
                                                <span className="text-base-content/40">=</span>
                                                <span className="font-bold text-primary text-lg">{formatCurrency(thisIpcAdvanceAmount)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {[0, 25, 50, 75, 100].map(pct => (
                                                <button key={pct} type="button" onClick={() => handleAdvancePaymentChange(pct.toString())}
                                                    className={`btn btn-xs flex-1 ${advancePaymentPercentage === pct ? 'btn-primary' : 'btn-ghost'}`}>{pct}%</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Compact Footer */}
                        <div className="flex justify-end gap-2 px-5 py-3 border-t border-base-300 bg-base-200/30">
                            <button type="button" onClick={() => { handleAdvancePaymentChange('0'); setShowAdvancePaymentModal(false); }}
                                className="btn btn-sm btn-ghost">Clear</button>
                            <button type="button" onClick={() => setShowAdvancePaymentModal(false)}
                                className="btn btn-sm btn-primary">Apply</button>
                        </div>
                    </div>
                    <div className="modal-backdrop bg-black/40" onClick={() => setShowAdvancePaymentModal(false)}></div>
                </div>
            )}

            {/* ==================== RETENTION RELEASE MODAL ==================== */}
            {/* Simple modal - just shows already-held retention and lets user enter % to release */}
            {showRetentionReleaseModal && hasRetentionReleaseData && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md w-full p-0">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-base-300 bg-base-200/50">
                            <h3 className="text-base font-semibold">Retention Release</h3>
                            <button type="button" onClick={() => setShowRetentionReleaseModal(false)} className="btn btn-xs btn-ghost btn-circle">
                                <Icon icon={xIcon} className="size-4" />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="p-5">
                            {/* Summary Table */}
                            <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden mb-4">
                                <table className="table table-sm w-full">
                                    <tbody>
                                        <tr>
                                            <td className="py-2 text-sm">Total Retention Held</td>
                                            <td className="py-2 text-right font-semibold text-base">{formatCurrency(totalRetentionHeld)}</td>
                                        </tr>
                                        <tr className="text-success">
                                            <td className="py-2 text-sm">Previously Released</td>
                                            <td className="py-2 text-right font-medium text-sm">− {formatCurrency(previousRetentionReleased)}</td>
                                        </tr>
                                        <tr className="border-t-2 border-warning/30 bg-warning/10">
                                            <td className="py-3 text-sm font-semibold text-warning">Available to Release</td>
                                            <td className="py-3 text-right font-bold text-lg text-warning">{formatCurrency(remainingRetentionAmount)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Percentage Input */}
                            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                                <div className="text-center mb-3">
                                    <span className="text-sm text-base-content/70">Release percentage of available retention:</span>
                                </div>
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <input type="number" className="input input-bordered w-20 text-center font-bold text-lg"
                                        value={retentionReleasePercentage || ''} onChange={(e) => handleRetentionPercentageChange(e.target.value)}
                                        onFocus={(e) => e.target.select()} min="0" max="100" placeholder="0" />
                                    <span className="text-lg text-base-content/60">%</span>
                                    <span className="text-base-content/40">=</span>
                                    <span className="font-bold text-success text-xl">{formatCurrency(thisIpcRetentionAmount)}</span>
                                </div>
                                <div className="flex gap-1">
                                    {[0, 25, 50, 75, 100].map(pct => (
                                        <button key={pct} type="button" onClick={() => handleRetentionPercentageChange(pct.toString())}
                                            className={`btn btn-sm flex-1 ${retentionReleasePercentage === pct ? 'btn-success' : 'btn-ghost'}`}>{pct}%</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 px-5 py-3 border-t border-base-300 bg-base-200/30">
                            <button type="button" onClick={() => { handleRetentionPercentageChange('0'); setShowRetentionReleaseModal(false); }}
                                className="btn btn-sm btn-ghost">Clear</button>
                            <button type="button" onClick={() => setShowRetentionReleaseModal(false)}
                                className="btn btn-sm btn-success">Apply</button>
                        </div>
                    </div>
                    <div className="modal-backdrop bg-black/40" onClick={() => setShowRetentionReleaseModal(false)}></div>
                </div>
            )}

            {/* Penalty Form Modal - Only in edit mode */}
            <PenaltyForm
                isOpen={showPenaltyModal}
                onClose={() => setShowPenaltyModal(false)}
                onSave={handlePenaltySave}
                initialData={{
                    penalty: formData.penalty || 0,
                    previousPenalty: formData.previousPenalty || 0,
                    reason: formData.penaltyReason || "",
                }}
            />
        </div>
    );
};
