import { useState, useEffect } from "react";
import { Button, Select, SelectOption } from "@/components/daisyui";
import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import useMultiBuildingVO from "./use-multi-building-vo";
import MultiBuildingSelector from "./components/MultiBuildingSelector";
import MultiBuildingVOProgressModal from "./components/MultiBuildingVOProgressModal";

interface MultiBuildingVOProps {
    projectId?: number;
    buildings?: any[];
    onComplete?: () => void;
    showControls?: boolean;
}

const MultiBuildingVO: React.FC<MultiBuildingVOProps> = ({
    projectId,
    buildings = [],
    onComplete,
    showControls = true
}) => {
    const [selectedBuildings, setSelectedBuildings] = useState<any[]>([]);
    const [showProgressModal, setShowProgressModal] = useState(false);

    const {
        loading,
        generateMultiBuildingVOs,
        multiBuildingProgress,
        resetProgress
    } = useMultiBuildingVO();

    const { toaster } = useToast();

    const handleBuildingSelection = (buildingConfigs: any[]) => {
        setSelectedBuildings(buildingConfigs);
    };

    const handleGenerateVOs = async () => {
        if (selectedBuildings.length === 0) {
            toaster.error("Please select at least one building");
            return;
        }

        if (!projectId) {
            toaster.error("Project ID is required");
            return;
        }

        // Show progress modal
        setShowProgressModal(true);

        // Start generation process
        const success = await generateMultiBuildingVOs(projectId, selectedBuildings);
        
        if (success) {
            toaster.success("Multi-building VOs generated successfully");
            if (onComplete) {
                onComplete();
            }
        } else {
            toaster.error("Failed to generate multi-building VOs");
        }
    };

    const handleProgressModalClose = () => {
        setShowProgressModal(false);
        resetProgress();
    };

    return (
        <div className="flex flex-col bg-base-100 min-h-full">
            {showControls && (
                <div className="flex items-center justify-between p-4 border-b border-base-300">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                            <span className="iconify lucide--building text-green-600 dark:text-green-400 size-5"></span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-base-content">Multi-Building VO Generation</h2>
                            <p className="text-sm text-base-content/70">Create variation orders across multiple buildings</p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        className="btn-primary"
                        onClick={handleGenerateVOs}
                        disabled={loading || selectedBuildings.length === 0}
                    >
                        {loading ? (
                            <>
                                <Loader />
                                Generating...
                            </>
                        ) : (
                            <>
                                <span className="iconify lucide--zap size-4"></span>
                                Generate VOs ({selectedBuildings.length})
                            </>
                        )}
                    </Button>
                </div>
            )}

            <div className="flex-1 p-4">
                {buildings.length > 0 ? (
                    <MultiBuildingSelector
                        buildings={buildings}
                        projectId={projectId}
                        onSelectionChange={handleBuildingSelection}
                        disabled={loading}
                    />
                ) : (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <span className="iconify lucide--building text-base-content/50 size-12 mb-4"></span>
                            <h3 className="text-lg font-medium text-base-content mb-2">No Buildings Available</h3>
                            <p className="text-sm text-base-content/70 max-w-md">
                                No buildings found for this project. Please ensure the project has buildings 
                                configured before creating multi-building VOs.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Modal */}
            <MultiBuildingVOProgressModal
                isOpen={showProgressModal}
                onClose={handleProgressModalClose}
                progress={multiBuildingProgress}
            />
        </div>
    );
};

export default MultiBuildingVO;