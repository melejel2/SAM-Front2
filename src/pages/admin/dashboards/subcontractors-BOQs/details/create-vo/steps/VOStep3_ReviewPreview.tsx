import React, { useState, useCallback, useEffect } from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';
import { livePreviewVoPdf, transformFormDataToVoDataset } from '@/api/services/vo-api';
import PDFViewer from '@/components/ExcelPreview/PDFViewer';
import { Loader } from '@/components/Loader';
import useToast from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import { formatCurrency } from '@/utils/formatters';

/**
 * VOStep3_ReviewPreview - Combined Review and Preview Step
 *
 * Shows a review summary of all VO data with a live PDF preview
 * This is the final step before submission
 */
export const VOStep3_ReviewPreview: React.FC = () => {
    const { formData, contractData, voDatasetId } = useContractVOWizardContext();
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const selectedBuildings = contractData?.buildings.filter(b =>
        formData.selectedBuildingIds.includes(b.id)
    ) || [];

    const isAddition = formData.voType === 'Addition';

    const generatePreview = useCallback(async () => {
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
            setShowPreview(true);
        } catch (error) {
            console.error("Error generating live preview PDF:", error);
            toaster.error("Failed to generate live preview PDF.");
            setPdfBlob(null);
        } finally {
            setLoadingPreview(false);
        }
    }, [formData, contractData, voDatasetId, getToken, toaster]);

    return (
        <div className="space-y-6">
            {/* Review Summary */}
            <div className="bg-base-100 rounded-lg border border-base-300">
                {/* Header with Key Info */}
                <div className="p-4 border-b border-base-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-base-content/70">VO:</span>
                                <span className="font-semibold">{formData.voNumber}</span>
                            </div>
                            <span className="text-base-content/40">•</span>
                            <div className="flex items-center gap-2">
                                <span className={`badge badge-sm ${
                                    isAddition ? 'badge-success' : 'badge-error'
                                }`}>
                                    {formData.voType}
                                </span>
                            </div>
                            <span className="text-base-content/40">•</span>
                            <span className="text-sm">{new Date(formData.voDate).toLocaleDateString('en-GB')}</span>
                        </div>
                        <div className={`text-lg font-bold ${isAddition ? 'text-success' : 'text-error'}`}>
                            {contractData?.currencySymbol} {formatCurrency(Math.abs(formData.totalAmount))}
                        </div>
                    </div>
                </div>

                {/* Contract Context */}
                <div className="px-4 py-3 bg-base-200/50 text-sm border-b border-base-300">
                    <span className="font-medium">Contract:</span> {formData.contractNumber}
                    <span className="text-base-content/40 mx-2">•</span>
                    <span className="font-medium">Project:</span> {formData.projectName}
                    <span className="text-base-content/40 mx-2">•</span>
                    <span className="font-medium">Subcontractor:</span> {formData.subcontractorName}
                </div>

                {/* Description - Only if provided */}
                {formData.description && (
                    <div className="px-4 py-3 border-b border-base-300">
                        <h4 className="text-sm font-medium text-base-content/70 mb-2">Description</h4>
                        <p className="text-sm">{formData.description}</p>
                    </div>
                )}

                {/* Buildings */}
                <div className="px-4 py-3 border-b border-base-300">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-base-content/70">Buildings ({selectedBuildings.length})</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedBuildings.map((building) => (
                            <span key={building.id} className="badge badge-sm badge-outline">
                                {building.name}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Line Items Table */}
                {formData.lineItems.length > 0 && (
                    <>
                        <div className="px-4 py-3 border-b border-base-300">
                            <h4 className="text-sm font-medium text-base-content/70">
                                Line Items ({formData.lineItems.length})
                            </h4>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-base-content/70 uppercase">Item</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-base-content/70 uppercase">Description</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-base-content/70 uppercase">Unit</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-base-content/70 uppercase">Qty</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-base-content/70 uppercase">Unit Price</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-base-content/70 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-base-300">
                                    {formData.lineItems.map((item, index) => {
                                        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                                        return (
                                            <tr key={item.id || index}>
                                                <td className="px-3 py-2 text-xs">{item.no}</td>
                                                <td className="px-3 py-2 text-xs">{item.description}</td>
                                                <td className="px-3 py-2 text-xs text-center">{item.unit}</td>
                                                <td className="px-3 py-2 text-xs text-center">{formatCurrency(item.quantity)}</td>
                                                <td className="px-3 py-2 text-xs text-center">{formatCurrency(item.unitPrice)}</td>
                                                <td className={`px-3 py-2 text-xs text-center font-medium ${
                                                    isAddition ? 'text-success' : 'text-error'
                                                }`}>
                                                    {formatCurrency(itemTotal)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-base-200 font-bold">
                                        <td colSpan={5} className="px-3 py-2 text-xs text-right">TOTAL</td>
                                        <td className={`px-3 py-2 text-xs text-center ${
                                            isAddition ? 'text-primary' : 'text-error'
                                        }`}>
                                            {formatCurrency(Math.abs(formData.totalAmount))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Preview Section */}
            <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-base-content">Document Preview</h3>
                    <button
                        onClick={generatePreview}
                        disabled={loadingPreview}
                        className="btn btn-sm btn-primary"
                    >
                        {loadingPreview ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--eye size-4"></span>
                                <span>{showPreview ? 'Refresh Preview' : 'Generate Preview'}</span>
                            </>
                        )}
                    </button>
                </div>

                {loadingPreview && (
                    <div className="flex justify-center items-center h-64">
                        <Loader />
                        <p className="ml-2">Generating preview...</p>
                    </div>
                )}

                {!loadingPreview && showPreview && pdfBlob && (
                    <div className="h-[60vh] border border-base-300 rounded-lg overflow-hidden">
                        <PDFViewer fileBlob={pdfBlob} fileName="vo_preview.pdf" />
                    </div>
                )}

                {!loadingPreview && !showPreview && (
                    <div className="text-center p-12 border-2 border-dashed border-base-300 rounded-lg">
                        <span className="iconify lucide--file-text text-base-content/40 size-16 mb-4"></span>
                        <p className="text-base-content/60">Click "Generate Preview" to see the document preview</p>
                    </div>
                )}

                {!loadingPreview && showPreview && !pdfBlob && (
                    <div className="text-center p-8 text-error">
                        <p>Failed to load PDF preview. Please try again.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
