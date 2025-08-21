import { useState, useEffect } from "react";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import apiRequest from "@/api/api";
import { Loader } from "@/components/Loader";

interface PreviewStepProps {
    formData: any;
    selectedProject: any;
    selectedSubcontractor: any;
    selectedProjectBuildings: any[];
    contracts: any[];
    currencies: any[];
}

// Export Dropdown Component
const ExportDropdown = ({ 
    exportingPdf, 
    exportingWord,
    onExportPdf, 
    onExportWord
}: {
    exportingPdf: boolean;
    exportingWord: boolean;
    onExportPdf: () => void;
    onExportWord: () => void;
}) => {
    const isExporting = exportingPdf || exportingWord;
    
    return (
        <div className="dropdown dropdown-end">
            <div 
                tabIndex={0} 
                role="button" 
                className={`btn btn-sm border border-base-300 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 transition-colors duration-200 ${isExporting ? 'btn-disabled' : ''}`}
            >
                {isExporting ? (
                    <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Exporting...</span>
                    </>
                ) : (
                    <>
                        <span className="iconify lucide--download size-4"></span>
                        <span>Export</span>
                        <span className="iconify lucide--chevron-down size-3.5"></span>
                    </>
                )}
            </div>
            {!isExporting && (
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-1">
                    <li>
                        <button
                            onClick={onExportPdf}
                            className="flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200"
                        >
                            <span className="iconify lucide--file-text size-4"></span>
                            <span className="font-medium">Export as PDF</span>
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={onExportWord}
                            className="flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200"
                        >
                            <span className="iconify lucide--file-type-docx size-4"></span>
                            <span className="font-medium">Export as Word</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
};

function PreviewStep({ 
    formData, 
    selectedProject, 
    selectedSubcontractor, 
    selectedProjectBuildings, 
    contracts, 
    currencies 
}: PreviewStepProps) {
    const { toaster } = useToast();
    const { getToken } = useAuth();
    const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingWord, setExportingWord] = useState(false);

    // Generate preview when component mounts
    useEffect(() => {
        generatePreview();
    }, []);

    const generatePreview = async () => {
        setLoading(true);
        try {
            // Prepare contract data for preview
            const contractData = {
                projectId: formData.projectId,
                buildingIds: formData.buildingIds,
                subcontractorId: formData.subcontractorId,
                contractId: formData.contractId,
                currencyId: formData.currencyId,
                contractNumber: formData.contractNumber,
                contractDate: formData.contractDate,
                completionDate: formData.completionDate,
                advancePayment: formData.advancePayment,
                materialSupply: formData.materialSupply,
                purchaseIncrease: formData.purchaseIncrease,
                latePenalties: formData.latePenalties,
                latePenalityCeiling: formData.latePenalityCeiling,
                holdWarranty: formData.holdWarranty,
                mintenancePeriod: formData.mintenancePeriod,
                workWarranty: formData.workWarranty,
                termination: formData.termination,
                daysNumber: formData.daysNumber,
                progress: formData.progress,
                holdBack: formData.holdBack,
                subcontractorAdvancePayee: formData.subcontractorAdvancePayee,
                recoverAdvance: formData.recoverAdvance,
                procurementConstruction: formData.procurementConstruction,
                prorataAccount: formData.prorataAccount,
                managementFees: formData.managementFees,
                plansExecution: formData.plansExecution,
                subTrade: formData.subTrade,
                paymentsTerm: formData.paymentsTerm,
                remark: formData.remark,
                remarkCP: formData.remarkCP,
                boqData: formData.boqData
            };

            const response = await apiRequest({
                endpoint: "ContractsDatasets/LivePreviewPdf",
                method: "POST",
                token: getToken() ?? "",
                body: contractData,
                responseType: "blob",
            });

            if (response instanceof Blob) {
                const fileName = `contract-preview-${selectedProject?.name || 'document'}.pdf`;
                setPreviewData({ blob: response, fileName });
            } else {
                toaster.error("Failed to generate preview");
            }
        } catch (error) {
            console.error("Preview generation error:", error);
            toaster.error("Failed to generate preview");
        } finally {
            setLoading(false);
        }
    };

    const handleExportPdf = async () => {
        if (!previewData) return;
        
        setExportingPdf(true);
        try {
            const contractData = {
                projectId: formData.projectId,
                buildingIds: formData.buildingIds,
                subcontractorId: formData.subcontractorId,
                contractId: formData.contractId,
                currencyId: formData.currencyId,
                contractNumber: formData.contractNumber,
                contractDate: formData.contractDate,
                completionDate: formData.completionDate,
                advancePayment: formData.advancePayment,
                materialSupply: formData.materialSupply,
                purchaseIncrease: formData.purchaseIncrease,
                latePenalties: formData.latePenalties,
                latePenalityCeiling: formData.latePenalityCeiling,
                holdWarranty: formData.holdWarranty,
                mintenancePeriod: formData.mintenancePeriod,
                workWarranty: formData.workWarranty,
                termination: formData.termination,
                daysNumber: formData.daysNumber,
                progress: formData.progress,
                holdBack: formData.holdBack,
                subcontractorAdvancePayee: formData.subcontractorAdvancePayee,
                recoverAdvance: formData.recoverAdvance,
                procurementConstruction: formData.procurementConstruction,
                prorataAccount: formData.prorataAccount,
                managementFees: formData.managementFees,
                plansExecution: formData.plansExecution,
                subTrade: formData.subTrade,
                paymentsTerm: formData.paymentsTerm,
                remark: formData.remark,
                remarkCP: formData.remarkCP,
                boqData: formData.boqData
            };

            const response = await apiRequest({
                endpoint: "ContractsDatasets/LivePreviewPdf",
                method: "POST",
                token: getToken() ?? "",
                body: contractData,
                responseType: "blob",
            });

            if (response instanceof Blob) {
                const fileName = `contract-${selectedProject?.name || 'document'}.pdf`;
                const url = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toaster.success("PDF file downloaded successfully");
            } else {
                toaster.error("Failed to download PDF file");
            }
        } catch (error) {
            toaster.error("Failed to download PDF file");
        } finally {
            setExportingPdf(false);
        }
    };

    const handleExportWord = async () => {
        if (!previewData) return;
        
        setExportingWord(true);
        try {
            const contractData = {
                projectId: formData.projectId,
                buildingIds: formData.buildingIds,
                subcontractorId: formData.subcontractorId,
                contractId: formData.contractId,
                currencyId: formData.currencyId,
                contractNumber: formData.contractNumber,
                contractDate: formData.contractDate,
                completionDate: formData.completionDate,
                advancePayment: formData.advancePayment,
                materialSupply: formData.materialSupply,
                purchaseIncrease: formData.purchaseIncrease,
                latePenalties: formData.latePenalties,
                latePenalityCeiling: formData.latePenalityCeiling,
                holdWarranty: formData.holdWarranty,
                mintenancePeriod: formData.mintenancePeriod,
                workWarranty: formData.workWarranty,
                termination: formData.termination,
                daysNumber: formData.daysNumber,
                progress: formData.progress,
                holdBack: formData.holdBack,
                subcontractorAdvancePayee: formData.subcontractorAdvancePayee,
                recoverAdvance: formData.recoverAdvance,
                procurementConstruction: formData.procurementConstruction,
                prorataAccount: formData.prorataAccount,
                managementFees: formData.managementFees,
                plansExecution: formData.plansExecution,
                subTrade: formData.subTrade,
                paymentsTerm: formData.paymentsTerm,
                remark: formData.remark,
                remarkCP: formData.remarkCP,
                boqData: formData.boqData
            };

            const response = await apiRequest({
                endpoint: "ContractsDatasets/LivePreviewWord",
                method: "POST",
                token: getToken() ?? "",
                body: contractData,
                responseType: "blob",
            });

            if (response instanceof Blob) {
                const fileName = `contract-${selectedProject?.name || 'document'}.docx`;
                const url = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toaster.success("Word file downloaded successfully");
            } else {
                toaster.error("Failed to download Word file");
            }
        } catch (error) {
            toaster.error("Failed to download Word file");
        } finally {
            setExportingWord(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <span className="iconify lucide--eye text-primary size-5"></span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-base-content">Contract Preview</h3>
                        <p className="text-sm text-base-content/60">
                            Review your contract before saving
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={generatePreview}
                        disabled={loading}
                        className="btn btn-sm btn-primary hover:btn-primary-focus transition-all duration-200 ease-in-out flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--refresh-cw size-4"></span>
                                <span>Refresh</span>
                            </>
                        )}
                    </button>
                    <ExportDropdown 
                        exportingPdf={exportingPdf}
                        exportingWord={exportingWord}
                        onExportPdf={handleExportPdf}
                        onExportWord={handleExportWord}
                    />
                </div>
            </div>

            {/* Contract Summary */}
            <div className="card bg-base-100 shadow-sm p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <h4 className="font-semibold text-base-content mb-2">Project Information</h4>
                        <p className="text-sm text-base-content/70">Project: {selectedProject?.name}</p>
                        <p className="text-sm text-base-content/70">Buildings: {formData.buildingIds.map(id => 
                            selectedProjectBuildings.find(b => b.id === id)?.name
                        ).join(', ')}</p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-base-content mb-2">Subcontractor</h4>
                        <p className="text-sm text-base-content/70">{selectedSubcontractor?.name || 'Not selected'}</p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-base-content mb-2">Contract Details</h4>
                        <p className="text-sm text-base-content/70">Type: {contracts.find(c => c.id === formData.contractId)?.templateName}</p>
                        <p className="text-sm text-base-content/70">Currency: {currencies.find(c => c.id === formData.currencyId)?.name} ({currencies.find(c => c.id === formData.currencyId)?.currencies})</p>
                        <p className="text-sm text-base-content/70">Contract Number: {formData.contractNumber}</p>
                        <p className="text-sm text-base-content/70">Contract Date: {formData.contractDate}</p>
                        <p className="text-sm text-base-content/70">Completion Date: {formData.completionDate}</p>
                    </div>
                </div>
            </div>

            {/* PDF Preview */}
            <div className="card bg-base-100 shadow-sm p-4">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-error/20 rounded-lg">
                        <span className="iconify lucide--file-text text-error size-5"></span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-base-content">PDF Preview</h3>
                        <p className="text-sm text-base-content/60">
                            {previewData?.fileName} • Live Preview
                        </p>
                    </div>
                </div>
                
                {/* PDF Content */}
                <div className="bg-base-100 border border-base-300 rounded-lg shadow-sm">
                    <div className="h-[calc(100vh-400px)]">
                        {loading ? (
                            <Loader />
                        ) : previewData ? (
                            <PDFViewer
                                fileBlob={previewData.blob}
                                fileName={previewData.fileName}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <span className="iconify lucide--file-x text-error size-12 mb-2"></span>
                                    <p className="text-error mb-2">No preview available</p>
                                    <p className="text-sm text-base-content/60">Click refresh to generate preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PreviewStep;
