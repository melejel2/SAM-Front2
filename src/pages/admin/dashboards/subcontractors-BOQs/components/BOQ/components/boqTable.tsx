import { useEffect } from "react";

import SAMTable from "@/components/Table";
import useTrades from "@/pages/admin/adminTools/trades/use-trades";

import useBOQ from "../use-boq";

const BOQTable = () => {
    const { getTrades, sheets } = useTrades();
    const { columns, tableData } = useBOQ();

    useEffect(() => {
        getTrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="">
            <SAMTable
                columns={columns}
                tableData={tableData}
                title={"Subcontractor BOQ"}
                loading={false}
                onSuccess={() => {}}
                hasSheets={true}
                sheets={sheets}
                rowsPerPage={7}
            />
        </div>
    );
};

export default BOQTable;
