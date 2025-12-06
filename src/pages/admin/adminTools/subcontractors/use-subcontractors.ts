import { useState, useCallback } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import { Subcontractor, SubcontractorFormField, SubcontractorTableColumns } from "@/types/subcontractor";

const useSubcontractors = () => {
    const [tableData, setTableData] = useState<Subcontractor[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const token = getToken();

    const columns: SubcontractorTableColumns = {
        name: "Name",
        siegeSocial: "Company Headquarters",
        commerceRegistrar: "Commerce Registrar",
        commerceNumber: "Commerce Number",
        taxNumber: "Tax Number",
        representedBy: "Represented By",
        qualityRepresentive: "Quality Representative",
        subcontractorTel: "Phone",
    };

    const inputFields: SubcontractorFormField[] = [
        {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
        },
        {
            name: "siegeSocial",
            label: "Company Headquarters",
            type: "text",
            required: false,
        },
        {
            name: "commerceRegistrar",
            label: "Commerce Registrar",
            type: "text",
            required: false,
        },
        {
            name: "commerceNumber",
            label: "Commerce Number",
            type: "text",
            required: false,
        },
        {
            name: "taxNumber",
            label: "Tax Number",
            type: "text",
            required: false,
        },
        {
            name: "representedBy",
            label: "Represented By",
            type: "text",
            required: false,
        },
        {
            name: "qualityRepresentive",
            label: "Quality Representative",
            type: "text",
            required: false,
        },
        {
            name: "subcontractorTel",
            label: "Phone",
            type: "text",
            required: false,
        },
    ];

    const getSubcontractors = useCallback(async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "Subcontractors/GetSubcontractors",
                method: "GET",
                token: token ?? "",
            });
            if (data) {
                setTableData(data);
                return data;
            } else {
                setTableData([]);
                return [];
            }
        } catch (error) {
            console.error("useSubcontractors: Error during API request:", error);
            return []; // Return empty array on error
        } finally {
            setLoading(false);
        }
    }, [token]);

    return {
        columns,
        tableData,
        inputFields,
        loading,
        getSubcontractors,
    };
};

export default useSubcontractors; 