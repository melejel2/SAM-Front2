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

    const advanceAmount = totalAmount * (advancePercentage / 100);

    return (
        <div className="h-full overflow-auto space-y-6">
            {/* Contract Overview */}
            <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <span className="iconify lucide--file-text size-5"></span>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-base-content">Contract Overview</h3>
                        <p className="text-xs text-base-content/60">Key identifiers and dates</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-base-300 bg-base-100/70 p-3">
                        <p className="text-xs text-base-content/60">Contract Number</p>
                        <p className="text-sm font-semibold text-base-content mt-1">
                            {contractData?.contractNumber || navigationData?.contractNumber || "-"}
                        </p>
                    </div>
                    <div className="rounded-xl border border-base-300 bg-base-100/70 p-3">
                        <p className="text-xs text-base-content/60">Status</p>
                        <div className="mt-1">
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
                    </div>
                    <div className="rounded-xl border border-base-300 bg-base-100/70 p-3">
                        <p className="text-xs text-base-content/60">Contract Date</p>
                        <p className="text-sm font-semibold text-base-content mt-1">
                            {formatDate(contractData?.contractDate) || navigationData?.contractDate || "-"}
                        </p>
                    </div>
                    <div className="rounded-xl border border-base-300 bg-base-100/70 p-3">
                        <p className="text-xs text-base-content/60">Completion Date</p>
                        <p className="text-sm font-semibold text-base-content mt-1">
                            {formatDate(contractData?.completionDate) || navigationData?.completionDate || "-"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Project & Parties */}
                <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                            <span className="iconify lucide--building-2 size-5"></span>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-base-content">Project & Parties</h3>
                            <p className="text-xs text-base-content/60">Stakeholders and scope</p>
                        </div>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="text-base-content/60">Project</span>
                            <p className="text-base-content font-semibold mt-1">
                                {currentProject?.name || navigationData?.projectName || "N/A"}
                            </p>
                        </div>
                        <div>
                            <span className="text-base-content/60">Subcontractor</span>
                            <p className="text-base-content font-semibold mt-1">
                                {currentSubcontractor?.name || navigationData?.subcontractorName || "N/A"}
                            </p>
                        </div>
                        <div>
                            <span className="text-base-content/60">Trade</span>
                            <p className="text-base-content font-semibold mt-1">
                                {navigationData?.tradeName || contractData?.subTrade || "N/A"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Financial Terms */}
                <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center">
                            <span className="iconify lucide--calculator size-5"></span>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-base-content">Financial Terms</h3>
                            <p className="text-xs text-base-content/60">Key percentages and terms</p>
                        </div>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/60">Advance Payment</span>
                            <span className="text-base-content font-semibold">{formatPercentage(advancePercentage)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/60">Management Fees</span>
                            <span className="text-base-content font-semibold">{contractData?.managementFees ? `${contractData.managementFees}%` : "0%"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/60">Prorata Account</span>
                            <span className="text-base-content font-semibold">{contractData?.prorataAccount || "0"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/60">Retention</span>
                            <span className="text-base-content font-semibold">{contractData?.holdWarranty ? `${contractData.holdWarranty}%` : "0%"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/60">Payment Terms</span>
                            <span className="text-base-content font-semibold">{contractData?.paymentsTerm || "30 days"}</span>
                        </div>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                            <span className="iconify lucide--wallet size-5"></span>
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-base-content">Financial Summary</h3>
                            <p className="text-xs text-base-content/60">Totals and computed amounts</p>
                        </div>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/60">Total Amount</span>
                            <span className="text-primary font-semibold">
                                {currentCurrency?.currencies || currency} {formatCurrency(totalAmount)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/60">Advance Amount</span>
                            <span className="text-base-content font-semibold">
                                {currentCurrency?.currencies || currency} {formatCurrency(advanceAmount)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/60">Retention</span>
                            <span className="text-base-content font-semibold">
                                {contractData?.holdWarranty ? `${contractData.holdWarranty}%` : "0%"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-base-content/60">Management Fees</span>
                            <span className="text-base-content font-semibold">
                                {contractData?.managementFees ? `${contractData.managementFees}%` : "0%"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfoTab;
