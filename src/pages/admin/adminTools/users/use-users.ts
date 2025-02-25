import { useState } from "react";

const useUsers = () => {
    const [hasActions, _] = useState<boolean>(true);

    const columns = {
        first_name: "First Name",
        last_name: "Last Name",
        telephone: "Telephone",
        email: "Email",
        username: "Username",
        password: "Password",
        role: "Role",
    };
    const tableData = [
        {
            id: "1",
            first_name: "First Name 1",
            last_name: "Last Name 1",
            telephone: "Telephone 1",
            email: "Email 1",
            username: "Username 1",
            password: "Password 1",
            role: "Role 1",
        },
        {
            id: "2",
            first_name: "First Name 2",
            last_name: "Last Name 2",
            telephone: "Telephone 2",
            email: "Email 2",
            username: "Username 2",
            password: "Password 2",
            role: "Role 2",
        },
        {
            id: "3",
            first_name: "First Name 3",
            last_name: "Last Name 3",
            telephone: "Telephone 3",
            email: "Email 3",
            username: "Username 3",
            password: "Password 3",
            role: "Role 3",
        },
    ];

    const inputFields = [
        {
            name: "first_name",
            label: "First Name",
            type: "text",
            required: true,
        },
        {
            name: "last_name",
            label: "Last Name",
            type: "text",
            required: true,
        },
        {
            name: "telephone",
            label: "Telephone",
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
            name: "username",
            label: "Username",
            type: "text",
            required: true,
        },
        {
            name: "password",
            label: "Password",
            type: "text",
            required: true,
        },

        {
            name: "role",
            label: "Role",
            type: "select",
            required: true,
            options: [
                "Regional Operations Manager",
                "General Manager",
                "Operations Manager",
                "Contracts Manager",
                "Accountant",
                "Admin",
            ],
        },
    ];

    return {
        columns,
        tableData,
        inputFields,
        hasActions,
    };
};

export default useUsers;
