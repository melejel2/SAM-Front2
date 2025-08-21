import React, { useState, useEffect } from "react";
import { useEditWizardContext } from "../context/EditWizardContext";
import { AttachmentsDialog, AttachmentsType } from "../components/AttachmentsDialog";


export const EditStep4_ContractDetails: React.FC = () => {
    const { formData, setFormData, contracts, currencies, projects } = useEditWizardContext();
    const [contractNumberSuffix, setContractNumberSuffix] = useState<string>("001");
    const [isAttachmentsDialogOpen, setIsAttachmentsDialogOpen] = useState(false);

    // Get the selected project to access its acronym from database
    const selectedProject = projects.find(p => p.id === formData.projectId);
    const projectAcronym = selectedProject?.acronym || "XXX";

    // Generate the full contract number
    const generateContractNumber = (suffix: string) => {
        return `CS-${projectAcronym}-${suffix.padStart(3, '0')}`;
    };

    // Update contract number when suffix or project changes (only if not already manually set)
    useEffect(() => {
        if (projectAcronym !== "XXX") {
            const newContractNumber = generateContractNumber(contractNumberSuffix);
            // Only update if it's empty or follows the pattern (not a custom contract number)
            if (!formData.contractNumber || formData.contractNumber.startsWith(`CS-${projectAcronym}-`)) {
                if (formData.contractNumber !== newContractNumber) {
                    setFormData({ contractNumber: newContractNumber });
                }
            }
        }
    }, [contractNumberSuffix, projectAcronym]);

    // Initialize contract number suffix from existing contract number
    useEffect(() => {
        if (formData.contractNumber && formData.contractNumber.startsWith(`CS-${projectAcronym}-`)) {
            const suffix = formData.contractNumber.split('-')[2];
            if (suffix && /^\d{3}$/.test(suffix)) {
                setContractNumberSuffix(suffix);
            }
        }
    }, [formData.contractNumber, projectAcronym]);

    const handleFieldChange = (field: string, value: any) => {
        setFormData({ [field]: value });
    };

    const handleContractNumberSuffixChange = (newSuffix: string) => {
        // Only allow numbers, max 3 digits
        const cleanSuffix = newSuffix.replace(/\D/g, '').substring(0, 3);
        setContractNumberSuffix(cleanSuffix || "001");
    };

    return (
        <div className="bg-base-100 rounded-lg border border-base-300 p-6">
            <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 bg-primary rounded-full"></span>
                <h2 className="text-xl font-semibold text-base-content">Contract Details</h2>
            </div>
            
            {/* Main Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Row 1: Basic Contract Info */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Contract Type *</span>
                    </label>
                    <select className="select select-bordered" value={formData.contractId || ''} onChange={(e) => handleFieldChange('contractId', Number(e.target.value))}>
                        <option value="">Select contract type</option>
                        {contracts.map(contract => (
                            <option key={contract.id} value={contract.id}>
                                {contract.templateName} {contract.contractType && `- ${contract.contractType}`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Currency *</span>
                    </label>
                    <select className="select select-bordered" value={formData.currencyId || ''} onChange={(e) => handleFieldChange('currencyId', Number(e.target.value))}>
                        <option value="">Select currency</option>
                        {currencies.map(currency => (
                            <option key={currency.id} value={currency.id}>
                                {currency.name} ({currency.currencies})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Contract Date *</span>
                    </label>
                    <input type="date" className="input input-bordered" value={formData.contractDate} onChange={(e) => handleFieldChange('contractDate', e.target.value)} />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Completion Date *</span>
                    </label>
                    <input type="date" className="input input-bordered" value={formData.completionDate} onChange={(e) => handleFieldChange('completionDate', e.target.value)} />
                </div>

                {/* Row 2: Contract Number & Sub-trade */}
                <div className="form-control lg:col-span-2">
                    <label className="label">
                        <span className="label-text">Contract Number *</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <span className={`font-mono px-3 py-2 rounded border ${projectAcronym === "XXX" ? "bg-warning/20 text-warning border-warning/40" : "bg-base-200 text-base-content/80 border-base-300"}`}>
                            CS-{projectAcronym}-
                        </span>
                        <input type="text" className="input input-bordered w-24 text-center font-mono" value={contractNumberSuffix} onChange={(e) => handleContractNumberSuffixChange(e.target.value)} placeholder="001" maxLength={3} disabled={projectAcronym === "XXX"} />
                    </div>
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Sub-trade</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.subTrade || ''} onChange={(e) => handleFieldChange('subTrade', e.target.value)} placeholder="Enter sub-trade" />
                </div>
            </div>

            {/* Financial & Terms Section */}
            <div className="divider my-6">Financial Terms & Conditions</div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Financial percentages */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Advance (%)</span>
                    </label>
                    <input type="number" className="input input-bordered" value={formData.advancePayment || ''} onChange={(e) => handleFieldChange('advancePayment', Number(e.target.value))} placeholder="0" min="0" max="100" step="0.01" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Material Supply (%)</span>
                    </label>
                    <input type="number" className="input input-bordered" value={formData.materialSupply || ''} onChange={(e) => handleFieldChange('materialSupply', Number(e.target.value))} placeholder="0" min="0" max="100" step="0.01" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Interest (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.purchaseIncrease || ''} onChange={(e) => handleFieldChange('purchaseIncrease', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Late Penalty (‰)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.latePenalties || ''} onChange={(e) => handleFieldChange('latePenalties', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Max Penalty (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.latePenalityCeiling || ''} onChange={(e) => handleFieldChange('latePenalityCeiling', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Retention (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.holdWarranty || ''} onChange={(e) => handleFieldChange('holdWarranty', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Warranty (months)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.workWarranty || ''} onChange={(e) => handleFieldChange('workWarranty', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Maintenance (months)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.mintenancePeriod || ''} onChange={(e) => handleFieldChange('mintenancePeriod', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Performance Bond (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.termination || ''} onChange={(e) => handleFieldChange('termination', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Payment Due (days)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.daysNumber || ''} onChange={(e) => handleFieldChange('daysNumber', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Max Progress (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.progress || ''} onChange={(e) => handleFieldChange('progress', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Hold Back (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.holdBack || ''} onChange={(e) => handleFieldChange('holdBack', e.target.value)} placeholder="0" />
                </div>
            </div>

            {/* Additional Terms */}
            <div className="divider my-6">Additional Terms</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Advance Recovery (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.recoverAdvance || ''} onChange={(e) => handleFieldChange('recoverAdvance', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Prorata (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.prorataAccount || ''} onChange={(e) => handleFieldChange('prorataAccount', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Management Fees (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.managementFees || ''} onChange={(e) => handleFieldChange('managementFees', e.target.value)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Payment Terms</span>
                    </label>
                    <input type="text" className="input input-bordered" value={formData.paymentsTerm || ''} onChange={(e) => handleFieldChange('paymentsTerm', e.target.value)} placeholder="Enter payment terms" />
                </div>
            </div>

            {/* Remarks & Attachments */}
            <div className="divider my-6">Notes & Documents</div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="form-control">
                    <div className="text-sm font-medium text-base-content mb-2">General Remarks</div>
                    <textarea className="textarea textarea-bordered w-full" rows={4} value={formData.remark || ''} onChange={(e) => handleFieldChange('remark', e.target.value)} placeholder="Enter general remarks..." />
                </div>

                <div className="form-control">
                    <div className="text-sm font-medium text-base-content mb-2">Documents</div>
                    <div 
                        className="min-h-[104px] border-2 border-dashed border-base-300 rounded-lg p-4 hover:border-primary/50 transition-all duration-200 cursor-pointer bg-base-50 hover:bg-base-100 flex flex-col items-center justify-center gap-2"
                        onClick={() => setIsAttachmentsDialogOpen(true)}
                    >
                        <div className="text-2xl">📁</div>
                        <div className="text-sm font-medium text-base-content">Manage Attachments</div>
                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                            {formData.attachments && formData.attachments.length > 0 ? (
                                <>
                                    <span className="badge badge-success badge-sm">{formData.attachments.length}</span>
                                    <span>files attached</span>
                                </>
                            ) : (
                                <span>Click to add PDF documents</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AttachmentsDialog
                isOpen={isAttachmentsDialogOpen}
                onClose={() => setIsAttachmentsDialogOpen(false)}
                attachments={formData.attachments || []}
                onChange={(attachments) => handleFieldChange('attachments', attachments)}
            />
        </div>
    );
};