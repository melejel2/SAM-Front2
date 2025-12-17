import React from "react";
import { formatCurrency } from "@/utils/formatters";
import { useVOWizardContext } from "../context/VOWizardContext";

export const VOStep4_Review: React.FC = () => {
    const { formData } = useVOWizardContext();

    const totalAmount = formData.voItems.reduce((sum, item) => sum + (item.total || 0), 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-base-content mb-2">
                    Review & Confirm
                </h2>
                <p className="text-sm text-base-content/70 mb-6">
                    Please review all information before creating the Variation Order
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="card bg-base-100 border border-base-200">
                    <div className="card-body">
                        <h3 className="card-title text-lg flex items-center gap-2">
                            <span className="iconify lucide--info size-5"></span>
                            Basic Information
                        </h3>
                        
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-base-content/70">Title:</span>
                                <p className="font-medium">{formData.title || 'Not specified'}</p>
                            </div>
                            
                            <div>
                                <span className="text-sm font-medium text-base-content/70">Level:</span>
                                <div className={`badge ${formData.level === 'Project' ? 'badge-primary' : formData.level === 'Building' ? 'badge-secondary' : 'badge-accent'} badge-outline`}>
                                    {formData.level}
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-sm font-medium text-base-content/70">Description:</span>
                                <p className="text-sm">{formData.description || 'No description provided'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location Information */}
                <div className="card bg-base-100 border border-base-200">
                    <div className="card-body">
                        <h3 className="card-title text-lg flex items-center gap-2">
                            <span className="iconify lucide--map-pin size-5"></span>
                            Location
                        </h3>
                        
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm font-medium text-base-content/70">Project ID:</span>
                                <p className="font-medium">{formData.projectId || 'Not selected'}</p>
                            </div>
                            
                            {formData.level !== 'Project' && (
                                <div>
                                    <span className="text-sm font-medium text-base-content/70">Building ID:</span>
                                    <p className="font-medium">{formData.buildingId || 'Not selected'}</p>
                                </div>
                            )}
                            
                            {formData.level === 'Sheet' && (
                                <div>
                                    <span className="text-sm font-medium text-base-content/70">Sheet:</span>
                                    <p className="font-medium">{formData.sheetName || 'Not specified'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* VO Data Summary */}
            <div className="card bg-base-100 border border-base-200">
                <div className="card-body">
                    <h3 className="card-title text-lg flex items-center gap-2">
                        <span className="iconify lucide--file-text size-5"></span>
                        VO Data Summary
                    </h3>
                    
                    {formData.uploadFile ? (
                        <div className="space-y-3">
                            <div className="alert alert-info">
                                <span className="iconify lucide--upload size-5"></span>
                                <div>
                                    <div className="font-bold">File Upload</div>
                                    <div className="text-sm">Excel file: {formData.uploadFile.name}</div>
                                    <div className="text-sm">Size: {(formData.uploadFile.size / 1024).toFixed(1)} KB</div>
                                </div>
                            </div>
                        </div>
                    ) : formData.voItems.length > 0 ? (
                        <div className="space-y-3">
                            <div className="alert alert-success">
                                <span className="iconify lucide--check-circle size-5"></span>
                                <div>
                                    <div className="font-bold">Manual Entry</div>
                                    <div className="text-sm">{formData.voItems.length} items entered manually</div>
                                    <div className="text-sm">Total Amount: ${formatCurrency(totalAmount, { decimals: 'always' })}</div>
                                </div>
                            </div>
                            
                            {/* Item Details */}
                            <div className="overflow-x-auto">
                                <table className="table table-xs">
                                    <thead>
                                        <tr>
                                            <th>Description</th>
                                            <th>Qty</th>
                                            <th>Unit Price</th>
                                            <th>Unit</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.voItems.map((item, index) => (
                                            <tr key={item.id || index}>
                                                <td className="max-w-xs truncate">{item.description}</td>
                                                <td>{item.quantity}</td>
                                                <td>${formatCurrency(item.unitPrice, { decimals: 'always' })}</td>
                                                <td>{item.unit}</td>
                                                <td className="font-medium">${formatCurrency(item.total, { decimals: 'always' })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colSpan={4}>Total</th>
                                            <th className="text-primary">${formatCurrency(totalAmount, { decimals: 'always' })}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="alert alert-warning">
                            <span className="iconify lucide--alert-triangle size-5"></span>
                            <span>No VO data provided. Please go back and add VO items or upload a file.</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Final Confirmation */}
            <div className="alert alert-info">
                <span className="iconify lucide--info size-5"></span>
                <div>
                    <div className="font-bold">Ready to Create</div>
                    <div className="text-sm">
                        Click "Create VO" above to finalize this Variation Order. 
                        {formData.uploadFile 
                            ? "The Excel file will be processed and VO items will be imported."
                            : `${formData.voItems.length} manually entered items will be saved.`
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};
