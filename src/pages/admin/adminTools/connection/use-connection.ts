const useConnection = () => {
    const columns = {
        data_source: "Data Source",
        database: "Database",
        username: "Username",
        password: "Password",
        name: "Name",
        acronym: "Acronym",
    };
    const tableData = [
        {
            id: "1",
            data_source: "Data Source 1",
            database: "Database 1",
            username: "Username 1",
            password: "Password 1",
            name: "Name 1",
            acronym: "Acronym 1",
        },
        {
            id: "2",
            data_source: "Data Source 2",
            database: "Database 2",
            username: "Username 2",
            password: "Password 2",
            name: "Name 2",
            acronym: "Acronym 2",
        },
        {
            id: "3",
            data_source: "Data Source 3",
            database: "Database 3",
            username: "Username 3",
            password: "Password 3",
            name: "Name 3",
            acronym: "Acronym 3",
        },
    ];

    const inputFields = [
        {
            name: "data_source",
            label: "Data Source",
            type: "text",
            required: true,
        },
        {
            name: "database",
            label: "Database",
            type: "text",
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
            name: "name",
            label: "Name",
            type: "text",
            required: true,
        },
        {
            name: "acronym",
            label: "Acronym",
            type: "text",
            required: true,
        },
    ];

    return {
        columns,
        tableData,
        inputFields,
    };
};

export default useConnection;
