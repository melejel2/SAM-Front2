import { useState, useCallback } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

export type UserRole =
    | "GeneralManager"
    | "RegionalOperationsManager"
    | "OperationsManager"
    | "ContractsManager"
    | "QuantitySurveyor"
    | "Accountant"
    | "Admin";

export interface User {
    id: number;
    userName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    userRole: UserRole;
    password?: string;
    [key: string]: unknown; // Index signature for API compatibility
}

export const USER_ROLES: UserRole[] = [
    "GeneralManager",
    "RegionalOperationsManager",
    "OperationsManager",
    "ContractsManager",
    "QuantitySurveyor",
    "Accountant",
    "Admin",
];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
    GeneralManager: "General Manager",
    RegionalOperationsManager: "Regional Operations Manager",
    OperationsManager: "Operations Manager",
    ContractsManager: "Contracts Manager",
    QuantitySurveyor: "Quantity Surveyor",
    Accountant: "Accountant",
    Admin: "Admin",
};

const useUsers = () => {
    const [tableData, setTableData] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const { getToken } = useAuth();
    const { toaster } = useToast();

    const getUsers = useCallback(async () => {
        setLoading(true);
        const token = getToken();

        try {
            const data = await apiRequest<User[]>({
                endpoint: "Users/GetUsers",
                method: "GET",
                token: token ?? "",
            });

            // Check if response is an error object
            if (data && typeof data === "object" && "isSuccess" in data && !data.isSuccess) {
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
            toaster.error("Failed to load users");
            setTableData([]);
        } finally {
            setLoading(false);
        }
    }, [getToken, toaster]);

    const createUser = useCallback(
        async (user: Omit<User, "id">) => {
            setSaving(true);
            const token = getToken();

            try {
                const response = await apiRequest({
                    endpoint: "Users/AddUser",
                    method: "POST",
                    token: token ?? "",
                    body: user,
                });

                if (response) {
                    toaster.success("User created successfully");
                    await getUsers();
                    return { success: true };
                }
                return { success: false };
            } catch (error) {
                console.error("Error creating user:", error);
                toaster.error("Failed to create user");
                return { success: false };
            } finally {
                setSaving(false);
            }
        },
        [getToken, toaster, getUsers]
    );

    const updateUser = useCallback(
        async (user: User) => {
            setSaving(true);
            const token = getToken();

            try {
                const response = await apiRequest({
                    endpoint: "Users/UpdateUser",
                    method: "PUT",
                    token: token ?? "",
                    body: user,
                });

                if (response) {
                    toaster.success("User updated successfully");
                    await getUsers();
                    return { success: true };
                }
                return { success: false };
            } catch (error) {
                console.error("Error updating user:", error);
                toaster.error("Failed to update user");
                return { success: false };
            } finally {
                setSaving(false);
            }
        },
        [getToken, toaster, getUsers]
    );

    const deleteUser = useCallback(
        async (id: number) => {
            setSaving(true);
            const token = getToken();

            try {
                const response = await apiRequest({
                    endpoint: `Users/DeleteUser?id=${id}`,
                    method: "DELETE",
                    token: token ?? "",
                });

                if (response) {
                    toaster.success("User deleted successfully");
                    await getUsers();
                    return { success: true };
                }
                return { success: false };
            } catch (error) {
                console.error("Error deleting user:", error);
                toaster.error("Failed to delete user");
                return { success: false };
            } finally {
                setSaving(false);
            }
        },
        [getToken, toaster, getUsers]
    );

    return {
        tableData,
        loading,
        saving,
        getUsers,
        createUser,
        updateUser,
        deleteUser,
    };
};

export default useUsers;
