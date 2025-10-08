
import React, { useState } from 'react';
import { BudgetVO, BudgetVOSheet, BudgetVOItem } from '@/api/services/budget-vo-api';
import { Button, Input } from '@/components/daisyui';
import { Icon } from '@iconify/react';
import xIcon from '@iconify/icons-lucide/x';
import checkIcon from '@iconify/icons-lucide/check';
import { useAuth } from '@/contexts/auth';
import useToast from '@/hooks/use-toast';

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

  const handleItemChange = (sheetIndex: number, itemIndex: number, field: keyof BudgetVOItem, value: any) => {
    const newVO = { ...editedVO };
    const item = newVO.voSheets[sheetIndex].voItems[itemIndex];
    (item[field] as any) = value;
    setEditedVO(newVO);
  };

  const handleSaveChanges = async () => {
    // TODO: Implement API call to save changes
    console.log("Saving changes:", editedVO);
    toaster.success("Changes saved successfully (mock)");
    onSave();
    onClose();
  };

  const formatCurrency = (amount: number) => {
    if (!amount || isNaN(amount) || amount === 0) return '-';
    const hasDecimals = amount % 1 !== 0;
    return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: hasDecimals ? 2 : 0, maximumFractionDigits: 2 }).format(amount);
  };

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
          {editedVO.voSheets.map((sheet, sheetIndex) => (
            <div key={sheet.id} className="mb-6">
              <h4 className="font-semibold text-lg mb-2 p-2 bg-base-200 rounded">{sheet.sheetName || "Sheet"}</h4>
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
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.voItems.map((item, itemIndex) => {
                      const total = (item.qte || 0) * (item.pu || 0);
                      return (
                        <tr key={item.id}>
                          <td>{item.no}</td>
                          <td>
                            <Input
                              className="input-xs w-full"
                              value={item.key || ''}
                              onChange={(e) => handleItemChange(sheetIndex, itemIndex, 'key', e.target.value)}
                            />
                          </td>
                          <td>
                            <Input
                              className="input-xs w-full"
                              value={item.unite || ''}
                              onChange={(e) => handleItemChange(sheetIndex, itemIndex, 'unite', e.target.value)}
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              className="input-xs w-full"
                              value={item.qte || 0}
                              onChange={(e) => handleItemChange(sheetIndex, itemIndex, 'qte', parseFloat(e.target.value))}
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              className="input-xs w-full"
                              value={item.pu || 0}
                              onChange={(e) => handleItemChange(sheetIndex, itemIndex, 'pu', parseFloat(e.target.value))}
                            />
                          </td>
                          <td>{formatCurrency(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
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
