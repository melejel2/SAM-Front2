const useIPCResources = () => {
    const laborColumns = {
        nb: "N",
        type_of_worker: "Type of Worker",
        description_of_activity: "Description of Activity",
        unit: "Unit",
        unit_price: "Unit Price",
        qty: "Quantity",
        consumedAmount: "Consumed Amount",
        previous_deductions_percent: "Previous Deductions %",
        actual_deductions_percent: "Actual Deductions %",
        cumulative_deductions_percent: "Cumulative Deductions %",
        deductions_amount: "Deductions Amount",
        preced_amount: "Preced Amount",
        actual_amount: "Actual Amount",
    };

    const materialsColumns = {
        ref_nb: "REF #",
        item: "Item",
        unit: "Unit",
        unit_price: "Unit Price",
        consumedAmount: "Consumed Amount",
        previous_deductions_percent: "Previous Deductions %",
        actual_deductions_percent: "Actual Deductions %",
        cumulative_deductions_percent: "Cumulative Deductions %",
        deductions_amount: "Deductions Amount",
        preced_amount: "Preced Amount",
        actual_amount: "Actual Amount",
        cumul_amount: "Cumul Amount",
        remark: "Remark",
    };

    const machinesColumns = {
        ref_nb: "REF #",
        machine_code: "Machine Code",
        type_of_machine: "Type of Machine",
        unit: "Unit",
        unit_price: "Unit Price",
        qty: "Quantity",
        consumedAmount: "Consumed Amount",
        previous_deductions_percent: "Previous Deductions %",
        actual_deductions_percent: "Actual Deductions %",
        cumulative_deductions_percent: "Cumulative Deductions %",
        deductions_amount: "Deductions Amount",
        preced_amount: "Preced Amount",
        actual_amount: "Actual Amount",
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

export default useIPCResources;
