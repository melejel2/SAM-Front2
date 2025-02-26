const useTemplates = () => {
    const columns = {
        code: "Code",
        template_name: "Template Name",
        function: "Function",
        type: "Type",
        contract_type: "Contract Type",
        language: "Language",
    };
    const tableData = [
        {
            id: "1",
            code: "Code 1",
            template_name: "Template Name 1",
            function: "Function 1",
            type: "Type 1",
            contract_type: "Contract Type 1",
            language: "Language 1",
        },
        {
            id: "2",
            code: "Code 2",
            template_name: "Template Name 2",
            function: "Function 2",
            type: "Type 2",
            contract_type: "Contract Type 2",
            language: "Language 2",
        },
        {
            id: "3",
            code: "Code 3",
            template_name: "Template Name 3",
            function: "Function 3",
            type: "Type 3",
            contract_type: "Contract Type 3",
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
            name: "function",
            label: "Function",
            type: "select",
            required: true,
            options: ["Contract", "VO", "Termination Letter", "Discharge"],
        },
        {
            name: "type",
            label: "Type",
            type: "text",
            required: true,
        },
        {
            name: "contract_type",
            label: "Contract Type",
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

export default useTemplates;
