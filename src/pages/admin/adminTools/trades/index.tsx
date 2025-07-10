import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import SAMTable from "@/components/Table";

import useTrades from "./use-trades";

const Trades = () => {
    const { columns, tableData, inputFields, getTrades } = useTrades();
    const navigate = useNavigate();

    useEffect(() => {
        getTrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBackToAdminTools = () => {
        navigate('/admin-tools');
    };

    return (
        <div>
            {/* Header with Back Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToAdminTools}
                        className="btn btn-sm btn-back border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                </div>
            </div>

            <div>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    editAction
                    deleteAction
                    title={"Trades"}
                    loading={false}
                    addBtn
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
