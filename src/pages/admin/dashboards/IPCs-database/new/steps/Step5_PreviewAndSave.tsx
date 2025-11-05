import React, { useState, useEffect } from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import { ipcApiService } from "@/api/services/ipc-api";
import { useAuth } from "@/contexts/auth";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Loader } from "@/components/Loader";

export const Step5_PreviewAndSave: React.FC = () => {
    const { formData, handleSubmit } = useIPCWizardContext();
    const { getToken } = useAuth();
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                    <span className="iconify lucide--eye text-blue-600 dark:text-blue-400 size-5"></span>
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-base-content">Preview & Save IPC</h2>
                    <p className="text-sm text-base-content/70">Preview the generated IPC and save it.</p>
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

            <div className="flex justify-end">
                <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleSubmit}
                >
                    Create IPC
                </button>
            </div>
        </div>
    );
};