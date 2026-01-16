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

    // Check if a value is a Syncfusion document object (has width/height/body/sections keys)
    const isSyncfusionDocument = (val: any): boolean => {
        if (!val || typeof val !== 'object' || Array.isArray(val)) {
            return false;
        }
        return ('body' in val || 'sections' in val || ('width' in val && 'height' in val));
    };

    // Safely convert API response to array, filtering out Syncfusion document objects
    const safeApiArray = (response: any): any[] => {
        // Handle null/undefined
        if (!response) {
            return [];
        }
        // Reject Syncfusion document objects at the response level
        if (isSyncfusionDocument(response)) {
            console.warn('API returned Syncfusion document object instead of array, converting to empty array');
            return [];
        }
        // Ensure it's an array
        if (!Array.isArray(response)) {
            console.warn('API returned non-array:', typeof response);
            return [];
        }
        // Filter out any Syncfusion document objects from within the array
        return response.filter((item: any) => !isSyncfusionDocument(item));
    };

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

    // Format VO type numeric value to display text
    const formatVoTypeText = (type: any): string => {
        // Handle objects - convert to string representation
        if (type && typeof type === 'object') {
            return 'VO';
        }
        const typeStr = String(type || '0');
        switch (typeStr) {
            case '0': return 'VO';
            case '1': return 'RG (Discharge)';
            case '2': return 'Terminate';
            case '3': return 'Final (Discharge)';
            default: return typeStr;
        }
    };

    // Sanitize a single value to ensure it's a primitive (string/number/boolean/null)
    const sanitizeValue = (val: any): string | number | boolean | null => {
        if (val === null || val === undefined) {
            return null;
        }
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            return val;
        }
        if (Array.isArray(val)) {
            // Convert arrays to comma-separated strings of primitives only
            return val
                .map(v => (typeof v === 'string' || typeof v === 'number') ? v : '')
                .filter(v => v !== '')
                .join(', ');
        }
        if (typeof val === 'object') {
            // Skip Syncfusion document objects using the helper
            if (isSyncfusionDocument(val)) {
                return '';
            }
            // Try to extract meaningful primitive value
            if ('name' in val && typeof val.name === 'string') {
                return val.name;
            }
            if ('value' in val) {
                // Recursively sanitize the value property
                return sanitizeValue(val.value);
            }
            if ('label' in val && typeof val.label === 'string') {
                return val.label;
            }
            // Default: skip complex objects
            return '';
        }
        // Fallback: convert to string
        return String(val);
    };

    // Sanitize template data to ensure all values are primitives (strings/numbers)
    const sanitizeTemplateData = (data: any[]): any[] => {
        // Use safeApiArray to handle Syncfusion documents and ensure array
        const safeData = safeApiArray(data);
        return safeData.map((item: any) => {
            if (!item || typeof item !== 'object') {
                return item;
            }
            // Skip Syncfusion document objects entirely
            if (isSyncfusionDocument(item)) {
                return null;
            }
            const sanitized: any = {};
            for (const [key, value] of Object.entries(item)) {
                sanitized[key] = sanitizeValue(value);
            }
            return sanitized;
        }).filter(Boolean); // Remove any null items
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
            
            // Use safeApiArray to handle Syncfusion document objects and ensure arrays
            const safeContractResponse = safeApiArray(contractResponse);
            const safeVoResponse = safeApiArray(voResponse);
            const safeRgResponse = safeApiArray(rgResponse);
            const safeTerminateResponse = safeApiArray(terminateResponse);
            const safeFinalResponse = safeApiArray(finalResponse);

            // Process contract data to format both type and contract type as plain text
            const processedContractData = safeContractResponse.map((contract: any) => ({
                ...contract,
                type: formatTypeText(contract.type || ''),
                contractType: formatContractTypeText(contract.contractType || '')
            }));
            setContractData(sanitizeTemplateData(processedContractData));

            // Process VO data with type formatting and sanitization
            const processedVoData = safeVoResponse.map((vo: any) => ({
                ...vo,
                type: formatVoTypeText(vo.type)
            }));
            setVoData(sanitizeTemplateData(processedVoData));

            // Process other template data with type formatting and sanitization
            const processedTerminateData = safeTerminateResponse.map((t: any) => ({
                ...t,
                type: formatVoTypeText(t.type)
            }));
            const processedRgData = safeRgResponse.map((t: any) => ({
                ...t,
                type: formatVoTypeText(t.type)
            }));
            const processedFinalData = safeFinalResponse.map((t: any) => ({
                ...t,
                type: formatVoTypeText(t.type)
            }));

            setTerminateData(sanitizeTemplateData(processedTerminateData));
            setDischargeRGData(sanitizeTemplateData(processedRgData));
            setDischargeFinalData(sanitizeTemplateData(processedFinalData));
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

    // Combine other templates data with proper array validation (reusing safeApiArray for consistency)
    const otherTemplatesData = [
        ...safeApiArray(terminateData),
        ...safeApiArray(dischargeRGData),
        ...safeApiArray(dischargeFinalData)
    ];

    /**
     * Get template document in SFDT format for Document Editor
     * @param id Template ID
     * @param isVo True for VO/Other templates, false for contract templates
     * @returns SFDT JSON string for Syncfusion Document Editor
     */
    const getTemplateSfdt = async (id: number, isVo: boolean): Promise<string> => {
        try {
            const response = await apiRequest({
                endpoint: `Templates/GetTemplateSfdt/${id}?isVo=${isVo}`,
                method: "GET",
                token: token ?? "",
                responseType: "json",
            });

            // Check for error response
            if (response && typeof response === 'object' && 'success' in response && !response.success) {
                throw new Error((response as any).message || 'Failed to load SFDT content');
            }

            // SFDT needs to be a JSON string for documentEditor.open()
            // If the response is already an object (parsed by apiRequest), stringify it
            if (typeof response === 'object') {
                return JSON.stringify(response);
            }

            return response as string;
        } catch (error) {
            console.error("Get template SFDT API Error:", error);
            throw error;
        }
    };

    /**
     * Save edited template document from SFDT format
     * @param id Template ID
     * @param isVo True for VO/Other templates, false for contract templates
     * @param sfdtContent SFDT JSON string from Document Editor
     */
    const saveTemplateFromSfdt = async (
        id: number,
        isVo: boolean,
        sfdtContent: string,
    ): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            const response = await apiRequest({
                endpoint: `Templates/SaveTemplateFromSfdt/${id}?isVo=${isVo}`,
                method: "POST",
                token: token ?? "",
                body: sfdtContent,
                headers: {
                    "Content-Type": "application/json",
                },
            });

            return response as { success: boolean; message?: string; error?: string };
        } catch (error) {
            console.error("Save template from SFDT API Error:", error);
            throw error;
        }
    };

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
        getTemplateSfdt,
        saveTemplateFromSfdt,
    };
};

export default useTemplates;