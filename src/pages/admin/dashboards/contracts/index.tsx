import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";

import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { useTopbarContent } from "@/contexts/topbar-content";
import { useArchive } from "@/contexts/archive";

import useContractManagement from "./use-contract-management";

// Import icons
import fileTextIcon from "@iconify/icons-lucide/file-text";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import xCircleIcon from "@iconify/icons-lucide/x-circle";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import plusIcon from "@iconify/icons-lucide/plus";
import eyeIcon from "@iconify/icons-lucide/eye";

// Tab type definition
type TabType = 'drafts' | 'active' | 'terminated';

interface ContractRow {
    id: number | string;
    contractNumber: string;
    projectName: string;
    subcontractorName: string;
    tradeName: string;
    contractType?: string;
    completionDate: string;
    amount: number;
    voAmount: number;
    status: string;
    originalStatus?: string;
    [key: string]: any;
}

const ContractsManagement = memo(() => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAllContent, clearContent } = useTopbarContent();
    const { isArchiveMode } = useArchive();

    const {
        draftsData,
        activeData,
        terminatedData,
        loading,
        getDraftsContracts,
        getActiveContracts,
        getTerminatedContracts,
        generateContract,
        terminateContract,
        generateFinalContract,
    } = useContractManagement();

    const [activeTab, setActiveTab] = useState<TabType>(() => (sessionStorage.getItem("contracts-tab") as TabType) || 'drafts');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [contractToGenerate, setContractToGenerate] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [contractToTerminate, setContractToTerminate] = useState<any>(null);
    const [terminating, setTerminating] = useState(false);
    const [showFinalDischargeModal, setShowFinalDischargeModal] = useState(false);
    const [contractToGenerateFinal, setContractToGenerateFinal] = useState<any>(null);
    const [generatingFinal, setGeneratingFinal] = useState(false);
    const [navigatingRowId, setNavigatingRowId] = useState<number | string | null>(null);

    useEffect(() => { sessionStorage.setItem("contracts-tab", activeTab); }, [activeTab]);

    // Track which tabs have been loaded
    const [loadedTabs, setLoadedTabs] = useState<Set<TabType>>(new Set());

    // Load only active tab's data - lazy loading to reduce memory usage
    useEffect(() => {
        const loadActiveTabData = async () => {
            // Only load if not already loaded
            if (loadedTabs.has(activeTab)) return;

            switch (activeTab) {
                case 'drafts':
                    await getDraftsContracts();
                    break;
                case 'active':
                    await getActiveContracts();
                    break;
                case 'terminated':
                    await getTerminatedContracts();
                    break;
            }
            setLoadedTabs(prev => new Set(prev).add(activeTab));
        };
        loadActiveTabData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Reload current tab when navigating back to page
    useEffect(() => {
        if (location.pathname.includes('/contracts')) {
            // Force reload current tab
            setLoadedTabs(new Set());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.key]);

    const handleBackToDashboard = useCallback(() => {
        navigate('/dashboard');
    }, [navigate]);

    const handleNewContract = useCallback(() => {
        navigate('/dashboard/contracts/new');
    }, [navigate]);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    // Set topbar content - back button on left, tabs in center
    useEffect(() => {
        const leftContent = (
            <button
                onClick={handleBackToDashboard}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                title="Back to Dashboard"
            >
                <Icon icon={arrowLeftIcon} className="size-5" />
            </button>
        );

        const centerContent = (
            <div className="flex items-center gap-2">
                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeTab === 'drafts'
                            ? "btn-primary"
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                    }`}
                    onClick={() => handleTabChange('drafts')}
                    title={`Drafts (${draftsData.length})`}
                    aria-label={`Drafts (${draftsData.length})`}
                >
                    <Icon icon={fileTextIcon} className="size-4" />
                </button>

                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeTab === 'active'
                            ? "btn-primary"
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                    }`}
                    onClick={() => handleTabChange('active')}
                    title={`Active (${activeData.length})`}
                    aria-label={`Active (${activeData.length})`}
                >
                    <Icon icon={checkCircleIcon} className="size-4" />
                </button>

                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeTab === 'terminated'
                            ? "btn-primary"
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                    }`}
                    onClick={() => handleTabChange('terminated')}
                    title={`Terminated (${terminatedData.length})`}
                    aria-label={`Terminated (${terminatedData.length})`}
                >
                    <Icon icon={xCircleIcon} className="size-4" />
                </button>
            </div>
        );

        setAllContent(leftContent, centerContent, null);

        // Cleanup on unmount
        return () => {
            clearContent();
        };
    }, [activeTab, draftsData.length, activeData.length, terminatedData.length, handleBackToDashboard, handleTabChange, setAllContent, clearContent]);

    // Handle Preview action - different behavior based on tab
    const handlePreview = useCallback(async (row: ContractRow) => {
        setNavigatingRowId(row.id);
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

    // Get current tab data
    const currentData = useMemo(() => {
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
    }, [activeTab, draftsData, activeData, terminatedData]);

    // Format status for display
    const getStatusBadge = useCallback((status: string) => {
        const statusStr = status?.toString() || '';
        const statusLower = statusStr.toLowerCase();

        // Strip HTML if present
        const plainStatus = statusStr.replace(/<[^>]*>/g, '').trim();

        let badgeClass = 'badge-info';
        let displayText = plainStatus || 'Unknown';

        if (statusLower.includes('active')) {
            badgeClass = 'badge-success';
            displayText = 'Active';
        } else if (statusLower.includes('terminated')) {
            badgeClass = 'badge-error';
            displayText = 'Terminated';
        } else if (statusLower.includes('editable') || statusLower.includes('draft')) {
            badgeClass = 'badge-warning';
            displayText = 'Draft';
        } else if (statusLower.includes('completed')) {
            badgeClass = 'badge-success';
            displayText = 'Completed';
        } else if (statusLower.includes('pending')) {
            badgeClass = 'badge-warning';
            displayText = 'Pending';
        } else if (statusLower.includes('suspended')) {
            badgeClass = 'badge-neutral';
            displayText = 'Suspended';
        }

        return (
            <span className={`badge badge-sm ${badgeClass} font-medium`}>
                {displayText}
            </span>
        );
    }, []);

    // Format currency
    const formatCurrency = useCallback((value: number) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    }, []);

    // Define spreadsheet columns
    const spreadsheetColumns = useMemo((): SpreadsheetColumn<ContractRow>[] => [
        {
            key: "contractNumber",
            label: "Number",
            width: 130,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "projectName",
            label: "Project",
            width: 200,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "subcontractorName",
            label: "Subcontractor",
            width: 200,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "tradeName",
            label: "Trade",
            width: 150,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "contractType",
            label: "Type",
            width: 100,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "completionDate",
            label: "End Date",
            width: 120,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "amount",
            label: "Amount",
            width: 140,
            align: "right",
            editable: false,
            sortable: true,
            filterable: false,
            formatter: (value) => formatCurrency(value),
        },
        {
            key: "voAmount",
            label: "VO Amount",
            width: 140,
            align: "right",
            editable: false,
            sortable: true,
            filterable: false,
            formatter: (value) => formatCurrency(value),
        },
        {
            key: "status",
            label: "Status",
            width: 110,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
            render: (value) => getStatusBadge(value),
        },
    ], [formatCurrency, getStatusBadge]);

    // Render action buttons for each row
    const renderActions = useCallback((row: ContractRow) => {
        const isNavigating = navigatingRowId === row.id;
        return (
            <div className="flex items-center gap-1">
                <button
                    className="btn btn-ghost btn-xs text-info hover:bg-info/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(row);
                    }}
                    disabled={isNavigating}
                    title="Preview"
                >
                    {isNavigating ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <Icon icon={eyeIcon} className="w-4 h-4" />
                    )}
                </button>
            </div>
        );
    }, [handlePreview, navigatingRowId]);

    // Handle row double click
    const handleRowDoubleClick = useCallback((row: ContractRow) => {
        handlePreview(row);
    }, [handlePreview]);

    // Toolbar with New Contract button
    const toolbar = useMemo(() => (
        <div className="flex items-center justify-end w-full px-4 py-2">
            {!isArchiveMode && (
                <button
                    onClick={handleNewContract}
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                    <Icon icon={plusIcon} className="size-4" />
                    <span>New Contract</span>
                </button>
            )}
        </div>
    ), [handleNewContract, isArchiveMode]);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Spreadsheet Content - fills the entire area */}
            <div className="flex-1 min-h-0">
                <Spreadsheet<ContractRow>
                    data={currentData}
                    columns={spreadsheetColumns}
                    mode="view"
                    loading={loading}
                    emptyMessage="No contracts found"
                    persistKey={`contracts-spreadsheet-${activeTab}`}
                    rowHeight={40}
                    actionsRender={renderActions}
                    actionsColumnWidth={80}
                    onRowDoubleClick={handleRowDoubleClick}
                    getRowId={(row) => row.id}
                    toolbar={toolbar}
                    allowKeyboardNavigation
                    allowColumnResize
                    allowSorting
                    allowFilters
                />
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
