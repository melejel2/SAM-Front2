import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import calendarIcon from "@iconify/icons-lucide/calendar";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import searchIcon from "@iconify/icons-lucide/search";
import { Icon } from "@iconify/react";
import React, { useState, useMemo } from "react";

import { Loader } from "@/components/Loader";
import { formatCurrency } from "@/utils/formatters";

import { useIPCWizardContext } from "../context/IPCWizardContext";

export const Step1_ContractAndType: React.FC = () => {
    const {
        formData,
        setFormData,
        contracts,
        loadingContracts,
        selectedContract,
        selectContract,
        ipcTypes,
        loadContracts,
    } = useIPCWizardContext();

    console.log("Contracts in Step1:", contracts);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    React.useEffect(() => {
        const statusMap: { [key: string]: number } = {
            all: 2, // Changed from 4 (None) to 2 (Active) - show only active contracts by default
            active: 2, // Active
            completed: 5, // This status is not in the enum, so it will be ignored.
            terminated: 1, // Terminated
            editable: 0, // Editable
        };
        const status = statusMap[statusFilter.toLowerCase()];
        if (status !== 5) {
            loadContracts(status);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    // Enhanced filtering with better search capabilities
    const filteredContracts = useMemo(() => {
        return contracts.filter((contract) => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                term === "" ||
                (contract.contractNumber ?? "").toLowerCase().includes(term) ||
                (contract.projectName ?? "").toLowerCase().includes(term) ||
                (contract.subcontractorName ?? "").toLowerCase().includes(term) ||
                (contract.tradeName ?? "").toLowerCase().includes(term);

            return matchesSearch;
        });
    }, [contracts, searchTerm]);

    const handleContractSelect = (contractId: number) => {
        selectContract(contractId);
    };

    const handleInputChange = (field: string, value: string | number) => {
        setFormData({ [field]: value });
    };

    // Set default dates if not set
    React.useEffect(() => {
        if (!formData.dateIpc) {
            const today = new Date().toISOString().split("T")[0];
            setFormData({ dateIpc: today });
        }
    }, [formData.dateIpc, setFormData]);

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
                return "badge-success";
            case "completed":
                return "badge-info";
            case "terminated":
                return "badge-error";
            default:
                return "badge-warning";
        }
    };

    if (loadingContracts) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Minimalistic Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-base-300">
                <Icon icon={fileTextIcon} className="size-5 text-primary" />
                <h2 className="text-base-content text-base font-semibold">Select Contract & Configure IPC</h2>
            </div>

            {/* Compact Search Bar */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Icon icon={searchIcon} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input input-sm bg-base-100 border-base-300 w-full pl-9"
                        placeholder="Search by contract number, project, subcontractor, or trade..."
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="select select-sm select-bordered bg-base-100 border-base-300 w-40">
                    <option value="all">Active</option>
                    <option value="editable">Editable</option>
                    <option value="terminated">Terminated</option>
                </select>
            </div>

            {/* Selected Contract Compact Display */}
            {selectedContract && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <Icon icon={checkCircleIcon} className="size-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="font-semibold text-sm text-base-content truncate">
                                    {selectedContract.contractNumber}
                                </div>
                                <div className="text-xs text-base-content/70 truncate">
                                    {selectedContract.projectName} • {selectedContract.subcontractorName}
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-xs text-base-content/60">Contract Value</div>
                            <div className="font-semibold text-sm text-success">
                                {formatCurrency(selectedContract.totalAmount)}
                            </div>
                        </div>
                    </div>

                    {/* IPC Configuration Inline */}
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-primary/10">
                        <div>
                            <label className="text-xs text-base-content/60 mb-1 block">IPC Type *</label>
                            <input
                                type="text"
                                list="ipc-types-datalist"
                                value={formData.type}
                                onChange={(e) => handleInputChange("type", e.target.value)}
                                className="input input-sm bg-base-100 border-base-300 w-full"
                                placeholder="Select type"
                            />
                            <datalist id="ipc-types-datalist">
                                {ipcTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="text-xs text-base-content/60 mb-1 block">IPC Date *</label>
                            <input
                                type="date"
                                value={formData.dateIpc}
                                onChange={(e) => handleInputChange("dateIpc", e.target.value)}
                                className="input input-sm bg-base-100 border-base-300 w-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Contracts Table */}
            <div className="overflow-x-auto border border-base-300 rounded-lg">
                <table className="table table-sm table-pin-rows">
                    <thead>
                        <tr className="bg-base-200">
                            <th className="w-8"></th>
                            <th>Contract #</th>
                            <th>Project</th>
                            <th>Subcontractor</th>
                            <th>Trade</th>
                            <th className="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredContracts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8">
                                    <Icon
                                        icon={searchIcon}
                                        className="text-base-content/30 mx-auto mb-2 size-8"
                                    />
                                    <div className="text-sm font-medium text-base-content/70">
                                        {searchTerm || statusFilter !== "all"
                                            ? "No contracts match your search"
                                            : "No contracts available"}
                                    </div>
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm("")}
                                            className="btn btn-xs btn-ghost mt-2">
                                            Clear search
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            filteredContracts.map((contract) => (
                                <tr
                                    key={contract.id}
                                    onClick={() => handleContractSelect(contract.id)}
                                    className={`hover:bg-base-200 cursor-pointer transition-colors ${
                                        formData.contractsDatasetId === contract.id
                                            ? "bg-primary/10"
                                            : ""
                                    }`}>
                                    <td>
                                        {formData.contractsDatasetId === contract.id && (
                                            <Icon icon={checkCircleIcon} className="size-4 text-primary" />
                                        )}
                                    </td>
                                    <td className="font-medium">{contract.contractNumber}</td>
                                    <td className="text-sm">{contract.projectName}</td>
                                    <td className="text-sm">{contract.subcontractorName}</td>
                                    <td className="text-sm">{contract.tradeName}</td>
                                    <td className="text-right font-semibold text-sm">
                                        {formatCurrency(contract.totalAmount)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Results Count */}
            {filteredContracts.length > 0 && (
                <div className="text-xs text-base-content/60 text-right">
                    Showing {filteredContracts.length} of {contracts.length} contracts
                </div>
            )}

            {/* Validation Messages */}
            {!selectedContract && (
                <div className="flex items-center gap-2 text-warning text-sm">
                    <Icon icon={alertTriangleIcon} className="size-4" />
                    <span>Please select a contract to continue</span>
                </div>
            )}
            {selectedContract && !formData.type && (
                <div className="flex items-center gap-2 text-warning text-sm">
                    <Icon icon={alertTriangleIcon} className="size-4" />
                    <span>Please select an IPC type</span>
                </div>
            )}
        </div>
    );
};
