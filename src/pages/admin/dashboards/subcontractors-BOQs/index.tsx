import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import apiRequest from "@/api/api";

import useSubcontractorsBOQs from "./use-subcontractors-boqs";

// Export Dropdown Component
const ExportDropdown = ({ 
    exportingPdf, 
    exportingWord,
    exportingZip,
    onExportPdf, 
    onExportWord,
    onExportZip
}: {
    exportingPdf: boolean;
    exportingWord: boolean;
    exportingZip: boolean;
    onExportPdf: () => void;
    onExportWord: () => void;
    onExportZip: () => void;
}) => {
    const isExporting = exportingPdf || exportingWord || exportingZip;
    
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
                            onClick={onExportWord}
                            className="flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200"
                        >
                            <span className="iconify lucide--file-type-docx size-4"></span>
                            <span className="font-medium">Export as Word</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={onExportZip}
                            className="flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200"
                        >
                            <span className="iconify lucide--file-zip size-4"></span>
                            <span className="font-medium">Export Both (ZIP)</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
};

const SubcontractorsBOQs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toaster } = useToast();
    const { getToken } = useAuth();
    const [viewMode, setViewMode] = useState<'table' | 'preview'>('table');
    const [previewData, setPreviewData] = useState<{ blob: Blob; id: string; fileName: string; rowData: any } | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingWord, setExportingWord] = useState(false);
    const [exportingZip, setExportingZip] = useState(false);

    const { 
        columns, 
        tableData, 
        inputFields, 
        loading, 
        getContractsDatasets, 
        previewContract 
    } = useSubcontractorsBOQs();

    useEffect(() => {
        getContractsDatasets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const handlePreviewContract = async (row: any) => {
        const result = await previewContract(row.id);
        if (result.success && result.blob) {
            // Use PDF extension for preview since we're using the PDF endpoint
            const fileName = `contract-${row.id}-${row.projectName || 'document'}.pdf`;
            setPreviewData({ blob: result.blob, id: row.id, fileName, rowData: row });
            setViewMode('preview');
        } else {
            toaster.error("Failed to load contract preview");
        }
    };

    const handleBackToTable = () => {
        setViewMode('table');
        setPreviewData(null);
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleExportPdf = async () => {
        if (!previewData) return;
        
        setExportingPdf(true);
        try {
            // Call the PDF export endpoint
            const response = await apiRequest({
                endpoint: `ContractsDatasets/ExportContractPdf/${previewData.id}`,
                method: "GET",
                responseType: "blob",
                token: getToken() ?? ""
            });
            
            if (response && 'success' in response && !response.success) {
                toaster.error("Failed to download PDF file");
                return;
            }
            
            const blob = response as Blob;
            const fileName = `contract-${previewData.id}-${previewData.rowData.projectName || 'document'}.pdf`;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
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

    const handleExportWord = async () => {
        if (!previewData) return;
        
        setExportingWord(true);
        try {
            // Call the Word export endpoint
            const response = await apiRequest({
                endpoint: `ContractsDatasets/ExportContractWord/${previewData.id}`,
                method: "GET",
                responseType: "blob",
                token: getToken() ?? ""
            });
            
            if (response && 'success' in response && !response.success) {
                toaster.error("Failed to download Word file");
                return;
            }
            
            const blob = response as Blob;
            const fileName = `contract-${previewData.id}-${previewData.rowData.projectName || 'document'}.docx`;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toaster.success("Word file downloaded successfully");
        } catch (error) {
            toaster.error("Failed to download Word file");
        } finally {
            setExportingWord(false);
        }
    };

    const handleExportZip = async () => {
        if (!previewData) return;
        
        setExportingZip(true);
        try {
            // Call the ZIP export endpoint (contains both PDF and Word)
            const response = await apiRequest({
                endpoint: `ContractsDatasets/ExportContract/${previewData.id}`,
                method: "GET",
                responseType: "blob",
                token: getToken() ?? ""
            });
            
            if (response && 'success' in response && !response.success) {
                toaster.error("Failed to download ZIP file");
                return;
            }
            
            const blob = response as Blob;
            const fileName = `contract-${previewData.id}-${previewData.rowData.projectName || 'document'}.zip`;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toaster.success("ZIP file downloaded successfully");
        } catch (error) {
            toaster.error("Failed to download ZIP file");
        } finally {
            setExportingZip(false);
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

                    <div>
                        {loading ? (
                            <Loader />
                        ) : (
                            <SAMTable
                                columns={columns}
                                tableData={tableData}
                                actions
                                previewAction
                                title={"Subcontractor BOQ"}
                                loading={false}
                                onSuccess={getContractsDatasets}
                                openStaticDialog={(type, data) => {
                                    if (type === "Preview" && data) {
                                        return handlePreviewContract(data);
                                    }
                                }}
                                dynamicDialog={false}
                            />
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBackToTable}
                                className="btn btn-sm btn-back border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                            >
                                <span className="iconify lucide--arrow-left size-4"></span>
                                <span>Back</span>
                            </button>
                        </div>
                        
                        <div className="flex gap-2">
                            <ExportDropdown 
                                exportingPdf={exportingPdf}
                                exportingWord={exportingWord}
                                exportingZip={exportingZip}
                                onExportPdf={handleExportPdf}
                                onExportWord={handleExportWord}
                                onExportZip={handleExportZip}
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
                                    {previewData?.fileName} • Contract #{previewData?.id}
                                </p>
                            </div>
                        </div>
                        
                        {/* Contract Preview Content */}
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

export default SubcontractorsBOQs;
