import { useEffect } from "react";

import SAMTable from "@/components/Table";
import useTrades from "@/pages/admin/adminTools/trades/use-trades";

import useBudgetBOQsDialog from "../use-budget-boq-dialog";

function BOQStep() {
    const { getTrades, sheets } = useTrades();
    const { columns, tableData } = useBudgetBOQsDialog();

    useEffect(() => {
        getTrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="h-full">
            <SAMTable
                columns={columns}
                tableData={tableData}
                inputFields={[]}
                title={"Budget BOQ"}
                loading={false}
                onSuccess={() => {}}
                hasSheets={true}
                sheets={sheets}
                actions
                deleteAction
            />
        </div>
    );
}

export default BOQStep;
