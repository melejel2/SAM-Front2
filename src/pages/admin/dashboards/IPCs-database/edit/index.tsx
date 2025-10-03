import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { useIpcEdit } from "@/hooks/use-ipc-edit";
import { Loader } from "@/components/Loader";
import PenaltyForm from "../components/PenaltyForm";
import IpcSummary from "../components/IpcSummary";
import { ipcApiService } from "@/api/services/ipc-api";
import PDFViewer from "@/components/ExcelPreview/PDFViewer";
import SAMTable from "@/components/Table";
import type { SaveIPCVM, ContractBuildingsVM } from "@/types/ipc";

interface IPCEditProps {}

const IPCEdit: React.FC<IPCEditProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toaster } = useToast();
  const { authState, getToken } = useAuth();
  const token = getToken();
  
  const {
    loading,
    saving,
    error,
    ipcData,
    summaryData,
    buildings,
    setBuildings,
    showPenaltyForm,
    penaltyData,
    loadIpcForEdit,
    updateIpc,
    openPenaltyForm,
    closePenaltyForm,
    updatePenaltyData,
    clearData
  } = useIpcEdit();

  const [activeTab, setActiveTab] = useState<'details' | 'boq' | 'financial' | 'documents' | 'summary'>('details');
  const [expandedBuildings, setExpandedBuildings] = useState<Set<number>>(new Set());
  const [editingQuantities, setEditingQuantities] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ blob: Blob; fileName: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [generatingIpc, setGeneratingIpc] = useState(false);
  const [calculatedTotals, setCalculatedTotals] = useState({ totalAmount: 0, actualAmount: 0, retentionAmount: 0, advanceDeduction: 0, netPayment: 0 });
  const [formData, setFormData] = useState({
    ipcNumber: '',
    dateIpc: '',
    fromDate: '',
    toDate: '',
    retention: 0,
    advance: 0,
    remarks: '',
    retentionPercentage: 0,
    advancePaymentPercentage: 0,
    penalty: 0,
    previousPenalty: 0
  });

  // Load IPC data on mount
  useEffect(() => {
    if (id) {
      const ipcId = parseInt(id);
      if (!isNaN(ipcId)) {
        loadIpcForEdit(ipcId);
      } else {
        toaster.error("Invalid IPC ID");
        navigate('/admin/dashboards/IPCs-database');
      }
    }
    
    return () => {
      clearData();
    };
  }, [id, loadIpcForEdit, toaster, navigate, clearData]);

  // Update form data when IPC loads
  useEffect(() => {
    if (ipcData) {
      setFormData({
        ipcNumber: ipcData.number?.toString() || '',
        dateIpc: ipcData.dateIpc || '',
        fromDate: ipcData.fromDate || '',
        toDate: ipcData.toDate || '',
        retention: ipcData.retention || ipcData.retentionAmount || 0,
        advance: ipcData.advance || ipcData.advancePaymentAmount || 0,
        remarks: ipcData.remarks || '',
        retentionPercentage: ipcData.retentionPercentage || 0,
        advancePaymentPercentage: ipcData.advancePaymentPercentage || 0,
        penalty: ipcData.penalty || 0,
        previousPenalty: ipcData.previousPenalty || 0
      });
    }
  }, [ipcData]);

  // Calculate totals when buildings or form data changes
  useEffect(() => {
    const totalIPCAmount = buildings.reduce((sum, building) => 
      sum + building.boqs.reduce((boqSum, boq) => boqSum + (boq.actualAmount || 0), 0), 0
    );
    
    const retentionAmount = (totalIPCAmount * formData.retentionPercentage) / 100;
    const advanceDeduction = (totalIPCAmount * formData.advancePaymentPercentage) / 100;
    const netPayment = totalIPCAmount - retentionAmount - advanceDeduction - formData.penalty;
    
    setCalculatedTotals({
      totalAmount: totalIPCAmount,
      actualAmount: totalIPCAmount,
      retentionAmount,
      advanceDeduction,
      netPayment
    });
  }, [buildings, formData.retentionPercentage, formData.advancePaymentPercentage, formData.penalty]);

  const handleSave = async () => {
    if (!ipcData) return;

    try {
      const success = await updateIpc({
        ...ipcData, // Spread all existing IPC data
        number: Number(formData.ipcNumber) || ipcData.number,
        dateIpc: formData.dateIpc,
        fromDate: formData.fromDate,
        toDate: formData.toDate,
        retention: formData.retention,
        advance: formData.advance,
        remarks: formData.remarks,
        retentionPercentage: formData.retentionPercentage,
        advancePaymentPercentage: formData.advancePaymentPercentage,
        penalty: formData.penalty,
        previousPenalty: formData.previousPenalty,
        buildings: buildings
      });

      if (success) {
        toaster.success("IPC updated successfully");
        // Reload data to reflect changes
        loadIpcForEdit(parseInt(id!));
      } else {
        toaster.error("Failed to update IPC");
      }
    } catch (err) {
      toaster.error("An error occurred while saving");
    }
  };

  const handlePenaltySave = (penaltyFormData: typeof penaltyData) => {
    updatePenaltyData(penaltyFormData);
    closePenaltyForm();
    toaster.success("Penalty information updated");
  };

  const handleBack = () => {
    navigate('/admin/dashboards/IPCs-database');
  };

  // Enhanced functionality for BOQ editing
  const handleBOQQuantityChange = (buildingId: number, boqId: number, actualQte: number) => {
    setBuildings(prevBuildings => 
      prevBuildings.map(building => {
        if (building.id === buildingId) {
          return {
            ...building,
            boqs: building.boqs.map(boq => {
              if (boq.id === boqId) {
                const actualAmount = actualQte * boq.unitPrice;
                const newCumulQte = (boq.precedQte || 0) + actualQte;
                const newCumulAmount = newCumulQte * boq.unitPrice;
                const newCumulPercent = boq.qte === 0 ? 0 : (newCumulQte / boq.qte) * 100;
                
                return {
                  ...boq,
                  actualQte,
                  actualAmount,
                  cumulQte: newCumulQte,
                  cumulAmount: newCumulAmount,
                  cumulPercent: newCumulPercent
                };
              }
              return boq;
            })
          };
        }
        return building;
      })
    );
  };

  const toggleBuildingExpansion = (buildingId: number) => {
    const newExpanded = new Set(expandedBuildings);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
    }
    setExpandedBuildings(newExpanded);
  };

  // Document generation functions
  const handlePreviewIpc = async () => {
    if (!ipcData || !id) return;
    
    setLoadingPreview(true);
    try {
      const result = await ipcApiService.exportIpcPdf(parseInt(id), token ?? "");
      
      if (result.success && result.blob) {
        setPreviewData({
          blob: result.blob,
          fileName: `IPC_${ipcData.number || id}.pdf`
        });
        setShowPreview(true);
      } else {
        toaster.error("Failed to generate IPC preview");
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExportPDF = async () => {
    if (!id || exportingPDF) return;
    
    setExportingPDF(true);
    try {
      const result = await ipcApiService.exportIpcPdf(parseInt(id), token ?? "");
      
      if (result.success && result.blob) {
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `IPC_${ipcData?.number || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toaster.success("IPC exported as PDF successfully!");
      } else {
        toaster.error("Failed to export IPC as PDF");
      }
    } catch (error) {
      toaster.error("PDF Export error: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    if (!id || exportingExcel) return;
    
    setExportingExcel(true);
    try {
      const result = await ipcApiService.exportIpcExcel(parseInt(id), token ?? "");
      
      if (result.success && result.blob) {
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `IPC_${ipcData?.number || id}.xlsx`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toaster.success("IPC exported as Excel successfully!");
      } else {
        toaster.error("Failed to export IPC as Excel");
      }
    } catch (error) {
      toaster.error("Excel Export error: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportZip = async () => {
    if (!id || exportingZip) return;
    
    setExportingZip(true);
    try {
      const result = await ipcApiService.exportIpcZip(parseInt(id), token ?? "");
      
      if (result.success && result.blob) {
        const url = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `IPC_${ipcData?.number || id}_Documents.zip`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toaster.success("IPC documents exported as ZIP successfully!");
      } else {
        toaster.error("Failed to export IPC documents as ZIP");
      }
    } catch (error) {
      toaster.error("ZIP Export error: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setExportingZip(false);
    }
  };

  const handleGenerateIpc = async () => {
    if (!id) return;
    
    setGeneratingIpc(true);
    try {
      const result = await ipcApiService.generateIpc(parseInt(id), token ?? "");
      if (result.success) {
        toaster.success("IPC generated successfully!");
        // Reload IPC data to get updated status
        loadIpcForEdit(parseInt(id));
      }
    } finally {
      setGeneratingIpc(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  if (error || !ipcData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <span className="iconify lucide--alert-circle text-error size-12"></span>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-base-content mb-2">Error Loading IPC</h2>
          <p className="text-base-content/70 mb-4">{error || "IPC not found"}</p>
          <button onClick={handleBack} className="btn btn-primary">
            Back to IPC Database
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className="btn btn-sm btn-ghost"
          >
            <span className="iconify lucide--arrow-left size-4"></span>
          </button>
          <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
            <span className="iconify lucide--file-edit text-blue-600 dark:text-blue-400 size-5"></span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-base-content">
              Edit IPC {ipcData.number || `#${ipcData.id}`}
            </h1>
            <p className="text-sm text-base-content/70">
              Contract: {ipcData.contractsDataset?.contractNumber || 'N/A'} | 
              Subcontractor: {ipcData.contractsDataset?.subcontractor?.companyName || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreviewIpc}
            disabled={loadingPreview}
            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
          >
            {loadingPreview ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span className="iconify lucide--eye size-4"></span>
                <span>Preview</span>
              </>
            )}
          </button>
          
          <div className="dropdown dropdown-end">
            <button 
              tabIndex={0} 
              className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
              disabled={exportingPDF || exportingExcel || exportingZip}
            >
              {(exportingPDF || exportingExcel || exportingZip) ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <span className="iconify lucide--download size-4"></span>
                  <span>Export</span>
                  <span className="iconify lucide--chevron-down size-3"></span>
                </>
              )}
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a onClick={handleExportPDF}>
                  <span className="iconify lucide--file-text size-4"></span>
                  Export as PDF
                </a>
              </li>
              <li>
                <a onClick={handleExportExcel}>
                  <span className="iconify lucide--file-spreadsheet size-4"></span>
                  Export as Excel
                </a>
              </li>
              <li>
                <a onClick={handleExportZip}>
                  <span className="iconify lucide--archive size-4"></span>
                  Export as ZIP
                </a>
              </li>
            </ul>
          </div>

          <button
            onClick={() => openPenaltyForm(ipcData.penalty || 0, ipcData.previousPenalty || 0)}
            className="btn btn-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
          >
            <span className="iconify lucide--alert-triangle size-4"></span>
            Penalties
          </button>
          
          {ipcData.status === 'Editable' && (
            <button
              onClick={handleGenerateIpc}
              disabled={generatingIpc}
              className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
            >
              {generatingIpc ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span className="iconify lucide--check-circle size-4"></span>
                  <span>Generate</span>
                </>
              )}
            </button>
          )}
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-sm btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span className="iconify lucide--save size-4"></span>
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Financial Summary - Always visible at top */}
      <div className="mb-6">
        <IpcSummary 
          summaryData={summaryData}
          loading={loading}
          className="shadow-sm"
        />
      </div>

      {/* Enhanced Tabs */}
      <div className="tabs tabs-lifted tabs-lg mb-6">
        <button 
          className={`tab tab-lifted ${activeTab === 'details' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <span className="iconify lucide--edit size-4 mr-2"></span>
          IPC Details
        </button>
        <button 
          className={`tab tab-lifted ${activeTab === 'boq' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('boq')}
        >
          <span className="iconify lucide--building size-4 mr-2"></span>
          BOQ Progress
        </button>
        <button 
          className={`tab tab-lifted ${activeTab === 'financial' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          <span className="iconify lucide--calculator size-4 mr-2"></span>
          Financial Calculations
        </button>
        <button 
          className={`tab tab-lifted ${activeTab === 'documents' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          <span className="iconify lucide--file-text size-4 mr-2"></span>
          Documents
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-base-100 rounded-lg p-6 shadow-sm border border-base-300">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* IPC Number */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">IPC Number *</span>
                </label>
                <input
                  type="text"
                  value={formData.ipcNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, ipcNumber: e.target.value }))}
                  className="input input-bordered"
                  placeholder="Enter IPC number"
                />
              </div>

              {/* IPC Date */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">IPC Date *</span>
                </label>
                <input
                  type="date"
                  value={formData.dateIpc}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateIpc: e.target.value }))}
                  className="input input-bordered"
                />
              </div>

              {/* From Date */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Period From</span>
                </label>
                <input
                  type="date"
                  value={formData.fromDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="input input-bordered"
                />
              </div>

              {/* To Date */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Period To</span>
                </label>
                <input
                  type="date"
                  value={formData.toDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, toDate: e.target.value }))}
                  className="input input-bordered"
                />
              </div>

              {/* Retention */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Retention Amount</span>
                </label>
                <input
                  type="number"
                  value={formData.retention}
                  onChange={(e) => setFormData(prev => ({ ...prev, retention: parseFloat(e.target.value) || 0 }))}
                  className="input input-bordered"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>

              {/* Advance */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Advance Payment</span>
                </label>
                <input
                  type="number"
                  value={formData.advance}
                  onChange={(e) => setFormData(prev => ({ ...prev, advance: parseFloat(e.target.value) || 0 }))}
                  className="input input-bordered"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>

            {/* Remarks */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Remarks</span>
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                className="textarea textarea-bordered h-24 resize-none"
                placeholder="Enter any additional remarks or notes for this IPC"
              />
            </div>

            {/* Penalty Information Display */}
            {(ipcData.penalty > 0 || ipcData.previousPenalty > 0) && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-3">
                  <span className="iconify lucide--alert-triangle text-red-600 dark:text-red-400 size-5"></span>
                  <h3 className="font-semibold text-red-600 dark:text-red-400">Penalty Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-red-600/70 dark:text-red-400/70">Previous Penalty:</span>
                    <div className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(ipcData.previousPenalty || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-red-600/70 dark:text-red-400/70">Current Penalty:</span>
                    <div className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(ipcData.penalty || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-red-600/70 dark:text-red-400/70">Penalty Difference:</span>
                    <div className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency((ipcData.penalty || 0) - (ipcData.previousPenalty || 0))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openPenaltyForm(ipcData.penalty || 0, ipcData.previousPenalty || 0)}
                  className="btn btn-sm bg-red-600 text-white hover:bg-red-700 mt-3"
                >
                  <span className="iconify lucide--edit size-4"></span>
                  Modify Penalty
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-base-content mb-2">Detailed Financial Summary</h3>
              <p className="text-base-content/70">Complete breakdown of contract financial status</p>
            </div>
            
            {/* Enhanced Summary Display */}
            <IpcSummary 
              summaryData={summaryData}
              loading={loading}
              className=""
            />
            
            {/* Additional Financial Details */}
            {summaryData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-base-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-base-content mb-3">Payment History</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Total Contract Value:</span>
                      <span className="font-medium">{formatCurrency(summaryData.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Previous Payments:</span>
                      <span className="font-medium text-green-600">{formatCurrency(summaryData.previousPaid)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-base-content/70">Remaining Balance:</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(summaryData.remaining)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-base-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-base-content mb-3">IPC Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">IPC Number:</span>
                      <span className="font-medium">{ipcData.number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Status:</span>
                      <span className="badge badge-primary badge-sm">{ipcData.status || 'Editable'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Last Updated:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'boq' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-base-content mb-2">BOQ Progress Tracking</h3>
              <p className="text-base-content/70">Monitor work progress and quantities for this IPC</p>
            </div>
            
            {buildings.length > 0 ? (
              <div className="space-y-6">
                {buildings.map((building) => (
                  <div key={building.id} className="bg-base-200 p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                        <span className="iconify lucide--building text-purple-600 dark:text-purple-400 size-5"></span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-base-content">{building.buildingName}</h4>
                        <p className="text-sm text-base-content/70">Sheet: {building.sheetName}</p>
                      </div>
                    </div>
                    
                    {building.boqs.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Unit</th>
                              <th>Quantity</th>
                              <th>Unit Price</th>
                              <th>Actual Qty</th>
                              <th>Progress %</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {building.boqs.slice(0, 10).map((boq) => (
                              <tr key={boq.id}>
                                <td className="font-medium">{boq.key || boq.no}</td>
                                <td>{boq.unite}</td>
                                <td>{boq.qte}</td>
                                <td>{formatCurrency(boq.unitPrice)}</td>
                                <td>
                                  <input 
                                    type="number" 
                                    value={boq.actualQte} 
                                    className="input input-xs input-bordered w-20"
                                    step="0.01"
                                    readOnly
                                  />
                                </td>
                                <td>
                                  <div className="text-xs">
                                    {boq.cumulPercent.toFixed(1)}%
                                  </div>
                                </td>
                                <td className="font-medium">{formatCurrency(boq.actualAmount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {building.boqs.length > 10 && (
                          <div className="text-center mt-2">
                            <span className="text-sm text-base-content/50">
                              Showing 10 of {building.boqs.length} items
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <span className="iconify lucide--table text-base-content/30 size-12 mb-2"></span>
                        <p className="text-base-content/50">No BOQ items found for this building</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="iconify lucide--building text-base-content/30 size-16 mb-4"></span>
                <h4 className="text-lg font-semibold text-base-content mb-2">No Buildings Found</h4>
                <p className="text-base-content/70">No building data is available for this IPC</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                <span className="iconify lucide--file-text text-green-600 dark:text-green-400 size-5"></span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-base-content">Documents & Actions</h2>
                <p className="text-sm text-base-content/70">Generate documents, export data, and manage IPC status</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document Generation */}
              <div className="space-y-4">
                <h5 className="font-semibold text-base-content">Generate Documents</h5>
                <div className="space-y-3">
                  <button
                    onClick={handleExportPDF}
                    disabled={exportingPDF || exportingExcel || exportingZip}
                    className="btn btn-sm bg-red-600 text-white hover:bg-red-700 w-full flex items-center gap-2"
                  >
                    {exportingPDF ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Generating PDF...</span>
                      </>
                    ) : (
                      <>
                        <span className="iconify lucide--file-text size-4"></span>
                        <span>Generate PDF</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleExportExcel}
                    disabled={exportingPDF || exportingExcel || exportingZip}
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700 w-full flex items-center gap-2"
                  >
                    {exportingExcel ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Generating Excel...</span>
                      </>
                    ) : (
                      <>
                        <span className="iconify lucide--file-spreadsheet size-4"></span>
                        <span>Generate Excel</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleExportZip}
                    disabled={exportingPDF || exportingExcel || exportingZip}
                    className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 w-full flex items-center gap-2"
                  >
                    {exportingZip ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Generating ZIP...</span>
                      </>
                    ) : (
                      <>
                        <span className="iconify lucide--archive size-4"></span>
                        <span>Generate ZIP Package</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* IPC Actions */}
              <div className="space-y-4">
                <h5 className="font-semibold text-base-content">IPC Actions</h5>
                <div className="space-y-3">
                  <button
                    onClick={handlePreviewIpc}
                    disabled={loadingPreview}
                    className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 w-full flex items-center gap-2"
                  >
                    {loadingPreview ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        <span>Loading Preview...</span>
                      </>
                    ) : (
                      <>
                        <span className="iconify lucide--eye size-4"></span>
                        <span>Preview IPC</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => navigate(`/admin/dashboards/IPCs-database/details/${id}`)}
                    className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 w-full flex items-center gap-2"
                  >
                    <span className="iconify lucide--info size-4"></span>
                    <span>View Details</span>
                  </button>
                  
                  {ipcData.status === 'Editable' && (
                    <button
                      onClick={handleGenerateIpc}
                      disabled={generatingIpc}
                      className="btn btn-sm bg-green-600 text-white hover:bg-green-700 w-full flex items-center gap-2"
                    >
                      {generatingIpc ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span className="iconify lucide--check-circle size-4"></span>
                          <span>Generate IPC</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Status Information */}
            <div className="divider"></div>
            <div className="space-y-4">
              <h5 className="font-semibold text-base-content">IPC Status Information</h5>
              <div className="bg-base-200 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-base-content/70 text-sm">Current Status:</span>
                    <p className="font-semibold mt-1">
                      <span className={`badge badge-sm ${
                        ipcData.status === 'Editable' ? 'badge-warning' :
                        ipcData.status === 'PendingApproval' ? 'badge-info' :
                        ipcData.status === 'Issued' ? 'badge-success' :
                        'badge-neutral'
                      }`}>
                        {ipcData.status || 'Editable'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-base-content/70 text-sm">Generated:</span>
                    <p className="font-semibold mt-1">
                      {ipcData.isGenerated ? (
                        <span className="badge badge-sm badge-success">Yes</span>
                      ) : (
                        <span className="badge badge-sm badge-warning">No</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-base-content/70 text-sm">IPC Type:</span>
                    <p className="font-semibold mt-1">
                      <span className={`badge badge-sm ${
                        ipcData.type?.includes('interim') || ipcData.type?.includes('Interim') ? 'badge-primary' :
                        ipcData.type?.includes('final') || ipcData.type?.includes('Final') ? 'badge-success' :
                        ipcData.type?.includes('retention') || ipcData.type?.includes('Retention') ? 'badge-warning' :
                        ipcData.type?.includes('advance') || ipcData.type?.includes('Advance') ? 'badge-info' :
                        'badge-neutral'
                      }`}>
                        {ipcData.type || 'Not Set'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-base-content/70 text-sm">Contract Activated:</span>
                    <p className="font-semibold mt-1">
                      {ipcData.contractActivated ? (
                        <span className="badge badge-sm badge-success">Active</span>
                      ) : (
                        <span className="badge badge-sm badge-neutral">Inactive</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Penalty Form Modal */}
      <PenaltyForm
        isOpen={showPenaltyForm}
        onClose={closePenaltyForm}
        onSave={handlePenaltySave}
        initialData={penaltyData}
        loading={saving}
      />

      {/* Preview Modal */}
      {showPreview && previewData && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-7xl h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">IPC Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-ghost btn-sm"
              >
                <span className="iconify lucide--x size-5"></span>
              </button>
            </div>
            <div className="h-[calc(100%-60px)]">
              <PDFViewer
                fileBlob={previewData.blob}
                fileName={previewData.fileName}
              />
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowPreview(false)}>close</button>
          </form>
        </dialog>
      )}
    </div>

  );
};

export default IPCEdit;