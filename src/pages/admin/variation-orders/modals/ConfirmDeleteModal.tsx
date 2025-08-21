interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    voData: any;
}

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, voData }: ConfirmDeleteModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
                        <span className="iconify lucide--trash-2 text-red-600 dark:text-red-400 size-5"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-error">Delete Variation Order</h3>
                        <p className="text-sm text-base-content/70">This action cannot be undone</p>
                    </div>
                </div>
                
                <div className="py-4">
                    <p className="mb-2">
                        Are you sure you want to delete variation order:
                    </p>
                    <div className="bg-base-200 p-3 rounded-lg">
                        <p className="font-semibold">{voData?.voNumber}</p>
                        <p className="text-sm text-base-content/70">{voData?.contractNumber}</p>
                        {voData?.projectName && (
                            <p className="text-sm text-base-content/70">Project: {voData.projectName}</p>
                        )}
                    </div>
                    <div className="alert alert-warning mt-4">
                        <span className="iconify lucide--alert-triangle size-5"></span>
                        <span>This will permanently delete the variation order and all associated data.</span>
                    </div>
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn-error text-white" onClick={onConfirm}>
                        <span className="iconify lucide--trash-2 size-4"></span>
                        Delete VO
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
