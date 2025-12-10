import { useState, useRef } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import {
  VoVM,
  VoDatasetVM,
  VoDatasetBoqDetailsVM,
  ContractDatasetStatus,
  ImportVoRequest,
  ClearBoqItemsRequest,
  VariationOrderApiResponse,
  VariationOrderApiError,
  UploadVoResponse,
  VOServiceResult,
  FormattedVoDataset,
  VOTableColumns
} from "@/types/variation-order";

const useVariationOrders = () => {
  // State management
  const [voData, setVoData] = useState<VoVM[]>([]);
  const [voDatasets, setVoDatasets] = useState<FormattedVoDataset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const isApiCallInProgress = useRef(false);

  const { getToken } = useAuth();
  const { toaster } = useToast();

  const token = getToken();

  // Utility functions
  const formatCurrency = (amount: number): string => {
    if (!amount || isNaN(amount)) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '-';
    }
  };

  const formatStatusBadge = (status: string): string => {
    const statusLower = status?.toLowerCase() || '';
    let badgeClass = '';
    let displayText = status || '';

    if (statusLower.includes('active')) {
      badgeClass = 'badge-vo-active';
      displayText = 'Active';
    } else if (statusLower.includes('terminated')) {
      badgeClass = 'badge-vo-terminated';
      displayText = 'Terminated';
    } else if (statusLower.includes('editable')) {
      badgeClass = 'badge-vo-editable';
      displayText = 'Editable';
    } else if (statusLower.includes('completed')) {
      badgeClass = 'badge-vo-completed';
      displayText = 'Completed';
    } else if (statusLower.includes('pending')) {
      badgeClass = 'badge-vo-pending';
      displayText = 'Pending';
    } else if (statusLower.includes('approved')) {
      badgeClass = 'badge-vo-approved';
      displayText = 'Approved';
    } else {
      badgeClass = 'badge-vo-active';
      displayText = status || 'Active';
    }

    return `<span class="badge badge-sm ${badgeClass} font-medium">${displayText}</span>`;
  };

  const processVoDatasetArray = (data: any[]): FormattedVoDataset[] => {
    return data.map((vo: VoDatasetVM) => ({
      ...vo,
      projectName: vo.projectName || '-',
      tradeName: vo.tradeName || '-',
      subcontractorName: vo.subcontractorName || '-',
      date: vo.date ? formatDate(vo.date) : '-',
      amount: vo.amount ? formatCurrency(vo.amount) : '-',
      originalStatus: vo.status || '',
      status: formatStatusBadge(vo.status),
    }));
  };

  // Table columns definitions
  const voColumns: VOTableColumns = {
    voNumber: "VO Number",
    contractNumber: "Contract Number",
    projectName: "Project",
    subcontractorName: "Subcontractor",
    tradeName: "Trade",
    type: "Type",
    date: "Date",
    amount: "Amount",
    status: "Status"
  };

  const voDatasetColumns: VOTableColumns = {
    voNumber: "VO Number",
    contractNumber: "Contract Number",
    projectName: "Project",
    subcontractorName: "Subcontractor",
    tradeName: "Trade",
    type: "Type",
    date: "Date",
    amount: "Amount",
    status: "Status"
  };

  // API Functions

  /**
   * Get VOs for a building with optional level filtering
   * @param buildingId - The building ID
   * @param level - Optional level filter
   */
  const getVos = async (buildingId: number, level?: number): Promise<VoVM[]> => {
    if (isApiCallInProgress.current) {
      return [];
    }

    isApiCallInProgress.current = true;
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
      isApiCallInProgress.current = false;
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
      formData.append('ApplyToIdenticalBuildings', (request.applyToIdenticalBuildings || false).toString());

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
        body: JSON.stringify(vos),
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
        body: JSON.stringify(request),
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

  // VO Dataset Functions (for VO contract instances)

  /**
   * Get VO datasets list filtered by status
   * @param status - Contract dataset status filter
   */
  const getVoDatasetsList = async (status: ContractDatasetStatus): Promise<FormattedVoDataset[]> => {
    if (isApiCallInProgress.current) {
      return [];
    }

    isApiCallInProgress.current = true;
    setLoading(true);
    
    try {
      const data = await apiRequest<VoDatasetVM[]>({
        endpoint: `VoDataSet/GetVoDatasetsList/${status}`,
        method: "GET",
        token: token ?? "",
      });

      let voArray: VoDatasetVM[] = [];
      
      if (Array.isArray(data)) {
        voArray = data;
      } else if (data && typeof data === 'object') {
        // Check if it's an error response first
        if ('isSuccess' in data && !data.isSuccess) {
          console.error("API Error in response:", data);
          voArray = [];
        } else {
          // Handle different response wrapper patterns
          if ('data' in data && Array.isArray(data.data)) {
            voArray = data.data;
          } else if ('result' in data && Array.isArray(data.result)) {
            voArray = data.result;
          } else if ('items' in data && Array.isArray(data.items)) {
            voArray = data.items;
          } else {
            // Only cast if it's a valid VO object
            if ('id' in data && 'contractNumber' in data) {
              voArray = [data as unknown as VoDatasetVM];
            } else {
              voArray = [];
            }
          }
        }
      } else if (data) {
        // Only cast if it's a valid VO object
        if (typeof data === 'object' && 'id' in data && 'contractNumber' in data) {
          voArray = [data as VoDatasetVM];
        } else {
          voArray = [];
        }
      }

      const processedData = processVoDatasetArray(voArray);
      const reversedData = processedData.reverse(); // Show newest first
      
      setVoDatasets(reversedData);
      return reversedData;
    } catch (error) {
      console.error("API Error getting VO datasets:", error);
      toaster.error("Failed to load VO datasets");
      setVoDatasets([]);
      return [];
    } finally {
      setLoading(false);
      isApiCallInProgress.current = false;
    }
  };

  /**
   * Get VO dataset with BOQ details for editing
   * @param id - VO dataset ID
   */
  const getVoDatasetWithBoqs = async (id: number): Promise<VoDatasetBoqDetailsVM | null> => {
    setLoading(true);
    
    try {
      const data = await apiRequest<VoDatasetBoqDetailsVM>({
        endpoint: `VoDataSet/GetVoDatasetWithBoqs/${id}`,
        method: "GET",
        token: token ?? "",
      });

      if (data && typeof data === 'object') {
        if ('isSuccess' in data && !data.isSuccess) {
          const errorResponse = data as VariationOrderApiError;
          toaster.error(errorResponse.message || "Failed to load VO dataset details");
          return null;
        }
        return data as VoDatasetBoqDetailsVM;
      } else {
        toaster.error("Invalid response format");
        return null;
      }
    } catch (error) {
      console.error("API Error getting VO dataset with BOQs:", error);
      toaster.error("Failed to load VO dataset details");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save VO dataset
   * @param voDataset - VO dataset with BOQ details to save
   */
  const saveVoDataset = async (voDataset: VoDatasetBoqDetailsVM): Promise<VOServiceResult> => {
    setSaveLoading(true);
    
    try {
      const response = await apiRequest<{ success: boolean; error?: string }>({
        endpoint: "VoDataSet/SaveVoDataset",
        method: "POST",
        token: token ?? "",
        body: voDataset as any,
      });

      if (response && typeof response === 'object') {
        if ('isSuccess' in response && !response.isSuccess) {
          const errorResponse = response as VariationOrderApiError;
          toaster.error(errorResponse.message || "Save failed");
          return { isSuccess: false, error: { message: errorResponse.message || "Save failed" } };
        } else if ('success' in response && !response.success) {
          const errorMessage = 'error' in response ? response.error : "Save failed";
          toaster.error(errorMessage || "Save failed");
          return { isSuccess: false, error: { message: errorMessage || "Save failed" } };
        }
        
        toaster.success("VO dataset saved successfully");
        // Refresh the datasets list
        await getVoDatasetsList(ContractDatasetStatus.Active);
        return { isSuccess: true, data: response };
      } else {
        toaster.success("VO dataset saved successfully");
        return { isSuccess: true, data: response };
      }
    } catch (error) {
      console.error("Save VO dataset error:", error);
      toaster.error("Failed to save VO dataset");
      return { isSuccess: false, error: { message: "Failed to save VO dataset" } };
    } finally {
      setSaveLoading(false);
    }
  };

  // Convenience methods for common operations
  const getActiveVoDatasets = () => getVoDatasetsList(ContractDatasetStatus.Active);
  const getTerminatedVoDatasets = () => getVoDatasetsList(ContractDatasetStatus.Terminated);
  const getEditableVoDatasets = () => getVoDatasetsList(ContractDatasetStatus.Editable);

  return {
    // State
    voData,
    voDatasets,
    loading,
    uploadLoading,
    saveLoading,

    // Table columns
    voColumns,
    voDatasetColumns,

    // VO Management Functions (Budget BOQ VOs)
    getVos,
    uploadVo,
    saveVo,
    clearVo,

    // VO Dataset Management Functions (Contract VOs)
    getVoDatasetsList,
    getVoDatasetWithBoqs,
    saveVoDataset,

    // Convenience methods
    getActiveVoDatasets,
    getTerminatedVoDatasets,
    getEditableVoDatasets,

    // Utility functions
    formatCurrency,
    formatDate,
    formatStatusBadge,
  };
};

export default useVariationOrders;