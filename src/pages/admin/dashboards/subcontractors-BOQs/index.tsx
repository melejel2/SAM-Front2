import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";

import useSubcontractorsBOQs from "./use-subcontractors-boqs";




const SubcontractorsBOQs = () => {
    const navigate = useNavigate();
    const location = useLocation();

    

    const { 
        columns, 
        tableData, 
        inputFields, 
        loading, 
        getContractsDatasets
    } = useSubcontractorsBOQs();

    useEffect(() => {
        getContractsDatasets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const handleViewContractDetails = (row: any) => {
        // Navigate to contract details page using contract number (user-friendly) instead of ID
        const contractNumber = row.contractNumber || row.id; // Fallback to ID if no contract number
        navigate(`/dashboard/subcontractors-boqs/details/${contractNumber}`, {
            state: {
                contractId: row.id, // Keep actual ID for API calls
                contractNumber: row.contractNumber,
                projectName: row.projectName,
                subcontractorName: row.subcontractorName,
                tradeName: row.tradeName,
                amount: row.amount,
                contractDate: row.contractDate,
                completionDate: row.completionDate,
                status: row.status
            }
        });
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
                
                <div className="flex items-center gap-3">
                    <button
                        className="btn btn-sm btn-primary text-white flex items-center gap-2"
                        onClick={() => navigate('/dashboard/subcontractors-boqs/new')}
                    >
                        <span className="iconify lucide--plus size-4"></span>
                        <span>New Subcontract</span>
                    </button>
                </div>
            </div>

            <div>
                {loading ? (
                    <Loader />
                ) : (
                    <SAMTable
                        columns={columns}
                        tableData={tableData}
                        actions
                        previewAction
                        title={"Subcontractor BOQ"}
                        loading={false}
                        onSuccess={getContractsDatasets}
                        openStaticDialog={(type, data) => {
                            if (type === "Preview" && data) {
                                return handleViewContractDetails(data);
                            }
                        }}
                        dynamicDialog={false}
                    />
                )}
            </div>



        </div>
    );
};

export default SubcontractorsBOQs;
