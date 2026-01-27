import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/utils/formatters";
import {
  getVoDatasetsList,
  getVoDatasetWithBoqs as getVoDatasetWithBoqsApi,
  saveVoDataset as saveVoDatasetApi,
  previewVoDataSet as previewVoDataSetApi,
  copyVoProjectToVoDataSet as copyVoProjectToVoDataSetApi,
  uploadContractVo as uploadContractVoApi,
  generateVoDataSet as generateVoDataSetApi,
  clearVoContractItems as clearVoContractItemsApi,
  deleteVoDataSet as deleteVoDataSetApi,
  updateVoNumber as updateVoNumberApi
} from "@/api/services/vo-api";
import {
  VoDatasetVM,
  VoDatasetBoqDetailsVM,
  ContractDatasetStatus,
  VariationOrderApiError,
  VOServiceResult,
  FormattedVoDataset,
  VOTableColumns,
  ImportContractVoRequest
} from "@/types/variation-order";

/**
 * Specialized hook for managing VO Datasets (Contract-level Variation Orders)
 * This handles the contract instances of VOs, separate from the budget BOQ VOs
 */
const useVoDatasets = () => {
  const [activeVoDatasets, setActiveVoDatasets] = useState<FormattedVoDataset[]>([]);
  const [terminatedVoDatasets, setTerminatedVoDatasets] = useState<FormattedVoDataset[]>([]);
  const [editableVoDatasets, setEditableVoDatasets] = useState<FormattedVoDataset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const { getToken } = useAuth();
  const { toaster } = useToast();

  const token = getToken();

  // Utility functions
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

  const processVoDatasetArray = (data: VoDatasetVM[]): FormattedVoDataset[] => {
    return data.map((vo: VoDatasetVM) => ({
      ...vo,
      projectName: vo.projectName || '-',
      tradeName: vo.tradeName || '-',
      subcontractorName: vo.subcontractorName || '-',
      date: vo.date ? formatDate(vo.date, 'numeric') : '-',
      // Raw numeric value - Table component handles formatting
      amount: vo.amount ?? 0,
      originalStatus: vo.status || '',
      status: formatStatusBadge(vo.status),
    }));
  };

  // Table columns
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
   * Get VO datasets filtered by status
   * @param status - Contract dataset status filter
   */
  const getVoDatasets = async (status: ContractDatasetStatus): Promise<FormattedVoDataset[]> => {
    setLoading(true);
    
    try {
      const data = await getVoDatasetsList(status, token ?? "");

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
      
      // Update appropriate state based on status
      switch (status) {
        case ContractDatasetStatus.Active:
          setActiveVoDatasets(reversedData);
          break;
        case ContractDatasetStatus.Terminated:
          setTerminatedVoDatasets(reversedData);
          break;
        case ContractDatasetStatus.Editable:
          setEditableVoDatasets(reversedData);
          break;
      }
      
      return reversedData;
    } catch (error) {
      console.error("API Error getting VO datasets:", error);
      toaster.error(`Failed to load ${ContractDatasetStatus[status].toLowerCase()} VO datasets`);
      
      const emptyData: FormattedVoDataset[] = [];
      switch (status) {
        case ContractDatasetStatus.Active:
          setActiveVoDatasets(emptyData);
          break;
        case ContractDatasetStatus.Terminated:
          setTerminatedVoDatasets(emptyData);
          break;
        case ContractDatasetStatus.Editable:
          setEditableVoDatasets(emptyData);
          break;
      }
      
      return emptyData;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get VO dataset with BOQ details for editing
   * @param id - VO dataset ID
   */
  const getVoDatasetWithBoqs = async (id: number): Promise<VoDatasetBoqDetailsVM | null> => {
    setLoading(true);
    
    try {
      const data = await getVoDatasetWithBoqsApi(id, token ?? "");

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
      const response = await saveVoDatasetApi(voDataset, token ?? "");

      if (response && typeof response === 'object') {
        if ('isSuccess' in response && !response.isSuccess) {
          const errorResponse = response as VariationOrderApiError;
          toaster.error(errorResponse.message || "Save failed");
          return { isSuccess: false, error: { message: errorResponse.message || "Save failed" } };
        } else if ('success' in response && !response.success) {
          const errorMessage = 'error' in response ? (response as any).error : "Save failed";
          toaster.error(errorMessage || "Save failed");
          return { isSuccess: false, error: { message: errorMessage || "Save failed" } };
        }
        
        toaster.success("VO dataset saved successfully");
        
        // Refresh all datasets to reflect changes
        await Promise.all([
          getVoDatasets(ContractDatasetStatus.Active),
          getVoDatasets(ContractDatasetStatus.Terminated),
          getVoDatasets(ContractDatasetStatus.Editable)
        ]);
        
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

  // Convenience methods
  const getActiveVoDatasets = () => getVoDatasets(ContractDatasetStatus.Active);
  const getTerminatedVoDatasets = () => getVoDatasets(ContractDatasetStatus.Terminated);
  const getEditableVoDatasets = () => getVoDatasets(ContractDatasetStatus.Editable);

  // Load all datasets
  const loadAllVoDatasets = async (): Promise<void> => {
    await Promise.all([
      getActiveVoDatasets(),
      getTerminatedVoDatasets(),
      getEditableVoDatasets()
    ]);
  };

  /**
   * Preview VO dataset (download ZIP with Word and PDF)
   * @param voDataSetId VO dataset ID
   */
  const previewVoDataSet = async (voDataSetId: number): Promise<Blob | null> => {
    try {
      const blob = await previewVoDataSetApi(voDataSetId, token ?? "");
      return blob;
    } catch (error) {
      console.error("Preview VO dataset error:", error);
      toaster.error("Failed to preview VO dataset");
      return null;
    }
  };

  /**
   * Copy VO project to VO dataset
   * @param buildingId Building ID
   * @param voLevel VO level
   * @param contractDataSetId Contract dataset ID
   */
  const copyVoProjectToVoDataSet = async (
    buildingId: number, 
    voLevel: number, 
    contractDataSetId: number
  ) => {
    setLoading(true);
    
    try {
      const response = await copyVoProjectToVoDataSetApi(buildingId, voLevel, contractDataSetId, token ?? "");
      
      if (response && typeof response === 'object') {
        if ('isSuccess' in response && !response.isSuccess) {
          const errorResponse = response as VariationOrderApiError;
          toaster.error(errorResponse.message || "Copy operation failed");
          return null;
        }
        
        toaster.success("VO project copied to dataset successfully");
        return response;
      } else {
        toaster.success("VO project copied to dataset successfully");
        return response;
      }
    } catch (error) {
      console.error("Copy VO project to dataset error:", error);
      toaster.error("Failed to copy VO project to dataset");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload contract VO from Excel file
   * @param contractDataSetId Contract dataset ID
   * @param excelFile Excel file
   */
  const uploadContractVo = async (contractDataSetId: number, excelFile: File) => {
    setLoading(true);
    
    try {
      const response = await uploadContractVoApi(contractDataSetId, excelFile, token ?? "");
      
      if (response && typeof response === 'object') {
        if ('isSuccess' in response && !response.isSuccess) {
          const errorResponse = response as VariationOrderApiError;
          toaster.error(errorResponse.message || "Upload failed");
          return null;
        }
        
        toaster.success("Contract VO uploaded successfully");
        return response;
      } else {
        toaster.success("Contract VO uploaded successfully");
        return response;
      }
    } catch (error) {
      console.error("Upload contract VO error:", error);
      toaster.error("Failed to upload contract VO");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate VO dataset
   * @param id VO dataset ID
   */
  const generateVoDataSet = async (id: number): Promise<VOServiceResult> => {
    setLoading(true);
    
    try {
      const response = await generateVoDataSetApi(id, token ?? "");
      
      if ('success' in response && response.success) {
        toaster.success("VO dataset generated successfully");
        
        // Refresh datasets to reflect changes
        await loadAllVoDatasets();
        
        return { isSuccess: true, data: response };
      } else if ('success' in response && !response.success) {
        toaster.error((response as any).error || "Generation failed");
        return { isSuccess: false, error: { message: (response as any).error || "Generation failed" } };
      } else {
        toaster.success("VO dataset generated successfully");
        return { isSuccess: true, data: response };
      }
    } catch (error) {
      console.error("Generate VO dataset error:", error);
      toaster.error("Failed to generate VO dataset");
      return { isSuccess: false, error: { message: "Failed to generate VO dataset" } };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear VO contract items
   * @param voDataSetId VO dataset ID
   */
  const clearVoContractItems = async (voDataSetId: number): Promise<VOServiceResult> => {
    setLoading(true);
    
    try {
      const response = await clearVoContractItemsApi(voDataSetId, token ?? "");
      
      if ('success' in response && response.success) {
        toaster.success("VO contract items cleared successfully");
        
        // Refresh datasets to reflect changes
        await loadAllVoDatasets();
        
        return { isSuccess: true, data: response };
      } else if ('success' in response && !response.success) {
        toaster.error((response as any).error || "Clear operation failed");
        return { isSuccess: false, error: { message: (response as any).error || "Clear operation failed" } };
      } else {
        toaster.success("VO contract items cleared successfully");
        return { isSuccess: true, data: response };
      }
    } catch (error) {
      console.error("Clear VO contract items error:", error);
      toaster.error("Failed to clear VO contract items");
      return { isSuccess: false, error: { message: "Failed to clear VO contract items" } };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete editable VO dataset
   * @param id VO dataset ID
   */
  const deleteVoDataSet = async (id: number): Promise<VOServiceResult> => {
    setLoading(true);
    
    try {
      const response = await deleteVoDataSetApi(id, token ?? "");
      
      if ('success' in response && response.success) {
        toaster.success("VO dataset deleted successfully");
        
        // Refresh datasets to reflect changes
        await loadAllVoDatasets();
        
        return { isSuccess: true, data: response };
      } else if ('success' in response && !response.success) {
        toaster.error((response as any).error || "Delete operation failed");
        return { isSuccess: false, error: { message: (response as any).error || "Delete operation failed" } };
      } else {
        toaster.success("VO dataset deleted successfully");
        return { isSuccess: true, data: response };
      }
    } catch (error) {
      console.error("Delete VO dataset error:", error);
      toaster.error("Failed to delete VO dataset");
      return { isSuccess: false, error: { message: "Failed to delete VO dataset" } };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update the VO number (A01, A02, etc.) for a VO dataset
   * Only Contract Managers, Quantity Surveyors, and Admins can update VO numbers
   * @param id VO dataset ID
   * @param voNumber New VO number
   */
  const updateVoNumber = async (id: number, voNumber: string): Promise<VOServiceResult> => {
    setLoading(true);

    try {
      const response = await updateVoNumberApi(id, voNumber, token ?? "");

      if ('success' in response && response.success) {
        toaster.success("VO number updated successfully");

        // Refresh datasets to reflect changes
        await loadAllVoDatasets();

        return { isSuccess: true, data: response };
      } else if ('success' in response && !response.success) {
        toaster.error((response as any).error || (response as any).message || "Update failed");
        return { isSuccess: false, error: { message: (response as any).error || "Update failed" } };
      } else {
        toaster.success("VO number updated successfully");
        return { isSuccess: true, data: response };
      }
    } catch (error) {
      console.error("Update VO number error:", error);
      toaster.error("Failed to update VO number");
      return { isSuccess: false, error: { message: "Failed to update VO number" } };
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    activeVoDatasets,
    terminatedVoDatasets,
    editableVoDatasets,
    loading,
    saveLoading,

    // Table columns
    voDatasetColumns,

    // API Functions
    getVoDatasets,
    getVoDatasetWithBoqs,
    saveVoDataset,

    // Advanced VO Operations
    previewVoDataSet,
    copyVoProjectToVoDataSet,
    uploadContractVo,
    generateVoDataSet,
    clearVoContractItems,
    deleteVoDataSet,
    updateVoNumber,

    // Convenience methods
    getActiveVoDatasets,
    getTerminatedVoDatasets,
    getEditableVoDatasets,
    loadAllVoDatasets,

    // Utility functions
    formatCurrency,
    formatDate,
    formatStatusBadge,
  };
};

export default useVoDatasets;