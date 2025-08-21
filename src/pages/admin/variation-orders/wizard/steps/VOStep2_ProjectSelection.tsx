import React, { useState, useEffect } from "react";
import { useVOWizardContext } from "../context/VOWizardContext";
import { useProjects } from "@/pages/admin/adminTools/projects/use-projects";
import { useBuildings } from "@/hooks/use-buildings";
import { useSheets } from "@/hooks/use-sheets";
import SAMTable from "@/components/Table";

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
    const { projects, loading: projectsLoading, fetchProjects } = useProjects();
    const { buildings, loading: buildingsLoading, fetchBuildingsByProject } = useBuildings();
    const { sheets, loading: sheetsLoading, fetchSheetsByBuilding } = useSheets();
    
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);

    // Load initial data
    useEffect(() => {
        fetchProjects();
    }, []);

    // Update selected items when formData changes
    useEffect(() => {
        if (projects.length > 0 && formData.projectId) {
            const project = projects.find(p => p.id === formData.projectId);
            setSelectedProject(project || null);
        }
    }, [projects, formData.projectId]);

    useEffect(() => {
        if (buildings.length > 0 && formData.buildingId) {
            const building = buildings.find(b => b.id === formData.buildingId);
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
            await fetchBuildingsByProject(project.id);
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
            await fetchSheetsByBuilding(building.id);
        }
    };

    const handleSheetSelect = (sheet: Sheet) => {
        setSelectedSheet(sheet);
        setFormData({ sheetName: sheet.name });
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
                            This VO will be applied at the <strong>{formData.level.toLowerCase()}</strong> level:
                            <br />
                            Project: {selectedProject?.name}
                            {formData.level !== 'Project' && selectedBuilding && (
                                <><br />Building: {selectedBuilding.name}</>
                            )}
                            {formData.level === 'Sheet' && formData.sheetName && (
                                <><br />Sheet: {formData.sheetName}</>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
