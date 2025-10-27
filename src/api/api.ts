export const ACTIVE_URL = "https://samback.karamentreprises.com/";
//export const ACTIVE_URL = "https://localhost:7055/";
//export const ACTIVE_URL = "http://localhost:5276/";
export const ACTIVE_API_URL = `${ACTIVE_URL}api/`;

type ApiRequestParams = {
    endpoint: string;
    method: string;
    responseType?: "json" | "blob";
    token?: string;
    body?: BodyInit | Record<string, unknown>;
    headers?: Record<string, string>;
    timeout?: number; // Timeout in milliseconds (default: 2 minutes)
};

const handleUnauthorized = () => {
    localStorage.removeItem("__SAM_ADMIN_AUTH__");
    
    // Validate redirect URL to prevent open redirect attacks
    const loginUrl = "/auth/login";
    const currentPath = window.location.pathname;
    
    // Only redirect if not already on login page to prevent infinite loops
    if (currentPath !== loginUrl && !currentPath.startsWith("/auth/")) {
        // Use a safe redirect method
        window.location.href = loginUrl;
    }
};

const apiRequest = async <T = any>({
    endpoint,
    method,
    responseType = "json",
    token,
    body,
    headers = {},
    timeout = 120000, // Default 2 minutes
}: ApiRequestParams): Promise<T | { isSuccess: false; success: false; message: string; status?: number }> => {
    const normalizedEndpoint = endpoint.replace(/^\//, "");
    const url = `${ACTIVE_API_URL}${normalizedEndpoint}`;

    const headersInit: HeadersInit = {};

    if (token) {
        headersInit.Authorization = `Bearer ${token}`;
    }

    if (body) {
        if (body instanceof FormData) {
            // Let browser set Content-Type
        } else if (body instanceof URLSearchParams) {
            headersInit["Content-Type"] = "application/x-www-form-urlencoded";
        } else if (typeof body === "object") {
            headersInit["Content-Type"] = "application/json";
        }
    }

    const mergedHeaders = { ...headersInit, ...headers };

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestOptions: RequestInit = {
        method,
        headers: mergedHeaders,
        signal: controller.signal,
    };

    if (body) {
        requestOptions.body = body instanceof FormData || body instanceof URLSearchParams ? body : JSON.stringify(body);
    }

    try {
        // DEBUG: Log the HTTP request details - for save contracts and delete operations
        if (url.includes('SaveSubcontractorDataset') || url.includes('DeleteProject')) {
            const debugPrefix = url.includes('DeleteProject') ? "🗑️" : "🎯💾";
            const debugTitle = url.includes('DeleteProject') ? "HTTP DELETE REQUEST" : "HTTP SAVE REQUEST";
            console.log(`${debugPrefix} === ${debugTitle} ===`);
            console.log(`${debugPrefix} URL:`, url);
            console.log(`${debugPrefix} Method:`, method);
            console.log(`${debugPrefix} Headers:`, mergedHeaders);
            if (body) {
                if (body instanceof FormData) {
                    console.log(`${debugPrefix} Body: [FormData]`);
                } else if (body instanceof URLSearchParams) {
                    console.log(`${debugPrefix} Body: [URLSearchParams]`);
                } else {
                    console.log(`${debugPrefix} Body (JSON):`, JSON.stringify(body, null, 2));
                }
            } else {
                console.log(`${debugPrefix} Body: No body`);
            }
        }
        
        const response = await fetch(url, requestOptions);
        
        // DEBUG: Log the HTTP response summary - for save contracts and delete operations
        if (url.includes('SaveSubcontractorDataset') || url.includes('DeleteProject')) {
            const debugPrefix = url.includes('DeleteProject') ? "🗑️" : "🎯💾";
            const debugTitle = url.includes('DeleteProject') ? "HTTP DELETE RESPONSE" : "HTTP SAVE RESPONSE";
            console.log(`${debugPrefix} === ${debugTitle} ===`);
            console.log(`${debugPrefix} Status:`, response.status);
            console.log(`${debugPrefix} Status Text:`, response.statusText);
            console.log(`${debugPrefix} OK:`, response.ok);
            console.log(`${debugPrefix} Headers:`, Object.fromEntries(response.headers.entries()));
        }

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `HTTP error! status: ${response.status}`;
            let errorData: any = null;

            // DEBUG: Log the error response details - focus on save contracts and delete operations
            if (url.includes('SaveSubcontractorDataset') || url.includes('DeleteProject')) {
                const debugPrefix = url.includes('DeleteProject') ? "🗑️" : "🎯💾";
                const debugTitle = url.includes('DeleteProject') ? "DELETE ERROR" : "SAVE CONTRACT ERROR";
                console.error(`${debugPrefix} === ${debugTitle} ===`);
                console.error(`${debugPrefix} Status:`, response.status);
                console.error(`${debugPrefix} Status Text:`, response.statusText);
                console.error(`${debugPrefix} URL:`, url);
                console.error(`${debugPrefix} Error Text:`, errorText);
            }

            try {
                errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
                if (url.includes('SaveSubcontractorDataset') || url.includes('DeleteProject')) {
                    const debugPrefix = url.includes('DeleteProject') ? "🗑️" : "🎯💾";
                    console.error(`${debugPrefix} PARSED ERROR DATA:`, errorData);
                }
            } catch {
                // If JSON parsing fails, use the raw error text if available
                if (errorText && errorText.trim()) {
                    errorMessage = errorText;
                }
                if (url.includes('SaveSubcontractorDataset') || url.includes('DeleteProject')) {
                    const debugPrefix = url.includes('DeleteProject') ? "🗑️" : "🎯💾";
                    console.error(`${debugPrefix} COULD NOT PARSE ERROR RESPONSE AS JSON`);
                }
            }

            // Provide more user-friendly error messages based on status codes
            if (response.status === 400) {
                // Keep the actual error message from backend if available
                if (!errorData?.message) {
                    errorMessage = "Invalid request. Please check your input and try again.";
                }
            } else if (response.status === 401) {
                handleUnauthorized();
                return {
                    isSuccess: false,
                    success: false,
                    message: "Your session has expired. Please log in again.",
                    status: 401,
                };
            } else if (response.status === 403) {
                errorMessage = errorData?.message || "Access denied. You don't have permission to perform this action.";
            } else if (response.status === 404) {
                errorMessage = errorData?.message || "The requested resource was not found.";
            } else if (response.status === 409) {
                errorMessage = errorData?.message || "A conflict occurred. The resource may already exist or be in use.";
            } else if (response.status === 422) {
                errorMessage = errorData?.message || "Invalid data provided. Please check your input.";
            } else if (response.status === 429) {
                errorMessage = "Too many requests. Please wait a moment and try again.";
            } else if (response.status >= 500) {
                errorMessage = "Server error occurred. Please try again later or contact support.";
            } else if (!errorData?.message) {
                // Fallback for any other status codes without specific messages
                errorMessage = `Request failed with status ${response.status}. Please try again.`;
            }

            return {
                isSuccess: false,
                success: false,
                message: errorMessage,
                status: response.status,
            };
        }

        if (responseType === "blob") {
            return (await response.blob()) as T;
        }

        if (response.status === 204) {
            return {} as T;
        }

        // Always try to parse as JSON first, regardless of content-type
        const responseText = await response.text();
        
        if (responseText.trim() === '') {
            // For GET requests, empty response likely means empty array
            return (method === 'GET' ? [] : {}) as T;
        }
        
        try {
            const parsedResponse = JSON.parse(responseText);
            return parsedResponse as T;
        } catch (error) {
            console.error('JSON parsing error:', error, 'Response text:', responseText);
            // Check if it's a content-type issue
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            return {
                isSuccess: false,
                success: false,
                message: 'Invalid JSON response from server'
            } as T;
        }
    } catch (error) {
        console.error("API Request Failed:", error);

        // Handle timeout errors specifically
        if (error instanceof Error && error.name === 'AbortError') {
            return {
                isSuccess: false,
                success: false,
                message: `Request timed out after ${timeout / 1000} seconds. The operation may take longer than expected.`,
            };
        }

        return {
            isSuccess: false,
            success: false,
            message: error instanceof Error ? error.message : "Unknown error occurred",
        };
    } finally {
        // Clear the timeout
        clearTimeout(timeoutId);
    }
};
export default apiRequest;
