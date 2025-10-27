import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

import apiRequest from "@/api/api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Loader } from "@/components/Loader";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

import useTerminatedContracts from "./hooks/use-terminated-contracts";

enum ContractType {
    RG = 1,
    Final = 3,
    Terminate = 2,
    contract = 0,
}

const PreviewContractFile = async (contractId: number, type: ContractType, token: string) => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/PreviewContractFile?id=${contractId}&type=${type}`,
            method: "GET",
            responseType: "blob",
            token: token ?? "",
        });
        return { success: true, blob: response };
    } catch (error) {
        console.error("Error previewing contract file:", error);
        return { success: false, error };
    }
};

interface TerminatedContractsProps {
    selectedProject: string;
    // contractId is optional: the component can be rendered for a project view
    // without a specific contract selected. Functions that require the id
    // already check for its presence before proceeding.
    contractId?: number;
}

const TerminatedContracts: React.FC<TerminatedContractsProps> = ({ selectedProject, contractId }) => {
    const {
        terminatedContractsData, // Keep this to find contractNumber for fileName
    } = useTerminatedContracts();
    const { toaster } = useToast();
    const { getToken } = useAuth();

    const [loading, setLoading] = useState<ContractType | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);

    // No need to call getTerminatedContracts here if SAMTable is removed and we only care about the single contractId
    // useEffect(() => {
    //     getTerminatedContracts();
    // }, [getTerminatedContracts]);

    // The filtering logic is no longer directly used for rendering a table, but terminatedContractsData is used to find contract details.
    // const filteredTerminatedData = terminatedContractsData.filter(
    //     (contract: any) => selectedProject === "All Projects" || contract.projectName === selectedProject,
    // );

    const handlePreview = async (type: ContractType) => {
        if (!contractId) {
            toaster.error("Contract ID is missing for preview.");
            return;
        }
        setLoading(type);
        try {
            const result = await PreviewContractFile(contractId, type, getToken() ?? "");
            if (result.success && result.blob) {
                // Find the specific contract data to get contractNumber for fileName
                const currentContract = terminatedContractsData.find((c) => c.id === contractId);
                const contractNumber = currentContract?.contractNumber || `Contract_${contractId}`;

                setPreviewData({
                    blob: result.blob,
                    fileName: `Preview_${contractNumber}_${ContractType[type]}.pdf`,
                });
                setShowPreview(true);
            } else {
                toaster.error("Failed to generate preview");
            }
        } catch (error) {
            toaster.error("Failed to generate preview: " + (error as Error).message);
        } finally {
            setLoading(null);
        }
    };

    const handleExportTerminate = async () => {
        if (!contractId) {
            toaster.error("Contract ID is missing for export.");
            return;
        }
        try {
            const response = await apiRequest({
                endpoint: `ContractsDatasets/ExportTerminateFile/${contractId}`,
                method: "GET",
                responseType: "blob",
                token: getToken() ?? "",
            });

            if (response instanceof Blob) {
                // Find the specific contract data to get contractNumber and projectName for fileName
                const currentContract = terminatedContractsData.find((c) => c.id === contractId);
                const contractRef = currentContract?.contractNumber || contractId;
                const projectName = currentContract?.projectName || "document";

                const fileName = `termination-${contractRef}-${projectName}.docx`;
                const url = window.URL.createObjectURL(response);
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
            if (error?.response?.status === 404) {
                toaster.error("Termination letter has not been generated yet. Please terminate the contract first.");
            } else {
                toaster.error("Failed to download termination letter");
            }
        }
    };

    return (
        <>
            <div className="card bg-base-100 border-base-300 border p-6">
                <div className="mb-6 flex flex-wrap gap-4">
                    <button
                        className="btn btn-primary"
                        onClick={() => handlePreview(ContractType.RG)}
                        disabled={!!loading}>
                        {loading === ContractType.RG ? <Loader /> : <Icon icon="lucide:file-text" />} Preview RG
                        Retention
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => handlePreview(ContractType.Final)}
                        disabled={!!loading}>
                        {loading === ContractType.Final ? <Loader /> : <Icon icon="lucide:file-text" />} Preview RG
                        Final
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => handlePreview(ContractType.Terminate)}
                        disabled={!!loading}>
                        {loading === ContractType.Terminate ? <Loader /> : <Icon icon="lucide:file-x" />} Preview
                        Terminate
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => handlePreview(ContractType.contract)}
                        disabled={!!loading}>
                        {loading === ContractType.contract ? <Loader /> : <Icon icon="lucide:file-text" />} Preview
                        Contract
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportTerminate} disabled={!!loading}>
                        <Icon icon="lucide:download" /> Export Termination Letter
                    </button>
                </div>
                {showPreview && previewData ? (
                    <div className="h-[70vh]">
                        <PDFViewer fileBlob={previewData.blob} fileName={previewData.fileName} />
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-base-content/60">Select a document type to preview.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default TerminatedContracts;
