import React from "react";

import SAMTable from "@/components/Table";

import useProjects from "./use-projects";

interface ProjectStepProps {
    onSelectProject?: (project: any) => void;
}

const ProjectStep: React.FC<ProjectStepProps> = ({ onSelectProject }) => {
    const { columns, tableData } = useProjects();

    return (
        <div>
            <SAMTable
                columns={columns}
                tableData={tableData}
                title={"Project"}
                onRowSelect={onSelectProject}
                loading={false}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default ProjectStep;
