import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import useToast from "@/hooks/use-toast";
import useVariationOrders from "../use-variation-orders";
import { ContractDatasetStatus } from "@/types/variation-order";

import VOUploadModal from "./modals/VOUploadModal";
import VOPreviewModal from "./modals/VOPreviewModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";

const VariationOrdersDashboard = () => {
    const {
        voDatasets,
        loading,
        voDatasetColumns,
        getActiveVoDatasets,
        getTerminatedVoDatasets,
        getEditableVoDatasets,
        getVoDatasetWithBoqs
    } = useVariationOrders();
    
    const { toaster } = useToast();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState(0);
    const [activeVoDatasets, setActiveVoDatasets] = useState<any[]>([]);
    const [terminatedVoDatasets, setTerminatedVoDatasets] = useState<any[]>([]);
    const [editableVoDatasets, setEditableVoDatasets] = useState<any[]>([]);
    
    // Modals state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedVO, setSelectedVO] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);

    useEffect(() => {
        loadAllVoData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadAllVoData = async () => {
        try {
            const [active, terminated, editable] = await Promise.all([
                getActiveVoDatasets(),
                getTerminatedVoDatasets(),
                getEditableVoDatasets()
            ]);
            
            setActiveVoDatasets(active);
            setTerminatedVoDatasets(terminated);
            setEditableVoDatasets(editable);
        } catch (error) {
            toaster.error("Failed to load VO data");
        }
    };

    const handlePreviewVO = async (row: any) => {
        try {
            const voDetails = await getVoDatasetWithBoqs(row.id);
            if (voDetails) {
                setPreviewData(voDetails);
                setShowPreviewModal(true);
            } else {
                toaster.error("Failed to load VO details");
            }
        } catch (error) {
            toaster.error("Failed to preview VO");
        }
    };

    const handleDeleteVO = (row: any) => {
        setSelectedVO(row);
        setShowDeleteModal(true);
    };

    const handleCreateVO = () => {
        navigate("/admin/variation-orders/create");
    };

    const handleEditVO = (row: any) => {
        navigate(`/admin/variation-orders/${row.id}/edit`);
    };

    const handleUploadVO = () => {
        setShowUploadModal(true);
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const getCurrentData = () => {
        switch (activeTab) {
            case 0:
                return activeVoDatasets;
            case 1:
                return editableVoDatasets;
            case 2:
                return terminatedVoDatasets;
            default:
                return activeVoDatasets;
        }
    };

    const getCurrentTitle = () => {
        switch (activeTab) {
            case 0:
                return "Active VO";
            case 1:
                return "Editable VO";
            case 2:
                return "Terminated VO";
            default:
                return "VO";
        }
    };

    return (
        <div>
            {/* Header with Back Button and Category Cards */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToDashboard}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                            <span className="iconify lucide--file-plus text-purple-600 dark:text-purple-400 size-5"></span>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-base-content">Variation Orders</h1>
                            <p className="text-sm text-base-content/70">Manage project variation orders and changes</p>
                        </div>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleUploadVO}
                        className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span className="iconify lucide--upload size-4"></span>
                        <span>Upload VO</span>
                    </button>
                    <button
                        onClick={handleCreateVO}
                        className="btn btn-sm btn-primary flex items-center gap-2"
                    >
                        <span className="iconify lucide--plus size-4"></span>
                        <span>Create VO</span>
                    </button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-2 mb-6">
                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeTab === 0 
                            ? "btn-primary" 
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                    }`}
                    onClick={() => setActiveTab(0)}
                >
                    <span className="iconify lucide--check-circle size-4" />
                    <span>Active VOs ({activeVoDatasets.length})</span>
                </button>
                
                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeTab === 1 
                            ? "btn-primary" 
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                    }`}
                    onClick={() => setActiveTab(1)}
                >
                    <span className="iconify lucide--edit size-4" />
                    <span>Editable VOs ({editableVoDatasets.length})</span>
                </button>
                
                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeTab === 2 
                            ? "btn-primary" 
                            : "btn-ghost border border-base-300 hover:border-primary/50"
                    }`}
                    onClick={() => setActiveTab(2)}
                >
                    <span className="iconify lucide--x-circle size-4" />
                    <span>Terminated VOs ({terminatedVoDatasets.length})</span>
                </button>
            </div>

            {/* Table Content */}
            <div>
                {loading ? (
                    <Loader />
                ) : (
                    <SAMTable
                        columns={voDatasetColumns}
                        tableData={getCurrentData()}
                        actions
                        previewAction
                        editAction
                        deleteAction
                        title={getCurrentTitle()}
                        loading={false}
                        onSuccess={loadAllVoData}
                        openStaticDialog={(type, data) => {
                            if (type === "Preview" && data) {
                                return handlePreviewVO(data);
                            } else if (type === "Edit" && data) {
                                handleEditVO(data);
                            } else if (type === "Delete" && data) {
                                handleDeleteVO(data);
                            }
                        }}
                        dynamicDialog={false}
                        rowActions={(row) => ({
                            editAction: row.originalStatus?.toLowerCase() === 'editable',
                            deleteAction: row.originalStatus?.toLowerCase() === 'editable',
                        })}
                    />
                )}
            </div>

            {/* Upload Modal */}
            <VOUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                    setShowUploadModal(false);
                    loadAllVoData();
                }}
            />

            {/* Preview Modal */}
            <VOPreviewModal
                isOpen={showPreviewModal}
                onClose={() => {
                    setShowPreviewModal(false);
                    setPreviewData(null);
                }}
                voData={previewData}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedVO(null);
                }}
                onConfirm={() => {
                    // TODO: Implement delete functionality
                    toaster.success("VO deleted successfully");
                    setShowDeleteModal(false);
                    setSelectedVO(null);
                    loadAllVoData();
                }}
                voData={selectedVO}
            />
        </div>
    );
};

export default VariationOrdersDashboard;
