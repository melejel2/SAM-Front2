import { useEffect } from "react";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useCurrencies from "./use-currencies";

const Currencies = () => {
    const { columns, tableData, inputFields, getCurrencies } = useCurrencies();

    useEffect(() => {
        getCurrencies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <MetaData title={"Currencies"} />

            <PageTitle title={"Currencies"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    editAction
                    deleteAction
                    title={"Currency"}
                    loading={false}
                    addBtn
                    editEndPoint="Currencie/UpdateCurrencie"
                    createEndPoint="Currencie/AddCurrencie"
                    deleteEndPoint="Currencie/DeleteCurrencie"
                    onSuccess={getCurrencies}
                />
            </div>
        </div>
    );
};

export default Currencies;
