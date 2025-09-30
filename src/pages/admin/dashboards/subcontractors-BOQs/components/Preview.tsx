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
    const [error, setError] = useState<string | null>(null);
    
    const { getToken } = useAuth();
    const { toaster } = useToast();

    useEffect(() => {
        if (contractId) {
            // For edit mode, preview existing contract
            loadContractPreview();
        } else {
            // For new mode, generate live preview from form data
            generateLivePreview();
        }
    }, [contractId, formData]);

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
                console.log('Contract ContractId:', contractResponse.contractId);
                
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

                // Check if the response is an error object (from 400+ HTTP status)
                if (livePreviewResponse && typeof livePreviewResponse === 'object' && !(livePreviewResponse instanceof Blob)) {
                    const errorObj = livePreviewResponse as any;
                    if (errorObj.success === false || errorObj.isSuccess === false) {
                        const errorMessage = errorObj.message || errorObj.error || 'Failed to generate PDF preview';
                        console.error('Live preview error:', errorMessage);
                        setError(errorMessage);
                        return;
                    }
                }

                if (livePreviewResponse && livePreviewResponse instanceof Blob && livePreviewResponse.size > 0) {
                    const fileName = `contract-${formData.contractNumber || contractId}-preview.pdf`;
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

    const generateLivePreview = async () => {
        console.log('🔄 [Live Preview] Starting live preview generation');
        
        if (!formData || !selectedProject || !selectedSubcontractor) {
            console.warn('⚠️ [Live Preview] Missing basic dependencies:', {
                hasFormData: !!formData,
                hasSelectedProject: !!selectedProject,
                hasSelectedSubcontractor: !!selectedSubcontractor
            });
            return;
        }

        // Validate required fields for preview
        if (!formData.contractId || !formData.currencyId || !formData.projectId || !formData.subcontractorId) {
            console.error('❌ [Live Preview] Missing required data for live preview:', {
                contractId: formData.contractId,
                currencyId: formData.currencyId,
                projectId: formData.projectId,
                subcontractorId: formData.subcontractorId
            });
            return;
        }

        setLoading(true);
        try {
            const token = getToken();

            // Build SubcontractorBoqVM exactly like working WizardContext save operation
            const previewModel = {
                id: 0,
                currencyId: formData.currencyId!,
                projectId: formData.projectId!,
                subContractorId: formData.subcontractorId!,
                contractId: formData.contractId!,
                contractDate: formData.contractDate || "",
                completionDate: formData.completionDate || "",
                advancePayment: formData.advancePayment || 0,
                materialSupply: formData.materialSupply || 0,
                purchaseIncrease: formData.purchaseIncrease || "",
                latePenalties: formData.latePenalties || "",
                latePenaliteCeiling: formData.latePenalityCeiling || "",
                holdWarranty: formData.holdWarranty || "",
                mintenancePeriod: formData.mintenancePeriod || "",
                workWarranty: formData.workWarranty || "",
                termination: formData.termination || "",
                daysNumber: formData.daysNumber || "",
                progress: formData.progress || "",
                holdBack: formData.holdBack || "",
                subcontractorAdvancePayee: formData.subcontractorAdvancePayee || "",
                recoverAdvance: formData.recoverAdvance || "",
                procurementConstruction: formData.procurementConstruction || "",
                prorataAccount: formData.prorataAccount || "",
                managementFees: formData.managementFees || "",
                plansExecution: formData.plansExecution || "",
                subTrade: formData.subTrade || "",
                paymentsTerm: formData.paymentsTerm || "",
                contractNumber: formData.contractNumber || "",
                remark: formData.remark || "",
                remarkCP: formData.remarkCP || "",
                contractDatasetStatus: "Editable",
                isGenerated: false,
                buildings: formData.boqData.map((building: any) => ({
                    id: building.buildingId, // Use actual building ID from selected building
                    buildingName: building.buildingName,
                    sheetId: 0,
                    sheetName: building.sheetName || "", // Use empty string if no sheet specified
                    replaceAllItems: true,
                    boqsContract: building.items.map((item: any) => ({
                        id: 0, // Use 0 for preview (not saving to DB, just generating document)
                        no: item.no,
                        key: item.key,
                        unite: item.unite,
                        qte: item.qte,
                        pu: item.pu,
                        costCode: item.costCode || '',
                        costCodeId: null,
                        boqtype: "Subcontractor",
                        boqSheetId: 0,
                        sheetName: building.sheetName || "", // Use empty string if no sheet specified
                        orderBoq: 0,
                        totalPrice: item.qte * item.pu
                    }))
                }))
            };

            
            // Generate PDF preview using live preview endpoint
            const livePreviewResponse = await apiRequest({
                endpoint: "ContractsDatasets/LivePreviewPdf",
                method: "POST",
                token: token ?? "",
                body: previewModel,
                responseType: "blob",
            });


            // Check if the response is an error object (from 400+ HTTP status)
            if (livePreviewResponse && typeof livePreviewResponse === 'object' && !(livePreviewResponse instanceof Blob)) {
                const errorObj = livePreviewResponse as any;
                if (errorObj.success === false || errorObj.isSuccess === false) {
                    const errorMessage = errorObj.message || errorObj.error || 'Unknown backend error';
                    toaster.error(`Backend error: ${errorMessage}`);
                    return;
                }
            }

            if (livePreviewResponse && livePreviewResponse instanceof Blob && livePreviewResponse.size > 0) {
                const fileName = `contract-preview-${selectedProject.name || 'document'}.pdf`;
                setPreviewData({ blob: livePreviewResponse, fileName });
            } else {
                toaster.error('Failed to generate preview - invalid response from server');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            toaster.error(`Failed to generate live preview: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        if (!contractId && (!formData || !selectedProject || !selectedSubcontractor)) {
            toaster.error('No contract available for download');
            return;
        }

        setExportingPdf(true);
        try {
            const token = getToken();
            let pdfBlob: Blob | null = null;
            let fileName: string = 'contract.pdf';

            if (contractId) {
                // For saved contracts, get contract data and generate PDF
                const contractResponse = await apiRequest({
                    endpoint: `ContractsDatasets/GetSubcontractorData/${contractId}`,
                    method: "GET",
                    token: token ?? "",
                });

                if (contractResponse && contractResponse.success !== false) {
                    const livePreviewResponse = await apiRequest({
                        endpoint: "ContractsDatasets/LivePreviewPdf",
                        method: "POST",
                        token: token ?? "",
                        body: contractResponse,
                        responseType: "blob",
                    });

                    if (livePreviewResponse && livePreviewResponse instanceof Blob) {
                        pdfBlob = livePreviewResponse;
                        fileName = `contract-${formData.contractNumber || contractId}-${selectedProject?.name || 'document'}.pdf`;
                    }
                }
            } else {
                // For new contracts, use current preview data
                if (previewData && previewData.blob) {
                    pdfBlob = previewData.blob;
                    fileName = previewData.fileName;
                } else {
                    toaster.error('No preview available for download');
                    return;
                }
            }

            if (pdfBlob) {
                const url = window.URL.createObjectURL(pdfBlob);
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
        } catch (error) {
            console.error('PDF download error:', error);
            toaster.error('Failed to download PDF');
        } finally {
            setExportingPdf(false);
        }
    };

    const downloadWord = async () => {
        if (!contractId && (!formData || !selectedProject || !selectedSubcontractor)) {
            toaster.error('No contract available for download');
            return;
        }

        setExportingWord(true);
        try {
            const token = getToken();
            let previewModel: any = null;

            if (contractId) {
                // For saved contracts, get contract data (same as PDF)
                const contractResponse = await apiRequest({
                    endpoint: `ContractsDatasets/GetSubcontractorData/${contractId}`,
                    method: "GET",
                    token: token ?? "",
                });
                if (contractResponse && contractResponse.success !== false) {
                    previewModel = contractResponse;
                }
            } else {
                // For new contracts, build model from form data
                if (!formData.contractId || !formData.currencyId || !formData.projectId || !formData.subcontractorId) {
                    toaster.error('Missing required data for Word export');
                    return;
                }

                // For new contracts, get actual building IDs from backend
                const buildingsResponse = await apiRequest({
                    endpoint: `Building/GetBuildingsList?projectId=${formData.projectId}`,
                    method: "GET", 
                    token: token ?? "",
                });

                let buildingsWithIds = formData.boqData;
                if (buildingsResponse && Array.isArray(buildingsResponse)) {
                    // Map form data buildings to actual database building IDs
                    buildingsWithIds = formData.boqData?.map((building: any) => {
                        const dbBuilding = buildingsResponse.find((b: any) => 
                            b.buildingName === building.buildingName || b.name === building.buildingName
                        );
                        return {
                            ...building,
                            id: dbBuilding?.id || building.id || 0,
                        };
                    });
                }

                previewModel = {
                    id: 0,
                    currencyId: formData.currencyId,
                    projectId: formData.projectId,
                    subContractorId: formData.subcontractorId,
                    contractId: formData.contractId,
                    contractDate: formData.contractDate,
                    completionDate: formData.completionDate,
                    advancePayment: formData.advancePayment || 0,
                    materialSupply: formData.materialSupply || 0,
                    purchaseIncrease: formData.purchaseIncrease || '',
                    latePenalties: formData.latePenalties || '',
                    latePenaliteCeiling: formData.latePenaliteCeiling || '',
                    holdWarranty: formData.holdWarranty || '',
                    mintenancePeriod: formData.mintenancePeriod || '',
                    workWarranty: formData.workWarranty || '',
                    termination: formData.termination || '',
                    daysNumber: formData.daysNumber || '',
                    progress: formData.progress || '',
                    holdBack: formData.holdBack || '',
                    subcontractorAdvancePayee: formData.subcontractorAdvancePayee || '',
                    recoverAdvance: formData.recoverAdvance || '',
                    procurementConstruction: formData.procurementConstruction || '',
                    prorataAccount: formData.prorataAccount || '',
                    managementFees: formData.managementFees || '',
                    plansExecution: formData.plansExecution || '',
                    subTrade: formData.subTrade || '',
                    paymentsTerm: formData.paymentsTerm || '',
                    contractNumber: formData.contractNumber || '',
                    remark: formData.remark || '',
                    remarkCP: formData.remarkCP || '',
                    contractDatasetStatus: "Editable",
                    isGenerated: false,
                    buildings: buildingsWithIds?.map((building: any) => ({
                        id: building.id,  // Use actual building ID from database
                        buildingName: building.buildingName,
                        sheetId: building.sheetId || 0,
                        sheetName: building.sheetName || "", 
                        replaceAllItems: true,
                        boqsContract: building.items?.map((item: any) => ({
                            id: Math.floor(item.id || 0),
                            no: item.no,
                            key: item.key,
                            unite: item.unite,
                            qte: item.qte,
                            pu: item.pu,
                            costCode: item.costCode || '',
                            costCodeId: null,
                            boqtype: "Subcontractor",
                            boqSheetId: 0,
                            sheetName: building.sheetName || "", // Use empty string if no sheet specified
                            orderBoq: 0
                        })) || []
                    })) || []
                };
            }

            if (previewModel) {
                // Generate Word document using LivePreviewWord endpoint
                const livePreviewResponse = await apiRequest({
                    endpoint: "ContractsDatasets/LivePreviewWord",
                    method: "POST",
                    token: token ?? "",
                    body: previewModel,
                    responseType: "blob",
                });

                // Check if the response is an error object (from 500+ HTTP status)
                if (livePreviewResponse && typeof livePreviewResponse === 'object' && !(livePreviewResponse instanceof Blob)) {
                    const errorObj = livePreviewResponse as any;
                    if (errorObj.success === false || errorObj.isSuccess === false) {
                        const errorMessage = errorObj.message || 'Server error occurred while generating Word document';
                        toaster.error(errorMessage);
                        return;
                    }
                }

                if (livePreviewResponse && livePreviewResponse instanceof Blob) {
                    const fileName = contractId 
                        ? `contract-${formData.contractNumber || contractId}-${selectedProject?.name || 'document'}.docx`
                        : `contract-preview-${selectedProject?.name || 'document'}.docx`;
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
                    toaster.error('Failed to download Word document - invalid response from server');
                }
            } else {
                toaster.error('Contract data not found');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
            toaster.error(`Failed to download Word document: ${errorMessage}`);
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

    // Remove the contractId check since we now support live preview for new contracts

    if (!previewData) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-base-content/70 mb-4">
                        <span className="iconify lucide--alert-circle size-16 mx-auto mb-4 block"></span>
                        <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                        <p>{error || 'Unable to load contract preview.'}</p>
                        <button 
                            className="btn btn-primary btn-sm mt-4"
                            onClick={contractId ? loadContractPreview : generateLivePreview}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header - PDF Preview with download buttons */}
            <div className="flex items-center gap-4 mb-4 flex-shrink-0">
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                    <span className="iconify lucide--file-text text-error size-5"></span>
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-base-content">PDF Preview</h3>
                    <p className="text-sm text-base-content/60">
                        {previewData?.fileName}
                    </p>
                </div>
                <div className="flex gap-2">
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
            
            {/* PDF Viewer Container - takes remaining space */}
            <div className="flex-1 min-h-0 bg-base-200 border border-base-300 rounded-lg overflow-hidden">
                {previewData && (
                    <PDFViewer
                        fileBlob={previewData.blob}
                        fileName={previewData.fileName}
                    />
                )}
            </div>
        </div>
    );
};

export default PreviewStep;