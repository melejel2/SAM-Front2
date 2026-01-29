import { useEffect, useState, useMemo, useCallback } from "react";

import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { Loader } from "@/components/Loader";
import useToast from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import useContractDeductions from "../../hooks/use-contract-deductions";

interface LaborRow {
    id: number;
    ref: string;
    laborType: string;
    activityDescription: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    amount: number;
    _unitPriceRaw?: number;
    _amountRaw?: number;
}

interface MaterialRow {
    id: number;
    bc: string;
    designation: string;
    unit: string;
    saleUnit: number;
    quantity: number;
    allocated: number;
    stockQte: number;
    transferedQte: number;
    transferedTo: string;
    remark: string;
    _saleUnitRaw?: number;
}

interface MachineRow {
    id: number;
    ref: string;
    machineAcronym: string;
    machineType: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    amount: number;
    _unitPriceRaw?: number;
    _amountRaw?: number;
}

type DeductionType = "labor" | "materials" | "machines";

interface DeductionsTabProps {
    contractId: number | null;
}

const DeductionsTab = ({ contractId }: DeductionsTabProps) => {
    const { toaster } = useToast();
    const [activeType, setActiveType] = useState<DeductionType>(() => (sessionStorage.getItem("deductions-tab-type") as DeductionType) || "labor");

    useEffect(() => { sessionStorage.setItem("deductions-tab-type", activeType); }, [activeType]);

    // Edit dialog state
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editingType, setEditingType] = useState<DeductionType>("labor");
    const [isNew, setIsNew] = useState(false);
    const [saving, setSaving] = useState(false);

    const {
        loading,
        laborData,
        materialsData,
        machinesData,
        laborColumns,
        materialsColumns,
        machinesColumns,
        laborTypeOptions,
        machineAcronymOptions,
        unitOptions,
        fetchDeductionsData,
        addLabor,
        updateLabor,
        deleteLabor,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        addMachine,
        updateMachine,
        deleteMachine,
        getLaborDefaults,
        getMachineDefaults,
    } = useContractDeductions({ contractId });

    // Memoized formatted data - only recalculate when source data changes
    // Note: Raw numeric values are passed to SAMTable - Table component handles formatting
    // We store raw values as private properties for editing
    const formattedLaborData = useMemo(() => laborData.map(item => ({
        ...item,
        // Raw numeric values - Table component handles formatting
        amount: item.amount ?? 0,
        unitPrice: item.unitPrice ?? 0,
        _amountRaw: item.amount,
        _unitPriceRaw: item.unitPrice,
    })), [laborData]);

    const formattedMachinesData = useMemo(() => machinesData.map(item => ({
        ...item,
        // Raw numeric values - Table component handles formatting
        amount: item.amount ?? 0,
        unitPrice: item.unitPrice ?? 0,
        _amountRaw: item.amount,
        _unitPriceRaw: item.unitPrice,
    })), [machinesData]);

    const formattedMaterialsData = useMemo(() => materialsData.map(item => ({
        ...item,
        // Raw numeric value - Table component handles formatting
        saleUnit: item.saleUnit ?? 0,
        _saleUnitRaw: item.saleUnit,
    })), [materialsData]);

    // Memoize current data getter to prevent unnecessary recalculations
    const getCurrentData = useMemo(() => {
        if (activeType === "labor") return formattedLaborData;
        if (activeType === "materials") return formattedMaterialsData;
        return formattedMachinesData;
    }, [activeType, formattedLaborData, formattedMaterialsData, formattedMachinesData]);

    // Spreadsheet columns for Labor
    const laborSpreadsheetColumns = useMemo((): SpreadsheetColumn<LaborRow>[] => [
        { key: "ref", label: "Ref", width: 80, align: "left", editable: false, sortable: true, filterable: true },
        { key: "laborType", label: "Type", width: 120, align: "left", editable: false, sortable: true, filterable: true },
        { key: "activityDescription", label: "Activity", width: 200, align: "left", editable: false, sortable: true, filterable: true },
        { key: "unit", label: "Unit", width: 80, align: "center", editable: false, sortable: true, filterable: true },
        { key: "unitPrice", label: "Unit Price", width: 120, align: "right", editable: false, sortable: true, filterable: false, formatter: (v) => formatCurrency(v) },
        { key: "quantity", label: "Qty", width: 80, align: "right", editable: false, sortable: true, filterable: false },
        { key: "amount", label: "Amount", width: 120, align: "right", editable: false, sortable: true, filterable: false, formatter: (v) => formatCurrency(v) },
    ], []);

    // Spreadsheet columns for Materials
    const materialsSpreadsheetColumns = useMemo((): SpreadsheetColumn<MaterialRow>[] => [
        { key: "bc", label: "BC", width: 80, align: "left", editable: false, sortable: true, filterable: true },
        { key: "designation", label: "Designation", width: 180, align: "left", editable: false, sortable: true, filterable: true },
        { key: "unit", label: "Unit", width: 80, align: "center", editable: false, sortable: true, filterable: true },
        { key: "saleUnit", label: "Sale Unit", width: 100, align: "right", editable: false, sortable: true, filterable: false, formatter: (v) => formatCurrency(v) },
        { key: "quantity", label: "Qty", width: 80, align: "right", editable: false, sortable: true, filterable: false },
        { key: "allocated", label: "Allocated", width: 90, align: "right", editable: false, sortable: true, filterable: false },
        { key: "stockQte", label: "Stock", width: 80, align: "right", editable: false, sortable: true, filterable: false },
        { key: "transferedQte", label: "Transferred", width: 100, align: "right", editable: false, sortable: true, filterable: false },
        { key: "remark", label: "Remark", width: 150, align: "left", editable: false, sortable: false, filterable: false },
    ], []);

    // Spreadsheet columns for Machines
    const machinesSpreadsheetColumns = useMemo((): SpreadsheetColumn<MachineRow>[] => [
        { key: "ref", label: "Ref", width: 80, align: "left", editable: false, sortable: true, filterable: true },
        { key: "machineAcronym", label: "Code", width: 100, align: "left", editable: false, sortable: true, filterable: true },
        { key: "machineType", label: "Type", width: 150, align: "left", editable: false, sortable: true, filterable: true },
        { key: "unit", label: "Unit", width: 80, align: "center", editable: false, sortable: true, filterable: true },
        { key: "unitPrice", label: "Unit Price", width: 120, align: "right", editable: false, sortable: true, filterable: false, formatter: (v) => formatCurrency(v) },
        { key: "quantity", label: "Qty", width: 80, align: "right", editable: false, sortable: true, filterable: false },
        { key: "amount", label: "Amount", width: 120, align: "right", editable: false, sortable: true, filterable: false, formatter: (v) => formatCurrency(v) },
    ], []);

    // Clear modal data when closing to free memory
    const handleCloseDialog = useCallback(() => {
        setShowEditDialog(false);
        // Defer clearing to allow animation
        setTimeout(() => setEditingItem(null), 300);
    }, []);

    // Fetch data on mount
    useEffect(() => {
        if (contractId) {
            fetchDeductionsData();
        }
    }, [contractId, fetchDeductionsData]);

    const handleAdd = (type: DeductionType) => {
        setEditingType(type);
        setIsNew(true);

        // Initialize empty item based on type
        if (type === "labor") {
            setEditingItem({
                ref: "",
                laborType: "",
                activityDescription: "",
                unit: "HR",
                unitPrice: 0,
                quantity: 0,
            });
        } else if (type === "machines") {
            setEditingItem({
                ref: "",
                machineAcronym: "",
                machineType: "",
                unit: "HR",
                unitPrice: 0,
                quantity: 0,
            });
        } else {
            setEditingItem({
                bc: "",
                designation: "",
                unit: "UNIT",
                saleUnit: 0,
                quantity: 0,
                allocated: 0,
                transferedQte: 0,
                transferedTo: "",
                stockQte: 0,
                remark: "",
            });
        }

        setShowEditDialog(true);
    };

    const handleEdit = (type: DeductionType, item: any) => {
        setEditingType(type);
        setIsNew(false);

        // Extract raw values for editing (use ?? to preserve zero values)
        const rawItem = { ...item };
        if (type === "labor" || type === "machines") {
            rawItem.unitPrice = item._unitPriceRaw ?? item.unitPrice;
        }
        if (type === "materials") {
            rawItem.saleUnit = item._saleUnitRaw ?? item.saleUnit;
        }

        setEditingItem(rawItem);
        setShowEditDialog(true);
    };

    const handleDelete = async (type: DeductionType, id: number) => {
        if (!window.confirm(`Are you sure you want to delete this ${type === "labor" ? "labor" : type === "materials" ? "material" : "machine"} item?`)) {
            return;
        }

        let result;
        if (type === "labor") {
            result = await deleteLabor(id);
        } else if (type === "materials") {
            result = await deleteMaterial(id);
        } else {
            result = await deleteMachine(id);
        }

        if (result.success) {
            toaster.success("Item deleted successfully");
        } else {
            toaster.error(result.error || "Failed to delete item");
        }
    };

    // Render actions for Labor
    const renderLaborActions = useCallback((row: LaborRow) => (
        <div className="flex items-center gap-1">
            <button
                className="btn btn-ghost btn-xs text-warning hover:bg-warning/20"
                onClick={(e) => { e.stopPropagation(); handleEdit("labor", row); }}
                title="Edit"
            >
                <span className="iconify lucide--pencil size-4"></span>
            </button>
            <button
                className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                onClick={(e) => { e.stopPropagation(); handleDelete("labor", row.id); }}
                title="Delete"
            >
                <span className="iconify lucide--trash-2 size-4"></span>
            </button>
        </div>
    ), [handleEdit, handleDelete]);

    // Render actions for Materials
    const renderMaterialsActions = useCallback((row: MaterialRow) => (
        <div className="flex items-center gap-1">
            <button
                className="btn btn-ghost btn-xs text-warning hover:bg-warning/20"
                onClick={(e) => { e.stopPropagation(); handleEdit("materials", row); }}
                title="Edit"
            >
                <span className="iconify lucide--pencil size-4"></span>
            </button>
            <button
                className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                onClick={(e) => { e.stopPropagation(); handleDelete("materials", row.id); }}
                title="Delete"
            >
                <span className="iconify lucide--trash-2 size-4"></span>
            </button>
        </div>
    ), [handleEdit, handleDelete]);

    // Render actions for Machines
    const renderMachinesActions = useCallback((row: MachineRow) => (
        <div className="flex items-center gap-1">
            <button
                className="btn btn-ghost btn-xs text-warning hover:bg-warning/20"
                onClick={(e) => { e.stopPropagation(); handleEdit("machines", row); }}
                title="Edit"
            >
                <span className="iconify lucide--pencil size-4"></span>
            </button>
            <button
                className="btn btn-ghost btn-xs text-error hover:bg-error/20"
                onClick={(e) => { e.stopPropagation(); handleDelete("machines", row.id); }}
                title="Delete"
            >
                <span className="iconify lucide--trash-2 size-4"></span>
            </button>
        </div>
    ), [handleEdit, handleDelete]);

    const handleSave = async () => {
        setSaving(true);
        try {
            let result;

            if (editingType === "labor") {
                if (isNew) {
                    result = await addLabor(editingItem);
                } else {
                    result = await updateLabor(editingItem);
                }
            } else if (editingType === "materials") {
                if (isNew) {
                    result = await addMaterial(editingItem);
                } else {
                    result = await updateMaterial(editingItem);
                }
            } else {
                if (isNew) {
                    result = await addMachine(editingItem);
                } else {
                    result = await updateMachine(editingItem);
                }
            }

            if (result.success) {
                toaster.success(`${isNew ? "Created" : "Updated"} successfully`);
                handleCloseDialog();
            } else {
                toaster.error(result.error || `Failed to ${isNew ? "create" : "update"}`);
            }
        } catch (error) {
            toaster.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleTableAction = (type: string, data: any, deductionType: DeductionType) => {
        if (type === "Edit") {
            handleEdit(deductionType, data);
        } else if (type === "Delete") {
            handleDelete(deductionType, data.id);
        }
    };

    // Auto-fill labor defaults when type is selected
    const handleLaborTypeChange = (laborType: string) => {
        const defaults = getLaborDefaults(laborType);
        if (defaults) {
            setEditingItem({
                ...editingItem,
                laborType,
                unit: defaults.unit || editingItem.unit,
                unitPrice: defaults.unitPrice ?? editingItem.unitPrice, // Use ?? to preserve 0
            });
        } else {
            setEditingItem({ ...editingItem, laborType });
        }
    };

    // Auto-fill machine defaults when acronym is selected
    const handleMachineAcronymChange = (acronym: string) => {
        const defaults = getMachineDefaults(acronym);
        if (defaults) {
            setEditingItem({
                ...editingItem,
                machineAcronym: acronym,
                machineType: defaults.type || editingItem.machineType,
                unit: defaults.unit || editingItem.unit,
                unitPrice: defaults.unitPrice ?? editingItem.unitPrice, // Use ?? to preserve 0
            });
        } else {
            setEditingItem({ ...editingItem, machineAcronym: acronym });
        }
    };

    const renderSubTabs = () => (
        <div className="flex items-center gap-2 mb-4">
            <button
                className={`btn btn-sm ${activeType === "labor" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveType("labor")}>
                <span className="iconify lucide--users size-4"></span>
                <span>Labor ({laborData.length})</span>
            </button>
            <button
                className={`btn btn-sm ${activeType === "materials" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveType("materials")}>
                <span className="iconify lucide--package size-4"></span>
                <span>Materials ({materialsData.length})</span>
            </button>
            <button
                className={`btn btn-sm ${activeType === "machines" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setActiveType("machines")}>
                <span className="iconify lucide--cog size-4"></span>
                <span>Machines ({machinesData.length})</span>
            </button>
        </div>
    );

    const renderLaborTable = () => (
        <Spreadsheet<LaborRow>
            data={formattedLaborData}
            columns={laborSpreadsheetColumns}
            mode="view"
            loading={false}
            persistKey="contract-deductions-labor"
            rowHeight={40}
            actionsRender={renderLaborActions}
            actionsColumnWidth={100}
            getRowId={(row) => row.id}
            allowKeyboardNavigation
            allowColumnResize
            allowSorting
            allowFilters
            hideFormulaBar
        />
    );

    const renderMaterialsTable = () => (
        <Spreadsheet<MaterialRow>
            data={formattedMaterialsData}
            columns={materialsSpreadsheetColumns}
            mode="view"
            loading={false}
            persistKey="contract-deductions-materials"
            rowHeight={40}
            actionsRender={renderMaterialsActions}
            actionsColumnWidth={100}
            getRowId={(row) => row.id}
            allowKeyboardNavigation
            allowColumnResize
            allowSorting
            allowFilters
            hideFormulaBar
        />
    );

    const renderMachinesTable = () => (
        <Spreadsheet<MachineRow>
            data={formattedMachinesData}
            columns={machinesSpreadsheetColumns}
            mode="view"
            loading={false}
            persistKey="contract-deductions-machines"
            rowHeight={40}
            actionsRender={renderMachinesActions}
            actionsColumnWidth={100}
            getRowId={(row) => row.id}
            allowKeyboardNavigation
            allowColumnResize
            allowSorting
            allowFilters
            hideFormulaBar
        />
    );

    const renderEditDialog = () => {
        if (!showEditDialog || !editingItem) return null;

        return (
            <dialog className="modal modal-open">
                <div className="modal-box max-w-2xl">
                    <h3 className="text-lg font-bold mb-4">
                        {isNew ? "Add" : "Edit"} {editingType === "labor" ? "Labor" : editingType === "materials" ? "Material" : "Machine"}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        {editingType === "labor" && (
                            <>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Reference</span></label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editingItem.ref || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, ref: e.target.value })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Labor Type</span></label>
                                    <select
                                        className="select select-bordered"
                                        value={editingItem.laborType || ""}
                                        onChange={(e) => handleLaborTypeChange(e.target.value)}>
                                        <option value="">Select type...</option>
                                        {laborTypeOptions.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-control col-span-2">
                                    <label className="label"><span className="label-text">Activity Description</span></label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editingItem.activityDescription || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, activityDescription: e.target.value })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Unit</span></label>
                                    <select
                                        className="select select-bordered"
                                        value={editingItem.unit || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}>
                                        {unitOptions.map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Unit Price</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered"
                                        value={editingItem.unitPrice || 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Quantity</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered"
                                        value={editingItem.quantity || 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </>
                        )}

                        {editingType === "machines" && (
                            <>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Reference</span></label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editingItem.ref || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, ref: e.target.value })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Machine Code</span></label>
                                    <select
                                        className="select select-bordered"
                                        value={editingItem.machineAcronym || ""}
                                        onChange={(e) => handleMachineAcronymChange(e.target.value)}>
                                        <option value="">Select machine...</option>
                                        {machineAcronymOptions.map(acronym => (
                                            <option key={acronym} value={acronym}>{acronym}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Machine Type</span></label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editingItem.machineType || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, machineType: e.target.value })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Unit</span></label>
                                    <select
                                        className="select select-bordered"
                                        value={editingItem.unit || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}>
                                        {unitOptions.map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Unit Price</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered"
                                        value={editingItem.unitPrice || 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Quantity</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered"
                                        value={editingItem.quantity || 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </>
                        )}

                        {editingType === "materials" && (
                            <>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Reference (BC)</span></label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editingItem.bc || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, bc: e.target.value })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Designation</span></label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editingItem.designation || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, designation: e.target.value })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Unit</span></label>
                                    <select
                                        className="select select-bordered"
                                        value={editingItem.unit || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}>
                                        {unitOptions.map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Sale Unit Price</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered"
                                        value={editingItem.saleUnit || 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, saleUnit: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Quantity</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered"
                                        value={editingItem.quantity || 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, quantity: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Allocated Qty</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered"
                                        value={editingItem.allocated || 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, allocated: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Stock Qty</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered"
                                        value={editingItem.stockQte || 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, stockQte: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Transferred Qty</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input input-bordered"
                                        value={editingItem.transferedQte || 0}
                                        onChange={(e) => setEditingItem({ ...editingItem, transferedQte: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label"><span className="label-text">Transferred To</span></label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editingItem.transferedTo || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, transferedTo: e.target.value })}
                                    />
                                </div>
                                <div className="form-control col-span-2">
                                    <label className="label"><span className="label-text">Remarks</span></label>
                                    <textarea
                                        className="textarea textarea-bordered"
                                        value={editingItem.remark || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, remark: e.target.value })}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="modal-action">
                        <button
                            className="btn btn-ghost"
                            onClick={handleCloseDialog}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving}>
                            {saving ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    Saving...
                                </>
                            ) : (
                                isNew ? "Create" : "Save"
                            )}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={handleCloseDialog}>close</button>
                </form>
            </dialog>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="card bg-base-100 border-base-300 border shadow-sm flex-1 flex flex-col min-h-0">
                <div className="card-body flex flex-col min-h-0 p-4">
                    <div className="mb-4 flex items-center justify-between flex-shrink-0">
                        <h3 className="card-title text-base-content flex items-center gap-2">
                            <span className="iconify lucide--minus-circle size-5 text-red-600"></span>
                            Deductions
                        </h3>
                        <button onClick={() => handleAdd(activeType)} className="btn btn-primary btn-sm">
                            <span className="iconify lucide--plus size-4"></span>
                            <span>Add {activeType === "labor" ? "Labor" : activeType === "materials" ? "Material" : "Machine"}</span>
                        </button>
                    </div>

                    <div className="flex-shrink-0">
                        {renderSubTabs()}
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader
                                    icon="minus-circle"
                                    subtitle="Loading: Deductions"
                                    description="Preparing deduction data..."
                                    size="md"
                                />
                            </div>
                        ) : getCurrentData.length > 0 ? (
                            // Use ternary for cleaner rendering - only one table rendered at a time
                            activeType === "labor" ? renderLaborTable() :
                            activeType === "materials" ? renderMaterialsTable() :
                            renderMachinesTable()
                        ) : (
                            <div className="py-12 text-center">
                                <span className="iconify lucide--inbox text-base-content/30 mx-auto mb-3 size-12"></span>
                                <p className="text-base-content/70">
                                    No {activeType === "labor" ? "labor" : activeType === "materials" ? "materials" : "machines"} found for this contract
                                </p>
                                <button onClick={() => handleAdd(activeType)} className="btn btn-primary btn-sm mt-4">
                                    <span className="iconify lucide--plus size-4"></span>
                                    <span>Add First {activeType === "labor" ? "Labor" : activeType === "materials" ? "Material" : "Machine"}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {renderEditDialog()}
        </div>
    );
};

export default DeductionsTab;
