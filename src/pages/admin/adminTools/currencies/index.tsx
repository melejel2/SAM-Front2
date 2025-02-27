import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useCurrencies from "./use-currencies";

const Currencies = () => {
    const { columns, tableData, inputFields } = useCurrencies();

    return (
        <div>
            <MetaData title={"Currencies"} />

            <PageTitle title={"Currencies"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={true}
                    editAction={true}
                    deleteAction={true}
                    title={"Currency"}
                    loading={false}
                    addBtn={true}
                />
            </div>
        </div>
    );
};

export default Currencies;
