import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { Loader } from "@/components/Loader";
import { FileUploader } from "@/components/FileUploader";
import SAMTable from "@/components/Table";
import { FilePondFile } from "filepond";
import { Icon } from "@iconify/react";
import buildingIcon from "@iconify/icons-lucide/building";
import userIcon from "@iconify/icons-lucide/user";
import fileTextIcon from "@iconify/icons-lucide/file-text";
import checkCircleIcon from "@iconify/icons-lucide/check-circle";

interface Project {
    id: number;
    code?: string;
    name: string;
    acronym?: string;
    city?: string;
    buildings?: Building[];
}

interface Building {
    id: number;
    name: string;
}

interface Subcontractor {
    id: number;
    name: string | null;
    siegeSocial?: string | null;
    commerceRegistrar?: string | null;
    commerceNumber?: string | null;
    taxNumber?: string | null;
    representedBy?: string | null;
    qualityRepresentive?: string | null;
    subcontractorTel?: string | null;
}

interface Contract {
    id: number;
    templateName: string;
    type: string;
    contractType?: string;
}

interface Currency {
    id: number;
    name: string;
    currencies: string; // This is the code/symbol
}

interface WizardFormData {
    projectId: number | null;
    buildingIds: number[];
    subcontractorId: number | null;
    contractId: number | null;
    currencyId: number | null;
    contractDate: string;
    completionDate: string;
    advancePayment: number;
    materialSupply: number;
    purchaseIncrease: string;
    latePenalties: string;
    latePenalityCeiling: string;
    holdWarranty: string;
    mintenancePeriod: string;
    workWarranty: string;
    termination: string;
    daysNumber: string;
    progress: string;
    holdBack: string;
    subcontractorAdvancePayee: string;
    recoverAdvance: string;
    procurementConstruction: string;
    prorataAccount: string;
    managementFees: string;
    plansExecution: string;
    subTrade: string;
    paymentsTerm: string;
    remark: string;
    remarkCP: string;
    attachments: {
        file: File;
        type: string;
    }[];
    boqData: {
        buildingId: number;
        buildingName: string;
        sheetName: string;
        items: BOQItem[];
    }[];
}

interface BOQItem {
    id?: number;
    no: string;
    key: string;
    costCode: string;
    unite: string;
    qte: number;
    pu: number;
    totalPrice?: number;
}

const NewSubcontractWizard = () => {
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { toaster } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true); // Start with loading true
    const [projects, setProjects] = useState<Project[]>([]);
    const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [selectedProjectBuildings, setSelectedProjectBuildings] = useState<Building[]>([]);
    const [selectedAttachmentType, setSelectedAttachmentType] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedSubcontractor, setSelectedSubcontractor] = useState<Subcontractor | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
    const [showBackConfirmDialog, setShowBackConfirmDialog] = useState<boolean>(false);
    
    // BOQ-specific state
    const [selectedBuildingForBOQ, setSelectedBuildingForBOQ] = useState<string>('');
    const [isImportingBOQ, setIsImportingBOQ] = useState<boolean>(false);
    const [focusTarget, setFocusTarget] = useState<{ itemId: number | undefined, field: string } | null>(null);
    
    const [formData, setFormData] = useState<WizardFormData>({
        projectId: null,
        buildingIds: [],
        subcontractorId: null,
        contractId: null,
        currencyId: null,
        contractDate: new Date().toISOString().split('T')[0],
        completionDate: '',
        advancePayment: 0,
        materialSupply: 0,
        purchaseIncrease: '',
        latePenalties: '',
        latePenalityCeiling: '',
        holdWarranty: '',
        mintenancePeriod: '',
        workWarranty: '',
        termination: '',
        daysNumber: '',
        progress: '',
        holdBack: '',
        subcontractorAdvancePayee: '',
        recoverAdvance: '',
        procurementConstruction: '',
        prorataAccount: '',
        managementFees: '',
        plansExecution: '',
        subTrade: '',
        paymentsTerm: '',
        remark: '',
        remarkCP: '',
        attachments: [],
        boqData: []
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    // Auto-select first building for BOQ when buildings are available
    useEffect(() => {
        if (formData.buildingIds.length > 0 && !selectedBuildingForBOQ) {
            setSelectedBuildingForBOQ(formData.buildingIds[0].toString());
        }
    }, [formData.buildingIds, selectedBuildingForBOQ]);

    // Handle focus restoration after new item creation
    useEffect(() => {
        if (focusTarget) {
            const inputId = `boq-input-${focusTarget.itemId}-${focusTarget.field}`;
            const inputElement = document.getElementById(inputId) as HTMLInputElement;
            if (inputElement) {
                inputElement.focus();
                // Place cursor at end of input
                inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
                // Clear focus target
                setFocusTarget(null);
            }
        }
    }, [focusTarget, formData.boqData]);

    const loadInitialData = async () => {
        setLoading(true);
        const token = getToken() ?? "";
        
        // Load projects
        try {
            const projectsData = await apiRequest({
                endpoint: "Project/GetProjectsList",
                method: "GET",
                token
            });
            setProjects(Array.isArray(projectsData) ? projectsData : []);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
        
        // Load subcontractors
        try {
            const subcontractorsData = await apiRequest({
                endpoint: "Subcontractors/GetSubcontractors",
                method: "GET",
                token
            });
            
            // Handle various response structures
            if (Array.isArray(subcontractorsData)) {
                setSubcontractors(subcontractorsData);
            } else if (subcontractorsData && typeof subcontractorsData === 'object') {
                if ('data' in subcontractorsData && Array.isArray(subcontractorsData.data)) {
                    setSubcontractors(subcontractorsData.data);
                } else if ('result' in subcontractorsData && Array.isArray(subcontractorsData.result)) {
                    setSubcontractors(subcontractorsData.result);
                } else if ('items' in subcontractorsData && Array.isArray(subcontractorsData.items)) {
                    setSubcontractors(subcontractorsData.items);
                } else {
                    setSubcontractors([]);
                }
            } else {
                setSubcontractors([]);
            }
        } catch (error) {
            console.error('Error loading subcontractors:', error);
        }
        
        // Load contracts
        try {
            const contractsData = await apiRequest({
                endpoint: "Templates/GetContracts",
                method: "GET",
                token
            });
            setContracts(Array.isArray(contractsData) ? contractsData : []);
        } catch (error) {
            console.error('Error loading contracts:', error);
        }
        
        // Load currencies
        try {
            const currenciesData = await apiRequest({
                endpoint: "Currencie/GetCurrencies",
                method: "GET",
                token
            });
            setCurrencies(Array.isArray(currenciesData) ? currenciesData : []);
        } catch (error) {
            console.error('Error loading currencies:', error);
        }
        
        setLoading(false);
    };

    const handleProjectChange = async (projectId: number) => {
        setFormData({ ...formData, projectId, buildingIds: [] });
        
        // Load buildings for the selected project
        const project = projects.find(p => p.id === projectId);
        if (project?.buildings) {
            setSelectedProjectBuildings(project.buildings);
            // Auto-select if only one building
            if (project.buildings.length === 1) {
                setFormData({ ...formData, projectId, buildingIds: [project.buildings[0].id] });
            }
        } else {
            // Load buildings from API if not already loaded
            try {
                const token = getToken() ?? "";
                const buildingsData = await apiRequest({
                    endpoint: `Building/GetBuildingsList?projectId=${projectId}`,
                    method: "GET",
                    token
                });
                setSelectedProjectBuildings(Array.isArray(buildingsData) ? buildingsData : []);
                // Auto-select if only one building
                if (Array.isArray(buildingsData) && buildingsData.length === 1) {
                    setFormData({ ...formData, projectId, buildingIds: [buildingsData[0].id] });
                }
            } catch (error) {
                toaster.error("Failed to load buildings");
                setSelectedProjectBuildings([]);
            }
        }
    };

    // BOQ direct editing functions
    const createEmptyBOQItem = (): BOQItem => ({
        id: Date.now(),
        no: '',
        key: '',
        costCode: '',
        unite: '',
        qte: 0,
        pu: 0,
        totalPrice: 0
    });

    const updateBOQItem = (itemIndex: number, field: keyof BOQItem, value: string | number) => {
        const selectedBuildingId = parseInt(selectedBuildingForBOQ);
        const newBOQData = formData.boqData.map(building => {
            if (building.buildingId === selectedBuildingId) {
                const updatedItems = [...building.items];
                
                // Handle different field types
                let processedValue = value;
                if (field === 'qte' || field === 'pu') {
                    processedValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                }
                
                updatedItems[itemIndex] = {
                    ...updatedItems[itemIndex],
                    [field]: processedValue,
                    totalPrice: field === 'qte' || field === 'pu' 
                        ? (field === 'qte' ? (processedValue as number) * updatedItems[itemIndex].pu : updatedItems[itemIndex].qte * (processedValue as number))
                        : updatedItems[itemIndex].qte * updatedItems[itemIndex].pu
                };
                
                return {
                    ...building,
                    items: updatedItems
                };
            }
            return building;
        });
        
        setFormData({ ...formData, boqData: newBOQData });
    };

    const addNewBOQItem = (itemData: Partial<BOQItem>, focusField: string) => {
        const selectedBuildingId = parseInt(selectedBuildingForBOQ);
        const building = selectedProjectBuildings.find(b => b.id === selectedBuildingId);
        
        const newItem: BOQItem = {
            ...createEmptyBOQItem(),
            ...itemData,
            totalPrice: (itemData.qte || 0) * (itemData.pu || 0)
        };

        const newBOQData = [...formData.boqData];
        const buildingIndex = newBOQData.findIndex(b => b.buildingId === selectedBuildingId);
        
        if (buildingIndex === -1) {
            // Create new building BOQ
            newBOQData.push({
                buildingId: selectedBuildingId,
                buildingName: building?.name || '',
                sheetName: 'default',
                items: [newItem]
            });
        } else {
            // Add to existing building BOQ
            newBOQData[buildingIndex].items.push(newItem);
        }
        
        setFormData({ ...formData, boqData: newBOQData });
        
        // Set focus target for the newly created item
        setFocusTarget({ itemId: newItem.id, field: focusField });
    };

    const deleteBOQItem = (itemIndex: number) => {
        const selectedBuildingId = parseInt(selectedBuildingForBOQ);
        const newBOQData = formData.boqData.map(building => {
            if (building.buildingId === selectedBuildingId) {
                return {
                    ...building,
                    items: building.items.filter((_, i) => i !== itemIndex)
                };
            }
            return building;
        });
        
        setFormData({ ...formData, boqData: newBOQData });
    };

    const canProceedToNextStep = () => {
        switch (currentStep) {
            case 1:
                return selectedProject !== null;
            case 2:
                return formData.buildingIds.length > 0;
            case 3:
                return selectedSubcontractor !== null;
            case 4:
                return formData.contractId !== null && formData.currencyId !== null && formData.completionDate !== '';
            case 5:
                // Check if at least one building has BOQ items
                return formData.boqData.some(buildingBOQ => buildingBOQ.items.length > 0);
            default:
                return true;
        }
    };

    const handleNext = () => {
        // Validate current step
        if (currentStep === 1 && !selectedProject) {
            toaster.error("Please select a project");
            return;
        }
        if (currentStep === 2 && formData.buildingIds.length === 0) {
            toaster.error("Please select at least one building");
            return;
        }
        if (currentStep === 3 && !selectedSubcontractor) {
            toaster.error("Please select a subcontractor");
            return;
        }
        if (currentStep === 4 && (!formData.contractId || !formData.currencyId || !formData.completionDate)) {
            if (!formData.contractId) {
                toaster.error("Please select a contract type");
            } else if (!formData.currencyId) {
                toaster.error("Please select a currency");
            } else if (!formData.completionDate) {
                toaster.error("Please enter a completion date");
            }
            return;
        }
        if (currentStep === 5 && !formData.boqData.some(buildingBOQ => buildingBOQ.items.length > 0)) {
            toaster.error("Please add at least one BOQ item");
            return;
        }
        
        setCurrentStep(currentStep + 1);
    };

    const handleBackButton = () => {
        if (currentStep === 1) {
            // If on first step, check for unsaved changes
            if (hasUnsavedChanges) {
                setShowBackConfirmDialog(true);
            } else {
                navigate('/dashboard/subcontractors-boqs');
            }
        } else {
            // If on other steps, go back one step in wizard
            setCurrentStep(currentStep - 1);
        }
    };

    const handleConfirmBack = () => {
        setShowBackConfirmDialog(false);
        navigate('/dashboard/subcontractors-boqs');
    };

    const handleCancelBack = () => {
        setShowBackConfirmDialog(false);
    };

    const handleSaveAndContinue = async () => {
        setLoading(true);
        try {
            const token = getToken() ?? "";
            
            // Create the complete payload according to SubcontractorBoqVM structure
            const payload = {
                id: 0, // 0 for new contract
                currencyId: formData.currencyId,
                projectId: formData.projectId,
                subContractorId: formData.subcontractorId, // Note: API expects subContractorId with capital C
                contractId: formData.contractId,
                contractDatasetStatus: "Editable",
                contractDate: new Date(formData.contractDate).toISOString(),
                completionDate: formData.completionDate ? new Date(formData.completionDate).toISOString() : null,
                purchaseIncrease: formData.purchaseIncrease || "",
                latePenalties: formData.latePenalties || "",
                latePenaliteCeiling: formData.latePenalityCeiling || "",
                holdWarranty: formData.holdWarranty || "",
                mintenancePeriod: formData.mintenancePeriod || "",
                workWarranty: formData.workWarranty || "",
                termination: formData.termination || "",
                daysNumber: formData.daysNumber || "",
                progress: formData.progress || "",
                holdBack: formData.holdBack || "",
                subcontractorAdvancePayee: formData.subcontractorAdvancePayee || "",
                recoverAdvance: formData.recoverAdvance || "",
                procurementConstruction: formData.procurementConstruction || "",
                prorataAccount: formData.prorataAccount || "",
                managementFees: formData.managementFees || "",
                contractNumber: "",
                remark: formData.remark || "",
                remarkCP: formData.remarkCP || "",
                isGenerated: false,
                advancePayment: formData.advancePayment || 0,
                plansExecution: formData.plansExecution || "",
                subTrade: formData.subTrade || "",
                paymentsTerm: formData.paymentsTerm || "",
                materialSupply: formData.materialSupply || 0,
                wordFile: null,
                buildings: formData.buildingIds.map(buildingId => {
                    const building = selectedProjectBuildings.find(b => b.id === buildingId);
                    const buildingBOQ = formData.boqData.find(b => b.buildingId === buildingId);
                    
                    return {
                        id: 0,
                        buildingName: building?.name || '',
                        sheetId: 0,
                        sheetName: buildingBOQ?.sheetName || 'default',
                        replaceAllItems: false,
                        boqsContract: buildingBOQ?.items.map(item => ({
                            id: 0,
                            no: item.no,
                            key: item.key,
                            costCode: item.costCode,
                            unite: item.unite,
                            qte: item.qte,
                            pu: item.pu,
                            totalPrice: item.totalPrice || (item.qte * item.pu)
                        })) || []
                    };
                })
            };
            
            // Debug: Log the payload being sent
            console.log('Sending payload to API:', payload);
            
            const response = await apiRequest<{ success: boolean; id?: number; contractNumber?: string; error?: string }>({
                endpoint: "ContractsDatasets/SaveSubcontractorDataset",
                method: "POST",
                body: payload,
                token
            });
            
            // Check if we got a successful response
            if (response && response.success) {
                toaster.success("Contract created successfully");
                // Navigate to the subcontractors BOQs list page
                navigate('/dashboard/subcontractors-boqs');
            } else {
                // Handle error response
                let errorMessage = "Failed to create contract - Unknown error";
                if (response && 'error' in response && response.error) {
                    errorMessage = response.error;
                } else if (response && 'message' in response && response.message) {
                    errorMessage = response.message;
                }
                toaster.error(errorMessage);
            }
        } catch (error) {
            console.error("Contract creation error:", error);
            toaster.error("An error occurred while creating the contract");
        } finally {
            setLoading(false);
        }
    };


    const renderStepIndicator = () => {
        const steps = [
            { number: 1, title: "Project", icon: buildingIcon },
            { number: 2, title: "Buildings", icon: buildingIcon },
            { number: 3, title: "Subcontractor", icon: userIcon },
            { number: 4, title: "Contract Details", icon: fileTextIcon },
            { number: 5, title: "BOQ Items", icon: fileTextIcon },
            { number: 6, title: "Review", icon: checkCircleIcon }
        ];

        // Get step color classes based on current progress
        const getStepColorClass = (stepNumber: number) => {
            if (currentStep === stepNumber) {
                return "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300";
            }
            if (currentStep > stepNumber) {
                return "bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300";
            }
            return "bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300";
        };

        // Get connector color
        const getConnectorColor = (stepNumber: number) => {
            if (currentStep > stepNumber) {
                return "bg-green-300 dark:bg-green-600";
            }
            return "bg-gray-200 dark:bg-gray-600";
        };

        return (
            <div className="w-full">
                <div className="flex items-center justify-center">
                    {steps.map((step, idx) => (
                        <div key={step.number} className="flex items-center">
                            {/* Step container with icon and label */}
                            <div className="flex flex-col items-center" style={{ width: "90px" }}>
                                {/* Icon circle - made bigger */}
                                <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 ${getStepColorClass(step.number)}`}>
                                    {/* Keep same icon for all states, just change colors */}
                                    <Icon icon={step.icon} width={20} height={20} />
                                </div>
                                
                                {/* Label directly below icon */}
                                <span className="text-xs font-medium text-center mt-1.5 text-base-content">
                                    {step.title}
                                </span>
                            </div>
                            
                            {/* Connector between steps */}
                            {idx < steps.length - 1 && (
                                <div className="flex-1 flex items-center" style={{ marginTop: "-16px", minWidth: "50px" }}>
                                    <div className="h-1 w-full">
                                        <div className={`h-1 w-full ${getConnectorColor(step.number)}`} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading && currentStep === 1) {
        return <Loader />;
    }

    return (
        <div>{/* Removed max-w constraints and custom padding - using app layout standards */}
            <style>{`
                .filepond-wrapper .filepond--root {
                    font-family: inherit;
                }
                
                .filepond-wrapper .filepond--drop-label {
                    color: var(--fallback-bc, oklch(var(--bc)));
                    font-size: 0.875rem;
                }
                
                .filepond-wrapper .filepond--label-action {
                    text-decoration: underline;
                    color: var(--fallback-p, oklch(var(--p)));
                    cursor: pointer;
                }
                
                .filepond-wrapper .filepond--panel-root {
                    background-color: var(--fallback-b2, oklch(var(--b2)));
                    border: 2px dashed var(--fallback-bc, oklch(var(--bc) / 0.2));
                    border-radius: var(--rounded-btn, 0.5rem);
                }
                
                .filepond-wrapper .filepond--item-panel {
                    background-color: var(--fallback-b1, oklch(var(--b1)));
                    border-radius: var(--rounded-btn, 0.5rem);
                }
                
                .filepond-wrapper .filepond--drip {
                    background-color: var(--fallback-p, oklch(var(--p) / 0.1));
                    border-color: var(--fallback-p, oklch(var(--p)));
                }
                
                .filepond-wrapper .filepond--item {
                    margin-bottom: 0.5rem;
                }
                
                .filepond-wrapper .filepond--file-action-button {
                    color: var(--fallback-bc, oklch(var(--bc)));
                    background-color: var(--fallback-b3, oklch(var(--b3)));
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .filepond-wrapper .filepond--file-action-button:hover {
                    background-color: var(--fallback-er, oklch(var(--er)));
                    color: white;
                }
                
                .filepond-wrapper .filepond--file-info {
                    color: var(--fallback-bc, oklch(var(--bc) / 0.7));
                    font-size: 0.75rem;
                }
                
                .filepond-wrapper .filepond--file-status {
                    color: var(--fallback-bc, oklch(var(--bc) / 0.6));
                    font-size: 0.75rem;
                }
                
                /* Hide FilePond status indicators to prevent duplicate feedback */
                .filepond-wrapper .filepond--file-status-main {
                    display: none !important;
                }
                
                .filepond-wrapper .filepond--file-status-sub {
                    display: none !important;
                }
                
                .filepond-wrapper .filepond--load-indicator {
                    display: none !important;
                }
                
                .filepond-wrapper .filepond--progress-indicator {
                    display: none !important;
                }
                
                /* Hide the entire FilePond file items to prevent duplicate display */
                .filepond-wrapper .filepond--item {
                    display: none !important;
                }
                
                /* Hide the FilePond list when it contains files */
                .filepond-wrapper .filepond--list-scroller {
                    display: none !important;
                }
            `}</style>

            {/* Header with Back Button, Timeline, and Navigation */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={handleBackButton}
                    className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                >
                    <span className="iconify lucide--arrow-left size-4"></span>
                    <span>Back</span>
                </button>
                
                {/* Timeline in the center */}
                <div className="flex-1 flex justify-center">
                    {renderStepIndicator()}
                </div>
                
                {/* Navigation buttons - same design as back button */}
                <div className="flex items-center gap-2">
                    {currentStep < 6 ? (
                        <button
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                            onClick={handleNext}
                            disabled={!canProceedToNextStep()}
                        >
                            <span>Next</span>
                            <span className="iconify lucide--arrow-right size-4"></span>
                        </button>
                    ) : (
                        <button
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                            onClick={handleSaveAndContinue}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span>Save & Continue</span>
                                    <span className="iconify lucide--check size-4"></span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm p-4">{/* Reduced padding from p-6 to p-4 */}
                {currentStep === 1 && (
                    <div>
                        <div>
                            <p className="text-sm text-base-content/70 mb-3">Select a project from the table below:</p>
                            <SAMTable
                                columns={{ 
                                    code: "Code",
                                    name: "Name", 
                                    acronym: "Acronym",
                                    city: "City"
                                }}
                                tableData={projects}
                                title="Projects"
                                loading={false}
                                onSuccess={() => {}}
                                onRowSelect={async (project: Project) => {
                                    setSelectedProject(project);
                                    setFormData({ ...formData, projectId: project.id, buildingIds: [] });
                                    setHasUnsavedChanges(true);
                                    
                                    // Load buildings for the selected project
                                    try {
                                        const token = getToken() ?? "";
                                        const buildingsData = await apiRequest({
                                            endpoint: `Building/GetBuildingsList?projectId=${project.id}`,
                                            method: "GET",
                                            token
                                        });
                                        setSelectedProjectBuildings(Array.isArray(buildingsData) ? buildingsData : []);
                                    } catch (error) {
                                        console.error('Error loading buildings:', error);
                                        setSelectedProjectBuildings([]);
                                    }
                                }}
                                select={false}
                                actions={false}
                                addBtn={false}
                            />
                            
                            {selectedProject && (
                                <div className="bg-green-50 border border-green-200 p-3 rounded-lg mt-3">
                                    <div className="flex items-center gap-2">
                                        <span className="iconify lucide--check-circle w-5 h-5 text-green-600"></span>
                                        <span className="font-medium text-green-800">Selected: {selectedProject.name}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div>
                        {selectedProject ? (
                            <div>
                                <div className="bg-base-200 p-3 rounded-lg mb-3">
                                    <h3 className="font-semibold mb-1">Project: {selectedProject.name}</h3>
                                    <p className="text-sm text-base-content/70">Select the buildings for this subcontract</p>
                                </div>

                                {selectedProjectBuildings.length > 0 ? (
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Buildings *</span>
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {selectedProjectBuildings.map(building => (
                                                <div key={building.id} className="relative">
                                                    <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                                                        formData.buildingIds.includes(building.id)
                                                            ? 'border-primary bg-primary/5 shadow-sm'
                                                            : 'border-base-300 bg-base-100 hover:border-base-400'
                                                    }`}>
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-primary"
                                                            checked={formData.buildingIds.includes(building.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFormData({
                                                                        ...formData,
                                                                        buildingIds: [...formData.buildingIds, building.id]
                                                                    });
                                                                } else {
                                                                    setFormData({
                                                                        ...formData,
                                                                        buildingIds: formData.buildingIds.filter(id => id !== building.id)
                                                                    });
                                                                }
                                                                setHasUnsavedChanges(true);
                                                            }}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="iconify lucide--building w-5 h-5 text-base-content/70"></span>
                                                                <span className="font-medium text-base-content">{building.name}</span>
                                                            </div>
                                                        </div>
                                                        {formData.buildingIds.includes(building.id) && (
                                                            <span className="iconify lucide--check-circle w-5 h-5 text-primary"></span>
                                                        )}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {formData.buildingIds.length > 0 && (
                                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg mt-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="iconify lucide--check-circle w-5 h-5 text-green-600"></span>
                                                    <span className="font-medium text-green-800">
                                                        {formData.buildingIds.length} building(s) selected
                                                    </span>
                                                </div>
                                                <div className="text-sm text-green-700 mt-1">
                                                    {selectedProjectBuildings
                                                        .filter(b => formData.buildingIds.includes(b.id))
                                                        .map(b => b.name)
                                                        .join(', ')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <span className="iconify lucide--building w-12 h-12 text-base-content/40 mx-auto mb-2"></span>
                                        <p className="text-base-content/60">No buildings found for this project</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-base-content/60">Please select a project first</p>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 3 && (
                    <div>
                        <div>
                            <p className="text-sm text-base-content/70 mb-3">Select a subcontractor from the table below:</p>
                            <SAMTable
                                columns={{ 
                                    name: "Company Name", 
                                    siegeSocial: "Address", 
                                    commerceNumber: "Commerce Number",
                                    representedBy: "Represented By"
                                }}
                                tableData={subcontractors}
                                title="Subcontractors"
                                loading={false}
                                onSuccess={() => {}}
                                onRowSelect={(subcontractor: Subcontractor) => {
                                    setSelectedSubcontractor(subcontractor);
                                    setFormData({ ...formData, subcontractorId: subcontractor.id });
                                    setHasUnsavedChanges(true);
                                }}
                                select={false}
                                actions={false}
                                addBtn={false}
                            />
                            
                            {selectedSubcontractor && (
                                <div className="bg-green-50 border border-green-200 p-3 rounded-lg mt-3">
                                    <div className="flex items-center gap-2">
                                        <span className="iconify lucide--check-circle w-5 h-5 text-green-600"></span>
                                        <span className="font-medium text-green-800">Selected: {selectedSubcontractor.name || 'Unnamed Subcontractor'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentStep === 4 && (
                    <div className="space-y-3">{/* Reduced space from space-y-4 to space-y-3 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{/* Reduced gap from gap-4 to gap-3 */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Contract Type *</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.contractId || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, contractId: Number(e.target.value) });
                                        setHasUnsavedChanges(true);
                                    }}
                                >
                                    <option value="">Select contract type</option>
                                    {contracts.map(contract => (
                                        <option key={contract.id} value={contract.id}>
                                            {contract.templateName} {contract.contractType && `- ${contract.contractType}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Currency *</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={formData.currencyId || ''}
                                    onChange={(e) => {
                                        setFormData({ ...formData, currencyId: Number(e.target.value) });
                                        setHasUnsavedChanges(true);
                                    }}
                                >
                                    <option value="">Select currency</option>
                                    {currencies.map(currency => (
                                        <option key={currency.id} value={currency.id}>
                                            {currency.name} ({currency.currencies})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Contract Date *</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered w-full"
                                    value={formData.contractDate}
                                    onChange={(e) => {
                                        setFormData({ ...formData, contractDate: e.target.value });
                                        setHasUnsavedChanges(true);
                                    }}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Completion Date *</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered w-full"
                                    value={formData.completionDate}
                                    onChange={(e) => {
                                        setFormData({ ...formData, completionDate: e.target.value });
                                        setHasUnsavedChanges(true);
                                    }}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Advance Payment</span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-bordered w-full"
                                    value={formData.advancePayment}
                                    onChange={(e) => setFormData({ ...formData, advancePayment: Number(e.target.value) })}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Material Supply</span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-bordered w-full"
                                    value={formData.materialSupply}
                                    onChange={(e) => setFormData({ ...formData, materialSupply: Number(e.target.value) })}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Retention %</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.holdWarranty}
                                    onChange={(e) => setFormData({ ...formData, holdWarranty: e.target.value })}
                                    placeholder="e.g., 5%"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Late Penalty</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.latePenalties}
                                    onChange={(e) => setFormData({ ...formData, latePenalties: e.target.value })}
                                    placeholder="e.g., 1% per day"
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Payment Terms</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered w-full"
                                    value={formData.paymentsTerm}
                                    onChange={(e) => setFormData({ ...formData, paymentsTerm: e.target.value })}
                                    placeholder="e.g., Net 30 days"
                                />
                            </div>
                        </div>

                        <div className="divider">Attachments</div>

                        <div className="space-y-3">{/* Reduced space from space-y-4 to space-y-3 */}
                            {/* Attachment Type Selector */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Attachment Type</span>
                                </label>
                                <select 
                                    className="select select-bordered w-full"
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setSelectedAttachmentType(e.target.value);
                                        }
                                    }}
                                >
                                    <option value="">Select attachment type to upload</option>
                                    <option value="Plans">Plans - Architectural or construction plans</option>
                                    <option value="PlansHSE">Plans HSE - Health, Safety, and Environment plans</option>
                                    <option value="UnitePrice">Unit Price Documents</option>
                                    <option value="BoqAtt">BOQ Attachment Documents</option>
                                    <option value="PrescriptionTechniques">Technical Specifications</option>
                                    <option value="DocumentsJuridiques">Legal Documents</option>
                                    <option value="Other">Other Documents</option>
                                </select>
                            </div>

                            {/* FilePond Uploader */}
                            {selectedAttachmentType && (
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Upload {selectedAttachmentType} Documents</span>
                                    </label>
                                    <div className="filepond-wrapper">
                                        <FileUploader
                                            allowMultiple={true}
                                            maxFiles={10}
                                            acceptedFileTypes={['.pdf', '.doc', '.docx', '.xls', '.xlsx']}
                                            labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
                                            credits={false}
                                            stylePanelLayout="compact"
                                            styleLoadIndicatorPosition="center bottom"
                                            styleProgressIndicatorPosition="right bottom"
                                            styleButtonRemoveItemPosition="left bottom"
                                            allowProcess={false}
                                            instantUpload={false}
                                            onupdatefiles={(files: FilePondFile[]) => {
                                                // Handle file updates
                                                const newAttachments = files.map(fileItem => ({
                                                    file: fileItem.file as File,
                                                    type: selectedAttachmentType
                                                }));
                                                
                                                // Update formData with new attachments for this type
                                                const otherAttachments = formData.attachments.filter(
                                                    att => att.type !== selectedAttachmentType
                                                );
                                                setFormData({
                                                    ...formData,
                                                    attachments: [...otherAttachments, ...newAttachments]
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Display uploaded attachments grouped by type */}
                            {Object.entries(
                                formData.attachments.reduce((acc, att) => {
                                    if (!acc[att.type]) acc[att.type] = [];
                                    acc[att.type].push(att);
                                    return acc;
                                }, {} as Record<string, typeof formData.attachments>)
                            ).map(([type, attachments]) => (
                                <div key={type} className="bg-base-200 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2">{type}</h4>
                                    <div className="space-y-2">
                                        {attachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-base-100 rounded">
                                                <span className="text-sm">{attachment.file.name}</span>
                                                <button
                                                    className="btn btn-sm btn-ghost text-error"
                                                    onClick={() => {
                                                        const newAttachments = formData.attachments.filter(
                                                            (att, i) => !(att.type === type && att.file.name === attachment.file.name)
                                                        );
                                                        setFormData({ ...formData, attachments: newAttachments });
                                                    }}
                                                >
                                                    <span className="iconify lucide--x size-4"></span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {currentStep === 5 && (
                    <div>
                        {/* Building Selection and Upload Button in same row */}
                        <div className="mb-6 flex items-center justify-between gap-4">
                            <select 
                                className="select select-bordered w-auto max-w-xs"
                                value={selectedBuildingForBOQ || ''}
                                onChange={(e) => setSelectedBuildingForBOQ(e.target.value)}
                            >
                                {formData.buildingIds.map(buildingId => {
                                    const building = selectedProjectBuildings.find(b => b.id === buildingId);
                                    return (
                                        <option key={buildingId} value={buildingId.toString()}>
                                            {building?.name}
                                        </option>
                                    );
                                })}
                            </select>
                            
                            <button
                                onClick={() => setIsImportingBOQ(true)}
                                className="btn btn-outline btn-sm"
                            >
                                <span className="iconify lucide--upload w-4 h-4"></span>
                                Import BOQ
                            </button>
                        </div>

                        {selectedBuildingForBOQ && (
                            <div>
                                {/* BOQ Items Table - Custom implementation with SAMTable design language */}
                                <div className="bg-base-100 rounded-xl border border-base-300 flex flex-col">
                                    <div className="overflow-x-auto">
                                        <table className="w-full table-auto bg-base-100">
                                            <thead className="bg-base-200">
                                                <tr>
                                                    <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">No.</th>
                                                    <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Description</th>
                                                    <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Cost Code</th>
                                                    <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Unit</th>
                                                    <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Quantity</th>
                                                    <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Unit Price</th>
                                                    <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider">Total Price</th>
                                                    <th className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 text-center text-xs sm:text-xs lg:text-xs font-medium text-base-content/70 uppercase tracking-wider w-24 sm:w-28">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-base-300">
                                                {(() => {
                                                    const buildingBOQ = formData.boqData.find(b => b.buildingId === parseInt(selectedBuildingForBOQ));
                                                    const items = buildingBOQ?.items || [];
                                                    
                                                    // Always show at least one empty row for new entries
                                                    const displayItems = [...items];
                                                    if (displayItems.length === 0 || displayItems[displayItems.length - 1].no !== '') {
                                                        displayItems.push(createEmptyBOQItem());
                                                    }
                                                    
                                                    return displayItems.map((item, index) => {
                                                        const isEmptyRow = item.no === '' && item.key === '' && item.costCode === '' && item.unite === '' && item.qte === 0 && item.pu === 0;
                                                        
                                                        return (
                                                            <tr key={item.id || index} className="bg-base-100 hover:bg-base-200">
                                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                                    <input
                                                                        id={`boq-input-${item.id}-no`}
                                                                        type="text"
                                                                        className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                        value={item.no}
                                                                        onChange={(e) => {
                                                                            if (isEmptyRow && e.target.value) {
                                                                                // Create new item when typing in empty row
                                                                                addNewBOQItem({ no: e.target.value }, 'no');
                                                                            } else if (!isEmptyRow) {
                                                                                updateBOQItem(index, 'no', e.target.value);
                                                                            }
                                                                        }}
                                                                        placeholder={isEmptyRow ? "Item no..." : ""}
                                                                    />
                                                                </td>
                                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                                    <input
                                                                        id={`boq-input-${item.id}-key`}
                                                                        type="text"
                                                                        className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                        value={item.key}
                                                                        onChange={(e) => {
                                                                            if (isEmptyRow && e.target.value) {
                                                                                addNewBOQItem({ key: e.target.value }, 'key');
                                                                            } else if (!isEmptyRow) {
                                                                                updateBOQItem(index, 'key', e.target.value);
                                                                            }
                                                                        }}
                                                                        placeholder={isEmptyRow ? "Description..." : ""}
                                                                    />
                                                                </td>
                                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                                    <input
                                                                        id={`boq-input-${item.id}-costCode`}
                                                                        type="text"
                                                                        className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                        value={item.costCode}
                                                                        onChange={(e) => {
                                                                            if (isEmptyRow && e.target.value) {
                                                                                addNewBOQItem({ costCode: e.target.value }, 'costCode');
                                                                            } else if (!isEmptyRow) {
                                                                                updateBOQItem(index, 'costCode', e.target.value);
                                                                            }
                                                                        }}
                                                                        placeholder={isEmptyRow ? "Cost code..." : ""}
                                                                    />
                                                                </td>
                                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                                    <input
                                                                        id={`boq-input-${item.id}-unite`}
                                                                        type="text"
                                                                        className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                        value={item.unite}
                                                                        onChange={(e) => {
                                                                            if (isEmptyRow && e.target.value) {
                                                                                addNewBOQItem({ unite: e.target.value }, 'unite');
                                                                            } else if (!isEmptyRow) {
                                                                                updateBOQItem(index, 'unite', e.target.value);
                                                                            }
                                                                        }}
                                                                        placeholder={isEmptyRow ? "Unit..." : ""}
                                                                    />
                                                                </td>
                                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                                    <input
                                                                        id={`boq-input-${item.id}-qte`}
                                                                        type="number"
                                                                        className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                        value={item.qte || ''}
                                                                        onChange={(e) => {
                                                                            const value = parseFloat(e.target.value) || 0;
                                                                            if (isEmptyRow && value > 0) {
                                                                                addNewBOQItem({ qte: value }, 'qte');
                                                                            } else if (!isEmptyRow) {
                                                                                updateBOQItem(index, 'qte', value);
                                                                            }
                                                                        }}
                                                                        placeholder={isEmptyRow ? "0" : ""}
                                                                        step="0.01"
                                                                    />
                                                                </td>
                                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm text-base-content text-center">
                                                                    <input
                                                                        id={`boq-input-${item.id}-pu`}
                                                                        type="number"
                                                                        className="w-full bg-transparent text-center text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1 py-0.5"
                                                                        value={item.pu || ''}
                                                                        onChange={(e) => {
                                                                            const value = parseFloat(e.target.value) || 0;
                                                                            if (isEmptyRow && value > 0) {
                                                                                addNewBOQItem({ pu: value }, 'pu');
                                                                            } else if (!isEmptyRow) {
                                                                                updateBOQItem(index, 'pu', value);
                                                                            }
                                                                        }}
                                                                        placeholder={isEmptyRow ? "0.00" : ""}
                                                                        step="0.01"
                                                                    />
                                                                </td>
                                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-medium text-base-content text-center">
                                                                    {isEmptyRow ? '0.00' : (item.totalPrice || item.qte * item.pu).toFixed(2)}
                                                                </td>
                                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-medium text-base-content w-24 sm:w-28 text-center">
                                                                    {!isEmptyRow && (
                                                                        <div className="inline-flex">
                                                                            <button
                                                                                onClick={() => deleteBOQItem(index)}
                                                                                className="btn btn-ghost btn-sm text-error/70 hover:bg-error/20"
                                                                                title="Delete item"
                                                                            >
                                                                                <span className="iconify lucide--trash size-4"></span>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                })()}
                                                
                                                {/* Total Row */}
                                                {(() => {
                                                    const buildingBOQ = formData.boqData.find(b => b.buildingId === parseInt(selectedBuildingForBOQ));
                                                    const items = buildingBOQ?.items || [];
                                                    
                                                    if (items.length > 0) {
                                                        const total = items.reduce((sum, item) => sum + (item.totalPrice || item.qte * item.pu), 0);
                                                        return (
                                                            <tr className="bg-base-200 border-t-2 border-base-300 font-bold text-base-content">
                                                                <td colSpan={6} className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-bold border-t-2 border-base-300 text-center">
                                                                    Total
                                                                </td>
                                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-bold border-t-2 border-base-300 text-center">
                                                                    {total.toFixed(2)}
                                                                </td>
                                                                <td className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 lg:py-3 text-xs sm:text-sm font-bold border-t-2 border-base-300 w-24 sm:w-28"></td>
                                                            </tr>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 6 && (
                    <div>
                        <div className="space-y-3">{/* Reduced space from space-y-4 to space-y-3 */}
                            <div className="bg-base-200 p-3 rounded">{/* Reduced padding */}
                                <h3 className="font-semibold mb-2">Project Information</h3>
                                <p>Project: {selectedProject?.name}</p>
                                <p>Buildings: {formData.buildingIds.map(id => 
                                    selectedProjectBuildings.find(b => b.id === id)?.name
                                ).join(', ')}</p>
                            </div>

                            <div className="bg-base-200 p-3 rounded">{/* Reduced padding */}
                                <h3 className="font-semibold mb-2">Subcontractor</h3>
                                <p>{selectedSubcontractor?.name || 'Not selected'}</p>
                            </div>

                            <div className="bg-base-200 p-3 rounded">{/* Reduced padding */}
                                <h3 className="font-semibold mb-2">Contract Details</h3>
                                <p>Type: {contracts.find(c => c.id === formData.contractId)?.templateName}</p>
                                <p>Currency: {currencies.find(c => c.id === formData.currencyId)?.name} ({currencies.find(c => c.id === formData.currencyId)?.currencies})</p>
                                <p>Contract Date: {formData.contractDate}</p>
                                <p>Completion Date: {formData.completionDate}</p>
                                {formData.advancePayment > 0 && <p>Advance Payment: {formData.advancePayment}</p>}
                                {formData.materialSupply > 0 && <p>Material Supply: {formData.materialSupply}</p>}
                            </div>

                            {formData.attachments.length > 0 && (
                                <div className="bg-base-200 p-3 rounded">{/* Reduced padding */}
                                    <h3 className="font-semibold mb-2">Attachments</h3>
                                    {formData.attachments.map((att, index) => (
                                        <p key={index}>{att.file.name} ({att.type})</p>
                                    ))}
                                </div>
                            )}

                            {/* BOQ Summary */}
                            {formData.boqData.length > 0 && (
                                <div className="bg-base-200 p-3 rounded">
                                    <h3 className="font-semibold mb-2">BOQ Summary</h3>
                                    {formData.boqData.map(buildingBOQ => {
                                        const buildingTotal = buildingBOQ.items.reduce((sum, item) => sum + (item.totalPrice || item.qte * item.pu), 0);
                                        
                                        if (buildingBOQ.items.length === 0) return null;
                                        
                                        return (
                                            <div key={buildingBOQ.buildingId} className="mb-2">
                                                <p className="font-medium">{buildingBOQ.buildingName}</p>
                                                <p className="text-sm text-base-content/70">
                                                    {buildingBOQ.items.length} items - Total: {buildingTotal.toFixed(2)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                    <div className="border-t pt-2 mt-2">
                                        <p className="font-semibold">
                                            Grand Total: {formData.boqData.reduce((sum, buildingBOQ) => 
                                                sum + buildingBOQ.items.reduce((itemSum, item) => itemSum + (item.totalPrice || item.qte * item.pu), 0), 0
                                            ).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Back Confirmation Dialog */}
            {showBackConfirmDialog && (
                <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[modal-fade_0.2s]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                                <span className="iconify lucide--alert-triangle w-6 h-6 text-warning" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-base-content">Unsaved Changes</h3>
                                <p className="text-sm text-base-content/60">Confirm navigation</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-base-content/80 mb-3">
                                Are you sure you want to leave? Any unsaved changes will be lost.
                            </p>
                            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                                <p className="text-sm text-warning-content">
                                    <span className="iconify lucide--info w-4 h-4 inline mr-1" />
                                    Your progress in this wizard will not be saved.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancelBack}
                                className="btn btn-ghost btn-sm px-6"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmBack}
                                className="btn btn-warning btn-sm px-6"
                            >
                                Leave Without Saving
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import BOQ Modal */}
            {isImportingBOQ && (
                <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[modal-fade_0.2s]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-base-content">Import BOQ</h3>
                            <button
                                onClick={() => setIsImportingBOQ(false)}
                                className="btn btn-sm btn-ghost"
                            >
                                <span className="iconify lucide--x w-4 h-4"></span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Select BOQ File</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="file-input file-input-bordered w-full"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            // Handle file import logic here
                                            console.log('Selected file:', file);
                                            toaster.info('BOQ import functionality will be implemented soon');
                                        }
                                    }}
                                />
                                <div className="label">
                                    <span className="label-text-alt">Supported formats: Excel (.xlsx, .xls), CSV</span>
                                </div>
                            </div>

                            <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                                <h4 className="font-semibold text-info-content mb-2">Expected Format:</h4>
                                <ul className="text-sm text-info-content/80 space-y-1">
                                    <li>• Column A: Item No.</li>
                                    <li>• Column B: Description/Key</li>
                                    <li>• Column C: Unit</li>
                                    <li>• Column D: Quantity</li>
                                    <li>• Column E: Unit Price</li>
                                </ul>
                            </div>

                            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                                <p className="text-sm text-warning-content">
                                    <span className="iconify lucide--alert-triangle w-4 h-4 inline mr-1" />
                                    Importing will replace existing BOQ items for this building.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => setIsImportingBOQ(false)}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    // Import logic will be implemented here
                                    toaster.info('BOQ import functionality will be implemented soon');
                                    setIsImportingBOQ(false);
                                }}
                                className="btn btn-primary"
                            >
                                Import BOQ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewSubcontractWizard;