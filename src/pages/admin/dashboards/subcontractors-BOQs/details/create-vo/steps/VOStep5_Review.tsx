import React from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';

export const VOStep5_Review: React.FC = () => {
    const { contractData, formData } = useContractVOWizardContext();

    // Number formatting function - shows decimals only if needed
    const formatNumber = (value: number, forceDecimals: boolean = false) => {
        if (value === 0) return '0';
        
        // Check if the number has decimals
        const hasDecimals = value % 1 !== 0;
        
        if (forceDecimals || hasDecimals) {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(Math.abs(value));
        } else {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(Math.abs(value));
        }
    };

    const getBuildingName = (buildingId?: number) => {
        if (!buildingId) return 'All buildings';
        return contractData?.buildings.find(b => b.id === buildingId)?.name || `Building ${buildingId}`;
    };

    const selectedBuildings = contractData?.buildings.filter(b => 
        formData.selectedBuildingIds.includes(b.id)
    ) || [];

    const isAddition = formData.voType === 'Addition';

    return (
        <div className="bg-base-100 rounded-lg border border-base-300">
            {/* Header with Key Info */}
            <div className="p-4 border-b border-base-300">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-base-content/70">VO:</span>
                            <span className="font-semibold">{formData.voNumber}</span>
                        </div>
                        <span className="text-base-content/40">•</span>
                        <div className="flex items-center gap-2">
                            <span className={`badge badge-sm ${
                                isAddition ? 'badge-success' : 'badge-error'
                            }`}>
                                {formData.voType}
                            </span>
                        </div>
                        <span className="text-base-content/40">•</span>
                        <span className="text-sm">{new Date(formData.voDate).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className={`text-lg font-bold ${isAddition ? 'text-success' : 'text-error'}`}>
                        {contractData?.currencySymbol} {formatNumber(Math.abs(formData.totalAmount))}
                    </div>
                </div>
            </div>

            {/* Contract Context */}
            <div className="px-4 py-3 bg-base-200/50 text-sm border-b border-base-300">
                <span className="font-medium">Contract:</span> {formData.contractNumber}
                <span className="text-base-content/40 mx-2">•</span>
                <span className="font-medium">Project:</span> {formData.projectName}
                <span className="text-base-content/40 mx-2">•</span>
                <span className="font-medium">Subcontractor:</span> {formData.subcontractorName}
            </div>

            {/* Description - Only if provided */}
            {formData.description && (
                <div className="px-4 py-3 border-b border-base-300">
                    <h4 className="text-sm font-medium text-base-content/70 mb-2">Description</h4>
                    <p className="text-sm">{formData.description}</p>
                </div>
            )}

            {/* Buildings */}
            <div className="px-4 py-3 border-b border-base-300">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-base-content/70">Buildings ({selectedBuildings.length})</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectedBuildings.map((building) => (
                        <span key={building.id} className="badge badge-sm badge-outline">
                            {building.name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Line Items Table */}
            {formData.lineItems.length > 0 && (
                <>
                    <div className="px-4 py-3 border-b border-base-300">
                        <h4 className="text-sm font-medium text-base-content/70">
                            Line Items ({formData.lineItems.length})
                        </h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead className="bg-base-200">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-base-content/70 uppercase">Item</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-base-content/70 uppercase">Description</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-base-content/70 uppercase">Unit</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-base-content/70 uppercase">Qty</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-base-content/70 uppercase">Unit Price</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-base-content/70 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-base-300">
                                {formData.lineItems.map((item, index) => {
                                    const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                                    return (
                                        <tr key={item.id || index}>
                                            <td className="px-3 py-2 text-xs">{item.no}</td>
                                            <td className="px-3 py-2 text-xs">{item.description}</td>
                                            <td className="px-3 py-2 text-xs text-center">{item.unit}</td>
                                            <td className="px-3 py-2 text-xs text-center">{formatNumber(item.quantity)}</td>
                                            <td className="px-3 py-2 text-xs text-center">{formatNumber(item.unitPrice)}</td>
                                            <td className={`px-3 py-2 text-xs text-center font-medium ${
                                                isAddition ? 'text-success' : 'text-error'
                                            }`}>
                                                {formatNumber(itemTotal)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-base-200 font-bold">
                                    <td colSpan={5} className="px-3 py-2 text-xs text-right">TOTAL</td>
                                    <td className={`px-3 py-2 text-xs text-center ${
                                        isAddition ? 'text-primary' : 'text-error'
                                    }`}>
                                        {formatNumber(Math.abs(formData.totalAmount))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};