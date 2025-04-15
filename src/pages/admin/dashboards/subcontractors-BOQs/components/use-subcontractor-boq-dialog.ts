import { useState } from "react";

const useSubcontractorBOQsDialog = () => {
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [selectedTrade, setSelectedTrade] = useState<any>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<any>(null);

    return {
        selectedProject,
        selectedTrade,
        selectedBuilding,
        selectedSubcontractor,
        setSelectedProject,
        setSelectedTrade,
        setSelectedBuilding,
        setSelectedSubcontractor,
    };
};

export default useSubcontractorBOQsDialog;
