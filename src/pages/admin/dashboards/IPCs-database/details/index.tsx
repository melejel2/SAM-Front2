import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import apiRequest from "@/api/api";
import { ipcApiService } from "@/api/services/ipc-api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import type { IpcStatus, SaveIPCVM } from "@/types/ipc";

// Helper functions
const formatCurrency = (amount: number | string | undefined) => {
    if (!amount || amount === "-") return "-";
    const numAmount = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : amount;
    if (isNaN(numAmount)) return "-";
    return new Intl.NumberFormat("en-US", {
        style: "decimal",
        maximumFractionDigits: 0,
    }).format(Math.round(numAmount));
};

const formatDate = (dateString: string | undefined) => {
    if (!dateString || dateString === "-") return "-";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch (error) {
        return "-";
    }
};

const formatPercentage = (value: number | undefined) => {
    if (!value || value === 0) return "0%";
    return `${value}%`;
};

const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
        case "editable":
            return "badge badge-sm badge-warning";
        case "pendingapproval":
        case "pending approval":
            return "badge badge-sm badge-info";
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

const IPCDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { toaster } = useToast();
    const { getToken } = useAuth();

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
    const [activeTab, setActiveTab] = useState<"boq" | "financial" | "documents">("boq");
    const [currency, setCurrency] = useState("$");
    const [projects, setProjects] = useState<any[]>([]);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);

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
                setCurrencies(Array.isArray(currenciesResponse) ? currenciesResponse : currenciesResponse?.data || []);

                // Find and set the correct currency symbol
                const currencyData = Array.isArray(currenciesResponse)
                    ? currenciesResponse
                    : currenciesResponse?.data || [];
                setCurrencies(currencyData);

                // For IPCs, we might need to look up currency from the contract
                // For now, default to $ but this should be enhanced based on contract currency
                setCurrency("$");
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
            state: { ipcId: id },
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
        if (!id || exportingPDF || exportingExcel || exportingZip) return;

        setExportingPDF(true);
        try {
            const result = await ipcApiService.exportIpcPdf(parseInt(id), getToken() ?? "");

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

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader />
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

    // Get project and subcontractor data
    const currentProject = projects.find((p) => p.id === ipcData?.projectId);
    const currentSubcontractor = subcontractors.find((s) => s.id === ipcData?.subcontractorId);

    // Calculate progress statistics
    const totalBoqItems =
        ipcData.buildings?.reduce((total, building) => {
            return total + (building.boqsContract?.length || 0);
        }, 0) || 0;

    const completedItems =
        ipcData.buildings?.reduce((total, building) => {
            return total + (building.boqsContract?.filter((boq) => boq.cumulPercent >= 100).length || 0);
        }, 0) || 0;

    const overallProgress = totalBoqItems > 0 ? Math.round((completedItems / totalBoqItems) * 100) : 0;

    // Net payment calculation
    const netPayment =
        ipcData.totalAmount - ipcData.retentionAmount - ipcData.advancePaymentAmount + (ipcData.penalty || 0);

    return (
        <div
            style={{
                height: "calc(100vh - 4rem)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}>
            {/* Fixed Header Section */}
            <div style={{ flexShrink: 0 }} className="pb-3">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/dashboard/IPCs-database")}
                            className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
                            <span className="iconify lucide--arrow-left size-4"></span>
                            Back
                        </button>

                        {/* Page Header */}
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                                <span className="iconify lucide--file-text size-5 text-blue-600 dark:text-blue-400"></span>
                            </div>
                            <div>
                                <h2 className="text-base-content text-lg font-semibold">IPC Details</h2>
                                <p className="text-base-content/70 text-sm">View IPC information and progress</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
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
                            <ul
                                tabIndex={0}
                                className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow">
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

                        <button
                            onClick={handleEditIpc}
                            className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
                            <span className="iconify lucide--edit size-4"></span>
                            <span>Edit</span>
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
                            onClick={handleDeleteIpc}
                            disabled={deletingIpc}
                            className="btn btn-sm btn-error text-error-content hover:bg-error/10 flex items-center gap-2">
                            {deletingIpc ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--trash-2 size-4"></span>
                                    <span>Delete</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: "auto" }} className="pb-6">
                <div className="space-y-6">
                    {/* Information Cards Grid */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        {/* IPC Information */}
                        <div className="card bg-base-100 border-base-300 border shadow-sm">
                            <div className="card-body">
                                <h3 className="card-title text-base-content flex items-center gap-2">
                                    <span className="iconify lucide--file-text size-5 text-blue-600"></span>
                                    IPC Information
                                </h3>
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">IPC Number:</span>
                                        <span className="text-base-content font-semibold">
                                            {ipcData.number || navigationData?.ipcNumber || "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">IPC Date:</span>
                                        <span className="text-base-content">{formatDate(ipcData.dateIpc) || "-"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Period:</span>
                                        <span className="text-base-content text-sm">
                                            {formatDate(ipcData.fromDate)} - {formatDate(ipcData.toDate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Status:</span>
                                        <span className={getStatusBadgeClass(ipcData.status || "")}>
                                            {ipcData.status || "Editable"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Type:</span>
                                        <span className={getTypeBadgeClass(ipcData.type || "")}>
                                            {ipcData.type || "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contract Information */}
                        <div className="card bg-base-100 border-base-300 border shadow-sm">
                            <div className="card-body">
                                <h3 className="card-title text-base-content flex items-center gap-2">
                                    <span className="iconify lucide--building-2 size-5 text-green-600"></span>
                                    Contract Information
                                </h3>
                                <div className="mt-4 space-y-3">
                                    <div>
                                        <span className="text-base-content/70 text-sm">Contract Number:</span>
                                        <p className="text-base-content mt-1 font-semibold">
                                            {ipcData.contract || navigationData?.contractNumber || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-base-content/70 text-sm">Project:</span>
                                        <p className="text-base-content mt-1 font-semibold">
                                            {currentProject?.name ||
                                                navigationData?.projectName ||
                                                ipcData.projectName ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-base-content/70 text-sm">Subcontractor:</span>
                                        <p className="text-base-content mt-1 font-semibold">
                                            {currentSubcontractor?.name ||
                                                navigationData?.subcontractorName ||
                                                ipcData.subcontractorName ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-base-content/70 text-sm">Trade:</span>
                                        <p className="text-base-content mt-1 font-semibold">
                                            {navigationData?.tradeName || ipcData.tradeName || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="card bg-base-100 border-base-300 border shadow-sm">
                            <div className="card-body">
                                <h3 className="card-title text-base-content flex items-center gap-2">
                                    <span className="iconify lucide--calculator size-5 text-purple-600"></span>
                                    Financial Summary
                                </h3>
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Current IPC Amount:</span>
                                        <span className="text-base-content font-semibold">
                                            {currency} {formatCurrency(ipcData.totalAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Previous Payments:</span>
                                        <span className="text-base-content">
                                            {currency} {formatCurrency(ipcData.paid)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Retention Amount:</span>
                                        <span className="text-base-content">
                                            {currency} {formatCurrency(ipcData.retentionAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Advance Payment:</span>
                                        <span className="text-base-content">
                                            {currency} {formatCurrency(ipcData.advancePaymentAmount)}
                                        </span>
                                    </div>
                                    {ipcData.penalty && ipcData.penalty > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-base-content/70">Penalty:</span>
                                            <span className="text-red-600">
                                                -{currency} {formatCurrency(ipcData.penalty)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="divider"></div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-base-content/70">Net Payment:</span>
                                        <span className="text-primary text-xl font-bold">
                                            {currency} {formatCurrency(netPayment)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Information */}
                        <div className="card bg-base-100 border-base-300 border shadow-sm">
                            <div className="card-body">
                                <h3 className="card-title text-base-content flex items-center gap-2">
                                    <span className="iconify lucide--trending-up size-5 text-orange-600"></span>
                                    Progress Information
                                </h3>
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Overall Progress:</span>
                                        <span className="text-base-content font-semibold">{overallProgress}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">BOQ Items Count:</span>
                                        <span className="text-base-content">{totalBoqItems}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Completed Items:</span>
                                        <span className="text-base-content">{completedItems}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-base-content/70">Work Period:</span>
                                        <span className="text-base-content text-sm">
                                            {formatDate(ipcData.fromDate)} - {formatDate(ipcData.toDate)}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-base-content/70">Progress</span>
                                            <span className="text-base-content">{overallProgress}%</span>
                                        </div>
                                        <div className="progress progress-primary w-full">
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${overallProgress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabbed Content Section */}
                    <div className="card bg-base-100 border-base-300 border shadow-sm">
                        <div className="card-body">
                            {/* Tab Navigation */}
                            <div className="tabs tabs-bordered">
                                <button
                                    className={`tab tab-bordered ${activeTab === "boq" ? "tab-active" : ""}`}
                                    onClick={() => setActiveTab("boq")}>
                                    <span className="iconify lucide--building mr-2 size-4"></span>
                                    BOQ Progress
                                </button>
                                <button
                                    className={`tab tab-bordered ${activeTab === "financial" ? "tab-active" : ""}`}
                                    onClick={() => setActiveTab("financial")}>
                                    <span className="iconify lucide--calculator mr-2 size-4"></span>
                                    Financial Details
                                </button>
                                <button
                                    className={`tab tab-bordered ${activeTab === "documents" ? "tab-active" : ""}`}
                                    onClick={() => setActiveTab("documents")}>
                                    <span className="iconify lucide--file-text mr-2 size-4"></span>
                                    Documents & Actions
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="mt-6">
                                {activeTab === "boq" && (
                                    <div className="space-y-6">
                                        <h4 className="text-base-content flex items-center gap-2 text-lg font-semibold">
                                            <span className="iconify lucide--building size-5 text-blue-600"></span>
                                            Building-wise BOQ Progress
                                        </h4>

                                        {ipcData.buildings && ipcData.buildings.length > 0 ? (
                                            ipcData.buildings.map((building, index) => (
                                                <div key={building.id || index} className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <h5 className="text-md text-base-content font-semibold">
                                                            {building.buildingName} - {building.sheetName}
                                                        </h5>
                                                        <span className="badge badge-sm badge-neutral">
                                                            {building.boqsContract?.length || 0} items
                                                        </span>
                                                    </div>

                                                    {building.boqsContract && building.boqsContract.length > 0 ? (
                                                        <SAMTable
                                                            columns={{
                                                                no: "Item No",
                                                                key: "Description",
                                                                unite: "Unit",
                                                                qte: "Original Qty",
                                                                precedQte: "Previous Qty",
                                                                actualQte: "Current Qty",
                                                                cumulQte: "Cumulative Qty",
                                                                cumulPercent: "Progress %",
                                                                unitPrice: "Unit Price",
                                                                actualAmount: "Current Amount",
                                                                cumulAmount: "Cumulative Amount",
                                                            }}
                                                            tableData={building.boqsContract.map((boq) => ({
                                                                id: boq.id,
                                                                no: boq.no || "-",
                                                                key: boq.key || "-",
                                                                unite: boq.unite || "-",
                                                                qte: boq.qte.toFixed(2),
                                                                precedQte: boq.precedQte.toFixed(2),
                                                                actualQte: boq.actualQte.toFixed(2),
                                                                cumulQte: boq.cumulQte.toFixed(2),
                                                                cumulPercent: `${boq.cumulPercent.toFixed(1)}%`,
                                                                unitPrice: formatCurrency(boq.unitPrice),
                                                                actualAmount: formatCurrency(boq.actualAmount),
                                                                cumulAmount: formatCurrency(boq.cumulAmount),
                                                            }))}
                                                            title=""
                                                            loading={false}
                                                            actions={false}
                                                            onSuccess={() => {}}
                                                            openStaticDialog={() => {}}
                                                            dynamicDialog={false}
                                                        />
                                                    ) : (
                                                        <div className="py-8 text-center">
                                                            <span className="iconify lucide--inbox text-base-content/30 mx-auto mb-3 size-12"></span>
                                                            <p className="text-base-content/70">
                                                                No BOQ items found for this building
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 text-center">
                                                <span className="iconify lucide--inbox text-base-content/30 mx-auto mb-3 size-12"></span>
                                                <p className="text-base-content/70">No buildings found for this IPC</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "financial" && (
                                    <div className="space-y-6">
                                        <h4 className="text-base-content flex items-center gap-2 text-lg font-semibold">
                                            <span className="iconify lucide--calculator size-5 text-purple-600"></span>
                                            Detailed Financial Breakdown
                                        </h4>

                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            {/* Amounts */}
                                            <div className="space-y-4">
                                                <h5 className="text-base-content font-semibold">Amounts</h5>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-base-content/70">
                                                            Current IPC Amount:
                                                        </span>
                                                        <span className="font-semibold">
                                                            {currency} {formatCurrency(ipcData.totalAmount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-base-content/70">Previous Payments:</span>
                                                        <span>
                                                            {currency} {formatCurrency(ipcData.paid)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-base-content/70">
                                                            Advance Payment Amount:
                                                        </span>
                                                        <span>
                                                            {currency} {formatCurrency(ipcData.advancePaymentAmount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-base-content/70">
                                                            Cumulative Advance:
                                                        </span>
                                                        <span>
                                                            {currency}{" "}
                                                            {formatCurrency(ipcData.advancePaymentAmountCumul)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Deductions */}
                                            <div className="space-y-4">
                                                <h5 className="text-base-content font-semibold">Deductions</h5>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-base-content/70">Retention Amount:</span>
                                                        <span>
                                                            {currency} {formatCurrency(ipcData.retentionAmount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-base-content/70">
                                                            Retention Percentage:
                                                        </span>
                                                        <span>{formatPercentage(ipcData.retentionPercentage)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-base-content/70">
                                                            Cumulative Retention:
                                                        </span>
                                                        <span>
                                                            {currency} {formatCurrency(ipcData.retentionAmountCumul)}
                                                        </span>
                                                    </div>
                                                    {ipcData.penalty && ipcData.penalty > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-base-content/70">Penalty:</span>
                                                            <span className="text-red-600">
                                                                -{currency} {formatCurrency(ipcData.penalty)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {ipcData.prorata && ipcData.prorata > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-base-content/70">Prorata:</span>
                                                            <span>
                                                                {currency} {formatCurrency(ipcData.prorata)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Total Summary */}
                                        <div className="divider"></div>
                                        <div className="bg-base-200 rounded-lg p-4">
                                            <h5 className="text-base-content mb-3 font-semibold">Payment Summary</h5>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Current IPC Amount:</span>
                                                    <span>
                                                        {currency} {formatCurrency(ipcData.totalAmount)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>
                                                        Less: Retention ({formatPercentage(ipcData.retentionPercentage)}
                                                        ):
                                                    </span>
                                                    <span>
                                                        -{currency} {formatCurrency(ipcData.retentionAmount)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Less: Advance Recovery:</span>
                                                    <span>
                                                        -{currency} {formatCurrency(ipcData.advancePaymentAmount)}
                                                    </span>
                                                </div>
                                                {ipcData.penalty && ipcData.penalty > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Less: Penalty:</span>
                                                        <span className="text-red-600">
                                                            -{currency} {formatCurrency(ipcData.penalty)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="divider my-2"></div>
                                                <div className="flex justify-between text-lg font-bold">
                                                    <span>Net Payment Amount:</span>
                                                    <span className="text-primary">
                                                        {currency} {formatCurrency(netPayment)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "documents" && (
                                    <div className="space-y-6">
                                        <h4 className="text-base-content flex items-center gap-2 text-lg font-semibold">
                                            <span className="iconify lucide--file-text size-5 text-green-600"></span>
                                            Documents & Actions
                                        </h4>

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
                                                        onClick={handleEditIpc}
                                                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex w-full items-center gap-2 border">
                                                        <span className="iconify lucide--edit size-4"></span>
                                                        <span>Edit IPC</span>
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

                                        {/* Status History / Audit Trail */}
                                        <div className="divider"></div>
                                        <div className="space-y-4">
                                            <h5 className="text-base-content font-semibold">IPC Status Information</h5>
                                            <div className="bg-base-200 rounded-lg p-4">
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <div>
                                                        <span className="text-base-content/70 text-sm">
                                                            Current Status:
                                                        </span>
                                                        <p className="mt-1 font-semibold">
                                                            <span className={getStatusBadgeClass(ipcData.status || "")}>
                                                                {ipcData.status || "Editable"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-base-content/70 text-sm">Generated:</span>
                                                        <p className="mt-1 font-semibold">
                                                            {ipcData.isGenerated ? (
                                                                <span className="badge badge-sm badge-success">
                                                                    Yes
                                                                </span>
                                                            ) : (
                                                                <span className="badge badge-sm badge-warning">No</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-base-content/70 text-sm">IPC Type:</span>
                                                        <p className="mt-1 font-semibold">
                                                            <span className={getTypeBadgeClass(ipcData.type || "")}>
                                                                {ipcData.type || "Not Set"}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-base-content/70 text-sm">
                                                            Contract Activated:
                                                        </span>
                                                        <p className="mt-1 font-semibold">
                                                            {ipcData.contractActivated ? (
                                                                <span className="badge badge-sm badge-success">
                                                                    Active
                                                                </span>
                                                            ) : (
                                                                <span className="badge badge-sm badge-neutral">
                                                                    Inactive
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

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
            </div>
        </div>
    );
};

export default IPCDetails;
