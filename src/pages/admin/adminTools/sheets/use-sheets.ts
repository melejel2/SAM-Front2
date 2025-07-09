import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useSheets = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        name: "Name",
        description: "Description",
    };

    const inputFields = [
        {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
        },
        {
            name: "description",
            label: "Description",
            type: "text",
            required: true,
        },
    ];

    const getSheets = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "Sheets/GetSheets",
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
        getSheets,
    };
};

export default useSheets; 