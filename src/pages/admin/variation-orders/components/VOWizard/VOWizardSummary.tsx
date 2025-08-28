import { WizardStepData } from "./types";

interface VOWizardSummaryProps {
    stepData: WizardStepData;
    isVisible: boolean;
    mode: 'create' | 'edit';
}

const VOWizardSummary: React.FC<VOWizardSummaryProps> = ({
    stepData,
    isVisible,
    mode
}) => {
    
    if (!isVisible) return null;

    const getTotalAmount = () => {
        return stepData.voDataEntry?.totalAmount || 0;
    };

    const getTotalItems = () => {
        return stepData.voDataEntry?.items?.length || 0;
    };

    const getDocumentFormats = () => {
        const format = stepData.saveConfirmation?.documentFormat || 'both';
        switch (format) {
            case 'word': return 'Word';
            case 'pdf': return 'PDF';
            case 'both': return 'Word, PDF';
            default: return 'None';
        }
    };

    return (
        <div className="w-80 bg-base-200 border-l border-base-300 p-4 overflow-y-auto">
            <div className="sticky top-0 bg-base-200 pb-4 border-b border-base-300 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <span className="iconify lucide--clipboard-check text-primary size-5"></span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-base-content">VO Summary</h3>
                        <p className="text-sm text-base-content/70">Review before {mode === 'create' ? 'creating' : 'updating'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* VO Information Summary */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-base-content flex items-center gap-2">
                        <span className="iconify lucide--info size-4"></span>
                        VO Information
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-base-content/70">VO Number:</span>
                            <span className="font-medium">{stepData.voDataEntry?.voNumber || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Type:</span>
                            <span className={`badge badge-sm ${
                                stepData.voDataEntry?.type === 'Addition' 
                                    ? 'badge-success' 
                                    : 'badge-error'
                            }`}>
                                {stepData.voDataEntry?.type || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Date:</span>
                            <span className="font-medium">
                                {stepData.voDataEntry?.date 
                                    ? new Date(stepData.voDataEntry.date).toLocaleDateString()
                                    : '-'
                                }
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Currency:</span>
                            <span className="font-medium">{stepData.voDataEntry?.currency || 'USD'}</span>
                        </div>
                    </div>
                    
                    {stepData.voDataEntry?.description && (
                        <div className="mt-2 p-2 bg-base-100 rounded text-sm">
                            <div className="font-medium text-base-content/70 mb-1">Description:</div>
                            <div>{stepData.voDataEntry.description}</div>
                        </div>
                    )}
                </div>

                {/* Building Selection Summary */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-base-content flex items-center gap-2">
                        <span className="iconify lucide--building-2 size-4"></span>
                        Building Scope
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Level:</span>
                            <span className="badge badge-info badge-sm">
                                {stepData.buildingSelection?.level || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Buildings:</span>
                            <span className="font-medium">
                                {stepData.buildingSelection?.selectedBuildings?.length || 0} selected
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Attachments:</span>
                            <span className="font-medium">{stepData.voDataEntry?.attachments?.length || 0} files</span>
                        </div>
                    </div>
                    
                    {stepData.buildingSelection?.buildingNames && stepData.buildingSelection.buildingNames.length > 0 && (
                        <div className="mt-2 p-2 bg-base-100 rounded text-sm">
                            <div className="font-medium text-base-content/70 mb-1">Selected Buildings:</div>
                            <div>{stepData.buildingSelection.buildingNames.join(', ')}</div>
                        </div>
                    )}
                </div>

                {/* Financial Summary */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-base-content flex items-center gap-2">
                        <span className="iconify lucide--calculator size-4"></span>
                        Financial Impact
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Line Items:</span>
                            <span className="font-medium">{getTotalItems()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Total Amount:</span>
                            <span className={`font-bold ${
                                stepData.voDataEntry?.type === 'Addition' 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                            }`}>
                                {stepData.voDataEntry?.type === 'Deduction' ? '-' : ''}
                                ${getTotalAmount().toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Currency:</span>
                            <span className="font-medium">{stepData.voDataEntry?.currency || 'USD'}</span>
                        </div>
                    </div>
                </div>

                {/* Document Configuration Summary */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-base-content flex items-center gap-2">
                        <span className="iconify lucide--file-cog size-4"></span>
                        Documents
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Generate:</span>
                            <span className={`badge badge-sm ${
                                stepData.saveConfirmation?.generateDocument 
                                    ? 'badge-success' 
                                    : 'badge-warning'
                            }`}>
                                {stepData.saveConfirmation?.generateDocument ? 'Yes' : 'No'}
                            </span>
                        </div>
                        {stepData.saveConfirmation?.generateDocument && (
                            <div className="flex justify-between">
                                <span className="text-base-content/70">Format:</span>
                                <span className="font-medium">{getDocumentFormats()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Review Status Summary */}
                {stepData.saveConfirmation?.finalComments && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-base-content flex items-center gap-2">
                            <span className="iconify lucide--message-square size-4"></span>
                            Final Comments
                        </h4>
                        <div className="p-2 bg-base-100 rounded text-sm">
                            {stepData.saveConfirmation.finalComments}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Summary */}
            <div className="mt-8 p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                    <span className="iconify lucide--zap text-primary size-5"></span>
                    <h4 className="font-semibold text-primary">Ready to {mode === 'create' ? 'Create' : 'Update'}</h4>
                </div>
                <div className="text-sm text-primary/70 space-y-1">
                    <p>• All required information completed</p>
                    <p>• Financial calculations verified</p>
                    <p>• Document generation configured</p>
                    <p>• Ready for {mode === 'create' ? 'creation' : 'update'}</p>
                </div>
            </div>
        </div>
    );
};

// Helper function to format checklist items
const formatChecklistItem = (key: string) => {
    const formatMap: Record<string, string> = {
        basicInfoReviewed: 'Basic info reviewed',
        projectScopeConfirmed: 'Project scope confirmed',
        lineItemsValidated: 'Line items validated',
        financialTotalsCorrect: 'Financial totals correct',
        documentsConfigured: 'Documents configured',
        readyToSubmit: 'Ready to submit'
    };
    
    return formatMap[key] || key.replace(/([A-Z])/g, ' $1').toLowerCase();
};

export default VOWizardSummary;