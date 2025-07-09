import { useNavigate } from "react-router-dom";

import SAMTable from "@/components/Table";

import useDechargesTemplates from "./use-decharge-templates";

const DechargesTemplates = () => {
    const { columns, tableData, inputFields } = useDechargesTemplates();
    const navigate = useNavigate();

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
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    deleteAction
                    previewAction
                    title={"Template"}
                    loading={false}
                    addBtn
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default DechargesTemplates;
