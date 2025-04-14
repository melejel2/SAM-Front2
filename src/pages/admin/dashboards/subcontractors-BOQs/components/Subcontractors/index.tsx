import React from "react";

import SAMTable from "@/components/Table";

import useSubcontractors from "./use-subcontractors";

interface SubcontractorsStepProps {
    onSelectSubcontractor?: (subcontractor: any) => void;
}

const SubcontractorsStep: React.FC<SubcontractorsStepProps> = ({ onSelectSubcontractor }) => {
    const { columns, tableData } = useSubcontractors();

    return (
        <div>
            <SAMTable
                columns={columns}
                tableData={tableData}
                inputFields={[]}
                actions={false}
                title={"Subcontractor"}
                onRowSelect={onSelectSubcontractor}
                loading={false}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default SubcontractorsStep;
