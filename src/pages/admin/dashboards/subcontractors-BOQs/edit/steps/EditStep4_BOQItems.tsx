import React, { useState, useMemo } from "react";
import { useEditWizardContext } from "../context/EditWizardContext";
import { EditTradeSelectionSection } from "./EditStep4_TradeSelectionSection";
import { EditBuildingSelectionSection } from "./EditStep4_BuildingSelectionSection";
import { EditBOQEditingSection } from "./EditStep4_BOQEditingSection";

export const EditStep4_BOQItems: React.FC = () => {
    const { formData, setFormData, allBuildings, trades, loading } = useEditWizardContext();
    const [activeTab, setActiveTab] = useState<string>("");
    const [budgetBOQLoadedTabs, setBudgetBOQLoadedTabs] = useState<Set<string>>(new Set());

    // Build buildings list per trade
    const tradesWithBuildings = useMemo(() => {
        return trades.map((trade: any) => {
            const buildings = allBuildings.filter((building: any) =>
                building.sheets.some((sheet: any) => sheet.name === trade.name && sheet.boqItemCount && sheet.boqItemCount > 0)
            );
            return {
                ...trade,
                buildings
            };
        });
    }, [trades, allBuildings]);

    // Handle trade selection toggle
    const handleTradeToggle = (tradeId: number, checked: boolean) => {
        const newSelectedTrades = checked
            ? [...formData.selectedTrades, tradeId]
            : formData.selectedTrades.filter((t: number) => t !== tradeId);

        setFormData({ selectedTrades: newSelectedTrades });

        if (!checked) {
            // Remove all mappings for this trade
            const newBuildingTradeMap = formData.buildingTradeMap.filter(
                (mapping: any) => mapping.tradeId !== tradeId
            );
            setFormData({ buildingTradeMap: newBuildingTradeMap });

            // Remove BOQ data for this trade
            const trade = tradesWithBuildings.find((t: any) => t.id === tradeId);
            if (trade) {
                const newBoqData = formData.boqData.filter((b: any) => b.sheetName !== trade.name);
                setFormData({ boqData: newBoqData });

                // CRITICAL FIX: Clear budgetBOQLoadedTabs for all tabs with this trade
                setBudgetBOQLoadedTabs(prev => {
                    const newSet = new Set(prev);
                    // Find all tab keys for this trade and remove them
                    allBuildings.forEach((building: any) => {
                        const key = `${building.id}-${trade.name}`;
                        newSet.delete(key);
                    });
                    return newSet;
                });
            }
        }
    };

    // Handle building selection per trade
    const handleBuildingToggle = (tradeId: number, tradeName: string, buildingId: number, checked: boolean) => {
        if (checked) {
            // Add new mapping
            const newMapping = {
                buildingId,
                tradeId,
                tradeName
            };
            setFormData({
                buildingTradeMap: [...formData.buildingTradeMap, newMapping]
            });
        } else {
            // Remove mapping
            const newBuildingTradeMap = formData.buildingTradeMap.filter(
                (mapping: any) => !(mapping.buildingId === buildingId && mapping.tradeId === tradeId)
            );
            setFormData({ buildingTradeMap: newBuildingTradeMap });

            // Remove BOQ data for this building-trade combination
            const newBoqData = formData.boqData.filter(
                (b: any) => !(b.buildingId === buildingId && b.sheetName === tradeName)
            );
            setFormData({ boqData: newBoqData });

            // CRITICAL FIX: Clear budgetBOQLoadedTabs for this specific tab
            const tabKey = `${buildingId}-${tradeName}`;
            setBudgetBOQLoadedTabs(prev => {
                const newSet = new Set(prev);
                newSet.delete(tabKey);
                return newSet;
            });
        }
    };

    // Generate tabs for BOQ editing
    const boqTabs = useMemo(() => {
        const tabs: Array<{ key: string; label: string; buildingId: number; tradeName: string }> = [];

        formData.buildingTradeMap.forEach((mapping: any) => {
            const building = allBuildings.find((b: any) => b.id === mapping.buildingId);
            if (building) {
                tabs.push({
                    key: `${mapping.buildingId}-${mapping.tradeName}`,
                    label: `${mapping.tradeName} - ${building.name}`,
                    buildingId: mapping.buildingId,
                    tradeName: mapping.tradeName
                });
            }
        });

        return tabs;
    }, [formData.buildingTradeMap, allBuildings]);

    // Auto-select first tab when tabs change
    React.useEffect(() => {
        if (boqTabs.length > 0 && !activeTab) {
            setActiveTab(boqTabs[0].key);
        }
    }, [boqTabs, activeTab]);

    // Reset activeTab if current tab no longer exists (e.g., trade/building was removed)
    React.useEffect(() => {
        if (activeTab && boqTabs.length > 0) {
            // Check if current activeTab key still exists in boqTabs
            const tabExists = boqTabs.some(tab => tab.key === activeTab);
            if (!tabExists) {
                // Active tab was removed, switch to first available tab
                setActiveTab(boqTabs[0].key);
            }
        } else if (activeTab && boqTabs.length === 0) {
            // All tabs removed, clear activeTab
            setActiveTab("");
        }
    }, [boqTabs, activeTab]);

    if (loading) {
        return (
            <div className="text-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-4 text-base-content/70">Loading project data...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Section 1: Trade Selection */}
            <div className="flex-shrink-0">
                <EditTradeSelectionSection
                    trades={tradesWithBuildings}
                    selectedTrades={formData.selectedTrades}
                    onTradeToggle={handleTradeToggle}
                />
            </div>

            {/* Section 2: Building Selection per Trade */}
            {formData.selectedTrades.length > 0 && (
                <div className="flex-shrink-0 space-y-4">
                    {formData.selectedTrades.map((tradeId: number) => {
                        const trade = tradesWithBuildings.find((t: any) => t.id === tradeId);
                        if (!trade) return null;

                        // Get selected buildings for this trade from buildingTradeMap
                        const selectedBuildings = formData.buildingTradeMap
                            .filter((mapping: any) => mapping.tradeId === tradeId)
                            .map((mapping: any) => mapping.buildingId);

                        return (
                            <EditBuildingSelectionSection
                                key={tradeId}
                                tradeName={trade.name}
                                buildings={trade.buildings || []}
                                selectedBuildings={selectedBuildings}
                                onBuildingToggle={(buildingId: number, checked: boolean) =>
                                    handleBuildingToggle(tradeId, trade.name, buildingId, checked)
                                }
                            />
                        );
                    })}
                </div>
            )}

            {/* Section 3: BOQ Items Editing - takes remaining space */}
            {boqTabs.length > 0 && (
                <div className="flex-1 min-h-0">
                    <EditBOQEditingSection
                        tabs={boqTabs}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        budgetBOQLoadedTabs={budgetBOQLoadedTabs}
                        setBudgetBOQLoadedTabs={setBudgetBOQLoadedTabs}
                    />
                </div>
            )}
        </div>
    );
};
