import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import SAMTable from "@/components/Table";
import { Button, Select, SelectOption } from "@/components/daisyui";

import useDeductionsDatabase from "./use-deductions-database";

const DeductionsDatabase = () => {
    const [activeView, setActiveView] = useState<"Labor" | "Materials" | "Machines">("Labor");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // This will trigger a re-render when navigating between dashboard pages
        // ensuring fresh data is loaded
    }, [location.pathname]);

    const { laborColumns, materialsColumns, machinesColumns, laborData, materialsData, machinesData } =
        useDeductionsDatabase();

    const getColumns = () => {
        switch (activeView) {
            case "Materials":
                return materialsColumns;
            case "Machines":
                return machinesColumns;
            default:
                return laborColumns;
        }
    };

    const getTableData = () => {
        switch (activeView) {
            case "Materials":
                return materialsData;
            case "Machines":
                return machinesData;
            default:
                return laborData;
        }
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div>
            {/* Header with Back Button and Category Cards */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToDashboard}
                        className="btn btn-sm btn-back bg-base-100 border border-base-300 hover:bg-base-200 flex items-center gap-2"
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
                        onClick={() => setActiveView("Labor")}
                    >
                        <span className="iconify lucide--users size-4" />
                        <span>Labor</span>
                    </button>
                    
                    <button
                        className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                            activeView === "Materials" 
                                ? "btn-primary" 
                                : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                        onClick={() => setActiveView("Materials")}
                    >
                        <span className="iconify lucide--package size-4" />
                        <span>Materials</span>
                    </button>
                    
                    <button
                        className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                            activeView === "Machines" 
                                ? "btn-primary" 
                                : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                        onClick={() => setActiveView("Machines")}
                    >
                        <span className="iconify lucide--cog size-4" />
                        <span>Machines</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="mt-4">
                    <SAMTable
                        columns={getColumns()}
                        tableData={getTableData()}
                        inputFields={[]}
                        actions={false}
                        editAction={false}
                        deleteAction={false}
                        title={activeView}
                        loading={false}
                        addBtn={false}
                        onSuccess={() => {}}
                    />
                </div>
            </div>
        </div>
    );
};

export default DeductionsDatabase;
