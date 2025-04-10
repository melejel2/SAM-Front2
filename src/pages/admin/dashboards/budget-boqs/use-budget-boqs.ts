import { useState } from "react";

const useBudgetBOQs = () => {
    const columns = {
        project_cost_center: "Project Cost Center",
        project_name: "Project Name",
        project_acronym: "Project Acronym",
        project_city: "Project City",
    };
    const tableData = [
        {
            id: "1",
            project_cost_center: "First Name 1",
            project_name: "Project Name 1",
            project_acronym: "Project Acronym 1",
            project_city: "Project City 1",
        },
        {
            id: "2",
            project_cost_center: "First Name 2",
            project_name: "Project Name 2",
            project_acronym: "Project Acronym 2",
            project_city: "Project City 2",
        },
        {
            id: "3",
            project_cost_center: "First Name 3",
            project_name: "Project Name 3",
            project_acronym: "Project Acronym 3",
            project_city: "Project City 3",
        },
    ];

    const inputFields = [
        {
            name: "project_cost_center",
            label: "Project Cost Center",
            type: "text",
            required: true,
        },
        {
            name: "project_name",
            label: "Project Name",
            type: "text",
            required: true,
        },
        {
            name: "project_acronym",
            label: "Project Acronym",
            type: "text",
            required: true,
        },
        {
            name: "project_city",
            label: "Project City",
            type: "text",
            required: true,
        },
    ];

    const [selectedProject, setSelectedProject] = useState<any>(null);

    return {
        columns,
        tableData,
        inputFields,
        selectedProject,
        setSelectedProject,
    };
};

export default useBudgetBOQs;
