import React, { useState, useEffect } from "react";
import { formatCurrency, formatNumber, formatDate } from "@/utils/formatters";
import {
    CorrectionHistoryModalProps,
    CorrectionHistoryDTO,
    CorrectionEntityType,
    CorrectionHistoryRequest,
} from "@/types/ipc";

/**
 * Modal for viewing the correction history audit trail.
 *
 * This component displays a table of all previous value corrections made
 * to BOQs, VOs, and Deductions within a contract dataset.
 *
 * Features:
 * - Filter by entity type
 * - Filter by date range
 * - Shows who made the correction, when, and why
 * - Displays old and new values with difference calculation
 */
const CorrectionHistoryModal: React.FC<CorrectionHistoryModalProps> = ({
    isOpen,
    onClose,
    contractDatasetId,
    entityType: initialEntityType,
    entityId: initialEntityId,
    onFetchHistory,
}) => {
    const [history, setHistory] = useState<CorrectionHistoryDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterEntityType, setFilterEntityType] = useState<CorrectionEntityType | undefined>(initialEntityType);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    // Fetch history when modal opens or filters change
    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, filterEntityType, fromDate, toDate]);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);

        try {
            const request: CorrectionHistoryRequest = {
                contractDatasetId,
                entityType: filterEntityType,
                entityId: initialEntityId,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
                limit: 100,
            };

            const result = await onFetchHistory(request);
            setHistory(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load correction history");
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    // Get entity type label for display
    const getEntityTypeLabel = (type: string): string => {
        switch (type) {
            case "ContractBoqItem":
                return "BOQ Item";
            case "ContractVo":
                return "Variation Order";
            case "Labor":
                return "Labor";
            case "Machine":
                return "Machine";
            case "Material":
                return "Material";
            default:
                return type;
        }
    };

    // Get badge color for entity type
    const getEntityTypeBadgeClass = (type: string): string => {
        switch (type) {
            case "ContractBoqItem":
                return "badge-primary";
            case "ContractVo":
                return "badge-secondary";
            case "Labor":
                return "badge-accent";
            case "Machine":
                return "badge-info";
            case "Material":
                return "badge-warning";
            default:
                return "badge-ghost";
        }
    };

    // Check if field is quantity-based
    const isQuantityField = (fieldName: string): boolean => {
        return fieldName === "PrecedQte";
    };

    // Format value based on field type
    const formatValue = (value: number, fieldName: string): string => {
        return isQuantityField(fieldName) ? formatNumber(value) : formatCurrency(value);
    };

    const clearFilters = () => {
        setFilterEntityType(undefined);
        setFromDate("");
        setToDate("");
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-5xl p-0 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-800 dark:to-slate-700 px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <span className="iconify lucide--history text-white size-5"></span>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Correction History</h2>
                                <p className="text-xs text-white/80">Audit trail of previous value corrections</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/20"
                        >
                            <span className="iconify lucide--x size-5"></span>
                        </button>
                    </div>
                </div>

                <div className="p-5">
                    {/* Filters */}
                    <div className="bg-base-200/50 border border-base-300 rounded-xl p-4 mb-5">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="iconify lucide--filter text-base-content/50 size-4"></span>
                            <span className="text-sm font-medium text-base-content/70">Filters</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {/* Entity Type Filter */}
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-xs">Entity Type</span>
                                </label>
                                <select
                                    className="select select-bordered select-sm"
                                    value={filterEntityType ?? ""}
                                    onChange={(e) => setFilterEntityType(e.target.value ? parseInt(e.target.value) : undefined)}
                                >
                                    <option value="">All Types</option>
                                    <option value={CorrectionEntityType.ContractBoqItem}>BOQ Items</option>
                                    <option value={CorrectionEntityType.ContractVo}>Variation Orders</option>
                                    <option value={CorrectionEntityType.Labor}>Labor Deductions</option>
                                    <option value={CorrectionEntityType.Machine}>Machine Deductions</option>
                                    <option value={CorrectionEntityType.Material}>Material Deductions</option>
                                </select>
                            </div>

                            {/* From Date */}
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-xs">From Date</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered input-sm"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                />
                            </div>

                            {/* To Date */}
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-xs">To Date</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered input-sm"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                />
                            </div>

                            {/* Actions */}
                            <div className="form-control">
                                <label className="label py-1">
                                    <span className="label-text text-xs">&nbsp;</span>
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-sm btn-ghost"
                                        onClick={clearFilters}
                                    >
                                        <span className="iconify lucide--x size-4"></span>
                                        Clear
                                    </button>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={fetchHistory}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="loading loading-spinner loading-xs"></span>
                                        ) : (
                                            <span className="iconify lucide--refresh-cw size-4"></span>
                                        )}
                                        Refresh
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="alert alert-error mb-4">
                            <span className="iconify lucide--alert-circle size-4"></span>
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Results Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <span className="loading loading-spinner loading-lg text-primary"></span>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-base-content/50">
                                <span className="iconify lucide--inbox size-12 mb-3"></span>
                                <p className="text-sm">No correction history found</p>
                                <p className="text-xs">Corrections will appear here once made</p>
                            </div>
                        ) : (
                            <table className="table table-sm">
                                <thead>
                                    <tr className="bg-base-200/50">
                                        <th className="text-xs font-semibold">Date & Time</th>
                                        <th className="text-xs font-semibold">Type</th>
                                        <th className="text-xs font-semibold">Item</th>
                                        <th className="text-xs font-semibold">Field</th>
                                        <th className="text-xs font-semibold text-right">Old Value</th>
                                        <th className="text-xs font-semibold text-right">New Value</th>
                                        <th className="text-xs font-semibold text-right">Change</th>
                                        <th className="text-xs font-semibold">Corrected By</th>
                                        <th className="text-xs font-semibold">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => {
                                        const difference = item.newValue - item.oldValue;
                                        return (
                                            <tr key={item.id} className="hover:bg-base-200/30">
                                                <td className="text-xs whitespace-nowrap">
                                                    {formatDate(item.correctedAt, "dd MMM yyyy HH:mm")}
                                                </td>
                                                <td>
                                                    <span className={`badge badge-sm ${getEntityTypeBadgeClass(item.entityType)}`}>
                                                        {getEntityTypeLabel(item.entityType)}
                                                    </span>
                                                </td>
                                                <td className="text-xs max-w-xs truncate" title={item.entityDescription}>
                                                    {item.entityDescription}
                                                </td>
                                                <td className="text-xs">
                                                    <span className="font-mono text-base-content/70">
                                                        {item.fieldName === "PrecedQte" ? "Prev Qty" : "Prev Amount"}
                                                    </span>
                                                </td>
                                                <td className="text-xs text-right font-mono">
                                                    {formatValue(item.oldValue, item.fieldName)}
                                                </td>
                                                <td className="text-xs text-right font-mono font-semibold">
                                                    {formatValue(item.newValue, item.fieldName)}
                                                </td>
                                                <td className={`text-xs text-right font-mono ${
                                                    difference > 0 ? "text-orange-600 dark:text-orange-400" :
                                                    difference < 0 ? "text-green-600 dark:text-green-400" :
                                                    "text-base-content/50"
                                                }`}>
                                                    {difference >= 0 ? "+" : ""}
                                                    {formatValue(difference, item.fieldName)}
                                                </td>
                                                <td className="text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <span className="iconify lucide--user size-3 text-base-content/40"></span>
                                                        {item.correctedByName}
                                                    </div>
                                                </td>
                                                <td className="text-xs max-w-xs">
                                                    <div
                                                        className="truncate cursor-help"
                                                        title={item.reason}
                                                    >
                                                        {item.reason}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer with count */}
                    <div className="flex justify-between items-center pt-4 mt-4 border-t border-base-300">
                        <span className="text-sm text-base-content/60">
                            {history.length > 0 ? (
                                <>
                                    <span className="font-semibold">{history.length}</span> correction{history.length !== 1 ? "s" : ""} found
                                </>
                            ) : (
                                "No corrections"
                            )}
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost gap-2"
                        >
                            <span className="iconify lucide--x size-4"></span>
                            Close
                        </button>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
        </div>
    );
};

export default CorrectionHistoryModal;
