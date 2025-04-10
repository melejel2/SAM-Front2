import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useSubcontractorsBOQs from "./use-subcontractors-boqs";

const SubcontractorsBOQs = () => {
    const { columns, tableData, inputFields } = useSubcontractorsBOQs();

    return (
        <div>
            <MetaData title={"Subcontractor BOQs"} />

            <PageTitle title={"Subcontractor BOQs"} centerItem={"Dashboard"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={true}
                    editAction={true}
                    deleteAction={true}
                    showAction={true}
                    title={"Subcontractor BOQ"}
                    loading={false}
                    addBtn={true}
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default SubcontractorsBOQs;
