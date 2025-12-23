import apiRequest from "@/api/api";
import {
    ApiResult,
    AttachDocVM,
    BoqContractVM,
    ClearContractBoqItemsRequest,
    ContractDatasetListItem,
    ContractDatasetStatus,
    ContractExportResult,
    ContractsApiResponse,
    CopyBoqItemsRequest,
    ImportContractBoqsRequest,
    ParticularConditionVM,
    SubcontractorBoqVM,
} from "@/types/contracts";
import { Subcontractor } from "@/types/subcontractor";

export enum ContractType {
    contract = 0,
    RG = 1,
    Terminate = 2,
    Final = 3,
}

// Helper function to handle API responses
const handleApiResponse = <T>(response: any): ContractsApiResponse<T> => {
    if (response && typeof response === "object") {
        // Handle success response
        if ("success" in response && response.success) {
            return {
                success: true,
                data: response.data,
                message: response.message,
            };
        }

        // Handle error response
        if ("success" in response && !response.success) {
            return {
                success: false,
                error: response.error || response.message || "Operation failed",
                message: response.message,
            };
        }

        // Handle backend Result format
        if ("isSuccess" in response) {
            if (response.isSuccess) {
                return {
                    success: true,
                    data: response.data,
                    message: response.message || "Operation completed successfully",
                };
            } else {
                return {
                    success: false,
                    error: response.error?.message || response.message || "Operation failed",
                    message: response.error?.message || response.message,
                };
            }
        }

        // For direct data responses
        return {
            success: true,
            data: response as T,
            message: "Operation completed successfully",
        };
    }

    return {
        success: false,
        error: "Invalid response format",
        message: "Invalid response from server",
    };
};

/**
 * Get all contract datasets for a selected status
 * @param status Contract dataset status
 * @param token Authentication token
 */
export const getContractsDatasetsList = async (
    status: ContractDatasetStatus,
    token: string,
): Promise<ContractsApiResponse<ContractDatasetListItem[]>> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/GetContractsDatasetsList/${status}`,
            method: "GET",
            token,
        });

        return handleApiResponse<ContractDatasetListItem[]>(response);
    } catch (error) {
        console.error("Get contracts datasets API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch contracts",
            message: "An error occurred while fetching contracts",
        };
    }
};

/**
 * Get subcontractor BOQ data for editing
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const getSubcontractorData = async (
    id: number,
    token: string,
): Promise<ContractsApiResponse<SubcontractorBoqVM>> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/GetSubcontractorData/${id}`,
            method: "GET",
            token,
        });

        return handleApiResponse<SubcontractorBoqVM>(response);
    } catch (error) {
        console.error("Get subcontractor data API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch subcontractor data",
            message: "An error occurred while fetching subcontractor data",
        };
    }
};

/**
 * Save or update subcontractor dataset
 * @param model SubcontractorBoqVM containing the dataset to save
 * @param token Authentication token
 */
export const saveSubcontractorDataset = async (
    model: SubcontractorBoqVM,
    token: string,
): Promise<ContractsApiResponse> => {
    try {
        const response = await apiRequest({
            endpoint: "ContractsDatasets/SaveSubcontractorDataset",
            method: "POST",
            token,
            body: model, // Send model directly, not wrapped in an object
        });

        const processedResponse = handleApiResponse(response);

        return processedResponse;
    } catch (error) {
        console.error("🚨 Save subcontractor dataset API Error:", error);
        console.error("🚨 Error details:", {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to save contract",
            message: "An error occurred while saving the contract",
        };
    }
};

/**
 * Copy BOQ items to contract dataset from specific buildings and sheets
 * @param request Request containing sheet name and building IDs
 * @param token Authentication token
 */
export const copyBoqItemsToContract = async (
    request: CopyBoqItemsRequest,
    token: string,
): Promise<ContractsApiResponse<BoqContractVM[]>> => {
    try {
        const response = await apiRequest({
            endpoint: "ContractsDatasets/CopyBoqItemsToContract",
            method: "POST",
            token,
            body: request,
        });

        return handleApiResponse<BoqContractVM[]>(response);
    } catch (error) {
        console.error("Copy BOQ items API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to copy BOQ items",
            message: "An error occurred while copying BOQ items",
        };
    }
};

/**
 * Preview contract BOQ items from an uploaded Excel file
 * @param request ImportContractBoqsRequest containing file and parameters
 * @param token Authentication token
 */
export const getContractBoqItemsFromExcel = async (
    request: ImportContractBoqsRequest,
    token: string,
): Promise<ContractsApiResponse<BoqContractVM[]>> => {
    try {
        const formData = new FormData();
        formData.append("ContractsDataSetId", request.contractsDataSetId.toString());
        formData.append("BuildingId", request.buildingId.toString());
        formData.append("SheetName", request.sheetName);
        if (request.excelFile) {
            formData.append("excelFile", request.excelFile);
        }

        const response = await apiRequest({
            endpoint: "ContractsDatasets/GetContractBoqItemsFromExcel",
            method: "POST",
            token,
            body: formData,
        });

        return handleApiResponse<BoqContractVM[]>(response);
    } catch (error) {
        console.error("Import contract BOQs API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to import BOQ items",
            message: "An error occurred while importing BOQ items from Excel",
        };
    }
};

/**
 * Clear BOQ items based on the specified scope (Sheet, Building, or Project)
 * @param request Clear request with scope and required IDs
 * @param token Authentication token
 */
export const clearContractBoqItems = async (
    request: ClearContractBoqItemsRequest,
    token: string,
): Promise<ContractsApiResponse> => {
    try {
        const response = await apiRequest({
            endpoint: "ContractsDatasets/ClearContractBoqItems",
            method: "POST",
            token,
            body: request,
        });

        return handleApiResponse(response);
    } catch (error) {
        console.error("Clear contract BOQ items API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to clear BOQ items",
            message: "An error occurred while clearing BOQ items",
        };
    }
};

/**
 * Generate contract BOQ
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const generateContract = async (id: number, token: string): Promise<ContractsApiResponse> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/GenerateContract/${id}`,
            method: "POST",
            token,
        });

        return handleApiResponse(response);
    } catch (error) {
        console.error("Generate contract API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate contract",
            message: "An error occurred while generating the contract",
        };
    }
};

/**
 * Terminate contract BOQ
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const terminateContract = async (id: number, token: string): Promise<ContractsApiResponse> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/TerminateContract/${id}`,
            method: "POST",
            token,
        });

        return handleApiResponse(response);
    } catch (error) {
        console.error("Terminate contract API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to terminate contract",
            message: "An error occurred while terminating the contract",
        };
    }
};

/**
 * Generate final contract BOQ
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const generateFinalContract = async (id: number, token: string): Promise<ContractsApiResponse> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/GenerateFinalContract/${id}`,
            method: "POST",
            token,
        });

        return handleApiResponse(response);
    } catch (error) {
        console.error("Generate final contract API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate final contract",
            message: "An error occurred while generating the final contract",
        };
    }
};

/**
 * Delete an editable subcontractor BOQ
 * @param id Contract BOQ ID to delete
 * @param token Authentication token
 */
export const deleteSubContractorBoq = async (id: number, token: string): Promise<ContractsApiResponse> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/DeleteSubContractorBoq/${id}`,
            method: "DELETE",
            token,
        });

        return handleApiResponse(response);
    } catch (error) {
        console.error("Delete contract BOQ API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete contract",
            message: "An error occurred while deleting the contract",
        };
    }
};

/**
 * Get contracts for a specific project and subcontractor
 * @param projectId Project ID
 * @param subcontractorId Subcontractor ID
 * @param token Authentication token
 */
export const getContractsByProjectsAndSub = async (
    projectId: number,
    subcontractorId: number,
    token: string,
): Promise<ContractsApiResponse<ContractDatasetListItem[]>> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/GetContractsByProjectsAndSub?projectId=${projectId}&subcontractorId=${subcontractorId}`,
            method: "GET",
            token,
        });

        return handleApiResponse<ContractDatasetListItem[]>(response);
    } catch (error) {
        console.error("Get contracts by project and sub API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch contracts",
            message: "An error occurred while fetching contracts for project and subcontractor",
        };
    }
};

/**
 * Get subcontractors for a specific project
 * @param projectId Project ID
 * @param token Authentication token
 */
export const getSubcontractorsByProjectId = async (
    projectId: number,
    token: string,
): Promise<ContractsApiResponse<Subcontractor[]>> => {
    try {
        const response = await apiRequest({
            endpoint: `Subcontractors/GetSubcontractorsByProjectId?projectId=${projectId}`,
            method: "GET",
            token,
        });

        return handleApiResponse<Subcontractor[]>(response);
    } catch (error) {
        console.error("Get subcontractors by project ID API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch subcontractors",
            message: "An error occurred while fetching subcontractors for the project",
        };
    }
};

/**
 * Attach document to contract
 * @param request AttachDocVM containing the document to attach
 * @param token Authentication token
 */
export const attachDoc = async (request: AttachDocVM, token: string): Promise<ContractsApiResponse> => {
    try {
        const formData = new FormData();
        formData.append("contractsDataSetId", request.contractsDataSetId.toString());
        formData.append("attachmentsType", request.attachmentsType.toString());
        formData.append("wordFile", request.wordFile);

        const response = await apiRequest({
            endpoint: "ContractsDatasets/AttachDoc",
            method: "POST",
            token,
            body: formData,
        });

        return handleApiResponse(response);
    } catch (error) {
        console.error("Attach document API Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to attach document",
            message: "An error occurred while attaching the document",
        };
    }
};

// Document Generation and Export Functions

/**
 * Preview a contract document (Word format)
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const previewContract = async (id: number, token: string): Promise<Blob> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/PreviewContract/${id}`,
            method: "GET",
            token,
            responseType: "blob",
        });

        return response as Blob;
    } catch (error) {
        console.error("Preview contract API Error:", error);
        throw error;
    }
};

/**
 * Export contract as both Word and PDF files in a ZIP archive
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const exportContract = async (id: number, token: string): Promise<Blob> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/ExportContract/${id}`,
            method: "GET",
            token,
            responseType: "blob",
        });

        return response as Blob;
    } catch (error) {
        console.error("Export contract API Error:", error);
        throw error;
    }
};

/**
 * Export contract as PDF file only
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const exportContractPdf = async (id: number, token: string): Promise<Blob> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/ExportContractPdf/${id}`,
            method: "GET",
            token,
            responseType: "blob",
            timeout: 180000, // 3 minutes for PDF conversion (longer than default 2 min)
        });

        return response as Blob;
    } catch (error) {
        console.error("Export contract PDF API Error:", error);
        throw error;
    }
};

/**
 * Export contract as Word file only
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const exportContractWord = async (id: number, token: string): Promise<Blob> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/ExportContractWord/${id}`,
            method: "GET",
            token,
            responseType: "blob",
        });

        return response as Blob;
    } catch (error) {
        console.error("Export contract Word API Error:", error);
        throw error;
    }
};

// Live Preview Functions (for models not saved to DB)

/**
 * Generate a live preview of a contract (ZIP with Word and PDF) from a model
 * @param model SubcontractorBoqVM containing the dataset to preview
 * @param token Authentication token
 * @deprecated Use livePreviewPdf or livePreviewWord for individual formats instead
 */
export const livePreview = async (model: SubcontractorBoqVM, token: string): Promise<Blob> => {
    try {
        const response = await apiRequest({
            endpoint: "ContractsDatasets/LivePreview",
            method: "POST",
            token,
            body: model,
            responseType: "blob",
        });

        return response as Blob;
    } catch (error) {
        console.error("Live preview API Error:", error);
        throw error;
    }
};

/**
 * Generate a live preview PDF of a contract from a model
 * @param model SubcontractorBoqVM containing the dataset to preview
 * @param token Authentication token
 */
export const livePreviewPdf = async (model: SubcontractorBoqVM, token: string): Promise<Blob> => {
    try {
        const response = await apiRequest({
            endpoint: "ContractsDatasets/LivePreviewPdf",
            method: "POST",
            token,
            body: model,
            responseType: "blob",
            timeout: 180000, // 3 minutes for PDF conversion (longer than default 2 min)
        });

        return response as Blob;
    } catch (error) {
        console.error("Live preview PDF API Error:", error);
        throw error;
    }
};

/**
 * Generate a live preview Word document of a contract from a model
 * @param model SubcontractorBoqVM containing the dataset to preview
 * @param token Authentication token
 */
export const livePreviewWord = async (model: SubcontractorBoqVM, token: string): Promise<Blob> => {
    try {
        const response = await apiRequest({
            endpoint: "ContractsDatasets/LivePreviewWord",
            method: "POST",
            token,
            body: model,
            responseType: "blob",
        });

        return response as Blob;
    } catch (error) {
        console.error("Live preview Word API Error:", error);
        throw error;
    }
};

/**
 * Get particular conditions for an active contract dataset
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const getParticularConditions = async (
    id: number,
    token: string,
): Promise<ContractsApiResponse<ParticularConditionVM>> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/EditActiveContractBoq/${id}`,
            method: "GET",
            token,
        });

        return handleApiResponse<ParticularConditionVM>(response);
    } catch (error) {
        console.error("Get particular conditions API Error:", error);
        throw error;
    }
};

/**
 * Save particular conditions for an active contract dataset
 * @param model ParticularConditionVM data to save
 * @param token Authentication token
 */
export const saveParticularConditions = async (
    model: ParticularConditionVM,
    token: string,
): Promise<ContractsApiResponse<void>> => {
    try {
        const response = await apiRequest({
            endpoint: "ContractsDatasets/SaveActiveContractBoq",
            method: "POST",
            token,
            body: model,
        });

        return handleApiResponse<void>(response);
    } catch (error) {
        console.error("Save particular conditions API Error:", error);
        throw error;
    }
};

/**
 * Export terminated contract as Word file only
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const exportTerminatedContractFile = async (id: number, token: string): Promise<Blob> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/ExportTerminateFile/${id}`,
            method: "GET",
            token,
            responseType: "blob",
        });

        return response as Blob;
    } catch (error) {
        console.error("Export terminated contract Word API Error:", error);
        throw error;
    }
};

/**
 * Export final discharge document as PDF
 * @param id Contract dataset ID
 * @param token Authentication token
 */
export const exportFinalDischargeFile = async (id: number, token: string): Promise<Blob> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/ExportFinalFile/${id}`,
            method: "GET",
            token,
            responseType: "blob",
            timeout: 180000, // 3 minutes for PDF conversion
        });

        return response as Blob;
    } catch (error) {
        console.error("Export final discharge PDF API Error:", error);
        throw error;
    }
};

/**
 * Preview a contract file
 * @param id Contract dataset ID
 * @param type Contract type
 * @param token Authentication token
 */
export const previewContractFile = async (id: number, type: ContractType, token: string): Promise<Blob> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/PreviewContractFile?id=${id}&type=${type}`,
            method: "GET",
            token,
            responseType: "blob",
        });

        return response as Blob;
    } catch (error) {
        console.error("Preview contract file API Error:", error);
        throw error;
    }
};

/**
 * Update the contract file with user-edited Word document content
 * @param id Contract dataset ID
 * @param file The edited Word document file (Blob)
 * @param token Authentication token
 */
export const updateContractFile = async (
    id: number,
    file: Blob,
    token: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
        const formData = new FormData();
        formData.append("file", file, `contract_${id}.docx`);

        const response = await apiRequest({
            endpoint: `ContractsDatasets/UpdateContractFile/${id}`,
            method: "POST",
            token,
            body: formData,
        });

        return response as { success: boolean; message?: string; error?: string };
    } catch (error) {
        console.error("Update contract file API Error:", error);
        throw error;
    }
};

/**
 * Get contract document in SFDT format for Document Editor
 * @param id Contract dataset ID
 * @param token Authentication token
 * @returns SFDT JSON string for Syncfusion Document Editor
 */
export const getContractSfdt = async (id: number, token: string): Promise<string> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/GetContractSfdt/${id}`,
            method: "GET",
            token,
            responseType: "json",
        });

        // Check for error response
        if (response && typeof response === 'object' && 'success' in response && !response.success) {
            throw new Error((response as any).message || 'Failed to load SFDT content');
        }

        // SFDT needs to be a JSON string for documentEditor.open()
        // If the response is already an object (parsed by apiRequest), stringify it
        if (typeof response === 'object') {
            return JSON.stringify(response);
        }

        return response as string;
    } catch (error) {
        console.error("Get contract SFDT API Error:", error);
        throw error;
    }
};

/**
 * Save edited contract document from SFDT format
 * @param id Contract dataset ID
 * @param sfdtContent SFDT JSON string from Document Editor
 * @param token Authentication token
 */
export const saveContractFromSfdt = async (
    id: number,
    sfdtContent: string,
    token: string,
): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
        const response = await apiRequest({
            endpoint: `ContractsDatasets/SaveContractFromSfdt/${id}`,
            method: "POST",
            token,
            body: sfdtContent,
            headers: {
                "Content-Type": "application/json",
            },
        });

        return response as { success: boolean; message?: string; error?: string };
    } catch (error) {
        console.error("Save contract from SFDT API Error:", error);
        throw error;
    }
};

// Export all functions for easy importing
export {
    ContractDatasetStatus,
    type SubcontractorBoqVM,
    type ContractDatasetListItem,
    type ContractsApiResponse,
    type CopyBoqItemsRequest,
    type ImportContractBoqsRequest,
    type ClearContractBoqItemsRequest,
    type AttachDocVM,
    type BoqContractVM,
    type ParticularConditionVM,
};
