import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { useIpcEdit } from "@/hooks/use-ipc-edit";
import { Loader } from "@/components/Loader";
import PenaltyForm from "../components/PenaltyForm";
import IpcSummary from "../components/IpcSummary";

interface IPCEditProps {}

const IPCEdit: React.FC<IPCEditProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toaster } = useToast();
  const { user } = useAuth();
  
  const {
    loading,
    saving,
    error,
    ipcData,
    summaryData,
    buildings,
    showPenaltyForm,
    penaltyData,
    loadIpcForEdit,
    updateIpc,
    openPenaltyForm,
    closePenaltyForm,
    updatePenaltyData,
    clearData
  } = useIpcEdit();

  const [activeTab, setActiveTab] = useState<'details' | 'summary' | 'boq'>('details');
  const [formData, setFormData] = useState({
    ipcNumber: '',
    dateIpc: '',
    fromDate: '',
    toDate: '',
    retention: 0,
    advance: 0,
    remarks: ''
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
        ipcNumber: ipcData.ipcNumber || '',
        dateIpc: ipcData.dateIpc || '',
        fromDate: ipcData.fromDate || '',
        toDate: ipcData.toDate || '',
        retention: ipcData.retention || 0,
        advance: ipcData.advance || 0,
        remarks: ipcData.remarks || ''
      });
    }
  }, [ipcData]);

  const handleSave = async () => {
    if (!ipcData) return;

    try {
      const success = await updateIpc({
        id: ipcData.id,
        contractsDatasetId: ipcData.contractsDatasetId,
        ...formData,
        buildings: buildings
      });

      if (success) {
        toaster.success("IPC updated successfully");
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
              Edit IPC {ipcData.ipcNumber || `#${ipcData.id}`}
            </h1>
            <p className="text-sm text-base-content/70">
              Contract: {ipcData.contractsDataset?.contractNumber || 'N/A'} | 
              Subcontractor: {ipcData.contractsDataset?.subcontractor?.companyName || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openPenaltyForm(ipcData.penalty || 0, ipcData.previousPenalty || 0)}
            className="btn btn-sm bg-red-600 text-white hover:bg-red-700"
          >
            <span className="iconify lucide--alert-triangle size-4"></span>
            Manage Penalties
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-sm btn-primary"
          >
            {saving && <span className="loading loading-spinner loading-sm"></span>}
            Save Changes
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

      {/* Tabs */}
      <div className="tabs tabs-lifted tabs-lg mb-6">
        <button 
          className={`tab tab-lifted ${activeTab === 'details' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <span className="iconify lucide--edit size-4 mr-2"></span>
          IPC Details
        </button>
        <button 
          className={`tab tab-lifted ${activeTab === 'summary' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <span className="iconify lucide--calculator size-4 mr-2"></span>
          Financial Summary
        </button>
        <button 
          className={`tab tab-lifted ${activeTab === 'boq' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('boq')}
        >
          <span className="iconify lucide--table size-4 mr-2"></span>
          BOQ Progress
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
                      <span className="font-medium">{ipcData.ipcNumber || 'N/A'}</span>
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
      </div>

      {/* Penalty Form Modal */}
      <PenaltyForm
        isOpen={showPenaltyForm}
        onClose={closePenaltyForm}
        onSave={handlePenaltySave}
        initialData={penaltyData}
        loading={saving}
      />
    </div>
  );
};

export default IPCEdit;