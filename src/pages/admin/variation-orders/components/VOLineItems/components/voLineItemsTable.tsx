import { useEffect } from "react";

import SAMTable from "@/components/Table";
import useTrades from "@/pages/admin/adminTools/trades/use-trades";
import useVOLineItems from "../use-vo-line-items";

interface VOLineItemsTableProps {
    onVoItemsChange?: (items: any[]) => void;
    buildingId?: number;
    voLevel?: number;
    readonly?: boolean;
}

const VOLineItemsTable: React.FC<VOLineItemsTableProps> = ({ 
    onVoItemsChange, 
    buildingId, 
    voLevel = 1,
    readonly = false 
}) => {
    const { getTrades, sheets } = useTrades();
    const { 
        columns, 
        tableData, 
        calculateTotal, 
        formatCurrency,
        loadVoItems,
        loading
    } = useVOLineItems({ buildingId, voLevel });

    useEffect(() => {
        getTrades();
    }, [getTrades]);

    useEffect(() => {
        if (buildingId) {
            loadVoItems();
        }
    }, [buildingId, voLevel, loadVoItems]);

    // Call the callback when VO items change
    useEffect(() => {
        if (onVoItemsChange) {
            onVoItemsChange(tableData);
        }
    }, [tableData, onVoItemsChange]);

    // Add totals row to table data
    const tableDataWithTotal = [
        ...tableData,
        {
            id: 'total',
            order: '',
            no: '',
            key: '',
            unite: '',
            costCode: '',
            qte: '',
            pu: '',
            pt: formatCurrency(calculateTotal()),
            remark: '',
            isTotal: true,
            level: voLevel
        }
    ];

    return (
        <div className="bg-base-100">
            <SAMTable
                columns={columns}
                tableData={tableDataWithTotal}
                title={`VO Line Items (Level ${voLevel})`}
                loading={loading}
                onSuccess={() => {}}
                hasSheets={true}
                sheets={sheets}
                rowsPerPage={15}
            />
        </div>
    );
};

export default VOLineItemsTable;