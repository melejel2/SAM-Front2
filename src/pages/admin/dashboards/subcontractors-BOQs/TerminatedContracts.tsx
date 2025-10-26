import { useEffect, useState } from "react";
import SAMTable from "@/components/Table";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import apiRequest from "@/api/api";
import useTerminatedContracts from "./hooks/use-terminated-contracts";
import { Icon } from "@iconify/react";

enum ContractType {
    RG = 0,
    Final = 1,
    Terminate = 2,
    contract = 3,
}

const PreviewContractFile = async (contractId: number, type: ContractType, token: string) => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/PreviewContractFile/${contractId}/${type}`,
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
}

const TerminatedContracts: React.FC<TerminatedContractsProps> = ({ selectedProject }) => {
    const { terminatedColumns, terminatedContractsData, loading: tableLoading, getTerminatedContracts } = useTerminatedContracts();
    const { toaster } = useToast();
    const { getToken } = useAuth();

    const [loading, setLoading] = useState<ContractType | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);

    useEffect(() => {
        getTerminatedContracts();
    }, [getTerminatedContracts]);

    const filteredTerminatedData = terminatedContractsData.filter((contract: any) =>
        selectedProject === "All Projects" || contract.projectName === selectedProject
    );

    const handlePreview = async (type: ContractType, row: any) => {
        setLoading(type);
        try {
            const result = await PreviewContractFile(row.id, type, getToken() ?? "");
            if (result.success && result.blob) {
                setPreviewData({
                    blob: result.blob,
                    fileName: `Preview_${row.contractNumber}_${ContractType[type]}.pdf`,
                });
                setShowPreview(true);
            } else {
                toaster.error("Failed to generate preview");
            }
        } catch (error) {
            toaster.error("Failed to generate preview");
        } finally {
            setLoading(null);
        }
    };

    const handleExportTerminate = async (row: any) => {
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
        }
    };

    return (
        <>
            <div className="card bg-base-100 border border-base-300 p-6">
                <div className="flex flex-wrap gap-4 mb-6">
                    <button className="btn btn-primary" onClick={() => handlePreview(ContractType.RG, filteredTerminatedData[0])} disabled={!!loading}>
                        {loading === ContractType.RG ? <Loader /> : <Icon icon="lucide:file-text" />} Preview RG Retention
                    </button>
                    <button className="btn btn-primary" onClick={() => handlePreview(ContractType.Final, filteredTerminatedData[0])} disabled={!!loading}>
                        {loading === ContractType.Final ? <Loader /> : <Icon icon="lucide:file-text" />} Preview RG Final
                    </button>
                    <button className="btn btn-primary" onClick={() => handlePreview(ContractType.Terminate, filteredTerminatedData[0])} disabled={!!loading}>
                        {loading === ContractType.Terminate ? <Loader /> : <Icon icon="lucide:file-x" />} Preview Terminate
                    </button>
                    <button className="btn btn-primary" onClick={() => handlePreview(ContractType.contract, filteredTerminatedData[0])} disabled={!!loading}>
                        {loading === ContractType.contract ? <Loader /> : <Icon icon="lucide:file-text" />} Preview Contract
                    </button>
                </div>
            </div>
            <SAMTable
                columns={terminatedColumns}
                tableData={filteredTerminatedData}
                actions
                previewAction
                exportAction
                title={"Terminated"}
                loading={tableLoading}
                onSuccess={getTerminatedContracts}
                openStaticDialog={(type, data) => {
                    if (type === "Export" && data) {
                        return handleExportTerminate(data);
                    }
                }}
                dynamicDialog={false}
                rowsPerPage={10}
                rowActions={(row) => ({
                    exportAction: true,
                })}
            />
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
        </>
    );
};

export default TerminatedContracts;
