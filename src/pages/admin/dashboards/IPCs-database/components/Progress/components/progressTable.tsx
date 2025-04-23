import { useEffect } from "react";

import SAMTable from "@/components/Table";
import useTrades from "@/pages/admin/adminTools/trades/use-trades";

import useIPCProgress from "../use-progress";

const IPCProgressTable = () => {
    const { getTrades, sheets } = useTrades();
    const { columns, tableData } = useIPCProgress();

    useEffect(() => {
        getTrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="">
            <SAMTable
                columns={columns}
                tableData={tableData}
                title={"Progress"}
                loading={false}
                onSuccess={() => {}}
                hasSheets={true}
                sheets={sheets}
                rowsPerPage={7}
            />
        </div>
    );
};

export default IPCProgressTable;
