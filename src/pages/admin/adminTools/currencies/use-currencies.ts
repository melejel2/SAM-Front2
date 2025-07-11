import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useCurrencies = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        name: "Name",
        symbol: "Symbol",
        code: "Code",
    };

    const inputFields = [
        {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
        },
        {
            name: "symbol",
            label: "Symbol",
            type: "text",
            required: true,
        },
        {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
        },
    ];

    const getCurrencies = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "Currencie/GetCurrencies",
                method: "GET",
                token: token ?? "",
            });
            if (data) {
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
        loading,
        getCurrencies,
    };
};

export default useCurrencies;
