import { useState } from "react";

const useCurrenciesAndUnits = () => {
    const [hasActions, _] = useState<boolean>(true);

    const currenciesColumns = {
        currency_code: "Currency Code",
        currency_full_name: "Currency Full Name",
        usd_equivalency: "USD Equivalency",
    };

    const unitsColumns = {
        unit_list: "Unit List",
    };

    const currencyTableData = [
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

    const unitsTableData = [
        { id: "1", unit_list: "ft" },
        { id: "2", unit_list: "U" },
        { id: "3", unit_list: "D" },
        { id: "4", unit_list: "dm" },
        { id: "5", unit_list: "ens" },
        { id: "6", unit_list: "ml" },
        { id: "7", unit_list: "m2" },
        { id: "8", unit_list: "m3" },
        { id: "9", unit_list: "kg" },
        { id: "10", unit_list: "ton" },
        { id: "11", unit_list: "liter" },
        { id: "12", unit_list: "mois" },
        { id: "13", unit_list: "jour" },
    ];

    const currencyInputFields = [
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

    const unitInputFields = [
        {
            name: "unit_list",
            label: "Unit List",
            type: "text",
            required: true,
        },
    ];

    return {
        currenciesColumns,
        unitsColumns,
        currencyTableData,
        unitsTableData,
        currencyInputFields,
        unitInputFields,
        hasActions,
    };
};

export default useCurrenciesAndUnits;
