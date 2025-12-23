import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { ipcApiService } from "@/api/services/ipc-api";

import useIPCsDatabase from "./use-IPCs-database";

// Export Dropdown Component
const ExportDropdown = ({ 
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
                        <span className="iconify lucide--download size-4"></span>
                        <span>Export</span>
                        <span className="iconify lucide--chevron-down size-3.5"></span>
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
                            <span className="iconify lucide--file-text size-4"></span>
                            <span className="font-medium">Export as PDF</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={onExportExcel}
                            className="flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200"
                        >
                            <span className="iconify lucide--file-spreadsheet size-4"></span>
                            <span className="font-medium">Export as Excel</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
};

const IPCsDatabase = () => {
    const {
        columns,
        tableData,
        inputFields,
        loading,
        getIPCs,
        smartPreviewIpc,
        smartDownloadIpcExcel,
        exportIpcZip
    } = useIPCsDatabase();
    const { toaster } = useToast();
    const { getToken } = useAuth();
    const [viewMode, setViewMode] = useState<'table' | 'preview'>('table');
    const [previewData, setPreviewData] = useState<{ blob: Blob; id: string; fileName: string; rowData: any } | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string>("All Projects");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        getIPCs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const handlePreviewIpc = async (row: any) => {
        // Use smart preview that chooses correct method based on IPC status
        const result = await smartPreviewIpc(row.id, row._statusRaw || row.status, row.isGenerated);
        if (result.success && result.blob) {
            // Use contract number and IPC reference instead of database IDs
            const contractRef = row.contract || 'document';
            const ipcRef = row.number || row.ipcRef || row.ipcNumber || row.id; // Use business identifier
            const subcontractorName = row.subcontractorName || 'unknown';
            const fileName = `ipc-${ipcRef}-${contractRef}-${subcontractorName}.pdf`;
            setPreviewData({ blob: result.blob, id: row.id, fileName, rowData: row });
            setViewMode('preview');
        } else {
            toaster.error("Failed to load IPC preview");
        }
    };

    const handleEditIpc = (row: any) => {
        // Navigate to IPC edit page with enhanced penalty and summary features
        navigate(`/dashboard/IPCs-database/edit/${row.id}`);
    };

    const handleViewIpcDetails = (row: any) => {
        // Navigate to IPC details page
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

    const handleBackToTable = () => {
        setViewMode('table');
        setPreviewData(null);
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleDownloadExcel = async (row: any) => {
        // Use smart download that chooses correct method based on IPC status
        const result = await smartDownloadIpcExcel(row.id, row._statusRaw || row.status, row.isGenerated);
        if (result.success && result.blob) {
            // Download the file
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

    const handleExportZip = async (row: any) => {
        const result = await exportIpcZip(row.id);
        if (result.success) {
            toaster.success("ZIP file exported successfully");
        } else {
            toaster.error("Failed to export ZIP file");
        }
    };

    const handleGenerateIpc = async (row: any) => {
        const confirmGenerate = window.confirm(
            `Are you sure you want to generate IPC #${row.number}?\n\n` +
            `This will finalize the IPC and change its status to "Issued". ` +
            `Once generated, you will need to edit and save the IPC to regenerate the file.`
        );

        if (!confirmGenerate) return;

        try {
            const token = getToken();
            const result = await ipcApiService.generateIpc(parseInt(row.id), token ?? "");

            if (result.success || result.isSuccess) {
                toaster.success(`IPC #${row.number} generated successfully`);
                // Refresh the table to show updated status
                await getIPCs();
            } else {
                toaster.error(result.error || result.message || "Failed to generate IPC");
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
                // Refresh the table to show updated list
                await getIPCs();
            } else {
                // Show backend validation error (e.g., "Only the last IPC can be deleted")
                const errorMessage = result.error?.message || result.message || "Failed to delete IPC";
                toaster.error(errorMessage);
            }
        } catch (error) {
            console.error("Error deleting IPC:", error);
            toaster.error("Failed to delete IPC");
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
            // Use smart download that chooses correct method based on IPC status
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

    // Get unique project names from table data
    const uniqueProjects = Array.from(new Set(tableData.map((ipc: any) => ipc.projectName).filter(Boolean))).sort();

    // Filter table data by selected project
    const filteredTableData = selectedProject === "All Projects"
        ? tableData
        : tableData.filter((ipc: any) => ipc.projectName === selectedProject);

    // Header content for the table
    const tableHeaderContent = (
        <div className="flex items-center justify-between flex-1 gap-2">
            <div className="flex items-center gap-2">
                <button
                    onClick={handleBackToDashboard}
                    className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                >
                    <span className="iconify lucide--arrow-left size-4"></span>
                    <span>Back</span>
                </button>

                {/* Project Filter Dropdown */}
                <div className="dropdown">
                    <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--filter size-4"></span>
                        <span>{selectedProject}</span>
                        <span className="iconify lucide--chevron-down size-3.5"></span>
                    </div>
                    <div tabIndex={0} className="dropdown-content z-50 shadow bg-base-100 rounded-box w-80 mt-1 max-h-96 overflow-y-auto">
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setSelectedProject("All Projects")}
                                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-base-200 rounded transition-colors duration-200 ${
                                    selectedProject === "All Projects" ? "bg-base-200 font-semibold" : ""
                                }`}
                            >
                                <span className="iconify lucide--list size-4"></span>
                                <span>All Projects ({tableData.length})</span>
                            </button>
                            <div className="divider my-1"></div>
                            {uniqueProjects.map((projectName) => {
                                const count = tableData.filter((ipc: any) => ipc.projectName === projectName).length;
                                return (
                                    <button
                                        key={projectName}
                                        onClick={() => setSelectedProject(projectName as string)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-base-200 rounded transition-colors duration-200 ${
                                            selectedProject === projectName ? "bg-base-200 font-semibold" : ""
                                        }`}
                                    >
                                        <span className="iconify lucide--folder size-4"></span>
                                        <span className="truncate flex-1">{projectName}</span>
                                        <span className="badge badge-sm badge-ghost">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => navigate('/dashboard/IPCs-database/new')}
                className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            >
                <span className="iconify lucide--plus size-4"></span>
                <span>Create IPC</span>
            </button>
        </div>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden -mt-6">
            {viewMode === 'table' ? (
                <>
                    {/* Scrollable Content - Full Height */}
                    <div className="flex-1 min-h-0">
                        {loading ? (
                            <Loader />
                        ) : (
                            <SAMTable
                                columns={columns}
                                tableData={filteredTableData}
                                inputFields={inputFields}
                                actions
                                previewAction
                                editAction
                                detailsAction
                                customHeaderContent={tableHeaderContent}
                                rowActions={(row) => {
                                    const statusLower = (row._statusRaw || row.status || '').toLowerCase();
                                    const isEditable = statusLower.includes('editable') && !row.isGenerated;
                                    const isIssued = statusLower === 'issued';
                                    // Only allow deleting the last IPC for a contract (highest number)
                                    const canDelete = isEditable && row.isLastForContract;

                                    return {
                                        // Show Generate button only for Editable IPCs (not yet generated)
                                        generateAction: isEditable,
                                        // Hide Edit button for Issued IPCs
                                        editAction: !isIssued,
                                        // Show Delete button only for last Editable IPC of a contract
                                        deleteAction: canDelete,
                                    };
                                }}
                                title={"IPC"}
                                loading={false}
                                onSuccess={getIPCs}
                                dynamicDialog={false}
                                rowsPerPage={20}
                                openStaticDialog={(type, data) => {
                                    if (type === "Preview" && data) {
                                        return handlePreviewIpc(data);
                                    }
                                    if (type === "Edit" && data) {
                                        return handleEditIpc(data);
                                    }
                                    if (type === "Details" && data) {
                                        return handleViewIpcDetails(data);
                                    }
                                    if (type === "Generate" && data) {
                                        return handleGenerateIpc(data);
                                    }
                                    if (type === "Delete" && data) {
                                        return handleDeleteIpc(data);
                                    }
                                }}
                            />
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Scrollable Content */}
                    <div className="flex-1 min-h-0 overflow-auto">
                        {/* Preview Header Card */}
                        <div className="sticky top-0 bg-base-100 border-b border-base-300 z-10 p-4">
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={handleBackToTable}
                                    className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                                >
                                    <span className="iconify lucide--arrow-left size-4"></span>
                                    <span>Back</span>
                                </button>

                                <div className="flex gap-2">
                                    <ExportDropdown
                                        exportingPdf={exportingPdf}
                                        exportingExcel={exportingExcel}
                                        onExportPdf={handleExportPdf}
                                        onExportExcel={handleExportExcel}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Preview Card */}
                        <div className="card bg-base-100 shadow-sm p-4 m-4">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-error/20 rounded-lg">
                                    <span className="iconify lucide--file-text text-error size-5"></span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base-content">PDF Preview</h3>
                                    <p className="text-sm text-base-content/60">
                                        {previewData?.fileName}
                                    </p>
                                </div>
                            </div>

                            {/* PDF Preview Content */}
                            <div className="bg-base-100 border border-base-300 rounded-lg shadow-sm">
                                <div className="h-[calc(100vh-300px)]">
                                    {previewData && (
                                        <PDFViewer
                                            fileBlob={previewData.blob}
                                            fileName={previewData.fileName}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default IPCsDatabase;
