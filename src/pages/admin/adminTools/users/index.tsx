import { memo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { usePermissions } from "@/hooks/use-permissions";

import useUsers from "./use-users";

const Users = memo(() => {
    const { columns, tableData, inputFields, getUsers, loading } = useUsers();
    const { canManageUsers } = usePermissions();
    const navigate = useNavigate();


    useEffect(() => {
        getUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBackToAdminTools = useCallback(() => {
        navigate('/admin-tools');
    }, [navigate]);

    const tableHeaderContent = (
        <div className="flex items-center flex-1">
            <button
                onClick={handleBackToAdminTools}
                className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
            >
                <span className="iconify lucide--arrow-left size-4"></span>
                <span>Back</span>
            </button>
        </div>
    );

    return (
        <div className="h-full flex flex-col overflow-hidden -mt-5">
            <div className="flex-1 min-h-0">
                {loading ? (
                    <Loader />
                ) : (
                    <SAMTable
                        columns={columns}
                        tableData={tableData}
                        inputFields={inputFields}
                        actions={true}
                        editAction={canManageUsers}
                        deleteAction={canManageUsers}
                        title={"Users"}
                        loading={false}
                        addBtn={canManageUsers}
                        editEndPoint="Users/UpdateUser"
                        createEndPoint="Users/AddUser"
                        deleteEndPoint="Users/DeleteUser"
                        onSuccess={getUsers}
                        virtualized={true}
                        rowHeight={40}
                        overscan={5}
                        customHeaderContent={tableHeaderContent}
                    />
                )}
            </div>
        </div>
    );
});

Users.displayName = 'Users';

export default Users;
