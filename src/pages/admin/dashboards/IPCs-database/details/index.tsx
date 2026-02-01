import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import apiRequest from "@/api/api";
import { getSubcontractorData } from "@/api/services/contracts-api";
import { ipcApiService } from "@/api/services/ipc-api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Loader } from "@/components/Loader";
import { Spreadsheet, type SpreadsheetColumn } from "@/components/Spreadsheet";
import { useAuth } from "@/contexts/auth";
import { useTopbarContent } from "@/contexts/topbar-content";
import useToast from "@/hooks/use-toast";
import type { SaveIPCVM } from "@/types/ipc";
import IpcApprovalStatus from "../components/IpcApprovalStatus";
import { generateIPCFileName, generateIPCZipFileName, generateIPCPreviewFileName } from "@/utils/ipc-filename";
import { formatCurrency, formatDate, formatPercentage } from "@/utils/formatters";

const getStatusBadgeClass = (status: string | number | undefined) => {
    switch (String(status ?? "").toLowerCase()) {
        case "editable":
            return "badge badge-sm badge-warning";
        case "pendingapproval":
        case "pending approval":
            return "badge badge-sm badge-info";
        case "approved":
            return "badge badge-sm badge-success";
        case "issued":
            return "badge badge-sm badge-success";
        default:
            return "badge badge-sm badge-neutral";
    }
};

const getTypeBadgeClass = (type: string) => {
    switch (type?.toLowerCase()) {
        case "provisoire / interim":
        case "interim":
            return "badge badge-sm badge-primary";
        case "final / final":
        case "final":
            return "badge badge-sm badge-success";
        case "rg / retention":
        case "retention":
            return "badge badge-sm badge-warning";
        case "avance / advance payment":
        case "advance":
            return "badge badge-sm badge-info";
        default:
            return "badge badge-sm badge-neutral";
    }
};

interface BoqRow {
    id: number;
    no: string;
    key: string;
    unite: string;
    qte: number;
    precedQte: number;
    actualQte: number;
    cumulQte: number;
    cumulPercent: number;
    unitPrice: number;
    actualAmount: number;
    cumulAmount: number;
}

const IPCDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { toaster } = useToast();
    const { getToken } = useAuth();
    const { setAllContent, clearContent } = useTopbarContent();

    const [ipcData, setIpcData] = useState<SaveIPCVM | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [exportingZip, setExportingZip] = useState(false);
    const [generatingIpc, setGeneratingIpc] = useState(false);
    const [deletingIpc, setDeletingIpc] = useState(false);
    const [unissuingIpc, setUnissuingIpc] = useState(false);
    const [showUnissueModal, setShowUnissueModal] = useState(false);
    const [approvalExpanded, setApprovalExpanded] = useState(false);
    const [unissueReason, setUnissueReason] = useState("");
    const [currency, setCurrency] = useState("$");
    const [projects, setProjects] = useState<any[]>([]);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [boqSectionExpanded, setBoqSectionExpanded] = useState(true);
    const [boqExpanded, setBoqExpanded] = useState<Record<string, boolean>>({});

    // Get data passed from navigation state
    const navigationData = location.state as {
        ipcNumber?: string;
        contractNumber?: string;
        projectName?: string;
        subcontractorName?: string;
        tradeName?: string;
        amount?: string;
        status?: string;
    } | null;

    useEffect(() => {
        if (id) {
            loadIpcDetails();
        } else {
            toaster.error("IPC ID not found. Please navigate from the IPCs list.");
            navigate("/dashboard/IPCs-database");
        }
    }, [id]);

    const loadIpcDetails = async () => {
        if (!id) return;

        setLoading(true);
        try {
            // Load all reference data in parallel
            const [ipcResult, projectsResponse, subcontractorsResponse, currenciesResponse] = await Promise.all([
                ipcApiService.getIpcForEdit(parseInt(id), getToken() ?? ""),
                apiRequest({
                    method: "GET",
                    endpoint: "Project/GetProjectsList",
                    token: getToken() ?? "",
                }),
                apiRequest({
                    method: "GET",
                    endpoint: "Subcontractors/GetSubcontractors",
                    token: getToken() ?? "",
                }),
                apiRequest({
                    method: "GET",
                    endpoint: "Currencie/GetCurrencies",
                    token: getToken() ?? "",
                }),
            ]);

            if (ipcResult.success && ipcResult.data) {
                const data = ipcResult.data;
                setIpcData(data);

                // Set reference data
                setProjects(Array.isArray(projectsResponse) ? projectsResponse : projectsResponse?.data || []);
                setSubcontractors(
                    Array.isArray(subcontractorsResponse) ? subcontractorsResponse : subcontractorsResponse?.data || [],
                );

                const currencyData = Array.isArray(currenciesResponse)
                    ? currenciesResponse
                    : currenciesResponse?.data || [];
                setCurrencies(currencyData);

                // Look up currency from contract
                let currencySymbol = "$"; // Default fallback
                if (data.contractsDatasetId) {
                    try {
                        const contractResult = await getSubcontractorData(data.contractsDatasetId, getToken() ?? "");
                        if (contractResult.success && contractResult.data?.currencyId) {
                            const foundCurrency = currencyData.find((c: any) => c.id === contractResult.data?.currencyId);
                            if (foundCurrency?.currencies) {
                                currencySymbol = foundCurrency.currencies;
                            }
                        }
                    } catch (err) {
                        console.warn("Could not load contract currency, using default:", err);
                    }
                }
                setCurrency(currencySymbol);
            } else {
                toaster.error("Failed to load IPC details");
                navigate("/dashboard/IPCs-database");
            }
        } catch (error) {
            console.error("Error loading IPC:", error);
            toaster.error("An error occurred while loading IPC details");
            navigate("/dashboard/IPCs-database");
        } finally {
            setLoading(false);
        }
    };

    const handleEditIpc = () => {
        navigate(`/dashboard/IPCs-database/edit/${id}`, {
            state: { ipcId: id, returnTo: `/dashboard/IPCs-database/details/${id}` },
        });
    };

    const handlePreviewIpc = async () => {
        if (!ipcData || !id) return;

        setLoadingPreview(true);
        try {
            const result = await ipcApiService.exportIpcPdf(parseInt(id), getToken() ?? "");

            if (result.success && result.blob) {
                setPreviewData({
                    blob: result.blob,
                    fileName: generateIPCPreviewFileName(ipcData),
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
        if (!id || exportingPDF || exportingExcel || exportingZip) return;

        setExportingPDF(true);
        try {
            const result = await ipcApiService.exportIpcPdf(parseInt(id), getToken() ?? "");

            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = ipcData ? generateIPCFileName(ipcData, 'pdf') : `IPC_${id}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("IPC exported as PDF successfully!");
            } else {
                toaster.error("Failed to export IPC as PDF");
            }
        } catch (error) {
            console.error("PDF Export error:", error);
            toaster.error("PDF Export error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setExportingPDF(false);
        }
    };

    const handleExportExcel = async () => {
        if (!id || exportingPDF || exportingExcel || exportingZip) return;

        setExportingExcel(true);
        try {
            const result = await ipcApiService.exportIpcExcel(parseInt(id), getToken() ?? "");

            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = ipcData ? generateIPCFileName(ipcData, 'xlsx') : `IPC_${id}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("IPC exported as Excel successfully!");
            } else {
                toaster.error("Failed to export IPC as Excel");
            }
        } catch (error) {
            console.error("Excel Export error:", error);
            toaster.error("Excel Export error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setExportingExcel(false);
        }
    };

    const handleExportZip = async () => {
        if (!id || exportingPDF || exportingExcel || exportingZip) return;

        setExportingZip(true);
        try {
            const result = await ipcApiService.exportIpcZip(parseInt(id), getToken() ?? "");

            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = ipcData ? generateIPCZipFileName(ipcData) : `IPC_${id}_Documents.zip`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("IPC documents exported as ZIP successfully!");
            } else {
                toaster.error("Failed to export IPC documents as ZIP");
            }
        } catch (error) {
            console.error("ZIP Export error:", error);
            toaster.error("ZIP Export error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setExportingZip(false);
        }
    };

    const handleGenerateIpc = async () => {
        if (!id) return;

        setGeneratingIpc(true);
        try {
            const result = await ipcApiService.generateIpc(parseInt(id), getToken() ?? "");
            if (result.success) {
                toaster.success("IPC generated successfully!");
                // Reload IPC data to get updated status
                loadIpcDetails();
            }
        } finally {
            setGeneratingIpc(false);
        }
    };

    const handleDeleteIpc = async () => {
        if (!id) return;

        if (!confirm("Are you sure you want to delete this IPC? This action cannot be undone.")) {
            return;
        }

        setDeletingIpc(true);
        try {
            const result = await ipcApiService.deleteIpc(parseInt(id), getToken() ?? "");
            if (result.success) {
                toaster.success("IPC deleted successfully!");
                navigate("/dashboard/IPCs-database");
            }
        } finally {
            setDeletingIpc(false);
        }
    };

    const handleUnissueIpc = async () => {
        if (!id) return;

        // Validate reason
        if (!unissueReason || unissueReason.trim().length < 10) {
            toaster.error("Please provide a reason with at least 10 characters");
            return;
        }

        setUnissuingIpc(true);
        try {
            const result = await ipcApiService.unissueIpc(parseInt(id), unissueReason.trim(), getToken() ?? "");
            if (result.success) {
                toaster.success("IPC has been un-issued successfully. You can now edit and re-generate it.");
                setShowUnissueModal(false);
                setUnissueReason("");
                // Reload IPC data to get updated status
                loadIpcDetails();
            } else {
                toaster.error(result.error?.message || "Failed to un-issue IPC");
            }
        } catch (error) {
            console.error("Error un-issuing IPC:", error);
            toaster.error("An error occurred while un-issuing the IPC");
        } finally {
            setUnissuingIpc(false);
        }
    };

    // Memoize project and subcontractor data lookups - must be before early returns for Rules of Hooks
    const currentProject = useMemo(() =>
        ipcData ? projects.find((p) => p.id === ipcData.projectId) : undefined,
        [projects, ipcData]
    );
    const currentSubcontractor = useMemo(() =>
        ipcData ? subcontractors.find((s) => s.id === ipcData.subcontractorId) : undefined,
        [subcontractors, ipcData]
    );

    // Memoize progress statistics calculations
    const { totalBoqItems, completedItems, overallProgress } = useMemo(() => {
        if (!ipcData) return { totalBoqItems: 0, completedItems: 0, overallProgress: 0 };

        const total = ipcData.buildings?.reduce((sum, building) => {
            return sum + (building.boqsContract?.length || 0);
        }, 0) || 0;

        const completed = ipcData.buildings?.reduce((sum, building) => {
            return sum + (building.boqsContract?.filter((boq) => boq.cumulPercent >= 100).length || 0);
        }, 0) || 0;

        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { totalBoqItems: total, completedItems: completed, overallProgress: progress };
    }, [ipcData]);

    // Memoize net payment calculation
    const netPayment = useMemo(() => {
        if (!ipcData) return 0;
        return ipcData.totalAmount - ipcData.retentionAmount - ipcData.advancePaymentAmount + (ipcData.penalty || 0);
    }, [ipcData]);

    const formatZeroAsDash = useCallback((value: number | undefined | null, decimals: "auto" | "always" | "never" = "auto") => {
        if (!value) return "-";
        return formatCurrency(value, { decimals });
    }, []);

    const formatPercentZeroAsDash = useCallback((value: number | undefined | null) => {
        if (!value) return "-";
        return formatPercentage(value, 1);
    }, []);

    const boqColumns = useMemo<SpreadsheetColumn<BoqRow>[]>(() => [
        { key: "no", label: "Item No", width: 90, align: "center", sortable: true, filterable: true },
        { key: "key", label: "Description", width: 320, align: "left", sortable: true, filterable: true },
        { key: "unite", label: "Unit", width: 80, align: "center", sortable: true, filterable: true },
        {
            key: "qte",
            label: "Original Qty",
            width: 120,
            align: "right",
            sortable: true,
            formatter: (value) => formatZeroAsDash(value, "always"),
        },
        {
            key: "precedQte",
            label: "Previous Qty",
            width: 120,
            align: "right",
            sortable: true,
            formatter: (value) => formatZeroAsDash(value, "always"),
        },
        {
            key: "actualQte",
            label: "Current Qty",
            width: 120,
            align: "right",
            sortable: true,
            formatter: (value) => formatZeroAsDash(value, "always"),
        },
        {
            key: "cumulQte",
            label: "Cumulative Qty",
            width: 130,
            align: "right",
            sortable: true,
            formatter: (value) => formatZeroAsDash(value, "always"),
        },
        {
            key: "cumulPercent",
            label: "Progress %",
            width: 110,
            align: "right",
            sortable: true,
            formatter: (value) => formatPercentZeroAsDash(value),
        },
        {
            key: "unitPrice",
            label: "Unit Price",
            width: 120,
            align: "right",
            sortable: true,
            formatter: (value) => formatZeroAsDash(value),
        },
        {
            key: "actualAmount",
            label: "Actual Amount",
            width: 140,
            align: "right",
            sortable: true,
            formatter: (value) => formatZeroAsDash(value),
        },
        {
            key: "cumulAmount",
            label: "Cumul Amount",
            width: 150,
            align: "right",
            sortable: true,
            formatter: (value) => formatZeroAsDash(value),
        },
    ], [formatZeroAsDash, formatPercentZeroAsDash]);

    // Store handlers in a ref so the topbar effect doesn't depend on their identity.
    // These plain functions are recreated every render, which would otherwise
    // cause the effect to fire in a loop (effect → setAllContent → re-render → new refs → effect …).
    const actionsRef = useRef({
        handleEditIpc,
        handleGenerateIpc,
        handlePreviewIpc,
        handleExportPDF,
        handleExportExcel,
        handleExportZip,
        handleDeleteIpc,
    });
    actionsRef.current = {
        handleEditIpc,
        handleGenerateIpc,
        handlePreviewIpc,
        handleExportPDF,
        handleExportExcel,
        handleExportZip,
        handleDeleteIpc,
    };

    useEffect(() => {
        if (!ipcData) {
            setAllContent(null, null, null);
            return;
        }

        const ipcNumber = ipcData.number || navigationData?.ipcNumber || "-";
        const contractNumber = ipcData.contract || navigationData?.contractNumber || "";

        const leftContent = (
            <button
                onClick={() => navigate("/dashboard/IPCs-database")}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                title="Back to IPCs"
            >
                <span className="iconify lucide--arrow-left size-4"></span>
            </button>
        );

        const centerContent = (
            <div className="max-w-[520px]">
                <div className="flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-4 py-1.5 shadow-sm">
                    <span className="text-sm font-semibold text-base-content whitespace-nowrap">
                        IPC #{ipcNumber}
                    </span>
                    {contractNumber && (
                        <span className="hidden xl:inline text-xs text-base-content/50 truncate max-w-[200px]">
                            {contractNumber}
                        </span>
                    )}
                    <span className={`${getStatusBadgeClass(ipcData.status || "")} hidden md:inline-flex`}>
                        {ipcData.status || "Editable"}
                    </span>
                    <span className={`${getTypeBadgeClass(ipcData.type || "")} hidden xl:inline-flex`}>
                        {ipcData.type || "-"}
                    </span>
                </div>
            </div>
        );

        const isEditable = ipcData.status === "Editable";
        const isIssued = ipcData.status === "Issued";

        const rightContent = (
            <div className="flex items-center gap-2">
                {isEditable && (
                    <button
                        onClick={() => actionsRef.current.handleEditIpc()}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                    >
                        <span className="iconify lucide--edit size-4"></span>
                        <span className="hidden xl:inline">Edit</span>
                    </button>
                )}

                {isEditable && (
                    <button
                        onClick={() => actionsRef.current.handleGenerateIpc()}
                        disabled={generatingIpc}
                        className="btn btn-sm flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                    >
                        {generatingIpc ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <span className="iconify lucide--check-circle size-4"></span>
                        )}
                        <span className="hidden xl:inline">Generate</span>
                    </button>
                )}

                {isIssued && (
                    <button
                        onClick={() => setShowUnissueModal(true)}
                        disabled={unissuingIpc}
                        className="btn btn-sm flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-700"
                    >
                        {unissuingIpc ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <span className="iconify lucide--undo-2 size-4"></span>
                        )}
                        <span className="hidden xl:inline">Un-Issue</span>
                    </button>
                )}

                <div className="dropdown dropdown-end">
                    <button
                        tabIndex={0}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                        disabled={exportingPDF || exportingExcel || exportingZip}
                    >
                        {exportingPDF || exportingExcel || exportingZip ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <span className="iconify lucide--download size-4"></span>
                        )}
                        <span className="hidden xl:inline">Export</span>
                        <span className="iconify lucide--chevron-down size-3"></span>
                    </button>
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow"
                    >
                        <li>
                            <button onClick={() => actionsRef.current.handleExportPDF()} disabled={exportingPDF}>
                                {exportingPDF ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Exporting PDF...</span>
                                    </>
                                ) : (
                                    <span>Export as PDF</span>
                                )}
                            </button>
                        </li>
                        <li>
                            <button onClick={() => actionsRef.current.handleExportExcel()} disabled={exportingExcel}>
                                {exportingExcel ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Exporting Excel...</span>
                                    </>
                                ) : (
                                    <span>Export as Excel</span>
                                )}
                            </button>
                        </li>
                        <li>
                            <button onClick={() => actionsRef.current.handleExportZip()} disabled={exportingZip}>
                                {exportingZip ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Exporting ZIP...</span>
                                    </>
                                ) : (
                                    <span>Export as ZIP</span>
                                )}
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="dropdown dropdown-end">
                    <button
                        tabIndex={0}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                    >
                        <span className="iconify lucide--more-horizontal size-4"></span>
                        <span className="hidden xl:inline">More</span>
                    </button>
                    <ul
                        tabIndex={0}
                        className="dropdown-content menu bg-base-100 rounded-box z-50 w-48 p-2 shadow"
                    >
                        <li>
                            <button onClick={() => actionsRef.current.handlePreviewIpc()} disabled={loadingPreview}>
                                {loadingPreview ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Loading Preview...</span>
                                    </>
                                ) : (
                                    <span>Preview</span>
                                )}
                            </button>
                        </li>
                        {isEditable && (
                            <li>
                                <button onClick={() => actionsRef.current.handleDeleteIpc()} disabled={deletingIpc} className="text-error">
                                    {deletingIpc ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <span>Delete</span>
                                    )}
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        );

        setAllContent(leftContent, centerContent, rightContent);
    }, [
        ipcData,
        navigationData?.ipcNumber,
        navigationData?.contractNumber,
        navigate,
        loadingPreview,
        exportingPDF,
        exportingExcel,
        exportingZip,
        generatingIpc,
        deletingIpc,
        unissuingIpc,
        setAllContent,
    ]);

    useEffect(() => {
        return () => {
            clearContent();
        };
    }, [clearContent]);

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader
                    icon="receipt"
                    subtitle="Loading: IPC Details"
                    description="Preparing payment certificate information..."
                />
            </div>
        );
    }

    if (!ipcData) {
        return (
            <div className="p-6">
                <p>IPC not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 pb-6">
            {/* Mobile Header */}
            <div className="lg:hidden rounded-2xl border border-base-200/60 bg-base-100 shadow-sm">
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        <button
                            onClick={() => navigate("/dashboard/IPCs-database")}
                            className="btn btn-sm btn-circle border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
                        >
                            <span className="iconify lucide--arrow-left size-4"></span>
                        </button>
                        <div className="flex-1">
                            <div className="text-xs uppercase tracking-[0.2em] text-base-content/40">
                                IPC Details
                            </div>
                            <div className="mt-1 text-lg font-semibold text-base-content">
                                IPC #{ipcData.number || navigationData?.ipcNumber || "-"}
                            </div>
                            {(ipcData.contract || navigationData?.contractNumber) && (
                                <div className="text-xs text-base-content/60">
                                    {ipcData.contract || navigationData?.contractNumber}
                                </div>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className={getStatusBadgeClass(ipcData.status || "")}>
                                    {ipcData.status || "Editable"}
                                </span>
                                <span className={getTypeBadgeClass(ipcData.type || "")}>
                                    {ipcData.type || "-"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {ipcData.status === "Editable" && (
                            <button
                                onClick={handleEditIpc}
                                className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                            >
                                <span className="iconify lucide--edit size-4"></span>
                                <span>Edit</span>
                            </button>
                        )}

                        {ipcData.status === "Editable" && (
                            <button
                                onClick={handleGenerateIpc}
                                disabled={generatingIpc}
                                className="btn btn-sm flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                            >
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

                        {ipcData.status === "Issued" && (
                            <button
                                onClick={() => setShowUnissueModal(true)}
                                disabled={unissuingIpc}
                                className="btn btn-sm flex items-center gap-2 bg-amber-600 text-white hover:bg-amber-700"
                            >
                                {unissuingIpc ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Un-issuing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--undo-2 size-4"></span>
                                        <span>Un-Issue</span>
                                    </>
                                )}
                            </button>
                        )}

                        <div className="dropdown dropdown-end">
                            <button
                                tabIndex={0}
                                className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                                disabled={exportingPDF || exportingExcel || exportingZip}
                            >
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
                            <ul
                                tabIndex={0}
                                className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow"
                            >
                                <li>
                                    <a onClick={handleExportPDF}>
                                        {exportingPDF ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span>Exporting PDF...</span>
                                            </>
                                        ) : (
                                            <span>Export as PDF</span>
                                        )}
                                    </a>
                                </li>
                                <li>
                                    <a onClick={handleExportExcel}>
                                        {exportingExcel ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span>Exporting Excel...</span>
                                            </>
                                        ) : (
                                            <span>Export as Excel</span>
                                        )}
                                    </a>
                                </li>
                                <li>
                                    <a onClick={handleExportZip}>
                                        {exportingZip ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span>Exporting ZIP...</span>
                                            </>
                                        ) : (
                                            <span>Export as ZIP</span>
                                        )}
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div className="dropdown dropdown-end">
                            <button
                                tabIndex={0}
                                className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                            >
                                <span className="iconify lucide--more-horizontal size-4"></span>
                                <span>More</span>
                            </button>
                            <ul
                                tabIndex={0}
                                className="dropdown-content menu bg-base-100 rounded-box z-50 w-48 p-2 shadow"
                            >
                                <li>
                                    <a onClick={handlePreviewIpc}>
                                        {loadingPreview ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                <span>Loading Preview...</span>
                                            </>
                                        ) : (
                                            <span>Preview</span>
                                        )}
                                    </a>
                                </li>
                                {ipcData.status === "Editable" && (
                                    <li>
                                        <a onClick={handleDeleteIpc} className="text-error">
                                            {deletingIpc ? (
                                                <>
                                                    <span className="loading loading-spinner loading-xs"></span>
                                                    <span>Deleting...</span>
                                                </>
                                            ) : (
                                                <span>Delete</span>
                                            )}
                                        </a>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* IPC Overview */}
            <div className="rounded-2xl border border-base-200/60 bg-base-100 shadow-sm">
                <div className="p-5">
                    <div className="text-xs uppercase tracking-[0.2em] text-base-content/40">IPC Overview</div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-base-200/60 bg-base-100/70 p-4">
                            <div className="flex items-center gap-3">
                                <span className="grid size-9 place-items-center rounded-full bg-base-200/60 text-base-content/60">
                                    <span className="iconify lucide--calendar size-4"></span>
                                </span>
                                <div>
                                    <div className="text-xs text-base-content/50 uppercase tracking-wider font-medium">
                                        IPC Date
                                    </div>
                                    <div className="text-sm font-semibold text-base-content">
                                        {formatDate(ipcData.dateIpc) || "-"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-base-200/60 bg-base-100/70 p-4">
                            <div className="flex items-center gap-3">
                                <span className="grid size-9 place-items-center rounded-full bg-base-200/60 text-base-content/60">
                                    <span className="iconify lucide--clock size-4"></span>
                                </span>
                                <div>
                                    <div className="text-xs text-base-content/50 uppercase tracking-wider font-medium">
                                        Period
                                    </div>
                                    <div className="text-sm font-semibold text-base-content">
                                        {formatDate(ipcData.fromDate)} - {formatDate(ipcData.toDate)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-base-200/60 bg-base-100/70 p-4">
                            <div className="flex items-center gap-3">
                                <span className="grid size-9 place-items-center rounded-full bg-base-200/60 text-base-content/60">
                                    <span className="iconify lucide--hash size-4"></span>
                                </span>
                                <div>
                                    <div className="text-xs text-base-content/50 uppercase tracking-wider font-medium">
                                        IPC Number
                                    </div>
                                    <div className="text-sm font-semibold text-base-content">
                                        {ipcData.number || "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Approval Workflow - collapsible */}
            {(ipcData.status === "PendingApproval" || ipcData.status === "Approved" || ipcData.status === "Issued") && (
                <div className="rounded-2xl border border-base-200/60 bg-base-100 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setApprovalExpanded(!approvalExpanded)}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-base-200/40 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                                <span className="iconify lucide--shield-check size-5"></span>
                            </span>
                            <div className="text-left">
                                <div className="text-xs uppercase tracking-[0.2em] text-base-content/40">Approvals</div>
                                <div className="font-semibold text-base-content">Approval Workflow</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-base-content/50">
                            <span
                                className={`iconify ${
                                    approvalExpanded ? "lucide--chevron-up" : "lucide--chevron-down"
                                } size-5`}
                            ></span>
                        </div>
                    </button>

                    {approvalExpanded && (
                        <div className="px-5 pb-5 pt-2">
                            <IpcApprovalStatus
                                ipcId={ipcData.id}
                                ipcStatus={ipcData.status}
                                onApproved={() => loadIpcDetails()}
                                onRejected={() => loadIpcDetails()}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Section 4: Contract Details */}
            <div className="rounded-2xl border border-base-200/60 bg-base-100 shadow-sm">
                <div className="p-5">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-full bg-blue-500/10 text-blue-600">
                            <span className="iconify lucide--file-text size-5"></span>
                        </span>
                        <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-base-content/40">Contract</div>
                            <h3 className="text-lg font-semibold text-base-content">Contract Details</h3>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-base-200/60 bg-base-100/70 p-4">
                            <div className="flex items-start gap-3">
                                <span className="iconify lucide--hash size-4 text-base-content/40 mt-0.5"></span>
                                <div className="flex-1">
                                    <div className="text-xs text-base-content/50 uppercase tracking-wider font-medium">
                                        Contract Number
                                    </div>
                                    <div className="text-sm font-semibold text-base-content mt-0.5">
                                        {ipcData.contract || navigationData?.contractNumber || "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-base-200/60 bg-base-100/70 p-4">
                            <div className="flex items-start gap-3">
                                <span className="iconify lucide--building-2 size-4 text-base-content/40 mt-0.5"></span>
                                <div className="flex-1">
                                    <div className="text-xs text-base-content/50 uppercase tracking-wider font-medium">Project</div>
                                    <div className="text-sm font-semibold text-base-content mt-0.5">
                                        {currentProject?.name ||
                                            navigationData?.projectName ||
                                            ipcData.projectName ||
                                            "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-base-200/60 bg-base-100/70 p-4">
                            <div className="flex items-start gap-3">
                                <span className="iconify lucide--user size-4 text-base-content/40 mt-0.5"></span>
                                <div className="flex-1">
                                    <div className="text-xs text-base-content/50 uppercase tracking-wider font-medium">
                                        Subcontractor
                                    </div>
                                    <div className="text-sm font-semibold text-base-content mt-0.5">
                                        {currentSubcontractor?.name ||
                                            navigationData?.subcontractorName ||
                                            ipcData.subcontractorName ||
                                            "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-base-200/60 bg-base-100/70 p-4">
                            <div className="flex items-start gap-3">
                                <span className="iconify lucide--wrench size-4 text-base-content/40 mt-0.5"></span>
                                <div className="flex-1">
                                    <div className="text-xs text-base-content/50 uppercase tracking-wider font-medium">Trade</div>
                                    <div className="text-sm font-semibold text-base-content mt-0.5">
                                        {navigationData?.tradeName || ipcData.tradeName || "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 5: Financial Summary */}
            <div className="rounded-2xl border border-base-200/60 bg-base-100 shadow-sm">
                <div className="p-5">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-full bg-purple-500/10 text-purple-600">
                            <span className="iconify lucide--calculator size-5"></span>
                        </span>
                        <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-base-content/40">Finance</div>
                            <h3 className="text-lg font-semibold text-base-content">Financial Summary</h3>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent p-5 shadow-sm">
                            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
                                <span className="text-xs uppercase tracking-wider font-semibold">Current IPC Amount</span>
                                <span className="iconify lucide--wallet size-4"></span>
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-blue-900 dark:text-blue-200">
                                {ipcData.totalAmount ? `${currency} ${formatCurrency(ipcData.totalAmount)}` : "-"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-base-200/70 bg-base-200/40 p-5">
                            <div className="flex items-center justify-between text-base-content/60">
                                <span className="text-xs uppercase tracking-wider font-semibold">Previous Payments</span>
                                <span className="iconify lucide--history size-4"></span>
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-base-content">
                                {ipcData.paid ? `${currency} ${formatCurrency(ipcData.paid)}` : "-"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-base-200/70 bg-base-200/40 p-5">
                            <div className="flex items-center justify-between text-base-content/60">
                                <span className="text-xs uppercase tracking-wider font-semibold">Deductions</span>
                                <span className="iconify lucide--minus-circle size-4"></span>
                            </div>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-base-content/60">Retention</span>
                                    <span className="font-semibold text-base-content">
                                        {ipcData.retentionAmount
                                            ? `${currency} ${formatCurrency(ipcData.retentionAmount)}`
                                            : "-"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-base-content/60">Advance</span>
                                    <span className="font-semibold text-base-content">
                                        {ipcData.advancePaymentAmount
                                            ? `${currency} ${formatCurrency(ipcData.advancePaymentAmount)}`
                                            : "-"}
                                    </span>
                                </div>
                                {ipcData.penalty && ipcData.penalty > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-base-content/60">Penalty</span>
                                        <span className="font-semibold text-red-600 dark:text-red-400">
                                            -{currency} {formatCurrency(ipcData.penalty)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/15 via-green-500/5 to-transparent p-5 shadow-sm">
                            <div className="flex items-center justify-between text-green-700 dark:text-green-300">
                                <span className="text-xs uppercase tracking-wider font-semibold">Net Payment</span>
                                <span className="iconify lucide--check-circle size-4"></span>
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-green-900 dark:text-green-200">
                                {currency} {formatCurrency(netPayment)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 6: Progress Overview */}
            <div className="rounded-2xl border border-base-200/60 bg-base-100 shadow-sm">
                <div className="p-5">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-full bg-orange-500/10 text-orange-600">
                            <span className="iconify lucide--trending-up size-5"></span>
                        </span>
                        <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-base-content/40">Progress</div>
                            <h3 className="text-lg font-semibold text-base-content">Progress Overview</h3>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-4 items-center">
                        <div className="rounded-xl border border-base-200/70 bg-base-200/40 p-4">
                            <div className="text-xs text-base-content/50 uppercase tracking-wider font-medium">Overall</div>
                            <div className="mt-2 text-3xl font-semibold text-base-content">{overallProgress}%</div>
                            <div className="mt-4 flex items-center gap-3 text-sm text-base-content/60">
                                <span>{totalBoqItems} items</span>
                                <span className="h-4 w-px bg-base-300"></span>
                                <span>{completedItems} completed</span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-base-200/70 bg-base-200/40 p-4">
                            <div className="flex items-center justify-between text-xs uppercase tracking-wider text-base-content/50 font-medium">
                                <span>Progress Bar</span>
                                <span>{overallProgress}%</span>
                            </div>
                            <div className="mt-3 h-3 rounded-full bg-base-300/60 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                                    style={{ width: `${overallProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 7: Building-wise BOQ Progress */}
            <div className="rounded-2xl border border-base-200/60 bg-base-100 shadow-sm overflow-hidden">
                <button
                    onClick={() => setBoqSectionExpanded(!boqSectionExpanded)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-base-200/40 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-full bg-blue-500/10 text-blue-600">
                            <span className="iconify lucide--building size-5"></span>
                        </span>
                        <div className="text-left">
                            <div className="text-xs uppercase tracking-[0.2em] text-base-content/40">BOQ</div>
                            <h3 className="text-lg font-semibold text-base-content">Building-wise BOQ Progress</h3>
                        </div>
                    </div>
                    <span
                        className={`iconify ${boqSectionExpanded ? "lucide--chevron-up" : "lucide--chevron-down"} size-5 text-base-content/50`}
                    ></span>
                </button>

                {boqSectionExpanded && (
                    <>
                        {ipcData.buildings && ipcData.buildings.length > 0 ? (
                            <div className="px-5 pb-5 space-y-4">
                                {ipcData.buildings.map((building, index) => {
                                    const buildingKey = String(building.id || index);
                                    const isExpanded = boqExpanded[buildingKey] ?? true;
                                    const buildingTotals = (building.boqsContract || []).reduce(
                                        (acc, boq) => {
                                            const unitPrice = boq.unitPrice || 0;
                                            const actualQte = boq.actualQte || 0;
                                            const cumulQte = boq.cumulQte || 0;
                                            const actualAmount = boq.actualAmount ?? unitPrice * actualQte;
                                            const cumulAmount = boq.cumulAmount ?? unitPrice * cumulQte;
                                            return {
                                                actualAmount: acc.actualAmount + actualAmount,
                                                cumulAmount: acc.cumulAmount + cumulAmount,
                                            };
                                        },
                                        { actualAmount: 0, cumulAmount: 0 }
                                    );

                                    return (
                                        <div
                                            key={building.id || index}
                                            className="rounded-xl border border-base-200/70 bg-base-100/70 shadow-sm overflow-hidden"
                                        >
                                            <button
                                                onClick={() =>
                                                    setBoqExpanded((prev) => ({
                                                        ...prev,
                                                        [buildingKey]: !(prev[buildingKey] ?? true),
                                                    }))
                                                }
                                                className="w-full flex items-center gap-3 px-4 py-2.5 bg-base-200/40 hover:bg-base-200/60 transition-colors"
                                            >
                                                <span className="iconify lucide--building-2 size-4 text-base-content/60"></span>
                                                <h5 className="font-medium text-base-content">
                                                    {building.buildingName} - {building.sheetName}
                                                </h5>
                                                <div className="ml-auto flex items-center gap-2">
                                                    <span className="text-xs text-base-content/60 hidden md:inline">
                                                        Actual
                                                    </span>
                                                    <span className="badge badge-sm badge-ghost">
                                                        {formatZeroAsDash(buildingTotals.actualAmount)}
                                                    </span>
                                                    <span className="text-xs text-base-content/60 hidden md:inline">
                                                        Cumul
                                                    </span>
                                                    <span className="badge badge-sm badge-ghost">
                                                        {formatZeroAsDash(buildingTotals.cumulAmount)}
                                                    </span>
                                                    <span className="badge badge-sm badge-neutral">
                                                        {building.boqsContract?.length || 0} items
                                                    </span>
                                                </div>
                                                <span
                                                    className={`iconify ${isExpanded ? "lucide--chevron-up" : "lucide--chevron-down"} size-4 text-base-content/50`}
                                                ></span>
                                            </button>

                                            {isExpanded && (
                                                <div className="px-2 pb-3">
                                                    {building.boqsContract && building.boqsContract.length > 0 ? (
                                                        <Spreadsheet<BoqRow>
                                                            data={building.boqsContract.map((boq) => {
                                                                const unitPrice = boq.unitPrice || 0;
                                                                const actualQte = boq.actualQte || 0;
                                                                const cumulQte = boq.cumulQte || 0;
                                                                const actualAmount = boq.actualAmount ?? unitPrice * actualQte;
                                                                const cumulAmount = boq.cumulAmount ?? unitPrice * cumulQte;

                                                                return {
                                                                    id: boq.id,
                                                                    no: boq.no || "-",
                                                                    key: boq.key || "-",
                                                                    unite: boq.unite || "-",
                                                                    qte: boq.qte || 0,
                                                                    precedQte: boq.precedQte || 0,
                                                                    actualQte,
                                                                    cumulQte,
                                                                    cumulPercent: boq.cumulPercent || 0,
                                                                    unitPrice,
                                                                    actualAmount,
                                                                    cumulAmount,
                                                                };
                                                            })}
                                                            columns={boqColumns}
                                                            mode="view"
                                                            loading={false}
                                                            emptyMessage="No BOQ items found"
                                                            persistKey={`ipc-boq-${ipcData.id}-${building.id || index}`}
                                                            rowHeight={36}
                                                            maxHeight={360}
                                                            getRowId={(row) => row.id}
                                                            allowKeyboardNavigation
                                                            allowColumnResize
                                                            allowSorting
                                                            allowFilters
                                                            hideFormulaBar
                                                            summaryRow={(rows, meta) => {
                                                                if (!rows.length) return null;

                                                                const totals = rows.reduce(
                                                                    (acc, row) => ({
                                                                        qte: acc.qte + (row.qte || 0),
                                                                        precedQte: acc.precedQte + (row.precedQte || 0),
                                                                        actualQte: acc.actualQte + (row.actualQte || 0),
                                                                        cumulQte: acc.cumulQte + (row.cumulQte || 0),
                                                                        actualAmount: acc.actualAmount + (row.actualAmount || 0),
                                                                        cumulAmount: acc.cumulAmount + (row.cumulAmount || 0),
                                                                    }),
                                                                    {
                                                                        qte: 0,
                                                                        precedQte: 0,
                                                                        actualQte: 0,
                                                                        cumulQte: 0,
                                                                        actualAmount: 0,
                                                                        cumulAmount: 0,
                                                                    }
                                                                );

                                                                const rightAligned = new Set([
                                                                    "qte",
                                                                    "precedQte",
                                                                    "actualQte",
                                                                    "cumulQte",
                                                                    "cumulPercent",
                                                                    "unitPrice",
                                                                    "actualAmount",
                                                                    "cumulAmount",
                                                                ]);

                                                                const cellValue = (key: string) => {
                                                                    switch (key) {
                                                                        case "key":
                                                                            return "TOTAL";
                                                                        case "qte":
                                                                            return formatZeroAsDash(totals.qte, "always");
                                                                        case "precedQte":
                                                                            return formatZeroAsDash(totals.precedQte, "always");
                                                                        case "actualQte":
                                                                            return formatZeroAsDash(totals.actualQte, "always");
                                                                        case "cumulQte":
                                                                            return formatZeroAsDash(totals.cumulQte, "always");
                                                                        case "actualAmount":
                                                                            return formatZeroAsDash(totals.actualAmount);
                                                                        case "cumulAmount":
                                                                            return formatZeroAsDash(totals.cumulAmount);
                                                                        default:
                                                                            return "";
                                                                    }
                                                                };

                                                                return (
                                                                    <div
                                                                        className="spreadsheet-grid-base text-xs font-semibold bg-base-200"
                                                                        style={{ gridTemplateColumns: meta?.gridTemplateColumns, minHeight: 34 }}
                                                                    >
                                                                        <div className="spreadsheet-row-number flex items-center justify-center border-r border-b border-base-300 bg-base-200">
                                                                            Σ
                                                                        </div>
                                                                        {boqColumns.map((column) => (
                                                                            <div
                                                                                key={column.key}
                                                                                className={`border-r border-b border-base-300 ${rightAligned.has(column.key) ? "flex items-center justify-end px-3" : "flex items-center px-3"}`}
                                                                            >
                                                                                {cellValue(column.key)}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="py-8 text-center">
                                                            <span className="iconify lucide--inbox text-base-content/30 mx-auto mb-3 size-12"></span>
                                                            <p className="text-base-content/70">No BOQ items found for this building</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="px-5 pb-6">
                                <div className="rounded-xl border border-dashed border-base-300 bg-base-200/40 py-10 text-center">
                                    <span className="iconify lucide--inbox text-base-content/30 mx-auto mb-3 size-12"></span>
                                    <p className="text-base-content/70">No buildings found for this IPC</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && previewData && (
                <dialog className="modal modal-open">
                    <div className="modal-box h-[90vh] max-w-7xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">IPC Preview</h3>
                            <button onClick={() => { setShowPreview(false); setPreviewData(null); }} className="btn btn-ghost btn-sm">
                                <span className="iconify lucide--x size-5"></span>
                            </button>
                        </div>
                        <div className="h-[calc(100%-60px)]">
                            <PDFViewer fileBlob={previewData.blob} fileName={previewData.fileName} />
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => { setShowPreview(false); setPreviewData(null); }}>close</button>
                    </form>
                </dialog>
            )}

            {/* Un-Issue Modal */}
            {showUnissueModal && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <span className="iconify lucide--undo-2 size-5 text-amber-600"></span>
                                Un-Issue IPC
                            </h3>
                            <button
                                onClick={() => { setShowUnissueModal(false); setUnissueReason(""); }}
                                className="btn btn-ghost btn-sm"
                                disabled={unissuingIpc}
                            >
                                <span className="iconify lucide--x size-5"></span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="alert alert-warning">
                                <span className="iconify lucide--alert-triangle size-5"></span>
                                <div>
                                    <p className="font-semibold">Important:</p>
                                    <ul className="mt-1 text-sm list-disc list-inside">
                                        <li>This action will revert the IPC to Editable status</li>
                                        <li>The QR code verification will be revoked</li>
                                        <li>You can only un-issue an IPC once</li>
                                        <li>This action cannot be undone</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Reason for Un-issuing *</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered h-24"
                                    placeholder="Please provide a detailed reason for un-issuing this IPC (minimum 10 characters)..."
                                    value={unissueReason}
                                    onChange={(e) => setUnissueReason(e.target.value)}
                                    disabled={unissuingIpc}
                                    maxLength={500}
                                />
                                <label className="label">
                                    <span className="label-text-alt text-base-content/60">
                                        {unissueReason.length}/500 characters (minimum 10)
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                onClick={() => { setShowUnissueModal(false); setUnissueReason(""); }}
                                className="btn btn-ghost"
                                disabled={unissuingIpc}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUnissueIpc}
                                disabled={unissuingIpc || unissueReason.trim().length < 10}
                                className="btn bg-amber-600 text-white hover:bg-amber-700"
                            >
                                {unissuingIpc ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Un-issuing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--undo-2 size-4"></span>
                                        <span>Confirm Un-Issue</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button
                            onClick={() => { setShowUnissueModal(false); setUnissueReason(""); }}
                            disabled={unissuingIpc}
                        >
                            close
                        </button>
                    </form>
                </dialog>
            )}
        </div>
    );
};

export default IPCDetails;
