import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import apiRequest from "@/api/api";
import { createSubcontractorVO } from "@/api/services/vo-api";
import { CreateSubcontractorVoRequest } from "@/types/variation-order";

import useSubcontractorsBOQs from "./use-subcontractors-boqs";

// Contract Selection Modal for VO Creation
const ContractSelectionModal = ({ 
    isOpen, 
    onClose, 
    contracts,
    onContractSelect 
}: {
    isOpen: boolean;
    onClose: () => void;
    contracts: any[];
    onContractSelect: (contract: any) => void;
}) => {
    if (!isOpen) return null;

    const availableContracts = contracts.filter(contract => 
        contract.status?.toLowerCase().includes('active') || 
        contract.status?.toLowerCase().includes('editable')
    );

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden animate-[modal-fade_0.2s]">
                {/* Header */}
                <div className="bg-gradient-to-r from-warning to-warning-focus p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold">Select Contract for VO</h3>
                            <p className="text-white/80 text-sm mt-1">
                                Choose which contract to create a variation order for
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn btn-ghost btn-sm text-white hover:bg-white/20"
                        >
                            <span className="iconify lucide--x size-5"></span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                    {availableContracts.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="iconify lucide--alert-triangle size-8 text-warning"></span>
                            </div>
                            <h4 className="font-semibold text-base-content mb-2">No Available Contracts</h4>
                            <p className="text-base-content/60">
                                No active or editable contracts found. Create or activate a contract first.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {availableContracts.map((contract, index) => (
                                <div
                                    key={index}
                                    className="card bg-base-50 border border-base-300 hover:bg-base-100 transition-colors cursor-pointer"
                                    onClick={() => {
                                        onContractSelect(contract);
                                        onClose();
                                    }}
                                >
                                    <div className="card-body p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-base-content">
                                                        {contract.contractNumber}
                                                    </h4>
                                                    <div dangerouslySetInnerHTML={{ __html: contract.status }}></div>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-base-content/60">Project:</span>
                                                        <span className="ml-2 font-medium">{contract.projectName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-base-content/60">Subcontractor:</span>
                                                        <span className="ml-2 font-medium">{contract.subcontractorName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-base-content/60">Trade:</span>
                                                        <span className="ml-2 font-medium">{contract.tradeName}</span>
                                                    </div>
                                                </div>
                                                {contract.amount && (
                                                    <div className="mt-2 text-sm">
                                                        <span className="text-base-content/60">Amount:</span>
                                                        <span className="ml-2 font-semibold text-primary">${contract.amount}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center text-base-content/40">
                                                <span className="iconify lucide--chevron-right size-5"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-base-300 p-6 bg-base-50">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="btn btn-ghost"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// VO Modal Component for Subcontractor Contracts
const SubcontractorVOModal = ({ 
    isOpen, 
    onClose, 
    contractData,
    onVOCreated 
}: {
    isOpen: boolean;
    onClose: () => void;
    contractData: any;
    onVOCreated: () => void;
}) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();
    const { toaster } = useToast();
    
    const [voData, setVoData] = useState({
        voNumber: '',
        description: '',
        reason: '',
        amount: '',
        type: 'Addition' // Addition or Deduction
    });

    const handleSubmit = async () => {
        // Comprehensive validation
        if (!voData.voNumber?.trim()) {
            toaster.error("VO Number is required");
            return;
        }
        
        if (!voData.description?.trim()) {
            toaster.error("Description is required");
            return;
        }
        
        if (!voData.amount || parseFloat(voData.amount) <= 0) {
            toaster.error("Amount must be greater than 0");
            return;
        }
        
        if (isNaN(parseFloat(voData.amount))) {
            toaster.error("Please enter a valid amount");
            return;
        }
        
        if (!voData.type) {
            toaster.error("VO Type is required");
            return;
        }

        setLoading(true);
        try {
            // Validate required contract data
            if (!contractData.id || !contractData.subcontractorId || !contractData.projectId || !contractData.buildingId) {
                toaster.error("Missing required contract information");
                return;
            }

            const voPayload: CreateSubcontractorVoRequest = {
                VoNumber: voData.voNumber.trim(),
                Description: voData.description.trim(),
                Reason: voData.reason?.trim() || undefined,
                Amount: parseFloat(voData.amount),
                Type: voData.type,
                ContractDatasetId: contractData.id,
                SubcontractorId: contractData.subcontractorId,
                ProjectId: contractData.projectId,
                BuildingId: contractData.buildingId,
                Date: new Date().toISOString()
            };

            const response = await createSubcontractorVO(voPayload, getToken() ?? "");

            if (response.success) {
                toaster.success(`VO ${voData.voNumber} created successfully`);
                onVOCreated();
                handleClose();
            } else {
                const errorMessage = 'error' in response ? response.error : response.message || "Failed to create VO";
                toaster.error(errorMessage);
                console.error("VO creation failed:", response);
            }
        } catch (error) {
            console.error("Error creating VO:", error);
            toaster.error("Failed to create VO. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setVoData({
            voNumber: '',
            description: '',
            reason: '',
            amount: '',
            type: 'Addition'
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-[modal-fade_0.2s]">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-focus p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold">Create Variation Order</h3>
                            <p className="text-white/80 text-sm mt-1">
                                For Contract: {contractData?.contractNumber} • {contractData?.projectName}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="btn btn-ghost btn-sm text-white hover:bg-white/20"
                        >
                            <span className="iconify lucide--x size-5"></span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* VO Number */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">VO Number *</span>
                                </label>
                                <input
                                    type="text"
                                    className={`input input-bordered w-full ${!voData.voNumber?.trim() ? 'input-error' : ''}`}
                                    placeholder="e.g., VO-001"
                                    value={voData.voNumber}
                                    onChange={(e) => setVoData({...voData, voNumber: e.target.value})}
                                    maxLength={50}
                                />
                                {!voData.voNumber?.trim() && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">VO Number is required</span>
                                    </label>
                                )}
                            </div>

                            {/* Type */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">VO Type *</span>
                                </label>
                                <div className="flex gap-4">
                                    <label className="label cursor-pointer gap-2">
                                        <input
                                            type="radio"
                                            name="voType"
                                            className="radio radio-primary"
                                            checked={voData.type === 'Addition'}
                                            onChange={() => setVoData({...voData, type: 'Addition'})}
                                        />
                                        <span className="label-text">Addition</span>
                                    </label>
                                    <label className="label cursor-pointer gap-2">
                                        <input
                                            type="radio"
                                            name="voType"
                                            className="radio radio-warning"
                                            checked={voData.type === 'Deduction'}
                                            onChange={() => setVoData({...voData, type: 'Deduction'})}
                                        />
                                        <span className="label-text">Deduction</span>
                                    </label>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Amount *</span>
                                </label>
                                <div className="input-group">
                                    <span className="bg-base-200 px-4 flex items-center text-base-content/70">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        className={`input input-bordered w-full ${
                                            !voData.amount || parseFloat(voData.amount) <= 0 || isNaN(parseFloat(voData.amount)) 
                                                ? 'input-error' : ''
                                        }`}
                                        placeholder="0.00"
                                        value={voData.amount}
                                        onChange={(e) => setVoData({...voData, amount: e.target.value})}
                                    />
                                </div>
                                {(!voData.amount || parseFloat(voData.amount) <= 0 || isNaN(parseFloat(voData.amount))) && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">
                                            Please enter a valid amount greater than 0
                                        </span>
                                    </label>
                                )}
                            </div>

                            {/* Description */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Description *</span>
                                </label>
                                <textarea
                                    className={`textarea textarea-bordered h-24 ${!voData.description?.trim() ? 'textarea-error' : ''}`}
                                    placeholder="Describe the variation order..."
                                    value={voData.description}
                                    onChange={(e) => setVoData({...voData, description: e.target.value})}
                                    maxLength={500}
                                ></textarea>
                                {!voData.description?.trim() && (
                                    <label className="label">
                                        <span className="label-text-alt text-error">Description is required</span>
                                    </label>
                                )}
                                <label className="label">
                                    <span className="label-text-alt">{voData.description?.length || 0}/500 characters</span>
                                </label>
                            </div>

                            {/* Reason */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold">Reason</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered h-20"
                                    placeholder="Reason for this variation order (optional)"
                                    value={voData.reason}
                                    onChange={(e) => setVoData({...voData, reason: e.target.value})}
                                ></textarea>
                            </div>

                            {/* Contract Info Card */}
                            <div className="card bg-base-200">
                                <div className="card-body p-4">
                                    <h4 className="font-semibold text-base-content/80 mb-2">Contract Details</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-base-content/60">Contract:</span>
                                            <span className="ml-2 font-medium">{contractData?.contractNumber}</span>
                                        </div>
                                        <div>
                                            <span className="text-base-content/60">Project:</span>
                                            <span className="ml-2 font-medium">{contractData?.projectName}</span>
                                        </div>
                                        <div>
                                            <span className="text-base-content/60">Subcontractor:</span>
                                            <span className="ml-2 font-medium">{contractData?.subcontractorName}</span>
                                        </div>
                                        <div>
                                            <span className="text-base-content/60">Trade:</span>
                                            <span className="ml-2 font-medium">{contractData?.tradeName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-base-300 p-6 bg-base-50">
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleClose}
                            className="btn btn-ghost"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            className={`btn btn-primary text-white ${loading ? 'loading' : ''}`}
                            disabled={loading || !voData.voNumber?.trim() || !voData.description?.trim() || !voData.amount || parseFloat(voData.amount) <= 0 || isNaN(parseFloat(voData.amount))}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--plus size-4"></span>
                                    Create VO
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

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
    
    // VO Modal state
    const [showVOModal, setShowVOModal] = useState(false);
    const [selectedContractForVO, setSelectedContractForVO] = useState<any>(null);
    const [showContractSelectionModal, setShowContractSelectionModal] = useState(false);

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
        const result = await previewContract(row);
        if (result.success && result.blob) {
            // Use PDF extension for preview since we're using the PDF endpoint
            const fileName = `contract-${row.id}-${row.projectName || 'document'}.pdf`;
            setPreviewData({ blob: result.blob, id: row.id, fileName, rowData: row });
            setViewMode('preview');
        } else {
            toaster.error("Failed to load contract preview");
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

// VO Modal Handlers
const handleCreateVOFromButton = () => {
    if (tableData.length === 0) {
        toaster.error("No contracts available. Create a contract first.");
        return;
    }
    
    const availableContracts = tableData.filter(contract => 
        contract.status?.toLowerCase().includes('active') || 
        contract.status?.toLowerCase().includes('editable')
    );
    
    if (availableContracts.length === 0) {
        toaster.error("No active or editable contracts available for VO creation.");
        return;
    }
    
    if (availableContracts.length === 1) {
        handleCreateVO(availableContracts[0]);
    } else {
        setShowContractSelectionModal(true);
    }
};

const handleCreateVO = (contractData: any) => {
    setSelectedContractForVO(contractData);
    setShowVOModal(true);
};

const handleVOModalClose = () => {
    setShowVOModal(false);
    setSelectedContractForVO(null);
};

const handleContractSelectionClose = () => {
    setShowContractSelectionModal(false);
};

const handleVOCreated = () => {
    // Refresh the contracts list to reflect any changes
    getContractsDatasets();
    toaster.success("VO created successfully and linked to contract");
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
                                className="btn btn-sm btn-warning text-white flex items-center gap-2"
                                onClick={handleCreateVOFromButton}
                                disabled={loading || tableData.length === 0}
                            >
                                <span className="iconify lucide--file-plus size-4"></span>
                                <span>Create VO</span>
                            </button>
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
                                    } else if ((type as any) === "Generate" && data) {
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

            {/* Contract Selection Modal */}
            <ContractSelectionModal
                isOpen={showContractSelectionModal}
                onClose={handleContractSelectionClose}
                contracts={tableData}
                onContractSelect={handleCreateVO}
            />

            {/* VO Creation Modal */}
            <SubcontractorVOModal
                isOpen={showVOModal}
                onClose={handleVOModalClose}
                contractData={selectedContractForVO}
                onVOCreated={handleVOCreated}
            />
        </div>
    );
};

export default SubcontractorsBOQs;
