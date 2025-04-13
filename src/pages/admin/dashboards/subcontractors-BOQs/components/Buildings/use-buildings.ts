const useBuildings = () => {
    const columns = {
        name: "Name",
        code: "Code",
    };
    const tableData = [
        { id: 1, name: "Building 1", code: "B1" },
        { id: 2, name: "Building 2", code: "B2" },
        { id: 3, name: "Building 3", code: "B3" },
    ];

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
    ];

    return {
        columns,
        tableData,
        inputFields,
    };
};

export default useBuildings;
