import React from "react";

import SAMTable from "@/components/Table";

import useBuildings from "./use-buildings";

interface BuildingsStepProps {
    onSelectBuilding?: (Building: any) => void;
    projectId: number | null;
}

const BuildingsStep: React.FC<BuildingsStepProps> = ({ onSelectBuilding, projectId }) => {
    const { columns, tableData, loading } = useBuildings(projectId);

    return (
        <div>
            <SAMTable
                columns={columns}
                tableData={tableData}
                title={"Building"}
                onRowSelect={onSelectBuilding}
                loading={loading}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default BuildingsStep;