import React from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';

export const VOStep1_BasicInfo: React.FC = () => {
    const { formData, setFormData, contractData } = useContractVOWizardContext();

    const handleFieldChange = (field: string, value: any) => {
        setFormData({ [field]: value });
    };

    return (
        <div className="bg-base-100 rounded-lg border border-base-300 p-6">
            <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 bg-primary rounded-full"></span>
                <h2 className="text-xl font-semibold text-base-content">VO Basic Information</h2>
            </div>

            {/* Contract Context Info */}
            {contractData && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="iconify lucide--file-text text-blue-600 dark:text-blue-400 size-4"></span>
                        <h3 className="font-medium text-blue-800 dark:text-blue-300">Creating VO for Contract</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div>
                            <span className="text-blue-700 dark:text-blue-300 font-medium">Contract:</span>
                            <p className="text-blue-800 dark:text-blue-200 font-semibold">{contractData.contractNumber}</p>
                        </div>
                        <div>
                            <span className="text-blue-700 dark:text-blue-300 font-medium">Project:</span>
                            <p className="text-blue-800 dark:text-blue-200 font-semibold">{contractData.projectName}</p>
                        </div>
                        <div>
                            <span className="text-blue-700 dark:text-blue-300 font-medium">Subcontractor:</span>
                            <p className="text-blue-800 dark:text-blue-200 font-semibold">{contractData.subcontractorName}</p>
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
                        <span className="text-xs text-base-content/60 ml-2">Status is automatically managed</span>
                    </div>
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

            {/* Quick Summary */}
            {(formData.voNumber || formData.voType || formData.description) && (
                <>
                    <div className="divider my-6">Summary</div>
                    
                    <div className="bg-base-50 rounded-lg p-4 border border-base-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-base-content/70 font-medium">VO Number:</span>
                                <div className="font-semibold text-base-content mt-1">
                                    {formData.voNumber || '—'}
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-base-content/70 font-medium">Type & Status:</span>
                                <div className="flex items-center gap-2 mt-1">
                                    {formData.voType && (
                                        <span className={`badge badge-sm ${
                                            formData.voType === 'Addition' ? 'badge-success' :
                                            formData.voType === 'Omission' ? 'badge-error' :
                                            'badge-info'
                                        }`}>
                                            {formData.voType}
                                        </span>
                                    )}
                                    <span className="badge badge-sm badge-outline badge-warning">
                                        Editable
                                    </span>
                                </div>
                            </div>
                            
                            <div>
                                <span className="text-base-content/70 font-medium">Date:</span>
                                <div className="font-semibold text-base-content mt-1">
                                    {formData.voDate ? new Date(formData.voDate).toLocaleDateString() : '—'}
                                </div>
                            </div>
                        </div>

                        {formData.voType && (
                            <div className="mt-3 pt-3 border-t border-base-300">
                                <div className="text-xs text-base-content/60">
                                    <strong>VO Type Info:</strong> {
                                        formData.voType === 'Addition' ? 'Adding new work or quantities to the contract' :
                                        formData.voType === 'Omission' ? 'Removing work or reducing quantities from the contract' :
                                        'Select a VO type to see description'
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};