import { useNavigate } from "react-router-dom";

import SAMTable from "@/components/Table";
import { Loader } from "@/components/Loader";

interface VOsTabProps {
    vos: any[];
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

    // Row actions control - disable edit, generate, and delete for active VOs
    const handleVoRowActions = (row: any) => {
        const isActive = row.status?.toLowerCase() === "active";

        if (isActive) {
            // Active VOs cannot be edited, generated, or deleted
            return {
                editAction: false,
                deleteAction: false,
                generateAction: false,
            };
        }

        // Non-active VOs have all actions enabled
        return {
            editAction: true,
            deleteAction: true,
            generateAction: true,
        };
    };

    const handleCreateVO = () => {
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
    };

    const handleTableAction = (type: string, data: any, extraData?: any) => {
        console.log("VO Table action:", type, data?.id);

        if (type === "Edit") {
            navigate(
                `/dashboard/contracts/details/${extraData?.contractIdentifier || contractIdentifier}/edit-vo/${data.id}`,
                {
                    state: {
                        contractId: extraData?.contractId || contractId,
                        voDatasetId: data.id,
                    },
                },
            );
        } else if (type === "Preview") {
            onPreviewVO(data.id, data.voNumber);
        } else if (type === "Export") {
            onExportVO(data.id, data.voNumber);
        } else if (type === "Delete") {
            onDeleteVO(data.id);
        } else if (type === "Generate") {
            onGenerateVO(data.id);
        }
    };

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

                    <div className="flex-1 min-h-0 overflow-auto">
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
                            <SAMTable
                                columns={voColumns}
                                tableData={vos}
                                actions
                                previewAction
                                editAction
                                exportAction
                                deleteAction
                                generateAction
                                rowActions={handleVoRowActions}
                                title=""
                                loading={false}
                                onSuccess={onVOsRefresh}
                                openStaticDialog={(type, data, extraData) => {
                                    handleTableAction(type, data, extraData);
                                }}
                                dynamicDialog={false}
                                contractIdentifier={contractIdentifier}
                                contractId={contractId ?? undefined}
                                virtualized={true}
                                rowHeight={40}
                                overscan={5}
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
