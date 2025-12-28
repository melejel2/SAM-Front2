import { memo, useCallback, useMemo, useState } from "react";

import { Button, Input, Modal, ModalActions, ModalBody, ModalHeader, Select, SelectOption } from "@/components/daisyui";
import TableComponent from "@/components/Table";
import { UnifiedDeduction } from "@/api/services/deductionsApi";

import useUnifiedDeductions from "./use-unified-deductions";
import useDeductionsManager from "./use-deductions-manager";

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
        refetch,
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

    // Table columns configuration
    // Note: "type" column auto-renders as badge (Labor/Machine/Material)
    const columns = useMemo(() => ({
        type: "Type",
        ref: "REF",
        contractNumber: "Contract",
        projectName: "Project",
        subcontractorName: "Subcontractor",
        subType: "Category",
        description: "Description",
        quantity: "Qty",
        unitPrice: "Unit Price",
        amount: "Amount",
    }), []);

    // Use raw deductions directly - format numbers lazily on render via custom cell renderers
    // This avoids duplicating data with both raw and formatted values
    const tableData = deductions;

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
        async (type: "Select" | "Add" | "Edit" | "Delete" | "Preview" | "Terminate" | "Details" | "Export" | "Generate", data?: any, _extraData?: any) => {
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

    // Master data table columns - defined as static objects outside render
    // Note: Column keys named "type" or "status" auto-render as badges in TableComponent
    const laborColumns = useMemo(() => ({
        laborType: "Worker Type",
        unit: "Unit",
        unitPrice: "Unit Price",
    }), []);

    const machineColumns = useMemo(() => ({
        acronym: "Code",
        machineType: "Machine Type",
        unit: "Unit",
        unitPrice: "Unit Price",
    }), []);

    const materialColumns = useMemo(() => ({
        poRef: "PO Ref",
        item: "Item",
        unit: "Unit",
        unitPrice: "Unit Price",
    }), []);

    // Transform machine data lazily only when needed (rename type -> machineType to avoid badge)
    // Memoize based on the current tab to avoid unnecessary transformations
    const activeMasterData = useMemo(() => {
        if (!isManagerModalOpen) return [];
        if (masterDataTab === "machines") {
            return managerMachinesData.map((item: any) => ({
                ...item,
                machineType: item.type,
            }));
        }
        return [];
    }, [masterDataTab, managerMachinesData, isManagerModalOpen]);

    // Custom header with Master Data button
    const customHeaderContent = (
        <button className="btn btn-ghost btn-sm" onClick={() => setIsManagerModalOpen(true)} title="Master Data">
            <span className="iconify lucide--database size-4" />
            <span className="text-xs">Master Data</span>
        </button>
    );

    return (
        <div className="-mt-6 flex h-full flex-col overflow-hidden">
            <TableComponent
                tableData={tableData}
                columns={columns}
                title="Deduction"
                loading={loading}
                virtualized={true}
                rowHeight={40}
                overscan={5}
                addBtn={true}
                addBtnText="New Deduction"
                editAction={true}
                deleteAction={true}
                dynamicDialog={false}
                openStaticDialog={handleOpenStaticDialog}
                onSuccess={refetch}
                customHeaderContent={customHeaderContent}
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
                                { key: "labor" as const, label: "Labor", count: managerLaborData.length, icon: "lucide--hard-hat" },
                                { key: "machines" as const, label: "Machines", count: managerMachinesData.length, icon: "lucide--cog" },
                                { key: "materials" as const, label: "Materials", count: managerMaterialsData.length, icon: "lucide--package" },
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
                                    <span className={`iconify ${tab.icon} size-4`} />
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
                                <span className="iconify lucide--upload size-4" />
                                Import PO
                            </Button>
                        )}
                        <Button className="btn btn-sm btn-ghost btn-square" onClick={() => setIsManagerModalOpen(false)}>
                            <span className="iconify lucide--x size-5" />
                        </Button>
                    </div>
                </ModalHeader>
                <ModalBody className="p-0 flex-1 min-h-0 overflow-hidden relative">
                    {/* Loading overlay for tab switching */}
                    {(managerLoading || tabSwitching) && (
                        <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <span className="loading loading-spinner loading-lg text-primary" />
                                <span className="text-sm text-base-content/60">
                                    {managerLoading ? "Loading data..." : "Switching..."}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Render ONLY the active tab's table - no hidden tables consuming memory */}
                    <div className={`h-full transition-opacity duration-150 ${tabSwitching ? "opacity-0" : "opacity-100"}`}>
                        {masterDataTab === "labor" ? (
                            <TableComponent
                                tableData={managerLaborData}
                                columns={laborColumns}
                                title="Labor Type"
                                loading={false}
                                onSuccess={() => {}}
                                virtualized={true}
                                rowHeight={40}
                                overscan={5}
                            />
                        ) : masterDataTab === "machines" ? (
                            <TableComponent
                                tableData={activeMasterData}
                                columns={machineColumns}
                                title="Machine"
                                loading={false}
                                onSuccess={() => {}}
                                virtualized={true}
                                rowHeight={40}
                                overscan={5}
                            />
                        ) : (
                            <TableComponent
                                tableData={managerMaterialsData}
                                columns={materialColumns}
                                title="Material"
                                loading={false}
                                onSuccess={() => {}}
                                virtualized={true}
                                rowHeight={40}
                                overscan={5}
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
