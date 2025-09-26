import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import searchIcon from '@iconify/icons-lucide/search';
import xIcon from '@iconify/icons-lucide/x';
import layersIcon from '@iconify/icons-lucide/layers';
import buildingIcon from '@iconify/icons-lucide/building';
import folderIcon from '@iconify/icons-lucide/folder';
import alertTriangleIcon from '@iconify/icons-lucide/alert-triangle';
import infoIcon from '@iconify/icons-lucide/info';

interface BudgetBOQSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadBudgetBOQ: (sheetName: string, buildingIds: number[]) => void;
  projectId: number | null;
  buildingIds: number[];
  buildings: any[];
  selectedSheetName: string;
  hasExistingBOQData: boolean;
  loading?: boolean;
}

const BudgetBOQSelectionModal: React.FC<BudgetBOQSelectionModalProps> = ({
  isOpen,
  onClose,
  onLoadBudgetBOQ,
  projectId,
  buildingIds,
  buildings,
  selectedSheetName,
  hasExistingBOQData,
  loading = false
}) => {
  const [confirmationStep, setConfirmationStep] = useState(false);

  // Reset to initial step when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmationStep(false);
    }
  }, [isOpen]);

  // Handle load Budget BOQ confirmation
  const handleLoadBudgetBOQ = () => {
    if (!selectedSheetName || buildingIds.length === 0) return;
    
    onLoadBudgetBOQ(selectedSheetName, buildingIds);
    onClose();
  };

  // Handle confirmation step
  const handleConfirmLoad = () => {
    setConfirmationStep(true);
  };

  if (!isOpen) return null;

  const selectedBuildingNames = buildings
    .filter(b => buildingIds.includes(b.id))
    .map(b => b.name || b.buildingName)
    .join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-base-100 rounded-xl shadow-xl border border-base-300 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Icon icon={layersIcon} className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-base-content">
                {confirmationStep ? 'Confirm Budget BOQ Loading' : 'Load Budget BOQ'}
              </h3>
              <p className="text-sm text-base-content/70">
                {confirmationStep 
                  ? 'Review the details before loading Budget BOQ items'
                  : 'Load existing Budget BOQ items for this trade and buildings'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <Icon icon={xIcon} className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!confirmationStep ? (
            /* Initial Information Step */
            <div className="space-y-6">
              {/* Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Info */}
                <div className="bg-base-50 border border-base-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon={folderIcon} className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm text-base-content">Project</span>
                  </div>
                  <p className="text-sm text-base-content/70">
                    ID: {projectId || 'Not Selected'}
                  </p>
                </div>

                {/* Buildings Info */}
                <div className="bg-base-50 border border-base-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon={buildingIcon} className="w-4 h-4 text-info" />
                    <span className="font-medium text-sm text-base-content">Buildings</span>
                  </div>
                  <p className="text-sm text-base-content/70">
                    {selectedBuildingNames || 'None Selected'}
                  </p>
                </div>

                {/* Trade Info */}
                <div className="bg-base-50 border border-base-200 rounded-lg p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon={layersIcon} className="w-4 h-4 text-success" />
                    <span className="font-medium text-sm text-base-content">Trade/Sheet</span>
                  </div>
                  <p className="text-sm text-base-content/70">
                    {selectedSheetName || 'None Selected'}
                  </p>
                </div>
              </div>

              {/* Budget BOQ Explanation */}
              <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon icon={infoIcon} className="w-5 h-5 text-info mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-base-content mb-2">About Budget BOQ Loading</h4>
                    <ul className="text-sm text-base-content/70 space-y-1">
                      <li>• Loads existing Budget BOQ items for the selected trade and buildings</li>
                      <li>• Item descriptions, units, and cost codes will be <strong>read-only</strong></li>
                      <li>• You can only modify <strong>quantities</strong> and <strong>unit prices</strong></li>
                      <li>• Import functionality will be restricted to Budget BOQ structure</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Warning for existing data */}
              {hasExistingBOQData && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Icon icon={alertTriangleIcon} className="w-5 h-5 text-warning mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-base-content mb-2">Existing BOQ Data Warning</h4>
                      <p className="text-sm text-base-content/70">
                        You have existing BOQ items. Loading Budget BOQ will <strong>replace</strong> all current BOQ items 
                        with the Budget BOQ structure. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Messages */}
              {(!projectId || buildingIds.length === 0 || !selectedSheetName) && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Icon icon={alertTriangleIcon} className="w-5 h-5 text-error mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-base-content mb-2">Missing Requirements</h4>
                      <ul className="text-sm text-base-content/70 space-y-1">
                        {!projectId && <li>• Project must be selected</li>}
                        {buildingIds.length === 0 && <li>• At least one building must be selected</li>}
                        {!selectedSheetName && <li>• Trade/sheet must be selected</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Confirmation Step */
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-base-50 border border-base-200 rounded-lg p-4">
                <h4 className="font-medium text-base-content mb-4">Loading Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Project ID:</span>
                    <span className="font-medium">{projectId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Buildings:</span>
                    <span className="font-medium">{buildingIds.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">Trade:</span>
                    <span className="font-medium">{selectedSheetName}</span>
                  </div>
                </div>
              </div>

              {/* Final confirmation */}
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon icon={layersIcon} className="w-5 h-5 text-success mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-base-content mb-2">Ready to Load</h4>
                    <p className="text-sm text-base-content/70">
                      Budget BOQ items will be loaded with the structure defined in your project's Budget BOQ. 
                      Field restrictions will be applied automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-base-300 bg-base-50">
          <div className="flex items-center gap-3">
            {confirmationStep && (
              <button
                onClick={() => setConfirmationStep(false)}
                className="btn btn-ghost btn-sm"
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            
            {!confirmationStep ? (
              <button
                onClick={handleConfirmLoad}
                disabled={!projectId || buildingIds.length === 0 || !selectedSheetName || loading}
                className="btn btn-success"
              >
                {loading ? (
                  <>
                    <div className="loading loading-spinner loading-sm"></div>
                    Loading...
                  </>
                ) : (
                  <>
                    <Icon icon={layersIcon} className="w-4 h-4" />
                    Load Budget BOQ
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleLoadBudgetBOQ}
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? (
                  <>
                    <div className="loading loading-spinner loading-sm"></div>
                    Loading...
                  </>
                ) : (
                  'Confirm & Load'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetBOQSelectionModal;