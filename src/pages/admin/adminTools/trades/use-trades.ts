import { useEffect, useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

import useCostCodes from "../cost-codes/use-cost-codes";

const useTrades = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        name: "EN",
        nameFr: "FR",
        costCode: "Code",
    };

    const inputFields = [
        {
            name: "name",
            label: "EN",
            type: "text",
            required: true,
        },
        {
            name: "nameFr",
            label: "FR",
            type: "text",
            required: true,
        },
        {
            name: "costCode",
            label: "Code",
            type: "select",
            options: [],
            required: true,
        },
    ];

    const getTrades = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({ endpoint: "Sheets/GetSheets", method: "GET", token: token ?? "" });
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
        getTrades,
        loading,
    };
};

export default useTrades;
