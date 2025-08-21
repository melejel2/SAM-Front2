import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import useToast from "@/hooks/use-toast";
import useProjects from "@/pages/admin/adminTools/projects/use-projects";
import useBuildings from "@/hooks/use-buildings";
import useSubcontractors from "@/pages/admin/adminTools/subcontractors/use-subcontractors";
import useVariationOrders from "../use-variation-orders";
import { VoDatasetBoqDetailsVM } from "@/types/variation-order";

// Multi-step wizard component for creating VOs
const CreateVOForm = () => {
    const navigate = useNavigate();
    const { toaster } = useToast();
    const { projects, getProjects } = useProjects();
    const { buildings, getBuildingsByProject } = useBuildings();
    const { subcontractors, getSubcontractors } = useSubcontractors();
    const { saveVoDataset, saveLoading } = useVariationOrders();

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<VoDatasetBoqDetailsVM>>({
        voNumber: '',
        contractNumber: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Editable',
        type: 'Addition',
        amount: 0,
        projectId: null,
        buildingId: null,
        subcontractorId: null,
        remark: '',
        buildings: []
    });

    const steps = [
        {
            title: "Basic Information",
            description: "VO details and project selection",
            icon: "lucide--file-text"
        },
        {
            title: "Project & Building",
            description: "Select project and building",
            icon: "lucide--building"
        },
        {
            title: "Subcontractor",
            description: "Assign subcontractor",
            icon: "lucide--users"
        },
        {
            title: "Review & Create",
            description: "Review and submit VO",
            icon: "lucide--check-circle"
        }
    ];

    useEffect(() => {
        getProjects();
        getSubcontractors();
    }, []);

    useEffect(() => {
        if (formData.projectId) {
            getBuildingsByProject(formData.projectId);
        }
    }, [formData.projectId]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const isStepValid = (step: number): boolean => {
        switch (step) {
            case 0:
                return !!(formData.voNumber && formData.contractNumber);
            case 1:
                return !!(formData.projectId && formData.buildingId);
            case 2:
                return !!formData.subcontractorId;
            case 3:
                return true; // Review step
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1 && isStepValid(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!isStepValid(currentStep - 1)) {
            toaster.error("Please complete all required fields");
            return;
        }

        try {
            const result = await saveVoDataset(formData as VoDatasetBoqDetailsVM);
            if (result.isSuccess) {
                toaster.success("Variation Order created successfully");
                navigate("/admin/variation-orders");
            } else {
                toaster.error(result.error?.message || "Failed to create VO");
            }
        } catch (error) {
            toaster.error("Failed to create VO");
        }
    };

    const renderStepIndicator = () => (
        <div className="w-full bg-base-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-base-300">
                    <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    ></div>
                </div>
                
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;
                    const isValid = index <= currentStep ? isStepValid(index) : false;
                    
                    return (
                        <div key={index} className="flex flex-col items-center relative z-10">
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                                ${isCompleted 
                                    ? 'bg-success text-success-content' 
                                    : isActive 
                                    ? 'bg-primary text-primary-content' 
                                    : 'bg-base-300 text-base-content'
                                }
                            `}>
                                {isCompleted ? (
                                    <span className="iconify lucide--check size-5"></span>
                                ) : (
                                    <span className={`iconify ${step.icon} size-5`}></span>
                                )}
                            </div>
                            <div className="mt-3 text-center">
                                <p className={`font-semibold text-sm ${
                                    isActive ? 'text-primary' : 'text-base-content'
                                }`}>
                                    {step.title}
                                </p>
                                <p className="text-xs text-base-content/70 mt-1">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <span className="iconify lucide--file-text size-5"></span>
                            Basic Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">VO Number *</span>
                                </label>
                                <input 
                                    type="text" 
                                    className="input input-bordered w-full"
                                    value={formData.voNumber || ''}
                                    onChange={(e) => handleInputChange('voNumber', e.target.value)}
                                    placeholder="Enter VO number"
                                />
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Contract Number *</span>
                                </label>
                                <input 
                                    type="text" 
                                    className="input input-bordered w-full"
                                    value={formData.contractNumber || ''}
                                    onChange={(e) => handleInputChange('contractNumber', e.target.value)}
                                    placeholder="Enter contract number"
                                />
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Date</span>
                                </label>
                                <input 
                                    type="date" 
                                    className="input input-bordered w-full"
                                    value={formData.date || ''}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                />
                            </div>
                            
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium">Type</span>
                                </label>
                                <select 
                                    className="select select-bordered w-full"
                                    value={formData.type || 'Addition'}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                >
                                    <option value="Addition">Addition</option>
                                    <option value="Omission">Omission</option>
                                    <option value="Revision">Revision</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Remark</span>
                            </label>
                            <textarea 
                                className="textarea textarea-bordered h-24"
                                value={formData.remark || ''}
                                onChange={(e) => handleInputChange('remark', e.target.value)}
                                placeholder="Enter any remarks or notes"
                            ></textarea>
                        </div>
                    </div>
                );
                
            case 1:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <span className="iconify lucide--building size-5"></span>
                            Project & Building Selection
                        </h3>
                        
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Project *</span>
                            </label>
                            <select 
                                className="select select-bordered w-full"
                                value={formData.projectId || ""}
                                onChange={(e) => handleInputChange('projectId', Number(e.target.value))}
                            >
                                <option value="">Select a project</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Building *</span>
                            </label>
                            <select 
                                className="select select-bordered w-full"
                                value={formData.buildingId || ""}
                                onChange={(e) => handleInputChange('buildingId', Number(e.target.value))}
                                disabled={!formData.projectId}
                            >
                                <option value="">Select a building</option>
                                {buildings.map((building) => (
                                    <option key={building.id} value={building.id}>
                                        {building.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
                
            case 2:
                return (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <span className="iconify lucide--users size-5"></span>
                            Subcontractor Assignment
                        </h3>
                        
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">Subcontractor *</span>
                            </label>
                            <select 
                                className="select select-bordered w-full"
                                value={formData.subcontractorId || ""}
                                onChange={(e) => handleInputChange('subcontractorId', Number(e.target.value))}
                            >
                                <option value="">Select a subcontractor</option>
                                {subcontractors.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
                
            case 3:
                const selectedProject = projects.find(p => p.id === formData.projectId);
                const selectedBuilding = buildings.find(b => b.id === formData.buildingId);
                const selectedSubcontractor = subcontractors.find(s => s.id === formData.subcontractorId);
                
                return (
                    <div className="space-y-6">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <span className="iconify lucide--check-circle size-5"></span>
                            Review & Create VO
                        </h3>
                        
                        <div className="card bg-base-200 border border-base-300 p-6">
                            <h4 className="font-semibold mb-4">VO Summary</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-base-content/70">VO Number</p>
                                    <p className="font-semibold">{formData.voNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/70">Contract Number</p>
                                    <p className="font-semibold">{formData.contractNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/70">Date</p>
                                    <p className="font-semibold">{formData.date}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/70">Type</p>
                                    <p className="font-semibold">{formData.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/70">Project</p>
                                    <p className="font-semibold">{selectedProject?.name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-base-content/70">Building</p>
                                    <p className="font-semibold">{selectedBuilding?.name || '-'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <p className="text-sm text-base-content/70">Subcontractor</p>
                                    <p className="font-semibold">{selectedSubcontractor?.name || '-'}</p>
                                </div>
                            </div>
                            
                            {formData.remark && (
                                <div className="mt-4">
                                    <p className="text-sm text-base-content/70">Remark</p>
                                    <p className="font-medium">{formData.remark}</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="alert alert-info">
                            <span className="iconify lucide--info size-5"></span>
                            <div>
                                <h4 className="font-semibold">Next Steps</h4>
                                <p className="text-sm">After creating the VO, you can add BOQ items and details through the edit interface.</p>
                            </div>
                        </div>
                    </div>
                );
                
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate("/admin/variation-orders")}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <span className="iconify lucide--file-plus text-primary size-5"></span>
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-base-content">Create Variation Order</h1>
                            <p className="text-sm text-base-content/70">Create a new variation order in {steps.length} steps</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Indicator */}
            {renderStepIndicator()}

            {/* Step Content */}
            <div className="card bg-base-100 border border-base-300 p-8 mb-8">
                {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
                <button 
                    className="btn btn-ghost"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                >
                    <span className="iconify lucide--chevron-left size-4"></span>
                    Previous
                </button>
                
                <div className="flex gap-2">
                    {currentStep < steps.length - 1 ? (
                        <button 
                            className="btn btn-primary"
                            onClick={handleNext}
                            disabled={!isStepValid(currentStep)}
                        >
                            Next
                            <span className="iconify lucide--chevron-right size-4"></span>
                        </button>
                    ) : (
                        <button 
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={saveLoading || !isStepValid(currentStep)}
                        >
                            {saveLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span className="iconify lucide--check size-4"></span>
                                    Create VO
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateVOForm;
