import { useState } from "react";

import SAMTable from "@/components/Table";
import { Button } from "@/components/daisyui";

import useIPCResources from "./use-resources";

const IPCResourcesStep = () => {
    const [activeView, setActiveView] = useState<"Labor" | "Materials" | "Machines">("Labor");

    const { laborColumns, materialsColumns, machinesColumns, laborData, materialsData, machinesData } =
        useIPCResources();

    const getColumns = () => {
        switch (activeView) {
            case "Materials":
                return laborColumns;
            case "Machines":
                return materialsColumns;
            default:
                return machinesColumns;
        }
    };

    const getTableData = () => {
        switch (activeView) {
            case "Materials":
                return laborData;
            case "Machines":
                return materialsData;
            default:
                return machinesData;
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between">
                <Button type="button" size="sm" color="primary">
                    <span className="iconify lucide--import size-4" />
                    <span>Import</span>
                </Button>
                <div className="flex items-center justify-center space-x-6 pt-4">
                    <Button
                        size="sm"
                        className="disabled:text-base-content disabled:!bg-primary space-x-2"
                        disabled={activeView === "Labor"}
                        onClick={() => setActiveView("Labor")}>
                        <span className="iconify lucide--file-spreadsheet size-6"></span>
                        <span>Labor</span>
                    </Button>
                    <Button
                        size="sm"
                        className="disabled:text-base-content disabled:!bg-primary space-x-2"
                        disabled={activeView === "Materials"}
                        onClick={() => setActiveView("Materials")}>
                        <span className="iconify lucide--file-text size-6"></span>
                        <span>Materials</span>
                    </Button>
                    <Button
                        size="sm"
                        className="disabled:text-base-content disabled:!bg-primary space-x-2"
                        disabled={activeView === "Machines"}
                        onClick={() => setActiveView("Machines")}>
                        <span className="iconify lucide--file-x size-6"></span>
                        <span>Machines</span>
                    </Button>
                </div>
            </div>

            <SAMTable
                columns={getColumns()}
                tableData={getTableData()}
                title={"Contract"}
                loading={false}
                onSuccess={() => {}}
            />
        </div>
    );
};

export default IPCResourcesStep;
