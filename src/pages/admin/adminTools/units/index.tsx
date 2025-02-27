import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useUnits from "./use-units";

const Units = () => {
    const { columns, tableData, inputFields } = useUnits();

    return (
        <div>
            <MetaData title={"Units"} />

            <PageTitle title={"Units"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={true}
                    editAction={true}
                    deleteAction={true}
                    title={"Unit"}
                    loading={false}
                    addBtn={true}
                />
            </div>
        </div>
    );
};

export default Units;
