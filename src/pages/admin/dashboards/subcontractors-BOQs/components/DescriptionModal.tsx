import React from 'react';

interface DescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    itemNo?: string;
}

const DescriptionModal: React.FC<DescriptionModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    itemNo
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">Item Description</h3>
                    <button 
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={onClose}
                    >
                        <span className="iconify lucide--x size-4"></span>
                    </button>
                </div>
                
                {itemNo && (
                    <div className="mb-3">
                        <span className="text-sm font-medium text-base-content/70">Item No:</span>
                        <span className="ml-2 font-semibold">{itemNo}</span>
                    </div>
                )}
                
                <div className="bg-base-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="whitespace-pre-wrap break-words text-base-content">
                        {description || 'No description available'}
                    </div>
                </div>
                
                <div className="modal-action">
                    <button 
                        className="btn btn-primary"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DescriptionModal;