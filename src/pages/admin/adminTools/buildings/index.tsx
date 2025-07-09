import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { Select, SelectOption } from "@/components/daisyui";

import useBuildings from "./use-buildings";

const Buildings = () => {
    const { 
        columns, 
        tableData, 
        inputFields, 
        loading, 
        selectedProjectId,
        setSelectedProjectId,
        getBuildings, 
        getProjectNames 
    } = useBuildings();
    
    const [projects, setProjects] = useState<any[]>([]);
    const [updatedInputFields, setUpdatedInputFields] = useState(inputFields);
    const navigate = useNavigate();

    useEffect(() => {
        loadProjects();
        getBuildings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            getBuildings(selectedProjectId);
        } else {
            getBuildings();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId]);

    const loadProjects = async () => {
        const projectNames = await getProjectNames();
        setProjects(projectNames);
        
        // Update input fields with project options
        const fields = inputFields.map(field => {
            if (field.name === "projectId") {
                return {
                    ...field,
                    options: projectNames.map((p: any) => ({ value: p.id, label: p.name }))
                };
            }
            return field;
        });
        setUpdatedInputFields(fields);
    };

    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProjectId(e.target.value);
    };

    const handleBackToAdminTools = () => {
        navigate('/admin-tools');
    };

    return (
        <div>
            {/* Header with Back Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToAdminTools}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <Select
                    value={selectedProjectId}
                    onChange={handleProjectChange}
                    className="w-64"
                >
                    <SelectOption value="">All Projects</SelectOption>
                    {projects.map((project) => (
                        <SelectOption key={project.id} value={project.id}>
                            {project.name}
                        </SelectOption>
                    ))}
                </Select>
            </div>

            <div>
                {loading ? (
                    <Loader />
                ) : (
                    <SAMTable
                        columns={columns}
                        tableData={tableData}
                        inputFields={updatedInputFields}
                        actions
                        editAction
                        deleteAction
                        title={"Building"}
                        loading={false}
                        addBtn
                        editEndPoint="Building/UpdateBuilding"
                        createEndPoint="Building/CreateBuilding"
                        deleteEndPoint="Building/DeleteBuilding"
                        onSuccess={() => getBuildings(selectedProjectId)}
                    />
                )}
            </div>
        </div>
    );
};

export default Buildings; 