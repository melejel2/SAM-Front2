import React from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';

/**
 * VOStep1_VODetails - Combined VO Basic Information and Building Selection
 *
 * This step combines:
 * - VO basic information (Number, Date, Type, Description, VO Contract, Sub Trade)
 * - Building selection (multi-select checkboxes)
 *
 * Fixes applied:
 * - Shows contract context (Project Name, Subcontractor Name) from contractData
 * - Removed redundant "Status: Editable" field
 * - Uses sequential VO numbering (A01, A02, etc.) from backend
 * - Displays proper business names instead of IDs
 */
export const VOStep1_VODetails: React.FC = () => {
    const {
        formData,
        setFormData,
        contractData,
        voContracts,
        voContractsLoading,
        availableBuildings
    } = useContractVOWizardContext();

    const handleFieldChange = (field: string, value: any) => {
        setFormData({ [field]: value });
    };

    const handleBuildingToggle = (buildingId: number) => {
        const currentlySelected = formData.selectedBuildingIds || [];
        const isSelected = currentlySelected.includes(buildingId);

        if (isSelected) {
            // Remove from selection
            setFormData({
                selectedBuildingIds: currentlySelected.filter(id => id !== buildingId)
            });
        } else {
            // Add to selection
            setFormData({
                selectedBuildingIds: [...currentlySelected, buildingId]
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Contract Context Banner - Always visible */}
            {contractData && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-6 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--file-text text-blue-600 dark:text-blue-400 size-4"></span>
                            <span className="text-blue-700 dark:text-blue-300 font-medium">Contract:</span>
                            <span className="font-semibold text-blue-800 dark:text-blue-200">{contractData.contractNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--building-2 text-blue-600 dark:text-blue-400 size-4"></span>
                            <span className="text-blue-700 dark:text-blue-300 font-medium">Project:</span>
                            <span className="font-semibold text-blue-800 dark:text-blue-200">{contractData.projectName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--users text-blue-600 dark:text-blue-400 size-4"></span>
                            <span className="text-blue-700 dark:text-blue-300 font-medium">Subcontractor:</span>
                            <span className="font-semibold text-blue-800 dark:text-blue-200">{contractData.subcontractorName}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* VO Basic Information */}
            <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                <div className="flex items-center gap-2 mb-6">
                    <span className="w-3 h-3 bg-primary rounded-full"></span>
                    <h2 className="text-xl font-semibold text-base-content">VO Basic Information</h2>
                </div>

                {/* Form Grid - 2 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">VO Number *</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered bg-base-200"
                                value={formData.voNumber || ''}
                                readOnly
                                placeholder="Auto-generated"
                            />
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">VO Date *</span>
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
                                <span className="label-text font-medium">VO Type *</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={formData.voType || ''}
                                onChange={(e) => handleFieldChange('voType', e.target.value)}
                            >
                                <option value="">Select type</option>
                                <option value="Addition">Addition</option>
                                <option value="Omission">Omission</option>
                            </select>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">VO Contract *</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={formData.voContractId || ''}
                                onChange={(e) => handleFieldChange('voContractId', parseInt(e.target.value))}
                                disabled={voContractsLoading}
                            >
                                <option value="">Select contract</option>
                                {voContracts.map(contract => (
                                    <option key={contract.id} value={contract.id}>{contract.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Sub Trade</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered"
                                value={formData.subTrade || ''}
                                onChange={(e) => handleFieldChange('subTrade', e.target.value)}
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                </div>

                {/* Description - Full Width */}
                <div className="divider my-6"></div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium">Description *</span>
                    </label>
                    <textarea
                        className="textarea textarea-bordered w-full"
                        rows={4}
                        value={formData.description || ''}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        placeholder="Describe the variation order and reason for change..."
                    />
                </div>
            </div>

            {/* Building Selection */}
            <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-primary rounded-full"></span>
                        <h2 className="text-xl font-semibold text-base-content">Building Selection</h2>
                    </div>
                    {formData.selectedBuildingIds && formData.selectedBuildingIds.length > 0 && (
                        <span className="badge badge-primary badge-lg">
                            {formData.selectedBuildingIds.length} selected
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableBuildings && availableBuildings.length > 0 ? (
                        availableBuildings.map((building) => {
                            const isSelected = (formData.selectedBuildingIds || []).includes(building.id);

                            return (
                                <div
                                    key={building.id}
                                    className={`flex items-center p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                        isSelected
                                            ? 'border-primary bg-primary/10'
                                            : 'border-base-300 bg-base-100 hover:border-primary/50'
                                    }`}
                                    onClick={() => handleBuildingToggle(building.id)}
                                >
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary mr-3"
                                        checked={isSelected}
                                        onChange={() => {}} // Handled by div onClick
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="iconify lucide--building text-base-content/70 size-4"></span>
                                        <span className="font-medium text-base-content">
                                            {building.name || building.buildingName}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-2 text-center p-8 text-base-content/60">
                            <span className="iconify lucide--building size-12 mb-2"></span>
                            <p>No buildings available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
