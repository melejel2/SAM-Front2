import React, { useState, useCallback, useEffect } from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';
import { livePreviewVoPdf, transformFormDataToVoDataset } from '@/api/services/vo-api';
import PDFViewer from '@/components/ExcelPreview/PDFViewer';
import { Loader } from '@/components/Loader';
import useToast from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';

/**
 * VOStep3_ReviewPreview - Document Preview Step
 *
 * Auto-loads and displays a live PDF preview of the VO document
 * This is the final step before submission
 */
export const VOStep3_ReviewPreview: React.FC = () => {
    const { formData, contractData, voDatasetId } = useContractVOWizardContext();
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generatePreview = useCallback(async () => {
        if (!contractData) {
            setError("Contract data not loaded for preview.");
            return;
        }
        setLoadingPreview(true);
        setError(null);
        try {
            const voDatasetPayload = transformFormDataToVoDataset(formData, contractData, voDatasetId);
            const response = await livePreviewVoPdf(voDatasetPayload, getToken() || '');
            setPdfBlob(response);
        } catch (err) {
            console.error("Error generating live preview PDF:", err);
            setError("Failed to generate document preview. Please try again.");
            setPdfBlob(null);
        } finally {
            setLoadingPreview(false);
        }
    }, [formData, contractData, voDatasetId, getToken]);

    // Auto-load preview when component mounts
    useEffect(() => {
        generatePreview();
    }, []);

    return (
        <div className="bg-base-100 rounded-lg border border-base-300 h-[calc(100vh-220px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-300">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                        <span className="iconify lucide--file-text text-purple-600 dark:text-purple-400 size-5"></span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-base-content">Document Preview</h3>
                        <p className="text-sm text-base-content/60">{formData.voNumber} - {formData.voType}</p>
                    </div>
                </div>
                <button
                    onClick={generatePreview}
                    disabled={loadingPreview}
                    className="btn btn-sm btn-ghost"
                    title="Refresh preview"
                >
                    {loadingPreview ? (
                        <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                        <span className="iconify lucide--refresh-cw size-4"></span>
                    )}
                </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-hidden">
                {loadingPreview && (
                    <div className="flex flex-col justify-center items-center h-full">
                        <Loader />
                        <p className="mt-4 text-base-content/60">Generating document preview...</p>
                    </div>
                )}

                {!loadingPreview && error && (
                    <div className="flex flex-col justify-center items-center h-full">
                        <span className="iconify lucide--alert-circle text-error size-12 mb-4"></span>
                        <p className="text-error mb-4">{error}</p>
                        <button onClick={generatePreview} className="btn btn-sm btn-primary">
                            <span className="iconify lucide--refresh-cw size-4"></span>
                            Try Again
                        </button>
                    </div>
                )}

                {!loadingPreview && !error && pdfBlob && (
                    <PDFViewer fileBlob={pdfBlob} fileName="vo_preview.pdf" />
                )}

                {!loadingPreview && !error && !pdfBlob && (
                    <div className="flex flex-col justify-center items-center h-full">
                        <span className="iconify lucide--file-x text-base-content/40 size-12 mb-4"></span>
                        <p className="text-base-content/60">No preview available</p>
                    </div>
                )}
            </div>
        </div>
    );
};
