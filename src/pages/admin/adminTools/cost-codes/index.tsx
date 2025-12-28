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
                    <div className="flex items-center gap-3">
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
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
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
                    />
                )}
            </div>
        </div>
    );
});

CostCodes.displayName = 'CostCodes';

export default CostCodes;
