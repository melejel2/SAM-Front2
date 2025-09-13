import { useState, useEffect } from "react";
import { Button, Select, SelectOption } from "@/components/daisyui";
import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import useDocumentGeneration from "./use-document-generation";
import DocumentPreviewModal from "./modals/DocumentPreviewModal";
import DocumentGenerationProgressModal from "./modals/DocumentGenerationProgressModal";

interface DocumentGenerationProps {
    voDatasetId?: number;
    voDataset?: any;
    onComplete?: () => void;
    showControls?: boolean;
}

const DocumentGeneration: React.FC<DocumentGenerationProps> = ({
    voDatasetId,
    voDataset,
    onComplete,
    showControls = true
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [generationType, setGenerationType] = useState<'live' | 'saved'>('live');
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [previewData, setPreviewData] = useState<any>(null);

    const {
        templates,
        loading,
        generationProgress,
        generateDocument,
        previewDocument,
        getVoTemplates,
        resetProgress
    } = useDocumentGeneration();

    const { toaster } = useToast();

    useEffect(() => {
        // Load available templates
        getVoTemplates();
    }, []);

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === parseInt(templateId));
        setSelectedTemplate(template);
    };

    const handleLivePreview = async () => {
        if (!voDataset) {
            toaster.error("VO dataset is required for preview");
            return;
        }

        if (!selectedTemplate) {
            toaster.error("Please select a template");
            return;
        }

        try {
            const previewResult = await previewDocument(voDataset, selectedTemplate.id);
            if (previewResult) {
                setPreviewData({
                    type: 'live',
                    data: previewResult,
                    template: selectedTemplate,
                    voDataset: voDataset
                });
                setShowPreviewModal(true);
            }
        } catch (error) {
            console.error("Preview error:", error);
            toaster.error("Failed to generate preview");
        }
    };

    const handleSavedPreview = async () => {
        if (!voDatasetId) {
            toaster.error("VO dataset ID is required");
            return;
        }

        try {
            const previewResult = await previewDocument(undefined, undefined, voDatasetId);
            if (previewResult) {
                setPreviewData({
                    type: 'saved',
                    data: previewResult,
                    voDatasetId: voDatasetId
                });
                setShowPreviewModal(true);
            }
        } catch (error) {
            console.error("Preview error:", error);
            toaster.error("Failed to load saved document");
        }
    };

    const handleGenerate = async () => {
        if (generationType === 'live') {
            if (!voDataset || !selectedTemplate) {
                toaster.error("VO dataset and template are required");
                return;
            }

            setShowProgressModal(true);
            const success = await generateDocument(voDataset, selectedTemplate.id);
            
            if (success) {
                toaster.success("Document generated successfully");
                if (onComplete) onComplete();
            }
        } else {
            // For saved documents, we might trigger regeneration
            if (!voDatasetId) {
                toaster.error("VO dataset ID is required");
                return;
            }

            setShowProgressModal(true);
            const success = await generateDocument(undefined, undefined, voDatasetId);
            
            if (success) {
                toaster.success("Document regenerated successfully");
                if (onComplete) onComplete();
            }
        }
    };

    const handleProgressModalClose = () => {
        setShowProgressModal(false);
        resetProgress();
    };

    const generationTypeOptions = [
        { value: 'live', label: 'Live Preview (Unsaved)' },
        { value: 'saved', label: 'Saved Document' }
    ];

    return (
        <div className="flex flex-col bg-base-100 min-h-full">
            {showControls && (
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                            <span className="iconify lucide--file-text text-blue-600 dark:text-blue-400 size-5"></span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-base-content">Document Generation</h2>
                            <p className="text-sm text-base-content/70">Generate and preview VO documents</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={generationType === 'live' ? handleLivePreview : handleSavedPreview}
                            disabled={loading || (generationType === 'live' && !selectedTemplate)}
                        >
                            <span className="iconify lucide--eye size-4"></span>
                            Preview
                        </Button>
                        <Button
                            type="button"
                            className="btn-primary"
                            onClick={handleGenerate}
                            disabled={loading || (generationType === 'live' && (!voDataset || !selectedTemplate))}
                        >
                            {loading ? (
                                <>
                                    <Loader />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--zap size-4"></span>
                                    Generate
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex-1 p-4 space-y-6">
                {/* Generation Type Selection */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold text-base-content">Generation Type</h3>
                    <div className="flex gap-4">
                        {generationTypeOptions.map((option) => (
                            <label key={option.value} className="cursor-pointer">
                                <div className={`
                                    p-4 border-2 rounded-lg transition-all duration-200
                                    ${generationType === option.value
                                        ? 'border-primary bg-primary/5' 
                                        : 'border-base-300 hover:border-base-400'
                                    }
                                `}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            className="radio radio-primary"
                                            checked={generationType === option.value}
                                            onChange={() => setGenerationType(option.value as 'live' | 'saved')}
                                            disabled={loading}
                                        />
                                        <div>
                                            <p className="font-medium text-base-content">{option.label}</p>
                                            <p className="text-sm text-base-content/70">
                                                {option.value === 'live' 
                                                    ? 'Generate document from current data without saving'
                                                    : 'Use saved VO dataset for document generation'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Template Selection (Live Preview Only) */}
                {generationType === 'live' && (
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold text-base-content">Template Selection</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="floating-label">
                                <span>Document Template</span>
                                <Select
                                    className="input input-sm bg-base-100 border-base-300"
                                    onChange={(e) => handleTemplateSelect(e.target.value)}
                                    disabled={loading}
                                >
                                    <>
                                        <SelectOption value="" className="bg-base-100">
                                            Select template...
                                        </SelectOption>
                                        {templates.map((template) => (
                                            <SelectOption key={template.id} value={template.id} className="bg-base-100">
                                                {template.name} ({template.type})
                                            </SelectOption>
                                        ))}
                                    </>
                                </Select>
                            </label>

                            {selectedTemplate && (
                                <div className="p-3 bg-base-200 rounded-lg">
                                    <h4 className="font-medium text-base-content mb-2">Template Details</h4>
                                    <div className="space-y-1 text-sm">
                                        <p className="text-base-content/70">
                                            <span className="font-medium">Number:</span> {selectedTemplate.templateNumber}
                                        </p>
                                        <p className="text-base-content/70">
                                            <span className="font-medium">Type:</span> {selectedTemplate.type}
                                        </p>
                                        <p className="text-base-content/70">
                                            <span className="font-medium">Language:</span> {selectedTemplate.language}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VO Dataset Information */}
                {(voDataset || voDatasetId) && (
                    <div className="space-y-3">
                        <h3 className="text-base font-semibold text-base-content">VO Dataset Information</h3>
                        <div className="p-4 bg-base-200 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">VO Number</span>
                                    <p className="text-sm font-medium text-base-content">
                                        {voDataset?.voNumber || voDatasetId || '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Project</span>
                                    <p className="text-sm font-medium text-base-content">
                                        {voDataset?.projectName || '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs font-medium text-base-content/70 uppercase tracking-wide">Subcontractor</span>
                                    <p className="text-sm font-medium text-base-content">
                                        {voDataset?.subcontractorName || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <span className="iconify lucide--info text-blue-600 dark:text-blue-400 size-5 mt-0.5"></span>
                        <div>
                            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Document Generation Instructions
                            </h5>
                            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• <strong>Live Preview:</strong> Generate documents from current data without saving changes</li>
                                <li>• <strong>Saved Document:</strong> Generate from previously saved VO dataset</li>
                                <li>• Use <strong>Preview</strong> to review before final generation</li>
                                <li>• Documents are generated in both Word and PDF formats</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Preview Modal */}
            <DocumentPreviewModal
                isOpen={showPreviewModal}
                onClose={() => {
                    setShowPreviewModal(false);
                    setPreviewData(null);
                }}
                previewData={previewData}
            />

            {/* Generation Progress Modal */}
            <DocumentGenerationProgressModal
                isOpen={showProgressModal}
                onClose={handleProgressModalClose}
                progress={generationProgress}
            />
        </div>
    );
};

export default DocumentGeneration;