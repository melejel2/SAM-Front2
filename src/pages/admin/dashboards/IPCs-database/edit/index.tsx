import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ipcApiService } from "@/api/services/ipc-api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { useAuth } from "@/contexts/auth";
import { useIpcEdit } from "@/hooks/use-ipc-edit";
import useToast from "@/hooks/use-toast";
import type { ContractBuildingsVM, SaveIPCVM } from "@/types/ipc";

import IpcSummary from "../components/IpcSummary";
import PenaltyForm from "../components/PenaltyForm";

const IPCEdit: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toaster } = useToast();
    const { authState, getToken } = useAuth();
    const token = getToken();

    const {
        loading,
        saving,
        error,
        ipcData,
        summaryData,
        buildings,
        setBuildings,
        showPenaltyForm,
        penaltyData,
        loadIpcForEdit,
        updateIpc,
        openPenaltyForm,
        closePenaltyForm,
        updatePenaltyData,
        clearData,
        vos: initialVos,
        labors,
        machines,
        materials,
    } = useIpcEdit();

    const [vos, setVos] = useState<any[]>([]);
    useEffect(() => {
        if (ipcData?.vos) {
            setVos(ipcData.vos);
        }
    }, [ipcData]);

    const [isSaving, setIsSaving] = useState(false);

    const [activeTab, setActiveTab] = useState<"details" | "boq" | "financial" | "livepreview" | "documents" | "summary">("details");
    const [expandedBuildings, setExpandedBuildings] = useState<Set<number>>(new Set());
    const [editingQuantities, setEditingQuantities] = useState<Set<string>>(new Set());
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [exportingZip, setExportingZip] = useState(false);
    const [generatingIpc, setGeneratingIpc] = useState(false);
    const [livePreviewPdf, setLivePreviewPdf] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [loadingLivePreview, setLoadingLivePreview] = useState(false);
    const [calculatedTotals, setCalculatedTotals] = useState({
        totalAmount: 0,
        actualAmount: 0,
        retentionAmount: 0,
        advanceDeduction: 0,
        netPayment: 0,
    });
    const [formData, setFormData] = useState({
        ipcNumber: "",
        dateIpc: "",
        fromDate: "",
        toDate: "",
        retention: 0,
        advance: 0,
        remarks: "",
        retentionPercentage: 0,
        advancePaymentPercentage: 0,
        penalty: 0,
        previousPenalty: 0,
    });

    // Load IPC data on mount
    useEffect(() => {
        if (id) {
            const ipcId = parseInt(id);
            if (!isNaN(ipcId)) {
                loadIpcForEdit(ipcId);
            } else {
                toaster.error("Invalid IPC ID");
                navigate("/admin/dashboards/IPCs-database");
            }
        }

        return () => {
            clearData();
        };
    }, [id, loadIpcForEdit, clearData]);

    // Update form data when IPC loads
    useEffect(() => {
        if (ipcData) {
            const formatToHTMLDate = (isoString: string | undefined) => {
                if (!isoString) return "";
                try {
                    return new Date(isoString).toISOString().split("T")[0];
                } catch {
                    return "";
                }
            };

            setFormData((prev) => ({
                ...prev,
                ipcNumber: ipcData.number?.toString() || "",
                dateIpc: formatToHTMLDate(ipcData.dateIpc),
                fromDate: formatToHTMLDate(ipcData.fromDate),
                toDate: formatToHTMLDate(ipcData.toDate),
                retention: ipcData.retention || ipcData.retentionAmount || 0,
                advance: ipcData.advance || ipcData.advancePaymentAmount || 0,
                remarks: ipcData.remarks || "",
                retentionPercentage: ipcData.retentionPercentage || 0,
                advancePaymentPercentage: ipcData.advancePaymentPercentage || 0,
                penalty: ipcData.penalty || 0,
                previousPenalty: ipcData.previousPenalty || 0,
            }));
        }
    }, [ipcData]);

    // Calculate totals when buildings or form data changes
    useEffect(() => {
        const safeBuildings = buildings || [];
        const safeVos = vos || [];
        const safeLabors = labors || [];
        const safeMachines = machines || [];
        const safeMaterials = materials || [];

        const totalIPCAmount = safeBuildings.reduce(
            (sum, building) =>
                sum + (building.boqsContract || []).reduce((boqSum, boq) => boqSum + (boq.actualAmount || 0), 0),
            0,
        );

        const totalVosAmount = safeVos.reduce((sum, vo) => {
            const voAmount = vo.buildings.reduce((buildingSum, building) => {
                const buildingAmount = building.boqs.reduce((boqSum, boq) => {
                    return boqSum + (boq.actualAmount || 0);
                }, 0);
                return buildingSum + buildingAmount;
            }, 0);
            return sum + voAmount;
        }, 0);
        const totalLaborsAmount = safeLabors.reduce((sum, labor) => sum + (labor.amount || 0), 0);
        const totalMachinesAmount = safeMachines.reduce((sum, machine) => sum + (machine.amount || 0), 0);
        const totalMaterialsAmount = safeMaterials.reduce((sum, material) => sum + (material.totalSale || 0), 0);

        const grandTotalAmount =
            totalIPCAmount + totalVosAmount + totalLaborsAmount + totalMachinesAmount + totalMaterialsAmount;

        const retentionAmount = (grandTotalAmount * formData.retentionPercentage) / 100;
        const advanceDeduction = (grandTotalAmount * formData.advancePaymentPercentage) / 100;
        const netPayment = grandTotalAmount - retentionAmount - advanceDeduction - formData.penalty;

        setCalculatedTotals({
            totalAmount: grandTotalAmount,
            actualAmount: grandTotalAmount,
            retentionAmount,
            advanceDeduction,
            netPayment,
        });
    }, [
        buildings,
        vos,
        labors,
        machines,
        materials,
        formData.retentionPercentage,
        formData.advancePaymentPercentage,
        formData.penalty,
    ]);

    const getCurrentIpcDataForSave = (): SaveIPCVM | null => {
        if (!ipcData) {
            return null;
        }
        return {
            ...ipcData,
            number: Number(formData.ipcNumber) || ipcData.number,
            dateIpc: formData.dateIpc,
            fromDate: formData.fromDate,
            toDate: formData.toDate,
            retention: formData.retention,
            advance: formData.advance,
            remarks: formData.remarks,
            retentionPercentage: formData.retentionPercentage,
            advancePaymentPercentage: formData.advancePaymentPercentage,
            penalty: formData.penalty,
            previousPenalty: formData.previousPenalty,
            buildings: buildings,
            vos: vos, // Use the state `vos` instead of `ipcData.vos`
            labors: labors,
            machines: machines,
            materials: materials,
        };
    };

    const handleSave = async () => {
        const payload = getCurrentIpcDataForSave();
        if (!payload) {
            toaster.error("Could not prepare IPC data for saving.");
            return;
        }

        setIsSaving(true);
        try {
            const token = getToken();
            if (!token) {
                toaster.error("Authentication required.");
                setIsSaving(false);
                return;
            }

            const response = await ipcApiService.updateIpc(payload, token);

            if (response.success) {
                toaster.success("IPC updated successfully");
                // Reload data to reflect changes
                loadIpcForEdit(parseInt(id!));
            } else {
                toaster.error(response.error || "Failed to update IPC");
            }
        } catch (err) {
            toaster.error("An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePenaltySave = (penaltyFormData: typeof penaltyData) => {
        updatePenaltyData(penaltyFormData);
        setFormData((prev) => ({
            ...prev,
            penalty: penaltyFormData.penalty,
            previousPenalty: penaltyFormData.previousPenalty,
        }));
        closePenaltyForm();
        toaster.success("Penalty information updated");
    };

    const handleBack = () => {
        navigate("/dashboard/IPCs-database");
    };

    // Enhanced functionality for BOQ editing
    const handleBOQQuantityChange = (buildingId: number, boqId: number, actualQte: number) => {
        setBuildings((prevBuildings) =>
            prevBuildings.map((building) => {
                if (building.id === buildingId) {
                    return {
                        ...building,
                        boqsContract: (building.boqsContract || []).map((boq) => {
                            if (boq.id === boqId) {
                                const actualAmount = actualQte * boq.unitPrice;
                                const newCumulQte = (boq.precedQte || 0) + actualQte;
                                const newCumulAmount = newCumulQte * boq.unitPrice;
                                const newCumulPercent = boq.qte === 0 ? 0 : (newCumulQte / boq.qte) * 100;

                                return {
                                    ...boq,
                                    actualQte,
                                    actualAmount,
                                    cumulQte: newCumulQte,
                                    cumulAmount: newCumulAmount,
                                    cumulPercent: newCumulPercent,
                                };
                            }
                            return boq;
                        }),
                    };
                }
                return building;
            }),
        );
    };

    const handleVOQuantityChange = (voId: number, buildingId: number, boqId: number, actualQte: number) => {
        const newVos = JSON.parse(JSON.stringify(vos || []));
        const voToUpdate = newVos.find((v: any) => v.id === voId);
        if (voToUpdate) {
            const buildingToUpdate = voToUpdate.buildings.find((b: any) => b.id === buildingId);
            if (buildingToUpdate) {
                const boqToUpdate = buildingToUpdate.boqs.find((b: any) => b.id === boqId);
                if (boqToUpdate) {
                    boqToUpdate.actualQte = actualQte;
                    boqToUpdate.actualAmount = actualQte * boqToUpdate.unitPrice;
                    boqToUpdate.cumulQte = (boqToUpdate.precedQte || 0) + actualQte;
                    boqToUpdate.cumulAmount = boqToUpdate.cumulQte * boqToUpdate.unitPrice;
                    boqToUpdate.cumulPercent =
                        boqToUpdate.qte === 0 ? 0 : (boqToUpdate.cumulQte / boqToUpdate.qte) * 100;

                    const precedQte = boqToUpdate.precedQte || 0;
                    const maxAllowedQty = Math.max(0, boqToUpdate.qte - precedQte);

                    let validatedQte = actualQte;

                    if (actualQte < 0) {
                        validatedQte = 0;
                    } else if (actualQte > maxAllowedQty) {
                        validatedQte = maxAllowedQty;
                        toaster.warning(
                            `Maximum quantity for this item is ${maxAllowedQty.toFixed(2)} ${boqToUpdate.unite || ""}`,
                        );
                    }
                    boqToUpdate.actualQte = validatedQte;
                    boqToUpdate.actualAmount = validatedQte * boqToUpdate.unitPrice;
                    boqToUpdate.cumulQte = (boqToUpdate.precedQte || 0) + validatedQte;
                    boqToUpdate.cumulAmount = boqToUpdate.cumulQte * boqToUpdate.unitPrice;
                    boqToUpdate.cumulPercent = boqToUpdate.qte === 0 ? 0 : (boqToUpdate.cumulQte / boqToUpdate.qte) * 100;
                }
            }
        }
        setVos(newVos);
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

    // Document generation functions
    const handlePreviewIpc = async () => {
        if (!ipcData || !id) return;

        setLoadingPreview(true);
        try {
            const result = await ipcApiService.exportIpcPdf(parseInt(id), token ?? "");

            if (result.success && result.blob) {
                setPreviewData({
                    blob: result.blob,
                    fileName: `IPC_${ipcData.number || id}.pdf`,
                });
                setShowPreview(true);
            } else {
                toaster.error("Failed to generate IPC preview");
            }
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleExportPDF = async () => {
        if (!id || exportingPDF) return;

        setExportingPDF(true);
        try {
            const result = await ipcApiService.exportIpcPdf(parseInt(id), token ?? "");

            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `IPC_${ipcData?.number || id}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("IPC exported as PDF successfully!");
            } else {
                toaster.error("Failed to export IPC as PDF");
            }
        } catch (error) {
            toaster.error("PDF Export error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setExportingPDF(false);
        }
    };

    const handleExportExcel = async () => {
        if (!id || exportingExcel) return;

        setExportingExcel(true);
        try {
            const result = await ipcApiService.exportIpcExcel(parseInt(id), token ?? "");

            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `IPC_${ipcData?.number || id}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("IPC exported as Excel successfully!");
            } else {
                toaster.error("Failed to export IPC as Excel");
            }
        } catch (error) {
            toaster.error("Excel Export error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setExportingExcel(false);
        }
    };

    const handleExportZip = async () => {
        if (!id || exportingZip) return;

        setExportingZip(true);
        try {
            const result = await ipcApiService.exportIpcZip(parseInt(id), token ?? "");

            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `IPC_${ipcData?.number || id}_Documents.zip`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("IPC documents exported as ZIP successfully!");
            } else {
                toaster.error("Failed to export IPC documents as ZIP");
            }
        } catch (error) {
            toaster.error("ZIP Export error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setExportingZip(false);
        }
    };

    const handleGenerateIpc = async () => {
        if (!id) return;

        setGeneratingIpc(true);
        try {
            const result = await ipcApiService.generateIpc(parseInt(id), token ?? "");
            if (result.success) {
                toaster.success("IPC generated successfully!");
                // Reload IPC data to get updated status
                loadIpcForEdit(parseInt(id));
            }
        } finally {
            setGeneratingIpc(false);
        }
    };

    const handleFetchLivePreview = async () => {
        const currentIpcPayload = getCurrentIpcDataForSave();
        if (!currentIpcPayload) {
            toaster.error("Could not get current IPC data for preview.");
            return;
        }

        setLoadingLivePreview(true);
        setLivePreviewPdf(null); // Clear previous preview
        try {
            const result = await ipcApiService.livePreviewIpcPdf(currentIpcPayload, token ?? "");

            if (result.success && result.blob) {
                setLivePreviewPdf({
                    blob: result.blob,
                    fileName: `IPC_${currentIpcPayload.number || id}_live_preview.pdf`,
                });
            } else {
                toaster.error(result.error || "Failed to generate IPC live preview");
                setLivePreviewPdf(null);
            }
        } catch (error) {
            toaster.error(
                "Live preview generation error: " + (error instanceof Error ? error.message : "Unknown error"),
            );
            setLivePreviewPdf(null);
        } finally {
            setLoadingLivePreview(false);
        }
    };

    useEffect(() => {
        if (activeTab === "livepreview") {
            handleFetchLivePreview();
        }
    }, [activeTab]);

    const handleDelete = async () => {
        if (!id) return;

        if (window.confirm("Are you sure you want to delete this IPC?")) {
            try {
                const result = await ipcApiService.deleteIpc(parseInt(id), token ?? "");
                if (result.success) {
                    toaster.success("IPC deleted successfully!");
                    navigate("/admin/dashboards/IPCs-database");
                } else {
                    toaster.error(result.message || "Failed to delete IPC");
                }
            } catch (error) {
                toaster.error("An error occurred while deleting the IPC.");
            }
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (error || !ipcData) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
                <span className="iconify lucide--alert-circle text-error size-12"></span>
                <div className="text-center">
                    <h2 className="text-base-content mb-2 text-lg font-semibold">Error Loading IPC</h2>
                    <p className="text-base-content/70 mb-4">{error || "IPC not found"}</p>
                    <button onClick={handleBack} className="btn btn-primary">
                        Back to IPC Database
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl p-4">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={handleBack} className="btn btn-sm btn-ghost">
                        <span className="iconify lucide--arrow-left size-4"></span>
                    </button>
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                        <span className="iconify lucide--file-edit size-5 text-blue-600 dark:text-blue-400"></span>
                    </div>
                    <div>
                        <h1 className="text-base-content text-2xl font-bold">
                            Edit IPC {ipcData.number || `#${ipcData.id}`}
                        </h1>
                        <p className="text-base-content/70 text-sm">
                            Contract: {ipcData.contract || "N/A"} | Subcontractor: {ipcData.subcontractorName || "N/A"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePreviewIpc}
                        disabled={loadingPreview}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
                        {loadingPreview ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                <span>Loading...</span>
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--eye size-4"></span>
                                <span>Preview</span>
                            </>
                        )}
                    </button>

                    <div className="dropdown dropdown-end">
                        <button
                            tabIndex={0}
                            className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                            disabled={exportingPDF || exportingExcel || exportingZip}>
                            {exportingPDF || exportingExcel || exportingZip ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--download size-4"></span>
                                    <span>Export</span>
                                    <span className="iconify lucide--chevron-down size-3"></span>
                                </>
                            )}
                        </button>
                        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow">
                            <li>
                                <a onClick={handleExportPDF}>
                                    <span className="iconify lucide--file-text size-4"></span>
                                    Export as PDF
                                </a>
                            </li>
                            <li>
                                <a onClick={handleExportExcel}>
                                    <span className="iconify lucide--file-spreadsheet size-4"></span>
                                    Export as Excel
                                </a>
                            </li>
                            <li>
                                <a onClick={handleExportZip}>
                                    <span className="iconify lucide--archive size-4"></span>
                                    Export as ZIP
                                </a>
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => openPenaltyForm(ipcData.penalty || 0, ipcData.previousPenalty || 0)}
                        className="btn btn-sm flex items-center gap-2 bg-red-600 text-white hover:bg-red-700">
                        <span className="iconify lucide--alert-triangle size-4"></span>
                        Penalties
                    </button>

                    {ipcData.status === "Editable" && (
                        <button
                            onClick={handleGenerateIpc}
                            disabled={generatingIpc}
                            className="btn btn-sm flex items-center gap-2 bg-green-600 text-white hover:bg-green-700">
                            {generatingIpc ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--check-circle size-4"></span>
                                    <span>Generate</span>
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn btn-sm btn-primary flex items-center gap-2">
                        {isSaving ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--save size-4"></span>
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="btn btn-sm btn-danger flex items-center gap-2">
                        <span className="iconify lucide--trash size-4"></span>
                        <span>Delete IPC</span>
                    </button>
                </div>
            </div>

            {/* Financial Summary - Always visible at top */}
            <div className="mb-6">
                <IpcSummary summaryData={summaryData} loading={loading} className="shadow-sm" />
            </div>

            {/* Enhanced Tabs */}
            <div className="tabs tabs-lifted tabs-lg mb-6">
                <button
                    className={`tab tab-lifted ${activeTab === "details" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("details")}>
                    <span className="iconify lucide--edit mr-2 size-4"></span>
                    IPC Details
                </button>
                <button
                    className={`tab tab-lifted ${activeTab === "boq" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("boq")}>
                    <span className="iconify lucide--building mr-2 size-4"></span>
                    BOQ Progress
                </button>
                <button
                    className={`tab tab-lifted ${activeTab === "financial" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("financial")}>
                    <span className="iconify lucide--calculator mr-2 size-4"></span>
                    Financial Calculations
                </button>
                <button
                    className={`tab tab-lifted ${activeTab === "livepreview" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("livepreview")}>
                    <span className="iconify lucide--eye mr-2 size-4"></span>
                    Live Preview
                </button>
                <button
                    className={`tab tab-lifted ${activeTab === "documents" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("documents")}>
                    <span className="iconify lucide--file-text mr-2 size-4"></span>
                    Documents
                </button>
            </div>

            {/* Tab Content */}
            <div className="bg-base-100 border-base-300 rounded-lg border p-6 shadow-sm">
                {activeTab === "details" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {/* IPC Number */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">IPC Number *</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.ipcNumber}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, ipcNumber: e.target.value }))}
                                    className="input input-bordered"
                                    placeholder="Enter IPC number"
                                    readOnly
                                />
                            </div>

                            {/* IPC Date */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">IPC Date *</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.dateIpc}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, dateIpc: e.target.value }))}
                                    className="input input-bordered"
                                />
                            </div>

                            {/* From Date */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Period From</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.fromDate}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, fromDate: e.target.value }))}
                                    className="input input-bordered"
                                />
                            </div>

                            {/* To Date */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Period To</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.toDate}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, toDate: e.target.value }))}
                                    className="input input-bordered"
                                />
                            </div>

                            {/* Retention */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Retention Amount</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.retention}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, retention: parseFloat(e.target.value) || 0 }))
                                    }
                                    className="input input-bordered"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>

                            {/* Advance */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Advance Payment</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.advance}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, advance: parseFloat(e.target.value) || 0 }))
                                    }
                                    className="input input-bordered"
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Remarks</span>
                            </label>
                            <textarea
                                value={formData.remarks}
                                onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                                className="textarea textarea-bordered h-24 resize-none"
                                placeholder="Enter any additional remarks or notes for this IPC"
                            />
                        </div>

                        {/* Penalty Information Display */}
                        {(ipcData.penalty > 0 || ipcData.previousPenalty > 0) && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                                <div className="mb-3 flex items-center gap-2">
                                    <span className="iconify lucide--alert-triangle size-5 text-red-600 dark:text-red-400"></span>
                                    <h3 className="font-semibold text-red-600 dark:text-red-400">
                                        Penalty Information
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                                    <div>
                                        <span className="text-red-600/70 dark:text-red-400/70">Previous Penalty:</span>
                                        <div className="font-semibold text-red-600 dark:text-red-400">
                                            {formatCurrency(ipcData.previousPenalty || 0)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-red-600/70 dark:text-red-400/70">Current Penalty:</span>
                                        <div className="font-semibold text-red-600 dark:text-red-400">
                                            {formatCurrency(ipcData.penalty || 0)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-red-600/70 dark:text-red-400/70">
                                            Penalty Difference:
                                        </span>
                                        <div className="font-semibold text-red-600 dark:text-red-400">
                                            {formatCurrency((ipcData.penalty || 0) - (ipcData.previousPenalty || 0))}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openPenaltyForm(ipcData.penalty || 0, ipcData.previousPenalty || 0)}
                                    className="btn btn-sm mt-3 bg-red-600 text-white hover:bg-red-700">
                                    <span className="iconify lucide--edit size-4"></span>
                                    Modify Penalty
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "summary" && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-base-content mb-2 text-lg font-semibold">Detailed Financial Summary</h3>
                            <p className="text-base-content/70">Complete breakdown of contract financial status</p>
                        </div>

                        {/* Enhanced Summary Display */}
                        <IpcSummary summaryData={summaryData} loading={loading} className="" />

                        {/* Additional Financial Details */}
                        {summaryData && (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="bg-base-200 rounded-lg p-4">
                                    <h4 className="text-base-content mb-3 font-semibold">Payment History</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-base-content/70">Total Contract Value:</span>
                                            <span className="font-medium">{formatCurrency(summaryData.amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-base-content/70">Previous Payments:</span>
                                            <span className="font-medium text-green-600">
                                                {formatCurrency(summaryData.previousPaid)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2">
                                            <span className="text-base-content/70">Remaining Balance:</span>
                                            <span className="font-semibold text-orange-600">
                                                {formatCurrency(summaryData.remaining)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-base-200 rounded-lg p-4">
                                    <h4 className="text-base-content mb-3 font-semibold">IPC Details</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-base-content/70">IPC Number:</span>
                                            <span className="font-medium">{ipcData.number || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-base-content/70">Status:</span>
                                            <span className="badge badge-primary badge-sm">
                                                {ipcData.status || "Editable"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-base-content/70">Last Updated:</span>
                                            <span className="font-medium">{new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "boq" && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-base-content mb-2 text-lg font-semibold">BOQ Progress Tracking</h3>
                            <p className="text-base-content/70">Monitor work progress and quantities for this IPC</p>
                        </div>

                        {buildings.length > 0 ? (
                            <div className="space-y-6">
                                {buildings.map((building) => (
                                    <div key={building.id} className="bg-base-200 rounded-lg p-4">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                                                <span className="iconify lucide--building size-5 text-purple-600 dark:text-purple-400"></span>
                                            </div>
                                            <div>
                                                <h4 className="text-base-content font-semibold">
                                                    {building.buildingName}
                                                </h4>
                                                <p className="text-base-content/70 text-sm">
                                                    Sheet: {building.sheetName}
                                                </p>
                                            </div>
                                        </div>

                                        {building.boqsContract.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="table-sm table">
                                                    <thead>
                                                        <tr>
                                                            <th>Item</th>
                                                            <th>Unit</th>
                                                            <th>Quantity</th>
                                                            <th>Unit Price</th>
                                                            <th>Actual Qty</th>
                                                            <th>Progress %</th>
                                                            <th>Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {building.boqsContract.slice(0, 10).map((boq) => (
                                                            <tr key={boq.id}>
                                                                <td className="font-medium">{boq.key || boq.no}</td>
                                                                <td>{boq.unite}</td>
                                                                <td>{boq.qte}</td>
                                                                <td>{formatCurrency(boq.unitPrice)}</td>
                                                                <td>
                                                                    <input
                                                                        type="number"
                                                                        value={boq.actualQte}
                                                                        onChange={(e) =>
                                                                            handleBOQQuantityChange(
                                                                                building.id,
                                                                                boq.id,
                                                                                parseFloat(e.target.value),
                                                                            )
                                                                        }
                                                                        className="input input-xs input-bordered w-20"
                                                                        step="0.01"
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <div className="text-xs">
                                                                        {boq.cumulPercent.toFixed(1)}%
                                                                    </div>
                                                                </td>
                                                                <td className="font-medium">
                                                                    {formatCurrency(boq.actualAmount)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {building.boqsContract.length > 10 && (
                                                    <div className="mt-2 text-center">
                                                        <span className="text-base-content/50 text-sm">
                                                            Showing 10 of {building.boqsContract.length} items
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="py-8 text-center">
                                                <span className="iconify lucide--table text-base-content/30 mb-2 size-12"></span>
                                                <p className="text-base-content/50">
                                                    No BOQ items found for this building
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <span className="iconify lucide--building text-base-content/30 mb-4 size-16"></span>
                                <h4 className="text-base-content mb-2 text-lg font-semibold">No Buildings Found</h4>
                                <p className="text-base-content/70">No building data is available for this IPC</p>
                            </div>
                        )}

                        {/* VOs Section */}
                        {vos && vos.length > 0 && (
                            <div className="mt-8 space-y-6">
                                <div className="text-center">
                                    <h3 className="text-base-content mb-2 text-lg font-semibold">
                                        Variation Order (VO) Progress
                                    </h3>
                                    <p className="text-base-content/70">
                                        Work progress for variation orders in this IPC
                                    </p>
                                </div>
                                {vos.map((vo: any) => (
                                    <div key={vo.id} className="bg-base-200 rounded-lg p-4">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
                                                <span className="iconify lucide--file-plus-2 size-5 text-orange-600 dark:text-orange-400"></span>
                                            </div>
                                            <div>
                                                <h4 className="text-base-content font-semibold">
                                                    {vo.voNumber || `VO #${vo.id}`}
                                                </h4>
                                            </div>
                                        </div>

                                        {vo.buildings.map((building: any) => (
                                            <div key={building.id} className="bg-base-100 mt-4 rounded-lg p-4">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                                                        <span className="iconify lucide--building size-5 text-purple-600 dark:text-purple-400"></span>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-base-content font-semibold">
                                                            {building.buildingName}
                                                        </h5>
                                                        <p className="text-base-content/70 text-sm">
                                                            Sheet: {building.sheetName}
                                                        </p>
                                                    </div>
                                                </div>

                                                {building.boqs && building.boqs.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="table-sm table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Item</th>
                                                                    <th>Unit</th>
                                                                    <th>Quantity</th>
                                                                    <th>Unit Price</th>
                                                                    <th>Actual Qty</th>
                                                                    <th>Progress %</th>
                                                                    <th>Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {building.boqs.map((boq: any) => (
                                                                    <tr key={boq.id}>
                                                                        <td className="font-medium">
                                                                            {boq.key || boq.no}
                                                                        </td>
                                                                        <td>{boq.unite}</td>
                                                                        <td>{boq.qte}</td>
                                                                        <td>{formatCurrency(boq.unitPrice)}</td>
                                                                        <td>
                                                                            <input
                                                                                type="number"
                                                                                value={boq.actualQte}
                                                                                onChange={(e) =>
                                                                                    handleVOQuantityChange(
                                                                                        vo.id,
                                                                                        building.id,
                                                                                        boq.id,
                                                                                        parseFloat(e.target.value) || 0,
                                                                                    )
                                                                                }
                                                                                className="input input-xs input-bordered w-20"
                                                                                step="0.01"
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <div className="text-xs">
                                                                                {boq.cumulPercent
                                                                                    ? `${boq.cumulPercent.toFixed(1)}%`
                                                                                    : "0.0%"}
                                                                            </div>
                                                                        </td>
                                                                        <td className="font-medium">
                                                                            {formatCurrency(boq.actualAmount)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="py-8 text-center">
                                                        <span className="iconify lucide--table text-base-content/30 mb-2 size-12"></span>
                                                        <p className="text-base-content/50">
                                                            No BOQ items found for this building in this VO.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "livepreview" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base-content text-lg font-semibold">Live IPC Preview</h3>
                                <p className="text-base-content/70 text-sm">
                                    A live preview of the IPC document, reflecting all your current changes.
                                </p>
                            </div>
                            <button
                                onClick={handleFetchLivePreview}
                                className="btn btn-primary btn-sm"
                                disabled={loadingLivePreview}>
                                {loadingLivePreview ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                    <span className="iconify lucide--refresh-cw size-4"></span>
                                )}
                                Refresh
                            </button>
                        </div>
                        <div className="h-[80vh] rounded-lg border border-base-300">
                            {loadingLivePreview ? (
                                <div className="flex h-full items-center justify-center">
                                    <Loader />
                                    <p className="ml-4">Loading Live Preview...</p>
                                </div>
                            ) : livePreviewPdf ? (
                                <PDFViewer fileBlob={livePreviewPdf.blob} fileName={livePreviewPdf.fileName} />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-4">
                                    <span className="iconify lucide--alert-circle text-error size-12"></span>
                                    <div className="text-center">
                                        <h2 className="text-base-content mb-2 text-lg font-semibold">
                                            Error Loading Preview
                                        </h2>
                                        <p className="text-base-content/70 mb-4">
                                            Could not load the live preview. Click refresh to try again.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "documents" && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                                <span className="iconify lucide--file-text size-5 text-green-600 dark:text-green-400"></span>
                            </div>
                            <div>
                                <h2 className="text-base-content text-lg font-semibold">Documents & Actions</h2>
                                <p className="text-base-content/70 text-sm">
                                    Generate documents, export data, and manage IPC status
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Document Generation */}
                            <div className="space-y-4">
                                <h5 className="text-base-content font-semibold">Generate Documents</h5>
                                <div className="space-y-3">
                                    <button
                                        onClick={handleExportPDF}
                                        disabled={exportingPDF || exportingExcel || exportingZip}
                                        className="btn btn-sm flex w-full items-center gap-2 bg-red-600 text-white hover:bg-red-700">
                                        {exportingPDF ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span>Generating PDF...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="iconify lucide--file-text size-4"></span>
                                                <span>Generate PDF</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={handleExportExcel}
                                        disabled={exportingPDF || exportingExcel || exportingZip}
                                        className="btn btn-sm flex w-full items-center gap-2 bg-green-600 text-white hover:bg-green-700">
                                        {exportingExcel ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span>Generating Excel...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="iconify lucide--file-spreadsheet size-4"></span>
                                                <span>Generate Excel</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={handleExportZip}
                                        disabled={exportingPDF || exportingExcel || exportingZip}
                                        className="btn btn-sm flex w-full items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                                        {exportingZip ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span>Generating ZIP...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="iconify lucide--archive size-4"></span>
                                                <span>Generate ZIP Package</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* IPC Actions */}
                            <div className="space-y-4">
                                <h5 className="text-base-content font-semibold">IPC Actions</h5>
                                <div className="space-y-3">
                                    <button
                                        onClick={handlePreviewIpc}
                                        disabled={loadingPreview}
                                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex w-full items-center gap-2 border">
                                        {loadingPreview ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span>Loading Preview...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="iconify lucide--eye size-4"></span>
                                                <span>Preview IPC</span>
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => navigate(`/admin/dashboards/IPCs-database/details/${id}`)}
                                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex w-full items-center gap-2 border">
                                        <span className="iconify lucide--info size-4"></span>
                                        <span>View Details</span>
                                    </button>

                                    {ipcData.status === "Editable" && (
                                        <button
                                            onClick={handleGenerateIpc}
                                            disabled={generatingIpc}
                                            className="btn btn-sm flex w-full items-center gap-2 bg-green-600 text-white hover:bg-green-700">
                                            {generatingIpc ? (
                                                <>
                                                    <span className="loading loading-spinner loading-xs"></span>
                                                    <span>Generating...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="iconify lucide--check-circle size-4"></span>
                                                    <span>Generate IPC</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status Information */}
                        <div className="divider"></div>
                        <div className="space-y-4">
                            <h5 className="text-base-content font-semibold">IPC Status Information</h5>
                            <div className="bg-base-200 rounded-lg p-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <span className="text-base-content/70 text-sm">Current Status:</span>
                                        <p className="mt-1 font-semibold">
                                            <span
                                                className={`badge badge-sm ${
                                                    ipcData.status === "Editable"
                                                        ? "badge-warning"
                                                        : ipcData.status === "PendingApproval"
                                                          ? "badge-info"
                                                          : ipcData.status === "Issued"
                                                            ? "badge-success"
                                                            : "badge-neutral"
                                                }`}>
                                                {ipcData.status || "Editable"}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-base-content/70 text-sm">Generated:</span>
                                        <p className="mt-1 font-semibold">
                                            {ipcData.isGenerated ? (
                                                <span className="badge badge-sm badge-success">Yes</span>
                                            ) : (
                                                <span className="badge badge-sm badge-warning">No</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-base-content/70 text-sm">IPC Type:</span>
                                        <p className="mt-1 font-semibold">
                                            <span
                                                className={`badge badge-sm ${
                                                    ipcData.type?.includes("interim") ||
                                                    ipcData.type?.includes("Interim")
                                                        ? "badge-primary"
                                                        : ipcData.type?.includes("final") ||
                                                            ipcData.type?.includes("Final")
                                                          ? "badge-success"
                                                          : ipcData.type?.includes("retention") ||
                                                              ipcData.type?.includes("Retention")
                                                            ? "badge-warning"
                                                            : ipcData.type?.includes("advance") ||
                                                                ipcData.type?.includes("Advance")
                                                              ? "badge-info"
                                                              : "badge-neutral"
                                                }`}>
                                                {ipcData.type || "Not Set"}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-base-content/70 text-sm">Contract Activated:</span>
                                        <p className="mt-1 font-semibold">
                                            {ipcData.contractActivated ? (
                                                <span className="badge badge-sm badge-success">Active</span>
                                            ) : (
                                                <span className="badge badge-sm badge-neutral">Inactive</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Penalty Form Modal */}
            <PenaltyForm
                isOpen={showPenaltyForm}
                onClose={closePenaltyForm}
                onSave={handlePenaltySave}
                initialData={penaltyData}
                loading={isSaving}
            />

            {/* Preview Modal */}
            {showPreview && previewData && (
                <dialog className="modal modal-open">
                    <div className="modal-box h-[90vh] max-w-7xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">IPC Preview</h3>
                            <button onClick={() => setShowPreview(false)} className="btn btn-ghost btn-sm">
                                <span className="iconify lucide--x size-5"></span>
                            </button>
                        </div>
                        <div className="h-[calc(100%-60px)]">
                            <PDFViewer fileBlob={previewData.blob} fileName={previewData.fileName} />
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => setShowPreview(false)}>close</button>
                    </form>
                </dialog>
            )}
        </div>
    );
};

export default IPCEdit;
