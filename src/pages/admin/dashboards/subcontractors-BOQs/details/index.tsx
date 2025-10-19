import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import apiRequest from "@/api/api";
import { getContractVOs, previewVoDataSet, exportVoDataSetWord } from "@/api/services/vo-api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

import { useContractsApi } from "../hooks/use-contracts-api";

// Contract-specific VOs hook
const useContractVOs = (contractId: string) => {
    const [vos, setVos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    const voColumns = {
        voNumber: "VO Number",
        subTrade: "Sub Trade",
        type: "Type",
        amount: "Amount",
        status: "Status",
        date: "Date Created",
    };

    const getContractVOsData = async () => {
        if (!contractId) return;

        setLoading(true);
        try {
            const response = await getContractVOs(parseInt(contractId), getToken() ?? "");

            if (response.success && response.data && Array.isArray(response.data)) {
                console.log("🔍 getContractVOsData response.data:", response.data);
                const formattedVos = response.data.map((vo: any) => ({
                    id: vo.id,
                    voNumber: vo.voNumber || vo.VoNumber || "-",
                    subTrade: vo.subTrade || vo.SubTrade || "-",
                    type: vo.type || vo.Type || "-",
                    amount: formatCurrency(vo.amount || vo.Amount),
                    status: vo.status || vo.Status || "-",
                    date: formatDate(vo.date || vo.Date || vo.createdDate),
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
        getContractVOs: getContractVOsData,
    };
};

// Helper functions
const formatCurrency = (amount: number | string | undefined) => {
    if (!amount || amount === "-") return "-";
    const numAmount = typeof amount === "string" ? parseFloat(amount.replace(/,/g, "")) : amount;
    if (isNaN(numAmount)) return "-";
    return new Intl.NumberFormat("en-US", {
        style: "decimal",
        maximumFractionDigits: 0,
    }).format(Math.round(numAmount));
};

const formatDate = (dateString: string | undefined) => {
    if (!dateString || dateString === "-") return "-";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch (error) {
        return "-";
    }
};

const formatPercentage = (value: number | undefined) => {
    if (!value || value === 0) return "0%";
    return `${value}%`;
};

const ContractDetails = () => {
    const { contractIdentifier } = useParams<{ contractIdentifier: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { toaster } = useToast();
    const { getToken } = useAuth();

    // Get actual contract ID from navigation state (for API calls) or try to parse if it's numeric
    const contractId = location.state?.contractId || (!isNaN(Number(contractIdentifier)) ? contractIdentifier : null);

    const [contractData, setContractData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [generatingContract, setGeneratingContract] = useState(false);
    const [deletingContract, setDeletingContract] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingWord, setExportingWord] = useState(false);
    const [currency, setCurrency] = useState("$");
    const [projects, setProjects] = useState<any[]>([]);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);

    // New state for VO preview and export
    const [loadingPreviewVO, setLoadingPreviewVO] = useState(false);
    const [exportingWordVO, setExportingWordVO] = useState(false);
    const [showVoPreview, setShowVoPreview] = useState(false);
    const [voPreviewData, setVoPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);

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
    const { vos, voColumns, loading: vosLoading, getContractVOs } = useContractVOs(contractId || "");

    // Initialize contracts API
    const contractsApi = useContractsApi();

    useEffect(() => {
        if (contractId) {
            loadContractDetails();
            getContractVOs();
        } else if (contractIdentifier) {
            // If we have a contract number but no ID, we need to look it up
            // This would require a backend endpoint to find contract by number
            toaster.error("Contract not found. Please navigate from the contracts list.");
            navigate("/dashboard/contracts");
        }
    }, [contractId, contractIdentifier]);

    const loadContractDetails = async () => {
        if (!contractId) return;

        setLoading(true);
        try {
            // Load all reference data in parallel
            const [contractResult, projectsResponse, subcontractorsResponse, currenciesResponse] = await Promise.all([
                contractsApi.loadSubcontractorData(parseInt(contractId)),
                apiRequest({
                    method: "GET",
                    endpoint: "Project/GetProjectsList",
                    token: getToken() ?? "",
                }),
                apiRequest({
                    method: "GET",
                    endpoint: "Subcontractors/GetSubcontractors",
                    token: getToken() ?? "",
                }),
                apiRequest({
                    method: "GET",
                    endpoint: "Currencie/GetCurrencies",
                    token: getToken() ?? "",
                }),
            ]);

            if (contractResult.success && contractResult.data) {
                const data = contractResult.data;

                setContractData(data);

                // Set reference data
                setProjects(Array.isArray(projectsResponse) ? projectsResponse : projectsResponse?.data || []);
                setSubcontractors(
                    Array.isArray(subcontractorsResponse) ? subcontractorsResponse : subcontractorsResponse?.data || [],
                );
                setCurrencies(Array.isArray(currenciesResponse) ? currenciesResponse : currenciesResponse?.data || []);

                // Find and set the correct currency symbol
                const currencyData = Array.isArray(currenciesResponse)
                    ? currenciesResponse
                    : currenciesResponse?.data || [];
                setCurrencies(currencyData);

                const contractCurrency = currencyData.find((c: any) => c.id === data.currencyId);
                if (contractCurrency?.currencies) {
                    setCurrency(contractCurrency.currencies); // Use 'currencies' field (like MAD, USD, EUR)
                }
            } else {
                toaster.error("Failed to load contract details");
                navigate("/dashboard/contracts");
            }
        } catch (error) {
            console.error("Error loading contract:", error);
            toaster.error("An error occurred while loading contract details");
            navigate("/dashboard/contracts");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateContract = async () => {
        if (!contractId) return;

        setGeneratingContract(true);
        try {
            const result = await contractsApi.generateContractBOQ(parseInt(contractId));
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
        if (!contractId) return;

        if (!confirm("Are you sure you want to delete this contract? This action cannot be undone.")) {
            return;
        }

        setDeletingContract(true);
        try {
            const result = await contractsApi.deleteContract(parseInt(contractId));
            if (result.success) {
                toaster.success("Contract deleted successfully!");
                navigate("/dashboard/contracts");
            }
        } finally {
            setDeletingContract(false);
        }
    };

    const handleEditContract = () => {
        navigate(`/dashboard/contracts/edit/${contractIdentifier}`, {
            state: { contractId },
        });
    };

    const handlePreviewContract = async () => {
        if (!contractId) {
            toaster.error("Cannot generate preview: Contract ID is missing.");
            return;
        }

        setLoadingPreview(true);
        try {
            // Using the ID-only API as requested.
            const result = await contractsApi.exportContractPdfDocument(parseInt(contractId));

            if (result.success && result.blob instanceof Blob && result.blob.size > 0) {
                // Setting state to display the blob in the modal, as requested.
                setPreviewData({
                    blob: result.blob,
                    fileName: `Contract_Preview_${contractData?.contractNumber || contractIdentifier}.pdf`,
                });
                setShowPreview(true);
            } else {
                toaster.error("Failed to generate contract preview. The server returned an invalid or empty file.");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toaster.error(`An error occurred during preview generation: ${message}`);
        }
        finally {
            setLoadingPreview(false);
        }
    };

    const handleExportPDF = async () => {
        if (!contractId) {
            console.error("❌ PDF Export: No contract ID available");
            return;
        }

        if (exportingPDF || exportingWord) {
            console.log("❌ Export already in progress, ignoring click");
            return;
        }

        console.log("🔄 Starting PDF export for contract:", {
            contractId,
            idParsed: parseInt(contractId),
            contractNumber: contractData?.contractNumber,
            status: contractData?.contractDatasetStatus,
        });

        try {
            setExportingPDF(true);

            // Always use the direct export API as requested by the user.
            console.log("📄 Using export PDF for contract");
            const result = await contractsApi.exportContractPdfDocument(parseInt(contractId));

            console.log("📥 PDF Export API result:", result);

            if (result.success && result.blob) {
                // Validate blob before creating URL
                if (!(result.blob instanceof Blob)) {
                    console.error("❌ Invalid blob type:", typeof result.blob, result.blob);
                    toaster.error("Invalid response format from server");
                    return;
                }

                // Check blob size
                if (result.blob.size === 0) {
                    console.error("❌ Empty blob received");
                    toaster.error("Received empty file from server");
                    return;
                }

                console.log("✅ Valid blob received:", {
                    size: result.blob.size,
                    type: result.blob.type,
                });

                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `Contract_${contractData?.contractNumber || contractIdentifier}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("Contract exported as PDF successfully!");
            } else {
                console.error("❌ PDF Export failed:", {
                    success: result.success,
                    hasBlob: !!result.blob,
                    result: result,
                });
                toaster.error("Failed to export contract as PDF");
            }
        } catch (error) {
            console.error("🚨 PDF Export exception:", {
                error,
                contractId: contractId,
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
            toaster.error("PDF Export error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setExportingPDF(false);
        }
    };

    const handleExportWord = async () => {
        if (!contractId) {
            console.error("❌ Word Export: No contract ID available");
            return;
        }

        if (exportingPDF || exportingWord) {
            console.log("❌ Export already in progress, ignoring click");
            return;
        }

        console.log("🔄 Starting Word export for contract:", {
            contractId,
            idParsed: parseInt(contractId),
            contractNumber: contractData?.contractNumber,
            status: contractData?.contractDatasetStatus,
        });

        try {
            setExportingWord(true);

            // Always use the direct export API as requested by the user.
            console.log("📄 Using export Word for contract");
            const result = await contractsApi.exportContractWordDocument(parseInt(contractId));

            console.log("📥 Word Export API result:", result);

            if (result.success && result.blob) {
                // Validate blob before creating URL
                if (!(result.blob instanceof Blob)) {
                    console.error("❌ Invalid blob type:", typeof result.blob, result.blob);
                    toaster.error("Invalid response format from server");
                    return;
                }

                // Check blob size
                if (result.blob.size === 0) {
                    console.error("❌ Empty blob received");
                    toaster.error("Received empty file from server");
                    return;
                }

                console.log("✅ Valid blob received:", {
                    size: result.blob.size,
                    type: result.blob.type,
                });

                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `Contract_${contractData?.contractNumber || contractIdentifier}.docx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("Contract exported as Word successfully!");
            } else {
                console.error("❌ Word Export failed:", {
                    success: result.success,
                    hasBlob: !!result.blob,
                    result: result,
                });
                toaster.error("Failed to export contract as Word");
            }
        } catch (error) {
            console.error("🚨 Word Export exception:", {
                error,
                contractId: contractId,
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            });
            toaster.error("Word Export error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setExportingWord(false);
        }
    };

    const handleCreateVO = () => {
        // ✅ Navigate to proper contract-specific VO creation wizard
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
                tradeName: navigationData?.tradeName || contractData?.subTrade,
                contractContext: contractData, // Pass full contract context for wizard
            },
        });
    };

    const handlePreviewVoDataSet = async (voDataSetId: number, voNumber: string) => {
        if (!contractId) {
            toaster.error("Contract ID is missing.");
            return;
        }
        setLoadingPreviewVO(true);
        try {
            const result = await previewVoDataSet(voDataSetId, getToken() || "");
            if (result instanceof Blob && result.size > 0) {
                setVoPreviewData({
                    blob: result,
                    fileName: `VO_Preview_${voNumber}.pdf`,
                });
                setShowVoPreview(true);
            } else {
                toaster.error("Failed to generate VO preview. Invalid or empty file.");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toaster.error(`Error generating VO preview: ${message}`);
        } finally {
            setLoadingPreviewVO(false);
        }
    };

    const handleExportVoDataSetWord = async (voDataSetId: number, voNumber: string) => {
        if (!contractId) {
            toaster.error("Contract ID is missing.");
            return;
        }
        setExportingWordVO(true);
        try {
            const result = await exportVoDataSetWord(voDataSetId, getToken() || "");
            if (result instanceof Blob && result.size > 0) {
                const url = window.URL.createObjectURL(result);
                const link = document.createElement("a");
                link.href = url;
                link.download = `VO_${voNumber}.docx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("VO exported as Word successfully!");
            } else {
                toaster.error("Failed to export VO as Word. Invalid or empty file.");
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toaster.error(`Error exporting VO as Word: ${message}`);
        } finally {
            setExportingWordVO(false);
        }
    };

    // Calculate total contract amount from BOQ items (fallback)
    const calculateTotalAmount = () => {
        if (!contractData?.buildings) return 0;

        let total = 0;
        contractData.buildings.forEach((building: any) => {
            if (building.boqsContract && Array.isArray(building.boqsContract)) {
                building.boqsContract.forEach((item: any) => {
                    total += item.totalPrice || item.qte * item.pu || 0;
                });
            }
        });
        return total;
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
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
    const currentProject = projects.find((p) => p.id === contractData?.projectId);
    const currentSubcontractor = subcontractors.find((s) => s.id === contractData?.subContractorId);
    const currentCurrency = currencies.find((c) => c.id === contractData?.currencyId);

    // Use the amount from contract data if available, otherwise fall back to advancePayment field or calculate from BOQ
    // Note: advancePayment field often contains the contract total (legacy behavior)
    const totalAmount = contractData?.amount || contractData?.advancePayment || calculateTotalAmount();

    // FIXED: Use correct field for advance payment percentage
    // advancePayment stores contract amounts, subcontractorAdvancePayee stores percentages
    const advancePercentage = parseFloat(contractData?.subcontractorAdvancePayee || "0") || 0;
    const advanceAmount = totalAmount * (advancePercentage / 100);

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/dashboard/contracts")}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
                        <span className="iconify lucide--arrow-left size-4"></span>
                        Back
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePreviewContract}
                        disabled={loadingPreview}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
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
                            className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                            disabled={exportingPDF || exportingWord}>
                            {exportingPDF || exportingWord ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--download size-4"></span>
                                    <span>Export</span>
                                    <span className="iconify lucide--chevron-down size-3"></span>
                                </>
                            )}
                        </button>
                        <ul
                            tabIndex={0}
                            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                            <li>
                                <a
                                    onClick={handleExportPDF}
                                    className={exportingPDF ? "cursor-not-allowed opacity-60" : ""}>
                                    {exportingPDF ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            <span>Exporting PDF...</span>
                                        </>
                                    ) : (
                                        <span>Export as PDF</span>
                                    )}
                                </a>
                            </li>
                            <li>
                                <a
                                    onClick={handleExportWord}
                                    className={exportingWord ? "cursor-not-allowed opacity-60" : ""}>
                                    {exportingWord ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs"></span>
                                            <span>Exporting Word...</span>
                                        </>
                                    ) : (
                                        <span>Export as Word</span>
                                    )}
                                </a>
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={handleEditContract}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
                        <span className="iconify lucide--edit size-4"></span>
                        <span>Edit</span>
                    </button>

                    {contractData.contractDatasetStatus === "Editable" && (
                        <button
                            onClick={handleGenerateContract}
                            disabled={generatingContract}
                            className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
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
                        className="btn btn-sm btn-error text-error-content hover:bg-error/10 flex items-center gap-2">
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Contract Info */}
                <div className="card bg-base-100 border-base-300 border shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--file-text size-5 text-purple-600"></span>
                            Contract Information
                        </h3>
                        <div className="mt-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Contract Number:</span>
                                <span className="text-base-content font-semibold">
                                    {contractData.contractNumber || navigationData?.contractNumber || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Status:</span>
                                <span className="badge badge-sm badge-success">
                                    {contractData.contractDatasetStatus || "Active"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Contract Date:</span>
                                <span className="text-base-content">
                                    {formatDate(contractData.contractDate) || navigationData?.contractDate || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Completion Date:</span>
                                <span className="text-base-content">
                                    {formatDate(contractData.completionDate) || navigationData?.completionDate || "-"}
                                </span>
                            </div>
                            <div className="divider"></div>
                            <div className="flex items-center justify-between">
                                <span className="text-base-content/70">Total Amount:</span>
                                <span className="text-primary text-xl font-bold">
                                    {currentCurrency?.currencies || currency} {formatCurrency(totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Project & Parties */}
                <div className="card bg-base-100 border-base-300 border shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--building-2 size-5 text-blue-600"></span>
                            Project & Parties
                        </h3>
                        <div className="mt-4 space-y-3">
                            <div>
                                <span className="text-base-content/70 text-sm">Project:</span>
                                <p className="text-base-content mt-1 font-semibold">
                                    {currentProject?.name || navigationData?.projectName || "N/A"}
                                </p>
                            </div>
                            <div>
                                <span className="text-base-content/70 text-sm">Subcontractor:</span>
                                <p className="text-base-content mt-1 font-semibold">
                                    {currentSubcontractor?.name || navigationData?.subcontractorName || "N/A"}
                                </p>
                            </div>
                            <div>
                                <span className="text-base-content/70 text-sm">Trade:</span>
                                <p className="text-base-content mt-1 font-semibold">
                                    {navigationData?.tradeName || contractData.subTrade || "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Terms */}
                <div className="card bg-base-100 border-base-300 border shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--calculator size-5 text-green-600"></span>
                            Financial Terms
                        </h3>
                        <div className="mt-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Advance Payment:</span>
                                <span className="text-base-content">{formatPercentage(advancePercentage)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Advance Amount:</span>
                                <span className="text-base-content font-semibold">
                                    {currentCurrency?.currencies || currency} {formatCurrency(advanceAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Prorata Account:</span>
                                <span className="text-base-content">{contractData.prorataAccount || "0"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Retention:</span>
                                <span className="text-base-content">{contractData.holdBack || "5%"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Payment Terms:</span>
                                <span className="text-base-content">{contractData.paymentsTerm || "30 days"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Variation Orders Section */}
            <div className="card bg-base-100 border-base-300 border shadow-sm">
                <div className="card-body">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--git-branch size-5 text-orange-600"></span>
                            Variation Orders
                        </h3>
                        <button onClick={handleCreateVO} className="btn btn-primary btn-sm">
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
                            exportAction // <--- New prop
                            title=""
                            loading={false}
                            onSuccess={getContractVOs} // Refresh VOs after any action
                            openStaticDialog={(type, data, extraData) => {
                                if (type === "Edit") {
                                    // Navigate to VO creation wizard for editing
                                    navigate(`/dashboard/contracts/details/${extraData.contractIdentifier}/edit-vo/${data.id}`, {
                                        state: {
                                            contractId: extraData.contractId,
                                            voDatasetId: data.id // Pass the ID of the VO dataset to edit
                                        }
                                    });
                                } else if (type === "Preview") {
                                    handlePreviewVoDataSet(data.id, data.voNumber);
                                } else if (type === "Export") { // New action type
                                    handleExportVoDataSetWord(data.id, data.voNumber);
                                } else if (type === "Delete") {
                                    // Handle delete action (e.g., show a confirmation dialog)
                                    console.log("Delete VO dataset:", data);
                                }
                            }}
                            dynamicDialog={false}
                            contractIdentifier={contractIdentifier}
                            contractId={contractId}
                        />
                    ) : (
                        <div className="py-12 text-center">
                            <span className="iconify lucide--inbox text-base-content/30 mx-auto mb-3 size-12"></span>
                            <p className="text-base-content/70">No variation orders found for this contract</p>
                            <button onClick={handleCreateVO} className="btn btn-primary btn-sm mt-4">
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
                    <div className="modal-box h-[90vh] max-w-7xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">Contract Preview</h3>
                            <button onClick={() => setShowPreview(false)} className="btn btn-ghost btn-sm">
                                <span className="iconify lucide--x size-5"></span>
                            </button>
                        </div>
                        <div className="h-[calc(100%-60px)]">
                            <PDFViewer fileBlob={previewData.blob} fileName={previewData.fileName} />
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => setShowPreview(false)}>close</button>
                    </form>
                </dialog>
            )}

            {/* VO Preview Modal */}
            {showVoPreview && voPreviewData && (
                <dialog className="modal modal-open">
                    <div className="modal-box h-[90vh] max-w-7xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">VO Preview</h3>
                            <button onClick={() => setShowVoPreview(false)} className="btn btn-ghost btn-sm">
                                <span className="iconify lucide--x size-5"></span>
                            </button>
                        </div>
                        <div className="h-[calc(100%-60px)]">
                            <PDFViewer fileBlob={voPreviewData.blob} fileName={voPreviewData.fileName} />
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => setShowVoPreview(false)}>close</button>
                    </form>
                </dialog>
            )}
        </div>
    );
};

export default ContractDetails;
