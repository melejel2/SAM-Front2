const useIPCSubcontractors = () => {
    const columns = {
        company_name: "Company Name",
        head_office_location: "Head Office Location",
        company_register_location: "Company Register Location",
        company_register_number: "Company Register Number",
        taxable_number: "Taxable Number",
        represented_by: "Represented By",
        representatives_position: "Representative's Position",
        telephone_number: "Telephone Number",
    };

    const tableData = [
        {
            id: 1,
            company_name: "Afrique Construction",
            head_office_location: "Yopougon Zone Industrielle",
            company_register_location: "Yopougon",
            company_register_number: "CI-YOP-2006-A-1155",
            taxable_number: "CC 6002787 T",
            represented_by: "Maguyeye Kebe",
            representatives_position: "Cosignataire",
            telephone_number: "49 23 82 57",
        },
        {
            id: 2,
            company_name: "INTER-KIT SARL",
            head_office_location: "Treichville Zone 2, 26 BP 50",
            company_register_location: "Abidjan",
            company_register_number: "CI-ABJ-2018-B-18619",
            taxable_number: "CC 1837631 J",
            represented_by: "Vincent Khoury",
            representatives_position: "Gérant",
            telephone_number: "74 39 74 39",
        },
        {
            id: 3,
            company_name: "ENTREPRISES BARON",
            head_office_location: "Triangle, Immeuble Jolie",
            company_register_location: "Abidjan",
            company_register_number: "CI-ABJ-2017-B-13449",
            taxable_number: "CC 1724906 V",
            represented_by: "Stéphane Baron",
            representatives_position: "Gérant",
            telephone_number: "86 46 46 48",
        },
        {
            id: 4,
            company_name: "ISOLEC",
            head_office_location: "Marseille, 1e etage AZUR 1",
            company_register_location: "Abidjan",
            company_register_number: "CI-ABJ-2013-B-11486",
            taxable_number: "CC 1441845 U",
            represented_by: "N'Dri Bosson Frederic",
            representatives_position: "Gérant",
            telephone_number: "77 73 89 28",
        },
        {
            id: 5,
            company_name: "SITABAT",
            head_office_location: "Abidjan, Carrefour zone",
            company_register_location: "Abidjan",
            company_register_number: "CI-ABJ-2014-B-22912",
            taxable_number: "CC 1441525 K",
            represented_by: "Abdoulaye TOURE",
            representatives_position: "Gérant",
            telephone_number: "05 58 12 43",
        },
    ];

    return {
        columns,
        tableData,
    };
};

export default useIPCSubcontractors;
