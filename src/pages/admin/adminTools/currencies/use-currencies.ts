const useCurrencies = () => {
    const columns = {
        currency_code: "Currency Code",
        currency_full_name: "Currency Full Name",
        usd_equivalency: "USD Equivalency",
    };
    const tableData = [
        {
            id: "1",
            currency_code: "MAD",
            currency_full_name: "Moroccan Dirham",
            usd_equivalency: "8.973139",
        },
        {
            id: "2",
            currency_code: "EUR",
            currency_full_name: "Euro",
            usd_equivalency: "0.830802",
        },
        {
            id: "3",
            currency_code: "USD",
            currency_full_name: "United States Dollar",
            usd_equivalency: "1",
        },
        {
            id: "4",
            currency_code: "XAF",
            currency_full_name: "Central African CFA Franc",
            usd_equivalency: "544.475617",
        },
        {
            id: "5",
            currency_code: "XOF",
            currency_full_name: "West African CFA Franc",
            usd_equivalency: "544.475617",
        },
        {
            id: "6",
            currency_code: "IQD",
            currency_full_name: "Iraqi Dinar",
            usd_equivalency: "1457.065312",
        },
    ];

    const inputFields = [
        {
            name: "currency_code",
            label: "Currency Code",
            type: "text",
            required: true,
        },
        {
            name: "currency_full_name",
            label: "Currency Full Name",
            type: "text",
            required: true,
        },
        {
            name: "usd_equivalency",
            label: "USD Equivalency",
            type: "number",
            required: true,
        },
    ];

    return {
        columns,
        tableData,
        inputFields,
    };
};

export default useCurrencies;
