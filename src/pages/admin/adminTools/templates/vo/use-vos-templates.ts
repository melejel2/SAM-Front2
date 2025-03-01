const useVOsTemplates = () => {
    const columns = {
        code: "Code",
        template_name: "Template Name",
        language: "Language",
    };
    const tableData = [
        {
            id: "1",
            code: "Code 1",
            template_name: "Template Name 1",
            language: "Language 1",
        },
        {
            id: "2",
            code: "Code 2",
            template_name: "Template Name 2",
            language: "Language 2",
        },
        {
            id: "3",
            code: "Code 3",
            template_name: "Template Name 3",
            language: "Language 3",
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
            name: "template_name",
            label: "Template Name",
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

    return {
        columns,
        tableData,
        inputFields,
    };
};

export default useVOsTemplates;
