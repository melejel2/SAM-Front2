import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@iconify/react';
import searchIcon from '@iconify/icons-lucide/search';
import xIcon from '@iconify/icons-lucide/x';
import { Loader } from '@/components/Loader';

interface CostCodeLibrary {
  id: number;
  en?: string;
  fr?: string;
  code: string;
  bold?: boolean;
  color?: string;
  created: string;
}

interface CostCodeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (costCode: CostCodeLibrary) => void;
  selectedCostCode?: CostCodeLibrary | null;
  costCodes: CostCodeLibrary[];
  loading?: boolean;
}

const CostCodeSelectionModal: React.FC<CostCodeSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedCostCode,
  costCodes,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedCostCode, setTempSelectedCostCode] = useState<CostCodeLibrary | null>(null);

  // Reset selection when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTempSelectedCostCode(selectedCostCode || null);
      setSearchTerm('');
    }
  }, [isOpen, selectedCostCode]);

  // Filter cost codes based on search term
  const filteredCostCodes = useMemo(() => {
    if (!searchTerm) return costCodes;
    
    const query = searchTerm.toLowerCase();
    return costCodes.filter(code => 
      code.code?.toLowerCase().includes(query) ||
      code.en?.toLowerCase().includes(query) ||
      code.fr?.toLowerCase().includes(query)
    );
  }, [costCodes, searchTerm]);

  // Handle row click selection
  const handleRowClick = useCallback((costCode: CostCodeLibrary) => {
    setTempSelectedCostCode(costCode);
  }, []);

  // Handle double-click selection (immediate confirmation)
  const handleDoubleClick = useCallback((costCode: CostCodeLibrary) => {
    onSelect(costCode);
    onClose();
  }, [onSelect, onClose]);

  // Handle confirm selection
  const handleConfirm = useCallback(() => {
    if (tempSelectedCostCode) {
      onSelect(tempSelectedCostCode);
      onClose();
    }
  }, [tempSelectedCostCode, onSelect, onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && tempSelectedCostCode) {
      handleConfirm();
    }
  }, [onClose, tempSelectedCostCode, handleConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur effect */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-base-100 rounded-xl shadow-xl border border-base-300 w-full max-w-4xl max-h-[80vh] flex flex-col mx-4"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <div className="w-5 h-5 bg-primary/20 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-primary">CC</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-base-content">Select Cost Code</h3>
              <p className="text-sm text-base-content/70">Choose a cost code for the BOQ item</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <Icon icon={xIcon} className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-base-300">
          <div className="relative">
            <Icon 
              icon={searchIcon} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/40" 
            />
            <input
              type="text"
              placeholder="Search cost codes by code, EN, or FR description..."
              className="input input-bordered w-full pl-10 focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <Loader
              icon="hash"
              subtitle="Loading: Cost Codes"
              description="Fetching cost code library..."
              height="auto"
              minHeight="200px"
            />
          ) : (
            <div className="overflow-auto h-full">
              <table className="table table-zebra table-pin-rows">
                <thead>
                  <tr className="bg-base-200">
                    <th className="text-center font-medium text-base-content/70">Code</th>
                    <th className="text-left font-medium text-base-content/70">EN</th>
                    <th className="text-left font-medium text-base-content/70">FR</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCostCodes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-base-content/50">
                        {searchTerm ? 'No cost codes match your search' : 'No cost codes available'}
                      </td>
                    </tr>
                  ) : (
                    filteredCostCodes.map((costCode) => (
                      <tr
                        key={costCode.id}
                        className={`cursor-pointer hover:bg-base-200 transition-colors ${
                          tempSelectedCostCode?.id === costCode.id 
                            ? 'bg-primary/10 border-l-4 border-l-primary' 
                            : ''
                        }`}
                        onClick={() => handleRowClick(costCode)}
                        onDoubleClick={() => handleDoubleClick(costCode)}
                      >
                        <td className="text-center">
                          <span className={`${costCode.bold ? 'font-bold' : ''}`}>
                            {costCode.code}
                          </span>
                        </td>
                        <td className="text-left">
                          <span className={`${costCode.bold ? 'font-bold' : ''}`}>
                            {costCode.en || '-'}
                          </span>
                        </td>
                        <td className="text-left">
                          <span className={`${costCode.bold ? 'font-bold' : ''}`}>
                            {costCode.fr || '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-base-300 bg-base-50">
          <div className="text-sm text-base-content/60">
            {tempSelectedCostCode ? (
              <span>
                Selected: <strong>{tempSelectedCostCode.code}</strong>
                {tempSelectedCostCode.en && <span> - {tempSelectedCostCode.en}</span>}
              </span>
            ) : (
              'Double-click a row to select immediately, or click and use the Choose button'
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!tempSelectedCostCode}
              className="btn btn-primary"
            >
              Choose
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostCodeSelectionModal;