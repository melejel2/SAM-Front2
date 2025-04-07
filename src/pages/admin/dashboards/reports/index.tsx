import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useReports from "./use-reports";

const Reports = () => {
    const { columns, tableData, inputFields } = useReports();

    return (
        <div>
            <MetaData title={"Reports"} />

            <PageTitle title={"Reports"} centerItem={"Dashboard"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={true}
                    editAction={true}
                    deleteAction={true}
                    title={"Report"}
                    loading={false}
                    addBtn={true}
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default Reports;
