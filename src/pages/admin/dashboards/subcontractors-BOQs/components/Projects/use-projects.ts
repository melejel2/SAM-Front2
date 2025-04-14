const useProjects = () => {
    const columns = {
        code: "Code",
        name: "Name",
        acronym: "Acronym",
        city: "City",
    };
    const tableData = [
        {
            id: 1,
            code: "A01",
            name: "Project Name 1",
            acronym: "Project Acronym 1",
            city: "Project City 1",
        },
        {
            id: 2,
            code: "A02",
            name: "Project Name 2",
            acronym: "Project Acronym 2",
            city: "Project City 2",
        },
        {
            id: 3,
            code: "A03",
            name: "Project Name 3",
            acronym: "Project Acronym 3",
            city: "Project City 3",
        },
    ];

    const inputFields = [
        {
            name: "code",
            label: "Code",
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
        {
            name: "city",
            label: "City",
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

export default useProjects;
