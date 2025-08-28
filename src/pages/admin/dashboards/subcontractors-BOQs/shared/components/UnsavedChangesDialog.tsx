import React from "react";

interface UnsavedChangesDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
    isOpen,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Modal backdrop - UPDATED TO FIX BLACK SCREEN */}
            <div className="fixed inset-0 bg-base-content/10 backdrop-blur-md z-50"></div>
            
            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full">
                    <div className="p-6">
                        <h3 className="text-lg font-bold mb-4">Unsaved Changes</h3>
                        <p className="text-base-content/70 mb-6">
                            You have unsaved changes. Are you sure you want to leave without saving?
                        </p>
                        
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                className="btn bg-base-200 text-base-content hover:bg-base-300 transition-all duration-200 ease-in-out"
                                onClick={onCancel}
                            >
                                Stay
                            </button>
                            <button
                                type="button"
                                className="btn btn-error"
                                onClick={onConfirm}
                            >
                                Leave Without Saving
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};