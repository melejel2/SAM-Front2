import { useEffect, useMemo } from "react";

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

    // Memoize total calculation to prevent recalculation on every render
    const total = useMemo(() => calculateTotal(), [calculateTotal]);

    // Memoize the totals row to prevent recreation on every render
    const totalsRow = useMemo(() => ({
        id: 'total',
        order: '',
        no: '',
        key: '',
        unite: '',
        costCode: '',
        qte: '',
        pu: '',
        pt: formatCurrency(total),
        remark: '',
        isTotal: true,
        level: voLevel
    }), [formatCurrency, total, voLevel]);

    // Memoize table data with total row
    const tableDataWithTotal = useMemo(() =>
        [...tableData, totalsRow],
        [tableData, totalsRow]
    );

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
                // Enable virtualization for better memory performance with large datasets
                virtualized={true}
                rowHeight={40}
                overscan={5}
            />
        </div>
    );
};

export default VOLineItemsTable;