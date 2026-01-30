import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useArchive } from "@/contexts/archive";

// Import icons
import eyeIcon from "@iconify/icons-lucide/eye";
import fileSpreadsheetIcon from "@iconify/icons-lucide/file-spreadsheet";
import undo2Icon from "@iconify/icons-lucide/undo-2";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import filterIcon from "@iconify/icons-lucide/filter";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import listIcon from "@iconify/icons-lucide/list";
import folderIcon from "@iconify/icons-lucide/folder";
import plusIcon from "@iconify/icons-lucide/plus";
import downloadIcon from "@iconify/icons-lucide/download";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import xIcon from "@iconify/icons-lucide/x";

import { Loader, LoaderOverlay } from "@/components/Loader";
import { Spreadsheet, SpreadsheetColumn } from "@/components/Spreadsheet";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { ipcApiService } from "@/api/services/ipc-api";
import { useTopbarContent } from "@/contexts/topbar-content";

import useIPCsDatabase from "./use-IPCs-database";

// Export Dropdown Component (Memoized to prevent unnecessary re-renders)
const ExportDropdown = memo(({
    exportingPdf,
    exportingExcel,
    onExportPdf,
    onExportExcel
}: {
    exportingPdf: boolean;
    exportingExcel: boolean;
    onExportPdf: () => void;
    onExportExcel: () => void;
}) => {
    const isExporting = exportingPdf || exportingExcel;

    return (
        <div className="dropdown dropdown-end">
            <div
                tabIndex={0}
                role="button"
                className={`btn btn-sm border border-base-300 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 transition-colors duration-200 ${isExporting ? 'btn-disabled' : ''}`}
            >
                {isExporting ? (
                    <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <Icon icon={downloadIcon} className="size-4" />
                        <span>Export</span>
                        <Icon icon={chevronDownIcon} className="size-3.5" />
                    </>
                )}
            </div>
            {!isExporting && (
                <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52 mt-1">
                    <li>
                        <button
                            onClick={onExportPdf}
                            className="flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200"
                        >
                            <Icon icon={fileTextIcon} className="size-4" />
                            <span className="font-medium">Export as PDF</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={onExportExcel}
                            className="flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200"
                        >
                            <Icon icon={fileSpreadsheetIcon} className="size-4" />
                            <span className="font-medium">Export as Excel</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
});

ExportDropdown.displayName = 'ExportDropdown';

interface IpcRow {
    id: number;
    contract: string;
    number: number;
    subcontractorName: string;
    tradeName: string;
    amountHT: number;
    totalAmount: number;
    status: string;
    type: string;
    retention: number;
    projectName?: string;
    _statusRaw?: string;
    _typeRaw?: string;
    isGenerated?: boolean;
    isLastForContract?: boolean;
    currentApprovalStep?: string;
}

const APPROVAL_ROLE_LABELS: Record<string, string> = {
    ProjectManager: "PM",
    QuantitySurveyor: "QS",
    ContractsManager: "CM",
    OperationsManager: "OM",
};

const IPCsDatabase = () => {
    const {
        tableData,
        loading,
        getIPCs,
        smartPreviewIpc,
        smartDownloadIpcExcel,
        exportIpcZip
    } = useIPCsDatabase();
    const { toaster } = useToast();
    const { getToken } = useAuth();
    const { setLeftContent, setCenterContent, clearContent } = useTopbarContent();
    const { isArchiveMode } = useArchive();
    const [viewMode, setViewMode] = useState<'table' | 'preview'>('table');
    const [previewData, setPreviewData] = useState<{ blob: Blob; id: string; fileName: string; rowData: any } | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string>(() => sessionStorage.getItem("ipcs-db-project") || "All Projects");
    // Un-Issue modal state
    const [showUnissueModal, setShowUnissueModal] = useState(false);
    const [unissueReason, setUnissueReason] = useState("");
    const [unissuingIpc, setUnissuingIpc] = useState(false);
    const [unissueTargetRow, setUnissueTargetRow] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        getIPCs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => {
        sessionStorage.setItem("ipcs-db-project", selectedProject);
    }, [selectedProject]);

    // Memoize back to dashboard handler
    const handleBackToDashboard = useCallback(() => {
        navigate('/dashboard');
    }, [navigate]);

    // Memoize unique project names from table data
    const uniqueProjects = useMemo(() =>
        Array.from(new Set(tableData.map((ipc: any) => ipc.projectName).filter(Boolean))).sort(),
        [tableData]
    );

    // Memoize project counts
    const projectCounts = useMemo(() => {
        const counts = new Map<string, number>();
        tableData.forEach((ipc: any) => {
            if (ipc.projectName) {
                counts.set(ipc.projectName, (counts.get(ipc.projectName) || 0) + 1);
            }
        });
        return counts;
    }, [tableData]);

    // Setup topbar content
    useEffect(() => {
        // Left content: Back button
        setLeftContent(
            <button
                onClick={handleBackToDashboard}
                className="btn btn-sm btn-circle btn-ghost"
                title="Back to Dashboard"
            >
                <Icon icon={arrowLeftIcon} className="size-5" />
            </button>
        );

        // Center content: Project filter dropdown
        setCenterContent(
            <div className="dropdown">
                <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                >
                    <Icon icon={filterIcon} className="size-4" />
                    <span>{selectedProject}</span>
                    <Icon icon={chevronDownIcon} className="size-3.5" />
                </div>
                <div tabIndex={0} className="dropdown-content z-50 shadow bg-base-100 rounded-box w-80 mt-1 max-h-96 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => setSelectedProject("All Projects")}
                            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-base-200 rounded transition-colors duration-200 ${
                                selectedProject === "All Projects" ? "bg-base-200 font-semibold" : ""
                            }`}
                        >
                            <Icon icon={listIcon} className="size-4" />
                            <span>All Projects ({tableData.length})</span>
                        </button>
                        <div className="divider my-1"></div>
                        {uniqueProjects.map((projectName) => (
                            <button
                                key={projectName}
                                onClick={() => setSelectedProject(projectName as string)}
                                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-base-200 rounded transition-colors duration-200 ${
                                    selectedProject === projectName ? "bg-base-200 font-semibold" : ""
                                }`}
                            >
                                <Icon icon={folderIcon} className="size-4" />
                                <span className="truncate flex-1">{projectName}</span>
                                <span className="badge badge-sm badge-ghost">{projectCounts.get(projectName as string) || 0}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );

        return () => clearContent();
    }, [setLeftContent, setCenterContent, clearContent, handleBackToDashboard, selectedProject, uniqueProjects, tableData.length, projectCounts]);

    const handlePreviewIpc = async (row: any) => {
        const result = await smartPreviewIpc(row.id, row._statusRaw || row.status, row.isGenerated);
        if (result.success && result.blob) {
            const contractRef = row.contract || 'document';
            const ipcRef = row.number || row.ipcRef || row.ipcNumber || row.id;
            const subcontractorName = row.subcontractorName || 'unknown';
            const fileName = `ipc-${ipcRef}-${contractRef}-${subcontractorName}.pdf`;
            setPreviewData({ blob: result.blob, id: row.id, fileName, rowData: row });
            setViewMode('preview');
        } else {
            toaster.error("Failed to load IPC preview");
        }
    };

    const handleEditIpc = (row: any) => {
        navigate(`/dashboard/IPCs-database/edit/${row.id}`);
    };

    const handleViewIpcDetails = (row: any) => {
        navigate(`/dashboard/IPCs-database/details/${row.id}`, {
            state: {
                ipcNumber: row.number,
                contractNumber: row.contract,
                projectName: row.projectName,
                subcontractorName: row.subcontractorName,
                tradeName: row.tradeName,
                amount: row.totalAmount,
                status: row.status
            }
        });
    };

    const handleBackToTable = useCallback(() => {
        setViewMode('table');
        setPreviewData(null);
    }, []);

    const handleDownloadExcel = async (row: any) => {
        const result = await smartDownloadIpcExcel(row.id, row._statusRaw || row.status, row.isGenerated);
        if (result.success && result.blob) {
            const url = window.URL.createObjectURL(result.blob);
            const a = document.createElement('a');
            a.href = url;
            const contractRef = row.contract || 'document';
            const ipcRef = row.number || row.ipcRef || row.ipcNumber || row.id;
            const subcontractorName = row.subcontractorName || 'unknown';
            a.download = `ipc-${ipcRef}-${contractRef}-${subcontractorName}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toaster.success("Excel file downloaded successfully");
        } else {
            toaster.error("Failed to download Excel file");
        }
    };

    const handleGenerateIpc = async (row: any) => {
        const confirmGenerate = window.confirm(
            `Are you sure you want to generate IPC #${row.number}?\n\n` +
            `This will generate the IPC document and submit it for approval. ` +
            `The approval chain will be based on your role.`
        );

        if (!confirmGenerate) return;

        try {
            const token = getToken();
            const result = await ipcApiService.generateIpc(parseInt(row.id), token ?? "");

            if (result.success || result.isSuccess) {
                toaster.success(`IPC #${row.number} generated successfully`);
                await getIPCs();
            } else {
                toaster.error(result.error?.message || result.message || "Failed to generate IPC");
            }
        } catch (error) {
            console.error("Error generating IPC:", error);
            toaster.error("Failed to generate IPC");
        }
    };

    const handleDeleteIpc = async (row: any) => {
        const confirmDelete = window.confirm(
            `Are you sure you want to delete IPC #${row.number}?\n\n` +
            `Contract: ${row.contract}\n` +
            `This action will rollback all BOQ quantities and deductions.\n\n` +
            `Note: Only the last IPC of a contract can be deleted.`
        );

        if (!confirmDelete) return;

        try {
            const token = getToken();
            const result = await ipcApiService.deleteIpc(parseInt(row.id), token ?? "");

            if (result.success) {
                toaster.success(`IPC #${row.number} deleted successfully`);
                await getIPCs();
            } else {
                const errorMessage = result.error?.message || result.message || "Failed to delete IPC";
                toaster.error(errorMessage);
            }
        } catch (error) {
            console.error("Error deleting IPC:", error);
            toaster.error("Failed to delete IPC");
        }
    };

    const openUnissueModal = (row: any) => {
        setUnissueTargetRow(row);
        setUnissueReason("");
        setShowUnissueModal(true);
    };

    const handleUnissueIpc = async () => {
        if (!unissueTargetRow) return;

        if (!unissueReason || unissueReason.trim().length < 10) {
            toaster.error("Please provide a reason with at least 10 characters");
            return;
        }

        setUnissuingIpc(true);
        try {
            const token = getToken();
            const result = await ipcApiService.unissueIpc(parseInt(unissueTargetRow.id), unissueReason.trim(), token ?? "");

            if (result.success) {
                toaster.success(`IPC #${unissueTargetRow.number} has been un-issued successfully. You can now edit and re-generate it.`);
                setShowUnissueModal(false);
                setUnissueReason("");
                setUnissueTargetRow(null);
                await getIPCs();
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

    const handleExportPdf = async () => {
        if (!previewData) return;

        setExportingPdf(true);
        try {
            const url = window.URL.createObjectURL(previewData.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = previewData.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toaster.success("PDF file downloaded successfully");
        } catch (error) {
            toaster.error("Failed to download PDF file");
        } finally {
            setExportingPdf(false);
        }
    };

    const handleExportExcel = async () => {
        if (!previewData) return;

        setExportingExcel(true);
        try {
            const result = await smartDownloadIpcExcel(
                previewData.id,
                previewData.rowData._statusRaw || previewData.rowData.status,
                previewData.rowData.isGenerated
            );
            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const a = document.createElement('a');
                a.href = url;
                const ipcRef = previewData.rowData.number || previewData.rowData.ipcRef || previewData.id;
                const subcontractorName = previewData.rowData.subcontractorName || 'unknown';
                a.download = `ipc-${ipcRef}-${previewData.rowData.contract || 'document'}-${subcontractorName}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toaster.success("Excel file downloaded successfully");
            } else {
                toaster.error("Failed to download Excel file");
            }
        } catch (error) {
            toaster.error("Failed to download Excel file");
        } finally {
            setExportingExcel(false);
        }
    };

    // Memoize filtered table data
    const filteredTableData = useMemo(() =>
        selectedProject === "All Projects"
            ? tableData
            : tableData.filter((ipc: any) => ipc.projectName === selectedProject),
        [tableData, selectedProject]
    );

    // Format currency - only show decimals if they exist, show '-' for 0
    const formatCurrency = (value: number) => {
        if (value == null || value === 0) return "-";
        // Check if the number has decimals
        const hasDecimals = value % 1 !== 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: hasDecimals ? 2 : 0,
            maximumFractionDigits: 2
        }).format(value);
    };

    // Define spreadsheet columns
    const columns: SpreadsheetColumn<IpcRow>[] = useMemo(() => [
        {
            key: "contract",
            label: "Contract",
            width: 140,
            sortable: true,
            filterable: true
        },
        {
            key: "number",
            label: "IPC Ref",
            width: 90,
            sortable: true,
            filterable: true,
            align: "center"
        },
        {
            key: "subcontractorName",
            label: "Subcontractor",
            width: 180,
            sortable: true,
            filterable: true
        },
        {
            key: "tradeName",
            label: "Trade",
            width: 140,
            sortable: true,
            filterable: true
        },
        {
            key: "amountHT",
            label: "Amount HT",
            width: 120,
            sortable: true,
            align: "right",
            render: (value) => <span className="pr-2">{formatCurrency(value as number)}</span>
        },
        {
            key: "totalAmount",
            label: "Total Amount",
            width: 130,
            sortable: true,
            align: "right",
            render: (value) => <span className="pr-2">{formatCurrency(value as number)}</span>
        },
        {
            key: "status",
            label: "Status",
            width: 150,
            sortable: true,
            filterable: true,
            align: "center",
            render: (value, row) => {
                const statusLower = String(value).toLowerCase();
                let badgeClass = "bg-base-200 text-base-content";
                if (statusLower.includes("approved")) badgeClass = "bg-emerald-100 text-emerald-700 border border-emerald-200";
                else if (statusLower.includes("issued")) badgeClass = "bg-emerald-100 text-emerald-700 border border-emerald-200";
                else if (statusLower.includes("editable")) badgeClass = "bg-amber-100 text-amber-700 border border-amber-200";
                else if (statusLower.includes("pending")) badgeClass = "bg-sky-100 text-sky-700 border border-sky-200";
                const ipcRow = row as IpcRow;
                const awaitingRole = ipcRow?.currentApprovalStep ? APPROVAL_ROLE_LABELS[ipcRow.currentApprovalStep] || ipcRow.currentApprovalStep : null;
                return (
                    <div className="flex flex-col items-center gap-0.5">
                        <span className={`badge badge-sm ${badgeClass}`}>{value}</span>
                        {statusLower.includes("pending") && awaitingRole && (
                            <span className="text-[10px] text-sky-600 font-medium flex items-center gap-0.5">
                                <span className="iconify lucide--shield-check size-3" />
                                Awaiting {awaitingRole}
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: "type",
            label: "Type",
            width: 100,
            sortable: true,
            filterable: true,
            align: "center",
            render: (value) => {
                const typeLower = String(value).toLowerCase();
                let badgeClass = "bg-base-200 text-base-content";
                if (typeLower.includes("provisoire") || typeLower.includes("interim")) badgeClass = "bg-blue-100 text-blue-700 border border-blue-200";
                else if (typeLower.includes("final")) badgeClass = "bg-violet-100 text-violet-700 border border-violet-200";
                else if (typeLower.includes("retention") || typeLower.includes("rg")) badgeClass = "bg-teal-100 text-teal-700 border border-teal-200";
                else if (typeLower.includes("avance") || typeLower.includes("advance")) badgeClass = "bg-cyan-100 text-cyan-700 border border-cyan-200";
                return <span className={`badge badge-sm ${badgeClass}`}>{value}</span>;
            }
        },
        {
            key: "retention",
            label: "Paid TTC",
            width: 120,
            sortable: true,
            align: "right",
            render: (value) => <span className="pr-2">{formatCurrency(value as number)}</span>
        }
    ], []);

    // Actions renderer
    const actionsRender = (row: IpcRow) => {
        const statusLower = String(row.status).toLowerCase();
        const isPending = statusLower.includes("pending");
        return (
            <div className="flex items-center justify-center gap-0.5">
                <button
                    onClick={(e) => { e.stopPropagation(); handleViewIpcDetails(row); }}
                    className="btn btn-xs btn-ghost hover:bg-primary/10 text-primary"
                    title="View Details"
                >
                    <Icon icon={eyeIcon} className="size-4" />
                </button>
                {isPending && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleViewIpcDetails(row); }}
                        className="btn btn-xs btn-ghost hover:bg-warning/10 text-warning"
                        title="Review Approval"
                    >
                        <span className="iconify lucide--shield-check size-4" />
                    </button>
                )}
            </div>
        );
    };

    // Toolbar content
    const toolbarContent = useMemo(() => (
        <>
            {!isArchiveMode && (
                <button
                    onClick={() => navigate('/dashboard/IPCs-database/new')}
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                    <Icon icon={plusIcon} className="size-4" />
                    <span>Create IPC</span>
                </button>
            )}
        </>
    ), [navigate, isArchiveMode]);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {viewMode === 'table' ? (
                <div className="flex-1 min-h-0 relative">
                    <LoaderOverlay
                        loading={loading}
                        icon="receipt"
                        subtitle="Loading: Payment Certificates"
                        description="Preparing IPC data..."
                    >
                        <Spreadsheet
                            columns={columns}
                            data={filteredTableData as unknown as IpcRow[]}
                            mode="view"
                            persistKey="ipcs-database"
                            actionsRender={actionsRender}
                            actionsColumnWidth={90}
                            toolbar={toolbarContent}
                            emptyMessage="No IPCs found. Click 'Create IPC' to add one."
                            onRowDoubleClick={(row) => handleViewIpcDetails(row as IpcRow)}
                        />
                    </LoaderOverlay>
                </div>
            ) : (
                <>
                    {/* Preview Card - Full Height */}
                    <div className="flex-1 min-h-0 flex flex-col p-4">
                        <div className="card bg-base-100 shadow-sm border border-base-300 flex-1 flex flex-col overflow-hidden">
                            {/* Card Header with Back and Export buttons */}
                            <div className="flex items-center justify-between p-3 border-b border-base-300 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleBackToTable}
                                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                                    >
                                        <Icon icon={arrowLeftIcon} className="size-4" />
                                        <span>Back</span>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-error/20 rounded-lg">
                                            <Icon icon={fileTextIcon} className="text-error size-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-base-content text-sm">PDF Preview</h3>
                                            <p className="text-xs text-base-content/60">
                                                {previewData?.fileName}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <ExportDropdown
                                    exportingPdf={exportingPdf}
                                    exportingExcel={exportingExcel}
                                    onExportPdf={handleExportPdf}
                                    onExportExcel={handleExportExcel}
                                />
                            </div>

                            {/* PDF Preview Content - Takes remaining space */}
                            <div className="flex-1 min-h-0">
                                {previewData && (
                                    <PDFViewer
                                        fileBlob={previewData.blob}
                                        fileName={previewData.fileName}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Un-Issue Modal */}
            {showUnissueModal && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Icon icon={undo2Icon} className="size-5 text-amber-600" />
                                Un-Issue IPC #{unissueTargetRow?.number}
                            </h3>
                            <button
                                onClick={() => { setShowUnissueModal(false); setUnissueReason(""); setUnissueTargetRow(null); }}
                                className="btn btn-ghost btn-sm"
                                disabled={unissuingIpc}
                            >
                                <Icon icon={xIcon} className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="alert alert-warning">
                                <Icon icon={alertTriangleIcon} className="size-5" />
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
                                onClick={() => { setShowUnissueModal(false); setUnissueReason(""); setUnissueTargetRow(null); }}
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
                                        <Icon icon={undo2Icon} className="size-4" />
                                        <span>Confirm Un-Issue</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button
                            onClick={() => { setShowUnissueModal(false); setUnissueReason(""); setUnissueTargetRow(null); }}
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

export default IPCsDatabase;
