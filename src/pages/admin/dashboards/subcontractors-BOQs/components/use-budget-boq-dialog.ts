import { useState } from "react";

const useBudgetBOQsDialog = () => {
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [selectedTrade, setSelectedTrade] = useState<any>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<any>(null);

    return {
        selectedProject,
        selectedTrade,
        selectedBuilding,
        setSelectedProject,
        setSelectedTrade,
        setSelectedBuilding,
    };
};

export default useBudgetBOQsDialog;
