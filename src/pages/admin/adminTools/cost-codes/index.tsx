import { memo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import { Button } from "@/components/daisyui";
import { usePermissions } from "@/hooks/use-permissions";

import useCostCodes from "./use-cost-codes";

const CostCodes = memo(() => {
    const { columns, tableData, inputFields, loading, uploadLoading, getCostCodes, uploadCostCodes } = useCostCodes();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { canManageCostCodes } = usePermissions();

    useEffect(() => {
        getCostCodes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            uploadCostCodes(file);
        }
    }, [uploadCostCodes]);

    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleBackToAdminTools = useCallback(() => {
        navigate('/admin-tools');
    }, [navigate]);

    const tableHeaderContent = (
        <div className="flex items-center justify-between flex-1">
            <button
                onClick={handleBackToAdminTools}
                className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
            >
                <span className="iconify lucide--arrow-left size-4"></span>
                <span>Back</span>
            </button>
            {canManageCostCodes && (
                <>
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
                </>
            )}
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
                        editAction={canManageCostCodes}
                        deleteAction={canManageCostCodes}
                        title={"Cost Code"}
                        loading={false}
                        addBtn={canManageCostCodes}
                        editEndPoint="CostCode/UpdateCostCode"
                        createEndPoint="CostCode/AddCostCode"
                        deleteEndPoint="CostCode/DeleteCostCode"
                        onSuccess={getCostCodes}
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

CostCodes.displayName = 'CostCodes';

export default CostCodes;
