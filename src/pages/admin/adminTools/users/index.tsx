import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useUsers from "./use-users";

const Users = () => {
    const { columns, tableData, inputFields, hasActions } = useUsers();

    return (
        <div>
            <MetaData title={"Users"} />

            <PageTitle title={"Users"} centerItem={"Admin tools"} />
            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={true}
                    editAction={true}
                    deleteAction={true}
                    title={"Users"}
                    loading={false}
                    addBtn
                />
            </div>
        </div>
    );
};

export default Users;
