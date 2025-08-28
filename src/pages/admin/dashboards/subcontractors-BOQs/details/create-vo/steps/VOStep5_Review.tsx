import React from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';

export const VOStep5_Review: React.FC = () => {
    const { contractData, formData } = useContractVOWizardContext();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            maximumFractionDigits: 2
        }).format(Math.abs(amount));
    };

    const getBuildingName = (buildingId?: number) => {
        if (!buildingId) return 'All selected buildings';
        return contractData?.buildings.find(b => b.id === buildingId)?.name || `Building ${buildingId}`;
    };

    const selectedBuildings = contractData?.buildings.filter(b => 
        formData.selectedBuildingIds.includes(b.id)
    ) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                            <span className="iconify lucide--check-circle text-purple-600 dark:text-purple-400 size-5"></span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-base-content">Review & Create VO</h3>
                            <p className="text-sm text-base-content/70">
                                Review all VO details before creating
                            </p>
                        </div>
                    </div>

                    {/* VO Overview */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* VO Information */}
                        <div className="bg-base-200 rounded-lg p-4">
                            <h4 className="font-medium text-base-content mb-3 flex items-center gap-2">
                                <span className="iconify lucide--file-plus size-4 text-orange-600"></span>
                                VO Information
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">VO Number:</span>
                                    <span className="font-medium">{formData.voNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Date:</span>
                                    <span className="font-medium">
                                        {new Date(formData.voDate).toLocaleDateString('en-GB')}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Type:</span>
                                    <span className={`badge badge-sm ${
                                        formData.voType === 'Addition' ? 'badge-success' :
                                        formData.voType === 'Deduction' ? 'badge-error' :
                                        'badge-info'
                                    }`}>
                                        {formData.voType}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Status:</span>
                                    <span className={`badge badge-sm ${
                                        formData.status === 'Editable' ? 'badge-warning' :
                                        formData.status === 'Approved' ? 'badge-success' :
                                        formData.status === 'Rejected' ? 'badge-error' :
                                        'badge-info'
                                    }`}>
                                        {formData.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Contract Context */}
                        <div className="bg-base-200 rounded-lg p-4">
                            <h4 className="font-medium text-base-content mb-3 flex items-center gap-2">
                                <span className="iconify lucide--file-text size-4 text-blue-600"></span>
                                Contract Context
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-base-content/70 text-xs uppercase tracking-wide">Contract</span>
                                    <p className="font-medium">{formData.contractNumber}</p>
                                </div>
                                <div>
                                    <span className="text-base-content/70 text-xs uppercase tracking-wide">Project</span>
                                    <p className="font-medium text-xs">{formData.projectName}</p>
                                </div>
                                <div>
                                    <span className="text-base-content/70 text-xs uppercase tracking-wide">Subcontractor</span>
                                    <p className="font-medium text-xs">{formData.subcontractorName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Impact */}
                        <div className="bg-base-200 rounded-lg p-4">
                            <h4 className="font-medium text-base-content mb-3 flex items-center gap-2">
                                <span className="iconify lucide--calculator size-4 text-green-600"></span>
                                Financial Impact
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-green-700 dark:text-green-400">Additions:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                        +{contractData?.currencySymbol}{formatCurrency(formData.totalAdditions)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-red-700 dark:text-red-400">Deductions:</span>
                                    <span className="font-medium text-red-600 dark:text-red-400">
                                        -{contractData?.currencySymbol}{formatCurrency(formData.totalDeductions)}
                                    </span>
                                </div>
                                <div className="divider my-1"></div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Net Amount:</span>
                                    <span className={`font-bold ${
                                        formData.totalAmount >= 0 ? 'text-success' : 'text-error'
                                    }`}>
                                        {formData.totalAmount >= 0 ? '+' : '-'}{contractData?.currencySymbol}{formatCurrency(formData.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* VO Description */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <h4 className="font-medium text-base-content mb-4 flex items-center gap-2">
                        <span className="iconify lucide--file-text size-4 text-blue-600"></span>
                        VO Description & Reason
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-medium text-base-content/70 mb-2">Description:</p>
                            <p className="text-sm text-base-content bg-base-200 p-3 rounded">
                                {formData.description || 'No description provided'}
                            </p>
                        </div>
                        
                        <div>
                            <p className="text-sm font-medium text-base-content/70 mb-2">Reason:</p>
                            <p className="text-sm text-base-content bg-base-200 p-3 rounded">
                                {formData.reason || 'No reason provided'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selected Buildings */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <h4 className="font-medium text-base-content mb-4 flex items-center gap-2">
                        <span className="iconify lucide--building-2 size-4 text-blue-600"></span>
                        Affected Buildings
                        <span className="badge badge-sm bg-blue-100 text-blue-700">
                            {selectedBuildings.length} selected
                        </span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedBuildings.map((building) => (
                            <div key={building.id} className="bg-base-200 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded dark:bg-blue-900/30">
                                        <span className="iconify lucide--building size-4 text-blue-600 dark:text-blue-400"></span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{building.name}</p>
                                        <p className="text-xs text-base-content/60">ID: #{building.id}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Line Items Summary */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <h4 className="font-medium text-base-content mb-4 flex items-center gap-2">
                        <span className="iconify lucide--list-plus size-4 text-green-600"></span>
                        Line Items
                        <span className="badge badge-sm bg-green-100 text-green-700">
                            {formData.lineItems.length} items
                        </span>
                    </h4>
                    
                    {formData.lineItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="table table-sm">
                                <thead>
                                    <tr className="border-base-300">
                                        <th>Item No.</th>
                                        <th>Description</th>
                                        <th>Unit</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                        <th>Building</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.lineItems.map((item, index) => (
                                        <tr key={item.id || index} className="border-base-300">
                                            <td className="font-medium">{item.no}</td>
                                            <td>{item.description}</td>
                                            <td>{item.unit}</td>
                                            <td>{item.quantity.toLocaleString()}</td>
                                            <td>{contractData?.currencySymbol} {formatCurrency(item.unitPrice)}</td>
                                            <td className={`font-medium ${
                                                item.totalPrice >= 0 ? 'text-success' : 'text-error'
                                            }`}>
                                                {item.totalPrice >= 0 ? '+' : '-'}{contractData?.currencySymbol} {formatCurrency(item.totalPrice)}
                                            </td>
                                            <td className="text-xs text-base-content/70">
                                                {getBuildingName(item.buildingId)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-base-300 font-medium">
                                        <td colSpan={5} className="text-right">Total VO Amount:</td>
                                        <td className={`font-bold ${
                                            formData.totalAmount >= 0 ? 'text-success' : 'text-error'
                                        }`}>
                                            {formData.totalAmount >= 0 ? '+' : '-'}{contractData?.currencySymbol} {formatCurrency(formData.totalAmount)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <span className="iconify lucide--inbox size-12 text-base-content/30 mb-2"></span>
                            <p className="text-base-content/70">No line items added</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Creation Confirmation */}
            <div className="alert alert-success">
                <span className="iconify lucide--check-circle size-5"></span>
                <div>
                    <h3 className="font-medium">Ready to Create VO</h3>
                    <div className="text-sm mt-1">
                        All information has been reviewed. Click "Create VO" to finalize this variation order.
                        <br />
                        <strong>Contract:</strong> {formData.contractNumber} • 
                        <strong> Net Amount:</strong> {formData.totalAmount >= 0 ? '+' : '-'}{contractData?.currencySymbol} {formatCurrency(formData.totalAmount)}
                    </div>
                </div>
            </div>
        </div>
    );
};