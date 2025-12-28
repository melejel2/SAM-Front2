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

    return (
        <div style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Fixed Header Section */}
            <div style={{ flexShrink: 0 }} className="pb-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToAdminTools}
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            <span className="iconify lucide--arrow-left size-4"></span>
                            <span>Back</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
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
                    />
                )}
            </div>
        </div>
    );
});

Users.displayName = 'Users';

export default Users;
