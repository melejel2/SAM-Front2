import { useEffect, useState } from "react";
import { Button, Select, SelectOption } from "@/components/daisyui";
import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import useVOTemplates from "./use-vo-templates";
import VOTemplateUploadModal from "./modals/VOTemplateUploadModal";
import VOTemplatePreviewModal from "./modals/VOTemplatePreviewModal";
import { ContractType } from "@/types/variation-order";

interface VOTemplatesManagerProps {
    onTemplateSelect?: (template: any) => void;
    selectedTemplateId?: number;
    readonly?: boolean;
    showActions?: boolean;
}

const VOTemplatesManager: React.FC<VOTemplatesManagerProps> = ({
    onTemplateSelect,
    selectedTemplateId,
    readonly = false,
    showActions = true
}) => {
    const {
        voTemplates,
        loading,
        voTemplateColumns,
        getVoTemplates,
        deleteVoTemplate,
        uploadVoTemplate
    } = useVOTemplates();

    const [selectedType, setSelectedType] = useState<ContractType>(ContractType.VO);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

    const loadTemplates = async () => {
        await getVoTemplates(selectedType);
    };

    useEffect(() => {
        loadTemplates();
    }, [selectedType, getVoTemplates]);

    const handleTemplateSelect = (template: any) => {
        setSelectedTemplate(template);
        if (onTemplateSelect) {
            onTemplateSelect(template);
        }
    };

    const handlePreviewTemplate = (template: any) => {
        setSelectedTemplate(template);
        setShowPreviewModal(true);
    };

    const handleDeleteTemplate = async (template: any) => {
        if (confirm(`Are you sure you want to delete template "${template.name}"?`)) {
            const success = await deleteVoTemplate(template.id);
            if (success) {
                await loadTemplates();
            }
        }
    };

    const handleUploadSuccess = async () => {
        setShowUploadModal(false);
        await loadTemplates();
    };

    // Contract type options
    const contractTypeOptions = [
        { value: ContractType.VO, label: "Variation Order" },
        { value: ContractType.RG, label: "Regulatory" },
        { value: ContractType.Terminate, label: "Termination" },
        { value: ContractType.Final, label: "Final" }
    ];

    return (
        <div className="flex flex-col bg-base-100 min-h-full">
            {/* Header Controls */}
            <div className="flex items-center justify-between p-4 border-b border-base-300">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-900/30">
                        <span className="iconify lucide--file-text text-purple-600 dark:text-purple-400 size-5"></span>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-base-content">VO Templates</h2>
                        <p className="text-sm text-base-content/70">Manage variation order document templates</p>
                    </div>
                </div>

                {showActions && (
                    <div className="flex items-center gap-3">
                        <label className="floating-label">
                            <span>Template Type</span>
                            <Select
                                className="input input-sm bg-base-100 border-base-300 w-40"
                                value={selectedType}
                                onChange={(e) => setSelectedType(Number(e.target.value) as ContractType)}
                                disabled={readonly}
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

                        {!readonly && (
                            <Button
                                type="button"
                                size="sm"
                                className="bg-primary text-primary-content hover:bg-primary/90"
                                onClick={() => setShowUploadModal(true)}
                            >
                                <span className="iconify lucide--upload size-4"></span>
                                Upload Template
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Templates Table */}
            <div className="flex-1 p-4">
                {loading ? (
                    <Loader
                        icon="file-text"
                        subtitle="Loading: VO Templates"
                        description="Fetching variation order templates..."
                        height="auto"
                        minHeight="250px"
                    />
                ) : (
                    <SAMTable
                        columns={voTemplateColumns}
                        tableData={voTemplates}
                        title={`${contractTypeOptions.find(opt => opt.value === selectedType)?.label} Templates`}
                        loading={false}
                        onSuccess={() => {}}
                        actions
                        previewAction
                        editAction={false}
                        deleteAction={!readonly}
                        rowsPerPage={20}
                        openStaticDialog={(action, template) => {
                            if (action === "Preview" && template) {
                                handlePreviewTemplate(template);
                            } else if (action === "Delete" && template) {
                                handleDeleteTemplate(template);
                            }
                        }}
                        selectedRowId={selectedTemplateId}
                    />
                )}
            </div>

            {/* Upload Modal */}
            <VOTemplateUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={handleUploadSuccess}
                templateType={selectedType}
            />

            {/* Preview Modal */}
            <VOTemplatePreviewModal
                isOpen={showPreviewModal}
                onClose={() => {
                    setShowPreviewModal(false);
                    setSelectedTemplate(null);
                }}
                template={selectedTemplate}
            />
        </div>
    );
};

export default VOTemplatesManager;