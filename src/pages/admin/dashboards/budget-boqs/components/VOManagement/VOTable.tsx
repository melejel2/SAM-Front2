
import React, { useState } from 'react';
import { BudgetVO, BudgetVOSheet, BudgetVOItem } from '@/api/services/budget-vo-api';
import { Button, Input } from '@/components/daisyui';
import { Icon } from '@iconify/react';
import xIcon from '@iconify/icons-lucide/x';
import checkIcon from '@iconify/icons-lucide/check';
import editIcon from '@iconify/icons-lucide/edit';
import trashIcon from '@iconify/icons-lucide/trash';
import { saveBudgetVo } from '@/api/services/budget-vo-api';
import { useAuth } from '@/contexts/auth';
import useToast from '@/hooks/use-toast';
import { cn } from '@/helpers/utils/cn';

interface VOTableProps {
  vo: BudgetVO;
  onClose: () => void;
  onSave: () => void; // To refresh data in VODialog
  buildingName: string;
  tradeName?: string;
}

const VOTable: React.FC<VOTableProps> = ({ vo, onClose, onSave, buildingName, tradeName }) => {
  const { getToken } = useAuth();
  const { toaster } = useToast();
  const [loading, setLoading] = useState(false);
  const [editedVO, setEditedVO] = useState<BudgetVO>(JSON.parse(JSON.stringify(vo)));
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [originalVO, setOriginalVO] = useState<BudgetVO | null>(null);
  const [activeSheetId, setActiveSheetId] = useState<number | null>(editedVO.voSheets[0]?.id || null);

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

    try {
      const result = await saveBudgetVo(editedVO, token);
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

  const activeSheet = editedVO.voSheets.find(s => s.id === activeSheetId);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[70]">
      <div className="bg-base-100 rounded-lg p-6 max-w-7xl w-full mx-4 max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold">Edit VO Level {vo.voLevel}</h3>
            <p className="text-sm text-base-content/70">
              {buildingName} {tradeName ? `• ${tradeName}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-ghost">
            <Icon icon={xIcon} className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {activeSheet ? (
            <div key={activeSheet.id} className="mb-6">
              <h4 className="font-semibold text-lg mb-2 p-2 bg-base-200 rounded">{activeSheet.sheetName || "Sheet"}</h4>
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
                              <Input
                                className="input-xs w-full"
                                value={item.unite || ''}
                                onChange={(e) => handleItemChange(editedVO.voSheets.findIndex(s => s.id === activeSheetId), itemIndex, 'unite', e.target.value)}
                              />
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
                                    setOriginalVO(JSON.parse(JSON.stringify(editedVO)));
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
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="btn-primary" onClick={handleSaveChanges} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
            {!loading && <Icon icon={checkIcon} className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VOTable;
