const useTrades = () => {
    const columns = {
        en: "EN",
        fr: "FR",
        code: "Code",
    };
    const tableData = [
        {
            id: "1",
            en: "EN 1",
            fr: "FR 1",
            code: "Code 1",
        },
        {
            id: "2",
            en: "EN 2",
            fr: "FR 2",
            code: "Code 2",
        },
        {
            id: "3",
            en: "EN 3",
            fr: "FR 3",
            code: "Code 3",
        },
    ];

    const inputFields = [
        {
            name: "en",
            label: "EN",
            type: "text",
            required: true,
        },
        {
            name: "fr",
            label: "FR",
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

export default useTrades;
