import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import apiRequest from "@/api/api";

import useSubcontractorsBOQs from "./use-subcontractors-boqs";




const SubcontractorsBOQs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toaster } = useToast();
    const { getToken } = useAuth();

    const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
    const [contractToDeleteId, setContractToDeleteId] = useState<number | null>(null);
    

    const { 
        columns, 
        tableData, 
        inputFields, 
        loading, 
        getContractsDatasets,
        DeleteContract
    } = useSubcontractorsBOQs();

    useEffect(() => {
        getContractsDatasets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const handleViewContractDetails = (row: any) => {
        // Navigate to contract details page with contract data
        navigate(`/dashboard/subcontractors-boqs/details/${row.id}`, {
            state: {
                contractNumber: row.contractNumber,
                projectName: row.projectName,
                subcontractorName: row.subcontractorName,
                tradeName: row.tradeName,
                amount: row.amount,
                contractDate: row.contractDate,
                completionDate: row.completionDate,
                status: row.status
            }
        });
    };

const handleDeleteContract = (id: number) => {
    setContractToDeleteId(id);
    setShowDeleteConfirmDialog(true);
};

const handleDeleteConfirm = async () => {
    if (contractToDeleteId !== null) {
        const result = await DeleteContract(contractToDeleteId);
        if (result.success) {
            toaster.success("Contract deleted successfully!");
            getContractsDatasets(); // Refresh the table after deletion
        } else {
            toaster.error("Failed to delete contract");
        }
    }
    setShowDeleteConfirmDialog(false);
    setContractToDeleteId(null);
};

const handleDeleteCancel = () => {
    setShowDeleteConfirmDialog(false);
    setContractToDeleteId(null);
};

// VO Navigation Handler
const handleCreateVOFromButton = () => {
    // Navigate to VO wizard instead of showing modal
    navigate('/admin/variation-orders/create');
};

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };


    return (
        <div>
            {/* Header with Back Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToDashboard}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        className="btn btn-sm btn-warning text-white flex items-center gap-2"
                        onClick={handleCreateVOFromButton}
                        disabled={loading || tableData.length === 0}
                    >
                        <span className="iconify lucide--file-plus size-4"></span>
                        <span>Create VO</span>
                    </button>
                    <button
                        className="btn btn-sm btn-primary text-white flex items-center gap-2"
                        onClick={() => navigate('/dashboard/subcontractors-boqs/new')}
                    >
                        <span className="iconify lucide--plus size-4"></span>
                        <span>New Subcontract</span>
                    </button>
                </div>
            </div>

            <div>
                {loading ? (
                    <Loader />
                ) : (
                    <SAMTable
                        columns={columns}
                        tableData={tableData}
                        actions
                        previewAction
                        editAction
                        deleteAction
                        title={"Subcontractor BOQ"}
                        loading={false}
                        onSuccess={getContractsDatasets}
                        openStaticDialog={(type, data) => {
                            if (type === "Preview" && data) {
                                return handleViewContractDetails(data);
                            } else if (type === "Edit" && data) {
                                navigate(`/dashboard/subcontractors-boqs/edit/${data.id}`);
                            } 
                            else if (type === "Delete" && data) {
                                handleDeleteContract(data.id); 
                            }
                        }}
                        dynamicDialog={false}
                    />
                )}
            </div>

            {/* Delete Confirmation Dialog */}
{showDeleteConfirmDialog && (
    <div className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[modal-fade_0.2s]">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
                    {}
                    <span className="iconify lucide--trash-2 w-6 h-6 text-error" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-base-content">Confirm Deletion</h3>
                    <p className="text-sm text-base-content/60">This action cannot be undone.</p>
                </div>
            </div>

            <div className="mb-6">
                <p className="text-base-content/80 mb-3">
                    Are you sure you want to permanently delete this contract?
                </p>
                <div className="bg-error/30 border border-error/20 rounded-lg p-3">
                    <p className="text-sm text-error-content">
                        <span className="iconify lucide--info w-4 h-4 inline mr-1" />
                        All associated data and files will also be deleted.
                    </p>
                </div>
            </div>

            <div className="flex gap-3 justify-end">
                <button
                    onClick={handleDeleteCancel}
                    className="btn btn-ghost btn-sm px-6"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDeleteConfirm}
                    className="btn btn-error btn-sm px-6"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
)}


        </div>
    );
};

export default SubcontractorsBOQs;
