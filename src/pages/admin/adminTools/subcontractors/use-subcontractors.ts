import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useSubcontractors = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        name: "Name",
        code: "Code",
        contactPerson: "Contact Person",
        email: "Email",
        phone: "Phone",
        address: "Address",
        status: "Status",
    };

    const inputFields = [
        {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
        },
        {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
        },
        {
            name: "contactPerson",
            label: "Contact Person",
            type: "text",
            required: true,
        },
        {
            name: "email",
            label: "Email",
            type: "email",
            required: true,
        },
        {
            name: "phone",
            label: "Phone",
            type: "text",
            required: true,
        },
        {
            name: "address",
            label: "Address",
            type: "text",
            required: true,
        },
        {
            name: "status",
            label: "Status",
            type: "select",
            required: true,
            options: ["Active", "Inactive", "Blacklisted"],
        },
    ];

    const getSubcontractors = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "Subcontractors/GetSubcontractors",
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
        getSubcontractors,
    };
};

export default useSubcontractors; 