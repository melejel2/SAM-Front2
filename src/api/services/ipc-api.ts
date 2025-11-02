import type {
    ContractBuildingsVM,
    CreateIpcRequest,
    IpcApiResponse,
    IpcListItem,
    IpcSummaryData,
    SaveIPCVM,
    UpdateIpcRequest,
} from "../../types/ipc";
import apiRequest from "../api";

// IPC Service - Synchronized with SAMBACK IPC endpoints
class IpcApiService {
    /**
     * Get list of all IPCs
     * GET /api/Ipc/GetIpcsList
     */
    async getIpcsList(token: string): Promise<IpcApiResponse<IpcListItem[]>> {
        try {
            const response = await apiRequest<IpcListItem[]>({
                endpoint: "Ipc/GetIpcsList",
                method: "GET",
                token,
            });

            if (Array.isArray(response)) {
                return {
                    success: true,
                    data: response,
                };
            }

            return {
                success: false,
                error: "Invalid response format",
            };
        } catch (error) {
            console.error("Error fetching IPCs list:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch IPCs list",
            };
        }
    }

    /**
     * Get IPC details for editing
     * GET /api/Ipc/GetIpcForEdit/{id}
     */
    async getIpcForEdit(ipcId: number, token: string): Promise<IpcApiResponse<SaveIPCVM>> {
        try {
            const response = await apiRequest<SaveIPCVM>({
                endpoint: `Ipc/OpenIpc/${ipcId}`,
                method: "GET",
                token,
            });

            return {
                success: true,
                data: response as SaveIPCVM,
            };
        } catch (error) {
            console.error("Error fetching IPC for edit:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch IPC for edit",
            };
        }
    }

    /**
     * Get contract data for new IPC creation
     * POST /api/Ipc/GetContractDataForNewIpc?ContractDataSetID={ContractDataSetID}
     */
    async getContractDataForNewIpc(contractDataSetId: number, token: string): Promise<IpcApiResponse<SaveIPCVM>> {
        try {
            const response = await apiRequest<SaveIPCVM>({
                endpoint: `Ipc/GetContractDataForNewIpc?ContractDataSetID=${contractDataSetId}`,
                method: "POST",
                token,
            });

            return {
                success: true,
                data: response as SaveIPCVM,
            };
        } catch (error) {
            console.error("Error fetching contract data for new IPC:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch contract data for new IPC",
            };
        }
    }

    /**
     * Create new IPC
     * POST /api/Ipc/CreateIpc
     */
    async createIpc(request: CreateIpcRequest, token: string): Promise<IpcApiResponse<SaveIPCVM>> {
        try {
            const response = await apiRequest<SaveIPCVM>({
                endpoint: "Ipc/SaveIpc",
                method: "POST",
                token,
                body: request as unknown as Record<string, unknown>,
            });

            return {
                success: true,
                data: response as SaveIPCVM,
            };
        } catch (error) {
            console.error("Error creating IPC:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to create IPC",
            };
        }
    }

    /**
     * Update existing IPC
     * PUT /api/Ipc/UpdateIpc
     */
    async updateIpc(request: UpdateIpcRequest, token: string): Promise<IpcApiResponse<boolean>> {
        try {
            const response = await apiRequest<boolean>({
                endpoint: "Ipc/UpdateIpc",
                method: "PUT",
                token,
                body: request as unknown as Record<string, unknown>,
            });

            return {
                success: true,
                data: response as boolean,
            };
        } catch (error) {
            console.error("Error updating IPC:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to update IPC",
            };
        }
    }

    /**
     * Get IPC summary data (NEW)
     * This provides Amount, PreviousPaid, Remaining values for IPC edit forms
     * GET /api/Ipc/GetIpcSummaryData/{contractsDatasetId}
     */
    async getIpcSummaryData(contractsDatasetId: number, token: string): Promise<IpcApiResponse<IpcSummaryData>> {
        try {
            const response = await apiRequest<IpcSummaryData>({
                endpoint: `Ipc/GetIpcSummaryData/${contractsDatasetId}`,
                method: "GET",
                token,
            });

            return {
                success: true,
                data: response as IpcSummaryData,
            };
        } catch (error) {
            console.error("Error fetching IPC summary data:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch IPC summary data",
            };
        }
    }

    /**
     * Get contract buildings with BOQ data for IPC
     * GET /api/Ipc/GetContractBuildings/{contractsDatasetId}
     */
    async getContractBuildings(
        contractsDatasetId: number,
        token: string,
    ): Promise<IpcApiResponse<ContractBuildingsVM[]>> {
        try {
            const response = await apiRequest<ContractBuildingsVM[]>({
                endpoint: `Ipc/GetContractBuildings/${contractsDatasetId}`,
                method: "GET",
                token,
            });

            if (Array.isArray(response)) {
                return {
                    success: true,
                    data: response,
                };
            }

            return {
                success: false,
                error: "Invalid response format",
            };
        } catch (error) {
            console.error("Error fetching contract buildings:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to fetch contract buildings",
            };
        }
    }

    /**
     * Delete IPC
     * DELETE /api/Ipc/DeleteIpc/{id}
     */
    async deleteIpc(ipcId: number, token: string): Promise<IpcApiResponse<boolean>> {
        try {
            const response = await apiRequest<boolean>({
                endpoint: `Ipc/DeleteIpc/${ipcId}`,
                method: "DELETE",
                token,
            });

            return {
                success: true,
                data: response as boolean,
            };
        } catch (error) {
            console.error("Error deleting IPC:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to delete IPC",
            };
        }
    }

    /**
     * Export IPC as PDF
     * GET /api/Ipc/ExportIpcPdf/{id}
     */
    async exportIpcPdf(ipcId: number, token: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
        try {
            const response = await apiRequest({
                endpoint: `Ipc/ExportIpcPdf/${ipcId}`,
                method: "GET",
                token,
                responseType: "blob",
            });

            if (response instanceof Blob) {
                return { success: true, blob: response };
            }

            return { success: false, error: "Invalid response format" };
        } catch (error) {
            console.error("Error exporting IPC PDF:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to export IPC PDF",
            };
        }
    }

    /**
     * Export IPC as Excel
     * GET /api/Ipc/ExportIpcExcel/{id}
     */
    async exportIpcExcel(ipcId: number, token: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
        try {
            const response = await apiRequest({
                endpoint: `Ipc/ExportIpcExcel/${ipcId}`,
                method: "GET",
                token,
                responseType: "blob",
            });

            if (response instanceof Blob) {
                return { success: true, blob: response };
            }

            return { success: false, error: "Invalid response format" };
        } catch (error) {
            console.error("Error exporting IPC Excel:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to export IPC Excel",
            };
        }
    }

    /**
     * Export IPC as ZIP (combined documents)
     * GET /api/Ipc/ExportIpc/{id}
     */
    async exportIpcZip(ipcId: number, token: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
        try {
            const response = await apiRequest({
                endpoint: `Ipc/ExportIpc/${ipcId}`,
                method: "GET",
                token,
                responseType: "blob",
            });

            if (response instanceof Blob) {
                return { success: true, blob: response };
            }

            return { success: false, error: "Invalid response format" };
        } catch (error) {
            console.error("Error exporting IPC ZIP:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to export IPC ZIP",
            };
        }
    }

    /**
     * Generate IPC documents
     * POST /api/Ipc/GenerateIpc/{id}
     */
    async generateIpc(ipcId: number, token: string): Promise<IpcApiResponse<boolean>> {
        try {
            const response = await apiRequest<boolean>({
                endpoint: `Ipc/GenerateIpc/${ipcId}`,
                method: "POST",
                token,
            });

            return {
                success: true,
                data: response as boolean,
            };
        } catch (error) {
            console.error("Error generating IPC:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to generate IPC",
            };
        }
    }
}

// Export singleton instance
export const ipcApiService = new IpcApiService();
export default ipcApiService;
