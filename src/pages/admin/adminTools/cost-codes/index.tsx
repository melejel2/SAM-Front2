import { useEffect } from "react";

import { Loader } from "@/components/Loader";
import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useCostCodes from "./use-cost-codes";

const CostCodes = () => {
    const { columns, tableData, inputFields, loading, getCostCodes } = useCostCodes();

    useEffect(() => {
        getCostCodes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <MetaData title={"Cost Codes"} />
            <PageTitle title={"Cost Codes"} centerItem={"Admin tools"} />
            <div>
                {loading ? (
                    <Loader />
                ) : (
                    <SAMTable
                        columns={columns}
                        tableData={tableData}
                        inputFields={inputFields}
                        actions={true}
                        editAction={true}
                        deleteAction={true}
                        title={"Cost Code"}
                        loading={false}
                        addBtn={true}
                        editEndPoint="CostCode/UpdateCostCode"
                        createEndPoint="CostCode/AddCostCode"
                        deleteEndPoint="CostCode/DeleteCostCode"
                    />
                )}
            </div>
        </div>
    );
};

export default CostCodes;
