import { useEffect } from "react";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useUnits from "./use-units";

const Units = () => {
    const { columns, tableData, inputFields, getUnits } = useUnits();

    useEffect(() => {
        getUnits();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
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
                    editEndPoint="Unit/UpdateUnit"
                    createEndPoint="Unit/AddUnit"
                    deleteEndPoint="Unit/DeleteUnit"
                />
            </div>
        </div>
    );
};

export default Units;
