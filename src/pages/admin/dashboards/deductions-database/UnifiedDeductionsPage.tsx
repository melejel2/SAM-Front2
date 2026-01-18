import { memo, useCallback, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import plusIcon from "@iconify/icons-lucide/plus";
import pencilIcon from "@iconify/icons-lucide/pencil";
import trashIcon from "@iconify/icons-lucide/trash-2";
import databaseIcon from "@iconify/icons-lucide/database";
import uploadIcon from "@iconify/icons-lucide/upload";
import xIcon from "@iconify/icons-lucide/x";
import hardHatIcon from "@iconify/icons-lucide/hard-hat";
import cogIcon from "@iconify/icons-lucide/cog";
import packageIcon from "@iconify/icons-lucide/package";

import { Button, Input, Modal, ModalActions, ModalBody, ModalHeader, Select, SelectOption } from "@/components/daisyui";
import { Spreadsheet } from "@/components/Spreadsheet";
import type { SpreadsheetColumn } from "@/components/Spreadsheet";
import { Loader } from "@/components/Loader";
import { UnifiedDeduction } from "@/api/services/deductionsApi";

import useUnifiedDeductions from "./use-unified-deductions";
import useDeductionsManager from "./use-deductions-manager";

// Type for labor data
interface LaborType {
    id: number;
    laborType: string;
    unit: string;
    unitPrice: number;
}

// Type for machine data
interface MachineType {
    id: number;
    acronym: string;
    machineType: string;
    unit: string;
    unitPrice: number;
}

// Type for material data
interface MaterialType {
    id: number;
    poRef: string;
    item: string;
    unit: string;
    unitPrice: number;
}

const UnifiedDeductionsPage = memo(() => {

    const {
        deductions,
        loading,
        filterOptions,
        laborTypeOptions,
        machineAcronymOptions,
        getAutoFillForLabor,
        getAutoFillForMachine,
        getNextRef,
        addDeduction,
        updateDeduction,
        deleteDeduction,
    } = useUnifiedDeductions();

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<UnifiedDeduction | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

    const { managerLoading, managerLaborData, managerMaterialsData, managerMachinesData, importPoeFile } =
        useDeductionsManager(isManagerModalOpen);

    // Form state
    const [formData, setFormData] = useState({
        type: "Labor" as "Labor" | "Machine" | "Material",
        contractDatasetId: null as number | null,
        ref: "",
        subType: "",
        description: "",
        unit: "",
        unitPrice: 0,
        quantity: 0,
        allocated: 0,
        stockQte: 0,
        transferedQte: 0,
        transferedTo: "",
        remark: "",
        laborTypeId: undefined as number | undefined,
        machineCodeId: undefined as number | undefined,
    });

    // Main table columns configuration for Spreadsheet
    const columns = useMemo((): SpreadsheetColumn<UnifiedDeduction>[] => [
        {
            key: "type",
            label: "Type",
            width: 100,
            align: "center",
            sortable: true,
            filterable: true,
            render: (value: string) => (
                <span className={`badge badge-sm ${
                    value === "Labor" ? "badge-info" :
                    value === "Machine" ? "badge-warning" :
                    "badge-success"
                }`}>
                    {value}
                </span>
            ),
        },
        { key: "ref", label: "REF", width: 100, sortable: true, filterable: true },
        { key: "contractNumber", label: "Contract", width: 120, sortable: true, filterable: true },
        { key: "projectName", label: "Project", width: 150, sortable: true, filterable: true },
        { key: "subcontractorName", label: "Subcontractor", width: 150, sortable: true, filterable: true },
        { key: "subType", label: "Category", width: 120, sortable: true, filterable: true },
        { key: "description", label: "Description", width: 200, sortable: true },
        {
            key: "quantity",
            label: "Qty",
            width: 80,
            align: "right",
            sortable: true,
            render: (value: number) => value?.toLocaleString() ?? "-",
        },
        {
            key: "unitPrice",
            label: "Unit Price",
            width: 100,
            align: "right",
            sortable: true,
            render: (value: number) => value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "-",
        },
        {
            key: "amount",
            label: "Amount",
            width: 120,
            align: "right",
            sortable: true,
            render: (value: number) => value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "-",
        },
    ], []);

    // Handlers
    const handleLaborTypeSelect = useCallback(
        (laborType: string) => {
            const autoFill = getAutoFillForLabor(laborType);
            setFormData((prev) => ({
                ...prev,
                subType: laborType,
                unit: autoFill?.unit || prev.unit,
                unitPrice: autoFill?.unitPrice ?? prev.unitPrice,
                laborTypeId: autoFill?.laborTypeId ?? prev.laborTypeId,
            }));
        },
        [getAutoFillForLabor],
    );

    const handleMachineTypeSelect = useCallback(
        (machineAcronym: string) => {
            const autoFill = getAutoFillForMachine(machineAcronym);
            setFormData((prev) => ({
                ...prev,
                subType: machineAcronym,
                description: autoFill?.description || prev.description,
                unit: autoFill?.unit || prev.unit,
                unitPrice: autoFill?.unitPrice ?? prev.unitPrice,
                machineCodeId: autoFill?.machineCodeId ?? prev.machineCodeId,
            }));
        },
        [getAutoFillForMachine],
    );

    const handleContractChange = useCallback(
        async (contractId: number) => {
            setFormData((prev) => ({ ...prev, contractDatasetId: contractId }));
            if (contractId) {
                const nextRef = await getNextRef(contractId, formData.type);
                setFormData((prev) => ({ ...prev, ref: nextRef }));
            }
        },
        [formData.type, getNextRef],
    );

    const handleTypeChange = useCallback(
        async (type: "Labor" | "Machine" | "Material") => {
            setFormData((prev) => ({
                ...prev,
                type,
                subType: "",
                description: "",
                unit: "",
                unitPrice: 0,
                laborTypeId: undefined,
                machineCodeId: undefined,
            }));
            if (formData.contractDatasetId) {
                const nextRef = await getNextRef(formData.contractDatasetId, type);
                setFormData((prev) => ({ ...prev, ref: nextRef }));
            }
        },
        [formData.contractDatasetId, getNextRef],
    );

    const resetForm = useCallback(() => {
        setFormData({
            type: "Labor",
            contractDatasetId: null,
            ref: "",
            subType: "",
            description: "",
            unit: "",
            unitPrice: 0,
            quantity: 0,
            allocated: 0,
            stockQte: 0,
            transferedQte: 0,
            transferedTo: "",
            remark: "",
            laborTypeId: undefined,
            machineCodeId: undefined,
        });
        setShowAdvanced(false);
    }, []);

    const handleOpenStaticDialog = useCallback(
        async (type: "Add" | "Edit" | "Delete", data?: UnifiedDeduction) => {
            if (type === "Add") {
                resetForm();
                setIsAddModalOpen(true);
            } else if (type === "Edit" && data) {
                setSelectedItem(data);
                setFormData({
                    type: data.type,
                    contractDatasetId: data.contractDatasetId,
                    ref: data.ref || "",
                    subType: data.subType || "",
                    description: data.description || "",
                    unit: data.unit || "",
                    unitPrice: data.unitPrice || 0,
                    quantity: data.quantity || 0,
                    allocated: data.allocated || 0,
                    stockQte: data.stockQte || 0,
                    transferedQte: data.transferedQte || 0,
                    transferedTo: data.transferedTo || "",
                    remark: data.remark || "",
                    laborTypeId: data.laborTypeId || undefined,
                    machineCodeId: data.machineCodeId || undefined,
                });
                setShowAdvanced(!!(data.type === "Material" && (data.stockQte || data.transferedQte)));
                setIsEditModalOpen(true);
            } else if (type === "Delete" && data) {
                setSelectedItem(data);
                setIsDeleteModalOpen(true);
            }
        },
        [resetForm],
    );

    const handleSubmitAdd = useCallback(async () => {
        const success = await addDeduction({ ...formData });
        if (success) {
            setIsAddModalOpen(false);
            resetForm();
        }
    }, [formData, addDeduction, resetForm]);

    const handleSubmitEdit = useCallback(async () => {
        if (!selectedItem) return;
        const success = await updateDeduction({ ...selectedItem, ...formData });
        if (success) {
            setIsEditModalOpen(false);
            setSelectedItem(null);
            resetForm();
        }
    }, [selectedItem, formData, updateDeduction, resetForm]);

    const handleConfirmDelete = useCallback(async () => {
        if (!selectedItem) return;
        const success = await deleteDeduction(selectedItem);
        if (success) {
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
        }
    }, [selectedItem, deleteDeduction]);

    // Actions render for main table
    const renderActions = useCallback((row: UnifiedDeduction) => (
        <div className="flex items-center gap-1">
            <button
                className="btn btn-ghost btn-xs text-info"
                onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStaticDialog("Edit", row);
                }}
                title="Edit"
            >
                <Icon icon={pencilIcon} className="w-4 h-4" />
            </button>
            <button
                className="btn btn-ghost btn-xs text-error"
                onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStaticDialog("Delete", row);
                }}
                title="Delete"
            >
                <Icon icon={trashIcon} className="w-4 h-4" />
            </button>
        </div>
    ), [handleOpenStaticDialog]);

    // Toolbar for main spreadsheet
    const toolbar = useMemo(() => (
        <div className="flex items-center gap-2">
            <button
                className="btn btn-ghost btn-sm"
                onClick={() => setIsManagerModalOpen(true)}
                title="Master Data"
            >
                <Icon icon={databaseIcon} className="size-4" />
                <span className="text-xs">Master Data</span>
            </button>
            <button
                className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                onClick={() => handleOpenStaticDialog("Add")}
            >
                <Icon icon={plusIcon} className="size-4" />
                New Deduction
            </button>
        </div>
    ), [handleOpenStaticDialog]);

    // Compact form
    const renderForm = () => (
        <div className="space-y-3">
            {/* Type toggle */}
            <div className="flex gap-1">
                {(["Labor", "Machine", "Material"] as const).map((t) => (
                    <button
                        key={t}
                        type="button"
                        className={`btn btn-xs flex-1 ${formData.type === t ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => handleTypeChange(t)}>
                        {t}
                    </button>
                ))}
            </div>

            <Select
                value={formData.contractDatasetId?.toString() || ""}
                onChange={(e) => handleContractChange(Number(e.target.value))}
                className="select-bordered select-sm w-full">
                <SelectOption value="">Select Contract *</SelectOption>
                {filterOptions.contracts.map((c) => (
                    <SelectOption key={c.id} value={c.id}>
                        {c.contractNumber}
                    </SelectOption>
                ))}
            </Select>

            {formData.type === "Labor" && (
                <Select
                    value={formData.subType}
                    onChange={(e) => handleLaborTypeSelect(e.target.value)}
                    className="select-bordered select-sm w-full">
                    <SelectOption value="">Select Worker Type *</SelectOption>
                    {laborTypeOptions.map((lt) => (
                        <SelectOption key={lt} value={lt}>
                            {lt}
                        </SelectOption>
                    ))}
                </Select>
            )}

            {formData.type === "Machine" && (
                <Select
                    value={formData.subType}
                    onChange={(e) => handleMachineTypeSelect(e.target.value)}
                    className="select-bordered select-sm w-full">
                    <SelectOption value="">Select Machine *</SelectOption>
                    {machineAcronymOptions.map((ma) => (
                        <SelectOption key={ma} value={ma}>
                            {ma}
                        </SelectOption>
                    ))}
                </Select>
            )}

            {formData.type === "Material" && (
                <Input
                    type="text"
                    placeholder="Item description *"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    className="input-bordered input-sm w-full"
                />
            )}

            <div className="grid grid-cols-2 gap-2">
                <Input
                    type="number"
                    placeholder="Quantity *"
                    value={formData.quantity || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, quantity: Number(e.target.value) }))}
                    className="input-bordered input-sm"
                />
                {formData.type === "Material" && (
                    <Input
                        type="number"
                        placeholder="Unit Price"
                        value={formData.unitPrice || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, unitPrice: Number(e.target.value) }))}
                        className="input-bordered input-sm"
                    />
                )}
            </div>

            {formData.type === "Material" && (
                <>
                    <Input
                        type="number"
                        placeholder="Allocated Qty"
                        value={formData.allocated || ""}
                        onChange={(e) => setFormData((p) => ({ ...p, allocated: Number(e.target.value) }))}
                        className="input-bordered input-sm w-full"
                    />
                    <button
                        type="button"
                        className="text-base-content/50 text-xs"
                        onClick={() => setShowAdvanced(!showAdvanced)}>
                        {showAdvanced ? "▼" : "▶"} Advanced
                    </button>
                    {showAdvanced && (
                        <div className="bg-base-200 grid grid-cols-2 gap-2 rounded p-2">
                            <Input
                                type="number"
                                placeholder="Transferred Qty"
                                value={formData.transferedQte || ""}
                                onChange={(e) => setFormData((p) => ({ ...p, transferedQte: Number(e.target.value) }))}
                                className="input-bordered input-xs"
                            />
                            <Input
                                type="text"
                                placeholder="Transferred To"
                                value={formData.transferedTo}
                                onChange={(e) => setFormData((p) => ({ ...p, transferedTo: e.target.value }))}
                                className="input-bordered input-xs"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );

    // Master data tab state
    const [masterDataTab, setMasterDataTab] = useState<"labor" | "machines" | "materials">("labor");
    const [tabSwitching, setTabSwitching] = useState(false);

    // Handle tab change with animation
    const handleTabChange = useCallback((tab: "labor" | "machines" | "materials") => {
        if (tab === masterDataTab) return;
        setTabSwitching(true);
        // Brief delay to show transition
        setTimeout(() => {
            setMasterDataTab(tab);
            setTabSwitching(false);
        }, 150);
    }, [masterDataTab]);

    // Master data table columns - Labor
    const laborColumns = useMemo((): SpreadsheetColumn<LaborType>[] => [
        { key: "laborType", label: "Worker Type", width: 200, sortable: true, filterable: true },
        { key: "unit", label: "Unit", width: 100, align: "center", sortable: true },
        {
            key: "unitPrice",
            label: "Unit Price",
            width: 120,
            align: "right",
            sortable: true,
            render: (value: number) => value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "-",
        },
    ], []);

    // Master data table columns - Machines
    const machineColumns = useMemo((): SpreadsheetColumn<MachineType>[] => [
        { key: "acronym", label: "Code", width: 100, sortable: true, filterable: true },
        { key: "machineType", label: "Machine Type", width: 200, sortable: true, filterable: true },
        { key: "unit", label: "Unit", width: 100, align: "center", sortable: true },
        {
            key: "unitPrice",
            label: "Unit Price",
            width: 120,
            align: "right",
            sortable: true,
            render: (value: number) => value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "-",
        },
    ], []);

    // Master data table columns - Materials
    const materialColumns = useMemo((): SpreadsheetColumn<MaterialType>[] => [
        { key: "poRef", label: "PO Ref", width: 120, sortable: true, filterable: true },
        { key: "item", label: "Item", width: 250, sortable: true, filterable: true },
        { key: "unit", label: "Unit", width: 100, align: "center", sortable: true },
        {
            key: "unitPrice",
            label: "Unit Price",
            width: 120,
            align: "right",
            sortable: true,
            render: (value: number) => value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "-",
        },
    ], []);

    // Transform machine data (rename type -> machineType to display properly)
    const transformedMachinesData = useMemo((): MachineType[] => {
        if (!isManagerModalOpen) return [];
        return managerMachinesData.map((item: any) => ({
            id: item.id,
            acronym: item.acronym,
            machineType: item.type,
            unit: item.unit,
            unitPrice: item.unitPrice,
        }));
    }, [managerMachinesData, isManagerModalOpen]);

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <Spreadsheet<UnifiedDeduction>
                data={deductions}
                columns={columns}
                mode="view"
                loading={loading}
                emptyMessage="No deductions found"
                persistKey="deductions-spreadsheet"
                rowHeight={40}
                actionsRender={renderActions}
                actionsColumnWidth={100}
                onRowDoubleClick={(row) => handleOpenStaticDialog("Edit", row)}
                getRowId={(row) => row.id}
                toolbar={toolbar}
                allowKeyboardNavigation
                allowColumnResize
                allowSorting
                allowFilters
            />

            {/* Add Modal */}
            <Modal open={isAddModalOpen} className="max-w-xs">
                <ModalHeader className="text-sm">Add Deduction</ModalHeader>
                <ModalBody>{renderForm()}</ModalBody>
                <ModalActions>
                    <Button className="btn btn-ghost btn-sm" onClick={() => setIsAddModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="btn btn-primary btn-sm"
                        onClick={handleSubmitAdd}
                        disabled={!formData.contractDatasetId || !formData.quantity}>
                        Add
                    </Button>
                </ModalActions>
            </Modal>

            {/* Edit Modal */}
            <Modal open={isEditModalOpen} className="max-w-xs">
                <ModalHeader className="text-sm">Edit Deduction</ModalHeader>
                <ModalBody>{renderForm()}</ModalBody>
                <ModalActions>
                    <Button className="btn btn-ghost btn-sm" onClick={() => setIsEditModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button className="btn btn-primary btn-sm" onClick={handleSubmitEdit}>
                        Save
                    </Button>
                </ModalActions>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal open={isDeleteModalOpen} className="max-w-xs">
                <ModalHeader className="text-sm">Delete Deduction</ModalHeader>
                <ModalBody>
                    <p className="text-sm">
                        Are you sure you want to delete this {selectedItem?.type.toLowerCase()}?
                    </p>
                    {selectedItem && (
                        <div className="mt-2 p-2 bg-base-200 rounded text-xs">
                            <div><strong>REF:</strong> {selectedItem.ref || "-"}</div>
                            <div><strong>Description:</strong> {selectedItem.description || selectedItem.subType || "-"}</div>
                        </div>
                    )}
                </ModalBody>
                <ModalActions>
                    <Button className="btn btn-ghost btn-sm" onClick={() => setIsDeleteModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button className="btn btn-error btn-sm" onClick={handleConfirmDelete}>
                        Delete
                    </Button>
                </ModalActions>
            </Modal>

            {/* Manager Modal - Full Page */}
            <Modal open={isManagerModalOpen} className="w-[calc(100vw-4rem)] max-w-none h-[calc(100vh-4rem)] flex flex-col">
                <ModalHeader className="flex items-center justify-between flex-shrink-0 py-3 border-b border-base-300">
                    <div className="flex items-center gap-6">
                        <span className="font-semibold text-lg">Master Data</span>
                        {/* Tabs with better styling */}
                        <div className="flex gap-1 bg-base-200 p-1 rounded-lg">
                            {[
                                { key: "labor" as const, label: "Labor", count: managerLaborData.length, icon: hardHatIcon },
                                { key: "machines" as const, label: "Machines", count: managerMachinesData.length, icon: cogIcon },
                                { key: "materials" as const, label: "Materials", count: managerMaterialsData.length, icon: packageIcon },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                        masterDataTab === tab.key
                                            ? "bg-base-100 text-primary shadow-sm"
                                            : "text-base-content/60 hover:text-base-content hover:bg-base-100/50"
                                    }`}
                                    onClick={() => handleTabChange(tab.key)}
                                    disabled={tabSwitching}>
                                    <Icon icon={tab.icon} className="size-4" />
                                    <span>{tab.label}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                        masterDataTab === tab.key ? "bg-primary/10 text-primary" : "bg-base-300 text-base-content/50"
                                    }`}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {masterDataTab === "materials" && !tabSwitching && (
                            <Button className="btn btn-sm btn-outline btn-primary" onClick={() => importPoeFile?.()}>
                                <Icon icon={uploadIcon} className="size-4" />
                                Import PO
                            </Button>
                        )}
                        <Button className="btn btn-sm btn-ghost btn-square" onClick={() => setIsManagerModalOpen(false)}>
                            <Icon icon={xIcon} className="size-5" />
                        </Button>
                    </div>
                </ModalHeader>
                <ModalBody className="p-0 flex-1 min-h-0 overflow-hidden relative">
                    {/* Loading overlay for tab switching */}
                    {(managerLoading || tabSwitching) && (
                        <Loader
                            overlay
                            icon="minus-circle"
                            subtitle={managerLoading ? "Loading: Deductions" : "Switching Tab"}
                            description={managerLoading ? "Preparing deduction data..." : "Please wait..."}
                        />
                    )}

                    {/* Render ONLY the active tab's table - no hidden tables consuming memory */}
                    <div className={`h-full transition-opacity duration-150 ${tabSwitching ? "opacity-0" : "opacity-100"}`}>
                        {masterDataTab === "labor" ? (
                            <Spreadsheet<LaborType>
                                data={managerLaborData}
                                columns={laborColumns}
                                mode="view"
                                loading={false}
                                emptyMessage="No labor types found"
                                persistKey="deductions-labor-spreadsheet"
                                rowHeight={40}
                                getRowId={(row) => row.id}
                                allowKeyboardNavigation
                                allowColumnResize
                                allowSorting
                                allowFilters
                            />
                        ) : masterDataTab === "machines" ? (
                            <Spreadsheet<MachineType>
                                data={transformedMachinesData}
                                columns={machineColumns}
                                mode="view"
                                loading={false}
                                emptyMessage="No machines found"
                                persistKey="deductions-machines-spreadsheet"
                                rowHeight={40}
                                getRowId={(row) => row.id}
                                allowKeyboardNavigation
                                allowColumnResize
                                allowSorting
                                allowFilters
                            />
                        ) : (
                            <Spreadsheet<MaterialType>
                                data={managerMaterialsData}
                                columns={materialColumns}
                                mode="view"
                                loading={false}
                                emptyMessage="No materials found"
                                persistKey="deductions-materials-spreadsheet"
                                rowHeight={40}
                                getRowId={(row) => row.id}
                                allowKeyboardNavigation
                                allowColumnResize
                                allowSorting
                                allowFilters
                            />
                        )}
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
});

UnifiedDeductionsPage.displayName = "UnifiedDeductionsPage";

export default UnifiedDeductionsPage;
