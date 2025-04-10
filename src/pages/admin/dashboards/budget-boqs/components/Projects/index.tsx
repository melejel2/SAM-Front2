import React from "react";

import SAMTable from "@/components/Table";

import useBudgetBOQs from "../../use-budget-BOQs";

function ProjectStep() {
    const { columns, tableData, inputFields } = useBudgetBOQs();

    return (
        <div className="">
            <SAMTable
                columns={columns}
                tableData={tableData}
                inputFields={inputFields}
                actions={false}
                title={"Projects"}
                select
                loading={false}
                onSuccess={() => {}}
            />
        </div>
    );
}

export default ProjectStep;
