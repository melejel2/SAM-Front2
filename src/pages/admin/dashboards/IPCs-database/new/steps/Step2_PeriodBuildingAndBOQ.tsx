import React, { useState, useEffect, useRef, useMemo } from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import type { Vos, CorrectPreviousValueRequest, CorrectionResultDTO, CorrectionHistoryDTO, CorrectionHistoryRequest } from "@/types/ipc";
import { CorrectionEntityType } from "@/types/ipc";
import { Icon } from "@iconify/react";
import infoIcon from "@iconify/icons-lucide/info";
import buildingIcon from "@iconify/icons-lucide/building";
import { useAuth } from "@/contexts/auth";
import { ipcApiService } from "@/api/services/ipc-api";
import ExcelJS from "exceljs";
import useToast from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { usePermissions } from "@/hooks/use-permissions";
import CorrectPreviousValueModal from "../../components/CorrectPreviousValueModal";
import CorrectionHistoryModal from "../../components/CorrectionHistoryModal";

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

    // Effect to fetch all buildings for the selected contract
    useEffect(() => {
        const fetchAllBuildings = async () => {
            if (selectedContract) {
                const token = getToken();
                if (!token) return;
                const response = await ipcApiService.getContractDataForNewIpc(selectedContract.id, token);
                if (response.success && response.data) {
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
        const isEditMode = (formData as any).id && (formData as any).id > 0;
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

    // In Edit mode, get contract info from formData instead of selectedContract
    const contractInfo = selectedContract || {
        contractNumber: (formData as any).contract || 'N/A',
        projectName: (formData as any).projectName || 'N/A',
        subcontractorName: (formData as any).subcontractorName || 'N/A',
    };

    return (
        <div className="space-y-4">
            {/* Combined Card: Contract Info + Work Period */}
            <div className="bg-base-100 rounded-lg border border-base-300 p-4">
                {/* Contract Context Header */}
                <div className="flex items-center gap-6 text-sm flex-wrap mb-4 pb-3 border-b border-base-300">
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--file-text text-primary size-4"></span>
                        <span className="text-base-content/70 font-medium">Contract:</span>
                        <span className="font-semibold text-base-content">{contractInfo.contractNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--building-2 text-primary size-4"></span>
                        <span className="text-base-content/70 font-medium">Project:</span>
                        <span className="font-semibold text-base-content">{contractInfo.projectName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--users text-primary size-4"></span>
                        <span className="text-base-content/70 font-medium">Subcontractor:</span>
                        <span className="font-semibold text-base-content">{contractInfo.subcontractorName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--file-check text-primary size-4"></span>
                        <span className="text-base-content/70 font-medium">Type:</span>
                        <span className="font-semibold text-base-content">{formData.type}</span>
                    </div>
                </div>

                {/* Work Period Section */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-primary rounded-full"></span>
                    <h2 className="text-base font-semibold text-base-content">Work Period</h2>
                </div>

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
                            <div className="flex items-center gap-3">
                                {/* Excel Import/Export Buttons */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handleExportBOQ}
                                        className="btn btn-xs bg-green-600 hover:bg-green-700 text-white border-0"
                                        title="Export BOQ to Excel"
                                    >
                                        <span className="iconify lucide--download size-3.5"></span>
                                        Export
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="btn btn-xs bg-blue-600 hover:bg-blue-700 text-white border-0"
                                        title="Import BOQ from Excel"
                                    >
                                        <span className="iconify lucide--upload size-3.5"></span>
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
                                    <th className="text-right w-20">Contract Qty</th>
                                    <th className="text-right w-20">Unit Price</th>
                                    <th className="text-right w-24">Total Amt</th>
                                    <th className="text-right w-20">Prev Qty</th>
                                    <th className="text-right w-20 bg-green-50 dark:bg-green-900/20" title="Actual quantity this period">Actual Qty</th>
                                    <th className="text-right w-20 bg-purple-50 dark:bg-purple-900/20" title="Cumulative quantity to date">Cumul Qty</th>
                                    <th className="text-right w-16 bg-blue-50 dark:bg-blue-900/20" title="Cumulative percentage - editable">Cumul %</th>
                                    <th className="text-right w-20">Prev Amt</th>
                                    <th className="text-right w-20">Actual Amt</th>
                                    <th className="text-right w-20">Cumul Amt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeBuilding.boqsContract || []).map(boq => {
                                    const actualQte = boq.actualQte || 0;
                                    const precedQte = boq.precedQte || 0;
                                    const cumulQte = precedQte + actualQte;
                                    // Calculate cumulative percentage for display
                                    const cumulPercent = boq.qte === 0 ? 0 : (cumulQte / boq.qte) * 100;

                                    // Bold style for header rows (qte=0 and pu=0 like legacy)
                                    const isHeaderRow = boq.qte === 0 && boq.unitPrice === 0;

                                    return (
                                        <tr key={boq.id} className={`hover:bg-base-200/50 ${isHeaderRow ? 'font-bold bg-base-200' : ''}`}>
                                            <td className="font-mono text-xs">{boq.no}</td>
                                            <td className="text-xs">
                                                <div className="truncate max-w-[200px]" title={boq.key}>{boq.key}</div>
                                            </td>
                                            <td className="text-center text-xs">{boq.unite}</td>
                                            <td className="text-right text-xs font-medium">{boq.qte || ''}</td>
                                            <td className="text-right text-xs">{formatCurrency(boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-medium">{formatCurrency(boq.qte * boq.unitPrice)}</td>
                                            {/* Prev Qty - with correction button for authorized users */}
                                            <td className="text-right text-xs">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span>{precedQte || ''}</span>
                                                    {canCorrectPreviousValues && !isHeaderRow && precedQte > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openCorrectionModal(
                                                                CorrectionEntityType.ContractBoqItem,
                                                                boq.id,
                                                                precedQte,
                                                                `${boq.no || ''} - ${boq.key || 'BOQ Item'}`
                                                            )}
                                                            className="btn btn-ghost btn-xs p-0 min-h-0 h-4 w-4"
                                                            title="Correct previous quantity (audit trail)"
                                                        >
                                                            <span className="iconify lucide--pencil text-amber-500 size-3"></span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Actual Qty Input - Green highlight */}
                                            <td className="text-right bg-green-50/50 dark:bg-green-900/10">
                                                <input
                                                    type="number"
                                                    value={actualQte || ''}
                                                    onChange={(e) => handleBOQQuantityChange(
                                                        activeBuilding.id,
                                                        boq.id,
                                                        parseFloat(e.target.value) || 0
                                                    )}
                                                    className="input input-xs w-16 text-right bg-base-100 border-green-300 dark:border-green-700"
                                                    step="any"
                                                    min="0"
                                                    disabled={isHeaderRow}
                                                />
                                            </td>
                                            {/* Cumul Qty Input - Purple highlight */}
                                            <td className="text-right bg-purple-50/50 dark:bg-purple-900/10">
                                                <input
                                                    type="number"
                                                    value={cumulQte || ''}
                                                    onChange={(e) => handleBOQCumulQtyChange(
                                                        activeBuilding.id,
                                                        boq.id,
                                                        parseFloat(e.target.value) || 0
                                                    )}
                                                    className="input input-xs w-16 text-right bg-base-100 border-purple-300 dark:border-purple-700"
                                                    step="any"
                                                    min="0"
                                                    disabled={isHeaderRow}
                                                />
                                            </td>
                                            {/* Cumul % Input - Blue highlight (editable) */}
                                            <td className="text-right bg-blue-50/50 dark:bg-blue-900/10">
                                                <div className="flex items-center justify-end gap-0.5">
                                                    <input
                                                        type="number"
                                                        value={cumulPercent ? Math.round(cumulPercent * 100) / 100 : ''}
                                                        onChange={(e) => handleBOQCumulPercentChange(
                                                            activeBuilding.id,
                                                            boq.id,
                                                            parseFloat(e.target.value) || 0
                                                        )}
                                                        className="input input-xs w-14 text-right bg-base-100 border-blue-300 dark:border-blue-700"
                                                        step="any"
                                                        min="0"
                                                        disabled={isHeaderRow || boq.qte === 0}
                                                    />
                                                    <span className="text-xs text-base-content/50">%</span>
                                                </div>
                                            </td>
                                            <td className="text-right text-xs">{formatCurrency(precedQte * boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-semibold text-green-600">{formatCurrency(actualQte * boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-medium">{formatCurrency(cumulQte * boq.unitPrice)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* Totals Row - uses memoized values to avoid recalculation */}
                            <tfoot className="bg-base-200 border-t-2 border-base-300">
                                <tr className="font-semibold">
                                    <td colSpan={5} className="text-right">Totals:</td>
                                    <td className="text-right">
                                        {formatCurrency(contractBOQContractTotal)}
                                    </td>
                                    <td className="text-right"></td>
                                    <td className="text-right bg-green-50/50 dark:bg-green-900/10"></td>
                                    <td className="text-right bg-purple-50/50 dark:bg-purple-900/10"></td>
                                    <td className="text-right bg-blue-50/50 dark:bg-blue-900/10"></td>
                                    <td className="text-right">
                                        {formatCurrency(contractBOQPrecedTotal)}
                                    </td>
                                    <td className="text-right text-green-600">
                                        {formatCurrency(activeBuildingTotal)}
                                    </td>
                                    <td className="text-right">
                                        {formatCurrency(contractBOQCumulTotal)}
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
                                    <th className="text-right w-20">VO Qty</th>
                                    <th className="text-right w-20">Unit Price</th>
                                    <th className="text-right w-24">Total Amt</th>
                                    <th className="text-right w-20">Prev Qty</th>
                                    <th className="text-right w-20 bg-green-50 dark:bg-green-900/20" title="Actual quantity this period">Actual Qty</th>
                                    <th className="text-right w-20 bg-purple-50 dark:bg-purple-900/20" title="Cumulative quantity to date">Cumul Qty</th>
                                    <th className="text-right w-16 bg-blue-50 dark:bg-blue-900/20" title="Cumulative percentage - editable">Cumul %</th>
                                    <th className="text-right w-20">Prev Amt</th>
                                    <th className="text-right w-20">Actual Amt</th>
                                    <th className="text-right w-20">Cumul Amt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(activeVOBuilding.boqs || []).map(boq => {
                                    const actualQte = boq.actualQte || 0;
                                    const precedQte = boq.precedQte || 0;
                                    const cumulQte = precedQte + actualQte;
                                    const cumulPercent = boq.qte === 0 ? 0 : (cumulQte / boq.qte) * 100;
                                    const isHeaderRow = boq.qte === 0 && boq.unitPrice === 0;

                                    return (
                                        <tr key={boq.id} className={`hover:bg-base-200/50 ${isHeaderRow ? 'font-bold bg-base-200' : ''}`}>
                                            <td className="font-mono text-xs">{boq.no}</td>
                                            <td className="text-xs">
                                                <div className="truncate max-w-[200px]" title={boq.key || ''}>{boq.key}</div>
                                            </td>
                                            <td className="text-center text-xs">{boq.unite}</td>
                                            <td className="text-right text-xs font-medium">{boq.qte || ''}</td>
                                            <td className="text-right text-xs">{formatCurrency(boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-medium">{formatCurrency(boq.qte * boq.unitPrice)}</td>
                                            {/* Prev Qty - with correction button for authorized users */}
                                            <td className="text-right text-xs">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span>{precedQte || ''}</span>
                                                    {canCorrectPreviousValues && !isHeaderRow && precedQte > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openCorrectionModal(
                                                                CorrectionEntityType.ContractVo,
                                                                boq.id,
                                                                precedQte,
                                                                `VO ${activeVO.voNumber} - ${boq.no || ''} - ${boq.key || 'VO Item'}`
                                                            )}
                                                            className="btn btn-ghost btn-xs p-0 min-h-0 h-4 w-4"
                                                            title="Correct previous quantity (audit trail)"
                                                        >
                                                            <span className="iconify lucide--pencil text-amber-500 size-3"></span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Actual Qty Input - Green highlight */}
                                            <td className="text-right bg-green-50/50 dark:bg-green-900/10">
                                                <input
                                                    type="number"
                                                    value={actualQte || ''}
                                                    onChange={(e) => handleVOBOQQuantityChange(
                                                        activeVO.id,
                                                        activeVOBuilding.id,
                                                        boq.id,
                                                        parseFloat(e.target.value) || 0
                                                    )}
                                                    className="input input-xs w-16 text-right bg-base-100 border-green-300 dark:border-green-700"
                                                    step="any"
                                                    min="0"
                                                    disabled={isHeaderRow}
                                                />
                                            </td>
                                            {/* Cumul Qty Input - Purple highlight */}
                                            <td className="text-right bg-purple-50/50 dark:bg-purple-900/10">
                                                <input
                                                    type="number"
                                                    value={cumulQte || ''}
                                                    onChange={(e) => handleVOBOQCumulQtyChange(
                                                        activeVO.id,
                                                        activeVOBuilding.id,
                                                        boq.id,
                                                        parseFloat(e.target.value) || 0
                                                    )}
                                                    className="input input-xs w-16 text-right bg-base-100 border-purple-300 dark:border-purple-700"
                                                    step="any"
                                                    min="0"
                                                    disabled={isHeaderRow}
                                                />
                                            </td>
                                            {/* Cumul % Input - Blue highlight (editable) */}
                                            <td className="text-right bg-blue-50/50 dark:bg-blue-900/10">
                                                <div className="flex items-center justify-end gap-0.5">
                                                    <input
                                                        type="number"
                                                        value={cumulPercent ? Math.round(cumulPercent * 100) / 100 : ''}
                                                        onChange={(e) => handleVOBOQCumulPercentChange(
                                                            activeVO.id,
                                                            activeVOBuilding.id,
                                                            boq.id,
                                                            parseFloat(e.target.value) || 0
                                                        )}
                                                        className="input input-xs w-14 text-right bg-base-100 border-blue-300 dark:border-blue-700"
                                                        step="any"
                                                        min="0"
                                                        disabled={isHeaderRow || boq.qte === 0}
                                                    />
                                                    <span className="text-xs text-base-content/50">%</span>
                                                </div>
                                            </td>
                                            <td className="text-right text-xs">{formatCurrency(precedQte * boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-semibold text-green-600">{formatCurrency(actualQte * boq.unitPrice)}</td>
                                            <td className="text-right text-xs font-medium">{formatCurrency(cumulQte * boq.unitPrice)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {/* VO Totals Row - uses memoized values to avoid recalculation */}
                            <tfoot className="bg-base-200 border-t-2 border-base-300">
                                <tr className="font-semibold">
                                    <td colSpan={5} className="text-right">Totals:</td>
                                    <td className="text-right">
                                        {formatCurrency(voBOQContractTotal)}
                                    </td>
                                    <td className="text-right"></td>
                                    <td className="text-right bg-green-50/50 dark:bg-green-900/10"></td>
                                    <td className="text-right bg-purple-50/50 dark:bg-purple-900/10"></td>
                                    <td className="text-right bg-blue-50/50 dark:bg-blue-900/10"></td>
                                    <td className="text-right">
                                        {formatCurrency(voBOQPrecedTotal)}
                                    </td>
                                    <td className="text-right text-green-600">
                                        {formatCurrency(activeVOBuildingTotal)}
                                    </td>
                                    <td className="text-right">
                                        {formatCurrency(voBOQCumulTotal)}
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
        </div>
    );
};
