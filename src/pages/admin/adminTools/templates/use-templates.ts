import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useTemplates = () => {
    console.log('useTemplates hook called');
    
    const [loading, setLoading] = useState<boolean>(false);
    const [contractData, setContractData] = useState<any[]>([]);
    const [voData, setVoData] = useState<any[]>([]);
    const [terminateData, setTerminateData] = useState<any[]>([]);
    const [dischargeRGData, setDischargeRGData] = useState<any[]>([]);
    const [dischargeFinalData, setDischargeFinalData] = useState<any[]>([]);

    const { getToken } = useAuth();

    const token = getToken();

    // Badge function for Type column (Lump Sum, Remeasured, Cost Plus)
    const formatTypeBadge = (type: string) => {
        try {
            const typeLower = type?.toLowerCase() || '';
            let badgeClass = '';
            let displayText = type;

        if (typeLower.includes('remeasured')) {
            badgeClass = 'badge-contract-remeasured';
            displayText = 'Remeasured';
        } else if (typeLower.includes('lump sum') || typeLower.includes('lump-sum') || typeLower.includes('lumpsum')) {
            badgeClass = 'badge-contract-lump-sum';
            displayText = 'Lump Sum';
        } else if (typeLower.includes('cost plus') || typeLower.includes('cost-plus') || typeLower.includes('costplus')) {
            badgeClass = 'badge-contract-cost-plus';
            displayText = 'Cost Plus';
        } else {
            badgeClass = 'badge-contract-remeasured';
            displayText = type || 'Remeasured';
        }

        return `<span class="badge badge-sm ${badgeClass} font-medium">${displayText}</span>`;
        } catch (error) {
            console.error('Error in formatTypeBadge:', error, 'type:', type);
            return `<span class="badge badge-sm badge-error font-medium">${type || 'Error'}</span>`;
        }
    };

    // Badge function for Contract Type column (Supply Apply, Apply)
    const formatContractTypeBadge = (contractType: string) => {
        try {
            const typeLower = contractType?.toLowerCase() || '';
            let badgeClass = '';
            let displayText = contractType;

        if (typeLower.includes('supply apply') || typeLower.includes('supply-apply') || typeLower.includes('supplyapply')) {
            badgeClass = 'badge-contract-supply-apply';
            displayText = 'Supply Apply';
        } else if (typeLower.includes('apply')) {
            badgeClass = 'badge-contract-apply';
            displayText = 'Apply';
        } else {
            badgeClass = 'badge-contract-apply';
            displayText = contractType || 'Apply';
        }

        return `<span class="badge badge-sm ${badgeClass} font-medium">${displayText}</span>`;
        } catch (error) {
            console.error('Error in formatContractTypeBadge:', error, 'contractType:', contractType);
            return `<span class="badge badge-sm badge-error font-medium">${contractType || 'Error'}</span>`;
        }
    };

    const contractColumns = {
        code: "Code",
        templateName: "Template Name",
        type: "Type",
        contractType: "Contract Type",
        language: "Language",
    };

    const voColumns = {
        code: "Code",
        name: "Template Name",
        type: "Type",
        language: "Language",
    };

    const otherColumns = {
        code: "Code",
        name: "Template Name",
        type: "Type",
        language: "Language",
    };

    const contractInputFields = [
        {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
        },
        {
            name: "templateName",
            label: "Template Name",
            type: "text",
            required: true,
        },
        {
            name: "type",
            label: "Type",
            type: "select",
            required: true,
            options: ["Supply Apply", "Apply"],
        },
        {
            name: "contractType",
            label: "Contract Type",
            type: "select",
            required: true,
            options: ["Remeasured", "Lump Sum", "Cost Plus"],
        },
        {
            name: "language",
            label: "Language",
            type: "select",
            required: true,
            options: ["EN", "FR"],
        },
        {
            name: "wordFile",
            label: "Upload Template File",
            type: "file",
            required: true,
        },
    ];

    const voInputFields = [
        {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
        },
        {
            name: "name",
            label: "Template Name",
            type: "text",
            required: true,
        },
        {
            name: "type",
            label: "Type",
            type: "hidden",
            value: "0",
            required: true,
        },
        {
            name: "language",
            label: "Language",
            type: "select",
            required: true,
            options: ["EN", "FR"],
        },
        {
            name: "wordFile",
            label: "Upload Template File",
            type: "file",
            required: true,
        },
    ];

    const otherInputFields = [
        {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
        },
        {
            name: "name",
            label: "Template Name",
            type: "text",
            required: true,
        },
        {
            name: "type",
            label: "Template Type",
            type: "select",
            required: true,
            options: ["RG (Discharge)", "Terminate", "Final (Discharge)"],
        },
        {
            name: "language",
            label: "Language",
            type: "select",
            required: true,
            options: ["EN", "FR"],
        },
        {
            name: "wordFile",
            label: "Upload Template File",
            type: "file",
            required: true,
        },
    ];

    const getTemplates = async () => {
        setLoading(true);

        try {
            const [contractResponse, voResponse, rgResponse, terminateResponse, finalResponse] = await Promise.all([
                apiRequest({ 
                    endpoint: "Templates/GetContracts", 
                    method: "GET", 
                    token: token ?? "" 
                }),
                apiRequest({ 
                    endpoint: "Templates/GetVOContracts?type=0", 
                    method: "GET", 
                    token: token ?? "" 
                }),
                apiRequest({ 
                    endpoint: "Templates/GetVOContracts?type=1", 
                    method: "GET", 
                    token: token ?? "" 
                }),
                apiRequest({ 
                    endpoint: "Templates/GetVOContracts?type=2", 
                    method: "GET", 
                    token: token ?? "" 
                }),
                apiRequest({ 
                    endpoint: "Templates/GetVOContracts?type=3", 
                    method: "GET", 
                    token: token ?? "" 
                })
            ]);
            
            console.log('API Responses:', { 
                contractResponse, 
                voResponse, 
                rgResponse, 
                terminateResponse, 
                finalResponse 
            });
            
            console.log('Contract Response Detail:', contractResponse);
            console.log('Contract Response Length:', contractResponse?.length);
            console.log('Contract Response Type:', typeof contractResponse);
            console.log('Contract Response Array?', Array.isArray(contractResponse));
            
            console.log('RG Response Detail:', rgResponse);
            console.log('RG Response Type:', typeof rgResponse);
            console.log('RG Response Array?', Array.isArray(rgResponse));
            
            console.log('Terminate Response Detail:', terminateResponse);
            console.log('Terminate Response Type:', typeof terminateResponse);
            console.log('Terminate Response Array?', Array.isArray(terminateResponse));
            
            console.log('Final Response Detail:', finalResponse);
            console.log('Final Response Type:', typeof finalResponse);
            console.log('Final Response Array?', Array.isArray(finalResponse));
            
            // Process contract data to format both type and contract type as badges
            const processedContractData = (contractResponse || []).map((contract: any) => ({
                ...contract,
                type: formatTypeBadge(contract.type || ''),
                contractType: formatContractTypeBadge(contract.contractType || '')
            }));
            setContractData(processedContractData);
            setVoData(Array.isArray(voResponse) ? voResponse : []);
            setTerminateData(Array.isArray(terminateResponse) ? terminateResponse : []);
            setDischargeRGData(Array.isArray(rgResponse) ? rgResponse : []);
            setDischargeFinalData(Array.isArray(finalResponse) ? finalResponse : []);
        } catch (error) {
            console.error('Error fetching templates:', error);
            setContractData([]);
            setVoData([]);
            setTerminateData([]);
            setDischargeRGData([]);
            setDischargeFinalData([]);
        } finally {
            setLoading(false);
        }
    };

    // Combine other templates data with proper array validation
    const ensureArray = (data: any) => Array.isArray(data) ? data : [];
    
    console.log('Other Templates Data Components:', {
        terminateData: terminateData,
        dischargeRGData: dischargeRGData,
        dischargeFinalData: dischargeFinalData
    });
    
    const otherTemplatesData = [
        ...ensureArray(terminateData),
        ...ensureArray(dischargeRGData),
        ...ensureArray(dischargeFinalData)
    ];
    
    console.log('Combined Other Templates Data:', otherTemplatesData);
    console.log('Other Templates Data Length:', otherTemplatesData.length);

    return {
        contractColumns,
        voColumns,
        otherColumns,
        contractData,
        voData,
        otherTemplatesData,
        contractInputFields,
        voInputFields,
        otherInputFields,
        loading,
        getTemplates,
    };
};

export default useTemplates;