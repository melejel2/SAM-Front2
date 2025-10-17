import { useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import {
  getContractsDatasetsList,
  getSubcontractorData,
  saveSubcontractorDataset,
  copyBoqItemsToContract,
  getContractBoqItemsFromExcel,
  clearContractBoqItems,
  generateContract,
  terminateContract,
  generateFinalContract,
  deleteSubContractorBoq,
  getContractsByProjectsAndSub,
  attachDoc,
  previewContract,
  exportContract,
  exportContractPdf,
  exportContractWord,
  livePreview,
  livePreviewPdf,
  livePreviewWord,
  ContractDatasetStatus,
  type SubcontractorBoqVM,
  type ContractDatasetListItem,
  type CopyBoqItemsRequest,
  type ImportContractBoqsRequest,
  type ClearContractBoqItemsRequest,
  type AttachDocVM,
  type BoqContractVM
} from '@/api/services/contracts-api';

/**
 * Unified Contract Management Hook
 * Merges functionality from use-subcontractors-boqs.ts and use-contracts-database.ts
 * Supports three tab types: 'drafts' (editable), 'active', 'terminated'
 *
 * @author SAM Development Team
 * @date January 2025
 */

export type TabType = 'drafts' | 'active' | 'terminated';

const useContractManagement = () => {
  // State management for three tabs
  const [draftsData, setDraftsData] = useState<any[]>([]);
  const [activeData, setActiveData] = useState<any[]>([]);
  const [terminatedData, setTerminatedData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { getToken } = useAuth();
  const { toaster } = useToast();
  const token = getToken();

  // Memoize column definitions to prevent recreation
  const columns = useMemo(() => ({
    contractNumber: "Number",
    projectName: "Project",
    subcontractorName: "Subcontractor",
    tradeName: "Trade",
    contractType: "Type",
    contractDate: "Date of Signature",
    completionDate: "End Date",
    amount: "Amount",
    status: "Status",
  }), []);

  // Memoize input fields to prevent recreation (for backwards compatibility)
  const inputFields = useMemo(() => [
    {
      name: "contractNb",
      label: "Number",
      type: "text",
      required: true,
    },
    {
      name: "subcontractor",
      label: "Subcontractor",
      type: "text",
      required: true,
    },
    {
      name: "trade",
      label: "Trade",
      type: "text",
      required: true,
    },
    {
      name: "contractAmount",
      label: "Amount",
      type: "text",
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "text",
      required: true,
    },
  ], []);

  // ============================================================================
  // Formatting Functions
  // ============================================================================

  /**
   * Format currency amounts for display
   * @param amount Number to format
   * @returns Formatted currency string or '-'
   */
  const formatCurrency = useCallback((amount: number): string => {
    if (!amount || isNaN(amount)) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  /**
   * Format dates from ISO format to DD/MM/YY
   * @param dateString ISO date string
   * @returns Formatted date string or '-'
   */
  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return '-';
    try {
      // Handle ISO datetime format like "2020-01-27T00:00:00"
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      return `${day}/${month}/${year}`;
    } catch (error) {
      return '-';
    }
  }, []);

  /**
   * Format status badge with appropriate styling
   * @param status Status value (string or number)
   * @returns HTML string for badge display
   */
  const formatStatusBadge = useCallback((status: any): string => {
    // Convert status to string and handle different types
    const statusStr = status?.toString() || '';
    const statusLower = statusStr.toLowerCase();
    let badgeClass = '';
    let displayText = statusStr;

    if (statusLower.includes('active')) {
      badgeClass = 'badge-contract-active';
      displayText = 'Active';
    } else if (statusLower.includes('terminated')) {
      badgeClass = 'badge-contract-terminated';
      displayText = 'Terminated';
    } else if (statusLower.includes('editable')) {
      badgeClass = 'badge-contract-editable';
      displayText = 'Editable';
    } else if (statusLower.includes('completed')) {
      badgeClass = 'badge-contract-completed';
      displayText = 'Completed';
    } else if (statusLower.includes('pending')) {
      badgeClass = 'badge-contract-pending';
      displayText = 'Pending';
    } else if (statusLower.includes('suspended')) {
      badgeClass = 'badge-contract-suspended';
      displayText = 'Suspended';
    } else {
      badgeClass = 'badge-contract-active';
      displayText = statusStr || 'Active';
    }

    return `<span class="badge badge-sm ${badgeClass} font-medium">${displayText}</span>`;
  }, []);

  // ============================================================================
  // Data Processing Helper
  // ============================================================================

  /**
   * Process raw contract data from API for display
   * @param contractsArray Raw contract data array
   * @returns Processed contract data with formatted fields
   */
  const processContractData = useCallback((contractsArray: any[]): any[] => {
    return contractsArray.map((contract: any) => ({
      ...contract,
      id: contract.id || contract.contractId || Math.random().toString(),
      contractNumber: contract.contractNumber || contract.contractNb || '-',
      projectName: contract.projectName || '-',
      subcontractorName: contract.subcontractorName || '-',
      tradeName: contract.tradeName || '-',
      contractDate: contract.contractDate ? formatDate(contract.contractDate) : '-',
      completionDate: contract.completionDate ? formatDate(contract.completionDate) : '-',
      amount: contract.amount ? formatCurrency(contract.amount) : '-',
      originalStatus: contract.status || '', // Preserve original for filtering
      status: formatStatusBadge(contract.status),
    }));
  }, [formatDate, formatCurrency, formatStatusBadge]);

  /**
   * Extract array from various API response formats
   * @param data API response data
   * @returns Array of contracts
   */
  const extractDataArray = useCallback((data: any): any[] => {
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data.result && Array.isArray(data.result)) {
        return data.result;
      } else if (data.items && Array.isArray(data.items)) {
        return data.items;
      } else {
        return [data];
      }
    } else if (data) {
      return [data];
    }
    return [];
  }, []);

  // ============================================================================
  // Data Fetching Functions
  // ============================================================================

  /**
   * Get contracts by status with proper state management
   * @param status ContractDatasetStatus (0=Editable, 1=Terminated, 2=Active)
   */
  const getContractsByStatus = async (status: ContractDatasetStatus) => {
    console.log("🔍 getContractsByStatus called with status:", status);
    console.log("🔍 Status mapping: 0=Editable, 1=Terminated, 2=Active");

    if (!token) {
      console.log("⚠️ No token available, skipping...");
      return;
    }

    setLoading(true);

    try {
      console.log("📡 Calling API: getContractsDatasetsList with status", status);
      const result = await getContractsDatasetsList(status, token);
      console.log("📥 API Response:", result);

      if (result.success && result.data) {
        const contractsArray = Array.isArray(result.data) ? result.data : extractDataArray(result.data);
        console.log("📊 Contracts array length:", contractsArray.length);
        console.log("📊 Raw contracts data:", contractsArray);

        const processedData = processContractData(contractsArray);
        console.log("✅ Processed data length:", processedData.length);

        const reversedData = processedData.reverse(); // Show newest first
        console.log("🔄 Reversed data length:", reversedData.length);

        // Update appropriate state based on status
        if (status === ContractDatasetStatus.Editable) {
          console.log("💾 Setting draftsData with", reversedData.length, "items");
          setDraftsData(reversedData);
        } else if (status === ContractDatasetStatus.Active) {
          console.log("💾 Setting activeData with", reversedData.length, "items");
          setActiveData(reversedData);
        } else if (status === ContractDatasetStatus.Terminated) {
          console.log("💾 Setting terminatedData with", reversedData.length, "items");
          setTerminatedData(reversedData);
        }
      } else {
        console.log("❌ API call failed or no data:", result);
        // Clear state on error
        if (status === ContractDatasetStatus.Editable) {
          setDraftsData([]);
        } else if (status === ContractDatasetStatus.Active) {
          setActiveData([]);
        } else if (status === ContractDatasetStatus.Terminated) {
          setTerminatedData([]);
        }
      }
    } catch (error) {
      console.error("🚨 API Error:", error);
      if (status === ContractDatasetStatus.Editable) {
        setDraftsData([]);
      } else if (status === ContractDatasetStatus.Active) {
        setActiveData([]);
      } else if (status === ContractDatasetStatus.Terminated) {
        setTerminatedData([]);
      }
    } finally {
      setLoading(false);
      console.log("✅ API call completed for status", status);
    }
  };

  /**
   * Get draft contracts (editable status)
   */
  const getDraftsContracts = async () => {
    await getContractsByStatus(ContractDatasetStatus.Editable);
  };

  /**
   * Get active contracts
   */
  const getActiveContracts = async () => {
    await getContractsByStatus(ContractDatasetStatus.Active);
  };

  /**
   * Get terminated contracts
   */
  const getTerminatedContracts = async () => {
    await getContractsByStatus(ContractDatasetStatus.Terminated);
  };

  /**
   * Legacy method - Load contracts for specific tab
   * @param activeTab Tab type to load data for
   * @deprecated Use specific methods (getDraftsContracts, getActiveContracts, getTerminatedContracts)
   */
  const getContractsDatasets = async (activeTab: TabType = 'drafts') => {
    switch (activeTab) {
      case 'drafts':
        await getDraftsContracts();
        break;
      case 'active':
        await getActiveContracts();
        break;
      case 'terminated':
        await getTerminatedContracts();
        break;
    }
  };

  // ============================================================================
  // Contract Operations
  // ============================================================================

  /**
   * Load subcontractor data for editing
   * @param id Contract dataset ID
   */
  const loadSubcontractorData = async (id: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, data: null };
    }

    try {
      setLoading(true);
      const result = await getSubcontractorData(id, token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to load contract data');
        return { success: false, data: null };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Load subcontractor data error:', error);
      toaster.error('An error occurred while loading contract data');
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save or update contract dataset
   * @param model SubcontractorBoqVM containing the dataset to save
   * @param showSuccessMessage Whether to show success toast
   */
  const saveContract = async (model: SubcontractorBoqVM, showSuccessMessage = true) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await saveSubcontractorDataset(model, token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to save contract');
        return { success: false, error: result.error };
      }

      if (showSuccessMessage) {
        toaster.success('Contract saved successfully!');
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Save contract error:', error);
      toaster.error('An error occurred while saving the contract');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Preview contract document (for saved contracts)
   * @param contractIdOrData Contract ID or contract data object
   */
  const previewContractDocument = async (contractIdOrData: number | any) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);

      // If it's a number, use direct preview
      if (typeof contractIdOrData === 'number') {
        const blob = await previewContract(contractIdOrData, token);
        return { success: true, blob };
      }

      // For draft contracts or objects with data, use live preview
      if (contractIdOrData.id) {
        // Fetch full contract data first
        const contractResponse = await getSubcontractorData(Number(contractIdOrData.id), token);

        if (!contractResponse.success || !contractResponse.data) {
          toaster.error('Failed to load contract data for preview');
          return { success: false, blob: null };
        }

        // Use live preview with full data
        const blob = await livePreviewPdf(contractResponse.data, token);
        return { success: true, blob };
      } else {
        // For new contracts without ID, use live preview directly
        const blob = await livePreviewPdf(contractIdOrData, token);
        return { success: true, blob };
      }
    } catch (error) {
      console.error('Preview contract error:', error);
      toaster.error('An error occurred while previewing the contract');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a draft contract
   * @param contractId Contract ID to delete
   */
  const deleteContract = async (contractId: number | string) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await deleteSubContractorBoq(Number(contractId), token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to delete contract');
        return { success: false };
      }

      toaster.success('Contract deleted successfully!');

      // Remove from drafts state
      setDraftsData(prevData => prevData.filter(contract => contract.id !== contractId));

      return { success: true };
    } catch (error) {
      console.error('Delete contract error:', error);
      toaster.error('An error occurred while deleting the contract');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate contract (move from draft to active)
   * @param contractId Contract ID to generate
   */
  const generateContractBOQ = async (contractId: string | number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await generateContract(Number(contractId), token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to generate contract');
        return { success: false };
      }

      toaster.success('Contract generated successfully!');

      // Refresh both drafts and active contracts
      await getDraftsContracts();
      await getActiveContracts();

      return { success: true };
    } catch (error) {
      console.error('Generate contract error:', error);
      toaster.error('An error occurred while generating the contract');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Terminate contract (move from active to terminated)
   * @param contractId Contract ID to terminate
   */
  const terminateContractBOQ = async (contractId: string | number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await terminateContract(Number(contractId), token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to terminate contract');
        return { success: false };
      }

      toaster.success('Contract terminated successfully!');

      // Refresh both active and terminated contracts
      await getActiveContracts();
      await getTerminatedContracts();

      return { success: true };
    } catch (error) {
      console.error('Terminate contract error:', error);
      toaster.error('An error occurred while terminating the contract');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate final contract document for terminated contract
   * @param contractId Contract ID to generate final document
   */
  const generateFinalContractBOQ = async (contractId: string | number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await generateFinalContract(Number(contractId), token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to generate final discharge document');
        return { success: false };
      }

      toaster.success('Final discharge document generated successfully!');

      // Refresh terminated contracts to update status
      await getTerminatedContracts();

      return { success: true };
    } catch (error) {
      console.error('Generate final contract error:', error);
      toaster.error('An error occurred while generating the final discharge document');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // BOQ Operations
  // ============================================================================

  /**
   * Copy BOQ items to contract
   * @param request Request containing sheet name and building IDs
   */
  const copyBoqItems = async (request: CopyBoqItemsRequest) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, data: [] };
    }

    try {
      setLoading(true);
      const result = await copyBoqItemsToContract(request, token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to copy BOQ items');
        return { success: false, data: [] };
      }

      toaster.success('BOQ items copied successfully!');
      return { success: true, data: result.data || [] };
    } catch (error) {
      console.error('Copy BOQ items error:', error);
      toaster.error('An error occurred while copying BOQ items');
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Import BOQ items from Excel
   * @param request Request containing file and parameters
   */
  const importBoqFromExcel = async (request: ImportContractBoqsRequest) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, data: [] };
    }

    try {
      setLoading(true);
      const result = await getContractBoqItemsFromExcel(request, token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to import BOQ items');
        return { success: false, data: [] };
      }

      return { success: true, data: result.data || [] };
    } catch (error) {
      console.error('Import BOQ from Excel error:', error);
      toaster.error('An error occurred while importing BOQ items from Excel');
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear BOQ items
   * @param request Request with scope and required IDs
   */
  const clearBoqItems = async (request: ClearContractBoqItemsRequest) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await clearContractBoqItems(request, token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to clear BOQ items');
        return { success: false };
      }

      toaster.success('BOQ items cleared successfully!');
      return { success: true };
    } catch (error) {
      console.error('Clear BOQ items error:', error);
      toaster.error('An error occurred while clearing BOQ items');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Export Functions
  // ============================================================================

  /**
   * Export contract as PDF
   * @param contractId Contract ID to export
   */
  const exportContractPdfDocument = async (contractId: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);
      const response = await exportContractPdf(contractId, token);

      if (!(response instanceof Blob)) {
        toaster.error('Invalid response from server');
        return { success: false, blob: null };
      }

      return { success: true, blob: response };
    } catch (error) {
      console.error('Export contract PDF error:', error);
      toaster.error('An error occurred while exporting the contract PDF');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export contract as Word document
   * @param contractId Contract ID to export
   */
  const exportContractWordDocument = async (contractId: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);
      const response = await exportContractWord(contractId, token);

      if (!(response instanceof Blob)) {
        toaster.error('Invalid response from server');
        return { success: false, blob: null };
      }

      return { success: true, blob: response };
    } catch (error) {
      console.error('Export contract Word error:', error);
      toaster.error('An error occurred while exporting the contract Word document');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export contract as both PDF and Word (ZIP)
   * @param contractId Contract ID to export
   */
  const exportContractDocument = async (contractId: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);
      const response = await exportContract(contractId, token);
      return { success: true, blob: response };
    } catch (error) {
      console.error('Export contract error:', error);
      toaster.error('An error occurred while exporting the contract');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Live Preview Functions
  // ============================================================================

  /**
   * Generate live PDF preview from contract data
   * @param contractData SubcontractorBoqVM data
   */
  const livePreviewPdfDocument = async (contractData: any) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);

      // If contractData has an ID, fetch full contract data first
      if (contractData.id) {
        const contractResponse = await getSubcontractorData(Number(contractData.id), token);

        if (!contractResponse.success || !contractResponse.data) {
          toaster.error('Failed to load contract data for preview');
          return { success: false, blob: null };
        }

        const blob = await livePreviewPdf(contractResponse.data, token);
        return { success: true, blob };
      } else {
        const blob = await livePreviewPdf(contractData, token);
        return { success: true, blob };
      }
    } catch (error) {
      console.error('Live preview PDF error:', error);
      toaster.error('An error occurred while generating live PDF preview');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate live Word preview from contract data
   * @param contractData SubcontractorBoqVM data
   */
  const livePreviewWordDocument = async (contractData: any) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);

      // If contractData has an ID, fetch full contract data first
      if (contractData.id) {
        const contractResponse = await getSubcontractorData(Number(contractData.id), token);

        if (!contractResponse.success || !contractResponse.data) {
          toaster.error('Failed to load contract data for preview');
          return { success: false, blob: null };
        }

        const blob = await livePreviewWord(contractResponse.data, token);
        return { success: true, blob };
      } else {
        const blob = await livePreviewWord(contractData, token);
        return { success: true, blob };
      }
    } catch (error) {
      console.error('Live preview Word error:', error);
      toaster.error('An error occurred while generating live Word preview');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Additional Query Functions
  // ============================================================================

  /**
   * Get contracts by project and subcontractor
   * @param projectId Project ID
   * @param subcontractorId Subcontractor ID
   */
  const fetchContractsByProjectAndSub = async (projectId: number, subcontractorId: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, data: [] };
    }

    try {
      setLoading(true);
      const result = await getContractsByProjectsAndSub(projectId, subcontractorId, token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to fetch contracts');
        return { success: false, data: [] };
      }

      return { success: true, data: result.data || [] };
    } catch (error) {
      console.error('Fetch contracts by project and sub error:', error);
      toaster.error('An error occurred while fetching contracts');
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Attach document to contract
   * @param request AttachDocVM containing the document to attach
   */
  const attachDocument = async (request: AttachDocVM) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await attachDoc(request, token);

      if (!result.success) {
        toaster.error(result.message || 'Failed to attach document');
        return { success: false };
      }

      toaster.success('Document attached successfully!');
      return { success: true };
    } catch (error) {
      console.error('Attach document error:', error);
      toaster.error('An error occurred while attaching the document');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // State
    columns,
    inputFields,
    draftsData,
    activeData,
    terminatedData,
    loading,

    // Formatting functions
    formatCurrency,
    formatDate,
    formatStatusBadge,

    // Data fetching
    getContractsDatasets, // Legacy method
    getContractsByStatus,
    getDraftsContracts,
    getActiveContracts,
    getTerminatedContracts,

    // Contract operations
    loadSubcontractorData,
    saveContract,
    previewContract: previewContractDocument,
    deleteContract,
    generateContract: generateContractBOQ,
    terminateContract: terminateContractBOQ,
    generateFinalContract: generateFinalContractBOQ,

    // BOQ operations
    copyBoqItems,
    importBoqFromExcel,
    clearBoqItems,

    // Export functions
    exportContractDocument,
    exportContractPdf: exportContractPdfDocument,
    exportContractWord: exportContractWordDocument,

    // Live preview functions
    livePreviewPdfDocument,
    livePreviewWordDocument,

    // Query operations
    fetchContractsByProjectAndSub,
    attachDocument,

    // Constants
    ContractDatasetStatus,
  };
};

export default useContractManagement;

// Export types for convenience
export type {
  SubcontractorBoqVM,
  ContractDatasetListItem,
  CopyBoqItemsRequest,
  ImportContractBoqsRequest,
  ClearContractBoqItemsRequest,
  AttachDocVM,
  BoqContractVM
};

export { ContractDatasetStatus };
