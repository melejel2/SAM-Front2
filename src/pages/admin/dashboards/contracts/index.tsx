import { useEffect, useState, useCallback, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";

import useContractManagement from "./use-contract-management";

// Import icons
import fileTextIcon from "@iconify/icons-lucide/file-text";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import xCircleIcon from "@iconify/icons-lucide/x-circle";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import plusIcon from "@iconify/icons-lucide/plus";

// Tab type definition
type TabType = 'drafts' | 'active' | 'terminated';

const ContractsManagement = memo(() => {
    const navigate = useNavigate();
    const location = useLocation();

    const {
        columns,
        draftsData,
        activeData,
        terminatedData,
        loading,
        getDraftsContracts,
        getActiveContracts,
        getTerminatedContracts,
        deleteContract,
        generateContract,
        terminateContract,
        generateFinalContract,
        exportContractDocument,
    } = useContractManagement();

    const [activeTab, setActiveTab] = useState<TabType>('drafts');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [contractToGenerate, setContractToGenerate] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [contractToTerminate, setContractToTerminate] = useState<any>(null);
    const [terminating, setTerminating] = useState(false);
    const [showFinalDischargeModal, setShowFinalDischargeModal] = useState(false);
    const [contractToGenerateFinal, setContractToGenerateFinal] = useState<any>(null);
    const [generatingFinal, setGeneratingFinal] = useState(false);

    // Load all contracts on mount
    useEffect(() => {
        const loadAllContracts = async () => {
            await Promise.all([
                getDraftsContracts(),
                getActiveContracts(),
                getTerminatedContracts(),
            ]);
        };
        loadAllContracts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    // Get current tab data
    const getCurrentTabData = () => {
        switch (activeTab) {
            case 'drafts':
                return draftsData;
            case 'active':
                return activeData;
            case 'terminated':
                return terminatedData;
            default:
                return [];
        }
    };

    const handleBackToDashboard = useCallback(() => {
        navigate('/dashboard');
    }, [navigate]);

    const handleNewContract = useCallback(() => {
        navigate('/dashboard/contracts/new');
    }, [navigate]);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    // Handle Preview action - different behavior based on tab
    const handlePreview = useCallback(async (row: any) => {
        if (activeTab === 'drafts') {
            // For drafts, navigate to details page
            const contractNumber = row.contractNumber || row.id;
            navigate(`/dashboard/subcontractors-boqs/details/${contractNumber}`, {
                state: {
                    contractId: row.id,
                    contractNumber: row.contractNumber,
                    projectName: row.projectName,
                    subcontractorName: row.subcontractorName,
                    tradeName: row.tradeName,
                    amount: row.amount,
                    contractDate: row.contractDate,
                    completionDate: row.completionDate,
                    status: row.status
                }
            });
        } else if (activeTab === 'active') {
            // For active contracts, navigate to details page
            const contractNumber = row.contractNumber || row.id;
            navigate(`/dashboard/contracts-database/details/${contractNumber}`, {
                state: {
                    contractId: row.id,
                    contractNumber: row.contractNumber,
                    projectName: row.projectName,
                    subcontractorName: row.subcontractorName,
                    amount: row.amount,
                    status: row.status,
                    type: 'Contract'
                }
            });
        } else if (activeTab === 'terminated') {
            // For terminated contracts, navigate to details page with terminated flag
            const contractNumber = row.contractNumber || row.id;
            navigate(`/dashboard/contracts-database/details/${contractNumber}`, {
                state: {
                    contractId: row.id,
                    contractNumber: row.contractNumber,
                    projectName: row.projectName,
                    subcontractorName: row.subcontractorName,
                    amount: row.amount,
                    status: row.status,
                    type: 'Contract',
                    isTerminated: true
                }
            });
        }
    }, [activeTab, navigate]);

    // Handle Edit action (only for drafts)
    const handleEdit = useCallback((row: any) => {
        const contractNumber = row.contractNumber || row.id;
        navigate(`/dashboard/subcontractors-boqs/edit/${contractNumber}`, {
            state: {
                contractId: row.id,
                contractNumber: row.contractNumber
            }
        });
    }, [navigate]);

    // Handle Generate action (only for drafts)
    const handleGenerateClick = useCallback((row: any) => {
        setContractToGenerate(row);
        setShowGenerateModal(true);
    }, []);

    const handleGenerateConfirm = useCallback(async () => {
        if (!contractToGenerate) return;

        setGenerating(true);
        try {
            const result = await generateContract(contractToGenerate.id);
            if (result.success) {
                setShowGenerateModal(false);
                setContractToGenerate(null);
            }
        } catch (error) {
            console.error("Generate error:", error);
        } finally {
            setGenerating(false);
        }
    }, [contractToGenerate, generateContract]);

    // Handle Delete action (only for drafts)
    const handleDelete = useCallback(async (row: any) => {
        // SAMTable handles delete confirmation modal automatically
        await deleteContract(row.id);
    }, [deleteContract]);

    // Handle Export action (for active and terminated contracts)
    const handleExport = useCallback(async (row: any) => {
        try {
            // Export as ZIP (contains both PDF and Word)
            const result = await exportContractDocument(Number(row.id));
            if (result.success && result.blob) {
                const contractRef = row.contractNumber || row.id;
                const fileName = `contract-${contractRef}-${row.projectName || 'document'}.zip`;
                const url = window.URL.createObjectURL(result.blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error("Export error:", error);
        }
    }, [exportContractDocument]);

    // Handle Create VO action (only for active contracts)
    const handleCreateVO = useCallback((row: any) => {
        const contractNumber = row.contractNumber || row.id;
        navigate(`/dashboard/contracts-database/details/${contractNumber}/create-vo`, {
            state: {
                contractId: row.id,
                contractNumber: row.contractNumber,
                projectName: row.projectName,
                subcontractorName: row.subcontractorName,
            }
        });
    }, [navigate]);

    // Handle Terminate action (only for active contracts)
    const handleTerminateClick = useCallback((row: any) => {
        setContractToTerminate(row);
        setShowTerminateModal(true);
    }, []);

    const handleTerminateConfirm = useCallback(async () => {
        if (!contractToTerminate) return;

        setTerminating(true);
        try {
            const result = await terminateContract(contractToTerminate.id);
            if (result.success) {
                setShowTerminateModal(false);
                setContractToTerminate(null);
            }
        } catch (error) {
            console.error("Terminate error:", error);
        } finally {
            setTerminating(false);
        }
    }, [contractToTerminate, terminateContract]);

    // Handle Generate Final Discharge action (only for terminated contracts)
    const handleGenerateFinalClick = useCallback((row: any) => {
        setContractToGenerateFinal(row);
        setShowFinalDischargeModal(true);
    }, []);

    const handleGenerateFinalConfirm = useCallback(async () => {
        if (!contractToGenerateFinal) return;

        setGeneratingFinal(true);
        try {
            const result = await generateFinalContract(contractToGenerateFinal.id);
            if (result.success) {
                setShowFinalDischargeModal(false);
                setContractToGenerateFinal(null);
            }
        } catch (error) {
            console.error("Generate final error:", error);
        } finally {
            setGeneratingFinal(false);
        }
    }, [contractToGenerateFinal, generateFinalContract]);

    return (
        <div>
            {/* Header with Back Button and Tab Cards */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToDashboard}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <Icon icon={arrowLeftIcon} className="size-4" />
                        <span>Back</span>
                    </button>
                </div>

                {/* Category Selection Cards */}
                <div className="flex items-center gap-2">
                    <button
                        className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                            activeTab === 'drafts'
                                ? "btn-primary"
                                : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                        onClick={() => handleTabChange('drafts')}
                    >
                        <Icon icon={fileTextIcon} className="size-4" />
                        <span>Drafts ({draftsData.length})</span>
                    </button>

                    <button
                        className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                            activeTab === 'active'
                                ? "btn-primary"
                                : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                        onClick={() => handleTabChange('active')}
                    >
                        <Icon icon={checkCircleIcon} className="size-4" />
                        <span>Active Contracts ({activeData.length})</span>
                    </button>

                    <button
                        className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                            activeTab === 'terminated'
                                ? "btn-primary"
                                : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                        onClick={() => handleTabChange('terminated')}
                    >
                        <Icon icon={xCircleIcon} className="size-4" />
                        <span>Terminated Contracts ({terminatedData.length})</span>
                    </button>
                </div>
            </div>

            {/* Table Content */}
            <div>
                {loading ? (
                    <Loader />
                ) : (
                    <>
                        {/* Drafts Tab */}
                        {activeTab === 'drafts' && (
                            <SAMTable
                                columns={columns}
                                tableData={draftsData}
                                actions
                                previewAction
                                editAction
                                generateAction
                                deleteAction
                                addBtn
                                addBtnText="New Contract"
                                title="Draft Contract"
                                loading={false}
                                onSuccess={getDraftsContracts}
                                openStaticDialog={(type, data) => {
                                    if (type === "Preview" && data) {
                                        return handlePreview(data);
                                    } else if (type === "Edit" && data) {
                                        return handleEdit(data);
                                    } else if ((type as any) === "Generate" && data) {
                                        return handleGenerateClick(data);
                                    } else if (type === "Add") {
                                        return handleNewContract();
                                    }
                                }}
                                dynamicDialog={false}
                                rowActions={(row) => ({
                                    generateAction: true,
                                    editAction: true,
                                    deleteAction: true,
                                })}
                            />
                        )}

                        {/* Active Tab */}
                        {activeTab === 'active' && (
                            <SAMTable
                                columns={columns}
                                tableData={activeData}
                                actions
                                previewAction
                                exportAction
                                title="Active Contract"
                                loading={false}
                                onSuccess={getActiveContracts}
                                openStaticDialog={(type, data) => {
                                    if (type === "Preview" && data) {
                                        return handlePreview(data);
                                    } else if (type === "Edit" && data) {
                                        // Edit action used for Export in active contracts
                                        return handleExport(data);
                                    } else if ((type as any) === "CreateVO" && data) {
                                        return handleCreateVO(data);
                                    } else if ((type as any) === "Terminate" && data) {
                                        return handleTerminateClick(data);
                                    }
                                }}
                                dynamicDialog={false}
                                rowActions={(row) => ({
                                    terminateAction: true,
                                })}
                            />
                        )}

                        {/* Terminated Tab */}
                        {activeTab === 'terminated' && (
                            <SAMTable
                                columns={columns}
                                tableData={terminatedData}
                                actions
                                previewAction
                                exportAction
                                title="Terminated Contract"
                                loading={false}
                                onSuccess={getTerminatedContracts}
                                openStaticDialog={(type, data) => {
                                    if (type === "Preview" && data) {
                                        return handlePreview(data);
                                    } else if (type === "Edit" && data) {
                                        // Edit action used for Export in terminated contracts
                                        return handleExport(data);
                                    } else if ((type as any) === "Generate" && data) {
                                        return handleGenerateFinalClick(data);
                                    }
                                }}
                                dynamicDialog={false}
                                rowActions={(row) => ({
                                    generateAction: true,
                                })}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Generate Contract Modal */}
            {showGenerateModal && contractToGenerate && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-primary">Generate Contract</h3>
                        <p className="py-4">
                            Are you sure you want to generate contract <strong>{contractToGenerate.contractNumber}</strong>
                            {contractToGenerate.projectName && <> for project <strong>{contractToGenerate.projectName}</strong></>}?
                        </p>
                        <p className="text-sm text-base-content/70 mb-4">
                            This will create the final contract document and move it to the Active contracts list.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowGenerateModal(false);
                                    setContractToGenerate(null);
                                }}
                                disabled={generating}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary text-white"
                                onClick={handleGenerateConfirm}
                                disabled={generating}
                            >
                                {generating ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon icon={checkCircleIcon} className="size-4" />
                                        <span>Generate Contract</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Terminate Contract Modal */}
            {showTerminateModal && contractToTerminate && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-error">Terminate Contract</h3>
                        <p className="py-4">
                            Are you sure you want to terminate contract <strong>{contractToTerminate.contractNumber}</strong>
                            {contractToTerminate.projectName && <> for project <strong>{contractToTerminate.projectName}</strong></>}?
                        </p>
                        <p className="text-sm text-base-content/70 mb-4">
                            This action cannot be undone. The contract will be moved to the Terminated contracts list.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowTerminateModal(false);
                                    setContractToTerminate(null);
                                }}
                                disabled={terminating}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error text-white"
                                onClick={handleTerminateConfirm}
                                disabled={terminating}
                            >
                                {terminating ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Terminating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon icon={xCircleIcon} className="size-4" />
                                        <span>Terminate Contract</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Final Discharge Modal */}
            {showFinalDischargeModal && contractToGenerateFinal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-success">Generate Final Discharge</h3>
                        <p className="py-4">
                            Are you sure you want to generate the final discharge document for contract <strong>{contractToGenerateFinal.contractNumber}</strong>
                            {contractToGenerateFinal.projectName && <> for project <strong>{contractToGenerateFinal.projectName}</strong></>}?
                        </p>
                        <p className="text-sm text-base-content/70 mb-4">
                            This will generate the "Discharge Final" document for this terminated contract.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowFinalDischargeModal(false);
                                    setContractToGenerateFinal(null);
                                }}
                                disabled={generatingFinal}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success text-white"
                                onClick={handleGenerateFinalConfirm}
                                disabled={generatingFinal}
                            >
                                {generatingFinal ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon icon={checkCircleIcon} className="size-4" />
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
});

ContractsManagement.displayName = 'ContractsManagement';

export default ContractsManagement;
