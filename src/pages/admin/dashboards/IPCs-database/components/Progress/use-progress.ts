const useIPCProgress = () => {
    const columns = {
        nb: "N",
        item: "Item",
        qty: "Quantity",
        unit_price: "Unit Price",
        total_amount: "Total Amount",
        precedent_quantities: "Precedent Quantities",
        actual_quantities: "Actual Quantities", //
        cumulative_quantities: "Cumulative Quantities", //
        cumulative_percent: "Cumulative %", //
        preced_amount: "Preced Amount",
        actual_amount: "Actual Amount",
        comul_amount: "Comul Amount",
        material_supply_percent: "Material Supply %", //
        deduction_material_supply_percent: "Deduction Material Supply %", //
    };
    const tableData: any[] = [];

    return {
        columns,
        tableData,
    };
};

export default useIPCProgress;
