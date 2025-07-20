import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useUnits = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        name: "Name",
        created: "Created Date",
    };

    const inputFields = [
        {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
        },
    ];

    const getUnits = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "Unit/GetUnits",
                method: "GET",
                token: token ?? "",
            });
            if (data) {
                // Format the created date for each unit
                const formattedData = data.map((unit: any) => ({
                    ...unit,
                    created: unit.created ? (() => {
                        const date = new Date(unit.created);
                        const day = date.getDate().toString().padStart(2, '0');
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const year = date.getFullYear().toString().slice(-2);
                        return `${day}/${month}/${year}`;
                    })() : ''
                }));
                setTableData(formattedData);
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
        getUnits,
    };
};

export default useUnits;
