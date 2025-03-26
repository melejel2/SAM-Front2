import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useCurrencies = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        currencies: "Currency Code",
        name: "Currency Full Name",
        conversionRate: "USD Equivalency",
    };

    const inputFields = [
        {
            name: "currencies",
            label: "Currency Code",
            type: "text",
            required: true,
        },
        {
            name: "name",
            label: "Currency Full Name",
            type: "text",
            required: true,
        },
        {
            name: "conversionRate",
            label: "USD Equivalency",
            type: "number",
            required: true,
        },
    ];

    const getCurrencies = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({ endpoint: "Currencie/GetCurrencies", method: "GET", token: token ?? "" });
            if (data.success) {
                setTableData(data);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return {
        columns,
        tableData,
        inputFields,
        getCurrencies,
        loading,
    };
};

export default useCurrencies;
