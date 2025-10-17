import React from "react";
import { Icon } from "@iconify/react";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import xIcon from "@iconify/icons-lucide/x";

interface ProjectChangeWarningDialogProps {
    isOpen: boolean;
    currentProjectName: string;
    newProjectName: string;
    onConfirm: () => void;
    onCancel: () => void;
    hasExistingData: boolean;
}

export const ProjectChangeWarningDialog: React.FC<ProjectChangeWarningDialogProps> = ({
    isOpen,
    currentProjectName,
    newProjectName,
    onConfirm,
    onCancel,
    hasExistingData
}) => {
    if (!isOpen) return null;

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
                            Project Change Warning
                        </h3>
                        <p className="text-base-content/80">
                            You are about to change this contract's project from{' '}
                            <span className="font-semibold text-base-content">"{currentProjectName}"</span>{' '}
                            to{' '}
                            <span className="font-semibold text-base-content">"{newProjectName}"</span>
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
                        This action will cause data loss!
                    </h4>
                    
                    {hasExistingData ? (
                        <div className="space-y-3">
                            <p className="text-base-content/80">
                                Changing the project will automatically <strong>delete all existing contract data</strong> because buildings, BOQ sheets, and cost structures are project-specific.
                            </p>
                            
                            <div className="bg-base-200 p-3 rounded-md">
                                <h5 className="font-medium text-base-content mb-2">The following data will be permanently removed:</h5>
                                <ul className="text-sm text-base-content/80 space-y-1 ml-4">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-error rounded-full"></div>
                                        All selected buildings and their associations
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-error rounded-full"></div>
                                        BOQ sheets, trades, and line items
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-error rounded-full"></div>
                                        Financial calculations and totals
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-error rounded-full"></div>
                                        Generated contract documents
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-error rounded-full"></div>
                                        Contract status (reset to Editable)
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-info/10 border border-info/20 p-3 rounded-md">
                                <p className="text-sm text-base-content/80">
                                    <strong>After changing the project:</strong> You will need to select buildings, BOQ sheets, and rebuild all contract data from scratch using the new project's structure.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-base-content/80">
                            This contract doesn't have extensive data yet, but you'll still need to reselect buildings and BOQ sheets from the new project.
                        </p>
                    )}
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
                        Continue & Clear Data
                    </button>
                </div>
            </div>
            
            {/* Backdrop */}
            <form method="dialog" className="modal-backdrop bg-black/20 backdrop-blur-sm">
                <button onClick={onCancel} type="button">close</button>
            </form>
        </dialog>
    );
};

export default ProjectChangeWarningDialog;