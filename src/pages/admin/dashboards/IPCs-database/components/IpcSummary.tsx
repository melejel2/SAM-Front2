import React from "react";
import type { IpcSummaryData } from "@/types/ipc";

interface IpcSummaryProps {
  summaryData: IpcSummaryData | null;
  loading?: boolean;
  className?: string;
}

/**
 * NEW: IPC Summary Display Component
 * Shows Amount, PreviousPaid, Remaining values for IPC edit forms
 */
const IpcSummary: React.FC<IpcSummaryProps> = ({
  summaryData,
  loading = false,
  className = ""
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`bg-base-100 p-4 rounded-lg border border-base-300 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
            <span className="iconify lucide--calculator text-blue-600 dark:text-blue-400 size-5"></span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-base-content">IPC Financial Summary</h3>
            <p className="text-sm text-base-content/70">Contract payment status overview</p>
          </div>
        </div>
        
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-base-200 p-4 rounded-lg animate-pulse">
              <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
              <div className="h-8 bg-base-300 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className={`bg-base-100 p-4 rounded-lg border border-base-300 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg dark:bg-gray-800">
            <span className="iconify lucide--calculator text-gray-600 dark:text-gray-400 size-5"></span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-base-content">IPC Financial Summary</h3>
            <p className="text-sm text-base-content/70">No summary data available</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <span className="iconify lucide--file-x text-base-content/30 size-12 mb-2"></span>
          <p className="text-base-content/50">Summary data not loaded</p>
        </div>
      </div>
    );
  }

  const { amount, previousPaid, remaining } = summaryData;
  const paymentProgress = amount > 0 ? (previousPaid / amount) * 100 : 0;

  return (
    <div className={`bg-base-100 p-4 rounded-lg border border-base-300 ${className}`}>
      {/* Enhanced Header with desktop-style info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
            <span className="iconify lucide--calculator text-blue-600 dark:text-blue-400 size-5"></span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-base-content">IPC Financial Summary</h3>
            <p className="text-sm text-base-content/70">Contract payment status overview</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-base-content/60">
          <span className="iconify lucide--clock size-4"></span>
          <span>Updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Contract Amount */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="iconify lucide--file-text text-blue-600 dark:text-blue-400 size-4"></span>
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Contract Amount
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(amount)}
          </div>
          <div className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
            Total contract value
          </div>
        </div>

        {/* Previous Payments */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="iconify lucide--check-circle text-green-600 dark:text-green-400 size-4"></span>
            <div className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">
              Previous Paid
            </div>
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(previousPaid)}
          </div>
          <div className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
            {paymentProgress.toFixed(1)}% of contract
          </div>
        </div>

        {/* Remaining Amount */}
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-1">
            <span className="iconify lucide--clock text-orange-600 dark:text-orange-400 size-4"></span>
            <div className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              Remaining
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(remaining)}
          </div>
          <div className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
            {(100 - paymentProgress).toFixed(1)}% remaining
          </div>
        </div>
      </div>

      {/* Enhanced Progress Bar with Desktop-Style Visual */}
      <div className="bg-base-200 p-4 rounded-lg border border-base-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="iconify lucide--trending-up text-green-600 size-4"></span>
            <span className="text-sm font-medium text-base-content">Contract Progress</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-base-content">{paymentProgress.toFixed(1)}%</div>
            <div className="text-xs text-base-content/60">Completed</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-base-300 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(paymentProgress, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-base-content/60">
            <span>0 ({formatCurrency(0)})</span>
            <span className="text-center">
              {paymentProgress < 50 ? 'Early Stage' : paymentProgress < 90 ? 'In Progress' : 'Near Completion'}
            </span>
            <span>100% ({formatCurrency(amount)})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IpcSummary;
