import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

const useCostCodes = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [uploadLoading, setUploadLoading] = useState<boolean>(false);

    const { getToken } = useAuth();
    const { toaster } = useToast();

    const token = getToken();

    const columns = {
        en: "EN",
        fr: "FR",
        code: "Code",
    };

    const inputFields = [
        {
            name: "en",
            label: "EN",
            type: "text",
            required: true,
        },
        {
            name: "fr",
            label: "FR",
            type: "text",
            required: true,
        },
        {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
        },
    ];

    const getCostCodes = async () => {
        setLoading(true);

        try {
            const data = await apiRequest({
                endpoint: "CostCode/GetCodeCostLibrary",
                method: "GET",
                token: token ?? "",
            });
            if (data) {
                setTableData(data);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const uploadCostCodes = async (file: File) => {
        setUploadLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await apiRequest({
                endpoint: "CostCode/UploadCostCode",
                method: "POST",
                token: token ?? "",
                body: formData,
            });

            if (result && typeof result === "object" && "success" in result) {
                if (result.success) {
                    toaster.success("Cost codes uploaded successfully");
                    await getCostCodes();
                } else {
                    toaster.error(result.message || "Upload failed");
                }
            } else {
                toaster.success("Cost codes uploaded successfully");
                await getCostCodes();
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to upload cost codes");
        } finally {
            setUploadLoading(false);
        }
    };

    return {
        columns,
        tableData,
        inputFields,
        loading,
        uploadLoading,
        getCostCodes,
        uploadCostCodes,
    };
};

export default useCostCodes;
