import React, { useState, useEffect } from "react";
import { formatCurrency, formatNumber } from "@/utils/formatters";
import {
    CorrectionModalProps,
    CorrectionEntityType,
    CorrectPreviousValueRequest,
} from "@/types/ipc";

/**
 * Modal for correcting previous values in BOQs, VOs, and Deductions.
 *
 * IMPORTANT AUDIT FEATURE:
 * - All corrections are logged to the PreviousValueCorrections table
 * - Only ContractsManager, QuantitySurveyor, and Admin can make corrections
 * - Requires mandatory reason (10-500 characters)
 * - Captures server timestamp, user ID, IP address, and context snapshot
 *
 * What Gets Corrected:
 * - BOQs/VOs: PrecedQte (previous cumulative at period start) OR CumulQte (historical cumulative)
 * - Deductions: PrecedentAmount (previous deduction amount) - affects PreviousDeduction%
 */
const CorrectPreviousValueModal: React.FC<CorrectionModalProps> = ({
    isOpen,
    onClose,
    entityType,
    entityId,
    contractDatasetId,
    fieldName,
    fieldLabel,
    currentValue,
    entityDescription,
    onCorrect,
}) => {
    const [newValue, setNewValue] = useState<string>(currentValue.toString());
    const [reason, setReason] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setNewValue(currentValue.toString());
            setReason("");
            setError(null);
        }
    }, [isOpen, currentValue]);

    // Get entity type label for display
    const getEntityTypeLabel = (type: CorrectionEntityType): string => {
        switch (type) {
            case CorrectionEntityType.ContractBoqItem:
                return "BOQ Item";
            case CorrectionEntityType.ContractVo:
                return "Variation Order";
            case CorrectionEntityType.Labor:
                return "Labor Deduction";
            case CorrectionEntityType.Machine:
                return "Machine Deduction";
            case CorrectionEntityType.Material:
                return "Material Deduction";
            default:
                return "Item";
        }
    };

    // Validate form before submission
    const validateForm = (): boolean => {
        const numValue = parseFloat(newValue);

        // Check if valid number
        if (isNaN(numValue)) {
            setError("Please enter a valid number");
            return false;
        }

        // Check if non-negative
        if (numValue < 0) {
            setError("Value cannot be negative");
            return false;
        }

        // Check if value actually changed (with tolerance for floating point)
        if (Math.abs(numValue - currentValue) < 0.0001) {
            setError("New value must be different from current value");
            return false;
        }

        // Check reason length
        if (reason.trim().length < 10) {
            setError("Reason must be at least 10 characters");
            return false;
        }

        if (reason.trim().length > 500) {
            setError("Reason cannot exceed 500 characters");
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        setError(null);

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const request: CorrectPreviousValueRequest = {
                entityType,
                entityId,
                contractDatasetId,
                fieldName,
                newValue: parseFloat(newValue),
                reason: reason.trim(),
            };

            const result = await onCorrect(request);

            if (result) {
                onClose();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to apply correction");
        } finally {
            setLoading(false);
        }
    };

    const numValue = parseFloat(newValue) || 0;
    const valueDifference = numValue - currentValue;
    const isQuantityField = fieldName === "PrecedQte";

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-xl p-0 overflow-hidden">
                {/* Header with warning gradient */}
                <div className="bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-700 dark:to-amber-600 px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <span className="iconify lucide--pencil-line text-white size-5"></span>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Correct Previous Value</h2>
                                <p className="text-xs text-white/80">{getEntityTypeLabel(entityType)}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-sm btn-circle btn-ghost text-white hover:bg-white/20"
                            disabled={loading}
                        >
                            <span className="iconify lucide--x size-5"></span>
                        </button>
                    </div>
                </div>

                <div className="p-5">
                    {/* Audit Warning Banner */}
                    <div className="alert bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-5">
                        <span className="iconify lucide--shield-alert text-amber-600 dark:text-amber-400 size-5"></span>
                        <div>
                            <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Audit Trail Active</h3>
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                This correction will be permanently logged with your user ID, timestamp, and reason.
                            </p>
                        </div>
                    </div>

                    {/* Entity Description */}
                    <div className="bg-base-200/50 border border-base-300 rounded-xl p-3 mb-5">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="iconify lucide--file-text text-base-content/50 size-4"></span>
                            <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Item</span>
                        </div>
                        <div className="text-sm font-medium text-base-content">
                            {entityDescription}
                        </div>
                    </div>

                    {/* Value Summary Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        {/* Current Value */}
                        <div className="bg-base-200/50 border border-base-300 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="iconify lucide--history text-base-content/50 size-4"></span>
                                <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Current</span>
                            </div>
                            <div className="text-xl font-bold text-base-content">
                                {isQuantityField ? formatNumber(currentValue) : formatCurrency(currentValue)}
                            </div>
                        </div>

                        {/* New Value */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="iconify lucide--edit-3 text-blue-500 size-4"></span>
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">New</span>
                            </div>
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {isQuantityField ? formatNumber(numValue) : formatCurrency(numValue)}
                            </div>
                        </div>

                        {/* Change */}
                        <div className={`rounded-xl p-3 border ${
                            valueDifference > 0
                                ? "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800"
                                : valueDifference < 0
                                ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 border-green-200 dark:border-green-800"
                                : "bg-base-200/50 border-base-300"
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`iconify size-4 ${
                                    valueDifference > 0 ? "lucide--trending-up text-orange-500" :
                                    valueDifference < 0 ? "lucide--trending-down text-green-500" :
                                    "lucide--minus text-base-content/50"
                                }`}></span>
                                <span className={`text-xs font-medium uppercase tracking-wide ${
                                    valueDifference > 0 ? "text-orange-600 dark:text-orange-400" :
                                    valueDifference < 0 ? "text-green-600 dark:text-green-400" :
                                    "text-base-content/60"
                                }`}>Change</span>
                            </div>
                            <div className={`text-xl font-bold ${
                                valueDifference > 0 ? "text-orange-600 dark:text-orange-400" :
                                valueDifference < 0 ? "text-green-600 dark:text-green-400" :
                                "text-base-content"
                            }`}>
                                {valueDifference >= 0 ? "+" : ""}{isQuantityField ? formatNumber(valueDifference) : formatCurrency(valueDifference)}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="divider my-4 text-xs text-base-content/50">Enter Correction Details</div>

                    {/* Error Display */}
                    {error && (
                        <div className="alert alert-error mb-4">
                            <span className="iconify lucide--alert-circle size-4"></span>
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Current Value (Read-only) */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm font-medium">
                                    Current {fieldLabel}
                                </span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 iconify lucide--lock size-4"></span>
                                <input
                                    type="text"
                                    value={isQuantityField ? formatNumber(currentValue) : formatCurrency(currentValue)}
                                    readOnly
                                    className="input input-bordered bg-base-200/50 w-full pl-9 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* New Value */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text text-sm font-medium">
                                    New {fieldLabel} <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 iconify lucide--calculator size-4"></span>
                                <input
                                    type="number"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    className="input input-bordered w-full pl-9 focus:border-blue-400 focus:ring-blue-400"
                                    min="0"
                                    step={isQuantityField ? "0.001" : "0.01"}
                                    disabled={loading}
                                    placeholder={`Enter new ${fieldLabel.toLowerCase()}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="form-control mb-5">
                        <label className="label">
                            <span className="label-text text-sm font-medium">
                                Reason for Correction <span className="text-red-500">*</span>
                            </span>
                            <span className="label-text-alt text-base-content/50">
                                {reason.length}/500 characters
                            </span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={`textarea textarea-bordered h-24 resize-none ${
                                reason.length > 0 && reason.length < 10 ? "textarea-warning" : ""
                            }`}
                            placeholder="Explain why this correction is necessary (minimum 10 characters)..."
                            disabled={loading}
                            maxLength={500}
                        />
                        {reason.length > 0 && reason.length < 10 && (
                            <label className="label">
                                <span className="label-text-alt text-warning">
                                    Minimum 10 characters required ({10 - reason.length} more needed)
                                </span>
                            </label>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-base-300">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost gap-2"
                            disabled={loading}
                        >
                            <span className="iconify lucide--x size-4"></span>
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="btn btn-warning gap-2"
                            disabled={loading || reason.length < 10}
                        >
                            {loading ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <span className="iconify lucide--check size-4"></span>
                            )}
                            Apply Correction
                        </button>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop bg-black/50" onClick={onClose}></div>
        </div>
    );
};

export default CorrectPreviousValueModal;
