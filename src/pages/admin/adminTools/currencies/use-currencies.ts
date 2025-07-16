import { useState } from "react";

import apiRequest from "@/api/api";
import { useAuth } from "@/contexts/auth";
import useToast from "@/hooks/use-toast";

// Types for currency sync
interface ExternalCurrencyRate {
    code: string;
    name: string;
    currentRate: number;
    newRate: number;
    change: number;
    changePercent: number;
}

interface ExchangeRateApiResponse {
    result: string;
    base_code: string;
    conversion_rates: Record<string, number>;
}

const useCurrencies = () => {
    const [tableData, setTableData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [syncLoading, setSyncLoading] = useState<boolean>(false);
    const [showSyncDialog, setShowSyncDialog] = useState<boolean>(false);
    const [syncedRates, setSyncedRates] = useState<ExternalCurrencyRate[]>([]);

    const { getToken } = useAuth();
    const { toaster } = useToast();

    const token = getToken();

    const columns = {
        name: "Name",
        currencies: "Code",
        conversionRate: "Conversion Rate",
    };

    const inputFields = [
        {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
        },
        {
            name: "currencies",
            label: "Code",
            type: "text",
            required: true,
        },
        {
            name: "conversionRate",
            label: "Conversion Rate",
            type: "number",
            required: true,
        },
    ];

    // Sync dialog columns for displaying proposed changes
    const syncColumns = {
        currencies: "Currency Code",
        name: "Name",
        currentRate: "Current Rate",
        newRate: "New Rate",
        change: "Change",
        changePercent: "Change %",
    };

    const getCurrencies = async () => {
        setLoading(true);

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
                setTableData(data);
            } else {
                setTableData([]);
            }
        } catch (error) {
            console.error(error);
            toaster.error("Failed to fetch currencies");
        } finally {
            setLoading(false);
        }
    };

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
    const compareRates = (currentData: any[], externalRates: Record<string, number>): ExternalCurrencyRate[] => {
        const comparisons: ExternalCurrencyRate[] = [];

        currentData.forEach((currency) => {
            const currencyCode = currency.currencies?.toUpperCase();
            
            if (!currencyCode) {
                return;
            }
            
            const externalRate = externalRates[currencyCode];

            if (externalRate && currencyCode !== 'USD') { // USD is base currency
                const currentRate = parseFloat(currency.conversionRate) || 0;
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
                });
            }
        });
        
        return comparisons;
    };

    // Sync currencies with external API
    const syncCurrencies = async () => {
        setSyncLoading(true);
        
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
                    currentData = response;
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
    };

    // Apply approved rate changes
    const applySyncedRates = async (approvedRates: ExternalCurrencyRate[]) => {
        setLoading(true);
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
                            ...currentCurrency,
                            conversionRate: rate.newRate,
                        };

                        const response = await apiRequest({
                            endpoint: "Currencie/UpdateCurrencie",
                            method: "PUT",
                            token: token ?? "",
                            body: updateData,
                        });

                        if (response.isSuccess !== false) {
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
            setLoading(false);
            setShowSyncDialog(false);
            setSyncedRates([]);
        }
    };

    // Cancel sync dialog
    const cancelSync = () => {
        setShowSyncDialog(false);
        setSyncedRates([]);
    };

    return {
        columns,
        tableData,
        inputFields,
        loading,
        getCurrencies,
        // Sync functionality
        syncLoading,
        showSyncDialog,
        syncedRates,
        syncColumns,
        syncCurrencies,
        applySyncedRates,
        cancelSync,
    };
};

export default useCurrencies; 