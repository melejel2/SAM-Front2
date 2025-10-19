import React from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';

export const VOStep1_BasicInfo: React.FC = () => {
    const { formData, setFormData, contractData, voContracts, voContractsLoading } = useContractVOWizardContext();

    const handleFieldChange = (field: string, value: any) => {
        setFormData({ [field]: value });
    };

    return (
        <div className="bg-base-100 rounded-lg border border-base-300 p-6">
            <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 bg-primary rounded-full"></span>
                <h2 className="text-xl font-semibold text-base-content">VO Basic Information</h2>
            </div>

            {/* Contract info displayed in compact format */}
            {contractData && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--file-text text-blue-600 dark:text-blue-400 size-4"></span>
                            <span className="text-blue-700 dark:text-blue-300">Contract:</span>
                            <span className="font-semibold text-blue-800 dark:text-blue-200">{contractData.contractNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--building-2 text-blue-600 dark:text-blue-400 size-4"></span>
                            <span className="text-blue-700 dark:text-blue-300">Project:</span>
                            <span className="font-semibold text-blue-800 dark:text-blue-200">{contractData.projectName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--users text-blue-600 dark:text-blue-400 size-4"></span>
                            <span className="text-blue-700 dark:text-blue-300">Subcontractor:</span>
                            <span className="font-semibold text-blue-800 dark:text-blue-200">{contractData.subcontractorName}</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Row 1: Basic VO Info */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">VO Number *</span>
                    </label>
                    <input 
                        type="text" 
                        className="input input-bordered" 
                        value={formData.voNumber || ''} 
                        onChange={(e) => handleFieldChange('voNumber', e.target.value)} 
                        placeholder="e.g., VO-2024-001" 
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">VO Date *</span>
                    </label>
                    <input 
                        type="date" 
                        className="input input-bordered" 
                        value={formData.voDate || ''} 
                        onChange={(e) => handleFieldChange('voDate', e.target.value)} 
                    />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">VO Type *</span>
                    </label>
                    <select 
                        className="select select-bordered" 
                        value={formData.voType || ''} 
                        onChange={(e) => handleFieldChange('voType', e.target.value)}
                    >
                        <option value="">Select VO type</option>
                        <option value="Addition">Addition</option>
                        <option value="Omission">Omission</option>
                    </select>
                </div>

                <div className="form-control w-full">
                    <label className="label">
                        <span className="label-text">Status</span>
                    </label>
                    <div className="input input-bordered flex items-center bg-base-200">
                        <span className="badge badge-warning badge-sm">Editable</span>
                    </div>
                </div>

                {/* VO Contract Dropdown */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">VO Contract *</span>
                    </label>
                    <select 
                        className="select select-bordered" 
                        value={formData.voContractId || ''} 
                        onChange={(e) => handleFieldChange('voContractId', parseInt(e.target.value))}
                        disabled={voContractsLoading}
                    >
                        <option value="">Select VO contract</option>
                        {voContracts.map(contract => (
                            <option key={contract.id} value={contract.id}>{contract.name}</option>
                        ))}
                    </select>
                </div>

                {/* SubTrade Input */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Sub Trade</span>
                    </label>
                    <input 
                        type="text" 
                        className="input input-bordered" 
                        value={formData.subTrade || ''} 
                        onChange={(e) => handleFieldChange('subTrade', e.target.value)} 
                        placeholder="e.g., Electrical, Plumbing" 
                    />
                </div>
            </div>

            {/* Description Section */}
            <div className="divider my-6">VO Description</div>
            
            <div className="form-control">
                <label className="label">
                    <span className="label-text">Description *</span>
                </label>
                <textarea 
                    className="textarea textarea-bordered w-full" 
                    rows={4} 
                    value={formData.description || ''} 
                    onChange={(e) => handleFieldChange('description', e.target.value)} 
                    placeholder="Describe what this variation order covers and the reason for the change..." 
                />
                <label className="label">
                    <span className="label-text-alt text-base-content/60">
                        Include both the description of work and justification for the VO in this single field
                    </span>
                </label>
            </div>

            {/* Remove summary section to avoid redundancy - data already shown in form fields above */}
        </div>
    );
};