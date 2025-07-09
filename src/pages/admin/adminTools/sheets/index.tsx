import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";

import useSheets from "./use-sheets";

const Sheets = () => {
    const { columns, tableData, inputFields, loading, getSheets } = useSheets();
    const navigate = useNavigate();

    useEffect(() => {
        getSheets();
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
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                </div>
            </div>

            <div>
                {loading ? (
                    <Loader />
                ) : (
                    <SAMTable
                        columns={columns}
                        tableData={tableData}
                        inputFields={inputFields}
                        actions
                        editAction
                        deleteAction
                        title={"Sheet"}
                        loading={false}
                        addBtn
                        editEndPoint="Sheets/UpdateSheet"
                        createEndPoint="Sheets/AddSheet"
                        deleteEndPoint="Sheets/DeleteSheet"
                        onSuccess={getSheets}
                    />
                )}
            </div>
        </div>
    );
};

export default Sheets; 