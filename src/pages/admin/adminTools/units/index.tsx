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

import useUnits, { Unit } from "./use-units";

const Units = memo(() => {
    const {
        tableData,
        loading,
        saving,
        getUnits,
        createUnit,
        updateUnit,
        deleteUnit,
    } = useUnits();

    const { canManageUnits } = usePermissions();
    const { setLeftContent, clearContent } = useTopbarContent();
    const { tryNavigate } = useNavigationBlocker();

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        symbol: "",
    });

    useEffect(() => {
        getUnits();
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
        setFormData({ name: "", symbol: "" });
        setShowAddModal(true);
    }, []);

    const handleEdit = useCallback((unit: Unit) => {
        setSelectedUnit(unit);
        setFormData({
            name: unit.name || "",
            symbol: unit.symbol || "",
        });
        setShowEditModal(true);
    }, []);

    const handleDelete = useCallback((unit: Unit) => {
        setSelectedUnit(unit);
        setShowDeleteModal(true);
    }, []);

    const handleAddSubmit = useCallback(async () => {
        const result = await createUnit(formData);
        if (result.success) {
            setShowAddModal(false);
            setFormData({ name: "", symbol: "" });
        }
    }, [createUnit, formData]);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedUnit) return;
        const result = await updateUnit({ ...selectedUnit, ...formData });
        if (result.success) {
            setShowEditModal(false);
            setSelectedUnit(null);
            setFormData({ name: "", symbol: "" });
        }
    }, [updateUnit, selectedUnit, formData]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedUnit) return;
        const result = await deleteUnit(selectedUnit.id);
        if (result.success) {
            setShowDeleteModal(false);
            setSelectedUnit(null);
        }
    }, [deleteUnit, selectedUnit]);

    // Spreadsheet columns
    const columns = useMemo((): SpreadsheetColumn<Unit>[] => [
        {
            key: "name",
            label: "Name",
            width: 300,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "symbol",
            label: "Symbol",
            width: 150,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
    ], []);

    // Row actions
    const renderActions = useCallback((row: Unit) => {
        if (!canManageUnits) return null;

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
    }, [canManageUnits, handleEdit, handleDelete]);

    // Toolbar
    const toolbar = useMemo(() => {
        if (!canManageUnits) return null;

        return (
            <div className="flex items-center justify-end w-full px-4 py-2">
                <button
                    onClick={handleAdd}
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                    <Icon icon={plusIcon} className="size-4" />
                    <span>New Unit</span>
                </button>
            </div>
        );
    }, [canManageUnits, handleAdd]);

    if (loading) {
        return (
            <Loader
                icon="ruler"
                subtitle="Loading: Units"
                description="Preparing unit data..."
            />
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0">
                <Spreadsheet<Unit>
                    data={tableData}
                    columns={columns}
                    mode="view"
                    loading={loading}
                    emptyMessage="No units found"
                    persistKey="admin-units-spreadsheet"
                    rowHeight={40}
                    actionsRender={canManageUnits ? renderActions : undefined}
                    actionsColumnWidth={100}
                    onRowDoubleClick={canManageUnits ? handleEdit : undefined}
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
                        <h3 className="font-bold text-lg mb-4">Add New Unit</h3>
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter unit name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Symbol *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.symbol}
                                    onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                                    placeholder="Enter unit symbol (e.g., m, kg, m2)"
                                />
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
                                disabled={saving || !formData.name || !formData.symbol}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create Unit</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedUnit && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Edit Unit</h3>
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter unit name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Symbol *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.symbol}
                                    onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                                    placeholder="Enter unit symbol (e.g., m, kg, m2)"
                                />
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedUnit(null);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleEditSubmit}
                                disabled={saving || !formData.name || !formData.symbol}
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
            {showDeleteModal && selectedUnit && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-error mb-4">Delete Unit</h3>
                        <p className="mb-4">
                            Are you sure you want to delete the unit <strong>{selectedUnit.name}</strong> ({selectedUnit.symbol})?
                        </p>
                        <p className="text-sm text-base-content/70 mb-4">
                            This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedUnit(null);
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
                                    <span>Delete Unit</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

Units.displayName = 'Units';

export default Units;
