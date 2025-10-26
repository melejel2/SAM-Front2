import React from "react";
import { useEditWizardContext } from "../context/EditWizardContext";

export const EditStep5_Review: React.FC = () => {
    const { formData, projects, allBuildings, subcontractors, contracts, currencies } = useEditWizardContext();

    // Helper functions
    const getProjectName = () => {
        const project = projects.find(p => p.id === formData.projectId);
        return project?.name || 'Not selected';
    };

    const getBuildingNames = () => {
        const buildingIds = [...new Set(formData.buildingTradeMap.map(m => m.buildingId))];
        return buildingIds
            .map(id => allBuildings.find(b => b.id === id)?.name || allBuildings.find(b => b.id === id)?.buildingName || `Building ${id}`)
            .join(', ');
    };

    const getSubcontractorName = () => {
        const subcontractor = subcontractors.find(s => s.id === formData.subcontractorId);
        return subcontractor?.name || 'Not selected';
    };

    const getContractTypeName = () => {
        const contract = contracts.find(c => c.id === formData.contractId);
        return contract?.templateName || 'Not selected';
    };

    const getCurrencyDisplay = () => {
        const currency = currencies.find(c => c.id === formData.currencyId);
        return currency ? `${currency.name} (${currency.currencies})` : 'Not selected';
    };

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    const calculateGrandTotal = () => {
        return formData.boqData.reduce((sum, buildingBOQ) => 
            sum + buildingBOQ.items.reduce((itemSum, item) => {
                if (!item.unite) return itemSum; // Skip items without unit
                return itemSum + (item.totalPrice || item.qte * item.pu);
            }, 0), 0
        );
    };

    return (
        <div>
            <div className="space-y-4">
                {/* Contract Number Display */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <span className="iconify lucide--file-text w-5 h-5 text-primary"></span>
                        <span className="font-semibold text-primary">Contract: {formData.contractNumber || 'Not specified'}</span>
                    </div>
                </div>

                {/* Project Information */}
                <div className="bg-base-200/50 rounded-xl p-6 border border-base-300">
                    <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                        Project Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <span className="font-medium text-base-content/70">Project:</span>
                            <p className="text-base-content">{getProjectName()}</p>
                        </div>
                        <div>
                            <span className="font-medium text-base-content/70">Buildings:</span>
                            <p className="text-base-content">{getBuildingNames()}</p>
                        </div>
                    </div>
                </div>

                {/* Subcontractor Information */}
                <div className="bg-base-200/50 rounded-xl p-6 border border-base-300">
                    <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-success rounded-full"></span>
                        Subcontractor
                    </h3>
                    <p className="text-base-content">{getSubcontractorName()}</p>
                </div>

                {/* Contract Details */}
                <div className="bg-base-200/50 rounded-xl p-6 border border-base-300">
                    <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-warning rounded-full"></span>
                        Contract Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <span className="font-medium text-base-content/70">Type:</span>
                            <p className="text-base-content">{getContractTypeName()}</p>
                        </div>
                        <div>
                            <span className="font-medium text-base-content/70">Currency:</span>
                            <p className="text-base-content">{getCurrencyDisplay()}</p>
                        </div>
                        <div>
                            <span className="font-medium text-base-content/70">Contract Number:</span>
                            <p className="text-base-content">{formData.contractNumber || 'Not specified'}</p>
                        </div>
                        <div>
                            <span className="font-medium text-base-content/70">Contract Date:</span>
                            <p className="text-base-content">{formData.contractDate || 'Not specified'}</p>
                        </div>
                        <div>
                            <span className="font-medium text-base-content/70">Completion Date:</span>
                            <p className="text-base-content">{formData.completionDate || 'Not specified'}</p>
                        </div>
                        <div>
                            <span className="font-medium text-base-content/70">Sub Trade:</span>
                            <p className="text-base-content">{formData.subTrade || 'Not specified'}</p>
                        </div>
                    </div>
                    
                    {/* Financial Terms */}
                    {(formData.advancePayment > 0 || formData.materialSupply > 0) && (
                        <div className="mt-4 pt-4 border-t border-base-300">
                            <h4 className="font-semibold text-base-content mb-2">Financial Terms:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.advancePayment > 0 && (
                                    <div>
                                        <span className="font-medium text-base-content/70">Advance Payment:</span>
                                        <p className="text-base-content">{formData.advancePayment}%</p>
                                    </div>
                                )}
                                {formData.materialSupply > 0 && (
                                    <div>
                                        <span className="font-medium text-base-content/70">Material Supply:</span>
                                        <p className="text-base-content">{formData.materialSupply}%</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Attachments */}
                {formData.attachments.length > 0 && (
                    <div className="bg-base-200/50 rounded-xl p-6 border border-base-300">
                        <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-info rounded-full"></span>
                            Attachments
                        </h3>
                        <div className="space-y-2">
                            {formData.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <span className="iconify lucide--paperclip w-4 h-4 text-base-content/60"></span>
                                    <span className="text-base-content">{attachment.file.name}</span>
                                    <span className="text-xs text-base-content/60">({attachment.type})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* BOQ Summary */}
                {formData.boqData.length > 0 && (
                    <div className="bg-base-200/50 rounded-xl p-6 border border-base-300">
                        <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-secondary rounded-full"></span>
                            BOQ Summary
                        </h3>
                        
                        {formData.boqData.map(buildingBOQ => {
                            const buildingTotal = buildingBOQ.items.reduce((sum, item) => {
                                if (!item.unite) return sum; // Skip items without unit
                                return sum + (item.totalPrice || item.qte * item.pu);
                            }, 0);
                            
                            if (buildingBOQ.items.length === 0) return null;
                            
                            return (
                                <div key={buildingBOQ.buildingId} className="mb-4 last:mb-0">
                                    <div className="bg-base-100 rounded-lg p-4">
                                        <h4 className="font-medium text-base-content mb-2">{buildingBOQ.buildingName}</h4>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-base-content/70">
                                                {buildingBOQ.items.filter(item => item.unite).length} items
                                            </span>
                                            <span className="font-semibold text-primary">
                                                {formatNumber(buildingTotal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="border-t border-base-300 pt-4 mt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-base-content">Grand Total:</span>
                                <span className="text-xl font-bold text-primary">
                                    {formatNumber(calculateGrandTotal())}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Remarks */}
                {(formData.remark || formData.remarkCP) && (
                    <div className="bg-base-200/50 rounded-xl p-6 border border-base-300">
                        <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-accent rounded-full"></span>
                            Additional Notes
                        </h3>
                        {formData.remark && (
                            <div className="mb-4">
                                <span className="font-medium text-base-content/70">Remarks:</span>
                                <p className="text-base-content mt-1">{formData.remark}</p>
                            </div>
                        )}
                        {formData.remarkCP && (
                            <div>
                                <span className="font-medium text-base-content/70">Remarks CP:</span>
                                <p className="text-base-content mt-1">{formData.remarkCP}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Validation Notice */}
                <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                        <span className="iconify lucide--info w-5 h-5 text-info mt-0.5"></span>
                        <div>
                            <h4 className="font-semibold text-info mb-1">Review Complete</h4>
                            <p className="text-sm text-base-content/70">
                                Please review all information above carefully. Click "Next" to proceed to the preview step 
                                where you can generate the updated contract document.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};