import { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import useToast from '@/hooks/use-toast';
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
 * Comprehensive hook for contract API operations
 * Provides all ContractsDatasets endpoints with proper error handling
 * Updated to use the new contracts-api service
 */
export const useContractsApi = () => {
  const { getToken } = useAuth();
  const { toaster } = useToast();
  const [loading, setLoading] = useState(false);
  
  const token = getToken();

  // Get contracts list with status filtering
  const fetchContractsDatasets = async (status: ContractDatasetStatus = ContractDatasetStatus.Editable) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, data: [] };
    }

    try {
      setLoading(true);
      const result = await getContractsDatasetsList(status, token);
      
      if (!result.success) {
        toaster.error(result.message || 'Failed to fetch contracts');
        return { success: false, data: [] };
      }
      
      return { success: true, data: result.data || [] };
    } catch (error) {
      console.error('Fetch contracts error:', error);
      toaster.error('An error occurred while fetching contracts');
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  // Load subcontractor data for editing
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

  // Save or update contract dataset
  const saveContract = async (model: SubcontractorBoqVM, showSuccessMessage = true) => {
    console.log("🎯🔑 saveContract called - checking token...");
    console.log("🎯🔑 Token exists:", !!token);
    if (!token) {
      console.error("🎯🔑 NO TOKEN - Authentication required");
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      console.log("🎯🔑 Setting loading and calling saveSubcontractorDataset...");
      setLoading(true);
      const result = await saveSubcontractorDataset(model, token);
      
      console.log("🎯🔑 saveSubcontractorDataset returned:", result);
      
      if (!result.success) {
        console.error("🎯🔑 Save failed:", result);
        toaster.error(result.message || 'Failed to save contract');
        return { success: false, error: result.error };
      }
      
      if (showSuccessMessage) {
        toaster.success('Contract saved successfully!');
      }
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('🎯🔑 Save contract error:', error);
      console.error('🎯🔑 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      toaster.error('An error occurred while saving the contract');
      return { success: false };
    } finally {
      console.log("🎯🔑 Setting loading to false");
      setLoading(false);
    }
  };

  // Copy BOQ items to contract
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

  // Import BOQ items from Excel
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

  // Clear BOQ items
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

  // Generate contract
  const generateContractBOQ = async (id: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await generateContract(id, token);
      
      if (!result.success) {
        toaster.error(result.message || 'Failed to generate contract');
        return { success: false };
      }
      
      toaster.success('Contract generated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Generate contract error:', error);
      toaster.error('An error occurred while generating the contract');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Terminate contract
  const terminateContractBOQ = async (id: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await terminateContract(id, token);
      
      if (!result.success) {
        toaster.error(result.message || 'Failed to terminate contract');
        return { success: false };
      }
      
      toaster.success('Contract terminated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Terminate contract error:', error);
      toaster.error('An error occurred while terminating the contract');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Generate final contract
  const generateFinalContractBOQ = async (id: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await generateFinalContract(id, token);
      
      if (!result.success) {
        toaster.error(result.message || 'Failed to generate final contract');
        return { success: false };
      }
      
      toaster.success('Final contract generated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Generate final contract error:', error);
      toaster.error('An error occurred while generating the final contract');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Delete contract
  const deleteContract = async (id: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false };
    }

    try {
      setLoading(true);
      const result = await deleteSubContractorBoq(id, token);
      
      if (!result.success) {
        toaster.error(result.message || 'Failed to delete contract');
        return { success: false };
      }
      
      toaster.success('Contract deleted successfully!');
      return { success: true };
    } catch (error) {
      console.error('Delete contract error:', error);
      toaster.error('An error occurred while deleting the contract');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Get contracts by project and subcontractor
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

  // Attach document
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

  // Document export functions with proper blob handling
  const previewContractDocument = async (id: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);
      const blob = await previewContract(id, token);
      return { success: true, blob };
    } catch (error) {
      console.error('Preview contract error:', error);
      toaster.error('An error occurred while previewing the contract');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  const exportContractDocument = async (id: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);
      const blob = await exportContract(id, token);
      return { success: true, blob };
    } catch (error) {
      console.error('Export contract error:', error);
      toaster.error('An error occurred while exporting the contract');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  const exportContractPdfDocument = async (id: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);
      const response = await exportContractPdf(id, token);
      
      // Check if response is an error object instead of a blob
      if (response && typeof response === 'object' && 'success' in response && !(response as any).success) {
        console.error('Export PDF API error:', response);
        toaster.error((response as any).message || 'Failed to export contract as PDF');
        return { success: false, blob: null };
      }
      
      // Validate it's actually a blob
      if (!(response instanceof Blob)) {
        console.error('Invalid response type:', typeof response, response);
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

  const exportContractWordDocument = async (id: number) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);
      const response = await exportContractWord(id, token);
      
      // Check if response is an error object instead of a blob
      if (response && typeof response === 'object' && 'success' in response && !(response as any).success) {
        console.error('Export Word API error:', response);
        toaster.error((response as any).message || 'Failed to export contract as Word');
        return { success: false, blob: null };
      }
      
      // Validate it's actually a blob
      if (!(response instanceof Blob)) {
        console.error('Invalid response type:', typeof response, response);
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

  // Live preview functions
  const livePreviewDocument = async (model: SubcontractorBoqVM) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);
      const blob = await livePreview(model, token);
      return { success: true, blob };
    } catch (error) {
      console.error('Live preview error:', error);
      toaster.error('An error occurred while generating live preview');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  const livePreviewPdfDocument = async (contractData: any) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);
      
      console.log('🎯📄 LIVE PREVIEW DEBUG - Input contractData:', contractData);
      console.log('🎯📄 Contract ID exists:', !!contractData.id);
      console.log('🎯📄 Contract has BOQ items:', !!(contractData.contractDetailsList && contractData.contractDetailsList.length > 0));
      
      // If contractData has an ID, fetch the full contract data first (like the working preview)
      if (contractData.id) {
        console.log('🎯📄 Fetching full contract data from API for ID:', contractData.id);
        // Get the full contract data structure from the API
        const contractResponse = await getSubcontractorData(Number(contractData.id), token);
        
        if (!contractResponse.success || !contractResponse.data) {
          console.error('🎯📄 Failed to fetch contract data:', contractResponse);
          toaster.error('Failed to load contract data for preview');
          return { success: false, blob: null };
        }
        
        console.log('🎯📄 Full contract data fetched:', contractResponse.data);
        console.log('🎯📄 BOQ items count:', contractResponse.data.contractDetailsList?.length || 0);
        console.log('🎯📄 Contract basics:', {
          contractNumber: contractResponse.data.contractNumber,
          projectName: contractResponse.data.projectName,
          subcontractorName: contractResponse.data.subcontractorName,
          totalAmount: contractResponse.data.totalAmount
        });
        
        // Use the full contract data for live preview
        const blob = await livePreviewPdf(contractResponse.data, token);
        return { success: true, blob };
      } else {
        console.log('🎯📄 Using provided contract data directly (no ID found)');
        console.log('🎯📄 Direct data BOQ items:', contractData.contractDetailsList?.length || 0);
        
        // For cases where we already have a properly structured SubcontractorBoqVM
        const blob = await livePreviewPdf(contractData, token);
        return { success: true, blob };
      }
    } catch (error) {
      console.error('🎯📄 Live preview PDF error:', error);
      toaster.error('An error occurred while generating live PDF preview');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  const livePreviewWordDocument = async (contractData: any) => {
    if (!token) {
      toaster.error('Authentication required');
      return { success: false, blob: null };
    }

    try {
      setLoading(true);
      
      console.log('🎯📄 LIVE PREVIEW WORD DEBUG - Input contractData:', contractData);
      console.log('🎯📄 Contract ID exists:', !!contractData.id);
      console.log('🎯📄 Contract has BOQ items:', !!(contractData.contractDetailsList && contractData.contractDetailsList.length > 0));
      
      // If contractData has an ID, fetch the full contract data first (like the working preview)
      if (contractData.id) {
        console.log('🎯📄 Fetching full contract data from API for ID:', contractData.id);
        // Get the full contract data structure from the API
        const contractResponse = await getSubcontractorData(Number(contractData.id), token);
        
        if (!contractResponse.success || !contractResponse.data) {
          console.error('🎯📄 Failed to fetch contract data:', contractResponse);
          toaster.error('Failed to load contract data for preview');
          return { success: false, blob: null };
        }
        
        console.log('🎯📄 Full contract data fetched:', contractResponse.data);
        console.log('🎯📄 BOQ items count:', contractResponse.data.contractDetailsList?.length || 0);
        console.log('🎯📄 Contract basics:', {
          contractNumber: contractResponse.data.contractNumber,
          projectName: contractResponse.data.projectName,
          subcontractorName: contractResponse.data.subcontractorName,
          totalAmount: contractResponse.data.totalAmount
        });
        
        // Use the full contract data for live preview
        const blob = await livePreviewWord(contractResponse.data, token);
        return { success: true, blob };
      } else {
        console.log('🎯📄 Using provided contract data directly (no ID found)');
        console.log('🎯📄 Direct data BOQ items:', contractData.contractDetailsList?.length || 0);
        
        // For cases where we already have a properly structured SubcontractorBoqVM
        const blob = await livePreviewWord(contractData, token);
        return { success: true, blob };
      }
    } catch (error) {
      console.error('🎯📄 Live preview Word error:', error);
      toaster.error('An error occurred while generating live Word preview');
      return { success: false, blob: null };
    } finally {
      setLoading(false);
    }
  };

  // Note: Building sheets functionality moved to use-buildings.ts hook
  // Use useBuildings() hook instead of this contracts API for building sheets

  return {
    // State
    loading,
    
    // Core CRUD operations
    fetchContractsDatasets,
    loadSubcontractorData,
    saveContract,
    deleteContract,
    
    // BOQ operations
    copyBoqItems,
    importBoqFromExcel,
    clearBoqItems,
    
    // Contract lifecycle
    generateContractBOQ,
    terminateContractBOQ,
    generateFinalContractBOQ,
    
    // Query operations
    fetchContractsByProjectAndSub,
    
    // Document operations
    attachDocument,
    previewContractDocument,
    exportContractDocument,
    exportContractPdfDocument,
    exportContractWordDocument,
    
    // Live preview operations
    livePreviewDocument,
    livePreviewPdfDocument,
    livePreviewWordDocument,
    
    // Constants and types
    ContractDatasetStatus
  };
};

export default useContractsApi;

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
