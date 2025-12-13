import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SAMTable from "@/components/Table";
import { Button, Modal, ModalActions, ModalBody, ModalHeader, Select, SelectOption } from "@/components/daisyui";

import useDeductionsDatabase from "./use-deductions-database";
import useDeductionsManager from "./use-deductions-manager";

interface TableInputField {
    name: string;
    type: string;
    required: boolean;
    label: string;
    placeholder?: string;
    options?: string[]; // Added options for select type
}

const DeductionsDatabase = memo(() => {
    const [activeView, setActiveView] = useState<"Labor" | "Materials" | "Machines">("Labor");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalView, setModalView] = useState<"Labor" | "Materials" | "Machines">("Labor");

    const navigate = useNavigate();
    const location = useLocation();



    const {
        laborColumns,
        materialsColumns,
        machinesColumns,
        laborData,
        materialsData,
        machinesData,
        loading,
        projects,
        selectedProject,
        setSelectedProject,
        subcontractors,
        selectedSubcontractor,
        setSelectedSubcontractor,
        contracts,
        selectedContract,
        setSelectedContract,
        addLabor: addContractLabor,
        updateLabor: updateContractLabor,
        deleteLabor: deleteContractLabor,
        addMaterial: addContractMaterial,
        updateMaterial: updateContractMaterial,
        deleteMaterial: deleteContractMaterial,
        laborTypeOptions,
        managerLaborTypes,
        fetchDeductionsData,
        addMachine: addContractMachine,
        updateMachine: updateContractMachine,
        deleteMachine: deleteContractMachine,
        machineAcronymOptions,
        managerMachines,
    } = useDeductionsDatabase();

    const contractLaborInputFields: TableInputField[] = [
        { name: "ref", type: "text", required: true, label: "REF #" },
        { name: "laborType", type: "select", required: true, label: "Type of Worker", options: laborTypeOptions },
        { name: "activityDescription", type: "text", required: true, label: "Description of Activity" },
        { name: "unit", type: "text", required: true, label: "Unit" },
        { name: "unitPrice", type: "number", required: true, label: "Unit Price" },
        { name: "quantity", type: "number", required: true, label: "Quantity" },
    ];

    const contractMachineInputFields: TableInputField[] = [
        { name: "ref", type: "text", required: true, label: "REF #" },
        {
            name: "machineAcronym",
            type: "select",
            required: true,
            label: "Machine Code",
            options: machineAcronymOptions,
        },
        { name: "machineType", type: "text", required: true, label: "Type of Machine" },
        { name: "unit", type: "text", required: true, label: "Unit" },
        { name: "unitPrice", type: "number", required: true, label: "Unit Price" },
        { name: "quantity", type: "number", required: true, label: "Quantity" },
    ];

    const {
        managerLoading,
        managerLaborData,
        managerMaterialsData,
        managerMachinesData,
        managerLaborColumns,
        managerMaterialsColumns,
        managerMachinesColumns,
        addLabor,
        saveLabor,
        deleteLabor,
        addMaterial,
        saveMaterial,
        deleteMaterial,
        addMachine,
        saveMachine,
        deleteMachine,
        unitOptions,
        fetchManagerData,
    } = useDeductionsManager(isModalOpen);

    const contractMaterialInputFields = useMemo(() => ([
        { name: "bc", type: "text", required: true, label: "REF #" },
        { name: "designation", type: "text", required: true, label: "Item" },
        { name: "unit", type: "select", required: true, label: "Unit", options: unitOptions },
        { name: "saleUnit", type: "number", required: true, label: "Unit Price" },
        { name: "quantity", type: "number", required: true, label: "Quantity" },
        { name: "allocated", type: "number", required: true, label: "Allocated Quantity" },
        { name: "transferedQte", type: "number", required: false, label: "Transferred Quantity" },
        { name: "transferedTo", type: "text", required: false, label: "Transferred To" },
        { name: "stockQte", type: "number", required: false, label: "Stock Quantity" },
        { name: "remark", type: "text", required: false, label: "Remarks" },
    ]), [unitOptions]);

    const handleSaveContractLabor = async (data: any) => {
        // Find the corresponding labor type object from the manager data
        const selectedLaborType = managerLaborTypes.find((lt) => lt.laborType === data.laborType);

        if (!selectedLaborType && !data.id) {
            console.error("Could not find laborTypeId for the selected labor type.");
            // Here you might want to show an error to the user
            return;
        }
        // Add the laborTypeId to the data payload
        const payload = {
            ...data,
            laborTypeId: selectedLaborType!.id,
        };

        if (payload.id) {
            await updateContractLabor(payload);
        } else {
            await addContractLabor(payload);
        }
    };

    const handleSaveContractMaterial = async (data: any) => {
        const payload = {
            ...data,
            contractDataSetId: Number(selectedContract),
            saleUnit: data.saleUnit !== "" ? Number(data.saleUnit) : null,
            quantity: data.quantity !== "" ? Number(data.quantity) : null,
            allocated: data.allocated !== "" ? Number(data.allocated) : null,
            transferedQte: data.transferedQte !== "" ? Number(data.transferedQte) : null,
            stockQte: data.stockQte !== "" ? Number(data.stockQte) : null,
        };

        if (payload.id) {
            await updateContractMaterial(payload);
        } else {
            await addContractMaterial(payload);
        }
    };

    const handleSaveContractMachine = async (data: any) => {
        // Find the corresponding machine object from the manager data

        const selectedMachine = managerMachines.find((m) => m.acronym === data.machineAcronym);

        if (!selectedMachine) {
            console.error("Could not find machineCodeId for the selected machine acronym.");
            return;
        }

        const payload = {
            ...data,
            machineCodeId: selectedMachine!.id,
            // Auto-populate other fields from the selected machine
            machineType: selectedMachine.type,
            unit: selectedMachine.unit,
            unitPrice: selectedMachine.unitPrice,
        };

        if (payload.id) {
            await updateContractMachine(payload);
        } else {
            await addContractMachine(payload);
        }
    };

    const handleDeleteContractMachine = async (item: { id: number }) => {
        await deleteContractMachine(item.id);
    };

    const handleDeleteContractMaterial = async (item: { id: number }) => {
        await deleteContractMaterial(item.id);
    };

    // Memoize column and data selection to prevent recalculation
    const columns = useMemo(() => {
        switch (activeView) {
            case "Materials":
                return materialsColumns;
            case "Machines":
                return machinesColumns;
            default:
                return laborColumns;
        }
    }, [activeView, materialsColumns, machinesColumns, laborColumns]);

    const tableData = useMemo(() => {
        switch (activeView) {
            case "Materials":
                return materialsData;
            case "Machines":
                return machinesData;
            default:
                return laborData;
        }
    }, [activeView, materialsData, machinesData, laborData]);

    const modalColumns = useMemo(() => {
        switch (modalView) {
            case "Materials":
                return managerMaterialsColumns;
            case "Machines":
                return managerMachinesColumns;
            default:
                return managerLaborColumns;
        }
    }, [modalView, managerLaborColumns, managerMaterialsColumns, managerMachinesColumns]);

    const modalTableData = useMemo(() => {
        switch (modalView) {
            case "Materials":
                return managerMaterialsData;
            case "Machines":
                return managerMachinesData;
            default:
                return managerLaborData;
        }
    }, [modalView, managerLaborData, managerMaterialsData, managerMachinesData]);

    const handleBackToDashboard = useCallback(() => {
        navigate("/dashboard");
    }, [navigate]);

    const handleSetLabor = useCallback(() => setActiveView("Labor"), []);
    const handleSetMaterials = useCallback(() => setActiveView("Materials"), []);
    const handleSetMachines = useCallback(() => setActiveView("Machines"), []);

    const handleSuccess = useCallback(() => {
        if (selectedContract) {
            fetchDeductionsData(Number(selectedContract));
        }
    }, [selectedContract, fetchDeductionsData]);

    const handleSave = async (data: any) => {
        const isUpdate = data.id != null;

        switch (modalView) {
            case "Labor":
                if (isUpdate) {
                    await saveLabor(data);
                } else {
                    await addLabor(data);
                }
                break;
            case "Materials": {
                const materialData = { ...data };
                if (selectedContract) {
                    materialData.contractId = Number(selectedContract);
                }

                // Convert numeric fields to actual numbers
                materialData.unitPrice = materialData.unitPrice !== "" ? Number(materialData.unitPrice) : null;
                materialData.orderdQte = materialData.orderdQte !== "" ? Number(materialData.orderdQte) : null;
                materialData.deliveredQte = materialData.deliveredQte !== "" ? Number(materialData.deliveredQte) : null;

                if (isUpdate) {
                    await saveMaterial(materialData);
                }
                else {
                    await addMaterial(materialData);
                }
                break;
            }
            case "Machines":
                if (isUpdate) {
                    await saveMachine(data);
                }
                else {
                    await addMachine(data);
                }
                break;
        }
    };

    const modalInputFields = useMemo(() => {
        const laborInputFields: TableInputField[] = [
            { name: "laborType", type: "text", placeholder: "e.g., Engineer", required: true, label: "Labor Type" },
            {
                name: "unit",
                type: "select",
                placeholder: "Select Unit",
                required: true,
                label: "Unit",
                options: unitOptions,
            },
            { name: "unitPrice", type: "number", placeholder: "e.g., 500", required: true, label: "Unit Price" },
        ];

        const materialInputFields: TableInputField[] = (() => {
            const materialUnitOptions = unitOptions.filter(option =>
                !["HR", "DAY", "WEEK", "MONTH", "LUMPSUM"].includes(option)
            );
            return [
                { name: "poRef", type: "text", required: true, label: "REF #" },
                { name: "item", type: "text", required: true, label: "Item" },
                { name: "unit", type: "select", required: true, label: "Unit", options: materialUnitOptions },
                { name: "unitPrice", type: "number", required: true, label: "Unit Price" },
                { name: "orderdQte", type: "number", required: true, label: "Ordered Qte" },
                { name: "deliveredQte", type: "number", required: true, label: "Delivered Qte" },
            ];
        })();

        const machineInputFields: TableInputField[] = [
            { name: "acronym", type: "text", required: true, label: "Machine Code" },
            { name: "type", type: "text", required: true, label: "Type of Machine" },
            { name: "unit", type: "select", required: true, label: "Unit", options: unitOptions },
            { name: "unitPrice", type: "number", required: true, label: "Unit Price" },
        ];

        switch (modalView) {
            case "Materials":
                return materialInputFields;
            case "Machines":
                return machineInputFields;
            default:
                return laborInputFields;
        }
    }, [modalView, unitOptions]);

    const tableHeaderContent = (
        <div className="flex flex-1 items-center gap-3">
            {/* Back button on far left */}
            <button
                onClick={handleBackToDashboard}
                className="btn btn-sm border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2 border">
                <span className="iconify lucide--arrow-left size-4"></span>
                <span>Back</span>
            </button>

            {/* Dropdowns CENTERED */}
            <div className="flex flex-1 justify-center gap-2">
                <Select
                    value={selectedProject || ""}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="select select-bordered select-sm max-w-xs">
                    <SelectOption value="">Select Project</SelectOption>
                    {projects.map((project) => (
                        <SelectOption key={project.id} value={project.id}>
                            {project.name}
                        </SelectOption>
                    ))}
                </Select>

                <Select
                    value={selectedSubcontractor || ""}
                    onChange={(e) => setSelectedSubcontractor(e.target.value)}
                    className="select select-bordered select-sm max-w-xs">
                    <SelectOption value="">Select Subcontractor</SelectOption>
                    {subcontractors.map((subcontractor) => (
                        <SelectOption key={subcontractor.id} value={subcontractor.id}>
                            {subcontractor.name}
                        </SelectOption>
                    ))}
                </Select>

                <Select
                    value={selectedContract || ""}
                    onChange={(e) => setSelectedContract(e.target.value)}
                    className="select select-bordered select-sm max-w-xs">
                    <SelectOption value="">Select Contract</SelectOption>
                    {contracts.map((contract) => (
                        <SelectOption key={contract.id} value={contract.id}>
                            {contract.contractNumber}
                        </SelectOption>
                    ))}
                </Select>
            </div>

            {/* Category Selection Cards and Database Button on far right */}
            <div className="flex items-center gap-2">
                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeView === "Labor"
                            ? "btn-primary"
                            : "btn-ghost border-base-300 hover:border-primary/50 border"
                    }`}
                    onClick={handleSetLabor}>
                    <span className="iconify lucide--users size-4" />
                    <span>Labor ({laborData.length})</span>
                </button>

                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeView === "Materials"
                            ? "btn-primary"
                            : "btn-ghost border-base-300 hover:border-primary/50 border"
                    }`}
                    onClick={handleSetMaterials}>
                    <span className="iconify lucide--package size-4" />
                    <span>Materials ({materialsData.length})</span>
                </button>

                <button
                    className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                        activeView === "Machines"
                            ? "btn-primary"
                            : "btn-ghost border-base-300 hover:border-primary/50 border"
                    }`}
                    onClick={handleSetMachines}>
                    <span className="iconify lucide--cog size-4" />
                    <span>Machines ({machinesData.length})</span>
                </button>

                <Button className="btn btn-sm btn-outline" onClick={() => setIsModalOpen(true)}>
                    DataBase
                </Button>
            </div>
        </div>
    );

    return (
        <div className="-mt-6 flex h-full flex-col overflow-hidden">
            {/* Scrollable Content - Full Height */}
            <div className="min-h-0 flex-1">
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={
                        activeView === "Labor"
                            ? contractLaborInputFields
                            : activeView === "Materials"
                              ? contractMaterialInputFields
                              : activeView === "Machines"
                                ? contractMachineInputFields
                                : []
                    }
                    actions={(activeView === "Labor" || activeView === "Materials" || activeView === "Machines") && !!selectedContract}
                    editAction={(activeView === "Labor" || activeView === "Materials" || activeView === "Machines") && !!selectedContract}
                    deleteAction={(activeView === "Labor" || activeView === "Materials" || activeView === "Machines") && !!selectedContract}
                    addBtn={(activeView === "Labor" || activeView === "Materials" || activeView === "Machines") && !!selectedContract}
                    onItemCreate={
                        activeView === "Labor"
                            ? handleSaveContractLabor
                            : activeView === "Materials"
                              ? handleSaveContractMaterial
                              : activeView === "Machines"
                                ? handleSaveContractMachine
                                : undefined
                    }
                    onItemUpdate={
                        activeView === "Labor"
                            ? handleSaveContractLabor
                            : activeView === "Materials"
                              ? handleSaveContractMaterial
                              : activeView === "Machines"
                                ? handleSaveContractMachine
                                : undefined
                    }
                    onItemDelete={
                        activeView === "Labor"
                            ? (item) => deleteContractLabor(item.id)
                            : activeView === "Materials"
                              ? handleDeleteContractMaterial
                              : activeView === "Machines"
                                ? handleDeleteContractMachine
                                : undefined
                    }
                    title={activeView}
                    loading={loading}
                    customHeaderContent={tableHeaderContent}
                    onSuccess={handleSuccess}
                />
            </div>

            <Modal open={isModalOpen} className="w-11/12 max-w-5xl">
                <ModalHeader>Deductions Database</ModalHeader>
                <ModalBody>
                    <div role="tablist" className="tabs tabs-lifted">
                        <button
                            role="tab"
                            className={`tab ${modalView === "Labor" ? "tab-active" : ""}`}
                            onClick={() => setModalView("Labor")}>
                            Labor
                        </button>
                        <button
                            role="tab"
                            className={`tab ${modalView === "Materials" ? "tab-active" : ""}`}
                            onClick={() => setModalView("Materials")}>
                            Materials
                        </button>
                        <button
                            role="tab"
                            className={`tab ${modalView === "Machines" ? "tab-active" : ""}`}
                            onClick={() => setModalView("Machines")}>
                            Machines
                        </button>
                    </div>
                    <div className="mt-4">
                        <SAMTable
                            columns={modalColumns}
                            tableData={modalTableData}
                            inputFields={modalInputFields}
                            actions={true}
                            editAction={true}
                            deleteAction={true}
                            addBtn={true}
                            onItemUpdate={handleSave}
                            createEndPoint={
                                modalView === "Labor"
                                    ? "DeductionsManager/labors"
                                    : modalView === "Materials"
                                      ? "DeductionsManager/poe"
                                      : "DeductionsManager/machines"
                            }
                            editEndPoint={
                                modalView === "Labor"
                                    ? "DeductionsManager/labors"
                                    : modalView === "Materials"
                                      ? "DeductionsManager/poe"
                                      : "DeductionsManager/machines"
                            }
                            deleteEndPoint={
                                modalView === "Labor"
                                    ? "DeductionsManager/labors"
                                    : modalView === "Materials"
                                      ? "DeductionsManager/poe"
                                      : "DeductionsManager/machines"
                            }
                            title={modalView}
                            loading={managerLoading}
                            onSuccess={fetchManagerData}
                            isNested={true}
                        />
                    </div>
                </ModalBody>
                <ModalActions>
                    <Button onClick={() => setIsModalOpen(false)}>Close</Button>
                </ModalActions>
            </Modal>
        </div>
    );
});

DeductionsDatabase.displayName = "DeductionsDatabase";

export default DeductionsDatabase;
