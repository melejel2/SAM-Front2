import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import SAMTable from "@/components/Table";
import { Button, Select, SelectOption, Modal, ModalHeader, ModalBody, ModalActions } from "@/components/daisyui";

import useDeductionsDatabase from "./use-deductions-database";
import useDeductionsManager from "./use-deductions-manager";

const DeductionsDatabase = memo(() => {
    const [activeView, setActiveView] = useState<"Labor" | "Materials" | "Machines">("Labor");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalView, setModalView] = useState<"Labor" | "Materials" | "Machines">("Labor");

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // This will trigger a re-render when navigating between dashboard pages
        // ensuring fresh data is loaded
    }, [location.pathname]);

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
    } = useDeductionsDatabase();

    const {
        managerLoading,
        managerLaborData,
        managerMaterialsData,
        managerMachinesData,
        managerLaborColumns,
        managerMaterialsColumns,
        managerMachinesColumns,
    } = useDeductionsManager(isModalOpen);

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
        navigate('/dashboard');
    }, [navigate]);

    const handleSetLabor = useCallback(() => setActiveView("Labor"), []);
    const handleSetMaterials = useCallback(() => setActiveView("Materials"), []);
    const handleSetMachines = useCallback(() => setActiveView("Machines"), []);

    const handleSuccess = useCallback(() => {
        // Empty success handler
    }, []);

    return (
        <div style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Fixed Header Section */}
            <div style={{ flexShrink: 0 }} className="pb-3">
                {/* Header with Back Button and Category Cards */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToDashboard}
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            <span className="iconify lucide--arrow-left size-4"></span>
                            <span>Back</span>
                        </button>

                        <Select
                            value={selectedProject || ''}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="select select-bordered select-sm w-full max-w-xs"
                        >
                            <SelectOption value="">Select Project</SelectOption>
                            {projects.map((project) => (
                                <SelectOption key={project.id} value={project.id}>
                                    {project.name}
                                </SelectOption>
                            ))}
                        </Select>

                        <Select
                            value={selectedSubcontractor || ''}
                            onChange={(e) => setSelectedSubcontractor(e.target.value)}
                            className="select select-bordered select-sm w-full max-w-xs"
                        >
                            <SelectOption value="">Select Subcontractor</SelectOption>
                            {subcontractors.map((subcontractor) => (
                                <SelectOption key={subcontractor.id} value={subcontractor.id}>
                                    {subcontractor.name}
                                </SelectOption>
                            ))}
                        </Select>

                        <Select
                            value={selectedContract || ''}
                            onChange={(e) => setSelectedContract(e.target.value)}
                            className="select select-bordered select-sm w-full max-w-xs"
                        >
                            <SelectOption value="">Select Contract</SelectOption>
                            {contracts.map((contract) => (
                                <SelectOption key={contract.id} value={contract.id}>
                                    {contract.contractNumber}
                                </SelectOption>
                            ))}
                        </Select>
                        <Button
                            className="btn btn-sm btn-outline"
                            onClick={() => setIsModalOpen(true)}
                        >
                            DataBase
                        </Button>
                    </div>

                    {/* Category Selection Cards */}
                    <div className="flex items-center gap-2">
                        <button
                            className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                                activeView === "Labor"
                                    ? "btn-primary"
                                    : "btn-ghost border border-base-300 hover:border-primary/50"
                            }`}
                            onClick={handleSetLabor}
                        >
                            <span className="iconify lucide--users size-4" />
                            <span>Labor ({laborData.length})</span>
                        </button>

                        <button
                            className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                                activeView === "Materials"
                                    ? "btn-primary"
                                    : "btn-ghost border border-base-300 hover:border-primary/50"
                            }`}
                            onClick={handleSetMaterials}
                        >
                            <span className="iconify lucide--package size-4" />
                            <span>Materials ({materialsData.length})</span>
                        </button>

                        <button
                            className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                                activeView === "Machines"
                                    ? "btn-primary"
                                    : "btn-ghost border border-base-300 hover:border-primary/50"
                            }`}
                            onClick={handleSetMachines}
                        >
                            <span className="iconify lucide--cog size-4" />
                            <span>Machines ({machinesData.length})</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <SAMTable
                    columns={columns}
                    tableData={tableData}
                    inputFields={[]}
                    actions={false}
                    editAction={false}
                    deleteAction={false}
                    title={activeView}
                    loading={loading} // Pass the loading state here
                    addBtn={false}
                    onSuccess={handleSuccess}
                />
            </div>

            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} className="w-11/12 max-w-5xl">
                <ModalHeader>Deductions Database</ModalHeader>
                <ModalBody>
                    <div role="tablist" className="tabs tabs-lifted">
                        <button
                            role="tab"
                            className={`tab ${modalView === 'Labor' ? 'tab-active' : ''}`}
                            onClick={() => setModalView('Labor')}
                        >
                            Labor
                        </button>
                        <button
                            role="tab"
                            className={`tab ${modalView === 'Materials' ? 'tab-active' : ''}`}
                            onClick={() => setModalView('Materials')}
                        >
                            Materials
                        </button>
                        <button
                            role="tab"
                            className={`tab ${modalView === 'Machines' ? 'tab-active' : ''}`}
                            onClick={() => setModalView('Machines')}
                        >
                            Machines
                        </button>
                    </div>
                    <div className="mt-4">
                        <SAMTable
                            columns={modalColumns}
                            tableData={modalTableData}
                            inputFields={[]}
                            actions={false}
                            editAction={false}
                            deleteAction={false}
                            title={modalView}
                            loading={managerLoading}
                            addBtn={false}
                            onSuccess={handleSuccess}
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

DeductionsDatabase.displayName = 'DeductionsDatabase';

export default DeductionsDatabase;
