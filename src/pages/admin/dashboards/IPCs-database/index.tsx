import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import useToast from "@/hooks/use-toast";

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
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-1">
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
    const { columns, tableData, inputFields, loading, getIPCs, previewIpc, downloadIpcExcel, exportIpcZip } = useIPCsDatabase();
    const { toaster } = useToast();
    const [viewMode, setViewMode] = useState<'table' | 'preview'>('table');
    const [previewData, setPreviewData] = useState<{ blob: Blob; id: string; fileName: string; rowData: any } | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        getIPCs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const handlePreviewIpc = async (row: any) => {
        const result = await previewIpc(row.id);
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
        navigate(`/admin/dashboard/IPCs-database/edit/${row.id}`);
    };

    const handleBackToTable = () => {
        setViewMode('table');
        setPreviewData(null);
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleDownloadExcel = async (row: any) => {
        const result = await downloadIpcExcel(row.id);
        if (result.success) {
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
            const result = await downloadIpcExcel(previewData.id);
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

    return (
        <div>
            {viewMode === 'table' ? (
                <div>
                    {/* Header with Back Button */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBackToDashboard}
                                className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                            >
                                <span className="iconify lucide--arrow-left size-4"></span>
                                <span>Back</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <Loader />
                    ) : (
                        <SAMTable
                            columns={columns}
                            tableData={tableData}
                            inputFields={inputFields}
                            actions
                            previewAction
                            editAction
                            title={"IPC"}
                            loading={false}
                            onSuccess={getIPCs}
                            dynamicDialog={false}
                            openStaticDialog={(type, data) => {
                                if (type === "Preview" && data) {
                                    return handlePreviewIpc(data);
                                }
                                if (type === "Edit" && data) {
                                    return handleEditIpc(data);
                                }
                            }}
                        />
                    )}
                </div>
            ) : (
                <div>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
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
                            <div className="h-[calc(100vh-200px)]">
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
            )}
        </div>
    );
};

export default IPCsDatabase;
