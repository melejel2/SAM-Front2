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
      <div className="modal-box w-11/12 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900/30">
              <span className="iconify lucide--alert-triangle text-red-600 dark:text-red-400 size-5"></span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-base-content">Penalty Management</h2>
              <p className="text-sm text-base-content/70">Manage penalties for this IPC</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            disabled={loading}
          >
            <span className="iconify lucide--x size-4"></span>
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Enhanced Desktop-Style Summary Cards */}
          <div className="bg-base-200 p-4 rounded-lg border border-base-300">
            <h3 className="text-sm font-semibold text-base-content mb-3 uppercase tracking-wider">Penalty Calculation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Previous Penalty */}
              <div className="bg-base-100 p-3 rounded-lg border border-base-300">
                <div className="flex items-center gap-2 mb-1">
                  <span className="iconify lucide--history text-base-content/60 size-4"></span>
                  <div className="text-xs font-medium text-base-content/60 uppercase tracking-wider">Previous Penalty</div>
                </div>
                <div className="text-lg font-bold text-base-content">
                  {new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(previousPenalty)}
                </div>
                <div className="text-xs text-base-content/50 mt-1">From previous IPCs</div>
              </div>

              {/* Current Penalty */}
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-1">
                  <span className="iconify lucide--alert-triangle text-red-600 dark:text-red-400 size-4"></span>
                  <div className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">Total Penalty</div>
                </div>
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(currentPenalty)}
                </div>
                <div className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Cumulative amount</div>
              </div>

              {/* Penalty Difference */}
              <div className={`p-3 rounded-lg border ${
                penaltyDifference > 0 
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' 
                  : penaltyDifference < 0
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-base-100 border-base-300'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`iconify ${
                    penaltyDifference > 0 ? 'lucide--trending-up text-orange-600 dark:text-orange-400' :
                    penaltyDifference < 0 ? 'lucide--trending-down text-green-600 dark:text-green-400' :
                    'lucide--minus text-base-content/60'
                  } size-4`}></span>
                  <div className={`text-xs font-medium uppercase tracking-wider ${
                    penaltyDifference > 0 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : penaltyDifference < 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-base-content/60'
                  }`}>
                    {penaltyDifference > 0 ? 'Additional Penalty' : penaltyDifference < 0 ? 'Penalty Reduction' : 'No Change'}
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  penaltyDifference > 0 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : penaltyDifference < 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-base-content'
                }`}>
                  {penaltyDifference > 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(penaltyDifference)}
                </div>
                <div className={`text-xs mt-1 ${
                  penaltyDifference > 0 
                    ? 'text-orange-600/70 dark:text-orange-400/70' 
                    : penaltyDifference < 0
                    ? 'text-green-600/70 dark:text-green-400/70'
                    : 'text-base-content/50'
                }`}>
                  {penaltyDifference === 0 ? 'No change from previous' : 'Difference from previous'}
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Previous Penalty (Read-only) */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Previous Penalty Amount</span>
              </label>
              <input
                type="number"
                value={formData.previousPenalty}
                readOnly
                className="input input-bordered bg-base-200 cursor-not-allowed"
                placeholder="0"
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">This is the penalty amount from previous IPCs (read-only)</span>
              </label>
            </div>

            {/* Current Penalty */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Total Penalty Amount *</span>
              </label>
              <input
                type="number"
                value={formData.penalty}
                onChange={(e) => handleInputChange('penalty', parseFloat(e.target.value) || 0)}
                className="input input-bordered focus:input-error"
                placeholder="Enter total penalty amount"
                min="0"
                step="0.01"
                disabled={loading}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">Enter the total cumulative penalty amount</span>
              </label>
            </div>

            {/* Penalty Reason */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Penalty Reason</span>
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className="textarea textarea-bordered h-24 resize-none"
                placeholder="Enter the reason for this penalty (optional)"
                disabled={loading}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">Provide context for the penalty calculation</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-action">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-error"
            disabled={loading}
          >
            {loading && <span className="loading loading-spinner loading-sm"></span>}
            Apply Penalty
          </button>
        </div>
      </div>
    </div>
  );
};

export default PenaltyForm;
