import { memo, useCallback, useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import plusIcon from "@iconify/icons-lucide/plus";
import pencilIcon from "@iconify/icons-lucide/pencil";
import trashIcon from "@iconify/icons-lucide/trash-2";

import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { Loader } from "@/components/Loader";
import { usePermissions } from "@/hooks/use-permissions";
import { useTopbarContent } from "@/contexts/topbar-content";
import { useNavigationBlocker } from "@/contexts/navigation-blocker";

import useTrades, { Trade } from "./use-trades";

const Trades = memo(() => {
    const {
        tableData,
        costCodes,
        loading,
        saving,
        getTrades,
        getCostCodes,
        createTrade,
        updateTrade,
        deleteTrade,
    } = useTrades();

    const { canManageTrades } = usePermissions();
    const { setLeftContent, clearContent } = useTopbarContent();
    const { tryNavigate } = useNavigationBlocker();

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        nameFr: "",
        costCode: "",
    });

    useEffect(() => {
        getTrades();
        getCostCodes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBackToAdminTools = useCallback(() => {
        tryNavigate('/admin-tools');
    }, [tryNavigate]);

    const leftTopbarContent = useMemo(() => (
        <button
            onClick={handleBackToAdminTools}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-base-200 hover:bg-base-300 transition-colors"
            title="Back to Admin Tools"
        >
            <Icon icon={arrowLeftIcon} className="w-5 h-5" />
        </button>
    ), [handleBackToAdminTools]);

    useEffect(() => {
        setLeftContent(leftTopbarContent);
    }, [leftTopbarContent, setLeftContent]);

    useEffect(() => {
        return () => {
            clearContent();
        };
    }, [clearContent]);

    // Handlers
    const handleAdd = useCallback(() => {
        setFormData({ name: "", nameFr: "", costCode: "" });
        setShowAddModal(true);
    }, []);

    const handleEdit = useCallback((trade: Trade) => {
        setSelectedTrade(trade);
        setFormData({
            name: trade.name || "",
            nameFr: trade.nameFr || "",
            costCode: trade.costCode || "",
        });
        setShowEditModal(true);
    }, []);

    const handleDelete = useCallback((trade: Trade) => {
        setSelectedTrade(trade);
        setShowDeleteModal(true);
    }, []);

    const handleAddSubmit = useCallback(async () => {
        const result = await createTrade(formData);
        if (result.success) {
            setShowAddModal(false);
            setFormData({ name: "", nameFr: "", costCode: "" });
        }
    }, [createTrade, formData]);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedTrade) return;
        const result = await updateTrade({ ...selectedTrade, ...formData });
        if (result.success) {
            setShowEditModal(false);
            setSelectedTrade(null);
            setFormData({ name: "", nameFr: "", costCode: "" });
        }
    }, [updateTrade, selectedTrade, formData]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedTrade) return;
        const result = await deleteTrade(selectedTrade.id);
        if (result.success) {
            setShowDeleteModal(false);
            setSelectedTrade(null);
        }
    }, [deleteTrade, selectedTrade]);

    // Spreadsheet columns
    const columns = useMemo((): SpreadsheetColumn<Trade>[] => [
        {
            key: "name",
            label: "EN",
            width: 250,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "nameFr",
            label: "FR",
            width: 250,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "costCode",
            label: "Code",
            width: 150,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
    ], []);

    // Row actions
    const renderActions = useCallback((row: Trade) => {
        if (!canManageTrades) return null;

        return (
            <div className="flex items-center gap-1">
                <button
                    className="btn btn-ghost btn-xs text-info hover:bg-info/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(row);
                    }}
                    title="Edit"
                >
                    <Icon icon={pencilIcon} className="w-4 h-4" />
                </button>
                <button
                    className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(row);
                    }}
                    title="Delete"
                >
                    <Icon icon={trashIcon} className="w-4 h-4" />
                </button>
            </div>
        );
    }, [canManageTrades, handleEdit, handleDelete]);

    // Toolbar
    const toolbar = useMemo(() => {
        if (!canManageTrades) return null;

        return (
            <div className="flex items-center justify-end w-full px-4 py-2">
                <button
                    onClick={handleAdd}
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                    <Icon icon={plusIcon} className="size-4" />
                    <span>New Trade</span>
                </button>
            </div>
        );
    }, [canManageTrades, handleAdd]);

    if (loading) {
        return (
            <Loader
                icon="list"
                subtitle="Loading: Trades"
                description="Preparing trade data..."
            />
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0">
                <Spreadsheet<Trade>
                    data={tableData}
                    columns={columns}
                    mode="view"
                    loading={loading}
                    emptyMessage="No trades found"
                    persistKey="admin-trades-spreadsheet"
                    rowHeight={40}
                    actionsRender={canManageTrades ? renderActions : undefined}
                    actionsColumnWidth={100}
                    onRowDoubleClick={canManageTrades ? handleEdit : undefined}
                    getRowId={(row) => row.id}
                    toolbar={toolbar}
                    allowKeyboardNavigation
                    allowColumnResize
                    allowSorting
                    allowFilters
                />
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add New Trade</h3>
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name (EN) *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter trade name in English"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name (FR) *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.nameFr}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nameFr: e.target.value }))}
                                    placeholder="Enter trade name in French"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Cost Code *</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.costCode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, costCode: e.target.value }))}
                                >
                                    <option value="">Select a cost code</option>
                                    {costCodes.map((cc) => (
                                        <option key={cc.id} value={cc.code}>
                                            {cc.code} {cc.name ? `- ${cc.name}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowAddModal(false)}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddSubmit}
                                disabled={saving || !formData.name || !formData.nameFr || !formData.costCode}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create Trade</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedTrade && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Edit Trade</h3>
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name (EN) *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter trade name in English"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name (FR) *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.nameFr}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nameFr: e.target.value }))}
                                    placeholder="Enter trade name in French"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Cost Code *</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.costCode}
                                    onChange={(e) => setFormData(prev => ({ ...prev, costCode: e.target.value }))}
                                >
                                    <option value="">Select a cost code</option>
                                    {costCodes.map((cc) => (
                                        <option key={cc.id} value={cc.code}>
                                            {cc.code} {cc.name ? `- ${cc.name}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedTrade(null);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleEditSubmit}
                                disabled={saving || !formData.name || !formData.nameFr || !formData.costCode}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save Changes</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedTrade && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-error mb-4">Delete Trade</h3>
                        <p className="mb-4">
                            Are you sure you want to delete the trade <strong>{selectedTrade.name}</strong>?
                        </p>
                        <p className="text-sm text-base-content/70 mb-4">
                            This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedTrade(null);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-error text-white"
                                onClick={handleDeleteConfirm}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Delete Trade</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

Trades.displayName = 'Trades';

export default Trades;
