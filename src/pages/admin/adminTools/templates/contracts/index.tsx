import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import useToast from "@/hooks/use-toast";

import useContractsTemplates from "./use-contracts-templates";

const ContractsTemplates = () => {
    const { columns, tableData, inputFields, loading, getContractTemplates } = useContractsTemplates();
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const navigate = useNavigate();

    const token = getToken();

    useEffect(() => {
        getContractTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePreview = async (row: any) => {
        try {
            const response = await apiRequest({
                endpoint: `Templates/PreviewTemplate?id=${row.id}`,
                method: "GET",
                token: token ?? "",
                responseType: "blob",
            });

            if (response instanceof Blob) {
                const url = window.URL.createObjectURL(response);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${row.templateName || "template"}.docx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toaster.success("Template downloaded successfully");
            } else {
                toaster.error("Failed to download template");
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to preview template");
        }
    };

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
                        editAction={false}
                        deleteAction
                        previewAction
                        title={"Contract Template"}
                        loading={false}
                        addBtn
                        createEndPoint="Templates/AddContractTemplate"
                        deleteEndPoint="Templates/DeleteTemplate"
                        onSuccess={getContractTemplates}
                        openStaticDialog={(type, data) => {
                            if (type === "Preview" && data) {
                                handlePreview(data);
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default ContractsTemplates;
