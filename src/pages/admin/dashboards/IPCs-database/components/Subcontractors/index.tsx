import React from "react";

import SAMTable from "@/components/Table";

import useIPCSubcontractors from "./use-subcontractors";

interface IPCSubcontractorsStepProps {
    onSelectSubcontractor?: (subcontractor: any) => void;
}

const IPCSubcontractorsStep: React.FC<IPCSubcontractorsStepProps> = ({ onSelectSubcontractor }) => {
    const { columns, tableData } = useIPCSubcontractors();

    return (
        <div>
            <SAMTable
                columns={columns}
                tableData={tableData}
                title={"Subcontractor"}
                onRowSelect={onSelectSubcontractor}
                loading={false}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default IPCSubcontractorsStep;
