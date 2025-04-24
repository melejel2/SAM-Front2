const useDeductionsDatabase = () => {
    const laborColumns = {
        ref_nb: "REF #",
        type_of_worker: "Type of Worker",
        description_of_activity: "Description of Activity",
        unit: "Unit",
        unit_price: "Unit Price",
        qty: "Quantity",
        amount: "Amount",
    };

    const materialsColumns = {
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

    const machinesColumns = {
        ref_nb: "REF #",
        machine_code: "Machine Code",
        type_of_machine: "Type of Machine",
        unit: "unit",
        unit_price: "Unit Price",
        qty: "Quantity",
        amount: "Amount",
    };

    const laborData: any[] = [];

    const materialsData: any[] = [];

    const machinesData: any[] = [];

    return {
        laborColumns,
        materialsColumns,
        machinesColumns,
        laborData,
        materialsData,
        machinesData,
    };
};

export default useDeductionsDatabase;
