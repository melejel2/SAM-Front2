import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import apiRequest from "@/api/api";
import { useContractsApi } from "../hooks/use-contracts-api";
import { getContractVOs } from "@/api/services/vo-api";

// Contract-specific VOs hook
const useContractVOs = (contractId: string) => {
    const [vos, setVos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    const voColumns = {
        voNumber: "VO Number",
        description: "Description", 
        type: "Type",
        amount: "Amount",
        status: "Status",
        date: "Date Created"
    };

    const getContractVOsData = async () => {
        if (!contractId) return;
        
        setLoading(true);
        try {
            const response = await getContractVOs(parseInt(contractId), getToken() ?? '');

            if (response.success && response.data && Array.isArray(response.data)) {
                const formattedVos = response.data.map((vo: any) => ({
                    id: vo.id,
                    voNumber: vo.voNumber || vo.VoNumber || '-',
                    description: vo.subTrade || vo.Description || '-',
                    type: vo.type || vo.Type || '-',
                    amount: formatCurrency(vo.amount || vo.Amount),
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
    };

    return {
        vos,
        voColumns,
        loading,
        getContractVOs: getContractVOsData
    };
};

// Helper functions
const formatCurrency = (amount: number | string | undefined) => {
    if (!amount || amount === '-') return '-';
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    if (isNaN(numAmount)) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        maximumFractionDigits: 0
    }).format(Math.round(numAmount));
};

const formatDate = (dateString: string | undefined) => {
    if (!dateString || dateString === '-') return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return '-';
    }
};

const formatPercentage = (value: number | undefined) => {
    if (!value || value === 0) return '0%';
    return `${value}%`;
};

const ContractDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { toaster } = useToast();
    const { getToken } = useAuth();
    
    const [contractData, setContractData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [generatingContract, setGeneratingContract] = useState(false);
    const [deletingContract, setDeletingContract] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [currency, setCurrency] = useState('$');
    const [projects, setProjects] = useState<any[]>([]);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    
    // Get data passed from navigation state
    const navigationData = location.state as {
        contractNumber?: string;
        projectName?: string;
        subcontractorName?: string;
        tradeName?: string;
        amount?: string;
        contractDate?: string;
        completionDate?: string;
        status?: string;
    } | null;
    
    // Contract VOs management
    const { vos, voColumns, loading: vosLoading, getContractVOs } = useContractVOs(id || '');
    
    // Initialize contracts API
    const contractsApi = useContractsApi();

    useEffect(() => {
        if (id) {
            loadContractDetails();
            getContractVOs();
        }
    }, [id]);

    const loadContractDetails = async () => {
        if (!id) return;
        
        setLoading(true);
        try {
            // Load all reference data in parallel
            const [contractResult, projectsResponse, subcontractorsResponse, currenciesResponse] = await Promise.all([
                contractsApi.loadSubcontractorData(parseInt(id)),
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
                const data = contractResult.data;
                
                
                setContractData(data);
                
                // Set reference data
                setProjects(Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse?.data || []));
                setSubcontractors(Array.isArray(subcontractorsResponse) ? subcontractorsResponse : (subcontractorsResponse?.data || []));
                setCurrencies(Array.isArray(currenciesResponse) ? currenciesResponse : (currenciesResponse?.data || []));
                
                // Find and set the correct currency symbol
                const currencyData = Array.isArray(currenciesResponse) ? currenciesResponse : (currenciesResponse?.data || []);
                setCurrencies(currencyData);
                
                const contractCurrency = currencyData.find((c: any) => c.id === data.currencyId);
                if (contractCurrency?.currencies) {
                    setCurrency(contractCurrency.currencies); // Use 'currencies' field (like MAD, USD, EUR)
                }
            } else {
                toaster.error("Failed to load contract details");
                navigate('/dashboard/subcontractors-boqs');
            }
        } catch (error) {
            console.error("Error loading contract:", error);
            toaster.error("An error occurred while loading contract details");
            navigate('/dashboard/subcontractors-boqs');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateContract = async () => {
        if (!id) return;
        
        setGeneratingContract(true);
        try {
            const result = await contractsApi.generateContractBOQ(parseInt(id));
            if (result.success) {
                toaster.success("Contract generated successfully!");
                // Reload contract data to get updated status
                loadContractDetails();
            }
        } finally {
            setGeneratingContract(false);
        }
    };

    const handleDeleteContract = async () => {
        if (!id) return;
        
        if (!confirm("Are you sure you want to delete this contract? This action cannot be undone.")) {
            return;
        }
        
        setDeletingContract(true);
        try {
            const result = await contractsApi.deleteContract(parseInt(id));
            if (result.success) {
                toaster.success("Contract deleted successfully!");
                navigate('/dashboard/subcontractors-boqs');
            }
        } finally {
            setDeletingContract(false);
        }
    };

    const handleEditContract = () => {
        navigate(`/dashboard/subcontractors-boqs/edit/${id}`);
    };

    const handlePreviewContract = async () => {
        if (!contractData) return;
        
        setLoadingPreview(true);
        try {
            const result = await contractsApi.livePreviewPdfDocument(contractData);
            
            if (result.success && result.blob) {
                setPreviewData({
                    blob: result.blob,
                    fileName: `Contract_${contractData.contractNumber || id}.pdf`
                });
                setShowPreview(true);
            } else {
                toaster.error("Failed to generate contract preview");
            }
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleExportPDF = async () => {
        if (!id) {
            console.error("❌ PDF Export: No contract ID available");
            return;
        }
        
        console.log("🔄 Starting PDF export for contract:", {
            id,
            idParsed: parseInt(id),
            contractNumber: contractData?.contractNumber
        });
        
        try {
            const result = await contractsApi.exportContractPdfDocument(parseInt(id));
            
            console.log("📥 PDF Export API result:", result);
            
            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Contract_${contractData?.contractNumber || id}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("Contract exported as PDF successfully!");
            } else {
                console.error("❌ PDF Export failed:", {
                    success: result.success,
                    hasBlob: !!result.blob,
                    result: result
                });
                toaster.error("Failed to export contract as PDF");
            }
        } catch (error) {
            console.error("🚨 PDF Export exception:", {
                error,
                contractId: id,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            });
            toaster.error("PDF Export error: " + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleExportWord = async () => {
        if (!id) {
            console.error("❌ Word Export: No contract ID available");
            return;
        }
        
        console.log("🔄 Starting Word export for contract:", {
            id,
            idParsed: parseInt(id),
            contractNumber: contractData?.contractNumber
        });
        
        try {
            const result = await contractsApi.exportContractWordDocument(parseInt(id));
            
            console.log("📥 Word Export API result:", result);
            
            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Contract_${contractData?.contractNumber || id}.docx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("Contract exported as Word successfully!");
            } else {
                console.error("❌ Word Export failed:", {
                    success: result.success,
                    hasBlob: !!result.blob,
                    result: result
                });
                toaster.error("Failed to export contract as Word");
            }
        } catch (error) {
            console.error("🚨 Word Export exception:", {
                error,
                contractId: id,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            });
            toaster.error("Word Export error: " + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleCreateVO = () => {
        // ✅ Navigate to proper contract-specific VO creation wizard
        if (!id) return;
        
        navigate(`/dashboard/subcontractors-boqs/details/${id}/create-vo`, {
            state: {
                contractId: id,
                contractNumber: contractData?.contractNumber,
                projectId: contractData?.projectId,
                subcontractorId: contractData?.subContractorId,
                currencyId: contractData?.currencyId,
                projectName: navigationData?.projectName || currentProject?.name,
                subcontractorName: navigationData?.subcontractorName || currentSubcontractor?.name,
                tradeName: navigationData?.tradeName || contractData?.subTrade,
                contractContext: contractData // Pass full contract context for wizard
            }
        });
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

    // Get project, subcontractor and currency data first
    const currentProject = projects.find(p => p.id === contractData?.projectId);
    const currentSubcontractor = subcontractors.find(s => s.id === contractData?.subContractorId);
    const currentCurrency = currencies.find(c => c.id === contractData?.currencyId);
    
    // Use the amount from contract data if available, otherwise fall back to advancePayment field or calculate from BOQ
    // Note: advancePayment field often contains the contract total (legacy behavior)
    const totalAmount = contractData?.amount || contractData?.advancePayment || calculateTotalAmount();
    
    // FIXED: Use correct field for advance payment percentage
    // advancePayment stores contract amounts, subcontractorAdvancePayee stores percentages
    const advancePercentage = parseFloat(contractData?.subcontractorAdvancePayee || '0') || 0;
    const advanceAmount = totalAmount * (advancePercentage / 100);
    
    

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/subcontractors-boqs')}
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
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li><a onClick={handleExportPDF}>Export as PDF</a></li>
                            <li><a onClick={handleExportWord}>Export as Word</a></li>
                        </ul>
                    </div>

                    <button
                        onClick={handleEditContract}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--edit size-4"></span>
                        <span>Edit</span>
                    </button>

                    {contractData.contractDatasetStatus === 'Editable' && (
                        <button
                            onClick={handleGenerateContract}
                            disabled={generatingContract}
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            {generatingContract ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--check-circle size-4"></span>
                                    <span>Generate</span>
                                </>
                            )}
                        </button>
                    )}
                    
                    <button
                        onClick={handleDeleteContract}
                        disabled={deletingContract}
                        className="btn btn-sm btn-error text-error-content hover:bg-error/10 flex items-center gap-2"
                    >
                        {deletingContract ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                <span>Deleting...</span>
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--trash-2 size-4"></span>
                                <span>Delete</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

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
                                <span className="badge badge-sm badge-success">
                                    {contractData.contractDatasetStatus || 'Active'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Contract Date:</span>
                                <span className="text-base-content">
                                    {formatDate(contractData.contractDate) || navigationData?.contractDate || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Completion Date:</span>
                                <span className="text-base-content">
                                    {formatDate(contractData.completionDate) || navigationData?.completionDate || '-'}
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
                                    {navigationData?.tradeName || contractData.subTrade || 'N/A'}
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
                                <span className="text-base-content/70">Prorata Account:</span>
                                <span className="text-base-content">
                                    {contractData.prorataAccount || '0'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Retention:</span>
                                <span className="text-base-content">
                                    {contractData.holdBack || '5%'}
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
                            title=""
                            loading={false}
                            onSuccess={() => {}}
                            openStaticDialog={() => {}}
                            dynamicDialog={false}
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
                                onClick={() => setShowPreview(false)}
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
                        <button onClick={() => setShowPreview(false)}>close</button>
                    </form>
                </dialog>
            )}
        </div>
    );
};

export default ContractDetails;