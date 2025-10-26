import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { Button, useDialog } from "@/components/daisyui";
import CloseBtn from "@/components/CloseBtn";
import { usePermissions } from "@/hooks/use-permissions";

import useCurrencies from "./use-currencies";

const Currencies = () => {
    const { 
        columns, 
        tableData, 
        inputFields, 
        loading, 
        getCurrencies,
        // Sync functionality
        syncLoading,
        showSyncDialog,
        syncedRates,
        syncColumns,
        syncCurrencies,
        applySyncedRates,
        cancelSync,
    } = useCurrencies();
    
    const navigate = useNavigate();
    const { dialogRef, handleShow, handleHide } = useDialog();
    const { canAddDeleteCurrencies, canEditCurrencyRates } = usePermissions();

    // State for managing which rates to apply
    const [selectedRates, setSelectedRates] = useState<any[]>([]);
    const [editableRates, setEditableRates] = useState<any[]>([]);

    useEffect(() => {
        getCurrencies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Initialize editable rates when sync dialog opens
    useEffect(() => {
        if (showSyncDialog && syncedRates.length > 0) {
            const initialRates = syncedRates.map((rate: any) => ({
                ...rate,
                currencies: rate.code, // Match the column name
                selected: true // Default to selected
            }));
            setEditableRates(initialRates);
            setSelectedRates(initialRates);
            handleShow();
        }
    }, [showSyncDialog, syncedRates, handleShow]);

    const handleBackToAdminTools = () => {
        navigate('/admin-tools');
    };

    const handleSyncClick = () => {
        syncCurrencies();
    };

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
        handleHide();
    };

    // Cancel sync
    const handleCancelSync = () => {
        cancelSync();
        handleHide();
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

    return (
        <div style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Fixed Header Section */}
            <div style={{ flexShrink: 0 }} className="p-6 pb-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToAdminTools}
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            <span className="iconify lucide--arrow-left size-4"></span>
                            <span>Back</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {canEditCurrencyRates && (
                            <Button
                                size="sm"
                                color="info"
                                onClick={handleSyncClick}
                                loading={syncLoading}
                                disabled={syncLoading || loading}
                                className="flex items-center gap-2"
                            >
                                <span className="iconify lucide--refresh-cw size-4"></span>
                                <span>Sync Currencies</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }} className="px-6">
                {loading ? (
                    <Loader />
                ) : (
                    <SAMTable
                        columns={columns}
                        tableData={tableData}
                        inputFields={inputFields}
                        actions={true}
                        editAction={canEditCurrencyRates}
                        deleteAction={canAddDeleteCurrencies}
                        title={"Currency"}
                        loading={false}
                        addBtn={canAddDeleteCurrencies}
                        editEndPoint="Currencie/UpdateCurrencie"
                        createEndPoint="Currencie/AddCurrencie"
                        deleteEndPoint="Currencie/DeleteCurrencie"
                        onSuccess={getCurrencies}
                    />
                )}
            </div>

            {/* Currency Sync Approval Dialog */}
            <dialog ref={dialogRef as React.Ref<HTMLDialogElement>} className="modal" aria-modal="true">
                <div className="modal-box max-w-6xl relative">
                    <CloseBtn handleClose={handleCancelSync} />
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
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            color="success"
                            onClick={handleApplyRates}
                            loading={loading}
                            disabled={loading || selectedRates.length === 0}
                            className="flex items-center gap-2"
                        >
                            <span className="iconify lucide--check size-4"></span>
                            <span>Apply Updates ({selectedRates.length})</span>
                        </Button>
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default Currencies;
