import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import SAMTable from "@/components/Table";
import { Loader } from "@/components/Loader";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import useToast from "@/hooks/use-toast";
import { generateIPCFileName } from "@/utils/ipc-filename";
import useContractIPCs from "../../hooks/use-contract-ipcs";

interface IPCsTabProps {
    contractId: number | null;
    contractNumber: string | undefined;
    contractIdentifier: string | undefined;
    contractStatus?: string;
}

const IPCsTab = ({ contractId, contractNumber, contractIdentifier, contractStatus }: IPCsTabProps) => {
    const navigate = useNavigate();
    const { toaster } = useToast();

    const {
        ipcs,
        columns,
        loading,
        fetchIPCs,
        smartPreviewIpc,
        smartDownloadIpcExcel,
        deleteIpc,
        generateIpc,
    } = useContractIPCs({ contractId });

    // Preview modal state
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Action loading states
    const [generatingIpcId, setGeneratingIpcId] = useState<number | null>(null);
    const [deletingIpcId, setDeletingIpcId] = useState<number | null>(null);

    // Clear modal data handler to free memory
    const handleClosePreview = useCallback(() => {
        setShowPreview(false);
        // Defer clearing blob data to allow modal close animation
        setTimeout(() => setPreviewData(null), 300);
    }, []);

    // Fetch IPCs on mount
    useEffect(() => {
        if (contractId) {
            fetchIPCs();
        }
    }, [contractId, fetchIPCs]);

    // Row actions control - only allow delete on last IPC
    const handleRowActions = (row: any) => {
        const isEditable = row.status?.toLowerCase() === 'editable' || row._statusRaw?.toLowerCase() === 'editable';
        const isLast = row.isLastForContract;

        return {
            editAction: isEditable,
            deleteAction: isEditable && isLast,
            generateAction: isEditable,
            previewAction: true,
        };
    };

    // Check if contract is terminated
    const isTerminated = contractStatus?.toLowerCase() === 'terminated';

    const handleCreateIPC = () => {
        if (isTerminated) return;
        navigate('/dashboard/IPCs-database/new', {
            state: {
                preselectedContractId: contractId,
                skipStep1: true,
                returnTo: `/dashboard/contracts/details/${contractIdentifier}`,
                returnTab: 'ipcs'
            }
        });
    };

    const handlePreviewIPC = async (ipcId: number, status: string, isGenerated: boolean) => {
        setLoadingPreview(true);
        try {
            const response = await smartPreviewIpc(ipcId, status, isGenerated);

            if (response.success && response.blob) {
                setPreviewData({
                    blob: response.blob,
                    fileName: contractNumber
                        ? generateIPCFileName({ contract: contractNumber, number: ipcs.find(i => i.id === ipcId)?.number || 1 }, 'pdf')
                        : `IPC_${ipcId}.pdf`,
                });
                setShowPreview(true);
            } else {
                toaster.error("Failed to load IPC preview");
            }
        } catch (error) {
            toaster.error("Error loading IPC preview");
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleDownloadExcel = async (ipcId: number, status: string, isGenerated: boolean) => {
        try {
            const response = await smartDownloadIpcExcel(ipcId, status, isGenerated);

            if (response.success && response.blob) {
                const url = window.URL.createObjectURL(response.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = contractNumber
                    ? generateIPCFileName({ contract: contractNumber, number: ipcs.find(i => i.id === ipcId)?.number || 1 }, 'xlsx')
                    : `IPC_${ipcId}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("IPC exported as Excel successfully!");
            } else {
                toaster.error("Failed to export IPC as Excel");
            }
        } catch (error) {
            toaster.error("Error exporting IPC as Excel");
        }
    };

    const handleEditIPC = (ipcId: number) => {
        navigate(`/dashboard/IPCs-database/edit/${ipcId}`, {
            state: {
                returnTo: `/dashboard/contracts/details/${contractIdentifier}`,
                returnTab: 'ipcs'
            }
        });
    };

    const handleViewDetails = (ipcId: number) => {
        navigate(`/dashboard/IPCs-database/details/${ipcId}`, {
            state: {
                returnTo: `/dashboard/contracts/details/${contractIdentifier}`,
                returnTab: 'ipcs'
            }
        });
    };

    const handleGenerateIPC = async (ipcId: number) => {
        setGeneratingIpcId(ipcId);
        try {
            const response = await generateIpc(ipcId);
            if (response.success) {
                toaster.success("IPC generated successfully!");
            } else {
                toaster.error(response.error || "Failed to generate IPC");
            }
        } catch (error) {
            toaster.error("Error generating IPC");
        } finally {
            setGeneratingIpcId(null);
        }
    };

    const handleDeleteIPC = async (ipcId: number) => {
        if (!window.confirm("Are you sure you want to delete this IPC?")) {
            return;
        }

        setDeletingIpcId(ipcId);
        try {
            const response = await deleteIpc(ipcId);
            if (response.success) {
                toaster.success("IPC deleted successfully!");
            } else {
                toaster.error(response.error || "Failed to delete IPC");
            }
        } catch (error) {
            toaster.error("Error deleting IPC");
        } finally {
            setDeletingIpcId(null);
        }
    };

    const handleTableAction = (type: string, data: any) => {
        const ipcId = data.id;
        const status = data._statusRaw || data.status;
        const isGenerated = data.isGenerated || status?.toLowerCase().includes('issued');

        switch (type) {
            case "Preview":
                handlePreviewIPC(ipcId, status, isGenerated);
                break;
            case "Edit":
                handleEditIPC(ipcId);
                break;
            case "Details":
                handleViewDetails(ipcId);
                break;
            case "Generate":
                handleGenerateIPC(ipcId);
                break;
            case "Delete":
                handleDeleteIPC(ipcId);
                break;
            case "Export":
                handleDownloadExcel(ipcId, status, isGenerated);
                break;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="card bg-base-100 border-base-300 border shadow-sm flex-1 flex flex-col min-h-0">
                <div className="card-body flex flex-col min-h-0 p-4">
                    <div className="mb-4 flex items-center justify-between flex-shrink-0">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--receipt size-5 text-blue-600"></span>
                            Interim Payment Certificates
                        </h3>
                        <button
                            onClick={handleCreateIPC}
                            className="btn btn-primary btn-sm"
                            disabled={isTerminated}
                            title={isTerminated ? "Cannot create IPC for terminated contract" : undefined}
                        >
                            <span className="iconify lucide--plus size-4"></span>
                            <span>Create IPC</span>
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden">
                        {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader
                                icon="receipt"
                                subtitle="Loading: Payment Certificates"
                                description="Preparing IPC data..."
                                size="md"
                            />
                        </div>
                    ) : ipcs.length > 0 ? (
                        <SAMTable
                        columns={columns}
                        tableData={ipcs}
                        actions
                        previewAction
                        editAction
                        exportAction
                        deleteAction
                        generateAction
                        rowActions={handleRowActions}
                        title=""
                        loading={false}
                        onSuccess={fetchIPCs}
                        openStaticDialog={(type, data) => handleTableAction(type, data)}
                        dynamicDialog={false}
                        virtualized={true}
                        rowHeight={40}
                        overscan={10}
                    />
                    ) : (
                        <div className="py-12 text-center">
                            <span className="iconify lucide--receipt text-base-content/30 mx-auto mb-3 size-12"></span>
                            <p className="text-base-content/70">
                                {isTerminated
                                    ? "No IPCs found. Cannot create IPCs for terminated contracts."
                                    : "No IPCs found for this contract"}
                            </p>
                            {!isTerminated && (
                                <button onClick={handleCreateIPC} className="btn btn-primary btn-sm mt-4">
                                    <span className="iconify lucide--plus size-4"></span>
                                    <span>Create First IPC</span>
                                </button>
                            )}
                        </div>
                    )}
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && previewData && (
                <dialog className="modal modal-open">
                    <div className="modal-box h-[90vh] max-w-7xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">IPC Preview</h3>
                            <button onClick={handleClosePreview} className="btn btn-ghost btn-sm">
                                <span className="iconify lucide--x size-5"></span>
                            </button>
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

            {/* Loading Preview Overlay */}
            {loadingPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-base-100 p-6 rounded-lg">
                        <Loader
                            icon="eye"
                            subtitle="Loading: Preview"
                            description="Generating document preview..."
                            height="auto"
                            minHeight="auto"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default IPCsTab;
