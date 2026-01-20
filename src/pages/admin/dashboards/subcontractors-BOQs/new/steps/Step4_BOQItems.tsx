import React, { useState, useMemo } from "react";
import { useWizardContext } from "../context/WizardContext";
import { TradeSelectionSection } from "./Step4_TradeSelectionSection";
import { BuildingSelectionSection } from "./Step4_BuildingSelectionSection";
import { BOQEditingSection } from "./Step4_BOQEditingSection";

export const Step4_BOQItems: React.FC = () => {
    const { formData, setFormData, allBuildings, loading } = useWizardContext();
    const [activeTab, setActiveTab] = useState<string>("");
    const [budgetBOQLoadedTabs, setBudgetBOQLoadedTabs] = useState<Set<string>>(new Set());

    // Derive available trades from allBuildings
    const availableTrades = useMemo(() => {
        const tradesMap = new Map<string, {
            name: string;
            buildingCount: number;
            sheetCount: number;
            buildings: any[];
        }>();

        allBuildings.forEach(building => {
            building.sheets.forEach(sheet => {
                if (sheet.boqItemCount && sheet.boqItemCount > 0) {
                    const existing = tradesMap.get(sheet.name);
                    if (existing) {
                        if (!existing.buildings.find(b => b.id === building.id)) {
                            existing.buildingCount++;
                            existing.buildings.push(building);
                        }
                        existing.sheetCount++;
                    } else {
                        tradesMap.set(sheet.name, {
                            name: sheet.name,
                            buildingCount: 1,
                            sheetCount: 1,
                            buildings: [building]
                        });
                    }
                }
            });
        });

        return Array.from(tradesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [allBuildings]);

    // Handle trade selection toggle
    const handleTradeToggle = (tradeName: string, checked: boolean) => {
        const newSelectedTrades = checked
            ? [...formData.selectedTrades, tradeName]
            : formData.selectedTrades.filter(t => t !== tradeName);

        setFormData({ selectedTrades: newSelectedTrades });

        if (!checked) {
            const newBuildingTradeMap = { ...formData.buildingTradeMap };
            delete newBuildingTradeMap[tradeName];
            setFormData({ buildingTradeMap: newBuildingTradeMap });

            // Remove BOQ data for this trade
            const newBoqData = formData.boqData.filter(b => b.sheetName !== tradeName);
            setFormData({ boqData: newBoqData });

            // CRITICAL FIX: Clear budgetBOQLoadedTabs for all tabs with this trade
            setBudgetBOQLoadedTabs(prev => {
                const newSet = new Set(prev);
                // Find all tab keys for this trade and remove them
                allBuildings.forEach(building => {
                    const key = `${building.id}-${tradeName}`;
                    newSet.delete(key);
                });
                return newSet;
            });
        }
    };

    // Handle building selection per trade
    const handleBuildingToggle = (tradeName: string, buildingId: number, checked: boolean) => {
        const currentBuildings = formData.buildingTradeMap[tradeName] || [];
        const newBuildings = checked
            ? [...currentBuildings, buildingId]
            : currentBuildings.filter(id => id !== buildingId);

        setFormData({
            buildingTradeMap: {
                ...formData.buildingTradeMap,
                [tradeName]: newBuildings
            }
        });

        if (!checked) {
            // Remove BOQ data for this building-trade combination
            const newBoqData = formData.boqData.filter(
                b => !(b.buildingId === buildingId && b.sheetName === tradeName)
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

        Object.entries(formData.buildingTradeMap).forEach(([tradeName, buildingIds]) => {
            buildingIds.forEach(buildingId => {
                const building = allBuildings.find(b => b.id === buildingId);
                if (building) {
                    tabs.push({
                        key: `${buildingId}-${tradeName}`,
                        label: `${tradeName} - ${building.name}`,
                        buildingId,
                        tradeName
                    });
                }
            });
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
                <TradeSelectionSection
                    trades={availableTrades}
                    selectedTrades={formData.selectedTrades}
                    onTradeToggle={handleTradeToggle}
                />
            </div>

            {/* Section 2: Building Selection per Trade */}
            {formData.selectedTrades.length > 0 && (
                <div className="flex-shrink-0 space-y-4">
                    {formData.selectedTrades.map(tradeName => (
                        <BuildingSelectionSection
                            key={tradeName}
                            tradeName={tradeName}
                            buildings={availableTrades.find(t => t.name === tradeName)?.buildings || []}
                            selectedBuildings={formData.buildingTradeMap[tradeName] || []}
                            onBuildingToggle={(buildingId, checked) =>
                                handleBuildingToggle(tradeName, buildingId, checked)
                            }
                        />
                    ))}
                </div>
            )}

            {/* Section 3: BOQ Items Editing - takes remaining space */}
            {boqTabs.length > 0 && (
                <div className="flex-1 min-h-0">
                    <BOQEditingSection
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
