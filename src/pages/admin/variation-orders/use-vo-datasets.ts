import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import {
  VoDatasetVM,
  VoDatasetBoqDetailsVM,
  ContractDatasetStatus,
  VariationOrderApiError,
  VOServiceResult,
  FormattedVoDataset,
  VOTableColumns
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

  const processVoDatasetArray = (data: VoDatasetVM[]): FormattedVoDataset[] => {
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