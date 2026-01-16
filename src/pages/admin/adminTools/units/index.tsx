import { memo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { usePermissions } from "@/hooks/use-permissions";

import useUnits from "./use-units";

const Units = memo(() => {
    const { columns, tableData, inputFields, loading, getUnits } = useUnits();
    const navigate = useNavigate();
    const { canManageUnits } = usePermissions();

    useEffect(() => {
        getUnits();
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
                        editAction={canManageUnits}
                        deleteAction={canManageUnits}
                        title={"Unit"}
                        loading={false}
                        addBtn={canManageUnits}
                        editEndPoint="Unit/UpdateUnit"
                        createEndPoint="Unit/AddUnit"
                        deleteEndPoint="Unit/DeleteUnit"
                        onSuccess={getUnits}
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

Units.displayName = 'Units';

export default Units;
