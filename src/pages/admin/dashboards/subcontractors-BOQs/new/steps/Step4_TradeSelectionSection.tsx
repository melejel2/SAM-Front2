import React from "react";
import { Icon } from "@iconify/react";
import layersIcon from "@iconify/icons-lucide/layers";
import buildingIcon from "@iconify/icons-lucide/building";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";

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
        <div className="bg-base-100 border border-base-300 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
                <Icon icon={layersIcon} className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-base-content">Select Trades</h3>
            </div>
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
                                            onChange={(e) => onTradeToggle(trade.name, e.target.checked)}
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

            {selectedTrades.length > 0 && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm text-base-content">
                        <span className="font-semibold">{selectedTrades.length}</span> trade{selectedTrades.length !== 1 ? 's' : ''} selected
                    </p>
                </div>
            )}
        </div>
    );
};
