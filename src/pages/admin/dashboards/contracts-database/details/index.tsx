import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import apiRequest from "@/api/api";
import { useContractsApi } from "../../subcontractors-BOQs/hooks/use-contracts-api";
import { getContractVOs as fetchContractVOs } from "@/api/services/vo-api";
import { formatCurrency, formatDate, formatPercentage } from "@/utils/formatters";

const ContractDatabaseDetails = () => {
    const { contractIdentifier } = useParams<{ contractIdentifier: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { toaster } = useToast();
    const { getToken } = useAuth();
    
    // Get actual contract ID from navigation state (for API calls) or try to parse if it's numeric
    const contractId = location.state?.contractId || 
        (!isNaN(Number(contractIdentifier)) ? contractIdentifier : null);
    
    const [contractData, setContractData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingWord, setExportingWord] = useState(false);
    const [currency, setCurrency] = useState('$');
    const [projects, setProjects] = useState<any[]>([]);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [terminating, setTerminating] = useState(false);
    // Contract-specific VOs hook (optimized with useMemo and useCallback)
    const useContractVOs = (contractId: string) => {
        const [vos, setVos] = useState<any[]>([]);
        const [loading, setLoading] = useState(false);
        const { getToken } = useAuth();

        const voColumns = useMemo(() => ({
            voNumber: "VO Number",
            description: "Description",
            type: "Type",
            amount: "Amount",
            status: "Status",
            date: "Date Created"
        }), []);

        const getContractVOsData = useCallback(async () => {
            if (!contractId) return;

            setLoading(true);
            try {
                const response = await fetchContractVOs(parseInt(contractId), getToken() ?? '');

                if (response.success && response.data && Array.isArray(response.data)) {
                    const formattedVos = response.data.map((vo: any) => ({
                        id: vo.id,
                        voNumber: vo.voNumber || vo.VoNumber || '-',
                        description: vo.subTrade || vo.Description || '-',
                        type: vo.type || vo.Type || '-',
                        // Raw numeric value - Table component handles formatting
                        amount: vo.amount || vo.Amount || 0,
                        status: vo.status || vo.Status || '-',
                        date: formatDate(vo.date || vo.Date || vo.createdDate)
                    }));
                    setVos(formattedVos);
                } else {
                    setVos([]);
                }
            } catch (error) {
                console.error("Error fetching contract VOs:", error);
                setVos([]);
            } finally {
                setLoading(false);
            }
        }, [contractId, getToken]);

        return {
            vos,
            voColumns,
            loading,
            getContractVOs: getContractVOsData
        };
    };
    
    // Get data passed from navigation state
    const navigationData = location.state as {
        contractNumber?: string;
        projectName?: string;
        subcontractorName?: string;
        amount?: string;
        status?: string;
        type?: string;
    } | null;

    // Contract VOs management
    const { vos, voColumns, loading: vosLoading, getContractVOs } = useContractVOs(contractId || '');

    // Row actions control - disable edit, generate, and delete for active VOs
    const handleVoRowActions = useCallback((row: any) => {
        const isActive = row.status?.toLowerCase() === 'active';

        if (isActive) {
            return {
                editAction: false,
                deleteAction: false,
                generateAction: false
            };
        }

        return {
            editAction: true,
            deleteAction: true,
            generateAction: true
        };
    }, []);

    useEffect(() => {
        if (contractId) {
            loadContractDetails();
            getContractVOs();
        } else if (contractIdentifier) {
            // If we have a contract number but no ID, we need to look it up
            toaster.error("Contract not found. Please navigate from the contracts list.");
            navigate('/dashboard/contracts');
        }
    }, [contractId, contractIdentifier]);

    // Initialize contracts API
    const contractsApi = useContractsApi();

    const loadContractDetails = useCallback(async () => {
        if (!contractId) return;

        setLoading(true);
        try {
            // Load contract details and reference data in parallel
            const [contractResult, projectsResponse, subcontractorsResponse, currenciesResponse] = await Promise.all([
                contractsApi.loadSubcontractorData(parseInt(contractId)),
                apiRequest({
                    method: "GET",
                    endpoint: "Project/GetProjectsList",
                    token: getToken() ?? ""
                }),
                apiRequest({
                    method: "GET",
                    endpoint: "Subcontractors/GetSubcontractors",
                    token: getToken() ?? ""
                }),
                apiRequest({
                    method: "GET",
                    endpoint: "Currencie/GetCurrencies",
                    token: getToken() ?? ""
                })
            ]);

            if (contractResult.success && contractResult.data) {
                setContractData(contractResult.data);

                // Set reference data
                setProjects(Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse?.data || []));
                setSubcontractors(Array.isArray(subcontractorsResponse) ? subcontractorsResponse : (subcontractorsResponse?.data || []));
                setCurrencies(Array.isArray(currenciesResponse) ? currenciesResponse : (currenciesResponse?.data || []));

                // Find and set the correct currency symbol
                const currencyData = Array.isArray(currenciesResponse) ? currenciesResponse : (currenciesResponse?.data || []);
                const contractCurrencyId = contractResult.data?.currencyId;
                if (contractCurrencyId !== undefined && contractCurrencyId !== null) {
                    const contractCurrency = currencyData.find((c: any) => c.id === contractCurrencyId);
                    if (contractCurrency?.currencies) {
                        setCurrency(contractCurrency.currencies);
                    }
                }
            } else {
                toaster.error("Failed to load contract details");
                navigate('/dashboard/contracts');
            }
        } catch (error) {
            console.error("Error loading contract:", error);
            toaster.error("An error occurred while loading contract details");
            navigate('/dashboard/contracts');
        } finally {
            setLoading(false);
        }
    }, [contractId, contractsApi, getToken, navigate, toaster]);


    const handlePreviewContract = async () => {
        if (!contractData) return;
        
        setLoadingPreview(true);
        try {
            const result = await contractsApi.livePreviewPdfDocument(contractData);
            
            if (result.success && result.blob) {
                setPreviewData({
                    blob: result.blob,
                    fileName: `Contract_${contractData.contractNumber || contractIdentifier}.pdf`
                });
                setShowPreview(true);
            } else {
                toaster.error("Failed to generate contract preview");
            }
        } catch (error) {
            toaster.error("Failed to generate contract preview");
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleExportPdf = async () => {
        if (!contractId || !contractData) return;
        
        setExportingPdf(true);
        try {
            let result;
            
            // Use live preview for editable contracts, regular export for generated ones
            if (contractData?.contractDatasetStatus === 'Editable') {
                result = await contractsApi.livePreviewPdfDocument(contractData);
            } else {
                result = await contractsApi.exportContractPdfDocument(parseInt(contractId));
            }
            
            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Contract_${contractData?.contractNumber || contractIdentifier}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("Contract exported as PDF successfully!");
            } else {
                toaster.error("Failed to export contract as PDF");
            }
        } catch (error) {
            toaster.error("Failed to export contract as PDF");
        } finally {
            setExportingPdf(false);
        }
    };

    const handleExportWord = async () => {
        if (!contractId || !contractData) return;
        
        setExportingWord(true);
        try {
            let result;
            
            // Use live preview for editable contracts, regular export for generated ones
            if (contractData?.contractDatasetStatus === 'Editable') {
                result = await contractsApi.livePreviewWordDocument(contractData);
            } else {
                result = await contractsApi.exportContractWordDocument(parseInt(contractId));
            }
            
            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Contract_${contractData?.contractNumber || contractIdentifier}.docx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("Contract exported as Word successfully!");
            } else {
                toaster.error("Failed to export contract as Word");
            }
        } catch (error) {
            toaster.error("Failed to export contract as Word");
        } finally {
            setExportingWord(false);
        }
    };

    const handleCreateVO = () => {
        // Navigate to proper contract-specific VO creation wizard
        if (!contractId) return;
        
        navigate(`/dashboard/contracts/details/${contractIdentifier}/create-vo`, {
            state: {
                contractId: contractId,
                contractNumber: contractData?.contractNumber,
                projectId: contractData?.projectId,
                subcontractorId: contractData?.subContractorId,
                currencyId: contractData?.currencyId,
                projectName: navigationData?.projectName || currentProject?.name,
                subcontractorName: navigationData?.subcontractorName || currentSubcontractor?.name,
                tradeName: contractData?.subTrade,
                contractContext: contractData // Pass full contract context for wizard
            }
        });
    };

    const handleTerminateContract = async () => {
        if (!contractId || !contractData) return;
        
        setTerminating(true);
        try {
            const response = await apiRequest({
                endpoint: `ContractsDatasets/TerminateContract/${contractId}`,
                method: "POST",
                token: getToken() ?? ""
            });
            
            if (response && typeof response === 'object' && 'success' in response && response.success) {
                toaster.success(`Contract ${contractData.contractNumber} has been terminated successfully`);
                setShowTerminateModal(false);
                // Navigate back to contracts database
                navigate('/dashboard/contracts');
            } else {
                toaster.error("Failed to terminate contract");
            }
        } catch (error) {
            console.error("Error terminating contract:", error);
            toaster.error("An error occurred while terminating the contract");
        } finally {
            setTerminating(false);
        }
    };

    // Calculate total contract amount from BOQ items (fallback)
    const calculateTotalAmount = () => {
        if (!contractData?.buildings) return 0;
        
        let total = 0;
        contractData.buildings.forEach((building: any) => {
            if (building.boqsContract && Array.isArray(building.boqsContract)) {
                building.boqsContract.forEach((item: any) => {
                    total += item.totalPrice || (item.qte * item.pu) || 0;
                });
            }
        });
        return total;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader />
            </div>
        );
    }

    if (!contractData) {
        return (
            <div className="p-6">
                <p>Contract not found</p>
            </div>
        );
    }

    // Memoize derived data to prevent recalculations
    const currentProject = useMemo(() => projects.find(p => p.id === contractData?.projectId), [projects, contractData?.projectId]);
    const currentSubcontractor = useMemo(() => subcontractors.find(s => s.id === contractData?.subContractorId), [subcontractors, contractData?.subContractorId]);
    const currentCurrency = useMemo(() => currencies.find(c => c.id === contractData?.currencyId), [currencies, contractData?.currencyId]);

    // Memoize calculated values
    const totalAmount = useMemo(() => contractData?.amount || contractData?.advancePayment || calculateTotalAmount(), [contractData?.amount, contractData?.advancePayment, contractData]);

    const advancePercentage = useMemo(() => parseFloat(contractData?.subcontractorAdvancePayee || '0') || 0, [contractData?.subcontractorAdvancePayee]);
    const advanceAmount = useMemo(() => totalAmount * (advancePercentage / 100), [totalAmount, advancePercentage]);

    return (
        <div style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Fixed Header Section */}
            <div style={{ flexShrink: 0 }} className="pb-3">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard/contracts')}
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            <span className="iconify lucide--arrow-left size-4"></span>
                            Back
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                    <button
                        onClick={handlePreviewContract}
                        disabled={loadingPreview}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        {loadingPreview ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                <span>Loading...</span>
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--eye size-4"></span>
                                <span>Preview</span>
                            </>
                        )}
                    </button>
                    
                    <div className="dropdown dropdown-end">
                        <button 
                            tabIndex={0} 
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            <span className="iconify lucide--download size-4"></span>
                            <span>Export</span>
                            <span className="iconify lucide--chevron-down size-3"></span>
                        </button>
                        <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                                <a onClick={handleExportPdf}>
                                    Export as PDF
                                </a>
                            </li>
                            <li>
                                <a onClick={handleExportWord}>
                                    Export as Word
                                </a>
                            </li>
                        </ul>
                    </div>
                    
                    <button
                        onClick={() => setShowTerminateModal(true)}
                        disabled={terminating || contractData?.contractDatasetStatus?.toLowerCase() === 'terminated'}
                        className="btn btn-sm btn-error text-white flex items-center gap-2"
                    >
                        <span className="iconify lucide--x-circle size-4"></span>
                        <span>Terminate</span>
                    </button>
                </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }} className="pb-6">
                <div className="space-y-6">
                    {/* Contract Information Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Contract Info */}
                <div className="card bg-base-100 shadow-sm border border-base-300">
                    <div className="card-body">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--file-text size-5 text-purple-600"></span>
                            Contract Information
                        </h3>
                        <div className="space-y-3 mt-4">
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Contract Number:</span>
                                <span className="font-semibold text-base-content">
                                    {contractData.contractNumber || navigationData?.contractNumber || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Status:</span>
                                <span className={`badge badge-sm ${
                                    (contractData.contractDatasetStatus || navigationData?.status) === "Terminated"
                                        ? "badge-error"
                                        : (contractData.contractDatasetStatus || navigationData?.status) === "Editable"
                                            ? "badge-warning"
                                            : "badge-success"
                                }`}>
                                    {contractData.contractDatasetStatus || navigationData?.status || 'Active'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Type:</span>
                                <span className="text-base-content">
                                    {navigationData?.type || contractData.contractType || 'Contract'}
                                </span>
                            </div>
                            <div className="divider"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-base-content/70">Total Amount:</span>
                                <span className="text-xl font-bold text-primary">
                                    {currentCurrency?.currencies || currency} {formatCurrency(totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project & Parties */}
                <div className="card bg-base-100 shadow-sm border border-base-300">
                    <div className="card-body">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--building-2 size-5 text-blue-600"></span>
                            Project & Parties
                        </h3>
                        <div className="space-y-3 mt-4">
                            <div>
                                <span className="text-base-content/70 text-sm">Project:</span>
                                <p className="font-semibold text-base-content mt-1">
                                    {currentProject?.name || navigationData?.projectName || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-base-content/70 text-sm">Subcontractor:</span>
                                <p className="font-semibold text-base-content mt-1">
                                    {currentSubcontractor?.name || navigationData?.subcontractorName || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <span className="text-base-content/70 text-sm">Trade:</span>
                                <p className="font-semibold text-base-content mt-1">
                                    {contractData.subTrade || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Terms */}
                <div className="card bg-base-100 shadow-sm border border-base-300">
                    <div className="card-body">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--calculator size-5 text-green-600"></span>
                            Financial Terms
                        </h3>
                        <div className="space-y-3 mt-4">
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Advance Payment:</span>
                                <span className="text-base-content">
                                    {formatPercentage(advancePercentage)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Advance Amount:</span>
                                <span className="font-semibold text-base-content">
                                    {currentCurrency?.currencies || currency} {formatCurrency(advanceAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Retention:</span>
                                <span className="text-base-content">
                                    {contractData.holdWarranty ? `${contractData.holdWarranty}%` : '0%'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Payment Terms:</span>
                                <span className="text-base-content">
                                    {contractData.paymentsTerm || '30 days'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Variation Orders Section */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--git-branch size-5 text-orange-600"></span>
                            Variation Orders
                        </h3>
                        <button
                            onClick={handleCreateVO}
                            className="btn btn-primary btn-sm"
                        >
                            <span className="iconify lucide--plus size-4"></span>
                            <span>Add VO</span>
                        </button>
                    </div>
                    
                    {vosLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader />
                        </div>
                    ) : vos.length > 0 ? (
                        <SAMTable
                            columns={voColumns}
                            tableData={vos}
                            actions
                            previewAction
                            editAction
                            generateAction
                            deleteAction
                            rowActions={handleVoRowActions}
                            title=""
                            loading={false}
                            onSuccess={() => {}}
                            openStaticDialog={() => {}}
                            dynamicDialog={false}
                            virtualized={true}
                            rowHeight={40}
                            overscan={5}
                        />
                    ) : (
                        <div className="text-center py-12">
                            <span className="iconify lucide--inbox size-12 text-base-content/30 mx-auto mb-3"></span>
                            <p className="text-base-content/70">No variation orders found for this contract</p>
                            <button
                                onClick={handleCreateVO}
                                className="btn btn-primary btn-sm mt-4"
                            >
                                <span className="iconify lucide--plus size-4"></span>
                                <span>Create First VO</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && previewData && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-7xl h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Contract Preview</h3>
                            <button
                                onClick={() => {
                                    setShowPreview(false);
                                    // Clear preview data to free memory
                                    setTimeout(() => setPreviewData(null), 150);
                                }}
                                className="btn btn-ghost btn-sm"
                            >
                                <span className="iconify lucide--x size-5"></span>
                            </button>
                        </div>
                        <div className="h-[calc(100%-60px)]">
                            <PDFViewer
                                fileBlob={previewData.blob}
                                fileName={previewData.fileName}
                            />
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => {
                            setShowPreview(false);
                            // Clear preview data to free memory
                            setTimeout(() => setPreviewData(null), 150);
                        }}>close</button>
                    </form>
                </dialog>
            )}

            {/* Terminate Contract Confirmation Modal */}
            {showTerminateModal && (
                <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[modal-fade_0.2s]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
                                <span className="iconify lucide--x-circle w-6 h-6 text-error" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-base-content">Terminate Contract</h3>
                                <p className="text-sm text-base-content/60">This action cannot be undone.</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-base-content/80 mb-3">
                                Are you sure you want to terminate contract <strong>{contractData?.contractNumber}</strong>
                                {currentProject?.name && <> for project <strong>{currentProject.name}</strong></>}?
                            </p>
                            <div className="bg-error/30 border border-error/20 rounded-lg p-3">
                                <p className="text-sm text-error-content">
                                    <span className="iconify lucide--info w-4 h-4 inline mr-1" />
                                    The contract will be moved to the terminated contracts list.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowTerminateModal(false)}
                                className="btn btn-ghost btn-sm px-6"
                                disabled={terminating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTerminateContract}
                                className="btn btn-error btn-sm px-6"
                                disabled={terminating}
                            >
                                {terminating ? (
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
                </div>
            </div>
        </div>
    );
};

export default ContractDatabaseDetails;