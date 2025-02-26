import Icon from "@/components/Icon";
import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useCurrenciesAndUnits from "./use-currencies-and-units";

const CurrenciesAndUnits = () => {
    const {
        currenciesColumns,
        currencyTableData,
        currencyInputFields,
        unitsColumns,
        unitsTableData,
        unitInputFields,
        hasActions,
    } = useCurrenciesAndUnits();

    return (
        <div>
            <MetaData title={"Currencies And Units"} />

            <PageTitle title={"Currencies And Units"} centerItem={"Admin tools"} />
            <div className="flex flex-col justify-between space-y-6 xl:flex-row xl:space-y-0 xl:space-x-6">
                <div className="w-full xl:w-1/2">
                    <SAMTable
                        columns={currenciesColumns}
                        tableData={currencyTableData}
                        inputFields={currencyInputFields}
                        actions={true}
                        deleteAction={true}
                        editAction={true}
                        title={"Currency"}
                        loading={false}
                        addBtn={true}
                    />
                </div>
                <div className="w-full xl:w-1/2">
                    <SAMTable
                        columns={unitsColumns}
                        tableData={unitsTableData}
                        inputFields={unitInputFields}
                        actions={true}
                        deleteAction={true}
                        editAction={true}
                        title={"Unit"}
                        loading={false}
                        addBtn={true}
                    />
                </div>
            </div>
        </div>
    );
};

export default CurrenciesAndUnits;
