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
                    created: unit.created ? new Date(unit.created).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    }) : ''
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
