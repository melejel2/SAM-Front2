import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import type {
  ContractBuildingsVM,
  BoqIpcVM
} from "@/types/ipc";

/**
 * Hook for managing BOQ progress tracking with real-time calculations
 * Handles building-wise BOQ data management and inline editing
 */
export const useBoqProgress = (initialBuildings?: ContractBuildingsVM[]) => {
  const [buildings, setBuildings] = useState<ContractBuildingsVM[]>(initialBuildings || []);
  const [editingCell, setEditingCell] = useState<{ buildingId: number; boqId: number; field: string } | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());

  const { toaster } = useToast();

  /**
   * Update buildings data
   */
  const updateBuildings = useCallback((newBuildings: ContractBuildingsVM[]) => {
    setBuildings(newBuildings);
  }, []);

  /**
   * Update BOQ quantity with real-time calculations
   */
  const updateBoqQuantity = useCallback((buildingId: number, boqId: number, field: string, value: number) => {
    const changeKey = `${buildingId}-${boqId}-${field}`;
    
    // Validate input
    if (value < 0) {
      setValidationErrors(prev => new Map(prev.set(changeKey, "Quantity cannot be negative")));
      return;
    } else {
      setValidationErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(changeKey);
        return newErrors;
      });
    }

    setBuildings(prevBuildings => 
      prevBuildings.map(building => 
        building.id === buildingId
          ? {
              ...building,
              boqs: building.boqs.map(boq => 
                boq.id === boqId
                  ? calculateBoqAmounts({ ...boq, [field]: value })
                  : boq
              )
            }
          : building
      )
    );

    // Mark as unsaved
    setUnsavedChanges(prev => new Set(prev.add(changeKey)));
  }, []);

  const calculateBoqAmounts = (boq: BoqIpcVM): BoqIpcVM => {
    const unitPrice = boq.unitPrice || 0;
    
    return {
      ...boq,
      totalAmount: boq.qte * unitPrice,
      cumulAmount: boq.cumulQte * unitPrice,
      actualAmount: boq.actualQte * unitPrice,
      precedAmount: boq.precedQte * unitPrice,
      cumulPercent: calculateCumulPercent(boq.qte, boq.cumulQte)
    };
  };

  const calculateCumulPercent = useCallback((qte: number, cumulQte: number) => {
    return qte === 0 ? 0 : (cumulQte / qte) * 100;
  }, []);

  /**
   * Bulk update BOQ quantities for a building
   */
  const bulkUpdateBuilding = useCallback((buildingId: number, updates: Array<{ boqId: number; actualQte: number }>) => {
    setBuildings(prevBuildings => 
      prevBuildings.map(building => 
        building.id === buildingId
          ? {
              ...building,
              boqs: building.boqs.map(boq => {
                const update = updates.find(u => u.boqId === boq.id);
                if (update) {
                  const updatedBoq = { ...boq, actualQte: update.actualQte };
                  return calculateBoqAmounts(updatedBoq);
                }
                return boq;
              })
            }
          : building
      )
    );

    // Mark all updates as unsaved
    updates.forEach(update => {
      const changeKey = `${buildingId}-${update.boqId}-actualQte`;
      setUnsavedChanges(prev => new Set(prev.add(changeKey)));
    });
  }, [calculateBoqAmounts]);

  /**
   * Copy previous quantities to actual quantities
   */
  const copyPreviousToActual = useCallback((buildingId: number) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    const updates = building.boqs.map(boq => ({
      boqId: boq.id,
      actualQte: boq.precedQte || 0
    }));

    bulkUpdateBuilding(buildingId, updates);
    toaster.success("Previous quantities copied to actual quantities");
  }, [buildings, bulkUpdateBuilding, toaster]);

  /**
   * Copy cumulative quantities to actual quantities
   */
  const copyCumulativeToActual = useCallback((buildingId: number) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    const updates = building.boqs.map(boq => ({
      boqId: boq.id,
      actualQte: boq.cumulQte || 0
    }));

    bulkUpdateBuilding(buildingId, updates);
    toaster.success("Cumulative quantities copied to actual quantities");
  }, [buildings, bulkUpdateBuilding, toaster]);

  /**
   * Apply percentage to all quantities in a building
   */
  const applyPercentageToBuilding = useCallback((buildingId: number, percentage: number) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    if (percentage < 0 || percentage > 200) {
      toaster.error("Percentage must be between 0 and 200");
      return;
    }

    const updates = building.boqs.map(boq => ({
      boqId: boq.id,
      actualQte: Math.round((boq.qte || 0) * (percentage / 100) * 100) / 100 // Round to 2 decimal places
    }));

    bulkUpdateBuilding(buildingId, updates);
    toaster.success(`Applied ${percentage}% to all quantities`);
  }, [buildings, bulkUpdateBuilding, toaster]);

  /**
   * Clear all actual quantities in a building
   */
  const clearBuildingQuantities = useCallback((buildingId: number) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    const updates = building.boqs.map(boq => ({
      boqId: boq.id,
      actualQte: 0
    }));

    bulkUpdateBuilding(buildingId, updates);
    toaster.success("All quantities cleared");
  }, [buildings, bulkUpdateBuilding, toaster]);

  /**
   * Get totals for a specific building
   */
  const getBuildingTotals = useCallback((buildingId: number) => {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return { totalAmount: 0, actualAmount: 0, cumulAmount: 0, precedAmount: 0 };

    return building.boqs.reduce((totals, boq) => ({
      totalAmount: totals.totalAmount + (boq.totalAmount || 0),
      actualAmount: totals.actualAmount + (boq.actualAmount || 0),
      cumulAmount: totals.cumulAmount + (boq.cumulAmount || 0),
      precedAmount: totals.precedAmount + (boq.precedAmount || 0)
    }), { totalAmount: 0, actualAmount: 0, cumulAmount: 0, precedAmount: 0 });
  }, [buildings]);

  /**
   * Get overall totals across all buildings
   */
  const getOverallTotals = useCallback(() => {
    return buildings.reduce((totals, building) => {
      const buildingTotals = getBuildingTotals(building.id);
      return {
        totalAmount: totals.totalAmount + buildingTotals.totalAmount,
        actualAmount: totals.actualAmount + buildingTotals.actualAmount,
        cumulAmount: totals.cumulAmount + buildingTotals.cumulAmount,
        precedAmount: totals.precedAmount + buildingTotals.precedAmount
      };
    }, { totalAmount: 0, actualAmount: 0, cumulAmount: 0, precedAmount: 0 });
  }, [buildings, getBuildingTotals]);

  /**
   * Get progress percentage for a building
   */
  const getBuildingProgress = useCallback((buildingId: number) => {
    const totals = getBuildingTotals(buildingId);
    if (totals.totalAmount === 0) return 0;
    return (totals.actualAmount / totals.totalAmount) * 100;
  }, [getBuildingTotals]);

  /**
   * Get overall progress percentage
   */
  const getOverallProgress = useCallback(() => {
    const totals = getOverallTotals();
    if (totals.totalAmount === 0) return 0;
    return (totals.actualAmount / totals.totalAmount) * 100;
  }, [getOverallTotals]);

  /**
   * Start editing a specific cell
   */
  const startEditing = useCallback((buildingId: number, boqId: number, field: string) => {
    setEditingCell({ buildingId, boqId, field });
  }, []);

  /**
   * Stop editing and save changes
   */
  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  /**
   * Check if a cell is currently being edited
   */
  const isEditing = useCallback((buildingId: number, boqId: number, field: string) => {
    return editingCell?.buildingId === buildingId && 
           editingCell?.boqId === boqId && 
           editingCell?.field === field;
  }, [editingCell]);

  /**
   * Check if there are unsaved changes
   */
  const hasUnsavedChanges = useCallback(() => {
    return unsavedChanges.size > 0;
  }, [unsavedChanges]);

  /**
   * Mark changes as saved
   */
  const markAsSaved = useCallback(() => {
    setUnsavedChanges(new Set());
  }, []);

  /**
   * Get validation error for a specific field
   */
  const getValidationError = useCallback((buildingId: number, boqId: number, field: string) => {
    const changeKey = `${buildingId}-${boqId}-${field}`;
    return validationErrors.get(changeKey);
  }, [validationErrors]);

  /**
   * Check if there are any validation errors
   */
  const hasValidationErrors = useCallback(() => {
    return validationErrors.size > 0;
  }, [validationErrors]);

  /**
   * Export BOQ data for API submission
   */
  const exportForApi = useCallback(() => {
    return buildings.map(building => ({
      ...building,
      boqs: building.boqs.map(boq => calculateBoqAmounts(boq))
    }));
  }, [buildings, calculateBoqAmounts]);

  // Recalculate amounts when buildings change
  useEffect(() => {
    setBuildings(prevBuildings => 
      prevBuildings.map(building => ({
        ...building,
        boqs: building.boqs.map(boq => calculateBoqAmounts(boq))
      }))
    );
  }, []); // Only run on mount

  return {
    // State
    buildings,
    editingCell,
    unsavedChanges,
    validationErrors,

    // Data management
    updateBuildings,
    updateBoqQuantity,
    bulkUpdateBuilding,

    // Bulk operations
    copyPreviousToActual,
    copyCumulativeToActual,
    applyPercentageToBuilding,
    clearBuildingQuantities,

    // Calculations
    getBuildingTotals,
    getOverallTotals,
    getBuildingProgress,
    getOverallProgress,
    calculateBoqAmounts,

    // Editing state
    startEditing,
    stopEditing,
    isEditing,

    // Change tracking
    hasUnsavedChanges,
    markAsSaved,

    // Validation
    getValidationError,
    hasValidationErrors,

    // Export
    exportForApi
  };
};

export default useBoqProgress;