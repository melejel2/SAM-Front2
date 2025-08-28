import React, { useState, useEffect } from "react";
import { useVOWizardContext } from "../context/VOWizardContext";
import { Button } from "@/components/daisyui";
import useMultiBuildingVO from "../../components/MultiBuildingSelector/use-multi-building-vo";
import MultiBuildingVOProgressModal from "../../components/MultiBuildingSelector/MultiBuildingVOProgressModal";
import useVariationOrders from "../../use-variation-orders";
import useSubcontractors from "@/pages/admin/adminTools/subcontractors/use-subcontractors";
import SAMTable from "@/components/Table";
import VOTemplatesManager from "../../components/VOTemplates";

export const VOStep3_MultiBuildingGeneration: React.FC = () => {
    const { formData } = useVOWizardContext();
    const { isGenerating, generationProgress, generateVOForBuildings, resetProgress } = useMultiBuildingVO();
    const { tableData: subcontractors, getSubcontractors } = useSubcontractors();
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<any>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [generationResults, setGenerationResults] = useState<any>(null);

    // Basic VO form data
    const [voBasicData, setVoBasicData] = useState({
        voNumber: `VO-MB-${Date.now()}`,
        voName: formData.title,
        voDate: new Date().toISOString().split('T')[0],
        contractType: 1 // VO contract type
    });

    useEffect(() => {
        getSubcontractors();
    }, []);

    const handleStartGeneration = async () => {
        if (!selectedSubcontractor) {
            // Show validation error
            return;
        }

        const baseVOData = {
            voNumber: voBasicData.voNumber,
            voName: voBasicData.voName,
            voDate: voBasicData.voDate,
            contractType: voBasicData.contractType,
            subcontractorId: selectedSubcontractor.id,
            projectId: formData.projectId!,
            templateId: selectedTemplate?.id
        };

        setShowProgressModal(true);
        
        const results = await generateVOForBuildings(
            formData.multiBuildingConfigs,
            baseVOData
        );
        
        setGenerationResults(results);
    };

    const handleProgressModalClose = () => {
        setShowProgressModal(false);
        if (generationResults && generationResults.successCount > 0) {
            // Optionally navigate to results or dashboard
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setVoBasicData(prev => ({ ...prev, [field]: value }));
    };

    if (formData.level !== 'Multi-Building') {
        return (
            <div className="text-center py-8">
                <span className="text-base-content/50">This step is only for multi-building VO generation</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-base-content mb-2">
                    Multi-Building VO Generation
                </h2>
                <p className="text-sm text-base-content/70 mb-6">
                    Configure and generate VOs for {formData.multiBuildingConfigs.length} selected buildings
                </p>
            </div>

            {/* VO Basic Configuration */}
            <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                    <span className="iconify lucide--settings size-5 text-primary"></span>
                    Base VO Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">VO Number Base *</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered"
                            placeholder="e.g., VO-2025-001"
                            value={voBasicData.voNumber}
                            onChange={(e) => handleInputChange('voNumber', e.target.value)}
                        />
                        <label className="label">
                            <span className="label-text-alt text-base-content/60">
                                Building ID will be appended (e.g., VO-2025-001-B123)
                            </span>
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-medium">VO Date *</span>
                        </label>
                        <input
                            type="date"
                            className="input input-bordered"
                            value={voBasicData.voDate}
                            onChange={(e) => handleInputChange('voDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Subcontractor Selection */}
            <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                    <span className="iconify lucide--user-check size-5 text-primary"></span>
                    Subcontractor Selection
                </h3>
                
                <SAMTable
                    columns={{ 
                        name: "Name",
                        email: "Email",
                        phone: "Phone",
                        city: "City"
                    }}
                    tableData={subcontractors}
                    title="Select Subcontractor"
                    loading={false}
                    onSuccess={() => {}}
                    onRowSelect={setSelectedSubcontractor}
                    select={false}
                    actions={false}
                    addBtn={false}
                    rowsPerPage={5}
                />
                
                {selectedSubcontractor && (
                    <div className="mt-3 bg-success/10 border border-success/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--check-circle text-success size-5"></span>
                            <span className="font-medium text-success">
                                Selected: {selectedSubcontractor.name}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Template Selection (Optional) */}
            <div className="bg-base-100 border border-base-300 rounded-lg">
                <div className="p-4 border-b border-base-300">
                    <h3 className="font-medium flex items-center gap-2">
                        <span className="iconify lucide--file-text size-5 text-primary"></span>
                        VO Template (Optional)
                    </h3>
                    <p className="text-sm text-base-content/70 mt-1">
                        Select a template to apply to all generated VOs
                    </p>
                </div>
                
                <VOTemplatesManager
                    onTemplateSelect={setSelectedTemplate}
                    selectedTemplateId={selectedTemplate?.id}
                    readonly={false}
                    showActions={false}
                />
            </div>

            {/* Building Summary */}
            <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                    <span className="iconify lucide--building-2 size-5 text-primary"></span>
                    Buildings Summary
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {formData.multiBuildingConfigs.map((config, index) => (
                        <div key={config.buildingId} className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-medium text-sm">{config.buildingName}</div>
                                    <div className="text-xs text-base-content/60 mt-1">
                                        Level {config.voLevel} • {config.replaceMode ? 'Replace' : 'Append'}
                                    </div>
                                    <div className="text-xs text-primary mt-1">
                                        Will create: {voBasicData.voNumber}-B{config.buildingId}
                                    </div>
                                </div>
                                <div className="bg-primary text-primary-content text-xs px-2 py-1 rounded">
                                    #{index + 1}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Generation Actions */}
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <span className="iconify lucide--alert-triangle text-warning size-5 mt-1"></span>
                    <div className="flex-1">
                        <div className="font-medium text-warning-content">
                            Ready to Generate Multi-Building VOs
                        </div>
                        <div className="text-sm text-base-content/70 mt-1">
                            This will create {formData.multiBuildingConfigs.length} separate VO datasets, 
                            one for each selected building. This process cannot be undone.
                        </div>
                        
                        <div className="mt-4 flex gap-3">
                            <Button
                                type="button"
                                onClick={handleStartGeneration}
                                disabled={!selectedSubcontractor || isGenerating}
                                className="bg-primary text-primary-content hover:bg-primary/90"
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span className="iconify lucide--rocket size-4"></span>
                                        Start Generation
                                    </>
                                )}
                            </Button>
                            
                            {generationResults && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowProgressModal(true)}
                                >
                                    <span className="iconify lucide--eye size-4"></span>
                                    View Results
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Modal */}
            <MultiBuildingVOProgressModal
                isOpen={showProgressModal}
                onClose={handleProgressModalClose}
                progress={generationProgress}
                isGenerating={isGenerating}
                onViewResults={() => {
                    // Navigate to VO dashboard or results page
                    console.log('View results clicked');
                }}
            />
        </div>
    );
};