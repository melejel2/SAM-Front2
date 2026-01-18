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

import useSubcontractors, { Subcontractor, SubcontractorFormData } from "./use-subcontractors";

const initialFormData: SubcontractorFormData = {
    name: "",
    siegeSocial: "",
    commerceRegistrar: "",
    commerceNumber: "",
    taxNumber: "",
    representedBy: "",
    qualityRepresentive: "",
    subcontractorTel: "",
};

const Subcontractors = memo(() => {
    const {
        tableData,
        loading,
        saving,
        getSubcontractors,
        createSubcontractor,
        updateSubcontractor,
        deleteSubcontractor,
    } = useSubcontractors();

    const { canAddEditSubcontractors, canDeleteSubcontractors } = usePermissions();
    const { setLeftContent, clearContent } = useTopbarContent();
    const { tryNavigate } = useNavigationBlocker();

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<Subcontractor | null>(null);

    // Form state
    const [formData, setFormData] = useState<SubcontractorFormData>(initialFormData);

    useEffect(() => {
        getSubcontractors();
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
        setFormData(initialFormData);
        setShowAddModal(true);
    }, []);

    const handleEdit = useCallback((subcontractor: Subcontractor) => {
        setSelectedSubcontractor(subcontractor);
        setFormData({
            name: subcontractor.name || "",
            siegeSocial: subcontractor.siegeSocial || "",
            commerceRegistrar: subcontractor.commerceRegistrar || "",
            commerceNumber: subcontractor.commerceNumber || "",
            taxNumber: subcontractor.taxNumber || "",
            representedBy: subcontractor.representedBy || "",
            qualityRepresentive: subcontractor.qualityRepresentive || "",
            subcontractorTel: subcontractor.subcontractorTel || "",
        });
        setShowEditModal(true);
    }, []);

    const handleDelete = useCallback((subcontractor: Subcontractor) => {
        setSelectedSubcontractor(subcontractor);
        setShowDeleteModal(true);
    }, []);

    const handleAddSubmit = useCallback(async () => {
        const result = await createSubcontractor(formData);
        if (result.success) {
            setShowAddModal(false);
            setFormData(initialFormData);
        }
    }, [createSubcontractor, formData]);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedSubcontractor) return;
        const result = await updateSubcontractor({
            id: selectedSubcontractor.id,
            name: formData.name,
            siegeSocial: formData.siegeSocial,
            commerceRegistrar: formData.commerceRegistrar,
            commerceNumber: formData.commerceNumber,
            taxNumber: formData.taxNumber,
            representedBy: formData.representedBy,
            qualityRepresentive: formData.qualityRepresentive,
            subcontractorTel: formData.subcontractorTel,
        });
        if (result.success) {
            setShowEditModal(false);
            setSelectedSubcontractor(null);
            setFormData(initialFormData);
        }
    }, [updateSubcontractor, selectedSubcontractor, formData]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedSubcontractor) return;
        const result = await deleteSubcontractor(selectedSubcontractor.id);
        if (result.success) {
            setShowDeleteModal(false);
            setSelectedSubcontractor(null);
        }
    }, [deleteSubcontractor, selectedSubcontractor]);

    // Spreadsheet columns
    const columns = useMemo((): SpreadsheetColumn<Subcontractor>[] => [
        {
            key: "name",
            label: "Name",
            width: 200,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "siegeSocial",
            label: "Company Headquarters",
            width: 200,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "commerceRegistrar",
            label: "Commerce Registrar",
            width: 150,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "commerceNumber",
            label: "Commerce Number",
            width: 150,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "taxNumber",
            label: "Tax Number",
            width: 150,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "representedBy",
            label: "Represented By",
            width: 150,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "qualityRepresentive",
            label: "Quality Representative",
            width: 180,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "subcontractorTel",
            label: "Phone",
            width: 150,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
    ], []);

    // Row actions
    const renderActions = useCallback((row: Subcontractor) => {
        const canEdit = canAddEditSubcontractors;
        const canDelete = canDeleteSubcontractors;

        if (!canEdit && !canDelete) return null;

        return (
            <div className="flex items-center gap-1">
                {canEdit && (
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
                )}
                {canDelete && (
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
                )}
            </div>
        );
    }, [canAddEditSubcontractors, canDeleteSubcontractors, handleEdit, handleDelete]);

    // Toolbar
    const toolbar = useMemo(() => {
        if (!canAddEditSubcontractors) return null;

        return (
            <div className="flex items-center justify-end w-full px-4 py-2">
                <button
                    onClick={handleAdd}
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                    <Icon icon={plusIcon} className="size-4" />
                    <span>New Subcontractor</span>
                </button>
            </div>
        );
    }, [canAddEditSubcontractors, handleAdd]);

    if (loading) {
        return (
            <Loader
                icon="hard-hat"
                subtitle="Loading: Subcontractors"
                description="Preparing subcontractor data..."
            />
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0">
                <Spreadsheet<Subcontractor>
                    data={tableData}
                    columns={columns}
                    mode="view"
                    loading={loading}
                    emptyMessage="No subcontractors found"
                    persistKey="admin-subcontractors-spreadsheet"
                    rowHeight={40}
                    actionsRender={canAddEditSubcontractors || canDeleteSubcontractors ? renderActions : undefined}
                    actionsColumnWidth={100}
                    onRowDoubleClick={canAddEditSubcontractors ? handleEdit : undefined}
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
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">Add New Subcontractor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter subcontractor name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Company Headquarters</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.siegeSocial}
                                    onChange={(e) => setFormData(prev => ({ ...prev, siegeSocial: e.target.value }))}
                                    placeholder="Enter company headquarters"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Commerce Registrar</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.commerceRegistrar}
                                    onChange={(e) => setFormData(prev => ({ ...prev, commerceRegistrar: e.target.value }))}
                                    placeholder="Enter commerce registrar"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Commerce Number</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.commerceNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, commerceNumber: e.target.value }))}
                                    placeholder="Enter commerce number"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Tax Number</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.taxNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                                    placeholder="Enter tax number"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Represented By</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.representedBy}
                                    onChange={(e) => setFormData(prev => ({ ...prev, representedBy: e.target.value }))}
                                    placeholder="Enter representative name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Quality Representative</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.qualityRepresentive}
                                    onChange={(e) => setFormData(prev => ({ ...prev, qualityRepresentive: e.target.value }))}
                                    placeholder="Enter quality representative"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Phone</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.subcontractorTel}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subcontractorTel: e.target.value }))}
                                    placeholder="Enter phone number"
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
                                disabled={saving || !formData.name}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create Subcontractor</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedSubcontractor && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl">
                        <h3 className="font-bold text-lg mb-4">Edit Subcontractor</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter subcontractor name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Company Headquarters</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.siegeSocial}
                                    onChange={(e) => setFormData(prev => ({ ...prev, siegeSocial: e.target.value }))}
                                    placeholder="Enter company headquarters"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Commerce Registrar</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.commerceRegistrar}
                                    onChange={(e) => setFormData(prev => ({ ...prev, commerceRegistrar: e.target.value }))}
                                    placeholder="Enter commerce registrar"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Commerce Number</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.commerceNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, commerceNumber: e.target.value }))}
                                    placeholder="Enter commerce number"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Tax Number</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.taxNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                                    placeholder="Enter tax number"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Represented By</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.representedBy}
                                    onChange={(e) => setFormData(prev => ({ ...prev, representedBy: e.target.value }))}
                                    placeholder="Enter representative name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Quality Representative</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.qualityRepresentive}
                                    onChange={(e) => setFormData(prev => ({ ...prev, qualityRepresentive: e.target.value }))}
                                    placeholder="Enter quality representative"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Phone</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.subcontractorTel}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subcontractorTel: e.target.value }))}
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedSubcontractor(null);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleEditSubmit}
                                disabled={saving || !formData.name}
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
            {showDeleteModal && selectedSubcontractor && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-error mb-4">Delete Subcontractor</h3>
                        <p className="mb-4">
                            Are you sure you want to delete the subcontractor <strong>{selectedSubcontractor.name}</strong>?
                        </p>
                        <p className="text-sm text-base-content/70 mb-4">
                            This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedSubcontractor(null);
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
                                    <span>Delete Subcontractor</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

Subcontractors.displayName = 'Subcontractors';

export default Subcontractors;
