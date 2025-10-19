import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import apiRequest from "@/api/api";
import { Loader } from "@/components/Loader";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return ""; // Invalid date string
    }
    return date.toISOString().split('T')[0];
};

const ParticularConditions = () => {
    const { contractIdentifier } = useParams<{ contractIdentifier: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { toaster } = useToast();
    const { getToken } = useAuth();

    const [contractData, setContractData] = useState<any>(null);
    const [loading, setLoading] = useState(true); // Start with loading true
    const [saving, setSaving] = useState(false);

    const contractId = location.state?.contractId || (!isNaN(Number(contractIdentifier)) ? contractIdentifier : null);



            const [formData, setFormData] = useState({



                contractDate: "",



                completionDate: "",



                purchaseIncrease: "",



                latePenalties: "",



                latePenaliteCeiling: "", // Match backend typo



                holdWarranty: "",



                mintenancePeriod: "", // Match backend typo



                workWarranty: "",



                termination: "",



                daysNumber: "",



                progress: "",



                holdBack: "",



                subcontractorAdvancePayee: "",



                recoverAdvance: "",



                procurementConstruction: "",



                managementFees: "",



                prorataAccount: "",



                paymentsTerm: "",



                remark: "",



                remarkCP: "",



                plansExecution: "",



            });



        



            useEffect(() => {



                const loadContractDetails = async () => {



                    if (!contractId) {



                        toaster.error("Contract ID not found.");



                        navigate("/dashboard/contracts");



                        return;



                    }



                    setLoading(true);



                    try {



                        const response = await apiRequest({



                            method: "GET",



                            endpoint: `ContractsDatasets/EditActiveContractBoq/${contractId}`,



                            token: getToken() ?? "",



                        });



        



                        // Handle both wrapped and unwrapped API responses



                        if ((response.success && response.data) || (response && response.id)) {



                            const contractDetails = response.data || response;



                            setContractData(contractDetails);



                        } else {



                            toaster.error(response.message || "Failed to load contract details.");



                            navigate(-1);



                        }



                    } catch (error) {



                        console.error("Error loading contract:", error instanceof Error ? error.message : String(error));



                        toaster.error("An error occurred while loading contract details");



                        navigate(-1);



                    } finally {



                        setLoading(false);



                    }



                };



        



                if (contractId) {



                    loadContractDetails();



                }



                // eslint-disable-next-line react-hooks/exhaustive-deps



            }, [contractId]);



        



            useEffect(() => {



                if (contractData) {



                    setFormData({



                        contractDate: formatDateForInput(contractData.contractDate),



                        completionDate: formatDateForInput(contractData.completionDate),



                        purchaseIncrease: contractData.purchaseIncrease || "",



                        latePenalties: contractData.latePenalties || "",



                        latePenaliteCeiling: contractData.latePenaliteCeiling || "", // Match backend typo



                        holdWarranty: contractData.holdWarranty || "",



                        mintenancePeriod: contractData.mintenancePeriod || "", // Match backend typo



                        workWarranty: contractData.workWarranty || "",



                        termination: contractData.termination || "",



                        daysNumber: contractData.daysNumber || "",



                        progress: contractData.progress || "",



                        holdBack: contractData.holdBack || "",



                        subcontractorAdvancePayee: contractData.subcontractorAdvancePayee || "",



                        recoverAdvance: contractData.recoverAdvance || "",



                        procurementConstruction: contractData.procurementConstruction || "",



                        managementFees: contractData.managementFees || "",



                        prorataAccount: contractData.prorataAccount || "",



                        paymentsTerm: contractData.paymentsTerm || "",



                        remark: contractData.remark || "",



                        remarkCP: contractData.remarkCP || "",



                        plansExecution: contractData.plansExecution || "",



                    });



                }



            }, [contractData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!contractId) {
            toaster.error("Contract ID is missing.");
            return;
        }
        setSaving(true);
        try {
            const response = await apiRequest({
                method: "POST", // As per new requirement, using a specific save endpoint
                endpoint: `ContractsDatasets/SaveActiveContractBoq`,
                body: { ...contractData, ...formData, id: contractId }, // Ensure ID is in the body
                token: getToken() ?? "",
            });

            if (response.success) {
                toaster.success("Particular conditions updated successfully.");
                navigate(`/dashboard/contracts/details/${contractIdentifier}`, {
                    state: { contractId },
                });
            } else {
                toaster.error(response.message || "Failed to update particular conditions.");
            }
        } catch (error) {
            console.error(
                "Error saving particular conditions:",
                error instanceof Error ? error.message : String(error),
            );
            toaster.error("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader />
            </div>
        );
    }

    if (!contractData) {
        return (
            <div className="p-6">
                <p>Contract not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Particular Conditions</h1>
                <button
                    onClick={() =>
                        navigate(`/dashboard/contracts/details/${contractIdentifier}`, { state: { contractId } })
                    }
                    className="btn btn-sm btn-ghost">
                    Back to Details
                </button>
            </div>

            <div className="card bg-base-100 border-base-300 border shadow-sm">
                <div className="card-body">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(formData).map(([key, value]) => {
                            const isDate = key.toLowerCase().includes("date");
                            return (
                                <div className="form-control" key={key}>
                                    <label className="label">
                                        <span className="label-text">
                                            {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                                        </span>
                                    </label>
                                    <input
                                        type={isDate ? "date" : "text"}
                                        name={key}
                                        value={value}
                                        onChange={handleInputChange}
                                        className="input input-bordered"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button onClick={() => navigate(-1)} className="btn btn-ghost">
                    Cancel
                </button>
                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                    {saving && <span className="loading loading-spinner"></span>}
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default ParticularConditions;
