import React, { useState, useEffect, useRef, memo } from 'react';
import { Button } from "@/components/daisyui";
import { Icon } from "@iconify/react";
import plusIcon from "@iconify/icons-lucide/plus";
import editIcon from "@iconify/icons-lucide/edit";
import eyeIcon from "@iconify/icons-lucide/eye";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import uploadIcon from "@iconify/icons-lucide/upload";
import trashIcon from "@iconify/icons-lucide/trash";
import checkIcon from "@iconify/icons-lucide/check";
import xIcon from "@iconify/icons-lucide/x";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import { formatCurrency } from "@/utils/formatters";
import { 
  getBudgetVosByBuilding, 
  getVoLevelData,
  uploadBudgetVo,
  type VosSummary,
  type BudgetVO
} from "@/api/services/budget-vo-api";
import VOTable from './VOTable';

interface VODialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  buildingId: number;
  buildingName: string;
  tradeName?: string;
  sheetId?: number;
  projectLevel?: number;
}

const VODialog: React.FC<VODialogProps> = ({
  isOpen,
  onClose,
  projectId,
  buildingId,
  buildingName,
  tradeName,
  sheetId,
  projectLevel = 0
}) => {
  const { getToken } = useAuth();
  const { toaster } = useToast();
  
  const [vos, setVos] = useState<VosSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingVO, setEditingVO] = useState<BudgetVO | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [detailedVO, setDetailedVO] = useState<BudgetVO | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [voFile, setVoFile] = useState<File | null>(null);
  const [voLevel, setVoLevel] = useState(1);
  const [isFromBudgetBoq, setIsFromBudgetBoq] = useState(true);

  // Number formatting function
  const formatQuantity = (quantity: number) => {
    if (!quantity || isNaN(quantity) || quantity === 0) return '-';
    
    // Check if the number has meaningful decimals
    const hasDecimals = quantity % 1 !== 0;
    
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: hasDecimals ? 1 : 0,
      maximumFractionDigits: hasDecimals ? 3 : 0
    }).format(quantity);
  };
  
  useEffect(() => {
    if (isOpen && buildingId) {
      loadVOs();
    }
  }, [isOpen, buildingId]);
  
  const loadVOs = async () => {
    const token = getToken();
    if (!token) return;
    
    setLoading(true);
    try {
      const voData = await getBudgetVosByBuilding(buildingId, null, token);
      setVos(voData);
    } catch (error) {
      console.error("Error loading VOs:", error);
      // Don't show error toast for 404s - just means no VOs exist yet
      if (error && (error as any).status !== 404) {
        toaster.error("Failed to load VOs");
      }
      setVos([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleDetails = async (level: number) => {
    const currentLevel = selectedLevel;
    setSelectedLevel(prev => prev === level ? null : level);

    if (currentLevel === level) { // closing details
        setDetailedVO(null);
        return;
    }

    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
        const voData = await getVoLevelData(buildingId, level, token);
        if (voData && voData.length > 0) {
            setDetailedVO(voData[0]);
        }
        else {
            setDetailedVO(null);
            toaster.error(`Could not find details for VO Level ${level}`);
        }
    } catch (error) {
        console.error(`Error loading details for VO Level ${level}:`, error);
        toaster.error(`Failed to load details for VO Level ${level}`);
        setDetailedVO(null);
    } finally {
        setLoading(false);
    }
  };

  const handleEdit = async (vo: VosSummary) => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
        const voData = await getVoLevelData(buildingId, vo.voLevel, token);
        if (voData && voData.length > 0) {
            setEditingVO(voData[0]);
        } else {
            toaster.error(`Could not load VO Level ${vo.voLevel} for editing.`);
        }
    } catch (error) {
        console.error(`Error loading VO for editing (Level ${vo.voLevel}):`, error);
        toaster.error(`Failed to load VO for editing.`);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateVO = async () => {
    const token = getToken();
    if (!token || !sheetId) {
      toaster.error("Please select a trade/sheet first");
      return;
    }
    
    setLoading(true);
    try {
      const uploadRequest = {
        projectId,
        buildingId,
        sheetId,
        voLevel,
        isFromBudgetBoq,
        excelFile: voFile || undefined
      };
      
      const result = await uploadBudgetVo(uploadRequest, token);
      
      if (result.isSuccess) {
        toaster.success("VO created successfully");
        setShowCreateForm(false);
        setVoFile(null);
        loadVOs();
      } else {
        toaster.error(result.error?.message || "Failed to create VO");
      }
    } catch (error) {
      console.error("Error creating VO:", error);
      toaster.error("Failed to create VO");
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVoFile(e.target.files[0]);
      setIsFromBudgetBoq(false);
    }
  };
  
  const handleClearFile = () => {
    setVoFile(null);
    setIsFromBudgetBoq(true);
  };
  
  const renderVOLevel = (vo: VosSummary) => {
    return (
      <div key={vo.voLevel} className="border border-base-300 rounded-lg p-4 mb-3">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h4 className="font-semibold text-base-content">
              VO Level {vo.voLevel}
            </h4>
            <p className="text-sm text-base-content/70">
              {vo.itemsCount} items • Total: {formatCurrency(vo.totalPrice)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(vo)}
            >
              <Icon icon={editIcon} className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggleDetails(vo.voLevel)}
            >
              <Icon icon={eyeIcon} className="w-4 h-4 mr-1" />
              {selectedLevel === vo.voLevel ? "Hide Details" : "View Details"}
            </Button>
          </div>
        </div>
        
        {selectedLevel === vo.voLevel && detailedVO && (
          <div className="mt-3 bg-base-200 rounded p-3">
            {detailedVO.voSheets.map((sheet) => (
              <div key={sheet.id} className="mb-3">
                <h5 className="font-medium text-sm mb-2">{sheet.sheetName || "Sheet"}</h5>
                <div className="overflow-x-auto">
                  <table className="table table-xs">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Description</th>
                        <th>Unit</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.voItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.no}</td>
                          <td>{item.key}</td>
                          <td>{item.unite}</td>
                          <td>{formatQuantity(item.qte)}</td>
                          <td>{formatCurrency(item.pu)}</td>
                          <td>{formatCurrency(item.qte * item.pu)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Main VO List Dialog */}
      <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-base-100 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold">Variation Orders (VOs)</h3>
              <p className="text-sm text-base-content/70">
                {buildingName} {tradeName ? `• ${tradeName}` : ""}
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-sm btn-ghost"
            >
              <Icon icon={xIcon} className="w-4 h-4" />
            </button>
          </div>
          
                    {/* Add New VO Button - Always show */}
          <div className="mb-4 flex items-center gap-2">
            <Button
              size="sm"
              className="btn-primary"
              onClick={() => {
                if (!sheetId) {
                  toaster.error("Please select a trade/sheet first");
                  return;
                }
                setVoLevel(projectLevel + 1);
                setShowCreateForm(true);
              }}
            >
              <Icon icon={plusIcon} className="w-4 h-4 mr-1" />
              Add New VO
            </Button>
            {!sheetId && (
              <span className="ml-2 text-sm text-warning">
                (Select a trade/sheet to enable)
              </span>
            )}
          </div>
          
          {/* VO List */}
          {loading ? (
            <div className="text-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : vos.length > 0 ? (
            <div>
              {vos.map(renderVOLevel)}
            </div>
          ) : (
            <div className="text-center py-12 bg-base-200 rounded-lg">
              <Icon icon={fileTextIcon} className="w-16 h-16 mx-auto mb-3 text-base-content/30" />
              <p className="text-base-content/70 mb-1">No VOs created yet</p>
              <p className="text-sm text-base-content/50 mb-4">
                {sheetId 
                  ? "Click 'Add New VO' button above to create your first VO"
                  : `Trade "${tradeName}" selected but sheet ID not found. Please ensure the trade has BOQ items.`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      
      
      {editingVO && (
        <VOTable
          vo={editingVO}
          onClose={() => setEditingVO(null)}
          onSave={() => {
            loadVOs();
            setEditingVO(null);
          }}
          buildingName={buildingName}
          tradeName={tradeName}
          projectId={projectId}
          buildingId={buildingId}
          sheetId={sheetId}
          projectLevel={projectLevel}
        />
      )}
      
      {/* Create VO Form Dialog */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-base-100 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Create New VO</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn btn-sm btn-ghost"
              >
                <Icon icon={xIcon} className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">VO Level</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={voLevel}
                  onChange={(e) => setVoLevel(Number(e.target.value))}
                  min={1}
                  max={vos.length + 2}
                />
                <label className="label">
                  <span className="label-text-alt">
                    Current VOs: {vos.length}
                  </span>
                </label>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">VO Source</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm"
                      checked={isFromBudgetBoq}
                      onChange={() => {
                        setIsFromBudgetBoq(true);
                        setVoFile(null);
                      }}
                    />
                    <span className="text-sm">Copy from current BOQ</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      className="radio radio-sm"
                      checked={!isFromBudgetBoq}
                      onChange={() => setIsFromBudgetBoq(false)}
                    />
                    <span className="text-sm">Upload Excel file</span>
                  </label>
                </div>
              </div>
              
              {!isFromBudgetBoq && (
                <div>
                  <label className="label">
                    <span className="label-text">Excel File</span>
                  </label>
                  {voFile ? (
                    <div className="flex items-center gap-2 p-2 bg-base-200 rounded">
                      <Icon icon={fileTextIcon} className="w-4 h-4" />
                      <span className="text-sm flex-1">{voFile.name}</span>
                      <button
                        onClick={handleClearFile}
                        className="btn btn-xs btn-ghost"
                      >
                        <Icon icon={trashIcon} className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center w-full h-32 px-4 transition bg-base-200 border-2 border-base-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none">
                      <div className="flex flex-col items-center space-y-2">
                        <Icon icon={uploadIcon} className="w-8 h-8 text-base-content/50" />
                        <span className="text-sm text-base-content/70">
                          Click to upload Excel file
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              )}
              
              <div className="bg-info/10 p-3 rounded">
                <p className="text-sm text-info">
                  {isFromBudgetBoq 
                    ? "The VO will be created by copying the current BOQ items for this trade."
                    : "Upload an Excel file with VO items for this trade."
                  }
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleCreateVO}
                disabled={loading || (!isFromBudgetBoq && !voFile)}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon icon={checkIcon} className="w-4 h-4 mr-1" />
                    Create VO
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default memo(VODialog);