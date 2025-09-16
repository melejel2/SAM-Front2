import React from "react";
import { Icon } from "@iconify/react";
import folderIcon from "@iconify/icons-lucide/folder-open";
import layersIcon from "@iconify/icons-lucide/layers";
import buildingIcon from "@iconify/icons-lucide/building";
import checkIcon from "@iconify/icons-lucide/check";
import { useEditWizardContext } from "../context/EditWizardContext";

export const EditStep2_TradeSelection: React.FC = () => {
    const { formData, setFormData, projects, trades, allBuildings, loading } = useEditWizardContext();

    const selectedProject = projects.find(p => p.id === formData.projectId);

    const handleTradeSelection = (tradeId: number) => {
        setFormData({ tradeId });
    };

    // Enhanced trade data - only showing trades with actual BOQ data (matching budget BOQ behavior)
    const enhancedTrades = trades.map(trade => {
        const buildingsWithTrade = (allBuildings || []).filter(building =>
            building.sheets && building.sheets.some(sheet =>
                sheet.name === trade.name && // Match sheet name with trade name
                sheet.boqItemCount && sheet.boqItemCount > 0 // Only sheets with actual BOQ data
            )
        );

        return {
            ...trade,
            buildings: buildingsWithTrade,
            buildingNames: buildingsWithTrade.map(b => b.name).join(", "),
            totalSheets: buildingsWithTrade.reduce((sum, building) =>
                sum + (building.sheets || []).filter(sheet =>
                    sheet.name === trade.name &&
                    sheet.boqItemCount && sheet.boqItemCount > 0 // Only count sheets with BOQ data
                ).length, 0
            )
        };
    }); // Trades already filtered in EditWizardContext to only include those with BOQ data

    if (!selectedProject) {
        return (
            <div className="text-center py-8">
                <p className="text-base-content/60">Please select a project first</p>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-base-100 border border-base-300 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <Icon icon={folderIcon} className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-base-content">Project: {selectedProject.name}</h3>
                </div>
                <p className="text-sm text-base-content/70 ml-7">Select the trade for this subcontract</p>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="mt-4 text-base-content/70">Loading available trades...</p>
                </div>
            ) : enhancedTrades.length > 0 ? (
                <div>

                    <div className="overflow-x-auto bg-base-100 rounded-lg border border-base-300">
                        <table className="table w-full bg-base-100">
                            <thead>
                                <tr>
                                    <th className="w-12"></th>
                                    <th>
                                        <div className="flex items-center gap-2">
                                            <Icon icon={layersIcon} className="w-4 h-4" />
                                            Trade Name
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex items-center gap-2">
                                            <Icon icon={buildingIcon} className="w-4 h-4" />
                                            Buildings
                                        </div>
                                    </th>
                                    <th className="text-center">Sheets</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enhancedTrades.map(trade => (
                                    <tr
                                        key={trade.id}
                                        className={`cursor-pointer hover:bg-base-200 transition-colors ${
                                            formData.tradeId === trade.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                                        }`}
                                        onClick={() => handleTradeSelection(trade.id)}
                                    >
                                        <td>
                                            <input
                                                type="radio"
                                                name="trade"
                                                className="radio radio-primary radio-sm"
                                                checked={formData.tradeId === trade.id}
                                                onChange={() => handleTradeSelection(trade.id)}
                                            />
                                        </td>
                                        <td>
                                            <div>
                                                <div className="font-medium text-base-content">{trade.name}</div>
                                                {trade.code && (
                                                    <div className="text-xs text-base-content/50">Code: {trade.code}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="max-w-xs">
                                                <div className="text-sm text-base-content/80 line-clamp-2">
                                                    {trade.buildingNames || 'No buildings'}
                                                </div>
                                                <div className="text-xs text-base-content/60 mt-1">
                                                    {trade.buildings.length} building{trade.buildings.length !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <div className="badge badge-neutral badge-sm">
                                                {trade.totalSheets}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            {formData.tradeId === trade.id ? (
                                                <div className="flex items-center justify-center">
                                                    <Icon icon={checkIcon} className="w-5 h-5 text-primary" />
                                                    <span className="text-primary text-sm font-medium ml-1">Selected</span>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleTradeSelection(trade.id);
                                                    }}
                                                >
                                                    Select
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            ) : (
                <div className="text-center py-12">
                    <Icon icon={layersIcon} className="w-16 h-16 text-base-content/40 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-base-content mb-2">No Trades Found</h3>
                    <p className="text-base-content/60 mb-2">This project doesn't have any configured trades</p>
                    <p className="text-sm text-base-content/50">
                        Please ensure the project has buildings with BOQ sheets that have cost codes assigned
                    </p>
                </div>
            )}
        </div>
    );
};