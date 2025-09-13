import { useState, useEffect, useCallback } from "react";
import { VOLevelType, VOLevelContext, VOLevelHierarchyState, VoDatasetBoqDetailsVM, ContractVoesVM, VoDataSetBuildingsVM } from "@/types/variation-order";

interface UseVOLevelHierarchyProps {
    voDataset?: VoDatasetBoqDetailsVM;
    initialLevel?: VOLevelType;
    onLevelChange?: (level: VOLevelType, context: VOLevelContext) => void;
}

const useVOLevelHierarchy = ({ 
    voDataset, 
    initialLevel = 'Project',
    onLevelChange 
}: UseVOLevelHierarchyProps) => {
    const [state, setState] = useState<VOLevelHierarchyState>({
        currentLevel: initialLevel,
        context: { level: initialLevel },
        filteredItems: [],
        availableBuildings: [],
        availableSheets: []
    });
    
    const [loading, setLoading] = useState(false);

    // Initialize state from voDataset
    useEffect(() => {
        if (voDataset) {
            const initialContext: VOLevelContext = {
                level: initialLevel,
                projectId: voDataset.projectId || undefined,
                buildingId: voDataset.buildingId || undefined,
                projectName: voDataset.projectName,
                // We don't have building name in the main dataset, will be filled when selecting
            };

            setState(prevState => ({
                ...prevState,
                context: initialContext,
                availableBuildings: voDataset.buildings || []
            }));
        }
    }, [voDataset, initialLevel]);

    // Filter items based on current level and context
    const filterItemsByLevel = useCallback(() => {
        if (!voDataset?.buildings) {
            setState(prevState => ({
                ...prevState,
                filteredItems: []
            }));
            return;
        }

        setLoading(true);
        let items: ContractVoesVM[] = [];

        try {
            switch (state.currentLevel) {
                case 'Project':
                    // Show all items across all buildings
                    items = voDataset.buildings.flatMap((building: VoDataSetBuildingsVM) => 
                        building.contractVoes.map((item: ContractVoesVM) => ({
                            ...item,
                            buildingName: building.buildingName,
                            buildingId: building.id,
                            level: state.currentLevel === 'Project' ? 0 : state.currentLevel === 'Building' ? 1 : 2
                        }))
                    );
                    break;

                case 'Building':
                    // Show items for specific building
                    if (state.context.buildingId) {
                        const building = voDataset.buildings.find(b => b.id === state.context.buildingId);
                        if (building) {
                            items = building.contractVoes.map((item: ContractVoesVM) => ({
                                ...item,
                                buildingName: building.buildingName,
                                buildingId: building.id,
                                level: state.currentLevel === 'Project' ? 0 : state.currentLevel === 'Building' ? 1 : 2
                            }));
                        }
                    }
                    break;

                case 'Sheet':
                    // Show items for specific sheet within a building
                    if (state.context.buildingId && state.context.sheetId) {
                        const building = voDataset.buildings.find(b => b.id === state.context.buildingId);
                        if (building) {
                            items = building.contractVoes
                                .filter((item: ContractVoesVM) => item.boqSheetId === state.context.sheetId)
                                .map((item: ContractVoesVM) => ({
                                    ...item,
                                    buildingName: building.buildingName,
                                    buildingId: building.id,
                                    level: state.currentLevel === 'Project' ? 0 : state.currentLevel === 'Building' ? 1 : 2
                                }));
                        }
                    }
                    break;
            }

            setState(prevState => ({
                ...prevState,
                filteredItems: items
            }));
        } catch (error) {
            console.error("Error filtering VO items:", error);
            setState(prevState => ({
                ...prevState,
                filteredItems: []
            }));
        } finally {
            setLoading(false);
        }
    }, [voDataset, state.currentLevel, state.context.buildingId, state.context.sheetId]);

    // Filter items when level or context changes
    useEffect(() => {
        filterItemsByLevel();
    }, [filterItemsByLevel]);

    // Get available sheets for a specific building
    const getAvailableSheets = useCallback((buildingId: number) => {
        if (!voDataset?.buildings) return [];

        const building = voDataset.buildings.find(b => b.id === buildingId);
        if (!building) return [];

        // Get unique sheets from contractVoes
        const sheets = building.contractVoes.reduce((acc: { id: number; name: string }[], item: ContractVoesVM) => {
            const existingSheet = acc.find(s => s.id === item.boqSheetId);
            if (!existingSheet && item.sheetName) {
                acc.push({
                    id: item.boqSheetId,
                    name: item.sheetName
                });
            }
            return acc;
        }, []);

        return sheets;
    }, [voDataset]);

    // Navigate to a specific level
    const navigateToLevel = useCallback((level: VOLevelType, contextUpdate: Partial<VOLevelContext> = {}) => {
        const newContext: VOLevelContext = {
            ...state.context,
            ...contextUpdate,
            level
        };

        // Clear lower level contexts when navigating up
        if (level === 'Project') {
            newContext.buildingId = undefined;
            newContext.sheetId = undefined;
            newContext.buildingName = undefined;
            newContext.sheetName = undefined;
        } else if (level === 'Building') {
            newContext.sheetId = undefined;
            newContext.sheetName = undefined;
        }

        // Update available sheets when building context changes
        const availableSheets = newContext.buildingId 
            ? getAvailableSheets(newContext.buildingId)
            : [];

        setState(prevState => ({
            ...prevState,
            currentLevel: level,
            context: newContext,
            availableSheets
        }));

        if (onLevelChange) {
            onLevelChange(level, newContext);
        }
    }, [state.context, getAvailableSheets, onLevelChange]);

    // Calculate totals for current filtered items
    const getTotals = useCallback(() => {
        const items = state.filteredItems.length;
        const totalQuantity = state.filteredItems.reduce((sum, item) => sum + (item.qte || 0), 0);
        const totalAmount = state.filteredItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

        return {
            items,
            quantity: totalQuantity,
            amount: totalAmount
        };
    }, [state.filteredItems]);

    // Get current level status
    const getNavigationStatus = useCallback(() => {
        const canNavigateToBuilding = state.availableBuildings.length > 0;
        const canNavigateToSheet = state.context.buildingId && state.availableSheets.length > 0;

        return {
            canNavigateToBuilding,
            canNavigateToSheet,
            hasBuildings: state.availableBuildings.length > 0,
            hasSheets: state.availableSheets.length > 0,
            isAtProjectLevel: state.currentLevel === 'Project',
            isAtBuildingLevel: state.currentLevel === 'Building',
            isAtSheetLevel: state.currentLevel === 'Sheet'
        };
    }, [state.availableBuildings.length, state.availableSheets.length, state.context.buildingId, state.currentLevel]);

    // Reset to project level
    const resetToProjectLevel = useCallback(() => {
        navigateToLevel('Project');
    }, [navigateToLevel]);

    return {
        // Current state
        currentLevel: state.currentLevel,
        levelContext: state.context,
        filteredItems: state.filteredItems,
        availableBuildings: state.availableBuildings,
        availableSheets: state.availableSheets,
        
        // Loading state
        loading,
        
        // Actions
        navigateToLevel,
        resetToProjectLevel,
        
        // Computed values
        totals: getTotals(),
        navigationStatus: getNavigationStatus(),
        
        // Utilities
        getAvailableSheets,
        
        // Raw state (for debugging)
        state
    };
};

export default useVOLevelHierarchy;