import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { usePermissions } from "@/hooks/use-permissions";

import useSubcontractors from "./use-subcontractors";

const Subcontractors = () => {
    const { columns, tableData, inputFields, loading, getSubcontractors } = useSubcontractors();
    const { canAddEditSubcontractors, canDeleteSubcontractors } = usePermissions();
    const navigate = useNavigate();

    useEffect(() => {
        getSubcontractors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBackToAdminTools = () => {
        navigate('/admin-tools');
    };

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
                        editAction={canAddEditSubcontractors}
                        deleteAction={canDeleteSubcontractors}
                        title={"Subcontractor"}
                        loading={false}
                        addBtn={canAddEditSubcontractors}
                        editEndPoint="Subcontractors/UpdateSubcontractor"
                        createEndPoint="Subcontractors/CreateSubcontractor"
                        deleteEndPoint="Subcontractors/DeleteSubcontractor/{id}"
                        onSuccess={getSubcontractors}
                        virtualized={true}
                        rowHeight={40}
                        overscan={5}
                        customHeaderContent={tableHeaderContent}
                    />
                )}
            </div>
        </div>
    );
};

export default Subcontractors; 