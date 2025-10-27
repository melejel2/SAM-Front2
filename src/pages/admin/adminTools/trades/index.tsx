import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import SAMTable from "@/components/Table";
import { usePermissions } from "@/hooks/use-permissions";

import useTrades from "./use-trades";

const Trades = () => {
    const { columns, tableData, inputFields, getTrades } = useTrades();
    const navigate = useNavigate();
    const { canManageTrades } = usePermissions();

    useEffect(() => {
        getTrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBackToAdminTools = () => {
        navigate('/admin-tools');
    };

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
                />
            </div>
        </div>
    );
};

export default Trades;
