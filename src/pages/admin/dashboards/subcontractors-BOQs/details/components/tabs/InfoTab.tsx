import { formatCurrency, formatDate } from "@/utils/formatters";

interface InfoTabProps {
    contractData: any;
    currency: string;
    currentCurrency?: { currencies: string } | null;
    currentProject?: { name: string } | null;
    currentSubcontractor?: { name: string } | null;
    navigationData?: {
        contractNumber?: string;
        projectName?: string;
        subcontractorName?: string;
        tradeName?: string;
        contractDate?: string;
        completionDate?: string;
    } | null;
}

// Helper functions
const formatPercentage = (value: number | undefined) => {
    if (!value || value === 0) return "0%";
    return `${value}%`;
};

const InfoTab = ({
    contractData,
    currency,
    currentCurrency,
    currentProject,
    currentSubcontractor,
    navigationData,
}: InfoTabProps) => {
    // Calculate total amount from BOQ items or use pre-calculated amount
    const totalAmount = contractData?.amount || contractData?.buildings?.reduce((total: number, building: any) => {
        const buildingTotal = building?.boqsContract?.reduce(
            (sum: number, item: any) => sum + (item.qte * item.pu || item.amount || 0),
            0
        ) || 0;
        return total + buildingTotal;
    }, 0) || 0;

    // Use subcontractorAdvancePayee for advance payment percentage
    // Note: advancePayment field stores total BOQ amount (legacy), NOT a percentage
    const advancePercentage = parseFloat(contractData?.subcontractorAdvancePayee) || 0;

    return (
        <div className="h-full overflow-auto">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Contract Info */}
            <div className="card bg-base-100 border-base-300 border shadow-sm">
                <div className="card-body">
                    <h3 className="card-title text-base-content flex items-center gap-2">
                        <span className="iconify lucide--file-text size-5 text-purple-600"></span>
                        Contract Information
                    </h3>
                    <div className="mt-4 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Contract Number:</span>
                            <span className="text-base-content font-semibold">
                                {contractData?.contractNumber || navigationData?.contractNumber || "-"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Status:</span>
                            <span className={`badge badge-sm ${
                                contractData?.contractDatasetStatus === "Terminated"
                                    ? "badge-error"
                                    : contractData?.contractDatasetStatus === "Editable"
                                        ? "badge-warning"
                                        : "badge-success"
                            }`}>
                                {contractData?.contractDatasetStatus || "Active"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Contract Date:</span>
                            <span className="text-base-content">
                                {formatDate(contractData?.contractDate) || navigationData?.contractDate || "-"}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Completion Date:</span>
                            <span className="text-base-content">
                                {formatDate(contractData?.completionDate) || navigationData?.completionDate || "-"}
                            </span>
                        </div>
                        <div className="divider"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/70">Total Amount:</span>
                            <span className="text-primary text-xl font-bold">
                                {currentCurrency?.currencies || currency} {formatCurrency(totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project & Parties */}
            <div className="card bg-base-100 border-base-300 border shadow-sm">
                <div className="card-body">
                    <h3 className="card-title text-base-content flex items-center gap-2">
                        <span className="iconify lucide--building-2 size-5 text-blue-600"></span>
                        Project & Parties
                    </h3>
                    <div className="mt-4 space-y-3">
                        <div>
                            <span className="text-base-content/70 text-sm">Project:</span>
                            <p className="text-base-content mt-1 font-semibold">
                                {currentProject?.name || navigationData?.projectName || "N/A"}
                            </p>
                        </div>
                        <div>
                            <span className="text-base-content/70 text-sm">Subcontractor:</span>
                            <p className="text-base-content mt-1 font-semibold">
                                {currentSubcontractor?.name || navigationData?.subcontractorName || "N/A"}
                            </p>
                        </div>
                        <div>
                            <span className="text-base-content/70 text-sm">Trade:</span>
                            <p className="text-base-content mt-1 font-semibold">
                                {navigationData?.tradeName || contractData?.subTrade || "N/A"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Terms */}
            <div className="card bg-base-100 border-base-300 border shadow-sm">
                <div className="card-body">
                    <h3 className="card-title text-base-content flex items-center gap-2">
                        <span className="iconify lucide--calculator size-5 text-green-600"></span>
                        Financial Terms
                    </h3>
                    <div className="mt-4 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Advance Payment:</span>
                            <span className="text-base-content">{formatPercentage(advancePercentage)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Management Fees:</span>
                            <span className="text-base-content">{contractData?.managementFees ? `${contractData.managementFees}%` : "0%"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Prorata Account:</span>
                            <span className="text-base-content">{contractData?.prorataAccount || "0"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Retention:</span>
                            <span className="text-base-content">{contractData?.holdWarranty ? `${contractData.holdWarranty}%` : "0%"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-base-content/70">Payment Terms:</span>
                            <span className="text-base-content">{contractData?.paymentsTerm || "30 days"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default InfoTab;
