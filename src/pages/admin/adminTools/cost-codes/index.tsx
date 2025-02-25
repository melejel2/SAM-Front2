import Icon from "@/components/Icon";
import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useCostCodes from "./use-cost-codes";

const CostCodes = () => {
    const { columns, tableData, inputFields, hasActions } = useCostCodes();

    return (
        <div>
            <MetaData title={"Cost Codes"} />

            <PageTitle title={"Cost Codes"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={hasActions}
                    title={"Cost Codes"}
                    loading={false}
                />
            </div>
        </div>
    );
};

export default CostCodes;
