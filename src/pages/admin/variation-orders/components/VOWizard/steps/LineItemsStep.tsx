import { useState, useEffect } from "react";
import { Input, Select, SelectOption, Button } from "@/components/daisyui";
import { WizardStepProps, VODataEntryStepData } from "../types";
import VOLineItemsWrapper from "../components/VOLineItemsWrapper";

const VODataEntryStep: React.FC<WizardStepProps> = ({
    data,
    onDataChange,
    onValidationChange,
    mode,
    voDataset
}) => {
    const [formData, setFormData] = useState<VODataEntryStepData>({
        voNumber: data.voDataEntry?.voNumber || generateVONumber(),
        description: data.voDataEntry?.description || '',
        type: data.voDataEntry?.type || 'Addition',
        date: data.voDataEntry?.date || new Date().toISOString().split('T')[0],
        items: data.voDataEntry?.items || [],
        totalAmount: data.voDataEntry?.totalAmount || 0,
        currency: data.voDataEntry?.currency || 'USD',
        attachments: data.voDataEntry?.attachments || []
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Validation and data update
    useEffect(() => {
        const newErrors: Record<string, string> = {};

        if (!formData.voNumber.trim()) {
            newErrors.voNumber = 'VO Number is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (formData.items.length === 0) {
            newErrors.items = 'At least one line item is required';
        }

        setErrors(newErrors);
        
        const isValid = Object.keys(newErrors).length === 0;
        onValidationChange(isValid);
        onDataChange(formData);
    }, [formData, onDataChange, onValidationChange]);

    const handleFieldChange = (field: keyof VODataEntryStepData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleLineItemsChange = (items: any[], totalAmount: number) => {
        setFormData(prev => ({
            ...prev,
            items,
            totalAmount
        }));
    };

    function generateVONumber(): string {
        const timestamp = Date.now().toString().slice(-6);
        const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        return `VO${timestamp}${randomNum}`;
    }

    const regenerateVONumber = () => {
        handleFieldChange('voNumber', generateVONumber());
    };

    const handleFileUpload = (files: FileList | null) => {
        if (files) {
            const newAttachments = Array.from(files);
            handleFieldChange('attachments', [...(formData.attachments || []), ...newAttachments]);
        }
    };

    const removeAttachment = (index: number) => {
        const newAttachments = (formData.attachments || []).filter((_, i) => i !== index);
        handleFieldChange('attachments', newAttachments);
    };

    return (
        <div className="space-y-6">
            {/* VO Basic Information */}
            <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-base-content mb-4 flex items-center gap-2">
                    <span className="iconify lucide--info size-4"></span>
                    VO Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Button
                                type="button"
                                size="sm"
                                className="bg-base-300 text-base-content hover:bg-base-400"
                                onClick={regenerateVONumber}
                                title="Generate new VO number"
                            >
                                <span className="iconify lucide--refresh-cw size-4"></span>
                            </Button>
                        </div>
                        {errors.voNumber && (
                            <div className="text-red-500 text-xs mt-1">{errors.voNumber}</div>
                        )}
                    </label>

                    <label className="floating-label">
                        <span>Type *</span>
                        <Select
                            className="input input-sm bg-base-100 border-base-300"
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

                    <label className="floating-label md:col-span-2">
                        <span>Description *</span>
                        <textarea
                            className={`textarea textarea-sm bg-base-100 min-h-16 ${
                                errors.description ? 'border-red-500' : 'border-base-300'
                            }`}
                            value={formData.description}
                            onChange={(e: any) => handleFieldChange('description', e.target.value)}
                            placeholder="Enter VO description..."
                            rows={3}
                        />
                        {errors.description && (
                            <div className="text-red-500 text-xs mt-1">{errors.description}</div>
                        )}
                    </label>

                    <label className="floating-label">
                        <span>Date *</span>
                        <Input
                            type="date"
                            className="input input-sm bg-base-100 border-base-300"
                            value={formData.date}
                            onChange={(e) => handleFieldChange('date', e.target.value)}
                        />
                    </label>

                    <label className="floating-label">
                        <span>Currency</span>
                        <Select
                            className="input input-sm bg-base-100 border-base-300"
                            value={formData.currency}
                            onChange={(e) => handleFieldChange('currency', e.target.value)}
                        >
                            <>
                                <SelectOption value="USD" className="bg-base-100">USD ($)</SelectOption>
                                <SelectOption value="EUR" className="bg-base-100">EUR (€)</SelectOption>
                                <SelectOption value="MAD" className="bg-base-100">MAD (د.م.)</SelectOption>
                            </>
                        </Select>
                    </label>
                </div>
            </div>

            {/* BOQ Line Items */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-base-content flex items-center gap-2">
                        <span className="iconify lucide--list size-4"></span>
                        VO Line Items
                    </h3>
                    <div className={`text-sm px-3 py-1 rounded-full ${
                        formData.type === 'Addition' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                        {formData.type} VO: {formData.type === 'Addition' ? '+' : '-'}${formData.totalAmount.toLocaleString()}
                    </div>
                </div>
                
                <div className="bg-base-100 rounded-lg border border-base-300">
                    <VOLineItemsWrapper
                        items={formData.items}
                        onItemsChange={handleLineItemsChange}
                        mode="edit"
                        currency={formData.currency}
                        showControls={true}
                    />
                </div>

                {errors.items && (
                    <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                        <span className="iconify lucide--alert-circle size-4"></span>
                        {errors.items}
                    </div>
                )}
            </div>

            {/* Document Attachments */}
            <div className="space-y-3">
                <h3 className="text-base font-semibold text-base-content flex items-center gap-2">
                    <span className="iconify lucide--paperclip size-4"></span>
                    Document Attachments (Optional)
                </h3>
                
                <div className="p-4 border-2 border-dashed border-base-300 rounded-lg">
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        className="file-input file-input-sm file-input-bordered w-full"
                    />
                    <p className="text-xs text-base-content/70 mt-2">
                        Supported formats: PDF, Word, Excel, Images. Max 10MB per file.
                    </p>
                </div>

                {(formData.attachments && formData.attachments.length > 0) && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-base-content">Attached Files:</h4>
                        {(formData.attachments || []).map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-base-200 rounded">
                                <div className="flex items-center gap-2">
                                    <span className="iconify lucide--file size-4 text-base-content/70"></span>
                                    <span className="text-sm">{file.name}</span>
                                    <span className="text-xs text-base-content/60">
                                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    className="bg-red-600 text-white hover:bg-red-700"
                                    onClick={() => removeAttachment(index)}
                                >
                                    <span className="iconify lucide--x size-3"></span>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <span className="iconify lucide--lightbulb text-blue-600 dark:text-blue-400 size-5 mt-0.5"></span>
                    <div>
                        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            VO Data Entry Instructions
                        </h5>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• Enter a unique VO number or generate one automatically</li>
                            <li>• Add line items with accurate quantities and unit prices</li>
                            <li>• Total amount will be calculated automatically from line items</li>
                            <li>• Attach supporting documents if needed (drawings, specifications, etc.)</li>
                            <li>• Review all information before proceeding to save</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VODataEntryStep;