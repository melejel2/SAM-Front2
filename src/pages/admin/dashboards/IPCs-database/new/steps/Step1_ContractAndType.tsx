import React, { useState } from "react";
import { useIPCWizardContext } from "../context/IPCWizardContext";
import { Loader } from "@/components/Loader";
import { Icon } from "@iconify/react";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import searchIcon from "@iconify/icons-lucide/search";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";
import calendarIcon from "@iconify/icons-lucide/calendar";
import alertTriangleIcon from "@iconify/icons-lucide/alert-triangle";
import infoIcon from "@iconify/icons-lucide/info";
import { Table, TableBody } from "@/components/daisyui/Table";

export const Step1_ContractAndType: React.FC = () => {
    const { 
        formData, 
        setFormData, 
        contracts, 
        loadingContracts, 
        selectedContract,
        selectContract,
        ipcTypes,
        loadContracts
    } = useIPCWizardContext();
    
    console.log("Contracts in Step1:", contracts);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    
    React.useEffect(() => {
        const statusMap: { [key: string]: number } = {
            "all": 4, // None
            "active": 2, // Active
            "completed": 5, // This status is not in the enum, so it will be ignored.
            "terminated": 1 // Terminated
        };
        const status = statusMap[statusFilter.toLowerCase()];
        if (status !== 5) {
            loadContracts(status);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);
    
    
    // Filter contracts based on search and status
    const filteredContracts = contracts.filter(contract => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = term === "" ||
            (contract.contractNumber ?? "").toLowerCase().includes(term) ||
            (contract.projectName ?? "").toLowerCase().includes(term) ||
            (contract.subcontractorName ?? "").toLowerCase().includes(term) ||
            (contract.tradeName ?? "").toLowerCase().includes(term);
        
        return matchesSearch;
    });
    
    const handleContractSelect = (contractId: number) => {
        selectContract(contractId);
    };
    
    const handleInputChange = (field: string, value: string | number) => {
        setFormData({ [field]: value });
    };
    
    // Set default dates if not set
    React.useEffect(() => {
        if (!formData.dateIpc) {
            const today = new Date().toISOString().split('T')[0];
            setFormData({ dateIpc: today });
        }
    }, [formData.dateIpc, setFormData]);
    
    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) {
            return 'N/A';
        }
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };
    
    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'badge-success';
            case 'completed':
                return 'badge-info';
            case 'terminated':
                return 'badge-error';
            default:
                return 'badge-warning';
        }
    };
    
    if (loadingContracts) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                    <Icon icon={fileTextIcon} className="text-blue-600 dark:text-blue-400 size-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-base-content">Contract Selection & IPC Configuration</h2>
                    <p className="text-sm text-base-content/70">Choose the contract and configure basic IPC information</p>
                </div>
            </div>
            
            {/* Contract Selection Section */}
            <div className="bg-base-200 p-4 rounded-lg">
                <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2">
                    <Icon icon={searchIcon} className="size-4" />
                    Select Contract
                </h3>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <label className="floating-label">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input input-sm bg-base-100 border-base-300 floating-input w-full"
                                placeholder=" "
                            />
                            <span>Search contracts...</span>
                        </label>
                    </div>
                    
                    <div className="w-full sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="select select-sm select-bordered bg-base-100 border-base-300 w-full"
                        >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="terminated">Terminated</option>
                        </select>
                    </div>
                </div>
                
                {/* Selected Contract Info */}
                {selectedContract && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Icon icon={checkCircleIcon} className="text-blue-600 dark:text-blue-400 size-5" />
                            <h4 className="font-semibold text-blue-600 dark:text-blue-400">Selected Contract</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-blue-600/70 dark:text-blue-400/70">Contract Number:</span>
                                <div className="font-semibold text-blue-600 dark:text-blue-400">
                                    {selectedContract.contractNumber}
                                </div>
                            </div>
                            <div>
                                <span className="text-blue-600/70 dark:text-blue-400/70">Project:</span>
                                <div className="font-semibold text-blue-600 dark:text-blue-400">
                                    {selectedContract.projectName}
                                </div>
                            </div>
                            <div>
                                <span className="text-blue-600/70 dark:text-blue-400/70">Subcontractor:</span>
                                <div className="font-semibold text-blue-600 dark:text-blue-400">
                                    {selectedContract.subcontractorName}
                                </div>
                            </div>
                            <div>
                                <span className="text-blue-600/70 dark:text-blue-400/70">Trade:</span>
                                <div className="font-semibold text-blue-600 dark:text-blue-400">
                                    {selectedContract.tradeName}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Contracts List */}
                <div className="overflow-x-auto max-h-96">
                    <Table size="sm" pinRows>
                        <thead>
                            <tr>
                                <th></th>
                                <th>Contract Number</th>
                                <th>Project Name</th>
                                <th>Subcontractor</th>
                                <th>Trade</th>
                                <th>Status</th>
                                <th className="text-right">Amount</th>
                            </tr>
                        </thead>
                        <TableBody>
                            {filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center">
                                        <div className="py-8">
                                            <Icon icon={searchIcon} className="text-base-content/30 size-12 mx-auto mb-4" />
                                            <h4 className="text-lg font-semibold text-base-content mb-2">No Contracts Found</h4>
                                            <p className="text-base-content/70">
                                                {searchTerm || statusFilter !== "all"
                                                    ? "Try adjusting your search criteria or filters"
                                                    : "No contracts available for IPC creation"}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map(contract => (
                                    <tr
                                        key={contract.id}
                                        onClick={() => handleContractSelect(contract.id)}
                                        className={`cursor-pointer hover:bg-base-300 ${
                                            formData.contractsDatasetId === contract.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                                        }`}
                                    >
                                        <td>
                                            {formData.contractsDatasetId === contract.id && (
                                                <Icon icon={checkCircleIcon} className="text-blue-600 size-5" />
                                            )}
                                        </td>
                                        <td>{contract.contractNumber}</td>
                                        <td>{contract.projectName}</td>
                                        <td>{contract.subcontractorName}</td>
                                        <td>{contract.tradeName}</td>
                                        <td>
                                            <span className={`badge badge-sm ${getStatusBadgeClass(contract.status)}`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="font-semibold text-right">
                                            {formatCurrency(contract.totalAmount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            
            {/* IPC Configuration Section */}
            {selectedContract && (
                <div className="bg-base-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-base-content mb-4 flex items-center gap-2">
                        <Icon icon={calendarIcon} className="size-4" />
                        IPC Configuration
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - IPC Type and Number */}
                        <div className="space-y-4">
                            {/* IPC Type */}
                            <div className="floating-label-group">
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                    className="select select-sm select-bordered bg-base-100 border-base-300 floating-input w-full"
                                >
                                    {ipcTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                <label className="floating-label">IPC Type *</label>
                            </div>
                            
                            {/* IPC Date */}
                            <div className="floating-label-group">
                                <input
                                    type="date"
                                    value={formData.dateIpc}
                                    onChange={(e) => handleInputChange('dateIpc', e.target.value)}
                                    className="input input-sm bg-base-100 border-base-300 floating-input w-full"
                                    placeholder=" "
                                />
                                <label className="floating-label">IPC Date *</label>
                            </div>
                        </div>
                        
                        {/* Right Column - IPC Type Description */}
                        <div className="space-y-4">
                            <div className="bg-base-100 p-4 rounded-lg border border-base-300">
                                <h4 className="font-medium text-base-content mb-2">Selected IPC Type:</h4>
                                <p className="text-sm text-base-content/70">
                                    {formData.type === "Provisoire / Interim" && "Standard interim payment for ongoing work progress."}
                                    {formData.type === "Final / Final" && "Final payment certificate upon project completion."}
                                    {formData.type === "Rg / Retention" && "Retention release payment certificate."}
                                    {formData.type === "Avance / Advance Payment" && "Advance payment certificate for upfront payment."}
                                </p>
                            </div>
                            
                            {/* Quick Summary */}
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-base-content/60">Contract Value:</span>
                                    <span className="font-semibold text-green-600">
                                        {formatCurrency(selectedContract.totalAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-base-content/60">Buildings:</span>
                                    <span className="font-medium text-base-content">
                                        {selectedContract.buildings.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Validation Messages */}
            <div className="space-y-2">
                {!selectedContract && (
                    <div className="flex items-center gap-2 text-yellow-600">
                        <Icon icon={alertTriangleIcon} className="size-4" />
                        <span className="text-sm">Please select a contract for the IPC</span>
                    </div>
                )}
                {selectedContract && !formData.type && (
                    <div className="flex items-center gap-2 text-yellow-600">
                        <Icon icon={alertTriangleIcon} className="size-4" />
                        <span className="text-sm">Please select an IPC type</span>
                    </div>
                )}
                {selectedContract && !formData.dateIpc && (
                    <div className="flex items-center gap-2 text-yellow-600">
                        <Icon icon={alertTriangleIcon} className="size-4" />
                        <span className="text-sm">Please select an IPC date</span>
                    </div>
                )}
            </div>
        </div>
    );
};