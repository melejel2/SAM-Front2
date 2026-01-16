import { memo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import SAMTable from "@/components/Table";
import { usePermissions } from "@/hooks/use-permissions";

import useTrades from "./use-trades";

const Trades = memo(() => {
    const { columns, tableData, inputFields, getTrades } = useTrades();
    const navigate = useNavigate();
    const { canManageTrades } = usePermissions();

    useEffect(() => {
        getTrades();
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
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions={true}
                    editAction={canManageTrades}
                    deleteAction={canManageTrades}
                    title={"Trades"}
                    loading={false}
                    addBtn={canManageTrades}
                    editEndPoint="Sheets/UpdateSheet"
                    createEndPoint="Sheets/AddSheet"
                    deleteEndPoint="Sheets/DeleteSheet"
                    onSuccess={getTrades}
                    virtualized={true}
                    rowHeight={40}
                    overscan={5}
                    customHeaderContent={tableHeaderContent}
                />
            </div>
        </div>
    );
});

Trades.displayName = 'Trades';

export default Trades;
