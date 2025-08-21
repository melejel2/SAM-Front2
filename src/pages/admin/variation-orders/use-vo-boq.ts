import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import {
  VoVM,
  ImportVoRequest,
  ClearBoqItemsRequest,
  VariationOrderApiError,
  UploadVoResponse,
  VOServiceResult,
  BoqDeletionScope
} from "@/types/variation-order";

/**
 * Specialized hook for managing VO BOQs (Project Budget-level Variation Orders)
 * This handles the creation and management of VOs at the BOQ level
 */
const useVoBOQ = () => {
  const [voData, setVoData] = useState<VoVM[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const { getToken } = useAuth();
  const { toaster } = useToast();

  const token = getToken();

  /**
   * Get VOs for a building with optional level filtering
   * @param buildingId - The building ID
   * @param level - Optional level filter
   */
  const getVos = async (buildingId: number, level?: number): Promise<VoVM[]> => {
    setLoading(true);
    
    try {
      const queryParams = new URLSearchParams({
        buildingId: buildingId.toString()
      });
      
      if (level !== undefined) {
        queryParams.append('level', level.toString());
      }

      const data = await apiRequest<VoVM[]>({
        endpoint: `Vo/GetVos?${queryParams.toString()}`,
        method: "GET",
        token: token ?? "",
      });

      if (Array.isArray(data)) {
        setVoData(data);
        return data;
      } else {
        console.error("Unexpected response format for VOs", data);
        setVoData([]);
        return [];
      }
    } catch (error) {
      console.error("API Error getting VOs:", error);
      toaster.error("Failed to load variation orders");
      setVoData([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload VO Excel file for preview
   * @param request - Import request with file and parameters
   */
  const uploadVo = async (request: ImportVoRequest): Promise<UploadVoResponse> => {
    setUploadLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('ProjectId', request.projectId.toString());
      formData.append('BuildingId', request.buildingId.toString());
      formData.append('SheetId', request.sheetId.toString());
      formData.append('VoLevel', (request.voLevel || 1).toString());
      formData.append('IsFromBudgetBoq', (request.isFromBudgetBoq || false).toString());
      
      if (request.excelFile) {
        formData.append('excelFile', request.excelFile);
      }

      const response = await apiRequest<UploadVoResponse>({
        endpoint: "Vo/UploadVo",
        method: "POST",
        token: token ?? "",
        body: formData,
      });

      if (response && typeof response === 'object') {
        if ('isSuccess' in response && !response.isSuccess) {
          const errorResponse = response as VariationOrderApiError;
          toaster.error(errorResponse.message || "Upload failed");
          return { success: false, message: errorResponse.message };
        }
        
        toaster.success("VO uploaded successfully");
        return { success: true, data: response };
      } else {
        toaster.success("VO uploaded successfully");
        return { success: true, data: response };
      }
    } catch (error) {
      console.error("Upload VO error:", error);
      toaster.error("Failed to upload VO file");
      return { success: false, message: "Failed to upload VO file" };
    } finally {
      setUploadLoading(false);
    }
  };

  /**
   * Save VOs data
   * @param vos - Array of VO data to save
   */
  const saveVo = async (vos: VoVM[]): Promise<VOServiceResult> => {
    setSaveLoading(true);
    
    try {
      const response = await apiRequest<VOServiceResult>({
        endpoint: "Vo/SaveVo",
        method: "POST",
        token: token ?? "",
        body: vos as any,
      });

      if (response && typeof response === 'object') {
        if ('isSuccess' in response && !response.isSuccess) {
          const errorResponse = response as VariationOrderApiError;
          toaster.error(errorResponse.message || "Save failed");
          return { isSuccess: false, error: { message: errorResponse.message || "Save failed" } };
        }
        
        toaster.success("VOs saved successfully");
        return { isSuccess: true, data: response };
      } else {
        toaster.success("VOs saved successfully");
        return { isSuccess: true, data: response };
      }
    } catch (error) {
      console.error("Save VO error:", error);
      toaster.error("Failed to save VOs");
      return { isSuccess: false, error: { message: "Failed to save VOs" } };
    } finally {
      setSaveLoading(false);
    }
  };

  /**
   * Clear VO items based on scope
   * @param request - Clear request with scope and IDs
   */
  const clearVo = async (request: ClearBoqItemsRequest): Promise<VOServiceResult> => {
    setLoading(true);
    
    try {
      const response = await apiRequest<VOServiceResult>({
        endpoint: "Vo/ClearVo",
        method: "POST",
        token: token ?? "",
        body: request as any,
      });

      if (response && typeof response === 'object') {
        if ('isSuccess' in response && !response.isSuccess) {
          const errorResponse = response as VariationOrderApiError;
          toaster.error(errorResponse.message || "Clear operation failed");
          return { isSuccess: false, error: { message: errorResponse.message || "Clear operation failed" } };
        }
        
        toaster.success("VOs cleared successfully");
        return { isSuccess: true, data: response };
      } else {
        toaster.success("VOs cleared successfully");
        return { isSuccess: true, data: response };
      }
    } catch (error) {
      console.error("Clear VO error:", error);
      toaster.error("Failed to clear VOs");
      return { isSuccess: false, error: { message: "Failed to clear VOs" } };
    } finally {
      setLoading(false);
    }
  };

  // Utility methods for common clear operations
  const clearVoSheet = (projectId: number, buildingId: number, sheetId: number) => {
    return clearVo({
      scope: BoqDeletionScope.Sheet,
      projectId,
      buildingId,
      sheetId
    });
  };

  const clearVoBuilding = (projectId: number, buildingId: number) => {
    return clearVo({
      scope: BoqDeletionScope.Building,
      projectId,
      buildingId
    });
  };

  const clearVoProject = (projectId: number) => {
    return clearVo({
      scope: BoqDeletionScope.Project,
      projectId
    });
  };

  /**
   * Upload VO from Budget BOQ
   * @param projectId - Project ID
   * @param buildingId - Building ID
   * @param sheetId - Sheet ID
   * @param voLevel - VO Level (default 1)
   */
  const uploadVoFromBudgetBoq = async (
    projectId: number,
    buildingId: number,
    sheetId: number,
    voLevel: number = 1
  ): Promise<UploadVoResponse> => {
    return uploadVo({
      projectId,
      buildingId,
      sheetId,
      voLevel,
      isFromBudgetBoq: true
    });
  };

  /**
   * Upload VO from Excel file
   * @param projectId - Project ID
   * @param buildingId - Building ID
   * @param sheetId - Sheet ID
   * @param file - Excel file
   * @param voLevel - VO Level (default 1)
   */
  const uploadVoFromExcel = async (
    projectId: number,
    buildingId: number,
    sheetId: number,
    file: File,
    voLevel: number = 1
  ): Promise<UploadVoResponse> => {
    return uploadVo({
      projectId,
      buildingId,
      sheetId,
      voLevel,
      excelFile: file,
      isFromBudgetBoq: false
    });
  };

  return {
    // State
    voData,
    loading,
    uploadLoading,
    saveLoading,

    // Main VO BOQ Functions
    getVos,
    uploadVo,
    saveVo,
    clearVo,

    // Convenience methods for clearing
    clearVoSheet,
    clearVoBuilding,
    clearVoProject,

    // Convenience methods for uploading
    uploadVoFromBudgetBoq,
    uploadVoFromExcel,
  };
};

export default useVoBOQ;