import checkIcon from "@iconify/icons-lucide/check";
import editIcon from "@iconify/icons-lucide/edit";
import trashIcon from "@iconify/icons-lucide/trash";
import uploadIcon from "@iconify/icons-lucide/upload";
import xIcon from "@iconify/icons-lucide/x";
import { Icon } from "@iconify/react";
import React, { useEffect, useRef, useState } from "react";

import { BudgetVO, BudgetVOSheet, BudgetVOItem, ClearBudgetVORequest, BoqDeletionScope } from '@/api/services/budget-vo-api';
import { saveBudgetVo, uploadBudgetVo, clearBudgetVo } from '@/api/services/budget-vo-api';
import { Button, Input, Select, SelectOption } from "@/components/daisyui";
import { useAuth } from "@/contexts/auth";
import { cn } from "@/helpers/utils/cn";
import useToast from "@/hooks/use-toast";
import useBOQUnits from "@/pages/admin/dashboards/subcontractors-BOQs/hooks/use-units";
import { UnsavedChangesDialog } from "@/pages/admin/dashboards/subcontractors-BOQs/shared/components/UnsavedChangesDialog";

interface VOTableProps {
    vo: BudgetVO;
    onClose: () => void;
    onSave: () => void; // To refresh data in VODialog
    buildingName: string;
    tradeName?: string;
    projectId: number;
    buildingId: number;
    sheetId?: number;
    projectLevel: number;
}

const VOTable: React.FC<VOTableProps> = (props) => {
    const { vo, onClose, onSave, buildingName, tradeName } = props;
    const { projectId, buildingId, sheetId, projectLevel } = props;
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const [loading, setLoading] = useState(false);
    const [editedVO, setEditedVO] = useState<BudgetVO>(JSON.parse(JSON.stringify(vo)));
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [originalVO, setOriginalVO] = useState<BudgetVO | null>(null);
    const [activeSheetId, setActiveSheetId] = useState<number | null>(editedVO.voSheets[0]?.id || null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
      const [showClearScopeDialog, setShowClearScopeDialog] = useState(false);
      const [clearScope, setClearScope] = useState<BoqDeletionScope>(BoqDeletionScope.Sheet);
      const { units } = useBOQUnits();  
    useEffect(() => {        setOriginalVO(JSON.parse(JSON.stringify(vo)));
    }, [vo]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks, react-hooks/set-state-in-effect
        if (originalVO && JSON.stringify(editedVO) !== JSON.stringify(originalVO)) {
            setHasUnsavedChanges(true);
        } else {
            setHasUnsavedChanges(false);
        }
    }, [editedVO, originalVO]);

    const handleItemChange = (sheetIndex: number, itemIndex: number, field: keyof BudgetVOItem, value: any) => {
        const newVO = { ...editedVO };
        const item = newVO.voSheets[sheetIndex].voItems[itemIndex];
        (item[field] as any) = value;
        setEditedVO(newVO);
    };

    const handleItemDelete = (sheetIndex: number, itemIndex: number) => {
        const newVO = { ...editedVO };
        newVO.voSheets[sheetIndex].voItems.splice(itemIndex, 1);
        setEditedVO(newVO);
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            toaster.error("Authentication token not found.");
            setLoading(false);
            return;
        }

        const payload: BudgetVO = {
            ...editedVO,
            voSheets: [],
        };

        let changesDetected = false;
        editedVO.voSheets.forEach((editedSheet) => {
            const originalSheet = originalVO?.voSheets.find((s) => s.id === editedSheet.id);
            if (!originalSheet || JSON.stringify(editedSheet.voItems) !== JSON.stringify(originalSheet.voItems)) {
                payload.voSheets.push(editedSheet);
                changesDetected = true;
            }
        });

        if (!changesDetected) {
            toaster.info("No changes to save.");
            setLoading(false);
            onClose();
            return;
        }

        try {
            const result = await saveBudgetVo(payload, token);
            if (result.isSuccess) {
                toaster.success("Changes saved successfully!");
                onSave();
                onClose();
            } else {
                toaster.error(result.error?.message || "Failed to save changes.");
            }
        } catch (error) {
            toaster.error("An error occurred while saving changes.");
        } finally {
            setLoading(false);
        }
    };

const handleDirectFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const token = getToken();
    const currentProjectId = props.projectId;
    const currentBuildingId = props.buildingId;
    const currentSheetId = props.sheetId;

    if (!token || !currentSheetId) {
        toaster.error("Please select a trade/sheet first");
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
        const uploadRequest = {
            projectId: currentProjectId,
            buildingId: currentBuildingId,
            sheetId: currentSheetId,
            voLevel: vo.voLevel + 1, // Use current VO level + 1
            isFromBudgetBoq: false,
            excelFile: file
        };
        
        const result = await uploadBudgetVo(uploadRequest, token);
        
        if (result.isSuccess) {
            toaster.success("VO uploaded successfully");
            onSave(); // Refresh the VO page in parent
        } else {
            toaster.error(result.error?.message || "Failed to upload VO");
        }
    } catch (error) {
        console.error("Error uploading VO:", error);
        toaster.error("Failed to upload VO");
    } finally {
        setLoading(false);
        // Reset file input
        if (event.target) {
            event.target.value = '';
        }
    }
  };

  const handleClearVo = async () => {
    setShowClearScopeDialog(true);
  };

  const handleClearVoConfirm = async () => {
    setShowClearScopeDialog(false); // Close the dialog
    
    const token = getToken();
    const currentProjectId = props.projectId;
    const currentBuildingId = props.buildingId;
    const currentSheetId = props.sheetId;

    if (!token || !currentProjectId || !currentBuildingId) { // projectId and buildingId are required
        toaster.error("Project and Building must be selected.");
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
        const clearRequest: ClearBudgetVORequest = {
            scope: clearScope, // Use the selected scope
            projectId: currentProjectId,
            buildingId: currentBuildingId,
            sheetId: clearScope === BoqDeletionScope.Sheet ? currentSheetId : undefined, // Only send sheetId if scope is Sheet
        };
        
        const result = await clearBudgetVo(clearRequest, vo.voLevel, token);
        
        if (result.isSuccess) {
            toaster.success("VO cleared successfully");
            onSave(); // Refresh the VO page in parent
        } else {
            toaster.error(result.error?.message || "Failed to clear VO");
        }
    } catch (error) {
        console.error("Error clearing VO:", error);
        toaster.error("Failed to clear VO");
    } finally {
        setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount) || amount === 0) return '-';
    const hasDecimals = amount % 1 !== 0;
    return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2 }).format(amount);
  };

  const formatQuantity = (quantity: number) => {
    if (!quantity || isNaN(quantity) || quantity === 0) return '-';
    
    const hasDecimals = quantity % 1 !== 0;
    
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: hasDecimals ? 1 : 0,
      maximumFractionDigits: hasDecimals ? 3 : 0
    }).format(quantity);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  };

  const activeSheet = editedVO.voSheets.find(s => s.id === activeSheetId);

  return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-base-100 mx-4 flex max-h-[90vh] w-full max-w-7xl flex-col rounded-lg p-6 shadow-xl">
                <div className="mb-4 flex flex-shrink-0 items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">Edit VO Level {vo.voLevel}</h3>
                        <p className="text-base-content/70 text-sm">{buildingName}</p>
                    </div>
                    <button onClick={handleClose} className="btn btn-sm btn-ghost">
                        <Icon icon={xIcon} className="h-4 w-4" />
                    </button>
                </div>
        <div className="flex items-center gap-2 mb-4">
            <Button
              size="sm"
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon icon={uploadIcon} className="w-4 h-4 mr-1" />
              Upload VO
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleDirectFileUpload}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
            />
            <Button
                size="sm"
                className="btn-error"
                onClick={() => setShowClearScopeDialog(true)}
            >
                <Icon icon={trashIcon} className="w-4 h-4 mr-1" />
                Clear VO
            </Button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {activeSheet ? (
            <div key={activeSheet.id} className="mb-6">
              
              <div className="overflow-x-auto">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th className="w-12">No</th>
                      <th>Description</th>
                      <th className="w-20">Unit</th>
                      <th className="w-24">Qty</th>
                      <th className="w-28">Unit Price</th>
                      <th className="w-28">Total</th>
                      <th className="w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSheet.voItems.map((item, itemIndex) => {
                      const total = (item.qte || 0) * (item.pu || 0);
                      const isEditing = editingItemId === item.id;
                      return (
                        <tr key={item.id}>
                          <td>{item.no}</td>
                          <td>
                            {isEditing ? (
                              <Input
                                className="input-xs w-full"
                                value={item.key || ''}
                                onChange={(e) => handleItemChange(editedVO.voSheets.findIndex(s => s.id === activeSheetId), itemIndex, 'key', e.target.value)}
                              />
                            ) : (
                              item.key
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <Select
                                className="select-xs w-full"
                                value={item.unite || ''}
                                onChange={(e) => handleItemChange(editedVO.voSheets.findIndex(s => s.id === activeSheetId), itemIndex, 'unite', e.target.value)}
                              >
                                <SelectOption value="" disabled>Select Unit</SelectOption>
                                {units.map(unit => (
                                  <SelectOption key={unit.id} value={unit.name}>
                                    {unit.name}
                                  </SelectOption>
                                ))}
                              </Select>
                            ) : (
                              item.unite
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <Input
                                type="number"
                                className="input-xs w-full"
                                value={item.qte || 0}
                                onChange={(e) => handleItemChange(editedVO.voSheets.findIndex(s => s.id === activeSheetId), itemIndex, 'qte', parseFloat(e.target.value))}
                              />
                            ) : (
                              formatQuantity(item.qte)
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <Input
                                type="number"
                                className="input-xs w-full"
                                value={item.pu || 0}
                                onChange={(e) => handleItemChange(editedVO.voSheets.findIndex(s => s.id === activeSheetId), itemIndex, 'pu', parseFloat(e.target.value))}
                              />
                            ) : (
                              formatCurrency(item.pu)
                            )}
                          </td>
                          <td>{formatCurrency(total)}</td>
                          <td>
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <Button size="xs" color="ghost" onClick={() => setEditingItemId(null)}>
                                    <Icon icon={checkIcon} className="w-4 h-4 text-success" />
                                  </Button>
                                  <Button size="xs" color="ghost" onClick={() => {
                                    setEditingItemId(null);
                                    if (originalVO) {
                                      setEditedVO(originalVO);
                                      setOriginalVO(null);
                                    }
                                  }}>
                                    <Icon icon={xIcon} className="w-4 h-4 text-error" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button size="xs" color="ghost" onClick={() => {
                                    setEditingItemId(item.id);
                                  }}>
                                    <Icon icon={editIcon} className="w-4 h-4" />
                                  </Button>
                                  <Button size="xs" color="ghost" className="text-error" onClick={() => handleItemDelete(editedVO.voSheets.findIndex(s => s.id === activeSheetId), itemIndex)}>
                                    <Icon icon={trashIcon} className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-error font-semibold">No sheet selected or data is missing.</p>
            </div>
          )}
        </div>
        <div className="bg-base-100 flex w-full overflow-x-auto border-t border-base-300 flex-shrink-0">
            {editedVO.voSheets.map((sheet) => (
                <span
                    key={sheet.id}
                    className={cn(
                        "min-w-max cursor-pointer px-3 py-2 text-center text-sm transition-all duration-200 relative border-b-2",
                        sheet.id === activeSheetId
                            ? sheet.voItems.length > 0
                                ? "text-primary border-primary bg-primary/5"
                                : "text-base-content border-base-content/20 bg-base-200"
                            : sheet.voItems.length > 0
                                ? "text-base-content hover:text-primary border-transparent hover:border-primary/30"
                                : "text-base-content/50 border-transparent hover:text-base-content/70",
                    )}
                    onClick={() => {
                        setActiveSheetId(sheet.id);
                    }}>
                    {sheet.sheetName}
                    {sheet.voItems.length > 0 && (
                        <span className="ml-1 text-xs opacity-60">
                            ({sheet.voItems.length})
                        </span>
                    )}
                </span>
            ))}
        </div>
        <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button className="btn-primary" onClick={handleSaveChanges} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
            {!loading && <Icon icon={checkIcon} className="w-4 h-4 ml-2" />}
          </Button>
        </div>

        {/* Unsaved Changes Dialog */}
        <UnsavedChangesDialog
            isOpen={showUnsavedChangesDialog}
            onConfirm={() => {
                setShowUnsavedChangesDialog(false);
                onClose();
            }}
            onCancel={() => setShowUnsavedChangesDialog(false)}
        />

        {/* Clear Scope Dialog */}
        {showClearScopeDialog && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-lg font-bold mb-4">Clear VO Scope</h3>
                    <p className="text-base-content/70 mb-4">
                        Select the scope for clearing the VO:
                    </p>
                    <div className="space-y-2 mb-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="clearScope"
                                value={BoqDeletionScope.Sheet}
                                checked={clearScope === BoqDeletionScope.Sheet}
                                onChange={() => setClearScope(BoqDeletionScope.Sheet)}
                                className="radio radio-primary"
                            />
                            <span>Current Sheet only</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input
                                type="radio"
                                name="clearScope"
                                value={BoqDeletionScope.Building}
                                checked={clearScope === BoqDeletionScope.Building}
                                onChange={() => setClearScope(BoqDeletionScope.Building)}
                                className="radio radio-primary"
                            />
                            <span>Current Building</span>
                        </label>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            onClick={handleClearVoConfirm}
                            className="btn btn-sm bg-red-500 border border-red-500 text-white hover:bg-red-600 flex-1"
                        >
                            Clear
                        </Button>
                        <Button
                            onClick={() => setShowClearScopeDialog(false)}
                            className="btn btn-sm bg-base-100 border border-base-300 text-base-content hover:bg-base-200 flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default VOTable;
