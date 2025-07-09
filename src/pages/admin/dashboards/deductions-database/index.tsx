import { useState } from "react";
import { useNavigate } from "react-router-dom";

import SAMTable from "@/components/Table";
import { Button, Select, SelectOption } from "@/components/daisyui";

import useDeductionsDatabase from "./use-deductions-database";

const DeductionsDatabase = () => {
    const [activeView, setActiveView] = useState<"Labor" | "Materials" | "Machines">("Labor");
    const navigate = useNavigate();

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
            {/* Header with Back Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToDashboard}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-center space-x-6">
                    <Button
                        className="disabled:text-base-content disabled:!bg-primary space-x-2"
                        disabled={activeView === "Labor"}
                        onClick={() => setActiveView("Labor")}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 48 48">
                            <g fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M24 6a1 1 0 0 1 1 1v.068c2.798.292 4.933 1.495 6.323 3.026c.956 1.053 1.589 2.308 1.788 3.532l.108.083c1.124.871 1.949 1.927 1.753 3.138c-.189 1.17-1.246 1.882-2.23 2.317a9 9 0 0 1-.76.296q.018.267.018.54a8 8 0 1 1-15.982-.54a9 9 0 0 1-.76-.296c-.984-.435-2.041-1.147-2.23-2.317c-.196-1.211.629-2.267 1.753-3.138l.127-.098a6 6 0 0 1 .096-.474a7.6 7.6 0 0 1 1.411-2.853C17.755 8.576 19.948 7.196 23 7.02V7a1 1 0 0 1 1-1m7.66 10.44a1 1 0 0 0 1.152-.356c.197.275.19.421.186.444c-.013.08-.166.41-1.065.808c-1.049.464-2.627.8-4.437.99a3.5 3.5 0 0 0-6.992 0c-1.81-.19-3.388-.526-4.437-.99c-.899-.398-1.052-.728-1.065-.808c-.004-.023-.011-.168.186-.444a1 1 0 0 0 1.75-.931c-.12-.324-.157-.861.009-1.543a5.6 5.6 0 0 1 1.042-2.091l.011-.014V13.5a1 1 0 1 0 2 0V9.846c.822-.435 1.817-.739 3-.823V11.5a1 1 0 1 0 2 0V9.081c1.17.147 2.168.482 3 .93V13.5a1 1 0 1 0 2 0v-1.881c1.116 1.327 1.352 2.731 1.06 3.541a1 1 0 0 0 .6 1.28m-10.193 4.475a28 28 0 0 1-3.448-.435a6 6 0 0 0 11.962 0c-1.06.208-2.234.352-3.448.435A3.5 3.5 0 0 1 24 22a3.5 3.5 0 0 1-2.533-1.085M25.5 18.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0"
                                    clipRule="evenodd"
                                />
                            </g>
                        </svg>
                        <span>Labor</span>
                    </Button>
                    <Button
                        className="disabled:text-base-content disabled:!bg-primary space-x-2"
                        disabled={activeView === "Materials"}
                        onClick={() => setActiveView("Materials")}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M102.5 70.4c-.8 0-1.7.1-2.5.22c-30.99 5.31-62.08 74.08-72.4 98.98h226.8l11.9-23.9c-12.4-20-35.3-50.36-58.3-49.08c-15.1.8-44 33.98-44 33.98s-35.4-60.51-61.5-60.2m195.1 53.2l-32 64h-79.7l-40.7 95c22 3.3 41.4 14.7 55 31h87.6c4.8-5.8 10.3-10.9 16.4-15.3l28.6-128.7h48.9l16.3-46zM21 187.6v80l13.57 3.5l35.8-83.5zm68.91 0l-37.77 88.1l25.56 6.7l40.6-94.8zm47.99 0L95.28 287l3.7 1c8.42-3.4 17.52-5.6 27.02-6.2l40.3-94.2zm209.3 0l-22.1 99.5c9.6-3.5 20.1-5.5 30.9-5.5c40.3 0 74.6 27.1 85.4 64H491v-80.5l-46.5-15.5l-15.5-62h-34.7zm17.8 14h46l12.5 50h-71l10.8-43.2zm-233 98c-39.32 0-71 31.7-71 71s31.68 71 71 71c39.3 0 71-31.7 71-71s-31.7-71-71-71m224 0c-39.3 0-71 31.7-71 71s31.7 71 71 71s71-31.7 71-71s-31.7-71-71-71m-320.62 32l-12.4 62h23.05c-1.97-7.3-3.03-15.1-3.03-23c0-14 3.25-27.2 9.04-39zm176.62 0c5.7 11.8 9 25 9 39c0 7.9-1.1 15.7-3 23h52c-1.9-7.3-3-15.1-3-23c0-14 3.3-27.2 9-39zm-80 7a32 32 0 0 1 32 32a32 32 0 0 1-32 32a32 32 0 0 1-32-32a32 32 0 0 1 32-32m224 0a32 32 0 0 1 32 32a32 32 0 0 1-32 32a32 32 0 0 1-32-32a32 32 0 0 1 32-32m88.7 25c.2 2.3.3 4.6.3 7c0 10.7-1.9 20.9-5.4 30.5l51.4-20.6v-16.9z"
                            />
                        </svg>
                        <span>Materials</span>
                    </Button>
                    <Button
                        className="disabled:text-base-content disabled:!bg-primary space-x-2"
                        disabled={activeView === "Machines"}
                        onClick={() => setActiveView("Machines")}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M80.08 82.66L60.24 102.5L192.9 242.7v58.6h78v-50.9zm-25.4 40.14v80.3l4.01 2.7c10.56 7 14.74 14.1 15.93 19.8c1.18 5.8-.43 10.8-3.85 14.9c-6.86 8.3-19.91 12.3-32.73-.6l-12.72 12.8c19.18 19.1 46.13 15.1 59.27-.6c6.58-7.9 9.97-18.9 7.65-30.1c-2.05-10-8.72-19.7-19.56-28v-52.2zm258.02 52.5v144h-185c22.6 5.8 40.6 23.5 46.7 46H337c7.5-27.6 32.8-48 62.7-48s55.2 20.4 62.7 48h24.3v-84.6l-60.2-105.4zm36 14h62.1l54.7 92H348.7v-83zm-321.49 130l11.5 46h10.25c6.12-22.5 24.09-40.2 46.74-46zm84.49 16c-26.08 0-47.02 20.9-47.02 47s20.94 47 47.02 47c26.1 0 47-20.9 47-47s-20.9-47-47-47m288 0c-26.1 0-47 20.9-47 47s20.9 47 47 47s47-20.9 47-47s-20.9-47-47-47"
                            />
                        </svg>
                        <span>Machines</span>
                    </Button>
                </div>
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
