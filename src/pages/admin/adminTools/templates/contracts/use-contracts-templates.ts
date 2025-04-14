import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useContractsTemplates = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [tableData, setTableData] = useState<any[]>([]);

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        code: "Code",
        templateName: "Template Name",
        type: "Type",
        contractType: "Contract Type",
        language: "Language",
    };

    const inputFields = [
        {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
        },
        {
            name: "templateName",
            label: "Template Name",
            type: "text",
            required: true,
        },
        {
            name: "type",
            label: "Type",
            type: "text",
            required: true,
        },
        {
            name: "contractType",
            label: "Contract Type",
            type: "text",
            required: true,
        },
        {
            name: "language",
            label: "Language",
            type: "select",
            required: true,
            options: ["EN", "FR"],
        },
        {
            name: "file",
            label: "Upload File",
            type: "file",
            required: true,
        },
    ];

    const getContractTemplates = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({ endpoint: "Templates/GetContracts", method: "GET", token: token ?? "" });
            if (data) {
                setTableData(data);
                console.log(data);
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
        getContractTemplates,
    };
};

export default useContractsTemplates;
