import { Button } from "@/components/daisyui";

interface MultiBuildingProgress {
    totalBuildings: number;
    completedBuildings: number;
    currentBuilding?: string;
    currentStatus?: string;
    buildingProgress: Array<{
        buildingId: number;
        buildingName: string;
        status: 'pending' | 'processing' | 'completed' | 'error';
        error?: string;
    }>;
}

interface MultiBuildingVOProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    progress: MultiBuildingProgress;
}

const MultiBuildingVOProgressModal: React.FC<MultiBuildingVOProgressModalProps> = ({
    isOpen,
    onClose,
    progress
}) => {
    if (!isOpen) return null;

    const progressPercentage = progress.totalBuildings > 0 
        ? Math.round((progress.completedBuildings / progress.totalBuildings) * 100)
        : 0;

    const isComplete = progress.completedBuildings === progress.totalBuildings && progress.totalBuildings > 0;
    const hasErrors = progress.buildingProgress.some(bp => bp.status === 'error');

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return 'lucide--clock';
            case 'processing':
                return 'lucide--loader';
            case 'completed':
                return 'lucide--check-circle';
            case 'error':
                return 'lucide--x-circle';
            default:
                return 'lucide--help-circle';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'text-base-content/50';
            case 'processing':
                return 'text-blue-600 dark:text-blue-400 animate-spin';
            case 'completed':
                return 'text-green-600 dark:text-green-400';
            case 'error':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-base-content/50';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return 'badge-ghost';
            case 'processing':
                return 'badge-info';
            case 'completed':
                return 'badge-success';
            case 'error':
                return 'badge-error';
            default:
                return 'badge-ghost';
        }
    };

    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-full max-w-3xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                            <span className="iconify lucide--zap text-blue-600 dark:text-blue-400 size-5"></span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-base-content">Multi-Building VO Generation</h3>
                            <p className="text-sm text-base-content/70">
                                {isComplete 
                                    ? 'Generation complete' 
                                    : `Processing ${progress.totalBuildings} building(s)`
                                }
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

                {/* Overall Progress */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-base-content">
                            Overall Progress
                        </span>
                        <span className="text-sm text-base-content/70">
                            {progress.completedBuildings} of {progress.totalBuildings} completed ({progressPercentage}%)
                        </span>
                    </div>
                    <div className="w-full bg-base-300 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                                hasErrors ? 'bg-red-600' : isComplete ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>

                {/* Current Status */}
                {!isComplete && progress.currentStatus && (
                    <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--info text-blue-600 dark:text-blue-400 size-4"></span>
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {progress.currentStatus}
                            </span>
                        </div>
                        {progress.currentBuilding && (
                            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 ml-6">
                                Current building: {progress.currentBuilding}
                            </p>
                        )}
                    </div>
                )}

                {/* Building Progress List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    <h4 className="text-sm font-medium text-base-content mb-3">Building Progress</h4>
                    {progress.buildingProgress.map((building) => (
                        <div
                            key={building.buildingId}
                            className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <span 
                                    className={`iconify ${getStatusIcon(building.status)} size-5 ${getStatusColor(building.status)}`}
                                ></span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-base-content truncate">
                                        {building.buildingName}
                                    </p>
                                    {building.error && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                            {building.error}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span className={`badge badge-sm ${getStatusBadge(building.status)}`}>
                                {building.status}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Completion Summary */}
                {isComplete && (
                    <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-start gap-3">
                            <span className="iconify lucide--check-circle text-green-600 dark:text-green-400 size-5 mt-0.5"></span>
                            <div>
                                <h5 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                                    Generation Complete
                                </h5>
                                <p className="text-xs text-green-700 dark:text-green-300">
                                    Successfully generated VOs for {progress.buildingProgress.filter(bp => bp.status === 'completed').length} building(s).
                                    {hasErrors && ` ${progress.buildingProgress.filter(bp => bp.status === 'error').length} building(s) failed.`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Summary */}
                {hasErrors && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-3">
                            <span className="iconify lucide--alert-triangle text-red-600 dark:text-red-400 size-5 mt-0.5"></span>
                            <div>
                                <h5 className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                                    Errors Encountered
                                </h5>
                                <p className="text-xs text-red-700 dark:text-red-300">
                                    {progress.buildingProgress.filter(bp => bp.status === 'error').length} building(s) failed during VO generation. 
                                    Check the individual building status for details.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-base-300">
                    {isComplete ? (
                        <Button
                            type="button"
                            className="btn-primary"
                            onClick={onClose}
                        >
                            Done
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
                <button onClick={onClose} disabled={!isComplete}>close</button>
            </form>
        </dialog>
    );
};

export default MultiBuildingVOProgressModal;