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
            const fileName = `ipc-${ipcRef}-${contractRef}.pdf`;
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
            a.download = `ipc-${ipcRef}-${contractRef}.xlsx`;
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
                a.download = `ipc-${ipcRef}-${previewData.rowData.contract || 'document'}.xlsx`;
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

    return (
        <div style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {viewMode === 'table' ? (
                <>
                    {/* Fixed Header Section */}
                    <div style={{ flexShrink: 0 }} className="pb-3">
                        {/* Header with Back Button */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
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
                                    <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-64 mt-1 max-h-96 overflow-y-auto">
                                        <li>
                                            <button
                                                onClick={() => setSelectedProject("All Projects")}
                                                className={`flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200 ${
                                                    selectedProject === "All Projects" ? "bg-base-200 font-semibold" : ""
                                                }`}
                                            >
                                                <span className="iconify lucide--list size-4"></span>
                                                <span>All Projects ({tableData.length})</span>
                                            </button>
                                        </li>
                                        <li className="menu-title">
                                            <span className="text-xs font-semibold">Projects</span>
                                        </li>
                                        {uniqueProjects.map((projectName) => {
                                            const count = tableData.filter((ipc: any) => ipc.projectName === projectName).length;
                                            return (
                                                <li key={projectName}>
                                                    <button
                                                        onClick={() => setSelectedProject(projectName as string)}
                                                        className={`flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200 ${
                                                            selectedProject === projectName ? "bg-base-200 font-semibold" : ""
                                                        }`}
                                                    >
                                                        <span className="iconify lucide--folder size-4"></span>
                                                        <span className="truncate flex-1">{projectName}</span>
                                                        <span className="badge badge-sm badge-ghost">{count}</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate('/dashboard/IPCs-database/new')}
                                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                                >
                                    <span className="iconify lucide--plus size-4"></span>
                                    <span>Create IPC</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
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
                                rowActions={(row) => {
                                    // Show Generate button only for Editable IPCs (not yet generated)
                                    const statusLower = (row._statusRaw || row.status || '').toLowerCase();
                                    const isEditable = statusLower.includes('editable') && !row.isGenerated;
                                    return {
                                        generateAction: isEditable,
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
                                        const statusLower = (data._statusRaw || data.status || '').toLowerCase();
                                        if (statusLower === 'issued') {
                                            toaster.error("Cannot edit an issued IPC.");
                                            return;
                                        }
                                        return handleEditIpc(data);
                                    }
                                    if (type === "Details" && data) {
                                        return handleViewIpcDetails(data);
                                    }
                                    if (type === "Generate" && data) {
                                        return handleGenerateIpc(data);
                                    }
                                }}
                            />
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Fixed Header Section */}
                    <div style={{ flexShrink: 0 }} className="pb-3">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBackToTable}
                                    className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                                >
                                    <span className="iconify lucide--arrow-left size-4"></span>
                                    <span>Back</span>
                                </button>
                            </div>

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

                    {/* Scrollable Content */}
                    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                        {/* Preview Card */}
                        <div className="card bg-base-100 shadow-sm p-4">
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
