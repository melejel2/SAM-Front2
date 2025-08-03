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
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [contractToGenerate, setContractToGenerate] = useState<any>(null);

    const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
    const [contractToDeleteId, setContractToDeleteId] = useState<number | null>(null);

    const { 
        columns, 
        tableData, 
        inputFields, 
        loading, 
        getContractsDatasets, 
        previewContract,
        DeleteContract,
        generateContract 
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
            toaster.error(result.error!.message!)
            //toaster.error("Failed to load contract preview");
        }
    };

const handleDeleteContract = (id: number) => {
    setContractToDeleteId(id);
    setShowDeleteConfirmDialog(true);
};

const handleDeleteConfirm = async () => {
    if (contractToDeleteId !== null) {
        const result = await DeleteContract(contractToDeleteId);
        if (result.success) {
            toaster.success("Contract deleted successfully!");
            getContractsDatasets(); // Refresh the table after deletion
        } else {
            toaster.error(result.error!.message!);
        }
    }
    setShowDeleteConfirmDialog(false);
    setContractToDeleteId(null);
};

const handleDeleteCancel = () => {
    setShowDeleteConfirmDialog(false);
    setContractToDeleteId(null);
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
            let response;
            
            // Try to get contract data first for editable contracts
            try {
                const contractResponse = await apiRequest({
                    endpoint: `ContractsDatasets/GetSubcontractorData/${previewData.id}`,
                    method: "GET",
                    token: getToken() ?? ""
                });

                if (contractResponse && contractResponse.success !== false) {
                    // Use LivePreviewPdf for editable contracts
                    response = await apiRequest({
                        endpoint: "ContractsDatasets/LivePreviewPdf",
                        method: "POST",
                        token: getToken() ?? "",
                        body: contractResponse,
                        responseType: "blob",
                    });
                } else {
                    throw new Error("Contract data not found");
                }
            } catch {
                // Fallback to standard PDF export
                response = await apiRequest({
                    endpoint: `ContractsDatasets/ExportSubcontractorPdf/${previewData.id}`,
                    method: "GET",
                    responseType: "blob",
                    token: getToken() ?? ""
                });
            }
            
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
            // For editable contracts, we need to extract the Word file from LivePreview ZIP
            let response;
            
            try {
                const contractResponse = await apiRequest({
                    endpoint: `ContractsDatasets/GetSubcontractorData/${previewData.id}`,
                    method: "GET",
                    token: getToken() ?? ""
                });

                if (contractResponse && contractResponse.success !== false) {
                    // Use LivePreviewWord for editable contracts
                    response = await apiRequest({
                        endpoint: "ContractsDatasets/LivePreviewWord",
                        method: "POST",
                        token: getToken() ?? "",
                        body: contractResponse,
                        responseType: "blob",
                    });
                } else {
                    throw new Error("Contract data not found");
                }
            } catch {
                // Fallback to standard Word export
                response = await apiRequest({
                    endpoint: `ContractsDatasets/ExportSubcontractorWord/${previewData.id}`,
                    method: "GET",
                    responseType: "blob",
                    token: getToken() ?? ""
                });
            }
            
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
            let response;
            
            // Try to get contract data first for editable contracts
            try {
                const contractResponse = await apiRequest({
                    endpoint: `ContractsDatasets/GetSubcontractorData/${previewData.id}`,
                    method: "GET",
                    token: getToken() ?? ""
                });

                if (contractResponse && contractResponse.success !== false) {
                    // Use LivePreview for editable contracts (returns ZIP with both formats)
                    response = await apiRequest({
                        endpoint: "ContractsDatasets/LivePreview",
                        method: "POST",
                        token: getToken() ?? "",
                        body: contractResponse,
                        responseType: "blob",
                    });
                } else {
                    throw new Error("Contract data not found");
                }
            } catch {
                // Fallback to standard ZIP export
                response = await apiRequest({
                    endpoint: `ContractsDatasets/ExportSubcontractor/${previewData.id}`,
                    method: "GET",
                    responseType: "blob",
                    token: getToken() ?? ""
                });
            }
            
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

    const handleGenerateContract = async () => {
        if (!contractToGenerate) return;
        
        setGeneratingId(contractToGenerate.id);
        try {
            const result = await generateContract(contractToGenerate.id);
            
            if (result.success) {
                toaster.success(`Contract ${contractToGenerate.contractNumber} has been generated successfully`);
                setShowGenerateModal(false);
                setContractToGenerate(null);
                // Refresh the data to reflect status change
                getContractsDatasets();
            } else {
                toaster.error(result.error || "Failed to generate contract");
            }
        } catch (error) {
            toaster.error("An error occurred while generating the contract");
        } finally {
            setGeneratingId(null);
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
                        
                        <div className="flex items-center gap-3">
                            <button
                                className="btn btn-sm btn-primary text-white flex items-center gap-2"
                                onClick={() => navigate('/dashboard/subcontractors-boqs/new')}
                            >
                                <span className="iconify lucide--plus size-4"></span>
                                <span>New Subcontract</span>
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
                                editAction
                                deleteAction
                                title={"Subcontractor BOQ"}
                                loading={false}
                                onSuccess={getContractsDatasets}
                                openStaticDialog={(type, data) => {
                                    if (type === "Preview" && data) {
                                        return handlePreviewContract(data);
                                    } else if (type === "Edit" && data) {
                                        navigate(`/dashboard/subcontractors-boqs/edit/${data.id}`);
                                    } 
                                    else if (type === "Delete" && data) {
                                        handleDeleteContract(data.id); 
                                    } else if (type === "Generate" && data) {
                                        setContractToGenerate(data);
                                        setShowGenerateModal(true);
                                    }
                                }}
                                dynamicDialog={false}
                                rowActions={(row) => ({
                                    generateAction: row.status?.toLowerCase().includes('editable'),
                                })}
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

            {/* Delete Confirmation Dialog */}
{showDeleteConfirmDialog && (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[modal-fade_0.2s]">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
                    {}
                    <span className="iconify lucide--trash-2 w-6 h-6 text-error" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-base-content">Confirm Deletion</h3>
                    <p className="text-sm text-base-content/60">This action cannot be undone.</p>
                </div>
            </div>

            <div className="mb-6">
                <p className="text-base-content/80 mb-3">
                    Are you sure you want to permanently delete this contract?
                </p>
                <div className="bg-error/30 border border-error/20 rounded-lg p-3">
                    <p className="text-sm text-error-content">
                        <span className="iconify lucide--info w-4 h-4 inline mr-1" />
                        All associated data and files will also be deleted.
                    </p>
                </div>
            </div>

            <div className="flex gap-3 justify-end">
                <button
                    onClick={handleDeleteCancel}
                    className="btn btn-ghost btn-sm px-6"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDeleteConfirm}
                    className="btn btn-error btn-sm px-6"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
)}

            {/* Generate Contract Confirmation Modal */}
            {showGenerateModal && contractToGenerate && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-success">Generate Contract</h3>
                        <p className="py-4">
                            Are you sure you want to generate contract <strong>{contractToGenerate.contractNumber}</strong> 
                            {contractToGenerate.projectName && <> for project <strong>{contractToGenerate.projectName}</strong></>}?
                        </p>
                        <p className="text-sm text-base-content/70">
                            This action will finalize the contract and change its status to Active. The contract will no longer be editable.
                        </p>
                        <div className="modal-action">
                            <button 
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowGenerateModal(false);
                                    setContractToGenerate(null);
                                }}
                                disabled={generatingId !== null}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-success text-white"
                                onClick={handleGenerateContract}
                                disabled={generatingId !== null}
                            >
                                {generatingId !== null ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--check-circle size-4"></span>
                                        <span>Generate Contract</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubcontractorsBOQs;
