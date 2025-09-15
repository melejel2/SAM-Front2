import React from "react";
import { Icon } from "@iconify/react";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import xIcon from "@iconify/icons-lucide/x";

interface BuildingChangeWarningDialogProps {
    isOpen: boolean;
    changeType: 'remove' | 'add' | 'modify';
    buildingName: string;
    onConfirm: () => void;
    onCancel: () => void;
    hasExistingTradeData: boolean;
    hasExistingBOQData: boolean;
}

export const BuildingChangeWarningDialog: React.FC<BuildingChangeWarningDialogProps> = ({
    isOpen,
    changeType,
    buildingName,
    onConfirm,
    onCancel,
    hasExistingTradeData,
    hasExistingBOQData
}) => {
    if (!isOpen) return null;

    const getTitle = () => {
        switch (changeType) {
            case 'remove':
                return 'Remove Building Warning';
            case 'add':
                return 'Add Building Warning';
            case 'modify':
                return 'Modify Buildings Warning';
            default:
                return 'Building Change Warning';
        }
    };

    const getDescription = () => {
        switch (changeType) {
            case 'remove':
                return `You are about to remove "${buildingName}" from this contract.`;
            case 'add':
                return `You are about to add "${buildingName}" to this contract.`;
            case 'modify':
                return `You are about to modify the building selection for this contract.`;
            default:
                return `You are about to change the building selection for this contract.`;
        }
    };

    const getImpactMessage = () => {
        if (!hasExistingTradeData && !hasExistingBOQData) {
            return "This change will require you to select a trade/sheet that is available in all selected buildings.";
        }

        switch (changeType) {
            case 'remove':
                return "Removing this building may invalidate the current trade selection and BOQ data if the trade is not available in the remaining buildings.";
            case 'add':
                return "Adding this building may invalidate the current trade selection if the selected trade is not available in the new building.";
            case 'modify':
                return "Modifying buildings may invalidate the current trade selection and BOQ data if the trade is not available in all selected buildings.";
            default:
                return "This building change may affect the current trade selection and BOQ data.";
        }
    };

    const shouldShowDataLoss = hasExistingTradeData || hasExistingBOQData;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box max-w-2xl bg-base-100">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-warning/10 rounded-full">
                        <Icon 
                            icon={alertTriangleIcon} 
                            className="w-8 h-8 text-warning" 
                        />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-base-content mb-2">
                            {getTitle()}
                        </h3>
                        <p className="text-base-content/80">
                            {getDescription()}
                        </p>
                    </div>
                    <button 
                        onClick={onCancel}
                        className="btn btn-ghost btn-sm"
                    >
                        <Icon icon={xIcon} className="w-4 h-4" />
                    </button>
                </div>

                {/* Warning Content */}
                <div className="bg-warning/5 border-l-4 border-warning p-4 mb-6">
                    <h4 className="font-semibold text-base-content mb-3 flex items-center gap-2">
                        <Icon icon={alertTriangleIcon} className="w-5 h-5 text-warning" />
                        Trade & BOQ Impact
                    </h4>
                    
                    <p className="text-base-content/80 mb-3">
                        {getImpactMessage()}
                    </p>

                    {shouldShowDataLoss && (
                        <div className="bg-base-200 p-3 rounded-md mb-3">
                            <h5 className="font-medium text-base-content mb-2">Data that may be affected:</h5>
                            <ul className="text-sm text-base-content/80 space-y-1 ml-4">
                                {hasExistingTradeData && (
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                                        Current trade/sheet selection
                                    </li>
                                )}
                                {hasExistingBOQData && (
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                                        BOQ items and quantities
                                    </li>
                                )}
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-warning rounded-full"></div>
                                    Financial calculations
                                </li>
                            </ul>
                        </div>
                    )}

                    <div className="bg-info/10 border border-info/20 p-3 rounded-md">
                        <p className="text-sm text-base-content/80">
                            <strong>Recommendation:</strong> After changing buildings, verify that your selected trade/sheet is available in all selected buildings. You may need to reselect the trade and rebuild BOQ data.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3">
                    <button 
                        onClick={onCancel}
                        className="btn bg-base-200 text-base-content hover:bg-base-300"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="btn btn-warning text-warning-content"
                    >
                        Continue with Change
                    </button>
                </div>
            </div>
            
            {/* Backdrop */}
            <form method="dialog" className="modal-backdrop bg-black bg-opacity-20 backdrop-blur-sm">
                <button onClick={onCancel} type="button">close</button>
            </form>
        </dialog>
    );
};

export default BuildingChangeWarningDialog;