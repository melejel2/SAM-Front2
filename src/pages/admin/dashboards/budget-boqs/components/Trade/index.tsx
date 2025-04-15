import { useEffect } from "react";

import SAMTable from "@/components/Table";
import useTrades from "@/pages/admin/adminTools/trades/use-trades";

interface TradeStepProps {
    onSelectTrade?: (trade: any) => void;
}

const TradeStep: React.FC<TradeStepProps> = ({ onSelectTrade }) => {
    const { columns, tableData, getTrades } = useTrades();

    useEffect(() => {
        getTrades();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <SAMTable
                columns={columns}
                tableData={tableData}
                inputFields={[]}
                title={"Trades"}
                loading={false}
                onSuccess={() => {}}
                onRowSelect={onSelectTrade}
            />
        </div>
    );
};

export default TradeStep;
