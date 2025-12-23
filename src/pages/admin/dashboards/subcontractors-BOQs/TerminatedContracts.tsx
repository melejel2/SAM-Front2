import { Icon } from "@iconify/react";
import { useEffect, useState, useMemo, useCallback } from "react";

import apiRequest from "@/api/api";
import {
    ContractType,
    generateFinalContract,
    terminateContract,
    exportTerminatedContractFile,
    exportFinalDischargeFile,
    previewContractFile,
} from "@/api/services/contracts-api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/utils/formatters";

interface TerminatedContract {
    id: number;
    contractNumber: string;
    projectName: string;
    subcontractorName: string;
    tradeName: string;
    contractType: string;
    contractDate: string;
    completionDate: string;
    amount: string;
    status: string;
    originalStatus: string;
    // Document status flags
    hasTerminatedFile?: boolean;
    hasFinalFile?: boolean;
    hasRGFile?: boolean;
}


interface TerminatedContractsProps {
    selectedProject: string;
    contractId?: number;
}

const TerminatedContracts: React.FC<TerminatedContractsProps> = ({ selectedProject, contractId: externalContractId }) => {
    const { toaster } = useToast();
    const { getToken } = useAuth();
    const token = getToken();

    // Contract list state
    const [terminatedContractsData, setTerminatedContractsData] = useState<TerminatedContract[]>([]);
    const [loadingContracts, setLoadingContracts] = useState(false);

    // Selected contract state
    const [selectedContractId, setSelectedContractId] = useState<number | null>(externalContractId ?? null);
    const [selectedContract, setSelectedContract] = useState<TerminatedContract | null>(null);

    // Preview state
    const [loading, setLoading] = useState<ContractType | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string; type: string } | null>(null);

    // Regeneration state
    const [regenerating, setRegenerating] = useState<string | null>(null);
    const [generatingFinal, setGeneratingFinal] = useState(false);

    // Table columns for terminated contracts list
    const terminatedColumns = useMemo(() => ({
        contractNumber: "Contract #",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        tradeName: "Trade",
        contractDate: "Contract Date",
        completionDate: "End Date",
        amount: "Amount",
    }), []);

    // Fetch terminated contracts
    const getTerminatedContracts = useCallback(async () => {
        setLoadingContracts(true);
        try {
            const data = await apiRequest({
                endpoint: `ContractsDatasets/GetContractsDatasetsList/1`, // Status 1 = Terminated
                method: "GET",
                token: token ?? "",
            });

            let contractsArray: any[] = [];
            if (Array.isArray(data)) {
                contractsArray = data;
            } else if (data && typeof data === 'object') {
                if (data.data && Array.isArray(data.data)) {
                    contractsArray = data.data;
                } else if (data.result && Array.isArray(data.result)) {
                    contractsArray = data.result;
                } else if (data.items && Array.isArray(data.items)) {
                    contractsArray = data.items;
                }
            }

            const processedData: TerminatedContract[] = contractsArray.map((contract: any) => ({
                id: contract.id,
                contractNumber: contract.contractNumber || '-',
                projectName: contract.projectName || '-',
                subcontractorName: contract.subcontractorName || '-',
                tradeName: contract.tradeName || '-',
                contractType: contract.contractType || 'Contract',
                contractDate: contract.contractDate ? formatDate(contract.contractDate) : '-',
                completionDate: contract.completionDate ? formatDate(contract.completionDate) : '-',
                amount: contract.amount ? formatCurrency(contract.amount) : '-',
                originalStatus: contract.status || 'Terminated',
                status: 'Terminated',
                hasTerminatedFile: !!contract.terminatedFile_Id,
                hasFinalFile: !!contract.finalFile_Id,
                hasRGFile: !!contract.rgFile_Id,
            }));

            setTerminatedContractsData(processedData.reverse());
        } catch (error) {
            console.error("API Error loading terminated contracts:", error);
            setTerminatedContractsData([]);
            toaster.error("Failed to load terminated contracts");
        } finally {
            setLoadingContracts(false);
        }
    }, [token, toaster]);

    // Load contracts on mount
    useEffect(() => {
        if (!externalContractId) {
            getTerminatedContracts();
        }
    }, [getTerminatedContracts, externalContractId]);

    // Update selected contract when selection changes
    useEffect(() => {
        if (selectedContractId) {
            const contract = terminatedContractsData.find(c => c.id === selectedContractId);
            setSelectedContract(contract || null);
        } else {
            setSelectedContract(null);
        }
    }, [selectedContractId, terminatedContractsData]);

    // Use external contractId if provided
    useEffect(() => {
        if (externalContractId) {
            setSelectedContractId(externalContractId);
        }
    }, [externalContractId]);

    // Filter contracts by project
    const filteredContracts = useMemo(() => {
        if (selectedProject === "All Projects") {
            return terminatedContractsData;
        }
        return terminatedContractsData.filter(contract => contract.projectName === selectedProject);
    }, [terminatedContractsData, selectedProject]);

    // Handle contract selection from table
    const handleSelectContract = (row: TerminatedContract) => {
        setSelectedContractId(row.id);
        setShowPreview(false);
        setPreviewData(null);
    };

    // Handle preview document
    const handlePreview = async (type: ContractType) => {
        if (!selectedContractId) {
            toaster.error("Please select a contract first");
            return;
        }

        setLoading(type);
        // Show progress toast for long PDF operations
        if (type !== ContractType.contract) {
            toaster.info("Generating preview... This may take a moment for large documents.");
        }

        try {
            const blob = await previewContractFile(selectedContractId, type, token ?? "");
            if (blob && blob.size > 0) {
                const contractNumber = selectedContract?.contractNumber || `Contract_${selectedContractId}`;
                const typeName = ContractType[type];

                setPreviewData({
                    blob: blob,
                    fileName: `${contractNumber}_${typeName}.pdf`,
                    type: typeName,
                });
                setShowPreview(true);
            } else {
                const errorMessage = getDocumentNotFoundMessage(type);
                toaster.error(errorMessage);
            }
        } catch (error) {
            const errorMessage = getDocumentNotFoundMessage(type);
            toaster.error(errorMessage);
        } finally {
            setLoading(null);
        }
    };

    // Get user-friendly error message for missing documents
    const getDocumentNotFoundMessage = (type: ContractType): string => {
        switch (type) {
            case ContractType.Terminate:
                return "Termination letter not found. Click 'Regenerate Termination' to create it.";
            case ContractType.Final:
                return "Final discharge document not found. Click 'Generate Final Discharge' to create it.";
            case ContractType.RG:
                return "RG document not found. This is created during IPC processing.";
            default:
                return "Document not found.";
        }
    };

    // Handle export termination letter as Word
    const handleExportTerminate = async () => {
        if (!selectedContractId) {
            toaster.error("Please select a contract first");
            return;
        }

        try {
            const blob = await exportTerminatedContractFile(selectedContractId, token ?? "");

            if (blob && blob.size > 0) {
                const contractNumber = selectedContract?.contractNumber || selectedContractId;
                const projectName = selectedContract?.projectName || "document";
                const fileName = `Termination_${contractNumber}_${projectName}.docx`;

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
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
            toaster.error("Termination letter not found. Please regenerate it first.");
        }
    };

    // Handle export final discharge as PDF
    const handleExportFinal = async () => {
        if (!selectedContractId) {
            toaster.error("Please select a contract first");
            return;
        }

        toaster.info("Exporting final discharge... This may take a moment.");

        try {
            const blob = await exportFinalDischargeFile(selectedContractId, token ?? "");

            if (blob && blob.size > 0) {
                const contractNumber = selectedContract?.contractNumber || selectedContractId;
                const projectName = selectedContract?.projectName || "document";
                const fileName = `FinalDischarge_${contractNumber}_${projectName}.pdf`;

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toaster.success("Final discharge document downloaded successfully");
            } else {
                toaster.error("Failed to download final discharge document");
            }
        } catch (error: any) {
            toaster.error("Final discharge document not found. Please generate it first.");
        }
    };

    // Handle regenerate termination letter
    const handleRegenerateTermination = async () => {
        if (!selectedContractId) {
            toaster.error("Please select a contract first");
            return;
        }

        setRegenerating('terminate');
        try {
            const result = await terminateContract(selectedContractId, token ?? "");
            if (result.success) {
                toaster.success("Termination letter regenerated successfully");
                // Refresh contract list to update document status
                await getTerminatedContracts();
            } else {
                toaster.error(result.error || "Failed to regenerate termination letter");
            }
        } catch (error) {
            toaster.error("Failed to regenerate termination letter: " + (error as Error).message);
        } finally {
            setRegenerating(null);
        }
    };

    // Handle generate final discharge document
    const handleGenerateFinalDischarge = async () => {
        if (!selectedContractId) {
            toaster.error("Please select a contract first");
            return;
        }

        setGeneratingFinal(true);
        try {
            const result = await generateFinalContract(selectedContractId, token ?? "");
            if (result.success) {
                toaster.success("Final discharge document generated successfully");
                // Refresh contract list to update document status
                await getTerminatedContracts();
            } else {
                toaster.error(result.error || "Failed to generate final discharge document");
            }
        } catch (error) {
            toaster.error("Failed to generate final discharge: " + (error as Error).message);
        } finally {
            setGeneratingFinal(false);
        }
    };

    // Go back to list view
    const handleBackToList = () => {
        setSelectedContractId(null);
        setSelectedContract(null);
        setShowPreview(false);
        setPreviewData(null);
    };

    // If external contractId is provided, show only the document management view
    const showListView = !externalContractId && !selectedContractId;

    return (
        <div className="space-y-4">
            {/* List View - Show terminated contracts table */}
            {showListView && (
                <div className="card bg-base-100 border-base-300 border">
                    <div className="card-body p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
                                    <Icon icon="lucide:x-circle" className="text-red-600 dark:text-red-400 size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-base-content">Terminated Contracts</h2>
                                    <p className="text-sm text-base-content/70">
                                        Select a contract to preview or regenerate termination documents
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={getTerminatedContracts}
                                className="btn btn-sm btn-ghost"
                                disabled={loadingContracts}
                            >
                                <Icon icon="lucide:refresh-cw" className={`size-4 ${loadingContracts ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>

                        {loadingContracts ? (
                            <div className="flex justify-center py-12">
                                <Loader />
                            </div>
                        ) : filteredContracts.length === 0 ? (
                            <div className="text-center py-12">
                                <Icon icon="lucide:inbox" className="size-12 text-base-content/30 mx-auto mb-3" />
                                <p className="text-base-content/70">No terminated contracts found</p>
                            </div>
                        ) : (
                            <SAMTable
                                columns={terminatedColumns}
                                tableData={filteredContracts}
                                actions
                                previewAction
                                title=""
                                loading={false}
                                onSuccess={() => {}}
                                openStaticDialog={(type, data) => {
                                    if (type === "Preview" && data) {
                                        handleSelectContract(data);
                                    }
                                }}
                                dynamicDialog={false}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Document Management View - Show when a contract is selected */}
            {(selectedContractId || externalContractId) && (
                <div className="card bg-base-100 border-base-300 border">
                    <div className="card-body p-4">
                        {/* Header with back button */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {!externalContractId && (
                                    <button
                                        onClick={handleBackToList}
                                        className="btn btn-sm btn-ghost"
                                    >
                                        <Icon icon="lucide:arrow-left" className="size-4" />
                                        Back
                                    </button>
                                )}
                                <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
                                    <Icon icon="lucide:file-x" className="text-red-600 dark:text-red-400 size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-base-content">
                                        {selectedContract?.contractNumber || `Contract #${selectedContractId}`}
                                    </h2>
                                    <p className="text-sm text-base-content/70">
                                        {selectedContract?.projectName} - {selectedContract?.subcontractorName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Document Actions */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-base-content/70 mb-3">Document Preview & Export</h3>
                            <div className="flex flex-wrap gap-3">
                                {/* Preview buttons */}
                                <button
                                    className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700"
                                    onClick={() => handlePreview(ContractType.Terminate)}
                                    disabled={!!loading}
                                >
                                    {loading === ContractType.Terminate ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <Icon icon="lucide:file-x" className="size-4" />
                                    )}
                                    Preview Termination Letter
                                </button>

                                <button
                                    className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
                                    onClick={() => handlePreview(ContractType.Final)}
                                    disabled={!!loading}
                                >
                                    {loading === ContractType.Final ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <Icon icon="lucide:file-check" className="size-4" />
                                    )}
                                    Preview Final Discharge
                                </button>

                                <button
                                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                                    onClick={() => handlePreview(ContractType.RG)}
                                    disabled={!!loading}
                                >
                                    {loading === ContractType.RG ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <Icon icon="lucide:shield-check" className="size-4" />
                                    )}
                                    Preview RG Retention
                                </button>

                                <button
                                    className="btn btn-sm bg-base-200 text-base-content hover:bg-base-300"
                                    onClick={() => handlePreview(ContractType.contract)}
                                    disabled={!!loading}
                                >
                                    {loading === ContractType.contract ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <Icon icon="lucide:file-text" className="size-4" />
                                    )}
                                    Preview Main Contract
                                </button>
                            </div>
                        </div>

                        {/* Export Actions */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-base-content/70 mb-3">Export Documents</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={handleExportTerminate}
                                    disabled={!!loading}
                                >
                                    <Icon icon="lucide:download" className="size-4" />
                                    Export Termination (Word)
                                </button>

                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={handleExportFinal}
                                    disabled={!!loading}
                                >
                                    <Icon icon="lucide:download" className="size-4" />
                                    Export Final Discharge (PDF)
                                </button>
                            </div>
                        </div>

                        {/* Regenerate Actions */}
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-base-content/70 mb-3">Generate / Regenerate Documents</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    className="btn btn-sm bg-orange-600 text-white hover:bg-orange-700"
                                    onClick={handleRegenerateTermination}
                                    disabled={regenerating === 'terminate' || generatingFinal}
                                >
                                    {regenerating === 'terminate' ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Regenerating...
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="lucide:refresh-cw" className="size-4" />
                                            Regenerate Termination Letter
                                        </>
                                    )}
                                </button>

                                <button
                                    className="btn btn-sm bg-teal-600 text-white hover:bg-teal-700"
                                    onClick={handleGenerateFinalDischarge}
                                    disabled={generatingFinal || regenerating !== null}
                                >
                                    {generatingFinal ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="lucide:file-plus" className="size-4" />
                                            Generate Final Discharge
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-base-content/50 mt-2">
                                Note: RG documents are generated during IPC processing and cannot be regenerated here.
                            </p>
                        </div>

                        {/* Preview Area */}
                        {showPreview && previewData ? (
                            <div className="border-t border-base-300 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-base-content">
                                        Preview: {previewData.type} Document
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowPreview(false);
                                            setPreviewData(null);
                                        }}
                                        className="btn btn-sm btn-ghost"
                                    >
                                        <Icon icon="lucide:x" className="size-4" />
                                        Close Preview
                                    </button>
                                </div>
                                <div className="h-[60vh] border border-base-300 rounded-lg overflow-hidden">
                                    <PDFViewer fileBlob={previewData.blob} fileName={previewData.fileName} />
                                </div>
                            </div>
                        ) : (
                            <div className="border-t border-base-300 pt-4">
                                <div className="py-8 text-center">
                                    <Icon icon="lucide:file-search" className="size-12 text-base-content/30 mx-auto mb-3" />
                                    <p className="text-base-content/60">Select a document type above to preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TerminatedContracts;
