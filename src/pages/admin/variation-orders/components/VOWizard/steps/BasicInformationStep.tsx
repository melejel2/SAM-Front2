import { useState, useEffect } from "react";
import { Input, Select, SelectOption } from "@/components/daisyui";
import { WizardStepProps, VODataEntryStepData } from "../types";

const BasicInformationStep: React.FC<WizardStepProps> = ({
    data,
    onDataChange,
    onValidationChange,
    mode,
    voDataset
}) => {
    const [formData, setFormData] = useState<VODataEntryStepData>({
        voNumber: data.voDataEntry?.voNumber || '',
        description: data.voDataEntry?.description || '',
        type: data.voDataEntry?.type || 'Addition',
        date: data.voDataEntry?.date || new Date().toISOString().split('T')[0],
        items: data.voDataEntry?.items || [],
        totalAmount: data.voDataEntry?.totalAmount || 0,
        currency: data.voDataEntry?.currency || '',
        attachments: data.voDataEntry?.attachments || []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validation logic
    useEffect(() => {
        const newErrors: Record<string, string> = {};

        if (!formData.voNumber.trim()) {
            newErrors.voNumber = 'VO Number is required';
        }


        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.date) {
            newErrors.date = 'Date is required';
        }

        setErrors(newErrors);
        
        const isValid = Object.keys(newErrors).length === 0;
        onValidationChange(isValid);

        // Update parent data
        onDataChange(formData);
    }, [formData, onDataChange, onValidationChange]);

    const handleFieldChange = (field: keyof VODataEntryStepData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const generateVONumber = () => {
        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const voNumber = `VO${timestamp}${randomNum}`;
        handleFieldChange('voNumber', voNumber);
    };

    return (
        <div className="space-y-6">
            {/* VO Number and Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="floating-label">
                    <span>VO Number *</span>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            className={`input input-sm bg-base-100 flex-1 ${
                                errors.voNumber ? 'border-red-500' : 'border-base-300'
                            }`}
                            value={formData.voNumber}
                            onChange={(e) => handleFieldChange('voNumber', e.target.value)}
                            placeholder="Enter VO number"
                        />
                        <button
                            type="button"
                            className="btn btn-sm bg-base-200 text-base-content hover:bg-base-300"
                            onClick={generateVONumber}
                            title="Generate automatic VO number"
                        >
                            <span className="iconify lucide--refresh-cw size-4"></span>
                        </button>
                    </div>
                    {errors.voNumber && (
                        <div className="text-red-500 text-xs mt-1">{errors.voNumber}</div>
                    )}
                </label>

                <label className="floating-label">
                    <span>VO Type *</span>
                    <Select
                        className={`input input-sm bg-base-100 ${
                            errors.type ? 'border-red-500' : 'border-base-300'
                        }`}
                        value={formData.type}
                        onChange={(e) => handleFieldChange('type', e.target.value as 'Addition' | 'Deduction')}
                    >
                        <>
                            <SelectOption value="Addition" className="bg-base-100">
                                Addition (+)
                            </SelectOption>
                            <SelectOption value="Deduction" className="bg-base-100">
                                Deduction (-)
                            </SelectOption>
                        </>
                    </Select>
                </label>
            </div>


            {/* Description */}
            <label className="floating-label">
                <span>Description *</span>
                <textarea
                    className={`textarea textarea-sm bg-base-100 min-h-24 ${
                        errors.description ? 'border-red-500' : 'border-base-300'
                    }`}
                    value={formData.description}
                    onChange={(e: any) => handleFieldChange('description', e.target.value)}
                    placeholder="Provide a detailed description of the variation order..."
                    rows={4}
                />
                {errors.description && (
                    <div className="text-red-500 text-xs mt-1">{errors.description}</div>
                )}
                <div className="text-xs text-base-content/60 mt-1">
                    Describe what work is being added or removed and why this variation is necessary.
                </div>
            </label>

            {/* Date and Reason Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="floating-label">
                    <span>Date *</span>
                    <Input
                        type="date"
                        className={`input input-sm bg-base-100 ${
                            errors.date ? 'border-red-500' : 'border-base-300'
                        }`}
                        value={formData.date}
                        onChange={(e) => handleFieldChange('date', e.target.value)}
                    />
                    {errors.date && (
                        <div className="text-red-500 text-xs mt-1">{errors.date}</div>
                    )}
                </label>

            </div>

            {/* VO Type Impact Indicator */}
            <div className={`p-4 rounded-lg border-2 ${
                formData.type === 'Addition' 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
                <div className="flex items-center gap-3">
                    <span className={`iconify ${
                        formData.type === 'Addition' 
                            ? 'lucide--trending-up text-green-600 dark:text-green-400'
                            : 'lucide--trending-down text-red-600 dark:text-red-400'
                    } size-6`}></span>
                    
                    <div>
                        <h4 className={`font-semibold ${
                            formData.type === 'Addition' 
                                ? 'text-green-900 dark:text-green-100'
                                : 'text-red-900 dark:text-red-100'
                        }`}>
                            {formData.type} Variation Order
                        </h4>
                        
                        <p className={`text-sm ${
                            formData.type === 'Addition' 
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-red-700 dark:text-red-300'
                        }`}>
                            {formData.type === 'Addition' 
                                ? 'This VO will increase the project scope and value'
                                : 'This VO will reduce the project scope and value'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Mode-specific information */}
            {mode === 'edit' && voDataset && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                        <span className="iconify lucide--edit text-yellow-600 dark:text-yellow-400 size-5 mt-0.5"></span>
                        <div>
                            <h5 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                                Editing Existing VO
                            </h5>
                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                You are editing an existing Variation Order. Changes made here will update the VO information.
                                Original VO ID: {voDataset.id}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Validation Summary */}
            <div className="text-sm text-base-content/70">
                <p>* Required fields must be completed to proceed to the next step.</p>
                <p className="mt-1">
                    The VO number should be unique. Use the generate button to create an automatic number, 
                    or enter a custom number following your organization's naming convention.
                </p>
            </div>
        </div>
    );
};

export default BasicInformationStep;