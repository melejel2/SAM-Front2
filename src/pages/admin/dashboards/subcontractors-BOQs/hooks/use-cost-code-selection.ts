import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import apiRequest from '@/api/api';
import useToast from '@/hooks/use-toast';

interface CostCodeLibrary {
  id: number;
  en?: string;
  fr?: string;
  code: string;
  bold?: boolean;
  color?: string;
  created: string;
}

interface UseCostCodeSelectionReturn {
  costCodes: CostCodeLibrary[];
  loading: boolean;
  selectedCostCode: CostCodeLibrary | null;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
  setSelectedCostCode: (costCode: CostCodeLibrary | null) => void;
  fetchCostCodes: () => Promise<void>;
  handleCostCodeSelect: (costCode: CostCodeLibrary) => void;
  handleCostCodeDoubleClick: (currentCostCode?: string) => void;
}

const useCostCodeSelection = (): UseCostCodeSelectionReturn => {
  const [costCodes, setCostCodes] = useState<CostCodeLibrary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCostCode, setSelectedCostCode] = useState<CostCodeLibrary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { getToken } = useAuth();
  const { toaster } = useToast();
  const token = getToken();

  // Fetch cost codes from API
  const fetchCostCodes = useCallback(async () => {
    if (costCodes.length > 0) return; // Don't fetch if already loaded

    setLoading(true);
    try {
      const data = await apiRequest({
        endpoint: "CostCode/GetCodeCostLibrary",
        method: "GET",
        token: token ?? "",
      });

      if (data && Array.isArray(data)) {
        // Sort cost codes by code for better user experience
        const sortedCostCodes = data.sort((a, b) => 
          (a.code || '').localeCompare(b.code || '')
        );
        setCostCodes(sortedCostCodes);
      } else {
        setCostCodes([]);
        toaster.error("Failed to load cost codes");
      }
    } catch (error) {
      console.error("Error fetching cost codes:", error);
      toaster.error("Failed to load cost codes");
      setCostCodes([]);
    } finally {
      setLoading(false);
    }
  }, [costCodes.length, token, toaster]);

  // Handle cost code selection
  const handleCostCodeSelect = useCallback((costCode: CostCodeLibrary) => {
    setSelectedCostCode(costCode);
    setModalOpen(false);
  }, []);

  // Handle double-click to open cost code dialog
  const handleCostCodeDoubleClick = useCallback((currentCostCode?: string) => {
    // Find currently selected cost code if provided
    const currentSelection = currentCostCode 
      ? costCodes.find(code => code.code === currentCostCode)
      : null;
    
    setSelectedCostCode(currentSelection || null);
    setModalOpen(true);
    
    // Fetch cost codes if not already loaded
    if (costCodes.length === 0) {
      fetchCostCodes();
    }
  }, [costCodes, fetchCostCodes]);

  return {
    costCodes,
    loading,
    selectedCostCode,
    modalOpen,
    setModalOpen,
    setSelectedCostCode,
    fetchCostCodes,
    handleCostCodeSelect,
    handleCostCodeDoubleClick,
  };
};

export default useCostCodeSelection;