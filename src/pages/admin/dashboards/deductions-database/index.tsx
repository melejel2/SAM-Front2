import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import SAMTable from "@/components/Table";
import { Button, Select, SelectOption } from "@/components/daisyui";

import useDeductionsDatabase from "./use-deductions-database";

const DeductionsDatabase = memo(() => {
    const [activeView, setActiveView] = useState<"Labor" | "Materials" | "Machines">("Labor");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // This will trigger a re-render when navigating between dashboard pages
        // ensuring fresh data is loaded
    }, [location.pathname]);

    const { laborColumns, materialsColumns, machinesColumns, laborData, materialsData, machinesData } =
        useDeductionsDatabase();

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
                    loading={false}
                    addBtn={false}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    );
});

DeductionsDatabase.displayName = 'DeductionsDatabase';

export default DeductionsDatabase;
