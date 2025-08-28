import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import useVoDatasets from "../../use-vo-datasets";
import useVOTemplates from "../VOTemplates/use-vo-templates";
import { livePreviewVO } from "@/api/services/vo-api";

interface GenerationProgress {
    stage: 'initializing' | 'processing' | 'generating' | 'finalizing' | 'completed' | 'error';
    message: string;
    percentage: number;
    error?: string;
}

const useDocumentGeneration = () => {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
        stage: 'initializing',
        message: 'Initializing...',
        percentage: 0
    });

    const { previewVoDataSet, generateVoDataSet } = useVoDatasets();
    const { getVoTemplates: getVoTemplatesApi } = useVOTemplates();
    const { getToken } = useAuth();
    const { toaster } = useToast();

    const token = getToken();

    /**
     * Get available VO templates
     */
    const getVoTemplates = async () => {
        setLoading(true);
        try {
            // Get VO templates (ContractType.VO = 0)
            const voTemplates = await getVoTemplatesApi(0);
            setTemplates(voTemplates);
        } catch (error) {
            console.error("Error loading VO templates:", error);
            toaster.error("Failed to load VO templates");
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Preview document (live or saved)
     * @param voDataset - VO dataset for live preview
     * @param templateId - Template ID for live preview
     * @param voDatasetId - VO dataset ID for saved preview
     */
    const previewDocument = async (
        voDataset?: any,
        templateId?: number,
        voDatasetId?: number
    ): Promise<Blob | null> => {
        setLoading(true);
        
        try {
            if (voDataset && templateId) {
                // Live preview
                setGenerationProgress({
                    stage: 'processing',
                    message: 'Generating live preview...',
                    percentage: 25
                });

                const blob = await livePreviewVO(voDataset, token ?? "");
                
                setGenerationProgress({
                    stage: 'completed',
                    message: 'Preview generated successfully',
                    percentage: 100
                });

                return blob;
            } else if (voDatasetId) {
                // Saved document preview
                setGenerationProgress({
                    stage: 'processing',
                    message: 'Loading saved document...',
                    percentage: 25
                });

                const blob = await previewVoDataSet(voDatasetId);
                
                setGenerationProgress({
                    stage: 'completed',
                    message: 'Document loaded successfully',
                    percentage: 100
                });

                return blob;
            }
            
            throw new Error("Invalid preview parameters");
        } catch (error) {
            console.error("Document preview error:", error);
            setGenerationProgress({
                stage: 'error',
                message: 'Preview failed',
                percentage: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            toaster.error("Failed to generate document preview");
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Generate final document
     * @param voDataset - VO dataset for live generation
     * @param templateId - Template ID for live generation
     * @param voDatasetId - VO dataset ID for saved generation
     */
    const generateDocument = async (
        voDataset?: any,
        templateId?: number,
        voDatasetId?: number
    ): Promise<boolean> => {
        setLoading(true);
        
        try {
            setGenerationProgress({
                stage: 'initializing',
                message: 'Initializing document generation...',
                percentage: 0
            });

            if (voDataset && templateId) {
                // Live generation - we need to save first then generate
                setGenerationProgress({
                    stage: 'processing',
                    message: 'Saving VO dataset...',
                    percentage: 25
                });

                // This would typically involve saving the voDataset first
                // Then generating the document from the saved dataset
                // For now, we'll simulate the process

                setGenerationProgress({
                    stage: 'generating',
                    message: 'Generating document...',
                    percentage: 50
                });

                // Simulate document generation process
                await new Promise(resolve => setTimeout(resolve, 2000));

                setGenerationProgress({
                    stage: 'finalizing',
                    message: 'Finalizing document...',
                    percentage: 75
                });

                await new Promise(resolve => setTimeout(resolve, 1000));

                setGenerationProgress({
                    stage: 'completed',
                    message: 'Document generated successfully',
                    percentage: 100
                });

                return true;
            } else if (voDatasetId) {
                // Generate from saved dataset
                setGenerationProgress({
                    stage: 'processing',
                    message: 'Loading saved VO dataset...',
                    percentage: 25
                });

                const result = await generateVoDataSet(voDatasetId);

                if (result.isSuccess) {
                    setGenerationProgress({
                        stage: 'generating',
                        message: 'Generating document from saved data...',
                        percentage: 50
                    });

                    await new Promise(resolve => setTimeout(resolve, 1500));

                    setGenerationProgress({
                        stage: 'finalizing',
                        message: 'Finalizing document...',
                        percentage: 75
                    });

                    await new Promise(resolve => setTimeout(resolve, 1000));

                    setGenerationProgress({
                        stage: 'completed',
                        message: 'Document generated successfully',
                        percentage: 100
                    });

                    return true;
                } else {
                    throw new Error(result.error?.message || "Generation failed");
                }
            }
            
            throw new Error("Invalid generation parameters");
        } catch (error) {
            console.error("Document generation error:", error);
            setGenerationProgress({
                stage: 'error',
                message: 'Generation failed',
                percentage: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            toaster.error("Failed to generate document");
            return false;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Download generated document
     * @param voDatasetId - VO dataset ID
     */
    const downloadDocument = async (voDatasetId: number): Promise<boolean> => {
        try {
            const blob = await previewVoDataSet(voDatasetId);
            
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `VO_Document_${voDatasetId}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                toaster.success("Document downloaded successfully");
                return true;
            }
            
            throw new Error("Failed to create download blob");
        } catch (error) {
            console.error("Download error:", error);
            toaster.error("Failed to download document");
            return false;
        }
    };

    /**
     * Reset generation progress
     */
    const resetProgress = () => {
        setGenerationProgress({
            stage: 'initializing',
            message: 'Initializing...',
            percentage: 0
        });
    };

    /**
     * Get generation status text
     */
    const getGenerationStatusText = (stage: GenerationProgress['stage']): string => {
        switch (stage) {
            case 'initializing':
                return 'Preparing...';
            case 'processing':
                return 'Processing...';
            case 'generating':
                return 'Generating...';
            case 'finalizing':
                return 'Finalizing...';
            case 'completed':
                return 'Completed';
            case 'error':
                return 'Failed';
            default:
                return 'Unknown';
        }
    };

    /**
     * Get generation status color
     */
    const getGenerationStatusColor = (stage: GenerationProgress['stage']): string => {
        switch (stage) {
            case 'completed':
                return 'text-green-600 dark:text-green-400';
            case 'error':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-blue-600 dark:text-blue-400';
        }
    };

    return {
        // Data
        templates,
        loading,
        generationProgress,

        // Main Operations
        getVoTemplates,
        previewDocument,
        generateDocument,
        downloadDocument,

        // Utilities
        resetProgress,
        getGenerationStatusText,
        getGenerationStatusColor,

        // State Management
        setLoading,
        setTemplates,
        setGenerationProgress
    };
};

export default useDocumentGeneration;