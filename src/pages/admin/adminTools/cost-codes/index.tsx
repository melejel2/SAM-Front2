import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { Button } from "@/components/daisyui";

import useCostCodes from "./use-cost-codes";

const CostCodes = () => {
    const { columns, tableData, inputFields, loading, uploadLoading, getCostCodes, uploadCostCodes } = useCostCodes();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getCostCodes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadCostCodes(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
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
                        className="btn btn-sm btn-back border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                </div>
            </div>

            <div className="mb-4 flex justify-end">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <Button
                    color="primary"
                    size="sm"
                    onClick={triggerFileInput}
                    disabled={uploadLoading}
                    loading={uploadLoading}
                >
                    {uploadLoading ? "Uploading..." : "Upload Excel"}
                </Button>
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
                        title={"Cost Code"}
                        loading={false}
                        addBtn
                        editEndPoint="CostCode/UpdateCostCode"
                        createEndPoint="CostCode/AddCostCode"
                        deleteEndPoint="CostCode/DeleteCostCode"
                        onSuccess={getCostCodes}
                    />
                )}
            </div>
        </div>
    );
};

export default CostCodes;
