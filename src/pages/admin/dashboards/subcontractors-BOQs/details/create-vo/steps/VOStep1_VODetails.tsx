import React, { useState, useMemo } from 'react';
import { useContractVOWizardContext } from '../context/ContractVOWizardContext';

/**
 * VOStep1_VODetails - Combined Building Selection and VO Basic Information
 * Layout optimized for wide screens with 4-column grids
 * Buildings show 2 rows by default with expand button
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

    const [buildingsExpanded, setBuildingsExpanded] = useState(false);

    // Calculate how many buildings to show (2 rows = 8 items on lg, 6 on md, 4 on sm)
    const COLLAPSED_ROWS = 2;
    const ITEMS_PER_ROW_LG = 4;
    const collapsedCount = COLLAPSED_ROWS * ITEMS_PER_ROW_LG; // 8 items

    const displayedBuildings = useMemo(() => {
        if (!availableBuildings) return [];
        if (buildingsExpanded) return availableBuildings;
        return availableBuildings.slice(0, collapsedCount);
    }, [availableBuildings, buildingsExpanded, collapsedCount]);

    const hasMoreBuildings = availableBuildings && availableBuildings.length > collapsedCount;

    const handleFieldChange = (field: string, value: any) => {
        setFormData({ [field]: value });
    };

    const handleBuildingToggle = (buildingId: number) => {
        const currentlySelected = formData.selectedBuildingIds || [];
        const isSelected = currentlySelected.includes(buildingId);

        if (isSelected) {
            setFormData({
                selectedBuildingIds: currentlySelected.filter(id => id !== buildingId)
            });
        } else {
            setFormData({
                selectedBuildingIds: [...currentlySelected, buildingId]
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Combined Card: Contract Info + Building Selection + VO Basic Information */}
            <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                {/* Contract Context Header */}
                {contractData && (
                    <div className="flex items-center gap-6 text-sm flex-wrap mb-4 pb-4 border-b border-base-300">
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--file-text text-primary size-4"></span>
                            <span className="text-base-content/70 font-medium">Contract:</span>
                            <span className="font-semibold text-base-content">{contractData.contractNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--building-2 text-primary size-4"></span>
                            <span className="text-base-content/70 font-medium">Project:</span>
                            <span className="font-semibold text-base-content">{contractData.projectName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--users text-primary size-4"></span>
                            <span className="text-base-content/70 font-medium">Subcontractor:</span>
                            <span className="font-semibold text-base-content">{contractData.subcontractorName}</span>
                        </div>
                    </div>
                )}

                {/* Building Selection Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-primary rounded-full"></span>
                            <h2 className="text-lg font-semibold text-base-content">Building Selection</h2>
                        </div>
                        {formData.selectedBuildingIds && formData.selectedBuildingIds.length > 0 && (
                            <span className="badge badge-primary badge-sm">
                                {formData.selectedBuildingIds.length} selected
                            </span>
                        )}
                    </div>

                    {/* Buildings Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {displayedBuildings && displayedBuildings.length > 0 ? (
                            displayedBuildings.map((building: any) => {
                                const isSelected = (formData.selectedBuildingIds || []).includes(building.id);

                                return (
                                    <div
                                        key={building.id}
                                        className={`flex items-center p-2 rounded-lg border-2 transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-primary bg-primary/10'
                                                : 'border-base-300 bg-base-100 hover:border-primary/50'
                                        }`}
                                        onClick={() => handleBuildingToggle(building.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary checkbox-sm mr-2"
                                            checked={isSelected}
                                            onChange={() => {}}
                                        />
                                        <span className="iconify lucide--building text-base-content/70 size-4 mr-1 flex-shrink-0"></span>
                                        <span className="font-medium text-base-content text-sm truncate">
                                            {building.name || building.buildingName}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center p-4 text-base-content/60">
                                <span className="iconify lucide--building size-8 mb-1"></span>
                                <p className="text-sm">No buildings available</p>
                            </div>
                        )}
                    </div>

                    {/* Expand/Collapse Button */}
                    {hasMoreBuildings && (
                        <div className="flex justify-center mt-2">
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs text-primary"
                                onClick={() => setBuildingsExpanded(!buildingsExpanded)}
                            >
                                {buildingsExpanded ? (
                                    <>
                                        <span className="iconify lucide--chevron-up size-4"></span>
                                        Show Less
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--chevron-down size-4"></span>
                                        Show {availableBuildings.length - collapsedCount} More
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="divider my-4"></div>

                {/* VO Basic Information Section */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-3 h-3 bg-primary rounded-full"></span>
                        <h2 className="text-lg font-semibold text-base-content">VO Basic Information</h2>
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* VO Number */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-medium text-sm">VO Number *</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered input-sm"
                                value={formData.voNumber || ''}
                                onChange={(e) => handleFieldChange('voNumber', e.target.value)}
                                placeholder="VO Number"
                            />
                        </div>

                        {/* VO Date */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-medium text-sm">VO Date *</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered input-sm"
                                value={formData.voDate || ''}
                                onChange={(e) => handleFieldChange('voDate', e.target.value)}
                            />
                        </div>

                        {/* VO Type */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-medium text-sm">VO Type *</span>
                            </label>
                            <select
                                className="select select-bordered select-sm"
                                value={formData.voType || ''}
                                onChange={(e) => handleFieldChange('voType', e.target.value)}
                            >
                                <option value="">Select type</option>
                                <option value="Addition">Addition</option>
                                <option value="Omission">Omission</option>
                            </select>
                        </div>

                        {/* VO Contract */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-medium text-sm">VO Contract *</span>
                            </label>
                            <select
                                className="select select-bordered select-sm"
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

                        {/* Sub Trade */}
                        <div className="form-control">
                            <label className="label py-1">
                                <span className="label-text font-medium text-sm">Sub Trade</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered input-sm"
                                value={formData.subTrade || ''}
                                onChange={(e) => handleFieldChange('subTrade', e.target.value)}
                                placeholder="Optional"
                            />
                        </div>

                        {/* Empty cell for alignment */}
                        <div className="hidden lg:block"></div>
                    </div>

                    {/* Description */}
                    <div className="form-control mt-4">
                        <label className="label py-1">
                            <span className="label-text font-medium text-sm">Description</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered textarea-sm w-full"
                            rows={2}
                            value={formData.description || ''}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Optional - Describe the variation order and reason for change..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
