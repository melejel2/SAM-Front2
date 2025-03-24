import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useUnits = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        name: "Unit List",
    };

    const inputFields = [
        {
            name: "name",
            label: "Unit List",
            type: "text",
            required: true,
        },
    ];

    const getUnits = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({ endpoint: "Unit/GetUnits", method: "GET", token: token ?? "" });
            setTableData(data);
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
        getUnits,
        loading,
    };
};

export default useUnits;
