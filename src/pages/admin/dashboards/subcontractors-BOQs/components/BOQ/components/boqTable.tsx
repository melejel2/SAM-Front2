import { useEffect } from "react";

import SAMTable from "@/components/Table";
import useTrades from "@/pages/admin/adminTools/trades/use-trades";

import useBOQ from "../use-boq";

interface BOQTableProps {
    onBoqItemsChange?: (items: any[]) => void;
}

const BOQTable: React.FC<BOQTableProps> = ({ onBoqItemsChange }) => {
    const { getTrades, sheets } = useTrades();
    const { columns, tableData, calculateTotal, formatCurrency } = useBOQ();

    useEffect(() => {
        getTrades();
    }, [getTrades]);

    // Call the callback when BOQ items change
    useEffect(() => {
        if (onBoqItemsChange) {
            onBoqItemsChange(tableData);
        }
    }, [tableData, onBoqItemsChange]);

    // Add totals row to table data
    const tableDataWithTotal = [
        ...tableData,
        {
            id: 'total',
            order: '',
            nb: '',
            item: '',
            unit: '',
            cost_code: '',
            qty: '',
            unit_price: '',
            total_price: formatCurrency(calculateTotal()),
            isTotal: true
        }
    ];

    return (
        <div className="bg-base-100">
            <SAMTable
                columns={columns}
                tableData={tableDataWithTotal}
                title={"Subcontractor BOQ"}
                loading={false}
                onSuccess={() => {}}
                hasSheets={true}
                sheets={sheets}
                rowsPerPage={10000}
            />
        </div>
    );
};

export default BOQTable;
