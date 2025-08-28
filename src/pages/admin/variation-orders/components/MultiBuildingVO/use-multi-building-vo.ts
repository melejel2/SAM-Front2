import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import useVoDatasets from "../../use-vo-datasets";

interface BuildingVOConfig {
    buildingId: number;
    buildingName: string;
    voLevel: number;
    replaceAllItems: boolean;
    selected: boolean;
}

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

const useMultiBuildingVO = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [multiBuildingProgress, setMultiBuildingProgress] = useState<MultiBuildingProgress>({
        totalBuildings: 0,
        completedBuildings: 0,
        buildingProgress: []
    });

    const { copyVoProjectToVoDataSet } = useVoDatasets();
    const { toaster } = useToast();

    /**
     * Generate VOs for multiple buildings
     * @param projectId - Project ID
     * @param buildingConfigs - Array of building configurations
     */
    const generateMultiBuildingVOs = async (
        projectId: number,
        buildingConfigs: BuildingVOConfig[]
    ): Promise<boolean> => {
        const selectedBuildings = buildingConfigs.filter(config => config.selected);
        
        if (selectedBuildings.length === 0) {
            toaster.error("No buildings selected for VO generation");
            return false;
        }

        setLoading(true);
        
        // Initialize progress tracking
        const initialProgress: MultiBuildingProgress = {
            totalBuildings: selectedBuildings.length,
            completedBuildings: 0,
            currentBuilding: selectedBuildings[0]?.buildingName,
            currentStatus: 'Starting VO generation...',
            buildingProgress: selectedBuildings.map(config => ({
                buildingId: config.buildingId,
                buildingName: config.buildingName,
                status: 'pending'
            }))
        };
        setMultiBuildingProgress(initialProgress);

        let successCount = 0;
        let errorCount = 0;

        try {
            // Process each building sequentially to avoid overwhelming the backend
            for (let i = 0; i < selectedBuildings.length; i++) {
                const config = selectedBuildings[i];
                
                // Update current processing status
                setMultiBuildingProgress(prev => ({
                    ...prev,
                    currentBuilding: config.buildingName,
                    currentStatus: `Generating VO for ${config.buildingName} (Level ${config.voLevel})...`,
                    buildingProgress: prev.buildingProgress.map(bp =>
                        bp.buildingId === config.buildingId
                            ? { ...bp, status: 'processing' }
                            : bp
                    )
                }));

                try {
                    // Note: This assumes we have a contract dataset ID
                    // In a real implementation, you would need to determine the correct contract dataset
                    // For now, we'll use a placeholder approach
                    const contractDataSetId = 1; // This should be determined based on the building/project context

                    const result = await copyVoProjectToVoDataSet(
                        config.buildingId,
                        config.voLevel,
                        contractDataSetId
                    );

                    if (result) {
                        successCount++;
                        setMultiBuildingProgress(prev => ({
                            ...prev,
                            completedBuildings: successCount + errorCount,
                            buildingProgress: prev.buildingProgress.map(bp =>
                                bp.buildingId === config.buildingId
                                    ? { ...bp, status: 'completed' }
                                    : bp
                            )
                        }));
                    } else {
                        throw new Error(`Failed to generate VO for ${config.buildingName}`);
                    }
                } catch (error) {
                    errorCount++;
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    
                    setMultiBuildingProgress(prev => ({
                        ...prev,
                        completedBuildings: successCount + errorCount,
                        buildingProgress: prev.buildingProgress.map(bp =>
                            bp.buildingId === config.buildingId
                                ? { ...bp, status: 'error', error: errorMessage }
                                : bp
                        )
                    }));

                    console.error(`Error generating VO for building ${config.buildingName}:`, error);
                }

                // Add a small delay between requests to avoid overwhelming the backend
                if (i < selectedBuildings.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            // Final status update
            const finalStatus = errorCount === 0 
                ? 'All VOs generated successfully!'
                : `${successCount} VOs generated, ${errorCount} failed`;

            setMultiBuildingProgress(prev => ({
                ...prev,
                currentStatus: finalStatus
            }));

            if (successCount > 0) {
                toaster.success(`Generated VOs for ${successCount} building(s)`);
            }
            
            if (errorCount > 0) {
                toaster.error(`Failed to generate VOs for ${errorCount} building(s)`);
            }

            return successCount > 0;

        } catch (error) {
            console.error("Multi-building VO generation error:", error);
            toaster.error("Failed to generate multi-building VOs");
            
            setMultiBuildingProgress(prev => ({
                ...prev,
                currentStatus: 'Generation failed',
                buildingProgress: prev.buildingProgress.map(bp => ({
                    ...bp,
                    status: bp.status === 'processing' ? 'error' : bp.status,
                    error: bp.status === 'processing' ? 'Generation interrupted' : bp.error
                }))
            }));

            return false;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Reset progress tracking
     */
    const resetProgress = () => {
        setMultiBuildingProgress({
            totalBuildings: 0,
            completedBuildings: 0,
            buildingProgress: []
        });
    };

    /**
     * Validate building configurations
     * @param configs - Building configurations to validate
     */
    const validateBuildingConfigs = (configs: BuildingVOConfig[]): string[] => {
        const errors: string[] = [];
        
        const selectedConfigs = configs.filter(c => c.selected);
        
        if (selectedConfigs.length === 0) {
            errors.push("At least one building must be selected");
        }

        selectedConfigs.forEach(config => {
            if (!config.buildingId || config.buildingId <= 0) {
                errors.push(`Invalid building ID for ${config.buildingName}`);
            }
            
            if (!config.voLevel || config.voLevel < 1 || config.voLevel > 5) {
                errors.push(`Invalid VO level for ${config.buildingName}. Must be between 1 and 5`);
            }
        });

        return errors;
    };

    /**
     * Get summary statistics for building configs
     * @param configs - Building configurations
     */
    const getBuildingSummary = (configs: BuildingVOConfig[]) => {
        const selected = configs.filter(c => c.selected);
        const replaceCount = selected.filter(c => c.replaceAllItems).length;
        const appendCount = selected.filter(c => !c.replaceAllItems).length;
        
        return {
            totalSelected: selected.length,
            replaceCount,
            appendCount,
            avgLevel: selected.length > 0 
                ? Math.round(selected.reduce((sum, c) => sum + c.voLevel, 0) / selected.length * 10) / 10
                : 0
        };
    };

    return {
        // State
        loading,
        multiBuildingProgress,

        // Main Operations
        generateMultiBuildingVOs,
        resetProgress,

        // Utilities
        validateBuildingConfigs,
        getBuildingSummary
    };
};

export default useMultiBuildingVO;