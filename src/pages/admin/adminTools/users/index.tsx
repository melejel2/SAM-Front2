import { useEffect } from "react";

import { Loader } from "@/components/Loader";
import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";

import useUsers from "./use-users";

const Users = () => {
    const { columns, tableData, inputFields, getUsers, loading } = useUsers();

    useEffect(() => {
        getUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <MetaData title={"Users"} />

            <PageTitle title={"Users"} centerItem={"Admin tools"} />
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
                        title={"Users"}
                        loading={false}
                        addBtn={true}
                        editEndPoint="Users/UpdateUser"
                        createEndPoint="Users/AddUser"
                        deleteEndPoint="Users/DeleteUser"
                        onSuccess={getUsers}
                    />
                )}
            </div>
        </div>
    );
};

export default Users;
