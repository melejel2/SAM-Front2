import React from "react";

import SAMTable from "@/components/Table";

import useIPCProjects from "./use-projects";

interface IPCProjectStepProps {
    onSelectProject?: (project: any) => void;
}

const IPCProjectStep: React.FC<IPCProjectStepProps> = ({ onSelectProject }) => {
    const { columns, tableData } = useIPCProjects();

    return (
        <div>
            <SAMTable
                columns={columns}
                tableData={tableData}
                inputFields={[]}
                title={"Project"}
                onRowSelect={onSelectProject}
                loading={false}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default IPCProjectStep;
