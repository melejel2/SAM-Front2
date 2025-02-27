const useUnits = () => {
    const columns = {
        unit_list: "Unit List",
    };
    const tableData = [
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

    const inputFields = [
        {
            name: "unit_list",
            label: "Unit List",
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

export default useUnits;
