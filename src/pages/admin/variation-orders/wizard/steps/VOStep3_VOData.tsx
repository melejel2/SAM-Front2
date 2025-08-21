import React, { useState } from "react";
import { useVOWizardContext } from "../context/VOWizardContext";
import { FilePond, registerPlugin } from "react-filepond";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import "filepond/dist/filepond.min.css";

registerPlugin(FilePondPluginFileValidateType);

export const VOStep3_VOData: React.FC = () => {
    const { formData, setFormData } = useVOWizardContext();
    const [uploadFiles, setUploadFiles] = useState<File[]>([]);
    const [manualItems, setManualItems] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');

    const handleFileUpload = (files: File[]) => {
        setUploadFiles(files);
        if (files.length > 0) {
            setFormData({ uploadFile: files[0] });
        } else {
            setFormData({ uploadFile: undefined });
        }
    };

    const addManualItem = () => {
        const newItem = {
            id: Date.now(),
            description: '',
            quantity: 0,
            unitPrice: 0,
            unit: '',
            total: 0
        };
        const updated = [...manualItems, newItem];
        setManualItems(updated);
        setFormData({ voItems: updated });
    };

    const updateManualItem = (index: number, field: string, value: any) => {
        const updated = [...manualItems];
        updated[index] = { ...updated[index], [field]: value };
        
        // Recalculate total for this item
        if (field === 'quantity' || field === 'unitPrice') {
            updated[index].total = updated[index].quantity * updated[index].unitPrice;
        }
        
        setManualItems(updated);
        setFormData({ voItems: updated });
    };

    const removeManualItem = (index: number) => {
        const updated = manualItems.filter((_, i) => i !== index);
        setManualItems(updated);
        setFormData({ voItems: updated });
    };

    const totalAmount = manualItems.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-base-content mb-2">
                    VO Data Entry
                </h2>
                <p className="text-sm text-base-content/70 mb-6">
                    Upload an Excel file with VO items or enter them manually
                </p>
            </div>

            {/* Tab Selection */}
            <div className="tabs tabs-bordered">
                <button 
                    className={`tab ${activeTab === 'upload' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('upload')}
                >
                    <span className="iconify lucide--upload mr-2"></span>
                    File Upload
                </button>
                <button 
                    className={`tab ${activeTab === 'manual' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('manual')}
                >
                    <span className="iconify lucide--edit mr-2"></span>
                    Manual Entry
                </button>
            </div>

            {/* File Upload Tab */}
            {activeTab === 'upload' && (
                <div className="space-y-4">
                    <div className="alert alert-info">
                        <span className="iconify lucide--info size-5"></span>
                        <div>
                            <div className="font-bold">Excel File Requirements</div>
                            <div className="text-sm">
                                Upload an Excel file (.xlsx, .xls) containing VO items with columns: Description, Quantity, Unit Price, Unit
                            </div>
                        </div>
                    </div>

                    <div className="filepond-wrapper">
                        <FilePond
                            files={uploadFiles}
                            onupdatefiles={(fileItems) => {
                                const files = fileItems.map(fileItem => fileItem.file as File);
                                handleFileUpload(files);
                            }}
                            allowMultiple={false}
                            maxFiles={1}
                            acceptedFileTypes={[
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                'application/vnd.ms-excel'
                            ]}
                            labelIdle='Drag & Drop your Excel file or <span class="filepond--label-action">Browse</span>'
                            labelFileProcessing="Processing..."
                            labelFileProcessingComplete="Processing complete"
                            labelFileProcessingAborted="Processing aborted"
                            labelFileProcessingError="Error during processing"
                            labelFileRemoveError="Error during remove"
                            labelTapToCancel="Tap to cancel"
                            labelTapToRetry="Tap to retry"
                            labelTapToUndo="Tap to undo"
                        />
                    </div>

                    {formData.uploadFile && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className="iconify lucide--file-check w-5 h-5 text-green-600"></span>
                                <span className="font-medium text-green-800">
                                    File ready: {formData.uploadFile.name}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Manual Entry Tab */}
            {activeTab === 'manual' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium">VO Items</h3>
                        <button 
                            className="btn btn-sm btn-primary"
                            onClick={addManualItem}
                        >
                            <span className="iconify lucide--plus size-4 mr-2"></span>
                            Add Item
                        </button>
                    </div>

                    {manualItems.length === 0 ? (
                        <div className="alert alert-warning">
                            <span className="iconify lucide--alert-triangle size-5"></span>
                            <span>No items added yet. Click "Add Item" to start adding VO items.</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {manualItems.map((item, index) => (
                                <div key={item.id} className="card bg-base-100 border border-base-200 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="label">
                                                <span className="label-text text-xs">Description</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="input input-bordered input-sm"
                                                placeholder="Item description"
                                                value={item.description}
                                                onChange={(e) => updateManualItem(index, 'description', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text text-xs">Quantity</span>
                                            </label>
                                            <input
                                                type="number"
                                                className="input input-bordered input-sm"
                                                placeholder="0"
                                                value={item.quantity}
                                                onChange={(e) => updateManualItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text text-xs">Unit Price</span>
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="input input-bordered input-sm"
                                                placeholder="0.00"
                                                value={item.unitPrice}
                                                onChange={(e) => updateManualItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">
                                                <span className="label-text text-xs">Unit</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="input input-bordered input-sm"
                                                placeholder="unit"
                                                value={item.unit}
                                                onChange={(e) => updateManualItem(index, 'unit', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="font-medium">
                                            Total: ${item.total.toFixed(2)}
                                        </div>
                                        <button 
                                            className="btn btn-sm btn-error"
                                            onClick={() => removeManualItem(index)}
                                        >
                                            <span className="iconify lucide--trash size-4"></span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Total Summary */}
                            <div className="alert alert-success">
                                <span className="iconify lucide--calculator size-5"></span>
                                <div>
                                    <div className="font-bold">Total VO Amount: ${totalAmount.toFixed(2)}</div>
                                    <div className="text-sm">{manualItems.length} items added</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
