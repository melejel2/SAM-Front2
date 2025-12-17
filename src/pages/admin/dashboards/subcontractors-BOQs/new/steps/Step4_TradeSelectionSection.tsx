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
                className="w-full flex items-center justify-between p-4 bg-base-200 hover:bg-base-300 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon
                        icon={isExpanded ? chevronDownIcon : chevronRightIcon}
                        className="w-5 h-5 text-base-content/60"
                    />
                    <Icon icon={layersIcon} className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-base-content">Select Trades</span>
                    {selectedTrades.length === 0 ? (
                        <div className="badge badge-neutral badge-sm">
                            {trades.length} trade{trades.length !== 1 ? 's' : ''} available
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
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
                <div className="p-4">
                    <p className="text-sm text-base-content/70 mb-4">
                        Choose one or more trades for this subcontract
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trades.map(trade => {
                            const isSelected = selectedTrades.includes(trade.name);

                            return (
                                <div key={trade.name} className="relative">
                                    <label
                                        className={`flex flex-col gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-base-300 bg-base-100 hover:border-base-400'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1">
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary mt-1"
                                                    checked={isSelected}
                                                    onChange={(e) => handleTradeToggle(trade.name, e.target.checked)}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Icon icon={layersIcon} className="w-5 h-5 text-base-content/60" />
                                                        <span className="font-medium text-base-content">{trade.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-base-content/70">
                                                        <div className="flex items-center gap-1">
                                                            <Icon icon={buildingIcon} className="w-4 h-4" />
                                                            <span>{trade.buildingCount} building{trade.buildingCount !== 1 ? 's' : ''}</span>
                                                        </div>
                                                        <div className="badge badge-neutral badge-sm">
                                                            {trade.sheetCount} sheet{trade.sheetCount !== 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Icon icon={checkCircleIcon} className="w-5 h-5 text-primary flex-shrink-0" />
                                            )}
                                        </div>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
