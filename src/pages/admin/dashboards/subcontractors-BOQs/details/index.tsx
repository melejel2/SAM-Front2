import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import apiRequest from "@/api/api";
import {
    deleteVoDataSet,
    exportVoDataSetWord,
    generateVoDataSet,
    getContractVOs,
    previewVoDataSet,
    getVoSfdt,
    saveVoFromSfdt,
} from "@/api/services/vo-api";
import { getContractSfdt, saveContractFromSfdt, exportContractWord } from "@/api/services/contracts-api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import DocumentEditorModal from "@/components/WordDocumentEditor/DocumentEditorModal";
import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { useAuth } from "@/contexts/auth";
import { useTopbarContent } from "@/contexts/topbar-content";
import useToast from "@/hooks/use-toast";
import { generateContractFileName, generateVOFileName } from "@/utils/ipc-filename";
import { formatCurrency, formatDate } from "@/utils/formatters";

import { useContractsApi } from "../hooks/use-contracts-api";

// Lazy load TerminationDocsTab only when needed
const TerminationDocsTab = lazy(() => import("../../contracts-database/details/TerminationDocsTab"));

// Lazy load tab components to reduce initial bundle and memory usage
const InfoTab = lazy(() => import("./components/tabs/InfoTab"));
const VOsTab = lazy(() => import("./components/tabs/VOsTab"));
const IPCsTab = lazy(() => import("./components/tabs/IPCsTab"));
const DeductionsTab = lazy(() => import("./components/tabs/DeductionsTab"));

// Tab type definition
type ContractTab = "info" | "vos" | "ipcs" | "deductions" | "termination-docs";

const getContractStatusBadgeClass = (status?: string) => {
    switch ((status || "").toLowerCase()) {
        case "terminated":
            return "badge badge-sm badge-error";
        case "editable":
            return "badge badge-sm badge-warning";
        case "active":
            return "badge badge-sm badge-success";
        default:
            return "badge badge-sm badge-neutral";
    }
};

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
                const formattedVos = response.data.map((vo: any) => ({
                    id: vo.id,
                    voNumber: vo.voNumber || vo.VoNumber || "-",
                    subTrade: vo.subTrade || vo.SubTrade || "-",
                    type: vo.type || vo.Type || "-",
                    // Raw numeric value - Table component handles formatting
                    amount: vo.amount || vo.Amount || 0,
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
    const { setAllContent, clearContent } = useTopbarContent();

    // Get actual contract ID from navigation state (for API calls) or try to parse if it's numeric
    const contractId = location.state?.contractId || (!isNaN(Number(contractIdentifier)) ? contractIdentifier : null);

    const [contractData, setContractData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Tab state - use returnTab from navigation if provided
    const initialTab = (location.state as { returnTab?: ContractTab } | null)?.returnTab ?? (sessionStorage.getItem("sub-boqs-details-tab") as ContractTab) ?? "info";
    const [activeTab, setActiveTab] = useState<ContractTab>(initialTab);

    useEffect(() => { sessionStorage.setItem("sub-boqs-details-tab", activeTab); }, [activeTab]);

    // Track which tabs have been loaded for lazy loading optimization
    const [loadedTabs, setLoadedTabs] = useState<Set<ContractTab>>(new Set([initialTab]));

    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [generatingContract, setGeneratingContract] = useState(false);
    const [unGeneratingContract, setUnGeneratingContract] = useState(false);
    const [deletingContract, setDeletingContract] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingWord, setExportingWord] = useState(false);
    const [currency, setCurrency] = useState("$");
    const [projects, setProjects] = useState<any[]>([]);
    const [subcontractors, setSubcontractors] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [terminating, setTerminating] = useState(false);

    // New state for VO preview and export
    const [loadingPreviewVO, setLoadingPreviewVO] = useState(false);
    const [exportingWordVO, setExportingWordVO] = useState(false);
    const [showVoPreview, setShowVoPreview] = useState(false);
    const [voPreviewData, setVoPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);

    // State for Document Editor (Contract and VO) - using SFDT format
    const [showContractEditor, setShowContractEditor] = useState(false);
    const [contractSfdt, setContractSfdt] = useState<string | null>(null);
    const [loadingContractSfdt, setLoadingContractSfdt] = useState(false);
    const [contractSfdtError, setContractSfdtError] = useState<string | null>(null);
    const [showVoEditor, setShowVoEditor] = useState(false);
    const [voSfdt, setVoSfdt] = useState<string | null>(null);
    const [loadingVoSfdt, setLoadingVoSfdt] = useState(false);
    const [voSfdtError, setVoSfdtError] = useState<string | null>(null);
    const [currentVoId, setCurrentVoId] = useState<number | null>(null);

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
        returnTab?: ContractTab;
    } | null;

    // Contract VOs management
    const { vos, voColumns, loading: vosLoading, getContractVOs } = useContractVOs(contractId || "");

    // Row actions control - disable edit, generate, and delete for active VOs
    const handleVoRowActions = (row: any) => {
        const isActive = row.status?.toLowerCase() === "active";

        if (isActive) {
            // Active VOs cannot be edited, generated, or deleted
            return {
                editAction: false,
                deleteAction: false,
                generateAction: false,
            };
        }

        // Non-active VOs have all actions enabled
        return {
            editAction: true,
            deleteAction: true,
            generateAction: true,
        };
    };

    // Initialize contracts API
    const contractsApi = useContractsApi();

    // Handle tab changes with lazy loading tracking
    const handleTabChange = useCallback((tab: ContractTab) => {
        setActiveTab(tab);
        setLoadedTabs(prev => {
            if (prev.has(tab)) return prev;
            const newSet = new Set(prev);
            newSet.add(tab);
            return newSet;
        });
    }, []);

    // Clear modal data handlers to free memory
    const handleClosePreview = useCallback(() => {
        setShowPreview(false);
        // Defer clearing blob data to allow modal close animation
        setTimeout(() => setPreviewData(null), 300);
    }, []);

    const handleCloseVoPreview = useCallback(() => {
        setShowVoPreview(false);
        setTimeout(() => setVoPreviewData(null), 300);
    }, []);

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

    const handleUnGenerateContract = async () => {
        if (!contractId) return;

        if (!confirm("Are you sure you want to un-generate this contract? This will change its status from Active to Editable.")) {
            return;
        }

        setUnGeneratingContract(true);
        try {
            const result = await contractsApi.unGenerateContractBOQ(parseInt(contractId));
            if (result.success) {
                // Reload contract data to get updated status
                loadContractDetails();
            }
        } finally {
            setUnGeneratingContract(false);
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
        if (contractData?.contractDatasetStatus === "Active") {
            navigate(`/dashboard/contracts/particular-conditions/${contractIdentifier}`, {
                state: { contractId, contractData },
            });
        } else {
            navigate(`/dashboard/contracts/edit/${contractIdentifier}`, {
                state: { contractId },
            });
        }
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
        } finally {
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
                link.download = contractData?.contractNumber
                    ? generateContractFileName(contractData.contractNumber, 'pdf')
                    : `Contract_${contractIdentifier}.pdf`;
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
                link.download = contractData?.contractNumber
                    ? generateContractFileName(contractData.contractNumber, 'docx')
                    : `Contract_${contractIdentifier}.docx`;
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

    // ================ EDIT CONTRACT DOCUMENT (SFDT-based) ================
    const handleEditContractDocument = async () => {
        if (!contractId) {
            toaster.error("Cannot edit: Contract ID is missing");
            return;
        }

        setLoadingContractSfdt(true);
        setContractSfdtError(null);
        setShowContractEditor(true);
        setShowPreview(false); // Close PDF preview

        try {
            const token = getToken();
            const sfdt = await getContractSfdt(parseInt(contractId), token ?? "");

            if (sfdt && typeof sfdt === "string") {
                setContractSfdt(sfdt);
            } else {
                setContractSfdtError("Failed to load document for editing");
                toaster.error("Failed to load Word document for editing");
            }
        } catch (error) {
            console.error("Error loading SFDT document:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to load document for editing";
            setContractSfdtError(errorMessage);
            toaster.error(errorMessage);
        } finally {
            setLoadingContractSfdt(false);
        }
    };

    const handleContractEditorSave = async (sfdtContent: string, filename: string) => {
        if (!contractId) {
            toaster.error("Cannot save: Contract ID is missing");
            return;
        }

        const token = getToken();
        if (!token) {
            toaster.error("Authentication required");
            return;
        }

        try {
            const result = await saveContractFromSfdt(parseInt(contractId), sfdtContent, token);
            if (result.success) {
                toaster.success("Contract document saved successfully");
            } else {
                toaster.error(result.error || "Failed to save document");
            }
        } catch (error) {
            console.error("Save error:", error);
            toaster.error("Failed to save document to server");
        }
    };

    const handleContractEditorClose = () => {
        setShowContractEditor(false);
        setContractSfdt(null);
        setContractSfdtError(null);
    };

    // ================ EDIT VO DOCUMENT (SFDT-based) ================
    const handleEditVoDocument = async (voId: number) => {
        if (!voId) {
            toaster.error("Cannot edit: VO ID is missing");
            return;
        }

        setLoadingVoSfdt(true);
        setVoSfdtError(null);
        setCurrentVoId(voId);
        setShowVoEditor(true);
        setShowVoPreview(false); // Close PDF preview

        try {
            const token = getToken();
            const sfdt = await getVoSfdt(voId, token ?? "");

            if (sfdt && typeof sfdt === "string") {
                setVoSfdt(sfdt);
            } else {
                setVoSfdtError("Failed to load VO document for editing");
                toaster.error("Failed to load VO Word document for editing");
            }
        } catch (error) {
            console.error("Error loading VO SFDT document:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to load VO document for editing";
            setVoSfdtError(errorMessage);
            toaster.error(errorMessage);
        } finally {
            setLoadingVoSfdt(false);
        }
    };

    const handleVoEditorSave = async (sfdtContent: string, filename: string) => {
        if (!currentVoId) {
            toaster.error("Cannot save: VO ID is missing");
            return;
        }

        const token = getToken();
        if (!token) {
            toaster.error("Authentication required");
            return;
        }

        try {
            const result = await saveVoFromSfdt(currentVoId, sfdtContent, token);
            if (result.success) {
                toaster.success("VO document saved successfully");
            } else {
                toaster.error(result.error || "Failed to save VO document");
            }
        } catch (error) {
            console.error("Save error:", error);
            toaster.error("Failed to save VO document to server");
        }
    };

    const handleVoEditorClose = () => {
        setShowVoEditor(false);
        setVoSfdt(null);
        setVoSfdtError(null);
        setCurrentVoId(null);
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

    const handleTerminateContract = async () => {
        if (!contractId || !contractData) return;

        setTerminating(true);
        try {
            const response = await apiRequest({
                endpoint: `ContractsDatasets/TerminateContract/${contractId}`,
                method: "POST",
                token: getToken() ?? "",
            });

            if (response && typeof response === "object" && "success" in response && response.success) {
                toaster.success(`Contract ${contractData.contractNumber} has been terminated successfully`);
                setShowTerminateModal(false);
                // Navigate back to contracts database
                navigate("/dashboard/contracts");
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
                link.download = contractData?.contractNumber
                    ? generateVOFileName(contractData.contractNumber, voNumber, 'docx')
                    : `VO_${voNumber}.docx`;
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

    const handleDeleteVO = async (voId: number) => {
        if (!confirm("Are you sure you want to delete this Variation Order? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await deleteVoDataSet(voId, getToken() ?? "");
            if (response.success) {
                toaster.success("Variation Order deleted successfully!");
                getContractVOs(); // Refresh the list
            } else {
                toaster.error(response.message || "Failed to delete Variation Order.");
            }
        } catch (error) {
            console.error("Error deleting VO:", error);
            toaster.error("An error occurred while deleting the Variation Order.");
        }
    };

    const handleGenerateVO = async (voId: number) => {
        // Find the VO data to get the VO number for confirmation
        const voData = vos.find((vo) => vo.id === voId);
        const voNumber = voData && typeof voData.voNumber === "string" ? voData.voNumber : `VO-${voId}`;
        const projectName =
            currentProject && typeof currentProject.name === "string" ? currentProject.name : "Unknown Project";

        // Show confirmation dialog
        const confirmMessage = `Are you sure you want to generate VO ${voNumber} for project ${projectName}?\n\nThis will create the final VO document and update its status.`;

        if (!confirm(confirmMessage)) {
            return;
        }

        console.log("🔄 Generating VO with ID:", voId);
        try {
            const response = await generateVoDataSet(voId, getToken() ?? "");
            console.log("📥 Generate VO response:", response);
            if (response.success) {
                toaster.success("VO generated successfully!");
                getContractVOs(); // Refresh list to show updated status
            } else {
                toaster.error(response.message || "Failed to generate VO.");
            }
        } catch (error) {
            console.error("Error generating VO:", error);
            toaster.error("An error occurred while generating the VO.");
        }
    };

    useEffect(() => {
        if (!contractData) {
            setAllContent(null, null, null);
            return;
        }

        const contractNumber = contractData.contractNumber || navigationData?.contractNumber || contractIdentifier || "-";
        const statusLabel = contractData.contractDatasetStatus || navigationData?.status || "Active";
        const typeLabel = contractData.contractType || navigationData?.tradeName || "Contract";

        const leftContent = (
            <button
                onClick={() => navigate("/dashboard/contracts")}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                title="Back to Contracts"
            >
                <span className="iconify lucide--arrow-left size-4"></span>
            </button>
        );

        const centerContent = (
            <div className="max-w-[520px]">
                <div className="flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-4 py-1.5 shadow-sm">
                    <span className="text-sm font-semibold text-base-content whitespace-nowrap">
                        Contract #{contractNumber}
                    </span>
                    <span className={`${getContractStatusBadgeClass(statusLabel)} hidden md:inline-flex`}>
                        {statusLabel}
                    </span>
                    <span className="badge badge-sm badge-neutral hidden xl:inline-flex">
                        {typeLabel}
                    </span>
                </div>
            </div>
        );

        const rightContent = (
            <div className="flex items-center gap-2">
                {(contractData.contractDatasetStatus === "Editable" ||
                    contractData.contractDatasetStatus === "Active") && (
                    <button
                        onClick={handleEditContract}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                        title="Edit"
                    >
                        <span className="iconify lucide--edit size-4"></span>
                        <span className="hidden xl:inline">Edit</span>
                    </button>
                )}

                <div className="dropdown dropdown-end">
                    <button
                        tabIndex={0}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                        disabled={exportingPDF || exportingWord}
                        title="Export"
                    >
                        {exportingPDF || exportingWord ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <span className="iconify lucide--download size-4"></span>
                        )}
                        <span className="hidden xl:inline">Export</span>
                        <span className="iconify lucide--chevron-down size-3"></span>
                    </button>
                    <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                            <button onClick={handleExportPDF} disabled={exportingPDF}>
                                {exportingPDF ? "Exporting PDF..." : "Export as PDF"}
                            </button>
                        </li>
                        <li>
                            <button onClick={handleExportWord} disabled={exportingWord}>
                                {exportingWord ? "Exporting Word..." : "Export as Word"}
                            </button>
                        </li>
                    </ul>
                </div>

                {contractData.contractDatasetStatus === "Editable" && (
                    <button
                        onClick={handleGenerateContract}
                        disabled={generatingContract}
                        className="btn btn-sm btn-success text-white flex items-center gap-2"
                    >
                        {generatingContract ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <span className="iconify lucide--check-circle size-4"></span>
                        )}
                        <span className="hidden xl:inline">Generate</span>
                    </button>
                )}

                <div className="dropdown dropdown-end">
                    <button
                        tabIndex={0}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                        title="More actions"
                    >
                        <span className="iconify lucide--more-horizontal size-4"></span>
                        <span className="hidden xl:inline">More</span>
                    </button>
                    <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                            <button onClick={handlePreviewContract} disabled={loadingPreview}>
                                {loadingPreview ? "Loading Preview..." : "Preview"}
                            </button>
                        </li>
                        {contractData.contractDatasetStatus === "Active" && (
                            <li>
                                <button onClick={handleUnGenerateContract} disabled={unGeneratingContract}>
                                    {unGeneratingContract ? "Un-Generating..." : "Un-Generate"}
                                </button>
                            </li>
                        )}
                        {contractData.contractDatasetStatus?.toLowerCase() === "active" && (
                            <li>
                                <button onClick={() => setShowTerminateModal(true)} disabled={terminating} className="text-error">
                                    {terminating ? "Terminating..." : "Terminate"}
                                </button>
                            </li>
                        )}
                        {contractData.contractDatasetStatus === "Editable" && (
                            <li>
                                <button onClick={handleDeleteContract} disabled={deletingContract} className="text-error">
                                    {deletingContract ? "Deleting..." : "Delete"}
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        );

        setAllContent(leftContent, centerContent, rightContent);
    }, [
        contractData,
        navigationData?.contractNumber,
        navigationData?.status,
        navigationData?.tradeName,
        contractIdentifier,
        navigate,
        handlePreviewContract,
        loadingPreview,
        exportingPDF,
        exportingWord,
        terminating,
        unGeneratingContract,
        generatingContract,
        deletingContract,
        handleExportPDF,
        handleExportWord,
        handleUnGenerateContract,
        handleEditContract,
        handleGenerateContract,
        handleDeleteContract,
        setAllContent,
    ]);

    useEffect(() => {
        return () => clearContent();
    }, [clearContent]);

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
                <Loader
                    icon="file-spreadsheet"
                    subtitle="Loading: Contract Details"
                    description="Preparing contract information..."
                />
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

    // Use the amount from contract data if available, otherwise calculate from BOQ
    // Note: advancePayment field stores amounts (legacy), don't use it as a fallback for totalAmount
    const totalAmount = contractData?.amount || calculateTotalAmount();

    // FIXED: Use correct field for advance payment percentage
    // advancePayment stores contract amounts, subcontractorAdvancePayee stores percentages
    const advancePercentage = parseFloat(contractData?.subcontractorAdvancePayee || "0") || 0;
    const advanceAmount = totalAmount * (advancePercentage / 100);

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-base-300 bg-base-100/80 p-1">
                <button
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                        activeTab === "info"
                            ? "bg-primary text-primary-content"
                            : "text-base-content hover:bg-base-200/80"
                    }`}
                    onClick={() => handleTabChange("info")}>
                    <span className="iconify lucide--file-text size-4"></span>
                    Contract Info
                </button>
                <button
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                        activeTab === "vos"
                            ? "bg-primary text-primary-content"
                            : "text-base-content hover:bg-base-200/80"
                    }`}
                    onClick={() => handleTabChange("vos")}>
                    <span className="iconify lucide--git-branch size-4"></span>
                    VOs ({vos.length})
                </button>
                <button
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                        activeTab === "ipcs"
                            ? "bg-primary text-primary-content"
                            : "text-base-content hover:bg-base-200/80"
                    }`}
                    onClick={() => handleTabChange("ipcs")}>
                    <span className="iconify lucide--receipt size-4"></span>
                    IPCs
                </button>
                <button
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                        activeTab === "deductions"
                            ? "bg-primary text-primary-content"
                            : "text-base-content hover:bg-base-200/80"
                    }`}
                    onClick={() => handleTabChange("deductions")}>
                    <span className="iconify lucide--minus-circle size-4"></span>
                    Deductions
                </button>
                {contractData.contractDatasetStatus === "Terminated" && (
                    <button
                        className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
                            activeTab === "termination-docs"
                                ? "bg-primary text-primary-content"
                                : "text-base-content hover:bg-base-200/80"
                        }`}
                        onClick={() => handleTabChange("termination-docs")}>
                        <span className="iconify lucide--file-x size-4"></span>
                        Termination Docs
                    </button>
                )}
            </div>

            {/* Tab Content - Only load tabs that have been visited (lazy loading) */}
            <div className="flex-1 min-h-0 overflow-hidden">
            <Suspense fallback={<div className="flex justify-center p-8"><Loader icon="file-spreadsheet" subtitle="Loading Tab" size="md" height="auto" minHeight="200px" /></div>}>
                {activeTab === "info" ? (
                    <InfoTab
                        contractData={contractData}
                        currency={currency}
                        currentCurrency={currentCurrency}
                        currentProject={currentProject}
                        currentSubcontractor={currentSubcontractor}
                        navigationData={navigationData}
                    />
                ) : activeTab === "vos" ? (
                    <VOsTab
                        vos={vos}
                        voColumns={voColumns}
                        loading={vosLoading}
                        contractId={contractId}
                        contractIdentifier={contractIdentifier}
                        contractData={contractData}
                        navigationData={navigationData}
                        currentProject={currentProject}
                        currentSubcontractor={currentSubcontractor}
                        onVOsRefresh={getContractVOs}
                        onPreviewVO={handlePreviewVoDataSet}
                        onExportVO={handleExportVoDataSetWord}
                        onDeleteVO={handleDeleteVO}
                        onGenerateVO={handleGenerateVO}
                    />
                ) : activeTab === "ipcs" ? (
                    <IPCsTab
                        contractId={contractId ? parseInt(contractId) : null}
                        contractNumber={contractData?.contractNumber}
                        contractIdentifier={contractIdentifier}
                        contractStatus={contractData?.contractDatasetStatus}
                    />
                ) : activeTab === "deductions" ? (
                    <DeductionsTab contractId={contractId ? parseInt(contractId) : null} />
                ) : activeTab === "termination-docs" && contractData.contractDatasetStatus === "Terminated" ? (
                    <TerminationDocsTab
                        contractId={contractId ? parseInt(contractId) : 0}
                        contractNumber={contractData?.contractNumber || contractIdentifier || ''}
                    />
                ) : null}
            </Suspense>
            </div>

            {/* Preview Modal */}
            {showPreview && previewData && (
                <dialog className="modal modal-open">
                    <div className="modal-box h-[90vh] max-w-7xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">Contract Preview</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleEditContractDocument}
                                    className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
                                >
                                    <span className="iconify lucide--file-pen size-4"></span>
                                    Edit Document
                                </button>
                                <button onClick={handleClosePreview} className="btn btn-ghost btn-sm">
                                    <span className="iconify lucide--x size-5"></span>
                                </button>
                            </div>
                        </div>
                        <div className="h-[calc(100%-60px)]">
                            <PDFViewer fileBlob={previewData.blob} fileName={previewData.fileName} />
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={handleClosePreview}>close</button>
                    </form>
                </dialog>
            )}

            {/* Contract Document Editor Modal (SFDT-based) */}
            {showContractEditor && (
                <DocumentEditorModal
                    isOpen={true}
                    onClose={handleContractEditorClose}
                    sfdtContent={contractSfdt ?? undefined}
                    documentName={`Contract_${contractData?.contractNumber || contractIdentifier}.docx`}
                    title="Edit Contract Document"
                    description={`Contract #${contractData?.contractNumber || contractIdentifier}`}
                    onSaveSfdt={handleContractEditorSave}
                    showSaveButton={true}
                    isLoadingSfdt={loadingContractSfdt}
                    loadError={contractSfdtError ?? undefined}
                    metadata={[
                        { label: "Contract #", value: contractData?.contractNumber || "-" },
                        { label: "Project", value: contractData?.projectName || currentProject?.name || "-" },
                        { label: "Subcontractor", value: contractData?.subcontractorName || currentSubcontractor?.name || "-" },
                        { label: "Status", value: contractData?.contractDatasetStatus || "-" },
                    ]}
                />
            )}

            {/* VO Preview Modal */}
            {showVoPreview && voPreviewData && (
                <dialog className="modal modal-open">
                    <div className="modal-box h-[90vh] max-w-7xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">VO Preview</h3>
                            <div className="flex items-center gap-2">
                                {voPreviewData && (voPreviewData as any).voId && (
                                    <button
                                        onClick={() => handleEditVoDocument((voPreviewData as any).voId)}
                                        className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
                                    >
                                        <span className="iconify lucide--file-pen size-4"></span>
                                        Edit Document
                                    </button>
                                )}
                                <button onClick={handleCloseVoPreview} className="btn btn-ghost btn-sm">
                                    <span className="iconify lucide--x size-5"></span>
                                </button>
                            </div>
                        </div>
                        <div className="h-[calc(100%-60px)]">
                            <PDFViewer fileBlob={voPreviewData.blob} fileName={voPreviewData.fileName} />
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={handleCloseVoPreview}>close</button>
                    </form>
                </dialog>
            )}

            {/* VO Document Editor Modal (SFDT-based) */}
            {showVoEditor && currentVoId && (
                <DocumentEditorModal
                    isOpen={true}
                    onClose={handleVoEditorClose}
                    sfdtContent={voSfdt ?? undefined}
                    documentName={`VO_${currentVoId}.docx`}
                    title="Edit VO Document"
                    description={`Variation Order Document`}
                    onSaveSfdt={handleVoEditorSave}
                    showSaveButton={true}
                    isLoadingSfdt={loadingVoSfdt}
                    loadError={voSfdtError ?? undefined}
                    metadata={[
                        { label: "Contract #", value: contractData?.contractNumber || "-" },
                        { label: "Project", value: contractData?.projectName || currentProject?.name || "-" },
                        { label: "Subcontractor", value: contractData?.subcontractorName || currentSubcontractor?.name || "-" },
                    ]}
                />
            )}

            {/* Terminate Contract Confirmation Modal */}
            {showTerminateModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
                    <div className="bg-base-100 w-full max-w-md animate-[modal-fade_0.2s] rounded-2xl p-6 shadow-2xl">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="bg-error/10 flex h-12 w-12 items-center justify-center rounded-full">
                                <span className="iconify lucide--x-circle text-error h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-base-content text-lg font-semibold">Terminate Contract</h3>
                                <p className="text-base-content/60 text-sm">This action cannot be undone.</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-base-content/80 mb-3">
                                Are you sure you want to terminate contract{" "}
                                <strong>{contractData?.contractNumber}</strong>
                                {currentProject?.name && (
                                    <>
                                        {" "}
                                        for project <strong>{currentProject.name}</strong>
                                    </>
                                )}
                                ?
                            </p>
                            <div className="bg-error/30 border-error/20 rounded-lg border p-3">
                                <p className="text-error-content text-sm">
                                    <span className="iconify lucide--info mr-1 inline h-4 w-4" />
                                    The contract will be moved to the terminated contracts list.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowTerminateModal(false)}
                                className="btn btn-ghost btn-sm px-6"
                                disabled={terminating}>
                                Cancel
                            </button>
                            <button
                                onClick={handleTerminateContract}
                                className="btn btn-error btn-sm px-6"
                                disabled={terminating}>
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
    );
};

export default ContractDetails;
