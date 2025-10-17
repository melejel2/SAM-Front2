import { useMemo } from 'react';

// Move static column definitions outside hook to prevent recreation
const LABOR_COLUMNS = {
    ref_nb: "REF #",
    type_of_worker: "Type of Worker",
    description_of_activity: "Description of Activity",
    unit: "Unit",
    unit_price: "Unit Price",
    qty: "Quantity",
    amount: "Amount",
};

const MATERIALS_COLUMNS = {
    ref_nb: "REF #",
    item: "Item",
    unit: "Unit",
    unit_price: "Unit Price",
    allocated_qty: "Allocated Quantity",
    transferred_qty: "Transferred Quantity",
    transferred_to: "Transferred to",
    stock_qty: "Stock Quantity",
    remark: "Remarks",
};

const MACHINES_COLUMNS = {
    ref_nb: "REF #",
    machine_code: "Machine Code",
    type_of_machine: "Type of Machine",
    unit: "unit",
    unit_price: "Unit Price",
    qty: "Quantity",
    amount: "Amount",
};

// Move static empty data arrays outside hook
const LABOR_DATA: any[] = [];
const MATERIALS_DATA: any[] = [];
const MACHINES_DATA: any[] = [];

const useDeductionsDatabase = () => {
    // Memoize return values to prevent recreation on every render
    const memoizedData = useMemo(() => ({
        laborColumns: LABOR_COLUMNS,
        materialsColumns: MATERIALS_COLUMNS,
        machinesColumns: MACHINES_COLUMNS,
        laborData: LABOR_DATA,
        materialsData: MATERIALS_DATA,
        machinesData: MACHINES_DATA,
    }), []);

    return memoizedData;
};

export default useDeductionsDatabase;
