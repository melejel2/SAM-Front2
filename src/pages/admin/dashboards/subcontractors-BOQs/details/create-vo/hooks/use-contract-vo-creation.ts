import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import useToast from '@/hooks/use-toast';
import {
  getContractForVO,
  getContractBuildings,
  getContractBOQItems,
  generateVONumber,
  createContractVO,
  getContractVOs,
  transformFormDataToVoDataset,
  ContractContext,
  ContractBuilding,
  VoDatasetBoqDetailsVM,
  VoApiResponse,
  VoApiError
} from '@/api/services/vo-api';

/**
 * Hook for Contract VO Creation Operations
 * Provides all necessary functions for the contract VO wizard
 */
export const useContractVOCreation = () => {
  const { getToken } = useAuth();
  const { toaster } = useToast();
  const token = getToken();

  // State
  const [loading, setLoading] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [boqItemsLoading, setBOQItemsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load contract context
  const loadContractContext = useCallback(async (contractId: number): Promise<ContractContext | null> => {
    try {
      setContractLoading(true);
      
      const response = await getContractForVO(contractId, token || '');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        toaster.error(response.error || 'Failed to load contract context');
        return null;
      }
    } catch (error) {
      console.error('Error loading contract context:', error);
      toaster.error('Failed to load contract information');
      return null;
    } finally {
      setContractLoading(false);
    }
  }, [token, toaster]);

  // Load contract buildings
  const loadContractBuildings = useCallback(async (contractId: number): Promise<ContractBuilding[]> => {
    try {
      setBuildingsLoading(true);
      
      const response = await getContractBuildings(contractId, token || '');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        toaster.error(response.error || 'Failed to load contract buildings');
        return [];
      }
    } catch (error) {
      console.error('Error loading contract buildings:', error);
      toaster.error('Failed to load building information');
      return [];
    } finally {
      setBuildingsLoading(false);
    }
  }, [token, toaster]);

  // Load BOQ items for a building
  const loadBOQItems = useCallback(async (contractId: number, buildingId: number): Promise<any[]> => {
    try {
      setBOQItemsLoading(true);
      
      const response = await getContractBOQItems(contractId, buildingId, token || '');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        toaster.error(response.error || 'Failed to load BOQ items');
        return [];
      }
    } catch (error) {
      console.error('Error loading BOQ items:', error);
      toaster.error('Failed to load BOQ items');
      return [];
    } finally {
      setBOQItemsLoading(false);
    }
  }, [token, toaster]);

  // Generate VO number
  const generateVoNumber = useCallback(async (contractId: number): Promise<string> => {
    try {
      const response = await generateVONumber(contractId, token || '');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        // Fallback to local generation
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const time = date.getTime().toString().slice(-4);
        return `VO-C${contractId}-${year}${month}${day}-${time}`;
      }
    } catch (error) {
      console.error('Error generating VO number:', error);
      // Fallback generation
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const time = date.getTime().toString().slice(-4);
      return `VO-C${contractId}-${year}${month}${day}-${time}`;
    }
  }, [token]);

  // Submit contract VO
  const submitContractVO = useCallback(async (
    formData: any, 
    contractContext: ContractContext
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setSubmitting(true);
      
      // Transform form data to backend format
      const voDataset = transformFormDataToVoDataset(formData, contractContext);
      
      console.log('🚀 Submitting Contract VO:', JSON.stringify(voDataset, null, 2));
      
      const response = await createContractVO(voDataset, token || '');
      
      if (response.success) {
        toaster.success('Variation Order created successfully!');
        return { success: true };
      } else {
        const errorMsg = response.error || 'Failed to create VO';
        toaster.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      console.error('Error submitting contract VO:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      toaster.error(`Failed to create VO: ${errorMsg}`);
      return { success: false, error: errorMsg };
    } finally {
      setSubmitting(false);
    }
  }, [token, toaster]);

  // Load contract VOs (for contract details page)
  const loadContractVOs = useCallback(async (contractId: number): Promise<any[]> => {
    try {
      setLoading(true);
      
      const response = await getContractVOs(contractId, token || '');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        toaster.error(response.error || 'Failed to load contract VOs');
        return [];
      }
    } catch (error) {
      console.error('Error loading contract VOs:', error);
      toaster.error('Failed to load contract VOs');
      return [];
    } finally {
      setLoading(false);
    }
  }, [token, toaster]);

  return {
    // State
    loading,
    contractLoading,
    buildingsLoading,
    boqItemsLoading,
    submitting,
    
    // Functions
    loadContractContext,
    loadContractBuildings,
    loadBOQItems,
    generateVoNumber,
    submitContractVO,
    loadContractVOs,
    
    // Utilities
    transformFormDataToVoDataset
  };
};

export default useContractVOCreation;