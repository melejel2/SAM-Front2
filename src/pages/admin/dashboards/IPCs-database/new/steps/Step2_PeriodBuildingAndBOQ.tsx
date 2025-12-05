import React, { useState, useEffect } from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import type { ContractBuildingsVM, Vos } from "@/types/ipc";
import { Icon } from "@iconify/react";
import calendarDaysIcon from "@iconify/icons-lucide/calendar-days";
import infoIcon from "@iconify/icons-lucide/info";
import buildingIcon from "@iconify/icons-lucide/building";
import hashIcon from "@iconify/icons-lucide/hash";
import percentIcon from "@iconify/icons-lucide/percent";
import { useAuth } from "@/contexts/auth";
import { ipcApiService } from "@/api/services/ipc-api";
import useToast from "@/hooks/use-toast";

export const Step2_PeriodBuildingAndBOQ: React.FC = () => {
    const { formData, setFormData, selectedContract } = useIPCWizardContext();
    const { getToken } = useAuth();
    const { toaster } = useToast();

    // Input mode toggle: 'quantity' or 'percentage'
    const [inputMode, setInputMode] = useState<'quantity' | 'percentage'>('quantity');

    // Active building/VO tab - follows legacy SAM bottom tab pattern
    const [activeBuildingId, setActiveBuildingId] = useState<number | null>(null);
    const [activeVOId, setActiveVOId] = useState<number | null>(null);
    const [activeVOBuildingId, setActiveVOBuildingId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<"contract" | "vo">("contract");

    // State to hold the master list of all buildings for the contract
    const [allContractBuildings, setAllContractBuildings] = useState<ContractBuildingsVM[]>([]);

    // Effect to fetch all buildings for the selected contract
    useEffect(() => {
        const fetchAllBuildings = async () => {
            if (selectedContract) {
                const token = getToken();
                if (!token) return;
                const response = await ipcApiService.getContractDataForNewIpc(selectedContract.id, token);
                if (response.success && response.data) {
                    setAllContractBuildings(response.data.buildings || []);

                    // Auto-initialize fromDate from previous IPC's toDate if available
                    const isEditMode = (formData as any).id && (formData as any).id > 0;
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
        const isEditMode = (formData as any).id && (formData as any).id > 0;
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

    const handleInputChange = (field: string, value: string | number) => {
        setFormData({ [field]: value });
    };

    const handleBOQQuantityChange = (buildingId: number, boqId: number, inputValue: number) => {
        const safeBuildings = formData.buildings || [];
        const building = safeBuildings.find(b => b.id === buildingId);
        const boqItem = building?.boqsContract?.find(b => b.id === boqId);

        if (!boqItem) return;

        // Convert input based on mode
        let actualQte = inputValue;
        if (inputMode === 'percentage') {
            // Convert percentage to quantity
            actualQte = (inputValue / 100) * boqItem.qte;
        }

        // Calculate maximum allowed quantity
        const precedQte = boqItem.precedQte || 0;
        const maxAllowedQty = Math.max(0, boqItem.qte - precedQte);

        // Validate quantity limits
        let validatedQte = actualQte;
        if (actualQte < 0) {
            validatedQte = 0;
        } else if (actualQte > maxAllowedQty) {
            validatedQte = maxAllowedQty;
            const maxPercent = inputMode === 'percentage' ? ((maxAllowedQty / boqItem.qte) * 100).toFixed(2) : '';
            const warningMsg = inputMode === 'percentage'
                ? `Maximum for this item is ${maxPercent}% (${maxAllowedQty.toFixed(2)} ${boqItem.unite || ''})`
                : `Maximum quantity for this item is ${maxAllowedQty.toFixed(2)} ${boqItem.unite || ''}`;
            toaster.warning(warningMsg);
        }

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

    const handleVOBOQQuantityChange = (voId: number, buildingId: number, boqId: number, actualQte: number) => {
        const vos = (formData.vos || []) as Vos[];
        const vo = vos.find(v => v.id === voId);
        const building = vo?.buildings.find(b => b.id === buildingId);
        const boqItem = building?.boqs.find(b => b.id === boqId);

        if (!boqItem) return;

        const precedQte = boqItem.precedQte || 0;
        const maxAllowedQty = Math.max(0, boqItem.qte - precedQte);

        let validatedQte = actualQte;
        if (actualQte < 0) {
            validatedQte = 0;
        } else if (actualQte > maxAllowedQty) {
            validatedQte = maxAllowedQty;
            toaster.warning(`Maximum quantity for this item is ${maxAllowedQty.toFixed(2)} ${boqItem.unite || ''}`);
        }

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // In Edit mode, selectedContract might not be set, but formData has the contract data
    const isEditMode = (formData as any).id && (formData as any).id > 0;
    if (!selectedContract && !isEditMode) {
        return (
            <div className="text-center py-12">
                <span className="iconify lucide--building text-base-content/30 size-16 mb-4"></span>
                <h3 className="text-lg font-semibold text-base-content mb-2">No Contract Selected</h3>
                <p className="text-sm text-base-content/70">Please go back and select a contract first</p>
            </div>
        );
    }

    const safeBuildings = formData.buildings || [];
    const safeVOs = (formData.vos || []) as Vos[];
    const activeBuilding = safeBuildings.find(b => b.id === activeBuildingId);
    const activeVO = safeVOs.find(v => v.id === activeVOId);
    const activeVOBuilding = activeVO?.buildings.find(b => b.id === activeVOBuildingId);

    // In Edit mode, get contract info from formData instead of selectedContract
    const contractInfo = selectedContract || {
        contractNumber: (formData as any).contract || 'N/A',
        projectName: (formData as any).projectName || 'N/A',
        subcontractorName: (formData as any).subcontractorName || 'N/A',
    };

    // Calculate totals for active building
    const activeBuildingTotal = activeBuilding
        ? (activeBuilding.boqsContract || []).reduce((sum, boq) => sum + (boq.actualAmount || 0), 0)
        : 0;

    const activeVOBuildingTotal = activeVOBuilding
        ? (activeVOBuilding.boqs || []).reduce((sum, boq) => sum + ((boq.actualQte || 0) * boq.unitPrice), 0)
        : 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                    <Icon icon={calendarDaysIcon} className="text-purple-600 dark:text-purple-400 size-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-base-content">Period & BOQ Progress</h2>
                    <p className="text-sm text-base-content/70">Set work period dates and enter BOQ progress quantities</p>
                </div>
            </div>

            {/* Contract Context Bar */}
            <div className="bg-base-200 p-3 rounded-lg border border-base-300">
                <div className="flex items-center gap-2 mb-2">
                    <Icon icon={infoIcon} className="text-blue-600 dark:text-blue-400 size-4" />
                    <h3 className="font-semibold text-base-content text-sm">Contract: {contractInfo.contractNumber}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                        <span className="text-base-content/60">Project:</span>
                        <div className="font-medium text-base-content">{contractInfo.projectName}</div>
                    </div>
                    <div>
                        <span className="text-base-content/60">Subcontractor:</span>
                        <div className="font-medium text-base-content">{contractInfo.subcontractorName}</div>
                    </div>
                    <div>
                        <span className="text-base-content/60">IPC Type:</span>
                        <div className="font-medium text-base-content">{formData.type}</div>
                    </div>
                </div>
            </div>

            {/* Work Period Section - PROMINENT like legacy */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                    <span className="iconify lucide--calendar-range size-4"></span>
                    Work Period Covered *
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* IPC Date */}
                    <div className="floating-label-group">
                        <input
                            type="date"
                            value={formData.dateIpc}
                            onChange={(e) => handleInputChange('dateIpc', e.target.value)}
                            className="input input-sm bg-base-100 border-base-300 floating-input w-full"
                            placeholder=" "
                        />
                        <label className="floating-label">IPC Date *</label>
                    </div>

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

                {/* Quick Period Presets */}
                <div className="mt-3 flex flex-wrap gap-2">
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
                        className="btn btn-xs bg-base-200 text-base-content hover:bg-base-300 border-base-300"
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
                        className="btn btn-xs bg-base-200 text-base-content hover:bg-base-300 border-base-300"
                    >
                        Last Month
                    </button>
                    {formData.fromDate && formData.toDate && (
                        <div className="flex items-center gap-2 ml-auto text-xs text-blue-600 dark:text-blue-400">
                            <span className="iconify lucide--calendar-check size-3"></span>
                            <span>{Math.ceil((new Date(formData.toDate).getTime() - new Date(formData.fromDate).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                        </div>
                    )}
                </div>
            </div>

            {/* View Mode Toggle */}
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
                            if (safeVOs.length > 0 && !activeVOId) {
                                setActiveVOId(safeVOs[0].id);
                                if (safeVOs[0].buildings.length > 0) {
                                    setActiveVOBuildingId(safeVOs[0].buildings[0].id);
                                }
                            }
                        }}
                        className={`btn btn-sm ${viewMode === "vo" ? "btn-primary" : "bg-base-200 text-base-content hover:bg-base-300 border-base-300"}`}
                        disabled={safeVOs.length === 0}
                    >
                        Variation Orders ({safeVOs.length})
                    </button>
                </div>

                {/* Input Mode Toggle */}
                <div className="flex items-center gap-2 border-l border-base-300 pl-4">
                    <span className="text-sm text-base-content/70">Input Mode:</span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setInputMode('quantity')}
                            className={`btn btn-xs ${inputMode === 'quantity' ? 'btn-primary' : 'bg-base-200 text-base-content hover:bg-base-300 border-base-300'}`}
                            title="Enter actual quantities"
                        >
                            <Icon icon={hashIcon} className="size-3" />
                            <span>Quantity</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMode('percentage')}
                            className={`btn btn-xs ${inputMode === 'percentage' ? 'btn-primary' : 'bg-base-200 text-base-content hover:bg-base-300 border-base-300'}`}
                            title="Enter percentages (will convert to quantities)"
                        >
                            <Icon icon={percentIcon} className="size-3" />
                            <span>Percentage</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* BOQ Table - Full Page View (Legacy SAM Pattern) */}
            {viewMode === "contract" && activeBuilding && (
                <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
                    {/* Building Header */}
                    <div className="bg-base-200 p-3 border-b border-base-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Icon icon={buildingIcon} className="text-blue-600 dark:text-blue-400 size-5" />
                                <h3 className="font-semibold text-base-content">{activeBuilding.buildingName}</h3>
                                <span className="text-sm text-base-content/60">• Sheet: {activeBuilding.sheetName}</span>
                                <span className="text-sm text-base-content/60">• {(activeBuilding.boqsContract || []).length} items</span>
                            </div>
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                Building Total: {formatCurrency(activeBuildingTotal)}
                            </div>
                        </div>
                    </div>

                    {/* BOQ Table */}
                    <div className="overflow-x-auto">
                        <table className="table table-xs w-full">
                            <thead className="bg-base-200 sticky top-0">
                                <tr>
                                    <th className="text-left w-16">N°</th>
                                    <th className="text-left min-w-[200px]">Item</th>
                                    <th className="text-center w-16">Unit</th>
                                    <th className="text-right w-24">Quantity</th>
                                    <th className="text-right w-24">Unit Price</th>
                                    <th className="text-right w-28">Total Amount</th>
                                    <th className="text-right w-24">Previous Qty</th>
                                    <th className="text-right w-28">Actual Qty</th>
                                    <th className="text-right w-24">Cumul Qty</th>
                                    <th className="text-right w-20">Cumul %</th>
                                    <th className="text-right w-28">Previous Amt</th>
                                    <th className="text-right w-28">Actual Amt</th>
                                    <th className="text-right w-28">Cumul Amt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeBuilding.boqsContract || []).map(boq => {
                                    const actualQte = boq.actualQte || 0;
                                    const precedQte = boq.precedQte || 0;
                                    const maxAllowed = Math.max(0, boq.qte - precedQte);
                                    const isInvalid = actualQte > maxAllowed;

                                    // Bold style for header rows (qte=0 and pu=0 like legacy)
                                    const isHeaderRow = boq.qte === 0 && boq.unitPrice === 0;

                                    return (
                                        <tr key={boq.id} className={`hover:bg-base-200/50 ${isHeaderRow ? 'font-bold bg-base-200' : ''}`}>
                                            <td className="font-mono text-xs">{boq.no}</td>
                                            <td className="text-xs">
                                                <div className="truncate max-w-[200px]" title={boq.key}>{boq.key}</div>
                                            </td>
                                            <td className="text-center text-xs">{boq.unite}</td>
                                            <td className="text-right text-xs font-medium">{boq.qte.toFixed(2)}</td>
                                            <td className="text-right text-xs">{formatCurrency(boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-medium">{formatCurrency(boq.qte * boq.unitPrice)}</td>
                                            <td className="text-right text-xs">{precedQte.toFixed(2)}</td>
                                            <td className="text-right">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={actualQte}
                                                        onChange={(e) => handleBOQQuantityChange(
                                                            activeBuilding.id,
                                                            boq.id,
                                                            parseFloat(e.target.value) || 0
                                                        )}
                                                        className={`input input-xs w-24 text-right bg-base-100 ${isInvalid ? 'border-error border-2' : 'border-base-300'}`}
                                                        step="0.01"
                                                        min="0"
                                                        max={maxAllowed}
                                                        disabled={isHeaderRow}
                                                    />
                                                </div>
                                            </td>
                                            <td className="text-right text-xs font-medium">{(precedQte + actualQte).toFixed(2)}</td>
                                            <td className="text-right text-xs">
                                                {boq.qte === 0 ? '0%' : `${(((precedQte + actualQte) / boq.qte) * 100).toFixed(1)}%`}
                                            </td>
                                            <td className="text-right text-xs">{formatCurrency(precedQte * boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-semibold text-blue-600">{formatCurrency(actualQte * boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-medium">{formatCurrency((precedQte + actualQte) * boq.unitPrice)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* Totals Row - Scrolls with table like legacy */}
                            <tfoot className="bg-base-200 border-t-2 border-base-300">
                                <tr className="font-semibold">
                                    <td colSpan={5} className="text-right">Totals:</td>
                                    <td className="text-right">
                                        {formatCurrency((activeBuilding.boqsContract || []).reduce((sum, boq) => sum + (boq.qte * boq.unitPrice), 0))}
                                    </td>
                                    <td className="text-right">
                                        {((activeBuilding.boqsContract || []).reduce((sum, boq) => sum + (boq.precedQte || 0), 0)).toFixed(2)}
                                    </td>
                                    <td className="text-right">
                                        {((activeBuilding.boqsContract || []).reduce((sum, boq) => sum + (boq.actualQte || 0), 0)).toFixed(2)}
                                    </td>
                                    <td className="text-right">
                                        {((activeBuilding.boqsContract || []).reduce((sum, boq) => sum + ((boq.precedQte || 0) + (boq.actualQte || 0)), 0)).toFixed(2)}
                                    </td>
                                    <td></td>
                                    <td className="text-right">
                                        {formatCurrency((activeBuilding.boqsContract || []).reduce((sum, boq) => sum + ((boq.precedQte || 0) * boq.unitPrice), 0))}
                                    </td>
                                    <td className="text-right text-blue-600">
                                        {formatCurrency(activeBuildingTotal)}
                                    </td>
                                    <td className="text-right">
                                        {formatCurrency((activeBuilding.boqsContract || []).reduce((sum, boq) => sum + (((boq.precedQte || 0) + (boq.actualQte || 0)) * boq.unitPrice), 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* VO BOQ Table */}
            {viewMode === "vo" && activeVO && activeVOBuilding && (
                <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
                    {/* VO Header */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 border-b border-purple-200 dark:border-purple-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="iconify lucide--file-plus-2 text-purple-600 dark:text-purple-400 size-5"></span>
                                <h3 className="font-semibold text-purple-600 dark:text-purple-400">{activeVO.voNumber}</h3>
                                <span className="text-sm text-purple-600/70 dark:text-purple-400/70">• {activeVOBuilding.buildingName}</span>
                                <span className="text-sm text-purple-600/70 dark:text-purple-400/70">• {(activeVOBuilding.boqs || []).length} items</span>
                            </div>
                            <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                VO Building Total: {formatCurrency(activeVOBuildingTotal)}
                            </div>
                        </div>
                    </div>

                    {/* VO BOQ Table */}
                    <div className="overflow-x-auto">
                        <table className="table table-xs w-full">
                            <thead className="bg-base-200 sticky top-0">
                                <tr>
                                    <th className="text-left w-16">N°</th>
                                    <th className="text-left min-w-[200px]">Item</th>
                                    <th className="text-center w-16">Unit</th>
                                    <th className="text-right w-24">VO Qty</th>
                                    <th className="text-right w-24">Unit Price</th>
                                    <th className="text-right w-28">Total Amount</th>
                                    <th className="text-right w-24">Previous Qty</th>
                                    <th className="text-right w-28">Actual Qty</th>
                                    <th className="text-right w-24">Cumul Qty</th>
                                    <th className="text-right w-20">Cumul %</th>
                                    <th className="text-right w-28">Previous Amt</th>
                                    <th className="text-right w-28">Actual Amt</th>
                                    <th className="text-right w-28">Cumul Amt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeVOBuilding.boqs || []).map(boq => {
                                    const actualQte = boq.actualQte || 0;
                                    const precedQte = boq.precedQte || 0;
                                    const maxAllowed = Math.max(0, boq.qte - precedQte);
                                    const isInvalid = actualQte > maxAllowed;
                                    const isHeaderRow = boq.qte === 0 && boq.unitPrice === 0;

                                    return (
                                        <tr key={boq.id} className={`hover:bg-base-200/50 ${isHeaderRow ? 'font-bold bg-base-200' : ''}`}>
                                            <td className="font-mono text-xs">{boq.no}</td>
                                            <td className="text-xs">
                                                <div className="truncate max-w-[200px]" title={boq.key || ''}>{boq.key}</div>
                                            </td>
                                            <td className="text-center text-xs">{boq.unite}</td>
                                            <td className="text-right text-xs font-medium">{boq.qte.toFixed(2)}</td>
                                            <td className="text-right text-xs">{formatCurrency(boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-medium">{formatCurrency(boq.qte * boq.unitPrice)}</td>
                                            <td className="text-right text-xs">{precedQte.toFixed(2)}</td>
                                            <td className="text-right">
                                                <input
                                                    type="number"
                                                    value={actualQte}
                                                    onChange={(e) => handleVOBOQQuantityChange(
                                                        activeVO.id,
                                                        activeVOBuilding.id,
                                                        boq.id,
                                                        parseFloat(e.target.value) || 0
                                                    )}
                                                    className={`input input-xs w-24 text-right bg-base-100 ${isInvalid ? 'border-error border-2' : 'border-base-300'}`}
                                                    step="0.01"
                                                    min="0"
                                                    max={maxAllowed}
                                                    disabled={isHeaderRow}
                                                />
                                            </td>
                                            <td className="text-right text-xs font-medium">{(precedQte + actualQte).toFixed(2)}</td>
                                            <td className="text-right text-xs">
                                                {boq.qte === 0 ? '0%' : `${(((precedQte + actualQte) / boq.qte) * 100).toFixed(1)}%`}
                                            </td>
                                            <td className="text-right text-xs">{formatCurrency(precedQte * boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-semibold text-purple-600">{formatCurrency(actualQte * boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-medium">{formatCurrency((precedQte + actualQte) * boq.unitPrice)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-base-200 border-t-2 border-base-300">
                                <tr className="font-semibold">
                                    <td colSpan={5} className="text-right">Totals:</td>
                                    <td className="text-right">
                                        {formatCurrency((activeVOBuilding.boqs || []).reduce((sum, boq) => sum + (boq.qte * boq.unitPrice), 0))}
                                    </td>
                                    <td className="text-right">
                                        {((activeVOBuilding.boqs || []).reduce((sum, boq) => sum + (boq.precedQte || 0), 0)).toFixed(2)}
                                    </td>
                                    <td className="text-right">
                                        {((activeVOBuilding.boqs || []).reduce((sum, boq) => sum + (boq.actualQte || 0), 0)).toFixed(2)}
                                    </td>
                                    <td className="text-right">
                                        {((activeVOBuilding.boqs || []).reduce((sum, boq) => sum + ((boq.precedQte || 0) + (boq.actualQte || 0)), 0)).toFixed(2)}
                                    </td>
                                    <td></td>
                                    <td className="text-right">
                                        {formatCurrency((activeVOBuilding.boqs || []).reduce((sum, boq) => sum + ((boq.precedQte || 0) * boq.unitPrice), 0))}
                                    </td>
                                    <td className="text-right text-purple-600">
                                        {formatCurrency(activeVOBuildingTotal)}
                                    </td>
                                    <td className="text-right">
                                        {formatCurrency((activeVOBuilding.boqs || []).reduce((sum, boq) => sum + (((boq.precedQte || 0) + (boq.actualQte || 0)) * boq.unitPrice), 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Building Tabs at Bottom - Legacy SAM Pattern */}
            {viewMode === "contract" && safeBuildings.length > 0 && (
                <div className="bg-base-200 p-2 rounded-lg border border-base-300">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <span className="text-xs text-base-content/60 font-medium whitespace-nowrap">Buildings:</span>
                        {safeBuildings.map(building => (
                            <button
                                key={building.id}
                                type="button"
                                onClick={() => setActiveBuildingId(building.id)}
                                className={`btn btn-xs whitespace-nowrap ${
                                    building.id === activeBuildingId
                                        ? 'btn-primary'
                                        : 'bg-base-100 text-base-content hover:bg-base-300 border-base-300'
                                }`}
                            >
                                {building.buildingName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* VO Tabs at Bottom */}
            {viewMode === "vo" && activeVO && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex flex-col gap-2">
                        {/* VO Selection */}
                        <div className="flex items-center gap-2 overflow-x-auto">
                            <span className="text-xs text-purple-600/60 dark:text-purple-400/60 font-medium whitespace-nowrap">VO:</span>
                            {safeVOs.map(vo => (
                                <button
                                    key={vo.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveVOId(vo.id);
                                        if (vo.buildings.length > 0) {
                                            setActiveVOBuildingId(vo.buildings[0].id);
                                        }
                                    }}
                                    className={`btn btn-xs whitespace-nowrap ${
                                        vo.id === activeVOId
                                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                                            : 'bg-base-100 text-base-content hover:bg-base-300 border-base-300'
                                    }`}
                                >
                                    {vo.voNumber}
                                </button>
                            ))}
                        </div>
                        {/* Building Selection for Active VO */}
                        {activeVO && (
                            <div className="flex items-center gap-2 overflow-x-auto">
                                <span className="text-xs text-purple-600/60 dark:text-purple-400/60 font-medium whitespace-nowrap">Buildings:</span>
                                {activeVO.buildings.map(building => (
                                    <button
                                        key={building.id}
                                        type="button"
                                        onClick={() => setActiveVOBuildingId(building.id)}
                                        className={`btn btn-xs whitespace-nowrap ${
                                            building.id === activeVOBuildingId
                                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                : 'bg-base-100 text-base-content hover:bg-base-300 border-base-300'
                                        }`}
                                    >
                                        {building.buildingName}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
