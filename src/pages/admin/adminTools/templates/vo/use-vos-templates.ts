import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useVOsTemplates = () => {
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
            type: "select",
            required: true,
            options: ["Addition", "Deduction"],
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

    const getVOTemplates = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({ 
                endpoint: "Templates/GetVOContracts", 
                method: "GET", 
                token: token ?? "" 
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
        getVOTemplates,
    };
};

export default useVOsTemplates;
