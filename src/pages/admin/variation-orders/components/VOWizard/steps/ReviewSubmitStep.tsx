import { useState, useEffect } from "react";
import { Button } from "@/components/daisyui";
import { WizardStepProps, SaveConfirmationStepData } from "../types";

const SaveConfirmationStep: React.FC<WizardStepProps> = ({
    data,
    onDataChange,
    onValidationChange,
    mode,
    voDataset
}) => {
    const [formData, setFormData] = useState<SaveConfirmationStepData>({
        confirmed: data.saveConfirmation?.confirmed || false,
        generateDocument: data.saveConfirmation?.generateDocument ?? true,
        documentFormat: data.saveConfirmation?.documentFormat || 'both',
        finalComments: data.saveConfirmation?.finalComments || ''
    });

    // Always valid once user reaches this step
    useEffect(() => {
        onValidationChange(true);
        onDataChange(formData);
    }, [formData, onDataChange, onValidationChange]);

    const handleFieldChange = (field: keyof SaveConfirmationStepData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Get summary data from previous steps
    const buildingData = data.buildingSelection;
    const voData = data.voDataEntry;

    return (
        <div className="space-y-6">
            {/* VO Summary */}
            <div className="bg-base-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                    <span className="iconify lucide--clipboard-check size-5"></span>
                    VO Summary - Ready to {mode === 'create' ? 'Create' : 'Update'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic VO Info */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-base-content">VO Information</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-base-content/70">VO Number:</span>
                                <span className="font-medium">{voData?.voNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Type:</span>
                                <span className={`badge badge-sm ${
                                    voData?.type === 'Addition' ? 'badge-success' : 'badge-error'
                                }`}>
                                    {voData?.type}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Date:</span>
                                <span className="font-medium">
                                    {voData?.date ? new Date(voData.date).toLocaleDateString() : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Currency:</span>
                                <span className="font-medium">{voData?.currency}</span>
                            </div>
                        </div>
                        
                        {voData?.description && (
                            <div className="mt-3 p-3 bg-base-100 rounded text-sm">
                                <div className="font-medium text-base-content/70 mb-1">Description:</div>
                                <div>{voData.description}</div>
                            </div>
                        )}
                    </div>

                    {/* Building and Financial Info */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-base-content">Scope & Financial</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Buildings:</span>
                                <span className="font-medium">
                                    {buildingData?.selectedBuildings.length || 0} building(s)
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Line Items:</span>
                                <span className="font-medium">{voData?.items?.length || 0} items</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Total Amount:</span>
                                <span className={`font-bold text-lg ${
                                    voData?.type === 'Addition' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {voData?.type === 'Deduction' ? '-' : '+'}${voData?.totalAmount?.toLocaleString() || '0'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Attachments:</span>
                                <span className="font-medium">{voData?.attachments?.length || 0} files</span>
                            </div>
                        </div>

                        {buildingData?.buildingNames && buildingData.buildingNames.length > 0 && (
                            <div className="mt-3 p-3 bg-base-100 rounded text-sm">
                                <div className="font-medium text-base-content/70 mb-1">Selected Buildings:</div>
                                <div>{buildingData.buildingNames.join(', ')}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Generation Options */}
            <div className="space-y-3">
                <h3 className="text-base font-semibold text-base-content flex items-center gap-2">
                    <span className="iconify lucide--file-text size-4"></span>
                    Document Generation
                </h3>
                
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-primary"
                            checked={formData.generateDocument}
                            onChange={(e) => handleFieldChange('generateDocument', e.target.checked)}
                        />
                        <span className="font-medium">Generate VO documents after saving</span>
                    </label>

                    {formData.generateDocument && (
                        <div className="ml-8 space-y-3">
                            <div className="text-sm text-base-content/70">Select document format:</div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        className="radio radio-primary radio-sm"
                                        checked={formData.documentFormat === 'word'}
                                        onChange={() => handleFieldChange('documentFormat', 'word')}
                                    />
                                    <span className="text-sm">Word document only (.docx)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        className="radio radio-primary radio-sm"
                                        checked={formData.documentFormat === 'pdf'}
                                        onChange={() => handleFieldChange('documentFormat', 'pdf')}
                                    />
                                    <span className="text-sm">PDF document only (.pdf)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        className="radio radio-primary radio-sm"
                                        checked={formData.documentFormat === 'both'}
                                        onChange={() => handleFieldChange('documentFormat', 'both')}
                                    />
                                    <span className="text-sm">Both Word and PDF documents</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Final Comments */}
            <div className="space-y-3">
                <h3 className="text-base font-semibold text-base-content flex items-center gap-2">
                    <span className="iconify lucide--message-square size-4"></span>
                    Final Comments (Optional)
                </h3>
                
                <textarea
                    className="textarea textarea-sm bg-base-100 border-base-300 min-h-20"
                    value={formData.finalComments}
                    onChange={(e: any) => handleFieldChange('finalComments', e.target.value)}
                    placeholder="Add any final comments or notes about this VO..."
                    rows={3}
                />
            </div>

            {/* Confirmation */}
            <div className={`p-4 rounded-lg border-2 ${
                formData.confirmed 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
            }`}>
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-primary mt-1"
                        checked={formData.confirmed}
                        onChange={(e) => handleFieldChange('confirmed', e.target.checked)}
                    />
                    <div>
                        <div className={`font-medium ${
                            formData.confirmed 
                                ? 'text-green-900 dark:text-green-100'
                                : 'text-yellow-900 dark:text-yellow-100'
                        }`}>
                            I confirm that all information is correct and ready to {mode === 'create' ? 'create' : 'update'} this VO
                        </div>
                        <div className={`text-sm mt-1 ${
                            formData.confirmed 
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-yellow-700 dark:text-yellow-300'
                        }`}>
                            {formData.confirmed 
                                ? 'Ready to proceed with VO creation/update'
                                : 'Please confirm to enable the save button'
                            }
                        </div>
                    </div>
                </label>
            </div>

            {/* Action Buttons Preview */}
            <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                    <span className="iconify lucide--zap text-primary size-5"></span>
                    <h4 className="font-semibold text-primary">Ready to {mode === 'create' ? 'Create' : 'Update'}</h4>
                </div>
                <div className="text-sm text-primary/70 space-y-1">
                    <p>• VO will be saved to the database</p>
                    {formData.generateDocument && (
                        <p>• {formData.documentFormat === 'both' ? 'Word and PDF documents' : 
                             formData.documentFormat === 'word' ? 'Word document' : 'PDF document'} will be generated</p>
                    )}
                    <p>• You'll be able to preview and download the generated documents</p>
                    <p>• VO will be available in the variation orders list</p>
                </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <span className="iconify lucide--info text-blue-600 dark:text-blue-400 size-5 mt-0.5"></span>
                    <div>
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Final Step Instructions
                        </h5>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• Review all the information above for accuracy</li>
                            <li>• Choose whether to generate documents immediately</li>
                            <li>• Add any final comments if needed</li>
                            <li>• Check the confirmation box to enable saving</li>
                            <li>• Click the {mode === 'create' ? 'Create VO' : 'Update VO'} button to complete the process</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaveConfirmationStep;