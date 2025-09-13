import React from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';

export const VOStep2_ContractReview: React.FC = () => {
    const { contractData, formData } = useContractVOWizardContext();

    if (!contractData) {
        return (
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <div className="text-center p-8">
                        <span className="iconify lucide--loader-2 size-8 animate-spin text-base-content/60 mb-2"></span>
                        <p className="text-base-content/70">Loading contract information...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Contract Information */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    {/* Contract Information Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Contract Info */}
                        <div className="bg-base-200 rounded-lg p-4">
                            <h4 className="font-medium text-base-content mb-3 flex items-center gap-2">
                                <span className="iconify lucide--file-text size-4 text-purple-600"></span>
                                Contract Details
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Contract ID:</span>
                                    <span className="font-medium">#{contractData.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Contract Number:</span>
                                    <span className="font-medium">{contractData.contractNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Currency:</span>
                                    <span className="font-medium">{contractData.currencySymbol}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/70">Buildings:</span>
                                    <span className="font-medium">{contractData.buildings.length} buildings</span>
                                </div>
                            </div>
                        </div>

                        {/* Project Information */}
                        <div className="bg-base-200 rounded-lg p-4">
                            <h4 className="font-medium text-base-content mb-3 flex items-center gap-2">
                                <span className="iconify lucide--building-2 size-4 text-blue-600"></span>
                                Project Information
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-base-content/70 text-xs uppercase tracking-wide">Project Name</span>
                                    <p className="font-medium mt-1">{contractData.projectName}</p>
                                </div>
                                <div className="mt-3">
                                    <span className="text-base-content/70 text-xs uppercase tracking-wide">Project ID</span>
                                    <p className="font-medium mt-1">#{contractData.projectId}</p>
                                </div>
                            </div>
                        </div>

                        {/* Subcontractor Information */}
                        <div className="bg-base-200 rounded-lg p-4">
                            <h4 className="font-medium text-base-content mb-3 flex items-center gap-2">
                                <span className="iconify lucide--users size-4 text-green-600"></span>
                                Subcontractor
                            </h4>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-base-content/70 text-xs uppercase tracking-wide">Company Name</span>
                                    <p className="font-medium mt-1">{contractData.subcontractorName}</p>
                                </div>
                                <div className="mt-3">
                                    <span className="text-base-content/70 text-xs uppercase tracking-wide">Subcontractor ID</span>
                                    <p className="font-medium mt-1">#{contractData.subcontractorId}</p>
                                </div>
                                {contractData.tradeName && (
                                    <div className="mt-3">
                                        <span className="text-base-content/70 text-xs uppercase tracking-wide">Trade</span>
                                        <p className="font-medium mt-1">{contractData.tradeName}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Buildings List */}
            <div className="card bg-base-100 shadow-sm border border-base-300">
                <div className="card-body">
                    <h4 className="font-medium text-base-content mb-4 flex items-center gap-2">
                        <span className="iconify lucide--building-2 size-4 text-blue-600"></span>
                        Available Buildings
                        <span className="badge badge-sm bg-blue-100 text-blue-700">
                            {contractData.buildings.length} total
                        </span>
                    </h4>
                    
                    {contractData.buildings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contractData.buildings.map((building) => (
                                <div key={building.id} className="bg-base-200 rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded dark:bg-blue-900/30">
                                            <span className="iconify lucide--building size-4 text-blue-600 dark:text-blue-400"></span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{building.name}</p>
                                            <p className="text-xs text-base-content/60">ID: #{building.id}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <span className="iconify lucide--building-2 size-12 text-base-content/30 mb-2"></span>
                            <p className="text-base-content/70">No buildings found in this contract</p>
                        </div>
                    )}
                </div>
            </div>

            {/* VO Context Summary */}
            <div className="card bg-orange-50 border border-orange-200 dark:bg-orange-900/10 dark:border-orange-800">
                <div className="card-body">
                    <h4 className="font-medium text-orange-800 dark:text-orange-400 mb-3 flex items-center gap-2">
                        <span className="iconify lucide--git-branch size-4"></span>
                        VO Context Summary
                    </h4>
                    <div className="bg-white dark:bg-base-300 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-base-content/70">This VO will be created for:</span>
                                <p className="font-medium mt-1">Contract {formData.contractNumber}</p>
                            </div>
                            <div>
                                <span className="text-base-content/70">VO Type:</span>
                                <p className="font-medium mt-1">
                                    <span className={`badge badge-sm ${
                                        formData.voType === 'Addition' ? 'badge-success' :
                                        formData.voType === 'Omission' ? 'badge-error' :
                                        'badge-info'
                                    }`}>
                                        {formData.voType}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation */}
            <div className="alert alert-info">
                <span className="iconify lucide--info size-5"></span>
                <div>
                    <h3 className="font-medium">Contract Context Confirmed</h3>
                    <div className="text-sm mt-1">
                        The VO will be created within the context of this contract. You'll select specific buildings in the next step.
                    </div>
                </div>
            </div>
        </div>
    );
};