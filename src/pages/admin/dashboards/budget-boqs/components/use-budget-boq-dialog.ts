import { useState } from "react";

const useBudgetBOQsDialog = () => {
    const [selectedTrade, setSelectedTrade] = useState<any>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<any>(null);

    const columns = {
        nb: "N°",
        item: "Item",
        unit: "Unit",
        qty: "Quantity",
        unit_price: "Unit Price",
        total_price: "Total Price",
    };

    const tableData = [
        {
            id: 1,
            nb: 1,
            item: "item 1",
            unit: "unit 1",
            qty: 1,
            unit_price: 2,
            total_price: 2,
        },
        {
            id: 2,
            nb: 2,
            item: "item 2",
            unit: "unit 2",
            qty: 2,
            unit_price: 3,
            total_price: 6,
        },
        {
            id: 3,
            nb: 3,
            item: "item 3",
            unit: "unit 3",
            qty: 4,
            unit_price: 5,
            total_price: 20,
        },
    ];

    return {
        columns,
        tableData,
        selectedTrade,
        selectedBuilding,
        setSelectedTrade,
        setSelectedBuilding,
    };
};

export default useBudgetBOQsDialog;
