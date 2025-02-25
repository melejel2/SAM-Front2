import Icon from "@/components/Icon";
import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useCurrenciesAndUnits from "./use-currencies-and-units";

const CurrenciesAndUnits = () => {
    const { columns, tableData, inputFields, hasActions } = useCurrenciesAndUnits();

    return (
        <div>
            <MetaData title={"Currencies And Units"} />

            <PageTitle title={"Currencies And Units"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={hasActions}
                    title={"Currencies And Units"}
                    loading={false}
                />
            </div>
        </div>
    );
};

export default CurrenciesAndUnits;
