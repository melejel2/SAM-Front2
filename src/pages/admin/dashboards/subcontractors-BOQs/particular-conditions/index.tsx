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
                materialSupply: "",



                recoverAdvance: "",



                procurementConstruction: "",



                managementFees: "",



                prorataAccount: "",



                paymentsTerm: "",



                plansExecution: ""

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
                        materialSupply: contractData.materialSupply || "",



                        recoverAdvance: contractData.recoverAdvance || "",



                        procurementConstruction: contractData.procurementConstruction || "",



                        managementFees: contractData.managementFees || "",



                        prorataAccount: contractData.prorataAccount || "",



                        paymentsTerm: contractData.paymentsTerm || "",



                        plansExecution: contractData.plansExecution || "",



                    });



                }



            }, [contractData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string, value?: any) => {
        if (typeof e === 'string') {
            // Direct value update (e.g., for attachments)
            setFormData((prev) => ({ ...prev, [e]: value }));
        } else {
            // Event from an input or textarea element
            const { name, value } = e.target;
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        if (!contractId) {
            toaster.error("Contract ID is missing.");
            return;
        }
        setSaving(true);
        try {
            const dataToSend = { ...contractData, ...formData, id: contractId };

            // Helper function to convert empty strings, null, or undefined to null, otherwise returns the value as a string
            const convertToNullableString = (value: string | number | null | undefined) => {
                if (value === '' || value === null || value === undefined) {
                    return null;
                }
                return String(value);
            };

            // Helper function to convert empty strings, null, or undefined to 0, otherwise returns the value as a number
            const convertToNumberOrDefault0 = (value: string | number | null | undefined) => {
                if (value === '' || value === null || value === undefined) {
                    return 0;
                }
                return Number(value);
            };

            // Apply conversions to all relevant fields to ensure they are sent as strings or null
            dataToSend.contractDate = convertToNullableString(dataToSend.contractDate);
            dataToSend.completionDate = convertToNullableString(dataToSend.completionDate);
            dataToSend.purchaseIncrease = convertToNullableString(dataToSend.purchaseIncrease);
            dataToSend.latePenalties = convertToNullableString(dataToSend.latePenalties);
            dataToSend.latePenaliteCeiling = convertToNullableString(dataToSend.latePenaliteCeiling);
            dataToSend.holdWarranty = convertToNullableString(dataToSend.holdWarranty);
            dataToSend.mintenancePeriod = convertToNullableString(dataToSend.mintenancePeriod);
            dataToSend.workWarranty = convertToNullableString(dataToSend.workWarranty);
            dataToSend.termination = convertToNullableString(dataToSend.termination);
            dataToSend.daysNumber = convertToNullableString(dataToSend.daysNumber);
            dataToSend.progress = convertToNullableString(dataToSend.progress);
            dataToSend.holdBack = convertToNullableString(dataToSend.holdBack);
            dataToSend.subcontractorAdvancePayee = convertToNullableString(dataToSend.subcontractorAdvancePayee);
            dataToSend.recoverAdvance = convertToNullableString(dataToSend.recoverAdvance);
            dataToSend.procurementConstruction = convertToNullableString(dataToSend.procurementConstruction);
            dataToSend.managementFees = convertToNullableString(dataToSend.managementFees);
            dataToSend.prorataAccount = convertToNullableString(dataToSend.prorataAccount);
            dataToSend.paymentsTerm = convertToNullableString(dataToSend.paymentsTerm);
            dataToSend.plansExecution = convertToNullableString(dataToSend.plansExecution);

            // Special handling for materialSupply
            dataToSend.materialSupply = convertToNumberOrDefault0(dataToSend.materialSupply);


            const response = await apiRequest({
                method: "POST", // As per new requirement, using a specific save endpoint
                endpoint: `ContractsDatasets/SaveActiveContractBoq`,
                body: dataToSend, // Removed 'model' wrapping
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
            <div className="card bg-base-100 border-base-300 border shadow-sm">
                {/* Header with Back and Save buttons */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-base-300">
                    <button
                        onClick={() =>
                            navigate(`/dashboard/contracts/details/${contractIdentifier}`, { state: { contractId } })
                        }
                        className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2">
                        <span className="iconify lucide--arrow-left size-4"></span>
                        Back
                    </button>
                    <h1 className="text-2xl font-bold text-base-content">Particular Conditions</h1>
                    <button
                        onClick={handleSave}
                        className="btn btn-sm btn-primary"
                        disabled={saving}>
                        {saving && <span className="loading loading-spinner loading-xs"></span>}
                        Save Changes
                    </button>
                </div>
                <div className="card-body">

            {/* Financial & Terms Section */}
            <div className="divider my-8">Financial Terms & Conditions</div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Contract Date</span>
                    </label>
                    <input type="date" className="input input-bordered" name="contractDate" value={formData.contractDate || ''} onChange={(e) => handleInputChange(e)} />
                </div>

                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Completion Date</span>
                    </label>
                    <input type="date" className="input input-bordered" name="completionDate" value={formData.completionDate || ''} onChange={(e) => handleInputChange(e)} />
                </div>

                {/* Financial percentages */}
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Advance Payment Eligible (%)</span>
                    </label>
                    <input type="number" className="input input-bordered" name="subcontractorAdvancePayee" value={formData.subcontractorAdvancePayee || ''} onChange={(e) => handleInputChange(e)} placeholder="0" min="0" max="100" step="0.01" />
                </div>

                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Material Supply (%)</span>
                    </label>
                    <input type="number" className="input input-bordered" name="materialSupply" value={formData.materialSupply || ''} onChange={(e) => handleInputChange(e)} placeholder="0" min="0" max="100" step="0.01" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Late Penalty (‰)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="latePenalties" value={formData.latePenalties || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Max Penalty (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="latePenaliteCeiling" value={formData.latePenaliteCeiling || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Retention (%)</span>
                    </label>
                    <input type="number" className="input input-bordered" name="holdWarranty" value={formData.holdWarranty || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Warranty (months)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="workWarranty" value={formData.workWarranty || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Maintenance (months)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="mintenancePeriod" value={formData.mintenancePeriod || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Performance Bond (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="termination" value={formData.termination || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Payment Due (days)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="daysNumber" value={formData.daysNumber || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Max Progress (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="progress" value={formData.progress || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>
            </div>

            {/* Additional Terms */}
            <div className="divider my-8">Additional Terms</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Procurement Construction (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="procurementConstruction" value={formData.procurementConstruction || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Advance Recovery (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="recoverAdvance" value={formData.recoverAdvance || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Prorata (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="prorataAccount" value={formData.prorataAccount || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Management Fees (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="managementFees" value={formData.managementFees || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Plans Execution (%)</span>
                    </label>
                    <input type="text" className="input input-bordered" name="plansExecution" value={formData.plansExecution || ''} onChange={(e) => handleInputChange(e)} placeholder="0" />
                </div>

                <div className="form-control">
                    <label className="label">
                        <span className="label-text">Payment Terms</span>
                    </label>
                    <input type="text" className="input input-bordered" name="paymentsTerm" value={formData.paymentsTerm || ''} onChange={(e) => handleInputChange(e)} placeholder="Enter payment terms" />
                </div>
            </div>



                </div>
            </div>
        </div>
    );
};

export default ParticularConditions;
