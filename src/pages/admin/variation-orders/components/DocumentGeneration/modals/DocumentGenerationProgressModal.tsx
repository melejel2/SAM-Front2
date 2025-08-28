import { Button } from "@/components/daisyui";
import { Loader } from "@/components/Loader";

interface GenerationProgress {
    stage: 'initializing' | 'processing' | 'generating' | 'finalizing' | 'completed' | 'error';
    message: string;
    percentage: number;
    error?: string;
}

interface DocumentGenerationProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: GenerationProgress;
}

const DocumentGenerationProgressModal: React.FC<DocumentGenerationProgressModalProps> = ({
    isOpen,
    onClose,
    progress
}) => {
    if (!isOpen) return null;

    const isComplete = progress.stage === 'completed';
    const hasError = progress.stage === 'error';
    const isProcessing = ['initializing', 'processing', 'generating', 'finalizing'].includes(progress.stage);

    const getStageIcon = (stage: string) => {
        switch (stage) {
            case 'initializing':
                return 'lucide--settings';
            case 'processing':
                return 'lucide--cpu';
            case 'generating':
                return 'lucide--file-text';
            case 'finalizing':
                return 'lucide--check-circle';
            case 'completed':
                return 'lucide--check-circle';
            case 'error':
                return 'lucide--x-circle';
            default:
                return 'lucide--help-circle';
        }
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'completed':
                return 'text-green-600 dark:text-green-400';
            case 'error':
                return 'text-red-600 dark:text-red-400';
            case 'processing':
            case 'generating':
                return 'text-blue-600 dark:text-blue-400 animate-pulse';
            default:
                return 'text-base-content/70';
        }
    };

    const getProgressBarColor = () => {
        if (hasError) return 'bg-red-600';
        if (isComplete) return 'bg-green-600';
        return 'bg-blue-600';
    };

    // Generation stages with their descriptions
    const generationStages = [
        {
            key: 'initializing',
            label: 'Initializing',
            description: 'Preparing document generation process',
            icon: 'lucide--settings'
        },
        {
            key: 'processing',
            label: 'Processing',
            description: 'Processing VO data and validating information',
            icon: 'lucide--cpu'
        },
        {
            key: 'generating',
            label: 'Generating',
            description: 'Creating Word and PDF documents',
            icon: 'lucide--file-text'
        },
        {
            key: 'finalizing',
            label: 'Finalizing',
            description: 'Packaging documents and finalizing output',
            icon: 'lucide--package'
        }
    ];

    const getCurrentStageIndex = () => {
        return generationStages.findIndex(s => s.key === progress.stage);
    };

    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-full max-w-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                            hasError ? 'bg-red-100 dark:bg-red-900/30' :
                            isComplete ? 'bg-green-100 dark:bg-green-900/30' :
                            'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                            <span className={`iconify ${getStageIcon(progress.stage)} ${getStageColor(progress.stage)} size-5`}></span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-base-content">
                                {hasError ? 'Generation Failed' : 
                                 isComplete ? 'Generation Complete' :
                                 'Generating Document'}
                            </h3>
                            <p className="text-sm text-base-content/70">
                                {hasError ? 'An error occurred during generation' :
                                 isComplete ? 'Document generated successfully' :
                                 'Please wait while we generate your document'}
                            </p>
                        </div>
                    </div>
                    {isComplete && (
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={onClose}
                        >
                            <span className="iconify lucide--x size-4"></span>
                        </button>
                    )}
                </div>

                {/* Overall Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-base-content">
                            {hasError ? 'Error' : isComplete ? 'Complete' : 'Progress'}
                        </span>
                        <span className="text-sm text-base-content/70">
                            {progress.percentage}%
                        </span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                            style={{ width: `${progress.percentage}%` }}
                        ></div>
                    </div>
                </div>

                {/* Current Status */}
                <div className={`mb-6 p-4 rounded-lg border ${
                    hasError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                    isComplete ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                    <div className="flex items-center gap-3">
                        {isProcessing && <Loader />}
                        <span className={`iconify ${getStageIcon(progress.stage)} ${getStageColor(progress.stage)} size-5`}></span>
                        <div className="flex-1">
                            <p className={`text-sm font-medium ${
                                hasError ? 'text-red-900 dark:text-red-100' :
                                isComplete ? 'text-green-900 dark:text-green-100' :
                                'text-blue-900 dark:text-blue-100'
                            }`}>
                                {progress.message}
                            </p>
                            {progress.error && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {progress.error}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Generation Stages */}
                <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-medium text-base-content">Generation Stages</h4>
                    {generationStages.map((stage, index) => {
                        const currentIndex = getCurrentStageIndex();
                        const isCurrentStage = stage.key === progress.stage;
                        const isCompleted = index < currentIndex || (isCurrentStage && isComplete);
                        const isFailed = isCurrentStage && hasError;
                        
                        return (
                            <div
                                key={stage.key}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                                    isCurrentStage ? 'bg-base-200 border border-base-300' : 'bg-base-100'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                                    isFailed ? 'bg-red-600 text-white' :
                                    isCompleted ? 'bg-green-600 text-white' :
                                    isCurrentStage ? 'bg-blue-600 text-white' :
                                    'bg-base-300 text-base-content/70'
                                }`}>
                                    {isFailed ? (
                                        <span className="iconify lucide--x size-3"></span>
                                    ) : isCompleted ? (
                                        <span className="iconify lucide--check size-3"></span>
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${
                                        isCurrentStage ? 'text-base-content' : 'text-base-content/70'
                                    }`}>
                                        {stage.label}
                                    </p>
                                    <p className="text-xs text-base-content/50">
                                        {stage.description}
                                    </p>
                                </div>
                                {isCurrentStage && isProcessing && (
                                    <div className="animate-spin">
                                        <span className="iconify lucide--loader text-blue-600 dark:text-blue-400 size-4"></span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Completion Information */}
                {isComplete && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-6">
                        <div className="flex items-start gap-3">
                            <span className="iconify lucide--check-circle text-green-600 dark:text-green-400 size-5 mt-0.5"></span>
                            <div>
                                <h5 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                                    Document Generated Successfully
                                </h5>
                                <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                                    <p>• Word document (.docx) created with VO data</p>
                                    <p>• PDF document (.pdf) generated for distribution</p>
                                    <p>• Documents packaged in downloadable ZIP archive</p>
                                    <p>• Ready for preview, download, or approval workflow</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-300">
                    {isComplete || hasError ? (
                        <Button
                            type="button"
                            className="btn-primary"
                            onClick={onClose}
                        >
                            {isComplete ? 'Done' : 'Close'}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            className="bg-base-200 text-base-content hover:bg-base-300"
                            onClick={onClose}
                        >
                            Continue in Background
                        </Button>
                    )}
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose} disabled={isProcessing && !hasError}>close</button>
            </form>
        </dialog>
    );
};

export default DocumentGenerationProgressModal;