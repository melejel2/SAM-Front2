import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import apiRequest from "@/api/api";
import { ipcApiService } from "@/api/services/ipc-api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import type { BoqIpcVM, ContractBuildingsVM, IpcTypeOption, IpcWizardFormData } from "@/types/ipc";
import { FINANCIAL_CONSTANTS } from "@/types/ipc";

// Additional Types for IPC Creation
interface Contract {
    id: number;
    contractNumber: string;
    projectName: string;
    subcontractorName: string;
    tradeName: string;
    totalAmount: number;
    status: string;
    buildings: ContractBuildingsVM[];
}

interface IPCWizardContextType {
    // State
    formData: IpcWizardFormData;
    currentStep: number;
    hasUnsavedChanges: boolean;
    loading: boolean;
    loadingContracts: boolean;

    // Data
    contracts: Contract[];
    selectedContract: Contract | null;
    ipcTypes: IpcTypeOption[];

    // Actions
    setFormData: (data: Partial<IpcWizardFormData>) => void;
    setCurrentStep: (step: number) => void;
    setHasUnsavedChanges: (hasChanges: boolean) => void;
    validateCurrentStep: () => boolean;
    goToNextStep: () => void;
    goToPreviousStep: () => void;
    loadContracts: (status?: number) => Promise<void>;
    selectContract: (contractId: number) => void;
    updateBOQProgress: (buildingId: number, boqId: number, actualQte: number) => void;
    calculateFinancials: () => void;
    handleSubmit: () => Promise<{ success: boolean; error?: string }>;
    loadIpcForEdit: (ipcId: number) => Promise<void>;
}

const IPCWizardContext = createContext<IPCWizardContextType | undefined>(undefined);

// Initial form data
const getInitialFormData = (): IpcWizardFormData => ({
    contractsDatasetId: 0,
    type: "",
    fromDate: "",
    toDate: "",
    dateIpc: new Date().toISOString().split("T")[0],
    advancePayment: 0,
    retentionPercentage: 10,
    advancePaymentPercentage: 0,
    penalty: 0,
    previousPenalty: 0,
    buildings: [],
    vos: [],
    labors: [],
    machines: [],
    materials: [],
});

// IPC Types
const IPC_TYPES: IpcTypeOption[] = [
    { value: "Provisoire / Interim", label: "Provisoire / Interim" },
    { value: "Final / Final", label: "Final / Final" },
    { value: "Rg / Retention", label: "Rg / Retention" },
    { value: "Avance / Advance Payment", label: "Avance / Advance Payment" },
];

export const IPCWizardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { authState } = useAuth();
    const { toaster } = useToast();
    const { getToken } = useAuth();

    // State
    const [formData, setFormDataState] = useState<IpcWizardFormData>(getInitialFormData());
    const [currentStep, setCurrentStep] = useState(1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingContracts, setLoadingContracts] = useState(false);

    // Data
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    // Form data setter with unsaved changes tracking
    const setFormData = useCallback((data: Partial<IpcWizardFormData>, markDirty: boolean = true) => {
        setFormDataState((prev) => {
            const newFormData = {
                ...prev,
                ...data,
                buildings: data.buildings !== undefined
                    ? (data.buildings || [])
                    : (prev.buildings || []),
                vos: (data as any).vos !== undefined ? ((data as any).vos || []) : ((prev as any).vos || []),
                labors: data.labors !== undefined ? (data.labors || []) : (prev.labors || []),
                machines: data.machines !== undefined ? (data.machines || []) : (prev.machines || []),
                materials: data.materials !== undefined ? (data.materials || []) : (prev.materials || []),
            };
            return newFormData;
        });
        if (markDirty) {
            setHasUnsavedChanges(true);
        }
    }, []);

    // Load IPC data for editing
    const loadIpcForEdit = useCallback(
        async (ipcId: number) => {
            setLoading(true);
            try {
                const token = getToken();
                if (!token) {
                    toaster.error("Authentication required");
                    return;
                }
                const response = await ipcApiService.getIpcForEdit(ipcId, token);
                if (response.success && response.data) {
                    const ipcData = response.data as any; // Treat as any to access potentially incorrect field names

                    // Map backend date fields and handle timezone issues
                    const mappedData: Partial<IpcWizardFormData> = {
                        ...ipcData,
                        fromDate: (ipcData.fromDate || ipcData.FromDate || ipcData.datefrom || "").split("T")[0],
                        toDate: (ipcData.toDate || ipcData.ToDate || ipcData.dateto || "").split("T")[0],
                        dateIpc: (ipcData.dateIpc || ipcData.DateOpc || ipcData.dateopc || "").split("T")[0],
                    };

                    setFormData(mappedData, false); // Don't mark as dirty when loading
                    setSelectedContract(contracts.find((c) => c.id === response.data?.contractsDatasetId) || null);
                    setHasUnsavedChanges(false);
                } else {
                    toaster.error(response.error?.message || "Failed to load IPC data for edit");
                }
            } catch (error) {
                console.error("Error loading IPC for edit:", error);
                toaster.error("Error loading IPC for edit");
            } finally {
                setLoading(false);
            }
        },
        [getToken, setFormData, setSelectedContract, setHasUnsavedChanges, toaster, contracts],
    );

    // Contract selection - don't auto-populate buildings for 4-step workflow
    const selectContract = useCallback(
        async (contractId: number) => {
            const contract = contracts.find((c) => c.id === contractId);
            if (contract) {
                setSelectedContract(contract);

                const token = getToken();
                if (!token) {
                    toaster.error("Authentication required");
                    return;
                }

                try {
                    // For new IPC, fetch initial contract data
                    const response = await ipcApiService.getContractDataForNewIpc(contractId, token);
                    if (response.success && response.data) {
                        // Update formData with the entire SaveIPCVM object including buildings
                        setFormData({
                            ...response.data,
                            contractsDatasetId: contractId, // Ensure contract ID is set
                        });
                    } else {
                        const errorMessageToDisplay = response.error?.message || "Failed to load initial IPC data";
                        toaster.error(errorMessageToDisplay);
                        setSelectedContract(null); // Deselect the contract on failure
                        setFormData(getInitialFormData()); // Reset form data on failure
                    }
                } catch (error) {
                    console.error("Error loading initial IPC data:", error);
                    toaster.error("Error loading initial IPC data");
                    setSelectedContract(null); // Deselect the contract on error
                    setFormData(getInitialFormData()); // Reset form data on error
                }
            }
        },
        [contracts, setFormData, getToken, toaster],
    );

    // Load contracts from API
    const loadContracts = useCallback(
        async (status: number = 2) => { // Changed from 4 (None) to 2 (Active)
            setLoadingContracts(true);
            try {
                const token = getToken();
                if (!token) {
                    toaster.error("Authentication required");
                    return;
                }

                const response = await apiRequest({
                    endpoint: `ContractsDatasets/GetContractsDatasetsList/${status}`,
                    method: "GET",
                    token: token,
                });

                // Normalize API response: support both array response and { isSuccess, data } shape
                const contractsRaw: any[] = Array.isArray(response)
                    ? response
                    : response && Array.isArray((response as any).data)
                      ? (response as any).data
                      : [];

                if (contractsRaw.length > 0) {
                    // Transform contracts data to include building information
                    const contractsWithBuildings = await Promise.all(
                        contractsRaw.map(async (contract: any) => {
                            try {
                                return {
                                    id: contract.id,
                                    contractNumber: contract.contractNumber || `Contract #${contract.id}`,
                                    projectName: contract.project?.name || contract.projectName || "Unknown Project",
                                    subcontractorName:
                                        contract.subcontractor?.companyName ||
                                        contract.subcontractorName ||
                                        "Unknown Subcontractor",
                                    tradeName: contract.trade?.name || contract.tradeName || "Unknown Trade",
                                    totalAmount: contract.amount || 0,
                                    status: contract.status || "Active",
                                    buildings: [],
                                };
                            } catch (error) {
                                // If building data fails, return contract without buildings
                                return {
                                    id: contract.id,
                                    contractNumber: contract.contractNumber || `Contract #${contract.id}`,
                                    projectName: contract.project?.name || "Unknown Project",
                                    subcontractorName: contract.subcontractor?.companyName || "Unknown Subcontractor",
                                    tradeName: contract.trade?.name || "Unknown Trade",
                                    totalAmount: contract.amount || 0,
                                    status: contract.status || "Active",
                                    buildings: [],
                                };
                            }
                        }),
                    );

                    setContracts(contractsWithBuildings);
                }
            } catch (error) {
                console.error("Error loading contracts:", error);
                toaster.error("Failed to load contracts");
            } finally {
                setLoadingContracts(false);
            }
        },
        [getToken, toaster],
    );

    // BOQ Progress Update
    const updateBOQProgress = useCallback(
        (buildingId: number, boqId: number, actualQte: number) => {
            setFormData({
                buildings: formData.buildings.map((building) => {
                    if (building.id === buildingId) {
                        return {
                            ...building,
                            boqsContract: building.boqsContract.map((boq: any) => {
                                if (boq.id === boqId) {
                                    const actualAmount = actualQte * boq.unitPrice;
                                    const cumulQte = boq.precedQte + actualQte;
                                    const cumulAmount = cumulQte * boq.unitPrice;
                                    const cumulPercent = boq.qte === 0 ? 0 : (cumulQte / boq.qte) * 100;

                                    return {
                                        ...boq,
                                        actualQte,
                                        actualAmount,
                                        cumulQte,
                                        cumulAmount,
                                        cumulPercent,
                                    };
                                }
                                return boq;
                            }),
                        };
                    }
                    return building;
                }),
            });
        },
        [formData.buildings, setFormData],
    );

    // Financial calculations
    const calculateFinancials = useCallback(() => {
        // Calculate total IPC amount based on BOQ progress
        const totalIPCAmount = formData.buildings.reduce((total, building) => {
            return (
                total +
                building.boqsContract.reduce((buildingTotal: number, boq: any) => {
                    return buildingTotal + boq.actualAmount;
                }, 0)
            );
        }, 0);

        // Calculate retention amount
        const retentionAmount = (totalIPCAmount * formData.retentionPercentage) / 100;

        // Calculate advance payment deduction
        const advanceDeduction = (totalIPCAmount * formData.advancePaymentPercentage) / 100;

        // Update form data with calculated values
        setFormData({
            advancePayment: advanceDeduction,
        });
    }, [formData, setFormData]);

    // Step validation for 4-step workflow
    const validateCurrentStep = useCallback((): boolean => {
        switch (currentStep) {
            case 1:
                return !!(formData.contractsDatasetId > 0 && formData.type && formData.dateIpc);
            case 2:
                // Simplified validation: Only require work period dates
                // Buildings and BOQ progress are optional (allows empty IPC creation)
                return !!(formData.fromDate && formData.toDate);
            case 3:
                // Deductions - Financial calculations are automatic
                return true;
            case 4:
                // Preview & Save - Ready to submit
                return true;
            default:
                return false;
        }
    }, [currentStep, formData]);

    // Navigation for 4-step workflow
    const goToNextStep = useCallback(() => {
        if (currentStep < 4 && validateCurrentStep()) {
            setCurrentStep((prev) => prev + 1);
            if (currentStep === 2) {
                calculateFinancials(); // Auto-calculate when moving to deductions step
            }
        }
    }, [currentStep, validateCurrentStep, calculateFinancials]);

    const goToPreviousStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    }, [currentStep]);

    // Submit IPC
    const handleSubmit = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            if (!token) {
                throw new Error("Authentication required");
            }

            let response;
            const formDataId = (formData as any).id;
            if (!formDataId || formDataId === 0) {
                // New IPC
                response = await ipcApiService.createIpc(formData as any, token);
            } else {
                // Existing IPC
                response = await ipcApiService.updateIpc(formData as any, token);
            }

            if (response.success) {
                setHasUnsavedChanges(false);
                return { success: true };
            } else {
                return { success: false, error: response.error?.message || "Failed to save IPC" };
            }
        } catch (error) {
            console.error("Error saving IPC:", error);
            return { success: false, error: "An unexpected error occurred" };
        } finally {
            setLoading(false);
        }
    }, [formData, getToken]);

    // Load contracts on mount - empty dependency array to run only once
    useEffect(() => {
        loadContracts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // NOTE: loadIpcForEdit is called explicitly by Edit page (edit/index.tsx line 50)
    // Removed redundant useEffect here to prevent infinite loop

    // Memoize expensive calculations
    const financialSummary = useMemo(() => {
        const safeFormDataBuildings = formData.buildings || [];
        const totalIPCAmount = safeFormDataBuildings.reduce((total, building) => {
            const buildingBoqs = building.boqsContract || [];
            return (
                total +
                buildingBoqs.reduce((buildingTotal, boq) => {
                    return buildingTotal + (boq.actualAmount || 0);
                }, 0)
            );
        }, 0);

        const retentionAmount = (totalIPCAmount * formData.retentionPercentage) / 100;
        const advanceDeduction = (totalIPCAmount * formData.advancePaymentPercentage) / 100;

        return {
            totalAmount: totalIPCAmount,
            retentionAmount,
            advanceDeduction,
            netAmount: totalIPCAmount - retentionAmount - advanceDeduction - formData.penalty,
        };
    }, [formData.buildings, formData.retentionPercentage, formData.advancePaymentPercentage, formData.penalty]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue: IPCWizardContextType = useMemo(
        () => ({
            // State
            formData,
            currentStep,
            hasUnsavedChanges,
            loading,
            loadingContracts,

            // Data
            contracts,
            selectedContract,
            ipcTypes: IPC_TYPES,

            // Actions
            setFormData,
            setCurrentStep,
            setHasUnsavedChanges,
            validateCurrentStep,
            goToNextStep,
            goToPreviousStep,
            loadContracts,
            selectContract,
            updateBOQProgress,
            calculateFinancials,
            handleSubmit,
            loadIpcForEdit,
        }),
        [
            // Dependencies for memoization
            formData,
            currentStep,
            hasUnsavedChanges,
            loading,
            loadingContracts,
            contracts,
            selectedContract,
            setFormData,
            setCurrentStep,
            setHasUnsavedChanges,
            validateCurrentStep,
            goToNextStep,
            goToPreviousStep,
            loadContracts,
            selectContract,
            updateBOQProgress,
            calculateFinancials,
            handleSubmit,
            loadIpcForEdit,
        ],
    );

    return <IPCWizardContext.Provider value={contextValue}>{children}</IPCWizardContext.Provider>;
};

export const useIPCWizardContext = (): IPCWizardContextType => {
    const context = useContext(IPCWizardContext);
    if (!context) {
        throw new Error("useIPCWizardContext must be used within an IPCWizardProvider");
    }
    return context;
};
