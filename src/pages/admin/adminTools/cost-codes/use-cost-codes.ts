import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useCostCodes = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        en: "EN",
        fr: "FR",
        code: "Code",
    };

    const inputFields = [
        {
            name: "en",
            label: "EN",
            type: "text",
            required: true,
        },
        {
            name: "fr",
            label: "FR",
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

    const getCostCodes = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "CodeCostLibrary/GetCodeCostLibrary",
                method: "GET",
                token: token ?? "",
            });
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
        loading,
        getCostCodes,
    };
};

export default useCostCodes;
