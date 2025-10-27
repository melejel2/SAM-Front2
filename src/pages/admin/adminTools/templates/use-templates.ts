import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";

const useTemplates = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [contractData, setContractData] = useState<any[]>([]);
    const [voData, setVoData] = useState<any[]>([]);
    const [terminateData, setTerminateData] = useState<any[]>([]);
    const [dischargeRGData, setDischargeRGData] = useState<any[]>([]);
    const [dischargeFinalData, setDischargeFinalData] = useState<any[]>([]);

    const { getToken } = useAuth();

    const token = getToken();

    // Format Type column text (Lump Sum, Remeasured, Cost Plus)
    const formatTypeText = (type: string) => {
        try {
            const typeLower = type?.toLowerCase() || '';

            if (typeLower.includes('remeasured')) {
                return 'Remeasured';
            } else if (typeLower.includes('lump sum') || typeLower.includes('lump-sum') || typeLower.includes('lumpsum')) {
                return 'Lump Sum';
            } else if (typeLower.includes('cost plus') || typeLower.includes('cost-plus') || typeLower.includes('costplus')) {
                return 'Cost Plus';
            } else {
                return type || 'Remeasured';
            }
        } catch (error) {
            console.error('Error in formatTypeText:', error, 'type:', type);
            return type || 'Error';
        }
    };

    // Format Contract Type column text (Supply Apply, Apply)
    const formatContractTypeText = (contractType: string) => {
        try {
            const typeLower = contractType?.toLowerCase() || '';

            if (typeLower.includes('supply apply') || typeLower.includes('supply-apply') || typeLower.includes('supplyapply')) {
                return 'Supply Apply';
            } else if (typeLower.includes('apply')) {
                return 'Apply';
            } else {
                return contractType || 'Apply';
            }
        } catch (error) {
            console.error('Error in formatContractTypeText:', error, 'contractType:', contractType);
            return contractType || 'Error';
        }
    };

    const contractColumns = {
        code: "Code",
        templateName: "Template Name",
        type: "Category",
        contractType: "Type",
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
            label: "Category",
            type: "select",
            required: true,
            options: ["Supply Apply", "Apply"],
        },
        {
            name: "contractType",
            label: "Type",
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
            
            // Process contract data to format both type and contract type as plain text
            const processedContractData = (contractResponse || []).map((contract: any) => ({
                ...contract,
                type: formatTypeText(contract.type || ''),
                contractType: formatContractTypeText(contract.contractType || '')
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

    const otherTemplatesData = [
        ...ensureArray(terminateData),
        ...ensureArray(dischargeRGData),
        ...ensureArray(dischargeFinalData)
    ];

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