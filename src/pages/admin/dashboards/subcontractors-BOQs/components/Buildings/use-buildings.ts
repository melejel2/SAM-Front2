import { useEffect, useState } from 'react';

const allBuildings: Record<number, any[]> = {
    1: [ // For project 1
        { id: 1, name: "Building 1.1 (Project 1)", code: "B1.1" },
        { id: 2, name: "Building 1.2 (Project 1)", code: "B1.2" },
    ],
    2: [ // For project 2
        { id: 3, name: "Building 2.1 (Project 2)", code: "B2.1" },
    ],
    3: [ // For project 3
        { id: 4, name: "Building 3.1 (Project 3)", code: "B3.1" },
        { id: 5, name: "Building 3.2 (Project 3)", code: "B3.2" },
    ]
};

const useBuildings = (projectId: number | null) => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            if (projectId && allBuildings[projectId]) {
                setTableData(allBuildings[projectId]);
            } else {
                setTableData([]);
            }
            setLoading(false);
        }, 300); // Simulate network delay
    }, [projectId]);

    const columns = {
        name: "Name",
        code: "Code",
    };

    const inputFields = [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "code", label: "Code", type: "text", required: true },
    ];

    return {
        columns,
        tableData,
        inputFields,
        loading,
    };
};

export default useBuildings;