import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { Loader } from "@/components/Loader";
import { FileUploader } from "@/components/FileUploader";
import { FilePondFile } from "filepond";

interface BOQItem {
    id?: number;
    no: string;
    key: string;
    unite: string;
    qte: number;
    pu: number;
    costCode?: string;
    totalPrice?: number;
}

interface Building {
    id: number;
    buildingName: string;
    sheetId?: number;
    sheetName?: string;
    replaceAllItems?: boolean;
    boqsContract: BOQItem[];
}

interface SubcontractorBoqData {
    id: number;
    currencyId: number;
    currencyName?: string;
    projectId: number;
    projectName?: string;
    subContractorId: number;
    subcontractorName?: string;
    contractId: number;
    contractType?: string;
    contractDatasetStatus: string;
    contractDate: string;
    completionDate: string;
    contractNumber: string;
    buildings: Building[];
    advancePayment?: number;
    materialSupply?: number;
    holdWarranty?: string;
    latePenalties?: string;
    paymentsTerm?: string;
}

const EditSubcontractorBOQ = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [contractData, setContractData] = useState<SubcontractorBoqData | null>(null);
    const [selectedBuildingForBOQ, setSelectedBuildingForBOQ] = useState<string>('');
    const [isImportingBOQ, setIsImportingBOQ] = useState<boolean>(false);
    const [focusTarget, setFocusTarget] = useState<{ itemId: number | undefined, field: string } | null>(null);

    useEffect(() => {
        loadContractData();
    }, [id]);

    useEffect(() => {
        // Auto-select first building when contract data loads
        if (contractData && contractData.buildings.length > 0 && !selectedBuildingForBOQ) {
            setSelectedBuildingForBOQ(contractData.buildings[0].id.toString());
        }
    }, [contractData, selectedBuildingForBOQ]);

    // Handle focus restoration after new item creation
    useEffect(() => {
        if (focusTarget) {
            const inputId = `boq-input-${focusTarget.itemId}-${focusTarget.field}`;
            const inputElement = document.getElementById(inputId) as HTMLInputElement;
            if (inputElement) {
                inputElement.focus();
                inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                setFocusTarget(null);
            }
        }
    }, [focusTarget, contractData]);

    const loadContractData = async () => {
        setLoading(true);
        try {
            const token = getToken() ?? "";
            const data = await apiRequest<SubcontractorBoqData>({
                endpoint: `ContractsDatasets/GetSubcontractorData/${id}`,
                method: "GET",
                token
            });
            
            if (data && 'id' in data) {
                setContractData(data);
            } else {
                toaster.error("No data found for this contract");
                navigate('/dashboard/subcontractors-boqs');
            }
        } catch (error) {
            toaster.error("Failed to load contract data");
            navigate('/dashboard/subcontractors-boqs');
        } finally {
            setLoading(false);
        }
    };

    // BOQ direct editing functions
    const createEmptyBOQItem = (): BOQItem => ({
        id: Date.now(),
        no: '',
        key: '',
        costCode: '',
        unite: '',
        qte: 0,
        pu: 0,
        totalPrice: 0
    });

    const updateBOQItem = (itemIndex: number, field: keyof BOQItem, value: string | number) => {
        if (!contractData) return;
        
        const selectedBuildingId = parseInt(selectedBuildingForBOQ);
        const newBuildings = contractData.buildings.map(building => {
            if (building.id === selectedBuildingId) {
                const updatedItems = [...(building.boqsContract || [])];
                
                let processedValue = value;
                if (field === 'qte' || field === 'pu') {
                    processedValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                }
                
                updatedItems[itemIndex] = {
                    ...updatedItems[itemIndex],
                    [field]: processedValue,
                    totalPrice: field === 'qte' || field === 'pu' 
                        ? (field === 'qte' ? (processedValue as number) * updatedItems[itemIndex].pu : updatedItems[itemIndex].qte * (processedValue as number))
                        : updatedItems[itemIndex].qte * updatedItems[itemIndex].pu
                };
                
                return {
                    ...building,
                    boqsContract: updatedItems
                };
            }
            return building;
        });
        
        setContractData({ ...contractData, buildings: newBuildings });
    };

    const addNewBOQItem = (itemData: Partial<BOQItem>, focusField: string) => {
        if (!contractData) return;
        
        const selectedBuildingId = parseInt(selectedBuildingForBOQ);
        const newItem: BOQItem = {
            ...createEmptyBOQItem(),
            ...itemData,
            totalPrice: (itemData.qte || 0) * (itemData.pu || 0)
        };

        const newBuildings = contractData.buildings.map(building => {
            if (building.id === selectedBuildingId) {
                return {
                    ...building,
                    boqsContract: [...(building.boqsContract || []), newItem]
                };
            }
            return building;
        });
        
        setContractData({ ...contractData, buildings: newBuildings });
        setFocusTarget({ itemId: newItem.id, field: focusField });
    };

    const deleteBOQItem = (itemIndex: number) => {
        if (!contractData) return;
        
        const selectedBuildingId = parseInt(selectedBuildingForBOQ);
        const newBuildings = contractData.buildings.map(building => {
            if (building.id === selectedBuildingId) {
                return {
                    ...building,
                    boqsContract: building.boqsContract.filter((_, i) => i !== itemIndex)
                };
            }
            return building;
        });
        
        setContractData({ ...contractData, buildings: newBuildings });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = getToken() ?? "";
            const response = await apiRequest({
                endpoint: "ContractsDatasets/UpdateSubcontractorDataset",
                method: "PUT",
                data: contractData as any,
                token
            });
            
            if (response && response.success !== false) {
                toaster.success("BOQ updated successfully");
                navigate('/dashboard/subcontractors-boqs');
            } else {
                toaster.error(response?.error || "Failed to update BOQ");
            }
        } catch (error) {
            toaster.error("An error occurred while saving");
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateContract = async () => {
        if (!contractData) return;
        
        const confirmed = window.confirm(
            "Are you sure you want to generate the contract? This will finalize it and set its status to Active."
        );
        
        if (!confirmed) return;
        
        setLoading(true);
        try {
            const token = getToken() ?? "";
            const response = await apiRequest({
                endpoint: `ContractsDatasets/GenerateContract/${id}`,
                method: "POST",
                token
            });
            
            if (response && response.success !== false) {
                toaster.success("Contract generated successfully");
                navigate('/dashboard/contracts-database');
            } else {
                toaster.error(response?.message || "Failed to generate contract");
            }
        } catch (error) {
            toaster.error("Failed to generate contract");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader />;
    }

    if (!contractData) {
        return <div>No data found</div>;
    }

    return (
        <div>
            <style>{`
                .filepond-wrapper .filepond--root {
                    font-family: inherit;
                }
                
                .filepond-wrapper .filepond--drop-label {
                    color: var(--fallback-bc, oklch(var(--bc)));
                    font-size: 0.875rem;
                }
                
                .filepond-wrapper .filepond--label-action {
                    text-decoration: underline;
                    color: var(--fallback-p, oklch(var(--p)));
                    cursor: pointer;
                }
                
                .filepond-wrapper .filepond--panel-root {
                    background-color: var(--fallback-b2, oklch(var(--b2)));
                    border: 2px dashed var(--fallback-bc, oklch(var(--bc) / 0.2));
                    border-radius: var(--rounded-btn, 0.5rem);
                }
                
                .filepond-wrapper .filepond--item-panel {
                    background-color: var(--fallback-b1, oklch(var(--b1)));
                    border-radius: var(--rounded-btn, 0.5rem);
                }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Edit Subcontractor BOQ</h1>
                    <p className="text-sm text-base-content/70">
                        Contract #{contractData.contractNumber} - {contractData.contractDatasetStatus}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/subcontractors-boqs')}
                    className="btn btn-sm btn-ghost"
                >
                    <span className="iconify lucide--x size-4"></span>
                </button>
            </div>

            {/* Contract Info Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card bg-base-100 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-base-content/70 mb-1">Project</h3>
                    <p className="font-medium">{contractData.projectName || 'N/A'}</p>
                </div>
                <div className="card bg-base-100 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-base-content/70 mb-1">Subcontractor</h3>
                    <p className="font-medium">{contractData.subcontractorName || 'N/A'}</p>
                </div>
                <div className="card bg-base-100 shadow-sm p-4">
                    <h3 className="text-sm font-semibold text-base-content/70 mb-1">Contract Type</h3>
                    <p className="font-medium">{contractData.contractType || 'N/A'}</p>
                </div>
            </div>

            {/* BOQ Section */}
            <div className="card bg-base-100 shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">BOQ Items</h2>
                
                {/* Building Selection and Upload Button */}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <select 
                        className="select select-bordered w-auto max-w-xs"
                        value={selectedBuildingForBOQ || ''}
                        onChange={(e) => setSelectedBuildingForBOQ(e.target.value)}
                    >
                        {contractData.buildings.map(building => (
                            <option key={building.id} value={building.id.toString()}>
                                {building.buildingName}
                            </option>
                        ))}
                    </select>
                    
                    <button
                        onClick={() => setIsImportingBOQ(true)}
                        className="btn btn-outline btn-sm"
                    >
                        <span className="iconify lucide--upload w-4 h-4"></span>
                        Import BOQ
                    </button>
                </div>

                {selectedBuildingForBOQ && (
                    <div>
                        {/* BOQ Items Table */}
                        <div className="bg-base-100 rounded-xl border border-base-300 flex flex-col">
                            <div className="overflow-x-auto">
                                <table className="w-full table-auto bg-base-100">
                                    <thead className="bg-base-200">
                                        <tr>
                                            <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">No.</th>
                                            <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Description</th>
                                            <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Cost Code</th>
                                            <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Unit</th>
                                            <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Quantity</th>
                                            <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Unit Price</th>
                                            <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Total Price</th>
                                            <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider w-24 sm:w-28">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-base-300">
                                        {(() => {
                                            const selectedBuilding = contractData.buildings.find(b => b.id === parseInt(selectedBuildingForBOQ));
                                            const items = selectedBuilding?.boqsContract || [];
                                            
                                            // Always show at least one empty row for new entries
                                            const displayItems = [...items];
                                            if (displayItems.length === 0 || displayItems[displayItems.length - 1].no !== '') {
                                                displayItems.push(createEmptyBOQItem());
                                            }
                                            
                                            return displayItems.map((item, index) => {
                                                const isEmptyRow = item.no === '' && item.key === '' && (!item.costCode || item.costCode === '') && item.unite === '' && item.qte === 0 && item.pu === 0;
                                                
                                                return (
                                                    <tr key={item.id || index} className="bg-base-100 hover:bg-base-200">
                                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                            <input
                                                                id={`boq-input-${item.id}-no`}
                                                                type="text"
                                                                className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                value={item.no}
                                                                onChange={(e) => {
                                                                    if (isEmptyRow && e.target.value) {
                                                                        addNewBOQItem({ no: e.target.value }, 'no');
                                                                    } else if (!isEmptyRow) {
                                                                        updateBOQItem(index, 'no', e.target.value);
                                                                    }
                                                                }}
                                                                placeholder={isEmptyRow ? "Item no..." : ""}
                                                            />
                                                        </td>
                                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                            <input
                                                                id={`boq-input-${item.id}-key`}
                                                                type="text"
                                                                className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                value={item.key}
                                                                onChange={(e) => {
                                                                    if (isEmptyRow && e.target.value) {
                                                                        addNewBOQItem({ key: e.target.value }, 'key');
                                                                    } else if (!isEmptyRow) {
                                                                        updateBOQItem(index, 'key', e.target.value);
                                                                    }
                                                                }}
                                                                placeholder={isEmptyRow ? "Description..." : ""}
                                                            />
                                                        </td>
                                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                            <input
                                                                id={`boq-input-${item.id}-costCode`}
                                                                type="text"
                                                                className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                value={item.costCode || ''}
                                                                onChange={(e) => {
                                                                    if (isEmptyRow && e.target.value) {
                                                                        addNewBOQItem({ costCode: e.target.value }, 'costCode');
                                                                    } else if (!isEmptyRow) {
                                                                        updateBOQItem(index, 'costCode', e.target.value);
                                                                    }
                                                                }}
                                                                placeholder={isEmptyRow ? "Cost code..." : ""}
                                                            />
                                                        </td>
                                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                            <input
                                                                id={`boq-input-${item.id}-unite`}
                                                                type="text"
                                                                className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                value={item.unite}
                                                                onChange={(e) => {
                                                                    if (isEmptyRow && e.target.value) {
                                                                        addNewBOQItem({ unite: e.target.value }, 'unite');
                                                                    } else if (!isEmptyRow) {
                                                                        updateBOQItem(index, 'unite', e.target.value);
                                                                    }
                                                                }}
                                                                placeholder={isEmptyRow ? "Unit..." : ""}
                                                            />
                                                        </td>
                                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                            <input
                                                                id={`boq-input-${item.id}-qte`}
                                                                type="number"
                                                                className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                value={item.qte || ''}
                                                                onChange={(e) => {
                                                                    const value = parseFloat(e.target.value) || 0;
                                                                    if (isEmptyRow && value > 0) {
                                                                        addNewBOQItem({ qte: value }, 'qte');
                                                                    } else if (!isEmptyRow) {
                                                                        updateBOQItem(index, 'qte', value);
                                                                    }
                                                                }}
                                                                placeholder={isEmptyRow ? "0" : ""}
                                                                step="0.01"
                                                            />
                                                        </td>
                                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                            <input
                                                                id={`boq-input-${item.id}-pu`}
                                                                type="number"
                                                                className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                value={item.pu || ''}
                                                                onChange={(e) => {
                                                                    const value = parseFloat(e.target.value) || 0;
                                                                    if (isEmptyRow && value > 0) {
                                                                        addNewBOQItem({ pu: value }, 'pu');
                                                                    } else if (!isEmptyRow) {
                                                                        updateBOQItem(index, 'pu', value);
                                                                    }
                                                                }}
                                                                placeholder={isEmptyRow ? "0.00" : ""}
                                                                step="0.01"
                                                            />
                                                        </td>
                                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-medium text-base-content text-center">
                                                            {isEmptyRow ? '0.00' : (item.totalPrice || item.qte * item.pu).toFixed(2)}
                                                        </td>
                                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-medium text-base-content w-24 sm:w-28 text-center">
                                                            {!isEmptyRow && (
                                                                <div className="inline-flex">
                                                                    <button
                                                                        onClick={() => deleteBOQItem(index)}
                                                                        className="btn btn-ghost btn-sm text-error/70 hover:bg-error/20"
                                                                        title="Delete item"
                                                                    >
                                                                        <span className="iconify lucide--trash size-4"></span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()}
                                        
                                        {/* Total Row */}
                                        {(() => {
                                            const selectedBuilding = contractData.buildings.find(b => b.id === parseInt(selectedBuildingForBOQ));
                                            const items = selectedBuilding?.boqsContract || [];
                                            
                                            if (items.length > 0) {
                                                const total = items.reduce((sum, item) => sum + (item.totalPrice || item.qte * item.pu), 0);
                                                return (
                                                    <tr className="bg-base-200 border-t-2 border-base-300 font-bold text-base-content">
                                                        <td colSpan={6} className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-bold border-t-2 border-base-300 text-center">
                                                            Total
                                                        </td>
                                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-bold border-t-2 border-base-300 text-center">
                                                            {total.toFixed(2)}
                                                        </td>
                                                        <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-bold border-t-2 border-base-300 w-24 sm:w-28"></td>
                                                    </tr>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-6 gap-4">
                <button
                    onClick={() => navigate('/dashboard/subcontractors-boqs')}
                    className="btn btn-ghost"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
                {contractData.contractDatasetStatus === 'Editable' && (
                    <button
                        onClick={handleGenerateContract}
                        className="btn btn-success"
                    >
                        Generate Contract
                    </button>
                )}
            </div>

            {/* Import BOQ Modal */}
            {isImportingBOQ && (
                <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[modal-fade_0.2s]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-base-content">Import BOQ</h3>
                            <button
                                onClick={() => setIsImportingBOQ(false)}
                                className="btn btn-sm btn-ghost"
                            >
                                <span className="iconify lucide--x w-4 h-4"></span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Select BOQ File</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="file-input file-input-bordered w-full"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            toaster.info('BOQ import functionality will be implemented with backend integration');
                                        }
                                    }}
                                />
                                <div className="label">
                                    <span className="label-text-alt">Supported formats: Excel (.xlsx, .xls), CSV</span>
                                </div>
                            </div>

                            <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                                <h4 className="font-semibold text-info-content mb-2">Expected Format:</h4>
                                <ul className="text-sm text-info-content/80 space-y-1">
                                    <li>• Column A: Item No.</li>
                                    <li>• Column B: Description/Key</li>
                                    <li>• Column C: Unit</li>
                                    <li>• Column D: Quantity</li>
                                    <li>• Column E: Unit Price</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => setIsImportingBOQ(false)}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    toaster.info('BOQ import functionality will be implemented with backend integration');
                                    setIsImportingBOQ(false);
                                }}
                                className="btn btn-primary"
                            >
                                Import BOQ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditSubcontractorBOQ;