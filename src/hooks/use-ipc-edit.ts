import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { ipcApiService } from "@/api/services/ipc-api";
import type {
  SaveIPCVM,
  IpcSummaryData,
  ContractBuildingsVM,
  CreateIpcRequest,
  UpdateIpcRequest
} from "@/types/ipc";

/**
 * Hook for IPC edit operations with enhanced penalty and summary data support
 * Handles the new backend features: IpcSummaryData, OpenPenaltyForm, PreviousPenalty
 */
export const useIpcEdit = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ipcData, setIpcData] = useState<SaveIPCVM | null>(null);
  const [summaryData, setSummaryData] = useState<IpcSummaryData | null>(null);
  const [buildings, setBuildings] = useState<ContractBuildingsVM[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // NEW: Penalty form state
  const [showPenaltyForm, setShowPenaltyForm] = useState(false);
  const [penaltyData, setPenaltyData] = useState({
    penalty: 0,
    previousPenalty: 0,
    reason: ""
  });

  const { getToken } = useAuth();
  const token = getToken();

  /**
   * Load IPC for editing with summary data
   */
  const loadIpcForEdit = useCallback(async (ipcId: number) => {
    if (!token) {
      setError("Authentication token is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load IPC edit data
      const ipcResponse = await ipcApiService.getIpcForEdit(ipcId, token);
      
      if (!ipcResponse.success || !ipcResponse.data) {
        throw new Error(ipcResponse.error || "Failed to load IPC data");
      }

      const ipc = ipcResponse.data;
      setIpcData(ipc);

      // NEW: Check if penalty form should be opened automatically
      if (ipc.openPenaltyForm) {
        setShowPenaltyForm(true);
        setPenaltyData({
          penalty: ipc.penalty || 0,
          previousPenalty: ipc.previousPenalty || 0,
          reason: ""
        });
      }

      // NEW: Load summary data if available
      if (ipc.ipcSummaryData) {
        setSummaryData(ipc.ipcSummaryData);
      } else if (ipc.contractsDatasetId) {
        // Fallback: load summary data separately
        const summaryResponse = await ipcApiService.getIpcSummaryData(ipc.contractsDatasetId, token);
        if (summaryResponse.success && summaryResponse.data) {
          setSummaryData(summaryResponse.data);
        }
      }

      // Load contract buildings data
      if (ipc.contractsDatasetId) {
        const buildingsResponse = await ipcApiService.getContractBuildings(ipc.contractsDatasetId, token);
        if (buildingsResponse.success && buildingsResponse.data) {
          setBuildings(buildingsResponse.data);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load IPC";
      setError(errorMessage);
      console.error("Error loading IPC for edit:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * NEW: Load IPC summary data separately
   */
  const loadSummaryData = useCallback(async (contractsDatasetId: number) => {
    if (!token) return;

    try {
      const response = await ipcApiService.getIpcSummaryData(contractsDatasetId, token);
      if (response.success && response.data) {
        setSummaryData(response.data);
      }
    } catch (err) {
      console.error("Error loading IPC summary data:", err);
    }
  }, [token]);

  /**
   * Create new IPC
   */
  const createIpc = useCallback(async (request: CreateIpcRequest) => {
    if (!token) {
      setError("Authentication token is required");
      return null;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await ipcApiService.createIpc(request, token);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to create IPC");
      }

      setIpcData(response.data);
      return response.data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create IPC";
      setError(errorMessage);
      console.error("Error creating IPC:", err);
      return null;
    } finally {
      setSaving(false);
    }
  }, [token]);

  /**
   * Update existing IPC with enhanced penalty support
   */
  const updateIpc = useCallback(async (request: UpdateIpcRequest) => {
    if (!token) {
      setError("Authentication token is required");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      // NEW: Include penalty data if penalty form was used
      if (showPenaltyForm) {
        request.penalty = penaltyData.penalty;
        request.previousPenalty = penaltyData.previousPenalty;
        request.openPenaltyForm = true;
      }

      const response = await ipcApiService.updateIpc(request, token);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to update IPC");
      }

      // Update local state
      setIpcData(prevData => prevData ? { ...prevData, ...request } : null);
      
      // Close penalty form if it was open
      if (showPenaltyForm) {
        setShowPenaltyForm(false);
      }

      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update IPC";
      setError(errorMessage);
      console.error("Error updating IPC:", err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [token, showPenaltyForm, penaltyData]);

  /**
   * Update BOQ quantities for IPC calculations
   */
  const updateBoqQuantities = useCallback((buildingId: number, boqId: number, actualQte: number) => {
    setBuildings(prevBuildings => 
      prevBuildings.map(building => 
        building.id === buildingId
          ? {
              ...building,
              boqs: building.boqs.map(boq => 
                boq.id === boqId
                  ? { ...boq, actualQte }
                  : boq
              )
            }
          : building
      )
    );
  }, []);

  /**
   * NEW: Open penalty form modal
   */
  const openPenaltyForm = useCallback((currentPenalty = 0, previousPenalty = 0) => {
    setPenaltyData({
      penalty: currentPenalty,
      previousPenalty: previousPenalty,
      reason: ""
    });
    setShowPenaltyForm(true);
  }, []);

  /**
   * NEW: Close penalty form modal
   */
  const closePenaltyForm = useCallback(() => {
    setShowPenaltyForm(false);
  }, []);

  /**
   * NEW: Update penalty data
   */
  const updatePenaltyData = useCallback((updates: Partial<typeof penaltyData>) => {
    setPenaltyData(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Calculate current IPC totals based on BOQ progress
   */
  const calculateIpcTotals = useCallback(() => {
    if (!buildings.length) return { totalAmount: 0, actualAmount: 0 };

    let totalAmount = 0;
    let actualAmount = 0;

    buildings.forEach(building => {
      building.boqs.forEach(boq => {
        totalAmount += boq.totalAmount;
        actualAmount += boq.actualAmount;
      });
    });

    return { totalAmount, actualAmount };
  }, [buildings]);

  return {
    // State
    loading,
    saving,
    error,
    ipcData,
    summaryData, // NEW: Summary data with amount/previous/remaining
    buildings,
    showPenaltyForm, // NEW: Penalty form visibility
    penaltyData, // NEW: Penalty form data

    // Actions
    loadIpcForEdit,
    loadSummaryData, // NEW: Load summary data separately
    createIpc,
    updateIpc,
    updateBoqQuantities,
    calculateIpcTotals,
    
    // NEW: Penalty form actions
    openPenaltyForm,
    closePenaltyForm,
    updatePenaltyData,

    // Utility
    setError,
    clearData: () => {
      setIpcData(null);
      setSummaryData(null);
      setBuildings([]);
      setError(null);
      setShowPenaltyForm(false);
      setPenaltyData({ penalty: 0, previousPenalty: 0, reason: "" });
    }
  };
};

export default useIpcEdit;
