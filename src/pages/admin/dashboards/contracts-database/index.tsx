import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";
import useToast from "@/hooks/use-toast";

import useContractsDatabase from "./use-contracts-database";

const ContractsDatabase = () => {
    const { 
        contractsColumns, 
        vosColumns, 
        terminatedColumns, 
        contractsData, 
        vosData, 
        terminatedData,
        loading,
        getContractsDatasets,
        previewContract
    } = useContractsDatabase();
    
    const { toaster } = useToast();
    const [activeTab, setActiveTab] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        getContractsDatasets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePreviewContract = async (row: any) => {
        const success = await previewContract(row.id);
        if (success) {
            toaster.success("Contract downloaded successfully");
        } else {
            toaster.error("Failed to download contract");
        }
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div>
            {/* Header with Back Button */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBackToDashboard}
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                    >
                        <span className="iconify lucide--arrow-left size-4"></span>
                        <span>Back</span>
                    </button>
                </div>
            </div>

            <div>
                <div role="tablist" className="tabs tabs-boxed mb-4">
                    <button
                        role="tab"
                        className={`tab ${activeTab === 0 ? "tab-active" : ""}`}
                        onClick={() => setActiveTab(0)}
                    >
                        Contracts
                    </button>
                    <button
                        role="tab"
                        className={`tab ${activeTab === 1 ? "tab-active" : ""}`}
                        onClick={() => setActiveTab(1)}
                    >
                        VOs
                    </button>
                    <button
                        role="tab"
                        className={`tab ${activeTab === 2 ? "tab-active" : ""}`}
                        onClick={() => setActiveTab(2)}
                    >
                        Terminated
                    </button>
                </div>

                {activeTab === 0 && (
                    <div className="tab-content">
                        {loading ? (
                            <Loader />
                        ) : (
                            <SAMTable
                                columns={contractsColumns}
                                tableData={contractsData}
                                actions
                                previewAction
                                title={"Contract"}
                                loading={false}
                                onSuccess={getContractsDatasets}
                                openStaticDialog={(type, data) => {
                                    if (type === "Preview" && data) {
                                        handlePreviewContract(data);
                                    }
                                }}
                            />
                        )}
                    </div>
                )}

                {activeTab === 1 && (
                    <div className="tab-content">
                        <SAMTable
                            columns={vosColumns}
                            tableData={vosData}
                            actions
                            previewAction
                            title={"VO"}
                            loading={false}
                            onSuccess={() => {}}
                        />
                    </div>
                )}

                {activeTab === 2 && (
                    <div className="tab-content">
                        <SAMTable
                            columns={terminatedColumns}
                            tableData={terminatedData}
                            actions
                            previewAction
                            title={"Terminated"}
                            loading={false}
                            onSuccess={() => {}}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContractsDatabase;
