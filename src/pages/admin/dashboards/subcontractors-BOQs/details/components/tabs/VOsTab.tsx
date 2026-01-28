import { useNavigate } from "react-router-dom";
import { useCallback, useMemo } from "react";

import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { Loader } from "@/components/Loader";
import { formatCurrency } from "@/utils/formatters";

interface VORow {
    id: number | string;
    voNumber: string;
    subTrade: string;
    type: string;
    amount: number;
    status: string;
    date: string;
}

interface VOsTabProps {
    vos: VORow[];
    voColumns: Record<string, string>;
    loading: boolean;
    contractId: string | null;
    contractIdentifier: string | undefined;
    contractData: any;
    navigationData: any;
    currentProject: any;
    currentSubcontractor: any;
    onVOsRefresh: () => void;
    onPreviewVO: (voId: number, voNumber: string) => void;
    onExportVO: (voId: number, voNumber: string) => void;
    onDeleteVO: (voId: number) => void;
    onGenerateVO: (voId: number) => void;
}

const VOsTab = ({
    vos,
    voColumns,
    loading,
    contractId,
    contractIdentifier,
    contractData,
    navigationData,
    currentProject,
    currentSubcontractor,
    onVOsRefresh,
    onPreviewVO,
    onExportVO,
    onDeleteVO,
    onGenerateVO,
}: VOsTabProps) => {
    const navigate = useNavigate();

    // Spreadsheet columns definition
    const spreadsheetColumns = useMemo((): SpreadsheetColumn<VORow>[] => [
        {
            key: "voNumber",
            label: "VO Number",
            width: 120,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "subTrade",
            label: "Sub Trade",
            width: 180,
            align: "left",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "type",
            label: "Type",
            width: 100,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
        {
            key: "amount",
            label: "Amount",
            width: 140,
            align: "right",
            editable: false,
            sortable: true,
            filterable: false,
            formatter: (value) => formatCurrency(value),
        },
        {
            key: "status",
            label: "Status",
            width: 100,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
            render: (value) => {
                const statusLower = (value || "").toLowerCase();
                let badgeClass = "badge-info";
                if (statusLower === "active" || statusLower === "issued") badgeClass = "badge-success";
                else if (statusLower === "editable" || statusLower === "draft") badgeClass = "badge-warning";
                return <span className={`badge badge-sm ${badgeClass}`}>{value || "-"}</span>;
            },
        },
        {
            key: "date",
            label: "Date Created",
            width: 130,
            align: "center",
            editable: false,
            sortable: true,
            filterable: true,
        },
    ], []);

    const handleCreateVO = useCallback(() => {
        if (!contractId) return;

        navigate(`/dashboard/contracts/details/${contractIdentifier}/create-vo`, {
            state: {
                contractId: contractId,
                contractNumber: contractData?.contractNumber,
                projectId: contractData?.projectId,
                subcontractorId: contractData?.subContractorId,
                currencyId: contractData?.currencyId,
                projectName: navigationData?.projectName || currentProject?.name,
                subcontractorName: navigationData?.subcontractorName || currentSubcontractor?.name,
                tradeName: navigationData?.tradeName || contractData?.subTrade,
                contractContext: contractData,
            },
        });
    }, [contractId, contractIdentifier, contractData, navigationData, currentProject, currentSubcontractor, navigate]);

    const handleEditVO = useCallback((row: VORow) => {
        navigate(
            `/dashboard/contracts/details/${contractIdentifier}/edit-vo/${row.id}`,
            {
                state: {
                    contractId: contractId,
                    voDatasetId: row.id,
                },
            },
        );
    }, [contractId, contractIdentifier, navigate]);

    // Render actions column for Spreadsheet
    const renderVOActions = useCallback((row: VORow) => {
        const isActive = row.status?.toLowerCase() === "active" || row.status?.toLowerCase() === "issued";

        return (
            <div className="flex items-center gap-1">
                {/* Preview */}
                <button
                    className="btn btn-ghost btn-xs text-info hover:bg-info/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreviewVO(row.id as number, row.voNumber);
                    }}
                    title="Preview"
                >
                    <span className="iconify lucide--eye size-4"></span>
                </button>

                {/* Edit */}
                <button
                    className={`btn btn-ghost btn-xs ${isActive ? "opacity-40 cursor-not-allowed" : "text-warning hover:bg-warning/20"}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isActive) handleEditVO(row);
                    }}
                    disabled={isActive}
                    title={isActive ? "Cannot edit active VO" : "Edit"}
                >
                    <span className="iconify lucide--pencil size-4"></span>
                </button>

                {/* Export */}
                <button
                    className="btn btn-ghost btn-xs text-success hover:bg-success/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        onExportVO(row.id as number, row.voNumber);
                    }}
                    title="Export"
                >
                    <span className="iconify lucide--download size-4"></span>
                </button>

                {/* Generate */}
                <button
                    className={`btn btn-ghost btn-xs ${isActive ? "opacity-40 cursor-not-allowed" : "text-primary hover:bg-primary/20"}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isActive) onGenerateVO(row.id as number);
                    }}
                    disabled={isActive}
                    title={isActive ? "Cannot generate active VO" : "Generate"}
                >
                    <span className="iconify lucide--file-check size-4"></span>
                </button>

                {/* Delete */}
                <button
                    className={`btn btn-ghost btn-xs ${isActive ? "opacity-40 cursor-not-allowed" : "text-error hover:bg-error/20"}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isActive) onDeleteVO(row.id as number);
                    }}
                    disabled={isActive}
                    title={isActive ? "Cannot delete active VO" : "Delete"}
                >
                    <span className="iconify lucide--trash-2 size-4"></span>
                </button>
            </div>
        );
    }, [onPreviewVO, onExportVO, onGenerateVO, onDeleteVO, handleEditVO]);

    return (
        <div className="h-full flex flex-col">
            <div className="card bg-base-100 border-base-300 border shadow-sm flex-1 flex flex-col min-h-0">
                <div className="card-body flex flex-col min-h-0 p-4">
                    <div className="mb-4 flex items-center justify-between flex-shrink-0">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--git-branch size-5 text-orange-600"></span>
                            Variation Orders
                        </h3>
                        <button onClick={handleCreateVO} className="btn btn-primary btn-sm">
                            <span className="iconify lucide--plus size-4"></span>
                            <span>Add VO</span>
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader
                                    icon="file-diff"
                                    subtitle="Loading: Variation Orders"
                                    description="Preparing VO data..."
                                    size="md"
                                />
                            </div>
                        ) : vos.length > 0 ? (
                            <Spreadsheet<VORow>
                                data={vos}
                                columns={spreadsheetColumns}
                                mode="view"
                                loading={false}
                                rowHeight={40}
                                actionsRender={renderVOActions}
                                actionsColumnWidth={180}
                                getRowId={(row) => row.id}
                                allowKeyboardNavigation
                                allowColumnResize
                                allowSorting
                                allowFilters
                                hideFormulaBar
                            />
                        ) : (
                            <div className="py-12 text-center">
                                <span className="iconify lucide--inbox text-base-content/30 mx-auto mb-3 size-12"></span>
                                <p className="text-base-content/70">No variation orders found for this contract</p>
                                <button onClick={handleCreateVO} className="btn btn-primary btn-sm mt-4">
                                    <span className="iconify lucide--plus size-4"></span>
                                    <span>Create First VO</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VOsTab;
