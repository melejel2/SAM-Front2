import { memo, useCallback, useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import arrowLeftIcon from "@iconify/icons-lucide/arrow-left";
import refreshCwIcon from "@iconify/icons-lucide/refresh-cw";
import checkIcon from "@iconify/icons-lucide/check";
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

import useCurrencies, { Currency, ExternalCurrencyRate } from "./use-currencies";

const Currencies = memo(() => {
    const {
        tableData,
        loading,
        saving,
        syncLoading,
        showSyncDialog,
        syncedRates,
        getCurrencies,
        createCurrency,
        updateCurrency,
        deleteCurrency,
        syncCurrencies,
        applySyncedRates,
        cancelSync,
    } = useCurrencies();

    const { canAddDeleteCurrencies, canEditCurrencyRates } = usePermissions();
    const { setAllContent, clearContent } = useTopbarContent();
    const { tryNavigate } = useNavigationBlocker();

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        currencies: "",
        rate: 0,
    });

    // Sync dialog state
    const [editableRates, setEditableRates] = useState<ExternalCurrencyRate[]>([]);
    const [selectedRates, setSelectedRates] = useState<ExternalCurrencyRate[]>([]);

    useEffect(() => {
        getCurrencies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize editable rates when sync dialog opens
    useEffect(() => {
        if (showSyncDialog && syncedRates.length > 0) {
            const initialRates = syncedRates.map((rate) => ({
                ...rate,
                selected: true,
            }));
            setEditableRates(initialRates);
            setSelectedRates(initialRates);
        }
    }, [showSyncDialog, syncedRates]);

    const handleBackToAdminTools = useCallback(() => {
        tryNavigate('/admin-tools');
    }, [tryNavigate]);

    const handleSyncClick = useCallback(() => {
        syncCurrencies();
    }, [syncCurrencies]);

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
        if (!canEditCurrencyRates) return null;

        return (
            <Button
                size="sm"
                color="info"
                onClick={handleSyncClick}
                loading={syncLoading}
                disabled={syncLoading || loading}
                className="flex items-center gap-2"
            >
                <Icon icon={refreshCwIcon} className="w-4 h-4" />
                <span>Sync Currencies</span>
            </Button>
        );
    }, [canEditCurrencyRates, handleSyncClick, loading, syncLoading]);

    useEffect(() => {
        setAllContent(leftTopbarContent, null, rightTopbarContent);
    }, [leftTopbarContent, rightTopbarContent, setAllContent]);

    useEffect(() => {
        return () => {
            clearContent();
        };
    }, [clearContent]);

    // =============================================================================
    // CRUD HANDLERS
    // =============================================================================

    const handleAdd = useCallback(() => {
        setFormData({ name: "", currencies: "", rate: 0 });
        setShowAddModal(true);
    }, []);

    const handleEdit = useCallback((currency: Currency) => {
        setSelectedCurrency(currency);
        setFormData({
            name: currency.name || "",
            currencies: currency.currencies || "",
            rate: currency.rate || 0,
        });
        setShowEditModal(true);
    }, []);

    const handleDelete = useCallback((currency: Currency) => {
        setSelectedCurrency(currency);
        setShowDeleteModal(true);
    }, []);

    const handleAddSubmit = useCallback(async () => {
        const result = await createCurrency(formData);
        if (result.success) {
            setShowAddModal(false);
            setFormData({ name: "", currencies: "", rate: 0 });
        }
    }, [createCurrency, formData]);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedCurrency) return;
        const result = await updateCurrency({ ...selectedCurrency, ...formData });
        if (result.success) {
            setShowEditModal(false);
            setSelectedCurrency(null);
            setFormData({ name: "", currencies: "", rate: 0 });
        }
    }, [updateCurrency, selectedCurrency, formData]);

    const handleDeleteConfirm = useCallback(async () => {
        if (!selectedCurrency) return;
        const result = await deleteCurrency(selectedCurrency.id);
        if (result.success) {
            setShowDeleteModal(false);
            setSelectedCurrency(null);
        }
    }, [deleteCurrency, selectedCurrency]);

    // =============================================================================
    // SYNC DIALOG HANDLERS
    // =============================================================================

    // Handle rate editing in the dialog
    const handleRateEdit = (index: number, field: string, value: any) => {
        const updated = [...editableRates];
        if (field === 'newRate') {
            const newRate = parseFloat(value) || 0;
            const currentRate = updated[index].currentRate;
            const change = newRate - currentRate;
            const changePercent = currentRate > 0 ? ((change / currentRate) * 100) : 0;

            updated[index] = {
                ...updated[index],
                newRate,
                change,
                changePercent
            };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setEditableRates(updated);

        // Update selected rates if this rate is selected
        if (updated[index].selected) {
            const selectedIndex = selectedRates.findIndex(rate => rate.code === updated[index].code);
            if (selectedIndex >= 0) {
                const updatedSelected = [...selectedRates];
                updatedSelected[selectedIndex] = updated[index];
                setSelectedRates(updatedSelected);
            }
        }
    };

    // Handle rate selection toggle
    const handleRateSelection = (index: number, selected: boolean) => {
        const updated = [...editableRates];
        updated[index] = { ...updated[index], selected };
        setEditableRates(updated);

        if (selected) {
            setSelectedRates(prev => [...prev, updated[index]]);
        } else {
            setSelectedRates(prev => prev.filter(rate => rate.code !== updated[index].code));
        }
    };

    // Apply selected rates
    const handleApplyRates = () => {
        if (selectedRates.length === 0) {
            return;
        }
        applySyncedRates(selectedRates);
    };

    // Cancel sync
    const handleCancelSync = () => {
        cancelSync();
        setSelectedRates([]);
        setEditableRates([]);
    };

    // Format number for display
    const formatNumber = (num: number, decimals: number = 4) => {
        return Number(num).toFixed(decimals);
    };

    // Format percentage for display
    const formatPercentage = (num: number) => {
        const sign = num >= 0 ? '+' : '';
        return `${sign}${formatNumber(num, 2)}%`;
    };

    // =============================================================================
    // SPREADSHEET CONFIGURATION
    // =============================================================================

    const columns = useMemo((): SpreadsheetColumn<Currency>[] => [
        {
            key: "name",
            label: "Name",
            width: 250,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "currencies",
            label: "Code",
            width: 120,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "rate",
            label: "Conversion Rate",
            width: 180,
            align: "right",
            editable: false,
            sortable: true,
            filterable: true,
            render: (value) => {
                return value ? Number(value).toFixed(4) : "0.0000";
            },
        },
    ], []);

    // Row actions
    const renderActions = useCallback((row: Currency) => {
        return (
            <div className="flex items-center gap-1">
                {canEditCurrencyRates && (
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
                {canAddDeleteCurrencies && (
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
    }, [canEditCurrencyRates, canAddDeleteCurrencies, handleEdit, handleDelete]);

    // Toolbar
    const toolbar = useMemo(() => {
        if (!canAddDeleteCurrencies) return null;

        return (
            <div className="flex items-center justify-end w-full px-4 py-2">
                <button
                    onClick={handleAdd}
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                    <Icon icon={plusIcon} className="size-4" />
                    <span>New Currency</span>
                </button>
            </div>
        );
    }, [canAddDeleteCurrencies, handleAdd]);

    if (loading) {
        return (
            <Loader
                icon="coins"
                subtitle="Loading: Currencies"
                description="Preparing currency data..."
            />
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0">
                <Spreadsheet<Currency>
                    data={tableData}
                    columns={columns}
                    mode="view"
                    loading={loading}
                    emptyMessage="No currencies found"
                    persistKey="admin-currencies-spreadsheet"
                    rowHeight={40}
                    actionsRender={(canEditCurrencyRates || canAddDeleteCurrencies) ? renderActions : undefined}
                    actionsColumnWidth={100}
                    onRowDoubleClick={canEditCurrencyRates ? handleEdit : undefined}
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
                        <h3 className="font-bold text-lg mb-4">Add New Currency</h3>
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
                                    placeholder="Enter currency name (e.g., US Dollar)"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Code *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.currencies}
                                    onChange={(e) => setFormData(prev => ({ ...prev, currencies: e.target.value.toUpperCase() }))}
                                    placeholder="Enter currency code (e.g., USD, EUR)"
                                    maxLength={5}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Conversion Rate *</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    className="input input-bordered w-full"
                                    value={formData.rate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                                    placeholder="Enter conversion rate"
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
                                disabled={saving || !formData.name || !formData.currencies}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <span>Create Currency</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedCurrency && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Edit Currency</h3>
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
                                    placeholder="Enter currency name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Code *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.currencies}
                                    onChange={(e) => setFormData(prev => ({ ...prev, currencies: e.target.value.toUpperCase() }))}
                                    placeholder="Enter currency code"
                                    maxLength={5}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Conversion Rate *</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    className="input input-bordered w-full"
                                    value={formData.rate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                                    placeholder="Enter conversion rate"
                                />
                            </div>
                        </div>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedCurrency(null);
                                }}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleEditSubmit}
                                disabled={saving || !formData.name || !formData.currencies}
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
            {showDeleteModal && selectedCurrency && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg text-error mb-4">Delete Currency</h3>
                        <p className="mb-4">
                            Are you sure you want to delete the currency <strong>{selectedCurrency.name}</strong> ({selectedCurrency.currencies})?
                        </p>
                        <p className="text-sm text-base-content/70 mb-4">
                            This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedCurrency(null);
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
                                    <span>Delete Currency</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Currency Sync Approval Dialog */}
            {showSyncDialog && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-6xl">
                        <button
                            className="btn btn-sm btn-circle absolute right-2 top-2"
                            onClick={handleCancelSync}
                        >
                            X
                        </button>
                        <h3 className="text-lg font-bold">Review Currency Rate Updates</h3>

                        <div className="text-sm text-base-content/70 mt-4">
                            Review the proposed currency rate changes below. You can edit the new rates or deselect currencies you don't want to update.
                        </div>

                        {/* Rates Table */}
                        <div className="overflow-x-auto mt-4">
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-sm"
                                                checked={selectedRates.length === editableRates.length && editableRates.length > 0}
                                                onChange={(e) => {
                                                    const checked = e.target.checked;
                                                    const updated = editableRates.map(rate => ({ ...rate, selected: checked }));
                                                    setEditableRates(updated);
                                                    setSelectedRates(checked ? updated : []);
                                                }}
                                            />
                                        </th>
                                        <th>Currency</th>
                                        <th>Name</th>
                                        <th>Current Rate</th>
                                        <th>New Rate</th>
                                        <th>Change</th>
                                        <th>Change %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editableRates.map((rate, index) => (
                                        <tr key={rate.code} className={rate.selected ? 'bg-base-200/50' : ''}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm"
                                                    checked={rate.selected || false}
                                                    onChange={(e) => handleRateSelection(index, e.target.checked)}
                                                />
                                            </td>
                                            <td className="font-medium">{rate.code}</td>
                                            <td>{rate.name}</td>
                                            <td>{formatNumber(rate.currentRate)}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.0001"
                                                    className="input input-xs input-bordered w-24"
                                                    value={rate.newRate}
                                                    onChange={(e) => handleRateEdit(index, 'newRate', e.target.value)}
                                                />
                                            </td>
                                            <td className={rate.change >= 0 ? 'text-success' : 'text-error'}>
                                                {rate.change >= 0 ? '+' : ''}{formatNumber(rate.change)}
                                            </td>
                                            <td className={rate.changePercent >= 0 ? 'text-success' : 'text-error'}>
                                                {formatPercentage(rate.changePercent)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {editableRates.length === 0 && (
                            <div className="text-center py-8 text-base-content/50">
                                No currency rate updates available
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelSync}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                color="success"
                                onClick={handleApplyRates}
                                loading={saving}
                                disabled={saving || selectedRates.length === 0}
                                className="flex items-center gap-2"
                            >
                                <Icon icon={checkIcon} className="w-4 h-4" />
                                <span>Apply Updates ({selectedRates.length})</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

Currencies.displayName = 'Currencies';

export default Currencies;
