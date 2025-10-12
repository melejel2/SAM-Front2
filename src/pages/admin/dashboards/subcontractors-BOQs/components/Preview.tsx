import React, { useEffect, useState } from "react";

import apiRequest from "@/api/api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

interface PreviewStepProps {
    formData: any;
    selectedProject: any;
    selectedSubcontractor: any;
    contractId?: number; // For edit mode
}

const PreviewStep: React.FC<PreviewStepProps> = ({ formData, selectedProject, selectedSubcontractor, contractId }) => {
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { getToken } = useAuth();
    const { toaster } = useToast();

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
                    replaceAllItems: true,
                    boqsContract: building.items.map((item: any) => ({
                        id: item.id || 0,
                        no: item.no || item.nb,
                        key: item.key || item.item,
                        unite: item.unite || item.unit,
                        qte: parseFloat(item.qte || item.qty) || 0,
                        pu: parseFloat(item.pu || item.unit_price) || 0,
                        costCode: item.costCode || item.cost_code || "",
                        costCodeId: null,
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
            setError(errorMessage);
            toaster.error(errorMessage);
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
            setError(`Failed to generate live preview: ${errorMessage}`);
            toaster.error(`Failed to generate live preview: ${errorMessage}`);
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
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="text-base-content/70">Loading contract preview...</p>
                </div>
            </div>
        );
    }

    if (!previewData) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="text-base-content/70 mb-4">
                        <span className="iconify lucide--alert-circle mx-auto mb-4 block size-16"></span>
                        <h3 className="mb-2 text-lg font-semibold">Preview Not Available</h3>
                        <p>{error || "Unable to load contract preview."}</p>
                        <button className="btn btn-primary btn-sm mt-4" onClick={generateLivePreview}>
                            Retry
                        </button>
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
