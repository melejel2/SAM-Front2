import { useMemo } from 'react';

interface Project {
    id: number;
    name: string;
}

interface UseReportsProps {
    projects: Project[];
}

const useReports = ({ projects }: UseReportsProps) => {
    const columns = useMemo(() => ({
        name: "Project Name",
    }), []);

    const tableData = useMemo(() => (
        (projects ?? []).map((p: Project) => ({ id: p.id, name: p.name }))
    ), [projects]);

    return {
        columns,
        tableData,
    };
};

export default useReports;
