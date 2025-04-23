import { useState } from "react";

const useIPCDialog = () => {
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [selectedType, setSelectedType] = useState<any>(null);
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<any>(null);

    return {
        selectedProject,
        selectedContract,
        selectedType,
        selectedSubcontractor,
        setSelectedProject,
        setSelectedContract,
        setSelectedType,
        setSelectedSubcontractor,
    };
};

export default useIPCDialog;
