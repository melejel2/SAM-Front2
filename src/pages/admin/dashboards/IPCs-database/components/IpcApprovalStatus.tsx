import { useEffect, useState } from "react";
import { useAuth } from "../../../../../contexts/auth";
import { ipcApiService } from "../../../../../api/services/ipc-api";
import type { IpcApprovalStatus as IpcApprovalStatusType, IpcApprovalStep } from "../../../../../types/ipc";

const APPROVAL_CHAIN_ROLES = [
    { role: "ProjectManager", label: "Project Manager", stepOrder: 1 },
    { role: "QuantitySurveyor", label: "Quantity Surveyor", stepOrder: 2 },
    { role: "ContractsManager", label: "Contracts Manager", stepOrder: 3 },
    { role: "OperationsManager", label: "Operations Manager", stepOrder: 4 },
];

const USER_TYPE_MAP: Record<number, string> = {
    0: "GeneralManager",
    1: "RegionalOperationsManager",
    2: "OperationsManager",
    3: "ContractsManager",
    4: "QuantitySurveyor",
    5: "Accountant",
    6: "Admin",
    7: "ProjectManager",
};

function getRoleLabelFromName(roleName: string): string {
    return APPROVAL_CHAIN_ROLES.find(r => r.role === roleName)?.label ?? roleName;
}

function getActionIcon(action: string, size = "size-5") {
    switch (action) {
        case "Approved":
            return <span className={`iconify lucide--check-circle text-success ${size}`} />;
        case "AutoApproved":
            return <span className={`iconify lucide--check-circle-2 text-success ${size}`} />;
        case "Rejected":
            return <span className={`iconify lucide--x-circle text-error ${size}`} />;
        case "Pending":
            return <span className={`iconify lucide--clock text-primary ${size}`} />;
        default:
            return <span className={`iconify lucide--circle text-base-content/30 ${size}`} />;
    }
}

function getActionBadge(action: string) {
    switch (action) {
        case "Approved":
            return <span className="badge badge-success badge-xs">Approved</span>;
        case "AutoApproved":
            return <span className="badge badge-success badge-xs">Auto-Approved</span>;
        case "Rejected":
            return <span className="badge badge-error badge-xs">Rejected</span>;
        case "Pending":
            return <span className="badge badge-primary badge-xs">Pending</span>;
        default:
            return null;
    }
}

function getLineColor(action: string) {
    switch (action) {
        case "Approved":
        case "AutoApproved":
            return "bg-success";
        case "Rejected":
            return "bg-error";
        default:
            return "bg-base-300";
    }
}

function getStepperIcon(action: string, size = "size-4") {
    switch (action) {
        case "Approved":
            return <span className={`iconify lucide--check-circle ${size}`} />;
        case "AutoApproved":
            return <span className={`iconify lucide--check-circle-2 ${size}`} />;
        case "Rejected":
            return <span className={`iconify lucide--x-circle ${size}`} />;
        case "Pending":
            return <span className={`iconify lucide--clock ${size}`} />;
        default:
            return <span className={`iconify lucide--circle ${size}`} />;
    }
}

function getStepTone(action: string, isActive: boolean) {
    switch (action) {
        case "Approved":
            return "bg-success/10 border-success/30 text-success";
        case "AutoApproved":
            return "bg-info/10 border-info/30 text-info";
        case "Rejected":
            return "bg-error/10 border-error/30 text-error";
        case "Pending":
            return isActive ? "bg-warning/10 border-warning/40 text-warning" : "bg-base-200 border-base-300 text-base-content/40";
        default:
            return "bg-base-200 border-base-300 text-base-content/40";
    }
}

function getLabelTone(action: string, isActive: boolean) {
    switch (action) {
        case "Approved":
            return "text-success";
        case "AutoApproved":
            return "text-info";
        case "Rejected":
            return "text-error";
        case "Pending":
            return isActive ? "text-warning" : "text-base-content/50";
        default:
            return "text-base-content/50";
    }
}

function formatDateTime(dateStr?: string) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return {
        date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
}

interface IpcApprovalStatusProps {
    ipcId: number;
    ipcStatus: string;
    onApproved?: () => void;
    onRejected?: () => void;
}

export default function IpcApprovalStatus({ ipcId, ipcStatus, onApproved, onRejected }: IpcApprovalStatusProps) {
    const { authState } = useAuth();
    const token = authState.user?.token ?? "";
    const userRoleType = authState.user?.roleType;

    const [approvalStatus, setApprovalStatus] = useState<IpcApprovalStatusType | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [comment, setComment] = useState("");
    const [showRejectConfirm, setShowRejectConfirm] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const currentUserRole = userRoleType !== undefined ? USER_TYPE_MAP[userRoleType] : undefined;

    const fetchStatus = async () => {
        if (!token || ipcStatus === "Editable") return;
        setLoading(true);
        try {
            const result = await ipcApiService.getApprovalStatus(ipcId, token);
            if (result.success && result.data) {
                setApprovalStatus(result.data);
            }
        } catch (err) {
            console.error("Failed to fetch approval status", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [ipcId, ipcStatus]);

    const currentApprovalStep = approvalStatus?.currentApprovalStep;
    const canApprove = currentApprovalStep && currentUserRole === currentApprovalStep;

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            const result = await ipcApiService.approveIpc(ipcId, token, comment || undefined);
            if (result.success) {
                setComment("");
                await fetchStatus();
                onApproved?.();
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        setActionLoading(true);
        try {
            const result = await ipcApiService.rejectIpc(ipcId, token, comment || undefined);
            if (result.success) {
                setComment("");
                setShowRejectConfirm(false);
                onRejected?.();
            }
        } finally {
            setActionLoading(false);
        }
    };

    if (ipcStatus === "Editable") {
        return null;
    }

    const steps = approvalStatus?.steps?.length
        ? [...approvalStatus.steps].sort((a, b) => a.stepOrder - b.stepOrder)
        : APPROVAL_CHAIN_ROLES.map(r => ({
            id: 0,
            roleName: r.role,
            approverRole: r.role,
            action: "Pending",
            stepOrder: r.stepOrder,
        } as IpcApprovalStep));

    const completedSteps = steps.filter(s => s.action === "Approved" || s.action === "AutoApproved").length;
    const totalSteps = steps.length;

    return (
        <>
            <div className="space-y-3">
                {/* Status + history */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-base-content/50">
                        Approvals
                    </span>
                    <div className="flex items-center gap-2">
                        {loading && !approvalStatus && (
                            <span className="text-xs text-base-content/50 flex items-center gap-1">
                                <span className="loading loading-spinner loading-xs"></span>
                                Loading status
                            </span>
                        )}
                        {approvalStatus?.currentStatus === "Approved" && (
                            <span className="badge badge-success badge-sm">Fully Approved</span>
                        )}
                        {approvalStatus?.currentStatus === "PendingApproval" && (
                            <span className="badge badge-warning badge-sm">
                                Awaiting {getRoleLabelFromName(approvalStatus.currentApprovalStep ?? "")}
                            </span>
                        )}
                        <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => setShowHistoryModal(true)}
                            title="View full approval history"
                        >
                            <span className="iconify lucide--history size-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-end text-[11px] uppercase tracking-wider text-base-content/50">
                    <span>{completedSteps}/{totalSteps}</span>
                </div>

                {/* Wizard-style stepper */}
                <div className="flex items-center w-full overflow-x-auto pb-1">
                    {steps.map((step, idx) => {
                        const isActive = currentApprovalStep === step.approverRole && step.action === "Pending";
                        return (
                            <div key={step.id || idx} className="flex items-center flex-1 min-w-[110px]">
                                <div className="flex flex-col items-center w-full">
                                    <div
                                        className={`w-9 h-9 flex items-center justify-center rounded-full border-2 transition-all duration-300 cursor-pointer ${getStepTone(step.action, isActive)}`}
                                        onClick={() => setShowHistoryModal(true)}
                                        title={`${getRoleLabelFromName(step.roleName || step.approverRole)} - ${step.action}`}
                                    >
                                        {getStepperIcon(step.action, "size-4")}
                                    </div>
                                    <span className={`text-xs font-medium text-center mt-1.5 transition-colors duration-300 ${getLabelTone(step.action, isActive)}`}>
                                        {getRoleLabelFromName(step.roleName || step.approverRole)}
                                    </span>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="flex-1 flex items-center" style={{ marginTop: "-18px", minWidth: "48px" }}>
                                        <div className={`h-1 w-full transition-colors duration-500 ${getLineColor(step.action)}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Action buttons for authorized approver */}
                {canApprove && ipcStatus === "PendingApproval" && (
                    <div className="border-t border-base-300 pt-3 space-y-2">
                        <textarea
                            className="textarea textarea-bordered textarea-sm w-full"
                            placeholder="Add a comment (optional)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={2}
                        />
                        <div className="flex gap-2">
                            <button
                                className="btn btn-success btn-sm"
                                onClick={handleApprove}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <span className="loading loading-spinner loading-xs" /> : <span className="iconify lucide--check size-4" />}
                                Approve
                            </button>
                            {!showRejectConfirm ? (
                                <button
                                    className="btn btn-error btn-sm btn-outline"
                                    onClick={() => setShowRejectConfirm(true)}
                                    disabled={actionLoading}
                                >
                                    <span className="iconify lucide--x size-4" />
                                    Reject
                                </button>
                            ) : (
                                <div className="flex gap-1">
                                    <button
                                        className="btn btn-error btn-sm"
                                        onClick={handleReject}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? <span className="loading loading-spinner loading-xs" /> : <span className="iconify lucide--x size-4" />}
                                        Confirm Reject
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setShowRejectConfirm(false)}
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Full History Modal */}
            {showHistoryModal && approvalStatus && (
                <dialog className="modal modal-open" onClick={(e) => { if (e.target === e.currentTarget) setShowHistoryModal(false); }}>
                    <div className="modal-box max-w-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <span className="iconify lucide--clock size-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-base-content">Approval History</h3>
                                    <p className="text-sm text-base-content/60">IPC #{approvalStatus.ipcId} approval timeline</p>
                                </div>
                            </div>
                            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setShowHistoryModal(false)}>
                                <span className="iconify lucide--x size-5" />
                            </button>
                        </div>

                        {/* Generated by info */}
                        {approvalStatus.generatedByRole && (
                            <div className="mb-5 p-3 bg-base-200 rounded-lg flex items-center gap-3">
                                <span className="iconify lucide--rocket text-primary size-5" />
                                <div>
                                    <p className="text-sm font-medium text-base-content">
                                        Generated by <span className="text-primary">{getRoleLabelFromName(approvalStatus.generatedByRole)}</span>
                                    </p>
                                    {approvalStatus.generatedByUserId && (
                                        <p className="text-xs text-base-content/50">User ID: {approvalStatus.generatedByUserId}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Vertical timeline */}
                        <div className="relative">
                            {steps.map((step, idx) => {
                                const dt = formatDateTime(step.actionDate);
                                const isLast = idx === steps.length - 1;
                                const isActive = approvalStatus.currentApprovalStep === step.approverRole && step.action === "Pending";

                                return (
                                    <div key={step.id || idx} className="flex gap-4 pb-6 last:pb-0">
                                        {/* Timeline line + icon */}
                                        <div className="flex flex-col items-center">
                                            <div className={`flex-shrink-0 rounded-full p-1 ${isActive ? "ring-2 ring-warning ring-offset-2 ring-offset-base-100" : ""}`}>
                                                {getActionIcon(step.action, "size-6")}
                                            </div>
                                            {!isLast && (
                                                <div className={`w-0.5 flex-1 mt-1 ${getLineColor(step.action)}`} />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className={`flex-1 pb-2 ${isActive ? "bg-warning/5 -mx-2 px-2 rounded-lg border border-warning/20" : ""}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm text-base-content">
                                                        {getRoleLabelFromName(step.roleName || step.approverRole)}
                                                    </span>
                                                    {getActionBadge(step.action)}
                                                </div>
                                                {dt && (
                                                    <span className="text-xs text-base-content/50">
                                                        {dt.date} at {dt.time}
                                                    </span>
                                                )}
                                            </div>

                                            {step.approverName && step.approverName !== "Auto-approved" && step.approverName !== "Generator" && (
                                                <p className="text-xs text-base-content/60 mt-1 flex items-center gap-1">
                                                    <span className="iconify lucide--user size-3" />
                                                    {step.approverName}
                                                </p>
                                            )}
                                            {(step.approverName === "Auto-approved" || step.approverName === "Generator") && (
                                                <p className="text-xs text-info/70 mt-1 flex items-center gap-1">
                                                    <span className="iconify lucide--zap size-3" />
                                                    {step.approverName === "Generator" ? "Auto-approved (generator's role)" : "Auto-approved (lower role)"}
                                                </p>
                                            )}

                                            {step.comment && (
                                                <div className="mt-2 p-2 bg-base-200 rounded text-sm text-base-content/80 italic">
                                                    &ldquo;{step.comment}&rdquo;
                                                </div>
                                            )}

                                            {isActive && (
                                                <p className="text-xs text-warning mt-1 font-medium flex items-center gap-1">
                                                    <span className="iconify lucide--alert-circle size-3" />
                                                    Awaiting approval
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal footer */}
                        <div className="modal-action">
                            <button className="btn btn-sm" onClick={() => setShowHistoryModal(false)}>Close</button>
                        </div>
                    </div>
                </dialog>
            )}
        </>
    );
}
