import { useState } from "react";
import useToast from "@/hooks/use-toast";
import apiRequest from "@/api/api";
import useVODataSet from "../../use-vo-datasets";

interface BuildingVOConfig {
    buildingId: number;
    buildingName: string;
    voLevel: number;
    replaceMode: boolean;
    selected: boolean;
}

interface MultiBuildingVOProgress {
    buildingId: number;
    buildingName: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    voDatasetId?: number;
}

const useMultiBuildingVO = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState<MultiBuildingVOProgress[]>([]);
    const { toaster } = useToast();
    const { saveVoDataset } = useVODataSet();

    const generateVOForBuildings = async (
        buildingConfigs: BuildingVOConfig[],
        baseVOData: {
            voNumber: string;
            voName: string;
            voDate: string;
            contractType: number;
            subcontractorId: number;
            projectId: number;
            templateId?: number;
        }
    ) => {
        setIsGenerating(true);
        
        // Initialize progress tracking
        const initialProgress = buildingConfigs.map(config => ({
            buildingId: config.buildingId,
            buildingName: config.buildingName,
            status: 'pending' as const,
            progress: 0
        }));
        setGenerationProgress(initialProgress);

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        try {
            for (let i = 0; i < buildingConfigs.length; i++) {
                const config = buildingConfigs[i];
                
                // Update progress to processing
                setGenerationProgress(prev => 
                    prev.map(p => 
                        p.buildingId === config.buildingId 
                            ? { ...p, status: 'processing', progress: 25 }
                            : p
                    )
                );

                try {
                    // Generate building-specific VO number
                    const buildingVONumber = `${baseVOData.voNumber}-B${config.buildingId}`;
                    const buildingVOName = `${baseVOData.voName} - ${config.buildingName}`;

                    // Create VO dataset for this building
                    const voData = {
                        voNumber: buildingVONumber,
                        voName: buildingVOName,
                        voDate: baseVOData.voDate,
                        contractType: baseVOData.contractType,
                        subcontractorId: baseVOData.subcontractorId,
                        projectId: baseVOData.projectId,
                        buildingId: config.buildingId,
                        voLevel: config.voLevel,
                        replaceMode: config.replaceMode,
                        templateId: baseVOData.templateId,
                        // Add missing required properties with defaults
                        id: 0,
                        contractNumber: '',
                        date: baseVOData.voDate,
                        status: 'Draft',
                        projectName: '',
                        subcontractorName: '',
                        type: '',
                        amount: 0,
                        tradeName: '',
                        contractId: null,
                        contractsDatasetId: null,
                        subTrade: null,
                        remark: null,
                        buildings: []
                    } as any;

                    // Update progress
                    setGenerationProgress(prev => 
                        prev.map(p => 
                            p.buildingId === config.buildingId 
                                ? { ...p, progress: 50 }
                                : p
                        )
                    );

                    // Create the VO dataset
                    const response = await saveVoDataset(voData);
                    
                    if (response && response.isSuccess && response.data) {
                        // Update progress to completed
                        setGenerationProgress(prev => 
                            prev.map(p => 
                                p.buildingId === config.buildingId 
                                    ? { 
                                        ...p, 
                                        status: 'completed', 
                                        progress: 100, 
                                        voDatasetId: response.data.id 
                                    }
                                    : p
                            )
                        );
                        
                        results.push({
                            buildingId: config.buildingId,
                            buildingName: config.buildingName,
                            voDatasetId: response.data.id,
                            voNumber: buildingVONumber,
                            success: true
                        });
                        
                        successCount++;
                    } else {
                        throw new Error('Failed to create VO dataset');
                    }

                } catch (error) {
                    console.error(`Error creating VO for building ${config.buildingName}:`, error);
                    
                    // Update progress to error
                    setGenerationProgress(prev => 
                        prev.map(p => 
                            p.buildingId === config.buildingId 
                                ? { 
                                    ...p, 
                                    status: 'error', 
                                    progress: 0,
                                    error: error instanceof Error ? error.message : 'Unknown error'
                                }
                                : p
                        )
                    );
                    
                    results.push({
                        buildingId: config.buildingId,
                        buildingName: config.buildingName,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        success: false
                    });
                    
                    errorCount++;
                }
            }

            // Show completion toast
            if (successCount > 0 && errorCount === 0) {
                toaster.success(`Successfully created VO for all ${successCount} buildings`);
            } else if (successCount > 0 && errorCount > 0) {
                toaster.warning(`Created VO for ${successCount} buildings, ${errorCount} failed`);
            } else {
                toaster.error(`Failed to create VO for all ${errorCount} buildings`);
            }

        } catch (error) {
            console.error('Multi-building VO generation error:', error);
            toaster.error('An unexpected error occurred during VO generation');
        } finally {
            setIsGenerating(false);
        }

        return {
            results,
            successCount,
            errorCount,
            totalCount: buildingConfigs.length
        };
    };

    const resetProgress = () => {
        setGenerationProgress([]);
        setIsGenerating(false);
    };

    return {
        isGenerating,
        generationProgress,
        generateVOForBuildings,
        resetProgress
    };
};

export default useMultiBuildingVO;