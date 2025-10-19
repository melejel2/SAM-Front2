import React, { useEffect, useState, useCallback } from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';
import { livePreviewVoPdf, transformFormDataToVoDataset } from '@/api/services/vo-api';
import PDFViewer from '@/components/ExcelPreview/PDFViewer';
import { Loader } from '@/components/Loader';
import useToast from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';

export const VOStep5_Preview: React.FC = () => {
    const { formData, contractData, voDatasetId } = useContractVOWizardContext();
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const generatePreview = useCallback(async () => {
        console.log("🔄 Generating preview...");
        if (!contractData) {
            toaster.error("Contract data not loaded for preview.");
            return;
        }
        setLoadingPreview(true);
        try {
            // Use the existing transformFormDataToVoDataset function
            const voDatasetPayload = transformFormDataToVoDataset(formData, contractData, voDatasetId);

            const response = await livePreviewVoPdf(voDatasetPayload, getToken() || '');
            setPdfBlob(response);
        } catch (error) {
            console.error("Error generating live preview PDF:", error);
            toaster.error("Failed to generate live preview PDF.");
            setPdfBlob(null);
        } finally {
            setLoadingPreview(false);
        }
    }, [JSON.stringify(formData), JSON.stringify(contractData), voDatasetId]); // Dependencies for useCallback

    useEffect(() => {
        generatePreview();
    }, [generatePreview]); // Dependency for useEffect is now the memoized generatePreview

    if (loadingPreview) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader />
                <p className="ml-2">Generating preview...</p>
            </div>
        );
    }

    if (!pdfBlob) {
        return (
            <div className="text-center p-8 text-error">
                <p>Failed to load PDF preview.</p>
            </div>
        );
    }

    return (
        <div className="h-[70vh]">
            <PDFViewer fileBlob={pdfBlob} fileName="vo_preview.pdf" />
        </div>
    );
};