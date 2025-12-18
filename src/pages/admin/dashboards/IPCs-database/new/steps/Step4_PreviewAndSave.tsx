import React, { useState, useEffect } from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import { ipcApiService } from "@/api/services/ipc-api";
import { useAuth } from "@/contexts/auth";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import { generateIPCFileName } from "@/utils/ipc-filename";

export const Step4_PreviewAndSave: React.FC = () => {
    const { formData } = useIPCWizardContext();
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);

    // Detect if we're in Edit mode
    const isEditMode = (formData as any).id && (formData as any).id > 0;

    useEffect(() => {
        const fetchPreview = async () => {
            const token = getToken();
            if (!token) {
                setError("Authentication token not found.");
                setLoading(false);
                return;
            }

            try {
                const result = await ipcApiService.livePreviewIpcPdf(formData as any, token);
                if (result.success && result.blob) {
                    setPdfBlob(result.blob);
                } else {
                    setError(result.error || "Failed to load PDF preview.");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [formData, getToken]);

    const handleExportPDF = async () => {
        if (exportingPDF || exportingExcel) return;

        setExportingPDF(true);
        try {
            const token = getToken();
            if (!token) {
                toaster.error("Authentication token not found.");
                setExportingPDF(false);
                return;
            }

            const result = await ipcApiService.livePreviewIpcPdf(formData as any, token);

            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = generateIPCFileName(formData, 'pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("IPC exported as PDF successfully!");
            } else {
                toaster.error(result.error || "Failed to export IPC as PDF");
            }
        } catch (error) {
            console.error("PDF Export error:", error);
            toaster.error("PDF Export error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setExportingPDF(false);
        }
    };

    const handleExportExcel = async () => {
        if (exportingPDF || exportingExcel) return;

        setExportingExcel(true);
        try {
            const token = getToken();
            if (!token) {
                toaster.error("Authentication token not found.");
                setExportingExcel(false);
                return;
            }

            const result = await ipcApiService.livePreviewIpcExcel(formData as any, token);

            if (result.success && result.blob) {
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = generateIPCFileName(formData, 'xlsx');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toaster.success("IPC exported as Excel successfully!");
            } else {
                toaster.error(result.error || "Failed to export IPC as Excel");
            }
        } catch (error) {
            console.error("Excel Export error:", error);
            toaster.error("Excel Export error: " + (error instanceof Error ? error.message : "Unknown error"));
        } finally {
            setExportingExcel(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                        <span className="iconify lucide--eye text-blue-600 dark:text-blue-400 size-5"></span>
                    </div>

                </div>

                {/* Export Dropdown */}
                <div className="dropdown dropdown-end">
                    <button
                        tabIndex={0}
                        className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border"
                        disabled={exportingPDF || exportingExcel || loading}>
                        {exportingPDF || exportingExcel ? (
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
                        className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow">
                        <li>
                            <a onClick={handleExportPDF}>
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
                            <a onClick={handleExportExcel}>
                                {exportingExcel ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Exporting Excel...</span>
                                    </>
                                ) : (
                                    <span>Export as Excel</span>
                                )}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="h-[600px] border rounded-lg overflow-hidden">
                {loading && (
                    <div className="flex items-center justify-center h-full">
                        <Loader />
                        <p className="ml-4">Generating PDF preview...</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-red-500">{error}</p>
                    </div>
                )}
                {pdfBlob && (
                    <PDFViewer fileBlob={pdfBlob} fileName="ipc-preview.pdf" />
                )}
            </div>

            {/* Note: Submit button is in the page header (both Create and Edit modes) */}
        </div>
    );
};
