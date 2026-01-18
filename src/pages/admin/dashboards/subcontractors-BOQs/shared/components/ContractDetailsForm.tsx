import React, { useMemo, useState } from "react";
import { AttachmentsDialog } from "./AttachmentsDialog";
import { PAYMENT_TERMS_OPTIONS } from "../../../../../../types/contracts";

interface ContractDetailsFormProps {
    formData: Record<string, any>;
    contracts: Array<{ id: number; templateName?: string | null; contractType?: string | null }>;
    currencies: Array<{ id: number; name?: string | null; currencies?: string | null }>;
    projectAcronym: string;
    contractNumberSuffix: string;
    contractNumberPlaceholder?: string;
    contractNumberMaxLength?: number;
    onContractNumberSuffixChange: (value: string) => void;
    onFieldChange: (field: string, value: any) => void;
}

const SectionCard: React.FC<{
    title: string;
    className?: string;
    children: React.ReactNode;
}> = ({ title, className, children }) => {
    return (
        <div className={`rounded-lg border border-base-200 bg-base-100 p-4 ${className || ""}`.trim()}>
            <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
                    {title}
                </div>
            </div>
            {children}
        </div>
    );
};

const Field: React.FC<{
    label: string;
    required?: boolean;
    className?: string;
    helper?: string;
    children: React.ReactNode;
}> = ({ label, required, className, helper, children }) => {
    return (
        <div className={`flex flex-col gap-1 ${className || ""}`.trim()}>
            <div className="flex items-center justify-between">
                <span className={`text-xs ${required ? "font-semibold text-base-content" : "text-base-content/70"}`}>
                    {label}{required ? " *" : ""}
                </span>
                {helper && <span className="text-[11px] text-base-content/40">{helper}</span>}
            </div>
            {children}
        </div>
    );
};

const UnitInput: React.FC<{
    value: any;
    onChange: (value: string) => void;
    suffix?: string;
    type?: string;
    placeholder?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}> = ({ value, onChange, suffix, type = "text", placeholder, min, max, step, inputMode }) => {
    if (!suffix) {
        return (
            <input
                type={type}
                className="input input-bordered input-sm w-full"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                inputMode={inputMode}
            />
        );
    }

    return (
        <div className="join w-full">
            <input
                type={type}
                className="join-item input input-bordered input-sm w-full"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                min={min}
                max={max}
                step={step}
                inputMode={inputMode}
            />
            <span className="join-item px-2 text-xs text-base-content/60 border border-base-300 bg-base-200">
                {suffix}
            </span>
        </div>
    );
};

const StatChip: React.FC<{ label: string; value: string }> = ({ label, value }) => {
    return (
        <div className="flex items-center gap-2 rounded-full border border-base-200 bg-base-50 px-3 py-1 text-xs">
            <span className="text-base-content/50">{label}</span>
            <span className="font-semibold text-base-content">{value}</span>
        </div>
    );
};

export const ContractDetailsForm: React.FC<ContractDetailsFormProps> = ({
    formData,
    contracts,
    currencies,
    projectAcronym,
    contractNumberSuffix,
    contractNumberPlaceholder,
    contractNumberMaxLength,
    onContractNumberSuffixChange,
    onFieldChange
}) => {
    const [isAttachmentsDialogOpen, setIsAttachmentsDialogOpen] = useState(false);
    const attachmentCount = formData.attachments?.length || 0;
    const isContractNumberDisabled = projectAcronym === "XXX";

    const displaySuffix = useMemo(() => {
        if (contractNumberSuffix && contractNumberSuffix.trim() !== "") {
            return contractNumberSuffix.padStart(3, "0");
        }
        return (contractNumberPlaceholder || "000").padStart(3, "0");
    }, [contractNumberSuffix, contractNumberPlaceholder]);

    const fullContractNumber = `CS-${projectAcronym}-${displaySuffix}`;

    const formatStat = (value: any, suffix: string) => {
        if (value === undefined || value === null || value === "") return "—";
        return `${value}${suffix}`;
    };

    return (
        <div className="bg-base-100 rounded-lg border border-base-300 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>
                    <div>
                        <h2 className="text-lg font-semibold text-base-content">Contract Details</h2>
                        <p className="text-xs text-base-content/60">Define schedule, commercial terms, and risk coverage.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <StatChip label="Contract" value={fullContractNumber} />
                    <StatChip label="VAT" value={formatStat(formData.vat, "%")} />
                    <StatChip label="Retention" value={formatStat(formData.holdWarranty, "%")} />
                    <StatChip label="Due" value={formatStat(formData.daysNumber, "d")} />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
                <div className="space-y-4">
                    <SectionCard title="Identity & Schedule">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-3">
                            <div className="xl:col-span-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-semibold text-base-content">Contract Number *</span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className={`font-mono px-2.5 py-1.5 rounded border text-xs ${
                                                isContractNumberDisabled
                                                    ? "bg-warning/20 text-warning border-warning/40"
                                                    : "bg-base-200 text-base-content/80 border-base-300"
                                            }`}
                                        >
                                            CS-{projectAcronym}-
                                        </span>
                                        <input
                                            type="text"
                                            className="input input-bordered input-sm w-24 text-center font-mono"
                                            value={contractNumberSuffix}
                                            onChange={(e) => onContractNumberSuffixChange(e.target.value)}
                                            placeholder={contractNumberPlaceholder}
                                            maxLength={contractNumberMaxLength}
                                            inputMode="numeric"
                                            disabled={isContractNumberDisabled}
                                        />
                                        <span className="text-[11px] text-base-content/50">Full: {fullContractNumber}</span>
                                    </div>
                                    {isContractNumberDisabled && (
                                        <span className="text-[11px] text-warning">Select a project to unlock numbering.</span>
                                    )}
                                </div>
                            </div>

                            <Field label="Contract Type" required className="xl:col-span-3">
                                <select
                                    className="select select-bordered select-sm w-full"
                                    value={formData.contractId || ""}
                                    onChange={(e) => onFieldChange("contractId", Number(e.target.value))}
                                >
                                    <option value="">Select contract type</option>
                                    {contracts.map((contract) => (
                                        <option key={contract.id} value={contract.id}>
                                            {contract.templateName} {contract.contractType && `- ${contract.contractType}`}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Currency" required className="xl:col-span-3">
                                <select
                                    className="select select-bordered select-sm w-full"
                                    value={formData.currencyId || ""}
                                    onChange={(e) => onFieldChange("currencyId", Number(e.target.value))}
                                >
                                    <option value="">Select currency</option>
                                    {currencies.map((currency) => (
                                        <option key={currency.id} value={currency.id}>
                                            {currency.name} ({currency.currencies})
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Sub-trade" className="xl:col-span-6">
                                <input
                                    type="text"
                                    className="input input-bordered input-sm w-full"
                                    value={formData.subTrade || ""}
                                    onChange={(e) => onFieldChange("subTrade", e.target.value)}
                                    placeholder="Enter sub-trade"
                                />
                            </Field>

                            <Field label="Contract Date" required className="xl:col-span-3">
                                <input
                                    type="date"
                                    className="input input-bordered input-sm w-full"
                                    value={formData.contractDate}
                                    onChange={(e) => onFieldChange("contractDate", e.target.value)}
                                />
                            </Field>

                            <Field label="Completion Date" required className="xl:col-span-3">
                                <input
                                    type="date"
                                    className="input input-bordered input-sm w-full"
                                    value={formData.completionDate}
                                    onChange={(e) => onFieldChange("completionDate", e.target.value)}
                                />
                            </Field>
                        </div>
                    </SectionCard>

                    <SectionCard title="Commercial Terms">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Payment Method" className="col-span-2">
                                    <select
                                        className="select select-bordered select-sm w-full"
                                        value={formData.paymentsTerm || ""}
                                        onChange={(e) => onFieldChange("paymentsTerm", e.target.value)}
                                    >
                                        <option value="">Select payment method</option>
                                        {PAYMENT_TERMS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Payment Due">
                                    <UnitInput
                                        value={formData.daysNumber || ""}
                                        onChange={(value) => onFieldChange("daysNumber", value)}
                                        suffix="days"
                                        placeholder="0"
                                        inputMode="numeric"
                                    />
                                </Field>

                                <Field label="Advance Eligible">
                                    <UnitInput
                                        type="number"
                                        value={formData.subcontractorAdvancePayee || ""}
                                        onChange={(value) => onFieldChange("subcontractorAdvancePayee", value)}
                                        suffix="%"
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        inputMode="decimal"
                                    />
                                </Field>

                                <Field label="Advance Recovery">
                                    <UnitInput
                                        value={formData.recoverAdvance || ""}
                                        onChange={(value) => onFieldChange("recoverAdvance", value)}
                                        suffix="%"
                                        placeholder="0"
                                        inputMode="decimal"
                                    />
                                </Field>

                                <Field label="Material Supply">
                                    <UnitInput
                                        type="number"
                                        value={formData.materialSupply || ""}
                                        onChange={(value) => onFieldChange("materialSupply", Number(value))}
                                        suffix="%"
                                        placeholder="0"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        inputMode="decimal"
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Prorata">
                                    <UnitInput
                                        value={formData.prorataAccount || ""}
                                        onChange={(value) => onFieldChange("prorataAccount", value)}
                                        suffix="%"
                                        placeholder="0"
                                        inputMode="decimal"
                                    />
                                </Field>

                                <Field label="Max Progress">
                                    <UnitInput
                                        value={formData.progress || ""}
                                        onChange={(value) => onFieldChange("progress", value)}
                                        suffix="%"
                                        placeholder="0"
                                        inputMode="decimal"
                                    />
                                </Field>

                                <Field label="VAT / Tax">
                                    <UnitInput
                                        type="number"
                                        value={formData.vat || ""}
                                        onChange={(value) => onFieldChange("vat", Number(value))}
                                        suffix="%"
                                        placeholder="20"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        inputMode="decimal"
                                    />
                                </Field>

                                <Field label="Management Fees">
                                    <UnitInput
                                        value={formData.managementFees || ""}
                                        onChange={(value) => onFieldChange("managementFees", value)}
                                        suffix="%"
                                        placeholder="0"
                                        inputMode="decimal"
                                    />
                                </Field>

                                <Field label="Plans Execution" className="col-span-2">
                                    <UnitInput
                                        value={formData.plansExecution || ""}
                                        onChange={(value) => onFieldChange("plansExecution", value)}
                                        suffix="%"
                                        placeholder="0"
                                        inputMode="decimal"
                                    />
                                </Field>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Risk & Warranty">
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                            <Field label="Late Penalty">
                                <UnitInput
                                    value={formData.latePenalties || ""}
                                    onChange={(value) => onFieldChange("latePenalties", value)}
                                    suffix="‰"
                                    placeholder="0"
                                    inputMode="decimal"
                                />
                            </Field>

                            <Field label="Max Penalty">
                                <UnitInput
                                    value={formData.latePenalityCeiling || ""}
                                    onChange={(value) => onFieldChange("latePenalityCeiling", value)}
                                    suffix="%"
                                    placeholder="0"
                                    inputMode="decimal"
                                />
                            </Field>

                            <Field label="Retention">
                                <UnitInput
                                    value={formData.holdWarranty || ""}
                                    onChange={(value) => onFieldChange("holdWarranty", value)}
                                    suffix="%"
                                    placeholder="0"
                                    inputMode="decimal"
                                />
                            </Field>

                            <Field label="Performance Bond">
                                <UnitInput
                                    value={formData.termination || ""}
                                    onChange={(value) => onFieldChange("termination", value)}
                                    suffix="%"
                                    placeholder="0"
                                    inputMode="decimal"
                                />
                            </Field>

                            <Field label="Warranty">
                                <UnitInput
                                    value={formData.workWarranty || ""}
                                    onChange={(value) => onFieldChange("workWarranty", value)}
                                    suffix="months"
                                    placeholder="0"
                                    inputMode="numeric"
                                />
                            </Field>

                            <Field label="Maintenance">
                                <UnitInput
                                    value={formData.mintenancePeriod || ""}
                                    onChange={(value) => onFieldChange("mintenancePeriod", value)}
                                    suffix="months"
                                    placeholder="0"
                                    inputMode="numeric"
                                />
                            </Field>
                        </div>
                    </SectionCard>
                </div>

                <div className="space-y-4">
                    <SectionCard title="Quick Summary">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-md border border-base-200 bg-base-50 p-2">
                                <div className="text-base-content/50">Payment Terms</div>
                                <div className="font-semibold text-base-content mt-1">
                                    {formData.paymentsTerm || "Not set"}
                                </div>
                            </div>
                            <div className="rounded-md border border-base-200 bg-base-50 p-2">
                                <div className="text-base-content/50">Advance Eligible</div>
                                <div className="font-semibold text-base-content mt-1">
                                    {formatStat(formData.subcontractorAdvancePayee, "%")}
                                </div>
                            </div>
                            <div className="rounded-md border border-base-200 bg-base-50 p-2">
                                <div className="text-base-content/50">Retention</div>
                                <div className="font-semibold text-base-content mt-1">
                                    {formatStat(formData.holdWarranty, "%")}
                                </div>
                            </div>
                            <div className="rounded-md border border-base-200 bg-base-50 p-2">
                                <div className="text-base-content/50">Performance Bond</div>
                                <div className="font-semibold text-base-content mt-1">
                                    {formatStat(formData.termination, "%")}
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Notes">
                        <textarea
                            className="textarea textarea-bordered textarea-sm w-full min-h-28"
                            rows={4}
                            value={formData.remark || ""}
                            onChange={(e) => onFieldChange("remark", e.target.value)}
                            placeholder="Add internal notes, scope clarifications, or reminders..."
                        />
                    </SectionCard>

                    <SectionCard title="Documents">
                        <div className="flex items-center justify-between text-xs text-base-content/60 mb-2">
                            <span>{attachmentCount} file{attachmentCount === 1 ? "" : "s"} attached</span>
                            <span>PDF only</span>
                        </div>
                        <button
                            type="button"
                            className="w-full border border-dashed border-base-300 rounded-md p-3 hover:border-primary/50 transition-all duration-200 cursor-pointer bg-base-50 hover:bg-base-100 flex items-center justify-between gap-3 text-left"
                            onClick={() => setIsAttachmentsDialogOpen(true)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-xl">📁</div>
                                <div>
                                    <div className="text-sm font-medium text-base-content">Manage Attachments</div>
                                    <div className="text-[11px] text-base-content/60">Upload annexes and supporting docs</div>
                                </div>
                            </div>
                            <span className="btn btn-sm btn-outline">Open</span>
                        </button>
                    </SectionCard>
                </div>
            </div>

            <AttachmentsDialog
                isOpen={isAttachmentsDialogOpen}
                onClose={() => setIsAttachmentsDialogOpen(false)}
                attachments={(formData.attachments as any) || []}
                onChange={(attachments) => onFieldChange("attachments", attachments as any)}
            />
        </div>
    );
};
