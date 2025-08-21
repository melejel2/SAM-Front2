import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import apiRequest from '@/api/api';
import PDFViewer from '@/components/ExcelPreview/PDFViewer';
import useToast from '@/hooks/use-toast';

interface PreviewStepProps {
    formData: any;
    selectedProject: any;
    selectedSubcontractor: any;
    contractId?: number; // For edit mode
}

const PreviewStep: React.FC<PreviewStepProps> = ({ 
    formData, 
    selectedProject, 
    selectedSubcontractor,
    contractId 
}) => {
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingWord, setExportingWord] = useState(false);
    
    const { getToken } = useAuth();
    const { toaster } = useToast();

    useEffect(() => {
        if (contractId) {
            // For edit mode, preview existing contract
            loadContractPreview();
        } else {
            // For new mode, we would need to create a temporary preview
            // This might require a backend endpoint to generate preview from form data
            toaster.info('Preview functionality for new contracts will be available after saving');
        }
    }, [contractId]);

    const loadContractPreview = async () => {
        if (!contractId) return;

        setLoading(true);
        try {
            const token = getToken();
            
            console.log('Loading contract data for ID:', contractId);
            
            // First get the contract data
            const contractResponse = await apiRequest({
                endpoint: `ContractsDatasets/GetSubcontractorData/${contractId}`,
                method: "GET",
                token: token ?? "",
            });

            console.log('Contract data response:', contractResponse);

            if (contractResponse && contractResponse.success !== false) {
                console.log('Generating PDF preview...');
                
                // Then use the contract data to generate PDF preview
                const livePreviewResponse = await apiRequest({
                    endpoint: "ContractsDatasets/LivePreviewPdf",
                    method: "POST",
                    token: token ?? "",
                    body: contractResponse,
                    responseType: "blob",
                });

                console.log('PDF response type:', typeof livePreviewResponse);
                console.log('PDF response size:', livePreviewResponse instanceof Blob ? livePreviewResponse.size : 'Not a blob');

                if (livePreviewResponse && livePreviewResponse instanceof Blob && livePreviewResponse.size > 0) {
                    const fileName = `contract-${contractId}-preview.pdf`;
                    setPreviewData({ blob: livePreviewResponse, fileName });
                    console.log('PDF preview loaded successfully');
                } else {
                    console.error('Invalid PDF response:', livePreviewResponse);
                    toaster.error('Failed to generate PDF preview');
                }
            } else {
                console.error('Contract data not found or invalid:', contractResponse);
                toaster.error('Contract data not found');
            }
        } catch (error) {
            console.error('Preview error:', error);
            toaster.error('Failed to load contract preview');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        if (!contractId) {
            toaster.error('No contract available for download');
            return;
        }

        setExportingPdf(true);
        try {
            const token = getToken();
            
            // First get the contract data
            const contractResponse = await apiRequest({
                endpoint: `ContractsDatasets/GetSubcontractorData/${contractId}`,
                method: "GET",
                token: token ?? "",
            });

            if (contractResponse && contractResponse.success !== false) {
                // Then use the contract data to generate PDF
                const livePreviewResponse = await apiRequest({
                    endpoint: "ContractsDatasets/LivePreviewPdf",
                    method: "POST",
                    token: token ?? "",
                    body: contractResponse,
                    responseType: "blob",
                });

                if (livePreviewResponse && livePreviewResponse instanceof Blob) {
                    const fileName = `contract-${contractId}-${selectedProject?.name || 'document'}.pdf`;
                    const url = window.URL.createObjectURL(livePreviewResponse);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    toaster.success('PDF downloaded successfully');
                } else {
                    toaster.error('Failed to download PDF');
                }
            } else {
                toaster.error('Contract data not found');
            }
        } catch (error) {
            console.error('PDF download error:', error);
            toaster.error('Failed to download PDF');
        } finally {
            setExportingPdf(false);
        }
    };

    const downloadWord = async () => {
        if (!contractId) {
            toaster.error('No contract available for download');
            return;
        }

        setExportingWord(true);
        try {
            const token = getToken();
            
            // First get the contract data
            const contractResponse = await apiRequest({
                endpoint: `ContractsDatasets/GetSubcontractorData/${contractId}`,
                method: "GET",
                token: token ?? "",
            });

            if (contractResponse && contractResponse.success !== false) {
                // Then use the contract data to generate Word document
                const livePreviewResponse = await apiRequest({
                    endpoint: "ContractsDatasets/LivePreview",
                    method: "POST",
                    token: token ?? "",
                    body: contractResponse,
                    responseType: "blob",
                });

                if (livePreviewResponse && livePreviewResponse instanceof Blob) {
                    const fileName = `contract-${contractId}-${selectedProject?.name || 'document'}.docx`;
                    const url = window.URL.createObjectURL(livePreviewResponse);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    toaster.success('Word document downloaded successfully');
                } else {
                    toaster.error('Failed to download Word document');
                }
            } else {
                toaster.error('Contract data not found');
            }
        } catch (error) {
            console.error('Word download error:', error);
            toaster.error('Failed to download Word document');
        } finally {
            setExportingWord(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="text-base-content/70">Loading contract preview...</p>
                </div>
            </div>
        );
    }

    if (!contractId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-base-content/70 mb-4">
                        <span className="iconify lucide--file-text size-16 mx-auto mb-4 block"></span>
                        <h3 className="text-lg font-semibold mb-2">Contract Preview</h3>
                        <p>Preview will be available after saving the contract.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!previewData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-base-content/70 mb-4">
                        <span className="iconify lucide--alert-circle size-16 mx-auto mb-4 block"></span>
                        <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                        <p>Unable to load contract preview.</p>
                        <button 
                            className="btn btn-primary btn-sm mt-4"
                            onClick={loadContractPreview}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header - matching main page style */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                    <span className="iconify lucide--file-text text-error size-5"></span>
                </div>
                <div>
                    <h3 className="font-semibold text-base-content">PDF Preview</h3>
                    <p className="text-sm text-base-content/60">
                        {previewData?.fileName} • Contract #{contractId}
                    </p>
                </div>
                <div className="ml-auto flex gap-2">
                    <button
                        className="btn btn-sm bg-base-200 text-base-content hover:bg-base-300 transition-all duration-200 ease-in-out flex items-center gap-2"
                        onClick={downloadPDF}
                        disabled={exportingPdf}
                    >
                        {exportingPdf ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Downloading...
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--download size-4"></span>
                                PDF
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-sm bg-base-200 text-base-content hover:bg-base-300 transition-all duration-200 ease-in-out flex items-center gap-2"
                        onClick={downloadWord}
                        disabled={exportingWord}
                    >
                        {exportingWord ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Downloading...
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--download size-4"></span>
                                Word
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {/* Contract Preview Content - matching main page style */}
            <div className="bg-base-100 border border-base-300 rounded-lg shadow-sm">
                <div className="h-[calc(100vh-200px)]">
                    {previewData && (
                        <PDFViewer
                            fileBlob={previewData.blob}
                            fileName={previewData.fileName}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewStep;