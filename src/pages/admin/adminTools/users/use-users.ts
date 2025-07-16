import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import { User, UserFormField, UserTableColumns, UserRole } from "@/types/user";

const useUsers = () => {
    const [tableData, setTableData] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const { getToken } = useAuth();

    const token = getToken();

    const columns: UserTableColumns = {
        firstName: "First Name",
        lastName: "Last Name",
        phone: "Phone",
        email: "Email",
        userName: "Username",
        // password: "Password",
        userRole: "Role",
    };

    const inputFields: UserFormField[] = [
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
                "GeneralManager",
                "RegionalOperationsManager",
                "OperationsManager",
                "ContractsManager",
                "QuantitySurveyor",
                "Accountant",
                "Admin",
            ],
        },
    ];

    const getUsers = async () => {
        setLoading(true);

        try {
            const data = await apiRequest<User[]>({ endpoint: "Users/GetUsers", method: "GET", token: token ?? "" });
            
            // Check if response is an error object
            if (data && typeof data === 'object' && 'isSuccess' in data && !data.isSuccess) {
                console.error("API returned error:", data);
                setTableData([]);
                return;
            }
            
            if (data && Array.isArray(data)) {
                setTableData(data);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setTableData([]);
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
