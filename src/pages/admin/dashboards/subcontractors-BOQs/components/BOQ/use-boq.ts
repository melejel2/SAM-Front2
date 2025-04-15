const useBOQ = () => {
    const columns = {
        order: "Order",
        nb: "N°",
        item: "Item",
        unit: "Unit",
        cost_code: "Cost Code",
        qty: "Quantity",
        unit_price: "Unit Price",
        total_price: "Total Price",
    };
    const tableData: any[] = [];

    return {
        columns,
        tableData,
    };
};

export default useBOQ;
