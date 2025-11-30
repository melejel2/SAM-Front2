import { useMemo } from 'react';

const useReports = ({ projects }) => {
    const columns = useMemo(() => ({
        name: "Project Name",
    }), []);

    const tableData = useMemo(() => (
        (projects ?? []).map(p => ({ id: p.id, name: p.name }))
    ), [projects]);

    return {
        columns,
        tableData,
    };
};

export default useReports;
