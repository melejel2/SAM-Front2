import { useState, useCallback, useMemo } from "react";

import {
    ContractType,
    generateFinalContract,
    generateRGContract,
    terminateContract,
    exportTerminatedContractFile,
    exportFinalDischargeFile,
    exportRGFile,
    previewContractFile,
} from "@/api/services/contracts-api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

interface TerminationDocsTabProps {
    contractId: number;
    contractNumber: string;
}

interface TerminationDocument {
    id: string;
    documentType: string;
    description: string;
    status: string;
    exportFormat: string;
    canExport: boolean;
    canGenerate: boolean;
    contractType: ContractType;
}

const TerminationDocsTab: React.FC<TerminationDocsTabProps> = ({
    contractId,
    contractNumber,
}) => {
    const { toaster } = useToast();
    const { getToken } = useAuth();
    const token = getToken();

    // Preview state
    const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string; type: string } | null>(null);

    // Export state
    const [exporting, setExporting] = useState<string | null>(null);

    // Generate state
    const [generating, setGenerating] = useState<string | null>(null);

    // Table columns for Spreadsheet
    const columns = useMemo((): SpreadsheetColumn<TerminationDocument>[] => [
        {
            key: "documentType",
            label: "Document Type",
            width: 180,
            align: "left",
            editable: false,
            sortable: false,
            filterable: false,
        },
        {
            key: "description",
            label: "Description",
            width: 280,
            align: "left",
            editable: false,
            sortable: false,
            filterable: false,
        },
        {
            key: "status",
            label: "Status",
            width: 120,
            align: "center",
            editable: false,
            sortable: false,
            filterable: false,
            render: (value) => {
                const statusLower = (value || "").toLowerCase();
                let badgeClass = "badge-info";
                if (statusLower === "available") badgeClass = "badge-success";
                else if (statusLower.includes("if")) badgeClass = "badge-warning";
                return <span className={`badge badge-sm ${badgeClass}`}>{value || "-"}</span>;
            },
        },
        {
            key: "exportFormat",
            label: "Export Format",
            width: 130,
            align: "center",
            editable: false,
            sortable: false,
            filterable: false,
        },
    ], []);

    // Build document rows
    const documents: TerminationDocument[] = useMemo(() => [
        {
            id: "contract",
            documentType: "Main Contract",
            description: "Original contract document",
            status: "Available",
            exportFormat: "-",
            canExport: false,
            canGenerate: false,
            contractType: ContractType.contract,
        },
        {
            id: "terminate",
            documentType: "Termination Letter",
            description: "Contract termination notification",
            status: "Available",
            exportFormat: "Word (.docx)",
            canExport: true,
            canGenerate: true,
            contractType: ContractType.Terminate,
        },
        {
            id: "final",
            documentType: "Final Discharge",
            description: "Final settlement document",
            status: "Available",
            exportFormat: "Word (.docx)",
            canExport: true,
            canGenerate: true,
            contractType: ContractType.Final,
        },
        {
            id: "rg",
            documentType: "RG Retention",
            description: "Retention guarantee document",
            status: "Available",
            exportFormat: "Word (.docx)",
            canExport: true,
            canGenerate: true,
            contractType: ContractType.RG,
        },
    ], []);

    // Close preview modal
    const handleClosePreview = useCallback(() => {
        setShowPreview(false);
        setTimeout(() => setPreviewData(null), 300);
    }, []);

    // Handle preview document
    const handlePreview = useCallback(async (doc: TerminationDocument) => {
        setLoadingPreview(doc.id);

        if (doc.contractType !== ContractType.contract) {
            toaster.info("Generating preview... This may take a moment for large documents.");
        }

        try {
            const blob = await previewContractFile(contractId, doc.contractType, token ?? "");
            if (blob && blob.size > 0) {
                setPreviewData({
                    blob,
                    fileName: `${contractNumber}_${doc.documentType.replace(/\s/g, '_')}.pdf`,
                    type: doc.documentType,
                });
                setShowPreview(true);
            } else {
                toaster.error(getDocumentNotFoundMessage(doc.contractType));
            }
        } catch {
            toaster.error(getDocumentNotFoundMessage(doc.contractType));
        } finally {
            setLoadingPreview(null);
        }
    }, [contractId, contractNumber, token, toaster]);

    // Get user-friendly error message for missing documents
    const getDocumentNotFoundMessage = (type: ContractType): string => {
        switch (type) {
            case ContractType.Terminate:
                return "Termination letter not found. Use 'Generate' to create it.";
            case ContractType.Final:
                return "Final discharge not found. Use 'Generate' to create it.";
            case ContractType.RG:
                return "RG document not found. This is created during IPC processing.";
            default:
                return "Document not found.";
        }
    };

    // Handle export document
    const handleExport = useCallback(async (doc: TerminationDocument) => {
        if (!doc.canExport) return;

        setExporting(doc.id);

        try {
            let blob: Blob;
            let fileName: string;

            if (doc.id === "terminate") {
                blob = await exportTerminatedContractFile(contractId, token ?? "");
                fileName = `Termination_${contractNumber}.docx`;
            } else if (doc.id === "final") {
                blob = await exportFinalDischargeFile(contractId, token ?? "");
                fileName = `FinalDischarge_${contractNumber}.docx`;
            } else if (doc.id === "rg") {
                blob = await exportRGFile(contractId, token ?? "");
                fileName = `RG_Retention_${contractNumber}.docx`;
            } else {
                return;
            }

            if (blob && blob.size > 0) {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toaster.success(`${doc.documentType} downloaded successfully`);
            } else {
                toaster.error(`Failed to download ${doc.documentType.toLowerCase()}`);
            }
        } catch {
            toaster.error(`${doc.documentType} not found. Please generate it first.`);
        } finally {
            setExporting(null);
        }
    }, [contractId, contractNumber, token, toaster]);

    // Handle generate/regenerate document
    const handleGenerate = useCallback(async (doc: TerminationDocument) => {
        if (!doc.canGenerate) return;

        setGenerating(doc.id);

        try {
            let result;

            if (doc.id === "terminate") {
                result = await terminateContract(contractId, token ?? "");
                if (result.success) {
                    toaster.success("Termination letter regenerated successfully");
                } else {
                    toaster.error(result.error || "Failed to regenerate termination letter");
                }
            } else if (doc.id === "final") {
                result = await generateFinalContract(contractId, token ?? "");
                if (result.success) {
                    toaster.success("Final discharge generated successfully");
                } else {
                    toaster.error(result.error || "Failed to generate final discharge");
                }
            } else if (doc.id === "rg") {
                result = await generateRGContract(contractId, token ?? "");
                if (result.success) {
                    toaster.success("RG retention document generated successfully");
                } else {
                    toaster.error(result.error || "Failed to generate RG retention document");
                }
            }
        } catch (error) {
            toaster.error(`Failed to generate ${doc.documentType.toLowerCase()}: ${(error as Error).message}`);
        } finally {
            setGenerating(null);
        }
    }, [contractId, token, toaster]);

    // Render actions column for Spreadsheet
    const renderTerminationActions = useCallback((row: TerminationDocument) => {
        const isPreviewLoading = loadingPreview === row.id;
        const isExporting = exporting === row.id;
        const isGenerating = generating === row.id;

        return (
            <div className="flex items-center gap-1">
                {/* Preview - always enabled */}
                <button
                    className="btn btn-ghost btn-xs text-info hover:bg-info/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(row);
                    }}
                    disabled={isPreviewLoading}
                    title="Preview"
                >
                    {isPreviewLoading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <span className="iconify lucide--eye size-4"></span>
                    )}
                </button>

                {/* Export - conditional based on canExport */}
                {row.canExport && (
                    <button
                        className="btn btn-ghost btn-xs text-success hover:bg-success/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleExport(row);
                        }}
                        disabled={isExporting}
                        title="Export"
                    >
                        {isExporting ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <span className="iconify lucide--download size-4"></span>
                        )}
                    </button>
                )}

                {/* Generate - conditional based on canGenerate */}
                {row.canGenerate && (
                    <button
                        className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleGenerate(row);
                        }}
                        disabled={isGenerating}
                        title="Generate/Regenerate"
                    >
                        {isGenerating ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <span className="iconify lucide--refresh-cw size-4"></span>
                        )}
                    </button>
                )}
            </div>
        );
    }, [loadingPreview, exporting, generating, handlePreview, handleExport, handleGenerate]);

    return (
        <div className="h-full flex flex-col">
            <div className="card bg-base-100 border-base-300 border shadow-sm flex-1 flex flex-col min-h-0">
                <div className="card-body flex flex-col min-h-0 p-4">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
                                <span className="iconify lucide--file-x text-red-600 dark:text-red-400 size-5"></span>
                            </div>
                            <div>
                                <h3 className="card-title text-base-content">Termination Documents</h3>
                                <p className="text-sm text-base-content/70">
                                    Preview, export, or regenerate termination-related documents
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 min-h-0 overflow-auto">
                        <Spreadsheet<TerminationDocument>
                            data={documents}
                            columns={columns}
                            mode="view"
                            loading={false}
                            rowHeight={40}
                            actionsRender={renderTerminationActions}
                            actionsColumnWidth={140}
                            getRowId={(row) => row.id}
                            allowKeyboardNavigation={false}
                            allowColumnResize
                            allowSorting={false}
                            allowFilters={false}
                            hideFormulaBar
                        />
                    </div>

                    {/* Note about RG documents */}
                    <div className="mt-4 p-3 bg-base-200 rounded-lg flex-shrink-0">
                        <p className="text-xs text-base-content/60">
                            <span className="iconify lucide--info size-3 inline mr-1"></span>
                            Note: RG Retention documents are also automatically generated during IPC processing. You can regenerate them here using the generate button.
                        </p>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && previewData && (
                <dialog className="modal modal-open">
                    <div className="modal-box max-w-7xl h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">
                                Preview: {previewData.type}
                            </h3>
                            <button
                                onClick={handleClosePreview}
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
                        <button onClick={handleClosePreview}>close</button>
                    </form>
                </dialog>
            )}
        </div>
    );
};

export default TerminationDocsTab;
