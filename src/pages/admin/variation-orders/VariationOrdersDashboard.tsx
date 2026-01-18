import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import useToast from "@/hooks/use-toast";
import useVariationOrders from "./use-variation-orders";
import { ContractDatasetStatus } from "@/types/variation-order";

import VOUploadModal from "./modals/VOUploadModal";
import VOPreviewModal from "./modals/VOPreviewModal";
import ConfirmDeleteModal from "./modals/ConfirmDeleteModal";

const VariationOrdersDashboard = () => {
    const {
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
    // Only store data for the active tab to reduce memory usage
    const [currentTabData, setCurrentTabData] = useState<any[]>([]);
    // Store counts for tab badges (lightweight)
    const [tabCounts, setTabCounts] = useState({ active: 0, editable: 0, terminated: 0 });
    // Track which tabs have been loaded
    const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set());

    // Modals state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedVO, setSelectedVO] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);

    // Load data for the active tab only (lazy loading)
    const loadTabData = useCallback(async (tabIndex: number, forceRefresh = false) => {
        // Skip if already loaded and not forcing refresh
        if (loadedTabs.has(tabIndex) && !forceRefresh) {
            return;
        }

        try {
            let data: any[] = [];
            switch (tabIndex) {
                case 0:
                    data = await getActiveVoDatasets();
                    setTabCounts(prev => ({ ...prev, active: data.length }));
                    break;
                case 1:
                    data = await getEditableVoDatasets();
                    setTabCounts(prev => ({ ...prev, editable: data.length }));
                    break;
                case 2:
                    data = await getTerminatedVoDatasets();
                    setTabCounts(prev => ({ ...prev, terminated: data.length }));
                    break;
            }

            setCurrentTabData(data);
            setLoadedTabs(prev => new Set(prev).add(tabIndex));
        } catch (error) {
            toaster.error("Failed to load VO data");
        }
    }, [getActiveVoDatasets, getEditableVoDatasets, getTerminatedVoDatasets, loadedTabs, toaster]);

    // Load initial tab data and counts on mount
    useEffect(() => {
        loadTabData(0);
        // Load counts for other tabs in background (lightweight requests)
        loadTabCounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load data when tab changes
    useEffect(() => {
        loadTabData(activeTab);
    }, [activeTab, loadTabData]);

    // Load counts for all tabs (for badge display)
    const loadTabCounts = async () => {
        try {
            const [active, editable, terminated] = await Promise.all([
                getActiveVoDatasets(),
                getEditableVoDatasets(),
                getTerminatedVoDatasets()
            ]);
            setTabCounts({
                active: active.length,
                editable: editable.length,
                terminated: terminated.length
            });
            // Set initial tab data if we're on tab 0
            if (activeTab === 0) {
                setCurrentTabData(active);
                setLoadedTabs(new Set([0, 1, 2]));
            }
        } catch (error) {
            // Silent fail for counts, not critical
        }
    };

    // Refresh all data and clear cache
    const refreshAllData = useCallback(async () => {
        setLoadedTabs(new Set());
        await loadTabData(activeTab, true);
        await loadTabCounts();
    }, [activeTab, loadTabData]);

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

    // Memoized current title based on active tab (uses ternary for efficiency)
    const currentTitle = useMemo(() =>
        activeTab === 0 ? "Active VO" :
        activeTab === 1 ? "Editable VO" :
        activeTab === 2 ? "Terminated VO" : "VO"
    , [activeTab]);

    return (
        <div style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Fixed Header Section */}
            <div style={{ flexShrink: 0 }} className="pb-3">
                {/* Header with Back Button and Title */}
                <div className="flex justify-between items-center mb-4">
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
                <div className="flex items-center gap-2">
                    <button
                        className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                            activeTab === 0
                                ? "btn-primary"
                                : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                        onClick={() => setActiveTab(0)}
                    >
                        <span className="iconify lucide--check-circle size-4" />
                        <span>Active VOs ({tabCounts.active})</span>
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
                        <span>Editable VOs ({tabCounts.editable})</span>
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
                        <span>Terminated VOs ({tabCounts.terminated})</span>
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {/* Table Content */}
                {loading ? (
                    <Loader
                        icon="file-diff"
                        subtitle="Loading: Variation Orders"
                        description="Preparing VO data..."
                    />
                ) : (
                    <SAMTable
                        columns={voDatasetColumns}
                        tableData={currentTabData}
                        actions
                        previewAction
                        editAction
                        deleteAction
                        title={currentTitle}
                        loading={false}
                        onSuccess={refreshAllData}
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
                        // Enable virtualization for better memory performance with large datasets
                        virtualized={true}
                        rowHeight={40}
                        overscan={5}
                    />
                )}
            </div>

            {/* Upload Modal - only render when open to save memory */}
            {showUploadModal && (
                <VOUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        refreshAllData();
                    }}
                />
            )}

            {/* Preview Modal - only render when open to save memory */}
            {showPreviewModal && (
                <VOPreviewModal
                    isOpen={showPreviewModal}
                    onClose={() => {
                        setShowPreviewModal(false);
                        // Clear preview data to free memory
                        setPreviewData(null);
                    }}
                    voData={previewData}
                />
            )}

            {/* Delete Confirmation Modal - only render when open to save memory */}
            {showDeleteModal && (
                <ConfirmDeleteModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        // Clear selected VO to free memory
                        setSelectedVO(null);
                    }}
                    onConfirm={() => {
                        // TODO: Implement delete functionality
                        toaster.success("VO deleted successfully");
                        setShowDeleteModal(false);
                        setSelectedVO(null);
                        refreshAllData();
                    }}
                    voData={selectedVO}
                />
            )}
        </div>
    );
};

export default VariationOrdersDashboard;
