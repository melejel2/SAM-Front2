import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Loader } from "@/components/Loader";
import { Button } from "@/components/daisyui";
import useToast from "@/hooks/use-toast";
import apiRequest from "@/api/api";

const VATConfiguration = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [vatConfig, setVatConfig] = useState<any>(null);
    const [vatValue, setVatValue] = useState<string>("");

    // Fetch current VAT configuration
    const fetchVATConfig = async () => {
        try {
            setLoading(true);
            const auth = JSON.parse(localStorage.getItem("__SAM_ADMIN_AUTH__") || "{}");
            const response = await apiRequest({
                endpoint: 'Configuration/GetConfigurationByKey?key=Tax',
                method: 'GET',
                token: auth.token
            });

            if (response && typeof response === 'object' && 'id' in response) {
                setVatConfig(response as any);
                setVatValue((response as any).value || "0");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to load VAT configuration");
        } finally {
            setLoading(false);
        }
    };

    // Save VAT configuration
    const saveVATConfig = async () => {
        // Validation
        const vatNum = parseFloat(vatValue);
        if (isNaN(vatNum) || vatNum < 0 || vatNum > 100) {
            toast.error("Please enter a valid VAT percentage between 0 and 100");
            return;
        }

        try {
            setSaving(true);
            const auth = JSON.parse(localStorage.getItem("__SAM_ADMIN_AUTH__") || "{}");
            await apiRequest({
                endpoint: 'Configuration/UpdateConfiguration',
                method: 'PUT',
                token: auth.token,
                body: {
                    id: vatConfig.id,
                    key: 'Tax',
                    value: vatValue
                }
            });

            toast.success("VAT configuration updated successfully");
            await fetchVATConfig(); // Reload to confirm
        } catch (error: any) {
            toast.error(error.message || "Failed to save VAT configuration");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        fetchVATConfig();
    }, []);

    const handleBackToAdminTools = () => {
        navigate('/admin-tools');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 pb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToAdminTools}
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            <span className="iconify lucide--arrow-left w-4 h-4" />
                            Back
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg dark:bg-emerald-900/30">
                                <span className="iconify lucide--percent text-emerald-600 dark:text-emerald-400 w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold text-base-content">VAT/Tax Rate Configuration</h1>
                                <p className="text-sm text-base-content/70">Configure the system-wide VAT percentage for contracts</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-2xl">
                    <div className="bg-base-100 rounded-lg border border-base-300 p-6">
                        <div className="space-y-6">
                            {/* Info Alert */}
                            <div className="alert bg-info/10 border border-info/20">
                                <span className="iconify lucide--info text-info w-5 h-5" />
                                <div>
                                    <h3 className="font-semibold text-base-content">System-Wide Setting</h3>
                                    <p className="text-sm text-base-content/70">
                                        This VAT rate will be applied to all contract documents generated in the system.
                                        It will be used in BOQ calculations and contract generation.
                                    </p>
                                </div>
                            </div>

                            {/* VAT Input */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-semibold text-base">VAT/Tax Percentage</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1 max-w-xs">
                                        <input
                                            type="number"
                                            className="input input-bordered w-full pr-12 text-lg"
                                            value={vatValue}
                                            onChange={(e) => setVatValue(e.target.value)}
                                            placeholder="20"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                        />
                                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-base-content/60 font-semibold">
                                            %
                                        </span>
                                    </div>
                                    <div className="text-base-content/70">
                                        <div className="text-sm">Current Value:</div>
                                        <div className="text-2xl font-bold text-base-content">{vatConfig?.value || "0"}%</div>
                                    </div>
                                </div>
                                <label className="label">
                                    <span className="label-text-alt text-base-content/60">
                                        Enter a value between 0 and 100. Use decimal values for precision (e.g., 19.6 for 19.6%)
                                    </span>
                                </label>
                            </div>

                            {/* Examples */}
                            <div className="bg-base-200 rounded-lg p-4">
                                <h3 className="font-semibold text-base-content mb-3">Common VAT Rates</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        className="btn btn-sm bg-base-100 border-base-300 hover:bg-base-300 justify-between"
                                        onClick={() => setVatValue("20")}
                                    >
                                        <span>Standard Rate (FR/CI)</span>
                                        <span className="font-bold">20%</span>
                                    </button>
                                    <button
                                        className="btn btn-sm bg-base-100 border-base-300 hover:bg-base-300 justify-between"
                                        onClick={() => setVatValue("20")}
                                    >
                                        <span>Standard Rate (CM)</span>
                                        <span className="font-bold">19.25%</span>
                                    </button>
                                    <button
                                        className="btn btn-sm bg-base-100 border-base-300 hover:bg-base-300 justify-between"
                                        onClick={() => setVatValue("0")}
                                    >
                                        <span>No VAT</span>
                                        <span className="font-bold">0%</span>
                                    </button>
                                    <button
                                        className="btn btn-sm bg-base-100 border-base-300 hover:bg-base-300 justify-between"
                                        onClick={() => setVatValue("14")}
                                    >
                                        <span>Reduced Rate (MA)</span>
                                        <span className="font-bold">14%</span>
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    onClick={() => setVatValue(vatConfig?.value || "0")}
                                    className="btn btn-ghost"
                                    disabled={saving}
                                >
                                    Reset
                                </Button>
                                <Button
                                    onClick={saveVATConfig}
                                    className="btn btn-primary"
                                    disabled={saving || vatValue === vatConfig?.value}
                                >
                                    {saving && <span className="loading loading-spinner loading-sm" />}
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <div className="flex gap-3">
                            <span className="iconify lucide--alert-triangle text-warning w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-base-content/80">
                                <p className="font-semibold mb-1">Important Note</p>
                                <p>
                                    Changes to the VAT rate will only affect <strong>new contract documents</strong> generated after the change.
                                    Existing contracts will retain their original VAT calculations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VATConfiguration;
