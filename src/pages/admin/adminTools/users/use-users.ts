import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useUsers = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    const token = getToken();

    const columns = {
        firstName: "First Name",
        lastName: "Last Name",
        phone: "Phone",
        email: "Email",
        userName: "Username",
        // password: "Password",
        userRole: "Role",
    };

    const inputFields = [
        {
            name: "firstName",
            label: "First Name",
            type: "text",
            required: true,
        },
        {
            name: "lastName",
            label: "Last Name",
            type: "text",
            required: true,
        },
        {
            name: "phone",
            label: "Phone",
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
            name: "userName",
            label: "Username",
            type: "text",
            required: true,
        },
        {
            name: "password",
            label: "Password",
            type: "password",
            required: true,
        },

        {
            name: "userRole",
            label: "Role",
            type: "select",
            required: true,
            options: [
                "RegionalOperationsManager",
                "GeneralManager",
                "OperationsManager",
                "ContractsManager",
                "Accountant",
                "Admin",
            ],
        },
    ];

    const getUsers = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({ endpoint: "Users/GetUsers", method: "GET", token: token ?? "" });
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
        getUsers,
        loading,
    };
};

export default useUsers;
