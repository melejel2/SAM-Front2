import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { BuildingSheet } from "@/hooks/use-buildings";

interface SheetSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSheetSelect: (sheet: BuildingSheet) => void;
    sheets: BuildingSheet[];
    currentSheet: string | null;
    buildingName: string;
    hasExistingBOQData: boolean;
    sheetsLoading: boolean;
}

interface SheetChangeWarningProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    selectedSheet: BuildingSheet | null;
    buildingName: string;
}

// Sheet Change Warning Modal Component
const SheetChangeWarningModal: React.FC<SheetChangeWarningProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    selectedSheet,
    buildingName
}) => {
    if (!isOpen || !selectedSheet) return null;

    return (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in duration-200">
                {/* Warning Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                        <Icon icon="lucide:alert-triangle" className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-base-content">Clear BOQ Data?</h3>
                        <p className="text-sm text-base-content/60">This action cannot be undone</p>
                    </div>
                </div>

                {/* Warning Content */}
                <div className="space-y-4 mb-6">
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                        <p className="text-base-content font-medium mb-2">
                            Changing to sheet "{selectedSheet.name}" will:
                        </p>
                        <ul className="text-sm text-base-content/80 space-y-1 ml-4">
                            <li className="flex items-start gap-2">
                                <Icon icon="lucide:x" className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
                                Clear all existing BOQ items in {buildingName}
                            </li>
                            <li className="flex items-start gap-2">
                                <Icon icon="lucide:refresh-cw" className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                                Reset the contract to use the new sheet (trade)
                            </li>
                        </ul>
                    </div>

                    <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                        <p className="text-sm text-base-content/80">
                            <Icon icon="lucide:info" className="w-4 h-4 text-info inline mr-2" />
                            <strong>Important:</strong> Each contract dataset can only have ONE sheet (trade). 
                            BOQ items are specific to the selected sheet.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="btn btn-ghost btn-sm hover:bg-base-200"
                    >
                        <Icon icon="lucide:x" className="w-4 h-4" />
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn btn-warning btn-sm hover:btn-warning/80 text-warning-content"
                    >
                        <Icon icon="lucide:check" className="w-4 h-4" />
                        Clear BOQ & Change Sheet
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Sheet Selection Modal Component
const SheetSelectionModal: React.FC<SheetSelectionModalProps> = ({
    isOpen,
    onClose,
    onSheetSelect,
    sheets,
    currentSheet,
    buildingName,
    hasExistingBOQData,
    sheetsLoading
}) => {
    const [selectedSheet, setSelectedSheet] = useState<BuildingSheet | null>(null);
    const [showWarning, setShowWarning] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter sheets based on search term
    const filteredSheets = sheets.filter(sheet => 
        sheet.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSheetClick = (sheet: BuildingSheet) => {
        // If selecting different sheet and BOQ data exists, show warning
        if (sheet.name !== currentSheet && hasExistingBOQData) {
            setSelectedSheet(sheet);
            setShowWarning(true);
        } else {
            // No BOQ data or same sheet, proceed directly
            onSheetSelect(sheet);
            onClose();
        }
    };

    const handleWarningConfirm = () => {
        if (selectedSheet) {
            onSheetSelect(selectedSheet);
            setShowWarning(false);
            setSelectedSheet(null);
            onClose();
        }
    };

    const handleWarningCancel = () => {
        setShowWarning(false);
        setSelectedSheet(null);
    };

    const handleClose = () => {
        setSearchTerm("");
        setSelectedSheet(null);
        setShowWarning(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Main Sheet Selection Modal */}
            <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-base-300">
                        <div>
                            <h3 className="text-xl font-semibold text-base-content">Select Sheet (Trade)</h3>
                            <p className="text-sm text-base-content/60 mt-1">
                                Building: <span className="font-medium">{buildingName}</span>
                                {currentSheet && (
                                    <span className="ml-2">
                                        • Current: <span className="font-medium text-primary">{currentSheet}</span>
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="btn btn-sm btn-circle btn-ghost hover:bg-base-200"
                        >
                            <Icon icon="lucide:x" className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-6 border-b border-base-300">
                        <div className="relative">
                            <Icon icon="lucide:search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" />
                            <input
                                type="text"
                                placeholder="Search sheets/trades..."
                                className="input input-bordered w-full pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {sheetsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="flex items-center gap-3 text-base-content/60">
                                    <div className="loading loading-spinner loading-sm"></div>
                                    <span>Loading sheets...</span>
                                </div>
                            </div>
                        ) : filteredSheets.length === 0 ? (
                            <div className="text-center py-12">
                                <Icon icon="lucide:search-x" className="w-12 h-12 text-base-content/40 mx-auto mb-4" />
                                <p className="text-base-content/60">
                                    {sheets.length === 0 ? "No sheets available" : "No sheets found matching your search"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filteredSheets.map((sheet) => {
                                    const isCurrentSheet = sheet.name === currentSheet;
                                    const isActiveSheet = sheet.isActive !== false; // Default to active if undefined
                                    
                                    return (
                                        <button
                                            key={sheet.id}
                                            onClick={() => handleSheetClick(sheet)}
                                            disabled={!isActiveSheet}
                                            className={`
                                                relative p-4 rounded-xl border-2 text-left transition-all duration-200 
                                                hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20
                                                ${
                                                    isCurrentSheet 
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                                        : isActiveSheet
                                                            ? 'border-base-300 hover:border-primary/50 hover:bg-base-50'
                                                            : 'border-base-200 bg-base-100 opacity-50 cursor-not-allowed'
                                                }
                                            `}
                                        >
                                            {/* Sheet Info */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className={`font-medium text-sm ${isCurrentSheet ? 'text-primary' : 'text-base-content'}`}>
                                                        {sheet.name}
                                                    </h4>
                                                    {sheet.nameFr && (
                                                        <p className="text-xs text-base-content/60 mt-1">
                                                            {sheet.nameFr}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {/* Status Indicators */}
                                                <div className="flex items-center gap-2 ml-2">
                                                    {isCurrentSheet && (
                                                        <div className="w-2 h-2 rounded-full bg-primary" title="Current sheet" />
                                                    )}
                                                    {!isActiveSheet && (
                                                        <Icon icon="lucide:lock" className="w-4 h-4 text-base-content/40" title="Inactive" />
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Cost Code Info */}
                                            {sheet.costCode && (
                                                <div className="mt-2 pt-2 border-t border-base-200">
                                                    <p className="text-xs text-base-content/60">
                                                        Cost Code: <span className="font-mono">{sheet.costCode}</span>
                                                    </p>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-base-300">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-base-content/60">
                                <Icon icon="lucide:info" className="w-4 h-4 inline mr-2" />
                                Each contract can only have one sheet (trade)
                            </div>
                            <button
                                onClick={handleClose}
                                className="btn btn-ghost btn-sm hover:bg-base-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sheet Change Warning Modal */}
            <SheetChangeWarningModal
                isOpen={showWarning}
                onConfirm={handleWarningConfirm}
                onCancel={handleWarningCancel}
                selectedSheet={selectedSheet}
                buildingName={buildingName}
            />
        </>
    );
};

export default SheetSelectionModal;