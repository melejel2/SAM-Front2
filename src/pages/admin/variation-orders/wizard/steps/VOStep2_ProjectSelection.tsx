import React, { useState, useEffect } from "react";
import { useVOWizardContext } from "../context/VOWizardContext";
import useProjects from "@/pages/admin/adminTools/projects/use-projects";
import useBuildings from "@/hooks/use-buildings";
import useSheets from "@/hooks/use-sheets";
import SAMTable from "@/components/Table";
import { Button } from "@/components/daisyui";
import MultiBuildingSelector from "../../components/MultiBuildingVO/components/MultiBuildingSelector";

interface Project {
    id: number;
    code?: string;
    name: string;
    acronym?: string;
    city?: string;
}

interface Building {
    id: number;
    name: string;
}

interface Sheet {
    id: number;
    name: string;
}

export const VOStep2_ProjectSelection: React.FC = () => {
    const { formData, setFormData } = useVOWizardContext();
    const { tableData: projects, loading: projectsLoading, getProjects } = useProjects();
    const { buildings, loading: buildingsLoading, getBuildingsByProject } = useBuildings();
    const { sheets, loading: sheetsLoading, getSheetsByProject } = useSheets();
    
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
    const [showMultiBuildingSelector, setShowMultiBuildingSelector] = useState(false);
    const [selectedBuildingConfigs, setSelectedBuildingConfigs] = useState<any[]>([]);

    // Load initial data
    useEffect(() => {
        getProjects();
    }, []);

    // Update selected items when formData changes
    useEffect(() => {
        if (projects.length > 0 && formData.projectId) {
            const project = projects.find((p: any) => p.id === formData.projectId);
            setSelectedProject(project || null);
        }
    }, [projects, formData.projectId]);

    useEffect(() => {
        if (buildings.length > 0 && formData.buildingId) {
            const building = buildings.find((b: any) => b.id === formData.buildingId);
            setSelectedBuilding(building || null);
        }
    }, [buildings, formData.buildingId]);

    const handleProjectSelect = async (project: Project) => {
        setSelectedProject(project);
        setFormData({ 
            projectId: project.id,
            buildingId: null, // Reset building when project changes
            sheetName: '' // Reset sheet when project changes
        });
        setSelectedBuilding(null);
        setSelectedSheet(null);
        
        // Load buildings for the selected project
        if (formData.level === 'Building' || formData.level === 'Sheet') {
            await getBuildingsByProject(project.id);
        }
    };

    const handleBuildingSelect = async (building: Building) => {
        setSelectedBuilding(building);
        setFormData({ 
            buildingId: building.id,
            sheetName: '' // Reset sheet when building changes
        });
        setSelectedSheet(null);
        
        // Load sheets for the selected building
        if (formData.level === 'Sheet') {
            await getSheetsByProject((building as any).projectId || building.id);
        }
    };

    const handleSheetSelect = (sheet: Sheet) => {
        setSelectedSheet(sheet);
        setFormData({ sheetName: sheet.name });
    };

    const handleMultiBuildingSelect = () => {
        if (!selectedProject) return;
        setShowMultiBuildingSelector(true);
    };

    const handleMultiBuildingConfirm = (buildingConfigs: any[]) => {
        setSelectedBuildingConfigs(buildingConfigs);
        const buildingIds = buildingConfigs.map(config => config.buildingId);
        setFormData({ 
            buildingIds,
            multiBuildingConfigs: buildingConfigs
        });
        setShowMultiBuildingSelector(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-base-content mb-2">
                    Project & Location Selection
                </h2>
                <p className="text-sm text-base-content/70 mb-6">
                    Select the target location for this {formData.level.toLowerCase()}-level variation order
                </p>
            </div>

            {/* Project Selection */}
            <div>
                <h3 className="font-medium mb-3">1. Select Project *</h3>
                <SAMTable
                    columns={{ 
                        code: "Code",
                        name: "Name", 
                        acronym: "Acronym",
                        city: "City"
                    }}
                    tableData={projects}
                    title="Projects"
                    loading={projectsLoading}
                    onSuccess={() => {}}
                    onRowSelect={handleProjectSelect}
                    select={false}
                    actions={false}
                    addBtn={false}
                />
                
                {selectedProject && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg mt-3">
                        <div className="flex items-center gap-2">
                            <span className="iconify lucide--check-circle w-5 h-5 text-green-600"></span>
                            <span className="font-medium text-green-800">
                                Selected Project: {selectedProject.name}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Multi-Building Selection (only for Multi-Building level) */}
            {formData.level === 'Multi-Building' && formData.projectId && (
                <div>
                    <h3 className="font-medium mb-3">2. Configure Buildings *</h3>
                    <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-base-content/70 mb-2">
                                    Select multiple buildings and configure VO settings for each
                                </p>
                                {selectedBuildingConfigs.length > 0 && (
                                    <div className="text-sm text-success">
                                        {selectedBuildingConfigs.length} buildings configured
                                    </div>
                                )}
                            </div>
                            <Button
                                type="button"
                                onClick={handleMultiBuildingSelect}
                                className="bg-primary text-primary-content hover:bg-primary/90"
                            >
                                <span className="iconify lucide--building-2 size-4"></span>
                                {selectedBuildingConfigs.length > 0 ? 'Reconfigure Buildings' : 'Select Buildings'}
                            </Button>
                        </div>
                        
                        {selectedBuildingConfigs.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <div className="text-sm font-medium text-base-content">Selected Buildings:</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {selectedBuildingConfigs.map((config) => (
                                        <div key={config.buildingId} className="bg-primary/5 border border-primary/20 rounded p-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-sm">{config.buildingName}</div>
                                                    <div className="text-xs text-base-content/60">
                                                        Level {config.voLevel} • {config.replaceMode ? 'Replace' : 'Append'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Building Selection (only for Building and Sheet levels) */}
            {(formData.level === 'Building' || formData.level === 'Sheet') && formData.projectId && (
                <div>
                    <h3 className="font-medium mb-3">2. Select Building *</h3>
                    <SAMTable
                        columns={{ 
                            name: "Building Name"
                        }}
                        tableData={buildings}
                        title="Buildings"
                        loading={buildingsLoading}
                        onSuccess={() => {}}
                        onRowSelect={handleBuildingSelect}
                        select={false}
                        actions={false}
                        addBtn={false}
                    />
                    
                    {selectedBuilding && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg mt-3">
                            <div className="flex items-center gap-2">
                                <span className="iconify lucide--check-circle w-5 h-5 text-green-600"></span>
                                <span className="font-medium text-green-800">
                                    Selected Building: {selectedBuilding.name}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Sheet Selection (only for Sheet level) */}
            {formData.level === 'Sheet' && formData.buildingId && (
                <div>
                    <h3 className="font-medium mb-3">3. Select Sheet *</h3>
                    <SAMTable
                        columns={{ 
                            name: "Sheet Name"
                        }}
                        tableData={sheets}
                        title="Sheets"
                        loading={sheetsLoading}
                        onSuccess={() => {}}
                        onRowSelect={handleSheetSelect}
                        select={false}
                        actions={false}
                        addBtn={false}
                    />
                    
                    {selectedSheet && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg mt-3">
                            <div className="flex items-center gap-2">
                                <span className="iconify lucide--check-circle w-5 h-5 text-green-600"></span>
                                <span className="font-medium text-green-800">
                                    Selected Sheet: {selectedSheet.name}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary */}
            {formData.projectId && (
                <div className="alert alert-success">
                    <span className="iconify lucide--map-pin size-5"></span>
                    <div>
                        <div className="font-bold">Selection Summary</div>
                        <div className="text-sm">
                            This VO will be applied at the <strong>{formData.level.toLowerCase().replace('-', ' ')}</strong> level:
                            <br />
                            Project: {selectedProject?.name}
                            {formData.level === 'Multi-Building' && selectedBuildingConfigs.length > 0 && (
                                <><br />Buildings: {selectedBuildingConfigs.length} selected ({selectedBuildingConfigs.map(c => c.buildingName).join(', ')})</>
                            )}
                            {formData.level !== 'Project' && formData.level !== 'Multi-Building' && selectedBuilding && (
                                <><br />Building: {selectedBuilding.name}</>
                            )}
                            {formData.level === 'Sheet' && formData.sheetName && (
                                <><br />Sheet: {formData.sheetName}</>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Multi-Building Selector Modal */}
            <MultiBuildingSelector
                isOpen={showMultiBuildingSelector}
                onClose={() => setShowMultiBuildingSelector(false)}
                onConfirm={handleMultiBuildingConfirm}
                projectId={formData.projectId || 0}
                initialSelectedBuildings={formData.buildingIds || []}
            />
        </div>
    );
};
