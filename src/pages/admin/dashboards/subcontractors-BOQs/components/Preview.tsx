import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import apiRequest from "@/api/api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { Loader } from "@/components/Loader";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

interface PreviewStepProps {
    formData: any;
    selectedProject: any;
    selectedSubcontractor: any;
    contractId?: number; // For edit mode
    onLoadingChange?: (isLoading: boolean) => void; // Callback to notify parent of loading state
}

const PreviewStep: React.FC<PreviewStepProps> = ({ formData, selectedProject, selectedSubcontractor, contractId, onLoadingChange }) => {
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [loading, setLoading] = useState(true); // Start true since preview generates immediately
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isTemplateError, setIsTemplateError] = useState(false);

    const { getToken } = useAuth();
    const { toaster } = useToast();
    const navigate = useNavigate();

    // Notify parent when loading state changes
    useEffect(() => {
        onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

    useEffect(() => {
        // This effect decides whether to show a preview from saved data (on initial edit load)
        // or generate a preview from the live wizard state (on new, or after edits).
        const hasWizardData = selectedProject && formData.boqData && formData.boqData.length > 0;

        if (contractId && !hasWizardData) {
            // EDIT MODE (Initial Load): Wizard state is not yet populated. Fetch saved data for initial preview.
            loadInitialContractPreview();
        } else if (hasWizardData) {
            // NEW MODE or EDIT MODE (After Changes): Wizard state is populated. Use it for a live preview.
            generateLivePreview();
        }
    }, [contractId, formData.boqData, selectedProject]); // More specific dependency

    const buildContractModel = () => {
        if (!selectedProject || !selectedSubcontractor) {
            console.error("Preview Error: Project or Subcontractor is missing from props.");
            setError("Project or Subcontractor data is not available. Cannot generate preview.");
            return null;
        }

        if (!formData.boqData || !Array.isArray(formData.boqData)) {
            console.error("Preview Error: formData.boqData is missing or not an array.");
            setError("BOQ data is missing or invalid. Cannot generate preview.");
            return null;
        }
        const buildings = formData.boqData
            .map((building: any) => {
                if (!building || !building.items) {
                    console.error("Preview Error: Invalid building or items structure in boqData.", building);
                    return null;
                }
                return {
                    id: building.buildingId,
                    buildingName: building.buildingName,
                    sheetId: 0, // Let backend handle this, consistent with submit logic
                    sheetName: building.sheetName || "",
                    replaceAllItems: building.replaceAllItems || false,
                    boqsContract: building.items.map((item: any) => ({
                        id: item.id && item.id > 0 && item.id < 2147483647 ? item.id : 0,
                        no: item.no || item.nb,
                        key: item.key || item.item,
                        unite: item.unite || item.unit,
                        qte: parseFloat(item.qte || item.qty) || 0,
                        pu: parseFloat(item.pu || item.unit_price) || 0,
                        costCode: item.costCode || item.cost_code || "",
                        costCodeId: item.costCodeId ?? null,
                        boqtype: "Subcontractor",
                        boqSheetId: 0, // Let backend handle this
                        sheetName: building.sheetName || "",
                        orderBoq: parseInt(item.orderBoq || item.order) || 0,
                        totalPrice:
                            item.totalPrice != null
                                ? item.totalPrice
                                : (parseFloat(item.qte || item.qty) || 0) *
                                  (parseFloat(item.pu || item.unit_price) || 0),
                    })),
                };
            })
            .filter(Boolean); // Filter out any nulls from invalid building data

        if (buildings.length === 0 && formData.boqData.length > 0) {
            setError("Failed to process BOQ data. Cannot generate preview.");
            return null;
        }

        return {
            id: formData.id || 0,
            contractId: formData.contractId || 0,
            currencyId: formData.currencyId || 1,
            projectId: selectedProject.id,
            subContractorId: selectedSubcontractor.id,
            tradeId: formData.tradeId,
            contractDate: formData.contractDate || new Date().toISOString(),
            completionDate: formData.completionDate || new Date().toISOString(),
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
            vat: formData.vat || 0, // VAT/Tax percentage for BOQ calculations
            contractDatasetStatus: "Editable",
            isGenerated: false,
            buildings: buildings,
            remark: formData.remark || "",
            remarkCP: formData.remarkCP || "",
        };
    };

    const loadInitialContractPreview = async () => {
        if (!contractId) return;

        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            const previewModel = buildContractModel();

            if (!previewModel) {
                // Error is already set by buildContractModel
                setLoading(false);
                return;
            }

            const livePreviewResponse = await apiRequest({
                endpoint: "ContractsDatasets/LivePreviewPdf",
                method: "POST",
                token: token ?? "",
                body: previewModel,
                responseType: "blob",
            });

            if (livePreviewResponse && livePreviewResponse instanceof Blob && livePreviewResponse.size > 0) {
                const fileName = `contract-${contractId}-preview.pdf`;
                setPreviewData({ blob: livePreviewResponse, fileName });
            } else {
                throw new Error("Invalid PDF response from server.");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to load initial contract preview.";

            // Check if this is a template upload error
            if (errorMessage.includes("does not have a Word document uploaded") ||
                errorMessage.includes("upload a template document")) {
                setError(errorMessage);
                setIsTemplateError(true);
                toaster.error(`Template Upload Required: ${errorMessage}`);
            } else {
                setError(errorMessage);
                setIsTemplateError(false);
                toaster.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const generateLivePreview = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            const previewModel = buildContractModel();

            if (!previewModel) {
                setLoading(false);
                return;
            }

            const livePreviewResponse = await apiRequest({
                endpoint: "ContractsDatasets/LivePreviewPdf",
                method: "POST",
                token: token ?? "",
                body: previewModel,
                responseType: "blob",
            });

            if (livePreviewResponse && livePreviewResponse instanceof Blob && livePreviewResponse.size > 0) {
                const fileName = `contract-preview-${selectedProject.name || "document"}.pdf`;
                setPreviewData({ blob: livePreviewResponse, fileName });
            } else {
                const errorObj = livePreviewResponse as any;
                throw new Error(errorObj.message || "Failed to generate preview - invalid response from server.");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

            // Check if this is a template upload error
            if (errorMessage.includes("does not have a Word document uploaded") ||
                errorMessage.includes("upload a template document")) {
                setError(errorMessage);
                setIsTemplateError(true);
                toaster.error(`Template Upload Required: ${errorMessage}`);
            } else {
                setError(`Failed to generate live preview: ${errorMessage}`);
                setIsTemplateError(false);
                toaster.error(`Failed to generate live preview: ${errorMessage}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const exportContractPdf = () => {
        if (!previewData || !previewData.blob) {
            toaster.error("Cannot export: The PDF preview is not available.");
            return;
        }

        setExporting(true);

        try {
            const url = window.URL.createObjectURL(previewData.blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = previewData.fileName || "contract.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export PDF from blob:", error);
            toaster.error("An unexpected error occurred during the export.");
        } finally {
            // Set exporting to false after a short delay to allow the download to initiate
            // and provide visual feedback on the button.
            setTimeout(() => setExporting(false), 500);
        }
    };

    if (loading) {
        return (
            <Loader
                icon="file-text"
                subtitle="Loading: Contract Preview"
                description="Generating contract preview..."
            />
        );
    }

    if (!previewData) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center max-w-2xl px-4">
                    <div className="text-base-content/70 mb-4">
                        {isTemplateError ? (
                            <>
                                <span className="iconify lucide--file-warning mx-auto mb-4 block size-16 text-warning"></span>
                                <h3 className="mb-3 text-lg font-semibold text-base-content">Template Document Missing</h3>
                                <div className="bg-warning/10 border-warning/30 rounded-lg border p-4 mb-4 text-left">
                                    <p className="text-sm text-base-content/80 whitespace-pre-line">{error}</p>
                                </div>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        className="btn btn-warning btn-sm"
                                        onClick={() => navigate('/dashboard/admin-tools/templates')}
                                    >
                                        <span className="iconify lucide--upload size-4"></span>
                                        Go to Contracts Database
                                    </button>
                                    <button
                                        className="btn bg-base-200 text-base-content hover:bg-base-300 btn-sm"
                                        onClick={generateLivePreview}
                                    >
                                        <span className="iconify lucide--refresh-cw size-4"></span>
                                        Retry
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--alert-circle mx-auto mb-4 block size-16"></span>
                                <h3 className="mb-2 text-lg font-semibold text-base-content">Preview Not Available</h3>
                                <p className="text-base-content/70 mb-4">{error || "Unable to load contract preview."}</p>
                                <button className="btn btn-primary btn-sm" onClick={generateLivePreview}>
                                    <span className="iconify lucide--refresh-cw size-4"></span>
                                    Retry
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="mb-4 flex flex-shrink-0 items-center gap-4">
                <div className="bg-error/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <span className="iconify lucide--file-text text-error size-5"></span>
                </div>
                <div className="flex-1">
                    <h3 className="text-base-content font-semibold">PDF Preview</h3>
                    <p className="text-base-content/60 text-sm">{previewData?.fileName}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        className="btn btn-sm bg-base-200 text-base-content hover:bg-base-300 flex items-center gap-2 transition-all duration-200 ease-in-out"
                        onClick={generateLivePreview}
                        disabled={loading}>
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--refresh-cw size-4"></span>
                                Preview
                            </>
                        )}
                    </button>
                    <button
                        className="btn btn-sm bg-base-200 text-base-content hover:bg-base-300 flex items-center gap-2 transition-all duration-200 ease-in-out"
                        onClick={exportContractPdf}
                        disabled={exporting}>
                        {exporting ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--download size-4"></span>
                                Export PDF
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-base-200 border-base-300 min-h-0 flex-1 overflow-hidden rounded-lg border">
                {previewData && <PDFViewer fileBlob={previewData.blob} fileName={previewData.fileName} />}
            </div>
        </div>
    );
};

export default PreviewStep;
