import { useEffect } from "react";
import SAMTable from "@/components/Table";
import useToast from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";
import apiRequest from "@/api/api";
import useTerminatedContracts from "./hooks/use-terminated-contracts";

interface TerminatedContractsProps {
    selectedProject: string;
}

const TerminatedContracts: React.FC<TerminatedContractsProps> = ({ selectedProject }) => {
    const { terminatedColumns, terminatedContractsData, loading, getTerminatedContracts } = useTerminatedContracts();
    const { toaster } = useToast();
    const { getToken } = useAuth();

    useEffect(() => {
        getTerminatedContracts();
    }, [getTerminatedContracts]);

    const filteredTerminatedData = terminatedContractsData.filter((contract: any) =>
        selectedProject === "All Projects" || contract.projectName === selectedProject
    );

    const handleExportTerminate = async (row: any) => {
        try {
            const response = await apiRequest({
                endpoint: `ContractsDatasets/ExportTerminateFile/${row.id}`,
                method: "GET",
                responseType: "blob",
                token: getToken() ?? ""
            });

            if (response instanceof Blob) {
                const contractRef = row.contractNumber || row.id;
                const fileName = `termination-${contractRef}-${row.projectName || 'document'}.docx`;
                const url = window.URL.createObjectURL(response);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toaster.success("Termination letter downloaded successfully");
            } else {
                toaster.error("Failed to download termination letter");
            }
        } catch (error: any) {
            if (error?.response?.status === 404) {
                toaster.error("Termination letter has not been generated yet. Please terminate the contract first.");
            } else {
                toaster.error("Failed to download termination letter");
            }
        }
    };

    return (
        <SAMTable
            columns={terminatedColumns}
            tableData={filteredTerminatedData}
            actions
            previewAction
            exportAction
            title={"Terminated"}
            loading={loading}
            onSuccess={getTerminatedContracts}
            openStaticDialog={(type, data) => {
                if (type === "Export" && data) {
                    return handleExportTerminate(data);
                }
            }}
            dynamicDialog={false}
            rowsPerPage={10}
            rowActions={(row) => ({
                exportAction: true,
            })}
        />
    );
};

export default TerminatedContracts;
