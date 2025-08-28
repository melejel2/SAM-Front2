import React from "react";
import { Button, Modal } from "@/components/daisyui";

interface MultiBuildingVOProgress {
    buildingId: number;
    buildingName: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    voDatasetId?: number;
}

interface MultiBuildingVOProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: MultiBuildingVOProgress[];
    isGenerating: boolean;
    onViewResults?: () => void;
}

const MultiBuildingVOProgressModal: React.FC<MultiBuildingVOProgressModalProps> = ({
    isOpen,
    onClose,
    progress,
    isGenerating,
    onViewResults
}) => {
    const completedCount = progress.filter(p => p.status === 'completed').length;
    const errorCount = progress.filter(p => p.status === 'error').length;
    const totalCount = progress.length;
    const overallProgress = totalCount > 0 ? (completedCount + errorCount) / totalCount * 100 : 0;

    const getStatusIcon = (status: MultiBuildingVOProgress['status']) => {
        switch (status) {
            case 'pending':
                return 'lucide--clock';
            case 'processing':
                return 'lucide--loader-2';
            case 'completed':
                return 'lucide--check-circle';
            case 'error':
                return 'lucide--alert-circle';
            default:
                return 'lucide--help-circle';
        }
    };

    const getStatusColor = (status: MultiBuildingVOProgress['status']) => {
        switch (status) {
            case 'pending':
                return 'text-base-content/50';
            case 'processing':
                return 'text-primary animate-spin';
            case 'completed':
                return 'text-success';
            case 'error':
                return 'text-error';
            default:
                return 'text-base-content/50';
        }
    };

    const getProgressBarColor = (status: MultiBuildingVOProgress['status']) => {
        switch (status) {
            case 'completed':
                return 'progress-success';
            case 'error':
                return 'progress-error';
            case 'processing':
                return 'progress-primary';
            default:
                return 'progress-base-300';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={!isGenerating ? onClose : undefined} size="lg">
            <div className="bg-base-100">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                            <span className="iconify lucide--activity text-blue-600 dark:text-blue-400 size-5"></span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-base-content">Multi-Building VO Generation</h2>
                            <p className="text-sm text-base-content/70">
                                {isGenerating ? 'Generating VOs...' : 'Generation completed'}
                            </p>
                        </div>
                    </div>
                    {!isGenerating && (
                        <button 
                            onClick={onClose}
                            className="btn btn-sm btn-ghost btn-circle"
                        >
                            <span className="iconify lucide--x size-4"></span>
                        </button>
                    )}
                </div>

                {/* Overall Progress */}
                <div className="p-4 border-b border-base-300">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-base-content">Overall Progress</span>
                        <span className="text-sm text-base-content/70">
                            {completedCount} / {totalCount} completed
                        </span>
                    </div>
                    <div className="w-full">
                        <progress 
                            className="progress progress-primary w-full" 
                            value={overallProgress} 
                            max="100"
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-base-content/60">
                        <span>{Math.round(overallProgress)}%</span>
                        {errorCount > 0 && (
                            <span className="text-error">{errorCount} errors</span>
                        )}
                    </div>
                </div>

                {/* Building Progress List */}
                <div className="p-4">
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {progress.map((item) => (
                            <div 
                                key={item.buildingId}
                                className={`p-3 border border-base-300 rounded-lg ${
                                    item.status === 'completed' ? 'bg-success/5 border-success/30' :
                                    item.status === 'error' ? 'bg-error/5 border-error/30' :
                                    item.status === 'processing' ? 'bg-primary/5 border-primary/30' :
                                    'bg-base-100'
                                }`}
                            >
                                {/* Building Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`iconify ${getStatusIcon(item.status)} ${getStatusColor(item.status)} size-5`}></span>
                                        <div>
                                            <div className="font-medium text-base-content">
                                                {item.buildingName}
                                            </div>
                                            <div className="text-xs text-base-content/60">
                                                Building ID: {item.buildingId}
                                                {item.voDatasetId && (
                                                    <> • VO Dataset ID: {item.voDatasetId}</>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className={`text-sm font-medium ${
                                            item.status === 'completed' ? 'text-success' :
                                            item.status === 'error' ? 'text-error' :
                                            item.status === 'processing' ? 'text-primary' :
                                            'text-base-content/70'
                                        }`}>
                                            {item.status === 'pending' && 'Pending'}
                                            {item.status === 'processing' && 'Processing...'}
                                            {item.status === 'completed' && 'Completed'}
                                            {item.status === 'error' && 'Error'}
                                        </div>
                                        <div className="text-xs text-base-content/60">
                                            {item.progress}%
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-2">
                                    <progress 
                                        className={`progress ${getProgressBarColor(item.status)} w-full h-2`}
                                        value={item.progress} 
                                        max="100"
                                    />
                                </div>

                                {/* Error Message */}
                                {item.status === 'error' && item.error && (
                                    <div className="text-xs text-error bg-error/10 p-2 rounded border border-error/20">
                                        <span className="iconify lucide--alert-triangle size-3 mr-1"></span>
                                        {item.error}
                                    </div>
                                )}

                                {/* Success Details */}
                                {item.status === 'completed' && item.voDatasetId && (
                                    <div className="text-xs text-success bg-success/10 p-2 rounded border border-success/20">
                                        <span className="iconify lucide--check-circle size-3 mr-1"></span>
                                        VO dataset created successfully (ID: {item.voDatasetId})
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-4 border-t border-base-300">
                    <div className="text-sm text-base-content/70">
                        {isGenerating ? (
                            <>
                                <span className="iconify lucide--loader-2 animate-spin size-4 mr-1"></span>
                                Generating VOs for {totalCount} buildings...
                            </>
                        ) : (
                            <>
                                Generation completed: {completedCount} successful, {errorCount} failed
                            </>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        {!isGenerating && completedCount > 0 && onViewResults && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onViewResults}
                            >
                                <span className="iconify lucide--eye size-4"></span>
                                View Results
                            </Button>
                        )}
                        
                        <Button
                            type="button"
                            className={isGenerating ? "btn-disabled" : "bg-primary text-primary-content hover:bg-primary/90"}
                            onClick={onClose}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    Generating...
                                </>
                            ) : (
                                'Done'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default MultiBuildingVOProgressModal;