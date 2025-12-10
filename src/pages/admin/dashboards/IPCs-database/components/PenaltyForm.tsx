import React from "react";

interface PenaltyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (penaltyData: {
    penalty: number;
    previousPenalty: number;
    reason: string;
  }) => void;
  initialData: {
    penalty: number;
    previousPenalty: number;
    reason: string;
  };
  loading?: boolean;
}

/**
 * NEW: Penalty Form Modal Component
 * Handles the enhanced penalty management with previous penalty tracking
 */
const PenaltyForm: React.FC<PenaltyFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  loading = false
}) => {
  const [formData, setFormData] = React.useState(initialData);

  // Update form data when initialData changes
  React.useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleInputChange = (field: keyof typeof formData, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const currentPenalty = formData.penalty;
  const previousPenalty = formData.previousPenalty;
  const penaltyDifference = currentPenalty - previousPenalty;

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-xl p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 dark:from-red-700 dark:to-red-600 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <span className="iconify lucide--alert-triangle text-white size-5"></span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Penalty Management</h2>
                <p className="text-xs text-white/80">Manage cumulative penalties for this IPC</p>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {/* Previous Penalty */}
            <div className="bg-base-200/50 border border-base-300 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="iconify lucide--history text-base-content/50 size-4"></span>
                <span className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Previous</span>
              </div>
              <div className="text-xl font-bold text-base-content">
                {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(previousPenalty)}
              </div>
            </div>

            {/* Total Penalty */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="iconify lucide--alert-circle text-red-500 size-4"></span>
                <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Total</span>
              </div>
              <div className="text-xl font-bold text-red-600 dark:text-red-400">
                {new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(currentPenalty)}
              </div>
            </div>

            {/* Change */}
            <div className={`rounded-xl p-3 border ${
              penaltyDifference > 0
                ? 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800'
                : penaltyDifference < 0
                ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-base-200/50 border-base-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`iconify size-4 ${
                  penaltyDifference > 0 ? 'lucide--trending-up text-orange-500' :
                  penaltyDifference < 0 ? 'lucide--trending-down text-green-500' :
                  'lucide--minus text-base-content/50'
                }`}></span>
                <span className={`text-xs font-medium uppercase tracking-wide ${
                  penaltyDifference > 0 ? 'text-orange-600 dark:text-orange-400' :
                  penaltyDifference < 0 ? 'text-green-600 dark:text-green-400' :
                  'text-base-content/60'
                }`}>Change</span>
              </div>
              <div className={`text-xl font-bold ${
                penaltyDifference > 0 ? 'text-orange-600 dark:text-orange-400' :
                penaltyDifference < 0 ? 'text-green-600 dark:text-green-400' :
                'text-base-content'
              }`}>
                {penaltyDifference > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(penaltyDifference)}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="divider my-4 text-xs text-base-content/50">Enter Penalty Details</div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Previous Penalty (Read-only) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium">Previous Penalty</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 iconify lucide--lock size-4"></span>
                <input
                  type="number"
                  value={formData.previousPenalty}
                  readOnly
                  className="input input-bordered bg-base-200/50 w-full pl-9 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Total Penalty */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-sm font-medium">Total Penalty <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 iconify lucide--calculator size-4"></span>
                <input
                  type="number"
                  value={formData.penalty}
                  onChange={(e) => handleInputChange('penalty', parseFloat(e.target.value) || 0)}
                  className="input input-bordered w-full pl-9 focus:border-red-400 focus:ring-red-400"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="form-control mb-5">
            <label className="label">
              <span className="label-text text-sm font-medium">Reason</span>
              <span className="label-text-alt text-base-content/50">Optional</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className="textarea textarea-bordered h-20 resize-none"
              placeholder="Describe the reason for this penalty..."
              disabled={loading}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t border-base-300">
            <button
              type="button"
              onClick={handleSave}
              className="btn btn-error gap-2"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <span className="iconify lucide--check size-4"></span>
              )}
              Apply Penalty
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PenaltyForm;
