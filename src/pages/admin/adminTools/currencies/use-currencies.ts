import { useState, useCallback } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

// =============================================================================
// INTERFACES
// =============================================================================

export interface Currency {
    id: number;
    name: string;
    currencies: string; // Code (e.g., USD, EUR)
    rate: number; // Conversion rate
}

// Types for currency sync
export interface ExternalCurrencyRate {
    code: string;
    name: string;
    currentRate: number;
    newRate: number;
    change: number;
    changePercent: number;
    selected?: boolean;
}

interface ExchangeRateApiResponse {
    result: string;
    base_code: string;
    conversion_rates: Record<string, number>;
}

// =============================================================================
// HOOK
// =============================================================================

const useCurrencies = () => {
    const [tableData, setTableData] = useState<Currency[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [syncLoading, setSyncLoading] = useState<boolean>(false);
    const [showSyncDialog, setShowSyncDialog] = useState<boolean>(false);
    const [syncedRates, setSyncedRates] = useState<ExternalCurrencyRate[]>([]);

    const { getToken } = useAuth();
    const { toaster } = useToast();

    // =============================================================================
    // CRUD OPERATIONS
    // =============================================================================

    const getCurrencies = useCallback(async () => {
        setLoading(true);
        const token = getToken();

        try {
            const data = await apiRequest({
                endpoint: "Currencie/GetCurrencies",
                method: "GET",
                token: token ?? "",
            });

            // Check if response is an error object or a successful array
            if (data && data.isSuccess === false) {
                setTableData([]);
                toaster.error(`Failed to fetch currencies: ${data.message}`);
            } else if (Array.isArray(data)) {
                // Map backend fields to our interface
                const mappedData: Currency[] = data.map((item: any) => ({
                    id: item.id,
                    name: item.name || "",
                    currencies: item.currencies || "", // Code field
                    rate: item.conversionRate || item.rate || 0,
                }));
                setTableData(mappedData);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to fetch currencies");
        } finally {
            setLoading(false);
        }
    }, [getToken, toaster]);

    const createCurrency = useCallback(async (currency: Omit<Currency, 'id'>) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "Currencie/AddCurrencie",
                method: "POST",
                token: token ?? "",
                body: {
                    name: currency.name,
                    currencies: currency.currencies,
                    conversionRate: currency.rate,
                },
            });

            if (response && response.isSuccess !== false) {
                toaster.success("Currency created successfully");
                await getCurrencies();
                return { success: true };
            }
            toaster.error("Failed to create currency");
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to create currency");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getCurrencies]);

    const updateCurrency = useCallback(async (currency: Currency) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: "Currencie/UpdateCurrencie",
                method: "PUT",
                token: token ?? "",
                body: {
                    id: currency.id,
                    name: currency.name,
                    currencies: currency.currencies,
                    conversionRate: currency.rate,
                },
            });

            if (response && response.isSuccess !== false) {
                toaster.success("Currency updated successfully");
                await getCurrencies();
                return { success: true };
            }
            toaster.error("Failed to update currency");
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to update currency");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getCurrencies]);

    const deleteCurrency = useCallback(async (id: number) => {
        setSaving(true);
        const token = getToken();

        try {
            const response = await apiRequest({
                endpoint: `Currencie/DeleteCurrencie?id=${id}`,
                method: "DELETE",
                token: token ?? "",
            });

            if (response && response.isSuccess !== false) {
                toaster.success("Currency deleted successfully");
                await getCurrencies();
                return { success: true };
            }
            toaster.error("Failed to delete currency");
            return { success: false };
        } catch (error) {
            console.error(error);
            toaster.error("Failed to delete currency");
            return { success: false };
        } finally {
            setSaving(false);
        }
    }, [getToken, toaster, getCurrencies]);

    // =============================================================================
    // SYNC FUNCTIONALITY
    // =============================================================================

    // Fetch exchange rates from external API
    const fetchExternalRates = async (): Promise<Record<string, number> | null> => {
        // List of API endpoints to try (fallback mechanism)
        const apiEndpoints = [
            {
                url: 'https://api.exchangerate-api.com/v4/latest/USD',
                name: 'ExchangeRate-API v4'
            },
            {
                url: 'https://api.fxratesapi.com/latest?base=USD',
                name: 'FXRates API'
            },
            {
                url: 'https://api.exchangerate.host/latest?base=USD',
                name: 'ExchangeRate.host'
            }
        ];

        for (const [index, endpoint] of apiEndpoints.entries()) {
            try {
                const response = await fetch(endpoint.url);

                if (!response.ok) {
                    if (index === apiEndpoints.length - 1) {
                        throw new Error(`All APIs failed. Last error: ${response.status} ${response.statusText}`);
                    }
                    continue; // Try next API
                }

                const data: any = await response.json();

                if (data.result === 'error' || data.error) {
                    throw new Error('External API returned error');
                }

                // Try different rate properties based on common API formats
                let conversionRates = null;

                if (data.conversion_rates && typeof data.conversion_rates === 'object') {
                    conversionRates = data.conversion_rates;
                } else if (data.rates && typeof data.rates === 'object') {
                    conversionRates = data.rates;
                } else if (data.data && typeof data.data === 'object') {
                    conversionRates = data.data;
                } else {
                    throw new Error('Could not find exchange rates in API response');
                }

                return conversionRates;

            } catch (error) {
                if (index === apiEndpoints.length - 1) {
                    // Last API failed, return null
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    toaster.error(`Failed to fetch exchange rates: ${errorMessage}`);
                    return null;
                }
                // Continue to next API
                continue;
            }
        }

        // If we get here, all APIs failed
        toaster.error('All exchange rate APIs failed');
        return null;
    };

    // Compare current rates with external rates
    const compareRates = (currentData: Currency[], externalRates: Record<string, number>): ExternalCurrencyRate[] => {
        const comparisons: ExternalCurrencyRate[] = [];

        currentData.forEach((currency) => {
            const currencyCode = currency.currencies?.toUpperCase();

            if (!currencyCode) {
                return;
            }

            const externalRate = externalRates[currencyCode];

            if (externalRate && currencyCode !== 'USD') { // USD is base currency
                const currentRate = currency.rate || 0;
                const newRate = externalRate;
                const change = newRate - currentRate;
                const changePercent = currentRate > 0 ? ((change / currentRate) * 100) : 0;

                comparisons.push({
                    code: currencyCode,
                    name: currency.name,
                    currentRate: currentRate,
                    newRate: newRate,
                    change: change,
                    changePercent: changePercent,
                    selected: true,
                });
            }
        });

        return comparisons;
    };

    // Sync currencies with external API
    const syncCurrencies = useCallback(async () => {
        setSyncLoading(true);
        const token = getToken();

        try {
            // Fetch current currencies (use existing tableData if available)
            let currentData = tableData;
            if (!currentData || currentData.length === 0) {
                const response = await apiRequest({
                    endpoint: "Currencie/GetCurrencies",
                    method: "GET",
                    token: token ?? "",
                });

                // Handle the response properly
                if (response && response.isSuccess === false) {
                    toaster.error(`Failed to fetch currencies: ${response.message}`);
                    return;
                } else if (Array.isArray(response)) {
                    currentData = response.map((item: any) => ({
                        id: item.id,
                        name: item.name || "",
                        currencies: item.currencies || "",
                        rate: item.conversionRate || item.rate || 0,
                    }));
                } else {
                    currentData = [];
                }
            }

            if (!currentData || currentData.length === 0) {
                toaster.error('No currencies found to sync');
                return;
            }

            // Fetch external rates
            const externalRates = await fetchExternalRates();
            if (!externalRates) {
                return; // Error already handled in fetchExternalRates
            }

            // Compare rates
            const comparisons = compareRates(currentData, externalRates);

            if (comparisons.length === 0) {
                toaster.info('No currency rates found to update');
                return;
            }

            // Show sync dialog with comparisons
            setSyncedRates(comparisons);
            setShowSyncDialog(true);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toaster.error(`Failed to sync currencies: ${errorMessage}`);
        } finally {
            setSyncLoading(false);
        }
    }, [getToken, toaster, tableData]);

    // Apply approved rate changes
    const applySyncedRates = useCallback(async (approvedRates: ExternalCurrencyRate[]) => {
        setSaving(true);
        const token = getToken();
        let successCount = 0;
        let errorCount = 0;

        try {
            // Find the corresponding currency IDs from current data
            for (const rate of approvedRates) {
                const currentCurrency = tableData.find(
                    curr => curr.currencies?.toUpperCase() === rate.code
                );

                if (currentCurrency) {
                    try {
                        const updateData = {
                            id: currentCurrency.id,
                            name: currentCurrency.name,
                            currencies: currentCurrency.currencies,
                            conversionRate: rate.newRate,
                        };

                        const response = await apiRequest({
                            endpoint: "Currencie/UpdateCurrencie",
                            method: "PUT",
                            token: token ?? "",
                            body: updateData,
                        });

                        if (response && response.isSuccess !== false) {
                            successCount++;
                        } else {
                            errorCount++;
                        }
                    } catch (error) {
                        errorCount++;
                    }
                } else {
                    errorCount++;
                }
            }

            // Show results
            if (successCount > 0) {
                toaster.success(`Successfully updated ${successCount} currency rate(s)`);
                await getCurrencies(); // Refresh the table
            }

            if (errorCount > 0) {
                toaster.error(`Failed to update ${errorCount} currency rate(s)`);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toaster.error(`Failed to apply currency updates: ${errorMessage}`);
        } finally {
            setSaving(false);
            setShowSyncDialog(false);
            setSyncedRates([]);
        }
    }, [getToken, toaster, tableData, getCurrencies]);

    // Cancel sync dialog
    const cancelSync = useCallback(() => {
        setShowSyncDialog(false);
        setSyncedRates([]);
    }, []);

    return {
        // Data
        tableData,
        // States
        loading,
        saving,
        syncLoading,
        showSyncDialog,
        syncedRates,
        // CRUD functions
        getCurrencies,
        createCurrency,
        updateCurrency,
        deleteCurrency,
        // Sync functions
        syncCurrencies,
        applySyncedRates,
        cancelSync,
    };
};

export default useCurrencies;
