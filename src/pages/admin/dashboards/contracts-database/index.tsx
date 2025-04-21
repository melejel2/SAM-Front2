import { useState } from "react";

import { MetaData } from "@/components/MetaData";
import { PageTitle } from "@/components/PageTitle";
import SAMTable from "@/components/Table";
import { Button } from "@/components/daisyui";

import useContractsDatabase from "./use-contracts-database";

const ContractsDatabase = () => {
    const [activeView, setActiveView] = useState<"Contract Database" | "VOs Database" | "Terminated Contracts">(
        "Contract Database",
    );

    const { tableData, inputFields, contractsColumns, vosColumns, terminatedColumns } = useContractsDatabase();

    const getColumns = () => {
        switch (activeView) {
            case "VOs Database":
                return vosColumns;
            case "Terminated Contracts":
                return terminatedColumns;
            default:
                return contractsColumns;
        }
    };

    return (
        <div>
            <MetaData title={"Contracts Database"} />
            <PageTitle title={"Contracts Database"} centerItem={"Dashboard"} />
            <div>
                <div className="flex items-center justify-center space-x-6">
                    <Button
                        className="disabled:text-base-content disabled:!bg-primary space-x-2"
                        disabled={activeView === "Contract Database"}
                        onClick={() => setActiveView("Contract Database")}>
                        <span className="iconify lucide--file-spreadsheet size-6"></span>
                        <span>Contract Database</span>
                    </Button>
                    <Button
                        className="disabled:text-base-content disabled:!bg-primary space-x-2"
                        disabled={activeView === "VOs Database"}
                        onClick={() => setActiveView("VOs Database")}>
                        <span className="iconify lucide--file-text size-6"></span>
                        <span>VOS Database</span>
                    </Button>
                    <Button
                        className="disabled:text-base-content disabled:!bg-primary space-x-2"
                        disabled={activeView === "Terminated Contracts"}
                        onClick={() => setActiveView("Terminated Contracts")}>
                        <span className="iconify lucide--file-x size-6"></span>
                        <span>Terminated Contracts</span>
                    </Button>
                </div>

                <SAMTable
                    columns={getColumns()}
                    tableData={tableData}
                    inputFields={inputFields}
                    actions
                    editAction
                    deleteAction
                    title={"Contract"}
                    loading={false}
                    addBtn
                    onSuccess={() => {}}
                />
            </div>
        </div>
    );
};

export default ContractsDatabase;
