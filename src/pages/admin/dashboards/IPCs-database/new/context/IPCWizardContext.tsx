import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";
import { ipcApiService } from "@/api/services/ipc-api";
import type { IpcWizardFormData, ContractBuildingsVM, IpcTypeOption, BoqIpcVM } from "@/types/ipc";
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
    loadContracts: () => Promise<void>;
    selectContract: (contractId: number) => void;
    updateBOQProgress: (buildingId: number, boqId: number, actualQte: number) => void;
    calculateFinancials: () => void;
    handleSubmit: () => Promise<{ success: boolean; error?: string }>;
}

const IPCWizardContext = createContext<IPCWizardContextType | undefined>(undefined);

// Initial form data
const getInitialFormData = (): IpcWizardFormData => ({
    contractsDatasetId: 0,
    type: "Provisoire / Interim",
    fromDate: "",
    toDate: "",
    dateIpc: new Date().toISOString().split('T')[0],
    advancePayment: 0,
    retentionPercentage: 10,
    advancePaymentPercentage: 0,
    penalty: 0,
    previousPenalty: 0,
    buildings: [],
    labors: [],
    machines: [],
    materials: []
});

// IPC Types
const IPC_TYPES: IpcTypeOption[] = [
    { value: "Provisoire / Interim", label: "Provisoire / Interim" },
    { value: "Final / Final", label: "Final / Final" },
    { value: "Rg / Retention", label: "Rg / Retention" },
    { value: "Avance / Advance Payment", label: "Avance / Advance Payment" }
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
    
    // Load contracts from API
    const loadContracts = useCallback(async () => {
        setLoadingContracts(true);
        try {
            const token = getToken();
            if (!token) {
                toaster.error("Authentication required");
                return;
            }

            const response = await apiRequest({
                endpoint: "ContractsDatasets/GetContractsDatasetsList/0",
                method: "GET",
                token: token
            });
            
            console.log("🔍 Contract API Response:", response);
            
            if (response.isSuccess && response.data) {
                // Transform contracts data to include building information
                const contractsWithBuildings = await Promise.all(
                    response.data.map(async (contract: any) => {
                        try {
                            // Load building data for each contract using IPC API
                            const buildingResponse = await apiRequest({
                                endpoint: `Ipc/GetContractBuildings/${contract.id}`,
                                method: "GET",
                                token: token
                            });
                            
                            return {
                                id: contract.id,
                                contractNumber: contract.contractNumber || `Contract #${contract.id}`,
                                projectName: contract.project?.name || contract.projectName || 'Unknown Project',
                                subcontractorName: contract.subcontractor?.companyName || contract.subcontractorName || 'Unknown Subcontractor',
                                tradeName: contract.trade?.name || contract.tradeName || 'Unknown Trade',
                                totalAmount: contract.amount || 0,
                                status: contract.status || 'Active',
                                buildings: (buildingResponse && Array.isArray(buildingResponse)) ? buildingResponse : 
                                          (buildingResponse?.data && Array.isArray(buildingResponse.data)) ? buildingResponse.data : []
                            };
                        } catch (error) {
                            // If building data fails, return contract without buildings
                            return {
                                id: contract.id,
                                contractNumber: contract.contractNumber || `Contract #${contract.id}`,
                                projectName: contract.project?.name || 'Unknown Project',
                                subcontractorName: contract.subcontractor?.companyName || 'Unknown Subcontractor',
                                tradeName: contract.trade?.name || 'Unknown Trade',
                                totalAmount: contract.amount || 0,
                                status: contract.status || 'Active',
                                buildings: []
                            };
                        }
                    })
                );
                
                setContracts(contractsWithBuildings);
            }
        } catch (error) {
            console.error('Error loading contracts:', error);
            toaster.error("Failed to load contracts");
        } finally {
            setLoadingContracts(false);
        }
    }, [getToken, toaster]);
    
    // Load contracts on mount - empty dependency array to run only once
    useEffect(() => {
        loadContracts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Form data setter with unsaved changes tracking
    const setFormData = useCallback((data: Partial<IpcWizardFormData>) => {
        setFormDataState(prev => ({ ...prev, ...data }));
        setHasUnsavedChanges(true);
    }, []);
    
    // Contract selection - don't auto-populate buildings for 4-step workflow
    const selectContract = useCallback((contractId: number) => {
        const contract = contracts.find(c => c.id === contractId);
        if (contract) {
            setSelectedContract(contract);
            setFormData({
                contractsDatasetId: contractId,
                buildings: [] // Start with empty buildings array
            });
        }
    }, [contracts, setFormData]);
    
    // BOQ Progress Update
    const updateBOQProgress = useCallback((buildingId: number, boqId: number, actualQte: number) => {
        setFormData({
            buildings: formData.buildings.map(building => {
                if (building.id === buildingId) {
                    return {
                        ...building,
                        boqs: building.boqs.map(boq => {
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
                                    cumulPercent
                                };
                            }
                            return boq;
                        })
                    };
                }
                return building;
            })
        });
    }, [formData.buildings, setFormData]);
    
    // Financial calculations
    const calculateFinancials = useCallback(() => {
        // Calculate total IPC amount based on BOQ progress
        const totalIPCAmount = formData.buildings.reduce((total, building) => {
            return total + building.boqs.reduce((buildingTotal, boq) => {
                return buildingTotal + boq.actualAmount;
            }, 0);
        }, 0);
        
        // Calculate retention amount
        const retentionAmount = (totalIPCAmount * formData.retentionPercentage) / 100;
        
        // Calculate advance payment deduction
        const advanceDeduction = (totalIPCAmount * formData.advancePaymentPercentage) / 100;
        
        // Update form data with calculated values
        setFormData({
            advancePayment: advanceDeduction
        });
    }, [formData, setFormData]);
    
    // Step validation for 4-step workflow
    const validateCurrentStep = useCallback((): boolean => {
        switch (currentStep) {
            case 1:
                // Contract Selection + IPC Type
                return !!(formData.contractsDatasetId > 0 && formData.type && formData.dateIpc);
            case 2:
                // Period + Building + BOQ Progress
                return !!(formData.fromDate && formData.toDate &&
                       formData.buildings.length > 0 &&
                       formData.buildings.some(building =>
                           building.boqs.some(boq => (boq.actualQte || 0) > 0)
                       ));
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
            setCurrentStep(prev => prev + 1);
            if (currentStep === 2) {
                calculateFinancials(); // Auto-calculate when moving to deductions step
            }
        }
    }, [currentStep, validateCurrentStep, calculateFinancials]);
    
    const goToPreviousStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);
    
    // Submit IPC
    const handleSubmit = useCallback(async () => {
        setLoading(true);
        try {
            const ipcData = {
                contractsDatasetId: formData.contractsDatasetId,
                type: formData.type,
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                dateIpc: formData.dateIpc,
                buildings: formData.buildings
            };
            
            const token = getToken();
            if (!token) {
                throw new Error("Authentication required");
            }
            
            const response = await ipcApiService.createIpc(ipcData, token);
            
            if (response.success) {
                setHasUnsavedChanges(false);
                return { success: true };
            } else {
                return { success: false, error: response.error || "Failed to create IPC" };
            }
        } catch (error) {
            console.error('Error creating IPC:', error);
            return { success: false, error: "An unexpected error occurred" };
        } finally {
            setLoading(false);
        }
    }, [formData, getToken]);
    
    // Memoize expensive calculations
    const financialSummary = useMemo(() => {
        const totalIPCAmount = formData.buildings.reduce((total, building) => {
            return total + building.boqs.reduce((buildingTotal, boq) => {
                return buildingTotal + (boq.actualAmount || 0);
            }, 0);
        }, 0);
        
        const retentionAmount = (totalIPCAmount * formData.retentionPercentage) / 100;
        const advanceDeduction = (totalIPCAmount * formData.advancePaymentPercentage) / 100;
        
        return {
            totalAmount: totalIPCAmount,
            retentionAmount,
            advanceDeduction,
            netAmount: totalIPCAmount - retentionAmount - advanceDeduction - formData.penalty
        };
    }, [formData.buildings, formData.retentionPercentage, formData.advancePaymentPercentage, formData.penalty]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue: IPCWizardContextType = useMemo(() => ({
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
        handleSubmit
    }), [
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
        handleSubmit
    ]);
    
    return (
        <IPCWizardContext.Provider value={contextValue}>
            {children}
        </IPCWizardContext.Provider>
    );
};

export const useIPCWizardContext = (): IPCWizardContextType => {
    const context = useContext(IPCWizardContext);
    if (!context) {
        throw new Error('useIPCWizardContext must be used within an IPCWizardProvider');
    }
    return context;
};
