import type {
    ApproveIpcRequest,
    BackendDataWrapper,
    ContractBuildingsVM,
    CorrectPreviousValueRequest,
    CorrectionHistoryDTO,
    CorrectionHistoryRequest,
    CorrectionResultDTO,
    CreateIpcRequest,
    IpcApiResponse,
    IpcApprovalStatus,
    IpcListItem,
    IpcSummaryData,
    RejectIpcRequest,
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
                error: { message: "Invalid response format" },
            };
        } catch (error) {
            console.error("Error fetching IPCs list:", error);
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : "Failed to fetch IPCs list" },
            };
        }
    }

    /**
     * Get IPCs for a specific contract
     * GET /api/Ipc/GetIpcsByContract/{contractDatasetId}
     */
    async getIpcsByContract(contractDatasetId: number, token: string): Promise<IpcApiResponse<IpcListItem[]>> {
        try {
            const response = await apiRequest<IpcListItem[]>({
                endpoint: `Ipc/GetIpcsByContract/${contractDatasetId}`,
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
                error: { message: "Invalid response format" },
            };
        } catch (error) {
            console.error("Error fetching IPCs by contract:", error);
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : "Failed to fetch IPCs by contract" },
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
                error: { message: error instanceof Error ? error.message : "Failed to fetch IPC for edit" },
            };
        }
    }

    /**
     * Get contract data for new IPC creation
     * POST /api/Ipc/GetContractDataForNewIpc?ContractDataSetID={ContractDataSetID}
     */
    async getContractDataForNewIpc(contractDataSetId: number, token: string): Promise<IpcApiResponse<SaveIPCVM>> {
        try {
            const response = await apiRequest<BackendDataWrapper<SaveIPCVM>>({
                endpoint: `Ipc/GetContractDataForNewIpc?ContractDataSetID=${contractDataSetId}`,
                method: "POST",
                token,
            });

            // Check the success status from the Result object
            if (response.isSuccess && response.value) {
                return {
                    success: true,
                    data: response.value, // Extract data from the 'value' property
                };
            } else {
                const errorMessage = ('error' in response && response.error?.message) ||
                                     ('message' in response && response.message) ||
                                     "Failed to fetch contract data for new IPC";
                return {
                    success: false,
                    error: { message: errorMessage },
                };
            }
        } catch (error) {
            console.error("Error fetching contract data for new IPC:", error);
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : "Failed to fetch contract data for new IPC" },
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
                error: { message: error instanceof Error ? error.message : "Failed to create IPC" },
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
                endpoint: "Ipc/SaveIpc",
                method: "POST",
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
                error: { message: error instanceof Error ? error.message : "Failed to update IPC" },
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
                error: { message: error instanceof Error ? error.message : "Failed to fetch IPC summary data" },
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
                error: { message: "Invalid response format" },
            };
        } catch (error) {
            console.error("Error fetching contract buildings:", error);
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : "Failed to fetch contract buildings" },
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
                error: { message: error instanceof Error ? error.message : "Failed to delete IPC" },
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
                error: { message: error instanceof Error ? error.message : "Failed to generate IPC" },
            };
        }
    }

    /**
     * Un-issue an IPC. Reverts an issued IPC back to editable status.
     * Only the last IPC of a contract can be un-issued, and only once.
     * POST /api/Ipc/UnissueIpc/{id}
     */
    async unissueIpc(
        ipcId: number,
        reason: string,
        token: string,
    ): Promise<IpcApiResponse<{ message: string }>> {
        try {
            const response = await apiRequest<{ message: string } | { code: string; message: string }>({
                endpoint: `Ipc/UnissueIpc/${ipcId}`,
                method: "POST",
                token,
                body: { reason },
            });

            // Check if response is an error payload from backend
            if (response && typeof response === 'object' && 'code' in response && 'message' in response && !('message' in response && response.message?.includes('successfully'))) {
                return {
                    success: false,
                    error: { message: response.message },
                };
            }

            return {
                success: true,
                data: response as { message: string },
            };
        } catch (error) {
            console.error("Error un-issuing IPC:", error);
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : "Failed to un-issue IPC" },
            };
        }
    }

    /**
     * Live preview IPC as PDF
     * POST /api/Ipc/LivePreviewIpcPdf
     */
    async livePreviewIpcPdf(
        model: SaveIPCVM,
        token: string,
    ): Promise<{ success: boolean; blob?: Blob; error?: string }> {
        try {
            const response = await apiRequest({
                endpoint: `Ipc/LivePreviewIpcPdf`,
                method: "POST",
                token,
                body: model as unknown as Record<string, unknown>,
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
     * Live preview IPC as Excel
     * POST /api/Ipc/LivePreviewIpcExcel
     */
    async livePreviewIpcExcel(
        model: SaveIPCVM,
        token: string,
    ): Promise<{ success: boolean; blob?: Blob; error?: string }> {
        try {
            const response = await apiRequest({
                endpoint: `Ipc/LivePreviewIpcExcel`,
                method: "POST",
                token,
                body: model as unknown as Record<string, unknown>,
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

    // ============================================
    // IPC Approval Workflow
    // ============================================

    /**
     * Approve an IPC at the current approval step.
     * POST /api/Ipc/ApproveIpc/{id}
     */
    async approveIpc(
        ipcId: number,
        token: string,
        comment?: string,
    ): Promise<IpcApiResponse<{ message: string }>> {
        try {
            const body: ApproveIpcRequest = { comment };
            const response = await apiRequest<{ message: string }>({
                endpoint: `Ipc/ApproveIpc/${ipcId}`,
                method: "POST",
                token,
                body: body as unknown as Record<string, unknown>,
            });

            return {
                success: true,
                data: response as { message: string },
            };
        } catch (error) {
            console.error("Error approving IPC:", error);
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : "Failed to approve IPC" },
            };
        }
    }

    /**
     * Reject an IPC at the current approval step. Reverts IPC to Editable.
     * POST /api/Ipc/RejectIpc/{id}
     */
    async rejectIpc(
        ipcId: number,
        token: string,
        comment?: string,
    ): Promise<IpcApiResponse<{ message: string }>> {
        try {
            const body: RejectIpcRequest = { comment };
            const response = await apiRequest<{ message: string }>({
                endpoint: `Ipc/RejectIpc/${ipcId}`,
                method: "POST",
                token,
                body: body as unknown as Record<string, unknown>,
            });

            return {
                success: true,
                data: response as { message: string },
            };
        } catch (error) {
            console.error("Error rejecting IPC:", error);
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : "Failed to reject IPC" },
            };
        }
    }

    /**
     * Get the approval workflow status for an IPC.
     * GET /api/Ipc/GetApprovalStatus/{id}
     */
    async getApprovalStatus(
        ipcId: number,
        token: string,
    ): Promise<IpcApiResponse<IpcApprovalStatus>> {
        try {
            const response = await apiRequest<IpcApprovalStatus>({
                endpoint: `Ipc/GetApprovalStatus/${ipcId}`,
                method: "GET",
                token,
            });

            return {
                success: true,
                data: response as IpcApprovalStatus,
            };
        } catch (error) {
            console.error("Error fetching approval status:", error);
            return {
                success: false,
                error: { message: error instanceof Error ? error.message : "Failed to fetch approval status" },
            };
        }
    }

    // ============================================
    // Previous Value Corrections
    // ============================================

    /**
     * Correct a previous value for BOQ, VO, or Deduction items.
     * Only ContractsManager, QuantitySurveyor, and Admin can perform corrections.
     * POST /api/Ipc/CorrectPreviousValue
     */
    async correctPreviousValue(
        request: CorrectPreviousValueRequest,
        token: string,
    ): Promise<IpcApiResponse<CorrectionResultDTO>> {
        try {
            const response = await apiRequest<BackendDataWrapper<CorrectionResultDTO>>({
                endpoint: "Ipc/CorrectPreviousValue",
                method: "POST",
                token,
                body: request as unknown as Record<string, unknown>,
            });

            if (response.isSuccess && response.value) {
                return {
                    success: true,
                    data: response.value,
                };
            } else {
                const errorMessage =
                    ("error" in response && response.error?.message) ||
                    ("message" in response && response.message) ||
                    "Failed to correct previous value";
                return {
                    success: false,
                    error: { message: errorMessage },
                };
            }
        } catch (error) {
            console.error("Error correcting previous value:", error);
            return {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : "Failed to correct previous value",
                },
            };
        }
    }

    /**
     * Get correction history for audit trail.
     * POST /api/Ipc/GetCorrectionHistory
     */
    async getCorrectionHistory(
        request: CorrectionHistoryRequest,
        token: string,
    ): Promise<IpcApiResponse<CorrectionHistoryDTO[]>> {
        try {
            const response = await apiRequest<BackendDataWrapper<CorrectionHistoryDTO[]>>({
                endpoint: "Ipc/GetCorrectionHistory",
                method: "POST",
                token,
                body: request as unknown as Record<string, unknown>,
            });

            if (response.isSuccess && response.value) {
                return {
                    success: true,
                    data: response.value,
                };
            } else {
                const errorMessage =
                    ("error" in response && response.error?.message) ||
                    ("message" in response && response.message) ||
                    "Failed to fetch correction history";
                return {
                    success: false,
                    error: { message: errorMessage },
                };
            }
        } catch (error) {
            console.error("Error fetching correction history:", error);
            return {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : "Failed to fetch correction history",
                },
            };
        }
    }
}

// Export singleton instance
export const ipcApiService = new IpcApiService();
export default ipcApiService;
