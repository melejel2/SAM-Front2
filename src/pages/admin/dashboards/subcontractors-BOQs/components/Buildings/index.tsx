import React from "react";

import SAMTable from "@/components/Table";

import useBuildings from "./use-buildings";

interface BuildingsStepProps {
    onSelectBuilding?: (Building: any) => void;
}

const BuildingsStep: React.FC<BuildingsStepProps> = ({ onSelectBuilding }) => {
    const { columns, tableData } = useBuildings();

    return (
        <div className="border-base-200 border">
            <SAMTable
                columns={columns}
                tableData={tableData}
                inputFields={[]}
                actions={false}
                title={"Building"}
                onRowSelect={onSelectBuilding}
                loading={false}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default BuildingsStep;
