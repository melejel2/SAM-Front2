import { memo, useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import uploadIcon from "@iconify/icons-lucide/upload";
import plusIcon from "@iconify/icons-lucide/plus";
import pencilIcon from "@iconify/icons-lucide/pencil";
import trashIcon from "@iconify/icons-lucide/trash-2";

import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { Loader } from "@/components/Loader";
import { Button } from "@/components/daisyui";
import { usePermissions } from "@/hooks/use-permissions";
import { useTopbarContent } from "@/contexts/topbar-content";
import { useNavigationBlocker } from "@/contexts/navigation-blocker";

import useCostCodes, { CostCode } from "./use-cost-codes";

const CostCodes = memo(() => {
    const {
        tableData,
        loading,
        saving,
        uploadLoading,
        getCostCodes,
        createCostCode,
        updateCostCode,
        deleteCostCode,
        uploadCostCodes,
    } = useCostCodes();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { canManageCostCodes } = usePermissions();
    const { setLeftContent, setRightContent, clearContent } = useTopbarContent();
    const { tryNavigate } = useNavigationBlocker();

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCostCode, setSelectedCostCode] = useState<CostCode | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        code: "",
        en: "",
        fr: "",
    });

    useEffect(() => {
        getCostCodes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadCostCodes(file);
        }
        // Reset file input so the same file can be uploaded again
        if (event.target) {
            event.target.value = '';
        }
    }, [uploadCostCodes]);

    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
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

    const rightTopbarContent = useMemo(() => {
        if (!canManageCostCodes) return null;

        return (
            <Button
                color="primary"
                size="sm"
                onClick={triggerFileInput}
                disabled={uploadLoading}
                loading={uploadLoading}
                className="gap-2"
            >
                <Icon icon={uploadIcon} className="w-4 h-4" />
                {uploadLoading ? "Uploading..." : "Upload Excel"}
            </Button>
        );
    }, [canManageCostCodes, triggerFileInput, uploadLoading]);

    useEffect(() => {
        setLeftContent(leftTopbarContent);
    }, [leftTopbarContent, setLeftContent]);

    useEffect(() => {
        setRightContent(rightTopbarContent);
    }, [rightTopbarContent, setRightContent]);

    useEffect(() => {
        return () => {
            clearContent();
        };
    }, [clearContent]);

    // Handlers
    const handleAdd = useCallback(() => {
        setFormData({ code: "", en: "", fr: "" });
        setShowAddModal(true);
    }, []);

    const handleEdit = useCallback((costCode: CostCode) => {
        setSelectedCostCode(costCode);
        setFormData({
            code: costCode.code || "",
            en: costCode.en || "",
            fr: costCode.fr || "",
        });
        setShowEditModal(true);
    }, []);

    const handleDelete = useCallback((costCode: CostCode) => {
        setSelectedCostCode(costCode);
        setShowDeleteModal(true);
    }, []);

    const handleAddSubmit = useCallback(async () => {
        const result = await createCostCode(formData);
        if (result.success) {
            setShowAddModal(false);
            setFormData({ code: "", en: "", fr: "" });
        }
    }, [createCostCode, formData]);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedCostCode) return;
        const result = await updateCostCode({ ...selectedCostCode, ...formData });
        if (result.success) {
            setShowEditModal(false);
            setSelectedCostCode(null);
            setFormData({ code: "", en: "", fr: "" });
        }
    }, [updateCostCode, selectedCostCode, formData]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedCostCode) return;
        const result = await deleteCostCode(selectedCostCode.id);
        if (result.success) {
            setShowDeleteModal(false);
            setSelectedCostCode(null);
        }
    }, [deleteCostCode, selectedCostCode]);

    // Spreadsheet columns
    const columns = useMemo((): SpreadsheetColumn<CostCode>[] => [
        {
            key: "code",
            label: "Code",
            width: 180,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "en",
            label: "EN",
            width: 320,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "fr",
            label: "FR",
            width: 320,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
    ], []);

    // Row actions
    const renderActions = useCallback((row: CostCode) => {
        if (!canManageCostCodes) return null;

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
    }, [canManageCostCodes, handleEdit, handleDelete]);

    // Toolbar
    const toolbar = useMemo(() => {
        if (!canManageCostCodes) return null;

        return (
            <div className="flex items-center justify-end w-full px-4 py-2">
                <button
                    onClick={handleAdd}
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                    <Icon icon={plusIcon} className="size-4" />
                    <span>New Cost Code</span>
                </button>
            </div>
        );
    }, [canManageCostCodes, handleAdd]);

    if (loading) {
        return (
            <Loader
                icon="hash"
                subtitle="Loading: Cost Codes"
                description="Preparing cost code data..."
            />
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
            />

            <div className="flex-1 min-h-0">
                <Spreadsheet<CostCode>
                    data={tableData}
                    columns={columns}
                    mode="view"
                    loading={loading}
                    emptyMessage="No cost codes found"
                    persistKey="admin-cost-codes-spreadsheet"
                    rowHeight={40}
                    actionsRender={canManageCostCodes ? renderActions : undefined}
                    actionsColumnWidth={100}
                    onRowDoubleClick={canManageCostCodes ? handleEdit : undefined}
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
                        <h3 className="font-bold text-lg mb-4">Add New Cost Code</h3>
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Code *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                    placeholder="Enter cost code"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">EN *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.en}
                                    onChange={(e) => setFormData(prev => ({ ...prev, en: e.target.value }))}
                                    placeholder="Enter English description"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">FR *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.fr}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fr: e.target.value }))}
                                    placeholder="Enter French description"
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
                                disabled={saving || !formData.code || !formData.en || !formData.fr}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create Cost Code</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedCostCode && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Edit Cost Code</h3>
                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Code *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.code}
                                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                    placeholder="Enter cost code"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">EN *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.en}
                                    onChange={(e) => setFormData(prev => ({ ...prev, en: e.target.value }))}
                                    placeholder="Enter English description"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">FR *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.fr}
                                    onChange={(e) => setFormData(prev => ({ ...prev, fr: e.target.value }))}
                                    placeholder="Enter French description"
                                />
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedCostCode(null);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleEditSubmit}
                                disabled={saving || !formData.code || !formData.en || !formData.fr}
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
            {showDeleteModal && selectedCostCode && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-error mb-4">Delete Cost Code</h3>
                        <p className="mb-4">
                            Are you sure you want to delete the cost code <strong>{selectedCostCode.code}</strong>
                            {selectedCostCode.en ? ` (${selectedCostCode.en})` : null}?
                        </p>
                        <p className="text-sm text-base-content/70 mb-4">
                            This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedCostCode(null);
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
                                    <span>Delete Cost Code</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

CostCodes.displayName = 'CostCodes';

export default CostCodes;
