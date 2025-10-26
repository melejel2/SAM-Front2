import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import apiRequest from "@/api/api";

import useContractsDatabase from "./use-contracts-database";

// Document Type Selection Modal Component (Memoized)
const DocumentTypeModal = memo(({
    isOpen,
    onClose,
    onSelectDocument,
    contractData,
    loadingDocumentType
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelectDocument: (type: string) => void;
    contractData: any;
    loadingDocumentType: string | null;
}) => {
    if (!isOpen) return null;

    const documentTypes = [
        {
            id: 'contract',
            title: 'Contract',
            description: 'Original contract document',
            icon: 'lucide--file-text',
            available: true
        },
        {
            id: 'termination',
            title: 'Termination Letter',
            description: 'Contract termination document (generated when contract is terminated)',
            icon: 'lucide--file-x',
            available: true // Backend will return 404 if not generated yet
        },
        {
            id: 'dischargeFinal',
            title: 'Discharge Final',
            description: 'Final discharge document (generated after termination)',
            icon: 'lucide--file-check',
            available: true // Backend will return 404 if not generated yet
        },
        {
            id: 'dischargeRG',
            title: 'Discharge RG',
            description: 'RG discharge document (not yet implemented)',
            icon: 'lucide--file-check-2',
            available: false // Not implemented yet
        }
    ];

    const anyLoading = loadingDocumentType !== null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg mb-4">Select Document to Preview</h3>
                <p className="text-sm text-base-content/70 mb-6">
                    Contract: <strong>{contractData?.contractNumber}</strong>
                    {contractData?.projectName && <> • Project: <strong>{contractData?.projectName}</strong></>}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentTypes.map((docType) => {
                        const isLoadingThisDocument = loadingDocumentType === docType.id;
                        const isDisabled = !docType.available || anyLoading;

                        return (
                            <button
                                key={docType.id}
                                onClick={() => docType.available ? onSelectDocument(docType.id) : null}
                                disabled={isDisabled}
                                className={`
                                    card border-2 p-4 text-left transition-all duration-200
                                    ${docType.available
                                        ? 'border-base-300 hover:border-primary hover:shadow-md cursor-pointer'
                                        : 'border-base-200 bg-base-200 cursor-not-allowed opacity-50'
                                    }
                                    ${isLoadingThisDocument ? 'opacity-75' : ''}
                                    ${anyLoading && !isLoadingThisDocument ? 'opacity-50' : ''}
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        {isLoadingThisDocument ? (
                                            <span className="loading loading-spinner loading-sm text-primary"></span>
                                        ) : (
                                            <span className={`iconify ${docType.icon} size-6 ${
                                                docType.available ? 'text-primary' : 'text-base-content/40'
                                            }`}></span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold mb-1">
                                            {docType.title}
                                            {isLoadingThisDocument && (
                                                <span className="text-sm font-normal text-base-content/70 ml-2">
                                                    Loading...
                                                </span>
                                            )}
                                        </h4>
                                        <p className="text-sm text-base-content/70">{docType.description}</p>
                                        {!docType.available && (
                                            <p className="text-xs text-warning mt-1">Not available</p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="modal-action">
                    <button
                        className="btn btn-ghost"
                        onClick={onClose}
                        disabled={anyLoading}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
});

DocumentTypeModal.displayName = 'DocumentTypeModal';

// Export Dropdown Component (Memoized)
const ExportDropdown = memo(({
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
                            <span className="iconify lucide--file-edit size-4"></span>
                            <span className="font-medium">Export as Word</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={onExportZip}
                            className="flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200"
                        >
                            <span className="iconify lucide--package size-4"></span>
                            <span className="font-medium">Export Both (ZIP)</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
});

ExportDropdown.displayName = 'ExportDropdown';

const ContractsDatabase = () => {
    const { 
        contractsColumns, 
        terminatedColumns, 
        contractsData, 
        terminatedData,
        loading,
        getContractsDatasets,
        getActiveContracts,
        getTerminatedContracts,
        previewContract,
        terminateContract,
        generateFinalContract
    } = useContractsDatabase();
    
    const { toaster } = useToast();
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState(0);
    const [viewMode, setViewMode] = useState<'table' | 'preview'>('table');
    const [previewData, setPreviewData] = useState<{ blob: Blob; id: string; fileName: string; rowData: any } | null>(null);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingWord, setExportingWord] = useState(false);
    const [exportingZip, setExportingZip] = useState(false);
    const [terminatingId, setTerminatingId] = useState<string | null>(null);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [contractToTerminate, setContractToTerminate] = useState<any>(null);
    const [showDocumentTypeModal, setShowDocumentTypeModal] = useState(false);
    const [contractForDocumentSelection, setContractForDocumentSelection] = useState<any>(null);
    const [loadingDocumentType, setLoadingDocumentType] = useState<string | null>(null);
    const [generatingFinalId, setGeneratingFinalId] = useState<string | null>(null);
    const [showGenerateFinalModal, setShowGenerateFinalModal] = useState(false);
    const [contractToGenerateFinal, setContractToGenerateFinal] = useState<any>(null);
    const [selectedProject, setSelectedProject] = useState<string>("All Projects");
    const [exportingRowId, setExportingRowId] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Load both active and terminated contracts when page loads to show correct counts
        getActiveContracts();
        getTerminatedContracts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // No need to reload data on tab changes - data is already loaded



    const handlePreviewContract = useCallback(async (row: any) => {
        // Check if this is a terminated contract
        if (row.originalStatus?.toLowerCase() === 'terminated') {
            // Show document type selection modal for terminated contracts
            setContractForDocumentSelection(row);
            setShowDocumentTypeModal(true);
        } else {
            // Navigate to contract details page for active contracts and VOs using contract number
            const contractNumber = row.contractNumber || row.id; // Fallback to ID if no contract number
            navigate(`/dashboard/contracts-database/details/${contractNumber}`, {
                state: {
                    contractId: row.id, // Keep actual ID for API calls
                    contractNumber: row.contractNumber,
                    projectName: row.projectName,
                    subcontractorName: row.subcontractorName,
                    amount: row.amount,
                    status: row.status,
                    type: row.type || 'Contract'
                }
            });
        }
    }, [navigate]);

    const handleDocumentTypeSelect = async (documentType: string) => {
        if (!contractForDocumentSelection) return;

        setLoadingDocumentType(documentType);
        try {
            let endpoint = '';
            let fileName = '';

            // Use contract number instead of database ID in filenames
            const contractRef = contractForDocumentSelection.contractNumber || contractForDocumentSelection.id;

            switch (documentType) {
                case 'contract':
                    endpoint = `ContractsDatasets/ExportContractPdf/${contractForDocumentSelection.id}`;
                    fileName = `contract-${contractRef}-${contractForDocumentSelection.projectName || 'document'}.pdf`;
                    break;
                case 'termination':
                    endpoint = `ContractsDatasets/ExportTerminateFile/${contractForDocumentSelection.id}`;
                    fileName = `termination-${contractRef}-${contractForDocumentSelection.projectName || 'document'}.pdf`;
                    break;
                case 'dischargeFinal':
                    endpoint = `ContractsDatasets/ExportFinalFile/${contractForDocumentSelection.id}`;
                    fileName = `discharge-final-${contractRef}-${contractForDocumentSelection.projectName || 'document'}.pdf`;
                    break;
                case 'dischargeRG':
                    // Note: Not implemented according to the documentation
                    toaster.error("Discharge RG is not yet implemented");
                    setLoadingDocumentType(null);
                    return;
                default:
                    toaster.error("Unknown document type");
                    setLoadingDocumentType(null);
                    return;
            }

            const response = await apiRequest({
                endpoint,
                method: "GET",
                responseType: "blob",
                token: getToken() ?? ""
            });

            if (response instanceof Blob) {
                setPreviewData({
                    blob: response,
                    id: contractForDocumentSelection.id,
                    fileName,
                    rowData: contractForDocumentSelection
                });
                setViewMode('preview');
                setShowDocumentTypeModal(false);
                setContractForDocumentSelection(null);
            } else {
                toaster.error("Failed to load document preview");
            }
        } catch (error: any) {
            // Handle specific error cases
            if (error?.response?.status === 404) {
                switch (documentType) {
                    case 'termination':
                        toaster.error("Termination letter has not been generated yet. Please terminate the contract first.");
                        break;
                    case 'dischargeFinal':
                        toaster.error("Final discharge document has not been generated yet. Please generate it first.");
                        break;
                    default:
                        toaster.error("Document not found. It may not have been generated yet.");
                }
            } else if (error?.response?.status === 500) {
                toaster.error("Server error occurred while loading the document.");
            } else {
                toaster.error("Failed to load document preview");
            }
        } finally {
            setLoadingDocumentType(null);
        }
    };

    const handleExportTerminate = async (row: any) => {
        setExportingRowId(row.id); 
        try {
            const response = await apiRequest({
                endpoint: `ContractsDatasets/ExportTerminateFile/${row.id}`,
                method: "GET",
                responseType: "blob",
                token: getToken() ?? ""
            });

            if (response instanceof Blob) {
                const contractRef = row.contractNumber || row.id;
                const fileName = `termination-${contractRef}-${row.projectName || 'document'}.docx`;
                const url = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toaster.success("Termination letter downloaded successfully");
            } else {
                toaster.error("Failed to download termination letter");
            }
        } catch (error: any) {
            if (error?.response?.status === 404) {
                toaster.error("Termination letter has not been generated yet. Please terminate the contract first.");
            } else {
                toaster.error("Failed to download termination letter");
            }
        } finally {
            setExportingRowId(null);
        }
    };

    const handleGenerateFinalContract = async () => {
        if (!contractToGenerateFinal) return;
        
        setGeneratingFinalId(contractToGenerateFinal.id);
        try {
            const result = await generateFinalContract(contractToGenerateFinal.id);
            
            if (result.success) {
                toaster.success(`Final discharge document for contract ${contractToGenerateFinal.contractNumber} has been generated successfully`);
                setShowGenerateFinalModal(false);
                setContractToGenerateFinal(null);
            } else {
                toaster.error(result.error || "Failed to generate final discharge document");
            }
        } catch (error) {
            toaster.error("An error occurred while generating the final discharge document");
        } finally {
            setGeneratingFinalId(null);
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
            const contractRef = previewData.rowData.contractNumber || previewData.id;
            const fileName = `contract-${contractRef}-${previewData.rowData.projectName || 'document'}.pdf`;
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
            // Call the Word export endpoint for contracts
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
            const contractRef = previewData.rowData.contractNumber || previewData.id;
            const fileName = `contract-${contractRef}-${previewData.rowData.projectName || 'document'}.docx`;
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
            const contractRef = previewData.rowData.contractNumber || previewData.id;
            const fileName = `contract-${contractRef}-${previewData.rowData.projectName || 'document'}.zip`;
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

    const handleTerminateContract = async () => {
        if (!contractToTerminate) return;
        
        setTerminatingId(contractToTerminate.id);
        try {
            const result = await terminateContract(contractToTerminate.id);
            
            if (result.success) {
                toaster.success(`Contract ${contractToTerminate.contractNumber} has been terminated successfully`);
                setShowTerminateModal(false);
                setContractToTerminate(null);
            } else {
                toaster.error(result.error || "Failed to terminate contract");
            }
        } catch (error) {
            toaster.error("An error occurred while terminating the contract");
        } finally {
            setTerminatingId(null);
        }
    };

    // Memoize unique projects calculation
    const allContracts = useMemo(() => [...contractsData, ...terminatedData], [contractsData, terminatedData]);

    const uniqueProjects = useMemo(() => {
        return Array.from(new Set(allContracts.map((contract: any) => contract.projectName).filter(name => name && name !== '-'))).sort();
    }, [allContracts]);

    // Memoize filtered data
    const filteredContractsData = useMemo(() => {
        return selectedProject === "All Projects"
            ? contractsData
            : contractsData.filter((contract: any) => contract.projectName === selectedProject);
    }, [selectedProject, contractsData]);

    const filteredTerminatedData = useMemo(() => {
        return selectedProject === "All Projects"
            ? terminatedData
            : terminatedData.filter((contract: any) => contract.projectName === selectedProject);
    }, [selectedProject, terminatedData]);

    return (
        <div>
            {viewMode === 'table' ? (
                <div>
                    {/* Header with Back Button and Category Cards */}
                    <div className="flex justify-between items-center mb-6">
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
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-64 mt-1 max-h-96 overflow-y-auto">
                                    <li>
                                        <button
                                            onClick={() => setSelectedProject("All Projects")}
                                            className={`flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200 ${
                                                selectedProject === "All Projects" ? "bg-base-200 font-semibold" : ""
                                            }`}
                                        >
                                            <span className="iconify lucide--list size-4"></span>
                                            <span>All Projects ({allContracts.length})</span>
                                        </button>
                                    </li>
                                    <li className="menu-title">
                                        <span className="text-xs font-semibold">Projects</span>
                                    </li>
                                    {uniqueProjects.map((projectName) => {
                                        const count = allContracts.filter((contract: any) => contract.projectName === projectName).length;
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

                        {/* Category Selection Cards */}
                        <div className="flex items-center gap-2">
                            <button
                                className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                                    activeTab === 0
                                        ? "btn-primary"
                                        : "btn-ghost border border-base-300 hover:border-primary/50"
                                }`}
                                onClick={() => setActiveTab(0)}
                            >
                                <span className="iconify lucide--file-text size-4" />
                                <span>Active Contracts ({filteredContractsData.length})</span>
                            </button>

                            <button
                                className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                                    activeTab === 1
                                        ? "btn-primary"
                                        : "btn-ghost border border-base-300 hover:border-primary/50"
                                }`}
                                onClick={() => setActiveTab(1)}
                            >
                                <span className="iconify lucide--x-circle size-4" />
                                <span>Terminated Contracts ({filteredTerminatedData.length})</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Content - Using simplified structure that works */}
                    <div>
                        {loading ? (
                            <Loader />
                        ) : (
                            <div>
                                {/* Contracts Tab */}
                                {activeTab === 0 && (
                                    <SAMTable
                                        columns={contractsColumns}
                                        tableData={filteredContractsData}
                                        actions
                                        previewAction
                                        title={"Contract"}
                                        loading={false}
                                        onSuccess={getContractsDatasets}
                                        openStaticDialog={(type, data) => {
                                            if (type === "Preview" && data) {
                                                return handlePreviewContract(data);
                                            }
                                        }}
                                        dynamicDialog={false}
                                        rowsPerPage={20}
                                    />
                                )}

                                {/* Terminated Tab */}
                                {activeTab === 1 && (
                                    <SAMTable
                                        columns={terminatedColumns}
                                        tableData={filteredTerminatedData}
                                        actions
                                        previewAction
                                        exportAction
                                        title={"Terminated"}
                                        loading={false}
                                        onSuccess={() => {}}
                                        openStaticDialog={(type, data) => {
                                            if (type === "Preview" && data) {
                                                return handlePreviewContract(data);
                                            } else if ((type as any) === "Generate" && data) {
                                                setContractToGenerateFinal(data);
                                                setShowGenerateFinalModal(true);
                                            } else if (type === "Export" && data) {
                                                return handleExportTerminate(data);
                                            }
                                        }}
                                        dynamicDialog={false}
                                        rowsPerPage={20}
                                        rowActions={(row) => ({
                                            generateAction: row.originalStatus?.toLowerCase() === 'terminated',
                                            exportAction: true,
                                        })}
                                        exportingRowId={exportingRowId}
                                    />
                                )}
                            </div>
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
                                className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
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
                                    {previewData?.fileName}
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

            {/* Terminate Contract Confirmation Modal */}
            {showTerminateModal && contractToTerminate && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-error">Terminate Contract</h3>
                        <p className="py-4">
                            Are you sure you want to terminate contract <strong>{contractToTerminate.contractNumber}</strong> 
                            {contractToTerminate.projectName && <> for project <strong>{contractToTerminate.projectName}</strong></>}?
                        </p>
                        <p className="text-sm text-base-content/70">
                            This action cannot be undone. The contract will be moved to the terminated contracts list.
                        </p>
                        <div className="modal-action">
                            <button 
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowTerminateModal(false);
                                    setContractToTerminate(null);
                                }}
                                disabled={terminatingId !== null}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-error text-white"
                                onClick={handleTerminateContract}
                                disabled={terminatingId !== null}
                            >
                                {terminatingId !== null ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Terminating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--x-circle size-4"></span>
                                        <span>Terminate Contract</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Type Selection Modal */}
            <DocumentTypeModal
                isOpen={showDocumentTypeModal}
                onClose={() => {
                    setShowDocumentTypeModal(false);
                    setContractForDocumentSelection(null);
                    setLoadingDocumentType(null);
                }}
                onSelectDocument={handleDocumentTypeSelect}
                contractData={contractForDocumentSelection}
                loadingDocumentType={loadingDocumentType}
            />

            {/* Generate Final Contract Confirmation Modal */}
            {showGenerateFinalModal && contractToGenerateFinal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-success">Generate Final Discharge</h3>
                        <p className="py-4">
                            Are you sure you want to generate the final discharge document for contract <strong>{contractToGenerateFinal.contractNumber}</strong> 
                            {contractToGenerateFinal.projectName && <> for project <strong>{contractToGenerateFinal.projectName}</strong></>}?
                        </p>
                        <p className="text-sm text-base-content/70">
                            This will generate the "Discharge Final" document for this terminated contract.
                        </p>
                        <div className="modal-action">
                            <button 
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowGenerateFinalModal(false);
                                    setContractToGenerateFinal(null);
                                }}
                                disabled={generatingFinalId !== null}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn btn-success text-white"
                                onClick={handleGenerateFinalContract}
                                disabled={generatingFinalId !== null}
                            >
                                {generatingFinalId !== null ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--file-check size-4"></span>
                                        <span>Generate Final Discharge</span>
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

export default ContractsDatabase;
