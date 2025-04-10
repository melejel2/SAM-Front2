import React from "react";

import SAMTable from "@/components/Table";

import useBudgetBOQs from "../../use-budget-BOQs";

interface ProjectStepProps {
    onSelectProject?: (project: any) => void;
}

const ProjectStep: React.FC<ProjectStepProps> = ({ onSelectProject }) => {
    const { columns, tableData, inputFields } = useBudgetBOQs();

    return (
        <div className="border-base-200 border">
            <SAMTable
                columns={columns}
                tableData={tableData}
                inputFields={inputFields}
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
