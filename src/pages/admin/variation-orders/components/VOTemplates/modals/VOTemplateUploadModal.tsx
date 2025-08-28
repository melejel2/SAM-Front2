import { useState } from "react";
import { Button, Select, SelectOption } from "@/components/daisyui";
import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import useVOTemplates from "../use-vo-templates";
import { ContractType } from "@/types/variation-order";

interface VOTemplateUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    templateType: ContractType;
}

const VOTemplateUploadModal: React.FC<VOTemplateUploadModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    templateType
}) => {
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        templateNumber: '',
        type: templateType,
        language: 'English'
    });
    const [uploading, setUploading] = useState(false);

    const { uploadVoTemplate } = useVOTemplates();
    const { toaster } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
                toaster.error("Please select a Word document (.doc or .docx)");
                return;
            }
            
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toaster.error("File size must be less than 10MB");
                return;
            }
            
            setTemplateFile(file);
            
            // Auto-fill template name if empty
            if (!formData.name) {
                const fileName = file.name.replace(/\.(docx?|doc)$/i, '');
                setFormData(prev => ({ ...prev, name: fileName }));
            }
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!templateFile) {
            toaster.error("Please select a template file");
            return;
        }
        
        if (!formData.name.trim()) {
            toaster.error("Please enter a template name");
            return;
        }
        
        if (!formData.templateNumber.trim()) {
            toaster.error("Please enter a template number");
            return;
        }
        
        setUploading(true);
        
        try {
            const result = await uploadVoTemplate(templateFile, formData);
            
            if (result.isSuccess) {
                toaster.success("Template uploaded successfully");
                handleClose();
                onSuccess();
            }
        } catch (error) {
            console.error("Upload error:", error);
            toaster.error("Failed to upload template");
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setTemplateFile(null);
        setFormData({
            name: '',
            templateNumber: '',
            type: templateType,
            language: 'English'
        });
        setUploading(false);
        onClose();
    };

    // Contract type options
    const contractTypeOptions = [
        { value: ContractType.VO, label: "Variation Order" },
        { value: ContractType.RG, label: "Regulatory" },
        { value: ContractType.Terminate, label: "Termination" },
        { value: ContractType.Final, label: "Final" }
    ];

    // Language options
    const languageOptions = [
        { value: "English", label: "English" },
        { value: "French", label: "French" },
        { value: "Arabic", label: "Arabic" }
    ];

    if (!isOpen) return null;

    return (
        <dialog className="modal modal-open">
            <div className="modal-box w-full max-w-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                            <span className="iconify lucide--upload text-blue-600 dark:text-blue-400 size-5"></span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-base-content">Upload VO Template</h3>
                            <p className="text-sm text-base-content/70">Upload a Word document template for variation orders</p>
                        </div>
                    </div>
                    <button
                        className="btn btn-sm btn-ghost"
                        onClick={handleClose}
                        disabled={uploading}
                    >
                        <span className="iconify lucide--x size-4"></span>
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Upload Section */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-base-content">
                            Template File *
                        </label>
                        <div className="border-2 border-dashed border-base-300 rounded-lg p-6 text-center">
                            <input
                                type="file"
                                accept=".doc,.docx"
                                onChange={handleFileChange}
                                className="hidden"
                                id="templateFile"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="templateFile"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                <span className="iconify lucide--upload size-12 text-base-content/50 mb-2"></span>
                                {templateFile ? (
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-base-content">{templateFile.name}</p>
                                        <p className="text-xs text-base-content/70">
                                            {(templateFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-base-content">
                                            Click to select or drag and drop
                                        </p>
                                        <p className="text-xs text-base-content/70">
                                            Word documents (.doc, .docx) up to 10MB
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Template Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="floating-label">
                            <span>Template Name *</span>
                            <input
                                type="text"
                                className="input input-sm bg-base-100 border-base-300"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter template name"
                                disabled={uploading}
                                required
                            />
                        </label>

                        <label className="floating-label">
                            <span>Template Number *</span>
                            <input
                                type="text"
                                className="input input-sm bg-base-100 border-base-300"
                                value={formData.templateNumber}
                                onChange={(e) => handleInputChange('templateNumber', e.target.value)}
                                placeholder="e.g., VO-001"
                                disabled={uploading}
                                required
                            />
                        </label>

                        <label className="floating-label">
                            <span>Contract Type</span>
                            <Select
                                className="input input-sm bg-base-100 border-base-300"
                                value={formData.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                                disabled={uploading}
                            >
                                <>
                                    {contractTypeOptions.map((option) => (
                                        <SelectOption key={option.value} value={option.value} className="bg-base-100">
                                            {option.label}
                                        </SelectOption>
                                    ))}
                                </>
                            </Select>
                        </label>

                        <label className="floating-label">
                            <span>Language</span>
                            <Select
                                className="input input-sm bg-base-100 border-base-300"
                                value={formData.language}
                                onChange={(e) => handleInputChange('language', e.target.value)}
                                disabled={uploading}
                            >
                                <>
                                    {languageOptions.map((option) => (
                                        <SelectOption key={option.value} value={option.value} className="bg-base-100">
                                            {option.label}
                                        </SelectOption>
                                    ))}
                                </>
                            </Select>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-base-300">
                        <Button
                            type="button"
                            size="sm"
                            className="bg-base-200 text-base-content hover:bg-base-300"
                            onClick={handleClose}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className="btn-primary"
                            disabled={uploading || !templateFile || !formData.name.trim() || !formData.templateNumber.trim()}
                        >
                            {uploading ? (
                                <>
                                    <Loader />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--upload size-4"></span>
                                    Upload Template
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose} disabled={uploading}>close</button>
            </form>
        </dialog>
    );
};

export default VOTemplateUploadModal;