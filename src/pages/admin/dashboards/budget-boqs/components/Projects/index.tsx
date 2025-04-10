import React from "react";

import SAMTable from "@/components/Table";

import useBudgetBOQs from "../../use-budget-BOQs";

interface ProjectStepProps {
    onSelect?: (project: any) => void;
}

const ProjectStep: React.FC<ProjectStepProps> = ({ onSelect }) => {
    const { columns, tableData, inputFields } = useBudgetBOQs();

    return (
        <div>
            <SAMTable
                columns={columns}
                tableData={tableData}
                inputFields={inputFields}
                actions={false}
                title={"Project"}
                onRowSelect={onSelect}
                loading={false}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default ProjectStep;
