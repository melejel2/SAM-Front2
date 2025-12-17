import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { formatDate } from "@/utils/formatters";
import apiRequest from "@/api/api";
import {
    ContractType,
    VOContractVM,
    UploadVOTemplateRequest,
    VOServiceResult,
    VariationOrderApiError
} from "@/types/variation-order";

const useVOTemplates = () => {
    const [voTemplates, setVoTemplates] = useState<VOContractVM[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const { toaster } = useToast();
    
    const token = getToken();

    // VO Template columns matching desktop VOContract structure
    const voTemplateColumns = {
        templateNumber: "Template Number",
        name: "Template Name", 
        type: "Contract Type",
        language: "Language",
        created: "Created Date",
        fileSize: "File Size"
    };

    /**
     * Get VO templates by contract type
     * @param contractType - Filter by contract type (VO, RG, Terminate, Final)
     */
    const getVoTemplates = async (contractType: ContractType): Promise<VOContractVM[]> => {
        setLoading(true);
        
        try {
            // Map contract type to string for API
            const typeString = ContractType[contractType];
            
            const data = await apiRequest<VOContractVM[]>({
                endpoint: `VoContract/GetVoContracts?type=${typeString}`,
                method: "GET",
                token: token ?? "",
            });

            let templatesArray: VOContractVM[] = [];
            
            if (Array.isArray(data)) {
                templatesArray = data;
            } else if (data && typeof data === 'object') {
                // Handle different response wrapper patterns
                if ('data' in data && Array.isArray(data.data)) {
                    templatesArray = data.data;
                } else if ('result' in data && Array.isArray(data.result)) {
                    templatesArray = data.result;
                } else if ('items' in data && Array.isArray(data.items)) {
                    templatesArray = data.items;
                } else if ('id' in data) {
                    templatesArray = [data as unknown as VOContractVM];
                }
            }

            // Format data for table display
            const formattedTemplates = templatesArray.map((template) => ({
                ...template,
                type: getContractTypeDisplay(template.type),
                created: formatDate(template.created, 'numeric'),
                fileSize: template.content ? formatFileSize(template.content.length) : '-',
                // Add display fields for consistent table formatting
                templateNumber: template.templateNumber || '-',
                name: template.name || 'Unnamed Template',
                language: template.language || 'Default'
            }));

            setVoTemplates(formattedTemplates as unknown as VOContractVM[]);
            return formattedTemplates as unknown as VOContractVM[];
        } catch (error) {
            console.error("API Error getting VO templates:", error);
            toaster.error("Failed to load VO templates");
            setVoTemplates([]);
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Upload new VO template
     * @param templateFile - Word document template file
     * @param templateData - Template metadata
     */
    const uploadVoTemplate = async (
        templateFile: File,
        templateData: {
            name: string;
            templateNumber: string;
            type: ContractType;
            language?: string;
        }
    ): Promise<VOServiceResult> => {
        setLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('templateFile', templateFile);
            formData.append('name', templateData.name);
            formData.append('templateNumber', templateData.templateNumber);
            formData.append('type', templateData.type.toString());
            formData.append('language', templateData.language || 'English');

            const response = await apiRequest<VOServiceResult>({
                endpoint: "VoContract/UploadVoContract",
                method: "POST",
                token: token ?? "",
                body: formData,
            });

            if (response && typeof response === 'object') {
                if ('isSuccess' in response && !response.isSuccess) {
                    const errorResponse = response as VariationOrderApiError;
                    toaster.error(errorResponse.message || "Template upload failed");
                    return { isSuccess: false, error: { message: errorResponse.message || "Template upload failed" } };
                }
                
                toaster.success("VO template uploaded successfully");
                return { isSuccess: true, data: response };
            } else {
                toaster.success("VO template uploaded successfully");
                return { isSuccess: true, data: response };
            }
        } catch (error) {
            console.error("Upload VO template error:", error);
            toaster.error("Failed to upload VO template");
            return { isSuccess: false, error: { message: "Failed to upload VO template" } };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Download VO template content
     * @param templateId - Template ID
     */
    const downloadVoTemplate = async (templateId: number): Promise<Blob | null> => {
        setLoading(true);
        
        try {
            const response = await apiRequest<Blob>({
                endpoint: `VoContract/GetVoContractTemplate/${templateId}`,
                method: "GET",
                token: token ?? "",
                responseType: 'blob'
            });

            if (response instanceof Blob) {
                return response;
            } else {
                toaster.error("Failed to download template");
                return null;
            }
        } catch (error) {
            console.error("Download VO template error:", error);
            toaster.error("Failed to download VO template");
            return null;
        } finally {
            setLoading(false);
        }
    };

    /**
     * Delete VO template
     * @param templateId - Template ID to delete
     */
    const deleteVoTemplate = async (templateId: number): Promise<boolean> => {
        setLoading(true);
        
        try {
            const response = await apiRequest<VOServiceResult>({
                endpoint: `VoContract/DeleteVoContract/${templateId}`,
                method: "DELETE",
                token: token ?? "",
            });

            if (response && typeof response === 'object') {
                if ('success' in response && response.success) {
                    toaster.success("VO template deleted successfully");
                    return true;
                } else if ('success' in response && !response.success) {
                    const errorMessage = 'error' in response ? response.error : "Delete failed";
                    toaster.error(errorMessage || "Delete failed");
                    return false;
                } else {
                    toaster.success("VO template deleted successfully");
                    return true;
                }
            } else {
                toaster.success("VO template deleted successfully");
                return true;
            }
        } catch (error) {
            console.error("Delete VO template error:", error);
            toaster.error("Failed to delete VO template");
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Utility functions
    const getContractTypeDisplay = (type: ContractType): string => {
        switch (type) {
            case ContractType.VO:
                return "Variation Order";
            case ContractType.RG:
                return "Regulatory";
            case ContractType.Terminate:
                return "Termination";
            case ContractType.Final:
                return "Final";
            default:
                return "Unknown";
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return {
        // Data
        voTemplates,
        loading,
        voTemplateColumns,

        // API Functions
        getVoTemplates,
        uploadVoTemplate,
        downloadVoTemplate,
        deleteVoTemplate,

        // Utility Functions
        getContractTypeDisplay,
        formatDate,
        formatFileSize,

        // State management
        setVoTemplates,
        setLoading
    };
};

export default useVOTemplates;