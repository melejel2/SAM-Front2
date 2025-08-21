import React from "react";
import { useVOWizardContext } from "../context/VOWizardContext";

export const VOStep1_BasicInfo: React.FC = () => {
    const { formData, setFormData } = useVOWizardContext();

    const handleInputChange = (field: string, value: string) => {
        setFormData({ [field]: value });
    };

    const handleLevelChange = (level: 'Project' | 'Building' | 'Sheet') => {
        setFormData({ 
            level,
            // Reset dependent fields when level changes
            projectId: null,
            buildingId: null,
            sheetName: ''
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-base-content mb-2">
                    Basic Information
                </h2>
                <p className="text-sm text-base-content/70 mb-6">
                    Enter the basic details for your Variation Order
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium">VO Title *</span>
                    </label>
                    <input
                        type="text"
                        className="input input-bordered"
                        placeholder="Enter VO title..."
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                </div>

                {/* Level Selection */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium">VO Level *</span>
                    </label>
                    <select 
                        className="select select-bordered"
                        value={formData.level}
                        onChange={(e) => handleLevelChange(e.target.value as 'Project' | 'Building' | 'Sheet')}
                    >
                        <option value="Project">Project Level</option>
                        <option value="Building">Building Level</option>
                        <option value="Sheet">Sheet Level</option>
                    </select>
                </div>
            </div>

            {/* Description */}
            <div className="form-control">
                <label className="label">
                    <span className="label-text font-medium">Description *</span>
                </label>
                <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Describe the variation order..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                ></textarea>
            </div>

            {/* Level Description */}
            <div className="alert alert-info">
                <span className="iconify lucide--info size-5"></span>
                <div>
                    <h3 className="font-bold">VO Level: {formData.level}</h3>
                    <div className="text-xs">
                        {formData.level === 'Project' && "This VO will apply to the entire project"}
                        {formData.level === 'Building' && "This VO will apply to a specific building within a project"}
                        {formData.level === 'Sheet' && "This VO will apply to a specific sheet within a building"}
                    </div>
                </div>
            </div>
        </div>
    );
};
