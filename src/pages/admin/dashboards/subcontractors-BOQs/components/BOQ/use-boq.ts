import { formatCurrency } from "@/utils/formatters";

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
    
    // Sample BOQ data
    const tableData: any[] = [
        {
            id: 1,
            order: "1",
            nb: "A.1.1",
            item: "Excavation for foundations",
            unit: "m³",
            cost_code: "EXC001",
            qty: "150.00",
            unit_price: "25.50",
            total_price: "3,825.00"
        },
        {
            id: 2,
            order: "2", 
            nb: "A.1.2",
            item: "Concrete for foundations",
            unit: "m³",
            cost_code: "CON001",
            qty: "75.00",
            unit_price: "120.00",
            total_price: "9,000.00"
        },
        {
            id: 3,
            order: "3",
            nb: "A.2.1",
            item: "Steel reinforcement",
            unit: "kg",
            cost_code: "STL001",
            qty: "2,500.00",
            unit_price: "1.85",
            total_price: "4,625.00"
        },
        {
            id: 4,
            order: "4",
            nb: "A.2.2",
            item: "Formwork for columns",
            unit: "m²",
            cost_code: "FRM001",
            qty: "85.00",
            unit_price: "35.00",
            total_price: "2,975.00"
        }
    ];

    // Calculate total
    const calculateTotal = () => {
        return tableData.reduce((sum, item) => {
            const price = parseFloat(item.total_price.replace(/,/g, ''));
            return sum + (isNaN(price) ? 0 : price);
        }, 0);
    };

    return {
        columns,
        tableData,
        calculateTotal,
        formatCurrency,
    };
};

export default useBOQ;
