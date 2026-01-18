import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import layersIcon from "@iconify/icons-lucide/layers";
import buildingIcon from "@iconify/icons-lucide/building";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import chevronDownIcon from "@iconify/icons-lucide/chevron-down";
import chevronRightIcon from "@iconify/icons-lucide/chevron-right";

interface Trade {
    name: string;
    buildingCount: number;
    sheetCount: number;
    buildings: any[];
}

interface TradeSelectionSectionProps {
    trades: Trade[];
    selectedTrades: string[];
    onTradeToggle: (tradeName: string, checked: boolean) => void;
}

export const TradeSelectionSection: React.FC<TradeSelectionSectionProps> = ({
    trades,
    selectedTrades,
    onTradeToggle
}) => {
    // Start expanded if no trades selected, collapsed if trades already selected
    const [isExpanded, setIsExpanded] = useState(selectedTrades.length === 0);

    // Auto-collapse when a trade is selected
    useEffect(() => {
        if (selectedTrades.length > 0) {
            setIsExpanded(false);
        }
    }, [selectedTrades.length]);

    const handleTradeToggle = (tradeName: string, checked: boolean) => {
        onTradeToggle(tradeName, checked);
        // Auto-collapse after selecting a trade
        if (checked) {
            setIsExpanded(false);
        }
    };

    if (trades.length === 0) {
        return (
            <div className="text-center py-12">
                <Icon icon={layersIcon} className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-base-content mb-2">No Trades Available</h3>
                <p className="text-base-content/60">
                    This project doesn't have any configured trades with BOQ data
                </p>
            </div>
        );
    }

    return (
        <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-3 py-2 hover:bg-base-50 transition-colors ${isExpanded ? 'border-b border-base-300' : ''}`}
            >
                <div className="flex items-center gap-2">
                    <Icon
                        icon={isExpanded ? chevronDownIcon : chevronRightIcon}
                        className="w-4 h-4 text-base-content/60"
                    />
                    <Icon icon={layersIcon} className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm text-base-content">Select Trades</span>
                    {selectedTrades.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                            {selectedTrades.map(tradeName => (
                                <div key={tradeName} className="badge badge-primary badge-sm">
                                    {tradeName}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="p-3">
                    <p className="text-xs text-base-content/70 mb-3">
                        Choose one or more trades for this subcontract
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {trades.map(trade => {
                            const isSelected = selectedTrades.includes(trade.name);

                            return (
                                <label
                                    key={trade.name}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all duration-150 hover:shadow-sm ${
                                        isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-base-300 bg-base-100 hover:border-base-400'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary checkbox-sm"
                                        checked={isSelected}
                                        onChange={(e) => handleTradeToggle(trade.name, e.target.checked)}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <Icon icon={layersIcon} className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                                            <span className="font-medium text-sm text-base-content truncate">{trade.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                                            <Icon icon={buildingIcon} className="w-3 h-3" />
                                            <span>{trade.buildingCount} buildings</span>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <Icon icon={checkCircleIcon} className="w-4 h-4 text-primary flex-shrink-0" />
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
