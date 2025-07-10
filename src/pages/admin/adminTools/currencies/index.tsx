import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";

import useCurrencies from "./use-currencies";

const Currencies = () => {
    const { columns, tableData, inputFields, loading, getCurrencies } = useCurrencies();
    const navigate = useNavigate();

    useEffect(() => {
        getCurrencies();
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
                        title={"Currency"}
                        loading={false}
                        addBtn
                        editEndPoint="Currencie/UpdateCurrencie"
                        createEndPoint="Currencie/AddCurrencie"
                        deleteEndPoint="Currencie/DeleteCurrencie"
                        onSuccess={getCurrencies}
                    />
                )}
            </div>
        </div>
    );
};

export default Currencies;
