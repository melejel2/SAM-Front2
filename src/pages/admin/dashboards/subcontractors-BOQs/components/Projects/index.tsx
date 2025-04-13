import React from "react";

import SAMTable from "@/components/Table";

import useProjects from "./use-projects";

interface ProjectStepProps {
    onSelectProject?: (project: any) => void;
}

const ProjectStep: React.FC<ProjectStepProps> = ({ onSelectProject }) => {
    const { columns, tableData } = useProjects();

    return (
        <div className="border-base-200 border">
            <SAMTable
                columns={columns}
                tableData={tableData}
                inputFields={[]}
                actions={false}
                title={"Project"}
                onRowSelect={onSelectProject}
                loading={false}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default ProjectStep;
